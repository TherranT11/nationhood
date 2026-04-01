import{_ as l}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as Ma,c as wt}from"./common-BedtaFOo.js";import"./guide-RrxJIDYT.js";import{e as g,t as ie}from"./utils-C2W-HleY.js";import{a as Ia,o as Na,p as vi,G as M,P as Ra,F as La,f as ft,j as at,q as Oa,t as Da,u as qa,w as Ba,h as Fa,x as Ha,y as gi,z as za}from"./autocracy-silent-coup-vxZQTTX4.js";import{a as yi,i as Ua,m as hi,l as jt,d as ja,a7 as Ga}from"./government-structure-DKbbGMPO.js";import{a as Gt,c as Yt,M as Ya,s as bi,d as $t}from"./stats-Cp9T3CP_.js";import{E as K,i as wi,e as $i,f as Ei,c as Va,S as Ka,b as Wa,d as Ja,g as Xa,h as Qa,j as Za,k as es}from"./executive-orders-CpgJHxS-.js";import{P as _t,e as ts,a as is,b as ns}from"./protest-B06Bz2EW.js";import{c as Ce}from"./party-icons-CJ7uQoDE.js";const Ai=["army","navy","air_force","intelligence","nuclear"],Et={army:"ARMY",navy:"NAVY",air_force:"AIR FORCE",intelligence:"INTELLIGENCE",nuclear:"NUCLEAR"},as=200,Ue=120,Ne="nuclear",Re={active_defense:{id:"active_defense",sector:"army",name:"Active Defense",desc:"Forward-positioned defensive posture that intercepts threats before they reach home territory.",apCost:3},counterinsurgency:{id:"counterinsurgency",sector:"army",name:"Counterinsurgency",desc:"Optimises the army for suppressing internal threats, civil unrest, and irregular forces.",apCost:4},asymmetric_warfare:{id:"asymmetric_warfare",sector:"army",name:"Asymmetric Warfare",desc:"Unconventional guerrilla tactics designed to counter larger or better-equipped adversaries.",apCost:4},praetorian_doctrine:{id:"praetorian_doctrine",sector:"army",name:"Praetorian Doctrine",desc:"Maintains elite units personally loyal to the head of government, insulating the regime against coups and internal military dissent.",apCost:0,permanent:!0,autocracyOnly:!0,hidden:!0},combined_battle:{id:"combined_battle",sector:"army",name:"Combined Battle",desc:"Integrated multi-domain warfare with army units operating jointly across air and naval assets.",apCost:6},joint_command_operations:{id:"joint_command_operations",sector:"army",name:"Joint Command Operations",desc:"Centralised command architecture across all branches enabling coordinated rapid response.",apCost:8},near_seas_defense:{id:"near_seas_defense",sector:"navy",name:"Near Seas Defense",desc:"Prioritises control of coastal waters and adjacent seas close to national territory.",apCost:3},trade_interdiction:{id:"trade_interdiction",sector:"navy",name:"Trade Interdiction",desc:"Aggressively controls sea lanes to protect friendly commerce and disrupt rival shipping.",apCost:5},submarine_deterrent:{id:"submarine_deterrent",sector:"navy",name:"Submarine Deterrent",desc:"Maintains a hidden undersea strike capability whose location is never publicly confirmed.",apCost:6},autonomous_power_projection:{id:"autonomous_power_projection",sector:"navy",name:"Autonomous Power Projection",desc:"Independent deep-water strike capability allowing the nation to project force globally without allied support.",apCost:6},blue_water_fleet:{id:"blue_water_fleet",sector:"navy",name:"Blue Water Fleet",desc:"Maintains a large capable open-ocean surface fleet able to sustain operations across international waters.",apCost:8},airlift_logistics:{id:"airlift_logistics",sector:"air_force",name:"Airlift & Logistics",desc:"Prioritises strategic transport and supply chain operations over combat capability.",apCost:3},close_air_support:{id:"close_air_support",sector:"air_force",name:"Close Air Support",desc:"Optimises aircraft for supporting ground troops in tactical operations rather than independent missions.",apCost:4},air_superiority:{id:"air_superiority",sector:"air_force",name:"Air Superiority",desc:"Focuses the air force on dominating the skies and denying enemy air operations.",apCost:5},drone_warfare:{id:"drone_warfare",sector:"air_force",name:"Drone Warfare",desc:"Builds a doctrine around unmanned systems for persistent surveillance and low-casualty strike operations.",apCost:6},strategic_bombing:{id:"strategic_bombing",sector:"air_force",name:"Strategic Bombing",desc:"Develops long-range offensive strike capability for deep penetration missions against distant targets.",apCost:8},counterintelligence:{id:"counterintelligence",sector:"intelligence",name:"Counterintelligence",desc:"Defensive posture focused on protecting the nation against foreign infiltration and internal corruption.",apCost:3},domestic_surveillance:{id:"domestic_surveillance",sector:"intelligence",name:"Domestic Surveillance",desc:"Monitors internal dissidents, opposition movements, and civil society for threats to stability.",apCost:3},signal_intelligence:{id:"signal_intelligence",sector:"intelligence",name:"Signal Intelligence",desc:"Intercepts and analyses foreign communications to build diplomatic and military awareness.",apCost:4},cybersecurity:{id:"cybersecurity",sector:"intelligence",name:"Cybersecurity",desc:"Develops both defensive network protection and offensive digital operations capability.",apCost:5},foreign_intelligence:{id:"foreign_intelligence",sector:"intelligence",name:"Foreign Intelligence",desc:"Runs external espionage operations and signals collection against rival nations.",apCost:6},covert_operations:{id:"covert_operations",sector:"intelligence",name:"Covert Operations",desc:"Maintains a deniable black ops capability for interference in foreign nations and actors.",apCost:8},non_nuclear_power:{id:"non_nuclear_power",sector:"nuclear",name:"Non-Nuclear Power",desc:"Publicly commits to maintaining no nuclear weapons capability as a trust and soft power signal.",apCost:0,startingDoctrine:!0},non_proliferation:{id:"non_proliferation",sector:"nuclear",name:"Non-Proliferation",desc:"Commits to actively opposing the spread of nuclear weapons while maintaining existing capability.",apCost:4,requiresNuclearCapability:!0},deterrence:{id:"deterrence",sector:"nuclear",name:"Deterrence",desc:"Matches rival nuclear capability without escalating, seeking a stable deterrence equilibrium.",apCost:4,requiresNuclearCapability:!0},mutually_assured_destruction:{id:"mutually_assured_destruction",sector:"nuclear",name:"Mutually Assured Destruction",desc:"Maintains a credible retaliatory second-strike capability that makes nuclear war unwinnable for all parties.",apCost:6,requiresNuclearCapability:!0},first_strike_doctrine:{id:"first_strike_doctrine",sector:"nuclear",name:"First Strike Doctrine",desc:"Signals willingness to use nuclear weapons preemptively, maximising deterrence through aggression.",apCost:8,requiresNuclearCapability:!0}};function ss(xe){return Object.values(Re).filter(Ae=>Ae.sector===xe)}function os(xe,Ae){return xe.id==="non_nuclear_power"?{allowed:!0}:Ae.nation.hasNuclearCapability?{allowed:!0}:{allowed:!1,message:"Nation is not equipped with any nuclear weapons."}}const rs={announced_nation:["{nation_name} has formally adopted {doctrine_name} as official {sector} doctrine.","The Ministry of Defense has announced {doctrine_name}. Effective in 3 ticks.","{nation_name} commits to {doctrine_name}. The military begins restructuring.","Defense Ministry confirms new {sector} posture: {doctrine_name}."],announced_world:["{nation_name} has declared {doctrine_name} as its official {sector} stance.","{nation_name} announces {doctrine_name}. Regional observers are watching.","{nation_name} shifts {sector} posture to {doctrine_name}.","New military doctrine declared: {nation_name} adopts {doctrine_name}."],renounced_nation_start:["{nation_name} has begun the process of renouncing {doctrine_name}. Cooldown: 120 ticks.","The Ministry of Defense initiates renunciation of {doctrine_name}.","{doctrine_name} renunciation underway. Full deactivation in 120 ticks.","{nation_name} moves to step back from {doctrine_name}."],renounced_nation_complete:["{doctrine_name} has been fully renounced. {sector} doctrine updated.","{nation_name} has completed renunciation of {doctrine_name}.","{doctrine_name} is no longer active {nation_name} policy.","Renunciation complete: {doctrine_name} removed from {nation_name}'s military posture."],renounced_world_complete:["{nation_name} has renounced {doctrine_name}.","{nation_name} formally withdraws {doctrine_name} from its military posture.","{doctrine_name} is no longer active policy in {nation_name}.","{nation_name} steps back from {doctrine_name}. Analysts note the shift."],nuclear_transition_world:["{nation_name} is shifting nuclear doctrine from {old_doctrine} to {new_doctrine}.","{nation_name} nuclear posture update: {old_doctrine} out, {new_doctrine} incoming.","{nation_name} announces nuclear doctrine transition. Full effect in 120 ticks.","Significant shift: {nation_name} moves from {old_doctrine} toward {new_doctrine}."]};function cs(xe,Ae){return xe[Math.floor(Math.random()*xe.length)].replace(/\{(\w+)\}/g,(ge,ke)=>Ae[ke]||ke)}(function(){const xe={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function Ae(e){return xe[(e||"").toLowerCase()]||"#9C27B0"}const we=40,ge={prime_minister:"Prime Minister",interior:"Ministry of the Interior",foreign:"Foreign Ministry",defense:"Ministry of Defense",finance:"Ministry of Finance",education:"Ministry of Education",healthcare:"Ministry of Healthcare",labor:"Ministry of Labor",justice:"Ministry of Justice",trade:"Ministry of Trade",energy:"Ministry of Energy",transportation:"Ministry of Transportation",security:"Ministry of Security"},ke=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"],Ci=[1,.7,.4,.15];function vt(e){return Ci[Math.min(e,3)]}const ue={interior:{actions:[{id:"enforcePublicOrder",triggerKey:"ministry_enforce_public_order",name:"Enforce Public Order",desc:"Deploy law enforcement to suppress crime and unrest. Effective but politically costly.",apCosts:[2,3,5,8],budgetPerCapita:1e6/4e6,delay:1,duration:4,decayTicks:3,useResetInterval:15,tags:[{label:"CRIME −2",cls:"positive"},{label:"INCARCERATION +3",cls:"negative"},{label:"HAPPINESS −2",cls:"negative"},{label:"SOC. MOBILITY −1",cls:"negative"}],baseEffects:[{stat_key:"crime_rate",direction:"down",rate:2,scalable:!0},{stat_key:"incarceration_rate",direction:"up",rate:3,scalable:!0},{stat_key:"happiness",direction:"down",rate:2,scalable:!1},{stat_key:"social_mobility",direction:"down",rate:1,scalable:!1}]},{id:"communityOutreach",triggerKey:"ministry_community_outreach",name:"Community Outreach",desc:"Grassroots engagement to build trust and improve quality of life. Slow but sustainable.",apCosts:[1,2,3,4],budgetPerCapita:1e6/2e7,delay:3,duration:8,decayTicks:4,useResetInterval:10,tags:[{label:"HAPPINESS +2",cls:"positive"},{label:"CRIME −1",cls:"positive"},{label:"STD OF LIVING +1",cls:"positive"}],baseEffects:[{stat_key:"happiness",direction:"up",rate:2,scalable:!0},{stat_key:"crime_rate",direction:"down",rate:1,scalable:!0},{stat_key:"standard_of_living",direction:"up",rate:1,scalable:!0}]},{id:"surveillanceExpansion",triggerKey:"ministry_surveillance_expansion",name:"Surveillance Expansion",desc:"Expand digital monitoring infrastructure. Permanent residue penalties compound with each use.",apCosts:[2,4,7,11],budgetPerCapita:1e6/1e7,delay:2,duration:10,decayTicks:5,useResetInterval:20,tags:[{label:"CRIME −5",cls:"positive"},{label:"HAPPINESS −2",cls:"negative"},{label:"DIGI INFRA +2",cls:"positive"},{label:"STD OF LIVING −1",cls:"negative"}],baseEffects:[{stat_key:"crime_rate",direction:"down",rate:5,scalable:!0},{stat_key:"happiness",direction:"down",rate:2,scalable:!1},{stat_key:"digital_infrastructure",direction:"up",rate:2,scalable:!1},{stat_key:"standard_of_living",direction:"down",rate:1,scalable:!1}]}]},finance:{actions:[{id:"stimulusPackage",triggerKey:"ministry_stimulus_package",name:"Stimulus Package",desc:"Inject government spending into the economy to boost short-term growth and employment.",apCosts:[2,3,5,8],budgetPerCapita:1e6/8e6,delay:1,duration:6,decayTicks:4,useResetInterval:15,conflictsWith:"austerityMeasures",tags:[{label:"GDP +0.4",cls:"positive"},{label:"UNEMPLOYMENT −1",cls:"positive"},{label:"INFLATION +0.3",cls:"negative"}],baseEffects:[{stat_key:"gdp_growth",direction:"up",rate:.4,scalable:!0},{stat_key:"unemployment",direction:"down",rate:1,scalable:!0},{stat_key:"inflation",direction:"up",rate:.3,scalable:!1},{stat_key:"minister_approval",direction:"up",rate:1,scalable:!1,target:"minister",delayOverride:0,durationOverride:1}]},{id:"austerityMeasures",triggerKey:"ministry_austerity_measures",name:"Austerity Measures",desc:"Cut government expenditure to reduce deficit and stabilise long-term fiscal health.",apCosts:[2,3,5,8],budgetPerCapita:0,budgetSavesPerCapita:1e6/8e6,delay:2,duration:8,decayTicks:4,useResetInterval:15,conflictsWith:"stimulusPackage",tags:[{label:"INFLATION −0.2",cls:"positive"},{label:"GDP −0.3",cls:"negative"},{label:"HAPPINESS −2",cls:"negative"},{label:"POVERTY +1",cls:"negative"}],baseEffects:[{stat_key:"inflation",direction:"down",rate:.2,scalable:!0},{stat_key:"gdp_growth",direction:"down",rate:.3,scalable:!1},{stat_key:"happiness",direction:"down",rate:2,scalable:!1},{stat_key:"poverty_rate",direction:"up",rate:1,scalable:!1},{stat_key:"minister_approval",direction:"down",rate:2,scalable:!1,target:"minister",delayOverride:0,durationOverride:1}]},{id:"debtRestructuring",triggerKey:"ministry_debt_restructuring",name:"Debt Restructuring",desc:"Renegotiate debt terms with international creditors. Outcome depends on Credit score.",apCosts:[3,5,8,12],budgetPerCapita:0,delay:3,duration:1,decayTicks:0,useResetInterval:20,cooldownTicks:20,isResolution:!0,tags:[{label:"INT RATES ↓",cls:"positive"},{label:"CREDIT ~",cls:"neutral"},{label:"NO TICK COST",cls:"neutral"}],baseEffects:[]}]},healthcare:{actions:[{id:"expandInfrastructure",name:"Expand Infrastructure",desc:"Fund construction and modernisation of hospitals, clinics, and medical facilities nationally.",comingSoon:!0},{id:"preventativeCare",triggerKey:"ministry_preventative_care",name:"Preventative Care Programme",desc:"Shift healthcare spending from treatment to prevention, investing in early intervention and population health outcomes.",apCosts:[2,3,5,7],oneTimeCostPerMillion:1e7,delay:4,duration:8,decayTicks:4,useResetInterval:15,tags:[{label:"LIFESPAN ↑ PERM",cls:"positive"},{label:"DRUG USE ↓",cls:"positive"},{label:"ACCESSIBILITY ↑",cls:"positive"},{label:"HAPPINESS ↑",cls:"positive"},{label:"BEDS ↑",cls:"positive"}],baseEffects:[{stat_key:"lifespan",direction:"up",rate:.1,scalable:!0},{stat_key:"drug_use",direction:"down",rate:.1,scalable:!0},{stat_key:"healthcare_accessibility",direction:"up",rate:.1,scalable:!0},{stat_key:"happiness",direction:"up",rate:.1,scalable:!0},{stat_key:"beds_per_100k",direction:"up",rate:.1,scalable:!0},{stat_key:"minister_approval",direction:"up",rate:1,scalable:!1,target:"minister",delayOverride:0,durationOverride:1}]},{id:"pharmaceuticalRegulation",name:"Pharmaceutical Regulation",desc:"Adjust the regulatory framework governing drug pricing, approval processes, and market access.",apCosts:[2,3,5,7],delay:2,duration:8,decayTicks:3,useResetInterval:15,directions:{increase:{label:"INCREASE REGULATIONS",triggerKey:"ministry_pharmaceutical_increased",oneTimeCostPerMillion:1e7/1.2,tags:[{label:"DRUG USE ↓",cls:"positive"},{label:"HEALTHCARE ↑",cls:"positive"},{label:"STD LIVING ↑",cls:"positive"},{label:"GDP ↓",cls:"negative"},{label:"FOREIGN INV ↓",cls:"negative"}],baseEffects:[{stat_key:"drug_use",direction:"down",rate:.2,scalable:!0},{stat_key:"healthcare_quality",direction:"up",rate:.1,scalable:!0},{stat_key:"standard_of_living",direction:"up",rate:.1,scalable:!0},{stat_key:"gdp_growth",direction:"down",rate:.1,scalable:!1},{stat_key:"foreign_investment",direction:"down",rate:.3,scalable:!1}]},decrease:{label:"DECREASE REGULATIONS",triggerKey:"ministry_pharmaceutical_decreased",oneTimeCostPerMillion:0,tags:[{label:"HEALTHCARE ↑",cls:"positive"},{label:"GDP ↑",cls:"positive"},{label:"FOREIGN INV ↑",cls:"positive"},{label:"DRUG USE ↑",cls:"negative"},{label:"INEQUALITY ↑",cls:"negative"}],baseEffects:[{stat_key:"healthcare_quality",direction:"up",rate:.2,scalable:!0},{stat_key:"gdp_growth",direction:"up",rate:.2,scalable:!0},{stat_key:"foreign_investment",direction:"up",rate:.3,scalable:!0},{stat_key:"drug_use",direction:"up",rate:.1,scalable:!1},{stat_key:"income_inequality",direction:"up",rate:.1,scalable:!1}]}}}]},education:{actions:[{id:"expandInfrastructure",name:"Expand Infrastructure",desc:"Fund construction and expansion of schools and educational facilities nationally.",comingSoon:!0},{id:"standardisedCurriculum",triggerKey:"ministry_standardised_curriculum",name:"Standardised Curriculum",desc:"Set the national curriculum to reflect a specific ideological orientation, shaping the values of future voters.",apCosts:[6,6,6,6],budgetPerCapita:0,delay:160,duration:12,decayTicks:0,useResetInterval:999,cooldownTicks:12,customFlow:"curriculum",tags:[{label:"ELECTORATE DRIFT",cls:"neutral"},{label:"+0.2 / TICK",cls:"neutral"},{label:"NO BUDGET COST",cls:"neutral"}],baseEffects:[]},{id:"privateEducationIncentives",triggerKey:"ministry_private_education_incentives",name:"Private Education Incentives",desc:"Offer tax breaks and regulatory relief to attract private school investment and reduce the state education burden.",apCosts:[2,3,5,7],budgetPerCapita:0,budgetSavesPerCapita:1e6/12e6,delay:2,duration:10,decayTicks:4,useResetInterval:15,tags:[{label:"HIGHER ED ↑",cls:"positive"},{label:"ACCESSIBILITY ↓",cls:"negative"},{label:"INEQUALITY ↑",cls:"negative"},{label:"ACADEMIC IMMIGRATION ↑",cls:"positive"}],baseEffects:[{stat_key:"higher_education",direction:"up",rate:2,scalable:!0},{stat_key:"education_accessibility",direction:"down",rate:1,scalable:!1},{stat_key:"income_inequality",direction:"up",rate:1,scalable:!1},{stat_key:"academic_immigration",direction:"up",rate:1,scalable:!0},{stat_key:"minister_approval",direction:"up",rate:1,scalable:!1,target:"minister",delayOverride:0,durationOverride:1}]}]}};function Vt(e,t){if(!e?.baseEffects)return[];const i=vt(t);return e.baseEffects.map(n=>({stat_key:n.stat_key,direction:n.direction,rate:Math.round((n.scalable?n.rate*i:n.rate)*100)/100,delay_ticks:n.delayOverride!==void 0?n.delayOverride:e.delay,duration_ticks:n.durationOverride!==void 0?n.durationOverride:e.duration,target:n.target||"nation"}))}function At(){if(Number(r?.credit??50)<25)return"Credit too low to negotiate. Creditors will not engage below 25.";if(se["finance-austerityMeasures"])return"Austerity Measures active. Resolve before attempting restructuring.";const i=Number(sessionStorage.getItem("finance:debtRestructuring:lastFailTick")||0);return i>0&&q-i<15?`Creditors unavailable. Previous negotiation failed ${q-i} ticks ago.`:""}async function xi(e,t){if(t!=="finance"||!e.conflictsWith)return;const i="finance-"+e.conflictsWith;if(!se[i])return;const n=e.conflictsWith;try{const{data:c}=await l.from("ministry_action_log").select("id").eq("nation_id",r.id).eq("ministry_key","finance").eq("action_key",n).eq("processed",!1);if(c?.length)for(const s of c)await l.from("ministry_action_log").update({processed:!0}).eq("id",s.id)}catch{}delete se[i];const a=document.getElementById(i);if(a){a.classList.remove("active");const c=document.getElementById(i+"-btns"),s=ue.finance.actions.find(f=>f.id===n),o="finance:"+n,m=Q[o]||0,u=s?.apCosts[Math.min(m,3)]||2;c&&(c.innerHTML=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();ministryActionSelect('${i}')">▶ ${u} AP</div>`)}try{const c=e.conflictsWith==="stimulusPackage"?"Stimulus Package":"Austerity Measures",s=e.conflictsWith==="stimulusPackage"?"ministry_stimulus_cancelled_by_austerity":"ministry_austerity_cancelled_by_stimulus";await l.rpc("fire_system_event",{p_trigger_key:s,p_nation_id:r.id,p_tick:q,p_placeholders:{nation:r.name||"Unknown",cancelled_action:c,new_action:e.name}})}catch{}}async function Ct(e){try{const{data:t}=await l.from("ministries").select("minister_first_name, minister_last_name, factions(faction_name)").eq("nation_id",r.id).eq("ministry_key",e).single(),i=t?(t.minister_first_name+" "+(t.minister_last_name||"")).trim():"Unknown",n=t?.factions?.faction_name||d?.faction_name||"Unknown";return{ministerName:i,partyName:n}}catch{return{ministerName:"Unknown",partyName:d?.faction_name||"Unknown"}}}function ki(e){const t=Number(e||0),i=t>=1e9?"$"+(t/1e9).toFixed(1)+"B":t>=1e6?"$"+(t/1e6).toFixed(1)+"M":t>0?"$"+Math.round(t).toLocaleString():"$0",n=t>0?"color:var(--green)":"color:var(--red)";return{balance:t,fmt:i,cls:n}}async function Kt(e,t,i,n){if(n<=0)return;const a=Math.max(0,i-n),{error:c}=await l.from("ministries").update({discretionary_balance:a}).eq("nation_id",r.id).eq("ministry_key",e).eq("is_active",!0);if(c)throw console.error("[Ministry] Discretionary fund deduction failed:",c.message),new Error("Fund deduction failed: "+c.message);t&&(t.discretionary_balance=a)}function Le(e,t){const i=e.oneTimeCostPerMillion||0;return Math.round(t/1e6*i)}function Oe(e){return e<=0?"No Fund Draw":e>=1e9?"$"+(e/1e9).toFixed(1)+"B":e>=1e6?"$"+Math.round(e/1e6).toLocaleString()+"M":"$"+Math.round(e).toLocaleString()}let je=null;async function Si(e){const t="healthcare-pharmaceuticalRegulation",i=se[t];if(!i)return;const n=typeof i=="string"?i:"unknown";try{const{data:a}=await l.from("ministry_action_log").select("id").eq("nation_id",r.id).eq("ministry_key","healthcare").eq("action_key","pharmaceuticalRegulation").eq("processed",!1);if(a?.length)for(const c of a)await l.from("ministry_action_log").update({processed:!0}).eq("id",c.id)}catch{}delete se[t];try{const{ministerName:a,partyName:c}=await Ct("healthcare");await l.rpc("fire_system_event",{p_trigger_key:"ministry_pharmaceutical_direction_changed",p_nation_id:r.id,p_tick:q,p_placeholders:{minister_name:a,party:c,nation:r.name||"Unknown",old_direction:n,new_direction:e}})}catch{}}function xt(e,t){const i=Math.round(e*t);return i>=1e6?"$"+(i/1e6).toFixed(1)+"M":i>=1e3?"$"+(i/1e3).toFixed(0)+"K":"$"+i}const De=["Carlos","Diego","Fernando","Héctor","Marcos","Ramón","José","Luis","Miguel","Antonio","Roberto","Francisco","Eduardo","Pablo","Alejandro","Rafael","Gabriel","Santiago","Andrés","Javier","Ricardo","Tomás","Emilio","Sergio","Nicolás","Arturo","Enrique","Oscar","Felipe","Gonzalo","Ignacio","Mateo","Dante"],qe=["Velasco","Salazar","Guerrero","Ríos","Morales","Torres","Mendoza","Castillo","Herrera","Vargas","Reyes","Cruz","Navarro","Delgado","Ortiz","Romero","Flores","Ramírez","Guzmán","Medina","Soto","Pacheco","Ibarra","Carrasco","Espinoza","Montenegro","Echeverría","Valdez","Córdoba","Aguilar","Paredes","Lara"];let r=null,d=null,gt=[],ne=null,ae=[],R=[],Se={},X=!1,Y=!1,Ge=!1,de=null,j=null,kt=!1,Ye=null,yt=[],Q={},se={},Ve=0,q=0,St=null,st=null,Z=null,B=null,ot=[],Wt=!1,rt=null,Ti=[],ye=0,te=null,me=[],$e=null,ct=[],fe={},Ke=[],he=[],Tt=!1,Pt=!1,oe=!1;const Be=[{key:"prime_minister",name:"Prime Minister",description:"Head of government, sets national agenda and policy priorities.",locked:!0},{key:"interior",name:"Ministry of the Interior",description:"Oversees domestic affairs, local governments, and civil administration."},{key:"foreign",name:"Foreign Ministry",description:"Manages diplomatic relations and international treaties."},{key:"defense",name:"Ministry of Defense",description:"Controls military forces and national defense strategy."},{key:"finance",name:"Ministry of Finance",description:"Manages national budget, taxation, and economic policy."},{key:"education",name:"Ministry of Education",description:"Oversees schools, universities, and educational standards."},{key:"healthcare",name:"Ministry of Healthcare",description:"Manages hospitals, public health, and medical policy."},{key:"labor",name:"Ministry of Labor",description:"Handles employment law, workers' rights, and job programs."},{key:"justice",name:"Ministry of Justice",description:"Oversees courts, law enforcement, and legal reform."},{key:"trade",name:"Ministry of Trade",description:"Oversees trade policy, negotiations, tariffs, and international commerce."},{key:"energy",name:"Ministry of Energy",description:"Manages energy generation, renewable energy policy, emissions, and environmental regulation."},{key:"transportation",name:"Ministry of Transportation",description:"Manages roads, railways, airports, and transit systems."},{key:"security",name:"Ministry of Security",description:"Handles intelligence and counter-terrorism operations.",inactive:!0}];Ma("government",async e=>{const{nation:t,faction:i}=e;if(r=t,d=i,Ia(t),!t){document.getElementById("content-area").innerHTML='<div class="placeholder-panel"><div class="ph-icon">🏛️</div><h3>No Nation Selected</h3><p>Your party is not assigned to a nation yet.</p></div>';return}X=yi(t),Y=Ua(t);const n=Number.isFinite(Number(t.head_of_state_age))&&Number(t.head_of_state_age)>0;if(!t.head_of_state_first_name||!t.head_of_state_last_name||!n){const c=De,s=qe,o=t.head_of_state_first_name||c[Math.floor(Math.random()*c.length)],m=t.head_of_state_last_name||s[Math.floor(Math.random()*s.length)],u=n?Number(t.head_of_state_age):45+Math.floor(Math.random()*25),{error:f}=await l.from("nations").update({head_of_state_first_name:o,head_of_state_last_name:m,head_of_state_age:u}).eq("id",t.id);f||(r.head_of_state_first_name=o,r.head_of_state_last_name=m,r.head_of_state_age=u)}const{data:a}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single();q=a?.current_tick||0,await ce()});async function Pi(){if(!r||!X)return"";const e=r.id,t=d?.id,[i,n,a,c,s]=await Promise.all([l.from("faction_pillar_state").select("*").eq("nation_id",e),l.from("autocracy_tracker").select("*").eq("nation_id",e).single(),l.from("putsch_state").select("*").eq("nation_id",e).eq("resolved",!1).maybeSingle(),l.from("silent_coup_offers").select("*").eq("nation_id",e).eq("voided",!1),l.from("nations").select("designated_successor_faction_id").eq("id",e).single()]),o=i.data||[],m=n.data,u=a.data,f=c.data||[],p=s.data?.designated_successor_faction_id,v=o.find(C=>C.faction_id===t)?.is_strongman;let h="";if(m){const C=m.public_tracker_value??30,$=Math.max(0,Math.min(100,C)),A=$<=30?"#5cb85c":$<=50?"#c8a64e":$<=70?"#d48a3c":"#d9534f";h+=`
        <div class="info-block" style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Support</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:9px;color:#5cb85c;font-weight:700;white-space:nowrap">REGIME</span>
                <div style="flex:1;position:relative;height:12px;background:var(--bg-depth-2);border:1px solid var(--border-dim);border-radius:6px;overflow:visible">
                    <div style="position:absolute;left:${$}%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:${A};border:2px solid var(--bg-surface);box-shadow:0 0 4px ${A}88;transition:left 0.5s ease"></div>
                </div>
                <span style="font-size:9px;color:#d9534f;font-weight:700;white-space:nowrap">COUP</span>
            </div>
        </div>`}if(u){const C=v&&!u.strongman_response;h+=`
        <div class="info-block" style="border-left:3px solid var(--red);margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">PUTSCH — MARTIAL LAW</div>
            <div style="font-size:12px;color:var(--text-secondary)">The Military has declared martial law. Normal governance is suspended.</div>
            ${C?`
            <div style="margin-top:12px;font-size:11px;color:var(--text-muted)">Use the Actions tab on the Politics page to respond.</div>
            `:'<div style="font-size:11px;color:var(--text-muted);margin-top:6px">Awaiting Strongman response...</div>'}
        </div>`}const w=f.filter(C=>!C.accepted),k=w.find(C=>C.to_faction_id===t);if(w.length>0&&!v)if(k)h+=`
            <div class="info-block" style="border-left:3px solid var(--red);margin-bottom:16px">
                <div style="font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">SECRET — SILENT COUP PROPOSAL</div>
                <div style="font-size:12px;color:var(--text-secondary)">The Security Services have approached you with a proposal to remove the Strongman from power. Your vote is requested.</div>
                <div style="margin-top:12px;font-size:11px;color:var(--text-muted)">Use the Actions tab on the Politics page to cast your vote.</div>
            </div>`;else{const C=o.find($=>$.pillar==="security");if(C&&C.faction_id===t){const $=f.filter(A=>A.accepted).length;h+=`
                <div class="info-block" style="border-left:3px solid var(--red);margin-bottom:16px">
                    <div style="font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">SILENT COUP — DEAL PHASE</div>
                    <div style="font-size:12px;color:var(--text-secondary)">Offers sent. ${$} of ${f.length} factions have accepted.</div>
                </div>`}}const S=o.filter(C=>C.arrested_leader);if(S.length>0){let C="";for(const $ of S){const{data:A}=await l.from("factions").select("faction_name").eq("id",$.faction_id).single(),_=A?.faction_name||"Unknown";C+=`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair)">
                <div>
                    <span style="font-size:12px;color:var(--text-primary);font-weight:600">${g($.leader_name||"Unknown")}</span>
                    <span style="font-size:11px;color:var(--text-secondary)"> — ${g(_)} (${g($.pillar||"?")})</span>
                </div>
                ${v?'<div style="font-size:10px;color:var(--text-muted)">Use Actions tab to Execute or Release</div>':""}
            </div>`}h+=`
        <div class="info-block" style="border-left:3px solid var(--red);margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">DETAINED LEADERS</div>
            ${C}
        </div>`}if(v){const{data:C}=p?await l.from("factions").select("faction_name").eq("id",p).single():{data:null};h+=`
        <div class="info-block" style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">SUCCESSION</div>
            ${p?`<div style="font-size:12px;color:var(--text-secondary)">Designated successor: <strong style="color:var(--text-primary)">${g(C?.faction_name||"Unknown")}</strong></div>`:'<div style="font-size:12px;color:var(--text-muted)">No successor designated. If the Strongman dies, the highest-Backing faction will attempt an automatic coup.</div>'}
        </div>`}return h}async function Mi(){var e=r;if(!e)return"";var t=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=t.data?.current_tick||0,n=await l.from("event_log").select("fired_at_tick, description_used").eq("nation_id",e.id).eq("event_name","DEMOCRATIC_REVOLUTION").order("fired_at_tick",{ascending:!1}).limit(1).maybeSingle();if(n.data&&i-n.data.fired_at_tick<=5){var a=n.data.fired_at_tick+3,c=Math.max(0,a-i),s='<div class="revolution-complete-banner">';return s+='<div class="revolution-icon">&#x1F3DB;</div>',s+='<div class="revolution-title">Revolution in the Streets!</div>',s+='<div class="revolution-subtitle">'+n.data.description_used+"</div>",c>0?s+='<div><span class="revolution-tag">Emergency Elections in '+c+" tick"+(c!==1?"s":"")+'</span><span class="revolution-tag">Democracy Established</span></div>':s+='<div><span class="revolution-tag">Democracy Established</span><span class="revolution-tag">Elections Complete</span></div>',s+="</div>",s}if(yi(e)&&e.revolution_started_tick!=null&&e.revolution_duration!=null){var o=i-e.revolution_started_tick,m=Math.max(0,e.revolution_duration-o),s='<div class="revolution-banner">';return s+='<div class="revolution-icon">&#x1F525;</div>',s+='<div class="revolution-title">Democratic Revolution</div>',s+='<div class="revolution-subtitle">The people demand democracy. Pro-democracy protests grow stronger each day.</div>',s+='<div class="revolution-countdown">'+m+" tick"+(m!==1?"s":"")+" until revolution</div>",s+="</div>",s}return""}function Ii(){return!r||!r.authoritarianism_seize_available_tick||X||r.seize_power_rejected||!(d&&r.ruling_faction_id&&d.id===r.ruling_faction_id)?"":`
        <div class="revolution-banner" style="background: linear-gradient(135deg, rgba(120,0,0,0.15), rgba(60,0,0,0.25)); border-color: var(--red);">
            <div class="revolution-icon" style="font-size: 2.5rem;">&#9876;</div>
            <div class="revolution-title" style="color: var(--red);">The Path to Absolute Power</div>
            <div class="revolution-subtitle" style="margin-bottom: 12px;">
                Democratic institutions have crumbled after prolonged authoritarian erosion. Your party now has the power to dissolve the legislature and establish single-party rule. This is irreversible.
            </div>
            <div style="display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap;">
                <button id="seize-power-btn"
                    style="padding: 14px 36px; background: var(--red); color: white; border: none; border-radius: 3px; font-family: var(--font-mono); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 20px rgba(255,68,68,0.4)';"
                    onmouseout="this.style.transform='none'; this.style.boxShadow='none';"
                    onclick="confirmSeizePower()">
                    Seize Absolute Power
                </button>
                <button id="reject-seize-btn"
                    style="padding: 14px 24px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border-main); border-radius: 3px; font-family: var(--font-mono); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer;"
                    onclick="rejectSeizePower()">
                    Reject
                </button>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 10px;">
                Converts the nation to an Autocracy. Coalition dissolved. All elections cancelled.
            </div>
        </div>
    `}window.confirmSeizePower=async function(){if(!confirm(`SEIZE ABSOLUTE POWER?

This will:
• Convert the nation to an Autocracy
• Dissolve the coalition and legislature
• Cancel all scheduled elections
• Install your party as the ruling regime

This action is IRREVERSIBLE.`))return;const e=document.getElementById("seize-power-btn");e&&(e.disabled=!0,e.textContent="Seizing power...");try{const t=await Na(l,r.id,d.id);t?.success&&(alert(`${t.rulingParty} has seized absolute power. ${r.name} is now an Autocracy.`),location.reload())}catch(t){console.error("[SeizePower] Failed:",t),alert("Failed to seize power: "+(t.message||t)),e&&(e.disabled=!1,e.textContent="Seize Absolute Power")}},window.rejectSeizePower=async function(){if(!confirm(`Reject the path to absolute power?

You are choosing to preserve democratic governance. This decision is final — you will not be offered this opportunity again.`))return;const e=document.getElementById("reject-seize-btn");e&&(e.disabled=!0,e.textContent="Rejecting...");try{await l.from("nations").update({seize_power_rejected:!0,authoritarianism_seize_available_tick:null}).eq("id",r.id),await l.from("event_log").insert({nation_id:r.id,event_name:"SEIZE_POWER_REJECTED",trigger_key:"seize_power_rejected",description_used:"The ruling party has rejected the path to absolute power, choosing to preserve democratic governance.",category:"POLITICAL",effects_applied:{action:"rejected"}}),location.reload()}catch(t){alert("Error: "+(t.message||t)),e&&(e.disabled=!1,e.textContent="Reject")}};function Ni(){if(!r||X||Y||!r.emergency_powers_act||!(d&&r.ruling_faction_id&&d.id===r.ruling_faction_id))return"";if(r._activeParliamentaryEmergency)return`
            <div class="info-block" style="border-left: 3px solid var(--red); margin-bottom: 16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="font-size:1.2rem;">⚠️</span>
                    <strong style="color:var(--red);">NATIONAL EMERGENCY IN EFFECT</strong>
                </div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:10px;">
                    Bills can bypass legislative votes. Stability, freedom index, and judicial independence are eroding each tick.
                </div>
                <button class="ministry-btn purge" style="padding:8px 20px;font-size:0.75rem;" onclick="endParliamentaryEmergency()" id="end-emergency-btn">
                    End Emergency
                </button>
            </div>
        `;const i=d?.action_points||0,n=K.NATIONAL_EMERGENCY_AP,a=i>=n;return`
        <div class="info-block" style="border-left: 3px solid var(--amber); margin-bottom: 16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="font-size:1.2rem;">🏛️</span>
                <strong>Emergency Powers Available</strong>
                <span style="font-size:0.65rem;color:var(--text-muted);margin-left:auto;">via Emergency Powers Act</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:10px;">
                Declare a national emergency to bypass legislative votes on bills. While active: stability -1/tick, freedom index -0.5/tick, judicial independence -0.5/tick.
            </div>
            <button class="ministry-btn${a?"":" disabled"}" style="padding:8px 20px;font-size:0.75rem;" onclick="${a?"declareParliamentaryEmergency()":""}" id="declare-emergency-btn" ${a?"":"disabled"}>
                Declare Emergency <span class="ap-cost">${n} AP</span>
            </button>
        </div>
    `}window.declareParliamentaryEmergency=async function(){if(!confirm(`Declare a National Emergency?

While active:
• Bills bypass legislative votes
• Stability -1/tick
• Freedom Index -0.5/tick
• Judicial Independence -0.5/tick

Cost: ${K.NATIONAL_EMERGENCY_AP} AP`))return;const e=document.getElementById("declare-emergency-btn");e&&(e.disabled=!0,e.textContent="Declaring...");try{const t=await wi(l,r.id,d.id);t?.success?location.reload():(alert(t?.error||"Failed to declare emergency."),e&&(e.disabled=!1,e.innerHTML=`Declare Emergency <span class="ap-cost">${K.NATIONAL_EMERGENCY_AP||4} AP</span>`))}catch(t){alert("Error: "+(t.message||t)),e&&(e.disabled=!1,e.innerHTML=`Declare Emergency <span class="ap-cost">${K.NATIONAL_EMERGENCY_AP} AP</span>`)}},window.endParliamentaryEmergency=async function(){if(!confirm("End the National Emergency?"))return;const e=document.getElementById("end-emergency-btn");e&&(e.disabled=!0,e.textContent="Ending...");try{const t=await $i(l,r.id,d.id);t?.success?location.reload():(alert(t?.error||"Failed to end emergency."),e&&(e.disabled=!1,e.textContent="End Emergency"))}catch(t){alert("Error: "+(t.message||t)),e&&(e.disabled=!1,e.textContent="End Emergency")}};async function ce(){document.getElementById("content-area").innerHTML='<div class="panel-padding"><div class="loading-container" style="height:200px;"><div class="loading-spinner"></div><div>Loading government data...</div></div></div>',wt("coalition_");try{const[e,t,i,n]=await Promise.all([Ri(),hi(l,r.id),Li(),l.from("factions").select("id, faction_name, abbreviation, seats, approval_rating, loyalty, action_points, party_color, party_logo, custom_logo_url, leader_ideology").eq("nation_id",r.id).eq("faction_type","party")]),{data:a}=await l.from("head_of_government").select("*, factions(id, faction_name, abbreviation, leader_ideology), leader_traits(*)").eq("nation_id",r.id).eq("active",!0).maybeSingle();if(a&&(a._resolvedIdeology=a.ideology||a.factions?.leader_ideology||null),ne=t,ae=i,gt=e?.results?.votes||[],R=n.data||[],St=e?.election_tick||null,t&&t.status!=="caretaker"){const{count:_}=await l.from("bills").select("*",{count:"exact",head:!0}).eq("nation_id",r.id).eq("status","frozen");_&&_>0&&(t.status="caretaker")}if(t&&t.status==="caretaker"){const{data:_}=await l.from("elections").select("election_tick").eq("nation_id",r.id).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(1).maybeSingle();_&&(ne._earlyElectionTick=_.election_tick)}let c=!1;if(!X&&!Y&&e?.id&&!t){const{data:_}=await l.from("government_formations").select("id").eq("election_id",e.id).eq("status","formed").limit(1).maybeSingle();if(!_){const{data:E}=await l.from("active_coalitions").select("id").eq("election_id",e.id).limit(1).maybeSingle();c=!E}}!X&&!Y&&e&&(rt=e.id,Ti=e.results?.votes||[],ye=R.reduce((_,E)=>_+(E.seats||0),0));const s=R.find(_=>_.id===d?.id);if(s&&d&&(d.action_points=s.action_points),Se=(await jt(l,r.id,X,R,d?.id)).allPartySeats,X){const _=await ja(l,r.id,R,Se,d?.id);Ye=_.headFactionId,kt=_.isHeadFaction;const{data:E}=await l.from("ministry_requests").select("*, factions(faction_name)").eq("nation_id",r.id);yt=E||[]}if(Y){const{data:_}=await l.from("presidents").select("id, faction_id, first_name, last_name, age, ideology, trait, elected_tick, term_ends_tick, terms_served").eq("nation_id",r.id).eq("is_active",!0).order("elected_tick",{ascending:!1}).limit(1).maybeSingle();if(j=_||null,de=_?.faction_id||null,Ge=de&&d?.id===de,j?.trait){const{data:E}=await l.from("leader_traits").select("trait_name, upside, downside").eq("trait_key",j.trait).single();E&&(j._traitData=E)}}let m=await Oi();const{data:u}=await l.from("gov_approval_log").select("amount, source, tick").eq("nation_id",r.id).order("tick",{ascending:!1}).limit(8);r._govApprovalEvents=u||[];const[{count:f},{count:p}]=await Promise.all([l.from("nations").select("id",{count:"exact",head:!0}).neq("id",r.id),l.from("ambassadors").select("id",{count:"exact",head:!0}).eq("nation_id",r.id).eq("is_active",!0).eq("status","active")]);Ve=(f||0)-(p||0);try{const{data:_}=await l.from("ministry_action_log").select("ministry_key, action_key, processed, applied_at_tick, action_data").eq("nation_id",r.id).eq("faction_id",d?.id||"00000000-0000-0000-0000-000000000000");if(Q={},se={},_)for(const E of _){const P=E.ministry_key+":"+E.action_key;if(Q[P]=(Q[P]||0)+1,E.processed||(E.ministry_key==="healthcare"&&E.action_key==="pharmaceuticalRegulation"&&E.action_data?.direction?se[E.ministry_key+"-"+E.action_key]=E.action_data.direction:se[E.ministry_key+"-"+E.action_key]=!0),E.action_key==="debtRestructuring"&&E.action_data?.resolution_outcome==="failure"){const L=E.action_data.resolution_tick||E.applied_at_tick;sessionStorage.setItem("finance:debtRestructuring:lastFailTick",String(L))}}}catch{}await gn();const y=i?.find(_=>_.ministry_key==="prime_minister");if(!Y&&t&&!a){const _=t.ministry_assignments?.prime_minister||t.lead_party_id;if(_&&d?.id===_)try{const{data:E}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single();await vi(l,r.id,_,E?.current_tick||0),console.log("Auto-recovered orphaned PM state: appointed party leader as PM"),location.reload();return}catch(E){console.error("PM auto-recovery failed:",E)}}if(Y&&r)try{pt=await Ei(l,r.id)}catch(_){console.error("[EO] preload failed:",_)}const{data:v}=await l.from("protest_log").select("id, faction_id, tier, status, grievance_type, grievance_data, demand_label, tier7_demand, tier7_demand_met, crisis_started_tick, crisis_duration, public_address_last_tick").eq("nation_id",r.id).eq("status","crisis_active").order("crisis_started_tick",{ascending:!1}).limit(1).maybeSingle();if(st=v,!X&&!Y&&r.emergency_powers_act){const{data:_}=await l.from("executive_orders").select("id").eq("nation_id",r.id).eq("order_type","national_emergency").eq("is_active",!0).maybeSingle();r._activeParliamentaryEmergency=!!_}const h=await Mi(),w=Ii(),k=await qi(t,gt,y,m,a,c,Se),S=Mn(),C=X?await Pi():"",$=Ni();document.getElementById("content-area").innerHTML=`
            <div class="panel-padding">
                ${h}
                ${w}
                ${S}
                ${k}
                ${$}
                ${C}

                <div class="section-header">Government Structure</div>
                <div class="info-block">
                    <div class="info-row"><span class="info-label">Government Type</span><span class="info-value">${r.government_type||"Parliamentary Democracy"}</span></div>
                    <div class="info-row"><span class="info-label">Legislative Branch</span><span class="info-value">Unicameral (${M.TOTAL_SEATS} Seats)</span></div>
                    <div class="info-row"><span class="info-label">Majority Threshold</span><span class="info-value">${M.MAJORITY_SEATS} Seats</span></div>
                </div>

                <div class="section-header" id="cabinet-section">Cabinet</div>
                ${Nn(i,t)}

                <div class="section-header">Current Parliamentary Makeup</div>
                <div class="parliament-wrap">
                    <svg id="parliament-svg" viewBox="0 0 520 280"></svg>
                </div>
                <div class="parliament-legend" id="parliament-legend"></div>

                <div id="past-administrations-container"></div>
            </div>
        `;const A=R.filter(_=>(_.seats||0)>0).sort((_,E)=>(E.seats||0)-(_.seats||0)).map((_,E)=>({party_id:_.id,party_name:_.faction_name,seats:_.seats||0,color:_.party_color||_e[E%_e.length]}));if(A.length>0&&va(A),Ca(),Bi(),document.getElementById("gov-formation-content")&&rt&&await Nt(),window.location.hash){const _=document.getElementById(window.location.hash.substring(1));_&&setTimeout(()=>_.scrollIntoView({behavior:"smooth",block:"center"}),100)}}catch(e){console.error("Error loading government data:",e),document.getElementById("content-area").innerHTML='<div class="panel-padding"><div class="placeholder-panel"><div class="ph-icon">⚠️</div><h3>Error Loading Data</h3><p>Could not load government information. Please refresh.</p></div></div>'}}async function Ri(){const{data:e}=await l.from("elections").select("*").eq("nation_id",r.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).order("created_at",{ascending:!1}).limit(1).maybeSingle();return e}async function Li(){const{data:e}=await l.from("ministries").select("*, factions(faction_name)").eq("nation_id",r.id).eq("is_active",!0);return e||[]}async function Oi(){const{data:e}=await l.from("nations").select("gov_approval").eq("id",r.id).single();return e?.gov_approval??40}function Di(e){const t=gt.find(i=>i.party_id===e);return t?t.party_name:R.find(i=>i.id===e)?.faction_name||"Unknown"}const _e=["#E91E63","#5b9bd5","#5cb85c","#d48a3c","#9C27B0","#00BCD4","#d9534f","#8BC34A","#FFC107","#673AB7"];function We(e){const t=R.findIndex(n=>n.id===e);return(t>=0?R[t]:null)?.party_color||_e[(t>=0?t:0)%_e.length]}function Je(e){return R.find(i=>i.id===e)?.party_logo||null}function Xe(e){return R.find(i=>i.id===e)?.custom_logo_url||null}async function qi(e,t,i,n,a,c,s){s=s||{};const o=r.head_of_state_first_name||"Unknown",m=r.head_of_state_last_name||"Unknown",u=r.head_of_state_age||"—",p=r.hos_election_method==="hereditary"?`<span class="admin-person-party" style="color:var(--purple);">${g(r.dynasty_name||"Royal")} dynasty</span>, reigning since ${ie(r.dynasty_established_tick)}`:null,y=n>=60?"var(--green)":n>=40?"var(--amber)":"var(--red)",v=ae.filter(_=>_.minister_first_name),h=ae.length-v.length,w=v.length>0?Math.round(v.reduce((_,E)=>_+(E.minister_approval??we),0)/v.length):50,k=h*-3,S=Math.round((r.gov_approval_events??0)*10)/10,C=`<div style="text-align:right;position:relative;" class="gov-approval-hover">
        <div style="font-size:0.7rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;">Government Approval</div>
        <div style="font-size:1.4rem;font-weight:bold;color:${y};">${n}%</div>
        <div class="gov-approval-tooltip">
            <div class="gov-tip-title">Approval Breakdown</div>
            <div class="gov-tip-row">
                <span class="gov-tip-label">Minister Avg</span>
                <div class="gov-tip-bar"><div class="gov-tip-bar-fill" style="width:${w}%;background:var(--green)"></div></div>
                <span class="gov-tip-val">${w}</span>
            </div>
            <div class="gov-tip-desc">Average approval of filled cabinet ministers</div>
            <div class="gov-tip-row">
                <span class="gov-tip-label">Vacancies</span>
                <span class="gov-tip-val" style="color:${k<0?"var(--red)":"var(--green)"}">${k===0?"0":k}</span>
            </div>
            <div class="gov-tip-desc">${h} vacant seat${h!==1?"s":""} (-3 each)</div>
            <div class="gov-tip-row">
                <span class="gov-tip-label">Events</span>
                <span class="gov-tip-val" style="color:${S>0?"var(--green)":S<0?"var(--red)":"var(--text-secondary)"}">${S>0?"+":""}${S}</span>
            </div>
            <div class="gov-tip-desc">Crises & events (decays over time)</div>
            ${(()=>{const _=r._govApprovalEvents||[];if(_.length===0)return"";const E={"crisis:scandal":"Scandal","crisis:natural_disaster":"Natural disaster","minister:fired":"Minister fired","bill:enactment":"Bill enacted","bill:veto":"Bill vetoed","election:result":"Election result"};return'<div class="gov-tip-events-title">Recent Events</div>'+_.map(L=>{const I=E[L.source]||L.source.replace(/[_:]/g," "),x=L.amount>0?"+":"",O=L.amount>0?"var(--green)":"var(--red)";return'<div class="gov-tip-evt"><span>'+I+'</span><span style="color:'+O+'">'+x+Math.round(L.amount*10)/10+"</span></div>"}).join("")})()}
        </div>
    </div>`;function $(_){return!_||!_.minister_first_name||!_.minister_last_name?"—":`${_.minister_first_name} ${_.minister_last_name}`}const A=a?.last_name||i?.minister_last_name||m;if(c)return Jt();if(X&&!Ye)return`
            <div class="administration-box" style="border-color: var(--red);">
                <div class="administration-header" style="border-bottom-color: var(--border-hair);">
                    <div style="font-size: 2.5rem; margin-bottom: 8px;">&#9876;</div>
                    <div class="administration-title" style="color: var(--red);">Power Vacuum</div>
                    <div class="administration-subtitle">No faction controls the government</div>
                </div>
                <div class="administration-content" style="display:block; text-align:center; padding: 24px;">
                    <div style="font-size:0.9rem; color:var(--text-secondary); margin-bottom: 20px;">
                        The nation has no ruling faction. The Head of State, <strong style="color:var(--text-primary);">${g(o)} ${g(m)}</strong>, awaits a faction bold enough to seize the reins of government.
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom: 20px;">
                        Claiming power will make your faction the ruling faction, granting control over all ministries and the Prime Minister's office.
                    </div>
                    <button id="claim-power-btn"
                        style="padding: 14px 36px; background: var(--red); color: white; border: none; border-radius: 3px; font-family: var(--font-mono); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 20px rgba(255,68,68,0.4)';"
                        onmouseout="this.style.transform='none'; this.style.boxShadow='none';"
                        onclick="claimPower()">
                        Seize Power
                    </button>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 10px;">Cost: 0 AP &mdash; Uncontested</div>
                </div>
            </div>`;if(X){const E=R.find(x=>x.id===Ye)?.faction_name||"—",P=$(i),L=i?.minister_age??"—",I=i?.factions?.faction_name||"—";return`
            <div class="administration-box">
                <div class="administration-header">
                    <div class="administration-title">${g(A)} Administration</div>
                    <div class="administration-subtitle">National Government</div>
                </div>
                <div class="administration-content">
                    <div class="admin-leaders-column">
                        <div class="admin-section">
                            <div class="admin-section-title">Prime Minister</div>
                            <div class="admin-person-name">${a?`${g(a.first_name)} ${g(a.last_name)}`:g(P)}</div>
                            <div class="admin-person-details">${a?`Age ${a.age} • `:L!=="—"?`Age ${L} • `:""}<span class="admin-person-party">${a&&(a.factions?.faction_name||R.find(x=>x.id===a.faction_id)?.faction_name)||I}</span></div>
                            ${i?.minister_approval!=null?`<div class="minister-approval" style="margin-top:6px;">PM Approval: <span class="${i.minister_approval<35?"low":i.minister_approval<50?"mid":"high"}">${Math.round(i.minister_approval)}%</span></div>`:""}
                            ${a?`
                                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-main);">
                                    <div style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:0.7rem;font-weight:bold;text-transform:uppercase;background:${Ae(a._resolvedIdeology)};color:white;margin-bottom:6px;">${a._resolvedIdeology||"Unknown"}</div>
                                    <div style="font-size:0.85rem;color:var(--accent);font-weight:bold;margin-bottom:4px;">🏷️ ${a.leader_traits?.trait_name||a.trait_key}</div>
                                    <div style="font-size:0.75rem;color:var(--green);margin-bottom:2px;">▲ ${a.leader_traits?.upside||""}</div>
                                    <div style="font-size:0.75rem;color:var(--red);">▼ ${a.leader_traits?.downside||""}</div>
                                </div>
                            `:""}
                        </div>
                        <div class="admin-section">
                            <div class="admin-section-title">${g(r.head_of_state_title||"Head of State")}</div>
                            <div class="admin-person-name">${g(o)} ${g(m)}</div>
                            <div class="admin-person-details">Age ${u} · <span class="admin-person-party">${g(E)}</span></div>
                            <div style="color: var(--red); font-size: 0.75rem; margin-top: 6px; font-weight: bold;">Rules until dead or deposed</div>
                        </div>
                    </div>
                    ${ht()}
                </div>
            </div>`}if(Y){if(!j)return`
                <div class="administration-box">
                    <div class="administration-header">
                        <div class="administration-title">Presidential Government</div>
                        <div class="administration-subtitle">No President — Awaiting Election</div>
                    </div>
                    <div class="administration-content" style="text-align:center;padding:24px;">
                        <div style="font-size:0.9rem;color:var(--text-secondary);">A presidential election must be held before the government can be formed.</div>
                    </div>
                </div>`;const _=R.find(W=>W.id===de),E=_?.faction_name||"—",P=s[de]||_?.seats||0,L=M.MAJORITY_SEATS||61,I=P>=L,x=I?"Unified Government":"Divided Government",O=I?"var(--green)":"var(--amber)",{data:F}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single(),T=F?.current_tick||q,N=j.term_ends_tick-T,H=r?.presidential_term_ticks||M.PRESIDENTIAL_TERM_TICKS,U=Math.max(0,Math.min(100,Math.round(N/H*100)));let D;if(N<=0)D="Term Ended — Election Pending";else{const W=N,ve=Math.floor(W/12),re=Math.round(W%12);ve>0?D=`${ve} Year${ve!==1?"s":""}, ${re} Month${re!==1?"s":""}`:re>0?D=`${re} Month${re!==1?"s":""}`:D="< 1 Month"}let G="";if(j._traitData){const W=j._traitData;G=`
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-main);">
                    ${j.ideology?`<div class="pres-ideology-bar" style="background:${Ae(j.ideology)};">${g(j.ideology)}</div>`:""}
                    <div class="pres-trait-name">&#x1F3F7; ${g(W.trait_name||j.trait)}</div>
                    <ul class="pres-trait-effects">
                        ${W.upside?`<li class="pres-trait-up">${g(W.upside)}</li>`:""}
                        ${W.downside?`<li class="pres-trait-down">${g(W.downside)}</li>`:""}
                    </ul>
                </div>`}return`
            <div class="administration-box">
                <div class="administration-header">
                    <div>
                        <div class="administration-title">${g(j.last_name)} Administration</div>
                        <div class="administration-subtitle">Presidential Government · <span style="color:${O};font-weight:bold;">${x}</span></div>
                    </div>
                    ${C}
                </div>
                <div class="administration-content">
                    <div class="admin-leaders-column">
                        <div class="admin-section">
                            <div class="admin-section-title">President${j.terms_served?` — ${["1st","2nd","3rd","4th"][j.terms_served-1]||j.terms_served+"th"} Term`:""}</div>
                            <div class="admin-person-name">${g(j.first_name)} ${g(j.last_name)}</div>
                            <div class="admin-person-details">Age ${j.age} · <span class="admin-person-party">${g(E)}</span></div>
                            ${i?.minister_approval!=null?`<div class="minister-approval" style="margin-top:6px;">Presidential Approval: <span class="${i.minister_approval<35?"low":i.minister_approval<50?"mid":"high"}">${Math.round(i.minister_approval)}%</span></div>`:""}
                            <div style="margin-top:8px;">
                                <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:4px;">${N<=0?D:`Term Remaining: ${D}`}</div>
                                <div style="height:4px;background:var(--bg-card);border-radius:0;overflow:hidden;">
                                    <div style="height:100%;width:${U}%;background:${U>25?"var(--teal)":"var(--red)"};border-radius:0;transition:width 0.3s;"></div>
                                </div>
                            </div>
                            ${G}
                            ${Jn()}
                            ${Wn()}
                        </div>
                        <div class="admin-section">
                            <div class="admin-section-title">Vice President</div>
                            <div class="admin-person-name">${g(o)} ${g(m)}</div>
                            <div class="admin-person-details">Age ${u}</div>
                        </div>
                    </div>
                    ${ht()}
                </div>
                <div class="coalition-parties">
                    <div class="coalition-party-tag" style="border-left:3px solid ${We(de)};padding-left:8px;">${Je(de)||Xe(de)?`<span style="display:inline-flex;vertical-align:middle;margin-right:5px;">${Ce({customLogoUrl:Xe(de),iconKey:Je(de),size:16,color:We(de)})}</span>`:""}${g(E)}<span class="seats">${P} Seats</span></div>
                </div>
                ${Kn()}
            </div>`}if(!e&&t.length>0){const _=t.find(E=>E.seats>=M.MAJORITY_SEATS);return _?`
                <div class="administration-box">
                    <div class="administration-header"><div><div class="administration-title">${g(A)} Administration</div><div class="administration-subtitle">Single Party Government</div></div>${C}</div>
                    <div class="administration-content">
                        <div class="admin-leaders-column">
                            <div class="admin-section"><div class="admin-section-title">Prime Minister</div><div class="admin-person-name">${g($(i))}</div><div class="admin-person-details">${i?.minister_age?`Age ${i.minister_age} • `:""}<span class="admin-person-party">${g(_.party_name)}</span></div>${i?.minister_approval!=null?`<div class="minister-approval" style="margin-top:6px;">Approval: <span class="${i.minister_approval<35?"low":i.minister_approval<50?"mid":"high"}">${Math.round(i.minister_approval)}%</span></div>`:""}</div>
                            <div class="admin-section"><div class="admin-section-title">${g(r.head_of_state_title||"Head of State")}</div><div class="admin-person-name">${g(o)} ${g(m)}</div><div class="admin-person-details">${p||`Age ${u} • <span class="admin-person-party">${g(_.party_name)}</span>`}</div></div>
                        </div>
                        ${ht()}
                    </div>
                    <div class="coalition-parties"><div class="coalition-party-tag">${_.party_name}<span class="seats">${_.seats} Seats</span></div></div>
                </div>`:Jt()}if(e){const _=t.find(N=>N.party_id===e.lead_party_id),E=_?_.party_name:"Unknown",P=$(i),L=i?.minister_age??"—",I=a?.factions?.faction_name||(i?i.factions?.faction_name||Di(i.party_id):"—"),x=i?.minister_approval??null,O=x!==null?`<div class="minister-approval" style="margin-top:6px;">Approval: <span class="${x<35?"low":x<50?"mid":"high"}">${Math.round(x)}%</span></div>`:"",F=e.party_ids.filter(N=>!R.find(H=>H.id===N));if(F.length>0){const{data:N}=await l.from("factions").select("id, faction_name, abbreviation, seats, party_color, party_logo, custom_logo_url").in("id",F);N&&R.push(...N)}const T=e.party_ids.map(N=>{const H=t.find(G=>G.party_id===N),D=R.find(G=>G.id===N)?.faction_name||"Unknown";return H?{...H,seats:s[N]||H.seats||0}:{party_name:D,seats:s[N]||0,party_id:N}}).sort((N,H)=>H.seats-N.seats);return`
            <div class="administration-box">
                <div class="administration-header"><div><div class="administration-title">${g(A)} Administration</div><div class="administration-subtitle">${(()=>{if(e.status==="caretaker")return"Caretaker Government";if(e.formation_type==="emergency_minority")return"Emergency Minority Government";const N=e.party_ids.reduce((G,W)=>G+(s[W]||0),0),H=Object.values(s).reduce((G,W)=>G+W,0),U=H>0&&N>=Math.ceil(H/2);return e.party_ids.length>1?U?"Majority Coalition Government":"Minority Coalition Government":U?"Majority Government":"Minority Government"})()}</div></div>${C}</div>
                <div class="administration-content">
                    <div class="admin-leaders-column">
                        <div class="admin-section">
                            <div class="admin-section-title">Prime Minister</div>
                            <div class="admin-person-name">${a?`${g(a.first_name)} ${g(a.last_name)}`:g(P)}</div>
                            <div class="admin-person-details">${a?`Age ${a.age} • `:L!=="—"?`Age ${L} • `:""}<span class="admin-person-party">${g(I)}</span></div>
                            ${O}
                            ${a?`
                                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-main);">
                                    <div style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:0.7rem;font-weight:bold;text-transform:uppercase;background:${Ae(a._resolvedIdeology)};color:white;margin-bottom:6px;">${a._resolvedIdeology||"Unknown"}</div>
                                    <div style="font-size:0.85rem;color:var(--accent);font-weight:bold;margin-bottom:4px;">🏷️ ${a.leader_traits?.trait_name||a.trait_key}</div>
                                    <div style="font-size:0.75rem;color:var(--green);margin-bottom:2px;">▲ ${a.leader_traits?.upside||""}</div>
                                    <div style="font-size:0.75rem;color:var(--red);">▼ ${a.leader_traits?.downside||""}</div>
                                </div>
                                ${a.faction_id===d?.id&&e.status!=="caretaker"?`
                                    <button class="ministry-btn purge" style="margin-top:10px;" onclick="resignPMAction()">📋 Resign as PM</button>
                                `:""}
                            `:""}
                        </div>
                        <div class="admin-section"><div class="admin-section-title">${g(r.head_of_state_title||"Head of State")}</div><div class="admin-person-name">${g(o)} ${g(m)}</div><div class="admin-person-details">${p||`Age ${u} • <span class="admin-person-party">${g(E)}</span>`}</div></div>
                    </div>
                    ${ht()}
                </div>
                <div class="coalition-parties">
                    ${T.map((N,H)=>{const U=We(N.party_id||R.find(re=>re.faction_name===N.party_name)?.id),D=N.party_id||R.find(re=>re.faction_name===N.party_name)?.id,G=Je(D),W=Xe(D),ve=G||W?`<span style="display:inline-flex;vertical-align:middle;margin-right:5px;">${Ce({customLogoUrl:W,iconKey:G,size:16,color:U})}</span>`:"";return`${H>0?'<span class="coalition-divider">|</span>':""}<div class="coalition-party-tag" style="border-left:3px solid ${U};padding-left:8px;">${ve}${g(N.party_name)}<span class="seats">${N.seats} Seats</span></div>`}).join("")}
                </div>
                ${e.status==="caretaker"?pi():`
                    ${Yn(e)}
                    ${fa(e)}
                `}
            </div>`}return`<div class="administration-box">
        <div class="administration-header"><div class="administration-title">${g(A)} Administration</div><div class="administration-subtitle">Caretaker Government</div></div>
        <div class="coalition-parties"><div class="coalition-party-tag" style="background:var(--bg-hover);color:var(--text-secondary);">Awaiting Election Results</div></div>
        ${pi()}
    </div>`}let Qe=[],Mt=null;function ht(){return`
        <div class="admin-chat-section" id="admin-chat-box">
            <div class="admin-chat-header">Administrative Communications</div>
            <div class="admin-chat-messages" id="admin-chat-messages">
                <div class="admin-chat-empty">Loading messages...</div>
            </div>
            ${d?`
            <div class="admin-chat-input-row">
                <input type="text" class="admin-chat-input" id="admin-chat-input" placeholder="Type a message..." maxlength="300" onkeydown="if(event.key==='Enter')sendAdminChat()">
                <button class="admin-chat-send" id="admin-chat-send-btn" onclick="sendAdminChat()">Send</button>
            </div>`:""}
        </div>`}async function Bi(){if(!r)return;const{data:e,error:t}=await l.from("admin_chat").select("id, faction_id, message, tick_posted, created_at").eq("nation_id",r.id).order("created_at",{ascending:!0}).limit(50);if(t){console.error("Failed to load admin chat:",t);return}Qe=e||[],It(),Fi()}function Fi(){Mt||!r||(Mt=l.channel("admin_chat_"+r.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"admin_chat",filter:"nation_id=eq."+r.id},e=>{const t=e.new;Qe.find(i=>i.id===t.id)||(Qe.push(t),It())}).subscribe())}function It(){const e=document.getElementById("admin-chat-messages");if(e){if(Qe.length===0){e.innerHTML='<div class="admin-chat-empty">No messages yet. Start the conversation.</div>';return}e.innerHTML=Qe.map(t=>{const i=R.find(f=>f.id===t.faction_id),n=i?.faction_name||"Unknown",a=i?.party_color||"#888",c=i?.party_logo,s=i?.custom_logo_url,o=c||s?`<span style="display:inline-flex;vertical-align:middle;">${Ce({customLogoUrl:s,iconKey:c,size:14,color:a})}</span>`:"",m=Hi(t.created_at),u=g(t.message);return`<div class="admin-chat-msg" style="border-left-color:${a};">
            <div class="admin-chat-msg-header">
                ${o}
                <span class="admin-chat-msg-party" style="color:${a};">${g(n)}</span>
                <span class="admin-chat-msg-time">${m}</span>
            </div>
            <div class="admin-chat-msg-body">${u}</div>
        </div>`}).join(""),e.scrollTop=e.scrollHeight}}function Hi(e){if(!e)return"";const t=new Date(e),n=new Date-t,a=Math.floor(n/6e4);if(a<1)return"just now";if(a<60)return a+"m ago";const c=Math.floor(a/60);return c<24?c+"h ago":Math.floor(c/24)+"d ago"}window.sendAdminChat=async function(){const e=document.getElementById("admin-chat-input"),t=document.getElementById("admin-chat-send-btn");if(!e||!d||!r)return;const i=e.value.trim();if(!i)return;t.disabled=!0,e.disabled=!0;const{error:n}=await l.from("admin_chat").insert({nation_id:r.id,faction_id:d.id,message:i,tick_posted:q});n?(console.error("Failed to send message:",n),alert("Failed to send message.")):(e.value="",Mt||(Qe.push({id:crypto.randomUUID(),faction_id:d.id,message:i,tick_posted:q,created_at:new Date().toISOString()}),It())),t.disabled=!1,e.disabled=!1,e.focus()};function Jt(e){const t=r?.failed_formation_attempts||0,i=t>=1?Ra:La,n=St!==null?Math.max(0,q-St):0,a=Math.max(0,i-n),c=Math.min(100,n/i*100);let s="safe";a<=1?s="critical":a<=2&&(s="warning");const o=n*2,m=s==="critical"?"⚠️":s==="warning"?"⏳":"🤝",u=s==="critical"?"No Government — Snap Election Imminent":s==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",f=s==="critical"?t>=1?"Form a government immediately or a minority government will be installed":"Form a government immediately or face snap elections":s==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below";return`
        <div class="formation-box ${s}">
            <div class="formation-header ${s}">
                <div class="formation-icon">${m}</div>
                <div class="formation-title ${s}">${u}</div>
                <div class="formation-subtitle">${f}</div>
            </div>
            <div class="formation-body">
                <!-- Countdown -->
                <div class="formation-countdown">
                    <div class="countdown-label">${s==="safe"?"Formation Deadline":"Time Remaining Before Snap Election"}</div>
                    <div class="countdown-track">
                        <div class="countdown-fill ${s}" style="width: ${c}%"></div>
                    </div>
                    <div class="countdown-text ${s}">
                        ${a>0?a+" tick"+(a!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}
                    </div>
                    <div class="countdown-detail">
                        ${n>0?n+" tick"+(n!==1?"s":"")+" without a government (of "+i+" allowed)":"Election just concluded — form a coalition to avoid penalties"}
                    </div>
                </div>

                <!-- Penalty Cards -->
                <div class="formation-penalties">
                    <div class="penalty-card ${s==="safe"?"muted":"active-penalty"}">
                        <div class="penalty-value ${s==="safe"?"dimmed":"red"}">-2%</div>
                        <div class="penalty-label">Party Approval / Tick</div>
                        <div class="penalty-detail">Top 2 parties lose approval each tick</div>
                    </div>
                    <div class="penalty-card accrued">
                        <div class="penalty-value orange">${n>0?n:"0"}</div>
                        <div class="penalty-label">Ticks Elapsed</div>
                        <div class="penalty-detail">${o>0?"-"+o+"% approval lost (top 2)":"No penalties accrued yet"}</div>
                    </div>
                </div>

                ${s!=="safe"?`
                <!-- Snap Election / Minority Government Warning -->
                <div class="snap-warning ${s==="critical"?"imminent":""}">
                    <div class="snap-warning-icon">${t>=1?"⚠️":"🗳️"}</div>
                    <div class="snap-warning-content">
                        <div class="snap-warning-title">
                            ${t>=1?a<=0?"Minority Government Will Be Installed!":"Minority Government in "+a+" Tick"+(a!==1?"s":""):a<=0?"Snap Election Will Trigger Next Tick!":"Snap Election in "+a+" Tick"+(a!==1?"s":"")}
                        </div>
                        <div class="snap-warning-desc">
                            ${t>=1?"If no coalition is formed, the largest party will be installed as a minority government with a permanent -20% legislative penalty.":"If no government is formed within "+i+" ticks, a snap election is called. Non-responsive invitees lose -3 approval."}
                        </div>
                    </div>
                </div>
                `:""}
            </div>
        </div>

        <div class="no-gov-warning">
            <div class="no-gov-warning-icon">⚠️</div>
            <div class="no-gov-warning-text">
                No government has been formed. The top 2 parties lose <strong>2% approval</strong> each tick until a government is formed.
            </div>
        </div>
        <div class="section-header">Government Formation</div>
        <div id="gov-formation-content"></div>`}function Fe(e){return Se[e]??R.find(t=>t.id===e)?.seats??0}function Te(e){return e.reduce((t,i)=>t+Fe(i),0)}function Xt(e){return ye===0?0:Math.round(Te(e)/ye*100)}function Qt(e){const t=new Set;return e.forEach(i=>{const n=R.find(a=>a.id===i);n?.ideology_value_1&&t.add(n.ideology_value_1),n?.ideology_value_2&&t.add(n.ideology_value_2)}),[...t]}function Zt(e){return e.map(t=>`<span class="ideology-chip ${t.toLowerCase()}">${t}</span>`).join("")}async function Nt(){const e=document.getElementById("gov-formation-content");if(!e)return;const{data:t}=await l.from("government_formations").select("*").eq("election_id",rt).eq("status","active").order("created_at",{ascending:!0}),i=[];for(const s of t||[]){const{data:o}=await l.from("government_formation_support").select("faction_id, supports").eq("formation_id",s.id),m=s.party_ids||[],f=(o||[]).filter(w=>m.includes(w.faction_id)).filter(w=>w.supports).length,p=m.length,v=(o||[]).find(w=>w.faction_id===d.id)?.supports===!0,h=m.includes(d.id);i.push({...s,supportCount:f,coalitionSize:p,iAmSupporting:v,iAmInvited:h})}const n=Fe(d.id),a=n>0,c=(t||[]).some(s=>s.proposed_by===d.id);e.innerHTML=`
        <div class="create-proposal-section" id="create-proposal-section">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Propose a Government</div>
            <div style="font-size: 0.82rem; color: #888; margin-bottom: 16px;">
                Select which parties will form the coalition government. You need ${M.MAJORITY_SEATS}+ seats to form a government.
            </div>

            ${a?c?`
                <div class="no-propose-note">You have already submitted a proposal for this election.</div>
            `:`
                <div class="party-checkbox-grid" id="party-checkbox-grid">
                    ${R.map((s,o)=>{const m=s.id===d.id,u=Fe(s.id),f=s.party_color||_e[o%_e.length],p=s.party_logo,y=s.custom_logo_url,v=p||y?`<span style="display:inline-flex;vertical-align:middle;margin-right:5px;">${Ce({customLogoUrl:y,iconKey:p,size:16,color:f})}</span>`:"";return`
                            <div class="party-checkbox-item ${m?"checked disabled":""}"
                                 data-party-id="${s.id}" data-seats="${u}"
                                 style="border-left:3px solid ${f};"
                                 onclick="${m?"":`toggleProposalParty(this, '${s.id}')`}">
                                <div class="party-check-box">${m?"✓":""}</div>
                                <span class="party-check-label">${v}${s.faction_name}</span>
                                <span class="party-check-seats">${u} seats</span>
                            </div>`}).join("")}
                </div>
                <div class="proposal-seat-preview" id="proposal-seat-preview">
                    Coalition seats: <span class="preview-seats" id="preview-seats">${n}</span> / ${ye}
                    (<span id="preview-pct">${ye?Math.round(n/ye*100):0}</span>%)
                    <span id="preview-threshold" style="margin-left: 8px; font-size: 0.8rem; color: #888;">— needs ${M.MAJORITY_SEATS} seats</span>
                </div>
                <button class="action-btn" style="max-width: 300px; margin: 0 auto; display: block;" onclick="createProposal()">
                    Submit Proposal
                </button>
            `:`
                <div class="no-propose-note">Your party has <strong>0 seats</strong> in the legislature. You cannot propose a coalition, but you may be invited to one.</div>
            `}
        </div>

        ${i.length>0?`
            <div class="section-header" style="margin-top: 8px;">Active Proposals</div>
            <div class="proposals-grid">
                ${i.map(s=>{const o=R.find(S=>S.id===s.proposed_by),m=s.party_ids||[],u=Te(m),f=Xt(m),p=u>=M.MAJORITY_SEATS,y=Qt(m),v=m.map((S,C)=>{const $=R.find(E=>E.id===S),A=Fe(S);return`<span class="proposal-mini-chip" style="border-left:3px solid ${$?.party_color||_e[C%_e.length]};">${$?.faction_name||"?"} · ${A}</span>`}).join("");let h="";s.iAmSupporting?h='<span class="proposal-your-status supporting">✓ SUPPORTING</span>':s.iAmInvited?h='<span class="proposal-your-status invited">INVITED</span>':h='<span class="proposal-your-status locked-out">NOT INVITED</span>';const w=s.iAmSupporting?"your-support":s.iAmInvited?"":"not-invited",k=s.iAmInvited||s.iAmSupporting?`onclick="openFormation('${s.id}')"`:"";return`
                        <div class="proposal-card ${w}" ${k}>
                            <div class="proposal-card-title">${o?.faction_name||"Unknown"} Coalition ${h}</div>
                            <div class="proposal-card-meta">Proposed by ${o?.faction_name||"Unknown"}</div>
                            <div class="proposal-card-stats">
                                <span>Seats: <span class="stat-val ${p?"meets":"below"}">${u}</span> (${f}%)</span>
                            </div>
                            <div class="proposal-card-parties">${v}</div>
                            ${y.length>0?`<div class="proposal-card-ideologies">${Zt(y)}</div>`:""}
                            <div class="proposal-card-support">Support: <span class="count">${s.supportCount}</span> / ${s.coalitionSize} coalition members</div>
                        </div>`}).join("")}
            </div>
        `:""}
    `,ei()}function zi(e,t){const i=Ke.indexOf(t);i>-1?(Ke.splice(i,1),e.classList.remove("checked"),e.querySelector(".party-check-box").textContent=""):(Ke.push(t),e.classList.add("checked"),e.querySelector(".party-check-box").textContent="✓"),ei()}function ei(){const e=document.getElementById("preview-seats"),t=document.getElementById("preview-pct"),i=document.getElementById("preview-threshold");if(!e)return;const n=[d.id,...Ke.filter(o=>o!==d.id)],a=Te(n),c=ye?Math.round(a/ye*100):0,s=a>=M.MAJORITY_SEATS;e.textContent=a,e.className="preview-seats "+(s?"meets":"below"),t.textContent=c,i.textContent=s?`✓ Meets ${M.MAJORITY_SEATS}-seat threshold`:`— needs ${M.MAJORITY_SEATS} seats`,i.style.color=s?"var(--green)":"var(--text-secondary)"}async function Ui(){if(Tt)return;if(Fe(d.id)===0){alert("Your party has no seats — you cannot propose a coalition.");return}const e=[d.id,...Ke.filter(a=>a!==d.id)];if(Te(e)<M.MAJORITY_SEATS){alert(`Your coalition does not meet the ${M.MAJORITY_SEATS}-seat threshold. Add more parties.`);return}const{data:i}=await l.from("government_formations").select("id").eq("election_id",rt).eq("proposed_by",d.id).eq("status","active").limit(1);if(i&&i.length>0){alert("You already have an active proposal for this election.");return}Tt=!0;const n=document.querySelector("#create-proposal-section .action-btn");n&&(n.disabled=!0,n.textContent="Submitting...");try{const{data:a}=await l.from("shard").select("current_date").eq("name","Alpha Shard").single(),c=a?.current_date||"",{data:s,error:o}=await l.from("government_formations").insert({nation_id:r.id,election_id:rt,proposed_by:d.id,party_ids:e,status:"active",game_year:c}).select().single();if(o){alert("Error creating proposal: "+o.message);return}const{error:m}=await l.rpc("toggle_formation_support",{p_formation_id:s.id,p_faction_id:d.id,p_supports:!0});m&&console.warn("Auto-support failed (non-blocking):",m),Ke=[],Rt(s.id)}finally{Tt=!1,n&&(n.disabled=!1,n.textContent="Submit Proposal")}}async function Rt(e){$e&&(l.removeChannel($e),$e=null),te=e;const{data:t,error:i}=await l.from("government_formations").select("*").eq("id",e).single();if(i||!t){alert("Could not load this proposal.");return}if(me=t.party_ids||[],!me.includes(d.id)){alert("You are not invited to this coalition."),te=null,me=[];return}const{data:n}=await l.from("government_formation_support").select("faction_id, supports").eq("formation_id",e);fe={},(n||[]).forEach(c=>{me.includes(c.faction_id)&&(fe[c.faction_id]=c.supports)});const{data:a}=await l.from("government_formation_chat").select("*").eq("formation_id",e).order("created_at",{ascending:!0}).limit(200);ct=a||[],ji(t),Gi(e)}function ji(e){const t=document.getElementById("gov-formation-content");if(!t)return;const i=e.party_ids||[],n=e.ministry_assignments||{},a=e.minister_names||{},c=R.find(x=>x.id===e.proposed_by),s=Te(i),o=Xt(i),m=s>=M.MAJORITY_SEATS,u=Qt(i),f=i.includes(d.id),p=i.map((x,O)=>{const F=R.find(G=>G.id===x),T=Fe(x),N=F?.party_color||_e[O%_e.length],H=F?.party_logo,U=F?.custom_logo_url,D=H||U?`<span style="display:inline-flex;vertical-align:middle;margin-right:5px;">${Ce({customLogoUrl:U,iconKey:H,size:16,color:N})}</span>`:"";return`<div class="formation-party-chip" style="border-left:3px solid ${N};">${D}${F?.faction_name||"?"}<span class="chip-seats">${T} seats</span></div>`}).join(""),y=i.map(x=>{const O=R.find(F=>F.id===x);return`<option value="${x}">${O?.faction_name||"?"}</option>`}).join(""),v=Be.map(x=>{const O=a[x.key],F=O?`${O.first_name} ${O.last_name}, Age ${O.age}`:"",T=x.inactive;return`
            <div class="ministry-item ${x.locked?"locked":""} ${T?"inactive-ministry":""}" id="ministry-row-${x.key}">
                <div class="ministry-info">
                    <div class="ministry-item-name">${x.name}</div>
                    <div class="ministry-item-desc">${x.description}</div>
                    ${F?`<div class="ministry-minister-name">${F}</div>`:""}
                </div>
                ${T?'<div style="font-size:0.75rem;color:var(--text-dim);">Requires legislation</div>':`
                    <div class="ministry-select-wrap">
                        <select onchange="onMinistryChange('${x.key}', this.value)" id="ministry-select-${x.key}">
                            <option value="">Select Party...</option>
                            ${y}
                        </select>
                    </div>
                `}
            </div>`}).join("");setTimeout(()=>{Be.forEach(x=>{if(x.inactive)return;const O=document.getElementById(`ministry-select-${x.key}`);O&&n[x.key]&&(O.value=n[x.key])})},0);const h=R.filter(x=>i.includes(x.id)),w=h.map(x=>{const O=fe[x.id],F=x.id===d.id;let T=O===!0?'<span class="support-status yes">✓ SUPPORTING</span>':'<span class="support-status pending">— NON-SUPPORTING</span>',N="";return F&&(N=fe[d.id]===!0?'<button class="support-toggle-btn btn-withdraw" onclick="toggleFormationSupport(false)">Withdraw Support</button>':'<button class="support-toggle-btn btn-support" onclick="toggleFormationSupport(true)">Support</button>'),`
            <div class="support-row">
                <span class="support-party-name">${x.faction_name}${F?'<span class="you-tag">(You)</span>':""}</span>
                <div style="display:flex; align-items:center; gap:12px;">${T}${N}</div>
            </div>`}).join(""),k=n.prime_minister||null,S=k===d.id,C=h.every(x=>fe[x.id]===!0),$=Be.filter(x=>!x.inactive).every(x=>n[x.key]),A=S&&C&&$&&m,_=[];if($||_.push("All ministries must be assigned."),!C){const x=h.filter(O=>fe[O.id]===!0).length;_.push(`${x}/${h.length} coalition members supporting.`)}m||_.push(`Coalition has ${s} seats (need ${M.MAJORITY_SEATS}).`);const E=ct.length>0?ct.map(x=>ti(x)).join(""):'<div class="chat-empty">No messages yet. Start negotiating!</div>',P=e.proposed_by===d.id,L=P?R.map((x,O)=>{const F=x.id===d.id,T=i.includes(x.id),N=Fe(x.id),H=x.party_color||_e[O%_e.length];return`
            <div class="party-checkbox-item ${T?"checked":""} ${F?"disabled":""}"
                 data-party-id="${x.id}" data-seats="${N}"
                 style="border-left:3px solid ${H};"
                 onclick="${F?"":`toggleEditParty(this, '${x.id}')`}">
                <div class="party-check-box">${T?"✓":""}</div>
                <span class="party-check-label">${x.faction_name}</span>
                <span class="party-check-seats">${N} seats</span>
            </div>`}).join(""):"";t.innerHTML=`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div class="back-link" onclick="loadFormationsList()" style="margin-bottom: 0;">← Back to Proposals</div>
            <div style="display: flex; gap: 8px;">
                ${P?`<button onclick="toggleEditCoalition()" id="edit-coalition-btn" style="padding: 8px 16px; background: var(--bg-card); border: 1px solid var(--border-0); color: var(--text-secondary); border-radius: 3px; font-family: var(--font-mono); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: 0.2s;" onmouseover="this.style.borderColor='var(--text-dim)'" onmouseout="this.style.borderColor='var(--border-0)'">Edit Coalition</button>`:""}
                ${P?`<button onclick="retractProposal('${e.id}')" style="padding: 8px 16px; background: var(--red-faint); border: 1px solid var(--red-border); color: var(--red); border-radius: 3px; font-family: var(--font-mono); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: 0.2s;">Retract Proposal</button>`:""}
            </div>
        </div>

        <div class="formation-header-box">
            <div class="formation-title">${c?.faction_name||"Unknown"} Coalition</div>
            <div class="formation-proposer">Proposed by ${c?.faction_name||"Unknown"} · ${e.game_year||"Unknown"}</div>
            <div class="formation-parties-row" id="formation-parties-row">${p}</div>
            <div class="formation-stats">
                <span class="formation-stat">Seats: <span class="stat-highlight ${m?"":"below-threshold"}">${s} (${o}%)</span></span>
                <span class="formation-stat">Threshold: <span class="stat-highlight">${m?`✓ Meets ${M.MAJORITY_SEATS} seats`:`✗ Below ${M.MAJORITY_SEATS} seats`}</span></span>
            </div>
            ${u.length>0?`<div class="formation-ideologies">${Zt(u)}</div>`:""}
            ${P?`
            <div id="edit-coalition-panel" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid #333;">
                <div style="font-size: 0.82rem; color: #888; margin-bottom: 10px;">Add or remove parties from this coalition:</div>
                <div class="party-checkbox-grid" id="edit-party-grid">${L}</div>
                <div class="proposal-seat-preview" id="edit-seat-preview">
                    Coalition seats: <span class="preview-seats" id="edit-preview-seats">${s}</span> / ${ye}
                    (<span id="edit-preview-pct">${o}</span>%)
                    <span id="edit-preview-threshold" style="margin-left: 8px; font-size: 0.8rem; color: ${m?"var(--green)":"var(--text-secondary)"};">${m?`✓ Meets ${M.MAJORITY_SEATS}-seat threshold`:`— needs ${M.MAJORITY_SEATS} seats`}</span>
                </div>
                <button class="action-btn" style="max-width: 300px; margin: 8px auto 0; display: block;" onclick="saveCoalitionEdit('${e.id}')">Save Changes</button>
            </div>
            `:""}
        </div>

        <div class="support-bar" id="support-bar">
            <div class="support-bar-title">Coalition Support</div>
            ${w}
            ${f?'<div class="support-exclusive-note">You may only support one coalition at a time. Supporting this one will withdraw support from any other.</div>':""}
        </div>

        <div class="formation-layout">
            <div class="ministry-list" id="ministry-list">${v}</div>
            <div class="chat-panel">
                <div class="chat-header">Negotiation Chat</div>
                <div class="chat-messages" id="formation-chat-messages">${E}</div>
                <div class="chat-input-row">
                    <input type="text" id="formation-chat-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendFormationChatMessage()">
                    <button class="chat-send-btn" onclick="sendFormationChatMessage()">Send</button>
                </div>
            </div>
        </div>

        <div class="form-gov-section" id="form-gov-section">
            ${S?`
                <button class="form-gov-btn" id="form-gov-btn" onclick="formGovernment()" ${A?"":"disabled"}>Form Government</button>
                ${A?"":`<div style="font-size: 0.8rem; color: #888; margin-top: 8px;">${_.join(" ")}</div>`}
            `:k?`
                <div style="font-size: 0.85rem; color: #888;">Waiting for ${R.find(x=>x.id===k)?.faction_name||"the PM's party"} to form the government.</div>
            `:`
                <div style="font-size: 0.85rem; color: #888;">Assign a Prime Minister to enable government formation.</div>
            `}
        </div>
    `;const I=document.getElementById("formation-chat-messages");I&&(I.scrollTop=I.scrollHeight)}function ti(e){const t=e.faction_id===d.id,i=new Date(e.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});return`
        <div class="chat-msg ${t?"mine":""}">
            <div class="chat-msg-author">${e.faction_name}</div>
            <div class="chat-msg-bubble">${g(e.message)}</div>
            <div class="chat-msg-time">${i}</div>
        </div>`}function Gi(e){$e=l.channel("formation-"+e).on("postgres_changes",{event:"UPDATE",schema:"public",table:"government_formations",filter:`id=eq.${e}`},t=>{const i=t.new;Yi(i.ministry_assignments||{},i.minister_names||{}),Lt(i.ministry_assignments||{})}).on("postgres_changes",{event:"*",schema:"public",table:"government_formation_support",filter:`formation_id=eq.${e}`},async()=>{const{data:t}=await l.from("government_formation_support").select("faction_id, supports").eq("formation_id",e);fe={},(t||[]).forEach(i=>{me.includes(i.faction_id)&&(fe[i.faction_id]=i.supports)}),Vi(),Lt()}).on("postgres_changes",{event:"INSERT",schema:"public",table:"government_formation_chat",filter:`formation_id=eq.${e}`},t=>{const i=t.new;if(ct.find(a=>a.id===i.id))return;ct.push(i);const n=document.getElementById("formation-chat-messages");if(n){const a=n.querySelector(".chat-empty");a&&a.remove(),n.insertAdjacentHTML("beforeend",ti(i)),n.scrollTop=n.scrollHeight}}).subscribe()}function Yi(e,t){Be.forEach(i=>{if(i.inactive)return;const n=document.getElementById(`ministry-select-${i.key}`);n&&n!==document.activeElement&&(n.value=e[i.key]||"");const a=document.getElementById(`ministry-row-${i.key}`);if(a){let c=a.querySelector(".ministry-minister-name");const s=t[i.key];if(s){const o=`${s.first_name} ${s.last_name}, Age ${s.age}`;c?c.textContent=o:a.querySelector(".ministry-info").insertAdjacentHTML("beforeend",`<div class="ministry-minister-name">${o}</div>`)}else c&&c.remove()}})}function Vi(){const e=document.getElementById("support-bar");if(!e)return;const t=R.filter(a=>me.includes(a.id)),i=me.includes(d.id),n=t.map(a=>{const c=fe[a.id],s=a.id===d.id;let o=c===!0?'<span class="support-status yes">✓ SUPPORTING</span>':'<span class="support-status pending">— NON-SUPPORTING</span>',m="";return s&&(m=fe[d.id]===!0?'<button class="support-toggle-btn btn-withdraw" onclick="toggleFormationSupport(false)">Withdraw Support</button>':'<button class="support-toggle-btn btn-support" onclick="toggleFormationSupport(true)">Support</button>'),`
            <div class="support-row">
                <span class="support-party-name">${a.faction_name}${s?'<span class="you-tag">(You)</span>':""}</span>
                <div style="display:flex; align-items:center; gap:12px;">${o}${m}</div>
            </div>`}).join("");e.innerHTML=`
        <div class="support-bar-title">Coalition Support</div>
        ${n}
        ${i?'<div class="support-exclusive-note">You may only support one coalition at a time. Supporting this one will withdraw support from any other.</div>':""}
    `}async function Lt(e){if(!e){const{data:p}=await l.from("government_formations").select("ministry_assignments").eq("id",te).single();e=p?.ministry_assignments||{}}const t=R.filter(p=>me.includes(p.id)),i=Te(me),n=i>=M.MAJORITY_SEATS,a=e.prime_minister||null,c=a===d.id,s=t.every(p=>fe[p.id]===!0),o=Be.filter(p=>!p.inactive).every(p=>e[p.key]),m=c&&s&&o&&n,u=[];if(o||u.push("All ministries must be assigned."),!s){const p=t.filter(y=>fe[y.id]===!0).length;u.push(`${p}/${t.length} coalition members supporting.`)}n||u.push(`Coalition has ${i} seats (need ${M.MAJORITY_SEATS}).`);const f=document.getElementById("form-gov-section");f&&(c?f.innerHTML=`
            <button class="form-gov-btn" id="form-gov-btn" onclick="formGovernment()" ${m?"":"disabled"}>Form Government</button>
            ${m?"":`<div style="font-size: 0.8rem; color: #888; margin-top: 8px;">${u.join(" ")}</div>`}`:a?f.innerHTML=`<div style="font-size: 0.85rem; color: #888;">Waiting for ${R.find(p=>p.id===a)?.faction_name||"the PM's party"} to form the government.</div>`:f.innerHTML='<div style="font-size: 0.85rem; color: #888;">Assign a Prime Minister to enable government formation.</div>')}async function Ki(e,t){if(te)try{if(e==="prime_minister"){const{data:i}=await l.from("government_formations").select("ministry_assignments, minister_names").eq("id",te).single(),n=i?.ministry_assignments||{},a=i?.minister_names||{};if(t){n.prime_minister=t;const{data:s}=await l.from("factions").select("leader_first_name, leader_last_name, leader_age").eq("id",t).single();s?.leader_first_name?a.prime_minister={first_name:s.leader_first_name,last_name:s.leader_last_name,age:s.leader_age}:delete a.prime_minister}else delete n.prime_minister,delete a.prime_minister;const{error:c}=await l.from("government_formations").update({ministry_assignments:n,minister_names:a}).eq("id",te);if(c)throw c;Lt(n)}else{const{data:i,error:n}=await l.rpc("assign_ministry",{p_formation_id:te,p_ministry_key:e,p_party_id:t||""});if(n)throw n;i.success||alert(i.message)}}catch(i){alert("Error: "+i.message)}}async function Wi(e){if(te)try{const{data:t,error:i}=await l.rpc("toggle_formation_support",{p_formation_id:te,p_faction_id:d.id,p_supports:e});if(i)throw i;t.success||alert(t.message)}catch(t){alert("Error: "+t.message)}}async function Ji(){const e=document.getElementById("formation-chat-input");if(!e)return;const t=e.value.trim();if(!(!t||!te)){e.value="",e.disabled=!0;try{const{error:i}=await l.from("government_formation_chat").insert({formation_id:te,faction_id:d.id,faction_name:d.faction_name,message:t});if(i)throw i}catch(i){alert("Error sending message: "+i.message),e.value=t}e.disabled=!1,e.focus()}}function Xi(){const e=document.getElementById("edit-coalition-panel");if(!e)return;const t=e.style.display!=="none";e.style.display=t?"none":"block",t||(he=[...me],document.querySelectorAll("#edit-party-grid .party-checkbox-item").forEach(i=>{const n=i.getAttribute("data-party-id"),a=he.includes(n);i.classList.toggle("checked",a),i.querySelector(".party-check-box").textContent=a?"✓":""}),ii()),document.getElementById("edit-coalition-btn").textContent=t?"Edit Coalition":"Cancel Edit"}function Qi(e,t){const i=he.indexOf(t);i>-1?(he.splice(i,1),e.classList.remove("checked"),e.querySelector(".party-check-box").textContent=""):(he.push(t),e.classList.add("checked"),e.querySelector(".party-check-box").textContent="✓"),ii()}function ii(){const e=document.getElementById("edit-preview-seats"),t=document.getElementById("edit-preview-pct"),i=document.getElementById("edit-preview-threshold");if(!e)return;const n=Te(he),a=ye?Math.round(n/ye*100):0,c=n>=M.MAJORITY_SEATS;e.textContent=n,e.className="preview-seats "+(c?"meets":"below"),t.textContent=a,i.textContent=c?`✓ Meets ${M.MAJORITY_SEATS}-seat threshold`:`— needs ${M.MAJORITY_SEATS} seats`,i.style.color=c?"var(--green)":"var(--text-secondary)"}async function Zi(e){if(!he.includes(d.id)){alert("Your party must remain in the coalition.");return}if(Te(he)<M.MAJORITY_SEATS){alert(`Your coalition does not meet the ${M.MAJORITY_SEATS}-seat threshold. Add more parties.`);return}const i=me.filter(n=>!he.includes(n));try{for(const u of i)await l.from("government_formation_support").delete().eq("formation_id",e).eq("faction_id",u);const{data:n}=await l.from("government_formations").select("ministry_assignments, minister_names").eq("id",e).single(),a=n?.ministry_assignments||{},c=n?.minister_names||{};let s=!1;for(const[u,f]of Object.entries(a))i.includes(f)&&(a[u]=null,delete c[u],s=!0);const o={party_ids:he};s&&(o.ministry_assignments=a,o.minister_names=c);const{error:m}=await l.from("government_formations").update(o).eq("id",e);if(m)throw m;me=[...he],await Rt(e)}catch(n){alert("Error updating coalition: "+n.message)}}async function en(e){if(confirm("Are you sure you want to retract this coalition proposal? This will remove it for all parties."))try{await l.from("government_formation_support").delete().eq("formation_id",e),await l.from("government_formation_chat").delete().eq("formation_id",e);const{error:t}=await l.from("government_formations").delete().eq("id",e).eq("proposed_by",d.id);if(t)throw t;$e&&(l.removeChannel($e),$e=null),te=null,me=[],await Nt()}catch(t){alert("Error retracting proposal: "+t.message)}}async function tn(){if(!Pt&&te&&confirm("Form this government? This will finalize all ministry assignments.")){Pt=!0;try{const{data:e,error:t}=await l.rpc("form_government",{p_formation_id:te,p_caller_faction_id:d.id});if(t)throw t;if(!e.success){alert(e.message);return}const{data:i}=await l.from("nations").select("hos_election_method").eq("id",r.id).single();i?.hos_election_method==="appointed"&&await l.from("nations").update({head_of_state_first_name:null,head_of_state_last_name:null,head_of_state_age:null}).eq("id",r.id);const{data:n}=await l.from("nations").select("*").eq("id",r.id).single(),a={};Be.forEach(o=>{o.inactive||(a[o.key]=$t(o.key,n||r))});const{data:c,error:s}=await l.rpc("finalize_government_formation",{p_formation_id:te,p_caller_faction_id:d.id,p_ministry_baselines:a});if(s){if(!(/finalize_government_formation/i.test(s.message||"")||s.code==="PGRST202"))throw s;console.warn("finalize_government_formation RPC unavailable; falling back to sequential operations"),await nn(a)}else if(c&&!c.success){alert(c.message);return}alert(c?.message||e.message),$e&&(l.removeChannel($e),$e=null),sessionStorage.removeItem("nationhood_state"),location.reload()}catch(e){alert("Error: "+e.message)}finally{Pt=!1}}}async function nn(e){await za(l,r.id,te),await l.from("nations").update({failed_formation_attempts:0}).eq("id",r.id);const{data:t}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single();t&&(await l.from("elections").update({status:"cancelled"}).eq("nation_id",r.id).eq("status","scheduled").is("election_type",null).lte("election_tick",t.current_tick+5),await l.from("elections").update({status:"cancelled"}).eq("nation_id",r.id).eq("status","scheduled").eq("election_type","parliamentary").lte("election_tick",t.current_tick+5)),await l.from("government_formations").update({status:"cancelled"}).eq("nation_id",r.id).eq("status","active").neq("id",te),await l.from("bills").update({status:"failed"}).eq("nation_id",r.id).eq("status","frozen");const{data:i}=await l.from("government_formations").select("ministry_assignments, minister_names").eq("id",te).single(),n=i?.ministry_assignments||{},a=i?.minister_names||{},c=n.prime_minister;for(const[u,f]of Object.entries(n)){if(!f||u==="prime_minister")continue;const p=a[u];if(!p)continue;const y={party_id:f,minister_first_name:p.first_name,minister_last_name:p.last_name,minister_age:p.age,minister_approval:we,stat_baselines:e[u]||{}},{data:v}=await l.from("ministries").select("id").eq("nation_id",r.id).eq("ministry_key",u).eq("is_active",!0).maybeSingle();v?await l.from("ministries").update(y).eq("id",v.id):await l.from("ministries").insert({nation_id:r.id,ministry_key:u,ministry_name:Be.find(h=>h.key===u)?.name||u,is_active:!0,...y})}const s=r.hos_election_method||null,o=s==="appointed",m=Number.isFinite(Number(r.head_of_state_age))&&Number(r.head_of_state_age)>0;if(s!=="hereditary"&&(o||!r.head_of_state_first_name||!r.head_of_state_last_name||!m)){const u=["Alejandro","Camila","Diego","Valentina","Mateo","Isabela","Sebastián","Luca","Andrés","Gabriel","Joaquín","Mariana","Carlos","Tomas","Rafael","Edwin","Emilio","Catalina","Fernando","Renata"],f=["Velasco","Mendoza","Guerrero","Salazar","Castillo","Herrera","Morales","Ríos","Delgado","Espinoza","Guzmán","Navarro","Córdoba","Echeverría","Pacheco","Montero","Aguilar","Valenzuela","Carrasco","Ibarra"],p=o?u[Math.floor(Math.random()*u.length)]:r.head_of_state_first_name||u[Math.floor(Math.random()*u.length)],y=o?f[Math.floor(Math.random()*f.length)]:r.head_of_state_last_name||f[Math.floor(Math.random()*f.length)],v=o?45+Math.floor(Math.random()*25):m?Number(r.head_of_state_age):45+Math.floor(Math.random()*25);try{await l.from("nations").update({head_of_state_first_name:p,head_of_state_last_name:y,head_of_state_age:v}).eq("id",r.id)}catch(h){console.warn("Could not set head of state:",h)}}if(c){const{data:u}=await l.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),{data:f}=await l.from("nations").select("*").eq("id",r.id).single(),{data:p}=await l.from("factions").select("id, faction_name, seats, approval_rating").eq("nation_id",r.id).eq("faction_type","party"),{data:y}=await l.from("government_formations").select("party_ids, ministry_assignments, proposed_by").eq("id",te).single();if(y&&(y.lead_party_id=y.ministry_assignments?.prime_minister||y.proposed_by),f&&y){const{data:v}=await l.from("elections").select("election_tick").eq("nation_id",r.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),h=v&&u?.current_tick-v.election_tick<=8?"election_loss":"new_coalition",w=(p||[]).filter(S=>(y.party_ids||[]).includes(S.id)),k=w.length>0?Math.round(w.reduce((S,C)=>S+(C.approval_rating??40),0)/w.length):null;try{await gi(l,r.id,f,h,y,p||[],u?.current_tick||0,u?.current_date||"",k)}catch(S){console.error("Administration lifecycle error (non-fatal):",S)}}try{await vi(l,r.id,c,u?.current_tick||0)}catch(v){console.error("Auto-appoint PM failed:",v)}}}function ni(e,t){const i=Ya[e];if(!i||i.length===0||!r)return"";const n=.6,a=-.5,c="mstat-"+e,s=t?.stat_baselines||{};let o="",m=0,u=0,f=0;for(const h of i)bi(h)!==0&&f++;for(const h of i){const w=Number(r[h]??50),k=Math.round(w*10)/10,S=bi(h);if(S===0)continue;const C=s[h]!=null?Number(s[h]):null,$=C!==null,A=$?Math.round(C*10)/10:"—",_=$?w-C:0,E=_*S,P=Math.abs(_),L=Math.round(P*10)/10;$&&(m+=E,u++);const I=$&&f>0?E/f*n:0,x=Math.abs(I);let O="—",F="flat";$&&x>=.01&&(O=(I>0?"+":"-")+(Math.round(x*100)/100).toFixed(2),F=I>0?"good":"bad");let T="—",N="flat";$&&P>=.1?(T=(E>0?"↑":"↓")+L,N=E>0?"good":"bad"):$&&(T="—",N="flat");const H=!$||P<.1?"flat":E>0?"good":"bad",U=ft(h),D=S===1?"Higher is better":"Lower is better",G=$?"Appointed: "+A+"%. Now: "+k+"%. "+D+".":"No baseline recorded. "+D+".";o+='<div class="ministry-stat-row" title="'+g(G)+'"><span class="stat-name">'+g(U)+'</span><span class="stat-appointed">'+($?A+"%":"—")+'</span><span class="stat-val">'+k+'%</span><span class="stat-delta '+N+'">'+T+'</span><span class="stat-effect '+F+'">'+O+'</span><span class="stat-dot '+H+'">●</span></div>'}let p=0;if(e==="foreign"&&Ve>0){p=Ve*-.25;const h=p.toFixed(2);o+='<div class="ministry-stat-row" title="'+Ve+' nation(s) without an ambassador appointed from your side"><span class="stat-name">Missing ambassadors</span><span class="stat-appointed">—</span><span class="stat-val">'+Ve+'</span><span class="stat-delta bad">↓'+Ve+'</span><span class="stat-effect bad">'+h+'</span><span class="stat-dot bad">●</span></div>'}let y="No data",v="flat";if(u>0){const h=m/u,w=Math.abs(h)>=.5?h*n:0,k=a+w+p,S=Math.abs(k),C=S>=.01?" ("+(k>0?"+":"-")+(Math.round(S*100)/100).toFixed(2)+"/tick)":"";Math.abs(h)<.5?(y="Approval holding steady"+C,v="flat"):h>0?(y="Approval trending upward"+C,v="good"):(y="Approval trending downward"+C,v="bad")}return`<button class="ministry-stats-toggle" onclick="event.stopPropagation();this.classList.toggle('open');document.getElementById('`+c+`').classList.toggle('open')"><span class="chevron">▶</span> Performance Since Appointed</button><div class="ministry-stats-panel" id="`+c+'"><div class="ministry-stat-row ministry-stat-header"><span class="stat-name">Stat</span><span class="stat-appointed">Appointed</span><span class="stat-val">Now</span><span class="stat-delta">Change</span><span class="stat-effect">Effect</span><span class="stat-dot"></span></div>'+o+'<div class="ministry-stats-footer '+v+'">Overall: '+y+"</div></div>"}function lt(e,t,i){const n=i>0?`<span class="ministry-card__badge" style="background:rgba(91,155,213,0.1);border-color:rgba(91,155,213,0.25);color:#5b9bd5;">${i}</span>`:"";return`<div class="ministry-card__header">
        <div class="ministry-card__header-left">
            <div class="ministry-card__dot"></div>
            <div class="ministry-card__title">${g(e)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">${n}</div>
    </div>`}function an(e){if(!e||!e.minister_first_name)return"";const t=e.minister_first_name||"",i=e.minister_last_name||"",n=e.factions?.faction_name||"Unknown",a=We(e.party_id),c=Je(e.party_id),s=Xe(e.party_id),o=c||s?`<span style="display:inline-flex;vertical-align:middle;margin-right:4px;">${Ce({customLogoUrl:s,iconKey:c,size:13,color:a})}</span>`:"",m=e.minister_approval??we,u=m>=50?"approval-good":m>=35?"approval-warn":"approval-bad";return`<div class="ministry-card__minister">
        <div class="ministry-card__minister-name">${g(t)} ${g(i)}</div>
        <div class="ministry-card__minister-meta">
            Age ${e.minister_age??"?"} · ${o}<span class="party" style="color:${a};">${g(n)}</span>
        </div>
        <div class="ministry-card__minister-meta" style="margin-top:1px;">
            Approval: <span class="${u}">${Math.round(m)}%</span>
        </div>
    </div>`}function Ot(e,t,i){const n=d?.action_points||0,a=t&&t.minister_first_name,c=n<1,s='style="opacity:0.4;cursor:not-allowed;"';let o="";if(i.type==="autocracy")if(i.isRuling)a?c?o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--purge" ${s} title="Need 1 AP">PURGE<span class="ministry-card__mgmt-ap">1 AP</span></div>`:o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--purge" onclick="event.stopPropagation();purgeMinister('${e}')">PURGE<span class="ministry-card__mgmt-ap">1 AP</span></div>`:o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--assign" onclick="event.stopPropagation();openAssignModal('${e}')">ASSIGN</div>`;else if(i.isMyMinistry)o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--resign" onclick="event.stopPropagation();resignMinistry('${e}')">RESIGN MINISTRY</div>`;else{const m=yt.filter(u=>u.faction_id===d?.id).length;i.myRequest?o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--unrequest" onclick="event.stopPropagation();unrequestMinistry('${i.myRequest.id}')">UNREQUEST<span class="ministry-card__mgmt-ap">0 AP</span></div>`:m<2&&n>=1?o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--request" onclick="event.stopPropagation();requestMinistry('${e}')">REQUEST<span class="ministry-card__mgmt-ap">1 AP</span></div>`:o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--request" ${s} title="${m>=2?"Max 2 requests":"Need 1 AP"}">REQUEST<span class="ministry-card__mgmt-ap">1 AP</span></div>`}else i.type==="parliamentary"?(i.isMyMinistry&&!i.isCaretaker&&(o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--resign" onclick="event.stopPropagation();resignMinistry('${e}')">RESIGN</div>`),i.isPMParty&&!i.isCaretaker&&!i.isMyMinistry&&a&&(c?o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--dismiss" ${s} title="Need 1 AP">DISMISS<span class="ministry-card__mgmt-ap">1 AP</span></div>`:o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--dismiss" onclick="event.stopPropagation();fireMinister('${e}')">DISMISS<span class="ministry-card__mgmt-ap">1 AP</span></div>`),!a&&i.canAppoint&&(o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--appoint" onclick="event.stopPropagation();openAssignModal('${e}')">APPOINT</div>`)):i.type==="presidential"&&(i.isMyMinistry&&!i.isPresidentParty&&(o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--resign" onclick="event.stopPropagation();resignMinistry('${e}')">RESIGN</div>`),i.isPresidentParty&&a&&(c?o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--dismiss" ${s} title="Need 1 AP">DISMISS<span class="ministry-card__mgmt-ap">1 AP</span></div>`:o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--dismiss" onclick="event.stopPropagation();fireMinister('${e}')">DISMISS<span class="ministry-card__mgmt-ap">1 AP</span></div>`),!a&&i.isPresidentParty&&(o+=`<div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--nominate" onclick="event.stopPropagation();openNominateModal('${e}')">NOMINATE</div>`));return o?`<div class="ministry-card__mgmt">${o}</div>`:""}function Dt(e){if(!e||e.length===0)return"";let t="";return e.forEach(i=>{t+=`<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 14px;font-family:var(--font-mono);font-size:8px;border-bottom:1px solid rgba(255,255,255,0.04);">
            <span style="color:#5b9bd5;">${g(i.factions?.faction_name||"Unknown")} requests</span>
            <div class="ministry-card__mgmt-btn ministry-card__mgmt-btn--deny" onclick="event.stopPropagation();denyRequest('${i.id}')" style="font-size:7px;padding:2px 6px;">DENY</div>
        </div>`}),t}function Pe(e){if(!d)return!1;const t=ae.find(i=>i.ministry_key===e);return!!(t&&t.party_id===d.id)}function sn(e,t){if(e==="defense")return on(t);if(e==="healthcare")return ln(t);if(e==="education")return cn(t);if(e==="foreign")return`<div class="ministry-card__actions-label">ACTIONS</div>
            <div style="padding:10px 12px;font-size:11px;color:var(--text-secondary);">
                Foreign Ministry actions are conducted in the <a href="diplomacy.html" style="color:var(--accent);text-decoration:underline;">Diplomacy panel</a>.
            </div>`;const i=ue[e];if(!i||!i.actions||i.actions.length===0)return"";const n=r?.population||2e7,a=d?.action_points||0,c=t===!0,s=ae.find(p=>p.ministry_key===e),o=Number(s?.discretionary_balance||0),m=o>=1e9?"$"+(o/1e9).toFixed(1)+"B":o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>0?"$"+Math.round(o).toLocaleString():"$0";let f=`<div class="ministry-card__actions-label" style="display:flex;justify-content:space-between;align-items:center;">
        <span>ACTIONS</span>
        <span style="font-size:8px;font-weight:600;${o>0?"color:var(--green)":"color:var(--red)"};letter-spacing:0.03em;">Discretionary Funds: ${m}</span>
    </div>`;return i.actions.forEach(p=>{const y=e+":"+p.id,v=Q[y]||0,h=p.apCosts[Math.min(v,3)],w=p.tags.map(I=>`<span class="tag tag--${I.cls}">${I.label}</span>`).join(""),k=e+"-"+p.id,S=se[k]||!1;let C="";p.budgetSavesPerCapita?C=`<span class="tag tag--positive">SAVES ${xt(p.budgetSavesPerCapita,n)}/TICK</span>`:p.budgetPerCapita===0?C='<span class="tag tag--neutral">NO TICK COST</span>':C=`<span class="tag tag--budget">${xt(p.budgetPerCapita,n)}/TICK</span>`;let $="";p.id==="debtRestructuring"&&c&&!S&&($=At()),!$&&p.budgetPerCapita>0&&o<=0&&c&&!S&&($="No Discretionary Funds available.");const A=!!$,_=!c||a<h&&!S||A;let E="",P="";S?(E=" active",P=p.isResolution?'<div class="ministry-action__active-indicator">● NEGOTIATING</div>':'<div class="ministry-action__active-indicator">● ACTIVE</div>'):c?A?(E=" disabled",P=`<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="${g($)}">🔒</div>`):_?(E=" disabled",P=`<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="Need ${h} AP">▶ ${h} AP</div>`):P=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();ministryActionSelect('${k}')">▶ ${h} AP</div>`:(E=" disabled",P="");let L="";if(p.id==="debtRestructuring"&&!S&&!A){const I=Number(r?.credit??50);L=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-muted);margin-top:2px;">Success chance: ${Math.min(100,Math.max(0,Math.round(I)))}% (Credit: ${I})</div>`}A&&(L=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--red);margin-top:2px;">${g($)}</div>`),f+=`<div class="ministry-action${E}" id="${k}" ${c&&!S&&!_?`onclick="ministryActionSelect('${k}')"`:""}>
            <div class="ministry-action__top">
                <span class="ministry-action__name">${g(p.name)}</span>
                <span class="ministry-action__ap-cost">${h} AP${v>0?" (use "+(v+1)+")":""}</span>
            </div>
            <div class="ministry-action__desc">${g(p.desc)}${L}</div>
            <div class="ministry-action__bottom">
                <div class="ministry-action__tags">${w}${C}</div>
                <div id="${k}-btns">${P}</div>
            </div>
        </div>`}),f}function on(e){const t='<div style="font-family:var(--font-mono);font-size:7.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;background:#1e1e1a;border:1px solid rgba(255,255,255,0.07);color:#3a3a2e;padding:4px 9px;cursor:not-allowed;white-space:nowrap;">COMING SOON</div>';let i='<div class="ministry-card__actions-label">Ministry Actions</div>';return i+=`<div class="ministry-action disabled" style="opacity:0.6;cursor:not-allowed;">
        <div class="ministry-action__top">
            <span class="ministry-action__name">Expand Military Infrastructure</span>
            <span class="ministry-action__ap-cost" style="color:#3a3a2e;">COMING SOON</span>
        </div>
        <div class="ministry-action__desc">Issue an RFP for construction of a new Army, Naval, or Air Force base.</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags"></div>
            <div>${t}</div>
        </div>
    </div>`,i+=`<div class="ministry-action" onclick="openDoctrinePanel()" style="cursor:pointer;">
        <div class="ministry-action__top">
            <span class="ministry-action__name">Declare Doctrine</span>
            <span class="ministry-action__ap-cost">3–8 AP</span>
        </div>
        <div class="ministry-action__desc">Announce or renounce military doctrine across five sectors.</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags"></div>
            <div>${e?'<div class="ministry-action__btn-execute" onclick="event.stopPropagation();openDoctrinePanel()" style="background:#5aafa5;border-color:#5aafa5;color:#0f0f0d;">VIEW DOCTRINES</div>':'<div class="ministry-action__btn-execute" onclick="event.stopPropagation();openDoctrinePanel()" style="background:#5aafa5;border-color:#5aafa5;color:#0f0f0d;opacity:0.7;">VIEW DOCTRINES</div>'}</div>
        </div>
    </div>`,i+=`<div class="ministry-action disabled" style="opacity:0.6;cursor:not-allowed;">
        <div class="ministry-action__top">
            <span class="ministry-action__name">Military Exercises</span>
            <span class="ministry-action__ap-cost" style="color:#3a3a2e;">COMING SOON</span>
        </div>
        <div class="ministry-action__desc">Conduct large-scale training operations across active branches.</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags"></div>
            <div>${t}</div>
        </div>
    </div>`,i}const rn=[{id:"individualism_collectivism",left:"Individualism",right:"Collectivism",tip:"The degree to which citizens believe in personal agency and private responsibility versus shared social obligation and collective action."},{id:"tradition_progress",left:"Tradition",right:"Progress",tip:"The degree to which citizens value established cultural norms, institutions, and ways of life versus openness to social change and reform."},{id:"liberty_equality",left:"Liberty",right:"Equality",tip:"The degree to which citizens prioritise individual freedoms and rights versus equality of outcome and redistribution of opportunity."},{id:"freedom_security",left:"Freedom",right:"Security",tip:"The degree to which citizens accept restrictions on civil liberties and personal autonomy in exchange for safety, order, and stability."},{id:"globalism_nationalism",left:"Globalism",right:"Nationalism",tip:"The degree to which citizens identify with and support international engagement versus national sovereignty and domestic priority."}];let qt=0,Ze=null;function cn(e){const t=ue.education;if(!t?.actions)return"";const i=r?.population||2e7,n=d?.action_points||0,a=e===!0,c='<div style="font-family:var(--font-mono);font-size:7.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;background:#1e1e1a;border:1px solid rgba(255,255,255,0.07);color:#3a3a2e;padding:4px 9px;cursor:not-allowed;white-space:nowrap;">COMING SOON</div>',s=ae.find(D=>D.ministry_key==="education"),o=Number(s?.discretionary_balance||0),m=o>=1e9?"$"+(o/1e9).toFixed(1)+"B":o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>0?"$"+Math.round(o).toLocaleString():"$0";let f=`<div class="ministry-card__actions-label" style="display:flex;justify-content:space-between;align-items:center;">
        <span>ACTIONS</span>
        <span style="font-size:8px;font-weight:600;${o>0?"color:var(--green)":"color:var(--red)"};letter-spacing:0.03em;">Discretionary Funds: ${m}</span>
    </div>`;f+=`<div class="ministry-action disabled" style="opacity:0.6;cursor:not-allowed;">
        <div class="ministry-action__top">
            <span class="ministry-action__name">Expand Infrastructure</span>
            <span class="ministry-action__ap-cost" style="color:#3a3a2e;">COMING SOON</span>
        </div>
        <div class="ministry-action__desc">Fund construction and expansion of schools and educational facilities nationally.</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags"></div>
            <div>${c}</div>
        </div>
    </div>`;const p=t.actions.find(D=>D.id==="standardisedCurriculum"),y="education-standardisedCurriculum",v=se[y]||!1;Q["education:standardisedCurriculum"];const w=6,k=p.tags.map(D=>`<span class="tag tag--${D.cls}">${D.label}</span>`).join(""),S=q<qt,C=S?qt-q:0;let $="",A="";if(v||Ze){const D=Ze;D&&(q<D.activates_at_tick?A=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--amber);margin-top:3px;">Drift toward ${g(D.direction_label)} on ${g(si(D.axis))}. Activates Tick ${D.activates_at_tick}.</div>`:D.drift_ticks_remaining>0&&(A=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--amber);margin-top:3px;">Drifting ${g(D.direction_label)} on ${g(si(D.axis))}. ${D.drift_ticks_remaining} ticks remaining.</div>`)),$='<div class="ministry-action__active-indicator">● ACTIVE</div>'}else S?$=`<div style="font-family:var(--font-mono);font-size:8px;color:#4a4840;">COOLDOWN ${C}</div>`:a?n<w?$=`<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="Need ${w} AP">▶ ${w} AP</div>`:$=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();openCurriculumModal()">▶ ${w} AP</div>`:$="";const _=v||Ze?" active":S||!a||n<w?" disabled":"";f+=`<div class="ministry-action${_}" id="${y}">
        <div class="ministry-action__top">
            <span class="ministry-action__name">Standardised Curriculum</span>
            <span class="ministry-action__ap-cost">${w} AP</span>
        </div>
        <div class="ministry-action__desc">${g(p.desc)}${A}</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags">${k}${Ze?`<span class="tag tag--neutral">ACTIVATES TICK ${Ze.activates_at_tick}</span>`:""}</div>
            <div id="${y}-btns">${$}</div>
        </div>
    </div>`;const E=t.actions.find(D=>D.id==="privateEducationIncentives"),P="education-privateEducationIncentives",L=se[P]||!1,x=Q["education:privateEducationIncentives"]||0,O=E.apCosts[Math.min(x,3)],F=E.tags.map(D=>`<span class="tag tag--${D.cls}">${D.label}</span>`).join(""),N=`<span class="tag tag--positive">SAVES ${xt(E.budgetSavesPerCapita,i)}/TICK</span>`;let H="",U="";return L?(U=" active",H='<div class="ministry-action__active-indicator">● ACTIVE</div>'):a?n<O?(U=" disabled",H=`<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="Need ${O} AP">▶ ${O} AP</div>`):H=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();ministryActionSelect('${P}')">▶ ${O} AP</div>`:U=" disabled",f+=`<div class="ministry-action${U}" id="${P}" ${!L&&a&&n>=O?`onclick="ministryActionSelect('${P}')"`:""}>
        <div class="ministry-action__top">
            <span class="ministry-action__name">Private Education Incentives</span>
            <span class="ministry-action__ap-cost">${O} AP${x>0?" (use "+(x+1)+")":""}</span>
        </div>
        <div class="ministry-action__desc">${g(E.desc)}</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags">${F}${N}</div>
            <div id="${P}-btns">${H}</div>
        </div>
    </div>`,f}function ln(e){const t=ue.healthcare;if(!t?.actions)return"";const i=r?.population||2e7,n=d?.action_points||0,a=e===!0,c='<div style="font-family:var(--font-mono);font-size:7.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;background:#1e1e1a;border:1px solid rgba(255,255,255,0.07);color:#3a3a2e;padding:4px 9px;cursor:not-allowed;white-space:nowrap;">COMING SOON</div>',s=ae.find(b=>b.ministry_key==="healthcare"),{balance:o,fmt:m,cls:u}=ki(s?.discretionary_balance);let f=`<div class="ministry-card__actions-label" style="display:flex;justify-content:space-between;align-items:center;">
        <span>Ministry Actions</span>
        <span style="font-size:8px;font-weight:600;${u};letter-spacing:0.03em;">Discretionary Funds: ${m}</span>
    </div>`;f+=`<div class="ministry-action disabled" style="opacity:0.6;cursor:not-allowed;">
        <div class="ministry-action__top">
            <span class="ministry-action__name">Expand Infrastructure</span>
            <span class="ministry-action__ap-cost" style="color:#3a3a2e;">COMING SOON</span>
        </div>
        <div class="ministry-action__desc">Fund construction and modernisation of hospitals, clinics, and medical facilities nationally.</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags"></div>
            <div>${c}</div>
        </div>
    </div>`;const p=t.actions.find(b=>b.id==="preventativeCare"),y="healthcare-preventativeCare",v=se[y]||!1,w=Q["healthcare:preventativeCare"]||0,k=p.apCosts[Math.min(w,3)],S=Le(p,i),C=Oe(S),$=p.tags.map(b=>`<span class="tag tag--${b.cls}">${b.label}</span>`).join(""),A=`<span class="tag tag--budget">${C} UPFRONT</span>`,_=o>=S;let E="",P="",L="";v?(P=" active",E='<div class="ministry-action__active-indicator">● ACTIVE</div>'):a?_?n<k?(P=" disabled",E=`<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="Need ${k} AP">▶ ${k} AP</div>`):E=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();healthcareActionSelect('${y}')">▶ ${k} AP</div>`:(P=" disabled",E='<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="Insufficient discretionary funds">🔒</div>',L='<div style="font-family:var(--font-mono);font-size:7px;color:var(--red);margin-top:2px;">Insufficient discretionary funds.</div>'):P=" disabled",f+=`<div class="ministry-action${P}" id="${y}" ${!v&&a&&_&&n>=k?`onclick="healthcareActionSelect('${y}')"`:""}>
        <div class="ministry-action__top">
            <span class="ministry-action__name">Preventative Care Programme</span>
            <span class="ministry-action__ap-cost">${k} AP${w>0?" (use "+(w+1)+")":""}</span>
        </div>
        <div class="ministry-action__desc">${g(p.desc)}${L}</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags">${$}${A}</div>
            <div id="${y}-btns">${E}</div>
        </div>
    </div>`;const I=t.actions.find(b=>b.id==="pharmaceuticalRegulation"),x="healthcare-pharmaceuticalRegulation",O=se[x],F=!!O,T=typeof O=="string"?O:null,H=Q["healthcare:pharmaceuticalRegulation"]||0,U=I.apCosts[Math.min(H,3)],D=T||je,G=D?I.directions[D]:null,ve=(G?G.tags:[{label:"SELECT DIRECTION",cls:"neutral"}]).map(b=>`<span class="tag tag--${b.cls}">${b.label}</span>`).join("");let re="";if(G){const b=Le(G,i);re=b>0?`<span class="tag tag--budget">${Oe(b)} UPFRONT</span>`:'<span class="tag tag--neutral">NO FUND DRAW</span>'}let ut="",Ie="";return F?(Ie=" active",ut=`<div class="ministry-action__active-indicator" style="color:#5cb85c;">● ACTIVE — ${T==="increase"?"INCREASE":T==="decrease"?"DECREASE":"ACTIVE"}</div>`):a?n<U?(Ie=" disabled",ut=`<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="Need ${U} AP">▶ ${U} AP</div>`):ut=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();openPharmaceuticalSelector()">▶ ${U} AP</div>`:Ie=" disabled",f+=`<div class="ministry-action${Ie}" id="${x}">
        <div class="ministry-action__top">
            <span class="ministry-action__name">Pharmaceutical Regulation</span>
            <span class="ministry-action__ap-cost">${U} AP${H>0?" (use "+(H+1)+")":""}</span>
        </div>
        <div class="ministry-action__desc">${g(I.desc)}</div>
        <div class="ministry-action__bottom">
            <div class="ministry-action__tags">${ve}${re}</div>
            <div id="${x}-btns">${ut}</div>
        </div>
        <div id="pharma-direction-selector"></div>
    </div>`,f}function dn(){if(!Pe("healthcare"))return;je=null;const e=document.getElementById("pharma-direction-selector");e&&ai(e)}function ai(e){const t=ue.healthcare.actions.find(k=>k.id==="pharmaceuticalRegulation"),i=r?.population||2e7,a=Q["healthcare:pharmaceuticalRegulation"]||0,c=t.apCosts[Math.min(a,3)],s=ae.find(k=>k.ministry_key==="healthcare"),o=Number(s?.discretionary_balance||0),m=Le(t.directions.increase,i),u=Le(t.directions.decrease,i),f=je,p=f==="increase",y=f==="decrease",v=p?"background:rgba(91,155,213,0.12);border:1px solid rgba(91,155,213,0.3);color:#5b9bd5;":"background:transparent;border:1px solid rgba(255,255,255,0.07);color:#4a4840;",h=y?"background:rgba(91,155,213,0.12);border:1px solid rgba(91,155,213,0.3);color:#5b9bd5;":"background:transparent;border:1px solid rgba(255,255,255,0.07);color:#4a4840;";let w="";if(f){const k=f==="increase"?m:u,S=k<=0||o>=k,C=k>0?Oe(k):"No Fund Draw";S?w=`<div class="ministry-action__btn-confirm" onclick="event.stopPropagation();confirmPharmaceuticalAction('${f}')" style="margin-top:6px;">Confirm — ${c} AP · ${C}</div>`:w=`<div class="ministry-action__btn-confirm" style="opacity:0.4;cursor:not-allowed;margin-top:6px;">Confirm — ${c} AP · Insufficient funds</div>`}if(e.innerHTML=`<div style="background:#1e1e1a;border:1px solid rgba(255,255,255,0.07);padding:8px 12px;margin-top:6px;">
        <div style="font-family:var(--font-mono);font-size:8px;text-transform:uppercase;color:#6b6a5e;margin-bottom:6px;">Select direction:</div>
        <div style="display:flex;flex-direction:column;gap:4px;">
            <div style="${v}padding:6px 10px;cursor:pointer;font-family:var(--font-mono);font-size:8px;text-transform:uppercase;font-weight:700;letter-spacing:0.04em;" onclick="event.stopPropagation();selectPharmaDirection('increase')">INCREASE REGULATIONS</div>
            <div style="${h}padding:6px 10px;cursor:pointer;font-family:var(--font-mono);font-size:8px;text-transform:uppercase;font-weight:700;letter-spacing:0.04em;" onclick="event.stopPropagation();selectPharmaDirection('decrease')">DECREASE REGULATIONS</div>
        </div>
        <div style="display:flex;gap:4px;margin-top:6px;align-items:center;">
            ${w}
            <div class="ministry-action__btn-cancel" onclick="event.stopPropagation();closePharmaceuticalSelector()" style="margin-top:${f?"6px":"0"};">✕</div>
        </div>
    </div>`,f){const k=t.directions[f],S=document.querySelector("#healthcare-pharmaceuticalRegulation .ministry-action__tags");if(S&&k){const C=f==="increase"?m:u,$=C>0?`<span class="tag tag--budget">${Oe(C)} UPFRONT</span>`:'<span class="tag tag--neutral">NO FUND DRAW</span>';S.innerHTML=k.tags.map(A=>`<span class="tag tag--${A.cls}">${A.label}</span>`).join("")+$}}}function mn(e){je=e;const t=document.getElementById("pharma-direction-selector");t&&ai(t)}function pn(){je=null;const e=document.getElementById("pharma-direction-selector");e&&(e.innerHTML="");const t=document.querySelector("#healthcare-pharmaceuticalRegulation .ministry-action__tags");t&&(t.innerHTML='<span class="tag tag--neutral">SELECT DIRECTION</span>')}async function un(e){if(V)return;V=!0;const t="healthcare-pharmaceuticalRegulation",i=document.getElementById(t);if(!i||!d||!r){V=!1;return}if(!Pe("healthcare")){V=!1;return}const n=ue.healthcare.actions.find($=>$.id==="pharmaceuticalRegulation"),a=n.directions[e];if(!a){V=!1;return}const c="healthcare:pharmaceuticalRegulation",s=Q[c]||0,o=n.apCosts[Math.min(s,3)],m=r.population||2e7,u=Le(a,m),f=ae.find($=>$.ministry_key==="healthcare"),p=Number(f?.discretionary_balance||0);if(u>0&&p<u){V=!1,alert("Insufficient discretionary funds.");return}const y=se[t];if(y){const $=typeof y=="string"?y:null;if($===e){V=!1,alert("This direction is already active.");return}if(!confirm(`This will immediately cancel your active ${$==="increase"?"Increase Regulations":$==="decrease"?"Decrease Regulations":"current pharmaceutical policy"} with no fund refund. Continue?`)){V=!1;return}await Si(e)}const v=vt(s),h=a.baseEffects.map($=>({stat_key:$.stat_key,direction:$.direction,rate:Math.round(($.scalable?$.rate*v:$.rate)*100)/100,delay_ticks:n.delay,duration_ticks:n.duration,target:$.target||"nation"}));i.classList.remove("selected"),i.classList.add("active");const w=document.getElementById(t+"-btns"),k=e==="increase"?"INCREASE":"DECREASE";w&&(w.innerHTML=`<div class="ministry-action__active-indicator" style="color:#5cb85c;">● ACTIVE — ${k}</div>`);const S=document.getElementById("pharma-direction-selector");S&&(S.innerHTML="");const C={use_count:s,scale:v,direction:e,one_time_cost:u,budget_per_tick:0};try{const{data:$,error:A}=await l.rpc("execute_ministry_action",{p_nation_id:r.id,p_faction_id:d.id,p_ministry_key:"healthcare",p_action_key:"pharmaceuticalRegulation",p_ap_cost:o,p_applied_at_tick:q,p_stat_effects:h,p_action_data:C});if(A)throw A;try{await Kt("healthcare",f,p,u)}catch{}const _=d.action_points||0;d.action_points=Math.max(0,_-o),Q[c]=s+1,se[t]=e,je=null,sessionStorage.removeItem("nationhood_state");try{const{ministerName:E,partyName:P}=await Ct("healthcare");await l.rpc("fire_system_event",{p_trigger_key:a.triggerKey,p_nation_id:r.id,p_tick:q,p_placeholders:{minister_name:E,party:P,nation:r.name||"Unknown",direction:e,cost:Oe(u)}})}catch{}}catch($){i.classList.remove("active"),w&&(w.innerHTML=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();openPharmaceuticalSelector()">▶ ${o} AP</div>`),alert("Action failed: "+($.message||"Unknown error"))}finally{V=!1}}function fn(e){const t=document.getElementById(e);if(!t||t.classList.contains("active")||t.classList.contains("disabled")||!Pe("healthcare")||(le&&le!==e&&tt(le),t.classList.contains("selected")))return;t.classList.add("selected"),le=e;const i=ue.healthcare.actions.find(f=>f.id==="preventativeCare"),a=Q["healthcare:preventativeCare"]||0,c=i.apCosts[Math.min(a,3)],s=r?.population||2e7,o=Le(i,s),m=Oe(o),u=document.getElementById(e+"-btns");u&&(u.innerHTML=`<div style="display:flex;gap:4px;">
            <div class="ministry-action__btn-confirm" onclick="event.stopPropagation();confirmHealthcareAction('${e}')">Confirm — ${c} AP · ${m}</div>
            <div class="ministry-action__btn-cancel" onclick="event.stopPropagation();healthcareActionDeselect('${e}')">✕</div>
        </div>`)}function _n(e){const t=document.getElementById(e);if(!t)return;t.classList.remove("selected"),le===e&&(le=null);const i=ue.healthcare.actions.find(o=>o.id==="preventativeCare"),a=Q["healthcare:preventativeCare"]||0,c=i.apCosts[Math.min(a,3)],s=document.getElementById(e+"-btns");s&&(s.innerHTML=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();healthcareActionSelect('${e}')">▶ ${c} AP</div>`)}async function vn(e){if(V)return;V=!0;const t=document.getElementById(e);if(!t||!d||!r){V=!1;return}if(!Pe("healthcare")){V=!1;return}const i=ue.healthcare.actions.find(v=>v.id==="preventativeCare"),n="healthcare:preventativeCare",a=Q[n]||0,c=i.apCosts[Math.min(a,3)],s=r.population||2e7,o=Le(i,s),m=Vt(i,a),u=ae.find(v=>v.ministry_key==="healthcare"),f=Number(u?.discretionary_balance||0);if(o>0&&f<o){V=!1,alert("Insufficient discretionary funds."),_n(e);return}t.classList.remove("selected"),t.classList.add("active"),le=null;const p=document.getElementById(e+"-btns");p&&(p.innerHTML='<div class="ministry-action__active-indicator">● ACTIVE</div>');const y={use_count:a,scale:vt(a),one_time_cost:o,budget_per_tick:0};try{const{data:v,error:h}=await l.rpc("execute_ministry_action",{p_nation_id:r.id,p_faction_id:d.id,p_ministry_key:"healthcare",p_action_key:"preventativeCare",p_ap_cost:c,p_applied_at_tick:q,p_stat_effects:m,p_action_data:y});if(h)throw h;try{await Kt("healthcare",u,f,o)}catch{}const w=d.action_points||0;d.action_points=Math.max(0,w-c),Q[n]=a+1,se[e]=!0,sessionStorage.removeItem("nationhood_state");try{const{ministerName:k,partyName:S}=await Ct("healthcare");await l.rpc("fire_system_event",{p_trigger_key:i.triggerKey,p_nation_id:r.id,p_tick:q,p_placeholders:{minister_name:k,party:S,nation:r.name||"Unknown",cost:Oe(o)}})}catch{}}catch(v){t.classList.remove("active"),p&&(p.innerHTML=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();healthcareActionSelect('${e}')">▶ ${c} AP</div>`),alert("Action failed: "+(v.message||"Unknown error"))}finally{V=!1}}function si(e){const t=rn.find(i=>i.id===e);return t?`${t.left} / ${t.right}`:e}async function gn(){if(r)try{const{data:e}=await l.from("curriculum_drift").select("*").eq("nation_id",r.id).eq("completed",!1).order("set_at_tick",{ascending:!1}).limit(1).maybeSingle();Ze=e||null;const{data:t}=await l.from("ministry_action_log").select("applied_at_tick").eq("nation_id",r.id).eq("ministry_key","education").eq("action_key","standardisedCurriculum").order("applied_at_tick",{ascending:!1}).limit(1).maybeSingle();t&&(qt=t.applied_at_tick+12)}catch(e){console.warn("[Education] Failed to load curriculum drift:",e)}}let et="army",Me=[],be=null;function yn(){return Pe("defense")}let Bt=!1;async function hn(){if(!Bt){Bt=!0,et="army",be=null;try{await Ft()}finally{Bt=!1}dt()}}function oi(){const e=document.getElementById("doctrine-panel-overlay");e&&e.remove()}async function Ft(){if(!r){Me=[];return}const{data:e,error:t}=await l.from("military_doctrines").select("*").eq("nation_id",r.id);if(t){console.error("[loadNationDoctrines]",t.message),Me=[];return}Me=e||[]}function ri(e){return Me.find(t=>t.doctrine_id===e)}function dt(){let e=document.getElementById("doctrine-panel-overlay");e&&e.remove(),e=document.createElement("div"),e.id="doctrine-panel-overlay",e.className="doctrine-overlay";const t=yn(),i=r?.is_landlocked===!0,n=i?Ai.filter(o=>o!=="navy"):Ai;i&&et==="navy"&&(et="army");let a="";n.forEach(o=>{const m=Et[o],u=o===et,f=Me.filter(v=>v.sector===o&&v.active&&!Re[v.doctrine_id]?.hidden).length,p=o===Ne&&Me.some(v=>v.sector===Ne&&v.pending_doctrine_id);let y="";if(o===Ne&&f>0){const v=Me.find(h=>h.sector===Ne&&h.active&&!h.renouncing);if(v){const h=Re[v.doctrine_id];y=`<span class="doctrine-tab__badge">${h?h.name.substring(0,3).toUpperCase():""}</span>`}p&&(y+='<span class="doctrine-tab__badge doctrine-tab__badge--pending">PENDING</span>')}else f>0&&(y=`<span class="doctrine-tab__badge">${f}</span>`);a+=`<div class="doctrine-tab${u?" active":""}" onclick="switchDoctrineTab('${o}')">
            <span class="doctrine-tab__label${f>0?" doctrine-tab__label--active":""}">${m}</span>
            ${y}
        </div>`});const c=ss(et);let s="";c.forEach(o=>{o.autocracyOnly&&!X||(s+=bn(o,ri(o.id),t))}),s||(s='<div style="padding:20px;color:#4a4840;font-family:var(--font-mono);font-size:9px;">No doctrines available for this sector.</div>'),e.innerHTML=`
        <div class="doctrine-panel">
            <div class="doctrine-panel__header">
                <div class="doctrine-panel__title">MINISTRY OF DEFENSE — MILITARY DOCTRINE</div>
                <div class="doctrine-panel__close" onclick="closeDoctrinePanel()">✕</div>
            </div>
            <div class="doctrine-panel__tabs">${a}</div>
            <div class="doctrine-panel__cards" id="doctrine-cards-container">${s}</div>
        </div>
    `,e.addEventListener("click",o=>{o.target===e&&oi()}),document.body.appendChild(e)}function bn(e,t,i){const n=t&&t.active&&!t.renouncing,a=t&&t.renouncing,c=e.permanent,s=e.id==="non_nuclear_power"&&t&&t.active&&!r?.hasNuclearCapability;let o="doctrine-card",m="",u="",f="";c&&n?(o+=" doctrine-card--praetorian",m='<span class="doctrine-card__tag doctrine-card__tag--permanent">PERMANENT</span>',u=ci(t),f='<div class="doctrine-card__btn doctrine-card__btn--disabled">AUTOCRACY — CANNOT BE RENOUNCED</div>'):a?(o+=" doctrine-card--renouncing",m='<span class="doctrine-card__tag doctrine-card__tag--renouncing">RENOUNCING</span>',u=wn(t),f='<div style="font-family:var(--font-mono);font-size:7px;color:#4a4840;margin-top:4px;">Cannot announce while cooldown is active.</div>'):n?(o+=" doctrine-card--active",m='<span class="doctrine-card__tag doctrine-card__tag--active">ACTIVE</span>',u=ci(t),s?f='<div class="doctrine-card__btn doctrine-card__btn--disabled">REQUIRES NUCLEAR CAPABILITY TO CHANGE</div>':i&&!c&&(f=`<div class="doctrine-card__btn doctrine-card__btn--renounce" onclick="event.stopPropagation();beginDoctrineRenounce('${e.id}')">RENOUNCE — ${Ue} TICK COOLDOWN</div>`)):(o+=" doctrine-card--inactive",i&&(f=`<div class="doctrine-card__btn doctrine-card__btn--announce" onclick="event.stopPropagation();beginDoctrineAnnounce('${e.id}')">ANNOUNCE</div>`)),t&&t.pending_doctrine_id===e.id&&!n&&(o="doctrine-card doctrine-card--pending",m=`<span class="doctrine-card__tag doctrine-card__tag--pending">PENDING — ACTIVATES TICK ${t.pending_activates_tick||"?"}</span>`,u="",f="");const p=e.apCost>0?`${e.apCost} AP`:e.startingDoctrine?"DEFAULT":"NO COST";return`<div class="${o}" id="doctrine-card-${e.id}">
        <div class="doctrine-card__top">
            <span class="doctrine-card__name">${g(e.name)}</span>
            ${m}
        </div>
        <div class="doctrine-card__ap">${p}</div>
        <div class="doctrine-card__desc">${g(e.desc)}</div>
        ${u}
        <div class="doctrine-card__actions" id="doctrine-actions-${e.id}">
            ${f}
        </div>
    </div>`}function ci(e){if(!e)return"";const t=e.cohesion||0,i=as;return`<div class="doctrine-bar">
        <span class="doctrine-bar__label">COHESION</span>
        <div class="doctrine-bar__track"><div class="doctrine-bar__fill doctrine-bar__fill--cohesion" style="width:${Math.min(100,t/i*100)}%"></div></div>
        <span class="doctrine-bar__value doctrine-bar__value--cohesion">${t} / ${i}</span>
    </div>`}function wn(e){if(!e)return"";const t=e.renounce_cooldown_remaining||0,i=Ue;return`<div class="doctrine-bar">
        <span class="doctrine-bar__label">COOLDOWN</span>
        <div class="doctrine-bar__track"><div class="doctrine-bar__fill doctrine-bar__fill--cooldown" style="width:${Math.min(100,t/i*100)}%"></div></div>
        <span class="doctrine-bar__value doctrine-bar__value--cooldown">${t} / ${i}</span>
    </div>`}function Ht(e,t={}){return{nation_name:r?.name||"Unknown",doctrine_name:e.name,sector:Et[e.sector],...t}}function $n(e){const t=Re[e];if(!t)return;if(t.sector==="navy"&&r?.is_landlocked){He(e,"Landlocked nations cannot adopt naval doctrines.");return}if(t.sector===Ne){const a=os(t,{nation:r||{}});if(!a.allowed){He(e,a.message);return}}const i=d?.action_points||0;if(t.apCost>0&&i<t.apCost){He(e,`Insufficient AP. Need ${t.apCost}, have ${i}.`);return}const n=document.getElementById("doctrine-actions-"+e);n&&(n.innerHTML=`
        <div class="doctrine-confirm doctrine-confirm--announce">
            <div class="doctrine-confirm__text">Announce ${g(t.name)}? This declaration is public.</div>
            <div class="doctrine-confirm__btns">
                <div class="doctrine-card__btn doctrine-card__btn--announce" onclick="event.stopPropagation();confirmDoctrineAnnounce('${e}')">Confirm — ${t.apCost} AP</div>
                <div class="doctrine-card__btn doctrine-card__btn--cancel" onclick="event.stopPropagation();cancelDoctrineAction('${e}')">Cancel</div>
            </div>
        </div>`)}function He(e,t){const i=document.getElementById("doctrine-actions-"+e);if(!i)return;const n=i.querySelector(".doctrine-alert");n&&n.remove();const a=document.createElement("div");a.className="doctrine-alert",a.textContent=t,i.prepend(a),setTimeout(()=>{a.parentNode&&a.remove()},5e3)}async function En(e){if(be)return;be=e;const t=Re[e];if(!t){be=null;return}try{const i=ri(e);if(i&&i.active&&!i.renouncing){He(e,`${t.name} is already active.`),be=null;return}let n=null;if(t.sector===Ne){const a=Me.find(c=>c.sector===Ne&&c.active&&!c.renouncing);a&&a.doctrine_id!==e&&(n=a)}if(t.apCost>0){const a=await at(l,d.id,t.apCost);if(!a.success){He(e,a.error||"Failed to deduct AP."),be=null;return}d.action_points=Math.max(0,(d.action_points||0)-t.apCost),sessionStorage.removeItem("nationhood_state")}if(t.sector===Ne&&n){const{error:a}=await l.from("military_doctrines").update({renouncing:!0,renounce_cooldown_remaining:Ue,pending_doctrine_id:e,pending_activates_tick:(q||0)+Ue}).eq("nation_id",r.id).eq("doctrine_id",n.doctrine_id);if(a)throw a;const c=Re[n.doctrine_id];c&&t.id!=="non_nuclear_power"&&bt("nuclear_transition_world",Ht(t,{old_doctrine:c.name,new_doctrine:t.name}))}else{const{error:a}=await l.from("military_doctrines").insert({nation_id:r.id,doctrine_id:e,sector:t.sector,active:!0,cohesion:0,activated_on_tick:q||0,renouncing:!1,renounce_cooldown_remaining:null,permanent:t.permanent||!1,autocracy_only:t.autocracyOnly||!1,hidden:t.hidden||!1});if(a)throw a}if(!t.hidden){const a=Ht(t);bt("announced_nation",a),bt("announced_world",a)}await l.from("activity_log").insert({faction_id:d.id,nation_id:r.id,action_type:"declare_doctrine",action_label:"Declare Doctrine",description:`Announced ${t.name} (${Et[t.sector]}).`,outcome:"success",ap_spent:t.apCost,tick:q}),await Ft(),dt()}catch(i){console.error("[confirmDoctrineAnnounce]",i),He(e,"Failed: "+(i.message||"Unknown error"))}finally{be=null}}function An(e){const t=Re[e];if(!t)return;const i=document.getElementById("doctrine-actions-"+e);i&&(i.innerHTML=`
        <div class="doctrine-confirm doctrine-confirm--renounce">
            <div class="doctrine-confirm__text">Renounce ${g(t.name)}? ${Ue}-tick cooldown applies. Doctrine remains public until cooldown expires.</div>
            <div class="doctrine-confirm__btns">
                <div class="doctrine-card__btn doctrine-card__btn--renounce" onclick="event.stopPropagation();confirmDoctrineRenounce('${e}')">Confirm Renunciation</div>
                <div class="doctrine-card__btn doctrine-card__btn--cancel" onclick="event.stopPropagation();cancelDoctrineAction('${e}')">Cancel</div>
            </div>
        </div>`)}async function Cn(e){if(be)return;be=e;const t=Re[e];if(!t){be=null;return}try{const{error:i}=await l.from("military_doctrines").update({renouncing:!0,renounce_cooldown_remaining:Ue}).eq("nation_id",r.id).eq("doctrine_id",e);if(i)throw i;t.hidden||bt("renounced_nation_start",Ht(t)),await l.from("activity_log").insert({faction_id:d.id,nation_id:r.id,action_type:"renounce_doctrine",action_label:"Renounce Doctrine",description:`Initiated renunciation of ${t.name} (${Et[t.sector]}). Cooldown: ${Ue} ticks.`,outcome:"success",ap_spent:0,tick:q}),await Ft(),dt()}catch(i){console.error("[confirmDoctrineRenounce]",i),He(e,"Failed: "+(i.message||"Unknown error"))}finally{be=null}}function xn(e){dt()}function kn(e){et=e,dt()}async function bt(e,t){try{const i=rs[e];if(!i)return;const n=cs(i,t),{error:a}=await l.from("event_log").insert({nation_id:r.id,event_name:"Military Doctrine",trigger_key:"military_doctrine_"+e,description_chosen:n,category:"MILITARY",fired_at_tick:q});a&&console.error("[fireDoctrineEvent] insert failed:",a.message)}catch(i){console.error("[fireDoctrineEvent]",i)}}let le=null;function Sn(e){const t=document.getElementById(e);if(!t||t.classList.contains("active")||t.classList.contains("disabled"))return;const i=e.split("-")[0];if(!Pe(i)||(le&&le!==e&&tt(le),t.classList.contains("selected")))return;t.classList.add("selected"),le=e;const n=document.getElementById(e+"-btns");n&&(n.innerHTML=`<div style="display:flex;gap:4px;">
            <div class="ministry-action__btn-confirm" onclick="event.stopPropagation();ministryActionConfirm('${e}')">✓ CONFIRM</div>
            <div class="ministry-action__btn-cancel" onclick="event.stopPropagation();ministryActionDeselect('${e}')">✕</div>
        </div>`)}function tt(e){const t=document.getElementById(e);if(!t)return;t.classList.remove("selected"),le===e&&(le=null);const i=e.split("-"),n=i[0],a=i.slice(1).join(""),c=ue[n];let s=1;if(c){const m=c.actions.find(u=>u.id===a);if(m){const u=n+":"+a,f=Q[u]||0;s=m.apCosts[Math.min(f,3)]}}const o=document.getElementById(e+"-btns");o&&(o.innerHTML=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();ministryActionSelect('${e}')">▶ ${s} AP</div>`)}function Tn(e){if(e==="defense"||e==="healthcare")return;const t=ue[e];if(!t?.actions)return;const i=d?.action_points||0,n=Pe(e),a=ae.find(s=>s.ministry_key===e),c=Number(a?.discretionary_balance||0);t.actions.forEach(s=>{const o=e+":"+s.id,m=Q[o]||0,u=s.apCosts[Math.min(m,3)],f=e+"-"+s.id,p=document.getElementById(f);if(!p||p.classList.contains("active"))return;let y="";s.id==="debtRestructuring"&&n&&(y=At()),!y&&s.budgetPerCapita>0&&c<=0&&n&&(y="No Discretionary Funds available.");const v=!!y,h=!n||i<u||v,w=document.getElementById(f+"-btns"),k=p.querySelector(".ministry-action__ap-cost");k&&(k.textContent=u+" AP"+(m>0?" (use "+(m+1)+")":"")),n?v?(p.classList.add("disabled"),p.classList.remove("selected"),p.removeAttribute("onclick"),w&&(w.innerHTML=`<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="${g(y)}">🔒</div>`)):h?(p.classList.add("disabled"),p.classList.remove("selected"),p.removeAttribute("onclick"),w&&(w.innerHTML=`<div class="ministry-action__btn-execute" style="opacity:0.4;cursor:not-allowed;" title="Need ${u} AP">▶ ${u} AP</div>`)):(p.classList.remove("disabled"),p.setAttribute("onclick",`ministryActionSelect('${f}')`),w&&(w.innerHTML=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();ministryActionSelect('${f}')">▶ ${u} AP</div>`)):(p.classList.add("disabled"),p.classList.remove("selected"),p.removeAttribute("onclick"),w&&(w.innerHTML=""))})}let V=!1;async function Pn(e){if(V)return;V=!0;const t=document.getElementById(e);if(!t||!d||!r){V=!1;return}const i=e.split("-"),n=i[0];if(!Pe(n)){V=!1,alert("Your party does not control this ministry.");return}const a=i.slice(1).join(""),c=ue[n];if(!c){V=!1;return}const s=c.actions.find(h=>h.id===a);if(!s){V=!1;return}const o=n+":"+a,m=Q[o]||0,u=s.apCosts[Math.min(m,3)],f=Vt(s,m);if(s.budgetPerCapita>0){const h=ae.find(w=>w.ministry_key===n);if(Number(h?.discretionary_balance||0)<=0){V=!1,alert("No Discretionary Funds available. Parliament must allocate funds via a funding bill."),tt(e);return}}if(s.id==="debtRestructuring"){const h=At();if(h){V=!1,alert(h),tt(e);return}}if(s.conflictsWith&&se[n+"-"+s.conflictsWith]){const h=s.conflictsWith==="stimulusPackage"?"Stimulus Package":"Austerity Measures";if(!confirm(`This will immediately cancel your active ${h} with no AP refund. Continue?`)){V=!1,tt(e);return}await xi(s,n)}t.classList.remove("selected"),t.classList.add("active"),le=null;const p=document.getElementById(e+"-btns");p&&(p.innerHTML=s.isResolution?'<div class="ministry-action__active-indicator">● NEGOTIATING</div>':'<div class="ministry-action__active-indicator">● ACTIVE</div>');const y=r.population||2e7,v={use_count:m,scale:vt(m),budget_per_tick:Math.round((s.budgetPerCapita||0)*y)};s.budgetSavesPerCapita&&(v.budget_saves_per_tick=Math.round(s.budgetSavesPerCapita*y)),s.isResolution&&(v.is_resolution=!0,v.credit_at_action=Number(r?.credit??50));try{const{data:h,error:w}=await l.rpc("execute_ministry_action",{p_nation_id:r.id,p_faction_id:d.id,p_ministry_key:n,p_action_key:a,p_ap_cost:u,p_applied_at_tick:q,p_stat_effects:f,p_action_data:v});if(w)throw w;const k=d.action_points||0;d.action_points=Math.max(0,k-u),Q[o]=m+1,se[e]=!0,sessionStorage.removeItem("nationhood_state"),Tn(n);try{const S=s.triggerKey||"ministry_ability_used",{data:C}=await l.from("ministries").select("minister_first_name, minister_last_name, factions(faction_name)").eq("nation_id",r.id).eq("ministry_key",n).single(),$=C?(C.minister_first_name+" "+(C.minister_last_name||"")).trim():"Unknown",A=C?.factions?.faction_name||d?.faction_name||"Unknown",_={minister_name:$,party:A,ministry:ge[n]||n,nation:r.name||"Unknown"};s.isResolution&&(_.credit_chance=String(Math.min(100,Math.max(0,Math.round(Number(r?.credit??50)))))),await l.rpc("fire_system_event",{p_trigger_key:S,p_nation_id:r.id,p_tick:q,p_placeholders:_})}catch{}}catch(h){t.classList.remove("active"),p&&(p.innerHTML=`<div class="ministry-action__btn-execute" onclick="event.stopPropagation();ministryActionSelect('${e}')">▶ ${u} AP</div>`),alert("Action failed: "+(h.message||"Unknown error"))}finally{V=!1}}function Mn(){if(!st)return"";const e=st,t=e.tier===7,i=t?"NATIONWIDE PROTEST":"HISTORIC PROTEST",n=q-(e.crisis_started_tick||q),a=e.crisis_duration||(t?_t.TIER7_DURATION:_t.TIER6_DURATION),c=Math.max(0,a-n);let s="";t?s='<span style="color:#d9534f;">GOV −3</span><span style="color:#d9534f;">UNREST +3</span><span style="color:#d9534f;">GDP −0.2</span><span style="color:#d9534f;">INVEST −2</span><span style="color:#d9534f;">VIOLENCE +1</span>':(s='<span style="color:#d9534f;">GOV −2</span><span style="color:#d9534f;">UNREST +2</span><span style="color:#d9534f;">HAPPY −1</span>',n>3&&(s+='<span style="color:#d9534f;">VIOLENCE +1</span>'));let o="";t&&e.tier7_demand&&(o=`<div class="protest-crisis-card__demand" ${e.tier7_demand_met?'style="color:#5cb85c;text-decoration:line-through;"':""}>DEMAND: ${g(e.tier7_demand.label||"Unknown")}</div>`);const m=ne&&(ne.party_ids?.includes(d?.id)||r?.ruling_faction_id===d?.id),u=ne?.lead_party_id===d?.id||r?.ruling_faction_id===d?.id,f=ae.some(A=>A.ministry_key==="interior"&&A.party_id===d?.id),p=d?.action_points||0,y=e.public_address_last_tick!=null?Math.max(0,_t.PUBLIC_ADDRESS_COOLDOWN-(q-e.public_address_last_tick)):0,v=!m||p<_t.PUBLIC_ADDRESS_AP||y>0,h=y>0?`PUBLIC ADDRESS (${y} TICK CD)`:"PUBLIC ADDRESS",w=`${_t.PUBLIC_ADDRESS_AP} AP`,k=!f||p<2||t,S=t?"T6 only":"33% resolve / 66% escalate to T7",C=!u||p<5;let $='<div class="protest-crisis-card__actions">';return $+=`<div class="protest-crisis-btn${v?" disabled":""}" onclick="${v?"":"protestCrisisAction('public_address')"}">
        <span>${h}</span>
        <span>${w}</span>
    </div>`,$+=`<div class="protest-crisis-btn protest-crisis-btn--danger${k?" disabled":""}" onclick="${k?"":"protestCrisisAction('epo')"}">
        <span>ENFORCE PUBLIC ORDER</span>
        <span>2 AP <span class="protest-crisis-btn__note">${S}</span></span>
    </div>`,$+=`<div class="protest-crisis-btn protest-crisis-btn--danger${C?" disabled":""}" onclick="${C?"":"protestCrisisAction('national_emergency')"}">
        <span>NATIONAL EMERGENCY</span>
        <span>5 AP <span class="protest-crisis-btn__note">ends crisis — severe penalties</span></span>
    </div>`,$+="</div>",`<div class="protest-crisis-card">
        <div class="protest-crisis-card__header">
            <div class="protest-crisis-card__title">⚠ TIER ${e.tier} — ${i}</div>
            <div class="protest-crisis-card__tick">${c} tick${c!==1?"s":""} remaining</div>
        </div>
        ${o}
        <div class="protest-crisis-card__effects">PER TICK: ${s}</div>
        <hr class="protest-crisis-card__sep">
        ${$}
    </div>`}let mt=!1;async function In(e){if(mt||!st||!d||!r)return;mt=!0;const t=st.id;let i;try{if(e==="public_address")i=await ts(l,d.id,r.id,t,q);else if(e==="epo"){if(!confirm(`Enforce Public Order on the protest?

33% chance the crisis ends. 66% chance it escalates to The Big One (Tier 7).

Proceed?`)){mt=!1;return}i=await is(l,d.id,r.id,t,q)}else if(e==="national_emergency"){if(!confirm(`Declare a National Emergency to end the protest crisis?

This will cause:
• Civil Unrest +15
• Political Violence +10
• Happiness −10
• Government Approval −10

Are you sure?`)){mt=!1;return}i=await ns(l,d.id,r.id,t,q)}i&&i.success?(i.newAp!=null&&(d.action_points=i.newAp),sessionStorage.removeItem("nationhood_state"),e==="epo"&&i.outcome==="escalated"?alert("The crackdown backfired! The protest has escalated to The Big One (Tier 7)."):e==="epo"&&i.outcome==="resolved"?alert("The crackdown succeeded. The protest crisis has been resolved."):e==="national_emergency"&&alert("National Emergency declared. The crisis has ended, but at a severe cost to stability."),await ce()):i&&alert(i.error||"Action failed.")}catch(n){alert("Error: "+(n.message||"Unknown error"))}finally{mt=!1}}function Nn(e,t){const i={};e&&e.forEach(p=>{i[p.ministry_key]=p});const n=t&&t.status==="caretaker",a=e?.find(p=>p.ministry_key==="prime_minister"),c=a&&a.minister_first_name&&a.minister_last_name,s=d&&t&&d.id===t.lead_party_id,o=s&&c&&!n;let m="parliamentary";X?m="autocracy":Y&&(m="presidential");const u=X?ke:ke.filter(p=>p!=="prime_minister");return(!e||e.length===0)&&!X&&!Y?t&&t.ministry_allocations?`<div class="ministry-grid">${Object.entries(t.ministry_allocations).filter(([y])=>y!=="prime_minister").map(([y,v])=>{const h=gt.find(k=>k.party_id===v),w=ge[y]||y;return`<div class="ministry-card vacant">${lt(w,"",0)}
                        <div class="ministry-card__minister">
                            <div class="ministry-card__minister-name" style="color:#3a3a2e;">To be appointed</div>
                            <div class="ministry-card__minister-meta"><span class="party">${g(h?.party_name||"Unknown")}</span></div>
                        </div>
                    </div>`}).join("")}</div>`:'<div class="info-block" style="text-align:center;color:var(--text-secondary);padding:30px;">No cabinet has been formed yet.</div>':`<div class="ministry-grid">${u.map(p=>{const y=i[p],v=y?.ministry_name||ge[p]||p,h=y&&y.minister_first_name,w=X?yt.filter(I=>I.ministry_key===p):[],k=w.find(I=>I.faction_id===d?.id),S=h&&y&&d&&y.party_id===d.id,C={type:m,isRuling:kt,isMyMinistry:S,canAppoint:o,isPMParty:s,isPresidentParty:typeof Ge<"u"?Ge:!1,isCaretaker:n,myRequest:k};if(Y&&y&&y.confirmation_status==="pending"&&y.pending_minister){const I=y.pending_minister,x=R.find(O=>O.id===I.party_id);return`<div class="ministry-card">${lt(v,"",0)}
                <div class="ministry-card__minister">
                    <div class="ministry-card__minister-name" style="color:var(--amber);">${g(I.first_name)} ${g(I.last_name)}</div>
                    <div class="ministry-card__minister-meta">Age ${I.age||"?"} · <span class="party">${g(x?.faction_name||"Unknown")}</span></div>
                </div>
                <div class="ministry-card__pending">
                    <div class="ministry-card__pending-label">AWAITING SENATE CONFIRMATION</div>
                </div>
            </div>`}if(Y&&h&&y.confirmation_status==="acting"){const I=R.find(N=>N.id===y.party_id),x=lt(v,"",w.length),O=Ot(p,y,C),F=C.isRuling&&w.length>0?Dt(w):"",T=ni(p,y);return`<div class="ministry-card">${x}
                <div class="ministry-card__minister">
                    <div class="ministry-card__minister-name">${g(y.minister_first_name||"Unknown")} ${g(y.minister_last_name||"")}</div>
                    <div class="ministry-card__minister-meta">Age ${y.minister_age??"?"} · <span class="party">${g(I?.faction_name||"Unknown")}</span></div>
                </div>
                <div class="ministry-card__pending">
                    <div class="ministry-card__pending-label" style="color:var(--amber);">ACTING MINISTER</div>
                </div>
                ${O}${T}${F}
            </div>`}if(Y&&h&&y.confirmation_status!=="confirmed"||!h)return li(p,v,C,w);const $=lt(v,"",w.length),A=an(y),_=Ot(p,y,C),E=C.isRuling&&w.length>0?Dt(w):"",P=ni(p,y),L=sn(p,S);return`<div class="ministry-card">${$}${A}${_}${E}${P}${L}</div>`}).join("")}</div>`}function li(e,t,i,n){const a=lt(t,"",n.length),c=Ot(e,null,i),s=i.isRuling&&n.length>0?Dt(n):"";return`<div class="ministry-card vacant">${a}
        <div class="ministry-card__vacant-label">VACANT</div>
        ${c}${s}
    </div>`}function Rn(e){Z=e,B=null,document.getElementById("assign-confirm-btn").disabled=!0,document.getElementById("assign-confirm-btn").textContent="Nominate for Confirmation",document.getElementById("assign-modal-title").textContent="Nominate — "+(ge[e]||e),ot=R.map(t=>({partyId:t.id,partyName:t.faction_name,firstName:De[Math.floor(Math.random()*De.length)],lastName:qe[Math.floor(Math.random()*qe.length)],age:35+Math.floor(Math.random()*31)})),document.getElementById("assign-candidates").innerHTML=ot.map((t,i)=>{const n=t.partyId===de,a=We(t.partyId),c=Je(t.partyId),s=Xe(t.partyId),o=c||s?`<span style="display:inline-flex;vertical-align:middle;margin-right:4px;">${Ce({customLogoUrl:s,iconKey:c,size:14,color:a})}</span>`:"";return`<div class="candidate-card" id="cand-${i}" onclick="selectCandidate(${i})" style="border-left:3px solid ${a};"><div><div class="candidate-name">${g(t.firstName)} ${g(t.lastName)}</div><div class="candidate-details">Age ${t.age} • <span class="candidate-party-tag ${n?"ruling":"other"}">${o}${g(t.partyName)}</span></div></div>${n?'<span class="ruling-label">PRESIDENT</span>':""}</div>`}).join(""),document.getElementById("assign-modal").classList.add("active")}async function Ln(){if(!(!B||!Z))try{await Ha(l,r.id,d.id,Z,B),ze(),alert("Nomination submitted — parliament will vote on confirmation."),await ce()}catch(e){console.error("Nomination error:",e),alert("Error: "+e.message)}}function On(){Wt?Fn():Y?Ln():Bn()}function Dn(e){Z=e,B=null,document.getElementById("assign-confirm-btn").disabled=!0,document.getElementById("assign-confirm-btn").textContent="Appoint Minister",document.getElementById("assign-modal-title").textContent="Assign — "+(ge[e]||e),ot=(!X&&!Y&&ne?.party_ids?R.filter(i=>ne.party_ids.includes(i.id)):R).map(i=>({partyId:i.id,partyName:i.faction_name,firstName:De[Math.floor(Math.random()*De.length)],lastName:qe[Math.floor(Math.random()*qe.length)],age:35+Math.floor(Math.random()*31)})),document.getElementById("assign-candidates").innerHTML=ot.map((i,n)=>{const a=i.partyId===Ye,c=We(i.partyId),s=Je(i.partyId),o=Xe(i.partyId),m=s||o?`<span style="display:inline-flex;vertical-align:middle;margin-right:4px;">${Ce({customLogoUrl:o,iconKey:s,size:14,color:c})}</span>`:"";return`<div class="candidate-card" id="cand-${n}" onclick="selectCandidate(${n})" style="border-left:3px solid ${c};"><div><div class="candidate-name">${g(i.firstName)} ${g(i.lastName)}</div><div class="candidate-details">Age ${i.age} • <span class="candidate-party-tag ${a?"ruling":"other"}">${m}${g(i.partyName)}</span></div></div>${a?'<span class="ruling-label">RULING</span>':""}</div>`}).join(""),document.getElementById("assign-modal").classList.add("active")}function ze(){Wt=!1,document.getElementById("assign-modal").classList.remove("active")}function qn(e){B=ot[e],document.querySelectorAll(".candidate-card").forEach(t=>t.classList.remove("selected")),document.getElementById("cand-"+e).classList.add("selected"),document.getElementById("assign-confirm-btn").disabled=!1}async function Bn(){if(!(!B||!Z))try{const{data:e}=await l.from("ministries").select("minister_first_name").eq("nation_id",r.id).eq("ministry_key",Z).maybeSingle();if(e&&e.minister_first_name){alert("This ministry has already been filled."),ze(),await ce();return}const t=ae.find(n=>n.ministry_key===Z);if(t){const{error:n}=await l.from("ministries").update({party_id:B.partyId,minister_first_name:B.firstName,minister_last_name:B.lastName,minister_age:B.age,minister_approval:we,stat_baselines:$t(Z,r),is_active:!0}).eq("id",t.id);if(n)throw n}else{const{error:n}=await l.from("ministries").insert({nation_id:r.id,ministry_key:Z,ministry_name:ge[Z]||Z,party_id:B.partyId,minister_first_name:B.firstName,minister_last_name:B.lastName,minister_age:B.age,minister_approval:we,stat_baselines:$t(Z,r),is_active:!0});if(n)throw n}const i=R.find(n=>n.id===B.partyId);if(i){const n=Math.min(100,(i.approval_rating||40)+3);await l.from("factions").update({approval_rating:n}).eq("id",B.partyId)}if(await l.from("ministry_requests").delete().eq("nation_id",r.id).eq("ministry_key",Z),await l.from("campaign_actions").insert({party_id:d.id,nation_id:r.id,action_type:"assign_minister",tick_performed:q,result:{minister_name:`${B.firstName} ${B.lastName}`,ministry_key:Z,party_name:B.partyName}}),Z==="prime_minister"){await l.from("head_of_government").update({active:!1}).eq("nation_id",r.id).eq("active",!0);const n=R.find(s=>s.id===B.partyId);await l.from("head_of_government").upsert({nation_id:r.id,faction_id:B.partyId,first_name:B.firstName,last_name:B.lastName,age:B.age,ideology:n?.leader_ideology||null,active:!0},{onConflict:"nation_id"});try{const{data:s}=await l.from("government_formations").select("id, ministry_assignments").eq("nation_id",r.id).in("status",["formed","active","caretaker"]).order("formed_at",{ascending:!1}).limit(1).maybeSingle();if(s){const o={...s.ministry_assignments||{},prime_minister:B.partyId};await l.from("government_formations").update({ministry_assignments:o}).eq("id",s.id)}}catch(s){console.warn("Failed to update government_formations PM assignment:",s)}const{data:a}=await l.from("nations").select("*").eq("id",r.id).single(),c=await hi(l,r.id);if(a&&c)try{await gi(l,r.id,a,"pm_replaced",c,R,q,"",null)}catch(s){throw new Error(`Administration lifecycle failed on PM assign: ${s.message||s}`)}}ze(),alert("✦ "+B.firstName+" "+B.lastName+" appointed to "+(ge[Z]||Z)+"!"),await ce()}catch(e){console.error("Assign error:",e),alert("Error: "+e.message)}}async function Fn(){if(!(!B||!Z))try{const{data:e}=await l.from("ministries").select("id, minister_first_name").eq("nation_id",r.id).eq("ministry_key",Z).eq("is_active",!0).maybeSingle();if(!e){alert("Ministry slot not found."),ze();return}if(e.minister_first_name){alert("This ministry has already been filled."),ze(),await ce();return}const{error:t}=await l.from("ministries").update({party_id:B.partyId,minister_first_name:B.firstName,minister_last_name:B.lastName,minister_age:B.age,minister_approval:we,stat_baselines:$t("prime_minister",r)}).eq("id",e.id);if(t)throw t;await Fa(l,r.id,B.partyId,3,"government:pm_selected"),await l.from("campaign_actions").insert({party_id:d.id,nation_id:r.id,action_type:"assign_minister",tick_performed:q,result:{minister_name:`${B.firstName} ${B.lastName}`,ministry_key:Z,party_name:B.partyName}}),ze(),await ce()}catch(e){console.error("Appoint minister error:",e),alert("Error appointing minister: "+e.message)}}async function Hn(){if(!d||!r||!X)return;const{data:e}=await l.from("nations").select("ruling_faction_id").eq("id",r.id).single();if(e?.ruling_faction_id){alert("Another faction has already claimed power. Refreshing..."),await ce();return}if(!confirm(`SEIZE POWER?

As the first faction to act, you will claim uncontested control of the government.

You will become the Ruling Faction and receive:
- Control of the Head of State
- A Prime Minister from your faction
- All cabinet ministries staffed with your appointees
- Loyalty set to 80

Cost: 0 AP

Proceed?`))return;const t=document.getElementById("claim-power-btn");t&&(t.disabled=!0,t.textContent="SEIZING POWER...");try{const{data:i}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single(),n=i?.current_tick||0;await l.from("nations").update({ruling_faction_id:d.id}).eq("id",r.id),await l.from("factions").update({loyalty:80}).eq("id",d.id);const a=ke.map(o=>({nation_id:r.id,ministry_key:o,ministry_name:ge[o]||o,party_id:d.id,minister_first_name:De[Math.floor(Math.random()*De.length)],minister_last_name:qe[Math.floor(Math.random()*qe.length)],minister_age:35+Math.floor(Math.random()*31),is_active:!0})),{error:c}=await l.from("ministries").insert(a);if(c)throw c;const s=a.find(o=>o.ministry_key==="prime_minister");s&&(await l.from("head_of_government").update({active:!1}).eq("nation_id",r.id).eq("active",!0),await l.from("head_of_government").upsert({nation_id:r.id,faction_id:d.id,first_name:s.minister_first_name,last_name:s.minister_last_name,age:s.minister_age,ideology:d.leader_ideology||null,active:!0},{onConflict:"nation_id"})),await l.from("campaign_actions").insert({party_id:d.id,nation_id:r.id,action_type:"claim_power",tick_performed:n,result:{faction_name:d.faction_name,ministries_assigned:ke.length,pm_name:s?`${s.minister_first_name} ${s.minister_last_name}`:null}});try{const o=r.head_of_state_first_name&&r.head_of_state_last_name?`${r.head_of_state_first_name} ${r.head_of_state_last_name}`:null,m=s?`${s.minister_last_name} Administration`:`${r.head_of_state_last_name||d.faction_name} Administration`;await l.from("administrations").insert({nation_id:r.id,admin_name:m,head_of_state:o,prime_minister:s?`${s.minister_first_name} ${s.minister_last_name}`:null,pm_party_name:d.faction_name,pm_party_id:d.id,coalition_parties:[{party_id:d.id,party_name:d.faction_name,seats:d.seats||0}],total_seats:d.seats||0,government_type:Ga.AUTOCRACY,started_at_tick:n,started_at_date:ie(n),approval_at_start:50,head_of_state_title:r.head_of_state_title||null})}catch(o){console.warn("Administration record creation failed (non-blocking):",o)}d.loyalty=80,r.ruling_faction_id=d.id,Ye=d.id,kt=!0,sessionStorage.removeItem("nationhood_state"),wt("coalition_"),alert(`POWER SEIZED!

${d.faction_name} now controls the government.

Prime Minister: ${s?.minister_first_name} ${s?.minister_last_name}
All ${ke.length} cabinet positions filled.`),await ce()}catch(i){console.error("Claim power error:",i),alert("Error claiming power: "+i.message),t&&(t.disabled=!1,t.textContent="Seize Power")}}async function zn(e){if(oe)return;const t=ae.find(c=>c.ministry_key===e);if(!t)return;const i=t.factions?.faction_name||"Unknown",n=t.minister_first_name+" "+t.minister_last_name;if(!confirm("⛔ PURGE "+n+" from "+(ge[e]||e)+`?

Cost: 1 AP

Scapegoat Effects:
• `+i+` loses 2–4 Loyalty and 1–2 Approval
• Your faction gains +4–5 Approval (decays over time)
• Nation: +1 Corruption, Stability shifts ±1–2

Proceed?`))return;oe=!0;const a=await at(l,d.id,1);if(!a.success){a.currentAp!==void 0&&(d.action_points=a.currentAp),alert("Not enough AP (need 1). Current AP: "+(a.currentAp??"?"));return}d.action_points=a.newAp,sessionStorage.removeItem("nationhood_state");try{const{data:c}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single(),s=c?.current_tick||0,{data:o}=await l.from("campaign_actions").select("tick_performed").eq("party_id",d.id).eq("action_type","purge_minister").gte("tick_performed",s-5),m=(o||[]).length,u=2+Math.floor(Math.random()*3),f=1+Math.floor(Math.random()*2),p=1+Math.floor(Math.random()*2);let y=4+Math.floor(Math.random()*2),v=1;m===1?y=Math.floor(y/2):m>=2&&(y=0,v=2);const h=y>0?y+1:0,{error:w}=await l.from("ministries").update({minister_first_name:null,minister_last_name:null,minister_age:null,party_id:null,minister_approval:we,stat_baselines:null}).eq("id",t.id);if(w)throw w;if(e==="prime_minister"){await l.from("head_of_government").update({active:!1}).eq("nation_id",r.id).eq("active",!0);const{data:P}=await l.from("nations").select("*").eq("id",r.id).single();if(P)try{await Da(l,r.id,P,"pm_replaced",s,"",null)}catch(L){throw new Error(`Administration lifecycle failed on PM purge: ${L.message||L}`)}}const k=d.approval_rating??40,S=Math.min(100,k+y);if(await l.from("factions").update({approval_rating:S}).eq("id",d.id),d.approval_rating=S,t.party_id&&t.party_id!==Ye){const P=R.find(x=>x.id===t.party_id),L=P?.loyalty??50,I=P?.approval_rating??50;await l.from("factions").update({loyalty:Math.max(0,L-u),approval_rating:Math.max(0,I-f)}).eq("id",t.party_id)}const{data:C}=await l.from("nations").select("stability, corruption").eq("id",r.id).single(),$=C?.stability??50,A=C?.corruption??50;let _;m>=2||$>=50?_=-p:_=p,await l.from("nations").update({stability:Math.max(0,Math.min(100,$+_)),corruption:Math.min(100,A+v)}).eq("id",r.id),await l.from("campaign_actions").insert({party_id:d.id,nation_id:r.id,action_type:"purge_minister",tick_performed:s,result:{minister_name:n,ministry_key:e,target_party:i,target_party_id:t.party_id,loyalty_loss:u,approval_loss_target:f,approval_boost:y,decay_ticks_remaining:h,decay_rate:1,stability_change:_,corruption_gain:v,purge_number:m+1}});let E="⛔ "+n+` purged!

`;E+=i+": -"+u+" Loyalty, -"+f+` Approval
`,y>0?E+="Your Approval: +"+y+" (will decay over "+h+` ticks)
`:E+=`Your Approval: No boost (too many recent purges)
`,E+="Nation: "+(_>=0?"+":"")+_+" Stability, +"+v+" Corruption",m===1&&(E+=`

⚠️ Diminishing returns: 2nd purge in 6 ticks — boost halved.`),m>=2&&(E+=`

🚨 Regime fatigue: 3rd+ purge in 6 ticks — no boost, double corruption.`),alert(E),await ce()}catch(c){console.error("Purge error:",c),alert("Error: "+c.message)}finally{oe=!1}}async function Un(e){if(oe||!d)return;if(yt.filter(n=>n.faction_id===d.id).length>=2){alert("You can only have 2 active ministry requests.");return}oe=!0;const i=await at(l,d.id,1);if(!i.success){i.currentAp!==void 0&&(d.action_points=i.currentAp),alert("Not enough AP (need 1). Current AP: "+(i.currentAp??"?"));return}d.action_points=i.newAp,sessionStorage.removeItem("nationhood_state");try{const{error:n}=await l.from("ministry_requests").insert({nation_id:r.id,faction_id:d.id,ministry_key:e});if(n)throw n;await ce()}catch(n){console.error("Request error:",n),alert("Error: "+n.message)}finally{oe=!1}}async function jn(e){try{await l.from("ministry_requests").delete().eq("id",e),await ce()}catch(t){console.error(t),alert("Error: "+t.message)}}async function Gn(e){try{await l.from("ministry_requests").delete().eq("id",e),await ce()}catch(t){console.error(t),alert("Error: "+t.message)}}function Yn(e){return!d||X||Y||e.party_ids.includes(d.id)?"":(Se[d.id]||d.seats||0)<1?`
            <div id="no-confidence" style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-main);">
                <button class="ministry-btn purge" style="padding:10px 24px;font-size:0.8rem;" disabled>
                    ⚡ Vote of No Confidence
                </button>
                <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:6px;">Need at least 1 seat in the legislature.</div>
            </div>`:`
        <div id="no-confidence" style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-main);">
            <button class="ministry-btn purge" style="padding:10px 24px;font-size:0.8rem;" onclick="fileNoConfidence()" id="no-confidence-btn">
                ⚡ Vote of No Confidence <span class="ap-cost">${M.NO_CONFIDENCE_AP_COST} AP</span>
            </button>
            <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:6px;">Opposition only — topple the government</div>
        </div>`}async function Vn(){if(oe||!d||!r||!ne)return;if((Se[d.id]||d.seats||0)<1){alert("Need at least 1 seat in the legislature to file a vote of no confidence.");return}if(ne.status==="caretaker"){alert("Cannot file a vote of no confidence against a caretaker government. Elections are already scheduled.");return}if(ne.party_ids.includes(d.id)){alert("Only opposition parties can file a vote of no confidence.");return}const{data:t}=await l.from("bills").select("id").eq("nation_id",r.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1).maybeSingle();if(t){alert("A motion of no confidence is already pending.");return}const{data:i}=await l.from("campaign_actions").select("tick_performed").eq("nation_id",r.id).eq("party_id",d.id).eq("action_type","no_confidence_failed").order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(i){const s=q-i.tick_performed;if(s<M.NO_CONFIDENCE_COOLDOWN_TICKS){const o=M.NO_CONFIDENCE_COOLDOWN_TICKS-s;alert(`Cooldown: ${o} tick${o!==1?"s":""} remaining before another no-confidence vote can be filed.`);return}}const{data:n}=await l.from("head_of_government").select("last_name").eq("nation_id",r.id).eq("active",!0).maybeSingle(),a=n?.last_name||null,c=a?`Motion of No Confidence in the ${a} Government`:"Motion of No Confidence in the Government";if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${c}"

Cost: ${M.NO_CONFIDENCE_AP_COST} AP
Voting period: ${M.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Your party: +3 Approval
• Coalition parties: -5 Approval each

IF IT FAILS:
• Your party: -5 Approval
• PM's party: +3 Approval
• ${M.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown

Proceed?`)){oe=!0;try{const{data:s}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=s?.current_tick||0,{data:m,error:u}=await l.from("bills").insert({nation_id:r.id,proposed_by:d.id,proposed_tick:o,bill_name:c,bill_type:"no_confidence",status:"floor",floor_tick:o,voting_ends_tick:o+M.NO_CONFIDENCE_VOTING_TICKS,proposer_name:d.faction_name,proposer_color:d.party_color,preamble:`This motion, filed by the ${d.faction_name}, calls for a vote of no confidence in the current government. If passed by simple majority, the coalition will be immediately dissolved.`}).select().single();if(u)throw u;const{count:f}=await l.from("bills").select("id",{count:"exact",head:!0}).eq("nation_id",r.id).eq("bill_type","no_confidence").in("status",["committee","floor"]);if(f>1){await l.from("bills").delete().eq("id",m.id),alert("Another motion of no confidence was just filed. Please refresh.");return}const p=await at(l,d.id,M.NO_CONFIDENCE_AP_COST);if(!p.success){p.currentAp!==void 0&&(d.action_points=p.currentAp),alert("Not enough AP. Need "+M.NO_CONFIDENCE_AP_COST+" AP, have "+(p.currentAp??"?")+".");return}d.action_points=p.newAp;const v=(await jt(l,r.id,!1,R,d.id)).allPartySeats[d.id]||0;await l.from("bill_support").upsert({bill_id:m.id,faction_id:d.id,stance:"yes",seat_count:v},{onConflict:"bill_id,faction_id"}),alert(`⚡ "${c}" has been filed!

Voting is now open for ${M.NO_CONFIDENCE_VOTING_TICKS} ticks. All parties will vote.`),window.location.href=`bill.html?id=${m.id}`}catch(s){console.error("No confidence error:",s),alert("Error: "+s.message)}finally{oe=!1}}}function Kn(){return!d||X||!Y||!j||Ge?"":(Se[d.id]||d.seats||0)<1?`
            <div id="impeachment" style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-main);">
                <button class="ministry-btn purge" style="padding:10px 24px;font-size:0.8rem;" disabled>
                    ⚖ Impeach President
                </button>
                <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:6px;">Need at least 1 seat in the legislature.</div>
            </div>`:`
        <div id="impeachment" style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid var(--border-main);">
            <button class="ministry-btn purge" style="padding:10px 24px;font-size:0.8rem;" onclick="fileImpeachment()" id="impeach-btn">
                ⚖ Impeach President <span class="ap-cost">${M.IMPEACHMENT_AP_COST} AP</span>
            </button>
            <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:6px;">File articles of impeachment against the President</div>
        </div>`}let pt=null,Ee=null,pe=null,J={};function Wn(){if(!Y||!j)return"";const e=r?.overreach_count||0,t=K.OVERREACH_WINDOW;let i="";for(let n=0;n<t;n++){const a=n<e,c=a?e>=4?"danger":e>=2?"warn":"":"";i+=`<div class="overreach-pip${a?" filled":""}${c?" "+c:""}"></div>`}return`
        <div class="overreach-container">
            <div class="overreach-header">
                <span class="overreach-label">Presidential Overreach</span>
                <span class="overreach-count">${e} / ${t}</span>
            </div>
            <div class="overreach-pips">${i}</div>
        </div>`}function Jn(){if(!Y||!j)return"";if(!Va(r,d,de))return`
            <div class="executive-order-row">
                <button class="executive-order-btn" disabled title="Only the president's party can issue executive orders">
                    Executive Order
                </button>
            </div>`;if(pt?.hasActiveEmergency){const i=pt.activeEmergency,n=(pt?.currentTick||q)-(i?.issued_tick||0);return`
            <div class="executive-order-row">
                <button class="executive-order-btn" onclick="openEOModal()">
                    Executive Order
                </button>
                <button class="executive-order-btn end-emergency" onclick="handleEndEmergency()" style="margin-top:6px;">
                    End Emergency
                </button>
            </div>
            <div class="emergency-banner">
                <span class="emergency-banner-label">Emergency In Effect</span>
                <span class="emergency-banner-ticks">${n} tick${n!==1?"s":""} active</span>
            </div>`}return`
        <div class="executive-order-row">
            <button class="executive-order-btn" onclick="openEOModal()">
                Executive Order
            </button>
        </div>`}async function Xn(){if(!d||!r)return;const e=document.getElementById("eo-modal"),t=document.getElementById("eo-order-list"),i=document.getElementById("eo-confirm-panel"),n=document.getElementById("eo-confirm-btn");pe=null,J={},i.className="eo-confirm-panel",i.innerHTML="",n.style.display="none",n.disabled=!0,t.innerHTML='<div style="color:var(--text-secondary);font-size:0.85rem;">Loading...</div>',e.classList.add("active");try{pt=await Ei(l,r.id),Ee=await es(l,r.id,d.id,d.action_points||0)}catch(s){t.innerHTML=`<div style="color:var(--red);font-size:0.85rem;">Error: ${s.message}</div>`;return}const a=[{type:"acting_minister",name:"Acting Minister",desc:`Appoint an acting minister, bypassing confirmation. Max ${K.ACTING_MINISTER_MAX}.`,info:Ee.acting_minister},{type:"tax_adjustment",name:"Tax Adjustment",desc:"Adjust income, corporate, or sales tax by ±3%.",info:Ee.tax_adjustment},{type:"price_controls",name:"Price Controls",desc:`Freeze fuel prices or food security for ${K.PRICE_CONTROLS_DURATION} ticks.`,info:Ee.price_controls},{type:"national_emergency",name:"National Emergency",desc:"Declare emergency powers. +1 AP/tick, advance bills. Lasts until ended.",info:Ee.national_emergency},{type:"censure",name:"Censure",desc:"Censure a rival faction. -4 momentum to target (but they gain sympathy).",info:Ee.censure},{type:"stimulate_economy",name:"Stimulate the Economy",desc:"Issue ideology-flavored economic stimulus orders. Once per order per term.",info:Ee.stimulate_economy}];let c='<div class="modal-subtitle">Select an executive order to issue.</div>';for(const s of a){const o=s.info.available,m=o?"AVAILABLE":s.info.reason||"LOCKED",u=o?"available":s.info.reason?.includes("ooldown")?"cooldown":"locked";c+=`
            <div class="eo-card ${o?"":"unavailable"}" onclick="${o?`selectEOType('${s.type}')`:""}">
                <div class="eo-card-left">
                    <div class="eo-card-name">${g(s.name)}</div>
                    <div class="eo-card-desc">${g(s.desc)}</div>
                </div>
                <div class="eo-card-right">
                    <div class="eo-card-cost">${s.info.apCost} AP</div>
                    <div class="eo-card-status ${u}">${g(m)}</div>
                </div>
            </div>`}t.innerHTML=c}function Qn(e){pe=e,J={};const t=document.getElementById("eo-order-list"),i=document.getElementById("eo-confirm-panel"),n=document.getElementById("eo-confirm-btn");t.style.display="none",i.className="eo-confirm-panel active",n.style.display="inline-block",n.disabled=!0,e==="acting_minister"?Zn(i):e==="tax_adjustment"?ea(i):e==="price_controls"?ta(i):e==="national_emergency"?ia(i):e==="censure"?na(i):e==="stimulate_economy"&&di(i)}function Zn(e){const t=(ae||[]).filter(a=>!a.minister_first_name||a.confirmation_status==="pending"||a.confirmation_status==="rejected").filter(a=>a.ministry_key!=="prime_minister");if(t.length===0){e.innerHTML=`
            <div class="eo-confirm-title">Acting Minister</div>
            <div class="eo-confirm-desc">No vacant ministries available for acting appointment.</div>`;return}const i={interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",health:"Health"};let n="";for(const a of t){const c=i[a.ministry_key]||a.ministry_key;n+=`<option value="${a.ministry_key}">${g(c)}</option>`}e.innerHTML=`
        <div class="eo-confirm-title">Appoint Acting Minister</div>
        <div class="eo-confirm-desc">
            Select a ministry to fill with an acting appointment. This bypasses legislative confirmation
            but costs ${K.ACTING_MINISTER_AP} AP and -4 government approval.
        </div>
        <select class="eo-select" id="eo-acting-ministry" onchange="eoParamChanged()">
            <option value="">-- Select Ministry --</option>
            ${n}
        </select>
        <div class="eo-preview" id="eo-acting-preview" style="display:none;"></div>`}function ea(e){const t=[{key:"income_tax",label:"Income Tax"},{key:"corporate_tax",label:"Corporate Tax"},{key:"sales_tax",label:"Sales Tax"}],i=Ee?.taxCooldowns||{};let n="";for(const a of t){const c=i[a.key];n+=`<button class="eo-option-btn" data-tax="${a.key}" onclick="eoSelectTax('${a.key}')" ${c?'disabled title="On cooldown"':""}>${g(a.label)}${c?" (CD)":""}</button>`}e.innerHTML=`
        <div class="eo-confirm-title">Tax Adjustment</div>
        <div class="eo-confirm-desc">
            Adjust a tax rate by ±${K.TAX_ADJUSTMENT_DELTA}%. Costs ${K.TAX_ADJUSTMENT_BASE_AP}+ AP.
            Tax increases cost -3 approval; decreases cost -5 approval.
        </div>
        <div class="eo-option-group" id="eo-tax-types">${n}</div>
        <div class="eo-option-group" id="eo-tax-direction" style="display:none;">
            <button class="eo-option-btn" onclick="eoSelectDirection('increase')">Increase +${K.TAX_ADJUSTMENT_DELTA}%</button>
            <button class="eo-option-btn" onclick="eoSelectDirection('decrease')">Decrease -${K.TAX_ADJUSTMENT_DELTA}%</button>
        </div>
        <div class="eo-preview" id="eo-tax-preview" style="display:none;"></div>`}function ta(e){const t=[{key:"fuel_prices",label:"Fuel Prices"},{key:"food_security",label:"Food Security"}],i=Ee?.pcCooldowns||{};let n="";for(const a of t){const c=i[a.key];n+=`<button class="eo-option-btn" data-stat="${a.key}" onclick="eoSelectPCStat('${a.key}')" ${c?'disabled title="On cooldown"':""}>${g(a.label)}${c?" (CD)":""}</button>`}e.innerHTML=`
        <div class="eo-confirm-title">Price Controls</div>
        <div class="eo-confirm-desc">
            Freeze a stat at its current value for ${K.PRICE_CONTROLS_DURATION} ticks.
            When controls expire, suppressed pressure releases at 2x magnitude.
            Costs ${K.PRICE_CONTROLS_AP} AP and -3 approval.
        </div>
        <div class="eo-option-group">${n}</div>
        <div class="eo-preview" id="eo-pc-preview" style="display:none;"></div>`}function ia(e){e.innerHTML=`
        <div class="eo-confirm-title">Declare National Emergency</div>
        <div class="eo-warning">
            <strong>Warning:</strong> Emergency powers are significant.
            <br>• +1 AP per tick to presidential faction
            <br>• Can advance bills without votes
            <br>• +8 initial approval boost (crisis rally)
            <br>• -4 approval per tick after first tick
            <br>• Opposition gains +6 momentum
            <br>• After ${K.EMERGENCY_UNREST_THRESHOLD} ticks: civil unrest rises +1/tick
            <br>• Ending costs +8 civil unrest + ${K.EMERGENCY_COOLDOWN}-tick cooldown
            <br>• Lasts until manually ended, president removed, or impeached
        </div>
        <div class="eo-confirm-desc">
            Cost: ${K.NATIONAL_EMERGENCY_AP} AP. This cannot be undone without consequences.
        </div>`,document.getElementById("eo-confirm-btn").disabled=!1}function na(e){const t=(R||[]).filter(n=>n.id!==d?.id&&n.seats>0);if(t.length===0){e.innerHTML=`
            <div class="eo-confirm-title">Censure</div>
            <div class="eo-confirm-desc">No other factions to censure.</div>`;return}let i="";for(const n of t)i+=`<option value="${n.id}">${g(n.faction_name)} (${n.seats} seats)</option>`;e.innerHTML=`
        <div class="eo-confirm-title">Censure a Rival Faction</div>
        <div class="eo-confirm-desc">
            Censure costs ${K.CENSURE_AP} AP and -3 approval.
            Target loses -4 momentum but gains sympathy (+${K.CENSURE_BASE_MOMENTUM} momentum).
            Repeat censures within ${K.CENSURE_REPEAT_WINDOW} ticks give +${K.CENSURE_REPEAT_MOMENTUM} sympathy.
        </div>
        <select class="eo-select" id="eo-censure-target" onchange="eoParamChanged()">
            <option value="">-- Select Faction --</option>
            ${i}
        </select>`}const aa=[{label:"Individualism vs Collectivism",ideologies:["INDIVIDUALISM","COLLECTIVISM"]},{label:"Nationalism vs Globalism",ideologies:["NATIONALISM","GLOBALISM"]},{label:"Equality vs Liberty",ideologies:["EQUALITY","LIBERTY"]},{label:"Progress vs Tradition",ideologies:["PROGRESS","TRADITION"]},{label:"Security vs Freedom",ideologies:["SECURITY","FREEDOM"]}];function di(e){const t=Ee?.stimulate_economy;if(!t){e.innerHTML='<div class="eo-confirm-desc">Stimulus data unavailable.</div>';return}const i=t.orders||{},n=document.getElementById("eo-confirm-btn");n.style.display="none";let a=`
        <div class="eo-confirm-title">Stimulate the Economy</div>
        <div class="eo-confirm-desc">
            Issue ideology-flavored economic stimulus orders. Each costs ${K.STIMULATE_ECONOMY_AP} AP.
            Once used, an order cannot be reissued during the same presidential term.
        </div>
        <div class="eo-stimulus-back" onclick="backToEOList()">&#8592; Back to Executive Orders</div>
        <div class="eo-stimulus-grid">`;for(const c of aa){const s=Object.values(i).filter(o=>c.ideologies.includes(o.ideology));if(s.length!==0){a+=`<div class="eo-stimulus-axis">
            <div class="eo-stimulus-axis-label">${g(c.label)}</div>
            <div class="eo-stimulus-axis-orders">`;for(const o of s){const m=o.available,u=o.used,f=u?"USED":m?"AVAILABLE":o.reason||"LOCKED",p=u?"cooldown":m?"available":"locked",y=o.stat_increases?Object.entries(o.stat_increases).map(([h,w])=>`+${w} ${ft(h)}`).join(", "):"",v=o.stat_decreases?Object.entries(o.stat_decreases).map(([h,w])=>`−${w} ${ft(h)}`).join(", "):"";a+=`
                <div class="eo-stimulus-card ${m?"":"unavailable"}" onclick="${m?`selectStimulusOrder('${o.key}')`:""}">
                    <div class="eo-stimulus-card-header">
                        <span class="eo-stimulus-ideology">${g(o.ideology)}</span>
                        <span class="eo-card-status ${p}">${g(f)}</span>
                    </div>
                    <div class="eo-card-name">${g(o.name)}</div>
                    <div class="eo-card-desc">${g(o.description)}</div>
                    <div class="eo-stimulus-effects">
                        ${y?`<div class="eo-stimulus-up">&#9650; ${g(y)}</div>`:""}
                        ${v?`<div class="eo-stimulus-down">&#9660; ${g(v)}</div>`:""}
                    </div>
                </div>`}a+="</div></div>"}}a+="</div>",e.innerHTML=a}function sa(){const e=document.getElementById("eo-order-list"),t=document.getElementById("eo-confirm-panel"),i=document.getElementById("eo-confirm-btn");e.style.display="block",t.className="eo-confirm-panel",t.innerHTML="",i.style.display="none",i.disabled=!0,pe=null,J={}}window.backToEOList=sa;function oa(e){const t=Ka[e];if(!t)return;pe="stimulate_economy",J={stimulusKey:e};const i=document.getElementById("eo-confirm-panel"),n=document.getElementById("eo-confirm-btn"),a=t.stat_increases?Object.entries(t.stat_increases).map(([s,o])=>`<span class="eo-stimulus-up">+${o} ${ft(s)}</span>`).join(", "):"",c=t.stat_decreases?Object.entries(t.stat_decreases).map(([s,o])=>`<span class="eo-stimulus-down">−${o} ${ft(s)}</span>`).join(", "):"";i.innerHTML=`
        <div class="eo-stimulus-back" onclick="renderStimulusPanel(document.getElementById('eo-confirm-panel'))">&#8592; Back to Stimulus Orders</div>
        <div class="eo-confirm-title">${g(t.name)}</div>
        <div class="eo-confirm-desc">${g(t.description)}</div>
        <div class="eo-preview">
            <div style="margin-bottom:6px;"><strong>Effects:</strong></div>
            ${a?`<div style="margin-bottom:4px;">Increases: ${a}</div>`:""}
            ${c?`<div>Decreases: ${c}</div>`:""}
        </div>
        <div class="eo-confirm-desc" style="font-size:0.8rem;">
            Cost: ${K.STIMULATE_ECONOMY_AP} AP. This order cannot be reissued this term.
        </div>`,n.style.display="inline-block",n.disabled=!1}window.selectStimulusOrder=oa,window.renderStimulusPanel=di;function ra(){const e=document.getElementById("eo-confirm-btn");if(pe==="acting_minister"){const t=document.getElementById("eo-acting-ministry");J.ministryKey=t?.value||"",e.disabled=!J.ministryKey,J.ministryKey&&(document.getElementById("eo-acting-preview").style.display="block",document.getElementById("eo-acting-preview").textContent=`Appoint acting minister to ${J.ministryKey.replace("_"," ")}`)}else if(pe==="censure"){const t=document.getElementById("eo-censure-target");J.targetFactionId=t?.value||"",e.disabled=!J.targetFactionId}}window.eoParamChanged=ra;function ca(e){J.taxType=e,document.querySelectorAll("#eo-tax-types .eo-option-btn").forEach(t=>t.classList.remove("selected")),document.querySelector(`#eo-tax-types [data-tax="${e}"]`)?.classList.add("selected"),document.getElementById("eo-tax-direction").style.display="flex",J.direction=null,document.getElementById("eo-confirm-btn").disabled=!0,document.getElementById("eo-tax-preview").style.display="none"}window.eoSelectTax=ca;function la(e){J.direction=e,document.querySelectorAll("#eo-tax-direction .eo-option-btn").forEach(c=>{c.classList.toggle("selected",c.textContent.toLowerCase().includes(e))});const t=r?.[J.taxType]??20,i=e==="increase"?K.TAX_ADJUSTMENT_DELTA:-3,n=Math.max(0,Math.min(50,t+i)),a=document.getElementById("eo-tax-preview");a.style.display="block",a.textContent=`${J.taxType.replace(/_/g," ")}: ${t}% → ${n}%`,document.getElementById("eo-confirm-btn").disabled=!1}window.eoSelectDirection=la;function da(e){J.stat=e,document.querySelectorAll("#eo-confirm-panel .eo-option-btn[data-stat]").forEach(n=>{n.classList.toggle("selected",n.getAttribute("data-stat")===e)});const t=r?.[e]??50,i=document.getElementById("eo-pc-preview");i.style.display="block",i.textContent=`Freeze ${e.replace(/_/g," ")} at ${Number(t).toFixed(1)} for ${K.PRICE_CONTROLS_DURATION} ticks`,document.getElementById("eo-confirm-btn").disabled=!1}window.eoSelectPCStat=da;async function ma(){const e=document.getElementById("eo-confirm-btn");e.disabled=!0,e.textContent="Issuing...";let t;try{pe==="acting_minister"?t=await Wa(l,r.id,d.id,J.ministryKey,r.name):pe==="tax_adjustment"?t=await Ja(l,r.id,d.id,J.taxType,J.direction):pe==="price_controls"?t=await Xa(l,r.id,d.id,J.stat):pe==="national_emergency"?t=await wi(l,r.id,d.id):pe==="censure"?t=await Qa(l,r.id,d.id,J.targetFactionId):pe==="stimulate_economy"&&(t=await Za(l,r.id,d.id,J.stimulusKey))}catch(i){alert("Error: "+i.message),e.disabled=!1,e.textContent="Issue Order";return}if(!t?.success){alert(t?.error||"Failed to issue executive order."),e.disabled=!1,e.textContent="Issue Order";return}mi(),window.location.reload()}window.confirmExecutiveOrder=ma;function mi(){document.getElementById("eo-modal").classList.remove("active"),document.getElementById("eo-order-list").style.display="block";const e=document.getElementById("eo-confirm-panel");e.className="eo-confirm-panel",e.innerHTML="";const t=document.getElementById("eo-confirm-btn");t.style.display="none",t.disabled=!0,t.textContent="Issue Order",pe=null,J={}}window.closeEOModal=mi,window.openEOModal=Xn,window.selectEOType=Qn;async function pa(){if(confirm("End the national emergency? This will cause +8 civil unrest and start an 8-tick cooldown."))try{const e=await $i(l,r.id,d.id);if(!e.success){alert(e.error||"Failed to end emergency.");return}window.location.reload()}catch(e){alert("Error: "+e.message)}}window.handleEndEmergency=pa;async function ua(){if(oe||!d||!r||!j)return;if((Se[d.id]||d.seats||0)<1){alert("Need at least 1 seat in the legislature to file impeachment.");return}if(Ge){alert("The president's own party cannot file impeachment.");return}const{data:t}=await l.from("impeachment_proceedings").select("id").eq("nation_id",r.id).neq("phase","resolved").limit(1).maybeSingle();if(t){alert("An impeachment proceeding is already active.");return}if(r.impeachment_cooldown_until_tick&&q<r.impeachment_cooldown_until_tick){const v=r.impeachment_cooldown_until_tick-q;alert(`Impeachment cooldown: ${v} tick${v!==1?"s":""} remaining.`);return}const i=[];i.push({type:"abuse_of_power",label:"Abuse of Power",available:!0,reason:""});const n=r.corruption??0,a=n>=M.IMPEACHMENT_CORRUPTION_THRESHOLD;i.push({type:"corruption",label:"Corruption",available:a,reason:a?"":`Requires corruption ≥ ${M.IMPEACHMENT_CORRUPTION_THRESHOLD} (currently ${n})`});const c=r.gov_approval??40,s=c<=M.IMPEACHMENT_INCOMPETENCE_THRESHOLD;i.push({type:"incompetence",label:"Gross Incompetence",available:s,reason:s?"":`Requires gov approval ≤ ${M.IMPEACHMENT_INCOMPETENCE_THRESHOLD} (currently ${Math.round(c)})`}),i.push({type:"constitutional_violation",label:"Constitutional Violation",available:!0,reason:""}),i.push({type:"criminal_conduct",label:"Criminal Conduct",available:!0,reason:""});const o=i.map((v,h)=>{const w=v.available?"":"disabled",k=v.available?"":"opacity:0.4;",S=v.reason?` title="${v.reason}"`:"";return`<label style="display:block;margin:8px 0;${k}"${S}>
            <input type="checkbox" name="impeach-charge" value="${v.type}" ${w} style="margin-right:8px;">
            <strong>${v.label}</strong>${v.reason?` <span style="font-size:0.7rem;color:var(--text-secondary);">(${v.reason})</span>`:""}
        </label>`}).join(""),m=document.createElement("div");m.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;",m.innerHTML=`
        <div style="background:var(--bg-panel);border:1px solid var(--border-0);border-radius:3px;padding:24px;max-width:440px;width:90%;max-height:80vh;overflow-y:auto;">
            <div style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--red);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;">⚖ IMPEACH PRESIDENT</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">
                President ${g(j.first_name)} ${g(j.last_name)}
            </div>
            <div style="font-size:0.8rem;color:var(--text-primary);margin-bottom:12px;">Select at least one charge:</div>
            <div id="impeach-charges-list">${o}</div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-hair);font-size:0.75rem;color:var(--text-secondary);line-height:1.5;">
                <div>Cost: <strong style="color:var(--amber);">${M.IMPEACHMENT_AP_COST} AP</strong></div>
                <div>Committee debate: ${M.IMPEACHMENT_COMMITTEE_TICKS} ticks → Floor vote: ${M.IMPEACHMENT_MOTION_VOTING_TICKS} ticks</div>
                <div>Requires <strong style="color:var(--green);">simple majority</strong> (50%+1 of all seats) to impeach</div>
                <div style="margin-top:6px;">If impeached → Trial: ${M.IMPEACHMENT_TRIAL_TICKS}-tick conviction vote (⅔ supermajority)</div>
            </div>
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button id="impeach-cancel-btn" style="flex:1;padding:10px;background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border-0);border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Cancel</button>
                <button id="impeach-confirm-btn" style="flex:1;padding:10px;background:var(--red);color:#fff;border:none;border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">File Impeachment</button>
            </div>
        </div>`,document.body.appendChild(m);const u=await new Promise(v=>{m.querySelector("#impeach-cancel-btn").addEventListener("click",()=>v(null)),m.addEventListener("click",h=>{h.target===m&&v(null)}),m.querySelector("#impeach-confirm-btn").addEventListener("click",()=>{const h=[...m.querySelectorAll('input[name="impeach-charge"]:checked')].map(w=>w.value);if(h.length===0){alert("Select at least one charge.");return}v(h)})});if(m.remove(),!u)return;oe=!0;const f=u.map(v=>{const h=i.find(w=>w.type===v);return{type:v,label:h.label}}),p=`${j.first_name} ${j.last_name}`,y=`Articles of Impeachment Against President ${p}`;try{const{data:v}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single(),h=v?.current_tick||0,{data:w,error:k}=await l.from("impeachment_proceedings").insert({nation_id:r.id,president_id:j.id,initiated_by_faction_id:d.id,charges:f,phase:"motion_committee",created_at_tick:h}).select().single();if(k)throw k;const S=f.map(L=>L.label).join(", "),{data:C,error:$}=await l.from("bills").insert({nation_id:r.id,proposed_by:d.id,proposed_tick:h,bill_name:y,bill_type:"impeachment_motion",status:"committee",impeachment_id:w.id,proposer_name:d.faction_name,proposer_color:d.party_color,preamble:`This motion, filed by the ${d.faction_name}, calls for the impeachment of President ${p} on the following charges: ${S}. After ${M.IMPEACHMENT_COMMITTEE_TICKS} ticks of committee debate, the motion will proceed to a floor vote requiring an absolute majority (${M.MAJORITY_SEATS} of ${M.TOTAL_SEATS} seats) to pass.`}).select().single();if($)throw $;await l.from("impeachment_proceedings").update({motion_bill_id:C.id}).eq("id",w.id);const{count:A}=await l.from("impeachment_proceedings").select("id",{count:"exact",head:!0}).eq("nation_id",r.id).neq("phase","resolved");if(A>1){await l.from("bills").delete().eq("id",C.id),await l.from("impeachment_proceedings").delete().eq("id",w.id),alert("Another impeachment proceeding was just filed. Please refresh.");return}const _=await at(l,d.id,M.IMPEACHMENT_AP_COST);if(!_.success){_.currentAp!==void 0&&(d.action_points=_.currentAp),alert("Not enough AP. Need "+M.IMPEACHMENT_AP_COST+" AP, have "+(_.currentAp??"?")+".");return}d.action_points=_.newAp;const P=(await jt(l,r.id,!1,R,d.id)).allPartySeats[d.id]||0;await l.from("bill_support").upsert({bill_id:C.id,faction_id:d.id,stance:"yes",seat_count:P},{onConflict:"bill_id,faction_id"}),await l.from("event_log").insert({nation_id:r.id,event_type:"impeachment",headline:`Impeachment Motion Filed Against President ${p}`,body:`The ${d.faction_name} has filed articles of impeachment against President ${p}. Charges: ${S}. A ${M.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate will precede the floor vote.`,metadata:{status:"filed",president_name:p,charges:S,filer:d.faction_name},tick:h}),alert(`⚖ "${y}" has been filed!

${M.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate begins now. The motion will then proceed to a floor vote.`),window.location.href=`bill.html?id=${C.id}`}catch(v){console.error("Impeachment error:",v),alert("Error: "+v.message)}finally{oe=!1}}window.fileImpeachment=ua;function fa(e){return!d||X||Y||!(d.id===e.lead_party_id)?"":`
        <div id="early-elections" style="text-align:center;margin-top:12px;">
            <button class="ministry-btn purge" style="padding:10px 24px;font-size:0.8rem;" onclick="callEarlyElections()" id="early-elections-btn">
                ⚡ Call Early Elections
            </button>
            <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:6px;">PM only — dissolve the legislature</div>
        </div>`}function pi(){const e=ne?._earlyElectionTick||null,t=e?Math.max(0,e-q):"?",i=e!=null&&e<=q,n=e?ie(e):"TBD";return`
        <div class="caretaker-banner">
            <div class="caretaker-icon">⚡</div>
            <div class="caretaker-title">Caretaker Government</div>
            <div class="caretaker-subtitle">
                Legislature dissolved. ${i?"Elections overdue — will be processed next tick.":`Elections in <strong>${t}</strong> tick${t!==1?"s":""} (${n}).`}
            </div>
            <div class="caretaker-restrictions">
                <span class="caretaker-restriction-tag">No Legislation</span>
                <span class="caretaker-restriction-tag">No Appointments</span>
                <span class="caretaker-restriction-tag">No Coalition Changes</span>
            </div>
        </div>`}async function _a(){if(!d||!r||!ne)return;if(d.id!==ne.lead_party_id){alert("Only the Prime Minister's party can call early elections.");return}if(ne.status==="caretaker"){alert("The government is already in caretaker mode.");return}const e=ne.party_ids.filter(n=>n!==d.id).map(n=>R.find(a=>a.id===n)?.faction_name||"Unknown"),t=`⚡ CALL EARLY ELECTIONS?

This will:
• Cost your party ${M.EARLY_ELECTION_PM_APPROVAL_COST} Approval
`+(e.length>0?`• Cost coalition partners (${e.join(", ")}) ${M.EARLY_ELECTION_COALITION_APPROVAL_COST} Approval each
`:"")+`• Freeze all pending legislation
• Dissolve the legislature
• Trigger elections in ${M.EARLY_ELECTION_TICKS} ticks

The government will remain as caretaker until then.
After the election: coalition dissolves, PM removed, ministries vacated.

Proceed?`;if(!confirm(t))return;const i=document.getElementById("early-elections-btn");i&&(i.disabled=!0,i.textContent="Dissolving...");try{const n=await Ba(l,r.id,d.id,ne.party_ids);wt("coalition_"),alert(`⚡ The legislature has been dissolved.

Caretaker government in place. Elections scheduled for tick ${n.electionTick}.`),await ce()}catch(n){console.error("Early elections error:",n),alert("Error: "+n.message);const a=document.getElementById("early-elections-btn");a&&(a.disabled=!1,a.textContent="⚡ Call Early Elections")}}function va(e,t={}){const{showLegend:i=!0,showMajorityLine:n=!0,majoritySeats:a=M.MAJORITY_SEATS}=t,c=["#E91E63","#5b9bd5","#5cb85c","#d48a3c","#9C27B0","#00BCD4","#d9534f","#8BC34A","#FFC107","#673AB7"],s=e.map((A,_)=>({name:A.party_name,seats:A.seats,color:A.color||c[_%c.length]})),o=s.reduce((A,_)=>A+_.seats,0);if(o===0)return;const m=document.getElementById("parliament-svg");if(!m)return;const u=260,f=265,v=ga(o,230,80),h=ya(v,u,f);h.forEach(A=>{A.angle=Math.atan2(f-A.y,A.x-u),A.radius=Math.hypot(A.x-u,f-A.y)}),h.sort((A,_)=>_.angle-A.angle||A.radius-_.radius);const w=[],k=[];s.forEach(A=>{for(let _=0;_<A.seats;_++)w.push(A.color),k.push(A.name)});const S=Math.min(6,...v.map(A=>A.seats>1?Math.PI*A.radius/(A.seats*2.8):6)),C=Math.max(2.5,S);let $="";if(h.forEach((A,_)=>{_<w.length&&($+=`<circle cx="${A.x.toFixed(1)}" cy="${A.y.toFixed(1)}" r="${C.toFixed(1)}" fill="${w[_]}" stroke="var(--bg-panel)" stroke-width="0.8"><title>${k[_]}</title></circle>`)}),n&&a&&a<o){const A=a/o,_=Math.PI*(1-A),E=v[0].radius,P=v[v.length-1].radius,L=u+(E-12)*Math.cos(_),I=f-(E-12)*Math.sin(_),x=u+(P+12)*Math.cos(_),O=f-(P+12)*Math.sin(_);$+=`<line x1="${L.toFixed(1)}" y1="${I.toFixed(1)}" x2="${x.toFixed(1)}" y2="${O.toFixed(1)}" stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>`;const F=u+(P+22)*Math.cos(_),T=f-(P+22)*Math.sin(_);$+=`<text x="${F.toFixed(1)}" y="${T.toFixed(1)}" text-anchor="middle" fill="var(--text-muted)" font-size="8" font-weight="600">${a}</text>`}if($+=`<text x="${u}" y="${f-14}" text-anchor="middle" fill="var(--accent)" font-size="26" font-weight="bold">${o}</text>`,$+=`<text x="${u}" y="${f+4}" text-anchor="middle" fill="var(--text-muted)" font-size="10" letter-spacing="1.5">TOTAL SEATS</text>`,m.innerHTML=$,i){const A=document.getElementById("parliament-legend");A&&(A.innerHTML=s.map(_=>{const E=R.find(x=>x.faction_name===_.name),P=E?.party_logo,L=E?.custom_logo_url,I=P||L?`<span style="display:inline-flex;vertical-align:middle;margin-right:4px;">${Ce({customLogoUrl:L,iconKey:P,size:14,color:_.color})}</span>`:"";return`<div class="legend-item"><span class="legend-swatch" style="background:${_.color};"></span><span class="legend-name">${I}${g(_.name)}</span><span class="legend-seats">${_.seats}</span></div>`}).join(""))}}function ga(e,t,i){let n=Math.round(Math.sqrt(e/3));n=Math.max(3,Math.min(10,n));const a=Math.max(i,t-n*30),c=n>1?(t-a)/(n-1):0,s=[];for(let f=0;f<n;f++)s.push(a+f*c);const o=s.reduce((f,p)=>f+Math.PI*p,0),m=[];let u=0;for(let f=0;f<n;f++){const p=Math.round(e*(Math.PI*s[f])/o);m.push({radius:s[f],seats:p}),u+=p}return m[m.length-1].seats+=e-u,m}function ya(e,t,i){const n=[];for(const c of e){const s=c.seats,o=c.radius;if(s<=0)continue;if(s===1){n.push({x:t+o*Math.cos(Math.PI/2),y:i-o*Math.sin(Math.PI/2)});continue}const m=Math.PI-.08,f=(m-.08)/(s-1);for(let p=0;p<s;p++){const y=m-p*f;n.push({x:t+o*Math.cos(y),y:i-o*Math.sin(y)})}}return n}async function ha(){if(oe||!d||!r)return;const{data:e}=await l.from("head_of_government").select("trait_key").eq("nation_id",r.id).eq("faction_id",d.id).eq("active",!0).maybeSingle();if(e?.trait_key==="survivor"){alert("❌ A Survivor cannot resign. They cling to power.");return}if(confirm(`📋 RESIGN as Prime Minister?

Effects:
• Your party: -5 Approval
• Nation: -3 Stability
• Your party cannot hold PM for 12 ticks (1 year)
• Coalition dissolves — emergency elections held immediately
• All active bills are frozen

This cannot be undone. Proceed?`)){oe=!0;try{const{data:t}=await l.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=await Oa(l,r.id,d.id,t?.current_tick||0);wt("coalition_"),alert(`📋 You have resigned as Prime Minister.

The coalition has been dissolved and emergency elections have been called.
Elections will be held on the next tick. All active bills have been frozen.
Your party cannot hold the PM seat for 12 ticks.`),await ce()}catch(t){console.error("Resign error:",t),alert("Error: "+t.message)}finally{oe=!1}}}async function ba(e){if(oe||!d)return;const t=ae.find(c=>c.ministry_key===e);if(!t||!t.minister_first_name){alert("No minister to dismiss.");return}if(e==="prime_minister"){alert("Cannot dismiss the Prime Minister this way.");return}if(!(Y?Ge:d.id===ne?.lead_party_id)){alert("Only the head of government can dismiss ministers.");return}const n=t.minister_first_name+" "+t.minister_last_name,a=t.ministry_name||ge[e]||e;if(confirm("Dismiss "+n+" from "+a+`?

Costs 1 AP. A replacement will need to be appointed.
The new minister starts at 50% approval.
Note: The underlying national stats will not change.`)){oe=!0;try{const c=await at(l,d.id,1);if(!c.success){c.currentAp!==void 0&&(d.action_points=c.currentAp),alert("Not enough AP (need 1). Current AP: "+(c.currentAp??"?"));return}d.action_points=c.newAp,await l.from("ministries").update({minister_first_name:null,minister_last_name:null,minister_age:null,party_id:null,minister_approval:we,stat_baselines:null}).eq("id",t.id),await l.from("campaign_actions").insert({party_id:d.id,nation_id:r.id,action_type:"fire_minister",tick_performed:q,result:{minister_name:n,ministry_key:e}}),await qa(l,r.id,3,"minister:fired"),alert(n+" has been dismissed from "+a+`.
+3 government approval event applied.`),await ce()}catch(c){console.error("Fire minister error:",c),alert("Error: "+c.message)}finally{oe=!1}}}async function wa(e){const t=ae.find(a=>a.ministry_key===e);if(!t)return;if(!Y&&ne?.status==="caretaker"){alert("Cannot resign ministries during a caretaker government.");return}const i=t.minister_first_name+" "+t.minister_last_name,n=Y?"Resign "+i+" from "+(t.ministry_name||e)+`?

This vacates the position. The President will need to nominate a replacement.`:"Resign "+i+" from "+(t.ministry_name||e)+`?

This vacates the position. Your coalition leader may reassign it.`;if(confirm(n))try{const a={minister_first_name:null,minister_last_name:null,minister_age:null,party_id:null,minister_approval:we,stat_baselines:null};Y&&(a.confirmation_status=null,a.pending_minister=null),await l.from("ministries").update(a).eq("id",t.id),alert(i+" has resigned from "+(t.ministry_name||e)+"."),await ce()}catch(a){console.error("Resign ministry error:",a),alert("Error: "+a.message)}}const ui={election_loss:"Election Loss",new_coalition:"New Coalition",coalition_collapse:"Collapsed",coup:"Coup",dissolved:"Dissolved",pm_replaced:"PM Replaced",regime_collapse:"Regime Collapsed",revolution:"Revolution",power_vacuum:"Power Vacuum",impeachment:"Impeachment"};function $a(e,t){if(!e||!t)return{achievements:[],challenges:[],allChanges:[]};const i=[];for(const o of Object.keys(t)){const m=e[o]??0,u=t[o]??0,f=u-m;if(Math.abs(f)<.01)continue;let p;if(Yt.includes(o))p=f;else if(Gt.includes(o))p=-f;else continue;i.push({key:o,start:m,end:u,raw:f,improvement:p})}const n=[...i].sort((o,m)=>m.improvement-o.improvement),a=n.filter(o=>o.improvement>0).slice(0,3),s=[...i].sort((o,m)=>o.improvement-m.improvement).filter(o=>o.improvement<0).slice(0,3);return{achievements:a,challenges:s,allChanges:n}}function zt(e){const t={gdp:"GDP",gdp_growth:"GDP Growth",oil_and_gas:"Oil & Gas",beds_per_100k:"Hospital Beds",lifespan:"Life Expectancy",literacy:"Literacy Rate",credit:"Credit Rating",labor_force_participation:"Labor Participation",renewable_energy_percentage:"Renewable Energy",debt_growth:"Debt Growth"};return t[e]?t[e]:e.replace(/_/g," ").replace(/\b\w/g,i=>i.toUpperCase())}function it(e,t){if(["gdp","debt"].includes(t))return(e/1e9).toFixed(1)+"B";if(t==="population")return(e/1e6).toFixed(2)+"M";if(t==="gdp_growth"){var i=(e-50)/50*1;return(i>=0?"+":"")+i.toFixed(2)+"%"}if(t==="trade_balance"){var n=Math.round(e);return n===50?"Balanced":n+"% Exp / "+(100-n)+"% Imp"}return Math.abs(e)<1&&e!==0?e.toFixed(2):String(Math.round(e*10)/10)}function Ut(e,t){const i=e>0?"+":"";return["gdp","debt"].includes(t)?i+(e/1e9).toFixed(1)+"B":t==="population"?i+(e/1e6).toFixed(2)+"M":Math.abs(e)<1&&e!==0?i+e.toFixed(2):i+Math.round(e*10)/10}function Ea(e,t){return Yt.includes(e)?t>0:Gt.includes(e)?t<0:null}function Aa(e,t){return t==null?null:t-e}async function Ca(){const e=document.getElementById("past-administrations-container");if(e)try{const{data:t,error:i}=await l.from("administrations").select("*").eq("nation_id",r.id).order("started_at_tick",{ascending:!1});if(i)throw i;if(!t||t.length===0){e.innerHTML=`
                <div class="past-admins-toggle" style="cursor: default;">
                    <span class="past-admins-toggle-text">Past Administrations (0)</span>
                </div>
                <div class="info-block" style="margin-top: 8px;">
                    <div class="info-row">
                        <span class="info-label">History</span>
                        <span class="info-value" style="color: var(--text-muted);">No administrations recorded yet.</span>
                    </div>
                </div>
            `;return}const n=t.filter(s=>s.ended_at_tick!=null),a=t.find(s=>s.ended_at_tick==null),c=n.length+(a?1:0);e.innerHTML=`
            <div class="past-admins-toggle" onclick="togglePastAdmins()">
                <span class="past-admins-toggle-text">Past Administrations (${n.length})</span>
                <span class="chevron">&#9660;</span>
            </div>
            <div class="past-admins-list hidden" id="past-admins-list">
                ${a?fi(a,!0):""}
                ${n.map(s=>fi(s,!1)).join("")}
            </div>
        `}catch(t){console.error("Error loading past administrations:",t)}}function xa(){const e=document.querySelector(".past-admins-toggle"),t=document.getElementById("past-admins-list");!e||!t||(e.classList.toggle("open"),t.classList.toggle("hidden"))}function ka(e){const t=document.getElementById("admin-card-"+e);t&&t.classList.toggle("open")}function Sa(e){const t=document.getElementById("stat-table-"+e);t&&(t.classList.toggle("open"),event.stopPropagation())}function fi(e,t){const i=t?"current-admin":"end-"+(e.end_reason||"dissolved"),n=t?`${ie(e.started_at_tick)} — Present`:`${ie(e.started_at_tick)} — ${ie(e.ended_at_tick)}`,a=e.coalition_parties||[],c=a.map(b=>b.party_name).join(" + "),s=e.total_seats||0,o=e.approval_at_start,m=t?null:e.approval_at_end;let u="";if(t){const b=r?.gov_approval;b!=null?u=`<span>${b}%</span>`:o!=null&&(u=`<span>${o}%</span>`)}else o!=null&&(m!=null?u=`<span style="color:${m>=o?"var(--green)":"var(--red)"}">${o}% &rarr; ${m}%</span>`:u=`<span>${o}%</span>`);const f=t?null:Aa(e.started_at_tick,e.ended_at_tick),p=f!=null?`${f} month${f!==1?"s":""} in power`:"";let y="";t?y='<span class="pad-current-badge">CURRENT</span>':e.end_reason&&(y=`<span class="pad-end-reason ${e.end_reason}">${ui[e.end_reason]||e.end_reason}</span>`);const{achievements:v,challenges:h,allChanges:w}=$a(e.stats_at_start,e.stats_at_end),k=e.bills_passed||[],S=e.bills_failed||[],C=e.laws_repealed||[],$=e.crises_started||[],A=e.crises_solved||[],_=e.no_confidence_votes||[],E=e.impeachments||[],P=e.executive_orders||[],L=e.snap_elections||[],I=e.minority_governments||[],x=e.leader_changes||[],O=e.minister_actions||[],F=e.diplomatic_actions||[];let T="";const N=e.government_type==="Presidential",H=e.government_type==="Autocracy";let U,D,G,W,ve,re;if(H?(U=g(e.head_of_state_title||"Ruler"),D=e.head_of_state||e.prime_minister||"Unknown",G=e.pm_party_name||"",W="Ruling Faction",ve=e.pm_party_name||"—",re=""):N?(U="President",D=e.president_name||e.head_of_state||"Unknown",G=e.president_party_name||e.pm_party_name||"",W="Governing Party",ve=e.president_party_name||e.pm_party_name||"—",re=""):(U=g(e.head_of_state_title||"Head of State"),D=e.head_of_state||"Unknown",G=e.hos_election_method==="hereditary"&&r.dynasty_name?r.dynasty_name+" dynasty":"",W="Prime Minister",ve=e.prime_minister||"Not yet selected",re=g(e.pm_party_name||"")),T+=`<div class="past-admin-detail-grid">
        <div class="pad-info-box">
            <div class="pad-info-label">${U}</div>
            <div class="pad-info-value">${g(D)}</div>
            ${G?`<div class="pad-info-sub">${g(G)}</div>`:""}
        </div>
        <div class="pad-info-box">
            <div class="pad-info-label">${W}</div>
            <div class="pad-info-value">${g(ve)}</div>
            ${re?`<div class="pad-info-sub">${re}</div>`:""}
        </div>
        <div class="pad-info-box">
            <div class="pad-info-label">${H?"Faction Seats":N?"Party Seats":"Coalition"}</div>
            <div class="pad-info-value">${s} / ${M.TOTAL_SEATS} seats</div>
            <div class="pad-info-sub">${p}${e.end_reason?" &middot; Ended: "+(ui[e.end_reason]||e.end_reason):""}</div>
        </div>
    </div>`,a.length>0&&(T+=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
            ${a.map(b=>`<span class="coalition-party-tag">${b.party_name}${b.seats?'<span class="seats">'+b.seats+"</span>":""}</span>`).join('<span class="coalition-divider">+</span>')}
        </div>`),!t&&v.length>0&&(T+='<div class="pad-section-title">Top Achievements</div>',T+=v.map(b=>{const ee=Gt.includes(b.key)?" &darr; improved":"";return`<div class="pad-achievement">
                <span class="pad-stat-name">${zt(b.key)}</span>
                <span class="pad-stat-change positive">${it(b.start,b.key)} &rarr; ${it(b.end,b.key)} (${Ut(b.raw,b.key)})${ee}</span>
            </div>`}).join("")),!t&&h.length>0&&(T+='<div class="pad-section-title">Biggest Challenges</div>',T+=h.map(b=>{const ee=Yt.includes(b.key)?"":" &uarr; worsened";return`<div class="pad-challenge">
                <span class="pad-stat-name">${zt(b.key)}</span>
                <span class="pad-stat-change negative">${it(b.start,b.key)} &rarr; ${it(b.end,b.key)} (${Ut(b.raw,b.key)})${ee}</span>
            </div>`}).join("")),!t&&v.length===0&&h.length===0&&e.stats_at_end&&(T+='<div class="pad-no-data">No significant stat changes during this administration.</div>'),t&&!e.stats_at_end&&(T+='<div class="pad-no-data">Stats will be compared when this administration ends.</div>'),($.length>0||A.length>0)&&(T+='<div class="pad-section-title">Crises</div>',$.length>0&&(T+=`<div style="font-size:0.72rem;color:var(--red);font-weight:bold;margin-bottom:4px;">Started (${$.length})</div>`,T+=$.map(b=>`<div class="pad-crisis-item"><span>${b.title}</span><span class="crisis-date">${b.date||(b.started_tick!=null?ie(b.started_tick):"")}</span></div>`).join("")),A.length>0&&(T+=`<div style="font-size:0.72rem;color:var(--green);font-weight:bold;margin:6px 0 4px;">Solved (${A.length})</div>`,T+=A.map(b=>`<div class="pad-crisis-item"><span>${b.title}</span><span class="crisis-date">${b.date||(b.solved_tick!=null?ie(b.solved_tick):"")}</span></div>`).join(""))),(k.length>0||S.length>0||C.length>0)&&(T+='<div class="pad-section-title">Legislation</div>',k.length>0&&(T+=`<div style="font-size:0.72rem;color:var(--green);font-weight:bold;margin-bottom:4px;">Bills Passed (${k.length})</div>`,T+=k.map(b=>{const z=b.bill_type==="foundational"?' <span style="font-size:0.65rem;color:var(--amber);font-weight:600;text-transform:uppercase;">Foundational</span>':"";return`<div class="pad-legislation-item"><span class="bill-name">${g(b.bill_name||"Unnamed")}${z}</span><span class="bill-date">${b.date||ie(b.passed_tick)}</span></div>`}).join("")),S.length>0&&(T+=`<div style="font-size:0.72rem;color:var(--red);font-weight:bold;margin:6px 0 4px;">Bills Failed (${S.length})</div>`,T+=S.map(b=>{const z=b.bill_type==="foundational"?' <span style="font-size:0.65rem;color:var(--amber);font-weight:600;text-transform:uppercase;">Foundational</span>':"";return`<div class="pad-legislation-item"><span class="bill-name" style="color:var(--text-muted);">${g(b.bill_name||"Unnamed")}${z}</span>${b.date?`<span class="bill-date">${b.date}</span>`:""}</div>`}).join("")),C.length>0&&(T+=`<div style="font-size:0.72rem;color:var(--orange);font-weight:bold;margin:6px 0 4px;">Laws Repealed (${C.length})</div>`,T+=C.map(b=>`<div class="pad-legislation-item"><span class="bill-name">${g(b.bill_name||"Unnamed")}</span><span class="bill-date">${b.date||(b.repealed_tick!=null?ie(b.repealed_tick):"")}</span></div>`).join(""))),!t&&k.length===0&&S.length===0&&C.length===0&&(T+='<div class="pad-section-title">Legislation</div><div class="pad-no-data">No legislative activity during this administration.</div>'),(_.length>0||E.length>0||P.length>0||L.length>0||I.length>0)&&(T+='<div class="pad-section-title">Political Events</div>',_.length>0&&(T+=_.map(b=>{const z=b.result==="passed";return`<div class="pad-legislation-item"><span class="bill-name">Vote of No Confidence</span><span class="bill-date" style="color:${z?"var(--red)":"var(--green)"};">${z?"PASSED":"FAILED"} &middot; ${b.date||ie(b.tick)}</span></div>`}).join("")),E.length>0&&(T+=E.map(b=>{const z=b.result==="passed",ee=z?"var(--red)":"var(--green)",nt=z?"PASSED":"FAILED";return`<div class="pad-legislation-item"><span class="bill-name">${b.type==="impeachment_conviction"?"Impeachment Conviction":"Impeachment Motion"}</span><span class="bill-date" style="color:${ee};">${nt} &middot; ${b.date||ie(b.tick)}</span></div>`}).join("")),L.length>0&&(T+=L.map(b=>`<div class="pad-legislation-item"><span class="bill-name">Snap Election</span><span class="bill-date">${b.date||ie(b.tick)}</span></div>`).join("")),I.length>0&&(T+=I.map(b=>`<div class="pad-legislation-item"><span class="bill-name" style="color:var(--orange);">Minority Government Formed</span><span class="bill-date">${b.date||ie(b.tick)}</span></div>`).join("")),x.length>0&&(T+=`<div style="font-size:0.72rem;color:var(--teal, #5aafa5);font-weight:bold;margin:6px 0 4px;">Leadership Changes (${x.length})</div>`,T+=x.map(b=>`<div class="pad-legislation-item"><span class="bill-name">${g(b.role)}</span><span class="bill-date" style="color:var(--text-dim);">${g(b.description)} &middot; ${b.date||ie(b.tick)}</span></div>`).join("")),P.length>0)){const b={acting_minister:"Acting Minister",emergency_session:"Emergency Session",executive_decree:"Executive Decree",emergency_powers:"Emergency Powers",media_address:"Media Address"};T+=`<div style="font-size:0.72rem;color:var(--amber);font-weight:bold;margin:6px 0 4px;">Executive Orders (${P.length})</div>`,T+=P.map(z=>`<div class="pad-legislation-item"><span class="bill-name">${g(b[z.order_type]||z.order_type)}</span><span class="bill-date">${z.date||ie(z.tick)}</span></div>`).join("")}const Ie=e.trade_agreements||[];if(Ie.length>0){const b={fta:"Free Trade Agreement",pta:"Preferential Trade Agreement",resource_supply:"Resource Supply",export_subsidy:"Export Subsidy",impose_embargo:"Embargo",retaliatory_tariff:"Retaliatory Tariff"};T+=`<div class="pad-section-title">Trade Agreements (${Ie.length})</div>`,T+=Ie.map(z=>`<div class="pad-legislation-item"><span class="bill-name">${g(z.agreement_name||"Unnamed")}</span><span class="bill-date" style="color:var(--text-dim);">${b[z.agreement_type]||z.agreement_type} &middot; ${z.date||ie(z.enacted_at_tick)}</span></div>`).join("")}if(O.length>0){const b={assign_minister:"Appointed",purge_minister:"Purged",fire_minister:"Fired"},z={assign_minister:"var(--green)",purge_minister:"var(--red)",fire_minister:"var(--orange)"};T+=`<div class="pad-section-title">Cabinet Changes (${O.length})</div>`,T+=O.map(ee=>{const nt=b[ee.action_type]||ee.action_type,_i=z[ee.action_type]||"var(--text-dim)",Ta=ee.minister_name?g(ee.minister_name):"Unknown",Pa=ee.ministry?` — ${g(ee.ministry)}`:"";return`<div class="pad-legislation-item"><span class="bill-name">${Ta}${Pa}</span><span class="bill-date" style="color:${_i};">${nt} &middot; ${ee.date||ie(ee.tick)}</span></div>`}).join("")}if(F.length>0){const b={formal_protest:"Formal Protest",recall_ambassador:"Recall Ambassador",impose_embargo:"Embargo",offer_foreign_aid:"Foreign Aid",issue_ultimatum:"Ultimatum",state_visit:"State Visit",covert_gather_intel:"Intelligence Gathering",covert_propaganda:"Propaganda Campaign",covert_bribe:"Bribe Officials",declare_war:"Declaration of War",sue_for_peace:"Peace Offer"};T+=`<div class="pad-section-title">Diplomatic Actions (${F.length})</div>`,T+=F.map(z=>{const ee=b[z.action_type]||z.action_type,nt=z.target_nation?` — ${g(z.target_nation)}`:"";return`<div class="pad-legislation-item"><span class="bill-name">${g(ee)}${nt}</span><span class="bill-date">${z.date||ie(z.tick)}</span></div>`}).join("")}return!t&&w.length>0&&(T+=`
            <div class="pad-stat-table-toggle" onclick="toggleStatTable('${e.id}')">
                <span>All Stat Changes (${w.length})</span>
                <span class="chevron">&#9660;</span>
            </div>
            <div class="pad-stat-table" id="stat-table-${e.id}">
                <table>
                    <thead><tr><th>Stat</th><th>Start</th><th>End</th><th>Change</th></tr></thead>
                    <tbody>
                        ${w.map(b=>{const z=Ea(b.key,b.raw),ee=z===!0?' style="color:var(--green)"':z===!1?' style="color:var(--red)"':"";return`<tr>
                                <td>${zt(b.key)}</td>
                                <td>${it(b.start,b.key)}</td>
                                <td>${it(b.end,b.key)}</td>
                                <td${ee}>${Ut(b.raw,b.key)}</td>
                            </tr>`}).join("")}
                    </tbody>
                </table>
            </div>`),`
        <div class="past-admin-card ${i}" id="admin-card-${e.id}">
            <div class="past-admin-summary" onclick="toggleAdminCard('${e.id}')">
                <div class="past-admin-summary-left">
                    <div class="past-admin-name">
                        ${e.admin_name||"Unknown Administration"}
                        ${y}
                        <span class="past-admin-date">${n}</span>
                    </div>
                    <div class="past-admin-meta">
                        ${H?`<span class="pm-name">${g(e.head_of_state||e.prime_minister||"TBD")}</span> &middot; ${g(e.pm_party_name||"")}`:N?`<span class="pm-name">${g(e.president_name||e.head_of_state||"TBD")}</span> &middot; ${g(e.president_party_name||e.pm_party_name||"")}`:`PM: <span class="pm-name">${e.prime_minister||"TBD"}</span> &middot; ${e.pm_party_name||""}`}
                        ${c?` &middot; ${c}`:""}
                        ${s?` &middot; ${s}/${M.TOTAL_SEATS} seats`:""}
                    </div>
                </div>
                <div class="past-admin-approval">
                    <div class="past-admin-approval-label">Approval</div>
                    <div class="past-admin-approval-value">${u||"—"}</div>
                </div>
                <span class="past-admin-chevron">&#9660;</span>
            </div>
            <div class="past-admin-detail">
                ${T}
            </div>
        </div>`}window.closeAssignModal=ze,window.handleConfirmMinister=On,window.claimPower=Hn,window.resignPMAction=ha,window.resignMinistry=wa,window.purgeMinister=zn,window.fireMinister=ba,window.openAssignModal=Dn,window.denyRequest=Gn,window.unrequestMinistry=jn,window.requestMinistry=Un,window.openNominateModal=Rn,window.selectCandidate=qn,window.fileNoConfidence=Vn,window.callEarlyElections=_a,window.togglePastAdmins=xa,window.toggleStatTable=Sa,window.toggleAdminCard=ka,window.createProposal=Ui,window.openFormation=Rt,window.toggleFormationSupport=Wi,window.toggleProposalParty=zi,window.loadFormationsList=Nt,window.toggleEditCoalition=Xi,window.toggleEditParty=Qi,window.retractProposal=en,window.saveCoalitionEdit=Zi,window.sendFormationChatMessage=Ji,window.formGovernment=tn,window.onMinistryChange=Ki,window.ministryActionSelect=Sn,window.ministryActionConfirm=Pn,window.ministryActionDeselect=tt,window.openDoctrinePanel=hn,window.closeDoctrinePanel=oi,window.switchDoctrineTab=kn,window.beginDoctrineAnnounce=$n,window.confirmDoctrineAnnounce=En,window.beginDoctrineRenounce=An,window.confirmDoctrineRenounce=Cn,window.cancelDoctrineAction=xn,window.protestCrisisAction=In,window.healthcareActionSelect=fn,window.confirmHealthcareAction=vn,window.openPharmaceuticalSelector=dn,window.selectPharmaDirection=mn,window.closePharmaceuticalSelector=pn,window.confirmPharmaceuticalAction=un})();
