import{_supabase as ht}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{r as sa}from"./role-actions-ClNxOfgz.js";import{l as ra,d as De,i as la}from"./common-D1rIR0Tm.js";import{g as Ut,U as da,a9 as ca,W as pa}from"./political-actions-CoM-LDWz.js";import{d as V,f as ye,h as mt,o as Lt,c as be,s as ma,M as fa}from"./government-structure-C17uG6rl.js";import{GAME_CONFIG as vt,FORMATION_DEADLINE_TICKS as se}from"./config-CHsHqv7d.js";import{f as va}from"./no-confidence-DFJc0-tL.js";import{i as ua,g as ga,j as je}from"./elections-tsb07Ehj.js";import{a as Bt}from"./stats-4gK98flh.js";import{t as ya}from"./utils-DGqmZD5X.js";import"./preload-helper-BXl3LOEh.js";import"./corp-topbar-B9cSZncf.js";import"./bills-D8tS2GN0.js";import"./corp-valuation-DRgj4yjT.js";import"./presidential-FLp43xih.js";const $t=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],$e={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},he=new Set(["unrest","crime","corruption","cost_of_living","debt"]),ba=new Set(["income_tax","corporate_tax"]);function ke(e,t){const a=he.has(e),i=ba.has(e);return t==="improve"?a?{arrow:"↓",color:"#5cc55c"}:i?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:i?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function Ee(e){switch(e){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${e} rivals) — minimal momentum`}}}function ha(e,t){return e.map(a=>{const i=$t.find(n=>n.id===a.platform_key);if(!i)return{...a,stats:[]};const s=i.improve.map(n=>{const o=a.baseline_stats?.[n],r=a.target_stats?.[n],p=Number(t?.[n]??50),d=he.has(n);if(o==null||r==null)return{stat:n,baseline:p,target:p,current:p,progress:0,met:!1};const m=Math.abs(r-o),l=d?Math.max(0,o-p):Math.max(0,p-o),c=m>0?Math.min(1,l/m):1,f=d?p<=r:p>=r;return{stat:n,baseline:o,target:r,current:p,progress:c,met:f}});return{...a,stats:s,platformDef:i}})}const xa=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function bt(e){return e>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:e>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:e>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:e>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function _a(e){var t=Math.max(0,e-20)/65,a=12e4+t*28e4;return Math.round(a/25e3)*25e3}function Kt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Ce(e){return e[Math.floor(Math.random()*e.length)]}function wa(e,t){var a=[],i=new Set,s=Kt(5,7),n=Ut(t),o=n.firstNames||[],r=n.lastNames||[];if(o.length===0||r.length===0)return[];for(var p=xa.slice().sort(function(){return Math.random()-.5}),d=0;d<s;d++){var m,l,c,f=0;do m=Ce(o),l=Ce(r),c=m+" "+l,f++;while(i.has(c)&&f<20);i.add(c);var y=Kt(20,85),v=Kt(25,60),x=p[d%p.length],b=_a(y);a.push({nation_id:e,first_name:m,last_name:l,age:v,skill:y,background:x,hire_cost:b,status:"available"})}return a.sort(function(h,u){return u.skill-h.skill}),a}async function Ge(e,t,a){var{data:i}=await e.from("nations").select("government_type").eq("id",t).maybeSingle();if(V(i)){var{data:s}=await e.from("factions").select("seats").eq("id",a).maybeSingle();return re({partyId:a,partySeats:s?.seats,admin:null,ministryHolder:!1,nation:i})}var[n,o,r,p]=await Promise.all([ye(e,t).catch(function(h){return console.warn("[Agitator] fetchActiveCoalition failed:",h?.message||h),null}),e.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("head_of_government").select("faction_id").eq("nation_id",t).eq("active",!0).maybeSingle(),e.from("presidents").select("faction_id").eq("nation_id",t).eq("is_active",!0).maybeSingle()]);if(o.error)return console.error("[Agitator] Failed to check governing status:",o.error.message),{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var d=o.data,m=n,l=mt(i),c=r?.data?.faction_id||null,f=p?.data?.faction_id||null,y=Array.isArray(m?.party_ids)?m.party_ids.map(function(h){return{party_id:h}}):[];if(d){d.pm_party_id=c,d.president_party_id=f;var v=Array.isArray(d.coalition_parties)?d.coalition_parties:[];v.length===0&&y.length>0&&(d.coalition_parties=y)}else(m||c||f)&&(d={pm_party_id:c,president_party_id:f,coalition_parties:y});var x=!1;if(l){var{count:b}=await e.from("ministries").select("*",{count:"exact",head:!0}).eq("nation_id",t).eq("party_id",a).eq("is_active",!0);x=(b||0)>0}return re({partyId:a,partySeats:null,admin:d,ministryHolder:x,nation:i})}function $a(e,t,a,i){return re({partyId:e?.id,partySeats:e?.seats,admin:t,ministryHolder:a?a.has(e?.id):!1,nation:i})}function re({partyId:e,partySeats:t,admin:a,ministryHolder:i,nation:s}){if(V(s)){var n=Number(t||0)>=1;return{isGoverning:n,isOpposition:!n,label:n?"LOYAL":"DISSIDENT",administration:null}}if(!a)return{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var o=Array.isArray(a.coalition_parties)?a.coalition_parties:[],r=o.some(function(l){return l?typeof l=="string"?l===e:typeof l=="object"?(l.party_id||l.id)===e:!1:!1}),p=a.pm_party_id===e,d=a.president_party_id===e,m=p||r||d||mt(s)&&!!i;return{isGoverning:m,isOpposition:!m,label:m?"GOVERNING":"OPPOSITION",administration:a}}async function qe(e,t){var{data:a,error:i}=await e.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return i?(console.error("[Agitator] Failed to fetch agitator:",i.message),null):a}async function ka(e,t,a){var{data:i,error:s}=await e.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(i&&i.length>0)return i;var n=wa(t,a),{data:o,error:r}=await e.from("agitator_pool").insert(n).select("*");return r?(console.error("[Agitator] Failed to insert pool:",r.message),[]):(o||[]).sort(function(p,d){return d.skill-p.skill})}async function Ea(e,t,a,i){var s=await qe(e,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:n,error:o}=await e.from("faction_agitators").insert({faction_id:t,first_name:a.first_name,last_name:a.last_name,age:a.age,skill:a.skill,background:a.background,status:"active",hired_at_tick:i}).select("*").single();if(o)return console.error("[Agitator] Failed to hire:",o.message),{success:!1,agitator:null,error:o.message};var{error:r}=await e.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",a.id);return r&&console.error("[Agitator] Failed to mark pool candidate as hired:",r.message),{success:!0,agitator:n,error:null}}const Dt=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],He=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function xe(e){return e<=5?{tier:1,label:"Clean Government",color:"#c55"}:e<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:e<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const ct={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5},gov:{momentum:3}},2:{resolution:"PARTIAL WIN",filer:{momentum:3},gov:{momentum:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7},gov:{momentum:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12},gov:{momentum:-10}}},Ie={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function It(e,t){var a=e;for(var i in t)a=a.split("{"+i+"}").join(t[i]);return a}async function Ca(e,t){var{factionId:a,nationId:i,agitatorId:s,targetMinistry:n,basis:o,currentTick:r,partyName:p,administration:d}=t,m,l,c;if(o==="civil_rights"){var f=Number(d?.stats_at_start?.freedom_index??50);l=50,m=f,c=Math.max(0,m-l)}else{var y=Number(d?.stats_at_start?.corruption??50);l=50,m=y,c=Math.max(0,l-m)}var y=m,v=l,x=xe(c),b=ct[x.tier],h=r+8,u=Dt.find(function(P){return P.key===n}),_=u?"Ministry of "+u.label:n,S=He.find(function(P){return P.key===o}),L=S?S.label:o,{data:M,error:I}=await e.from("lawsuits").insert({faction_id:a,nation_id:i,agitator_id:s,target_ministry:n,basis:o,filed_at_tick:r,resolves_at_tick:h,corruption_at_start:y,corruption_at_filing:v,corruption_growth:c,tier:x.tier,status:"active",resolution:null,momentum_effect:b.filer.momentum,gov_momentum_effect:b.gov.momentum}).select("*").single();if(I)return{success:!1,lawsuit:null,tier:0,error:I.message};var k=Ie[x.tier]||Ie[1],A={party:p||"Opposition",ministry:_,basis:L},z=[{event_tick:r,event_type:"filing",headline:It(k.filing,A)},{event_tick:r+2,event_type:"discovery",headline:It(k.discovery,A)},{event_tick:r+5,event_type:"evidence",headline:It(k.evidence,A)},{event_tick:r+7,event_type:"pre_trial",headline:It(k.pre_trial,A)},{event_tick:h,event_type:"resolution",headline:It(k.resolution,A)}],T=z.map(function(P){return{lawsuit_id:M.id,nation_id:i,event_tick:P.event_tick,event_type:P.event_type,headline:P.headline,is_fired:P.event_tick===r}}),{error:E}=await e.from("lawsuit_events").insert(T);E&&console.error("[Lawsuits] Failed to insert milestone events:",E.message);var{error:C}=await e.from("event_log").insert({nation_id:i,event_name:"LAWSUIT FILED",event_type:"lawsuit",category:"political",description_chosen:z[0].headline,fired_at_tick:r,faction_id:a||null,effects_applied:{lawsuit_id:M.id,tier:x.tier,target_ministry:_,basis:L,milestone:"filing"}});return C&&console.warn("[Lawsuits] event_log insert (filing) failed:",C.message),{success:!0,lawsuit:M,tier:x.tier,error:null}}async function Ia(e,t){var{data:a,error:i}=await e.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return i?(console.error("[Lawsuits] Failed to fetch lawsuits:",i.message),[]):a||[]}let $=null,g=null,at="leader",rt=[],jt=[],H=null,D=null,gt=!1,F=null,le=[],_t=!1,j=null,lt=!1,St=[],Nt=!1,Wt=!1,Ft=new Set;function w(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function it(e,t){return((e||"?")[0]+(t||"?")[0]).toUpperCase()}const Ue=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Jt=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let yt=0,Gt=0,de=!1;async function Ma(){if(!$||!g?.faction?.id||!g?.shard?.current_tick)return;const{count:e,error:t}=await $.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",g.faction.id).eq("action_type","fundraise").eq("tick_performed",g.shard.current_tick);yt=!t&&e!=null?e:0}async function Sa(){if(Gt=0,de=!1,!$||!g?.nation?.id||!g?.shard?.current_tick)return;const e=g.shard.current_tick,t=F?.pm_party_id;try{const{data:a}=await $.from("bills").select("id").eq("nation_id",g.nation.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(de=!!(a&&a.length),t){const{data:i}=await $.from("campaign_actions").select("tick_performed").eq("nation_id",g.nation.id).eq("action_type","no_confidence_filed").eq("target_id",t).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(i){const s=e-Number(i.tick_performed||0),n=typeof vt<"u"&&vt.NO_CONFIDENCE_COOLDOWN_TICKS||12;Gt=Math.max(0,n-s)}}}catch(a){console.warn("[PartyActions] loadNoConfidenceState failed:",a?.message||a)}}function Ye(e,t){const a=Jt[Math.min(t,Jt.length-1)],i=e*a.perSeat,s=Math.max(1,Math.floor(e/a.momDivisor));return{raised:i,momCost:s,perSeat:a.perSeat,tierIdx:Math.min(t,Jt.length-1)}}const Ve=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1},{id:"call_snap_election",name:"Call Snap Election",desc:"Schedule a snap parliamentary election for next tick. PM-only when a Prime Minister is seated; any party leader can call when the seat is vacant (deadlock breaker). Cancels any existing scheduled parliamentary election. 3-tick per-party cooldown.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE"],locked:!1},{id:"call_early_elections",name:"Call Early Elections",desc:"Dissolve the legislature and call snap elections. PM-only. Government enters caretaker status; election fires after a short formation window. Momentum impact is tiered by Gov. Approval: >50 boosts PM party (+3), <35 boosts opposition (+5 each) and +3 stability, 35–50 is neutral.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","PM ONLY"],locked:!1},{id:"resign_as_pm",name:"Resign as Prime Minister",desc:"Step down from the Prime Minister seat. PM-only. Coalition enters caretaker status and has a 3-tick window to nominate a successor via the cabinet panel. If a new PM is installed the administration continues under new leadership; otherwise a snap election fires. Cost: −3 Momentum, −0.05 Credibility, −3 Stability, 12-tick bar from PM on your party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["GOVERNMENT","PM ONLY"],locked:!1},{id:"no_confidence",name:"Vote of No Confidence",desc:"File a motion of no confidence against the Prime Minister. If a simple majority votes YES, the government falls and snap elections are triggered. PASS: +15 Momentum to you, -10 Momentum to the PM’s party. FAIL: -10 Momentum to you. 12-tick cooldown on the targeted PM party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1},{id:"leave_coalition",name:"Leave Coalition",desc:"Walk out of the current governing coalition. Any ministries your party holds are vacated. You drop from governing to opposition. Coalition flips to minority if your exit drops it below the majority threshold. Cost: −3 Momentum to you, −5 Momentum to the PM’s party. 12-tick cooldown. PM’s party cannot use this — resign first.",cost:"−3 MOM",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","RISKY"],locked:!1},{id:"disband_party",name:"Disband Party",desc:"Voluntarily dissolve your party. Your seats are vacated and sit empty until the next election (no backfill or redistribution). All party funds and momentum are lost. You are removed from every nation chat. Cannot be undone. 24-tick cooldown per user. Cannot be used while Prime Minister, sitting President, or reigning Monarch — step down first.",cost:"IRREVERSIBLE",costColor:"#c55",moneyCost:0,tags:["IRREVERSIBLE"],locked:!1}],La=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Yt={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},Me=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],Se=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function Ke(e,t){$=e,g=t;const a=document.getElementById("pa-actions-root");if(!a)return;const i=t.faction;if(!i){a.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}try{const{data:l}=await $.from("factions").select("momentum, party_funds, seats, action_points, bloc_id").eq("id",i.id).single();l&&(i.momentum=l.momentum??i.momentum,i.party_funds=l.party_funds??i.party_funds,i.seats=l.seats??i.seats,i.action_points=l.action_points??i.action_points,i.bloc_id=l.bloc_id??null)}catch(l){console.warn("[PartyActions] faction refresh failed, using cached state:",l)}const[s,n,o,r,p,d]=await Promise.all([$.from("faction_platforms").select("*").eq("faction_id",i.id).order("slot"),$.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),qe($,i.id),Ge($,t.nation?.id,i.id),$.from("faction_electoral_standing").select("visibility, raw_appeal").eq("faction_id",i.id).eq("nation_id",t.nation?.id).maybeSingle(),ye($,t.nation?.id)]);t.nation&&(t.nation.__coalition_status=d?.status||null),s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),n.error&&console.error("[PartyActions] Failed to load nation platforms:",n.error.message),rt=s.data||[],jt=n.data||[],H=o,gt=r.isOpposition,F=r.administration,p.data,await Ma(),await Sa();const{data:m}=await $.from("faction_deputies").select("*").eq("faction_id",i.id).eq("status","active").maybeSingle();D=m||null,H&&(le=await Ia($,i.id)),await At(i.id,t.nation?.id),U(a)}function We(e){return e?{isPM:!!F&&F.pm_party_id===e.id,isPresident:g?.nation?.hos_election_method==="elected"&&F?.president_party_id===e.id,isMonarchActing:V(g?.nation)&&g?.nation?.monarch_faction_id===e.id}:{isPM:!1,isPresident:!1,isMonarchActing:!1}}async function At(e,t){if(!e||!t){j=null,lt=!1,St=[];return}try{const{data:a,error:i}=await $.from("bloc_invitations").select("id, bloc_id, invited_by_faction_id, created_at_tick, status, bloc:bloc_id(id,name,leader_faction_id), inviter:invited_by_faction_id(id,faction_name,party_color)").eq("invited_faction_id",e).eq("status","pending").order("created_at_tick",{ascending:!1});if(i)throw i;St=a||[];const s=g?.faction?.bloc_id||null;if(s){const{data:n,error:o}=await $.from("blocs").select("*").eq("id",s).is("dissolved_at_tick",null).maybeSingle();if(o)throw o;if(n){const{data:r}=await $.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name").eq("bloc_id",n.id).order("seats",{ascending:!1});j={...n,members:r||[]},lt=n.leader_faction_id===e}else j=null,lt=!1}else j=null,lt=!1}catch(a){console.warn("[PartyActions] loadBlocState failed:",a?.message||a)}}function Je(e){if(!j)return"";const t=lt?`<span style="margin-left:6px;font-family:var(--font-mono);font-size:7px;color:${e};letter-spacing:0.08em;">LEADER</span>`:"";return`<span class="pa-bloc-tag" style="display:inline-flex;align-items:center;padding:2px 8px;background:${e}18;border:1px solid ${e}55;color:${e};font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        BLOC &middot; ${w(j.name)}${t}
    </span>`}function Xe(e){if(!j)return"";const t=j.members||[],a=t.reduce((s,n)=>s+(Number(n.seats)||0),0),i=t.map(s=>{const n=s.id===j.leader_faction_id,o=s.party_color||e;return`<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid ${o}44;border-left:3px solid ${o};background:var(--bg-card);font-family:var(--font-mono);font-size:9px;">
            <span style="color:var(--text-bright);font-weight:700;">${w(s.faction_name||"Unknown")}</span>
            <span style="color:var(--text-dim);">${s.seats||0} seats</span>
            ${n?`<span style="color:${o};font-weight:700;letter-spacing:0.08em;">LEADER</span>`:""}
        </span>`}).join("");return`<div style="margin:8px 0;padding:8px 12px;background:${e}0a;border:1px solid ${e}33;border-left:3px solid ${e};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${e};letter-spacing:0.08em;">BLOC &middot; ${w(j.name)}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${t.length} member${t.length!==1?"s":""} &middot; ${a} combined seats</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${i}</div>
    </div>`}function Qe(e){if(!St||St.length===0)return"";const t=i=>(Array.isArray(i)?i[0]:i)||null;return`<div style="margin:10px 0 4px;">${St.map(i=>{const s=t(i.bloc),n=t(i.inviter),o=s?.name||"a bloc",r=n?.faction_name||"A party leader",p=n?.party_color||e,d=Ft.has(i.id);return`<div style="margin:6px 0;padding:8px 12px;border:1px solid ${p}55;border-left:3px solid ${p};background:${p}08;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="flex:1;">
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${p};letter-spacing:0.08em;">BLOC INVITATION</div>
                <div style="font-size:11px;color:var(--text-bright);margin-top:2px;">
                    <strong>${w(r)}</strong> invites you to join <strong>${w(o)}</strong>.
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--submit" data-invite-id="${w(i.id)}" data-decision="accept"${d?" disabled":""}>Accept</button>
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--cancel" data-invite-id="${w(i.id)}" data-decision="decline"${d?" disabled":""}>Decline</button>
            </div>
        </div>`}).join("")}</div>`}async function _e(e){const{data:t}=await $.from("factions").select("bloc_id, momentum").eq("id",e).single();t&&(g.faction.bloc_id=t.bloc_id||null,t.momentum!=null&&(g.faction.momentum=t.momentum))}async function Pa(e,t,a){try{const i=g?.faction?.id;if(!i)throw new Error("No active faction");const s=t==="accept"?"accept_bloc_invite":"decline_bloc_invite",n=t==="accept"?"p_accepting_faction_id":"p_declining_faction_id",{data:o,error:r}=await $.rpc(s,{p_invitation_id:e,[n]:i});if(r)throw r;if(o&&o.success===!1)throw new Error(o.error||"Unknown error");await _e(i),await At(i,g.nation?.id),U(a)}catch(i){console.error("[PartyActions] respondToBlocInvite failed:",i),alert(t==="accept"?`Could not accept invitation: ${i.message||i}`:`Could not decline invitation: ${i.message||i}`)}}async function Aa(e){if(!j||Wt)return;const t=j,a=lt?`Leaving ${t.name} will DISSOLVE the entire bloc. All ${t.members?.length||0} members will be removed and pending invitations rescinded.

Proceed?`:`Leave the ${t.name} bloc?`;if(confirm(a)){Wt=!0;try{const{data:i,error:s}=await $.rpc("leave_bloc",{p_faction_id:g.faction.id});if(s)throw s;if(i&&i.success===!1)throw new Error(i.error||"Unknown error");await _e(g.faction.id),await At(g.faction.id,g.nation?.id),U(e)}catch(i){console.error("[PartyActions] leave_bloc failed:",i),alert(`Could not leave bloc: ${i.message||i}`)}finally{Wt=!1}}}async function Ta(e){const t=document.getElementById("pa-bloc-modal");if(!t||j)return;const a=g.faction,i=a?.color||"#c8a832";t.innerHTML=`
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
    `,t.classList.add("active");const s=new Set;let n=[];const o=()=>t.classList.remove("active");document.getElementById("pa-bloc-close")?.addEventListener("click",o),document.getElementById("pa-bloc-cancel")?.addEventListener("click",o),t.addEventListener("click",l=>{l.target===t&&o()});try{const l=g.nation?.id,{data:c}=await $.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name, leader_age, bloc_id").eq("nation_id",l).eq("faction_type","party").is("abandoned_at",null),f=(c||[]).filter(v=>v.id!==a.id);n=f;const y=document.getElementById("pa-bloc-party-list");if(!y)return;if(f.length===0){y.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No other parties in this nation.</div>';return}y.innerHTML=f.map(v=>{const x=v.party_color||"#7a7a7a",b=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"Party Leader",h=v.bloc_id?"Already in a bloc":null;return`<label class="pa-bloc-party-row" data-party-id="${w(v.id)}" data-ineligible="${h?"1":"0"}"
                style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border-mid);border-left:3px solid ${x};cursor:${h?"not-allowed":"pointer"};opacity:${h?"0.45":"1"};">
                <input type="checkbox" class="pa-bloc-party-check" ${h?"disabled":""} style="margin:0;">
                <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:baseline;gap:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${w(v.faction_name)}</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${v.seats||0} seats</span>
                    </div>
                    <div style="font-size:9px;color:var(--text-secondary);">${w(b)}</div>
                    ${h?`<div style="font-family:var(--font-mono);font-size:8px;color:var(--orange);margin-top:3px;">${h}</div>`:""}
                </div>
            </label>`}).join(""),y.addEventListener("change",v=>{const x=v.target.closest(".pa-bloc-party-row");if(!x)return;if(x.dataset.ineligible==="1"){v.target.checked=!1;return}const b=x.dataset.partyId;v.target.checked?s.add(b):s.delete(b),m()})}catch(l){console.error("[PartyActions] Create Bloc modal fetch failed:",l);const c=document.getElementById("pa-bloc-party-list");c&&(c.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${w(l.message||String(l))}</div>`)}const r=document.getElementById("pa-bloc-name"),p=document.getElementById("pa-bloc-submit"),d=document.getElementById("pa-bloc-name-count"),m=()=>{const l=(r?.value||"").trim();d&&(d.textContent=`${l.length} / 40`),p&&(p.disabled=!(l.length>0&&s.size>0)||Nt)};r?.addEventListener("input",m),p?.addEventListener("click",async()=>{if(Nt)return;const l=(r?.value||"").trim();if(!(l.length===0||s.size===0)){Nt=!0,p.disabled=!0,p.textContent="Creating...";try{const{data:c,error:f}=await $.rpc("create_bloc",{p_leader_faction_id:a.id,p_name:l,p_invitee_faction_ids:Array.from(s)});if(f)throw f;if(c&&c.success===!1)throw new Error(c.error||"Unknown error");g.faction.party_funds=Math.max(0,(g.faction.party_funds||0)-1e5),await _e(a.id),o(),await At(a.id,g.nation?.id),U(e)}catch(c){console.error("[PartyActions] create_bloc failed:",c),alert(`Could not create bloc: ${c.message||c}`),p.disabled=!1,p.textContent="Create Bloc & Send Invites"}finally{Nt=!1}}})}async function Na(e){if(!j||!lt)return;const t=document.getElementById("pa-bloc-modal");if(!t)return;const a=g.faction?.color||"#c8a832";t.innerHTML=`
        <div class="pa-modal" style="width:520px;max-height:75vh;overflow:hidden;display:flex;flex-direction:column;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${a};"></div>
                    <span class="pa-modal-title">Invite to ${w(j.name)}</span>
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
        </div>`,t.classList.add("active");const i=()=>t.classList.remove("active");document.getElementById("pa-blinv-close")?.addEventListener("click",i),document.getElementById("pa-blinv-cancel")?.addEventListener("click",i),t.addEventListener("click",o=>{o.target===t&&i()});const s=g.nation?.id,n=document.getElementById("pa-blinv-list");if(!(!n||!s))try{const{data:o,error:r}=await $.from("factions").select("id, faction_name, seats, party_color, bloc_id").eq("nation_id",s).eq("faction_type","party").is("abandoned_at",null).is("bloc_id",null);if(r){n.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${w(r.message)}</div>`;return}const p=(o||[]).filter(d=>d.id!==g.faction.id);if(p.length===0){n.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No eligible parties to invite.</div>';return}n.innerHTML=p.map(d=>{const m=d.party_color||"#888";return`<div class="pa-blinv-row" data-faction-id="${w(d.id)}" style="padding:8px 10px;border:1px solid ${m}33;border-left:3px solid ${m};display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:var(--bg-card);">
                <div>
                    <div style="font-size:11px;color:var(--text-bright);font-weight:600;">${w(d.faction_name||"Unknown")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${d.seats||0} seats</div>
                </div>
                <button class="pa-modal-btn pa-modal-btn--submit pa-blinv-send" data-faction-id="${w(d.id)}">Invite</button>
            </div>`}).join(""),n.addEventListener("click",async d=>{const m=d.target.closest(".pa-blinv-send");if(!m)return;const l=m.dataset.factionId;if(l){m.disabled=!0,m.textContent="Sending…";try{const{error:c}=await $.rpc("invite_to_bloc",{p_bloc_id:j.id,p_invitee_faction_id:l});if(c)throw c;m.textContent="Invited",await At(g.faction.id,g.nation?.id),U(e)}catch(c){console.warn("[PartyActions] invite_to_bloc failed:",c),alert(`Could not invite: ${c.message||c}`),m.disabled=!1,m.textContent="Invite"}}})}catch(o){console.warn("[PartyActions] openInviteToBlocModal threw:",o),n.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Unexpected error.</div>'}}function U(e){const t=g.faction,a=g.nation,i=V(a),s=i&&a?.monarch_faction_id===t?.id,n=t.color||"#c8a832",o=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",r=t.seats||0,p=a?.total_seats||120,d=p>0?Math.round(r/p*100):0;t.action_points,t.approval_rating;const m=t.momentum??50,l=t.party_funds??0,c=ha(rt,a),f=[];for(let b=1;b<=3;b++){const h=rt.find(u=>u.slot===b);if(h){const u=$t.find(M=>M.id===h.platform_key),_=c.find(M=>M.id===h.id),S=_?_.stats.filter(M=>M.met).length:0,L=_?_.stats.length:0;f.push({name:u?.name||h.platform_key,status:h.status,metCount:S,totalCount:L,slot:b})}else f.push(null)}const y=f.map(b=>{if(!b)return{label:"No Platform"};const h=b.status==="fulfilled"?" ✓":b.status==="failed"?" ✗":b.status==="abated"?" —":"",u=b.status==="fulfilled"?"fulfilled":b.status==="failed"?"failed":b.status==="abated"?"abated":"filled",_=b.totalCount>0?` (${b.metCount}/${b.totalCount})`:"";return{label:b.name+_+h,statusClass:u,title:`${b.metCount} of ${b.totalCount} stats on target`}}),v="$"+(l>=1e6?(l/1e6).toFixed(1)+"M":l>=1e3?Math.round(l/1e3)+"k":l),x=Math.round(Number(i?g.nation?.public_approval??g.nation?.gov_approval??50:g.nation?.gov_approval??0));sa(e,{title:s?"Royal Court":"Party Actions",entityName:t.faction_name,entityColor:n,stats:[{label:"Party Funds",value:v,color:"var(--accent)"},{label:"Momentum",value:Number(m).toFixed(1),color:m>0?"var(--text-bright)":"var(--red)"},{label:i?"Legitimacy":"Nat. Approval",value:String(x),color:"var(--green)"}],statusBarItems:[{type:"count",label:"Seats",big:String(r),bigColor:n,dim1:`/ ${p}`,dim2:`(${d}%)`},{type:"list",label:"Platforms",items:y}],rolesContainerId:"pa-leaders",panelContainerId:"pa-actions-panel",extraHtml:`
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
        `}),document.getElementById("pa-leaders").innerHTML=za(o,n,t),document.getElementById("pa-actions-panel").innerHTML=Ra(o,n,t),document.getElementById("pa-leaders")?.addEventListener("click",b=>{const h=b.target.closest(".pa-leader-card");if(!h||h.classList.contains("vacant"))return;const u=h.dataset.role;u&&u!==at&&(at=u,U(e))}),document.getElementById("pa-actions-panel")?.addEventListener("click",b=>{const h=b.target.closest(".pa-action-item");if(!h||h.classList.contains("locked"))return;const u=h.dataset.actionId;u==="fundraise"?ni(e):u==="grant_seats"?Xa(e):u==="revoke_seats"?Qa(e):u==="rally"?ja(e):u==="statement"?si(e):u==="platform"?ri(e):u==="file_lawsuit"?Wa(e):u==="appoint_pm"?Ja(e):u==="modernize"?qa(e):u==="rebrand"?Ha(e):u==="no_confidence"?oi():u==="call_snap_election"?Za():u==="call_early_elections"?ti():u==="resign_as_pm"?ai():u==="leave_coalition"?ei():u==="disband_party"?ii():u==="create_bloc"?Ta(e):u==="leave_bloc"?Aa(e):u==="invite_to_bloc"&&Na(e)}),document.getElementById("pa-actions-panel")?.addEventListener("click",async b=>{const h=b.target.closest(".pa-bloc-invite-btn");if(!h)return;const u=h.dataset.inviteId,_=h.dataset.decision;if(!(!u||!_)&&!Ft.has(u)){Ft.add(u);try{await Pa(u,_,e)}finally{Ft.delete(u)}}}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>Te(e)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",b=>{b.target.closest("#pa-hire-agitator-btn")||Te(e)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>Pe(e)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",b=>{b.target.closest("#pa-hire-deputy-btn")||Pe(e)})}function za(e,t,a){const i=V(g.nation)&&g.nation?.monarch_faction_id===a?.id;return Ue.map(s=>{const n=s.id==="leader",o=s.id==="agitator",r=at===s.id;let p,d,m,l,c;if(n){p=!1,d=e,m=it(a.leader_first_name,a.leader_last_name),l=Ve.length;const v=V(g.nation);if(v&&g.nation?.monarch_faction_id===a.id)c={text:(g.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(v)c={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const b=F?.pm_party_id===a.id,h=g.nation?.hos_election_method==="elected"&&F?.president_party_id===a.id;b?c={text:"PRIME MINISTER",color:"#5cc55c"}:h?c={text:"PRESIDENT",color:"#5cc55c"}:gt?c={text:"OPPOSITION",color:"#c84"}:c={text:"GOVERNING",color:"#8b9a6b"}}}else o&&H?(p=!1,d=`${H.first_name} ${H.last_name}`,m=it(H.first_name,H.last_name),l=1):o&&!H?(p=!1,d="Not Hired",m="+",l=0):s.id==="deputy"&&D?(p=!1,d=`${D.first_name} ${D.last_name}`,m=it(D.first_name,D.last_name),l=1):s.id==="deputy"&&!D?(p=!1,d="Not Hired",m="+",l=0):s.id==="campaign"?(p=!1,d="Campaign Mgr",m="CM",l=Ze.length):(p=!0,d="Vacant",m="—",l=0);const f=s.oppositionOnly&&!gt;return`
            <div class="pa-leader-card ${r?"active":""} ${p?"vacant":""} ${f?"vacant":""}"
                 data-role="${s.id}"
                 style="${r?`border-left-color:${s.color};`:""}${f?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${f?"var(--text-dim)":"#d44a4a"};background:${f?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${f?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${f?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${m}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${n&&i?(g.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${l>0?`<span class="pa-leader-role-count">${l} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${w(d)}</div>
                        ${c?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${c.color};margin-top:2px;">${c.text}</div>`:""}
                        ${o&&H?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${H.skill}%;background:${bt(H.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${H.skill}</span></div>`:""}
                        ${o&&!H?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
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
    `}function Ra(e,t,a){const i=V(g.nation),s=i&&g.nation?.monarch_faction_id===a?.id,n=Ue.find(u=>u.id===at);if(!n)return"";const o=at==="leader",r=at==="agitator",p=at==="campaign",d=at==="deputy";if(!o&&!r&&!p&&!d)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${w(n.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(r&&!gt)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(r&&!H)return`
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
        `;if(r&&H)return Va(n);if(d&&!D)return`
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
        `;if(d&&D)return Ba(n);if(p)return Ga(n,a);const l=it(a.leader_first_name,a.leader_last_name),c=a.leader_age?`, Age ${a.leader_age}`:"",f=a.seats||0,y=a.momentum??0,h=(V(g.nation)&&g.nation?.monarch_faction_id===a.id?La:Ve).map(u=>{const _=u.tags.map(k=>`<span class="pa-action-tag" style="color:${Yt[k]||"var(--text-dim)"};">${k}</span>`).join("");let S="",L=u.cost,M=u.costColor,I=u.locked;if(u.id==="no_confidence"){const k=V(g.nation),A=!!F&&F.pm_party_id===a.id;if(k)I=!0,u.lockReason="Parliament cannot remove the Monarch’s Prime Minister. Only the Monarch can dismiss the PM.";else if(A)I=!0,u.lockReason="Your party is the Prime Minister — file from another party.";else if(de)I=!0,u.lockReason="A motion of no confidence is already pending in Parliament.";else if(Gt>0){I=!0;const z=Gt;u.lockReason=`Cooldown: ${z} tick${z!==1?"s":""} remaining before another motion can be filed against this PM party.`}else!F||!F.pm_party_id?(I=!0,u.lockReason="No active Prime Minister to file against."):u.lockReason=""}else if(u.id==="call_early_elections"||u.id==="resign_as_pm"){const k=g.nation,A=Lt(k),z=V(k),T=!!F&&F.pm_party_id===a.id;z?(I=!0,u.lockReason=u.id==="call_early_elections"?"Elections are not held under absolute monarchy. The Monarch appoints the Prime Minister.":"Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action."):A?T?g.nation&&g.nation.__coalition_status==="caretaker"?(I=!0,u.lockReason="Government is already in caretaker mode."):u.lockReason="":(I=!0,u.lockReason="Prime Minister’s party only."):(I=!0,u.lockReason="Only parliamentary and semi-presidential systems have a PM seat.")}else if(u.id==="call_snap_election"){const k=g.nation,A=V(k),T=String(k?.government_type||"").toLowerCase()==="presidential",E=F?.pm_party_id||null,C=!!E&&E===a.id;A?(I=!0,u.lockReason="Snap elections are not held under absolute monarchy. The Monarch appoints the Prime Minister."):T?(I=!0,u.lockReason="Presidential systems run on fixed terms — there is no parliamentary election to call."):E&&!C?(I=!0,u.lockReason="Only the Prime Minister’s party can call snap elections while a PM is seated."):u.lockReason=""}else if(u.id==="leave_coalition"){const k=g.nation,A=Lt(k),z=!!F&&F.pm_party_id===a.id;A?gt?(I=!0,u.lockReason="You are in opposition."):z?(I=!0,u.lockReason="Prime Minister’s party cannot leave — resign first."):u.lockReason="":(I=!0,u.lockReason="Only available in parliamentary systems.")}else if(u.id==="disband_party"){const k=We(a);k.isPM?(I=!0,u.lockReason="You are Prime Minister — resign before disbanding."):k.isPresident?(I=!0,u.lockReason="You are the sitting President — step down before disbanding."):k.isMonarchActing?(I=!0,u.lockReason="The reigning monarch cannot disband the royal house."):u.lockReason=""}else if(u.id==="fundraise"){const k=Ye(f,yt);L=`-${k.momCost} MOM`,M="#c84",S=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(k.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(k.perSeat/1e3).toFixed(0)}k/seat × ${f}</span>
                ${yt>0?`<span style="color:var(--orange);">Use #${yt+1}</span>`:""}
            </div>`,y-k.momCost<1&&(I=!0,S+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${k.momCost}, have ${Number(y).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${I?"locked":""}" data-action-id="${u.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(u.name)}</span>
                        <div class="pa-action-tags">${_}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${M};">${L}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${w(u.desc)}</div>
                ${S}
                ${u.locked&&u.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${w(u.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${n.color};background:${n.color}15;border-color:${n.color}33;">${l}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${n.color};">${s?(g.nation?.monarch_title||"KING").toUpperCase():n.title}</span>
                        <span class="pa-detail-name">${w(e)}</span>
                        ${i&&g.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${w(g.nation.dynasty_name)}</span>`:""}
                        ${Je(t)}
                    </div>
                    <div class="pa-detail-meta">${s?w((g.nation?.monarch_title||"King")+" of "+(g.nation?.name||"")):w(n.fullTitle)+" &middot; "+w(a.faction_name)}${c}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(g.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(i)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const u=F?.pm_party_id===a.id,_=g.nation?.hos_election_method==="elected"&&F?.president_party_id===a.id;return u?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':_?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':gt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        ${Qe(t)}
        ${Xe(t)}
        <div class="pa-actions-list">
            ${h}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${n.color};font-weight:700;">${n.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const Fa=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1},{id:"create_bloc",name:"Create Bloc",desc:"Found a pre-coalition alliance with other parties. Pick a name and invite any parties in your nation that aren't already in a bloc. Phase 1 is formation only — shared momentum, vote discipline, and coalition binding arrive in later phases.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["STRATEGIC","ALLIANCE"],locked:!1},{id:"leave_bloc",name:"Leave Bloc",desc:"Exit your current bloc. If you are the bloc leader, leaving dissolves the whole bloc and all pending invitations are withdrawn. Greyed out when you are not in a bloc.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"invite_to_bloc",name:"Invite Party to Bloc",desc:"Send a bloc invitation to an additional party. Leader-only. Eligible parties are in your nation, not already in a bloc, and not currently in government.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1}],Le=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Oa(e,t){const a=e+t;return a>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:a>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:a>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function Ba(e){const t=g.faction,a=t?.color||e.color,i=Fa.map(n=>{const o=n.tags.map(d=>`<span class="pa-action-tag" style="color:${Yt[d]||"var(--text-dim)"};">${d}</span>`).join("");let r=n.locked,p="";if(n.id==="create_bloc"){const d=We(t);j?(r=!0,p=`Already in the ${j.name} bloc.`):d.isPM||d.isPresident||d.isMonarchActing?(r=!0,p="Head of Government cannot form blocs — you already lead the coalition."):(t.party_funds||0)<1e5&&(r=!0,p="Needs $100k party funds.")}else n.id==="leave_bloc"?j?lt&&(p=`Leaving dissolves ${j.name} — all members will be removed.`):(r=!0,p="You are not in a bloc."):n.id==="invite_to_bloc"&&(j?lt||(r=!0,p="Only the bloc leader can send invitations."):(r=!0,p="You are not in a bloc."));return`
            <div class="pa-action-item ${r?"locked":""}" data-action-id="${n.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(n.name)}</span>
                        <div class="pa-action-tags">${o}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${n.costColor};">${n.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${w(n.desc)}</div>
                ${p?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${w(p)}</span></div>`:""}
            </div>
        `}).join(""),s=bt(D.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${it(D.first_name,D.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${w(D.first_name)} ${w(D.last_name)}</span>
                        ${Je(a)}
                    </div>
                    <div class="pa-detail-meta">${w(e.fullTitle)} &middot; Age ${D.age} &middot; Skill: <span style="color:${s.color};font-weight:700;">${D.skill}</span></div>
                </div>
            </div>
        </div>
        ${Qe(a)}
        ${Xe(a)}
        <div class="pa-actions-list" id="pa-actions-panel">${i}</div>
    `}function Da(e){const t=Ut(e),a=t.firstNames||[],i=t.lastNames||[];if(a.length===0||i.length===0)return[];const s=5+Math.floor(Math.random()*3),n=new Set,o=[];for(let r=0;r<s;r++){let p,d,m,l=0;do p=a[Math.floor(Math.random()*a.length)],d=i[Math.floor(Math.random()*i.length)],m=p+" "+d,l++;while(n.has(m)&&l<20);n.add(m);const c=20+Math.floor(Math.random()*66),f=28+Math.floor(Math.random()*30),y=Math.max(0,c-20)/65,v=Math.round((125e3+y*525e3)/25e3)*25e3;o.push({first_name:p,last_name:d,age:f,skill:c,hire_cost:v})}return o.sort((r,p)=>p.skill-r.skill)}async function Pe(e){const t=document.getElementById("pa-deputy-modal");if(!t)return;const a=g.nation?.name,i=Da(a);let s=null;function n(){const o=s!=null?i[s]:null,r=o?bt(o.skill):null,p=i.map((l,c)=>{const f=s===c,y=bt(l.skill);return`<div class="pa-hire-row ${f?"selected":""}" data-idx="${c}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${it(l.first_name,l.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${f?"var(--text-bright)":"var(--text-secondary)"};">${w(l.first_name)} ${w(l.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${l.skill}%;background:${y.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${y.color};">${l.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${l.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(l.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let d;o?d=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${it(o.first_name,o.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${w(o.first_name)} ${w(o.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${o.age} &middot; Deputy Leader Candidate</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${o.skill}%;background:${r.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${r.color};">${o.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${r.color};margin-top:3px;font-weight:700;">${r.label}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(g.faction?.party_funds||0)<o.hire_cost?' disabled title="Not enough funds"':""}>Hire ${w(o.first_name)}</button>
                </div>
            `:d=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-dep-list">${p}</div>
                    <div style="flex:1;overflow-y:auto;">${d}</div>
                </div>
            </div>
        `;const m=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",m),t.onclick=l=>{l.target===t&&m()},document.getElementById("pa-dep-list")?.addEventListener("click",l=>{const c=l.target.closest(".pa-hire-row");c&&(s=parseInt(c.dataset.idx,10),n())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const l=i[s],c=g.faction?.party_funds||0;if(c<l.hire_cost){alert("Not enough funds.");return}const f=document.getElementById("pa-dep-hire-confirm");f&&(f.disabled=!0,f.textContent="Hiring...");try{const y=c-l.hire_cost,v=g.shard?.current_tick||0,{data:x,error:b}=await $.from("faction_deputies").insert({faction_id:g.faction.id,first_name:l.first_name,last_name:l.last_name,age:l.age,skill:l.skill,status:"active",hired_at_tick:v}).select("*").single();if(b){alert("Failed: "+b.message);return}await $.from("factions").update({party_funds:y}).eq("id",g.faction.id),g.faction.party_funds=y,D=x,at="deputy",m(),U(e)}catch(y){console.error("[Deputy] Hire error:",y)}finally{f&&(f.disabled=!1)}})}t.classList.add("active"),n()}function ja(e){const t=document.getElementById("pa-rally-modal");if(!t||!D)return;const i=g.faction.party_funds||0;let s=null,n=null;function o(){const r=Le.map((m,l)=>{const c=i>=m.cost,f=s===l;return`<div class="pa-action-item ${f?"selected":""} ${c?"":"locked"}" data-tier="${l}" style="cursor:${c?"pointer":"not-allowed"};${f?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${f?"#8b9a6b":"var(--text-bright)"};">$${Math.round(m.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${m.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${m.bonus} = range ${1+m.bonus} to ${6+m.bonus}</div>
            </div>`}).join("");let p="";n&&(p=`
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${w(D.first_name)} ${w(D.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${D.skill}</span>
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="rally-tiers">${r}</div>

                    <div style="margin-top:8px;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                        <strong>Outcome table:</strong> Roll 1d6 + bonus<br>
                        8-11 = <span style="color:#5cc55c;">+3 Momentum</span> &middot;
                        5-7 = <span style="color:#8b9a6b;">+2 Momentum</span> &middot;
                        3-4 = <span style="color:#ca5;">+0 Momentum</span> &middot;
                        1-2 = <span style="color:#c55;">-2 Momentum</span>
                    </div>

                    ${p}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${n?"Close":"Cancel"}</button>
                    ${n?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${s==null?"disabled":""}>Hold Rally</button>`}
                </div>
            </div>
        `;const d=()=>{t.classList.remove("active"),n&&U(e)};document.getElementById("rally-close")?.addEventListener("click",d),document.getElementById("rally-cancel")?.addEventListener("click",d),t.onclick=m=>{m.target===t&&d()},document.getElementById("rally-tiers")?.addEventListener("click",m=>{const l=m.target.closest("[data-tier]");!l||l.classList.contains("locked")||(s=parseInt(l.dataset.tier,10),o())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(s==null||n)return;const m=Le[s],{data:l}=await $.from("factions").select("party_funds, momentum").eq("id",g.faction.id).single(),c=l?.party_funds||0;if(c<m.cost){alert("Not enough funds.");return}g.faction.party_funds=c,g.faction.momentum=l?.momentum??g.faction.momentum;const f=document.getElementById("rally-submit");f&&(f.disabled=!0,f.textContent="Rolling...");try{const y=1+Math.floor(Math.random()*6),v=Oa(y,m.bonus),x=c-m.cost,b=Math.max(1,(g.faction.momentum||0)+v.momentum);await $.from("factions").update({party_funds:x,momentum:b}).eq("id",g.faction.id);const h=g.shard?.current_tick||0;await $.from("campaign_actions").insert({party_id:g.faction.id,nation_id:g.nation?.id,action_type:"rally",ap_cost:0,money_cost:m.cost,tick_performed:h,result:{dieRoll:y,bonus:m.bonus,total:y+m.bonus,momentum:v.momentum,momentumDelta:v.momentum,label:v.label,outcomeName:v.label}}),g.faction.party_funds=x,g.faction.momentum=b,sessionStorage.removeItem("nationhood_state"),n={...v,dieRoll:y,bonus:m.bonus,total:y+m.bonus},o()}catch(y){console.error("[Rally] Error:",y),alert("Rally failed.")}})}t.classList.add("active"),o()}const Ze=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],Ae=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],ce=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function Ga(e,t){const a=Ze.map(i=>{const s=i.tags.map(n=>`<span class="pa-action-tag" style="color:${Yt[n]||"var(--text-dim)"};">${n}</span>`).join("");return`
            <div class="pa-action-item ${i.locked?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(i.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${i.costColor};">${i.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${w(i.desc)}</div>
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">CM</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                    </div>
                    <div class="pa-detail-meta">${w(e.fullTitle)} &middot; ${w(t.faction_name)}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${a}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `}function qa(e){const t=document.getElementById("pa-modernize-modal");if(!t)return;const a=g.faction;let i=null,s=a.custom_logo_url||null,n=!1;function o(){const r=!!s,d=Number(a.party_funds??0)>=5e4,m=!!i&&d&&!n;t.innerHTML=`
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
                    <div style="width:80px;height:80px;border:2px dashed ${r?"var(--accent)":"var(--border-mid)"};border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-card);">
                        ${s?`<img src="${w(s)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
                    </div>
                    <div style="text-align:center;">
                        <label style="display:inline-block;padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright);background:var(--bg-card);border:1px solid var(--border-mid);cursor:pointer;letter-spacing:0.06em;">
                            ${r?"CHANGE LOGO":"UPLOAD LOGO"}
                            <input type="file" accept="image/*" id="mod-file-input" style="display:none;">
                        </label>
                        ${a.custom_logo_url&&!i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${d?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${m?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=l=>{l.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",l=>{const c=l.target.files?.[0];if(c){if(c.size>2*1024*1024){alert("Logo must be under 2MB.");return}i=c,s=URL.createObjectURL(c),o()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(n||!i)return;n=!0;const l=document.getElementById("mod-submit");l&&(l.disabled=!0,l.textContent="Uploading...");try{const c=i.name.split(".").pop()?.toLowerCase()||"png",f=`${a.id}/logo_${Date.now()}.${c}`,{error:y}=await $.storage.from("party-logos").upload(f,i,{cacheControl:"3600",upsert:!0,contentType:i.type});if(y)throw new Error("Upload failed: "+y.message);const{data:v}=$.storage.from("party-logos").getPublicUrl(f),x=v?.publicUrl;if(!x)throw new Error("Failed to get logo URL");const b=Math.max(0,Number(a.party_funds??0)-5e4),{error:h}=await $.from("factions").update({custom_logo_url:x,party_funds:b}).eq("id",a.id);if(h)throw h;a.custom_logo_url=x,a.party_funds=b,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),U(e)}catch(c){alert("Modernize failed: "+(c.message||"Error")),n=!1,l&&(l.disabled=!1,l.textContent="Modernize — $50k")}})}t.classList.add("active"),o()}function Ha(e){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const a=g.faction;g.nation;const i=a.momentum??50;(g._allParties||[]).filter(c=>c.id!==a.id);const s={current:a.party_color||"#4a8aba"},n={current:0},o={current:a.custom_logo_url||null},r={current:null},p={current:!!a.custom_logo_url},d={current:!1};function m(){return s.current}function l(){const c=m(),f=Ae.find(L=>L.hex===c)?.name||"Custom",y=ce[n.current]?.emoji||"🏛️",v=p.current&&(o.current||r.current),x=o.current||(r.current?URL.createObjectURL(r.current):null),b=document.getElementById("rb-name")?.value??a.faction_name??"",h=document.getElementById("rb-abbr")?.value??a.abbreviation??"",u=document.getElementById("rb-desc")?.value??"",_=Ae.map(L=>{const M=c===L.hex;return`<div class="rb-color-swatch ${M?"selected":""}" data-hex="${L.hex}" style="background:${L.hex};${M?`box-shadow:0 0 8px ${L.hex}44;border:2px solid var(--text-bright);`:""}">
                ${M?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),S=ce.map((L,M)=>{const I=n.current===M;return`<div class="rb-logo-item ${I?"selected":""}" data-idx="${M}" style="${I?`background:${c}15;border:2px solid ${c};box-shadow:0 0 6px ${c}33;`:""}">
                ${L.emoji}
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
                            <input class="pa-modal-input" id="rb-name" value="${w(b)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${b.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${w(h)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${c};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${w(u)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${u.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${c};">${w(f)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${_}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${v?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${v?"opacity:0.3;":""}" id="rb-logos">${S}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${v?"solid var(--teal)":"dashed var(--border-mid)"};padding:10px 14px;background:${v?"rgba(90,170,138,0.04)":"var(--bg-card)"};">
                                ${v&&x?`
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <img src="${x}" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--border-main);background:var(--bg-card);" alt="Custom logo">
                                        <div style="flex:1;">
                                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--teal);font-weight:700;">CUSTOM LOGO ACTIVE</div>
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${r.current?r.current.name:"Saved logo"}</div>
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
                                    ${v&&x?`<img src="${x}" style="width:100%;height:100%;object-fit:contain;" alt="">`:y}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${w(b||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${c};letter-spacing:1px;">${w(h||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${w(u||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${c};background:${c}0a;border:1px solid ${c}25;">${w(h)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${c};background:${c}0a;border:1px solid ${c}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${c}08;border:1px solid ${c}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${c};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${c};">${w(f.toUpperCase())}</div>
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
                        ${d.current?'<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>':"This will change your party's identity across all UI, media, and diplomatic channels."}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${d.current?`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        `:`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=o.current,t._rbUseCustomLogo=p.current,l(),t.classList.add("active"),t.addEventListener("change",function(f){if(f.target.id==="rb-logo-file"){const y=f.target.files?.[0];if(!y)return;if(y.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(y.size/(1024*1024)).toFixed(1)+"MB"),f.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(y.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),f.target.value="";return}r.current=y,o.current=null,p.current=!0,t._rbCustomLogoFile=y,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,l()}}),t.addEventListener("click",function c(f){if(f.target===t||f.target.closest("#rb-close")||f.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",c);return}const y=f.target.closest(".rb-color-swatch");if(y){s.current=y.dataset.hex,l();return}const v=f.target.closest(".rb-logo-item");if(v){n.current=parseInt(v.dataset.idx)||0,p.current=!1,t._rbUseCustomLogo=!1,l();return}if(f.target.closest("#rb-remove-logo")){o.current=null,r.current=null,p.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,l();return}if(f.target.closest("#rb-submit")){const x=document.getElementById("rb-name")?.value?.trim()||"",b=document.getElementById("rb-abbr")?.value?.trim()||"";if(x.length<3||b.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}d.current=!0,l();return}if(f.target.closest("#rb-back")){d.current=!1,l();return}if(f.target.closest("#rb-confirm")){Ua(t,e,c);return}})}async function Ua(e,t,a){const i=g.faction,s=document.getElementById("rb-name")?.value?.trim()||"",n=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const o=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||i.party_color,r=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,p=r!=null?ce[parseInt(r)]?.emoji:null,d=e._rbCustomLogoFile,m=e._rbUseCustomLogo,l=e._rbCustomLogoUrl,c=document.getElementById("rb-confirm");c&&(c.disabled=!0,c.textContent="Rebranding...");try{const f=g.shard?.current_tick||0;let y=l;if(m&&d){const u=d.name.split(".").pop()?.toLowerCase()||"png",_=`${i.id}/logo_${Date.now()}.${u}`,{data:S,error:L}=await $.storage.from("party-logos").upload(_,d,{cacheControl:"3600",upsert:!0,contentType:d.type});if(L){console.error("[Rebrand] Logo upload failed:",L.message),alert("Logo upload failed: "+L.message);return}const{data:M}=$.storage.from("party-logos").getPublicUrl(_);y=M?.publicUrl||null}else m||(y=null);const v=15e4,x=i.party_funds||0;if(x<v){alert(`Not enough funds. You have $${Math.round(x/1e3)}k, need $150k.`);return}const b=x-v,h=Math.max(1,(i.momentum||0)-10);await $.from("factions").update({party_funds:b,momentum:h,faction_name:s,abbreviation:n.toUpperCase(),party_color:o,party_logo:m?null:p,custom_logo_url:y,rebrand_cooldown_until_tick:f+120}).eq("id",i.id),await $.from("campaign_actions").insert({party_id:i.id,nation_id:g.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:f,result:{oldName:i.faction_name,newName:s,oldAbbr:i.abbreviation,newAbbr:n,oldColor:i.party_color,newColor:o}}),i.party_funds=b,i.momentum=h,i.faction_name=s,i.abbreviation=n.toUpperCase(),i.party_color=o,i.party_logo=m?null:p,i.custom_logo_url=y,e.classList.remove("active"),e.removeEventListener("click",a),U(t)}catch(f){console.error("[PartyActions] Rebrand error:",f),alert("Failed to rebrand: "+(f.message||f))}finally{c&&(c.disabled=!1,c.textContent="⚠ Confirm Rebrand")}}const Ya=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function Va(e){const t=H,a=it(t.first_name,t.last_name),i=bt(t.skill),s=gt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',n=Ya.map(o=>{const r=o.tags.map(p=>`<span class="pa-action-tag" style="color:${Yt[p]||"var(--text-dim)"};">${p}</span>`).join("");return`
            <div class="pa-action-item ${o.locked?"locked":""}" data-action-id="${o.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(o.name)}</span>
                        <div class="pa-action-tags">${r}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${o.costColor};">${o.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${w(o.desc)}</div>
                ${o.locked&&o.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${w(o.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${a}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${w(t.first_name)} ${w(t.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${w(e.fullTitle)}, Age ${t.age}${s}</div>
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
        ${t.background?`<div style="padding:6px 16px;border:1px solid var(--border-main);border-top:none;border-bottom:none;background:var(--bg-panel);font-size:9px;color:var(--text-dim);font-style:italic;">${w(t.background)}</div>`:""}
        <div class="pa-actions-list">
            ${n}
        </div>
        ${Ka()}
        <div class="pa-skill-footer">
            <span style="color:${e.color};font-weight:700;">${e.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${i.color};font-weight:700;">${i.label}</span>: ${i.desc}
        </div>
    `}function Ka(){if(le.length===0)return"";const e=g.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${le.map(a=>{const i=Dt.find(b=>b.key===a.target_ministry),s=i?i.label:a.target_ministry,n=i?i.icon:"⚖️",o=xe(a.corruption_growth||0),r=ct[a.tier]||ct[1],p=a.status==="active",d=Math.max(0,e-a.filed_at_tick),m=8,l=Math.min(1,d/m),c=Math.max(0,a.resolves_at_tick-e),f=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],y=f.map(b=>{const h=a.filed_at_tick+b.tick,u=e>=h,_=e>=h&&(b.tick===8||e<a.filed_at_tick+f[f.indexOf(b)+1]?.tick),S=b.tick/m*100;return`<div class="pa-ls-milestone ${u?"passed":""} ${_?"current":""}" style="left:${S}%;" title="${b.label} (Tick ${h})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${b.label}</div>
            </div>`}).join("");let v="";if(!p){const b=r===ct[1]?"FRIVOLOUS":r===ct[2]?"PARTIAL WIN":r===ct[3]?"MAJOR WIN":"DEVASTATING",h=a.tier===1?"var(--red)":a.tier===2?"#ca5":a.tier===3?"#c84":"var(--green)";v=`<span class="pa-ls-tier-badge" style="color:${h};border-color:${h}44;background:${h}0a;">${b}</span>`}const x=p?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${a.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${a.momentum_effect>=0?"+":""}${a.momentum_effect} Mom</span>
                <span style="color:${a.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${a.gov_momentum_effect>=0?"+":""}${a.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${p?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${n}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${w(s)}</span>
                        <span class="pa-ls-tier-badge" style="color:${o.color};border-color:${o.color}44;background:${o.color}0a;">TIER ${a.tier}</span>
                        ${v}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${p?`${c} ticks left`:`Resolved tick ${a.resolves_at_tick}`}
                    </div>
                </div>
                ${p?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${l*100}%;"></div>
                        </div>
                        ${y}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${o.color};font-weight:700;">${(a.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${w(o.label)}
                </div>
                ${x}
            </div>
        `}).join("")}
        </div>
    `}let Xt=!1;async function Te(e){const t=document.getElementById("pa-hire-modal");if(!t)return;const a=g.nation?.id,i=g.nation?.name;if(!a||!i)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await ka($,a,i);let n=null;function o(){const r=n!=null?s[n]:null,p=r?bt(r.skill):null,d=s.map((c,f)=>{const y=n===f,v=bt(c.skill);return`<div class="pa-hire-row ${y?"selected":""}" data-idx="${f}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${it(c.first_name,c.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${y?"var(--text-bright)":"var(--text-secondary)"};">${w(c.first_name)} ${w(c.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${c.skill}%;background:${v.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${v.color};">${c.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${c.age}</div>
            </div>`}).join("");let m;r?m=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${it(r.first_name,r.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${w(r.first_name)} ${w(r.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${r.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${r.skill}%;background:${p.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p.color};">${r.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${p.color};margin-top:3px;font-weight:700;">${p.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(r.hire_cost/1e3).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${w(r.background)}</div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">SKILL ASSESSMENT</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${p.desc}</div>
                    </div>

                    <div style="padding:8px 10px;background:rgba(212,74,74,0.04);border:1px solid rgba(212,74,74,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;letter-spacing:0.06em;margin-bottom:3px;">ROLE: OPPOSITION COORDINATOR</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Files lawsuits against the government, organizes protests, and leads legal challenges. Skill affects success rates of legal and direct actions. Available only when your party is in opposition.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(r.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(g.faction?.party_funds||0)<r.hire_cost?' disabled title="Not enough funds"':""}>Hire ${w(r.first_name)}</button>
                </div>
            `:m=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                        ${d}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${m}
                    </div>
                </div>
            </div>
        `;const l=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",l),t.onclick=c=>{c.target===t&&l()},document.getElementById("pa-hire-list")?.addEventListener("click",c=>{const f=c.target.closest(".pa-hire-row");f&&(n=parseInt(f.dataset.idx,10),o())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Xt||n==null)return;Xt=!0;const c=document.getElementById("pa-hire-confirm");c&&(c.disabled=!0,c.textContent="Hiring...");try{const f=g.shard?.current_tick||0,y=s[n],v=y.hire_cost||0,x=g.faction?.party_funds||0;if(v>0&&x<v){alert(`Not enough funds. You have $${Math.round(x/1e3)}k, need $${Math.round(v/1e3)}k.`);return}if(v>0){const h=x-v,{error:u}=await $.from("factions").update({party_funds:h}).eq("id",g.faction.id);if(u){alert("Failed to deduct funds.");return}g.faction.party_funds=h}const b=await Ea($,g.faction?.id,y,f);if(!b.success){alert(b.error||"Failed to hire agitator.");return}H=b.agitator,at="agitator",l(),U(e)}catch(f){console.error("[PartyActions] Hire agitator error:",f)}finally{Xt=!1,c&&(c.disabled=!1)}})}o()}let zt=!1;function Wa(e){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!F){alert("No active government to file against.");return}const a=g.faction,i=H;let s=null,n=null;function o(){const r=s&&n,p=Dt.map(l=>{const c=s===l.key;return`<div class="pa-lawsuit-target ${c?"selected":""}" data-target="${l.key}">
                <span style="font-size:18px;">${l.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${c?"var(--text-bright)":"var(--text-secondary)"};">${w(l.label)}</span>
            </div>`}).join(""),d=He.map(l=>{const c=n===l.key;return`<div class="pa-lawsuit-basis ${c?"selected":""}" data-basis="${l.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${c?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${c?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${c?"var(--text-bright)":"var(--text-secondary)"};">${w(l.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${w(l.desc)}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">${w(i.first_name)} ${w(i.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Skill ${i.skill}</span>
                </div>`:""}

                <div class="pa-modal-body" style="gap:16px;">
                    <div>
                        <div class="pa-modal-step-label">1 &mdash; Target Ministry</div>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;" id="pa-lawsuit-targets">${p}</div>
                    </div>

                    <div>
                        <div class="pa-modal-step-label">2 &mdash; Legal Basis</div>
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${d}</div>
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
                            <span style="color:var(--red);">YOU: -5 Momentum</span><br>
                            <span style="color:var(--green);">THEM: +3 Momentum</span>
                        </div>
                    </div>
                </div>

                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-lawsuit-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${r?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const m=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",m),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",m),t.onclick=l=>{l.target===t&&m()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",l=>{const c=l.target.closest(".pa-lawsuit-target");c&&(s=c.dataset.target,o())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",l=>{const c=l.target.closest(".pa-lawsuit-basis");c&&(n=c.dataset.basis,o())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(zt||!s||!n)return;zt=!0;const l=document.getElementById("pa-lawsuit-submit");l&&(l.disabled=!0,l.textContent="Filing...");try{const{data:f}=await $.from("factions").select("party_funds").eq("id",a.id).single(),y=f?.party_funds||0;if(y<25e4){alert(`Not enough funds. You have $${Math.round(y/1e3)}k, need $250k.`),zt=!1,l&&(l.disabled=!1,l.textContent="File Lawsuit");return}const v=y-25e4;await $.from("factions").update({party_funds:v}).eq("id",a.id),a.party_funds=v,sessionStorage.removeItem("nationhood_state");const x=g.shard?.current_tick||0,b=await Ca($,{factionId:a?.id,nationId:g.nation?.id,agitatorId:i?.id,targetMinistry:s,basis:n,currentTick:x,partyName:a?.faction_name||"Opposition",administration:F});if(!b.success){alert(b.error||"Failed to file lawsuit.");return}const h=xe(b.lawsuit?.corruption_growth||0),u=ct[b.tier]||ct[1];m(),alert(`Lawsuit filed against ${Dt.find(_=>_.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),U(e)}catch(c){console.error("[PartyActions] File lawsuit error:",c),alert("An error occurred. Please try again.")}finally{zt=!1,l&&(l.disabled=!1,l.textContent="File Lawsuit")}})}t.classList.add("active"),o()}async function Ja(e){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const a=g.nation,i=g.faction,{data:s}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),n=s||[];let o=null,r=!1;const{data:p}=await $.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",a.id).eq("active",!0).maybeSingle();function d(){const m=n.find(v=>v.id===o),l=p?`${p.first_name} ${p.last_name}`:null,c=p?.factions?.faction_name||null,f=p&&o===p.faction_id;t.innerHTML=`
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
                    ${l?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${w(l)}</strong> (${w(c||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${n.map(v=>{const x=v.id===o,b=p&&v.id===p.faction_id,h=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"?";return`<div class="pa-action-item ${x?"selected":""}" data-party-id="${v.id}" style="cursor:pointer;${x?`border-color:${v.party_color||"#888"};background:${v.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${w(v.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${w(h)}, Age ${v.leader_age||"?"} · ${v.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${b?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!m||r||f?"disabled":""} style="background:#c8a832;">${m?f?"Already PM":`Appoint ${w(m.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const y=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",y),document.getElementById("apm-cancel")?.addEventListener("click",y),t.onclick=v=>{v.target===t&&y()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const x=v.target.closest("[data-party-id]");x&&(o=x.dataset.partyId,d())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!o||r)return;const v=n.find(b=>b.id===o);if(!v||!confirm(`Appoint ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister?`))return;r=!0;const x=document.getElementById("apm-confirm");x&&(x.disabled=!0,x.textContent="Appointing...");try{const b=g.shard?.current_tick||0;await ca($,{nationId:a.id,factionId:o,firstName:v.leader_first_name||"Unknown",lastName:v.leader_last_name||"Unknown",age:v.leader_age||50,currentTick:b});try{await $.from("government_formations").update({status:"dissolved"}).eq("nation_id",a.id).in("status",["formed","caretaker","active"]);const{data:I}=await $.from("shard").select("current_date").eq("name","Alpha Shard").single();await $.from("government_formations").insert({nation_id:a.id,election_id:null,proposed_by:i.id,party_ids:[o],status:"formed",formation_type:"monarchy",formed_at:new Date().toISOString(),ministry_assignments:{prime_minister:o},game_year:I?.current_date||""})}catch(I){console.warn("[AppointPM] government_formations write failed (non-blocking — synthetic fallback still works):",I?.message||I)}let h=0;const u=a.monarch_faction_id,_=p?.faction_id||null,S=_&&_!==u&&_!==o,L=o!==u&&o!==_;if(S&&(h-=4),L&&(h+=3),h!==0){const I=Number(a.public_approval??50),k=Math.max(0,Math.min(100,I+h));try{await $.from("nations").update({public_approval:k}).eq("id",a.id),a.public_approval=k}catch{}}try{await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${a.monarch_title||"The King"} has appointed ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister.`,fired_at_tick:b})}catch{}y();const M=h>0?`

Legitimacy +${h}.`:h<0?`

Legitimacy ${h}.`:"";alert(`${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} has been appointed Prime Minister.${M}`),U(e)}catch(b){alert("Failed to appoint PM: "+(b.message||"Error")),r=!1,x&&(x.disabled=!1,x.textContent=`Appoint ${w(v.faction_name)}`)}})}t.classList.add("active"),d()}async function Xa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=g.nation,i=g.faction,s=i.seats||0,n=a?.total_seats||100,{data:o}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),r=(o||[]).filter(c=>c.id!==i.id);let p=null;const d=Math.max(0,s-1);let m=Math.min(5,d||1);function l(){const c=r.find(y=>y.id===p);t.innerHTML=`
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
                        ${r.length>0?r.map(y=>{const v=y.id===p;return`<div class="pa-action-item ${v?"selected":""}" data-faction-id="${y.id}" style="cursor:pointer;${v?`border-color:${y.party_color||"#888"};background:${y.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${y.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${w(y.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,y.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${c?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${d}" value="${m}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${m}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(m*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-m} &middot; Their seats after: ${(c.seats||0)+m}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${c?"":"disabled"} style="background:#c8a832;">Grant ${m} Seats</button>
                </div>
            </div>
        `;const f=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",f),document.getElementById("royal-cancel")?.addEventListener("click",f),t.onclick=y=>{y.target===t&&f()},t.querySelector(".pa-modal-body")?.addEventListener("click",y=>{const v=y.target.closest("[data-faction-id]");v&&(p=v.dataset.factionId,l())}),document.getElementById("grant-slider")?.addEventListener("input",y=>{m=parseInt(y.target.value)||1,document.getElementById("grant-count").textContent=m;const v=document.getElementById("royal-grant");v&&(v.textContent=`Grant ${m} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!p||_t)return;_t=!0;const y=document.getElementById("royal-grant");y&&(y.disabled=!0,y.textContent="Granting...");try{const{data:v}=await $.from("factions").select("id, faction_name, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),x=(v||[]).find(E=>E.id===i.id),b=(v||[]).find(E=>E.id===p);if(!x||!b){alert("Faction not found.");return}const h=(v||[]).reduce((E,C)=>E+Math.max(0,C.seats||0),0),u=new Map;for(const E of v||[])u.set(E.id,Math.max(0,E.seats||0));let _=m;const S=Math.max(0,(u.get(i.id)||0)-1),L=Math.min(_,S);if(L>0&&(u.set(i.id,(u.get(i.id)||0)-L),_-=L),_>0){const E=(v||[]).filter(P=>P.id!==i.id&&P.id!==p&&(u.get(P.id)||0)>0);let C=E.reduce((P,R)=>P+(u.get(R.id)||0),0);for(const P of E){if(_<=0||C<=0)break;const R=Math.round(_*(u.get(P.id)||0)/C),O=Math.min(R,u.get(P.id)||0,_);O>0&&(u.set(P.id,(u.get(P.id)||0)-O),C-=O,_-=O)}if(_>0)for(const P of E){if(_<=0)break;const R=u.get(P.id)||0,O=Math.min(_,R);O>0&&(u.set(P.id,R-O),_-=O)}}const M=m-_;if(M<=0){alert("No seats available to grant.");return}u.set(p,(u.get(p)||0)+M);let I=0;for(const E of u.values())I+=E;if(I!==h){console.error("[GrantSeats] Conservation violated",{sumBefore:h,sumAfter:I,grantAmount:m,actualGrant:M}),alert("Internal error: seat totals would not balance. Aborting.");return}const k=[];for(const E of v||[]){const C=Math.max(0,E.seats||0),P=u.get(E.id)||0;C!==P&&k.push({id:E.id,seats:P})}for(const E of k){const{error:C}=await $.from("factions").update({seats:E.seats}).eq("id",E.id);if(C){alert("Failed to grant seats: "+C.message);return}}const A=M*.5,z=Math.min(100,(Number(a.public_approval)||50)+A),{error:T}=await $.from("nations").update({public_approval:z}).eq("id",a.id);if(T){alert("Failed to update public approval.");return}i.seats=u.get(i.id)||0,a.public_approval=z;try{const E=r.find(C=>C.id===p);await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} grants ${M} seats to ${E?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${a.monarch_title||"King"} has granted ${M} parliamentary seat${M!==1?"s":""} to ${E?.faction_name}. Legitimacy +${A.toFixed(1)}.`,fired_at_tick:g.shard?.current_tick||0})}catch{}f(),U(e)}catch(v){console.error("[GrantSeats] Error:",v),alert("Failed to grant seats.")}finally{_t=!1}})}t.classList.add("active"),l()}async function Qa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=g.nation,i=g.faction,{data:s}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),n=(s||[]).filter(d=>d.id!==i.id&&(d.seats||0)>0);let o=null,r=1;function p(){const d=n.find(v=>v.id===o),m=d&&d.seats||0,c=r*1e5,f=i.party_funds||0;t.innerHTML=`
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
                        ${n.length>0?n.map(v=>{const x=v.id===o;return`<div class="pa-action-item ${x?"selected":""}" data-faction-id="${v.id}" style="cursor:pointer;${x?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${w(v.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${v.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${d?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${m}" value="${r}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${r}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(c/1e3)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${r}</span>
                                ${f<c?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!d||f<c?"disabled":""} style="background:#d44a4a;">Revoke ${r} Seats</button>
                </div>
            </div>
        `;const y=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",y),document.getElementById("royal-cancel")?.addEventListener("click",y),t.onclick=v=>{v.target===t&&y()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const x=v.target.closest("[data-faction-id]");x&&(o=x.dataset.factionId,r=1,p())}),document.getElementById("revoke-slider")?.addEventListener("input",v=>{r=parseInt(v.target.value)||1,document.getElementById("revoke-count").textContent=r;const x=document.getElementById("royal-revoke");x&&(x.textContent=`Revoke ${r} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!o||_t)return;_t=!0;const v=document.getElementById("royal-revoke");v&&(v.disabled=!0,v.textContent="Revoking...");try{const x=r*1e5,{data:b}=await $.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),h=(b||[]).find(R=>R.id===i.id),u=(b||[]).find(R=>R.id===o);if(!h||!u){alert("Faction not found.");return}const _=h.party_funds||0;if(_<x){alert("Not enough funds.");return}const S=(b||[]).reduce((R,O)=>R+Math.max(0,O.seats||0),0),L=Math.min(r,u.seats||0);if(L<=0){alert("Target has no seats to revoke.");return}const M=_-x,I=(h.seats||0)+L,k=(u.seats||0)-L,A=L,z=Math.max(0,(Number(a.public_approval)||50)-A),T=S-(h.seats||0)-(u.seats||0)+I+k;if(T!==S){console.error("[RevokeSeats] Conservation violated",{sumBefore:S,sumAfter:T,take:L}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:E}=await $.from("factions").update({seats:I,party_funds:M}).eq("id",i.id);if(E){alert("Failed to revoke seats: "+E.message);return}const{error:C}=await $.from("factions").update({seats:k}).eq("id",o);if(C){alert("Failed to revoke seats: "+C.message);return}const{error:P}=await $.from("nations").update({public_approval:z}).eq("id",a.id);if(P){alert("Failed to update public approval.");return}i.seats=I,i.party_funds=M,a.public_approval=z,sessionStorage.removeItem("nationhood_state");try{await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} revokes ${L} seats from ${u.faction_name||"unknown"}`,category:"political",description_chosen:`The ${a.monarch_title||"King"} has revoked ${L} seat${L!==1?"s":""} from ${u.faction_name}. Legitimacy -${A}.`,fired_at_tick:g.shard?.current_tick||0})}catch{}y(),U(e)}catch(x){console.error("[RevokeSeats] Error:",x),alert("Failed to revoke seats.")}finally{_t=!1}})}t.classList.add("active"),p()}let Qt=!1,Zt=!1;async function Za(){if(!Zt&&!(!g?.faction?.id||!g?.nation?.id)&&confirm(`⚡ CALL SNAP ELECTION?

Schedules a parliamentary election for next tick. Cancels any other scheduled parliamentary election in this nation.

3-tick cooldown per party after the call.

Proceed?`)){Zt=!0;try{const{data:e,error:t}=await $.rpc("call_snap_election",{p_nation_id:g.nation.id,p_caller_faction_id:g.faction.id});if(t){alert("Failed to call snap election: "+t.message);return}if(e&&e.success===!1){alert(e.error||"Snap election call rejected.");return}alert("⚡ Snap election scheduled for next tick."),window.location.reload()}catch(e){console.error("[PartyActions] Call snap election failed:",e),alert("Failed to call snap election: "+(e?.message||"unknown error"))}finally{Zt=!1}}}async function ti(){if(Qt||!g?.faction?.id||!g?.nation?.id)return;if(!Lt(g.nation)){alert("Early elections are only available in parliamentary and semi-presidential systems.");return}if(V(g.nation)){alert("Elections are not held under absolute monarchy.");return}const e=F?.pm_party_id;if(!e||e!==g.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚡ CALL EARLY ELECTIONS?

Dissolves the legislature and puts the government into caretaker status.
Election fires after a short formation window.

Momentum effect depends on Gov. Approval:
• >50  → PM party +3 Momentum (fresh mandate)
• 35–50 → neutral
• <35  → opposition +5 Momentum each, +3 Stability

Proceed?`)){Qt=!0;try{const t=Array.isArray(F?.party_ids)?F.party_ids:F?.pm_party_id?[F.pm_party_id]:[],a=await ua($,g.nation.id,e,t);if(a&&a.success===!1){alert("Could not call early elections: "+(a.error||"unknown error"));return}alert("⚡ Early elections called. Government is now in caretaker status."),window.location.reload()}catch(t){console.error("[PartyActions] Call early elections failed:",t),alert("Failed to call early elections: "+(t?.message||"unknown error"))}finally{Qt=!1}}}let te=!1;async function ei(){if(!te&&g?.faction?.id&&confirm(`LEAVE COALITION?

Consequences:
• −3 Momentum to your party
• −5 Momentum to the Prime Minister’s party
• Any ministries you hold will be vacated
• Your party moves from governing to opposition
• Coalition flips to minority if your exit drops it below majority
• 12-tick cooldown before you can leave another coalition

Proceed?`)){te=!0;try{const{data:e,error:t}=await $.rpc("leave_coalition",{p_faction_id:g.faction.id});if(t)throw t;if(e&&e.success===!1)throw new Error(e.error||"Unknown error");const a=e?.became_minority?`

The government is now a minority.`:"",i=(e?.ministries_vacated||0)>0?`

${e.ministries_vacated} ministr${e.ministries_vacated===1?"y":"ies"} vacated.`:"";alert("You have left the coalition."+a+i),window.location.reload()}catch(e){console.error("[PartyActions] Leave Coalition failed:",e),alert("Failed to leave coalition: "+(e?.message||e))}finally{te=!1}}}let ee=!1;async function ai(){if(ee||!g?.faction?.id||!g?.nation?.id)return;if(!Lt(g.nation)){alert("Resignation is only available in parliamentary and semi-presidential systems.");return}if(V(g.nation)){alert("Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action.");return}const e=F?.pm_party_id;if(!e||e!==g.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚠ RESIGN AS PRIME MINISTER?

The PM seat vacates immediately. Coalition enters caretaker status with
a ${se}-tick window to nominate a successor via the cabinet panel.
If a new PM is installed, the administration continues under new leadership.
If the window expires, a snap election is called.

Cost to your party:
• −3 Momentum
• −0.05 Credibility
• Nation: −3 Stability
• 12-tick bar from the PM seat on your party

Proceed?`)){ee=!0;try{const{data:t}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a=t?.current_tick||g.shard?.current_tick||0;(await da($,g.nation.id,g.faction.id,a))?.result==="election_called"?alert("You have resigned. Snap election scheduled as fallback if no successor is nominated."):alert("You have resigned. Coalition has a short window to nominate a successor before a snap election fires."),window.location.reload()}catch(t){console.error("[PartyActions] Resign PM failed:",t),alert("Failed to resign: "+(t?.message||"unknown error"))}finally{ee=!1}}}let ae=!1;async function ii(){if(ae||!g?.faction?.id)return;const e=g.faction,t=e.faction_name||"this party",a=e.seats||0,i=Number(e.momentum||0).toFixed(1),s=Math.round(Number(e.party_funds||0)),n=s>=1e3?"$"+s.toLocaleString():"$"+s;if(!confirm("DISBAND "+t.toUpperCase()+`?

This will permanently:
• Dissolve the party
• Vacate `+a+" seat"+(a===1?"":"s")+` in parliament (empty until next election; no backfill)
• Forfeit `+n+` in party funds
• Forfeit `+i+` momentum
• Remove you from every nation chat
• Cascade-delete platforms, ideology, bloc membership,
  and any pending bloc invitations

You will need to found a new party.
There is a 24-tick cooldown on disbanding.

This action CANNOT be undone.`))return;if(prompt('Type "DISBAND" to confirm dissolution of '+t+":")!=="DISBAND"){alert("Disband cancelled.");return}ae=!0;try{const{data:r,error:p}=await $.rpc("disband_party",{p_faction_id:e.id});if(p)throw p;if(r&&r.success===!1)throw new Error(r.error||"Unknown error");sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:{user:d}}=await $.auth.getUser();if(d){const{data:m}=await $.from("factions").select("id, faction_type").or(`id.eq.${d.id},linked_user_id.eq.${d.id}`),l=(m||[]).find(f=>f.faction_type==="party"),c=(m||[]).find(f=>f.faction_type==="corporation");if(l){sessionStorage.setItem("active_faction_id",l.id),alert(t+` has been disbanded.

Redirecting to your other party.`),window.location.href="dashboard.html";return}if(c){sessionStorage.setItem("active_faction_id",c.id),alert(t+` has been disbanded.

Redirecting to your corporation.`),window.location.href="corp-dashboard.html";return}}alert(t+` has been disbanded.

You have no remaining factions.`),window.location.href="faction-select.html"}catch(r){console.error("[PartyActions] Disband failed:",r),alert("Disband failed: "+(r?.message||r))}finally{ae=!1}}let ie=!1;async function oi(){if(ie||!g?.faction?.id||!g?.nation?.id)return;const e=g.faction,t=g.nation,a=be(t);if(!Lt(t)){alert("A vote of no confidence is only possible in a parliamentary or semi-presidential system.");return}const{data:i}=await $.from("head_of_government").select("faction_id, last_name").eq("nation_id",t.id).eq("active",!0).maybeSingle(),s=i?.faction_id||t.ruling_faction_id||null,n=i?.last_name||null;if(!s){alert("No active Prime Minister to file against.");return}if(s===e.id){alert("Your party is the Prime Minister — you cannot file a vote of no confidence against yourself.");return}const o=g.faction?.seats!=null?Number(g.faction.seats):0;if(o<1){alert("Your party needs at least 1 seat in the legislature to file a motion.");return}const{data:r}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=r?.current_tick||g.shard?.current_tick||0,{data:d}=await $.from("bills").select("id").eq("nation_id",t.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(d&&d.length>0){alert("A motion of no confidence is already pending.");return}const{data:m}=await $.from("campaign_actions").select("tick_performed").eq("nation_id",t.id).eq("action_type","no_confidence_filed").eq("target_id",s).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(m){const f=p-Number(m.tick_performed||0);if(f<vt.NO_CONFIDENCE_COOLDOWN_TICKS){const y=vt.NO_CONFIDENCE_COOLDOWN_TICKS-f;alert(`Cooldown: ${y} tick${y!==1?"s":""} remaining before another motion can be filed against this PM party.`);return}}const l=n?a?`Motion of No Confidence in PM ${n}`:`Motion of No Confidence in the ${n} Government`:"Motion of No Confidence in the Government",c=a?`IF IT PASSES:
• PM removed — President must nominate a new PM
• Your party: +15 Momentum
• PM's party: -10 Momentum`:`IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Snap elections scheduled
• Your party: +15 Momentum
• PM's party: -10 Momentum`;if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${l}"

Cost: $0 — free to file
Voting period: ${vt.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

${c}

IF IT FAILS:
• Your party: -10 Momentum
• ${vt.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown on this PM party

Proceed?`)){ie=!0;try{const f=await va($,{faction:e,nation:t,pmFactionId:s,pmLastName:n,isSemiPres:a,tick:p,mySeats:o});if(!f.ok){alert("Failed to file motion: "+f.error);return}alert(`⚡ "${f.motionName}" has been filed!

Voting is now open for ${vt.NO_CONFIDENCE_VOTING_TICKS} ticks.`),window.location.href=`bill.html?id=${f.billId}`}catch(f){console.error("[PartyActions] No confidence file failed:",f),alert("Failed to file motion: "+(f?.message||"unknown error"))}finally{ie=!1}}}let oe=!1;async function ni(e){if(oe)return;const t=g.faction,a=t.seats||0,i=Math.max(1,t.momentum??0);if(a<=0){alert("Your party has no seats — nothing to fundraise from.");return}const s=Ye(a,yt);if(i-s.momCost<1){alert(`Not enough momentum. You need ${s.momCost} momentum (current: ${Math.round(i)}, floor: 1). Try again next tick when momentum recovers.`);return}oe=!0;try{const{data:n}=await $.from("factions").select("party_funds, momentum").eq("id",t.id).single();n&&(t.party_funds=n.party_funds??0,t.momentum=n.momentum??0);const o=Math.max(1,t.momentum??0),r=g.shard?.current_tick||0,p=Math.max(1,o-s.momCost),d=(t.party_funds||0)+s.raised,{error:m}=await $.from("factions").update({momentum:p,party_funds:d}).eq("id",t.id);if(m){alert("Fundraise failed: "+m.message);return}await $.from("campaign_actions").insert({party_id:t.id,nation_id:g.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:r,result:{momentumDelta:-s.momCost,raised:s.raised,perSeat:s.perSeat,momCost:s.momCost,useNumber:yt+1,seats:a}}),t.momentum=p,t.party_funds=d,sessionStorage.removeItem("nationhood_state"),yt++,U(e)}catch(n){console.error("[PartyActions] Fundraise error:",n),alert("Fundraise failed.")}finally{oe=!1}}function si(e){const t=document.getElementById("pa-statement-modal");if(!t)return;const a=g.faction,i=a?.color||"#c8a832",s=a?.leader_first_name&&a?.leader_last_name?`${a.leader_first_name} ${a.leader_last_name}`:"Party Leader",n=Me.map(m=>`<div class="pa-topic-card" data-topic="${m.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${m.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${w(m.label)}</span>
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
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${w(s)}</span>
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
    `,t.classList.add("active");let o=null,r=!1;const p=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",p),document.getElementById("pa-stmt-cancel")?.addEventListener("click",p),t.addEventListener("click",m=>{m.target===t&&p()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",m=>{const l=m.target.closest(".pa-topic-card");l&&(o=l.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(c=>{const f=c.dataset.topic===o;c.style.borderColor=f?i:"var(--border-mid)",c.style.background=f?i+"0a":"";const y=c.querySelector("span:last-child");y&&(y.style.color=f?"var(--text-bright)":"var(--text-secondary)")}),d())});const d=()=>{const m=document.getElementById("pa-stmt-body")?.value?.trim()||"",l=document.getElementById("pa-stmt-submit"),c=document.getElementById("pa-stmt-charcount");c&&(c.textContent=`${m.length} characters`),l&&(l.disabled=!(o&&m.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",d),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(r)return;const m=document.getElementById("pa-stmt-body")?.value?.trim();if(!o||!m||m.length<10)return;r=!0;const l=document.getElementById("pa-stmt-submit");l&&(l.disabled=!0,l.textContent="Issuing...");try{const c=g.shard?.current_tick||0,y=Me.find(A=>A.id===o)?.label||o,v=2e4,{data:x}=await $.from("factions").select("party_funds").eq("id",a.id).single(),b=x?.party_funds||0;if(b<v){alert(`Not enough funds. You have $${Math.round(b/1e3)}k, need $20k.`);return}const h=b-v,{error:u}=await $.from("factions").update({party_funds:h}).eq("id",a.id);if(u){alert("Failed to deduct funds: "+u.message);return}a.party_funds=h;const S=Se[Math.floor(Math.random()*Se.length)].replace("{party_name}",a.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",y),{error:L}=await $.from("campaign_actions").insert({party_id:a.id,nation_id:g.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:c,result:{topic:o,topicLabel:y,headline:S,body:m,leaderName:s}});L&&console.error("[PartyActions] Statement log failed:",L.message);const{error:M}=await $.from("valdorian_articles").insert({nation_id:g.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:S,subheadline:y,lede:m.substring(0,200)+(m.length>200?"...":""),body_paragraphs:JSON.stringify(m.split(/\n\n+/).filter(A=>A.trim())),quotes:JSON.stringify([{posture:"assertive",text:m.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([o]),source_event_id:"statement_"+Date.now(),tick:c});M&&console.error("[PartyActions] Article creation failed:",M.message);const{error:I}=await $.from("event_log").insert({nation_id:g.nation?.id,event_name:S,category:"political",description_chosen:`${a.faction_name} issues the following statement regarding ${y}: "${m}"`,fired_at_tick:c});I&&console.warn("[Statement] event_log insert failed:",I.message);const{error:k}=await $.from("admin_timeline_events").insert({nation_id:g.nation?.id,tick:c,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${y}: "${m.substring(0,120)}${m.length>120?"...":""}"`});k&&console.warn("[Statement] timeline insert failed:",k.message),p(),U(e)}catch(c){console.error("[PartyActions] Statement error:",c),alert("Failed to issue statement. Please try again.")}finally{r=!1,l&&(l.disabled=!1,l.textContent="Issue Statement")}})}const qt=20;function ri(e){const t=document.getElementById("pa-platform-modal");if(!t)return;const a=g.faction;g.nation;const i=a?.color||"#c8a832";let s=null,n=!1;const o={};for(const d of jt)d.faction_id!==a?.id&&(o[d.platform_key]=(o[d.platform_key]||0)+1);const r=new Set(rt.map(d=>d.platform_key));function p(){const d=$t.find(f=>f.id===s),m=d?Ee(o[d.id]||0):null;d&&jt.filter(f=>f.platform_key===d.id&&f.faction_id!==a?.id);const l=$t.map(f=>{const y=s===f.id,v=r.has(f.id),x=Ee(o[f.id]||0),b=o[f.id]||0;return`<div class="pa-plat-card ${y?"selected":""} ${v?"adopted":""}" data-plat="${f.id}">
                ${v?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${f.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${v?i:y?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${w(f.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${w(f.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x.color};">${x.label}</span>
                    ${b>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${b} rival${b>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let c;if(!d)c=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const f=d.improve.map(h=>{const u=ke(h,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${u.color};white-space:nowrap;">${u.arrow} ${$e[h]||h}</span>`}).join(""),y=d.worsen.map(h=>{const u=ke(h,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${u.color};white-space:nowrap;">${u.arrow} ${$e[h]||h}</span>`}).join(""),v=r.has(d.id),x=rt.length;let b;v?b=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:x>=3?b='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':n?b=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${w(d.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:b=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Costs 2 AP. Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${i};">Adopt Platform</button>
                </div>`,c=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:22px;">${d.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${w(d.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${w(d.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${w(d.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">MOMENTUM GAIN</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${m.color};">${m.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${w(m.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${d.improve.length} stats, +${qt} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${f}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${d.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${y}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${w(d.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${qt}</strong>. Failure: <strong style="color:var(--red);">-20 Momentum</strong>. If you don't enter government, the promise abates.
                        </div>
                    </div>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;align-items:center;">
                    ${b}
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
                        ${c}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=f=>{f.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",f=>{const y=f.target.closest(".pa-plat-card");y&&(s=y.dataset.plat,n=!1,p())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{n=!0,p()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{n=!1,p()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>li(e,s))}t.classList.add("active"),p()}let Rt=!1;async function li(e,t){if(Rt)return;Rt=!0;const a=document.getElementById("pa-platform-modal"),i=g.faction,s=g.nation;if(!i||!s||!t){Rt=!1;return}const n=$t.find(d=>d.id===t);if(!n)return;const o={},r={},p=d=>he.has(d);for(const d of n.improve){const m=Number(s[d]??50);o[d]=m,p(d)?r[d]=Math.max(0,m-qt):r[d]=Math.min(100,m+qt)}try{const d=g.shard?.current_tick||0,{data:m,error:l}=await $.rpc("adopt_platform",{p_faction_id:i.id,p_nation_id:s.id,p_platform_key:t,p_tick:d,p_baseline_stats:o,p_target_stats:r});if(l){console.error("[PartyActions] Platform adoption failed:",l.message),alert("Failed to adopt platform: "+l.message);return}if(m&&!m.success){alert(m.error||"Failed to adopt platform.");return}const c=m?.slot||rt.length+1;rt.push({faction_id:i.id,nation_id:s.id,platform_key:t,slot:c,adopted_at_tick:d,baseline_stats:o,target_stats:r,status:"active"}),jt.push(rt[rt.length-1]),i&&m?.momentum_gained&&(i.momentum=(i.momentum||0)+m.momentum_gained),i&&(i.action_points=Math.max(0,(i.action_points||0)-2)),a?.classList.remove("active"),U(e)}catch(d){console.error("[PartyActions] Platform adoption error:",d),alert("An error occurred. Please try again.")}finally{Rt=!1}}let kt=null,ta={isGoverning:!1,statusLabel:"OPPOSITION",administration:null,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],strongholdsByParty:{},passedBills:[],sectors:[],caucuses:[],nextElection:null,nextElectionTicks:null};function W(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function di(e,t,a){const i={};for(const s of e)i[s.id]=ga(s.id,t,a,3);return i}function ci(e,t,a){const i=new Map(e.map(n=>[n.id,n])),s=new Map;for(const n of a){const o=s.get(n.sector_id)||[];o.push({party_id:n.faction_id,popularity:Number(n.popularity)||0}),s.set(n.sector_id,o)}return t.map(n=>{const o=(s.get(n.id)||[]).filter(r=>r.popularity>0&&i.has(r.party_id)).map(r=>{const p=i.get(r.party_id);return{party_id:p.id,abbreviation:p.abbreviation||(p.faction_name||"?").slice(0,3).toUpperCase(),color:p.party_color||"#888",seats:Number(p.seats)||0,popularity:r.popularity}});return o.sort((r,p)=>p.popularity!==r.popularity?p.popularity-r.popularity:p.seats-r.seats),{sector_key:n.sector_key,name:n.name,weight:Number(n.weight)||0,top3:o.slice(0,3)}}).sort((n,o)=>o.weight!==n.weight?o.weight-n.weight:(n.name||"").localeCompare(o.name||""))}async function pi(e,t,a){kt=t;const i=document.getElementById(a);if(!i)return;const s=t.faction,n=t.nation,o=n?.id,r=s?.id;if(!s||!o){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const p=t.shard?.current_tick||0,[d,m,l,c,f,y,v,x]=await Promise.all([Ge(e,o,r),e.from("factions").select("*").eq("nation_id",o).eq("faction_type","party"),e.from("sectors").select("id, sector_key, name, weight, base_turnout, is_active").eq("nation_id",o).eq("is_active",!0).order("display_order"),e.from("bills").select("id, bill_name, bill_type, proposed_by, passed_tick, bill_articles(policies(sector_effects), selected_option:policy_options!selected_option_id(sector_effects)), bill_support(faction_id, stance)").eq("nation_id",o).eq("status","passed").not("passed_tick","is",null).order("passed_tick",{ascending:!1}).limit(15),Promise.resolve({data:[],error:null}),e.from("elections").select("*").eq("nation_id",o).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5),e.from("ministries").select("party_id").eq("nation_id",o).eq("is_active",!0),ra(o)]);m.error&&console.error("[PartyOverview] Parties fetch error:",m.error.message),l.error&&console.error("[PartyOverview] Sectors fetch error:",l.error.message),f.error&&console.error("[PartyOverview] Caucus fetch error:",f.error.message),y.error&&console.error("[PartyOverview] Election fetch error:",y.error.message),c.error&&console.error("[PartyOverview] Passed-bills fetch error:",c.error.message);const b=m.data||[],h=l.data||[],u=d.administration,_=new Set((v.data||[]).map(E=>E.party_id).filter(Boolean));let S=[];if(b.length>0&&h.length>0){const E=b.map(R=>R.id),{data:C,error:P}=await e.from("faction_sector_popularity").select("faction_id, sector_id, popularity").in("faction_id",E);P&&console.error("[PartyOverview] Popularity fetch error:",P.message),S=C||[]}const L=di(b,h,S),M=ci(b,h,S),I=u?.started_at_tick!=null?Math.max(0,p-u.started_at_tick):0,k=y.data||[],A=k[0]||null,z=A?Math.max(0,A.election_tick-p):null;let T=null;A&&n&&mt(n)&&(T=k.some(C=>C.election_type==="presidential"&&C.election_tick===A.election_tick)?"General":"Midterm"),ta={isGoverning:d.isGoverning,statusLabel:d.label,administration:u,ministryPartyIds:_,ticksInPower:I,myFaction:s,allParties:b,rivalParties:b.filter(E=>E.id!==r),blocMap:x,strongholdsByParty:L,sectorRanking:M,passedBills:c.data||[],sectors:h,caucuses:f.data||[],nextElection:A,nextElectionTicks:z,nextElectionLabel:T},mi(i)}catch(p){console.error("[PartyOverview] Init error:",p),i.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}function mi(e){const t=ta,a=t.myFaction,i=kt.nation,s=a?.party_color||a?.color||"#c8a832";kt.shard?.current_tick,t.administration?.admin_name||t.isGoverning;const n=t.statusLabel,o=t.isGoverning?"var(--green)":"var(--orange)",r=a?.seats||0,p=i?.total_seats||100,d=a?.momentum??50;e.innerHTML=`<div class="po-page">
        ${fi(t,s,r,p,d)}
        <div class="po-columns">
            <div class="po-col-left">
                ${vi(t,a,s,n,o)}
                ${ui(t,a,s)}
                ${gi(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${yi()}
                ${xi(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${_i(t,a)}
                ${wi()}
            </div>
        </div>
    </div>`}function fi(e,t,a,i,s){const n=e.isGoverning?e.administration?.admin_name||"Government":"Opposition",o=(kt.nation?.government_type||"").toLowerCase().includes("monarchy"),r=o?"No elections":e.nextElectionTicks!=null?e.nextElectionTicks:"—",p=o?"var(--text-dim)":typeof r=="number"&&r<=3?"var(--red)":"var(--text-bright)",d=o?"NEXT ELECTION":e.nextElectionLabel?"NEXT "+e.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${W(n)}</div>
                <div class="po-summary-sub">${e.ticksInPower} ticks in power</div>
            </div>
        </div>
        <!-- KNOWN-STALE: factions.momentum no longer drives elections —
             run_election was rewritten in 20260517 to compute vote share
             from sector popularity. This cell stays for now to avoid a
             scope creep on the bills-feed change; replace with a real
             SECTORS / POPULARITY summary metric in a follow-up. -->
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
            <div class="po-summary-label">${d}</div>
            <div class="po-summary-value" style="color:${p};">${r}${typeof r=="number"?" ticks":""}</div>
        </div>
    </div>`}function vi(e,t,a,i,s){const n=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",o=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const r=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${a};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${a};background:${a}12;border-color:${a}33;">${o}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                    <span class="po-identity-name">${W(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${i}</span>
                    ${De(t?.bloc_id,e.blocMap)}
                </div>
                <div class="po-identity-meta">${e.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${a};background:${a}15;border-color:${a}33;">${o}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${W(n)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${a};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${r}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function ui(e,t,a){const i=t?.id;return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTOR RANKING</span>
            <span class="po-card-subtitle">all sectors · top 3 parties by popularity</span>
        </div>
        <div style="padding:8px 12px;">
            ${(e.sectorRanking||[]).map(o=>{const r=(o.top3||[]).map(c=>{const f=c.party_id===i,y=f?a:c.color||"#888",v=(Math.round(c.popularity)/10).toFixed(1),x=f?'<span class="po-stronghold-chip-label" style="font-weight:700;">You</span>':`<span class="po-stronghold-chip-label">${W(c.abbreviation)}</span>`;return`<div class="po-stronghold-chip" style="border-color:${y}66;background:${y}14;">
                ${x}
                <span class="po-stronghold-chip-label" style="color:${y};font-weight:700;margin-left:4px;">${v}</span>
            </div>`}).join(""),p=r?`<div class="po-stronghold-chips">${r}</div>`:'<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">No party popularity yet</div>',d=Number(o.weight)||0,m=d>=3?"var(--gold, #c9a449)":d===2?"var(--amber, #c8a64e)":"var(--text-secondary)";return`<div class="po-stronghold-row">
            <div class="po-stronghold-party" style="display:flex;align-items:center;gap:8px;">
                ${`<span style="display:inline-block;min-width:18px;padding:1px 5px;font-family:var(--font-mono);font-size:9px;font-weight:700;color:${m};border:1px solid ${m}66;background:${m}14;text-align:center;letter-spacing:0;">w${d}</span>`}
                <span class="po-stronghold-party-name">${W(o.name)}</span>
            </div>
            ${p}
        </div>`}).join("")||'<div style="padding:8px 0;font-size:9px;color:var(--text-dim);font-family:var(--font-mono);">No active sectors in this nation.</div>'}
        </div>
    </div>`}function gi(e){const t=(e.caucuses||[]).filter(s=>s.name&&s.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const a=e.faction?.seats||0,i=t.map(s=>{const n=s.relationship_score??50,o=n>60?"var(--green)":n>40?"var(--amber)":"var(--red)",r=Math.round((s.seat_share||0)*a),p=(s.dominant_axis||"").replace(/_/g,"/"),d=s.wing_end==="left"?p.split("/")[0]:p.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${W(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${W(d)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${r} seats</span>
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
    </div>`}function yi(){return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTORS AND POPULARITY</span>
        </div>
        <div style="padding:10px 12px;display:flex;flex-direction:column;gap:10px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);letter-spacing:0.05em;">SECTORS</div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);line-height:1.5;margin-top:3px;">
                    Slices of the electorate (Construction, Finance, Manufacturing, etc.). Each carries a <span style="color:var(--text-bright);font-weight:700;">weight</span> — w1 minor, w2 average, w3 major — that scales how much its voters matter on election day.
                </div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);letter-spacing:0.05em;">POPULARITY</div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);line-height:1.5;margin-top:3px;">
                    A party's standing inside a sector (0–10). Bills shift it: passing bills credit the sponsor and YES voters with the policy's effects, debit NO voters with the inverse. Failed bills hit the sponsor with the inverse alone.
                </div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);letter-spacing:0.05em;">TURNOUT</div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);line-height:1.5;margin-top:3px;">
                    Per-sector engagement multiplier (0.50–1.30). High-turnout sectors translate the same popularity into more votes; low-turnout sectors disproportionately reward the parties already entrenched there.
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.5;border-top:1px solid var(--border-hair);padding-top:6px;">
                Vote share = Σ (popularity × weight × turnout) per party, normalized across the nation.
            </div>
        </div>
    </div>`}function bi(e){const t=new Map;for(const a of e.bill_articles||[]){const i=a?.selected_option?.sector_effects||a?.policies?.sector_effects||[];for(const s of i){if(!s||typeof s.sector_key!="string")continue;const n=Number(s.change_tenths);!Number.isFinite(n)||n===0||t.set(s.sector_key,(t.get(s.sector_key)||0)+n)}}return Array.from(t,([a,i])=>({sector_key:a,change_tenths:i}))}function hi(e,t){if(!e)return"";const a=e.party_color||e.color||"#888",i=e.abbreviation||(e.faction_name||"?").slice(0,3).toUpperCase(),s=t?`<span style="font-family:var(--font-mono);font-size:6px;color:${a};margin-left:3px;letter-spacing:0.05em;">SPONSOR</span>`:"";return`<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border:1px solid ${a}55;background:${a}14;font-family:var(--font-mono);font-size:8px;font-weight:700;color:${a};">${W(i)}${s}</span>`}function Ne(e,t,a){return e.length?e.map(i=>{const n=(a?-i.change_tenths:i.change_tenths)/10,o=n>0?"+":n<0?"−":"",r=Math.abs(n).toFixed(1),p=n>0?"var(--green)":n<0?"var(--red)":"var(--text-dim)",d=t.get(i.sector_key)||i.sector_key;return`<span style="white-space:nowrap;"><span style="color:${p};font-weight:700;">${o}${r}</span> <span style="color:var(--text-secondary);">${W(d)}</span></span>`}).join('<span style="color:var(--text-dim);margin:0 4px;">·</span>'):'<span style="color:var(--text-dim);">no sector effects</span>'}function xi(e){const t=e.passedBills||[],a=kt.shard?.current_tick||0,i=t.filter(r=>!["no_confidence","confirmation","minister_confirmation","foundational","veto_override"].includes(r.bill_type));if(i.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT BILLS</span>
                <span class="po-card-subtitle">passed bills · sector outcomes</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No passed bills yet.</div>
        </div>`;const s=new Map((e.allParties||[]).map(r=>[r.id,r])),n=new Map((e.sectors||[]).map(r=>[r.sector_key,r.name]));return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT BILLS</span>
            <span class="po-card-subtitle">passed bills · sector outcomes</span>
        </div>
        <div style="max-height:520px;overflow-y:auto;">${i.map(r=>{const p=bi(r),d=a-(r.passed_tick||0),m=d===0?"just now":d+"t ago",l=new Map;for(const h of r.bill_support||[]){const u=h.stance==="accept"?"yes":h.stance==="reject"?"no":h.stance;(u==="yes"||u==="no")&&l.set(h.faction_id,u)}r.proposed_by&&l.set(r.proposed_by,"yes");const c=[],f=[];for(const[h,u]of l){const _=s.get(h);if(!_)continue;const S=hi(_,h===r.proposed_by);u==="yes"?c.push(S):u==="no"&&f.push(S)}const y=s.get(r.proposed_by),v=y?`<span style="color:${y.party_color||y.color||"#888"};font-weight:700;">${W(y.abbreviation||y.faction_name||"?")}</span>`:'<span style="color:var(--text-dim);">unknown</span>',x=c.length?`<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--green);letter-spacing:0.05em;width:36px;flex-shrink:0;">GAINED</span>
                    ${c.join("")}
               </div>
               <div style="margin-left:40px;font-family:var(--font-mono);font-size:8px;line-height:1.6;margin-top:2px;">
                    ${Ne(p,n,!1)}
               </div>`:"",b=f.length?`<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);letter-spacing:0.05em;width:36px;flex-shrink:0;">LOST</span>
                    ${f.join("")}
               </div>
               <div style="margin-left:40px;font-family:var(--font-mono);font-size:8px;line-height:1.6;margin-top:2px;">
                    ${Ne(p,n,!0)}
               </div>`:"";return`<div style="padding:8px 12px;border-bottom:1px solid rgba(200,196,184,0.05);">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
                <span style="font-size:10px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${W(r.bill_name||"Untitled bill")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);flex-shrink:0;">${m}</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:1px;">sponsored by ${v}</div>
            ${x}
            ${b}
        </div>`}).join("")}</div>
    </div>`}function _i(e,t){const a=e.rivalParties,i=e.administration,s=kt.nation,n=i?.pm_party_id,o=s?.total_seats||100,r=a.map(p=>{const d=p.party_color||"#666",m=p.abbreviation||p.faction_name?.slice(0,3)?.toUpperCase()||"?",l=p.leader_first_name&&p.leader_last_name?`${p.leader_first_name} ${p.leader_last_name}`:"Unknown",c=p.seats||0,f=$a(p,i,e.ministryPartyIds,s);let y=f.label;const v=f.isGoverning?"var(--green)":"var(--orange)";f.isGoverning&&f.label==="GOVERNING"&&(p.id===n?y="GOVERNING — LEAD":y="GOVERNING — JUNIOR");const x=c-(t?.seats||0),b=x>0?"var(--green)":x<0?"var(--red)":"var(--text-dim)",h=e.strongholdsByParty?.[p.id]||[],u=h.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;">${h.map(_=>`<span style="font-family:var(--font-mono);font-size:9px;padding:2px 6px;border:1px solid ${d}44;background:${d}10;color:var(--text-bright);white-space:nowrap;">${W(_.name)}</span>`).join("")}</div>`:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Unaligned</div>';return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${d}15;border:1px solid ${d}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${d};">${W(m)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${W(p.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${W(l)}</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${v};background:${v}0a;border:1px solid ${v}44;white-space:nowrap;">${y}</span>
                    ${De(p.bloc_id,e.blocMap)}
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${c>0?"var(--text-bright)":"var(--text-dim)"};">${c}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${o}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${b};">${x>0?"+":""}${x}</span>
                </div>
            </div>
            ${u}
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${a.length} parties</span>
        </div>
        ${r||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`}function wi(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--text-bright);font-weight:700;">Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let B=null,N=null,xt=!1,Et=null,G=[],pt=[],st=0,pe={},we=[],ea=null,Z=0,Ht=null,dt=0,Q=[],wt=!1,Mt=null,Pt=null,K={},ne=!1;const $i=4;function ze(e){const t=Number(e?.last_seen_tick)||0;if(!t)return"";const a=dt-t;return a<$i?"":`<span class="cf-inactive">[Inactive – ${a} tick${a!==1?"s":""}]</span>`}function Y(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function aa(e,t){B=e,N=t;const a=t.nation,i=t.faction;if(!a||!i)return{needed:!1};const[s,n,o,r,p,d]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),ye(e,a.id),e.from("factions").select("id, faction_name, abbreviation, party_color, seats, bloc_id, last_seen_tick").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),e.from("elections").select("election_tick, election_type").eq("nation_id",a.id).eq("status","scheduled").order("election_tick",{ascending:!0}),e.from("faction_platforms").select("faction_id, platform_key, slot").eq("nation_id",a.id).eq("status","active").order("slot",{ascending:!0})]);dt=n.data?.current_tick??0,G=r.data||[],st=G.reduce((f,y)=>f+(y.seats||0),0),Z=Math.ceil(st/2)+1,we=p?.data||[],ea=o||null,pe={},d?.error&&console.warn("[CoalitionFormation] faction_platforms query failed:",d.error.message);for(const f of d?.data||[])(pe[f.faction_id]||=[]).push(f.platform_key);const m=s.data,c=!!(o||null);return mt(a)?(xt=!1,{needed:!1}):(m&&!c?(xt=!0,Et=m.id,Ht=m.election_tick):(xt=!c,m&&(Et=m.id,Ht=m.election_tick)),{needed:xt})}function ki(){const e=N?.nation;if(!e||V(e))return"";const t=mt(e),a=we[0]||null,i=a?.election_tick??null,s=a?.election_type||"parliamentary",n=t?s==="presidential"?"General":"Midterm":"Parliamentary",o=Number(dt)||0,r=i!=null?Math.max(0,i-o):null,p=r==null?null:`${r} Month${r===1?"":"s"}`,d=i!=null?ya(i):"TBD",m=Number(e.total_seats)||0,l=Number(e.parliamentary_term_ticks)||Number(e.election_frequency)||24,c=`${l} Month${l===1?"":"s"}`,f=e.name||"Unknown",y=e.flag_url||`assets/flags/${f}.png`,v=[p,`Type: ${n}`].filter(Boolean).map(u=>`<div class="cf-eh-stat-sub">${Y(u)}</div>`).join(""),x=ea?.status||null,b=x?x.charAt(0).toUpperCase()+x.slice(1):null;return`<div class="cf-election-header">
        <div class="cf-eh-left">
            <div class="cf-eh-label">&bull; ELECTIONS</div>
            ${b?`<div class="cf-eh-gov-status">GOVERNMENT STATUS: <span class="cf-eh-gov-status-value">${Y(b)}</span></div>`:""}
            <div class="cf-eh-title-row">
                <img class="cf-eh-flag" src="${Y(y)}" alt="${Y(f)} flag" onerror="this.style.display='none'">
                <h2 class="cf-eh-title">Elections of ${Y(f)}</h2>
            </div>
        </div>
        <div class="cf-eh-stats">
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">NEXT ELECTION</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--accent">${Y(d)}</div>
                ${v}
            </div>
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">TOTAL SEATS</div>
                <div class="cf-eh-stat-value">${m}</div>
                <div class="cf-eh-stat-label" style="margin-top:10px;">ELECTORAL FREQUENCY</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--sm">${Y(c)}</div>
            </div>
        </div>
    </div>`}function Ei(){const e=N?.nation;if(!e||V(e))return"";const t=Number(e.total_seats)||0;if(t<=0)return"";const a=G.filter(l=>(l.seats||0)>0).slice().sort((l,c)=>(c.seats||0)-(l.seats||0)),i=a.reduce((l,c)=>l+(c.seats||0),0),s=Math.max(0,t-i),n=Math.ceil(t/2)+1,o=n/t*100,r=a.map(l=>{const c=(l.seats||0)/t*100,f=l.party_color||"var(--text-dim)";return`<div class="cf-em-seg" style="width:${c}%;background:${Y(f)};" title="${Y(l.faction_name)}: ${l.seats} seats"></div>`}).join(""),p=s>0?`<div class="cf-em-seg cf-em-seg--stake" style="width:${s/t*100}%;">
               <span class="cf-em-stake-label">${s} SEATS AT STAKE</span>
           </div>`:"",d=a.map(l=>{const c=l.party_color||"var(--text-dim)";return`<div class="cf-em-chip">
            <span class="cf-em-swatch" style="background:${Y(c)};"></span>
            <span class="cf-em-chip-name">${Y(l.faction_name)}</span>
            <span class="cf-em-chip-count">${l.seats}</span>
            <span class="cf-em-chip-unit">seats</span>
        </div>`}).join(""),m=s>0?`<div class="cf-em-chip">
               <span class="cf-em-swatch cf-em-swatch--stake"></span>
               <span class="cf-em-chip-name">At Stake</span>
               <span class="cf-em-chip-count">${s}</span>
               <span class="cf-em-chip-unit">seats</span>
           </div>`:"";return`<div class="cf-electoral-makeup">
        <div class="cf-em-header">
            <div class="cf-em-title">&#9642; ELECTORAL MAKEUP</div>
            <div class="cf-em-meta">MAJORITY AT <span class="cf-em-majority">${n} SEATS</span> &middot; ${t} TOTAL</div>
        </div>
        <div class="cf-em-bar">
            ${r}
            ${p}
            <div class="cf-em-majority-tick" style="left:${o.toFixed(2)}%;"></div>
        </div>
        <div class="cf-em-legend">
            ${d}
            ${m}
        </div>
    </div>`}async function ot(e){if(!e)return;if(V(N.nation)){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}const t=ki(),a=Ei(),i=a?`<div class="cf-makeup-row">
               <div class="cf-makeup-left"></div>
               <div class="cf-makeup-right">${a}</div>
           </div>`:"";if(mt(N.nation)){const _=be(N.nation);e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${_?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${_?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}if(!xt){e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!Et){const _=we[0]?.election_tick,S=_!=null?Math.max(0,_-dt):"?";e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${S}</strong> tick${S!==1?"s":""}.</div>
            </div>
        </div>`;return}await Pi();const s=N.faction,n=Ht!==null?Math.max(0,dt-Ht):0,o=Math.max(0,se-n),r=Math.min(100,n/se*100),p=n*2;let d="safe";o<=1?d="critical":o<=2&&(d="warning");const m=d==="critical"?"⚠️":d==="warning"?"⏳":"🤝",l=d==="critical"?"No Government — Snap Election Imminent":d==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",c=d==="critical"?"Form a government immediately or face snap elections":d==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",f=G.find(_=>_.id===s.id)?.seats||0,y=f>0,v=pt.find(_=>_.proposed_by===s.id)||null,x=!!v,b=!!v&&Pt===v.id;let h="";if(!y)h='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(x&&!b)h='<div class="cf-note">You have already submitted a proposal for this election. Use <strong>Edit Proposal</strong> on your card below to change the membership.</div>';else{const _=new Set(Q),S=T=>(T||[]).map(E=>E.replace(/_/g," ")).join(", "),L=G.map(T=>{const E=T.id===s.id,C=E||_.has(T.id),P=T.seats||0,R=T.party_color||"#888",ft=(pe[T.id]||[]).map(J=>$t.find(Ct=>Ct.id===J)).filter(Boolean).map(J=>`<div class="cf-platform">
                <span class="cf-platform-label"><span class="cf-platform-icon">${J.icon}</span> ${Y(J.name)}</span>
                <span class="cf-platform-stats">
                    <span class="cf-stat-up">&uarr; ${S(J.improve)}</span>
                    <span class="cf-stat-down">&darr; ${S(J.worsen)}</span>
                </span>
            </div>`).join(""),q=ft?`<div class="cf-check-platforms">${ft}</div>`:'<div class="cf-check-platforms cf-check-platforms--empty">No adopted platforms.</div>',X=ze(T);return`<div class="cf-party-check ${C?"checked":""} ${E?"disabled":""}" data-party-id="${T.id}" style="border-left:3px solid ${R};">
                <div class="cf-party-info">
                    <div class="cf-check-box">${C?"✓":""}</div>
                    <span class="cf-check-name">${Y(T.faction_name)}</span>
                    ${X}
                    <span class="cf-check-seats">${P} seats</span>
                </div>
                ${q}
            </div>`}).join(""),M=Q.reduce((T,E)=>T+(G.find(C=>C.id===E)?.seats||0),0)||f,I=st?Math.round(M/st*100):0,k=b?"Edit Your Proposal":"Propose a Government",A=b?`Add or remove parties. Saving resets all support — every coalition member must re-vote, including you. You need ${Z}+ seats for a majority.`:`Select which parties will form the coalition. You need ${Z}+ seats for a majority.`,z=b?`<button class="cf-submit-btn" id="cf-save-edit-btn" data-formation-id="${v.id}">Save Changes</button>
               <button class="cf-submit-btn" id="cf-cancel-edit-btn" style="background:var(--bg-body);color:var(--text-dim);margin-left:8px;">Cancel</button>`:'<button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>';h=`
            <div class="cf-propose-section">
                <div class="cf-section-title">${k}</div>
                <div class="cf-section-desc">${A}</div>
                <div class="cf-party-grid" id="cf-party-grid">${L}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${M}</span> / ${st}
                    (<span id="cf-preview-pct">${I}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${Z} seats</span>
                </div>
                ${z}
            </div>`}const u=pt.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${pt.map(_=>{const S=G.find(q=>q.id===_.proposed_by),L=_.party_ids||[],M=L.reduce((q,X)=>q+(G.find(J=>J.id===X)?.seats||0),0),I=st?Math.round(M/st*100):0,k=M>=Z,A=L.map(q=>{const X=G.find(Ct=>Ct.id===q),J=ze(X);return`<span class="cf-party-chip" style="border-left:2px solid ${X?.party_color||"#888"};">${Y(X?.faction_name||"?")} · ${X?.seats||0}${J?" "+J:""}</span>`}).join("");let z="";_.iAmSupporting?z='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':_.iAmInvited?z='<span class="cf-status cf-status--invited">INVITED</span>':z='<span class="cf-status cf-status--locked">NOT INVITED</span>';const T=_.iAmInvited&&!_.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${_.id}" data-action="support">Support This Coalition</button>`:_.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${_.id}" data-action="withdraw">Withdraw Support</button>`:"",E=_.supportCount>=_.coalitionSize,P=_.proposed_by===s.id&&!E&&Pt!==_.id?`<button class="cf-edit-btn" data-formation-id="${_.id}" data-action="edit" style="margin-left:8px;background:var(--bg-body);color:var(--accent);border:1px solid var(--accent);padding:4px 10px;font-family:var(--font-mono);font-size:9px;cursor:pointer;">Edit</button>`:"",R=Mt===_.id,O=E&&_.iAmInvited&&!R,ft=E&&R;return`<div class="cf-proposal-card ${_.iAmSupporting?"supporting":""} ${_.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${Y(S?.faction_name||"Unknown")} Coalition ${z}${P}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${k?"var(--green)":"var(--red)"};">${M}</span> (${I}%) ${k?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${A}</div>
                <div class="cf-proposal-support">Support: ${_.supportCount} / ${_.coalitionSize} coalition members ${E?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${T}
                ${O?`<button class="cf-support-btn" data-formation-id="${_.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${ft?Mi(_):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`${t}${i}
    <div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${d}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${m}</span>
                <div>
                    <div class="cf-banner-title">${l}</div>
                    <div class="cf-banner-subtitle">${c}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${d}" style="width:${r}%;"></div></div>
                <div class="cf-countdown-text">${o>0?o+" tick"+(o!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}</div>
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
                    <div class="cf-penalty-val" style="color:var(--red);">-${p}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${h}
        ${u}
    </div>`,b||(Q=[s.id]),Ai(e)}const Ci={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"};function Ii(e){const t=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"],a=["interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];return be(e)?t:mt(e)?a:t}function Mi(e){const t=(e.party_ids||[]).map(d=>G.find(m=>m.id===d)).filter(Boolean),a=(e.party_ids||[]).includes(N.faction?.id);K={...e.ministry_assignments||{}};const s=N.faction?.id,n=K.prime_minister,o=n===s;let r=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const d of ma){const m=Ci[d]||d,l=d==="prime_minister",c=K[d];a&&(r+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${l?"700":"400"};color:${l?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${m}</span>
                <select data-ministry="${d}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(f=>`<option value="${f.id}" ${c===f.id?"selected":""}>${Y(f.faction_name)} (${f.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const p=!!K.prime_minister;if(p&&o)r+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(p&&!o){const d=t.find(m=>m.id===n);r+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${Y(d?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else r+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return r+="</div>",r}async function Si(e,t){if(ne)return;const a=K.prime_minister;if(!a){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(K)),console.log("[Coalition] Formation:",e.id,"PM party:",a),ne=!0;const i=document.getElementById("cf-form-gov-btn");i&&(i.disabled=!0,i.textContent="FORMING...");try{const s=N.nation,n=s.id,o=Ut(s?.name)||{},r=o.firstNames||["Alex","Maria","Carlos"],p=o.lastNames||["Garcia","Torres","Silva"],d={};for(const[b,h]of Object.entries(K||{}))h&&(d[b]={first_name:r[Math.floor(Math.random()*r.length)],last_name:p[Math.floor(Math.random()*p.length)],age:35+Math.floor(Math.random()*25)});const{error:m}=await B.from("government_formations").update({ministry_assignments:K,minister_names:d}).eq("id",e.id);if(m)throw new Error("Failed to save assignments: "+m.message);let l=!1;try{const b=Bt?Bt(null,s):{},{error:h}=await B.rpc("finalize_government_formation",{p_formation_id:e.id,p_caller_faction_id:N.faction.id,p_ministry_baselines:b||{}});if(h)throw h;l=!0}catch(b){console.warn("[Coalition] RPC failed, using fallback:",b.message)}l||await Li(e),await B.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id),await B.from("government_formations").update({status:"dissolved"}).eq("nation_id",n).neq("id",e.id).in("status",["active","caretaker","formed"]);const f=Ii(s).length,{count:y}=await B.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",n).eq("is_active",!0),{count:v}=await B.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",n).eq("is_active",!0).is("party_id",null);(!y||y<f||v&&v>0)&&(console.warn(`[Coalition] Ministry invariant check failed (expected=${f}, active=${y||0}, vacant=${v||0}) — populating from assignments`),await ia(n));const x={id:e.id,party_ids:e.party_ids||[],lead_party_id:K.prime_minister};await je(B,n,N.nation,"election",x,G,dt,N.shard?.current_date||"",Number(N.nation?.gov_approval??50)),await pa(B,n,a,dt,{skipCoalitionCheck:!0}),xt=!1,alert("Government formed successfully!"),await ot(t)}catch(s){console.error("[Coalition] Form government failed:",s),alert("Failed to form government: "+(s.message||s))}finally{ne=!1,i&&(i.disabled=!1,i.textContent="FORM GOVERNMENT")}}async function Li(e){const t=N.nation.id,{error:a}=await B.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",e.id);a&&console.warn("[Coalition] Failed to cancel rival formations:",a.message);const{error:i}=await B.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);if(i)throw i;const{error:s}=await B.from("nations").update({failed_formation_attempts:0}).eq("id",t);s&&console.warn("[Coalition] Failed to reset formation attempts:",s.message),await ia(t);const n={id:e.id,party_ids:e.party_ids||[],lead_party_id:K.prime_minister};await je(B,t,N.nation,"election",n,G,dt,N.shard?.current_date||"",Number(N.nation?.gov_approval??50));try{const o=K.prime_minister,r=G.find(d=>d.id===o),p=(e.party_ids||[]).map(d=>{const m=G.find(l=>l.id===d);return m?`${m.faction_name} (${m.seats||0})`:null}).filter(Boolean).join(", ");await B.from("event_log").insert({nation_id:t,event_name:"Coalition Government Formed",category:"government",fired_at_tick:dt,description_used:`${r?.faction_name||"PM party"} formed a coalition government with: ${p}`,description_chosen:`${r?.faction_name||"PM party"} formed a coalition government with: ${p}`})}catch(o){console.warn("[Coalition] event_log insert failed (non-fatal):",o.message)}}async function ia(e){let t=0;for(const[a,i]of Object.entries(K)){if(!i)continue;const s=Ut(N.nation?.name)||{},n=s.firstNames||["Alex","Maria","Carlos"],o=s.lastNames||["Garcia","Torres","Silva"],r=n[Math.floor(Math.random()*n.length)],p=o[Math.floor(Math.random()*o.length)],d=35+Math.floor(Math.random()*25),m=Bt?Bt(a,N.nation):{},{data:l,error:c}=await B.from("ministries").update({party_id:i,minister_first_name:r,minister_last_name:p,minister_age:d,minister_approval:50,stat_baselines:m,is_active:!0}).eq("nation_id",e).eq("ministry_key",a).select("id");if(c)console.error(`[Coalition] FAILED to update ministry ${a}:`,c.message);else if(!l||l.length===0){const{error:f}=await B.from("ministries").insert({nation_id:e,ministry_key:a,ministry_name:fa[a]||a,party_id:i,minister_first_name:r,minister_last_name:p,minister_age:d,minister_approval:50,stat_baselines:m,is_active:!0});f?console.error(`[Coalition] FAILED to insert ministry ${a}:`,f.message):t++}else t++}console.log(`[Coalition] Updated ${t} ministries for nation ${e}`)}async function Pi(){if(!Et){pt=[];return}const{data:e}=await B.from("government_formations").select("*").eq("election_id",Et).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const a of e||[]){const{data:i}=await B.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),s=a.party_ids||[],o=(i||[]).filter(l=>s.includes(l.faction_id)).filter(l=>l.supports).length,r=s.length,d=(i||[]).find(l=>l.faction_id===N.faction?.id)?.supports===!0,m=s.includes(N.faction?.id);t.push({...a,supportCount:o,coalitionSize:r,iAmSupporting:d,iAmInvited:m})}pt=t}let Re=!1;function Ai(e){Re||(Re=!0,e.addEventListener("click",async t=>{const a=t.target.closest(".cf-party-check:not(.disabled)");if(a){const n=a.dataset.partyId,r=G.find(m=>m.id===n)?.bloc_id||null,p=!Q.includes(n),d=r?G.filter(m=>m.bloc_id===r).map(m=>m.id):[n];for(const m of d){const l=Q.indexOf(m);p&&l===-1&&Q.push(m),!p&&l>-1&&Q.splice(l,1);const c=e.querySelector(`.cf-party-check[data-party-id="${m}"]`);if(!c)continue;c.classList.toggle("checked",p);const f=c.querySelector(".cf-check-box");f&&(f.textContent=p?"✓":"")}Ti();return}if(t.target.closest("#cf-propose-btn")){await Ni(e);return}const i=t.target.closest(".cf-edit-btn");if(i&&i.dataset.action==="edit"){const n=i.dataset.formationId,o=pt.find(r=>r.id===n);o&&o.proposed_by===N.faction?.id&&(Pt=n,Q=[...o.party_ids||[]],await ot(e));return}if(t.target.closest("#cf-save-edit-btn")){const n=t.target.closest("#cf-save-edit-btn").dataset.formationId;await zi(n,e);return}if(t.target.closest("#cf-cancel-edit-btn")){Pt=null,Q=[N.faction?.id].filter(Boolean),await ot(e);return}const s=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(s){const n=s.dataset.formationId,o=s.dataset.action;if(o==="configure"){Mt=n;const r=pt.find(p=>p.id===n);r&&(K={...r.ministry_assignments||{}}),await ot(e)}else await Ri(n,o==="support",e);return}if(t.target.closest("#cf-form-gov-btn")){const n=pt.find(o=>o.id===Mt);n&&await Si(n,e);return}}),e.addEventListener("change",t=>{const a=t.target.closest(".cf-ministry-select");if(!a)return;const i=a.dataset.ministry,s=a.value||null;K[i]=s,Mt&&B.from("government_formations").update({ministry_assignments:K}).eq("id",Mt).then(({error:o})=>{o&&console.warn("[Coalition] Failed to save assignment:",o.message)});const n=document.getElementById("cf-form-gov-btn");if(n){const o=!!K.prime_minister;n.disabled=!o,n.style.color=o?"#000":"var(--text-dim)",n.style.background=o?"var(--green)":"var(--bg-body)",n.style.borderColor=o?"var(--green)":"var(--border-main)",n.style.cursor=o?"pointer":"not-allowed"}}))}function Ti(){const e=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const i=Q.reduce((o,r)=>o+(G.find(p=>p.id===r)?.seats||0),0),s=st?Math.round(i/st*100):0,n=i>=Z;e.textContent=i,e.style.color=n?"var(--green)":"var(--text-bright)",t.textContent=s,a.textContent=n?`✓ Meets ${Z}-seat threshold`:`— needs ${Z} seats`,a.style.color=n?"var(--green)":"var(--text-dim)"}async function Ni(e){if(wt)return;const t=N.faction;if((G.find(o=>o.id===t.id)?.seats||0)===0)return;const i=[...new Set(Q)],s=i.reduce((o,r)=>o+(G.find(p=>p.id===r)?.seats||0),0);if(s<Z){alert(`Coalition needs ${Z} seats. Currently: ${s}.`);return}wt=!0;const n=document.getElementById("cf-propose-btn");n&&(n.disabled=!0,n.textContent="Submitting...");try{const{data:o}=await B.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:r,error:p}=await B.from("government_formations").insert({nation_id:N.nation.id,election_id:Et,proposed_by:t.id,party_ids:i,status:"active",game_year:o?.current_date||""}).select().single();if(p){alert("Error: "+p.message);return}const{error:d}=await B.from("government_formation_support").upsert({formation_id:r.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});d&&console.warn("[Coalition] Auto-support insert failed:",d.message),await ot(e)}catch(o){console.error("[Coalition] Create proposal error:",o),alert("Failed to create proposal: "+(o.message||o))}finally{wt=!1}}async function zi(e,t){if(wt||!N.faction)return;const i=[...new Set(Q)],s=i.reduce((o,r)=>o+(G.find(p=>p.id===r)?.seats||0),0);if(s<Z){alert(`Coalition needs ${Z} seats. Currently: ${s}.`);return}wt=!0;const n=document.getElementById("cf-save-edit-btn");n&&(n.disabled=!0,n.textContent="Saving...");try{const{data:o,error:r}=await B.rpc("update_coalition_proposal",{p_formation_id:e,p_party_ids:i});if(r){alert("Failed to save changes: "+r.message);return}if(o&&o.success===!1){alert("Failed to save changes: "+(o.error||"unknown"));return}Pt=null,await ot(t)}catch(o){console.error("[Coalition] Update proposal error:",o),alert("Failed to save changes: "+(o.message||o))}finally{wt=!1}}async function Ri(e,t,a){try{const{error:i}=await B.from("government_formation_support").upsert({formation_id:e,faction_id:N.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});i&&console.error("[Coalition] Toggle support error:",i.message),await ot(a)}catch(i){console.error("[Coalition] Toggle support error:",i)}}let Ot=null,ut=[],me=[],fe=null;function et(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Fe(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?Math.round(e/1e3)+"k":String(e)}function Fi(e){return["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]+", "+(2e3+Math.floor(e/12))}function Oi(e,t){if((e.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const i=t?.end_reason||"";return i.includes("no_confidence")||i.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:i.includes("snap")||i.includes("dissolved")||i.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function Bi(e,t){Ot=t;const a=document.getElementById("pa-past-elections-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const i=t.nation?.id;if(!i){a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,n,o]=await Promise.all([e.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",i).eq("status","completed").order("election_tick",{ascending:!1}),e.from("administrations").select("*").eq("nation_id",i).order("started_at_tick",{ascending:!1}),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i).eq("faction_type","party").is("abandoned_at",null)]);ut=s.data||[],me=n.data||[];const r=o.data||[],p={};for(const d of r)p[d.id]=d;for(const d of ut){const m=d.results?.votes||[];for(const l of m){const c=p[l.party_id];c?(l.color=c.party_color||"#666",l.abbreviation=c.abbreviation||l.party_name?.slice(0,3)?.toUpperCase()||"?"):(l.color="#666",l.abbreviation=l.party_name?.slice(0,3)?.toUpperCase()||"?")}}Di(a),oa(a)}function Di(e){e.addEventListener("click",t=>{const a=t.target.closest("[data-election-id]");if(a){const i=a.dataset.electionId;fe=fe===i?null:i,oa(e)}})}function oa(e,t){if(ut.length===0){e.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const a=Ot.faction?.id,i=Ot.nation?.total_seats||100,s=Math.ceil(i/2)+1,n=ut.map((o,r)=>{const p=fe===o.id,d=(o.results?.votes||[]).sort((k,A)=>(A.seats||0)-(k.seats||0)),m=d.slice(0,3),l=o.results?.turnout_pct??0,c=o.results?.total_votes_cast??0,f=o.results?.sector_breakdown?.independent_seats??0,y=Fi(o.election_tick),v=me.find(k=>k.started_at_tick>=o.election_tick&&k.started_at_tick<=o.election_tick+5),x=me.find(k=>k.ended_at_tick!=null&&k.ended_at_tick>=o.election_tick-2&&k.ended_at_tick<=o.election_tick+2),b=Oi(o,x),h=mt(Ot.nation),u=h?"President":"PM",_=v?.prime_minister||"Unknown",S=v?.pm_party_id&&d.find(k=>k.party_id===v.pm_party_id)?.color||"#888",M=(r<ut.length-1?ut[r+1]:null)?.results?.votes||[];let I=`<div data-election-id="${o.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${p?"border-bottom:none;":""}
        ">
            <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                    <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${y}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${b.color};background:${b.color}0a;border:1px solid ${b.color}25;">${b.label.toUpperCase()}</span>
                    <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                        ${m.map(k=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${k.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${et(k.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${k.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${u}: <span style="color:${S};font-weight:700;">${et(_)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${p?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(p){const k=d.map(C=>`<div style="width:${C.seats/i*100}%;background:${C.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${C.seats>=8?9:6}px;font-weight:700;color:#000;">${C.seats>=5?C.seats:""}</div>`).join(""),A=f>0?`<div style="width:${f/i*100}%;background:#ffffff;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${f>=8?9:6}px;font-weight:700;color:#000;" title="Independents">${f>=5?f:""}</div>`:"",z=k+A,T=d.map(C=>{const P=C.party_id===a,R=M.find(X=>X.party_id===C.party_id),O=R?C.seats-(R.seats||0):null,q=C.seats/i*100-(C.vote_percentage||0);return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${P?`background:${C.color}08;`:""}">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:${C.color}15;border:1px solid ${C.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${C.abbreviation?.slice(0,2)||"?"}</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${et(C.party_name)}</span>
                            ${P?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${C.color};">${et(C.abbreviation)}</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${C.seats}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${O!=null?O>0?"#5c5":O<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${O!=null?O>0?"▲ "+O:O<0?"▼ "+Math.abs(O):"—":"NEW"}</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${Fe(C.votes||0)}</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(C.vote_percentage||0).toFixed(1)}%</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(q)<2?"var(--text-dim)":q>0?"#5c5":"#c84"};">${q>0?"+":""}${q.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(q)<2?"proportional":q>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("")+(f>0?`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;color:#fff;">IN</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);">Independents</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:#cccccc;">IND</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${f}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">—</span>
                </div>`:"");let E="";if(v){const C=v.coalition_parties||[],P=v.total_seats||C.reduce((tt,Tt)=>tt+(Tt.seats||0),0),R=P>=s,O=R?"Majority Coalition":"Minority Coalition",ft=v.ended_at_tick?v.end_reason||"Ended":"Current Government",q=v.ended_at_tick?"var(--text-dim)":"#5c5",X=v.ended_at_tick?Math.abs(v.ended_at_tick-v.started_at_tick)+" ticks":"Ongoing",J=C.map(tt=>{const Tt=d.find(Vt=>Vt.party_id===tt.party_id)?.color||"#666";return`<div style="width:${P>0?(tt.seats||0)/P*100:0}%;background:${Tt};height:100%;"></div>`}).join(""),Ct=C.map(tt=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${d.find(Vt=>Vt.party_id===tt.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${et(tt.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${tt.seats||0}</span>
                    </div>`).join("");E=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${S};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${q};background:${q}0a;border:1px solid ${q}25;">${et(ft.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${X}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${S}15;border:1.5px solid ${S};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${S};">${et(_.split(" ").map(tt=>tt[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${et(_)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${h?"President":"Prime Minister"} &middot; ${et(v.pm_party_name||"")} &middot; ${O}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${J}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${Ct}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${R?"#5c5":"#c84"};">${P} seats ${R?"(majority +"+(P-s)+")":"(minority, "+(s-P)+" short)"}</span>
                        </div>
                    </div>
                </div>`}I+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${et(b.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${l>70?"#5c5":l>60?"#ca5":"#c84"};">${l.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${Fe(c)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${z}</div>
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
                    ${T}
                </div>

                ${E}
            </div>`}return I}).join("");e.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${ut.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${n}</div>
    </div>`}let nt=null,ve=!1,Oe=!1,ue=!1,Be=!1,ge=!1;function na(e){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===e)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+e)),sessionStorage.setItem("party_subtab",e),e==="actions"&&!ve&&nt&&(ve=!0,Ke(ht,nt)),e==="parties"&&!Oe&&nt&&(Oe=!0,pi(ht,nt,"pa-parties-root")),e==="election"&&!ue&&nt&&(ue=!0,ge?ot(document.getElementById("pa-election-root")):aa(ht,nt).then(()=>{ge=!0,ot(document.getElementById("pa-election-root"))})),e==="past-elections"&&!Be&&nt&&(Be=!0,Bi(ht,nt))}document.getElementById("pa-subtabs").addEventListener("click",e=>{const t=e.target.closest(".pa-subtab");!t||t.classList.contains("active")||na(t.dataset.panel)});la("politics",async e=>{nt=e,aa(ht,e).then(({needed:a})=>{if(ge=!0,a){const i=document.querySelector('.pa-subtab[data-panel="election"]');i&&!i.querySelector(".pa-subtab-badge")&&(i.innerHTML+='<span class="pa-subtab-badge"></span>');const s=document.querySelector('.nav-tab[data-tab="politics"]');s&&!s.querySelector(".pa-subtab-badge")&&(s.innerHTML+='<span class="pa-subtab-badge"></span>')}ue&&ot(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?na(t):(ve=!0,await Ke(ht,e))});
