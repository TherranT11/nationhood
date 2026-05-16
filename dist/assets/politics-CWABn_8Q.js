import{_supabase as pt}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{r as la}from"./role-actions-GCBcK_AR.js";import{h as da,l as ca,c as Pe,i as pa}from"./common-CgmE4BWM.js";import{t as ge,h as ze}from"./utils-oN1e812_.js";import{P as ht,B as Re,f as ma,b as be,s as xe,S as he,i as Oe,r as oe}from"./coalition-formation-D7LEd9X1.js";import{g as Fe,o as fa,p as va,q as ua,t as ya,V as ga,u as ba,v as xa,w as ha,x as _a}from"./political-actions-DwPhF52h.js";import{a as K,h as kt,b as Be,k as Ht}from"./government-types-BeJIFjWQ.js";import{f as He}from"./government-structure-DBjJ7E-l.js";import{GAME_CONFIG as R,FORMATION_DEADLINE_TICKS as De}from"./config-BdOpHGNJ.js";import{i as wa,g as $a}from"./elections-BqPH4yrG.js";import{c as ka}from"./factions-1eoRseVF.js";import"./preload-helper-BXl3LOEh.js";import"./corp-topbar-6QBAGqD5.js";import"./stats-CBT3qQox.js";import"./electorate-CZHEZpeK.js";import"./presidential-bOjZedr5.js";import"./corp-valuation-DGlSNvB8.js";import"./budget-DCCBVDgw.js";function Ea(a,t){return a.map(e=>{const o=ht.find(i=>i.id===e.platform_key);if(!o)return{...e,stats:[]};const s=o.improve.map(i=>{const n=e.baseline_stats?.[i],l=e.target_stats?.[i],c=Number(t?.[i]??50),f=Re.has(i);if(n==null||l==null)return{stat:i,baseline:c,target:c,current:c,progress:0,met:!1};const p=Math.abs(l-n),r=f?Math.max(0,n-c):Math.max(0,c-n),d=p>0?Math.min(1,r/p):1,y=f?c<=l:c>=l;return{stat:i,baseline:n,target:l,current:c,progress:d,met:y}});return{...e,stats:s,platformDef:o}})}const Ca=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function dt(a){return a>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:a>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:a>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:a>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function Ia(a){var t=Math.max(0,a-20)/65,e=12e4+t*28e4;return Math.round(e/25e3)*25e3}function jt(a,t){return a+Math.floor(Math.random()*(t-a+1))}function _e(a){return a[Math.floor(Math.random()*a.length)]}function Ma(a,t){var e=[],o=new Set,s=jt(5,7),i=Fe(t),n=i.firstNames||[],l=i.lastNames||[];if(n.length===0||l.length===0)return[];for(var c=Ca.slice().sort(function(){return Math.random()-.5}),f=0;f<s;f++){var p,r,d,y=0;do p=_e(n),r=_e(l),d=p+" "+r,y++;while(o.has(d)&&y<20);o.add(d);var u=jt(20,85),v=jt(25,60),h=c[f%c.length],m=Ia(u);e.push({nation_id:a,first_name:p,last_name:r,age:v,skill:u,background:h,hire_cost:m,status:"available"})}return e.sort(function(x,b){return b.skill-x.skill}),e}async function je(a,t,e){var{data:o}=await a.from("nations").select("government_type, monarch_faction_id").eq("id",t).maybeSingle();if(K(o))return ie({partyId:e,admin:null,ministryHolder:!1,nation:o});var[s,i,n,l]=await Promise.all([He(a,t).catch(function(m){return console.warn("[Agitator] fetchActiveCoalition failed:",m?.message||m),null}),a.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),a.from("head_of_government").select("faction_id").eq("nation_id",t).eq("active",!0).maybeSingle(),a.from("presidents").select("faction_id").eq("nation_id",t).eq("is_active",!0).maybeSingle()]);if(i.error)return console.error("[Agitator] Failed to check governing status:",i.error.message),{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var c=i.data,f=s,p=kt(o),r=n?.data?.faction_id||null,d=l?.data?.faction_id||null,y=Array.isArray(f?.party_ids)?f.party_ids.map(function(m){return{party_id:m}}):[];if(c){c.pm_party_id=r,c.president_party_id=d;var u=Array.isArray(c.coalition_parties)?c.coalition_parties:[];u.length===0&&y.length>0&&(c.coalition_parties=y)}else(f||r||d)&&(c={pm_party_id:r,president_party_id:d,coalition_parties:y});var v=!1;if(p){var{count:h}=await a.from("ministries").select("*",{count:"exact",head:!0}).eq("nation_id",t).eq("party_id",e).eq("is_active",!0);v=(h||0)>0}return ie({partyId:e,admin:c,ministryHolder:v,nation:o})}function Sa(a,t,e,o){return ie({partyId:a?.id,admin:t,ministryHolder:e?e.has(a?.id):!1,nation:o})}function ie({partyId:a,admin:t,ministryHolder:e,nation:o}){if(K(o)){var s=o?.monarch_faction_id||null,i=!!(s&&a&&s===a);return{isGoverning:i,isOpposition:!i,label:i?"GOVERNING":"OPPOSITION",administration:null}}if(!t)return{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var n=Array.isArray(t.coalition_parties)?t.coalition_parties:[],l=n.some(function(r){return r?typeof r=="string"?r===a:typeof r=="object"?(r.party_id||r.id)===a:!1:!1}),c=t.pm_party_id===a,f=t.president_party_id===a,p=c||l||f||kt(o)&&!!e;return{isGoverning:p,isOpposition:!p,label:p?"GOVERNING":"OPPOSITION",administration:t}}async function qe(a,t){var{data:e,error:o}=await a.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return o?(console.error("[Agitator] Failed to fetch agitator:",o.message),null):e}async function La(a,t,e){var{data:o,error:s}=await a.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(o&&o.length>0)return o;var i=Ma(t,e),{data:n,error:l}=await a.from("agitator_pool").insert(i).select("*");return l?(console.error("[Agitator] Failed to insert pool:",l.message),[]):(n||[]).sort(function(c,f){return f.skill-c.skill})}async function Na(a,t,e,o){var s=await qe(a,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:i,error:n}=await a.from("faction_agitators").insert({faction_id:t,first_name:e.first_name,last_name:e.last_name,age:e.age,skill:e.skill,background:e.background,status:"active",hired_at_tick:o}).select("*").single();if(n)return console.error("[Agitator] Failed to hire:",n.message),{success:!1,agitator:null,error:n.message};var{error:l}=await a.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",e.id);return l&&console.error("[Agitator] Failed to mark pool candidate as hired:",l.message),{success:!0,agitator:i,error:null}}const Pt=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],Ue=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function me(a){return a<=5?{tier:1,label:"Clean Government",color:"#c55"}:a<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:a<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const it={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5},gov:{momentum:3}},2:{resolution:"PARTIAL WIN",filer:{momentum:3},gov:{momentum:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7},gov:{momentum:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12},gov:{momentum:-10}}},we={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function yt(a,t){var e=a;for(var o in t)e=e.split("{"+o+"}").join(t[o]);return e}async function Aa(a,t){var{factionId:e,nationId:o,agitatorId:s,targetMinistry:i,basis:n,currentTick:l,partyName:c,administration:f}=t,p,r,d;if(n==="civil_rights"){var y=Number(f?.stats_at_start?.freedom_index??50);r=50,p=y,d=Math.max(0,p-r)}else{var u=Number(f?.stats_at_start?.corruption??50);r=50,p=u,d=Math.max(0,r-p)}var u=p,v=r,h=me(d),m=it[h.tier],x=l+8,b=Pt.find(function(A){return A.key===i}),_=b?"Ministry of "+b.label:i,M=Ue.find(function(A){return A.key===n}),C=M?M.label:n,{data:E,error:$}=await a.from("lawsuits").insert({faction_id:e,nation_id:o,agitator_id:s,target_ministry:i,basis:n,filed_at_tick:l,resolves_at_tick:x,corruption_at_start:u,corruption_at_filing:v,corruption_growth:d,tier:h.tier,status:"active",resolution:null,momentum_effect:m.filer.momentum,gov_momentum_effect:m.gov.momentum}).select("*").single();if($)return{success:!1,lawsuit:null,tier:0,error:$.message};var S=we[h.tier]||we[1],L={party:c||"Opposition",ministry:_,basis:C},T=[{event_tick:l,event_type:"filing",headline:yt(S.filing,L)},{event_tick:l+2,event_type:"discovery",headline:yt(S.discovery,L)},{event_tick:l+5,event_type:"evidence",headline:yt(S.evidence,L)},{event_tick:l+7,event_type:"pre_trial",headline:yt(S.pre_trial,L)},{event_tick:x,event_type:"resolution",headline:yt(S.resolution,L)}],P=T.map(function(A){return{lawsuit_id:E.id,nation_id:o,event_tick:A.event_tick,event_type:A.event_type,headline:A.headline,is_fired:A.event_tick===l}}),{error:I}=await a.from("lawsuit_events").insert(P);I&&console.error("[Lawsuits] Failed to insert milestone events:",I.message);var{error:N}=await a.from("event_log").insert({nation_id:o,event_name:"LAWSUIT FILED",event_type:"lawsuit",category:"political",description_chosen:T[0].headline,fired_at_tick:l,faction_id:e||null,effects_applied:{lawsuit_id:E.id,tier:h.tier,target_ministry:_,basis:C,milestone:"filing"}});return N&&console.warn("[Lawsuits] event_log insert (filing) failed:",N.message),{success:!0,lawsuit:E,tier:h.tier,error:null}}async function Ta(a,t){var{data:e,error:o}=await a.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return o?(console.error("[Lawsuits] Failed to fetch lawsuits:",o.message),[]):e||[]}async function Pa(a,t,e){const o=[],s=t.overreach_count??0,i=s>=R.IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD;o.push({type:"abuse_of_power",label:"Abuse of Power",available:i,reason:i?"":`Requires presidential overreach ≥ ${R.IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD} (currently ${s})`});const n=t.gov_approval??40,l=R.IMPEACHMENT_INCOMPETENCE_TICKS;let c=!1,f="";if(e&&e.faction_id){const{data:m}=await a.from("factions").select("nation_id, abandoned_at, is_banned").eq("id",e.faction_id).maybeSingle(),x=ka(m);x&&(c=!0,f=x==="unassigned"?"unassigned to any nation":x)}let p=!1,r=0;if(n<=R.IMPEACHMENT_INCOMPETENCE_THRESHOLD){const{data:m}=await a.from("nations_history").select("tick, gov_approval").eq("nation_id",t.id).order("tick",{ascending:!1}).limit(l);r=(m||[]).filter(x=>x.gov_approval<=R.IMPEACHMENT_INCOMPETENCE_THRESHOLD).length,p=m&&m.length>=l&&r>=l}const d=c||p;let y="Gross Incompetence",u="";d?c&&(y=`Gross Incompetence (party ${f})`):u=`Requires gov approval ≤ ${R.IMPEACHMENT_INCOMPETENCE_THRESHOLD} for ${l} consecutive ticks (${r}/${l} met, currently ${Math.round(n)}), or the president's party to become inactive`,o.push({type:"incompetence",label:y,available:d,reason:u});let v=0;if(e){const{data:m}=await a.from("bills").select("id, bill_support(stance, seat_count)").eq("nation_id",t.id).eq("president_action","vetoed").gte("president_action_tick",e.elected_tick||0),x=Math.ceil(R.TOTAL_SEATS*(2/3));for(const b of m||[]){let _=0;for(const M of b.bill_support||[])(M.stance==="accept"?"yes":M.stance==="reject"?"no":M.stance)==="yes"&&(_+=M.seat_count||0);_>=x&&v++}}const h=v>=R.IMPEACHMENT_VETO_ABUSE_COUNT;return o.push({type:"constitutional_violation",label:"Constitutional Violation",available:h,reason:h?"":`Requires ≥ ${R.IMPEACHMENT_VETO_ABUSE_COUNT} vetoed bills with ⅔ support (currently ${v})`}),o}function ct(a){return String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}async function za(a,t){const{faction:e,nation:o,president:s,isPresidentParty:i,mySeats:n,currentTick:l}=t||{};if(!e||!o||!s)return{ok:!1};if((n||0)<1)return alert("Need at least 1 seat in the legislature to file impeachment."),{ok:!1};if(i)return alert("The president's own party cannot file impeachment."),{ok:!1};const{data:c}=await a.from("impeachment_proceedings").select("id").eq("nation_id",o.id).neq("phase","resolved").limit(1).maybeSingle();if(c)return alert("An impeachment proceeding is already active."),{ok:!1};if(o.impeachment_cooldown_until_tick&&l<o.impeachment_cooldown_until_tick){const m=o.impeachment_cooldown_until_tick-l;return alert(`Impeachment cooldown: ${m} tick${m!==1?"s":""} remaining.`),{ok:!1}}const f=await Pa(a,o,s);if(!f.some(m=>m.available))return alert("No impeachment charges are currently available. All charges require specific preconditions to be met."),{ok:!1};const p=f.map(m=>{const x=m.available?"":"disabled",b=m.available?"":"opacity:0.4;",_=m.reason?` title="${ct(m.reason)}"`:"";return`<label style="display:block;margin:8px 0;${b}"${_}>
            <input type="checkbox" name="impeach-charge" value="${ct(m.type)}" ${x} style="margin-right:8px;">
            <strong>${ct(m.label)}</strong>${m.reason?` <span style="font-size:0.7rem;color:var(--text-secondary);">(${ct(m.reason)})</span>`:""}
        </label>`}).join(""),r=document.createElement("div");r.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;",r.innerHTML=`
        <div style="background:var(--bg-panel);border:1px solid var(--border-0);border-radius:3px;padding:24px;max-width:440px;width:90%;max-height:80vh;overflow-y:auto;">
            <div style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--red);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;">⚖ IMPEACH PRESIDENT</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">
                President ${ct(s.first_name)} ${ct(s.last_name)}
            </div>
            <div style="font-size:0.8rem;color:var(--text-primary);margin-bottom:12px;">Select at least one charge:</div>
            <div id="impeach-charges-list">${p}</div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-hair);font-size:0.75rem;color:var(--text-secondary);line-height:1.5;">
                <div>Cost: <strong style="color:var(--amber);">FREE</strong></div>
                <div>Committee debate: ${R.IMPEACHMENT_COMMITTEE_TICKS} ticks → Floor vote: ${R.IMPEACHMENT_MOTION_VOTING_TICKS} ticks</div>
                <div>Requires <strong style="color:var(--green);">simple majority</strong> (50%+1 of all seats) to impeach</div>
                <div style="margin-top:6px;">If impeached → Trial: ${R.IMPEACHMENT_TRIAL_TICKS}-tick conviction vote (⅔ supermajority)</div>
            </div>
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button id="impeach-cancel-btn" style="flex:1;padding:10px;background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border-0);border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Cancel</button>
                <button id="impeach-confirm-btn" style="flex:1;padding:10px;background:var(--red);color:#fff;border:none;border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">File Impeachment</button>
            </div>
        </div>`,document.body.appendChild(r);const d=await new Promise(m=>{r.querySelector("#impeach-cancel-btn").addEventListener("click",()=>m(null)),r.addEventListener("click",x=>{x.target===r&&m(null)}),r.querySelector("#impeach-confirm-btn").addEventListener("click",()=>{const x=[...r.querySelectorAll('input[name="impeach-charge"]:checked')].map(b=>b.value);if(x.length===0){alert("Select at least one charge.");return}m(x)})});if(r.remove(),!d)return{ok:!1};const y=d.map(m=>{const x=f.find(b=>b.type===m);return{type:m,label:x.label}}),u=`${s.first_name} ${s.last_name}`,v=`Articles of Impeachment Against President ${u}`,h=y.map(m=>m.label).join(", ");try{const{data:m}=await a.from("shard").select("current_tick").eq("name","Alpha Shard").single(),x=m?.current_tick||0,{data:b,error:_}=await a.from("impeachment_proceedings").insert({nation_id:o.id,president_id:s.id,initiated_by_faction_id:e.id,charges:y,phase:"motion_committee",created_at_tick:x}).select().single();if(_)throw _;const{data:M,error:C}=await a.from("bills").insert({nation_id:o.id,proposed_by:e.id,proposed_tick:x,bill_name:v,bill_type:"impeachment_motion",status:"committee",impeachment_id:b.id,proposer_name:e.faction_name,proposer_color:e.party_color,preamble:`This motion, filed by the ${e.faction_name}, calls for the impeachment of President ${u} on the following charges: ${h}. After ${R.IMPEACHMENT_COMMITTEE_TICKS} ticks of committee debate, the motion will proceed to a floor vote requiring an absolute majority (${R.MAJORITY_SEATS} of ${R.TOTAL_SEATS} seats) to pass.`}).select().single();if(C)throw C;await a.from("impeachment_proceedings").update({motion_bill_id:M.id}).eq("id",b.id);const{count:E}=await a.from("impeachment_proceedings").select("id",{count:"exact",head:!0}).eq("nation_id",o.id).neq("phase","resolved");if(E>1)return await a.from("bills").delete().eq("id",M.id),await a.from("impeachment_proceedings").delete().eq("id",b.id),alert("Another impeachment proceeding was just filed. Please refresh."),{ok:!1};await a.from("bill_support").upsert({bill_id:M.id,faction_id:e.id,stance:"yes",seat_count:n},{onConflict:"bill_id,faction_id"});const{error:$}=await a.from("event_log").insert({nation_id:o.id,event_name:`Impeachment Motion Filed Against President ${u}`,category:"government",trigger_key:"impeachment_motion_filed",description_chosen:`The ${e.faction_name} has filed articles of impeachment against President ${u}. Charges: ${h}. A ${R.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate will precede the floor vote.`,fired_at_tick:x});return $&&console.warn("[impeachment] event_log insert failed:",$.message),alert(`⚖ "${v}" has been filed!

${R.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate begins now. The motion will then proceed to a floor vote.`),window.location.href=`bill.html?id=${M.id}`,{ok:!0,billId:M.id}}catch(m){return console.error("[impeachment] file failed:",m?.message||m),alert("Error: "+(m?.message||m)),{ok:!1}}}let k=null,g=null,V="leader",Z=[],fe=[],q=null,F=null,rt=!1,B=null,ft=[],ne=[],mt=!1,ot=null,W=null,_t=!1;const qt=new Set;let st=null,H=null,tt=!1,bt=[],Mt=!1,Ut=!1,At=new Set;function w(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function X(a,t){return((a||"?")[0]+(t||"?")[0]).toUpperCase()}const Ge=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}];let wt=0,zt=0,re=!1,G={eligible:!1,lockReason:"Loading...",metaLine:""};async function Ra(){if(!k||!g?.faction?.id||!g?.shard?.current_tick)return;const{count:a,error:t}=await k.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",g.faction.id).eq("action_type","fundraise").eq("tick_performed",g.shard.current_tick);wt=!t&&a!=null?a:0}async function Oa(){if(zt=0,re=!1,!k||!g?.nation?.id||!g?.shard?.current_tick)return;const a=g.shard.current_tick,t=B?.pm_party_id;try{const{data:e}=await k.from("bills").select("id").eq("nation_id",g.nation.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(re=!!(e&&e.length),t){const{data:o}=await k.from("campaign_actions").select("tick_performed").eq("nation_id",g.nation.id).eq("action_type","no_confidence_filed").eq("target_id",t).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(o){const s=a-Number(o.tick_performed||0),i=typeof R<"u"&&R.NO_CONFIDENCE_COOLDOWN_TICKS||12;zt=Math.max(0,i-s)}}}catch(e){console.warn("[PartyActions] loadNoConfidenceState failed:",e?.message||e)}}async function Fa(){if(G={eligible:!1,lockReason:"Loading...",metaLine:""},!k||!g?.nation?.id||!g?.faction?.id)return;const a=g.nation,t=g.faction,e=Number(g?.shard?.current_tick)||0,o=(a.government_type||"").toLowerCase();if(o.includes("absolute monarchy")||o.includes("absolute_monarchy")){G={eligible:!1,lockReason:"Only available in parliamentary systems.",metaLine:""};return}if((t.seats||0)<=0){G={eligible:!1,lockReason:"Your party has no parliamentary seats.",metaLine:""};return}if(W&&(W.status==="formed"||W.status==="caretaker")){G={eligible:!1,lockReason:W.formation_type==="emergency_minority"?"A minority government is already in place.":"A government is already in place.",metaLine:"Active Coalition"};return}const{data:s}=await k.from("elections").select("id, election_tick").eq("nation_id",a.id).eq("status","completed").not("results","is",null).order("election_tick",{ascending:!1}).limit(1).maybeSingle();if(!s){G={eligible:!1,lockReason:"No completed election to form a government from.",metaLine:"No election yet"};return}const i=Number(s.election_tick||0),n=De,l=i+n,c=e-i,f=`Last election: ${ge(i)} · Becomes available ${ge(l)}`;if(c<n){const b=n-c;G={eligible:!1,lockReason:`Coalition window still open: ${b} tick${b!==1?"s":""} remaining.`,metaLine:f};return}const p=Number(a.total_seats)||100,r=Math.floor(p/2)+1,{data:d,error:y}=await k.from("factions").select("id, faction_name, seats, last_seen_tick").eq("nation_id",a.id).eq("faction_type","party");if(y){G={eligible:!1,lockReason:"Could not load party state.",metaLine:f};return}const u=d||[];if(u.some(b=>(b.seats||0)>=r)){G={eligible:!1,lockReason:"A party already holds an outright majority — form a normal government instead.",metaLine:f};return}const h=4,x=u.filter(b=>(b.seats||0)>0&&(Number(b.last_seen_tick)||0)>=e-h).sort((b,_)=>(_.seats||0)-(b.seats||0)||(b.id<_.id?-1:1))[0];if(!x){G={eligible:!1,lockReason:"No active parties qualify to form a government.",metaLine:f};return}if(x.id!==t.id&&!da()){G={eligible:!1,lockReason:`Only the largest active party (${x.faction_name||"unknown"}) may form a minority government.`,metaLine:f};return}G={eligible:!0,lockReason:"",metaLine:f}}const Ve=[{id:"fundraise",name:"Fundraise",desc:"Host a themed event for one voter bloc. Once per tick. Costs −0.3 popularity with the host bloc (donor fatigue) and −0.5 with a paired opposition bloc (optics). Yields cash to party funds based on your rapport with the host bloc and its national weight. Corporate Gala is positioning-only.",cost:"ACTION",costColor:"#c8a832",moneyCost:0,tags:["CAMPAIGN","POSITIONING"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1},{id:"no_confidence",name:"Vote of No Confidence",desc:"File a motion of no confidence against the Prime Minister. If a simple majority votes YES, the government falls and snap elections are triggered. PASS: +15 Momentum to you, -10 Momentum to the PM’s party. FAIL: -10 Momentum to you. 12-tick cooldown on the targeted PM party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1},{id:"leadership_challenge",name:"Leadership Challenge",desc:"Claim the vacant Premiership for your party leader. Available only when there is no sitting Prime Minister. If multiple coalition parties claim on the same tick, the largest-by-seats wins (earliest claim breaks ties). Winning parties get a one-time +0.3 popularity boost across all voter sectors.",cost:"COALITION ONLY",costColor:"#c8a832",moneyCost:0,tags:["GOVERNMENT","COALITION"],locked:!1},{id:"form_coalition",name:"Form Coalition",desc:"Open the coalition formation flow when no coalition government exists — invite parties, assemble at least the majority threshold of seats, then assign ministries and install a new Prime Minister. If a coalition exists but the PM is vacant, coalition members should use Leadership Challenge instead.",cost:"GOVERNMENT",costColor:"#c8a832",moneyCost:0,tags:["GOVERNMENT","COALITION"],locked:!1},{id:"form_minority_government",name:"Form Minority Government",desc:"Deadlock breaker. After the coalition window closes (3 ticks post-election) with no government formed, the leader of the largest active party can govern alone. Bills pass with -20% effective YES votes; a snap election fires automatically in 36 ticks if a stable coalition isn't formed before then.",cost:"GOVERNMENT",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","DEADLOCK"],locked:!1},{id:"leave_coalition",name:"Leave Coalition",desc:"Walk out of the current governing coalition. Any ministries your party holds are vacated. You drop from governing to opposition. Coalition flips to minority if your exit drops it below the majority threshold. Cost: −3 Momentum to you, −5 Momentum to the PM’s party. 12-tick cooldown. PM’s party cannot use this — resign first.",cost:"−3 MOM",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","RISKY"],locked:!1},{id:"disband_party",name:"Disband Party",desc:"Voluntarily dissolve your party. Your seats are vacated and sit empty until the next election (no backfill or redistribution). All party funds and momentum are lost. You are removed from every nation chat. Cannot be undone. 24-tick cooldown per user. Cannot be used while Prime Minister, sitting President, or reigning Monarch — step down first.",cost:"IRREVERSIBLE",costColor:"#c55",moneyCost:0,tags:["IRREVERSIBLE"],locked:!1}],Ba=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases crown authority (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Crown Authority per seat revoked. Use sparingly — the nobles do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Et={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},$e=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],ke=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function Ye(a,t){k=a,g=t;const e=document.getElementById("pa-actions-root");if(!e)return;const o=t.faction;if(!o){e.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}try{const{data:r}=await k.from("factions").select("momentum, party_funds, seats, action_points, bloc_id, last_petition_for_reform_tick").eq("id",o.id).single();r&&(o.momentum=r.momentum??o.momentum,o.party_funds=r.party_funds??o.party_funds,o.seats=r.seats??o.seats,o.action_points=r.action_points??o.action_points,o.bloc_id=r.bloc_id??null,o.last_petition_for_reform_tick=r.last_petition_for_reform_tick??null)}catch(r){console.warn("[PartyActions] faction refresh failed, using cached state:",r)}try{const r=t.nation?.id;if(r){const{data:d}=await k.from("petitions").select("id").eq("nation_id",r).eq("status","pending").maybeSingle();o._petitionPending=!!d}}catch(r){console.warn("[PartyActions] petition-pending check failed:",r?.message||r),o._petitionPending=!1}const[s,i,n,l,c,f]=await Promise.all([k.from("faction_platforms").select("*").eq("faction_id",o.id).order("slot"),k.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),qe(k,o.id),je(k,t.nation?.id,o.id),k.from("faction_electoral_standing").select("visibility, raw_appeal").eq("faction_id",o.id).eq("nation_id",t.nation?.id).maybeSingle(),He(k,t.nation?.id)]);W=f||null,t.nation&&(t.nation.__coalition_status=f?.status||null),s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),i.error&&console.error("[PartyActions] Failed to load nation platforms:",i.error.message),Z=s.data||[],fe=i.data||[],q=n,rt=l.isOpposition,B=l.administration,c.data,await Ra(),await Oa(),await Fa();try{const[{data:r},{data:d}]=await Promise.all([k.from("head_of_government").select("id, faction_id, active").eq("nation_id",t.nation?.id).eq("active",!0).maybeSingle(),k.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);ot=r||null;const y=Number(d?.current_tick)||0,{data:u}=await k.from("leadership_challenges").select("id").eq("nation_id",t.nation?.id).eq("faction_id",o.id).is("resolved_at_tick",null).gte("claimed_at_tick",y-1).limit(1).maybeSingle();_t=!!u}catch(r){console.warn("[PartyActions] HOG / leadership claim state load failed:",r?.message||r),ot=null,_t=!1}const{data:p}=await k.from("faction_deputies").select("*").eq("faction_id",o.id).eq("status","active").maybeSingle();if(F=p||null,st=null,t.nation?.id&&(t.nation.government_type||"").toLowerCase().includes("presidential")){const{data:d}=await k.from("presidents").select("id, faction_id, first_name, last_name, elected_tick").eq("nation_id",t.nation.id).eq("is_active",!0).maybeSingle();st=d||null}if(ft=[],o?.id&&t.nation?.id){const{data:r,error:d}=await k.from("ministries").select("id, ministry_key, party_id, is_active, minister_first_name, minister_last_name, minister_age, discretionary_balance").eq("nation_id",t.nation.id).eq("party_id",o.id).eq("is_active",!0);d?console.warn("[PartyActions] ministries fetch failed:",d.message):ft=(r||[]).filter(y=>y.minister_first_name)}q&&(ne=await Ta(k,o.id)),await Ct(o.id,t.nation?.id),O(e)}function ve(a){return a?{isPM:!!B&&B.pm_party_id===a.id,isPresident:g?.nation?.hos_election_method==="elected"&&B?.president_party_id===a.id,isMonarchActing:K(g?.nation)&&g?.nation?.monarch_faction_id===a.id}:{isPM:!1,isPresident:!1,isMonarchActing:!1}}async function Ct(a,t){if(!a||!t){H=null,tt=!1,bt=[];return}try{const{data:e,error:o}=await k.from("bloc_invitations").select("id, bloc_id, invited_by_faction_id, created_at_tick, status, bloc:bloc_id(id,name,leader_faction_id), inviter:invited_by_faction_id(id,faction_name,party_color)").eq("invited_faction_id",a).eq("status","pending").order("created_at_tick",{ascending:!1});if(o)throw o;bt=e||[];const s=g?.faction?.bloc_id||null;if(s){const{data:i,error:n}=await k.from("blocs").select("*").eq("id",s).is("dissolved_at_tick",null).maybeSingle();if(n)throw n;if(i){const{data:l}=await k.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name").eq("bloc_id",i.id).order("seats",{ascending:!1});H={...i,members:l||[]},tt=i.leader_faction_id===a}else H=null,tt=!1}else H=null,tt=!1}catch(e){console.warn("[PartyActions] loadBlocState failed:",e?.message||e)}}function We(a){if(!H)return"";const t=tt?`<span style="margin-left:6px;font-family:var(--font-mono);font-size:7px;color:${a};letter-spacing:0.08em;">LEADER</span>`:"";return`<span class="pa-bloc-tag" style="display:inline-flex;align-items:center;padding:2px 8px;background:${a}18;border:1px solid ${a}55;color:${a};font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        BLOC &middot; ${w(H.name)}${t}
    </span>`}function Ke(a){if(!H)return"";const t=H.members||[],e=t.reduce((s,i)=>s+(Number(i.seats)||0),0),o=t.map(s=>{const i=s.id===H.leader_faction_id,n=s.party_color||a;return`<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid ${n}44;border-left:3px solid ${n};background:var(--bg-card);font-family:var(--font-mono);font-size:9px;">
            <span style="color:var(--text-bright);font-weight:700;">${w(s.faction_name||"Unknown")}</span>
            <span style="color:var(--text-dim);">${s.seats||0} seats</span>
            ${i?`<span style="color:${n};font-weight:700;letter-spacing:0.08em;">LEADER</span>`:""}
        </span>`}).join("");return`<div style="margin:8px 0;padding:8px 12px;background:${a}0a;border:1px solid ${a}33;border-left:3px solid ${a};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${a};letter-spacing:0.08em;">BLOC &middot; ${w(H.name)}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${t.length} member${t.length!==1?"s":""} &middot; ${e} combined seats</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${o}</div>
    </div>`}function Je(a){if(!bt||bt.length===0)return"";const t=o=>(Array.isArray(o)?o[0]:o)||null;return`<div style="margin:10px 0 4px;">${bt.map(o=>{const s=t(o.bloc),i=t(o.inviter),n=s?.name||"a bloc",l=i?.faction_name||"A party leader",c=i?.party_color||a,f=At.has(o.id);return`<div style="margin:6px 0;padding:8px 12px;border:1px solid ${c}55;border-left:3px solid ${c};background:${c}08;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="flex:1;">
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${c};letter-spacing:0.08em;">BLOC INVITATION</div>
                <div style="font-size:11px;color:var(--text-bright);margin-top:2px;">
                    <strong>${w(l)}</strong> invites you to join <strong>${w(n)}</strong>.
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--submit" data-invite-id="${w(o.id)}" data-decision="accept"${f?" disabled":""}>Accept</button>
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--cancel" data-invite-id="${w(o.id)}" data-decision="decline"${f?" disabled":""}>Decline</button>
            </div>
        </div>`}).join("")}</div>`}async function ue(a){const{data:t}=await k.from("factions").select("bloc_id, momentum").eq("id",a).single();t&&(g.faction.bloc_id=t.bloc_id||null,t.momentum!=null&&(g.faction.momentum=t.momentum))}async function Ha(a,t,e){try{const o=g?.faction?.id;if(!o)throw new Error("No active faction");const s=t==="accept"?"accept_bloc_invite":"decline_bloc_invite",i=t==="accept"?"p_accepting_faction_id":"p_declining_faction_id",{data:n,error:l}=await k.rpc(s,{p_invitation_id:a,[i]:o});if(l)throw l;if(n&&n.success===!1)throw new Error(n.error||"Unknown error");await ue(o),await Ct(o,g.nation?.id),O(e)}catch(o){console.error("[PartyActions] respondToBlocInvite failed:",o),alert(t==="accept"?`Could not accept invitation: ${o.message||o}`:`Could not decline invitation: ${o.message||o}`)}}async function Da(a){if(!H||Ut)return;const t=H,e=tt?`Leaving ${t.name} will DISSOLVE the entire bloc. All ${t.members?.length||0} members will be removed and pending invitations rescinded.

Proceed?`:`Leave the ${t.name} bloc?`;if(confirm(e)){Ut=!0;try{const{data:o,error:s}=await k.rpc("leave_bloc",{p_faction_id:g.faction.id});if(s)throw s;if(o&&o.success===!1)throw new Error(o.error||"Unknown error");await ue(g.faction.id),await Ct(g.faction.id,g.nation?.id),O(a)}catch(o){console.error("[PartyActions] leave_bloc failed:",o),alert(`Could not leave bloc: ${o.message||o}`)}finally{Ut=!1}}}async function ja(a){const t=document.getElementById("pa-bloc-modal");if(!t||H)return;const e=g.faction,o=e?.color||"#c8a832";t.innerHTML=`
        <div class="pa-modal" style="width:640px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${o};"></div>
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
    `,t.classList.add("active");const s=new Set;let i=[];const n=()=>t.classList.remove("active");document.getElementById("pa-bloc-close")?.addEventListener("click",n),document.getElementById("pa-bloc-cancel")?.addEventListener("click",n),t.addEventListener("click",r=>{r.target===t&&n()});try{const r=g.nation?.id,{data:d}=await k.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name, leader_age, bloc_id").eq("nation_id",r).eq("faction_type","party").is("abandoned_at",null),y=(d||[]).filter(v=>v.id!==e.id);i=y;const u=document.getElementById("pa-bloc-party-list");if(!u)return;if(y.length===0){u.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No other parties in this nation.</div>';return}u.innerHTML=y.map(v=>{const h=v.party_color||"#7a7a7a",m=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"Party Leader",x=v.bloc_id?"Already in a bloc":null;return`<label class="pa-bloc-party-row" data-party-id="${w(v.id)}" data-ineligible="${x?"1":"0"}"
                style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border-mid);border-left:3px solid ${h};cursor:${x?"not-allowed":"pointer"};opacity:${x?"0.45":"1"};">
                <input type="checkbox" class="pa-bloc-party-check" ${x?"disabled":""} style="margin:0;">
                <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:baseline;gap:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${w(v.faction_name)}</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${v.seats||0} seats</span>
                    </div>
                    <div style="font-size:9px;color:var(--text-secondary);">${w(m)}</div>
                    ${x?`<div style="font-family:var(--font-mono);font-size:8px;color:var(--orange);margin-top:3px;">${x}</div>`:""}
                </div>
            </label>`}).join(""),u.addEventListener("change",v=>{const h=v.target.closest(".pa-bloc-party-row");if(!h)return;if(h.dataset.ineligible==="1"){v.target.checked=!1;return}const m=h.dataset.partyId;v.target.checked?s.add(m):s.delete(m),p()})}catch(r){console.error("[PartyActions] Create Bloc modal fetch failed:",r);const d=document.getElementById("pa-bloc-party-list");d&&(d.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${w(r.message||String(r))}</div>`)}const l=document.getElementById("pa-bloc-name"),c=document.getElementById("pa-bloc-submit"),f=document.getElementById("pa-bloc-name-count"),p=()=>{const r=(l?.value||"").trim();f&&(f.textContent=`${r.length} / 40`),c&&(c.disabled=!(r.length>0&&s.size>0)||Mt)};l?.addEventListener("input",p),c?.addEventListener("click",async()=>{if(Mt)return;const r=(l?.value||"").trim();if(!(r.length===0||s.size===0)){Mt=!0,c.disabled=!0,c.textContent="Creating...";try{const{data:d,error:y}=await k.rpc("create_bloc",{p_leader_faction_id:e.id,p_name:r,p_invitee_faction_ids:Array.from(s)});if(y)throw y;if(d&&d.success===!1)throw new Error(d.error||"Unknown error");g.faction.party_funds=Math.max(0,(g.faction.party_funds||0)-1e5),await ue(e.id),n(),await Ct(e.id,g.nation?.id),O(a)}catch(d){console.error("[PartyActions] create_bloc failed:",d),alert(`Could not create bloc: ${d.message||d}`),c.disabled=!1,c.textContent="Create Bloc & Send Invites"}finally{Mt=!1}}})}async function qa(a){if(!H||!tt)return;const t=document.getElementById("pa-bloc-modal");if(!t)return;const e=g.faction?.color||"#c8a832";t.innerHTML=`
        <div class="pa-modal" style="width:520px;max-height:75vh;overflow:hidden;display:flex;flex-direction:column;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${e};"></div>
                    <span class="pa-modal-title">Invite to ${w(H.name)}</span>
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
        </div>`,t.classList.add("active");const o=()=>t.classList.remove("active");document.getElementById("pa-blinv-close")?.addEventListener("click",o),document.getElementById("pa-blinv-cancel")?.addEventListener("click",o),t.addEventListener("click",n=>{n.target===t&&o()});const s=g.nation?.id,i=document.getElementById("pa-blinv-list");if(!(!i||!s))try{const{data:n,error:l}=await k.from("factions").select("id, faction_name, seats, party_color, bloc_id").eq("nation_id",s).eq("faction_type","party").is("abandoned_at",null).is("bloc_id",null);if(l){i.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${w(l.message)}</div>`;return}const c=(n||[]).filter(f=>f.id!==g.faction.id);if(c.length===0){i.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No eligible parties to invite.</div>';return}i.innerHTML=c.map(f=>{const p=f.party_color||"#888";return`<div class="pa-blinv-row" data-faction-id="${w(f.id)}" style="padding:8px 10px;border:1px solid ${p}33;border-left:3px solid ${p};display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:var(--bg-card);">
                <div>
                    <div style="font-size:11px;color:var(--text-bright);font-weight:600;">${w(f.faction_name||"Unknown")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${f.seats||0} seats</div>
                </div>
                <button class="pa-modal-btn pa-modal-btn--submit pa-blinv-send" data-faction-id="${w(f.id)}">Invite</button>
            </div>`}).join(""),i.addEventListener("click",async f=>{const p=f.target.closest(".pa-blinv-send");if(!p)return;const r=p.dataset.factionId;if(r){p.disabled=!0,p.textContent="Sending…";try{const{error:d}=await k.rpc("invite_to_bloc",{p_bloc_id:H.id,p_invitee_faction_id:r});if(d)throw d;p.textContent="Invited",await Ct(g.faction.id,g.nation?.id),O(a)}catch(d){console.warn("[PartyActions] invite_to_bloc failed:",d),alert(`Could not invite: ${d.message||d}`),p.disabled=!1,p.textContent="Invite"}}})}catch(n){console.warn("[PartyActions] openInviteToBlocModal threw:",n),i.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Unexpected error.</div>'}}function O(a){const t=g.faction,e=g.nation,o=K(e),s=o&&e?.monarch_faction_id===t?.id,i=t.color||"#c8a832",n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",l=t.seats||0,c=e?.total_seats||120,f=c>0?Math.round(l/c*100):0;t.action_points,t.approval_rating;const p=t.momentum??50,r=t.party_funds??0,d=Ea(Z,e),y=[];for(let m=1;m<=3;m++){const x=Z.find(b=>b.slot===m);if(x){const b=ht.find(E=>E.id===x.platform_key),_=d.find(E=>E.id===x.id),M=_?_.stats.filter(E=>E.met).length:0,C=_?_.stats.length:0;y.push({name:b?.name||x.platform_key,status:x.status,metCount:M,totalCount:C,slot:m})}else y.push(null)}const u=y.map(m=>{if(!m)return{label:"No Platform"};const x=m.status==="fulfilled"?" ✓":m.status==="failed"?" ✗":m.status==="abated"?" —":"",b=m.status==="fulfilled"?"fulfilled":m.status==="failed"?"failed":m.status==="abated"?"abated":"filled",_=m.totalCount>0?` (${m.metCount}/${m.totalCount})`:"";return{label:m.name+_+x,statusClass:b,title:`${m.metCount} of ${m.totalCount} stats on target`}}),v="$"+(r>=1e6?(r/1e6).toFixed(1)+"M":r>=1e3?Math.round(r/1e3)+"k":r),h=Math.round(Number(o?g.nation?.crown_authority??50:g.nation?.gov_approval??0));la(a,{title:s?"Royal Court":"Party Actions",entityName:t.faction_name,entityColor:i,stats:[{label:"Party Funds",value:v,color:"var(--accent)"},{label:"Momentum",value:Number(p).toFixed(1),color:p>0?"var(--text-bright)":"var(--red)"},{label:o?"Crown Authority":"Nat. Approval",value:String(h),color:"var(--green)"}],statusBarItems:[{type:"count",label:"Seats",big:String(l),bigColor:i,dim1:`/ ${c}`,dim2:`(${f}%)`},{type:"list",label:"Platforms",items:u}],rolesContainerId:"pa-leaders",panelContainerId:"pa-actions-panel",extraHtml:`
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
            <div class="pa-modal-overlay" id="pa-vola-invest-modal"></div>
            <div class="pa-modal-overlay" id="pa-vola-stadium-modal"></div>
            <div class="pa-modal-overlay" id="pa-vola-host-bid-modal"></div>
            <div class="pa-modal-overlay" id="pa-debt-payment-modal"></div>
            <div class="pa-modal-overlay" id="pa-expand-infra-modal"></div>
        `}),document.getElementById("pa-leaders").innerHTML=Ua(n,i,t),document.getElementById("pa-actions-panel").innerHTML=ye(n,i,t);for(const m of Object.keys(Rt))ea(m);document.getElementById("pa-leaders")?.addEventListener("click",m=>{const x=m.target.closest(".pa-leader-card");if(!x||x.classList.contains("vacant"))return;const b=x.dataset.role;b&&b!==V&&(V=b,O(a))}),document.getElementById("pa-actions-panel")?.addEventListener("click",m=>{const x=m.target.closest(".pa-action-item");if(!x||x.classList.contains("locked"))return;const b=x.dataset.actionId;if(b==="fundraise")To(a);else if(b==="grant_seats")_o(a);else if(b==="revoke_seats")wo(a);else if(b==="rally")ao(a);else if(b==="statement")Oo(a);else if(b==="platform")Fo(a);else if(b==="file_lawsuit")xo(a);else if(b==="petition_for_reform")yo();else if(b==="appoint_pm")ho(a);else if(b==="modernize")po(a);else if(b==="rebrand")mo(a);else if(b==="no_confidence")Lo();else if(b==="call_early_elections")$o();else if(b==="resign_as_pm")Io();else if(b==="leave_coalition")Eo();else if(b==="disband_party")Mo();else if(b==="create_bloc")ja(a);else if(b==="leave_bloc")Da(a);else if(b==="invite_to_bloc")qa(a);else if(b==="impeach_president")So();else if(b==="debt_payment")io(a);else if(b==="invest_in_sports_culture")oo(a,t);else if(b==="expand_stadium_infrastructure")no(a,t);else if(b==="expand_infrastructure")ro(a,t);else if(Rt[b])bo(b,t);else if(b==="bid_to_host_vwc")lo(a,t);else if(b==="leadership_challenge")Co(a,t);else if(b==="form_coalition"){const _=document.querySelector('.pa-subtab[data-panel="election"]');_&&_.click()}else b==="form_minority_government"&&ko()}),document.getElementById("pa-actions-panel")?.addEventListener("click",async m=>{const x=m.target.closest(".pa-bloc-invite-btn");if(!x)return;const b=x.dataset.inviteId,_=x.dataset.decision;if(!(!b||!_)&&!At.has(b)){At.add(b);try{await Ha(b,_,a)}finally{At.delete(b)}}}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>Le(a)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",m=>{m.target.closest("#pa-hire-agitator-btn")||Le(a)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>Ce(a)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",m=>{m.target.closest("#pa-hire-deputy-btn")||Ce(a)})}function Ua(a,t,e){const o=K(g.nation)&&g.nation?.monarch_faction_id===e?.id;return Ge.map(s=>{const i=s.id==="leader",n=s.id==="agitator",l=V===s.id;let c,f,p,r,d;if(i){c=!1,f=a,p=X(e.leader_first_name,e.leader_last_name),r=Ve.length;const v=K(g.nation);if(v&&g.nation?.monarch_faction_id===e.id)d={text:(g.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(v)d={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const m=B?.pm_party_id===e.id,x=g.nation?.hos_election_method==="elected"&&B?.president_party_id===e.id;m?d={text:"PRIME MINISTER",color:"#5cc55c"}:x?d={text:"PRESIDENT",color:"#5cc55c"}:rt?d={text:"OPPOSITION",color:"#c84"}:d={text:"GOVERNING",color:"#8b9a6b"}}}else n&&q?(c=!1,f=`${q.first_name} ${q.last_name}`,p=X(q.first_name,q.last_name),r=1):n&&!q?(c=!1,f="Not Hired",p="+",r=0):s.id==="deputy"&&F?(c=!1,f=`${F.first_name} ${F.last_name}`,p=X(F.first_name,F.last_name),r=1):s.id==="deputy"&&!F?(c=!1,f="Not Hired",p="+",r=0):s.id==="campaign"?(c=!1,f="Campaign Mgr",p="CM",r=Qe.length):(c=!0,f="Vacant",p="—",r=0);const y=s.oppositionOnly&&!rt;return`
            <div class="pa-leader-card ${l?"active":""} ${c?"vacant":""} ${y?"vacant":""}"
                 data-role="${s.id}"
                 style="${l?`border-left-color:${s.color};`:""}${y?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${y?"var(--text-dim)":"#d44a4a"};background:${y?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${y?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${y?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${p}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${i&&o?(g.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${r>0?`<span class="pa-leader-role-count">${r} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${w(f)}</div>
                        ${d?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${d.color};margin-top:2px;">${d.text}</div>`:""}
                        ${n&&q?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${q.skill}%;background:${dt(q.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${q.skill}</span></div>`:""}
                        ${n&&!q?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
                    </div>
                </div>
            </div>
        `}).join("")+Ka(e)}const Ga={interior:{short:"MI",name:"Ministry of the Interior",short_role:"Interior",domain:"HOME AFFAIRS"},foreign:{short:"MFA",name:"Ministry of Foreign Affairs",short_role:"Foreign",domain:"DIPLOMACY"},finance:{short:"MoF",name:"Ministry of Finance",short_role:"Finance",domain:"TREASURY"},defense:{short:"MoD",name:"Ministry of Defense",short_role:"Defense",domain:"MILITARY"},justice:{short:"MoJ",name:"Ministry of Justice",short_role:"Justice",domain:"JUSTICE"},education:{short:"MoE",name:"Ministry of Education",short_role:"Education",domain:"EDUCATION"},healthcare:{short:"MoH",name:"Ministry of Health",short_role:"Health",domain:"HEALTH"},labor:{short:"MoL",name:"Ministry of Labor",short_role:"Labor",domain:"LABOR"},energy:{short:"MoEn",name:"Ministry of Energy",short_role:"Energy",domain:"ENERGY"},agriculture:{short:"MoAg",name:"Ministry of Agriculture",short_role:"Agriculture",domain:"AGRICULTURE"},transport:{short:"MoT",name:"Ministry of Transport",short_role:"Transport",domain:"INFRASTRUCTURE"},trade:{short:"MoTr",name:"Ministry of Trade",short_role:"Trade",domain:"TRADE"},environment:{short:"MoEv",name:"Ministry of Environment",short_role:"Environment",domain:"ENVIRONMENT"},sports:{short:"MoS",name:"Ministry of Sports",short_role:"Sports",domain:"SPORTS"}};function Va(a){return Ga[a]||{short:(a||"?").slice(0,3).toUpperCase(),name:"Ministry",short_role:a||"Minister",domain:(a||"").toUpperCase()}}function Ya(a){return a?.id?(ft||[]).filter(t=>t.party_id===a.id&&t.ministry_key!=="prime_minister"):[]}function Xe(a,t){const e=g?.nation,o=`${t?.leader_first_name||""} ${t?.leader_last_name||""}`.trim(),s=t?.leader_age??null;if(a==="prime_minister")return{roleId:"ministry:prime_minister",chip:"PM",roleLabel:"PRIME MINISTER",fullTitle:e?.head_of_government_title||"Prime Minister",shortRole:"Prime Minister",domain:(e?.head_of_government_title||"Prime Minister").toUpperCase(),personFirst:t?.leader_first_name||"",personLast:t?.leader_last_name||"",personName:o||"Prime Minister",personAge:s,actions:Gt.prime_minister||[]};if(a==="president")return{roleId:"ministry:president",chip:"PR",roleLabel:"PRESIDENT",fullTitle:e?.head_of_state_title||"President",shortRole:"President",domain:(e?.head_of_state_title||"President").toUpperCase(),personFirst:t?.leader_first_name||"",personLast:t?.leader_last_name||"",personName:o||"President",personAge:s,actions:Gt.president||[]};const i=(ft||[]).find(l=>l.ministry_key===a),n=Va(a);return{roleId:`ministry:${a}`,chip:n.short,roleLabel:"MINISTER",fullTitle:n.name,shortRole:n.short_role,domain:n.domain,personFirst:i?.minister_first_name||"",personLast:i?.minister_last_name||"",personName:`${i?.minister_first_name||""} ${i?.minister_last_name||""}`.trim()||"Vacant",personAge:i?.minister_age??null,ministryId:i?.id||null,discretionaryBalance:Number(i?.discretionary_balance??0),actions:Gt[a]||[]}}function vt(a){const t=Number(a)||0;return t<=0?"$0":"$"+Math.round(t/1e6)}const at={id:"stateOwnedEnterprise",name:"State Owned Enterprise",desc:"Advocate for the creation of a State Owned Enterprise in this ministry.",cost:"$100K",costColor:"var(--text-dim)",tags:[]},Gt={prime_minister:[{id:"call_early_elections",name:"Call Early Elections",desc:"Dissolve the legislature. Government enters caretaker status; election fires after a short formation window. Momentum effect tiered by Gov. Approval.",cost:"$0",costColor:"var(--text-dim)",tags:["LEGISLATIVE","PM ONLY"]},{id:"resign_as_pm",name:"Resign as Prime Minister",desc:"Step down. Coalition enters caretaker status with a window to nominate a successor; otherwise a snap election fires. -3 Momentum, -0.05 Credibility, -3 Stability, 12-tick PM ban.",cost:"$0",costColor:"var(--text-dim)",tags:["GOVERNMENT","PM ONLY"]}],president:[],defense:[at],transportation:[at],finance:[{id:"debt_payment",name:"Debt Payment",desc:"Move cash from the Finance Ministry discretionary budget to the national debt. Reduces debt principal and future interest service. $2 transaction fee plus the principal you choose. 1 tick cooldown.",cost:"$2 + payment",costColor:"#c8a832",tags:["FINANCE","COSTS BUDGET"]},at],energy:[{id:"national_energy_survey",name:"National Energy Survey",desc:"Commission a national energy resource survey. Roll 1d100 + ((100 − Energy) × 0.5): ≤45 finds nothing; 46-90 modest (+3-8); 91+ major (+5-16). Lower current Energy improves odds. Cost triples every use. 24-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["ENERGY","COSTS BUDGET"]},at],interior:[{id:"expand_infrastructure",name:"Expand Infrastructure",desc:"Post a public-works construction contract — Local Municipal Complex, Civic Center, or Provincial Infrastructure. Construction corps bid; the lowest qualified bid auto-wins. On completion your nation gains permanent stat boosts (Std of Living, GDP growth, Public Approval).",cost:"$2 – $12",costColor:"#5aafa5",tags:["INTERIOR","CONSTRUCTION"]},{id:"geological_survey_minerals",name:"Geological Survey — Minerals",desc:"Commission a national geological survey. Roll 1d100 + (Minerals × 0.5): ≤30 finds nothing; 31-60 small (+2-4); 61-85 moderate (+4-11); 86+ major (+4-18). Higher current Minerals improves odds. Cost doubles every use. 12-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["INTERIOR","COSTS BUDGET"]},{id:"agricultural_expansion",name:"Agricultural Expansion",desc:"Commission an agricultural expansion. Roll 1d100 + ((100 − Farmland) × 0.5): ≤30 nothing; 31-60 small (+2-4); 61-85 moderate (+4-11); 86+ major (+4-18, with -4-9 industry). Lower current Farmland improves odds. Cost doubles every use. 12-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["INTERIOR","COSTS BUDGET"]},at],healthcare:[at],justice:[at],education:[at],sports:[{id:"invest_in_sports_culture",name:"Invest in National Sports Culture",desc:"Fund local Vola leagues, training academies, and marketing campaigns. Pulls from the Sports Ministry discretionary budget; raises National Sports Culture immediately. 1 tick cooldown.",cost:"$2 – $8",costColor:"#c8a832",tags:["SPORTS","COSTS BUDGET"]},{id:"expand_stadium_infrastructure",name:"Expand Stadium Infrastructure",desc:"Post a stadium construction contract. Construction Corporations bid; you pick the winner. Once built, the stadium adds a permanent floor to National Sports Culture so decay can never bring you back to zero.",cost:"$3 – $10",costColor:"#c8a832",tags:["SPORTS","CONSTRUCTION"]},{id:"bid_to_host_vwc",name:"Bid to Host VWC",desc:"Submit your nation as a candidate to host the next available Vola World Cup. Multiple nations can bid; the highest score wins. Winner hosts the cycle, gains a treasury bump, Global Image, Public Approval, and home advantage in matches. Once per cup.",cost:"$10",costColor:"#c8a832",tags:["SPORTS","COSTS BUDGET"]}]};function Wa(a){const t=[],e=ve(a);e.isPM&&t.push("prime_minister"),e.isPresident&&kt(g?.nation)&&t.push("president");for(const o of Ya(a))t.push(o.ministry_key);return t}function Ka(a){const t=Wa(a);if(t.length===0)return"";const e=t.map(o=>{const s=Xe(o,a),i=V===s.roleId,n=(s.actions||[]).length;return`
            <div class="pa-leader-card pa-leader-card--ministry ${i?"active":""}"
                 data-role="${w(s.roleId)}"
                 style="${i?"border-left-color:#c8a832;":""}">
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:#c8a832;background:#c8a83215;border-color:#c8a83233;">${w(s.chip)}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:#c8a832;">${w(s.shortRole.toUpperCase())}</span>
                            ${n>0?`<span class="pa-leader-role-count">${n} action${n===1?"":"s"}</span>`:""}
                        </div>
                        <div class="pa-leader-name">${w(s.personName)}</div>
                    </div>
                </div>
            </div>
        `}).join("");return`
        <div class="pa-cabinet-header">
            <span class="pa-cabinet-header__title">Cabinet Ministries</span>
            <span class="pa-cabinet-header__count">${t.length} held</span>
        </div>
        ${e}
    `}function Ja(a,t,e){const o=g?.nation;if(a==="stateOwnedEnterprise")return"Coming soon — backend not yet wired.";if(a==="debt_payment"){if(Number(e?.discretionaryBalance??0)<3e6)return"Finance Ministry discretionary budget is below $3 — need at least $2 fee + $1 minimum payment.";if(Number(g?.nation?.debt??0)<=0)return"No national debt to pay down."}if(a==="invest_in_sports_culture"&&Number(e?.discretionaryBalance??0)<2e6)return"Sports Ministry discretionary budget is below $2M — pass a funding bill first.";if(a==="expand_infrastructure"&&Number(e?.discretionaryBalance??0)<2e6)return"Interior Ministry discretionary budget is below $2 — pass a funding bill first.";if(a==="call_early_elections"||a==="resign_as_pm"){if(K(o))return a==="call_early_elections"?"Elections are not held under absolute monarchy.":"PM serves at the Monarch’s pleasure; only the Monarch can replace them.";if(o?.__coalition_status==="caretaker")return"Government already in caretaker mode."}return""}function Xa(a,t){const e=V.startsWith("ministry:")?V.slice(9):null;if(!e)return"";const o=Xe(e,a),s=o.personAge!=null?`, Age ${o.personAge}`:"",i=e!=="prime_minister"&&e!=="president"&&o.ministryId,n=(o.actions||[]).map(l=>{const c=Ja(l.id,a,o),f=!!c,p=l.cost||"",r=(l.tags||[]).map(d=>`<span class="pa-action-tag" style="color:${Et[d]||"var(--text-dim)"};">${w(d)}</span>`).join("");return`
            <div class="pa-action-item ${f?"locked":""}" data-action-id="${w(l.id)}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(l.name)}</span>
                        <div class="pa-action-tags">${r}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${l.costColor||"var(--text-dim)"};">${w(p)}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${w(l.desc)}</div>
                ${f&&c?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>&#8856;</span><span>${w(c)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:#c8a832;background:#c8a83215;border-color:#c8a83233;">${w(o.chip)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:#c8a832;">${w(o.fullTitle.toUpperCase())}</span>
                        <span class="pa-detail-name">${w(o.personName)}</span>
                    </div>
                    <div class="pa-detail-meta">
                        ${w(o.shortRole)} &middot; ${w(a.faction_name)}${w(s)}
                        <span style="color:#c8a832;font-weight:700;"> &middot; ${w(o.domain)}</span>
                    </div>
                </div>
            </div>
            ${i?`
                <div style="text-align:right;font-family:var(--font-mono);flex-shrink:0;">
                    <div style="font-size:9px;letter-spacing:0.14em;color:var(--text-dim);text-transform:uppercase;">Discretionary Budget</div>
                    <div style="font-size:14px;font-weight:700;color:${o.discretionaryBalance>0?"var(--green)":"var(--red)"};margin-top:2px;">${vt(o.discretionaryBalance)}</div>
                </div>
            `:""}
        </div>
        <div class="pa-actions-list">
            ${o.actions&&o.actions.length>0?n:`<div class="pa-vacant-msg"><div><div class="pa-vacant-title">${w(o.fullTitle)} — No actions yet</div><div class="pa-vacant-sub">Per-ministry actions land here as they ship.</div></div></div>`}
        </div>
    `}function ye(a,t,e){if(typeof V=="string"&&V.startsWith("ministry:"))return Xa(e);const o=K(g.nation),s=o&&g.nation?.monarch_faction_id===e?.id,i=Ge.find(m=>m.id===V);if(!i)return"";const n=V==="leader",l=V==="agitator",c=V==="campaign",f=V==="deputy";if(!n&&!l&&!c&&!f)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${w(i.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(l&&!rt)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(l&&!q)return`
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
        `;if(l&&q)return vo(i);if(f&&!F)return`
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
        `;if(f&&F)return to(i);if(c)return co(i,e);const r=X(e.leader_first_name,e.leader_last_name),d=e.leader_age?`, Age ${e.leader_age}`:"";e.seats,e.momentum;const h=(K(g.nation)&&g.nation?.monarch_faction_id===e.id?Ba:Ve).map(m=>{const x=m.tags.map($=>`<span class="pa-action-tag" style="color:${Et[$]||"var(--text-dim)"};">${$}</span>`).join("");let b="",_=m.cost,M=m.costColor,C=m.locked;if(m.id==="no_confidence"){const $=K(g.nation),S=!!B&&B.pm_party_id===e.id;if($)C=!0,m.lockReason="Parliament cannot remove the Monarch’s Prime Minister. Only the Monarch can dismiss the PM.";else if(S)C=!0,m.lockReason="Your party is the Prime Minister — file from another party.";else if(re)C=!0,m.lockReason="A motion of no confidence is already pending in Parliament.";else if(zt>0){C=!0;const L=zt;m.lockReason=`Cooldown: ${L} tick${L!==1?"s":""} remaining before another motion can be filed against this PM party.`}else!B||!B.pm_party_id?(C=!0,m.lockReason="No active Prime Minister to file against."):m.lockReason=""}else if(m.id==="form_coalition"){const $=g.nation,S=($?.government_type||"").toLowerCase(),L=S.includes("absolute monarchy"),T=S.includes("presidential")&&!S.includes("semi"),P=Be($),I=!L&&!T&&!P&&(S.includes("parliamentary")||$?.hos_election_method==="hereditary"),N=!!W,A=!!ot,j=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),Y=!e.seats||e.seats<=0;if(P)C=!0,m.lockReason="Coalition formation does not apply in semi-presidential systems — the President nominates the Prime Minister directly.";else if(!I)C=!0,m.lockReason="Coalition formation only applies to parliamentary systems.";else if(N&&A){const et=W?.formation_type==="emergency_minority";et&&j?m.lockReason="":(C=!0,m.lockReason=et?"A minority government is in place. Only its PM party can promote it to a coalition.":"A government is already in place.")}else N&&!A?(C=!0,m.lockReason=j?"A coalition exists but the Prime Minister is vacant — use Leadership Challenge instead.":"A coalition exists but the Prime Minister is vacant; only coalition members can claim it."):Y?(C=!0,m.lockReason="Your party has no parliamentary seats."):m.lockReason=""}else if(m.id==="form_minority_government")G.eligible?m.lockReason="":(C=!0,m.lockReason=G.lockReason||"Not currently available.");else if(m.id==="leadership_challenge"){const $=g.nation,S=($?.government_type||"").toLowerCase(),L=S.includes("absolute monarchy"),T=S.includes("presidential")&&!S.includes("semi"),P=S.includes("semi-presidential")||S.includes("semi_presidential"),I=!L&&!T&&!P&&(S.includes("parliamentary")||$?.hos_election_method==="hereditary"),A=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),z=!ot,j=!!ot&&ot.faction_id===e.id,Y=!e.leader_first_name,et=!e.seats||e.seats<=0;I?j?(C=!0,m.lockReason="You are already the Prime Minister."):A?z?Y?(C=!0,m.lockReason="Your party has no leader to install."):et?(C=!0,m.lockReason="Your party has no parliamentary seats."):_t?(C=!0,m.lockReason="Challenge submitted — resolves next tick.",_="PENDING",M="var(--text-dim)"):m.lockReason="":(C=!0,m.lockReason="A Prime Minister is already serving."):(C=!0,m.lockReason="You must be in the governing coalition."):(C=!0,m.lockReason="Only available in parliamentary systems.")}else if(m.id==="leave_coalition"){const $=g.nation,S=Ht($),T=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),P=!!ot&&ot.faction_id===e.id;S?W?!T||rt?(C=!0,m.lockReason="You are in opposition."):P?(C=!0,m.lockReason="Prime Minister’s party cannot leave — resign first."):m.lockReason="":(C=!0,m.lockReason="No active coalition to leave."):(C=!0,m.lockReason="Only available in parliamentary systems.")}else if(m.id==="disband_party"){const $=ve(e);$.isPM?(C=!0,m.lockReason="You are Prime Minister — resign before disbanding."):$.isPresident?(C=!0,m.lockReason="You are the sitting President — step down before disbanding."):$.isMonarchActing?(C=!0,m.lockReason="The reigning monarch cannot disband the royal house."):m.lockReason=""}else m.id==="fundraise"&&(_="ACTION",M="#c8a832",b=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Themed event · positions you with a voter bloc</span>
                ${wt>0?'<span style="color:var(--orange);">Used this tick</span>':""}
            </div>`,wt>=1&&(C=!0,b+='<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Already hosted a fundraiser this tick.</div>'));const E=m.id==="form_minority_government"&&G.metaLine?`<div class="pa-action-meta-minority" style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);font-weight:600;letter-spacing:0.3px;">${w(G.metaLine)}</div>`:"";return`
            <div class="pa-action-item ${C?"locked":""}" data-action-id="${m.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(m.name)}</span>
                        <div class="pa-action-tags">${x}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${M};">${_}</span>
                    </div>
                </div>
                ${E}
                <div class="pa-action-desc">${w(m.desc)}</div>
                ${b}
                ${C&&m.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${w(m.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${i.color};background:${i.color}15;border-color:${i.color}33;">${r}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${i.color};">${s?(g.nation?.monarch_title||"KING").toUpperCase():i.title}</span>
                        <span class="pa-detail-name">${w(a)}</span>
                        ${o&&g.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${w(g.nation.dynasty_name)}</span>`:""}
                        ${We(t)}
                    </div>
                    <div class="pa-detail-meta">${s?w((g.nation?.monarch_title||"King")+" of "+(g.nation?.name||"")):w(i.fullTitle)+" &middot; "+w(e.faction_name)}${d}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(g.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(o)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const m=B?.pm_party_id===e.id,x=g.nation?.hos_election_method==="elected"&&B?.president_party_id===e.id;return m?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':x?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':rt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        ${Je(t)}
        ${Ke(t)}
        <div class="pa-actions-list">
            ${h}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${i.color};font-weight:700;">${i.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const Qa=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1},{id:"create_bloc",name:"Create Bloc",desc:"Found a pre-coalition alliance with other parties. Pick a name and invite any parties in your nation that aren't already in a bloc. Phase 1 is formation only — shared momentum, vote discipline, and coalition binding arrive in later phases.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["STRATEGIC","ALLIANCE"],locked:!1},{id:"leave_bloc",name:"Leave Bloc",desc:"Exit your current bloc. If you are the bloc leader, leaving dissolves the whole bloc and all pending invitations are withdrawn. Greyed out when you are not in a bloc.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"invite_to_bloc",name:"Invite Party to Bloc",desc:"Send a bloc invitation to an additional party. Leader-only. Eligible parties are in your nation, not already in a bloc, and not currently in government.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"impeach_president",name:"Impeach President",desc:"File articles of impeachment against the sitting President on charges of Abuse of Power, Gross Incompetence, or Constitutional Violation. Triggers a committee debate, then a floor vote requiring an absolute majority. If the motion passes, a 2/3 supermajority conviction vote follows. Presidential and Semi-Presidential systems only.",cost:"FREE",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1}],Ee=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Za(a,t){const e=a+t;return e>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:e>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:e>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function to(a){const t=g.faction,e=t?.color||a.color,o=Qa.map(i=>{const n=i.tags.map(f=>`<span class="pa-action-tag" style="color:${Et[f]||"var(--text-dim)"};">${f}</span>`).join("");let l=i.locked,c="";if(i.id==="create_bloc"){const f=ve(t);H?(l=!0,c=`Already in the ${H.name} bloc.`):f.isPM||f.isPresident||f.isMonarchActing?(l=!0,c="Head of Government cannot form blocs — you already lead the coalition."):(t.party_funds||0)<1e5&&(l=!0,c="Needs $100k party funds.")}else if(i.id==="leave_bloc")H?tt&&(c=`Leaving dissolves ${H.name} — all members will be removed.`):(l=!0,c="You are not in a bloc.");else if(i.id==="invite_to_bloc")H?tt||(l=!0,c="Only the bloc leader can send invitations."):(l=!0,c="You are not in a bloc.");else if(i.id==="impeach_president"){const p=(g.nation?.government_type||"").toLowerCase().includes("presidential"),r=Number(g.shard?.current_tick)||0,d=Number(g.nation?.impeachment_cooldown_until_tick)||0;p?st?st.faction_id===t.id?(l=!0,c="Your party holds the Presidency — you cannot impeach yourself."):(t.seats||0)<1?(l=!0,c="Need at least 1 seat in the legislature."):d>r&&(l=!0,c=`Impeachment cooldown: ${d-r} tick(s) remaining.`):(l=!0,c="No sitting President to impeach."):(l=!0,c="Presidential and Semi-Presidential systems only.")}return`
            <div class="pa-action-item ${l?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(i.name)}</span>
                        <div class="pa-action-tags">${n}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${i.costColor};">${i.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${w(i.desc)}</div>
                ${c?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${w(c)}</span></div>`:""}
            </div>
        `}).join(""),s=dt(F.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${X(F.first_name,F.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                        <span class="pa-detail-name">${w(F.first_name)} ${w(F.last_name)}</span>
                        ${We(e)}
                    </div>
                    <div class="pa-detail-meta">${w(a.fullTitle)} &middot; Age ${F.age} &middot; Skill: <span style="color:${s.color};font-weight:700;">${F.skill}</span></div>
                </div>
            </div>
        </div>
        ${Je(e)}
        ${Ke(e)}
        <div class="pa-actions-list" id="pa-actions-panel">${o}</div>
    `}function eo(a){const t=Fe(a),e=t.firstNames||[],o=t.lastNames||[];if(e.length===0||o.length===0)return[];const s=5+Math.floor(Math.random()*3),i=new Set,n=[];for(let l=0;l<s;l++){let c,f,p,r=0;do c=e[Math.floor(Math.random()*e.length)],f=o[Math.floor(Math.random()*o.length)],p=c+" "+f,r++;while(i.has(p)&&r<20);i.add(p);const d=20+Math.floor(Math.random()*66),y=28+Math.floor(Math.random()*30),u=Math.max(0,d-20)/65,v=Math.round((125e3+u*525e3)/25e3)*25e3;n.push({first_name:c,last_name:f,age:y,skill:d,hire_cost:v})}return n.sort((l,c)=>c.skill-l.skill)}async function Ce(a){const t=document.getElementById("pa-deputy-modal");if(!t)return;const e=g.nation?.name,o=eo(e);let s=null;function i(){const n=s!=null?o[s]:null,l=n?dt(n.skill):null,c=o.map((r,d)=>{const y=s===d,u=dt(r.skill);return`<div class="pa-hire-row ${y?"selected":""}" data-idx="${d}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${X(r.first_name,r.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${y?"var(--text-bright)":"var(--text-secondary)"};">${w(r.first_name)} ${w(r.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${r.skill}%;background:${u.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${u.color};">${r.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${r.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(r.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let f;n?f=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${X(n.first_name,n.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${w(n.first_name)} ${w(n.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${n.age} &middot; Deputy Leader Candidate</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${n.skill}%;background:${l.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l.color};">${n.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${l.color};margin-top:3px;font-weight:700;">${l.label}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(g.faction?.party_funds||0)<n.hire_cost?' disabled title="Not enough funds"':""}>Hire ${w(n.first_name)}</button>
                </div>
            `:f=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
                <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a candidate to review</div>
            </div></div>`,t.innerHTML=`
            <div style="width:100%;max-width:700px;background:var(--bg-panel);border:1px solid var(--border-mid);box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:80vh;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#8b9a6b;"></div>
                        <span class="pa-modal-title">Hire Deputy Leader</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${o.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-dep-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-dep-list">${c}</div>
                    <div style="flex:1;overflow-y:auto;">${f}</div>
                </div>
            </div>
        `;const p=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",p),t.onclick=r=>{r.target===t&&p()},document.getElementById("pa-dep-list")?.addEventListener("click",r=>{const d=r.target.closest(".pa-hire-row");d&&(s=parseInt(d.dataset.idx,10),i())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const r=o[s],d=g.faction?.party_funds||0;if(d<r.hire_cost){alert("Not enough funds.");return}const y=document.getElementById("pa-dep-hire-confirm");y&&(y.disabled=!0,y.textContent="Hiring...");try{const u=d-r.hire_cost,v=g.shard?.current_tick||0,{data:h,error:m}=await k.from("faction_deputies").insert({faction_id:g.faction.id,first_name:r.first_name,last_name:r.last_name,age:r.age,skill:r.skill,status:"active",hired_at_tick:v}).select("*").single();if(m){alert("Failed: "+m.message);return}await k.from("factions").update({party_funds:u}).eq("id",g.faction.id),g.faction.party_funds=u,F=h,V="deputy",p(),O(a)}catch(u){console.error("[Deputy] Hire error:",u)}finally{y&&(y.disabled=!1)}})}t.classList.add("active"),i()}function ao(a){const t=document.getElementById("pa-rally-modal");if(!t||!F)return;const o=g.faction.party_funds||0;let s=null,i=null;function n(){const l=Ee.map((p,r)=>{const d=o>=p.cost,y=s===r;return`<div class="pa-action-item ${y?"selected":""} ${d?"":"locked"}" data-tier="${r}" style="cursor:${d?"pointer":"not-allowed"};${y?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${y?"#8b9a6b":"var(--text-bright)"};">$${Math.round(p.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${p.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${p.bonus} = range ${1+p.bonus} to ${6+p.bonus}</div>
            </div>`}).join("");let c="";i&&(c=`
                <div style="padding:16px;background:${i.color}08;border:1px solid ${i.color}22;margin-top:12px;">
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${i.color};margin-bottom:4px;">${i.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-bottom:6px;">
                        Die roll: <strong>${i.dieRoll}</strong> + Rally bonus: <strong>${i.bonus}</strong> = <strong>${i.total}</strong>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${i.color};">
                        ${i.momentum>=0?"+":""}${i.momentum} Momentum
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${w(F.first_name)} ${w(F.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${F.skill}</span>
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

                    ${c}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${i?"Close":"Cancel"}</button>
                    ${i?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${s==null?"disabled":""}>Hold Rally</button>`}
                </div>
            </div>
        `;const f=()=>{t.classList.remove("active"),i&&O(a)};document.getElementById("rally-close")?.addEventListener("click",f),document.getElementById("rally-cancel")?.addEventListener("click",f),t.onclick=p=>{p.target===t&&f()},document.getElementById("rally-tiers")?.addEventListener("click",p=>{const r=p.target.closest("[data-tier]");!r||r.classList.contains("locked")||(s=parseInt(r.dataset.tier,10),n())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(s==null||i)return;const p=Ee[s],{data:r}=await k.from("factions").select("party_funds, momentum").eq("id",g.faction.id).single(),d=r?.party_funds||0;if(d<p.cost){alert("Not enough funds.");return}g.faction.party_funds=d,g.faction.momentum=r?.momentum??g.faction.momentum;const y=document.getElementById("rally-submit");y&&(y.disabled=!0,y.textContent="Rolling...");try{const u=1+Math.floor(Math.random()*6),v=Za(u,p.bonus),h=d-p.cost,m=Math.max(1,(g.faction.momentum||0)+v.momentum);await k.from("factions").update({party_funds:h,momentum:m}).eq("id",g.faction.id);const x=g.shard?.current_tick||0;await k.from("campaign_actions").insert({party_id:g.faction.id,nation_id:g.nation?.id,action_type:"rally",ap_cost:0,money_cost:p.cost,tick_performed:x,result:{dieRoll:u,bonus:p.bonus,total:u+p.bonus,momentum:v.momentum,momentumDelta:v.momentum,label:v.label,outcomeName:v.label}}),g.faction.party_funds=h,g.faction.momentum=m,sessionStorage.removeItem("nationhood_state"),i={...v,dieRoll:u,bonus:p.bonus,total:u+p.bonus},n()}catch(u){console.error("[Rally] Error:",u),alert("Rally failed.")}})}t.classList.add("active"),n()}async function oo(a,t){const e=document.getElementById("pa-vola-invest-modal");if(!e)return;const{data:o}=await k.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),s=Number(o?.discretionary_balance)||0;let i=!1,n=null;function l(){const f=["low","moderate","high"].map(d=>({key:d,cfg:ga[d]})).map(d=>{const y=s>=d.cfg.cost,u="$"+d.cfg.cost/1e6;return`<div class="pa-action-item ${!y||i?"locked":""}" data-tier="${d.key}" style="cursor:${y&&!i?"pointer":"not-allowed"};">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${d.cfg.label}</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">+${d.cfg.gain} National Sports Culture</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Cost: ${u} from discretionary budget</div>
                ${y?"":`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);margin-top:4px;">Insufficient budget — need ${u}</div>`}
            </div>`}).join(""),p=n?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Investment applied</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    +${n.gain} National Sports Culture · new total <strong>${Number(n.newCulture).toFixed(1)}</strong><br>
                    $${(n.cost/1e6).toFixed(0)} deducted · remaining discretionary <strong>${vt(n.newBalance)}</strong>
                </div>
            </div>
        `:"";e.innerHTML=`
            <div class="pa-modal" style="width:480px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Invest in National Sports Culture</span>
                    </div>
                    <button class="pa-modal-close" id="vola-close">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    Fund local Vola leagues, training academies, and marketing. Pulls from the
                    Sports Ministry's discretionary budget — <strong style="color:${s>0?"var(--green)":"var(--red)"};">${vt(s)}</strong> available.
                    Top it up via a funding article on a passed bill. 1 tick cooldown.
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="vola-tiers">${f}</div>
                    ${p}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="vola-cancel">${n?"Close":"Cancel"}</button>
                </div>
            </div>
        `;const r=()=>{e.classList.remove("active"),n&&O(a)};document.getElementById("vola-close")?.addEventListener("click",r),document.getElementById("vola-cancel")?.addEventListener("click",r),e.onclick=d=>{d.target===e&&r()},document.getElementById("vola-tiers")?.addEventListener("click",async d=>{const y=d.target.closest("[data-tier]");if(!y||y.classList.contains("locked")||i||n)return;const u=y.dataset.tier;i=!0,l();try{const{data:v}=await k.from("shard").select("current_tick").eq("name","Alpha Shard").single(),h=Number(v?.current_tick)||0,m=await ba(k,g.nation,t.id,u,h);m?.success?n=m:alert("Could not invest: "+(m?.reason||"unknown error"))}catch(v){alert("Investment failed: "+(v?.message||v))}finally{i=!1,l()}})}e.classList.add("active"),l()}async function io(a,t){const e=document.getElementById("pa-debt-payment-modal");if(!e)return;const o=_=>Math.floor((Number(_)||0)/1e6),s=2;let i="";const[n,l]=await Promise.all([k.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","finance").eq("is_active",!0).maybeSingle(),k.from("nations").select("debt").eq("id",g.nation.id).maybeSingle()]);(n.error||l.error)&&(i=(n.error||l.error).message||"Could not load ministry / nation data.");const c=o(n.data?.discretionary_balance),f=o(l.data?.debt),p=Math.max(0,c-s);let r=!1,d=null,y="",u=i;function v(){const _=parseInt(y,10);return Number.isFinite(_)?_:null}function h(){const _=v();return _!=null&&_>=1&&_<=p}function m(){const _=v(),M=_!=null&&_>=1?_+s:null,C=M!=null?c-M:c,E=_!=null&&_>=1?Math.max(0,f-_):f,$=h(),S=d?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Payment applied</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    $${d.payment} paid against debt · $${d.fee} transaction fee<br>
                    Discretionary: <strong>$${o(d.newBalance)}</strong> · Debt: <strong>$${o(d.newDebt)}</strong>
                </div>
            </div>
        `:"",L=u?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:6px;">${w(u)}</div>`:"";e.innerHTML=`
            <div class="pa-modal" style="width:480px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Debt Payment</span>
                    </div>
                    <button class="pa-modal-close" id="pa-dp-close">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    Pay down the national debt from the Finance Ministry's discretionary budget.
                    $${s} transaction fee + the principal you choose. 1 tick cooldown.
                </div>
                <div class="pa-modal-body" style="gap:10px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">DISCRETIONARY</div>
                            <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${c>0?"var(--green)":"var(--red)"};">$${c}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">NATIONAL DEBT</div>
                            <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright);">$${f}</div>
                        </div>
                    </div>

                    <div class="pa-modal-step-label">Payment Amount (whole dollars, 1 – ${p})</div>
                    <input id="pa-dp-input" class="pa-modal-input" type="number" min="1" max="${p}" step="1" placeholder="0" value="${w(y)}" ${d||r?"disabled":""} style="font-family:var(--font-mono);font-size:14px;">

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:4px;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">AFTER · DISCRETIONARY</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${C>=0?"var(--text-bright)":"var(--red)"};">$${C}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">AFTER · DEBT</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">$${E}</div>
                        </div>
                    </div>
                    ${L}
                    ${S}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-dp-cancel">${d?"Close":"Cancel"}</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dp-pay" ${!$||r||d||i?"disabled":""}>${r?"Paying…":"Pay"}</button>
                </div>
            </div>
        `;const T=()=>{e.classList.remove("active"),d&&O(a)};document.getElementById("pa-dp-close")?.addEventListener("click",T),document.getElementById("pa-dp-cancel")?.addEventListener("click",T),e.onclick=I=>{I.target===e&&T()};const P=document.getElementById("pa-dp-input");P&&(P.addEventListener("input",I=>{y=(I.target.value||"").replace(/[^0-9]/g,""),u=i,m();const N=document.getElementById("pa-dp-input");N&&(N.focus(),N.setSelectionRange(N.value.length,N.value.length))}),P.addEventListener("keydown",I=>{I.key==="Enter"&&h()&&!r&&!d&&!i&&(I.preventDefault(),x())})),document.getElementById("pa-dp-pay")?.addEventListener("click",x)}async function x(){if(r||d||i)return;const _=v();if(!h()){u=`Enter an integer between 1 and ${p}.`,m();return}r=!0,u="",m();try{const{data:M,error:C}=await k.rpc("pay_down_national_debt",{p_payment:_});C?u=C.message||"Payment failed.":M?.success?d=M:u=b(M?.reason)||"Payment failed."}catch(M){u=M?.message||"Network error."}finally{r=!1,m()}}function b(_){switch(_){case"invalid_payment":return"Enter an integer of at least $1.";case"not_minister":return"Only the Finance Minister can fire this action.";case"no_shard":return"Shard not initialized.";case"cooldown":return"Already used this tick. Try again next tick.";case"insufficient_balance":return"Not enough discretionary budget for fee + payment.";case"no_debt":return"There is no national debt to pay down.";default:return _||""}}e.classList.add("active"),m()}async function no(a,t){const e=document.getElementById("pa-vola-stadium-modal");if(!e)return;let o="",s="",i=null,n=!1,l=null,c=[],f=null;async function p(){const{data:y}=await k.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),u=Number(y?.discretionary_balance)||0,{data:v}=await k.from("corp_contracts").select("id, name, description, spec_category, expires_at_tick, created_at_tick").eq("issuer_nation_id",g.nation.id).eq("project_subtype","Vola Stadium").eq("status","open").order("created_at_tick",{ascending:!1}).limit(1).maybeSingle();if(l=v||null,c=[],l){const{data:h}=await k.from("corp_contract_bids").select("id, faction_id, bid_amount, quoted_timeline_months, status, created_at_tick, factions:faction_id(id, faction_name, nation_id, nations:nation_id(name))").eq("contract_id",l.id).eq("status","pending").order("created_at_tick",{ascending:!0});c=h||[]}return{balance:u,hasMinister:!!y,isMinister:y?.party_id===t.id}}async function r(){const{balance:y,hasMinister:u,isMinister:v}=await p(),h=["small","modest","extravagant"].map(E=>({key:E,cfg:xa[E]})),m=y>0?"var(--green)":"var(--red)";let x="";if(l){const E=l.spec_category==="Light Infrastructure"?2:l.spec_category==="Heavy Infrastructure"?4:l.spec_category==="Megaproject"?9:0,$=(l.description||"").replace(/^Home of:\s*/i,"").trim();if(x+=`
                <div class="pa-modal-step-label">Open Stadium Contract</div>
                <div class="pa-action-item" style="cursor:default;">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${w(l.name)}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">Floor +${E}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        ${$?"Home of "+w($)+" · ":""}${w(l.spec_category)}
                    </div>
                </div>
            `,x+=`<div class="pa-modal-step-label" style="margin-top:14px;">Submitted Stadium Bids ${c.length?"· "+c.length:""}</div>`,c.length===0)x+='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;text-align:center;">Awaiting corporate bids…</div>';else{const S=L=>{if(L==null)return"—";const T=["January","February","March","April","May","June","July","August","September","October","November","December"],P=2e3+Math.floor(L/12);return`${T[L%12]}, ${P}`};x+=c.map(L=>{const T=L.factions?.faction_name||"Unknown Corp",P=L.factions?.nations?.name||"—",I=Number(L.bid_amount||0),N=I>=1e9?"$"+(I/1e9).toFixed(2)+"B":I>=1e6?"$"+(I/1e6).toFixed(1)+"M":"$"+Math.round(I).toLocaleString(),A=Number(L.quoted_timeline_months||0),z=Number(L.created_at_tick||0)+A;return`<div class="pa-action-item" style="cursor:default;" data-bid-id="${w(L.id)}">
                        <div class="pa-action-top">
                            <div>
                                <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${w(T)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                                    HQ ${w(P)} · Price ${N} · Timeline ${A} ticks · Finished ${S(z)}
                                </div>
                            </div>
                            <div style="display:flex;gap:6px;">
                                <button class="pa-modal-btn pa-modal-btn--submit" data-action="accept" data-bid-id="${w(L.id)}" ${n?"disabled":""} style="padding:4px 10px;font-size:9px;background:#5cc55c;border-color:#5cc55c;">Accept</button>
                                <button class="pa-modal-btn pa-modal-btn--cancel" data-action="reject" data-bid-id="${w(L.id)}" ${n?"disabled":""} style="padding:4px 10px;font-size:9px;">Reject</button>
                            </div>
                        </div>
                    </div>`}).join("")}}else{const E=h.map($=>{const S=y>=$.cfg.postingCost,L=i===$.key,T="$"+$.cfg.postingCost/1e6,P="$"+$.cfg.budgetTarget/1e6+"M";return`<div class="pa-action-item ${!S||n?"locked":""} ${L?"selected":""}" data-size="${$.key}" style="cursor:${S&&!n?"pointer":"not-allowed"};${L?"border-color:#c8a832;background:rgba(200,168,50,0.06);":""}">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:${L?"#c8a832":"var(--text-bright)"};">${$.cfg.label}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">Floor +${$.cfg.floorContribution}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        Discretionary ${T} · Contract budget ${P} · Timeline ~${$.cfg.timelineMonths} ticks · ${$.cfg.crewsRequired} crew${$.cfg.crewsRequired===1?"":"s"} required
                    </div>
                    ${S?"":`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);margin-top:4px;">Insufficient discretionary — need ${T}</div>`}
                </div>`}).join("");x=`
                <div class="pa-modal-step-label">Stadium Name</div>
                <input id="vola-stadium-name" type="text" maxlength="60"
                       placeholder="e.g. Coastal Vola Park"
                       value="${w(o)}"
                       style="width:100%;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:12px;">

                <div class="pa-modal-step-label" style="margin-top:14px;">Home Of</div>
                <input id="vola-stadium-team" type="text" maxlength="60"
                       placeholder="e.g. F.C. Drevlak / Sporting San Maria / Real Avelia"
                       value="${w(s)}"
                       style="width:100%;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:12px;">

                <div class="pa-modal-step-label" style="margin-top:14px;">Choose Stadium Size</div>
                <div id="vola-stadium-tiers">${E}</div>

                ${f?`<div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${w(f)}</div>`:""}
            `}const b=l?`<button class="pa-modal-btn pa-modal-btn--cancel" id="vola-stadium-cancel-bid" ${n?"disabled":""}>Cancel Bid</button>
               <button class="pa-modal-btn" id="vola-stadium-close" style="background:var(--bg-card);">Close</button>`:`<button class="pa-modal-btn pa-modal-btn--cancel" id="vola-stadium-close">Cancel</button>
               <button class="pa-modal-btn pa-modal-btn--submit" id="vola-stadium-post" ${!i||!o.trim()||n?"disabled":""} style="background:#c8a832;">Post Stadium Contract</button>`;e.innerHTML=`
            <div class="pa-modal" style="width:560px;max-height:85vh;overflow-y:auto;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Expand Stadium Infrastructure</span>
                    </div>
                    <button class="pa-modal-close" id="vola-stadium-x">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    ${u&&v?`Posting cost pulls from the Sports Ministry's discretionary budget — <strong style="color:${m};">${vt(y)}</strong> available. Top it up via a funding article on a passed bill.`:'<span style="color:var(--red);">You are no longer the active Sports Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${x}
                </div>
                <div class="pa-modal-footer">${b}</div>
            </div>
        `;const _=()=>e.classList.remove("active");document.getElementById("vola-stadium-x")?.addEventListener("click",_),document.getElementById("vola-stadium-close")?.addEventListener("click",_),e.onclick=E=>{E.target===e&&_()};const M=document.getElementById("vola-stadium-name"),C=document.getElementById("vola-stadium-team");M?.addEventListener("input",E=>{o=E.target.value,document.getElementById("vola-stadium-post").disabled=!o.trim()||!i||n}),C?.addEventListener("input",E=>{s=E.target.value}),document.getElementById("vola-stadium-tiers")?.addEventListener("click",E=>{const $=E.target.closest("[data-size]");!$||$.classList.contains("locked")||n||(i=$.dataset.size,r())}),document.getElementById("vola-stadium-post")?.addEventListener("click",async()=>{if(!(n||!i||!o.trim())){n=!0,f=null,r();try{const{data:E}=await k.from("shard").select("current_tick").eq("name","Alpha Shard").single(),$=Number(E?.current_tick)||0,S=await ha(k,g.nation,t.id,{stadiumName:o.trim(),teamName:s.trim(),size:i},$);S?.success?(i=null,o="",s="",await r()):f=d(S?.reason)||"Could not post: "+(S?.reason||"unknown error")}catch(E){f="Posting failed: "+(E?.message||E)}finally{n=!1,r()}}}),document.querySelectorAll("[data-action]").forEach(E=>{E.addEventListener("click",async $=>{if(n)return;const S=E.dataset.action,L=E.dataset.bidId;if(L){n=!0,r();try{if(S==="accept"){const{data:T,error:P}=await k.rpc("award_stadium_bid_to_corp",{p_bid_id:L});if(P)throw P;if(!T?.success)throw new Error(T?.error||"Award failed")}else if(S==="reject"){const{data:T,error:P}=await k.rpc("reject_stadium_bid",{p_bid_id:L});if(P)throw P;if(!T?.success)throw new Error(T?.error||"Reject failed")}}catch(T){alert("Action failed: "+(T?.message||T))}finally{n=!1,r()}}})}),document.getElementById("vola-stadium-cancel-bid")?.addEventListener("click",async()=>{if(!(n||!l)&&confirm(`Cancel this stadium contract?

Discretionary cost will be refunded.`)){n=!0,r();try{const{data:E,error:$}=await k.rpc("cancel_stadium_contract",{p_contract_id:l.id});if($)throw $;if(!E?.success)throw new Error(E?.error||"Cancel failed");l=null,c=[]}catch(E){alert("Cancel failed: "+(E?.message||E))}finally{n=!1,r()}}})}function d(y){return{no_minister:"No active Sports Minister.",not_minister:"Only the Sports Minister can post stadium contracts.",insufficient_balance:"Sports discretionary budget is below the tier cost — pass a funding bill first.",already_open:"A stadium contract is already open. Wait for it to resolve, or cancel it first.",no_stadium_name:"Stadium name is required.",invalid_size:"Pick a stadium size first.",insert_failed:"Could not post the contract. Try again in a moment."}[y]}e.classList.add("active"),await r()}async function ro(a,t){const e=document.getElementById("pa-expand-infra-modal");if(!e)return;let o=null,s=null,i=!1,n=null,l=[],c=null;async function f(){const{data:r}=await k.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","interior").eq("is_active",!0).maybeSingle(),d=Number(r?.discretionary_balance)||0,{data:y}=await k.from("corp_contracts").select("id, name, description, spec_category, budget, timeline_months, status, expires_at_tick, created_at_tick").eq("issuer_nation_id",g.nation.id).eq("project_subtype","Interior Infrastructure").in("status",["open","active"]).order("created_at_tick",{ascending:!1}).limit(1).maybeSingle();if(n=y||null,l=[],n&&n.status!=="active"){const{data:u}=await k.from("corp_contract_bids").select("id, faction_id, bid_amount, quoted_timeline_months, status, created_at_tick, factions:faction_id(id, faction_name, nation_id, nations:nation_id(name))").eq("contract_id",n.id).eq("status","pending").order("bid_amount",{ascending:!0});l=u||[]}if(!o){const{data:u,error:v}=await k.rpc("interior_infrastructure_tiers");v?(c="Could not load tier specs: "+v.message,o={}):o=u||{}}return{balance:d,isMinister:!!r&&r.party_id===t.id}}async function p(){const{balance:r,isMinister:d}=await f(),y=r>0?"var(--green)":"var(--red)",u=b=>"$"+(Number(b)/1e6).toFixed(Number(b)%1e6===0?0:1)+"M",v=n?.status==="active";let h="";if(n)h+=`
                <div class="pa-modal-step-label">${v?"Active Infrastructure Contract":"Open Infrastructure Contract"}</div>
                <div class="pa-action-item" style="cursor:default;">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${w(n.name)}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5aafa5;">${u(n.budget)}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        ${w(n.spec_category)} · Timeline ${n.timeline_months} ticks${v?"":` · Bidding closes tick ${n.expires_at_tick}`}
                    </div>
                </div>
            `,v?h+='<div style="margin-top:10px;padding:10px 12px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);background:rgba(90,175,165,0.06);border:1px solid rgba(90,175,165,0.2);">Construction is underway. Stat boosts apply on completion.</div>':(h+=`<div class="pa-modal-step-label" style="margin-top:14px;">Pending Bids ${l.length?"· "+l.length:""}</div>`,l.length===0?h+='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;text-align:center;">Awaiting construction corporation bids…</div>':h+=l.map(b=>{const _=b.factions?.faction_name||"Unknown Corp",M=b.factions?.nations?.name||"—",C=Number(b.bid_amount||0),E=C>=1e9?"$"+(C/1e9).toFixed(2)+"B":C>=1e6?"$"+(C/1e6).toFixed(1)+"M":"$"+Math.round(C).toLocaleString(),$=Number(b.quoted_timeline_months||0);return`<div class="pa-action-item" style="cursor:default;">
                            <div class="pa-action-top">
                                <div>
                                    <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${w(_)}</div>
                                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                                        HQ ${w(M)} · Bid ${E} · Timeline ${$} ticks
                                    </div>
                                </div>
                            </div>
                        </div>`}).join(""),h+='<div style="margin-top:10px;padding:8px 10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);">Auto-awarded to the best-scoring bid (cost, timeline, reputation) when the bid window closes.</div>');else{const b=["small","modest","extravagant"],_={small:"SMALL",modest:"MODEST",extravagant:"EXTRAVAGANT"};h=`
                <div class="pa-modal-step-label">Choose Tier</div>
                <div id="expand-infra-tiers">${b.map(C=>{const E=o?.[C];if(!E)return"";const $=Number(E.post_cost||0),S=Number(E.budget||0),L=r>=$,T=s===C,P=(E.stat_effects||[]).map(I=>{const N=Number(I.delta)>=0?"+":"",A=String(I.stat).replace(/_/g," ").replace(/\b\w/g,z=>z.toUpperCase());return`<span class="pa-action-tag" style="color:var(--green);">${N}${I.delta} ${A}</span>`}).join(" ");return`<div class="pa-action-item ${!L||i?"locked":""} ${T?"selected":""}" data-size="${C}" style="cursor:${L&&!i?"pointer":"not-allowed"};${T?"border-color:#5aafa5;background:rgba(90,175,165,0.06);":""}">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:${T?"#5aafa5":"var(--text-bright)"};">${w(E.name||_[C])}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5aafa5;">${_[C]}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        Post fee ${u($)} · Contract budget ${u(S)} · Timeline ${E.timeline} ticks
                    </div>
                    ${P?`<div class="pa-action-tags" style="margin-top:4px;">${P}</div>`:""}
                    ${L?"":`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);margin-top:4px;">Insufficient discretionary — need ${u($)}</div>`}
                </div>`}).join("")}</div>
                ${c?`<div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${w(c)}</div>`:""}
            `}const m=n?'<button class="pa-modal-btn" id="expand-infra-close" style="background:var(--bg-card);">Close</button>':`<button class="pa-modal-btn pa-modal-btn--cancel" id="expand-infra-close">Cancel</button>
               <button class="pa-modal-btn pa-modal-btn--submit" id="expand-infra-post" ${!s||i?"disabled":""} style="background:#5aafa5;">Post Infrastructure Contract</button>`;e.innerHTML=`
            <div class="pa-modal" style="width:560px;max-height:85vh;overflow-y:auto;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#5aafa5;"></div>
                        <span class="pa-modal-title">Expand Infrastructure</span>
                    </div>
                    <button class="pa-modal-close" id="expand-infra-x">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    ${d?`Post fee pulls from the Interior Ministry's discretionary budget — <strong style="color:${y};">${vt(r)}</strong> available. Construction corps bid; the best-scoring bid (cost, timeline, reputation) auto-wins when the bid window closes. Stat boosts apply on completion.`:'<span style="color:var(--red);">You are no longer the active Interior Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${h}
                </div>
                <div class="pa-modal-footer">${m}</div>
            </div>
        `;const x=()=>e.classList.remove("active");document.getElementById("expand-infra-x")?.addEventListener("click",x),document.getElementById("expand-infra-close")?.addEventListener("click",x),e.onclick=b=>{b.target===e&&x()},document.getElementById("expand-infra-tiers")?.addEventListener("click",b=>{const _=b.target.closest("[data-size]");!_||_.classList.contains("locked")||i||(s=_.dataset.size,p())}),document.getElementById("expand-infra-post")?.addEventListener("click",async()=>{if(!(i||!s)){i=!0,c=null,p();try{const{data:b,error:_}=await k.rpc("post_interior_infrastructure",{p_size:s});_?c=_.message||"Post failed":b?.success?s=null:c=b?.error||"Could not post contract"}catch(b){c="Posting failed: "+(b?.message||b)}finally{i=!1,p()}}})}e.classList.add("active"),await p()}const Ie=84,Me=24,so=12;function Vt(a){const t=a%100,e=a%10;return t>=11&&t<=13?a+"th":e===1?a+"st":e===2?a+"nd":e===3?a+"rd":a+"th"}function St(a){if(a==null)return"—";const t=["January","February","March","April","May","June","July","August","September","October","November","December"],e=2e3+Math.floor(a/12);return`${t[a%12]}, ${e}`}async function lo(a,t){const e=document.getElementById("pa-vola-host-bid-modal");if(!e)return;let o=!1,s=null,i=null;const n=new Map;async function l(){const{data:p}=await k.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),{data:r}=await k.from("shard").select("current_tick").eq("name","Alpha Shard").single(),d=Number(r?.current_tick)||0,y=[];let u=0;for(;y.length<3&&u<200;){const v=u+1,h=Ie+Me*u,m=h-so;m>d&&y.push({cupNumber:v,cupStart:h,resolutionTick:m}),u++}if(y.length>0){const v=y.map(_=>_.cupNumber),[{data:h},{data:m}]=await Promise.all([k.from("vola_cup_hosts").select("cup_number, host_nation_id, nations:host_nation_id(name)").in("cup_number",v),k.from("vola_host_bids").select("cup_number, bid_at_tick").eq("nation_id",g.nation.id).in("cup_number",v)]),x=new Map((h||[]).map(_=>[_.cup_number,_])),b=new Map((m||[]).map(_=>[_.cup_number,_]));for(const _ of y){_.host=x.get(_.cupNumber)||null;const M=b.get(_.cupNumber),C=n.has(_.cupNumber);_.iBid=!!M||C,_.bidAtTick=M?.bid_at_tick??n.get(_.cupNumber)??null}for(const _ of y){const M=_.cupNumber>1?Ie+Me*(_.cupNumber-2):null,C=M===null||d>M;_.selectable=!_.host&&!_.iBid&&C}}return{balance:Number(p?.discretionary_balance)||0,isMinister:p?.party_id===t.id,cups:y}}async function c(){const{balance:p,isMinister:r,cups:d}=await l(),u=p>=1e7,v=d.length===0?'<div class="pa-empty-msg" style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">No upcoming Vola World Cups within the bid window.</div>':d.map(C=>{let E="",$="",S="",L="";if(C.host){const T=C.host.nations?.name||"Awarded";E=`<span class="pa-action-tag" style="color:var(--text-dim);">HOSTED — ${w(T.toUpperCase())}</span>`,S="locked",$="opacity:0.5;cursor:not-allowed;"}else if(C.iBid){E='<span class="pa-action-tag" style="color:#5cc55c;">YOUR BID PENDING</span>',S="locked",$="cursor:not-allowed;border-color:#5cc55c;background:rgba(92,197,92,0.06);";const T=C.bidAtTick!=null?`Bid placed on ${St(C.bidAtTick)} for $10`:"Bid placed earlier this session for $10";L=`<button class="pa-modal-btn pa-modal-btn--placed" disabled style="background:transparent;color:#5cc55c;border:1px solid #5cc55c;padding:4px 10px;font-size:9px;cursor:not-allowed;opacity:0.75;font-weight:600;letter-spacing:0.04em;">${w(T)}</button>`}else C.selectable&&r&&u?(E='<span class="pa-action-tag" style="color:#c8a832;">AVAILABLE</span>',$="cursor:pointer;border-color:#c8a832;background:rgba(200,168,50,0.06);",L=`<button class="pa-modal-btn pa-modal-btn--submit" data-cup-number="${C.cupNumber}" ${o?"disabled":""} style="background:#c8a832;padding:4px 10px;font-size:9px;">Submit Bid — $10</button>`):C.selectable&&!u?(E='<span class="pa-action-tag" style="color:var(--red);">INSUFFICIENT BUDGET</span>',S="locked",$="opacity:0.6;cursor:not-allowed;"):(E='<span class="pa-action-tag" style="color:var(--text-dim);">FUTURE CYCLE</span>',S="locked",$="opacity:0.5;cursor:not-allowed;");return`<div class="pa-action-item ${S}" data-cup-number="${C.cupNumber}" style="${$}">
                    <div class="pa-action-top">
                        <div>
                            <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${Vt(C.cupNumber)} World Vola Cup</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                                Begins ${St(C.cupStart)} · Bids resolve ${St(C.resolutionTick)}
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                            ${E}
                            ${L}
                        </div>
                    </div>
                </div>`}).join(""),h=`
            <div style="margin-top:14px;padding:10px;background:var(--bg-card);border:1px solid var(--border-main);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                <div style="font-weight:700;color:var(--text-secondary);margin-bottom:4px;">Bid Score Formula</div>
                (Sports Culture &divide; 2) + (Infrastructure &times; 3) + (Global Image &times; 3) + (Stadiums &times; 5) + 1d20<br>
                Highest score wins · ties broken by Sports Culture
            </div>
        `,m=`
            <div style="margin-top:10px;padding:10px;background:rgba(92,197,92,0.06);border:1px solid rgba(92,197,92,0.2);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                <div style="font-weight:700;color:#5cc55c;margin-bottom:4px;">Win Effects</div>
                Host the VWC · +15 home advantage · +1d20+5 Budget · +3 Global Image · +0.5 Public Approval · +1d6 Sports Culture
            </div>
        `,x=`
            <div style="margin-top:6px;padding:10px;background:rgba(200,80,80,0.06);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                <div style="font-weight:700;color:var(--red);margin-bottom:4px;">Lose Effect</div>
                &minus;0.2 Public Approval (failed national bid)
            </div>
        `,b=i?`
            <div style="margin-top:12px;padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Bid submitted</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    ${Vt(i.cupNumber)} World Vola Cup · resolves ${St(i.resolutionTick)}<br>
                    $${i.cost/1e6} deducted from discretionary
                </div>
            </div>
        `:"",_=s?`
            <div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${w(s)}</div>
        `:"";e.innerHTML=`
            <div class="pa-modal" style="width:560px;max-height:85vh;overflow-y:auto;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Bid to Host Vola World Cup</span>
                    </div>
                    <button class="pa-modal-close" id="vola-host-x">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    ${r?`Discretionary budget <strong style="color:${p>0?"var(--green)":"var(--red)"};">${vt(p)}</strong> available · cost <strong style="color:#c8a832;">$10</strong> per bid · once per cup.`:'<span style="color:var(--red);">You are no longer the active Sports Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${v}
                    ${h}
                    ${m}
                    ${x}
                    ${b}
                    ${_}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="vola-host-close">Close</button>
                </div>
            </div>
        `;const M=()=>{e.classList.remove("active"),O(a)};document.getElementById("vola-host-x")?.addEventListener("click",M),document.getElementById("vola-host-close")?.addEventListener("click",M),e.onclick=C=>{C.target===e&&M()},e.querySelectorAll("[data-cup-number]").forEach(C=>{C.tagName==="BUTTON"&&C.addEventListener("click",async()=>{if(o||i)return;const E=Number(C.dataset.cupNumber);if(E&&confirm(`Submit a host bid for the ${Vt(E)} World Vola Cup?

$10 from discretionary budget.
Resolves at the qualifier tick (12 ticks before the cup begins).`)){o=!0,s=null,c();try{const $=await _a(k,E,g.nation.id);if($?.success){i=$;const{data:S}=await k.from("shard").select("current_tick").eq("name","Alpha Shard").single(),L=Number(S?.current_tick)||Number($.cupStartTick)-999;n.set(E,L)}else $?.reason==="already_bid"&&!n.has(E)&&n.set(E,null),s=f($?.reason)||"Could not submit: "+($?.reason||"unknown error")}catch($){s="Bid failed: "+($?.message||$)}finally{o=!1,c()}}})})}function f(p){return{invalid_cup:"Invalid cup selection.",invalid_nation:"Nation context unavailable. Reload and try again.",not_minister:"Only the Sports Minister can submit host bids.",insufficient_balance:"Sports discretionary budget is below $10M — pass a funding bill first.",no_shard:"Game state unavailable. Try again.",bidding_closed:"Bidding window has closed for this cup.",already_hosted:"This cup has already been awarded.",already_bid:"You have already bid for this cup.",cup_not_open_yet:"This cup’s bid window opens 1 tick after the previous cup begins."}[p]}e.classList.add("active"),await c()}const Qe=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],Se=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],se=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function co(a,t){const e=Qe.map(o=>{const s=o.tags.map(i=>`<span class="pa-action-tag" style="color:${Et[i]||"var(--text-dim)"};">${i}</span>`).join("");return`
            <div class="pa-action-item ${o.locked?"locked":""}" data-action-id="${o.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(o.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${o.costColor};">${o.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${w(o.desc)}</div>
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">CM</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                    </div>
                    <div class="pa-detail-meta">${w(a.fullTitle)} &middot; ${w(t.faction_name)}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${e}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `}function po(a){const t=document.getElementById("pa-modernize-modal");if(!t)return;const e=g.faction;let o=null,s=e.custom_logo_url||null,i=!1;function n(){const l=!!s,f=Number(e.party_funds??0)>=5e4,p=!!o&&f&&!i;t.innerHTML=`
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
                        ${s?`<img src="${w(s)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
                    </div>
                    <div style="text-align:center;">
                        <label style="display:inline-block;padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright);background:var(--bg-card);border:1px solid var(--border-mid);cursor:pointer;letter-spacing:0.06em;">
                            ${l?"CHANGE LOGO":"UPLOAD LOGO"}
                            <input type="file" accept="image/*" id="mod-file-input" style="display:none;">
                        </label>
                        ${e.custom_logo_url&&!o?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${o?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${f?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${p?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=r=>{r.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",r=>{const d=r.target.files?.[0];if(d){if(d.size>2*1024*1024){alert("Logo must be under 2MB.");return}o=d,s=URL.createObjectURL(d),n()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(i||!o)return;i=!0;const r=document.getElementById("mod-submit");r&&(r.disabled=!0,r.textContent="Uploading...");try{const d=o.name.split(".").pop()?.toLowerCase()||"png",y=`${e.id}/logo_${Date.now()}.${d}`,{error:u}=await k.storage.from("party-logos").upload(y,o,{cacheControl:"3600",upsert:!0,contentType:o.type});if(u)throw new Error("Upload failed: "+u.message);const{data:v}=k.storage.from("party-logos").getPublicUrl(y),h=v?.publicUrl;if(!h)throw new Error("Failed to get logo URL");const m=Math.max(0,Number(e.party_funds??0)-5e4),{error:x}=await k.from("factions").update({custom_logo_url:h,party_funds:m}).eq("id",e.id);if(x)throw x;e.custom_logo_url=h,e.party_funds=m,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),O(a)}catch(d){alert("Modernize failed: "+(d.message||"Error")),i=!1,r&&(r.disabled=!1,r.textContent="Modernize — $50k")}})}t.classList.add("active"),n()}function mo(a){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const e=g.faction;g.nation;const o=e.momentum??50;(g._allParties||[]).filter(d=>d.id!==e.id);const s={current:e.party_color||"#4a8aba"},i={current:0},n={current:e.custom_logo_url||null},l={current:null},c={current:!!e.custom_logo_url},f={current:!1};function p(){return s.current}function r(){const d=p(),y=Se.find(C=>C.hex===d)?.name||"Custom",u=se[i.current]?.emoji||"🏛️",v=c.current&&(n.current||l.current),h=n.current||(l.current?URL.createObjectURL(l.current):null),m=document.getElementById("rb-name")?.value??e.faction_name??"",x=document.getElementById("rb-abbr")?.value??e.abbreviation??"",b=document.getElementById("rb-desc")?.value??"",_=Se.map(C=>{const E=d===C.hex;return`<div class="rb-color-swatch ${E?"selected":""}" data-hex="${C.hex}" style="background:${C.hex};${E?`box-shadow:0 0 8px ${C.hex}44;border:2px solid var(--text-bright);`:""}">
                ${E?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),M=se.map((C,E)=>{const $=i.current===E;return`<div class="rb-logo-item ${$?"selected":""}" data-idx="${E}" style="${$?`background:${d}15;border:2px solid ${d};box-shadow:0 0 6px ${d}33;`:""}">
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
                            <input class="pa-modal-input" id="rb-name" value="${w(m)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${m.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${w(x)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${d};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${w(b)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${b.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${d};">${w(y)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${_}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${v?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${v?"opacity:0.3;":""}" id="rb-logos">${M}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${v?"solid var(--teal)":"dashed var(--border-mid)"};padding:10px 14px;background:${v?"rgba(90,170,138,0.04)":"var(--bg-card)"};">
                                ${v&&h?`
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <img src="${h}" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--border-main);background:var(--bg-card);" alt="Custom logo">
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
                        <div style="background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${d};padding:10px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <div style="width:40px;height:40px;background:${d}15;border:1.5px solid ${d};display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;">
                                    ${v&&h?`<img src="${h}" style="width:100%;height:100%;object-fit:contain;" alt="">`:u}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${w(m||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${d};letter-spacing:1px;">${w(x||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${w(b||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${d};background:${d}0a;border:1px solid ${d}25;">${w(x)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${d};background:${d}0a;border:1px solid ${d}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${d}08;border:1px solid ${d}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${d};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${d};">${w(y.toUpperCase())}</div>
                                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${d}</div>
                            </div>
                        </div>

                        <!-- Cost summary -->
                        <div style="padding:8px;background:rgba(204,85,85,0.04);border:1px solid rgba(204,85,85,0.12);margin-top:auto;">
                            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-dim);margin-bottom:4px;">COST SUMMARY</div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Party Funds</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">$150k</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Momentum</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c55;">-10 (${o} → ${Math.max(1,o-10)})</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Approval</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c55;">-3 all blocs</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Cooldown</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">120 ticks</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;border-top:1px solid var(--border-main);margin-top:3px;padding-top:3px;"><span style="font-size:9px;color:#5c5;">Gain</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#5c5;">"Fresh Start" modifier</span></div>
                        </div>
                    </div>
                </div>

                <div class="pa-modal-footer" style="justify-content:space-between;">
                    <div style="max-width:400px;font-size:9px;color:var(--text-secondary);line-height:1.5;" id="rb-footer-msg">
                        ${f.current?'<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>':"This will change your party's identity across all UI, media, and diplomatic channels."}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${f.current?`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        `:`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=n.current,t._rbUseCustomLogo=c.current,r(),t.classList.add("active"),t.addEventListener("change",function(y){if(y.target.id==="rb-logo-file"){const u=y.target.files?.[0];if(!u)return;if(u.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(u.size/(1024*1024)).toFixed(1)+"MB"),y.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(u.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),y.target.value="";return}l.current=u,n.current=null,c.current=!0,t._rbCustomLogoFile=u,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,r()}}),t.addEventListener("click",function d(y){if(y.target===t||y.target.closest("#rb-close")||y.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",d);return}const u=y.target.closest(".rb-color-swatch");if(u){s.current=u.dataset.hex,r();return}const v=y.target.closest(".rb-logo-item");if(v){i.current=parseInt(v.dataset.idx)||0,c.current=!1,t._rbUseCustomLogo=!1,r();return}if(y.target.closest("#rb-remove-logo")){n.current=null,l.current=null,c.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,r();return}if(y.target.closest("#rb-submit")){const h=document.getElementById("rb-name")?.value?.trim()||"",m=document.getElementById("rb-abbr")?.value?.trim()||"";if(h.length<3||m.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}f.current=!0,r();return}if(y.target.closest("#rb-back")){f.current=!1,r();return}if(y.target.closest("#rb-confirm")){fo(t,a,d);return}})}async function fo(a,t,e){const o=g.faction,s=document.getElementById("rb-name")?.value?.trim()||"",i=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const n=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||o.party_color,l=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,c=l!=null?se[parseInt(l)]?.emoji:null,f=a._rbCustomLogoFile,p=a._rbUseCustomLogo,r=a._rbCustomLogoUrl,d=document.getElementById("rb-confirm");d&&(d.disabled=!0,d.textContent="Rebranding...");try{const y=g.shard?.current_tick||0;let u=r;if(p&&f){const b=f.name.split(".").pop()?.toLowerCase()||"png",_=`${o.id}/logo_${Date.now()}.${b}`,{data:M,error:C}=await k.storage.from("party-logos").upload(_,f,{cacheControl:"3600",upsert:!0,contentType:f.type});if(C){console.error("[Rebrand] Logo upload failed:",C.message),alert("Logo upload failed: "+C.message);return}const{data:E}=k.storage.from("party-logos").getPublicUrl(_);u=E?.publicUrl||null}else p||(u=null);const v=15e4,h=o.party_funds||0;if(h<v){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $150k.`);return}const m=h-v,x=Math.max(1,(o.momentum||0)-10);await k.from("factions").update({party_funds:m,momentum:x,faction_name:s,abbreviation:i.toUpperCase(),party_color:n,party_logo:p?null:c,custom_logo_url:u,rebrand_cooldown_until_tick:y+120}).eq("id",o.id),await k.from("campaign_actions").insert({party_id:o.id,nation_id:g.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:y,result:{oldName:o.faction_name,newName:s,oldAbbr:o.abbreviation,newAbbr:i,oldColor:o.party_color,newColor:n}}),o.party_funds=m,o.momentum=x,o.faction_name=s,o.abbreviation=i.toUpperCase(),o.party_color=n,o.party_logo=p?null:c,o.custom_logo_url=u,a.classList.remove("active"),a.removeEventListener("click",e),O(t)}catch(y){console.error("[PartyActions] Rebrand error:",y),alert("Failed to rebrand: "+(y.message||y))}finally{d&&(d.disabled=!1,d.textContent="⚠ Confirm Rebrand")}}const Ze=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1},{id:"petition_for_reform",name:"Petition for Reform",desc:"Organize a popular petition for political reform. Roll 1d100 + petition strength (education, professional/cultural/religious rapport, inequality, low SoL, crown authority). 0-40 ignored; 41-69 grants minor reform; 70+ forces major reform.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["POLITICAL","MONARCHY"],locked:!1,monarchyOnly:!0,cooldownTicks:6}];function vo(a){const t=q,e=X(t.first_name,t.last_name),o=dt(t.skill),s=rt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',i=K(g?.nation),n=Number(g?.shard?.current_tick)||0,l=g?.faction,f=Ze.filter(p=>!p.monarchyOnly||i).map(p=>{let r=null;if(p.id==="petition_for_reform"&&p.cooldownTicks){if(l?._petitionPending&&(r="A petition is already pending in this nation."),!r){const v=Number(l?.last_petition_for_reform_tick);if(Number.isFinite(v)&&v>0){const h=v+p.cooldownTicks;n<h&&(r=`Cooldown — ready at tick ${h}.`)}}const u=Number(l?.party_funds)||0;!r&&u<p.moneyCost&&(r="Insufficient party funds.")}const d=p.locked||!!r,y=p.tags.map(u=>`<span class="pa-action-tag" style="color:${Et[u]||"var(--text-dim)"};">${u}</span>`).join("");return`
            <div class="pa-action-item ${d?"locked":""}" data-action-id="${p.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${w(p.name)}</span>
                        <div class="pa-action-tags">${y}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${p.costColor};">${p.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${w(p.desc)}</div>
                ${r||p.locked&&p.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${w(r||p.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${e}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                        <span class="pa-detail-name">${w(t.first_name)} ${w(t.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${w(a.fullTitle)}, Age ${t.age}${s}</div>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;">SKILL</div>
                <div style="display:flex;align-items:center;gap:4px;margin-top:1px;">
                    <div style="width:40px;height:3px;background:var(--border-mid);"><div style="height:100%;width:${t.skill}%;background:${o.color};"></div></div>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o.color};">${t.skill}</span>
                </div>
            </div>
        </div>
        ${t.background?`<div style="padding:6px 16px;border:1px solid var(--border-main);border-top:none;border-bottom:none;background:var(--bg-panel);font-size:9px;color:var(--text-dim);font-style:italic;">${w(t.background)}</div>`:""}
        <div class="pa-actions-list">
            ${f}
        </div>
        ${uo()}
        <div class="pa-skill-footer">
            <span style="color:${a.color};font-weight:700;">${a.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${o.color};font-weight:700;">${o.label}</span>: ${o.desc}
        </div>
    `}function uo(){if(ne.length===0)return"";const a=g.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${ne.map(e=>{const o=Pt.find(m=>m.key===e.target_ministry),s=o?o.label:e.target_ministry,i=o?o.icon:"⚖️",n=me(e.corruption_growth||0),l=it[e.tier]||it[1],c=e.status==="active",f=Math.max(0,a-e.filed_at_tick),p=8,r=Math.min(1,f/p),d=Math.max(0,e.resolves_at_tick-a),y=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],u=y.map(m=>{const x=e.filed_at_tick+m.tick,b=a>=x,_=a>=x&&(m.tick===8||a<e.filed_at_tick+y[y.indexOf(m)+1]?.tick),M=m.tick/p*100;return`<div class="pa-ls-milestone ${b?"passed":""} ${_?"current":""}" style="left:${M}%;" title="${m.label} (Tick ${x})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${m.label}</div>
            </div>`}).join("");let v="";if(!c){const m=l===it[1]?"FRIVOLOUS":l===it[2]?"PARTIAL WIN":l===it[3]?"MAJOR WIN":"DEVASTATING",x=e.tier===1?"var(--red)":e.tier===2?"#ca5":e.tier===3?"#c84":"var(--green)";v=`<span class="pa-ls-tier-badge" style="color:${x};border-color:${x}44;background:${x}0a;">${m}</span>`}const h=c?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${e.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${e.momentum_effect>=0?"+":""}${e.momentum_effect} Mom</span>
                <span style="color:${e.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${e.gov_momentum_effect>=0?"+":""}${e.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${c?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${i}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${w(s)}</span>
                        <span class="pa-ls-tier-badge" style="color:${n.color};border-color:${n.color}44;background:${n.color}0a;">TIER ${e.tier}</span>
                        ${v}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${c?`${d} ticks left`:`Resolved tick ${e.resolves_at_tick}`}
                    </div>
                </div>
                ${c?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${r*100}%;"></div>
                        </div>
                        ${u}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${n.color};font-weight:700;">${(e.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${w(n.label)}
                </div>
                ${h}
            </div>
        `}).join("")}
        </div>
    `}let Yt=!1;async function yo(){if(Yt)return;const a=g.faction;if(!a)return;const t=Ze.find(e=>e.id==="petition_for_reform");if(t&&confirm(`File a Petition for Reform?

Cost: ${t.cost} (party funds)
${t.cooldownTicks}-tick cooldown after use.

The monarch has 3 ticks to respond. If they don't, the petition is accepted by default.`)){Yt=!0;try{const{data:e,error:o}=await k.rpc("petition_for_reform");if(o){alert("Petition failed: "+o.message);return}if(!e?.success){const i=e?.reason||"unknown error",n=e?.got_government_type?`

(government_type in DB: "${e.got_government_type}")`:"";alert("Could not file petition: "+i+n);return}a.party_funds=Math.max(0,(Number(a.party_funds)||0)-t.moneyCost),a.last_petition_for_reform_tick=Number(g?.shard?.current_tick)||0,a._petitionPending=!0,alert(`Petition filed. The nation now waits for the throne's response.

Track the petition in Government → Administrative → Pressing Issues.`);const s=document.getElementById("pa-actions-panel");s&&(s.innerHTML=ye(null,null,a)),window.dispatchEvent(new CustomEvent("petition:filed",{detail:{petitionId:e.petition_id}}))}catch(e){alert("Petition failed: "+(e?.message||e))}finally{Yt=!1}}}const Rt={geological_survey_minerals:{rpc:"geological_survey_minerals",nextCostRpc:"geological_survey_minerals_next_cost",cooldownRpc:"geological_survey_minerals_cooldown_until",ministryKey:"interior",ministryName:"Interior Ministry",actionLabel:"Geological Survey",actionNoun:"survey",costEscalation:"doubles",cooldownTicks:12,oddsHint:"Higher current Minerals improves your odds of a meaningful find.",primaryStat:"minerals",primaryStatLabel:"Minerals",bonusLabel:"minerals bonus",secondaryStat:null,secondaryStatLabel:null,bucketLabels:{none:"No Findings",small:"Small Find",moderate:"Moderate Find",major:"Major Discovery"},lockLineClass:"pa-gs-lock-line"},national_energy_survey:{rpc:"national_energy_survey",nextCostRpc:"national_energy_survey_next_cost",cooldownRpc:"national_energy_survey_cooldown_until",ministryKey:"energy",ministryName:"Energy Ministry",actionLabel:"National Energy Survey",actionNoun:"survey",costEscalation:"triples",cooldownTicks:24,oddsHint:"Lower current Energy improves your odds of a meaningful find.",primaryStat:"energy",primaryStatLabel:"Energy",bonusLabel:"energy headroom bonus",secondaryStat:null,secondaryStatLabel:null,bucketLabels:{none:"No Findings",modest:"Workable Opportunity",major:"Transformative Discovery"},lockLineClass:"pa-es-lock-line"},agricultural_expansion:{rpc:"agricultural_expansion",nextCostRpc:"agricultural_expansion_next_cost",cooldownRpc:"agricultural_expansion_cooldown_until",ministryKey:"interior",ministryName:"Interior Ministry",actionLabel:"Agricultural Expansion",actionNoun:"expansion",costEscalation:"doubles",cooldownTicks:12,oddsHint:"Lower current Farmland improves your odds. A Major result also displaces industry.",primaryStat:"farmland",primaryStatLabel:"Farmland",bonusLabel:"land-use bonus",secondaryStat:"industry",secondaryStatLabel:"Industry",bucketLabels:{none:"No Viable Zones",small:"Modest Reclamation",moderate:"Regional Reclamation Program",major:"Sweeping Land-Use Reform"},lockLineClass:"pa-ae-lock-line"}};function go(a){return/^[aeiou]/i.test(a)?"an":"a"}async function bo(a,t){if(qt.has(a)||!t)return;const e=Rt[a];if(!e)return;const o=document.querySelector(`.pa-action-item[data-action-id="${a}"] .pa-action-cost`)?.textContent?.trim()||"",s=/^\$\d/.test(o)?`Cost: ${o} (charged from ${e.ministryName} discretionary budget).
`:`Cost is charged from ${e.ministryName} discretionary budget.
`;if(confirm(`Commission ${go(e.actionLabel)} ${e.actionLabel}?

`+s+`Cost ${e.costEscalation} every use. ${e.cooldownTicks}-tick cooldown after firing.

`+e.oddsHint)){qt.add(a);try{const{data:i,error:n}=await k.rpc(e.rpc);if(n){alert(`${e.actionLabel} failed: ${n.message}`);return}if(!i?.success){const m=i?.reason||"unknown error";let x="";i?.reason==="insufficient_balance"&&i?.cost?x=`

(needed $${Math.round(Number(i.cost)/1e6)}, have $${Math.round(Number(i.balance)/1e6)})`:i?.reason==="cooldown"&&i?.ready_at_tick&&(x=`

Next ${e.actionNoun} ready at tick ${i.ready_at_tick}.`),alert(`Could not run ${e.actionNoun}: ${m}${x}`),ea(a);return}const l=e.bucketLabels[i.bucket]||i.bucket,c=(Number(i.total)-Number(i.d100)).toFixed(1),f=i[`${e.primaryStat}_before`],p=i[`${e.primaryStat}_after`],r=Number(p)-Number(f),d=`${e.primaryStatLabel}: ${f} → ${p}`+(r>0?" (+"+r+")":"");let y="";if(e.secondaryStat){const m=Number(i[`${e.secondaryStat}_delta`]||0);m>0&&(y=`
`+e.secondaryStatLabel+": "+i[`${e.secondaryStat}_before`]+" → "+i[`${e.secondaryStat}_after`]+" (-"+m+")")}alert(e.actionLabel+" — "+l+`

Roll: `+i.d100+" + "+c+" ("+e.bonusLabel+") = "+i.total+`
`+d+y+`

`+(i.description||"")),g?.nation&&(g.nation[e.primaryStat]=Number(p),e.secondaryStat&&(g.nation[e.secondaryStat]=Number(i[`${e.secondaryStat}_after`])));const u=(ft||[]).find(m=>m.ministry_key===e.ministryKey);if(u){const m=Number(i.cost_paid)||0;u.discretionary_balance=Math.max(0,Number(u.discretionary_balance||0)-m)}const v=document.getElementById("pa-actions-panel");v&&(v.innerHTML=ye(null,null,t));const h=document.querySelector(`.pa-action-item[data-action-id="${a}"]`);h&&ta(h,e,Number(i.next_cost),i.cooldown_until!=null?Number(i.cooldown_until):null)}catch(i){alert(`${e.actionLabel} failed: ${i?.message||i}`)}finally{qt.delete(a)}}}function ta(a,t,e,o){const s=a.querySelector(".pa-action-cost");s&&Number.isFinite(e)&&e>0&&(s.textContent="$"+Math.round(e/1e6));const i=Number(g?.shard?.current_tick)||0,n=(ft||[]).find(p=>p.ministry_key===t.ministryKey),l=Number(n?.discretionary_balance??0);let c="";if(Number.isFinite(o)&&o>i){const p=o-i;c=`Cooldown — next ${t.actionNoun} ready at tick ${o} (${p} tick${p===1?"":"s"} away).`}else if(Number.isFinite(e)&&l<e){const p=Math.round(e/1e6);c=`${t.ministryName} discretionary budget is below $${p} — next ${t.actionNoun} cost has outgrown the budget.`}const f=a.querySelector("."+t.lockLineClass);if(c)if(a.classList.add("locked"),f){const p=f.querySelector("span:last-child");p&&(p.textContent=c)}else{const p=document.createElement("div");p.className=t.lockLineClass,p.style.cssText="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;";const r=document.createElement("span");r.textContent="⊘";const d=document.createElement("span");d.textContent=c,p.appendChild(r),p.appendChild(d),a.appendChild(p)}else a.classList.remove("locked"),f&&f.remove()}async function ea(a){const t=Rt[a];if(!t)return;const e=document.querySelector(`.pa-action-item[data-action-id="${a}"]`);if(!e)return;const o=g?.nation?.id;if(!o)return;let s,i;try{[s,i]=await Promise.all([k.rpc(t.nextCostRpc,{p_nation_id:o}),k.rpc(t.cooldownRpc,{p_nation_id:o})])}catch(c){console.warn(`[${t.actionLabel}] RPC fetch threw:`,c?.message||c);return}s.error&&console.warn(`[${t.actionLabel}] next_cost RPC failed:`,s.error.message),i.error&&console.warn(`[${t.actionLabel}] cooldown_until RPC failed:`,i.error.message);const n=Number(s.data),l=i.data!=null?Number(i.data):null;ta(e,t,n,l)}let Wt=!1;async function Le(a){const t=document.getElementById("pa-hire-modal");if(!t)return;const e=g.nation?.id,o=g.nation?.name;if(!e||!o)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await La(k,e,o);let i=null;function n(){const l=i!=null?s[i]:null,c=l?dt(l.skill):null,f=s.map((d,y)=>{const u=i===y,v=dt(d.skill);return`<div class="pa-hire-row ${u?"selected":""}" data-idx="${y}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${X(d.first_name,d.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${u?"var(--text-bright)":"var(--text-secondary)"};">${w(d.first_name)} ${w(d.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${d.skill}%;background:${v.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${v.color};">${d.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${d.age}</div>
            </div>`}).join("");let p;l?p=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${X(l.first_name,l.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${w(l.first_name)} ${w(l.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${l.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${l.skill}%;background:${c.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c.color};">${l.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${c.color};margin-top:3px;font-weight:700;">${c.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(l.hire_cost/1e3).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${w(l.background)}</div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">SKILL ASSESSMENT</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${c.desc}</div>
                    </div>

                    <div style="padding:8px 10px;background:rgba(212,74,74,0.04);border:1px solid rgba(212,74,74,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;letter-spacing:0.06em;margin-bottom:3px;">ROLE: OPPOSITION COORDINATOR</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Files lawsuits against the government, organizes protests, and leads legal challenges. Skill affects success rates of legal and direct actions. Available only when your party is in opposition.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(l.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(g.faction?.party_funds||0)<l.hire_cost?' disabled title="Not enough funds"':""}>Hire ${w(l.first_name)}</button>
                </div>
            `:p=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                        ${f}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${p}
                    </div>
                </div>
            </div>
        `;const r=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",r),t.onclick=d=>{d.target===t&&r()},document.getElementById("pa-hire-list")?.addEventListener("click",d=>{const y=d.target.closest(".pa-hire-row");y&&(i=parseInt(y.dataset.idx,10),n())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Wt||i==null)return;Wt=!0;const d=document.getElementById("pa-hire-confirm");d&&(d.disabled=!0,d.textContent="Hiring...");try{const y=g.shard?.current_tick||0,u=s[i],v=u.hire_cost||0,h=g.faction?.party_funds||0;if(v>0&&h<v){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $${Math.round(v/1e3)}k.`);return}if(v>0){const x=h-v,{error:b}=await k.from("factions").update({party_funds:x}).eq("id",g.faction.id);if(b){alert("Failed to deduct funds.");return}g.faction.party_funds=x}const m=await Na(k,g.faction?.id,u,y);if(!m.success){alert(m.error||"Failed to hire agitator.");return}q=m.agitator,V="agitator",r(),O(a)}catch(y){console.error("[PartyActions] Hire agitator error:",y)}finally{Wt=!1,d&&(d.disabled=!1)}})}n()}let Lt=!1;function xo(a){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!B){alert("No active government to file against.");return}const e=g.faction,o=q;let s=null,i=null;function n(){const l=s&&i,c=Pt.map(r=>{const d=s===r.key;return`<div class="pa-lawsuit-target ${d?"selected":""}" data-target="${r.key}">
                <span style="font-size:18px;">${r.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${w(r.label)}</span>
            </div>`}).join(""),f=Ue.map(r=>{const d=i===r.key;return`<div class="pa-lawsuit-basis ${d?"selected":""}" data-basis="${r.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${d?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${d?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${w(r.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${w(r.desc)}</div>
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

                ${o?`<div style="padding:6px 16px;border-bottom:1px solid var(--border-main);background:rgba(212,74,74,0.04);display:flex;align-items:center;gap:8px;">
                    <span style="width:5px;height:5px;border-radius:50%;background:#d44a4a;display:inline-block;"></span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Filed by:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">${w(o.first_name)} ${w(o.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Skill ${o.skill}</span>
                </div>`:""}

                <div class="pa-modal-body" style="gap:16px;">
                    <div>
                        <div class="pa-modal-step-label">1 &mdash; Target Ministry</div>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;" id="pa-lawsuit-targets">${c}</div>
                    </div>

                    <div>
                        <div class="pa-modal-step-label">2 &mdash; Legal Basis</div>
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${f}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${l?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const p=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",p),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",p),t.onclick=r=>{r.target===t&&p()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",r=>{const d=r.target.closest(".pa-lawsuit-target");d&&(s=d.dataset.target,n())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",r=>{const d=r.target.closest(".pa-lawsuit-basis");d&&(i=d.dataset.basis,n())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(Lt||!s||!i)return;Lt=!0;const r=document.getElementById("pa-lawsuit-submit");r&&(r.disabled=!0,r.textContent="Filing...");try{const{data:y}=await k.from("factions").select("party_funds").eq("id",e.id).single(),u=y?.party_funds||0;if(u<25e4){alert(`Not enough funds. You have $${Math.round(u/1e3)}k, need $250k.`),Lt=!1,r&&(r.disabled=!1,r.textContent="File Lawsuit");return}const v=u-25e4;await k.from("factions").update({party_funds:v}).eq("id",e.id),e.party_funds=v,sessionStorage.removeItem("nationhood_state");const h=g.shard?.current_tick||0,m=await Aa(k,{factionId:e?.id,nationId:g.nation?.id,agitatorId:o?.id,targetMinistry:s,basis:i,currentTick:h,partyName:e?.faction_name||"Opposition",administration:B});if(!m.success){alert(m.error||"Failed to file lawsuit.");return}const x=me(m.lawsuit?.corruption_growth||0),b=it[m.tier]||it[1];p(),alert(`Lawsuit filed against ${Pt.find(_=>_.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),O(a)}catch(d){console.error("[PartyActions] File lawsuit error:",d),alert("An error occurred. Please try again.")}finally{Lt=!1,r&&(r.disabled=!1,r.textContent="File Lawsuit")}})}t.classList.add("active"),n()}async function ho(a){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const e=g.nation,o=g.faction,{data:s}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),i=s||[];let n=null,l=!1;const{data:c}=await k.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",e.id).eq("active",!0).maybeSingle();function f(){const p=i.find(v=>v.id===n),r=c?`${c.first_name} ${c.last_name}`:null,d=c?.factions?.faction_name||null,y=c&&n===c.faction_id;t.innerHTML=`
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
                    ${r?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${w(r)}</strong> (${w(d||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${i.map(v=>{const h=v.id===n,m=c&&v.id===c.faction_id,x=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"?";return`<div class="pa-action-item ${h?"selected":""}" data-party-id="${v.id}" style="cursor:pointer;${h?`border-color:${v.party_color||"#888"};background:${v.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${w(v.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${w(x)}, Age ${v.leader_age||"?"} · ${v.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${m?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!p||l||y?"disabled":""} style="background:#c8a832;">${p?y?"Already PM":`Appoint ${w(p.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const u=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",u),document.getElementById("apm-cancel")?.addEventListener("click",u),t.onclick=v=>{v.target===t&&u()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const h=v.target.closest("[data-party-id]");h&&(n=h.dataset.partyId,f())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!n||l)return;const v=i.find(m=>m.id===n);if(!v||!confirm(`Appoint ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister?`))return;l=!0;const h=document.getElementById("apm-confirm");h&&(h.disabled=!0,h.textContent="Appointing...");try{const m=g.shard?.current_tick||0;await ya(k,{nationId:e.id,factionId:n,firstName:v.leader_first_name||"Unknown",lastName:v.leader_last_name||"Unknown",age:v.leader_age||50,currentTick:m});try{await k.from("government_formations").update({status:"dissolved"}).eq("nation_id",e.id).in("status",["formed","caretaker","active"]);const{data:$}=await k.from("shard").select("current_date").eq("name","Alpha Shard").single();await k.from("government_formations").insert({nation_id:e.id,election_id:null,proposed_by:o.id,party_ids:[n],status:"formed",formation_type:"monarchy",formed_at:new Date().toISOString(),ministry_assignments:{prime_minister:n},game_year:$?.current_date||""})}catch($){console.warn("[AppointPM] government_formations write failed (non-blocking — synthetic fallback still works):",$?.message||$)}let x=0;const b=e.monarch_faction_id,_=c?.faction_id||null,M=_&&_!==b&&_!==n,C=n!==b&&n!==_;if(M&&(x-=4),C&&(x+=3),x!==0){const $=Number(e.crown_authority??50),S=Math.max(0,Math.min(100,$+x));try{await k.from("nations").update({crown_authority:S}).eq("id",e.id),e.crown_authority=S}catch{}}try{await k.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${e.monarch_title||"The King"} has appointed ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister.`,fired_at_tick:m})}catch{}u();const E=x>0?`

Crown Authority +${x}.`:x<0?`

Crown Authority ${x}.`:"";alert(`${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} has been appointed Prime Minister.${E}`),O(a)}catch(m){alert("Failed to appoint PM: "+(m.message||"Error")),l=!1,h&&(h.disabled=!1,h.textContent=`Appoint ${w(v.faction_name)}`)}})}t.classList.add("active"),f()}async function _o(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const e=g.nation,o=g.faction,s=o.seats||0,i=e?.total_seats||100,{data:n}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),l=(n||[]).filter(d=>d.id!==o.id);let c=null;const f=Math.max(0,s-1);let p=Math.min(5,f||1);function r(){const d=l.find(u=>u.id===c);t.innerHTML=`
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
                    Grant parliamentary seats to a noble house. Each seat granted earns <span style="color:#5cc55c;font-weight:700;">+0.5 Crown Authority</span>.
                    You currently hold <strong>${s}</strong> of ${i} seats.
                    ${s/i>.7?'<div style="color:#d44a4a;font-weight:700;margin-top:4px;">⚠ You hold >70% of seats — tyranny crown authority decay active!</div>':""}
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${l.length>0?l.map(u=>{const v=u.id===c;return`<div class="pa-action-item ${v?"selected":""}" data-faction-id="${u.id}" style="cursor:pointer;${v?`border-color:${u.party_color||"#888"};background:${u.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${u.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${w(u.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,u.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${d?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${f}" value="${p}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${p}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Crown Authority gain: <span style="color:#5cc55c;font-weight:700;">+${(p*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-p} &middot; Their seats after: ${(d.seats||0)+p}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${d?"":"disabled"} style="background:#c8a832;">Grant ${p} Seats</button>
                </div>
            </div>
        `;const y=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",y),document.getElementById("royal-cancel")?.addEventListener("click",y),t.onclick=u=>{u.target===t&&y()},t.querySelector(".pa-modal-body")?.addEventListener("click",u=>{const v=u.target.closest("[data-faction-id]");v&&(c=v.dataset.factionId,r())}),document.getElementById("grant-slider")?.addEventListener("input",u=>{p=parseInt(u.target.value)||1,document.getElementById("grant-count").textContent=p;const v=document.getElementById("royal-grant");v&&(v.textContent=`Grant ${p} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!c||mt)return;mt=!0;const u=document.getElementById("royal-grant");u&&(u.disabled=!0,u.textContent="Granting...");try{const{data:v}=await k.from("factions").select("id, faction_name, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null),h=(v||[]).find(I=>I.id===o.id),m=(v||[]).find(I=>I.id===c);if(!h||!m){alert("Faction not found.");return}const x=(v||[]).reduce((I,N)=>I+Math.max(0,N.seats||0),0),b=new Map;for(const I of v||[])b.set(I.id,Math.max(0,I.seats||0));let _=p;const M=Math.max(0,(b.get(o.id)||0)-1),C=Math.min(_,M);if(C>0&&(b.set(o.id,(b.get(o.id)||0)-C),_-=C),_>0){const I=(v||[]).filter(A=>A.id!==o.id&&A.id!==c&&(b.get(A.id)||0)>0);let N=I.reduce((A,z)=>A+(b.get(z.id)||0),0);for(const A of I){if(_<=0||N<=0)break;const z=Math.round(_*(b.get(A.id)||0)/N),j=Math.min(z,b.get(A.id)||0,_);j>0&&(b.set(A.id,(b.get(A.id)||0)-j),N-=j,_-=j)}if(_>0)for(const A of I){if(_<=0)break;const z=b.get(A.id)||0,j=Math.min(_,z);j>0&&(b.set(A.id,z-j),_-=j)}}const E=p-_;if(E<=0){alert("No seats available to grant.");return}b.set(c,(b.get(c)||0)+E);let $=0;for(const I of b.values())$+=I;if($!==x){console.error("[GrantSeats] Conservation violated",{sumBefore:x,sumAfter:$,grantAmount:p,actualGrant:E}),alert("Internal error: seat totals would not balance. Aborting.");return}const S=[];for(const I of v||[]){const N=Math.max(0,I.seats||0),A=b.get(I.id)||0;N!==A&&S.push({id:I.id,seats:A})}for(const I of S){const{error:N}=await k.from("factions").update({seats:I.seats}).eq("id",I.id);if(N){alert("Failed to grant seats: "+N.message);return}}const L=E*.5,T=Math.min(100,(Number(e.crown_authority)||50)+L),{error:P}=await k.from("nations").update({crown_authority:T}).eq("id",e.id);if(P){alert("Failed to update crown authority.");return}o.seats=b.get(o.id)||0,e.crown_authority=T;try{const I=l.find(N=>N.id===c);await k.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} grants ${E} seats to ${I?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${e.monarch_title||"King"} has granted ${E} parliamentary seat${E!==1?"s":""} to ${I?.faction_name}. Crown Authority +${L.toFixed(1)}.`,fired_at_tick:g.shard?.current_tick||0})}catch{}y(),O(a)}catch(v){console.error("[GrantSeats] Error:",v),alert("Failed to grant seats.")}finally{mt=!1}})}t.classList.add("active"),r()}async function wo(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const e=g.nation,o=g.faction,{data:s}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),i=(s||[]).filter(f=>f.id!==o.id&&(f.seats||0)>0);let n=null,l=1;function c(){const f=i.find(v=>v.id===n),p=f&&f.seats||0,d=l*1e5,y=o.party_funds||0;t.innerHTML=`
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
                    <span style="color:#d44a4a;font-weight:700;">-1 Crown Authority per seat</span>. Revoked seats return to the crown.
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${i.length>0?i.map(v=>{const h=v.id===n;return`<div class="pa-action-item ${h?"selected":""}" data-faction-id="${v.id}" style="cursor:pointer;${h?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${w(v.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${v.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${f?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${p}" value="${l}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${l}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(d/1e3)}k</span>
                                &middot; Crown Authority: <span style="color:#d44a4a;font-weight:700;">-${l}</span>
                                ${y<d?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!f||y<d?"disabled":""} style="background:#d44a4a;">Revoke ${l} Seats</button>
                </div>
            </div>
        `;const u=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",u),document.getElementById("royal-cancel")?.addEventListener("click",u),t.onclick=v=>{v.target===t&&u()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const h=v.target.closest("[data-faction-id]");h&&(n=h.dataset.factionId,l=1,c())}),document.getElementById("revoke-slider")?.addEventListener("input",v=>{l=parseInt(v.target.value)||1,document.getElementById("revoke-count").textContent=l;const h=document.getElementById("royal-revoke");h&&(h.textContent=`Revoke ${l} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!n||mt)return;mt=!0;const v=document.getElementById("royal-revoke");v&&(v.disabled=!0,v.textContent="Revoking...");try{const h=l*1e5,{data:m}=await k.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null),x=(m||[]).find(z=>z.id===o.id),b=(m||[]).find(z=>z.id===n);if(!x||!b){alert("Faction not found.");return}const _=x.party_funds||0;if(_<h){alert("Not enough funds.");return}const M=(m||[]).reduce((z,j)=>z+Math.max(0,j.seats||0),0),C=Math.min(l,b.seats||0);if(C<=0){alert("Target has no seats to revoke.");return}const E=_-h,$=(x.seats||0)+C,S=(b.seats||0)-C,L=C,T=Math.max(0,(Number(e.crown_authority)||50)-L),P=M-(x.seats||0)-(b.seats||0)+$+S;if(P!==M){console.error("[RevokeSeats] Conservation violated",{sumBefore:M,sumAfter:P,take:C}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:I}=await k.from("factions").update({seats:$,party_funds:E}).eq("id",o.id);if(I){alert("Failed to revoke seats: "+I.message);return}const{error:N}=await k.from("factions").update({seats:S}).eq("id",n);if(N){alert("Failed to revoke seats: "+N.message);return}const{error:A}=await k.from("nations").update({crown_authority:T}).eq("id",e.id);if(A){alert("Failed to update crown authority.");return}o.seats=$,o.party_funds=E,e.crown_authority=T,sessionStorage.removeItem("nationhood_state");try{await k.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} revokes ${C} seats from ${b.faction_name||"unknown"}`,category:"political",description_chosen:`The ${e.monarch_title||"King"} has revoked ${C} seat${C!==1?"s":""} from ${b.faction_name}. Crown Authority -${L}.`,fired_at_tick:g.shard?.current_tick||0})}catch{}u(),O(a)}catch(h){console.error("[RevokeSeats] Error:",h),alert("Failed to revoke seats.")}finally{mt=!1}})}t.classList.add("active"),c()}let Kt=!1;async function $o(){if(Kt||!g?.faction?.id||!g?.nation?.id)return;if(!Ht(g.nation)){alert("Early elections are only available in parliamentary and semi-presidential systems.");return}if(K(g.nation)){alert("Elections are not held under absolute monarchy.");return}const a=B?.pm_party_id;if(!a||a!==g.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚡ CALL EARLY ELECTIONS?

Dissolves the legislature and puts the government into caretaker status.
Election fires after a short formation window.

Momentum effect depends on Gov. Approval:
• >50  → PM party +3 Momentum (fresh mandate)
• 35–50 → neutral
• <35  → opposition +5 Momentum each, +3 Stability

Proceed?`)){Kt=!0;try{const t=Array.isArray(B?.party_ids)?B.party_ids:B?.pm_party_id?[B.pm_party_id]:[],e=await wa(k,g.nation.id,a,t);if(e&&e.success===!1){alert("Could not call early elections: "+(e.error||"unknown error"));return}alert("⚡ Early elections called. Government is now in caretaker status."),window.location.reload()}catch(t){console.error("[PartyActions] Call early elections failed:",t),alert("Failed to call early elections: "+(t?.message||"unknown error"))}finally{Kt=!1}}}let Jt=!1,Xt=!1;async function ko(){if(!Xt&&g?.nation?.id&&confirm(`FORM MINORITY GOVERNMENT?

Consequences:
• Your party governs alone — no coalition partners
• Bills pass with -20% effective YES votes
• A snap election fires automatically in 36 ticks if a stable
  coalition isn't formed before then
• Other parties’ ministers are dismissed; only your PM remains

Proceed?`)){Xt=!0;try{const a=await ua(k,g.nation.id);if(!a?.success){const e={invalid_nation:"Nation context unavailable. Reload and try again.",not_parliamentary:"This action only applies to parliamentary governments.",not_party_leader:"Only a party leader can form a minority government.",no_shard:"Game state unavailable.",no_election:"No completed election to form a government from.",gate_not_elapsed:"The coalition window has not yet closed.",majority_exists:"A party already holds an outright majority — form a normal government instead.",coalition_exists:"A government has already been formed for this cycle.",already_minority:"A minority government is already in place.",no_active_parties:"No active parties qualify to form a government.",not_largest_active:"Only the largest active party may form a minority government.",rpc_failed:a?.error||"Server error — try again."}[a?.reason]||a?.reason||"Unknown error";alert(`Could not form minority government:

`+e);return}alert("Minority government formed."),window.location.reload()}catch(a){console.error("[PartyActions] Form Minority Government failed:",a),alert("Failed to form minority government: "+(a?.message||a))}finally{Xt=!1}}}async function Eo(){if(!Jt&&g?.faction?.id&&confirm(`LEAVE COALITION?

Consequences:
• −3 Momentum to your party
• −5 Momentum to the Prime Minister’s party
• Any ministries you hold will be vacated
• Your party moves from governing to opposition
• Coalition flips to minority if your exit drops it below majority
• 12-tick cooldown before you can leave another coalition

Proceed?`)){Jt=!0;try{const{data:a,error:t}=await k.rpc("leave_coalition",{p_faction_id:g.faction.id});if(t)throw t;if(a&&a.success===!1)throw new Error(a.error||"Unknown error");const e=a?.became_minority?`

The government is now a minority.`:"",o=(a?.ministries_vacated||0)>0?`

${a.ministries_vacated} ministr${a.ministries_vacated===1?"y":"ies"} vacated.`:"";alert("You have left the coalition."+e+o),window.location.reload()}catch(a){console.error("[PartyActions] Leave Coalition failed:",a),alert("Failed to leave coalition: "+(a?.message||a))}finally{Jt=!1}}}let Qt=!1;async function Co(a,t){if(!(Qt||_t)&&!(!g?.nation?.id||!t?.id)&&confirm(`LEADERSHIP CHALLENGE?

Claim the vacant Premiership for your party leader.
Resolves on the next tick. If multiple coalition parties claim, the
largest by seats wins (earliest claim breaks ties).

Winner gets +0.3 popularity across all voter sectors
(suppressed if your party held PM in the last 12 ticks).

Proceed?`)){Qt=!0;try{const{data:e}=await k.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=Number(e?.current_tick)||0,s=await va(k,g.nation,t,o);if(s?.success){_t=!0;const i=s.alreadyClaimed?"You already submitted this tick — sit tight, resolves next tick.":"Leadership Challenge submitted. Resolves on the next tick.";alert(i),O(a)}else{const n={wrong_gov_type:"Leadership Challenge is only available in parliamentary systems.",pm_already_installed:"A Prime Minister is already serving — vacancy required.",no_coalition:"No active coalition.",not_in_coalition:"Your party is not in the governing coalition.",not_owner:"This session is not authorized to act for that party. Refresh or re-select your faction; admins must deploy the admin-inspector Leadership Challenge migration.",no_leader:"Your party has no leader to install.",no_seats:"Your party holds no parliamentary seats.",rpc_failed:"Server function call failed. The claim_leadership_challenge RPC may not be deployed yet — run migration 20260917_claim_leadership_challenge_rpc.sql."}[s?.reason]||"Could not submit: "+(s?.reason||"unknown error"),l=s?.error?`

Detail: ${s.error}`:"";alert(n+l),console.warn("[LeadershipChallenge] failed:",s)}}catch(e){console.error("[PartyActions] Leadership Challenge failed:",e),alert("Leadership Challenge failed: "+(e?.message||e))}finally{Qt=!1}}}let Zt=!1;async function Io(){if(Zt||!g?.faction?.id||!g?.nation?.id)return;if(!Ht(g.nation)){alert("Resignation is only available in parliamentary and semi-presidential systems.");return}if(K(g.nation)){alert("Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action.");return}const a=B?.pm_party_id;if(!a||a!==g.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚠ RESIGN AS PRIME MINISTER?

The PM seat vacates immediately. Coalition enters caretaker status with
a ${De}-tick window to nominate a successor via the cabinet panel.
If a new PM is installed, the administration continues under new leadership.
If the window expires, a snap election is called.

Cost to your party:
• −3 Momentum
• −0.05 Credibility
• Nation: −3 Stability
• 12-tick bar from the PM seat on your party

Proceed?`)){Zt=!0;try{const{data:t}=await k.from("shard").select("current_tick").eq("name","Alpha Shard").single(),e=t?.current_tick||g.shard?.current_tick||0;(await fa(k,g.nation.id,g.faction.id,e))?.result==="election_called"?alert("You have resigned. Snap election scheduled as fallback if no successor is nominated."):alert("You have resigned. Coalition has a short window to nominate a successor before a snap election fires."),window.location.reload()}catch(t){console.error("[PartyActions] Resign PM failed:",t),alert("Failed to resign: "+(t?.message||"unknown error"))}finally{Zt=!1}}}let te=!1;async function Mo(){if(te||!g?.faction?.id)return;const a=g.faction,t=a.faction_name||"this party",e=a.seats||0,o=Number(a.momentum||0).toFixed(1),s=Math.round(Number(a.party_funds||0)),i=s>=1e3?"$"+s.toLocaleString():"$"+s;if(!confirm("DISBAND "+t.toUpperCase()+`?

This will permanently:
• Dissolve the party
• Vacate `+e+" seat"+(e===1?"":"s")+` in parliament (empty until next election; no backfill)
• Forfeit `+i+` in party funds
• Forfeit `+o+` momentum
• Remove you from every nation chat
• Cascade-delete platforms, ideology, bloc membership,
  and any pending bloc invitations

You will need to found a new party.
There is a 24-tick cooldown on disbanding.

This action CANNOT be undone.`))return;if(prompt('Type "DISBAND" to confirm dissolution of '+t+":")!=="DISBAND"){alert("Disband cancelled.");return}te=!0;try{const{data:l,error:c}=await k.rpc("disband_party",{p_faction_id:a.id});if(c)throw c;if(l&&l.success===!1)throw new Error(l.error||"Unknown error");sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:{user:f}}=await k.auth.getUser();if(f){const{data:p}=await k.from("factions").select("id, faction_type").or(`id.eq.${f.id},linked_user_id.eq.${f.id}`),r=(p||[]).find(y=>y.faction_type==="party"),d=(p||[]).find(y=>y.faction_type==="corporation");if(r){sessionStorage.setItem("active_faction_id",r.id),alert(t+` has been disbanded.

Redirecting to your other party.`),window.location.href="dashboard.html";return}if(d){sessionStorage.setItem("active_faction_id",d.id),alert(t+` has been disbanded.

Redirecting to your corporation.`),window.location.href="corp-dashboard.html";return}}alert(t+` has been disbanded.

You have no remaining factions.`),window.location.href="faction-select.html"}catch(l){console.error("[PartyActions] Disband failed:",l),alert("Disband failed: "+(l?.message||l))}finally{te=!1}}let ee=!1;async function So(){if(ee)return;const a=g?.faction,t=g?.nation;if(!(!a?.id||!t?.id)){if(!st){alert("No sitting President to impeach.");return}ee=!0;try{const e=Number(g?.shard?.current_tick)||0;await za(k,{faction:a,nation:t,president:st,isPresidentParty:st.faction_id===a.id,mySeats:a.seats||0,currentTick:e})}catch(e){console.error("[party-actions] impeachment threw:",e?.message||e),alert("Impeachment failed — check console.")}finally{ee=!1}}}let ae=!1;async function Lo(){if(ae||!g?.faction?.id||!g?.nation?.id)return;const a=g.faction,t=g.nation,e=Be(t);if(!Ht(t)){alert("A vote of no confidence is only possible in a parliamentary or semi-presidential system.");return}const{data:o}=await k.from("head_of_government").select("faction_id, last_name").eq("nation_id",t.id).eq("active",!0).maybeSingle(),s=o?.faction_id||t.ruling_faction_id||null,i=o?.last_name||null;if(!s){alert("No active Prime Minister to file against.");return}if(s===a.id){alert("Your party is the Prime Minister — you cannot file a vote of no confidence against yourself.");return}const n=g.faction?.seats!=null?Number(g.faction.seats):0;if(n<1){alert("Your party needs at least 1 seat in the legislature to file a motion.");return}const{data:l}=await k.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=l?.current_tick||g.shard?.current_tick||0,{data:f}=await k.from("bills").select("id").eq("nation_id",t.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(f&&f.length>0){alert("A motion of no confidence is already pending.");return}const{data:p}=await k.from("campaign_actions").select("tick_performed").eq("nation_id",t.id).eq("action_type","no_confidence_filed").eq("target_id",s).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(p){const y=c-Number(p.tick_performed||0);if(y<R.NO_CONFIDENCE_COOLDOWN_TICKS){const u=R.NO_CONFIDENCE_COOLDOWN_TICKS-y;alert(`Cooldown: ${u} tick${u!==1?"s":""} remaining before another motion can be filed against this PM party.`);return}}const r=i?e?`Motion of No Confidence in PM ${i}`:`Motion of No Confidence in the ${i} Government`:"Motion of No Confidence in the Government",d=e?`IF IT PASSES:
• PM removed — President must nominate a new PM
• Your party: +15 Momentum
• PM's party: -10 Momentum`:`IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Snap elections scheduled
• Your party: +15 Momentum
• PM's party: -10 Momentum`;if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${r}"

Cost: $0 — free to file
Voting period: ${R.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

${d}

IF IT FAILS:
• Your party: -10 Momentum
• ${R.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown on this PM party

Proceed?`)){ae=!0;try{const y=await ma(k,{faction:a,nation:t,pmFactionId:s,pmLastName:i,isSemiPres:e,tick:c,mySeats:n});if(!y.ok){alert("Failed to file motion: "+y.error);return}alert(`⚡ "${y.motionName}" has been filed!

Voting is now open for ${R.NO_CONFIDENCE_VOTING_TICKS} ticks.`),window.location.href=`bill.html?id=${y.billId}`}catch(y){console.error("[PartyActions] No confidence file failed:",y),alert("Failed to file motion: "+(y?.message||"unknown error"))}finally{ae=!1}}}let Tt=!1,lt=[],$t=null;async function No(){if(lt.length>0)return;const{data:a,error:t}=await k.from("fundraiser_events").select("event_key, name, icon, host_sector_key, opposition_sector_key, display_order").order("display_order");if(t){console.warn("[PartyActions] fundraiser_events load failed:",t.message),lt=[];return}lt=a||[]}async function Ao(a){if(!a||!g?.nation?.id||!g?.faction?.id)return null;const{data:t}=await k.from("sectors").select("id, name, weight").eq("nation_id",g.nation.id).eq("sector_key",a).eq("is_active",!0).maybeSingle();if(!t?.id)return null;const{data:e}=await k.from("faction_sector_popularity").select("popularity").eq("faction_id",g.faction.id).eq("sector_id",t.id).maybeSingle();return{id:t.id,name:t.name,weight:Number(t.weight)||1,popularity_tenths:Number(e?.popularity)||0}}async function To(a){if(!Tt){if(wt>=1){alert("You have already hosted a fundraiser this tick. Try again next tick.");return}if(await No(),lt.length===0){alert("No fundraiser events configured. Run migration 20260728.");return}$t=null,await Po(a)}}async function Po(a){let t=document.getElementById("pa-fundraise-modal");t||(t=document.createElement("div"),t.id="pa-fundraise-modal",t.className="pa-modal-overlay",t.innerHTML=`
            <div class="pa-modal" style="width:min(880px, 96vw);max-height:90vh;display:flex;flex-direction:column;">
                <div class="pa-modal-header">
                    <div class="pa-modal-title">FUNDRAISE — Pick a Host</div>
                    <button type="button" class="pa-modal-close" data-act="fr-close">&times;</button>
                </div>
                <div class="pa-modal-subtitle" style="padding:0 20px 8px 20px;font-size:11px;color:var(--text-secondary);">
                    Once per tick · Yield = $25k × your popularity × bloc weight (Corporate Gala excluded). Costs popularity with both blocs.
                </div>
                <div id="pa-fundraise-body" style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;border-top:1px solid var(--border-main);">
                </div>
            </div>`,document.body.appendChild(t),t.addEventListener("click",n=>{(n.target.matches('[data-act="fr-close"]')||n.target===t)&&(t.style.display="none")})),t.style.display="flex";const e=t.querySelector("#pa-fundraise-body");e.innerHTML='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Loading sectors…</div>';const o={},s=new Set;for(const n of lt)s.add(n.host_sector_key),s.add(n.opposition_sector_key);await Promise.all(Array.from(s).map(async n=>{o[n]=await Ao(n)}));const i=lt.map(n=>{const l=o[n.host_sector_key],c=l?(l.popularity_tenths/10).toFixed(1):"—",f=l?.weight||1;return`
            <div class="pa-fr-card" data-event-key="${w(n.event_key)}" style="padding:10px 14px;border-bottom:1px dashed var(--border-main);cursor:pointer;">
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-size:14px;">${n.icon}</span>
                    <span style="font-family:var(--font-serif, 'IBM Plex Serif', serif);font-size:14px;font-weight:600;color:var(--text-bright);">${w(n.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.06em;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">
                    ${w(l?.name||n.host_sector_key)} · w${f} · pop ${c}
                </div>
            </div>`}).join("");e.innerHTML=`
        <div id="pa-fr-list" style="overflow-y:auto;border-right:1px solid var(--border-main);">
            ${i}
        </div>
        <div id="pa-fr-detail" style="padding:14px 18px;overflow-y:auto;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;">Pick an event on the left to see details.</div>
        </div>`,e.querySelectorAll(".pa-fr-card").forEach(n=>{n.addEventListener("click",()=>{$t=n.dataset.eventKey,e.querySelectorAll(".pa-fr-card").forEach(l=>l.style.background=""),n.style.background="rgba(200,168,50,0.08)",zo(e,o,a)})})}function zo(a,t,e){const o=a.querySelector("#pa-fr-detail"),s=lt.find(v=>v.event_key===$t);if(!s)return;const i=t[s.host_sector_key],n=t[s.opposition_sector_key],l=i?(i.popularity_tenths/10).toFixed(1):"—",c=i?.weight||1,f=n?(n.popularity_tenths/10).toFixed(1):"—",p=!i,r=!n,d=s.event_key!=="corporate_gala",y=d&&i?1250*(i.popularity_tenths||0)*Math.max(1,i.weight||1):0;o.innerHTML=`
        <div style="display:flex;align-items:baseline;gap:8px;">
            <span style="font-size:18px;">${s.icon}</span>
            <span style="font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text-bright);">${w(s.name)}</span>
        </div>

        <div style="margin-top:14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Host bloc</div>
            <div style="font-family:var(--font-serif);font-size:14px;color:var(--text-bright);margin-top:2px;">${w(i?.name||s.host_sector_key)}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-top:2px;">Your popularity: <strong style="color:var(--text-bright);">${l}</strong> · National weight: <strong style="color:var(--text-bright);">w${c}</strong></div>
        </div>

        <div style="margin-top:14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Paired opposition</div>
            <div style="font-family:var(--font-serif);font-size:14px;color:var(--text-bright);margin-top:2px;">${w(n?.name||s.opposition_sector_key)}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-top:2px;">Your popularity: <strong style="color:var(--text-bright);">${f}</strong></div>
        </div>

        <div style="margin-top:18px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Costs (popularity)</div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↓ ${w(i?.name||s.host_sector_key)}</span><span style="color:#d44a4a;font-weight:700;">−0.3 (donor fatigue)</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↓ ${w(n?.name||s.opposition_sector_key)}</span>
                ${r?'<span style="color:var(--text-dim);font-style:italic;">not in this nation — no cost</span>':'<span style="color:#d44a4a;font-weight:700;">−0.5 (optics)</span>'}
            </div>
        </div>

        <div style="margin-top:10px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Projected yield</div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↑ Party funds</span>
                ${d?`<span style="color:#5cb85c;font-weight:700;">+${ze(y)}</span>`:'<span style="color:var(--text-dim);font-style:italic;">positioning only — no yield</span>'}
            </div>
        </div>

        ${p?'<div style="margin-top:14px;font-family:var(--font-mono);font-size:10px;color:var(--red);">This nation does not have the host bloc seeded — pick a different event.</div>':""}

        <div style="margin-top:18px;text-align:right;">
            <button type="button" class="pa-modal-btn pa-modal-btn--primary"
                    id="pa-fr-confirm"
                    ${p?"disabled":""}
                    style="padding:8px 18px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:rgba(200,168,50,0.08);border:1px solid var(--gold, #c8a832);color:var(--gold, #c8a832);cursor:pointer;${p?"opacity:0.4;cursor:not-allowed;":""}">
                Host this fundraiser
            </button>
        </div>
    `;const u=o.querySelector("#pa-fr-confirm");u&&u.addEventListener("click",()=>Ro(e))}async function Ro(a){if(!(Tt||!$t)){Tt=!0;try{const t=g.shard?.current_tick||0,{data:e,error:o}=await k.rpc("fundraise_themed",{p_faction_id:g.faction.id,p_nation_id:g.nation.id,p_event_key:$t,p_tick:t});if(o||!e?.success){alert("Fundraise failed: "+(o?.message||e?.error||"unknown"));return}const s=document.getElementById("pa-fundraise-modal");s&&(s.style.display="none"),sessionStorage.removeItem("nationhood_state"),wt++;const i=Number(e?.yield)||0;i>0&&alert("Fundraiser hosted. +"+ze(i)+" to party funds."),O(a)}catch(t){console.error("[PartyActions] Fundraise error:",t),alert("Fundraise failed.")}finally{Tt=!1}}}function Oo(a){const t=document.getElementById("pa-statement-modal");if(!t)return;const e=g.faction,o=e?.color||"#c8a832",s=e?.leader_first_name&&e?.leader_last_name?`${e.leader_first_name} ${e.leader_last_name}`:"Party Leader",i=$e.map(p=>`<div class="pa-topic-card" data-topic="${p.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${p.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${w(p.label)}</span>
        </div>`).join("");t.innerHTML=`
        <div class="pa-modal" style="width:520px;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${o};"></div>
                    <span class="pa-modal-title">Issue Statement</span>
                </div>
                <button class="pa-modal-close" id="pa-stmt-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${o}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${o};display:inline-block;"></span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Speaking as:</span>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${o};">${w(s)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Party Leader</span>
            </div>
            <div class="pa-modal-body" style="gap:14px;">
                <div>
                    <div class="pa-modal-step-label">1 &mdash; Topic</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;" id="pa-stmt-topics">${i}</div>
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
    `,t.classList.add("active");let n=null,l=!1;const c=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",c),document.getElementById("pa-stmt-cancel")?.addEventListener("click",c),t.addEventListener("click",p=>{p.target===t&&c()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",p=>{const r=p.target.closest(".pa-topic-card");r&&(n=r.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(d=>{const y=d.dataset.topic===n;d.style.borderColor=y?o:"var(--border-mid)",d.style.background=y?o+"0a":"";const u=d.querySelector("span:last-child");u&&(u.style.color=y?"var(--text-bright)":"var(--text-secondary)")}),f())});const f=()=>{const p=document.getElementById("pa-stmt-body")?.value?.trim()||"",r=document.getElementById("pa-stmt-submit"),d=document.getElementById("pa-stmt-charcount");d&&(d.textContent=`${p.length} characters`),r&&(r.disabled=!(n&&p.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",f),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(l)return;const p=document.getElementById("pa-stmt-body")?.value?.trim();if(!n||!p||p.length<10)return;l=!0;const r=document.getElementById("pa-stmt-submit");r&&(r.disabled=!0,r.textContent="Issuing...");try{const d=g.shard?.current_tick||0,u=$e.find(L=>L.id===n)?.label||n,v=2e4,{data:h}=await k.from("factions").select("party_funds").eq("id",e.id).single(),m=h?.party_funds||0;if(m<v){alert(`Not enough funds. You have $${Math.round(m/1e3)}k, need $20k.`);return}const x=m-v,{error:b}=await k.from("factions").update({party_funds:x}).eq("id",e.id);if(b){alert("Failed to deduct funds: "+b.message);return}e.party_funds=x;const M=ke[Math.floor(Math.random()*ke.length)].replace("{party_name}",e.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",u),{error:C}=await k.from("campaign_actions").insert({party_id:e.id,nation_id:g.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:d,result:{topic:n,topicLabel:u,headline:M,body:p,leaderName:s}});C&&console.error("[PartyActions] Statement log failed:",C.message);const{error:E}=await k.from("valdorian_articles").insert({nation_id:g.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:M,subheadline:u,lede:p.substring(0,200)+(p.length>200?"...":""),body_paragraphs:JSON.stringify(p.split(/\n\n+/).filter(L=>L.trim())),quotes:JSON.stringify([{posture:"assertive",text:p.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([n]),source_event_id:"statement_"+Date.now(),tick:d});E&&console.error("[PartyActions] Article creation failed:",E.message);const{error:$}=await k.from("event_log").insert({nation_id:g.nation?.id,event_name:M,category:"political",description_chosen:`${e.faction_name} issues the following statement regarding ${u}: "${p}"`,fired_at_tick:d});$&&console.warn("[Statement] event_log insert failed:",$.message);const{error:S}=await k.from("admin_timeline_events").insert({nation_id:g.nation?.id,tick:d,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${u}: "${p.substring(0,120)}${p.length>120?"...":""}"`});S&&console.warn("[Statement] timeline insert failed:",S.message),c(),O(a)}catch(d){console.error("[PartyActions] Statement error:",d),alert("Failed to issue statement. Please try again.")}finally{l=!1,r&&(r.disabled=!1,r.textContent="Issue Statement")}})}const Ot=10;function Fo(a){const t=document.getElementById("pa-platform-modal");if(!t)return;const e=g.faction;g.nation;const o=e?.color||"#c8a832";let s=null,i=!1;const n={};for(const f of fe)f.faction_id!==e?.id&&(n[f.platform_key]=(n[f.platform_key]||0)+1);const l=new Set(Z.map(f=>f.platform_key));function c(){const f=ht.find(v=>v.id===s),p=`+${(be.adoptTenths/10).toFixed(1)}`,r=(be.failTenths/10).toFixed(1),d="#5cc55c",y=ht.map(v=>{const h=s===v.id,m=l.has(v.id),x=n[v.id]||0;return`<div class="pa-plat-card ${h?"selected":""} ${m?"adopted":""}" data-plat="${v.id}">
                ${m?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:17px;">${v.icon}</span>
                    <span style="font-size:12px;font-weight:700;color:${m?o:h?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${w(v.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${w(v.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${d};">${p}</span>
                    ${x>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${x} rival${x>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let u;if(!f)u=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:28px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const v=f.improve.map(_=>{const M=xe(_,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:10px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${M.color};white-space:nowrap;">${M.arrow} ${he[_]||_}</span>`}).join(""),h=f.worsen.map(_=>{const M=xe(_,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:10px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${M.color};white-space:nowrap;">${M.arrow} ${he[_]||_}</span>`}).join(""),m=l.has(f.id),x=Z.length;let b;m?b=`<div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:x>=3?b='<div style="font-family:var(--font-mono);font-size:11px;color:var(--red);">All 3 platform slots are full.</div>':i?b=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:11px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${w(f.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:b=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${o};">Adopt Platform</button>
                </div>`,u=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:26px;">${f.icon}</span>
                        <div>
                            <div style="font-size:19px;font-weight:700;color:var(--text-bright);">${w(f.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${w(f.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${w(f.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">POPULARITY</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${d};">${p}</span>
                                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">all sectors on adopt — per-sector boosts also apply</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${f.improve.length} stats, +${Ot} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${v}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${f.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${h}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">${w(f.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:11px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${Ot}</strong>. Failure: <strong style="color:var(--red);">${r} popularity all sectors</strong> and the per-sector boosts revert with the constituencies you wooed (the alienated stay alienated). If you don't enter government, the promise abates.
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
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:0.12em;color:${o};">SET PARTY PLATFORM</span>
                            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 6px;color:var(--text-secondary);background:var(--bg-card);border:1px solid var(--border-mid);">CD: 6 TICKS</span>
                        </div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">Choose your party's focus. Defines which stats you promise to change.</div>
                    </div>
                    <button class="pa-modal-close" id="pa-plat-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:380px;border-right:1px solid var(--border-main);padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:4px;align-content:start;overflow-y:auto;" id="pa-plat-grid">
                        ${y}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow-y:auto;" id="pa-plat-detail">
                        ${u}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=v=>{v.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",v=>{const h=v.target.closest(".pa-plat-card");h&&(s=h.dataset.plat,i=!1,c())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{i=!0,c()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{i=!1,c()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>Bo(a,s))}t.classList.add("active"),c()}let Nt=!1;async function Bo(a,t){if(Nt)return;Nt=!0;const e=document.getElementById("pa-platform-modal"),o=g.faction,s=g.nation;if(!o||!s||!t){Nt=!1;return}const i=ht.find(f=>f.id===t);if(!i)return;const n={},l={},c=f=>Re.has(f);for(const f of i.improve){const p=Number(s[f]??50);n[f]=p,c(f)?l[f]=Math.max(0,p-Ot):l[f]=Math.min(100,p+Ot)}try{const f=g.shard?.current_tick||0,{data:p,error:r}=await k.rpc("adopt_platform",{p_faction_id:o.id,p_nation_id:s.id,p_platform_key:t,p_tick:f,p_baseline_stats:n,p_target_stats:l});if(r){console.error("[PartyActions] Platform adoption failed:",r.message),alert("Failed to adopt platform: "+r.message);return}if(p&&!p.success){alert(p.error||"Failed to adopt platform.");return}const d=p?.slot||Z.length+1;Z.push({faction_id:o.id,nation_id:s.id,platform_key:t,slot:d,adopted_at_tick:f,baseline_stats:n,target_stats:l,status:"active"}),fe.push(Z[Z.length-1]),e?.classList.remove("active"),O(a)}catch(f){console.error("[PartyActions] Platform adoption error:",f),alert("An error occurred. Please try again.")}finally{Nt=!1}}let ut=null,aa={isGoverning:!1,statusLabel:"OPPOSITION",administration:null,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],strongholdsByParty:{},passedBills:[],sectors:[],caucuses:[],nextElection:null,nextElectionTicks:null};function U(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function Ho(a,t,e){const o={};for(const s of a)o[s.id]=$a(s.id,t,e,3);return o}function Do(a,t,e){const o=new Map(a.map(i=>[i.id,i])),s=new Map;for(const i of e){const n=s.get(i.sector_id)||[];n.push({party_id:i.faction_id,popularity:Number(i.popularity)||0}),s.set(i.sector_id,n)}return t.map(i=>{const n=(s.get(i.id)||[]).filter(l=>l.popularity>0&&o.has(l.party_id)).map(l=>{const c=o.get(l.party_id);return{party_id:c.id,abbreviation:c.abbreviation||(c.faction_name||"?").slice(0,3).toUpperCase(),color:c.party_color||"#888",seats:Number(c.seats)||0,popularity:l.popularity}});return n.sort((l,c)=>c.popularity!==l.popularity?c.popularity-l.popularity:c.seats-l.seats),{sector_key:i.sector_key,name:i.name,description:i.description||"",weight:Number(i.weight)||0,candidates:n}}).sort((i,n)=>n.weight!==i.weight?n.weight-i.weight:(i.name||"").localeCompare(n.name||""))}async function jo(a,t,e){ut=t;const o=document.getElementById(e);if(!o)return;const s=t.faction,i=t.nation,n=i?.id,l=s?.id;if(!s||!n){o.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}o.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const c=t.shard?.current_tick||0,[f,p,r,d,y,u,v,h]=await Promise.all([je(a,n,l),a.from("factions").select("*").eq("nation_id",n).eq("faction_type","party"),a.from("sectors").select("id, sector_key, name, description, weight, base_turnout, is_active").eq("nation_id",n).eq("is_active",!0).order("display_order"),a.from("bills").select("id, bill_name, bill_type, proposed_by, passed_tick, bill_articles(selected_option:policy_options!selected_option_id(sector_effects)), bill_support(faction_id, stance)").eq("nation_id",n).eq("status","passed").not("passed_tick","is",null).order("passed_tick",{ascending:!1}).limit(15),Promise.resolve({data:[],error:null}),a.from("elections").select("*").eq("nation_id",n).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5),a.from("ministries").select("party_id").eq("nation_id",n).eq("is_active",!0),ca(n)]);p.error&&console.error("[PartyOverview] Parties fetch error:",p.error.message),r.error&&console.error("[PartyOverview] Sectors fetch error:",r.error.message),y.error&&console.error("[PartyOverview] Caucus fetch error:",y.error.message),u.error&&console.error("[PartyOverview] Election fetch error:",u.error.message),d.error&&console.error("[PartyOverview] Passed-bills fetch error:",d.error.message);const m=p.data||[],x=r.data||[],b=f.administration,_=new Set((v.data||[]).map(I=>I.party_id).filter(Boolean));let M=[];if(m.length>0&&x.length>0){const I=m.map(z=>z.id),{data:N,error:A}=await a.from("faction_sector_popularity").select("faction_id, sector_id, popularity").in("faction_id",I);A&&console.error("[PartyOverview] Popularity fetch error:",A.message),M=N||[]}const C=Ho(m,x,M),E=Do(m,x,M),$=b?.started_at_tick!=null?Math.max(0,c-b.started_at_tick):0,S=u.data||[],L=S[0]||null,T=L?Math.max(0,L.election_tick-c):null;let P=null;L&&i&&kt(i)&&(P=S.some(N=>N.election_type==="presidential"&&N.election_tick===L.election_tick)?"General":"Midterm"),aa={isGoverning:f.isGoverning,statusLabel:f.label,administration:b,ministryPartyIds:_,ticksInPower:$,myFaction:s,allParties:m,rivalParties:m.filter(I=>I.id!==l),blocMap:h,strongholdsByParty:C,sectorRanking:E,passedBills:d.data||[],sectors:x,caucuses:y.data||[],nextElection:L,nextElectionTicks:T,nextElectionLabel:P},qo(o)}catch(c){console.error("[PartyOverview] Init error:",c),o.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}function qo(a){const t=aa,e=t.myFaction,o=ut.nation,s=e?.party_color||e?.color||"#c8a832";ut.shard?.current_tick,t.administration?.admin_name||t.isGoverning;const i=t.statusLabel,n=t.isGoverning?"var(--green)":"var(--orange)",l=e?.seats||0,c=o?.total_seats||100,f=e?.momentum??50;a.innerHTML=`<div class="po-page">
        ${Uo(t,s,l,c,f)}
        <div class="po-columns">
            <div class="po-col-left">
                ${Go(t,e,s,i,n)}
                ${Vo(t,e,s)}
                ${Yo(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${Wo()}
                ${Xo(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${Qo(t,e)}
                ${Zo()}
            </div>
        </div>
    </div>`}function Uo(a,t,e,o,s){const i=a.isGoverning?a.administration?.admin_name||"Government":"Opposition",n=(ut.nation?.government_type||"").toLowerCase().includes("monarchy"),l=n?"No elections":a.nextElectionTicks!=null?a.nextElectionTicks:"—",c=n?"var(--text-dim)":typeof l=="number"&&l<=3?"var(--red)":"var(--text-bright)",f=n?"NEXT ELECTION":a.nextElectionLabel?"NEXT "+a.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${U(i)}</div>
                <div class="po-summary-sub">${a.ticksInPower} ticks in power</div>
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
                <span class="po-summary-value" style="color:${t};">${e}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/ ${o}</span>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">${f}</div>
            <div class="po-summary-value" style="color:${c};">${l}${typeof l=="number"?" ticks":""}</div>
        </div>
    </div>`}function Go(a,t,e,o,s){const i=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",n=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const l=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${e};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${e};background:${e}12;border-color:${e}33;">${n}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                    <span class="po-identity-name">${U(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${o}</span>
                    ${Pe(t?.bloc_id,a.blocMap)}
                </div>
                <div class="po-identity-meta">${a.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${e};background:${e}15;border-color:${e}33;">${n}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${U(i)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${e};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${l}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function Vo(a,t,e){const o=t?.id,s=a.sectorRanking||[],i=(l,c)=>{const f=l.party_id===o,p=f?e:l.color||"#888",r=(Math.round(l.popularity)/10).toFixed(1),d=f?'<span class="po-stronghold-chip-label" style="font-weight:700;">You</span>':`<span class="po-stronghold-chip-label">${U(l.abbreviation)}</span>`;return`<div class="po-stronghold-chip" style="border-color:${p}66;background:${p}14;">
            ${d}
            <span class="po-stronghold-chip-label" style="color:${p};font-weight:700;margin-left:4px;">${r}</span>
        </div>`};return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTOR RANKING</span>
            <span class="po-card-subtitle">all sectors · top 3 other parties · you on the right</span>
        </div>
        <div style="padding:8px 12px;">
            ${s.map(l=>{const c=l.candidates||[],f=c.filter(x=>x.party_id!==o).slice(0,3).map(x=>i(x)).join(""),p=c.find(x=>x.party_id===o)||null,r=i(p||{party_id:o,popularity:0,color:e}),d=f?`<div class="po-stronghold-chips">${f}</div>`:'<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">No other party popularity yet</div>',y=Number(l.weight)||0,u=y>=3?"var(--gold, #c9a449)":y===2?"var(--amber, #c8a64e)":"var(--text-secondary)",v=`<span style="display:inline-block;min-width:18px;padding:1px 5px;font-family:var(--font-mono);font-size:9px;font-weight:700;color:${u};border:1px solid ${u}66;background:${u}14;text-align:center;letter-spacing:0;">w${y}</span>`,h=(l.description||"").trim(),m=h?`<div style="font-family:var(--font-mono);font-size:9.5px;color:var(--text-dim);line-height:1.4;margin-top:2px;">${U(h)}</div>`:"";return`<div class="po-stronghold-row" style="align-items:flex-start;">
            <div class="po-stronghold-party" style="min-width:0;flex:1;">
                <div style="display:flex;align-items:center;gap:8px;">
                    ${v}
                    <span class="po-stronghold-party-name">${U(l.name)}</span>
                </div>
                ${m}
            </div>
            ${d}
            <div style="margin-left:14px;padding-left:14px;border-left:1px dashed var(--border-main, rgba(255,255,255,0.1));display:flex;align-items:center;">
                ${r}
            </div>
        </div>`}).join("")||'<div style="padding:8px 0;font-size:9px;color:var(--text-dim);font-family:var(--font-mono);">No active sectors in this nation.</div>'}
        </div>
    </div>`}function Yo(a){const t=(a.caucuses||[]).filter(s=>s.name&&s.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const e=a.faction?.seats||0,o=t.map(s=>{const i=s.relationship_score??50,n=i>60?"var(--green)":i>40?"var(--amber)":"var(--red)",l=Math.round((s.seat_share||0)*e),c=(s.dominant_axis||"").replace(/_/g,"/"),f=s.wing_end==="left"?c.split("/")[0]:c.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${U(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${U(f)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${l} seats</span>
                <div style="width:50px;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;margin-bottom:1px;">LOYALTY</div>
                    <div style="width:100%;height:3px;background:var(--border-main);"><div style="height:100%;width:${i}%;background:${n};"></div></div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${n};text-align:right;margin-top:1px;">${i}</div>
                </div>
            </div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">INTERNAL CAUCUSES</span>
            <span class="po-card-subtitle">${t.length} active · ${e} seats</span>
        </div>
        ${o}
    </div>`}function Wo(){return`<div class="po-card">
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
    </div>`}function Ko(a){const t=new Map;for(const e of a.bill_articles||[]){const o=e?.selected_option?.sector_effects||[];for(const s of o){if(!s||typeof s.sector_key!="string")continue;const i=Number(s.change_tenths);!Number.isFinite(i)||i===0||t.set(s.sector_key,(t.get(s.sector_key)||0)+i)}}return Array.from(t,([e,o])=>({sector_key:e,change_tenths:o}))}function Jo(a,t){if(!a)return"";const e=a.party_color||a.color||"#888",o=a.abbreviation||(a.faction_name||"?").slice(0,3).toUpperCase(),s=t?`<span style="font-family:var(--font-mono);font-size:6px;color:${e};margin-left:3px;letter-spacing:0.05em;">SPONSOR</span>`:"";return`<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border:1px solid ${e}55;background:${e}14;font-family:var(--font-mono);font-size:8px;font-weight:700;color:${e};">${U(o)}${s}</span>`}function Ne(a,t,e){return a.length?a.map(o=>{const i=(e?-o.change_tenths:o.change_tenths)/10,n=i>0?"+":i<0?"−":"",l=Math.abs(i).toFixed(1),c=i>0?"var(--green)":i<0?"var(--red)":"var(--text-dim)",f=t.get(o.sector_key)||o.sector_key;return`<span style="white-space:nowrap;"><span style="color:${c};font-weight:700;">${n}${l}</span> <span style="color:var(--text-secondary);">${U(f)}</span></span>`}).join('<span style="color:var(--text-dim);margin:0 4px;">·</span>'):'<span style="color:var(--text-dim);">no sector effects</span>'}function Xo(a){const t=a.passedBills||[],e=ut.shard?.current_tick||0,o=t.filter(l=>!["no_confidence","minister_confirmation","foundational","veto_override"].includes(l.bill_type));if(o.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT BILLS</span>
                <span class="po-card-subtitle">passed bills · sector outcomes</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No passed bills yet.</div>
        </div>`;const s=new Map((a.allParties||[]).map(l=>[l.id,l])),i=new Map((a.sectors||[]).map(l=>[l.sector_key,l.name]));return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT BILLS</span>
            <span class="po-card-subtitle">passed bills · sector outcomes</span>
        </div>
        <div style="max-height:520px;overflow-y:auto;">${o.map(l=>{const c=Ko(l),f=e-(l.passed_tick||0),p=f===0?"just now":f+"t ago",r=new Map;for(const x of l.bill_support||[]){const b=x.stance==="accept"?"yes":x.stance==="reject"?"no":x.stance;(b==="yes"||b==="no")&&r.set(x.faction_id,b)}l.proposed_by&&r.set(l.proposed_by,"yes");const d=[],y=[];for(const[x,b]of r){const _=s.get(x);if(!_)continue;const M=Jo(_,x===l.proposed_by);b==="yes"?d.push(M):b==="no"&&y.push(M)}const u=s.get(l.proposed_by),v=u?`<span style="color:${u.party_color||u.color||"#888"};font-weight:700;">${U(u.abbreviation||u.faction_name||"?")}</span>`:'<span style="color:var(--text-dim);">unknown</span>',h=d.length?`<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--green);letter-spacing:0.05em;width:36px;flex-shrink:0;">GAINED</span>
                    ${d.join("")}
               </div>
               <div style="margin-left:40px;font-family:var(--font-mono);font-size:8px;line-height:1.6;margin-top:2px;">
                    ${Ne(c,i,!1)}
               </div>`:"",m=y.length?`<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);letter-spacing:0.05em;width:36px;flex-shrink:0;">LOST</span>
                    ${y.join("")}
               </div>
               <div style="margin-left:40px;font-family:var(--font-mono);font-size:8px;line-height:1.6;margin-top:2px;">
                    ${Ne(c,i,!0)}
               </div>`:"";return`<div style="padding:8px 12px;border-bottom:1px solid rgba(200,196,184,0.05);">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
                <span style="font-size:10px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${U(l.bill_name||"Untitled bill")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);flex-shrink:0;">${p}</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:1px;">sponsored by ${v}</div>
            ${h}
            ${m}
        </div>`}).join("")}</div>
    </div>`}function Qo(a,t){const e=a.rivalParties,o=a.administration,s=ut.nation,i=o?.pm_party_id,n=s?.total_seats||100,l=e.map(c=>{const f=c.party_color||"#666",p=c.abbreviation||c.faction_name?.slice(0,3)?.toUpperCase()||"?",r=c.leader_first_name&&c.leader_last_name?`${c.leader_first_name} ${c.leader_last_name}`:"Unknown",d=c.seats||0,y=Sa(c,o,a.ministryPartyIds,s);let u=y.label;const v=y.isGoverning?"var(--green)":"var(--orange)";y.isGoverning&&y.label==="GOVERNING"&&(c.id===i?u="GOVERNING — LEAD":u="GOVERNING — JUNIOR");const h=d-(t?.seats||0),m=h>0?"var(--green)":h<0?"var(--red)":"var(--text-dim)",x=a.strongholdsByParty?.[c.id]||[],b=x.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;">${x.map(_=>`<span style="font-family:var(--font-mono);font-size:9px;padding:2px 6px;border:1px solid ${f}44;background:${f}10;color:var(--text-bright);white-space:nowrap;">${U(_.name)}</span>`).join("")}</div>`:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Unaligned</div>';return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${f}15;border:1px solid ${f}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${f};">${U(p)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${U(c.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${U(r)}</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${v};background:${v}0a;border:1px solid ${v}44;white-space:nowrap;">${u}</span>
                    ${Pe(c.bloc_id,a.blocMap)}
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
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${m};">${h>0?"+":""}${h}</span>
                </div>
            </div>
            ${b}
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${e.length} parties</span>
        </div>
        ${l||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`}function Zo(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--text-bright);font-weight:700;">Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let xt=null,nt=[],le=[],gt={},Ft=null;function D(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function Bt(a){return a>=1e6?(a/1e6).toFixed(2)+"M":a>=1e3?Math.round(a/1e3)+"k":String(a)}function oa(a){return["January","February","March","April","May","June","July","August","September","October","November","December"][a%12]+", "+(2e3+Math.floor(a/12))}function ti(a,t){if((a.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const o=t?.end_reason||"";return o.includes("no_confidence")||o.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:o.includes("snap")||o.includes("dissolved")||o.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function ei(a,t){xt=t;const e=document.getElementById("pa-past-elections-root");if(!e)return;e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const o=t.nation?.id;if(!o){e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,i,n]=await Promise.all([a.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",o).eq("status","completed").order("election_tick",{ascending:!1}),a.from("administrations").select("*").eq("nation_id",o).order("started_at_tick",{ascending:!1}),a.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",o).eq("faction_type","party").is("abandoned_at",null)]);nt=s.data||[],le=i.data||[];const l=n.data||[];gt={};for(const c of l)gt[c.id]=c;for(const c of nt){const f=c.results?.votes||[];for(const r of f){const d=gt[r.party_id];r.color=d?.party_color||"#666",r.abbreviation=d?.abbreviation||r.party_name?.slice(0,3)?.toUpperCase()||"?"}const p=c.results?.presidential_candidates||[];for(const r of p){const d=gt[r.faction_id];r.color=d?.party_color||"#666",r.abbreviation=d?.abbreviation||r.party_name?.slice(0,3)?.toUpperCase()||"?"}}ai(e),ia(e)}function ai(a){a.addEventListener("click",t=>{const e=t.target.closest("[data-election-id]");if(e){const o=e.dataset.electionId;Ft=Ft===o?null:o,ia(a)}})}function oi(a){const t=Ft===a.id,e=(a.results?.presidential_candidates||[]).slice().sort((v,h)=>(h.votes||0)-(v.votes||0)),o=e.find(v=>v.winner)||null,s=a.results?.turnout_pct??0,i=a.results?.total_votes_cast??0,n=oa(a.election_tick),l="#5a8aaa",c=xt.faction?.id,f=a.results?.was_runoff===!0,p=f&&Array.isArray(a.results?.round_1_candidates)?[...a.results.round_1_candidates].sort((v,h)=>(h.votes||0)-(v.votes||0)):null;if(p)for(const v of p){const h=gt[v.faction_id];v.color=h?.party_color||v.color||"#666",v.abbreviation=h?.abbreviation||v.abbreviation||v.party_name?.slice(0,3)?.toUpperCase()||"?"}const r=e.slice(0,3),d=o?`${o.candidate_name||""}`.trim():"",y=o?.color||"#888";let u=`<div data-election-id="${a.id}" style="
        background:var(--bg-panel);border:1px solid var(--border-main);
        ${t?"border-bottom:none;":""}
    ">
        <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${n}</div>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${l};background:${l}0a;border:1px solid ${l}25;">PRESIDENTIAL ELECTION</span>
                ${f?'<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:#d4a83c;background:rgba(212,168,60,0.08);border:1px solid rgba(212,168,60,0.3);">RUNOFF</span>':""}
                <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                    ${r.map(v=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${v.color};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${D(v.abbreviation)}</span>
                        <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${(v.vote_percentage||0).toFixed(1)}%</span>
                    </div>`).join("")}
                </div>
            </div>
            <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                    President: <span style="color:${y};font-weight:700;">${D(d||"No winner")}</span>
                </div>
                <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${t?"▲":"▼"}</span>
            </div>
        </div>
    </div>`;if(t){const v=e.reduce((E,$)=>E+(Number($.vote_percentage)||0),0)||100,h=e.map(E=>{const $=(Number(E.vote_percentage)||0)/v*100,S=(E.vote_percentage||0).toFixed(1);return`<div style="width:${$}%;background:${E.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${$>=8?9:6}px;font-weight:700;color:#000;">${$>=5?S+"%":""}</div>`}).join(""),m=e.map(E=>{const $=E.faction_id===c,S=!!E.winner;return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${$?`background:${E.color}08;`:""}">
                <div class="pe-col-logo" style="width:30px;height:30px;background:${E.color}15;border:1px solid ${E.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${(E.abbreviation||"?").slice(0,2)}</div>
                <div class="pe-col-party" style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:5px;">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${D(E.candidate_name||"Unknown")}</span>
                        ${S?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">WINNER</span>':""}
                        ${$?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:${E.color};">${D(E.party_name||"")}</div>
                </div>
                <span class="pe-col-votes" style="width:90px;text-align:right;font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright);">${Bt(E.votes||0)}</span>
                <span class="pe-col-pct" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(E.vote_percentage||0).toFixed(1)}%</span>
            </div>`}).join(""),x=o?f?"Won Runoff":"Elected Outright":null,b=f?"#d4a83c":"#5c5",_=o?`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${y};">
            <div style="padding:12px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">PRESIDENT-ELECT</span>
                    ${x?`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${b};background:${b}0a;border:1px solid ${b}30;">${D(x).toUpperCase()}</span>`:""}
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;background:${y}15;border:1.5px solid ${y};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${y};">${D((d||"?").split(" ").map(E=>E[0]||"").join("").slice(0,3))}</div>
                    <div>
                        <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${D(d)}</div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">President &middot; ${D(o.party_name||"")} &middot; ${(o.vote_percentage||0).toFixed(1)}% of vote${f?" (runoff)":""}</div>
                    </div>
                </div>
            </div>
        </div>`:"",M=new Set(e.map(E=>E.candidate_id)),C=f&&p&&p.length>0?`
            <div style="padding:12px 20px;border-bottom:1px solid var(--border-main);background:rgba(212,168,60,0.04);">
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:#d4a83c;">ROUND 1 — NO MAJORITY</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Top 2 advanced to runoff</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                    ${p.map(E=>{const $=M.has(E.candidate_id),S=(Number(E.vote_percentage)||0).toFixed(1);return`<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:${$?"rgba(91,155,213,0.06)":"transparent"};border-left:2px solid ${$?"#5b9bd5":"transparent"};">
                            <div style="width:10px;height:10px;background:${E.color};flex-shrink:0;"></div>
                            <span style="flex:1;font-size:12px;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${D(E.candidate_name||"Unknown")}</span>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);min-width:56px;text-align:right;">${D(E.party_name||"")}</span>
                            <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${$?"#5b9bd5":"var(--text-secondary)"};min-width:48px;text-align:right;">${S}%</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${$?"#5b9bd5":"#888"};min-width:80px;text-align:right;">${$?"ADVANCED":"ELIMINATED"}</span>
                        </div>`}).join("")}
                </div>
            </div>`:"";u+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
            <div style="display:flex;border-bottom:1px solid var(--border-main);">
                <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                    <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">Presidential Election</div>
                </div>
                <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                    <div>
                        <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                        <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${s>70?"#5c5":s>60?"#ca5":"#c84"};">${s.toFixed(1)}%</div>
                    </div>
                    <div>
                        <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                        <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${Bt(i)}</div>
                    </div>
                </div>
            </div>
            ${e.length>0?`<div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                <div style="display:flex;height:18px;gap:1px;">${h}</div>
            </div>`:""}
            ${C}
            <div style="padding:0 20px;">
                <div class="pe-tbl-head" style="display:flex;padding:8px 0;border-bottom:1px solid var(--border-main);font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">
                    <span class="pe-col-logo" style="width:30px;"></span>
                    <span class="pe-col-party" style="flex:1;">${f?"RUNOFF — FINAL RESULTS":"CANDIDATE"}</span>
                    <span class="pe-col-votes" style="width:90px;text-align:right;">VOTES</span>
                    <span class="pe-col-pct" style="width:70px;text-align:right;">VOTE %</span>
                </div>
                ${e.length>0?m:'<div style="padding:20px 0;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:11px;">No candidate data on record.</div>'}
            </div>
            ${_}
        </div>`}return u}function ia(a){if(nt.length===0){a.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const t=xt.faction?.id,e=xt.nation?.total_seats||100,o=Math.ceil(e/2)+1,s=nt.map((i,n)=>{if(i.election_type==="presidential")return oi(i);const l=Ft===i.id,c=(i.results?.votes||[]).sort(($,S)=>(S.seats||0)-($.seats||0)),f=c.slice(0,3),p=i.results?.turnout_pct??0,r=i.results?.total_votes_cast??0,d=i.results?.sector_breakdown?.independent_seats??0,y=oa(i.election_tick),u=le.find($=>$.started_at_tick>=i.election_tick&&$.started_at_tick<=i.election_tick+5),v=le.find($=>$.ended_at_tick!=null&&$.ended_at_tick>=i.election_tick-2&&$.ended_at_tick<=i.election_tick+2),h=ti(i,v),m=kt(xt.nation),x=m?"President":"PM",b=u?.prime_minister||"Unknown",_=u?.pm_party_id&&c.find($=>$.party_id===u.pm_party_id)?.color||"#888",C=(n<nt.length-1?nt[n+1]:null)?.results?.votes||[];let E=`<div data-election-id="${i.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${l?"border-bottom:none;":""}
        ">
            <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                    <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${y}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${h.color};background:${h.color}0a;border:1px solid ${h.color}25;">${h.label.toUpperCase()}</span>
                    <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                        ${f.map($=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${$.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${D($.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${$.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${x}: <span style="color:${_};font-weight:700;">${D(b)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${l?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(l){const $=c.map(I=>`<div style="width:${I.seats/e*100}%;background:${I.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${I.seats>=8?9:6}px;font-weight:700;color:#000;">${I.seats>=5?I.seats:""}</div>`).join(""),S=d>0?`<div style="width:${d/e*100}%;background:#ffffff;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${d>=8?9:6}px;font-weight:700;color:#000;" title="Independents">${d>=5?d:""}</div>`:"",L=$+S,T=c.map(I=>{const N=I.party_id===t,A=C.find(et=>et.party_id===I.party_id),z=A?I.seats-(A.seats||0):null,Y=I.seats/e*100-(I.vote_percentage||0);return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${N?`background:${I.color}08;`:""}">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:${I.color}15;border:1px solid ${I.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${I.abbreviation?.slice(0,2)||"?"}</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${D(I.party_name)}</span>
                            ${N?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${I.color};">${D(I.abbreviation)}</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${I.seats}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${z!=null?z>0?"#5c5":z<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${z!=null?z>0?"▲ "+z:z<0?"▼ "+Math.abs(z):"—":"NEW"}</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${Bt(I.votes||0)}</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(I.vote_percentage||0).toFixed(1)}%</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(Y)<2?"var(--text-dim)":Y>0?"#5c5":"#c84"};">${Y>0?"+":""}${Y.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(Y)<2?"proportional":Y>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("")+(d>0?`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;color:#fff;">IN</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);">Independents</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:#cccccc;">IND</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${d}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">—</span>
                </div>`:"");let P="";if(u){const I=u.coalition_parties||[],N=u.total_seats||I.reduce((J,It)=>J+(It.seats||0),0),A=N>=o,z=A?"Majority Coalition":"Minority Coalition",j=u.ended_at_tick?u.end_reason||"Ended":"Current Government",Y=u.ended_at_tick?"var(--text-dim)":"#5c5",et=u.ended_at_tick?Math.abs(u.ended_at_tick-u.started_at_tick)+" ticks":"Ongoing",ra=I.map(J=>{const It=c.find(Dt=>Dt.party_id===J.party_id)?.color||"#666";return`<div style="width:${N>0?(J.seats||0)/N*100:0}%;background:${It};height:100%;"></div>`}).join(""),sa=I.map(J=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${c.find(Dt=>Dt.party_id===J.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${D(J.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${J.seats||0}</span>
                    </div>`).join("");P=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${_};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${Y};background:${Y}0a;border:1px solid ${Y}25;">${D(j.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${et}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${_}15;border:1.5px solid ${_};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${_};">${D(b.split(" ").map(J=>J[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${D(b)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${m?"President":"Prime Minister"} &middot; ${D(u.pm_party_name||"")} &middot; ${z}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${ra}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${sa}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${A?"#5c5":"#c84"};">${N} seats ${A?"(majority +"+(N-o)+")":"(minority, "+(o-N)+" short)"}</span>
                        </div>
                    </div>
                </div>`}E+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${D(h.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${p>70?"#5c5":p>60?"#ca5":"#c84"};">${p.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${Bt(r)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${L}</div>
                    <div style="position:relative;height:0;">
                        <div style="position:absolute;bottom:0;left:${o/e*100}%;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);transform:translateX(-50%);">▲ ${o} majority</div>
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

                ${P}
            </div>`}return E}).join("");a.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${nt.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${s}</div>
    </div>`}let Q=null,de=!1,Ae=!1,ce=!1,Te=!1,pe=!1;function na(a){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===a)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+a)),sessionStorage.setItem("party_subtab",a),a==="actions"&&!de&&Q&&(de=!0,Ye(pt,Q)),a==="parties"&&!Ae&&Q&&(Ae=!0,jo(pt,Q,"pa-parties-root")),a==="election"&&!ce&&Q&&(ce=!0,pe?oe(document.getElementById("pa-election-root")):Oe(pt,Q).then(()=>{pe=!0,oe(document.getElementById("pa-election-root"))})),a==="past-elections"&&!Te&&Q&&(Te=!0,ei(pt,Q))}document.getElementById("pa-subtabs").addEventListener("click",a=>{const t=a.target.closest(".pa-subtab");!t||t.classList.contains("active")||na(t.dataset.panel)});pa("politics",async a=>{Q=a,Oe(pt,a).then(()=>{pe=!0,ce&&oe(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?na(t):(de=!0,await Ye(pt,a))});
