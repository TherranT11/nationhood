import{_supabase as yt}from"./supabase-client-qEAQbBjE.js";/* empty css                  */import{r as na}from"./role-actions-fros7AI4.js";import{l as sa,d as Re,i as ra}from"./common-DmwJUj0E.js";import{g as Dt,U as la,a9 as da,W as ca}from"./political-actions-CoM-LDWz.js";import{d as V,f as ve,h as lt,o as Ct,c as ue,s as pa,M as ma}from"./government-structure-C17uG6rl.js";import{GAME_CONFIG as dt,FORMATION_DEADLINE_TICKS as ie}from"./config-CHsHqv7d.js";import{f as fa}from"./no-confidence-DFJc0-tL.js";import{i as va,e as ua,g as ga,j as Fe}from"./elections-C52I2neg.js";import{a as Nt}from"./stats-4gK98flh.js";import{tickToDate as ya}from"./utils-A98FEun4.js";import"./preload-helper-BXl3LOEh.js";import"./corp-topbar-BVNorCyj.js";import"./bills-Dj4cm7r1.js";import"./corp-valuation-DvpMrhZz.js";import"./presidential-TI98mICO.js";const ht=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],_e={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},ge=new Set(["unrest","crime","corruption","cost_of_living","debt"]),ba=new Set(["income_tax","corporate_tax"]);function we(e,t){const a=ge.has(e),i=ba.has(e);return t==="improve"?a?{arrow:"↓",color:"#5cc55c"}:i?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:i?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function $e(e){switch(e){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${e} rivals) — minimal momentum`}}}function xa(e,t){return e.map(a=>{const i=ht.find(n=>n.id===a.platform_key);if(!i)return{...a,stats:[]};const r=i.improve.map(n=>{const o=a.baseline_stats?.[n],p=a.target_stats?.[n],d=Number(t?.[n]??50),s=ge.has(n);if(o==null||p==null)return{stat:n,baseline:d,target:d,current:d,progress:0,met:!1};const m=Math.abs(p-o),l=s?Math.max(0,o-d):Math.max(0,d-o),c=m>0?Math.min(1,l/m):1,f=s?d<=p:d>=p;return{stat:n,baseline:o,target:p,current:d,progress:c,met:f}});return{...a,stats:r,platformDef:i}})}const ha=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function ut(e){return e>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:e>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:e>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:e>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function _a(e){var t=Math.max(0,e-20)/65,a=12e4+t*28e4;return Math.round(a/25e3)*25e3}function Ht(e,t){return e+Math.floor(Math.random()*(t-e+1))}function ke(e){return e[Math.floor(Math.random()*e.length)]}function wa(e,t){var a=[],i=new Set,r=Ht(5,7),n=Dt(t),o=n.firstNames||[],p=n.lastNames||[];if(o.length===0||p.length===0)return[];for(var d=ha.slice().sort(function(){return Math.random()-.5}),s=0;s<r;s++){var m,l,c,f=0;do m=ke(o),l=ke(p),c=m+" "+l,f++;while(i.has(c)&&f<20);i.add(c);var y=Ht(20,85),v=Ht(25,60),h=d[s%d.length],x=_a(y);a.push({nation_id:e,first_name:m,last_name:l,age:v,skill:y,background:h,hire_cost:x,status:"available"})}return a.sort(function(b,g){return g.skill-b.skill}),a}async function Oe(e,t,a){var{data:i}=await e.from("nations").select("government_type").eq("id",t).maybeSingle();if(V(i)){var{data:r}=await e.from("factions").select("seats").eq("id",a).maybeSingle();return oe({partyId:a,partySeats:r?.seats,admin:null,ministryHolder:!1,nation:i})}var[n,o,p,d]=await Promise.all([ve(e,t).catch(function(b){return console.warn("[Agitator] fetchActiveCoalition failed:",b?.message||b),null}),e.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("head_of_government").select("faction_id").eq("nation_id",t).eq("active",!0).maybeSingle(),e.from("presidents").select("faction_id").eq("nation_id",t).eq("is_active",!0).maybeSingle()]);if(o.error)return console.error("[Agitator] Failed to check governing status:",o.error.message),{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var s=o.data,m=n,l=lt(i),c=p?.data?.faction_id||null,f=d?.data?.faction_id||null,y=Array.isArray(m?.party_ids)?m.party_ids.map(function(b){return{party_id:b}}):[];if(s){s.pm_party_id=c,s.president_party_id=f;var v=Array.isArray(s.coalition_parties)?s.coalition_parties:[];v.length===0&&y.length>0&&(s.coalition_parties=y)}else(m||c||f)&&(s={pm_party_id:c,president_party_id:f,coalition_parties:y});var h=!1;if(l){var{count:x}=await e.from("ministries").select("*",{count:"exact",head:!0}).eq("nation_id",t).eq("party_id",a).eq("is_active",!0);h=(x||0)>0}return oe({partyId:a,partySeats:null,admin:s,ministryHolder:h,nation:i})}function $a(e,t,a,i){return oe({partyId:e?.id,partySeats:e?.seats,admin:t,ministryHolder:a?a.has(e?.id):!1,nation:i})}function oe({partyId:e,partySeats:t,admin:a,ministryHolder:i,nation:r}){if(V(r)){var n=Number(t||0)>=1;return{isGoverning:n,isOpposition:!n,label:n?"LOYAL":"DISSIDENT",administration:null}}if(!a)return{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var o=Array.isArray(a.coalition_parties)?a.coalition_parties:[],p=o.some(function(l){return l?typeof l=="string"?l===e:typeof l=="object"?(l.party_id||l.id)===e:!1:!1}),d=a.pm_party_id===e,s=a.president_party_id===e,m=d||p||s||lt(r)&&!!i;return{isGoverning:m,isOpposition:!m,label:m?"GOVERNING":"OPPOSITION",administration:a}}async function Be(e,t){var{data:a,error:i}=await e.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return i?(console.error("[Agitator] Failed to fetch agitator:",i.message),null):a}async function ka(e,t,a){var{data:i,error:r}=await e.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(r)return console.error("[Agitator] Failed to fetch pool:",r.message),[];if(i&&i.length>0)return i;var n=wa(t,a),{data:o,error:p}=await e.from("agitator_pool").insert(n).select("*");return p?(console.error("[Agitator] Failed to insert pool:",p.message),[]):(o||[]).sort(function(d,s){return s.skill-d.skill})}async function Ea(e,t,a,i){var r=await Be(e,t);if(r)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:n,error:o}=await e.from("faction_agitators").insert({faction_id:t,first_name:a.first_name,last_name:a.last_name,age:a.age,skill:a.skill,background:a.background,status:"active",hired_at_tick:i}).select("*").single();if(o)return console.error("[Agitator] Failed to hire:",o.message),{success:!1,agitator:null,error:o.message};var{error:p}=await e.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",a.id);return p&&console.error("[Agitator] Failed to mark pool candidate as hired:",p.message),{success:!0,agitator:n,error:null}}const zt=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],De=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function ye(e){return e<=5?{tier:1,label:"Clean Government",color:"#c55"}:e<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:e<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const st={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5},gov:{momentum:3}},2:{resolution:"PARTIAL WIN",filer:{momentum:3},gov:{momentum:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7},gov:{momentum:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12},gov:{momentum:-10}}},Ee={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function $t(e,t){var a=e;for(var i in t)a=a.split("{"+i+"}").join(t[i]);return a}async function Ca(e,t){var{factionId:a,nationId:i,agitatorId:r,targetMinistry:n,basis:o,currentTick:p,partyName:d,administration:s}=t,m,l,c;if(o==="civil_rights"){var f=Number(s?.stats_at_start?.freedom_index??50);l=50,m=f,c=Math.max(0,m-l)}else{var y=Number(s?.stats_at_start?.corruption??50);l=50,m=y,c=Math.max(0,l-m)}var y=m,v=l,h=ye(c),x=st[h.tier],b=p+8,g=zt.find(function(M){return M.key===n}),$=g?"Ministry of "+g.label:n,P=De.find(function(M){return M.key===o}),S=P?P.label:o,{data:I,error:C}=await e.from("lawsuits").insert({faction_id:a,nation_id:i,agitator_id:r,target_ministry:n,basis:o,filed_at_tick:p,resolves_at_tick:b,corruption_at_start:y,corruption_at_filing:v,corruption_growth:c,tier:h.tier,status:"active",resolution:null,momentum_effect:x.filer.momentum,gov_momentum_effect:x.gov.momentum}).select("*").single();if(C)return{success:!1,lawsuit:null,tier:0,error:C.message};var k=Ee[h.tier]||Ee[1],A={party:d||"Opposition",ministry:$,basis:S},T=[{event_tick:p,event_type:"filing",headline:$t(k.filing,A)},{event_tick:p+2,event_type:"discovery",headline:$t(k.discovery,A)},{event_tick:p+5,event_type:"evidence",headline:$t(k.evidence,A)},{event_tick:p+7,event_type:"pre_trial",headline:$t(k.pre_trial,A)},{event_tick:b,event_type:"resolution",headline:$t(k.resolution,A)}],j=T.map(function(M){return{lawsuit_id:I.id,nation_id:i,event_tick:M.event_tick,event_type:M.event_type,headline:M.headline,is_fired:M.event_tick===p}}),{error:L}=await e.from("lawsuit_events").insert(j);L&&console.error("[Lawsuits] Failed to insert milestone events:",L.message);var{error:E}=await e.from("event_log").insert({nation_id:i,event_name:"LAWSUIT FILED",event_type:"lawsuit",category:"political",description_chosen:T[0].headline,fired_at_tick:p,faction_id:a||null,effects_applied:{lawsuit_id:I.id,tier:h.tier,target_ministry:$,basis:S,milestone:"filing"}});return E&&console.warn("[Lawsuits] event_log insert (filing) failed:",E.message),{success:!0,lawsuit:I,tier:h.tier,error:null}}async function Ia(e,t){var{data:a,error:i}=await e.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return i?(console.error("[Lawsuits] Failed to fetch lawsuits:",i.message),[]):a||[]}let w=null,u=null,Q="leader",at=[],Rt=[],G=null,B=null,mt=!1,R=null,ne=[],xt=!1,D=null,it=!1,Et=[],St=!1,Ut=!1,At=new Set;function _(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Z(e,t){return((e||"?")[0]+(t||"?")[0]).toUpperCase()}const je=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Yt=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let ft=0,Ft=0,se=!1;async function Ma(){if(!w||!u?.faction?.id||!u?.shard?.current_tick)return;const{count:e,error:t}=await w.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",u.faction.id).eq("action_type","fundraise").eq("tick_performed",u.shard.current_tick);ft=!t&&e!=null?e:0}async function Sa(){if(Ft=0,se=!1,!w||!u?.nation?.id||!u?.shard?.current_tick)return;const e=u.shard.current_tick,t=R?.pm_party_id;try{const{data:a}=await w.from("bills").select("id").eq("nation_id",u.nation.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(se=!!(a&&a.length),t){const{data:i}=await w.from("campaign_actions").select("tick_performed").eq("nation_id",u.nation.id).eq("action_type","no_confidence_filed").eq("target_id",t).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(i){const r=e-Number(i.tick_performed||0),n=typeof dt<"u"&&dt.NO_CONFIDENCE_COOLDOWN_TICKS||12;Ft=Math.max(0,n-r)}}}catch(a){console.warn("[PartyActions] loadNoConfidenceState failed:",a?.message||a)}}function Ge(e,t){const a=Yt[Math.min(t,Yt.length-1)],i=e*a.perSeat,r=Math.max(1,Math.floor(e/a.momDivisor));return{raised:i,momCost:r,perSeat:a.perSeat,tierIdx:Math.min(t,Yt.length-1)}}const qe=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1},{id:"call_snap_election",name:"Call Snap Election",desc:"Schedule a snap parliamentary election for next tick. Any party leader can call. Cancels any existing scheduled parliamentary election. 3-tick per-party cooldown.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE"],locked:!1},{id:"call_early_elections",name:"Call Early Elections",desc:"Dissolve the legislature and call snap elections. PM-only. Government enters caretaker status; election fires after a short formation window. Momentum impact is tiered by Gov. Approval: >50 boosts PM party (+3), <35 boosts opposition (+5 each) and +3 stability, 35–50 is neutral.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","PM ONLY"],locked:!1},{id:"resign_as_pm",name:"Resign as Prime Minister",desc:"Step down from the Prime Minister seat. PM-only. Coalition enters caretaker status and has a 3-tick window to nominate a successor via the cabinet panel. If a new PM is installed the administration continues under new leadership; otherwise a snap election fires. Cost: −3 Momentum, −0.05 Credibility, −3 Stability, 12-tick bar from PM on your party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["GOVERNMENT","PM ONLY"],locked:!1},{id:"no_confidence",name:"Vote of No Confidence",desc:"File a motion of no confidence against the Prime Minister. If a simple majority votes YES, the government falls and snap elections are triggered. PASS: +15 Momentum to you, -10 Momentum to the PM’s party. FAIL: -10 Momentum to you. 12-tick cooldown on the targeted PM party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1},{id:"leave_coalition",name:"Leave Coalition",desc:"Walk out of the current governing coalition. Any ministries your party holds are vacated. You drop from governing to opposition. Coalition flips to minority if your exit drops it below the majority threshold. Cost: −3 Momentum to you, −5 Momentum to the PM’s party. 12-tick cooldown. PM’s party cannot use this — resign first.",cost:"−3 MOM",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","RISKY"],locked:!1},{id:"disband_party",name:"Disband Party",desc:"Voluntarily dissolve your party. Your seats are vacated and sit empty until the next election (no backfill or redistribution). All party funds and momentum are lost. You are removed from every nation chat. Cannot be undone. 24-tick cooldown per user. Cannot be used while Prime Minister, sitting President, or reigning Monarch — step down first.",cost:"IRREVERSIBLE",costColor:"#c55",moneyCost:0,tags:["IRREVERSIBLE"],locked:!1}],La=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],jt={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},Ce=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],Ie=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function He(e,t){w=e,u=t;const a=document.getElementById("pa-actions-root");if(!a)return;const i=t.faction;if(!i){a.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}try{const{data:l}=await w.from("factions").select("momentum, party_funds, seats, action_points, bloc_id").eq("id",i.id).single();l&&(i.momentum=l.momentum??i.momentum,i.party_funds=l.party_funds??i.party_funds,i.seats=l.seats??i.seats,i.action_points=l.action_points??i.action_points,i.bloc_id=l.bloc_id??null)}catch(l){console.warn("[PartyActions] faction refresh failed, using cached state:",l)}const[r,n,o,p,d,s]=await Promise.all([w.from("faction_platforms").select("*").eq("faction_id",i.id).order("slot"),w.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),Be(w,i.id),Oe(w,t.nation?.id,i.id),w.from("faction_electoral_standing").select("visibility, raw_appeal").eq("faction_id",i.id).eq("nation_id",t.nation?.id).maybeSingle(),ve(w,t.nation?.id)]);t.nation&&(t.nation.__coalition_status=s?.status||null),r.error&&console.error("[PartyActions] Failed to load faction platforms:",r.error.message),n.error&&console.error("[PartyActions] Failed to load nation platforms:",n.error.message),at=r.data||[],Rt=n.data||[],G=o,mt=p.isOpposition,R=p.administration,d.data,await Ma(),await Sa();const{data:m}=await w.from("faction_deputies").select("*").eq("faction_id",i.id).eq("status","active").maybeSingle();B=m||null,G&&(ne=await Ia(w,i.id)),await It(i.id,t.nation?.id),H(a)}function Ue(e){return e?{isPM:!!R&&R.pm_party_id===e.id,isPresident:u?.nation?.hos_election_method==="elected"&&R?.president_party_id===e.id,isMonarchActing:V(u?.nation)&&u?.nation?.monarch_faction_id===e.id}:{isPM:!1,isPresident:!1,isMonarchActing:!1}}async function It(e,t){if(!e||!t){D=null,it=!1,Et=[];return}try{const{data:a,error:i}=await w.from("bloc_invitations").select("id, bloc_id, invited_by_faction_id, created_at_tick, status, bloc:bloc_id(id,name,leader_faction_id), inviter:invited_by_faction_id(id,faction_name,party_color)").eq("invited_faction_id",e).eq("status","pending").order("created_at_tick",{ascending:!1});if(i)throw i;Et=a||[];const r=u?.faction?.bloc_id||null;if(r){const{data:n,error:o}=await w.from("blocs").select("*").eq("id",r).is("dissolved_at_tick",null).maybeSingle();if(o)throw o;if(n){const{data:p}=await w.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name").eq("bloc_id",n.id).order("seats",{ascending:!1});D={...n,members:p||[]},it=n.leader_faction_id===e}else D=null,it=!1}else D=null,it=!1}catch(a){console.warn("[PartyActions] loadBlocState failed:",a?.message||a)}}function Ye(e){if(!D)return"";const t=it?`<span style="margin-left:6px;font-family:var(--font-mono);font-size:7px;color:${e};letter-spacing:0.08em;">LEADER</span>`:"";return`<span class="pa-bloc-tag" style="display:inline-flex;align-items:center;padding:2px 8px;background:${e}18;border:1px solid ${e}55;color:${e};font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        BLOC &middot; ${_(D.name)}${t}
    </span>`}function Ve(e){if(!D)return"";const t=D.members||[],a=t.reduce((r,n)=>r+(Number(n.seats)||0),0),i=t.map(r=>{const n=r.id===D.leader_faction_id,o=r.party_color||e;return`<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid ${o}44;border-left:3px solid ${o};background:var(--bg-card);font-family:var(--font-mono);font-size:9px;">
            <span style="color:var(--text-bright);font-weight:700;">${_(r.faction_name||"Unknown")}</span>
            <span style="color:var(--text-dim);">${r.seats||0} seats</span>
            ${n?`<span style="color:${o};font-weight:700;letter-spacing:0.08em;">LEADER</span>`:""}
        </span>`}).join("");return`<div style="margin:8px 0;padding:8px 12px;background:${e}0a;border:1px solid ${e}33;border-left:3px solid ${e};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${e};letter-spacing:0.08em;">BLOC &middot; ${_(D.name)}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${t.length} member${t.length!==1?"s":""} &middot; ${a} combined seats</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${i}</div>
    </div>`}function Ke(e){if(!Et||Et.length===0)return"";const t=i=>(Array.isArray(i)?i[0]:i)||null;return`<div style="margin:10px 0 4px;">${Et.map(i=>{const r=t(i.bloc),n=t(i.inviter),o=r?.name||"a bloc",p=n?.faction_name||"A party leader",d=n?.party_color||e,s=At.has(i.id);return`<div style="margin:6px 0;padding:8px 12px;border:1px solid ${d}55;border-left:3px solid ${d};background:${d}08;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="flex:1;">
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${d};letter-spacing:0.08em;">BLOC INVITATION</div>
                <div style="font-size:11px;color:var(--text-bright);margin-top:2px;">
                    <strong>${_(p)}</strong> invites you to join <strong>${_(o)}</strong>.
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--submit" data-invite-id="${_(i.id)}" data-decision="accept"${s?" disabled":""}>Accept</button>
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--cancel" data-invite-id="${_(i.id)}" data-decision="decline"${s?" disabled":""}>Decline</button>
            </div>
        </div>`}).join("")}</div>`}async function be(e){const{data:t}=await w.from("factions").select("bloc_id, momentum").eq("id",e).single();t&&(u.faction.bloc_id=t.bloc_id||null,t.momentum!=null&&(u.faction.momentum=t.momentum))}async function Pa(e,t,a){try{const i=u?.faction?.id;if(!i)throw new Error("No active faction");const r=t==="accept"?"accept_bloc_invite":"decline_bloc_invite",n=t==="accept"?"p_accepting_faction_id":"p_declining_faction_id",{data:o,error:p}=await w.rpc(r,{p_invitation_id:e,[n]:i});if(p)throw p;if(o&&o.success===!1)throw new Error(o.error||"Unknown error");await be(i),await It(i,u.nation?.id),H(a)}catch(i){console.error("[PartyActions] respondToBlocInvite failed:",i),alert(t==="accept"?`Could not accept invitation: ${i.message||i}`:`Could not decline invitation: ${i.message||i}`)}}async function Aa(e){if(!D||Ut)return;const t=D,a=it?`Leaving ${t.name} will DISSOLVE the entire bloc. All ${t.members?.length||0} members will be removed and pending invitations rescinded.

Proceed?`:`Leave the ${t.name} bloc?`;if(confirm(a)){Ut=!0;try{const{data:i,error:r}=await w.rpc("leave_bloc",{p_faction_id:u.faction.id});if(r)throw r;if(i&&i.success===!1)throw new Error(i.error||"Unknown error");await be(u.faction.id),await It(u.faction.id,u.nation?.id),H(e)}catch(i){console.error("[PartyActions] leave_bloc failed:",i),alert(`Could not leave bloc: ${i.message||i}`)}finally{Ut=!1}}}async function Ta(e){const t=document.getElementById("pa-bloc-modal");if(!t||D)return;const a=u.faction,i=a?.color||"#c8a832";t.innerHTML=`
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
    `,t.classList.add("active");const r=new Set;let n=[];const o=()=>t.classList.remove("active");document.getElementById("pa-bloc-close")?.addEventListener("click",o),document.getElementById("pa-bloc-cancel")?.addEventListener("click",o),t.addEventListener("click",l=>{l.target===t&&o()});try{const l=u.nation?.id,{data:c}=await w.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name, leader_age, bloc_id").eq("nation_id",l).eq("faction_type","party").is("abandoned_at",null),f=(c||[]).filter(v=>v.id!==a.id);n=f;const y=document.getElementById("pa-bloc-party-list");if(!y)return;if(f.length===0){y.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No other parties in this nation.</div>';return}y.innerHTML=f.map(v=>{const h=v.party_color||"#7a7a7a",x=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"Party Leader",b=v.bloc_id?"Already in a bloc":null;return`<label class="pa-bloc-party-row" data-party-id="${_(v.id)}" data-ineligible="${b?"1":"0"}"
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
            </label>`}).join(""),y.addEventListener("change",v=>{const h=v.target.closest(".pa-bloc-party-row");if(!h)return;if(h.dataset.ineligible==="1"){v.target.checked=!1;return}const x=h.dataset.partyId;v.target.checked?r.add(x):r.delete(x),m()})}catch(l){console.error("[PartyActions] Create Bloc modal fetch failed:",l);const c=document.getElementById("pa-bloc-party-list");c&&(c.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${_(l.message||String(l))}</div>`)}const p=document.getElementById("pa-bloc-name"),d=document.getElementById("pa-bloc-submit"),s=document.getElementById("pa-bloc-name-count"),m=()=>{const l=(p?.value||"").trim();s&&(s.textContent=`${l.length} / 40`),d&&(d.disabled=!(l.length>0&&r.size>0)||St)};p?.addEventListener("input",m),d?.addEventListener("click",async()=>{if(St)return;const l=(p?.value||"").trim();if(!(l.length===0||r.size===0)){St=!0,d.disabled=!0,d.textContent="Creating...";try{const{data:c,error:f}=await w.rpc("create_bloc",{p_leader_faction_id:a.id,p_name:l,p_invitee_faction_ids:Array.from(r)});if(f)throw f;if(c&&c.success===!1)throw new Error(c.error||"Unknown error");u.faction.party_funds=Math.max(0,(u.faction.party_funds||0)-1e5),await be(a.id),o(),await It(a.id,u.nation?.id),H(e)}catch(c){console.error("[PartyActions] create_bloc failed:",c),alert(`Could not create bloc: ${c.message||c}`),d.disabled=!1,d.textContent="Create Bloc & Send Invites"}finally{St=!1}}})}async function Na(e){if(!D||!it)return;const t=document.getElementById("pa-bloc-modal");if(!t)return;const a=u.faction?.color||"#c8a832";t.innerHTML=`
        <div class="pa-modal" style="width:520px;max-height:75vh;overflow:hidden;display:flex;flex-direction:column;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${a};"></div>
                    <span class="pa-modal-title">Invite to ${_(D.name)}</span>
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
        </div>`,t.classList.add("active");const i=()=>t.classList.remove("active");document.getElementById("pa-blinv-close")?.addEventListener("click",i),document.getElementById("pa-blinv-cancel")?.addEventListener("click",i),t.addEventListener("click",o=>{o.target===t&&i()});const r=u.nation?.id,n=document.getElementById("pa-blinv-list");if(!(!n||!r))try{const{data:o,error:p}=await w.from("factions").select("id, faction_name, seats, party_color, bloc_id").eq("nation_id",r).eq("faction_type","party").is("abandoned_at",null).is("bloc_id",null);if(p){n.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${_(p.message)}</div>`;return}const d=(o||[]).filter(s=>s.id!==u.faction.id);if(d.length===0){n.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No eligible parties to invite.</div>';return}n.innerHTML=d.map(s=>{const m=s.party_color||"#888";return`<div class="pa-blinv-row" data-faction-id="${_(s.id)}" style="padding:8px 10px;border:1px solid ${m}33;border-left:3px solid ${m};display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:var(--bg-card);">
                <div>
                    <div style="font-size:11px;color:var(--text-bright);font-weight:600;">${_(s.faction_name||"Unknown")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${s.seats||0} seats</div>
                </div>
                <button class="pa-modal-btn pa-modal-btn--submit pa-blinv-send" data-faction-id="${_(s.id)}">Invite</button>
            </div>`}).join(""),n.addEventListener("click",async s=>{const m=s.target.closest(".pa-blinv-send");if(!m)return;const l=m.dataset.factionId;if(l){m.disabled=!0,m.textContent="Sending…";try{const{error:c}=await w.rpc("invite_to_bloc",{p_bloc_id:D.id,p_invitee_faction_id:l});if(c)throw c;m.textContent="Invited",await It(u.faction.id,u.nation?.id),H(e)}catch(c){console.warn("[PartyActions] invite_to_bloc failed:",c),alert(`Could not invite: ${c.message||c}`),m.disabled=!1,m.textContent="Invite"}}})}catch(o){console.warn("[PartyActions] openInviteToBlocModal threw:",o),n.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Unexpected error.</div>'}}function H(e){const t=u.faction,a=u.nation,i=V(a),r=i&&a?.monarch_faction_id===t?.id,n=t.color||"#c8a832",o=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",p=t.seats||0,d=a?.total_seats||120,s=d>0?Math.round(p/d*100):0;t.action_points,t.approval_rating;const m=t.momentum??50,l=t.party_funds??0,c=xa(at,a),f=[];for(let x=1;x<=3;x++){const b=at.find(g=>g.slot===x);if(b){const g=ht.find(I=>I.id===b.platform_key),$=c.find(I=>I.id===b.id),P=$?$.stats.filter(I=>I.met).length:0,S=$?$.stats.length:0;f.push({name:g?.name||b.platform_key,status:b.status,metCount:P,totalCount:S,slot:x})}else f.push(null)}const y=f.map(x=>{if(!x)return{label:"No Platform"};const b=x.status==="fulfilled"?" ✓":x.status==="failed"?" ✗":x.status==="abated"?" —":"",g=x.status==="fulfilled"?"fulfilled":x.status==="failed"?"failed":x.status==="abated"?"abated":"filled",$=x.totalCount>0?` (${x.metCount}/${x.totalCount})`:"";return{label:x.name+$+b,statusClass:g,title:`${x.metCount} of ${x.totalCount} stats on target`}}),v="$"+(l>=1e6?(l/1e6).toFixed(1)+"M":l>=1e3?Math.round(l/1e3)+"k":l),h=Math.round(Number(i?u.nation?.public_approval??u.nation?.gov_approval??50:u.nation?.gov_approval??0));na(e,{title:r?"Royal Court":"Party Actions",entityName:t.faction_name,entityColor:n,stats:[{label:"Party Funds",value:v,color:"var(--accent)"},{label:"Momentum",value:Number(m).toFixed(1),color:m>0?"var(--text-bright)":"var(--red)"},{label:i?"Legitimacy":"Nat. Approval",value:String(h),color:"var(--green)"}],statusBarItems:[{type:"count",label:"Seats",big:String(p),bigColor:n,dim1:`/ ${d}`,dim2:`(${s}%)`},{type:"list",label:"Platforms",items:y}],rolesContainerId:"pa-leaders",panelContainerId:"pa-actions-panel",extraHtml:`
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
        `}),document.getElementById("pa-leaders").innerHTML=za(o,n,t),document.getElementById("pa-actions-panel").innerHTML=Ra(o,n,t),document.getElementById("pa-leaders")?.addEventListener("click",x=>{const b=x.target.closest(".pa-leader-card");if(!b||b.classList.contains("vacant"))return;const g=b.dataset.role;g&&g!==Q&&(Q=g,H(e))}),document.getElementById("pa-actions-panel")?.addEventListener("click",x=>{const b=x.target.closest(".pa-action-item");if(!b||b.classList.contains("locked"))return;const g=b.dataset.actionId;g==="fundraise"?ni(e):g==="grant_seats"?Xa(e):g==="revoke_seats"?Qa(e):g==="rally"?ja(e):g==="statement"?si(e):g==="platform"?ri(e):g==="file_lawsuit"?Wa(e):g==="appoint_pm"?Ja(e):g==="modernize"?qa(e):g==="rebrand"?Ha(e):g==="no_confidence"?oi():g==="call_snap_election"?Za():g==="call_early_elections"?ti():g==="resign_as_pm"?ai():g==="leave_coalition"?ei():g==="disband_party"?ii():g==="create_bloc"?Ta(e):g==="leave_bloc"?Aa(e):g==="invite_to_bloc"&&Na(e)}),document.getElementById("pa-actions-panel")?.addEventListener("click",async x=>{const b=x.target.closest(".pa-bloc-invite-btn");if(!b)return;const g=b.dataset.inviteId,$=b.dataset.decision;if(!(!g||!$)&&!At.has(g)){At.add(g);try{await Pa(g,$,e)}finally{At.delete(g)}}}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>Pe(e)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",x=>{x.target.closest("#pa-hire-agitator-btn")||Pe(e)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>Se(e)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",x=>{x.target.closest("#pa-hire-deputy-btn")||Se(e)})}function za(e,t,a){const i=V(u.nation)&&u.nation?.monarch_faction_id===a?.id;return je.map(r=>{const n=r.id==="leader",o=r.id==="agitator",p=Q===r.id;let d,s,m,l,c;if(n){d=!1,s=e,m=Z(a.leader_first_name,a.leader_last_name),l=qe.length;const v=V(u.nation);if(v&&u.nation?.monarch_faction_id===a.id)c={text:(u.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(v)c={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const x=R?.pm_party_id===a.id,b=u.nation?.hos_election_method==="elected"&&R?.president_party_id===a.id;x?c={text:"PRIME MINISTER",color:"#5cc55c"}:b?c={text:"PRESIDENT",color:"#5cc55c"}:mt?c={text:"OPPOSITION",color:"#c84"}:c={text:"GOVERNING",color:"#8b9a6b"}}}else o&&G?(d=!1,s=`${G.first_name} ${G.last_name}`,m=Z(G.first_name,G.last_name),l=1):o&&!G?(d=!1,s="Not Hired",m="+",l=0):r.id==="deputy"&&B?(d=!1,s=`${B.first_name} ${B.last_name}`,m=Z(B.first_name,B.last_name),l=1):r.id==="deputy"&&!B?(d=!1,s="Not Hired",m="+",l=0):r.id==="campaign"?(d=!1,s="Campaign Mgr",m="CM",l=We.length):(d=!0,s="Vacant",m="—",l=0);const f=r.oppositionOnly&&!mt;return`
            <div class="pa-leader-card ${p?"active":""} ${d?"vacant":""} ${f?"vacant":""}"
                 data-role="${r.id}"
                 style="${p?`border-left-color:${r.color};`:""}${f?"opacity:0.35;":""}">
                ${r.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${f?"var(--text-dim)":"#d44a4a"};background:${f?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${f?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${f?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${r.color};background:${r.color}15;border-color:${r.color}33;">${m}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${r.color};">${n&&i?(u.nation?.monarch_title||"King").toUpperCase():r.title}</span>
                            ${l>0?`<span class="pa-leader-role-count">${l} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${_(s)}</div>
                        ${c?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${c.color};margin-top:2px;">${c.text}</div>`:""}
                        ${o&&G?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${G.skill}%;background:${ut(G.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${G.skill}</span></div>`:""}
                        ${o&&!G?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
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
    `}function Ra(e,t,a){const i=V(u.nation),r=i&&u.nation?.monarch_faction_id===a?.id,n=je.find(g=>g.id===Q);if(!n)return"";const o=Q==="leader",p=Q==="agitator",d=Q==="campaign",s=Q==="deputy";if(!o&&!p&&!d&&!s)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${_(n.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(p&&!mt)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(p&&!G)return`
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
        `;if(p&&G)return Va(n);if(s&&!B)return`
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
        `;if(s&&B)return Ba(n);if(d)return Ga(n,a);const l=Z(a.leader_first_name,a.leader_last_name),c=a.leader_age?`, Age ${a.leader_age}`:"",f=a.seats||0,y=a.momentum??0,b=(V(u.nation)&&u.nation?.monarch_faction_id===a.id?La:qe).map(g=>{const $=g.tags.map(k=>`<span class="pa-action-tag" style="color:${jt[k]||"var(--text-dim)"};">${k}</span>`).join("");let P="",S=g.cost,I=g.costColor,C=g.locked;if(g.id==="no_confidence"){const k=V(u.nation),A=!!R&&R.pm_party_id===a.id;if(k)C=!0,g.lockReason="Parliament cannot remove the Monarch’s Prime Minister. Only the Monarch can dismiss the PM.";else if(A)C=!0,g.lockReason="Your party is the Prime Minister — file from another party.";else if(se)C=!0,g.lockReason="A motion of no confidence is already pending in Parliament.";else if(Ft>0){C=!0;const T=Ft;g.lockReason=`Cooldown: ${T} tick${T!==1?"s":""} remaining before another motion can be filed against this PM party.`}else!R||!R.pm_party_id?(C=!0,g.lockReason="No active Prime Minister to file against."):g.lockReason=""}else if(g.id==="call_early_elections"||g.id==="resign_as_pm"){const k=u.nation,A=Ct(k),T=V(k),j=!!R&&R.pm_party_id===a.id;T?(C=!0,g.lockReason=g.id==="call_early_elections"?"Elections are not held under absolute monarchy. The Monarch appoints the Prime Minister.":"Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action."):A?j?u.nation&&u.nation.__coalition_status==="caretaker"?(C=!0,g.lockReason="Government is already in caretaker mode."):g.lockReason="":(C=!0,g.lockReason="Prime Minister’s party only."):(C=!0,g.lockReason="Only parliamentary and semi-presidential systems have a PM seat.")}else if(g.id==="leave_coalition"){const k=u.nation,A=Ct(k),T=!!R&&R.pm_party_id===a.id;A?mt?(C=!0,g.lockReason="You are in opposition."):T?(C=!0,g.lockReason="Prime Minister’s party cannot leave — resign first."):g.lockReason="":(C=!0,g.lockReason="Only available in parliamentary systems.")}else if(g.id==="disband_party"){const k=Ue(a);k.isPM?(C=!0,g.lockReason="You are Prime Minister — resign before disbanding."):k.isPresident?(C=!0,g.lockReason="You are the sitting President — step down before disbanding."):k.isMonarchActing?(C=!0,g.lockReason="The reigning monarch cannot disband the royal house."):g.lockReason=""}else if(g.id==="fundraise"){const k=Ge(f,ft);S=`-${k.momCost} MOM`,I="#c84",P=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(k.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(k.perSeat/1e3).toFixed(0)}k/seat × ${f}</span>
                ${ft>0?`<span style="color:var(--orange);">Use #${ft+1}</span>`:""}
            </div>`,y-k.momCost<1&&(C=!0,P+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${k.momCost}, have ${Number(y).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${C?"locked":""}" data-action-id="${g.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(g.name)}</span>
                        <div class="pa-action-tags">${$}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${I};">${S}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(g.desc)}</div>
                ${P}
                ${g.locked&&g.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${_(g.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${n.color};background:${n.color}15;border-color:${n.color}33;">${l}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${n.color};">${r?(u.nation?.monarch_title||"KING").toUpperCase():n.title}</span>
                        <span class="pa-detail-name">${_(e)}</span>
                        ${i&&u.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${_(u.nation.dynasty_name)}</span>`:""}
                        ${Ye(t)}
                    </div>
                    <div class="pa-detail-meta">${r?_((u.nation?.monarch_title||"King")+" of "+(u.nation?.name||"")):_(n.fullTitle)+" &middot; "+_(a.faction_name)}${c}${(()=>{if(r)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(u.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(i)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const g=R?.pm_party_id===a.id,$=u.nation?.hos_election_method==="elected"&&R?.president_party_id===a.id;return g?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':$?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':mt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        ${Ke(t)}
        ${Ve(t)}
        <div class="pa-actions-list">
            ${b}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${n.color};font-weight:700;">${n.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const Fa=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1},{id:"create_bloc",name:"Create Bloc",desc:"Found a pre-coalition alliance with other parties. Pick a name and invite any parties in your nation that aren't already in a bloc. Phase 1 is formation only — shared momentum, vote discipline, and coalition binding arrive in later phases.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["STRATEGIC","ALLIANCE"],locked:!1},{id:"leave_bloc",name:"Leave Bloc",desc:"Exit your current bloc. If you are the bloc leader, leaving dissolves the whole bloc and all pending invitations are withdrawn. Greyed out when you are not in a bloc.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"invite_to_bloc",name:"Invite Party to Bloc",desc:"Send a bloc invitation to an additional party. Leader-only. Eligible parties are in your nation, not already in a bloc, and not currently in government.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1}],Me=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Oa(e,t){const a=e+t;return a>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:a>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:a>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function Ba(e){const t=u.faction,a=t?.color||e.color,i=Fa.map(n=>{const o=n.tags.map(s=>`<span class="pa-action-tag" style="color:${jt[s]||"var(--text-dim)"};">${s}</span>`).join("");let p=n.locked,d="";if(n.id==="create_bloc"){const s=Ue(t);D?(p=!0,d=`Already in the ${D.name} bloc.`):s.isPM||s.isPresident||s.isMonarchActing?(p=!0,d="Head of Government cannot form blocs — you already lead the coalition."):(t.party_funds||0)<1e5&&(p=!0,d="Needs $100k party funds.")}else n.id==="leave_bloc"?D?it&&(d=`Leaving dissolves ${D.name} — all members will be removed.`):(p=!0,d="You are not in a bloc."):n.id==="invite_to_bloc"&&(D?it||(p=!0,d="Only the bloc leader can send invitations."):(p=!0,d="You are not in a bloc."));return`
            <div class="pa-action-item ${p?"locked":""}" data-action-id="${n.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(n.name)}</span>
                        <div class="pa-action-tags">${o}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${n.costColor};">${n.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(n.desc)}</div>
                ${d?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${_(d)}</span></div>`:""}
            </div>
        `}).join(""),r=ut(B.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${Z(B.first_name,B.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${_(B.first_name)} ${_(B.last_name)}</span>
                        ${Ye(a)}
                    </div>
                    <div class="pa-detail-meta">${_(e.fullTitle)} &middot; Age ${B.age} &middot; Skill: <span style="color:${r.color};font-weight:700;">${B.skill}</span></div>
                </div>
            </div>
        </div>
        ${Ke(a)}
        ${Ve(a)}
        <div class="pa-actions-list" id="pa-actions-panel">${i}</div>
    `}function Da(e){const t=Dt(e),a=t.firstNames||[],i=t.lastNames||[];if(a.length===0||i.length===0)return[];const r=5+Math.floor(Math.random()*3),n=new Set,o=[];for(let p=0;p<r;p++){let d,s,m,l=0;do d=a[Math.floor(Math.random()*a.length)],s=i[Math.floor(Math.random()*i.length)],m=d+" "+s,l++;while(n.has(m)&&l<20);n.add(m);const c=20+Math.floor(Math.random()*66),f=28+Math.floor(Math.random()*30),y=Math.max(0,c-20)/65,v=Math.round((125e3+y*525e3)/25e3)*25e3;o.push({first_name:d,last_name:s,age:f,skill:c,hire_cost:v})}return o.sort((p,d)=>d.skill-p.skill)}async function Se(e){const t=document.getElementById("pa-deputy-modal");if(!t)return;const a=u.nation?.name,i=Da(a);let r=null;function n(){const o=r!=null?i[r]:null,p=o?ut(o.skill):null,d=i.map((l,c)=>{const f=r===c,y=ut(l.skill);return`<div class="pa-hire-row ${f?"selected":""}" data-idx="${c}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${Z(l.first_name,l.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${f?"var(--text-bright)":"var(--text-secondary)"};">${_(l.first_name)} ${_(l.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${l.skill}%;background:${y.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${y.color};">${l.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${l.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(l.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let s;o?s=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${Z(o.first_name,o.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${_(o.first_name)} ${_(o.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${o.age} &middot; Deputy Leader Candidate</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${o.skill}%;background:${p.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p.color};">${o.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${p.color};margin-top:3px;font-weight:700;">${p.label}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(u.faction?.party_funds||0)<o.hire_cost?' disabled title="Not enough funds"':""}>Hire ${_(o.first_name)}</button>
                </div>
            `:s=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-dep-list">${d}</div>
                    <div style="flex:1;overflow-y:auto;">${s}</div>
                </div>
            </div>
        `;const m=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",m),t.onclick=l=>{l.target===t&&m()},document.getElementById("pa-dep-list")?.addEventListener("click",l=>{const c=l.target.closest(".pa-hire-row");c&&(r=parseInt(c.dataset.idx,10),n())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(r==null)return;const l=i[r],c=u.faction?.party_funds||0;if(c<l.hire_cost){alert("Not enough funds.");return}const f=document.getElementById("pa-dep-hire-confirm");f&&(f.disabled=!0,f.textContent="Hiring...");try{const y=c-l.hire_cost,v=u.shard?.current_tick||0,{data:h,error:x}=await w.from("faction_deputies").insert({faction_id:u.faction.id,first_name:l.first_name,last_name:l.last_name,age:l.age,skill:l.skill,status:"active",hired_at_tick:v}).select("*").single();if(x){alert("Failed: "+x.message);return}await w.from("factions").update({party_funds:y}).eq("id",u.faction.id),u.faction.party_funds=y,B=h,Q="deputy",m(),H(e)}catch(y){console.error("[Deputy] Hire error:",y)}finally{f&&(f.disabled=!1)}})}t.classList.add("active"),n()}function ja(e){const t=document.getElementById("pa-rally-modal");if(!t||!B)return;const i=u.faction.party_funds||0;let r=null,n=null;function o(){const p=Me.map((m,l)=>{const c=i>=m.cost,f=r===l;return`<div class="pa-action-item ${f?"selected":""} ${c?"":"locked"}" data-tier="${l}" style="cursor:${c?"pointer":"not-allowed"};${f?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${f?"#8b9a6b":"var(--text-bright)"};">$${Math.round(m.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${m.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${m.bonus} = range ${1+m.bonus} to ${6+m.bonus}</div>
            </div>`}).join("");let d="";n&&(d=`
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${_(B.first_name)} ${_(B.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${B.skill}</span>
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

                    ${d}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${n?"Close":"Cancel"}</button>
                    ${n?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${r==null?"disabled":""}>Hold Rally</button>`}
                </div>
            </div>
        `;const s=()=>{t.classList.remove("active"),n&&H(e)};document.getElementById("rally-close")?.addEventListener("click",s),document.getElementById("rally-cancel")?.addEventListener("click",s),t.onclick=m=>{m.target===t&&s()},document.getElementById("rally-tiers")?.addEventListener("click",m=>{const l=m.target.closest("[data-tier]");!l||l.classList.contains("locked")||(r=parseInt(l.dataset.tier,10),o())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(r==null||n)return;const m=Me[r],{data:l}=await w.from("factions").select("party_funds, momentum").eq("id",u.faction.id).single(),c=l?.party_funds||0;if(c<m.cost){alert("Not enough funds.");return}u.faction.party_funds=c,u.faction.momentum=l?.momentum??u.faction.momentum;const f=document.getElementById("rally-submit");f&&(f.disabled=!0,f.textContent="Rolling...");try{const y=1+Math.floor(Math.random()*6),v=Oa(y,m.bonus),h=c-m.cost,x=Math.max(1,(u.faction.momentum||0)+v.momentum);await w.from("factions").update({party_funds:h,momentum:x}).eq("id",u.faction.id);const b=u.shard?.current_tick||0;await w.from("campaign_actions").insert({party_id:u.faction.id,nation_id:u.nation?.id,action_type:"rally",ap_cost:0,money_cost:m.cost,tick_performed:b,result:{dieRoll:y,bonus:m.bonus,total:y+m.bonus,momentum:v.momentum,momentumDelta:v.momentum,label:v.label,outcomeName:v.label}}),u.faction.party_funds=h,u.faction.momentum=x,sessionStorage.removeItem("nationhood_state"),n={...v,dieRoll:y,bonus:m.bonus,total:y+m.bonus},o()}catch(y){console.error("[Rally] Error:",y),alert("Rally failed.")}})}t.classList.add("active"),o()}const We=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],Le=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],re=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function Ga(e,t){const a=We.map(i=>{const r=i.tags.map(n=>`<span class="pa-action-tag" style="color:${jt[n]||"var(--text-dim)"};">${n}</span>`).join("");return`
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
    `}function qa(e){const t=document.getElementById("pa-modernize-modal");if(!t)return;const a=u.faction;let i=null,r=a.custom_logo_url||null,n=!1;function o(){const p=!!r,s=Number(a.party_funds??0)>=5e4,m=!!i&&s&&!n;t.innerHTML=`
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
                    ${s?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${m?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=l=>{l.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",l=>{const c=l.target.files?.[0];if(c){if(c.size>2*1024*1024){alert("Logo must be under 2MB.");return}i=c,r=URL.createObjectURL(c),o()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(n||!i)return;n=!0;const l=document.getElementById("mod-submit");l&&(l.disabled=!0,l.textContent="Uploading...");try{const c=i.name.split(".").pop()?.toLowerCase()||"png",f=`${a.id}/logo_${Date.now()}.${c}`,{error:y}=await w.storage.from("party-logos").upload(f,i,{cacheControl:"3600",upsert:!0,contentType:i.type});if(y)throw new Error("Upload failed: "+y.message);const{data:v}=w.storage.from("party-logos").getPublicUrl(f),h=v?.publicUrl;if(!h)throw new Error("Failed to get logo URL");const x=Math.max(0,Number(a.party_funds??0)-5e4),{error:b}=await w.from("factions").update({custom_logo_url:h,party_funds:x}).eq("id",a.id);if(b)throw b;a.custom_logo_url=h,a.party_funds=x,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),H(e)}catch(c){alert("Modernize failed: "+(c.message||"Error")),n=!1,l&&(l.disabled=!1,l.textContent="Modernize — $50k")}})}t.classList.add("active"),o()}function Ha(e){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const a=u.faction;u.nation;const i=a.momentum??50;(u._allParties||[]).filter(c=>c.id!==a.id);const r={current:a.party_color||"#4a8aba"},n={current:0},o={current:a.custom_logo_url||null},p={current:null},d={current:!!a.custom_logo_url},s={current:!1};function m(){return r.current}function l(){const c=m(),f=Le.find(S=>S.hex===c)?.name||"Custom",y=re[n.current]?.emoji||"🏛️",v=d.current&&(o.current||p.current),h=o.current||(p.current?URL.createObjectURL(p.current):null),x=document.getElementById("rb-name")?.value??a.faction_name??"",b=document.getElementById("rb-abbr")?.value??a.abbreviation??"",g=document.getElementById("rb-desc")?.value??"",$=Le.map(S=>{const I=c===S.hex;return`<div class="rb-color-swatch ${I?"selected":""}" data-hex="${S.hex}" style="background:${S.hex};${I?`box-shadow:0 0 8px ${S.hex}44;border:2px solid var(--text-bright);`:""}">
                ${I?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),P=re.map((S,I)=>{const C=n.current===I;return`<div class="rb-logo-item ${C?"selected":""}" data-idx="${I}" style="${C?`background:${c}15;border:2px solid ${c};box-shadow:0 0 6px ${c}33;`:""}">
                ${S.emoji}
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
                            <input class="pa-modal-input" id="rb-abbr" value="${_(b)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${c};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${_(g)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${g.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${c};">${_(f)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${$}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${v?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${v?"opacity:0.3;":""}" id="rb-logos">${P}</div>
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
                        <div style="background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${c};padding:10px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <div style="width:40px;height:40px;background:${c}15;border:1.5px solid ${c};display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;">
                                    ${v&&h?`<img src="${h}" style="width:100%;height:100%;object-fit:contain;" alt="">`:y}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${_(x||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${c};letter-spacing:1px;">${_(b||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${_(g||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${c};background:${c}0a;border:1px solid ${c}25;">${_(b)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${c};background:${c}0a;border:1px solid ${c}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${c}08;border:1px solid ${c}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${c};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${c};">${_(f.toUpperCase())}</div>
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
                        ${s.current?'<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>':"This will change your party's identity across all UI, media, and diplomatic channels."}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${s.current?`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        `:`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=o.current,t._rbUseCustomLogo=d.current,l(),t.classList.add("active"),t.addEventListener("change",function(f){if(f.target.id==="rb-logo-file"){const y=f.target.files?.[0];if(!y)return;if(y.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(y.size/(1024*1024)).toFixed(1)+"MB"),f.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(y.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),f.target.value="";return}p.current=y,o.current=null,d.current=!0,t._rbCustomLogoFile=y,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,l()}}),t.addEventListener("click",function c(f){if(f.target===t||f.target.closest("#rb-close")||f.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",c);return}const y=f.target.closest(".rb-color-swatch");if(y){r.current=y.dataset.hex,l();return}const v=f.target.closest(".rb-logo-item");if(v){n.current=parseInt(v.dataset.idx)||0,d.current=!1,t._rbUseCustomLogo=!1,l();return}if(f.target.closest("#rb-remove-logo")){o.current=null,p.current=null,d.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,l();return}if(f.target.closest("#rb-submit")){const h=document.getElementById("rb-name")?.value?.trim()||"",x=document.getElementById("rb-abbr")?.value?.trim()||"";if(h.length<3||x.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}s.current=!0,l();return}if(f.target.closest("#rb-back")){s.current=!1,l();return}if(f.target.closest("#rb-confirm")){Ua(t,e,c);return}})}async function Ua(e,t,a){const i=u.faction,r=document.getElementById("rb-name")?.value?.trim()||"",n=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const o=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||i.party_color,p=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,d=p!=null?re[parseInt(p)]?.emoji:null,s=e._rbCustomLogoFile,m=e._rbUseCustomLogo,l=e._rbCustomLogoUrl,c=document.getElementById("rb-confirm");c&&(c.disabled=!0,c.textContent="Rebranding...");try{const f=u.shard?.current_tick||0;let y=l;if(m&&s){const g=s.name.split(".").pop()?.toLowerCase()||"png",$=`${i.id}/logo_${Date.now()}.${g}`,{data:P,error:S}=await w.storage.from("party-logos").upload($,s,{cacheControl:"3600",upsert:!0,contentType:s.type});if(S){console.error("[Rebrand] Logo upload failed:",S.message),alert("Logo upload failed: "+S.message);return}const{data:I}=w.storage.from("party-logos").getPublicUrl($);y=I?.publicUrl||null}else m||(y=null);const v=15e4,h=i.party_funds||0;if(h<v){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $150k.`);return}const x=h-v,b=Math.max(1,(i.momentum||0)-10);await w.from("factions").update({party_funds:x,momentum:b,faction_name:r,abbreviation:n.toUpperCase(),party_color:o,party_logo:m?null:d,custom_logo_url:y,rebrand_cooldown_until_tick:f+120}).eq("id",i.id),await w.from("campaign_actions").insert({party_id:i.id,nation_id:u.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:f,result:{oldName:i.faction_name,newName:r,oldAbbr:i.abbreviation,newAbbr:n,oldColor:i.party_color,newColor:o}}),i.party_funds=x,i.momentum=b,i.faction_name=r,i.abbreviation=n.toUpperCase(),i.party_color=o,i.party_logo=m?null:d,i.custom_logo_url=y,e.classList.remove("active"),e.removeEventListener("click",a),H(t)}catch(f){console.error("[PartyActions] Rebrand error:",f),alert("Failed to rebrand: "+(f.message||f))}finally{c&&(c.disabled=!1,c.textContent="⚠ Confirm Rebrand")}}const Ya=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function Va(e){const t=G,a=Z(t.first_name,t.last_name),i=ut(t.skill),r=mt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',n=Ya.map(o=>{const p=o.tags.map(d=>`<span class="pa-action-tag" style="color:${jt[d]||"var(--text-dim)"};">${d}</span>`).join("");return`
            <div class="pa-action-item ${o.locked?"locked":""}" data-action-id="${o.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(o.name)}</span>
                        <div class="pa-action-tags">${p}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${o.costColor};">${o.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(o.desc)}</div>
                ${o.locked&&o.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${_(o.lockReason)}</span></div>`:""}
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
            ${n}
        </div>
        ${Ka()}
        <div class="pa-skill-footer">
            <span style="color:${e.color};font-weight:700;">${e.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${i.color};font-weight:700;">${i.label}</span>: ${i.desc}
        </div>
    `}function Ka(){if(ne.length===0)return"";const e=u.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${ne.map(a=>{const i=zt.find(x=>x.key===a.target_ministry),r=i?i.label:a.target_ministry,n=i?i.icon:"⚖️",o=ye(a.corruption_growth||0),p=st[a.tier]||st[1],d=a.status==="active",s=Math.max(0,e-a.filed_at_tick),m=8,l=Math.min(1,s/m),c=Math.max(0,a.resolves_at_tick-e),f=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],y=f.map(x=>{const b=a.filed_at_tick+x.tick,g=e>=b,$=e>=b&&(x.tick===8||e<a.filed_at_tick+f[f.indexOf(x)+1]?.tick),P=x.tick/m*100;return`<div class="pa-ls-milestone ${g?"passed":""} ${$?"current":""}" style="left:${P}%;" title="${x.label} (Tick ${b})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${x.label}</div>
            </div>`}).join("");let v="";if(!d){const x=p===st[1]?"FRIVOLOUS":p===st[2]?"PARTIAL WIN":p===st[3]?"MAJOR WIN":"DEVASTATING",b=a.tier===1?"var(--red)":a.tier===2?"#ca5":a.tier===3?"#c84":"var(--green)";v=`<span class="pa-ls-tier-badge" style="color:${b};border-color:${b}44;background:${b}0a;">${x}</span>`}const h=d?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${a.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${a.momentum_effect>=0?"+":""}${a.momentum_effect} Mom</span>
                <span style="color:${a.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${a.gov_momentum_effect>=0?"+":""}${a.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${d?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${n}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${_(r)}</span>
                        <span class="pa-ls-tier-badge" style="color:${o.color};border-color:${o.color}44;background:${o.color}0a;">TIER ${a.tier}</span>
                        ${v}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${d?`${c} ticks left`:`Resolved tick ${a.resolves_at_tick}`}
                    </div>
                </div>
                ${d?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${l*100}%;"></div>
                        </div>
                        ${y}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${o.color};font-weight:700;">${(a.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${_(o.label)}
                </div>
                ${h}
            </div>
        `}).join("")}
        </div>
    `}let Vt=!1;async function Pe(e){const t=document.getElementById("pa-hire-modal");if(!t)return;const a=u.nation?.id,i=u.nation?.name;if(!a||!i)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const r=await ka(w,a,i);let n=null;function o(){const p=n!=null?r[n]:null,d=p?ut(p.skill):null,s=r.map((c,f)=>{const y=n===f,v=ut(c.skill);return`<div class="pa-hire-row ${y?"selected":""}" data-idx="${f}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${Z(c.first_name,c.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${y?"var(--text-bright)":"var(--text-secondary)"};">${_(c.first_name)} ${_(c.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${c.skill}%;background:${v.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${v.color};">${c.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${c.age}</div>
            </div>`}).join("");let m;p?m=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${Z(p.first_name,p.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${_(p.first_name)} ${_(p.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${p.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${p.skill}%;background:${d.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${d.color};">${p.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${d.color};margin-top:3px;font-weight:700;">${d.label}</div>
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
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${d.desc}</div>
                    </div>

                    <div style="padding:8px 10px;background:rgba(212,74,74,0.04);border:1px solid rgba(212,74,74,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;letter-spacing:0.06em;margin-bottom:3px;">ROLE: OPPOSITION COORDINATOR</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Files lawsuits against the government, organizes protests, and leads legal challenges. Skill affects success rates of legal and direct actions. Available only when your party is in opposition.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(p.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(u.faction?.party_funds||0)<p.hire_cost?' disabled title="Not enough funds"':""}>Hire ${_(p.first_name)}</button>
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
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${r.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-hire-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-hire-list">
                        ${s}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${m}
                    </div>
                </div>
            </div>
        `;const l=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",l),t.onclick=c=>{c.target===t&&l()},document.getElementById("pa-hire-list")?.addEventListener("click",c=>{const f=c.target.closest(".pa-hire-row");f&&(n=parseInt(f.dataset.idx,10),o())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Vt||n==null)return;Vt=!0;const c=document.getElementById("pa-hire-confirm");c&&(c.disabled=!0,c.textContent="Hiring...");try{const f=u.shard?.current_tick||0,y=r[n],v=y.hire_cost||0,h=u.faction?.party_funds||0;if(v>0&&h<v){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $${Math.round(v/1e3)}k.`);return}if(v>0){const b=h-v,{error:g}=await w.from("factions").update({party_funds:b}).eq("id",u.faction.id);if(g){alert("Failed to deduct funds.");return}u.faction.party_funds=b}const x=await Ea(w,u.faction?.id,y,f);if(!x.success){alert(x.error||"Failed to hire agitator.");return}G=x.agitator,Q="agitator",l(),H(e)}catch(f){console.error("[PartyActions] Hire agitator error:",f)}finally{Vt=!1,c&&(c.disabled=!1)}})}o()}let Lt=!1;function Wa(e){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!R){alert("No active government to file against.");return}const a=u.faction,i=G;let r=null,n=null;function o(){const p=r&&n,d=zt.map(l=>{const c=r===l.key;return`<div class="pa-lawsuit-target ${c?"selected":""}" data-target="${l.key}">
                <span style="font-size:18px;">${l.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${c?"var(--text-bright)":"var(--text-secondary)"};">${_(l.label)}</span>
            </div>`}).join(""),s=De.map(l=>{const c=n===l.key;return`<div class="pa-lawsuit-basis ${c?"selected":""}" data-basis="${l.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${c?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${c?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${c?"var(--text-bright)":"var(--text-secondary)"};">${_(l.label)}</div>
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
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;" id="pa-lawsuit-targets">${d}</div>
                    </div>

                    <div>
                        <div class="pa-modal-step-label">2 &mdash; Legal Basis</div>
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${s}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${p?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const m=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",m),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",m),t.onclick=l=>{l.target===t&&m()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",l=>{const c=l.target.closest(".pa-lawsuit-target");c&&(r=c.dataset.target,o())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",l=>{const c=l.target.closest(".pa-lawsuit-basis");c&&(n=c.dataset.basis,o())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(Lt||!r||!n)return;Lt=!0;const l=document.getElementById("pa-lawsuit-submit");l&&(l.disabled=!0,l.textContent="Filing...");try{const{data:f}=await w.from("factions").select("party_funds").eq("id",a.id).single(),y=f?.party_funds||0;if(y<25e4){alert(`Not enough funds. You have $${Math.round(y/1e3)}k, need $250k.`),Lt=!1,l&&(l.disabled=!1,l.textContent="File Lawsuit");return}const v=y-25e4;await w.from("factions").update({party_funds:v}).eq("id",a.id),a.party_funds=v,sessionStorage.removeItem("nationhood_state");const h=u.shard?.current_tick||0,x=await Ca(w,{factionId:a?.id,nationId:u.nation?.id,agitatorId:i?.id,targetMinistry:r,basis:n,currentTick:h,partyName:a?.faction_name||"Opposition",administration:R});if(!x.success){alert(x.error||"Failed to file lawsuit.");return}const b=ye(x.lawsuit?.corruption_growth||0),g=st[x.tier]||st[1];m(),alert(`Lawsuit filed against ${zt.find($=>$.key===r)?.label||r}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),H(e)}catch(c){console.error("[PartyActions] File lawsuit error:",c),alert("An error occurred. Please try again.")}finally{Lt=!1,l&&(l.disabled=!1,l.textContent="File Lawsuit")}})}t.classList.add("active"),o()}async function Ja(e){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const a=u.nation,i=u.faction,{data:r}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),n=r||[];let o=null,p=!1;const{data:d}=await w.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",a.id).eq("active",!0).maybeSingle();function s(){const m=n.find(v=>v.id===o),l=d?`${d.first_name} ${d.last_name}`:null,c=d?.factions?.faction_name||null,f=d&&o===d.faction_id;t.innerHTML=`
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
                    ${l?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${_(l)}</strong> (${_(c||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${n.map(v=>{const h=v.id===o,x=d&&v.id===d.faction_id,b=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"?";return`<div class="pa-action-item ${h?"selected":""}" data-party-id="${v.id}" style="cursor:pointer;${h?`border-color:${v.party_color||"#888"};background:${v.party_color||"#888"}08;`:""}">
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!m||p||f?"disabled":""} style="background:#c8a832;">${m?f?"Already PM":`Appoint ${_(m.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const y=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",y),document.getElementById("apm-cancel")?.addEventListener("click",y),t.onclick=v=>{v.target===t&&y()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const h=v.target.closest("[data-party-id]");h&&(o=h.dataset.partyId,s())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!o||p)return;const v=n.find(x=>x.id===o);if(!v||!confirm(`Appoint ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister?`))return;p=!0;const h=document.getElementById("apm-confirm");h&&(h.disabled=!0,h.textContent="Appointing...");try{const x=u.shard?.current_tick||0;await da(w,{nationId:a.id,factionId:o,firstName:v.leader_first_name||"Unknown",lastName:v.leader_last_name||"Unknown",age:v.leader_age||50,currentTick:x});try{await w.from("government_formations").update({status:"dissolved"}).eq("nation_id",a.id).in("status",["formed","caretaker","active"]);const{data:C}=await w.from("shard").select("current_date").eq("name","Alpha Shard").single();await w.from("government_formations").insert({nation_id:a.id,election_id:null,proposed_by:i.id,party_ids:[o],status:"formed",formation_type:"monarchy",formed_at:new Date().toISOString(),ministry_assignments:{prime_minister:o},game_year:C?.current_date||""})}catch(C){console.warn("[AppointPM] government_formations write failed (non-blocking — synthetic fallback still works):",C?.message||C)}let b=0;const g=a.monarch_faction_id,$=d?.faction_id||null,P=$&&$!==g&&$!==o,S=o!==g&&o!==$;if(P&&(b-=4),S&&(b+=3),b!==0){const C=Number(a.public_approval??50),k=Math.max(0,Math.min(100,C+b));try{await w.from("nations").update({public_approval:k}).eq("id",a.id),a.public_approval=k}catch{}}try{await w.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${a.monarch_title||"The King"} has appointed ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister.`,fired_at_tick:x})}catch{}y();const I=b>0?`

Legitimacy +${b}.`:b<0?`

Legitimacy ${b}.`:"";alert(`${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} has been appointed Prime Minister.${I}`),H(e)}catch(x){alert("Failed to appoint PM: "+(x.message||"Error")),p=!1,h&&(h.disabled=!1,h.textContent=`Appoint ${_(v.faction_name)}`)}})}t.classList.add("active"),s()}async function Xa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=u.nation,i=u.faction,r=i.seats||0,n=a?.total_seats||100,{data:o}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),p=(o||[]).filter(c=>c.id!==i.id);let d=null;const s=Math.max(0,r-1);let m=Math.min(5,s||1);function l(){const c=p.find(y=>y.id===d);t.innerHTML=`
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
                    You currently hold <strong>${r}</strong> of ${n} seats.
                    ${r/n>.7?'<div style="color:#d44a4a;font-weight:700;margin-top:4px;">⚠ You hold >70% of seats — tyranny legitimacy decay active!</div>':""}
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${p.length>0?p.map(y=>{const v=y.id===d;return`<div class="pa-action-item ${v?"selected":""}" data-faction-id="${y.id}" style="cursor:pointer;${v?`border-color:${y.party_color||"#888"};background:${y.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${y.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${_(y.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,y.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${c?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${s}" value="${m}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${m}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(m*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${r-m} &middot; Their seats after: ${(c.seats||0)+m}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${c?"":"disabled"} style="background:#c8a832;">Grant ${m} Seats</button>
                </div>
            </div>
        `;const f=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",f),document.getElementById("royal-cancel")?.addEventListener("click",f),t.onclick=y=>{y.target===t&&f()},t.querySelector(".pa-modal-body")?.addEventListener("click",y=>{const v=y.target.closest("[data-faction-id]");v&&(d=v.dataset.factionId,l())}),document.getElementById("grant-slider")?.addEventListener("input",y=>{m=parseInt(y.target.value)||1,document.getElementById("grant-count").textContent=m;const v=document.getElementById("royal-grant");v&&(v.textContent=`Grant ${m} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!d||xt)return;xt=!0;const y=document.getElementById("royal-grant");y&&(y.disabled=!0,y.textContent="Granting...");try{const{data:v}=await w.from("factions").select("id, faction_name, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),h=(v||[]).find(L=>L.id===i.id),x=(v||[]).find(L=>L.id===d);if(!h||!x){alert("Faction not found.");return}const b=(v||[]).reduce((L,E)=>L+Math.max(0,E.seats||0),0),g=new Map;for(const L of v||[])g.set(L.id,Math.max(0,L.seats||0));let $=m;const P=Math.max(0,(g.get(i.id)||0)-1),S=Math.min($,P);if(S>0&&(g.set(i.id,(g.get(i.id)||0)-S),$-=S),$>0){const L=(v||[]).filter(M=>M.id!==i.id&&M.id!==d&&(g.get(M.id)||0)>0);let E=L.reduce((M,N)=>M+(g.get(N.id)||0),0);for(const M of L){if($<=0||E<=0)break;const N=Math.round($*(g.get(M.id)||0)/E),z=Math.min(N,g.get(M.id)||0,$);z>0&&(g.set(M.id,(g.get(M.id)||0)-z),E-=z,$-=z)}if($>0)for(const M of L){if($<=0)break;const N=g.get(M.id)||0,z=Math.min($,N);z>0&&(g.set(M.id,N-z),$-=z)}}const I=m-$;if(I<=0){alert("No seats available to grant.");return}g.set(d,(g.get(d)||0)+I);let C=0;for(const L of g.values())C+=L;if(C!==b){console.error("[GrantSeats] Conservation violated",{sumBefore:b,sumAfter:C,grantAmount:m,actualGrant:I}),alert("Internal error: seat totals would not balance. Aborting.");return}const k=[];for(const L of v||[]){const E=Math.max(0,L.seats||0),M=g.get(L.id)||0;E!==M&&k.push({id:L.id,seats:M})}for(const L of k){const{error:E}=await w.from("factions").update({seats:L.seats}).eq("id",L.id);if(E){alert("Failed to grant seats: "+E.message);return}}const A=I*.5,T=Math.min(100,(Number(a.public_approval)||50)+A),{error:j}=await w.from("nations").update({public_approval:T}).eq("id",a.id);if(j){alert("Failed to update public approval.");return}i.seats=g.get(i.id)||0,a.public_approval=T;try{const L=p.find(E=>E.id===d);await w.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} grants ${I} seats to ${L?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${a.monarch_title||"King"} has granted ${I} parliamentary seat${I!==1?"s":""} to ${L?.faction_name}. Legitimacy +${A.toFixed(1)}.`,fired_at_tick:u.shard?.current_tick||0})}catch{}f(),H(e)}catch(v){console.error("[GrantSeats] Error:",v),alert("Failed to grant seats.")}finally{xt=!1}})}t.classList.add("active"),l()}async function Qa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=u.nation,i=u.faction,{data:r}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),n=(r||[]).filter(s=>s.id!==i.id&&(s.seats||0)>0);let o=null,p=1;function d(){const s=n.find(v=>v.id===o),m=s&&s.seats||0,c=p*1e5,f=i.party_funds||0;t.innerHTML=`
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
                        ${n.length>0?n.map(v=>{const h=v.id===o;return`<div class="pa-action-item ${h?"selected":""}" data-faction-id="${v.id}" style="cursor:pointer;${h?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${_(v.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${v.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${s?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${m}" value="${p}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${p}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(c/1e3)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${p}</span>
                                ${f<c?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!s||f<c?"disabled":""} style="background:#d44a4a;">Revoke ${p} Seats</button>
                </div>
            </div>
        `;const y=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",y),document.getElementById("royal-cancel")?.addEventListener("click",y),t.onclick=v=>{v.target===t&&y()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const h=v.target.closest("[data-faction-id]");h&&(o=h.dataset.factionId,p=1,d())}),document.getElementById("revoke-slider")?.addEventListener("input",v=>{p=parseInt(v.target.value)||1,document.getElementById("revoke-count").textContent=p;const h=document.getElementById("royal-revoke");h&&(h.textContent=`Revoke ${p} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!o||xt)return;xt=!0;const v=document.getElementById("royal-revoke");v&&(v.disabled=!0,v.textContent="Revoking...");try{const h=p*1e5,{data:x}=await w.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),b=(x||[]).find(N=>N.id===i.id),g=(x||[]).find(N=>N.id===o);if(!b||!g){alert("Faction not found.");return}const $=b.party_funds||0;if($<h){alert("Not enough funds.");return}const P=(x||[]).reduce((N,z)=>N+Math.max(0,z.seats||0),0),S=Math.min(p,g.seats||0);if(S<=0){alert("Target has no seats to revoke.");return}const I=$-h,C=(b.seats||0)+S,k=(g.seats||0)-S,A=S,T=Math.max(0,(Number(a.public_approval)||50)-A),j=P-(b.seats||0)-(g.seats||0)+C+k;if(j!==P){console.error("[RevokeSeats] Conservation violated",{sumBefore:P,sumAfter:j,take:S}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:L}=await w.from("factions").update({seats:C,party_funds:I}).eq("id",i.id);if(L){alert("Failed to revoke seats: "+L.message);return}const{error:E}=await w.from("factions").update({seats:k}).eq("id",o);if(E){alert("Failed to revoke seats: "+E.message);return}const{error:M}=await w.from("nations").update({public_approval:T}).eq("id",a.id);if(M){alert("Failed to update public approval.");return}i.seats=C,i.party_funds=I,a.public_approval=T,sessionStorage.removeItem("nationhood_state");try{await w.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} revokes ${S} seats from ${g.faction_name||"unknown"}`,category:"political",description_chosen:`The ${a.monarch_title||"King"} has revoked ${S} seat${S!==1?"s":""} from ${g.faction_name}. Legitimacy -${A}.`,fired_at_tick:u.shard?.current_tick||0})}catch{}y(),H(e)}catch(h){console.error("[RevokeSeats] Error:",h),alert("Failed to revoke seats.")}finally{xt=!1}})}t.classList.add("active"),d()}let Kt=!1,Wt=!1;async function Za(){if(!Wt&&!(!u?.faction?.id||!u?.nation?.id)&&confirm(`⚡ CALL SNAP ELECTION?

Schedules a parliamentary election for next tick. Cancels any other scheduled parliamentary election in this nation.

3-tick cooldown per party after the call.

Proceed?`)){Wt=!0;try{const{data:e,error:t}=await w.rpc("call_snap_election",{p_nation_id:u.nation.id,p_caller_faction_id:u.faction.id});if(t){alert("Failed to call snap election: "+t.message);return}if(e&&e.success===!1){alert(e.error||"Snap election call rejected.");return}alert("⚡ Snap election scheduled for next tick."),window.location.reload()}catch(e){console.error("[PartyActions] Call snap election failed:",e),alert("Failed to call snap election: "+(e?.message||"unknown error"))}finally{Wt=!1}}}async function ti(){if(Kt||!u?.faction?.id||!u?.nation?.id)return;if(!Ct(u.nation)){alert("Early elections are only available in parliamentary and semi-presidential systems.");return}if(V(u.nation)){alert("Elections are not held under absolute monarchy.");return}const e=R?.pm_party_id;if(!e||e!==u.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚡ CALL EARLY ELECTIONS?

Dissolves the legislature and puts the government into caretaker status.
Election fires after a short formation window.

Momentum effect depends on Gov. Approval:
• >50  → PM party +3 Momentum (fresh mandate)
• 35–50 → neutral
• <35  → opposition +5 Momentum each, +3 Stability

Proceed?`)){Kt=!0;try{const t=Array.isArray(R?.party_ids)?R.party_ids:R?.pm_party_id?[R.pm_party_id]:[],a=await va(w,u.nation.id,e,t);if(a&&a.success===!1){alert("Could not call early elections: "+(a.error||"unknown error"));return}alert("⚡ Early elections called. Government is now in caretaker status."),window.location.reload()}catch(t){console.error("[PartyActions] Call early elections failed:",t),alert("Failed to call early elections: "+(t?.message||"unknown error"))}finally{Kt=!1}}}let Jt=!1;async function ei(){if(!Jt&&u?.faction?.id&&confirm(`LEAVE COALITION?

Consequences:
• −3 Momentum to your party
• −5 Momentum to the Prime Minister’s party
• Any ministries you hold will be vacated
• Your party moves from governing to opposition
• Coalition flips to minority if your exit drops it below majority
• 12-tick cooldown before you can leave another coalition

Proceed?`)){Jt=!0;try{const{data:e,error:t}=await w.rpc("leave_coalition",{p_faction_id:u.faction.id});if(t)throw t;if(e&&e.success===!1)throw new Error(e.error||"Unknown error");const a=e?.became_minority?`

The government is now a minority.`:"",i=(e?.ministries_vacated||0)>0?`

${e.ministries_vacated} ministr${e.ministries_vacated===1?"y":"ies"} vacated.`:"";alert("You have left the coalition."+a+i),window.location.reload()}catch(e){console.error("[PartyActions] Leave Coalition failed:",e),alert("Failed to leave coalition: "+(e?.message||e))}finally{Jt=!1}}}let Xt=!1;async function ai(){if(Xt||!u?.faction?.id||!u?.nation?.id)return;if(!Ct(u.nation)){alert("Resignation is only available in parliamentary and semi-presidential systems.");return}if(V(u.nation)){alert("Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action.");return}const e=R?.pm_party_id;if(!e||e!==u.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚠ RESIGN AS PRIME MINISTER?

The PM seat vacates immediately. Coalition enters caretaker status with
a ${ie}-tick window to nominate a successor via the cabinet panel.
If a new PM is installed, the administration continues under new leadership.
If the window expires, a snap election is called.

Cost to your party:
• −3 Momentum
• −0.05 Credibility
• Nation: −3 Stability
• 12-tick bar from the PM seat on your party

Proceed?`)){Xt=!0;try{const{data:t}=await w.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a=t?.current_tick||u.shard?.current_tick||0;(await la(w,u.nation.id,u.faction.id,a))?.result==="election_called"?alert("You have resigned. Snap election scheduled as fallback if no successor is nominated."):alert("You have resigned. Coalition has a short window to nominate a successor before a snap election fires."),window.location.reload()}catch(t){console.error("[PartyActions] Resign PM failed:",t),alert("Failed to resign: "+(t?.message||"unknown error"))}finally{Xt=!1}}}let Qt=!1;async function ii(){if(Qt||!u?.faction?.id)return;const e=u.faction,t=e.faction_name||"this party",a=e.seats||0,i=Number(e.momentum||0).toFixed(1),r=Math.round(Number(e.party_funds||0)),n=r>=1e3?"$"+r.toLocaleString():"$"+r;if(!confirm("DISBAND "+t.toUpperCase()+`?

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

This action CANNOT be undone.`))return;if(prompt('Type "DISBAND" to confirm dissolution of '+t+":")!=="DISBAND"){alert("Disband cancelled.");return}Qt=!0;try{const{data:p,error:d}=await w.rpc("disband_party",{p_faction_id:e.id});if(d)throw d;if(p&&p.success===!1)throw new Error(p.error||"Unknown error");sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:{user:s}}=await w.auth.getUser();if(s){const{data:m}=await w.from("factions").select("id, faction_type").or(`id.eq.${s.id},linked_user_id.eq.${s.id}`),l=(m||[]).find(f=>f.faction_type==="party"),c=(m||[]).find(f=>f.faction_type==="corporation");if(l){sessionStorage.setItem("active_faction_id",l.id),alert(t+` has been disbanded.

Redirecting to your other party.`),window.location.href="dashboard.html";return}if(c){sessionStorage.setItem("active_faction_id",c.id),alert(t+` has been disbanded.

Redirecting to your corporation.`),window.location.href="corp-dashboard.html";return}}alert(t+` has been disbanded.

You have no remaining factions.`),window.location.href="faction-select.html"}catch(p){console.error("[PartyActions] Disband failed:",p),alert("Disband failed: "+(p?.message||p))}finally{Qt=!1}}let Zt=!1;async function oi(){if(Zt||!u?.faction?.id||!u?.nation?.id)return;const e=u.faction,t=u.nation,a=ue(t);if(!Ct(t)){alert("A vote of no confidence is only possible in a parliamentary or semi-presidential system.");return}const{data:i}=await w.from("head_of_government").select("faction_id, last_name").eq("nation_id",t.id).eq("active",!0).maybeSingle(),r=i?.faction_id||t.ruling_faction_id||null,n=i?.last_name||null;if(!r){alert("No active Prime Minister to file against.");return}if(r===e.id){alert("Your party is the Prime Minister — you cannot file a vote of no confidence against yourself.");return}const o=u.faction?.seats!=null?Number(u.faction.seats):0;if(o<1){alert("Your party needs at least 1 seat in the legislature to file a motion.");return}const{data:p}=await w.from("shard").select("current_tick").eq("name","Alpha Shard").single(),d=p?.current_tick||u.shard?.current_tick||0,{data:s}=await w.from("bills").select("id").eq("nation_id",t.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(s&&s.length>0){alert("A motion of no confidence is already pending.");return}const{data:m}=await w.from("campaign_actions").select("tick_performed").eq("nation_id",t.id).eq("action_type","no_confidence_filed").eq("target_id",r).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(m){const f=d-Number(m.tick_performed||0);if(f<dt.NO_CONFIDENCE_COOLDOWN_TICKS){const y=dt.NO_CONFIDENCE_COOLDOWN_TICKS-f;alert(`Cooldown: ${y} tick${y!==1?"s":""} remaining before another motion can be filed against this PM party.`);return}}const l=n?a?`Motion of No Confidence in PM ${n}`:`Motion of No Confidence in the ${n} Government`:"Motion of No Confidence in the Government",c=a?`IF IT PASSES:
• PM removed — President must nominate a new PM
• Your party: +15 Momentum
• PM's party: -10 Momentum`:`IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Snap elections scheduled
• Your party: +15 Momentum
• PM's party: -10 Momentum`;if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${l}"

Cost: $0 — free to file
Voting period: ${dt.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

${c}

IF IT FAILS:
• Your party: -10 Momentum
• ${dt.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown on this PM party

Proceed?`)){Zt=!0;try{const f=await fa(w,{faction:e,nation:t,pmFactionId:r,pmLastName:n,isSemiPres:a,tick:d,mySeats:o});if(!f.ok){alert("Failed to file motion: "+f.error);return}alert(`⚡ "${f.motionName}" has been filed!

Voting is now open for ${dt.NO_CONFIDENCE_VOTING_TICKS} ticks.`),window.location.href=`bill.html?id=${f.billId}`}catch(f){console.error("[PartyActions] No confidence file failed:",f),alert("Failed to file motion: "+(f?.message||"unknown error"))}finally{Zt=!1}}}let te=!1;async function ni(e){if(te)return;const t=u.faction,a=t.seats||0,i=Math.max(1,t.momentum??0);if(a<=0){alert("Your party has no seats — nothing to fundraise from.");return}const r=Ge(a,ft);if(i-r.momCost<1){alert(`Not enough momentum. You need ${r.momCost} momentum (current: ${Math.round(i)}, floor: 1). Try again next tick when momentum recovers.`);return}te=!0;try{const{data:n}=await w.from("factions").select("party_funds, momentum").eq("id",t.id).single();n&&(t.party_funds=n.party_funds??0,t.momentum=n.momentum??0);const o=Math.max(1,t.momentum??0),p=u.shard?.current_tick||0,d=Math.max(1,o-r.momCost),s=(t.party_funds||0)+r.raised,{error:m}=await w.from("factions").update({momentum:d,party_funds:s}).eq("id",t.id);if(m){alert("Fundraise failed: "+m.message);return}await w.from("campaign_actions").insert({party_id:t.id,nation_id:u.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:p,result:{momentumDelta:-r.momCost,raised:r.raised,perSeat:r.perSeat,momCost:r.momCost,useNumber:ft+1,seats:a}}),t.momentum=d,t.party_funds=s,sessionStorage.removeItem("nationhood_state"),ft++,H(e)}catch(n){console.error("[PartyActions] Fundraise error:",n),alert("Fundraise failed.")}finally{te=!1}}function si(e){const t=document.getElementById("pa-statement-modal");if(!t)return;const a=u.faction,i=a?.color||"#c8a832",r=a?.leader_first_name&&a?.leader_last_name?`${a.leader_first_name} ${a.leader_last_name}`:"Party Leader",n=Ce.map(m=>`<div class="pa-topic-card" data-topic="${m.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${m.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${_(m.label)}</span>
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
    `,t.classList.add("active");let o=null,p=!1;const d=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",d),document.getElementById("pa-stmt-cancel")?.addEventListener("click",d),t.addEventListener("click",m=>{m.target===t&&d()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",m=>{const l=m.target.closest(".pa-topic-card");l&&(o=l.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(c=>{const f=c.dataset.topic===o;c.style.borderColor=f?i:"var(--border-mid)",c.style.background=f?i+"0a":"";const y=c.querySelector("span:last-child");y&&(y.style.color=f?"var(--text-bright)":"var(--text-secondary)")}),s())});const s=()=>{const m=document.getElementById("pa-stmt-body")?.value?.trim()||"",l=document.getElementById("pa-stmt-submit"),c=document.getElementById("pa-stmt-charcount");c&&(c.textContent=`${m.length} characters`),l&&(l.disabled=!(o&&m.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",s),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(p)return;const m=document.getElementById("pa-stmt-body")?.value?.trim();if(!o||!m||m.length<10)return;p=!0;const l=document.getElementById("pa-stmt-submit");l&&(l.disabled=!0,l.textContent="Issuing...");try{const c=u.shard?.current_tick||0,y=Ce.find(A=>A.id===o)?.label||o,v=2e4,{data:h}=await w.from("factions").select("party_funds").eq("id",a.id).single(),x=h?.party_funds||0;if(x<v){alert(`Not enough funds. You have $${Math.round(x/1e3)}k, need $20k.`);return}const b=x-v,{error:g}=await w.from("factions").update({party_funds:b}).eq("id",a.id);if(g){alert("Failed to deduct funds: "+g.message);return}a.party_funds=b;const P=Ie[Math.floor(Math.random()*Ie.length)].replace("{party_name}",a.faction_name||"Unknown Party").replace("{leader_name}",r).replace("{topic}",y),{error:S}=await w.from("campaign_actions").insert({party_id:a.id,nation_id:u.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:c,result:{topic:o,topicLabel:y,headline:P,body:m,leaderName:r}});S&&console.error("[PartyActions] Statement log failed:",S.message);const{error:I}=await w.from("valdorian_articles").insert({nation_id:u.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:P,subheadline:y,lede:m.substring(0,200)+(m.length>200?"...":""),body_paragraphs:JSON.stringify(m.split(/\n\n+/).filter(A=>A.trim())),quotes:JSON.stringify([{posture:"assertive",text:m.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([o]),source_event_id:"statement_"+Date.now(),tick:c});I&&console.error("[PartyActions] Article creation failed:",I.message);const{error:C}=await w.from("event_log").insert({nation_id:u.nation?.id,event_name:P,category:"political",description_chosen:`${a.faction_name} issues the following statement regarding ${y}: "${m}"`,fired_at_tick:c});C&&console.warn("[Statement] event_log insert failed:",C.message);const{error:k}=await w.from("admin_timeline_events").insert({nation_id:u.nation?.id,tick:c,type:"communications",title:"Statement Issued",description:`${r} issued a public statement on ${y}: "${m.substring(0,120)}${m.length>120?"...":""}"`});k&&console.warn("[Statement] timeline insert failed:",k.message),d(),H(e)}catch(c){console.error("[PartyActions] Statement error:",c),alert("Failed to issue statement. Please try again.")}finally{p=!1,l&&(l.disabled=!1,l.textContent="Issue Statement")}})}const Ot=20;function ri(e){const t=document.getElementById("pa-platform-modal");if(!t)return;const a=u.faction;u.nation;const i=a?.color||"#c8a832";let r=null,n=!1;const o={};for(const s of Rt)s.faction_id!==a?.id&&(o[s.platform_key]=(o[s.platform_key]||0)+1);const p=new Set(at.map(s=>s.platform_key));function d(){const s=ht.find(f=>f.id===r),m=s?$e(o[s.id]||0):null;s&&Rt.filter(f=>f.platform_key===s.id&&f.faction_id!==a?.id);const l=ht.map(f=>{const y=r===f.id,v=p.has(f.id),h=$e(o[f.id]||0),x=o[f.id]||0;return`<div class="pa-plat-card ${y?"selected":""} ${v?"adopted":""}" data-plat="${f.id}">
                ${v?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${f.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${v?i:y?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${_(f.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${_(f.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h.color};">${h.label}</span>
                    ${x>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${x} rival${x>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let c;if(!s)c=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const f=s.improve.map(b=>{const g=we(b,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${g.color};white-space:nowrap;">${g.arrow} ${_e[b]||b}</span>`}).join(""),y=s.worsen.map(b=>{const g=we(b,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${g.color};white-space:nowrap;">${g.arrow} ${_e[b]||b}</span>`}).join(""),v=p.has(s.id),h=at.length;let x;v?x=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:h>=3?x='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':n?x=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${_(s.name)}?</span>
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
                        <span style="font-size:22px;">${s.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${_(s.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${_(s.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${_(s.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">MOMENTUM GAIN</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${m.color};">${m.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${_(m.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${s.improve.length} stats, +${Ot} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${f}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${s.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${y}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${_(s.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${Ot}</strong>. Failure: <strong style="color:var(--red);">-20 Momentum</strong>. If you don't enter government, the promise abates.
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
                        ${c}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=f=>{f.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",f=>{const y=f.target.closest(".pa-plat-card");y&&(r=y.dataset.plat,n=!1,d())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{n=!0,d()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{n=!1,d()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>li(e,r))}t.classList.add("active"),d()}let Pt=!1;async function li(e,t){if(Pt)return;Pt=!0;const a=document.getElementById("pa-platform-modal"),i=u.faction,r=u.nation;if(!i||!r||!t){Pt=!1;return}const n=ht.find(s=>s.id===t);if(!n)return;const o={},p={},d=s=>ge.has(s);for(const s of n.improve){const m=Number(r[s]??50);o[s]=m,d(s)?p[s]=Math.max(0,m-Ot):p[s]=Math.min(100,m+Ot)}try{const s=u.shard?.current_tick||0,{data:m,error:l}=await w.rpc("adopt_platform",{p_faction_id:i.id,p_nation_id:r.id,p_platform_key:t,p_tick:s,p_baseline_stats:o,p_target_stats:p});if(l){console.error("[PartyActions] Platform adoption failed:",l.message),alert("Failed to adopt platform: "+l.message);return}if(m&&!m.success){alert(m.error||"Failed to adopt platform.");return}const c=m?.slot||at.length+1;at.push({faction_id:i.id,nation_id:r.id,platform_key:t,slot:c,adopted_at_tick:s,baseline_stats:o,target_stats:p,status:"active"}),Rt.push(at[at.length-1]),i&&m?.momentum_gained&&(i.momentum=(i.momentum||0)+m.momentum_gained),i&&(i.action_points=Math.max(0,(i.action_points||0)-2)),a?.classList.remove("active"),H(e)}catch(s){console.error("[PartyActions] Platform adoption error:",s),alert("An error occurred. Please try again.")}finally{Pt=!1}}let _t=null,Je={isGoverning:!1,statusLabel:"OPPOSITION",administration:null,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],strongholdsByParty:{},recentActivity:[],caucuses:[],nextElection:null,nextElectionTicks:null};function K(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function di(e,t,a){const i={};for(const r of e)i[r.id]=ga(r.id,t,a,3);return i}async function ci(e,t,a){_t=t;const i=document.getElementById(a);if(!i)return;const r=t.faction,n=t.nation,o=n?.id,p=r?.id;if(!r||!o){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const d=t.shard?.current_tick||0,[s,m,l,c,f,y,v,h]=await Promise.all([Oe(e,o,p),e.from("factions").select("*").eq("nation_id",o).eq("faction_type","party"),e.from("sectors").select("id, sector_key, name, weight, base_turnout, is_active").eq("nation_id",o).eq("is_active",!0).order("display_order"),e.from("campaign_actions").select("*").eq("party_id",p).order("tick_performed",{ascending:!1}).limit(20),Promise.resolve({data:[],error:null}),e.from("elections").select("*").eq("nation_id",o).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5),e.from("ministries").select("party_id").eq("nation_id",o).eq("is_active",!0),sa(o)]);m.error&&console.error("[PartyOverview] Parties fetch error:",m.error.message),l.error&&console.error("[PartyOverview] Sectors fetch error:",l.error.message),c.error&&console.error("[PartyOverview] Activity fetch error:",c.error.message),f.error&&console.error("[PartyOverview] Caucus fetch error:",f.error.message),y.error&&console.error("[PartyOverview] Election fetch error:",y.error.message);const x=m.data||[],b=l.data||[],g=s.administration,$=new Set((v.data||[]).map(L=>L.party_id).filter(Boolean));let P=[];if(x.length>0&&b.length>0){const L=x.map(N=>N.id),{data:E,error:M}=await e.from("faction_sector_popularity").select("faction_id, sector_id, popularity").in("faction_id",L);M&&console.error("[PartyOverview] Popularity fetch error:",M.message),P=E||[]}const S=di(x,b,P),I=ua(p,b,P).sort((L,E)=>(E.popularity||0)-(L.popularity||0)),C=g?.started_at_tick!=null?Math.max(0,d-g.started_at_tick):0,k=y.data||[],A=k[0]||null,T=A?Math.max(0,A.election_tick-d):null;let j=null;A&&n&&lt(n)&&(j=k.some(E=>E.election_type==="presidential"&&E.election_tick===A.election_tick)?"General":"Midterm"),Je={isGoverning:s.isGoverning,statusLabel:s.label,administration:g,ministryPartyIds:$,ticksInPower:C,myFaction:r,allParties:x,rivalParties:x.filter(L=>L.id!==p),blocMap:h,strongholdsByParty:S,mySectorContributions:I,recentActivity:c.data||[],caucuses:f.data||[],nextElection:A,nextElectionTicks:T,nextElectionLabel:j},Xe(i)}catch(d){console.error("[PartyOverview] Init error:",d),i.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}let nt=[];function Xe(e){const t=Je,a=t.myFaction,i=_t.nation,r=a?.party_color||a?.color||"#c8a832";_t.shard?.current_tick,nt.length===0&&(nt=[a?.id,...t.rivalParties.map(m=>m.id)]),t.administration?.admin_name||t.isGoverning;const n=t.statusLabel,o=t.isGoverning?"var(--green)":"var(--orange)",p=a?.seats||0,d=i?.total_seats||100,s=a?.momentum??50;e.innerHTML=`<div class="po-page">
        ${pi(t,r,p,d,s)}
        <div class="po-columns">
            <div class="po-col-left">
                ${mi(t,a,r,n,o)}
                ${fi(t,a,r)}
                ${vi(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${ui(t,s)}
                ${gi(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${yi(t,a)}
                ${bi()}
            </div>
        </div>
    </div>`,e.querySelectorAll(".po-legend-item").forEach(m=>{m.addEventListener("click",()=>{const l=m.dataset.partyId;l!==a?.id&&(nt.includes(l)?nt=nt.filter(c=>c!==l):nt.push(l),Xe(e))})})}function pi(e,t,a,i,r){const n=e.isGoverning?e.administration?.admin_name||"Government":"Opposition",o=(_t.nation?.government_type||"").toLowerCase().includes("monarchy"),p=o?"No elections":e.nextElectionTicks!=null?e.nextElectionTicks:"—",d=o?"var(--text-dim)":typeof p=="number"&&p<=3?"var(--red)":"var(--text-bright)",s=o?"NEXT ELECTION":e.nextElectionLabel?"NEXT "+e.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${K(n)}</div>
                <div class="po-summary-sub">${e.ticksInPower} ticks in power</div>
            </div>
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
            <div class="po-summary-label">${s}</div>
            <div class="po-summary-value" style="color:${d};">${p}${typeof p=="number"?" ticks":""}</div>
        </div>
    </div>`}function mi(e,t,a,i,r){const n=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",o=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const p=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${a};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${a};background:${a}12;border-color:${a}33;">${o}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                    <span class="po-identity-name">${K(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${r};background:${r}0a;border-color:${r}44;">${i}</span>
                    ${Re(t?.bloc_id,e.blocMap)}
                </div>
                <div class="po-identity-meta">${e.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${a};background:${a}15;border-color:${a}33;">${o}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${K(n)}</span>
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
    </div>`}function fi(e,t,a){const i=[{id:t?.id,name:"You",color:a},...e.rivalParties.map(d=>({id:d.id,name:d.abbreviation||d.faction_name?.slice(0,3)||"?",color:d.party_color||"#666"}))],r=i.map(d=>{const s=nt.includes(d.id);return`<div class="po-legend-item ${s?"active":"inactive"}" data-party-id="${d.id}" style="${s?`background:${d.color}12;border-color:${d.color}44;`:""}">
            <div class="po-legend-dot" style="background:${s?d.color:"var(--text-dim)"};"></div>
            <span class="po-legend-name">${K(d.name)}</span>
        </div>`}).join(""),n=new Set(nt),o=t?.id,p=i.filter(d=>n.has(d.id)).map(d=>{const s=d.color||"#666";let m;if(d.id===o){const l=(e.mySectorContributions||[]).map(c=>{const f=Math.round(Number(c.popularity)||0),y=(f/10).toFixed(1),v=f>=50?"var(--green)":f>=25?"var(--amber)":f>0?"var(--text-secondary)":"var(--text-dim)";return`<div class="po-stronghold-cell" style="border-color:${s}44;background:${s}08;">
                        <span class="po-stronghold-cell-label">${K(c.name)}</span>
                        <span class="po-stronghold-cell-value" style="color:${v};">${y}</span>
                    </div>`}).join("");m=l.length>0?`<div class="po-stronghold-grid">${l}</div>`:'<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">No active sectors in this nation.</div>'}else{const l=e.strongholdsByParty[d.id]||[];m=l.length>0?`<div class="po-stronghold-chips">${l.map(c=>`<div class="po-stronghold-chip" style="border-color:${s}44;background:${s}10;">
                        <span class="po-stronghold-chip-label">${K(c.name)}</span>
                    </div>`).join("")}</div>`:'<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">Unaligned (no sector popularity yet)</div>'}return`<div class="po-stronghold-row">
                <div class="po-stronghold-party">
                    <div class="po-legend-dot" style="background:${s};"></div>
                    <span class="po-stronghold-party-name">${K(d.name)}</span>
                </div>
                ${m}
            </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTOR STRONGHOLDS</span>
            <span class="po-card-subtitle">your popularity per sector · rivals show top 3</span>
        </div>
        <div style="padding:8px 12px;">
            <div class="po-legend">${r}</div>
            ${p||'<div style="padding:8px 0;font-size:9px;color:var(--text-dim);font-family:var(--font-mono);">No parties to display.</div>'}
        </div>
    </div>`}function vi(e){const t=(e.caucuses||[]).filter(r=>r.name&&r.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const a=e.faction?.seats||0,i=t.map(r=>{const n=r.relationship_score??50,o=n>60?"var(--green)":n>40?"var(--amber)":"var(--red)",p=Math.round((r.seat_share||0)*a),d=(r.dominant_axis||"").replace(/_/g,"/"),s=r.wing_end==="left"?d.split("/")[0]:d.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${K(r.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${K(s)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${p} seats</span>
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
    </div>`}function ui(e,t){const i=Math.round(t*8/100*10)/10,r=Math.min(100,Math.max(0,t)),n=t>=60?"var(--green)":t>=30?"var(--orange)":"var(--red)";return`<div class="po-card">
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
                <div style="height:100%;width:${r}%;background:${n};"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Decays 8%/tick</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">30% of election outcome</span>
            </div>
        </div>
    </div>`}function gi(e){const t=e.recentActivity||[],a=_t.shard?.current_tick||0;if(t.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT ACTIVITY</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No recent actions.</div>
        </div>`;const i={rally:"Rally",press_conference:"Press Conference",attack:"Attack Ad",issue_statement:"Statement",ideological_pivot:"Ideology Shift",take_stance:"Took Stance",poll_now:"Polled",endorse:"Endorsement",lobby:"Lobby"};return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT ACTIVITY</span>
        </div>
        <div style="max-height:380px;overflow-y:auto;">${t.map(n=>{const o=a-(n.tick_performed||0),p=o===0?"0t":o+"t",d=n.result||{},s=d.momentumDelta||d.momentum_delta||d.momentum||(d.momCost?-d.momCost:0)||(d.effects||[]).reduce((y,v)=>y+(v.stat==="Momentum"?v.value:0),0)||0,m=s>0?"+":"",l=s>0?"var(--green)":s<0?"var(--red)":"var(--text-dim)";let f=i[n.action_type]||n.action_type?.replace(/_/g," ")||"?";return n.action_type==="rally"?f="Rally: "+(d.outcomeName||d.label||"Unknown")+(s?" ("+m+s+")":""):n.action_type==="press_conference"?f="Press Conference ("+m+s+")":n.action_type==="attack"?f="Attack on "+(d.targetName||"rival"):n.action_type==="issue_statement"?f="Issued statement"+(s?" ("+m+s+")":""):n.action_type==="take_stance"?f="Took stance on "+(d.issueLabel||"issue"):n.action_type==="ideological_pivot"?f="Ideology shift: "+(d.targetAxis||""):n.action_type==="poll_now"&&(f="Polled (margin: "+(d.pollMargin||"?")+")"),`<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${K(f)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${l};">${s!==0?m+s:"—"}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${p}</span>
            </div>
        </div>`}).join("")}</div>
    </div>`}function yi(e,t){const a=e.rivalParties,i=e.administration,r=_t.nation,n=i?.pm_party_id,o=r?.total_seats||100,p=a.map(d=>{const s=d.party_color||"#666",m=d.abbreviation||d.faction_name?.slice(0,3)?.toUpperCase()||"?",l=d.leader_first_name&&d.leader_last_name?`${d.leader_first_name} ${d.leader_last_name}`:"Unknown",c=d.seats||0,f=$a(d,i,e.ministryPartyIds,r);let y=f.label;const v=f.isGoverning?"var(--green)":"var(--orange)";f.isGoverning&&f.label==="GOVERNING"&&(d.id===n?y="GOVERNING — LEAD":y="GOVERNING — JUNIOR");const h=c-(t?.seats||0),x=h>0?"var(--green)":h<0?"var(--red)":"var(--text-dim)",b=e.strongholdsByParty?.[d.id]||[],g=b.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;">${b.map($=>`<span style="font-family:var(--font-mono);font-size:9px;padding:2px 6px;border:1px solid ${s}44;background:${s}10;color:var(--text-bright);white-space:nowrap;">${K($.name)}</span>`).join("")}</div>`:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Unaligned</div>';return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${s}15;border:1px solid ${s}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${s};">${K(m)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${K(d.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${K(l)}</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${v};background:${v}0a;border:1px solid ${v}44;white-space:nowrap;">${y}</span>
                    ${Re(d.bloc_id,e.blocMap)}
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
    </div>`}function bi(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--text-bright);font-weight:700;">Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let O=null,F=null,bt=!1,wt=null,q=[],vt=[],et=0,le={},xe=[],Qe=null,ot=0,Bt=null,rt=0,pt=[],ee=!1,kt=null,Y={},ae=!1;function U(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function Ze(e,t){O=e,F=t;const a=t.nation,i=t.faction;if(!a||!i)return{needed:!1};const[r,n,o,p,d,s]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),ve(e,a.id),e.from("factions").select("id, faction_name, abbreviation, party_color, seats, bloc_id").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),e.from("elections").select("election_tick, election_type").eq("nation_id",a.id).eq("status","scheduled").order("election_tick",{ascending:!0}),e.from("faction_platforms").select("faction_id, platform_key, slot").eq("nation_id",a.id).eq("status","active").order("slot",{ascending:!0})]);rt=n.data?.current_tick??0,q=p.data||[],et=q.reduce((f,y)=>f+(y.seats||0),0),ot=Math.ceil(et/2)+1,xe=d?.data||[],Qe=o||null,le={},s?.error&&console.warn("[CoalitionFormation] faction_platforms query failed:",s.error.message);for(const f of s?.data||[])(le[f.faction_id]||=[]).push(f.platform_key);const m=r.data,c=!!(o||null);return lt(a)?(bt=!1,{needed:!1}):(m&&!c?(bt=!0,wt=m.id,Bt=m.election_tick):(bt=!c,m&&(wt=m.id,Bt=m.election_tick)),{needed:bt})}function xi(){const e=F?.nation;if(!e||V(e))return"";const t=lt(e),a=xe[0]||null,i=a?.election_tick??null,r=a?.election_type||"parliamentary",n=t?r==="presidential"?"General":"Midterm":"Parliamentary",o=Number(rt)||0,p=i!=null?Math.max(0,i-o):null,d=p==null?null:`${p} Month${p===1?"":"s"}`,s=i!=null?ya(i):"TBD",m=Number(e.total_seats)||0,l=Number(e.parliamentary_term_ticks)||Number(e.election_frequency)||24,c=`${l} Month${l===1?"":"s"}`,f=e.name||"Unknown",y=e.flag_url||`assets/flags/${f}.png`,v=[d,`Type: ${n}`].filter(Boolean).map(g=>`<div class="cf-eh-stat-sub">${U(g)}</div>`).join(""),h=Qe?.status||null,x=h?h.charAt(0).toUpperCase()+h.slice(1):null;return`<div class="cf-election-header">
        <div class="cf-eh-left">
            <div class="cf-eh-label">&bull; ELECTIONS</div>
            ${x?`<div class="cf-eh-gov-status">GOVERNMENT STATUS: <span class="cf-eh-gov-status-value">${U(x)}</span></div>`:""}
            <div class="cf-eh-title-row">
                <img class="cf-eh-flag" src="${U(y)}" alt="${U(f)} flag" onerror="this.style.display='none'">
                <h2 class="cf-eh-title">Elections of ${U(f)}</h2>
            </div>
        </div>
        <div class="cf-eh-stats">
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">NEXT ELECTION</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--accent">${U(s)}</div>
                ${v}
            </div>
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">TOTAL SEATS</div>
                <div class="cf-eh-stat-value">${m}</div>
                <div class="cf-eh-stat-label" style="margin-top:10px;">ELECTORAL FREQUENCY</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--sm">${U(c)}</div>
            </div>
        </div>
    </div>`}function hi(){const e=F?.nation;if(!e||V(e))return"";const t=Number(e.total_seats)||0;if(t<=0)return"";const a=q.filter(l=>(l.seats||0)>0).slice().sort((l,c)=>(c.seats||0)-(l.seats||0)),i=a.reduce((l,c)=>l+(c.seats||0),0),r=Math.max(0,t-i),n=Math.ceil(t/2)+1,o=n/t*100,p=a.map(l=>{const c=(l.seats||0)/t*100,f=l.party_color||"var(--text-dim)";return`<div class="cf-em-seg" style="width:${c}%;background:${U(f)};" title="${U(l.faction_name)}: ${l.seats} seats"></div>`}).join(""),d=r>0?`<div class="cf-em-seg cf-em-seg--stake" style="width:${r/t*100}%;">
               <span class="cf-em-stake-label">${r} SEATS AT STAKE</span>
           </div>`:"",s=a.map(l=>{const c=l.party_color||"var(--text-dim)";return`<div class="cf-em-chip">
            <span class="cf-em-swatch" style="background:${U(c)};"></span>
            <span class="cf-em-chip-name">${U(l.faction_name)}</span>
            <span class="cf-em-chip-count">${l.seats}</span>
            <span class="cf-em-chip-unit">seats</span>
        </div>`}).join(""),m=r>0?`<div class="cf-em-chip">
               <span class="cf-em-swatch cf-em-swatch--stake"></span>
               <span class="cf-em-chip-name">At Stake</span>
               <span class="cf-em-chip-count">${r}</span>
               <span class="cf-em-chip-unit">seats</span>
           </div>`:"";return`<div class="cf-electoral-makeup">
        <div class="cf-em-header">
            <div class="cf-em-title">&#9642; ELECTORAL MAKEUP</div>
            <div class="cf-em-meta">MAJORITY AT <span class="cf-em-majority">${n} SEATS</span> &middot; ${t} TOTAL</div>
        </div>
        <div class="cf-em-bar">
            ${p}
            ${d}
            <div class="cf-em-majority-tick" style="left:${o.toFixed(2)}%;"></div>
        </div>
        <div class="cf-em-legend">
            ${s}
            ${m}
        </div>
    </div>`}async function gt(e){if(!e)return;if(V(F.nation)){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}const t=xi(),a=hi(),i=a?`<div class="cf-makeup-row">
               <div class="cf-makeup-left"></div>
               <div class="cf-makeup-right">${a}</div>
           </div>`:"";if(lt(F.nation)){const b=ue(F.nation);e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${b?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${b?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}if(!bt){e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!wt){const b=xe[0]?.election_tick,g=b!=null?Math.max(0,b-rt):"?";e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${g}</strong> tick${g!==1?"s":""}.</div>
            </div>
        </div>`;return}await Ci();const r=F.faction,n=Bt!==null?Math.max(0,rt-Bt):0,o=Math.max(0,ie-n),p=Math.min(100,n/ie*100),d=n*2;let s="safe";o<=1?s="critical":o<=2&&(s="warning");const m=s==="critical"?"⚠️":s==="warning"?"⏳":"🤝",l=s==="critical"?"No Government — Snap Election Imminent":s==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",c=s==="critical"?"Form a government immediately or face snap elections":s==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",f=q.find(b=>b.id===r.id)?.seats||0,y=f>0,v=vt.some(b=>b.proposed_by===r.id);let h="";if(!y)h='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(v)h='<div class="cf-note">You have already submitted a proposal for this election.</div>';else{const b=$=>($||[]).map(P=>P.replace(/_/g," ")).join(", "),g=q.map($=>{const P=$.id===r.id,S=$.seats||0,I=$.party_color||"#888",k=(le[$.id]||[]).map(T=>ht.find(j=>j.id===T)).filter(Boolean).map(T=>`<div class="cf-platform">
                <span class="cf-platform-label"><span class="cf-platform-icon">${T.icon}</span> ${U(T.name)}</span>
                <span class="cf-platform-stats">
                    <span class="cf-stat-up">&uarr; ${b(T.improve)}</span>
                    <span class="cf-stat-down">&darr; ${b(T.worsen)}</span>
                </span>
            </div>`).join(""),A=k?`<div class="cf-check-platforms">${k}</div>`:'<div class="cf-check-platforms cf-check-platforms--empty">No adopted platforms.</div>';return`<div class="cf-party-check ${P?"checked disabled":""}" data-party-id="${$.id}" style="border-left:3px solid ${I};">
                <div class="cf-party-info">
                    <div class="cf-check-box">${P?"✓":""}</div>
                    <span class="cf-check-name">${U($.faction_name)}</span>
                    <span class="cf-check-seats">${S} seats</span>
                </div>
                ${A}
            </div>`}).join("");h=`
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${ot}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${g}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${f}</span> / ${et}
                    (<span id="cf-preview-pct">${et?Math.round(f/et*100):0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${ot} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
            </div>`}const x=vt.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${vt.map(b=>{const g=q.find(M=>M.id===b.proposed_by),$=b.party_ids||[],P=$.reduce((M,N)=>M+(q.find(z=>z.id===N)?.seats||0),0),S=et?Math.round(P/et*100):0,I=P>=ot,C=$.map(M=>{const N=q.find(z=>z.id===M);return`<span class="cf-party-chip" style="border-left:2px solid ${N?.party_color||"#888"};">${U(N?.faction_name||"?")} · ${N?.seats||0}</span>`}).join("");let k="";b.iAmSupporting?k='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':b.iAmInvited?k='<span class="cf-status cf-status--invited">INVITED</span>':k='<span class="cf-status cf-status--locked">NOT INVITED</span>';const A=b.iAmInvited&&!b.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${b.id}" data-action="support">Support This Coalition</button>`:b.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${b.id}" data-action="withdraw">Withdraw Support</button>`:"",T=b.supportCount>=b.coalitionSize,j=kt===b.id,L=T&&b.iAmInvited&&!j,E=T&&j;return`<div class="cf-proposal-card ${b.iAmSupporting?"supporting":""} ${b.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${U(g?.faction_name||"Unknown")} Coalition ${k}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${I?"var(--green)":"var(--red)"};">${P}</span> (${S}%) ${I?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${C}</div>
                <div class="cf-proposal-support">Support: ${b.supportCount} / ${b.coalitionSize} coalition members ${T?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${A}
                ${L?`<button class="cf-support-btn" data-formation-id="${b.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${E?$i(b):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`${t}${i}
    <div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${s}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${m}</span>
                <div>
                    <div class="cf-banner-title">${l}</div>
                    <div class="cf-banner-subtitle">${c}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${s}" style="width:${p}%;"></div></div>
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
                    <div class="cf-penalty-val" style="color:var(--red);">-${d}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${h}
        ${x}
    </div>`,pt=[r.id],Ii(e)}const _i={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"};function wi(e){const t=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"],a=["interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];return ue(e)?t:lt(e)?a:t}function $i(e){const t=(e.party_ids||[]).map(s=>q.find(m=>m.id===s)).filter(Boolean),a=(e.party_ids||[]).includes(F.faction?.id);Y={...e.ministry_assignments||{}};const r=F.faction?.id,n=Y.prime_minister,o=n===r;let p=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const s of pa){const m=_i[s]||s,l=s==="prime_minister",c=Y[s];a&&(p+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${l?"700":"400"};color:${l?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${m}</span>
                <select data-ministry="${s}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(f=>`<option value="${f.id}" ${c===f.id?"selected":""}>${U(f.faction_name)} (${f.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const d=!!Y.prime_minister;if(d&&o)p+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(d&&!o){const s=t.find(m=>m.id===n);p+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${U(s?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else p+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return p+="</div>",p}async function ki(e,t){if(ae)return;const a=Y.prime_minister;if(!a){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(Y)),console.log("[Coalition] Formation:",e.id,"PM party:",a),ae=!0;const i=document.getElementById("cf-form-gov-btn");i&&(i.disabled=!0,i.textContent="FORMING...");try{const r=F.nation,n=r.id,o=Dt(r?.name)||{},p=o.firstNames||["Alex","Maria","Carlos"],d=o.lastNames||["Garcia","Torres","Silva"],s={};for(const[x,b]of Object.entries(Y||{}))b&&(s[x]={first_name:p[Math.floor(Math.random()*p.length)],last_name:d[Math.floor(Math.random()*d.length)],age:35+Math.floor(Math.random()*25)});const{error:m}=await O.from("government_formations").update({ministry_assignments:Y,minister_names:s}).eq("id",e.id);if(m)throw new Error("Failed to save assignments: "+m.message);let l=!1;try{const x=Nt?Nt(null,r):{},{error:b}=await O.rpc("finalize_government_formation",{p_formation_id:e.id,p_caller_faction_id:F.faction.id,p_ministry_baselines:x||{}});if(b)throw b;l=!0}catch(x){console.warn("[Coalition] RPC failed, using fallback:",x.message)}l||await Ei(e),await O.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id),await O.from("government_formations").update({status:"dissolved"}).eq("nation_id",n).neq("id",e.id).in("status",["active","caretaker","formed"]);const f=wi(r).length,{count:y}=await O.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",n).eq("is_active",!0),{count:v}=await O.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",n).eq("is_active",!0).is("party_id",null);(!y||y<f||v&&v>0)&&(console.warn(`[Coalition] Ministry invariant check failed (expected=${f}, active=${y||0}, vacant=${v||0}) — populating from assignments`),await ta(n));const h={id:e.id,party_ids:e.party_ids||[],lead_party_id:Y.prime_minister};await Fe(O,n,F.nation,"election",h,q,rt,F.shard?.current_date||"",Number(F.nation?.gov_approval??50)),await ca(O,n,a,rt,{skipCoalitionCheck:!0}),bt=!1,alert("Government formed successfully!"),await gt(t)}catch(r){console.error("[Coalition] Form government failed:",r),alert("Failed to form government: "+(r.message||r))}finally{ae=!1,i&&(i.disabled=!1,i.textContent="FORM GOVERNMENT")}}async function Ei(e){const t=F.nation.id,{error:a}=await O.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",e.id);a&&console.warn("[Coalition] Failed to cancel rival formations:",a.message);const{error:i}=await O.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);if(i)throw i;const{error:r}=await O.from("nations").update({failed_formation_attempts:0}).eq("id",t);r&&console.warn("[Coalition] Failed to reset formation attempts:",r.message),await ta(t);const n={id:e.id,party_ids:e.party_ids||[],lead_party_id:Y.prime_minister};await Fe(O,t,F.nation,"election",n,q,rt,F.shard?.current_date||"",Number(F.nation?.gov_approval??50));try{const o=Y.prime_minister,p=q.find(s=>s.id===o),d=(e.party_ids||[]).map(s=>{const m=q.find(l=>l.id===s);return m?`${m.faction_name} (${m.seats||0})`:null}).filter(Boolean).join(", ");await O.from("event_log").insert({nation_id:t,event_name:"Coalition Government Formed",category:"government",fired_at_tick:rt,description_used:`${p?.faction_name||"PM party"} formed a coalition government with: ${d}`,description_chosen:`${p?.faction_name||"PM party"} formed a coalition government with: ${d}`})}catch(o){console.warn("[Coalition] event_log insert failed (non-fatal):",o.message)}}async function ta(e){let t=0;for(const[a,i]of Object.entries(Y)){if(!i)continue;const r=Dt(F.nation?.name)||{},n=r.firstNames||["Alex","Maria","Carlos"],o=r.lastNames||["Garcia","Torres","Silva"],p=n[Math.floor(Math.random()*n.length)],d=o[Math.floor(Math.random()*o.length)],s=35+Math.floor(Math.random()*25),m=Nt?Nt(a,F.nation):{},{data:l,error:c}=await O.from("ministries").update({party_id:i,minister_first_name:p,minister_last_name:d,minister_age:s,minister_approval:50,stat_baselines:m,is_active:!0}).eq("nation_id",e).eq("ministry_key",a).select("id");if(c)console.error(`[Coalition] FAILED to update ministry ${a}:`,c.message);else if(!l||l.length===0){const{error:f}=await O.from("ministries").insert({nation_id:e,ministry_key:a,ministry_name:ma[a]||a,party_id:i,minister_first_name:p,minister_last_name:d,minister_age:s,minister_approval:50,stat_baselines:m,is_active:!0});f?console.error(`[Coalition] FAILED to insert ministry ${a}:`,f.message):t++}else t++}console.log(`[Coalition] Updated ${t} ministries for nation ${e}`)}async function Ci(){if(!wt){vt=[];return}const{data:e}=await O.from("government_formations").select("*").eq("election_id",wt).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const a of e||[]){const{data:i}=await O.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),r=a.party_ids||[],o=(i||[]).filter(l=>r.includes(l.faction_id)).filter(l=>l.supports).length,p=r.length,s=(i||[]).find(l=>l.faction_id===F.faction?.id)?.supports===!0,m=r.includes(F.faction?.id);t.push({...a,supportCount:o,coalitionSize:p,iAmSupporting:s,iAmInvited:m})}vt=t}let Ae=!1;function Ii(e){Ae||(Ae=!0,e.addEventListener("click",async t=>{const a=t.target.closest(".cf-party-check:not(.disabled)");if(a){const r=a.dataset.partyId,o=q.find(s=>s.id===r)?.bloc_id||null,p=!pt.includes(r),d=o?q.filter(s=>s.bloc_id===o).map(s=>s.id):[r];for(const s of d){const m=pt.indexOf(s);p&&m===-1&&pt.push(s),!p&&m>-1&&pt.splice(m,1);const l=e.querySelector(`.cf-party-check[data-party-id="${s}"]`);if(!l)continue;l.classList.toggle("checked",p);const c=l.querySelector(".cf-check-box");c&&(c.textContent=p?"✓":"")}Mi();return}if(t.target.closest("#cf-propose-btn")){await Si(e);return}const i=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(i){const r=i.dataset.formationId,n=i.dataset.action;if(n==="configure"){kt=r;const o=vt.find(p=>p.id===r);o&&(Y={...o.ministry_assignments||{}}),await gt(e)}else await Li(r,n==="support",e);return}if(t.target.closest("#cf-form-gov-btn")){const r=vt.find(n=>n.id===kt);r&&await ki(r,e);return}}),e.addEventListener("change",t=>{const a=t.target.closest(".cf-ministry-select");if(!a)return;const i=a.dataset.ministry,r=a.value||null;Y[i]=r,kt&&O.from("government_formations").update({ministry_assignments:Y}).eq("id",kt).then(({error:o})=>{o&&console.warn("[Coalition] Failed to save assignment:",o.message)});const n=document.getElementById("cf-form-gov-btn");if(n){const o=!!Y.prime_minister;n.disabled=!o,n.style.color=o?"#000":"var(--text-dim)",n.style.background=o?"var(--green)":"var(--bg-body)",n.style.borderColor=o?"var(--green)":"var(--border-main)",n.style.cursor=o?"pointer":"not-allowed"}}))}function Mi(){const e=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const i=pt.reduce((o,p)=>o+(q.find(d=>d.id===p)?.seats||0),0),r=et?Math.round(i/et*100):0,n=i>=ot;e.textContent=i,e.style.color=n?"var(--green)":"var(--text-bright)",t.textContent=r,a.textContent=n?`✓ Meets ${ot}-seat threshold`:`— needs ${ot} seats`,a.style.color=n?"var(--green)":"var(--text-dim)"}async function Si(e){if(ee)return;const t=F.faction;if((q.find(o=>o.id===t.id)?.seats||0)===0)return;const i=[...new Set(pt)],r=i.reduce((o,p)=>o+(q.find(d=>d.id===p)?.seats||0),0);if(r<ot){alert(`Coalition needs ${ot} seats. Currently: ${r}.`);return}ee=!0;const n=document.getElementById("cf-propose-btn");n&&(n.disabled=!0,n.textContent="Submitting...");try{const{data:o}=await O.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:p,error:d}=await O.from("government_formations").insert({nation_id:F.nation.id,election_id:wt,proposed_by:t.id,party_ids:i,status:"active",game_year:o?.current_date||""}).select().single();if(d){alert("Error: "+d.message);return}const{error:s}=await O.from("government_formation_support").upsert({formation_id:p.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});s&&console.warn("[Coalition] Auto-support insert failed:",s.message),await gt(e)}catch(o){console.error("[Coalition] Create proposal error:",o),alert("Failed to create proposal: "+(o.message||o))}finally{ee=!1}}async function Li(e,t,a){try{const{error:i}=await O.from("government_formation_support").upsert({formation_id:e,faction_id:F.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});i&&console.error("[Coalition] Toggle support error:",i.message),await gt(a)}catch(i){console.error("[Coalition] Toggle support error:",i)}}let Tt=null,ct=[],de=[],ce=null;function X(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Te(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?Math.round(e/1e3)+"k":String(e)}function Pi(e){return["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]+", "+(2e3+Math.floor(e/12))}function Ai(e,t){if((e.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const i=t?.end_reason||"";return i.includes("no_confidence")||i.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:i.includes("snap")||i.includes("dissolved")||i.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function Ti(e,t){Tt=t;const a=document.getElementById("pa-past-elections-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const i=t.nation?.id;if(!i){a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[r,n,o]=await Promise.all([e.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",i).eq("status","completed").order("election_tick",{ascending:!1}),e.from("administrations").select("*").eq("nation_id",i).order("started_at_tick",{ascending:!1}),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i).eq("faction_type","party").is("abandoned_at",null)]);ct=r.data||[],de=n.data||[];const p=o.data||[],d={};for(const s of p)d[s.id]=s;for(const s of ct){const m=s.results?.votes||[];for(const l of m){const c=d[l.party_id];c?(l.color=c.party_color||"#666",l.abbreviation=c.abbreviation||l.party_name?.slice(0,3)?.toUpperCase()||"?"):(l.color="#666",l.abbreviation=l.party_name?.slice(0,3)?.toUpperCase()||"?")}}Ni(a),ea(a)}function Ni(e){e.addEventListener("click",t=>{const a=t.target.closest("[data-election-id]");if(a){const i=a.dataset.electionId;ce=ce===i?null:i,ea(e)}})}function ea(e,t){if(ct.length===0){e.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const a=Tt.faction?.id,i=Tt.nation?.total_seats||100,r=Math.ceil(i/2)+1,n=ct.map((o,p)=>{const d=ce===o.id,s=(o.results?.votes||[]).sort((k,A)=>(A.seats||0)-(k.seats||0)),m=s.slice(0,3),l=o.results?.turnout_pct??0,c=o.results?.total_votes_cast??0,f=o.results?.sector_breakdown?.independent_seats??0,y=Pi(o.election_tick),v=de.find(k=>k.started_at_tick>=o.election_tick&&k.started_at_tick<=o.election_tick+5),h=de.find(k=>k.ended_at_tick!=null&&k.ended_at_tick>=o.election_tick-2&&k.ended_at_tick<=o.election_tick+2),x=Ai(o,h),b=lt(Tt.nation),g=b?"President":"PM",$=v?.prime_minister||"Unknown",P=v?.pm_party_id&&s.find(k=>k.party_id===v.pm_party_id)?.color||"#888",I=(p<ct.length-1?ct[p+1]:null)?.results?.votes||[];let C=`<div data-election-id="${o.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${d?"border-bottom:none;":""}
        ">
            <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                    <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${y}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${x.color};background:${x.color}0a;border:1px solid ${x.color}25;">${x.label.toUpperCase()}</span>
                    <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                        ${m.map(k=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${k.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${X(k.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${k.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${g}: <span style="color:${P};font-weight:700;">${X($)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${d?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(d){const k=s.map(E=>`<div style="width:${E.seats/i*100}%;background:${E.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${E.seats>=8?9:6}px;font-weight:700;color:#000;">${E.seats>=5?E.seats:""}</div>`).join(""),A=f>0?`<div style="width:${f/i*100}%;background:#ffffff;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${f>=8?9:6}px;font-weight:700;color:#000;" title="Independents">${f>=5?f:""}</div>`:"",T=k+A,j=s.map(E=>{const M=E.party_id===a,N=I.find(Gt=>Gt.party_id===E.party_id),z=N?E.seats-(N.seats||0):null,W=E.seats/i*100-(E.vote_percentage||0);return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${M?`background:${E.color}08;`:""}">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:${E.color}15;border:1px solid ${E.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${E.abbreviation?.slice(0,2)||"?"}</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${X(E.party_name)}</span>
                            ${M?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${E.color};">${X(E.abbreviation)}</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${E.seats}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${z!=null?z>0?"#5c5":z<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${z!=null?z>0?"▲ "+z:z<0?"▼ "+Math.abs(z):"—":"NEW"}</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${Te(E.votes||0)}</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(E.vote_percentage||0).toFixed(1)}%</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(W)<2?"var(--text-dim)":W>0?"#5c5":"#c84"};">${W>0?"+":""}${W.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(W)<2?"proportional":W>0?"overrep.":"underrep."}</span></span>
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
                </div>`:"");let L="";if(v){const E=v.coalition_parties||[],M=v.total_seats||E.reduce((J,Mt)=>J+(Mt.seats||0),0),N=M>=r,z=N?"Majority Coalition":"Minority Coalition",he=v.ended_at_tick?v.end_reason||"Ended":"Current Government",W=v.ended_at_tick?"var(--text-dim)":"#5c5",Gt=v.ended_at_tick?Math.abs(v.ended_at_tick-v.started_at_tick)+" ticks":"Ongoing",ia=E.map(J=>{const Mt=s.find(qt=>qt.party_id===J.party_id)?.color||"#666";return`<div style="width:${M>0?(J.seats||0)/M*100:0}%;background:${Mt};height:100%;"></div>`}).join(""),oa=E.map(J=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${s.find(qt=>qt.party_id===J.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${X(J.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${J.seats||0}</span>
                    </div>`).join("");L=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${P};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${W};background:${W}0a;border:1px solid ${W}25;">${X(he.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${Gt}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${P}15;border:1.5px solid ${P};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${P};">${X($.split(" ").map(J=>J[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${X($)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${b?"President":"Prime Minister"} &middot; ${X(v.pm_party_name||"")} &middot; ${z}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${ia}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${oa}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${N?"#5c5":"#c84"};">${M} seats ${N?"(majority +"+(M-r)+")":"(minority, "+(r-M)+" short)"}</span>
                        </div>
                    </div>
                </div>`}C+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${X(x.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${l>70?"#5c5":l>60?"#ca5":"#c84"};">${l.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${Te(c)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${T}</div>
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
                    ${j}
                </div>

                ${L}
            </div>`}return C}).join("");e.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${ct.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${n}</div>
    </div>`}let tt=null,pe=!1,Ne=!1,me=!1,ze=!1,fe=!1;function aa(e){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===e)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+e)),sessionStorage.setItem("party_subtab",e),e==="actions"&&!pe&&tt&&(pe=!0,He(yt,tt)),e==="parties"&&!Ne&&tt&&(Ne=!0,ci(yt,tt,"pa-parties-root")),e==="election"&&!me&&tt&&(me=!0,fe?gt(document.getElementById("pa-election-root")):Ze(yt,tt).then(()=>{fe=!0,gt(document.getElementById("pa-election-root"))})),e==="past-elections"&&!ze&&tt&&(ze=!0,Ti(yt,tt))}document.getElementById("pa-subtabs").addEventListener("click",e=>{const t=e.target.closest(".pa-subtab");!t||t.classList.contains("active")||aa(t.dataset.panel)});ra("politics",async e=>{tt=e,Ze(yt,e).then(({needed:a})=>{if(fe=!0,a){const i=document.querySelector('.pa-subtab[data-panel="election"]');i&&!i.querySelector(".pa-subtab-badge")&&(i.innerHTML+='<span class="pa-subtab-badge"></span>');const r=document.querySelector('.nav-tab[data-tab="politics"]');r&&!r.querySelector(".pa-subtab-badge")&&(r.innerHTML+='<span class="pa-subtab-badge"></span>')}me&&gt(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?aa(t):(pe=!0,await He(yt,e))});
