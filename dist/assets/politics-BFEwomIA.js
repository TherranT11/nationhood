import{_supabase as pt}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{r as la}from"./role-actions-GCBcK_AR.js";import{h as da,l as ca,c as Pe,i as pa}from"./common-DL2fQz67.js";import{t as ge,h as ze}from"./utils-oN1e812_.js";import{P as ht,B as Re,f as ma,b as be,s as xe,S as he,i as Oe,r as oe}from"./coalition-formation-BTs7-RJ9.js";import{g as Fe,o as fa,p as va,q as ua,t as ya,V as ga,u as ba,v as xa,w as ha,x as _a}from"./political-actions-BCfwIhEF.js";import{a as K,h as kt,b as Be,f as Ht}from"./government-types-CNjNcIHN.js";import{f as He}from"./government-structure-DVzKGcwP.js";import{GAME_CONFIG as R,FORMATION_DEADLINE_TICKS as De}from"./config-BdOpHGNJ.js";import{i as $a,g as wa}from"./elections-B3SRWQYv.js";import{c as ka}from"./factions-qe2qC_cj.js";import"./preload-helper-BXl3LOEh.js";import"./corp-topbar-Dar6x8XP.js";import"./stats-Nd7eW9dF.js";import"./electorate-BT-seE1m.js";import"./presidential-C1j7duPb.js";import"./corp-valuation-DGlSNvB8.js";import"./budget-DTRXSQ4K.js";function Ea(a,t){return a.map(e=>{const o=ht.find(i=>i.id===e.platform_key);if(!o)return{...e,stats:[]};const r=o.improve.map(i=>{const n=e.baseline_stats?.[i],d=e.target_stats?.[i],c=Number(t?.[i]??50),v=Re.has(i);if(n==null||d==null)return{stat:i,baseline:c,target:c,current:c,progress:0,met:!1};const p=Math.abs(d-n),s=v?Math.max(0,n-c):Math.max(0,c-n),l=p>0?Math.min(1,s/p):1,y=v?c<=d:c>=d;return{stat:i,baseline:n,target:d,current:c,progress:l,met:y}});return{...e,stats:r,platformDef:o}})}const Ca=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function dt(a){return a>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:a>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:a>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:a>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function Ia(a){var t=Math.max(0,a-20)/65,e=12e4+t*28e4;return Math.round(e/25e3)*25e3}function qt(a,t){return a+Math.floor(Math.random()*(t-a+1))}function _e(a){return a[Math.floor(Math.random()*a.length)]}function Ma(a,t){var e=[],o=new Set,r=qt(5,7),i=Fe(t),n=i.firstNames||[],d=i.lastNames||[];if(n.length===0||d.length===0)return[];for(var c=Ca.slice().sort(function(){return Math.random()-.5}),v=0;v<r;v++){var p,s,l,y=0;do p=_e(n),s=_e(d),l=p+" "+s,y++;while(o.has(l)&&y<20);o.add(l);var u=qt(20,85),f=qt(25,60),h=c[v%c.length],m=Ia(u);e.push({nation_id:a,first_name:p,last_name:s,age:f,skill:u,background:h,hire_cost:m,status:"available"})}return e.sort(function(x,b){return b.skill-x.skill}),e}async function qe(a,t,e){var{data:o}=await a.from("nations").select("government_type, monarch_faction_id").eq("id",t).maybeSingle();if(K(o))return ie({partyId:e,admin:null,ministryHolder:!1,nation:o});var[r,i,n,d]=await Promise.all([He(a,t).catch(function(m){return console.warn("[Agitator] fetchActiveCoalition failed:",m?.message||m),null}),a.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),a.from("head_of_government").select("faction_id").eq("nation_id",t).eq("active",!0).maybeSingle(),a.from("presidents").select("faction_id").eq("nation_id",t).eq("is_active",!0).maybeSingle()]);if(i.error)return console.error("[Agitator] Failed to check governing status:",i.error.message),{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var c=i.data,v=r,p=kt(o),s=n?.data?.faction_id||null,l=d?.data?.faction_id||null,y=Array.isArray(v?.party_ids)?v.party_ids.map(function(m){return{party_id:m}}):[];if(c){c.pm_party_id=s,c.president_party_id=l;var u=Array.isArray(c.coalition_parties)?c.coalition_parties:[];u.length===0&&y.length>0&&(c.coalition_parties=y)}else(v||s||l)&&(c={pm_party_id:s,president_party_id:l,coalition_parties:y});var f=!1;if(p){var{count:h}=await a.from("ministries").select("*",{count:"exact",head:!0}).eq("nation_id",t).eq("party_id",e).eq("is_active",!0);f=(h||0)>0}return ie({partyId:e,admin:c,ministryHolder:f,nation:o})}function Sa(a,t,e,o){return ie({partyId:a?.id,admin:t,ministryHolder:e?e.has(a?.id):!1,nation:o})}function ie({partyId:a,admin:t,ministryHolder:e,nation:o}){if(K(o)){var r=o?.monarch_faction_id||null,i=!!(r&&a&&r===a);return{isGoverning:i,isOpposition:!i,label:i?"GOVERNING":"OPPOSITION",administration:null}}if(!t)return{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var n=Array.isArray(t.coalition_parties)?t.coalition_parties:[],d=n.some(function(s){return s?typeof s=="string"?s===a:typeof s=="object"?(s.party_id||s.id)===a:!1:!1}),c=t.pm_party_id===a,v=t.president_party_id===a,p=c||d||v||kt(o)&&!!e;return{isGoverning:p,isOpposition:!p,label:p?"GOVERNING":"OPPOSITION",administration:t}}async function je(a,t){var{data:e,error:o}=await a.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return o?(console.error("[Agitator] Failed to fetch agitator:",o.message),null):e}async function La(a,t,e){var{data:o,error:r}=await a.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(r)return console.error("[Agitator] Failed to fetch pool:",r.message),[];if(o&&o.length>0)return o;var i=Ma(t,e),{data:n,error:d}=await a.from("agitator_pool").insert(i).select("*");return d?(console.error("[Agitator] Failed to insert pool:",d.message),[]):(n||[]).sort(function(c,v){return v.skill-c.skill})}async function Na(a,t,e,o){var r=await je(a,t);if(r)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:i,error:n}=await a.from("faction_agitators").insert({faction_id:t,first_name:e.first_name,last_name:e.last_name,age:e.age,skill:e.skill,background:e.background,status:"active",hired_at_tick:o}).select("*").single();if(n)return console.error("[Agitator] Failed to hire:",n.message),{success:!1,agitator:null,error:n.message};var{error:d}=await a.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",e.id);return d&&console.error("[Agitator] Failed to mark pool candidate as hired:",d.message),{success:!0,agitator:i,error:null}}const Pt=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],Ue=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function me(a){return a<=5?{tier:1,label:"Clean Government",color:"#c55"}:a<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:a<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const it={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5},gov:{momentum:3}},2:{resolution:"PARTIAL WIN",filer:{momentum:3},gov:{momentum:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7},gov:{momentum:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12},gov:{momentum:-10}}},$e={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function yt(a,t){var e=a;for(var o in t)e=e.split("{"+o+"}").join(t[o]);return e}async function Aa(a,t){var{factionId:e,nationId:o,agitatorId:r,targetMinistry:i,basis:n,currentTick:d,partyName:c,administration:v}=t,p,s,l;if(n==="civil_rights"){var y=Number(v?.stats_at_start?.freedom_index??50);s=50,p=y,l=Math.max(0,p-s)}else{var u=Number(v?.stats_at_start?.corruption??50);s=50,p=u,l=Math.max(0,s-p)}var u=p,f=s,h=me(l),m=it[h.tier],x=d+8,b=Pt.find(function(A){return A.key===i}),_=b?"Ministry of "+b.label:i,M=Ue.find(function(A){return A.key===n}),w=M?M.label:n,{data:k,error:E}=await a.from("lawsuits").insert({faction_id:e,nation_id:o,agitator_id:r,target_ministry:i,basis:n,filed_at_tick:d,resolves_at_tick:x,corruption_at_start:u,corruption_at_filing:f,corruption_growth:l,tier:h.tier,status:"active",resolution:null,momentum_effect:m.filer.momentum,gov_momentum_effect:m.gov.momentum}).select("*").single();if(E)return{success:!1,lawsuit:null,tier:0,error:E.message};var S=$e[h.tier]||$e[1],L={party:c||"Opposition",ministry:_,basis:w},T=[{event_tick:d,event_type:"filing",headline:yt(S.filing,L)},{event_tick:d+2,event_type:"discovery",headline:yt(S.discovery,L)},{event_tick:d+5,event_type:"evidence",headline:yt(S.evidence,L)},{event_tick:d+7,event_type:"pre_trial",headline:yt(S.pre_trial,L)},{event_tick:x,event_type:"resolution",headline:yt(S.resolution,L)}],P=T.map(function(A){return{lawsuit_id:k.id,nation_id:o,event_tick:A.event_tick,event_type:A.event_type,headline:A.headline,is_fired:A.event_tick===d}}),{error:I}=await a.from("lawsuit_events").insert(P);I&&console.error("[Lawsuits] Failed to insert milestone events:",I.message);var{error:N}=await a.from("event_log").insert({nation_id:o,event_name:"LAWSUIT FILED",event_type:"lawsuit",category:"political",description_chosen:T[0].headline,fired_at_tick:d,faction_id:e||null,effects_applied:{lawsuit_id:k.id,tier:h.tier,target_ministry:_,basis:w,milestone:"filing"}});return N&&console.warn("[Lawsuits] event_log insert (filing) failed:",N.message),{success:!0,lawsuit:k,tier:h.tier,error:null}}async function Ta(a,t){var{data:e,error:o}=await a.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return o?(console.error("[Lawsuits] Failed to fetch lawsuits:",o.message),[]):e||[]}async function Pa(a,t,e){const o=[],r=t.overreach_count??0,i=r>=R.IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD;o.push({type:"abuse_of_power",label:"Abuse of Power",available:i,reason:i?"":`Requires presidential overreach ≥ ${R.IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD} (currently ${r})`});const n=t.gov_approval??40,d=R.IMPEACHMENT_INCOMPETENCE_TICKS;let c=!1,v="";if(e&&e.faction_id){const{data:m}=await a.from("factions").select("nation_id, abandoned_at, is_banned").eq("id",e.faction_id).maybeSingle(),x=ka(m);x&&(c=!0,v=x==="unassigned"?"unassigned to any nation":x)}let p=!1,s=0;if(n<=R.IMPEACHMENT_INCOMPETENCE_THRESHOLD){const{data:m}=await a.from("nations_history").select("tick, gov_approval").eq("nation_id",t.id).order("tick",{ascending:!1}).limit(d);s=(m||[]).filter(x=>x.gov_approval<=R.IMPEACHMENT_INCOMPETENCE_THRESHOLD).length,p=m&&m.length>=d&&s>=d}const l=c||p;let y="Gross Incompetence",u="";l?c&&(y=`Gross Incompetence (party ${v})`):u=`Requires gov approval ≤ ${R.IMPEACHMENT_INCOMPETENCE_THRESHOLD} for ${d} consecutive ticks (${s}/${d} met, currently ${Math.round(n)}), or the president's party to become inactive`,o.push({type:"incompetence",label:y,available:l,reason:u});let f=0;if(e){const{data:m}=await a.from("bills").select("id, bill_support(stance, seat_count)").eq("nation_id",t.id).eq("president_action","vetoed").gte("president_action_tick",e.elected_tick||0),x=Math.ceil(R.TOTAL_SEATS*(2/3));for(const b of m||[]){let _=0;for(const M of b.bill_support||[])(M.stance==="accept"?"yes":M.stance==="reject"?"no":M.stance)==="yes"&&(_+=M.seat_count||0);_>=x&&f++}}const h=f>=R.IMPEACHMENT_VETO_ABUSE_COUNT;return o.push({type:"constitutional_violation",label:"Constitutional Violation",available:h,reason:h?"":`Requires ≥ ${R.IMPEACHMENT_VETO_ABUSE_COUNT} vetoed bills with ⅔ support (currently ${f})`}),o}function ct(a){return String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}async function za(a,t){const{faction:e,nation:o,president:r,isPresidentParty:i,mySeats:n,currentTick:d}=t||{};if(!e||!o||!r)return{ok:!1};if((n||0)<1)return alert("Need at least 1 seat in the legislature to file impeachment."),{ok:!1};if(i)return alert("The president's own party cannot file impeachment."),{ok:!1};const{data:c}=await a.from("impeachment_proceedings").select("id").eq("nation_id",o.id).neq("phase","resolved").limit(1).maybeSingle();if(c)return alert("An impeachment proceeding is already active."),{ok:!1};if(o.impeachment_cooldown_until_tick&&d<o.impeachment_cooldown_until_tick){const m=o.impeachment_cooldown_until_tick-d;return alert(`Impeachment cooldown: ${m} tick${m!==1?"s":""} remaining.`),{ok:!1}}const v=await Pa(a,o,r);if(!v.some(m=>m.available))return alert("No impeachment charges are currently available. All charges require specific preconditions to be met."),{ok:!1};const p=v.map(m=>{const x=m.available?"":"disabled",b=m.available?"":"opacity:0.4;",_=m.reason?` title="${ct(m.reason)}"`:"";return`<label style="display:block;margin:8px 0;${b}"${_}>
            <input type="checkbox" name="impeach-charge" value="${ct(m.type)}" ${x} style="margin-right:8px;">
            <strong>${ct(m.label)}</strong>${m.reason?` <span style="font-size:0.7rem;color:var(--text-secondary);">(${ct(m.reason)})</span>`:""}
        </label>`}).join(""),s=document.createElement("div");s.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;",s.innerHTML=`
        <div style="background:var(--bg-panel);border:1px solid var(--border-0);border-radius:3px;padding:24px;max-width:440px;width:90%;max-height:80vh;overflow-y:auto;">
            <div style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--red);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;">⚖ IMPEACH PRESIDENT</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">
                President ${ct(r.first_name)} ${ct(r.last_name)}
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
        </div>`,document.body.appendChild(s);const l=await new Promise(m=>{s.querySelector("#impeach-cancel-btn").addEventListener("click",()=>m(null)),s.addEventListener("click",x=>{x.target===s&&m(null)}),s.querySelector("#impeach-confirm-btn").addEventListener("click",()=>{const x=[...s.querySelectorAll('input[name="impeach-charge"]:checked')].map(b=>b.value);if(x.length===0){alert("Select at least one charge.");return}m(x)})});if(s.remove(),!l)return{ok:!1};const y=l.map(m=>{const x=v.find(b=>b.type===m);return{type:m,label:x.label}}),u=`${r.first_name} ${r.last_name}`,f=`Articles of Impeachment Against President ${u}`,h=y.map(m=>m.label).join(", ");try{const{data:m}=await a.from("shard").select("current_tick").eq("name","Alpha Shard").single(),x=m?.current_tick||0,{data:b,error:_}=await a.from("impeachment_proceedings").insert({nation_id:o.id,president_id:r.id,initiated_by_faction_id:e.id,charges:y,phase:"motion_committee",created_at_tick:x}).select().single();if(_)throw _;const{data:M,error:w}=await a.from("bills").insert({nation_id:o.id,proposed_by:e.id,proposed_tick:x,bill_name:f,bill_type:"impeachment_motion",status:"committee",impeachment_id:b.id,proposer_name:e.faction_name,proposer_color:e.party_color,preamble:`This motion, filed by the ${e.faction_name}, calls for the impeachment of President ${u} on the following charges: ${h}. After ${R.IMPEACHMENT_COMMITTEE_TICKS} ticks of committee debate, the motion will proceed to a floor vote requiring an absolute majority (${R.MAJORITY_SEATS} of ${R.TOTAL_SEATS} seats) to pass.`}).select().single();if(w)throw w;await a.from("impeachment_proceedings").update({motion_bill_id:M.id}).eq("id",b.id);const{count:k}=await a.from("impeachment_proceedings").select("id",{count:"exact",head:!0}).eq("nation_id",o.id).neq("phase","resolved");if(k>1)return await a.from("bills").delete().eq("id",M.id),await a.from("impeachment_proceedings").delete().eq("id",b.id),alert("Another impeachment proceeding was just filed. Please refresh."),{ok:!1};await a.from("bill_support").upsert({bill_id:M.id,faction_id:e.id,stance:"yes",seat_count:n},{onConflict:"bill_id,faction_id"});const{error:E}=await a.from("event_log").insert({nation_id:o.id,event_name:`Impeachment Motion Filed Against President ${u}`,category:"government",trigger_key:"impeachment_motion_filed",description_chosen:`The ${e.faction_name} has filed articles of impeachment against President ${u}. Charges: ${h}. A ${R.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate will precede the floor vote.`,fired_at_tick:x});return E&&console.warn("[impeachment] event_log insert failed:",E.message),alert(`⚖ "${f}" has been filed!

${R.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate begins now. The motion will then proceed to a floor vote.`),window.location.href=`bill.html?id=${M.id}`,{ok:!0,billId:M.id}}catch(m){return console.error("[impeachment] file failed:",m?.message||m),alert("Error: "+(m?.message||m)),{ok:!1}}}let C=null,g=null,V="leader",Z=[],fe=[],j=null,F=null,rt=!1,B=null,ft=[],ne=[],mt=!1,ot=null,W=null,_t=!1;const jt=new Set;let st=null,H=null,tt=!1,bt=[],Mt=!1,Ut=!1,At=new Set;function $(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function X(a,t){return((a||"?")[0]+(t||"?")[0]).toUpperCase()}const Ge=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}];let $t=0,zt=0,re=!1,G={eligible:!1,lockReason:"Loading...",metaLine:""};async function Ra(){if(!C||!g?.faction?.id||!g?.shard?.current_tick)return;const{count:a,error:t}=await C.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",g.faction.id).eq("action_type","fundraise").eq("tick_performed",g.shard.current_tick);$t=!t&&a!=null?a:0}async function Oa(){if(zt=0,re=!1,!C||!g?.nation?.id||!g?.shard?.current_tick)return;const a=g.shard.current_tick,t=B?.pm_party_id;try{const{data:e}=await C.from("bills").select("id").eq("nation_id",g.nation.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(re=!!(e&&e.length),t){const{data:o}=await C.from("campaign_actions").select("tick_performed").eq("nation_id",g.nation.id).eq("action_type","no_confidence_filed").eq("target_id",t).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(o){const r=a-Number(o.tick_performed||0),i=typeof R<"u"&&R.NO_CONFIDENCE_COOLDOWN_TICKS||12;zt=Math.max(0,i-r)}}}catch(e){console.warn("[PartyActions] loadNoConfidenceState failed:",e?.message||e)}}async function Fa(){if(G={eligible:!1,lockReason:"Loading...",metaLine:""},!C||!g?.nation?.id||!g?.faction?.id)return;const a=g.nation,t=g.faction,e=Number(g?.shard?.current_tick)||0,o=(a.government_type||"").toLowerCase();if(o.includes("absolute monarchy")||o.includes("absolute_monarchy")){G={eligible:!1,lockReason:"Only available in parliamentary systems.",metaLine:""};return}if((t.seats||0)<=0){G={eligible:!1,lockReason:"Your party has no parliamentary seats.",metaLine:""};return}if(W&&(W.status==="formed"||W.status==="caretaker")){G={eligible:!1,lockReason:W.formation_type==="emergency_minority"?"A minority government is already in place.":"A government is already in place.",metaLine:"Active Coalition"};return}const{data:r}=await C.from("elections").select("id, election_tick").eq("nation_id",a.id).eq("status","completed").not("results","is",null).order("election_tick",{ascending:!1}).limit(1).maybeSingle();if(!r){G={eligible:!1,lockReason:"No completed election to form a government from.",metaLine:"No election yet"};return}const i=Number(r.election_tick||0),n=De,d=i+n,c=e-i,v=`Last election: ${ge(i)} · Becomes available ${ge(d)}`;if(c<n){const b=n-c;G={eligible:!1,lockReason:`Coalition window still open: ${b} tick${b!==1?"s":""} remaining.`,metaLine:v};return}const p=Number(a.total_seats)||100,s=Math.floor(p/2)+1,{data:l,error:y}=await C.from("factions").select("id, faction_name, seats, last_seen_tick").eq("nation_id",a.id).eq("faction_type","party");if(y){G={eligible:!1,lockReason:"Could not load party state.",metaLine:v};return}const u=l||[];if(u.some(b=>(b.seats||0)>=s)){G={eligible:!1,lockReason:"A party already holds an outright majority — form a normal government instead.",metaLine:v};return}const h=4,x=u.filter(b=>(b.seats||0)>0&&(Number(b.last_seen_tick)||0)>=e-h).sort((b,_)=>(_.seats||0)-(b.seats||0)||(b.id<_.id?-1:1))[0];if(!x){G={eligible:!1,lockReason:"No active parties qualify to form a government.",metaLine:v};return}if(x.id!==t.id&&!da()){G={eligible:!1,lockReason:`Only the largest active party (${x.faction_name||"unknown"}) may form a minority government.`,metaLine:v};return}G={eligible:!0,lockReason:"",metaLine:v}}const Ve=[{id:"fundraise",name:"Fundraise",desc:"Host a themed event for one voter bloc. Once per tick. Costs −0.3 popularity with the host bloc (donor fatigue) and −0.5 with a paired opposition bloc (optics). Yields cash to party funds based on your rapport with the host bloc and its national weight. Corporate Gala is positioning-only.",cost:"ACTION",costColor:"#c8a832",moneyCost:0,tags:["CAMPAIGN","POSITIONING"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1},{id:"no_confidence",name:"Vote of No Confidence",desc:"File a motion of no confidence against the Prime Minister. If a simple majority votes YES, the government falls and snap elections are triggered. PASS: +15 Momentum to you, -10 Momentum to the PM’s party. FAIL: -10 Momentum to you. 12-tick cooldown on the targeted PM party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1},{id:"leadership_challenge",name:"Leadership Challenge",desc:"Claim the vacant Premiership for your party leader. Available only when there is no sitting Prime Minister. If multiple coalition parties claim on the same tick, the largest-by-seats wins (earliest claim breaks ties). Winning parties get a one-time +0.3 popularity boost across all voter sectors.",cost:"COALITION ONLY",costColor:"#c8a832",moneyCost:0,tags:["GOVERNMENT","COALITION"],locked:!1},{id:"form_coalition",name:"Form Coalition",desc:"Open the coalition formation flow when no coalition government exists — invite parties, assemble at least the majority threshold of seats, then assign ministries and install a new Prime Minister. If a coalition exists but the PM is vacant, coalition members should use Leadership Challenge instead.",cost:"GOVERNMENT",costColor:"#c8a832",moneyCost:0,tags:["GOVERNMENT","COALITION"],locked:!1},{id:"form_minority_government",name:"Form Minority Government",desc:"Deadlock breaker. After the coalition window closes (3 ticks post-election) with no government formed, the leader of the largest active party can govern alone. Bills pass with -20% effective YES votes; a snap election fires automatically in 36 ticks if a stable coalition isn't formed before then.",cost:"GOVERNMENT",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","DEADLOCK"],locked:!1},{id:"leave_coalition",name:"Leave Coalition",desc:"Walk out of the current governing coalition. Any ministries your party holds are vacated. You drop from governing to opposition. Coalition flips to minority if your exit drops it below the majority threshold. Cost: −3 Momentum to you, −5 Momentum to the PM’s party. 12-tick cooldown. PM’s party cannot use this — resign first.",cost:"−3 MOM",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","RISKY"],locked:!1},{id:"disband_party",name:"Disband Party",desc:"Voluntarily dissolve your party. Your seats are vacated and sit empty until the next election (no backfill or redistribution). All party funds and momentum are lost. You are removed from every nation chat. Cannot be undone. 24-tick cooldown per user. Cannot be used while Prime Minister, sitting President, or reigning Monarch — step down first.",cost:"IRREVERSIBLE",costColor:"#c55",moneyCost:0,tags:["IRREVERSIBLE"],locked:!1}],Ba=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases crown authority (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Crown Authority per seat revoked. Use sparingly — the nobles do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Et={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},we=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],ke=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function Ye(a,t){C=a,g=t;const e=document.getElementById("pa-actions-root");if(!e)return;const o=t.faction;if(!o){e.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}try{const{data:s}=await C.from("factions").select("momentum, party_funds, seats, action_points, bloc_id, last_petition_for_reform_tick").eq("id",o.id).single();s&&(o.momentum=s.momentum??o.momentum,o.party_funds=s.party_funds??o.party_funds,o.seats=s.seats??o.seats,o.action_points=s.action_points??o.action_points,o.bloc_id=s.bloc_id??null,o.last_petition_for_reform_tick=s.last_petition_for_reform_tick??null)}catch(s){console.warn("[PartyActions] faction refresh failed, using cached state:",s)}try{const s=t.nation?.id;if(s){const{data:l}=await C.from("petitions").select("id").eq("nation_id",s).eq("status","pending").maybeSingle();o._petitionPending=!!l}}catch(s){console.warn("[PartyActions] petition-pending check failed:",s?.message||s),o._petitionPending=!1}const[r,i,n,d,c,v]=await Promise.all([C.from("faction_platforms").select("*").eq("faction_id",o.id).order("slot"),C.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),je(C,o.id),qe(C,t.nation?.id,o.id),C.from("faction_electoral_standing").select("visibility, raw_appeal").eq("faction_id",o.id).eq("nation_id",t.nation?.id).maybeSingle(),He(C,t.nation?.id)]);W=v||null,t.nation&&(t.nation.__coalition_status=v?.status||null),r.error&&console.error("[PartyActions] Failed to load faction platforms:",r.error.message),i.error&&console.error("[PartyActions] Failed to load nation platforms:",i.error.message),Z=r.data||[],fe=i.data||[],j=n,rt=d.isOpposition,B=d.administration,c.data,await Ra(),await Oa(),await Fa();try{const[{data:s},{data:l}]=await Promise.all([C.from("head_of_government").select("id, faction_id, active").eq("nation_id",t.nation?.id).eq("active",!0).maybeSingle(),C.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);ot=s||null;const y=Number(l?.current_tick)||0,{data:u}=await C.from("leadership_challenges").select("id").eq("nation_id",t.nation?.id).eq("faction_id",o.id).is("resolved_at_tick",null).gte("claimed_at_tick",y-1).limit(1).maybeSingle();_t=!!u}catch(s){console.warn("[PartyActions] HOG / leadership claim state load failed:",s?.message||s),ot=null,_t=!1}const{data:p}=await C.from("faction_deputies").select("*").eq("faction_id",o.id).eq("status","active").maybeSingle();if(F=p||null,st=null,t.nation?.id&&(t.nation.government_type||"").toLowerCase().includes("presidential")){const{data:l}=await C.from("presidents").select("id, faction_id, first_name, last_name, elected_tick").eq("nation_id",t.nation.id).eq("is_active",!0).maybeSingle();st=l||null}if(ft=[],o?.id&&t.nation?.id){const{data:s,error:l}=await C.from("ministries").select("id, ministry_key, party_id, is_active, minister_first_name, minister_last_name, minister_age, discretionary_balance").eq("nation_id",t.nation.id).eq("party_id",o.id).eq("is_active",!0);l?console.warn("[PartyActions] ministries fetch failed:",l.message):ft=(s||[]).filter(y=>y.minister_first_name)}j&&(ne=await Ta(C,o.id)),await Ct(o.id,t.nation?.id),O(e)}function ve(a){return a?{isPM:!!B&&B.pm_party_id===a.id,isPresident:g?.nation?.hos_election_method==="elected"&&B?.president_party_id===a.id,isMonarchActing:K(g?.nation)&&g?.nation?.monarch_faction_id===a.id}:{isPM:!1,isPresident:!1,isMonarchActing:!1}}async function Ct(a,t){if(!a||!t){H=null,tt=!1,bt=[];return}try{const{data:e,error:o}=await C.from("bloc_invitations").select("id, bloc_id, invited_by_faction_id, created_at_tick, status, bloc:bloc_id(id,name,leader_faction_id), inviter:invited_by_faction_id(id,faction_name,party_color)").eq("invited_faction_id",a).eq("status","pending").order("created_at_tick",{ascending:!1});if(o)throw o;bt=e||[];const r=g?.faction?.bloc_id||null;if(r){const{data:i,error:n}=await C.from("blocs").select("*").eq("id",r).is("dissolved_at_tick",null).maybeSingle();if(n)throw n;if(i){const{data:d}=await C.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name").eq("bloc_id",i.id).order("seats",{ascending:!1});H={...i,members:d||[]},tt=i.leader_faction_id===a}else H=null,tt=!1}else H=null,tt=!1}catch(e){console.warn("[PartyActions] loadBlocState failed:",e?.message||e)}}function We(a){if(!H)return"";const t=tt?`<span style="margin-left:6px;font-family:var(--font-mono);font-size:7px;color:${a};letter-spacing:0.08em;">LEADER</span>`:"";return`<span class="pa-bloc-tag" style="display:inline-flex;align-items:center;padding:2px 8px;background:${a}18;border:1px solid ${a}55;color:${a};font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        BLOC &middot; ${$(H.name)}${t}
    </span>`}function Ke(a){if(!H)return"";const t=H.members||[],e=t.reduce((r,i)=>r+(Number(i.seats)||0),0),o=t.map(r=>{const i=r.id===H.leader_faction_id,n=r.party_color||a;return`<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid ${n}44;border-left:3px solid ${n};background:var(--bg-card);font-family:var(--font-mono);font-size:9px;">
            <span style="color:var(--text-bright);font-weight:700;">${$(r.faction_name||"Unknown")}</span>
            <span style="color:var(--text-dim);">${r.seats||0} seats</span>
            ${i?`<span style="color:${n};font-weight:700;letter-spacing:0.08em;">LEADER</span>`:""}
        </span>`}).join("");return`<div style="margin:8px 0;padding:8px 12px;background:${a}0a;border:1px solid ${a}33;border-left:3px solid ${a};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${a};letter-spacing:0.08em;">BLOC &middot; ${$(H.name)}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${t.length} member${t.length!==1?"s":""} &middot; ${e} combined seats</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${o}</div>
    </div>`}function Je(a){if(!bt||bt.length===0)return"";const t=o=>(Array.isArray(o)?o[0]:o)||null;return`<div style="margin:10px 0 4px;">${bt.map(o=>{const r=t(o.bloc),i=t(o.inviter),n=r?.name||"a bloc",d=i?.faction_name||"A party leader",c=i?.party_color||a,v=At.has(o.id);return`<div style="margin:6px 0;padding:8px 12px;border:1px solid ${c}55;border-left:3px solid ${c};background:${c}08;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="flex:1;">
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${c};letter-spacing:0.08em;">BLOC INVITATION</div>
                <div style="font-size:11px;color:var(--text-bright);margin-top:2px;">
                    <strong>${$(d)}</strong> invites you to join <strong>${$(n)}</strong>.
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--submit" data-invite-id="${$(o.id)}" data-decision="accept"${v?" disabled":""}>Accept</button>
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--cancel" data-invite-id="${$(o.id)}" data-decision="decline"${v?" disabled":""}>Decline</button>
            </div>
        </div>`}).join("")}</div>`}async function ue(a){const{data:t}=await C.from("factions").select("bloc_id, momentum").eq("id",a).single();t&&(g.faction.bloc_id=t.bloc_id||null,t.momentum!=null&&(g.faction.momentum=t.momentum))}async function Ha(a,t,e){try{const o=g?.faction?.id;if(!o)throw new Error("No active faction");const r=t==="accept"?"accept_bloc_invite":"decline_bloc_invite",i=t==="accept"?"p_accepting_faction_id":"p_declining_faction_id",{data:n,error:d}=await C.rpc(r,{p_invitation_id:a,[i]:o});if(d)throw d;if(n&&n.success===!1)throw new Error(n.error||"Unknown error");await ue(o),await Ct(o,g.nation?.id),O(e)}catch(o){console.error("[PartyActions] respondToBlocInvite failed:",o),alert(t==="accept"?`Could not accept invitation: ${o.message||o}`:`Could not decline invitation: ${o.message||o}`)}}async function Da(a){if(!H||Ut)return;const t=H,e=tt?`Leaving ${t.name} will DISSOLVE the entire bloc. All ${t.members?.length||0} members will be removed and pending invitations rescinded.

Proceed?`:`Leave the ${t.name} bloc?`;if(confirm(e)){Ut=!0;try{const{data:o,error:r}=await C.rpc("leave_bloc",{p_faction_id:g.faction.id});if(r)throw r;if(o&&o.success===!1)throw new Error(o.error||"Unknown error");await ue(g.faction.id),await Ct(g.faction.id,g.nation?.id),O(a)}catch(o){console.error("[PartyActions] leave_bloc failed:",o),alert(`Could not leave bloc: ${o.message||o}`)}finally{Ut=!1}}}async function qa(a){const t=document.getElementById("pa-bloc-modal");if(!t||H)return;const e=g.faction,o=e?.color||"#c8a832";t.innerHTML=`
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
    `,t.classList.add("active");const r=new Set;let i=[];const n=()=>t.classList.remove("active");document.getElementById("pa-bloc-close")?.addEventListener("click",n),document.getElementById("pa-bloc-cancel")?.addEventListener("click",n),t.addEventListener("click",s=>{s.target===t&&n()});try{const s=g.nation?.id,{data:l}=await C.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name, leader_age, bloc_id").eq("nation_id",s).eq("faction_type","party").is("abandoned_at",null),y=(l||[]).filter(f=>f.id!==e.id);i=y;const u=document.getElementById("pa-bloc-party-list");if(!u)return;if(y.length===0){u.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No other parties in this nation.</div>';return}u.innerHTML=y.map(f=>{const h=f.party_color||"#7a7a7a",m=f.leader_first_name&&f.leader_last_name?`${f.leader_first_name} ${f.leader_last_name}`:"Party Leader",x=f.bloc_id?"Already in a bloc":null;return`<label class="pa-bloc-party-row" data-party-id="${$(f.id)}" data-ineligible="${x?"1":"0"}"
                style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border-mid);border-left:3px solid ${h};cursor:${x?"not-allowed":"pointer"};opacity:${x?"0.45":"1"};">
                <input type="checkbox" class="pa-bloc-party-check" ${x?"disabled":""} style="margin:0;">
                <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:baseline;gap:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${$(f.faction_name)}</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${f.seats||0} seats</span>
                    </div>
                    <div style="font-size:9px;color:var(--text-secondary);">${$(m)}</div>
                    ${x?`<div style="font-family:var(--font-mono);font-size:8px;color:var(--orange);margin-top:3px;">${x}</div>`:""}
                </div>
            </label>`}).join(""),u.addEventListener("change",f=>{const h=f.target.closest(".pa-bloc-party-row");if(!h)return;if(h.dataset.ineligible==="1"){f.target.checked=!1;return}const m=h.dataset.partyId;f.target.checked?r.add(m):r.delete(m),p()})}catch(s){console.error("[PartyActions] Create Bloc modal fetch failed:",s);const l=document.getElementById("pa-bloc-party-list");l&&(l.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${$(s.message||String(s))}</div>`)}const d=document.getElementById("pa-bloc-name"),c=document.getElementById("pa-bloc-submit"),v=document.getElementById("pa-bloc-name-count"),p=()=>{const s=(d?.value||"").trim();v&&(v.textContent=`${s.length} / 40`),c&&(c.disabled=!(s.length>0&&r.size>0)||Mt)};d?.addEventListener("input",p),c?.addEventListener("click",async()=>{if(Mt)return;const s=(d?.value||"").trim();if(!(s.length===0||r.size===0)){Mt=!0,c.disabled=!0,c.textContent="Creating...";try{const{data:l,error:y}=await C.rpc("create_bloc",{p_leader_faction_id:e.id,p_name:s,p_invitee_faction_ids:Array.from(r)});if(y)throw y;if(l&&l.success===!1)throw new Error(l.error||"Unknown error");g.faction.party_funds=Math.max(0,(g.faction.party_funds||0)-1e5),await ue(e.id),n(),await Ct(e.id,g.nation?.id),O(a)}catch(l){console.error("[PartyActions] create_bloc failed:",l),alert(`Could not create bloc: ${l.message||l}`),c.disabled=!1,c.textContent="Create Bloc & Send Invites"}finally{Mt=!1}}})}async function ja(a){if(!H||!tt)return;const t=document.getElementById("pa-bloc-modal");if(!t)return;const e=g.faction?.color||"#c8a832";t.innerHTML=`
        <div class="pa-modal" style="width:520px;max-height:75vh;overflow:hidden;display:flex;flex-direction:column;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${e};"></div>
                    <span class="pa-modal-title">Invite to ${$(H.name)}</span>
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
        </div>`,t.classList.add("active");const o=()=>t.classList.remove("active");document.getElementById("pa-blinv-close")?.addEventListener("click",o),document.getElementById("pa-blinv-cancel")?.addEventListener("click",o),t.addEventListener("click",n=>{n.target===t&&o()});const r=g.nation?.id,i=document.getElementById("pa-blinv-list");if(!(!i||!r))try{const{data:n,error:d}=await C.from("factions").select("id, faction_name, seats, party_color, bloc_id").eq("nation_id",r).eq("faction_type","party").is("abandoned_at",null).is("bloc_id",null);if(d){i.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${$(d.message)}</div>`;return}const c=(n||[]).filter(v=>v.id!==g.faction.id);if(c.length===0){i.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No eligible parties to invite.</div>';return}i.innerHTML=c.map(v=>{const p=v.party_color||"#888";return`<div class="pa-blinv-row" data-faction-id="${$(v.id)}" style="padding:8px 10px;border:1px solid ${p}33;border-left:3px solid ${p};display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:var(--bg-card);">
                <div>
                    <div style="font-size:11px;color:var(--text-bright);font-weight:600;">${$(v.faction_name||"Unknown")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${v.seats||0} seats</div>
                </div>
                <button class="pa-modal-btn pa-modal-btn--submit pa-blinv-send" data-faction-id="${$(v.id)}">Invite</button>
            </div>`}).join(""),i.addEventListener("click",async v=>{const p=v.target.closest(".pa-blinv-send");if(!p)return;const s=p.dataset.factionId;if(s){p.disabled=!0,p.textContent="Sending…";try{const{error:l}=await C.rpc("invite_to_bloc",{p_bloc_id:H.id,p_invitee_faction_id:s});if(l)throw l;p.textContent="Invited",await Ct(g.faction.id,g.nation?.id),O(a)}catch(l){console.warn("[PartyActions] invite_to_bloc failed:",l),alert(`Could not invite: ${l.message||l}`),p.disabled=!1,p.textContent="Invite"}}})}catch(n){console.warn("[PartyActions] openInviteToBlocModal threw:",n),i.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Unexpected error.</div>'}}function O(a){const t=g.faction,e=g.nation,o=K(e),r=o&&e?.monarch_faction_id===t?.id,i=t.color||"#c8a832",n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",d=t.seats||0,c=e?.total_seats||120,v=c>0?Math.round(d/c*100):0;t.action_points,t.approval_rating;const p=t.momentum??50,s=t.party_funds??0,l=Ea(Z,e),y=[];for(let m=1;m<=3;m++){const x=Z.find(b=>b.slot===m);if(x){const b=ht.find(k=>k.id===x.platform_key),_=l.find(k=>k.id===x.id),M=_?_.stats.filter(k=>k.met).length:0,w=_?_.stats.length:0;y.push({name:b?.name||x.platform_key,status:x.status,metCount:M,totalCount:w,slot:m})}else y.push(null)}const u=y.map(m=>{if(!m)return{label:"No Platform"};const x=m.status==="fulfilled"?" ✓":m.status==="failed"?" ✗":m.status==="abated"?" —":"",b=m.status==="fulfilled"?"fulfilled":m.status==="failed"?"failed":m.status==="abated"?"abated":"filled",_=m.totalCount>0?` (${m.metCount}/${m.totalCount})`:"";return{label:m.name+_+x,statusClass:b,title:`${m.metCount} of ${m.totalCount} stats on target`}}),f="$"+(s>=1e6?(s/1e6).toFixed(1)+"M":s>=1e3?Math.round(s/1e3)+"k":s),h=Math.round(Number(o?g.nation?.crown_authority??50:g.nation?.gov_approval??0));la(a,{title:r?"Royal Court":"Party Actions",entityName:t.faction_name,entityColor:i,stats:[{label:"Party Funds",value:f,color:"var(--accent)"},{label:"Momentum",value:Number(p).toFixed(1),color:p>0?"var(--text-bright)":"var(--red)"},{label:o?"Crown Authority":"Nat. Approval",value:String(h),color:"var(--green)"}],statusBarItems:[{type:"count",label:"Seats",big:String(d),bigColor:i,dim1:`/ ${c}`,dim2:`(${v}%)`},{type:"list",label:"Platforms",items:u}],rolesContainerId:"pa-leaders",panelContainerId:"pa-actions-panel",extraHtml:`
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
            <div class="pa-modal-overlay" id="pa-allocate-funds-modal"></div>
        `}),document.getElementById("pa-leaders").innerHTML=Ua(n,i,t),document.getElementById("pa-actions-panel").innerHTML=ye(n,i,t);for(const m of Object.keys(Rt))ea(m);document.getElementById("pa-leaders")?.addEventListener("click",m=>{const x=m.target.closest(".pa-leader-card");if(!x||x.classList.contains("vacant"))return;const b=x.dataset.role;b&&b!==V&&(V=b,O(a))}),document.getElementById("pa-actions-panel")?.addEventListener("click",m=>{const x=m.target.closest(".pa-action-item");if(!x||x.classList.contains("locked"))return;const b=x.dataset.actionId;if(b==="fundraise")zo(a);else if(b==="grant_seats")wo(a);else if(b==="revoke_seats")ko(a);else if(b==="rally")oo(a);else if(b==="statement")Bo(a);else if(b==="platform")Ho(a);else if(b==="file_lawsuit")_o(a);else if(b==="petition_for_reform")bo();else if(b==="appoint_pm")$o(a);else if(b==="modernize")fo(a);else if(b==="rebrand")vo(a);else if(b==="no_confidence")Ao();else if(b==="call_early_elections")Eo();else if(b==="resign_as_pm")So();else if(b==="leave_coalition")Io();else if(b==="disband_party")Lo();else if(b==="create_bloc")qa(a);else if(b==="leave_bloc")Da(a);else if(b==="invite_to_bloc")ja(a);else if(b==="impeach_president")No();else if(b==="debt_payment")no(a);else if(b==="allocate_funds")ro(a);else if(b==="invest_in_sports_culture")io(a,t);else if(b==="expand_stadium_infrastructure")so(a,t);else if(b==="expand_infrastructure")lo(a,t);else if(Rt[b])ho(b,t);else if(b==="bid_to_host_vwc")po(a,t);else if(b==="leadership_challenge")Mo(a,t);else if(b==="form_coalition"){const _=document.querySelector('.pa-subtab[data-panel="election"]');_&&_.click()}else b==="form_minority_government"&&Co()}),document.getElementById("pa-actions-panel")?.addEventListener("click",async m=>{const x=m.target.closest(".pa-bloc-invite-btn");if(!x)return;const b=x.dataset.inviteId,_=x.dataset.decision;if(!(!b||!_)&&!At.has(b)){At.add(b);try{await Ha(b,_,a)}finally{At.delete(b)}}}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>Le(a)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",m=>{m.target.closest("#pa-hire-agitator-btn")||Le(a)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>Ce(a)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",m=>{m.target.closest("#pa-hire-deputy-btn")||Ce(a)})}function Ua(a,t,e){const o=K(g.nation)&&g.nation?.monarch_faction_id===e?.id;return Ge.map(r=>{const i=r.id==="leader",n=r.id==="agitator",d=V===r.id;let c,v,p,s,l;if(i){c=!1,v=a,p=X(e.leader_first_name,e.leader_last_name),s=Ve.length;const f=K(g.nation);if(f&&g.nation?.monarch_faction_id===e.id)l={text:(g.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(f)l={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const m=B?.pm_party_id===e.id,x=g.nation?.hos_election_method==="elected"&&B?.president_party_id===e.id;m?l={text:"PRIME MINISTER",color:"#5cc55c"}:x?l={text:"PRESIDENT",color:"#5cc55c"}:rt?l={text:"OPPOSITION",color:"#c84"}:l={text:"GOVERNING",color:"#8b9a6b"}}}else n&&j?(c=!1,v=`${j.first_name} ${j.last_name}`,p=X(j.first_name,j.last_name),s=1):n&&!j?(c=!1,v="Not Hired",p="+",s=0):r.id==="deputy"&&F?(c=!1,v=`${F.first_name} ${F.last_name}`,p=X(F.first_name,F.last_name),s=1):r.id==="deputy"&&!F?(c=!1,v="Not Hired",p="+",s=0):r.id==="campaign"?(c=!1,v="Campaign Mgr",p="CM",s=Qe.length):(c=!0,v="Vacant",p="—",s=0);const y=r.oppositionOnly&&!rt;return`
            <div class="pa-leader-card ${d?"active":""} ${c?"vacant":""} ${y?"vacant":""}"
                 data-role="${r.id}"
                 style="${d?`border-left-color:${r.color};`:""}${y?"opacity:0.35;":""}">
                ${r.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${y?"var(--text-dim)":"#d44a4a"};background:${y?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${y?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${y?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${r.color};background:${r.color}15;border-color:${r.color}33;">${p}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${r.color};">${i&&o?(g.nation?.monarch_title||"King").toUpperCase():r.title}</span>
                            ${s>0?`<span class="pa-leader-role-count">${s} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${$(v)}</div>
                        ${l?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${l.color};margin-top:2px;">${l.text}</div>`:""}
                        ${n&&j?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${j.skill}%;background:${dt(j.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${j.skill}</span></div>`:""}
                        ${n&&!j?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
                    </div>
                </div>
            </div>
        `}).join("")+Ja(e)}const Ga={interior:{short:"MI",name:"Ministry of the Interior",short_role:"Interior",domain:"HOME AFFAIRS"},foreign:{short:"MFA",name:"Ministry of Foreign Affairs",short_role:"Foreign",domain:"DIPLOMACY"},finance:{short:"MoF",name:"Ministry of Finance",short_role:"Finance",domain:"TREASURY"},defense:{short:"MoD",name:"Ministry of Defense",short_role:"Defense",domain:"MILITARY"},justice:{short:"MoJ",name:"Ministry of Justice",short_role:"Justice",domain:"JUSTICE"},education:{short:"MoE",name:"Ministry of Education",short_role:"Education",domain:"EDUCATION"},healthcare:{short:"MoH",name:"Ministry of Health",short_role:"Health",domain:"HEALTH"},labor:{short:"MoL",name:"Ministry of Labor",short_role:"Labor",domain:"LABOR"},energy:{short:"MoEn",name:"Ministry of Energy",short_role:"Energy",domain:"ENERGY"},agriculture:{short:"MoAg",name:"Ministry of Agriculture",short_role:"Agriculture",domain:"AGRICULTURE"},transport:{short:"MoT",name:"Ministry of Transport",short_role:"Transport",domain:"INFRASTRUCTURE"},trade:{short:"MoTr",name:"Ministry of Trade",short_role:"Trade",domain:"TRADE"},environment:{short:"MoEv",name:"Ministry of Environment",short_role:"Environment",domain:"ENVIRONMENT"},sports:{short:"MoS",name:"Ministry of Sports",short_role:"Sports",domain:"SPORTS"}};function Va(a){return Ga[a]||{short:(a||"?").slice(0,3).toUpperCase(),name:"Ministry",short_role:a||"Minister",domain:(a||"").toUpperCase()}}function Ya(a){return a?.id?(ft||[]).filter(t=>t.party_id===a.id&&t.ministry_key!=="prime_minister"):[]}function Xe(a,t){const e=g?.nation,o=`${t?.leader_first_name||""} ${t?.leader_last_name||""}`.trim(),r=t?.leader_age??null;if(a==="prime_minister")return{roleId:"ministry:prime_minister",chip:"PM",roleLabel:"PRIME MINISTER",fullTitle:e?.head_of_government_title||"Prime Minister",shortRole:"Prime Minister",domain:(e?.head_of_government_title||"Prime Minister").toUpperCase(),personFirst:t?.leader_first_name||"",personLast:t?.leader_last_name||"",personName:o||"Prime Minister",personAge:r,actions:Gt.prime_minister||[]};if(a==="president")return{roleId:"ministry:president",chip:"PR",roleLabel:"PRESIDENT",fullTitle:e?.head_of_state_title||"President",shortRole:"President",domain:(e?.head_of_state_title||"President").toUpperCase(),personFirst:t?.leader_first_name||"",personLast:t?.leader_last_name||"",personName:o||"President",personAge:r,actions:Gt.president||[]};const i=(ft||[]).find(d=>d.ministry_key===a),n=Va(a);return{roleId:`ministry:${a}`,chip:n.short,roleLabel:"MINISTER",fullTitle:n.name,shortRole:n.short_role,domain:n.domain,personFirst:i?.minister_first_name||"",personLast:i?.minister_last_name||"",personName:`${i?.minister_first_name||""} ${i?.minister_last_name||""}`.trim()||"Vacant",personAge:i?.minister_age??null,ministryId:i?.id||null,discretionaryBalance:Number(i?.discretionary_balance??0),actions:Gt[a]||[]}}function vt(a){const t=Number(a)||0;return t<=0?"$0":"$"+Math.round(t/1e6)}const at={id:"stateOwnedEnterprise",name:"State Owned Enterprise",desc:"Advocate for the creation of a State Owned Enterprise in this ministry.",cost:"$100K",costColor:"var(--text-dim)",tags:[]},Wa={id:"allocate_funds",name:"Allocate Funds",desc:"Distribute the Defense Ministry discretionary budget to a military branch. Funds move 1:1 into that branch faction’s treasury. Army only for now — Navy and Air Force are not yet established.",cost:"From budget",costColor:"#c8a832",tags:["MILITARY","COSTS BUDGET"]},Gt={prime_minister:[{id:"call_early_elections",name:"Call Early Elections",desc:"Dissolve the legislature. Government enters caretaker status; election fires after a short formation window. Momentum effect tiered by Gov. Approval.",cost:"$0",costColor:"var(--text-dim)",tags:["LEGISLATIVE","PM ONLY"]},{id:"resign_as_pm",name:"Resign as Prime Minister",desc:"Step down. Coalition enters caretaker status with a window to nominate a successor; otherwise a snap election fires. -3 Momentum, -0.05 Credibility, -3 Stability, 12-tick PM ban.",cost:"$0",costColor:"var(--text-dim)",tags:["GOVERNMENT","PM ONLY"]}],president:[],defense:[Wa,at],transportation:[at],finance:[{id:"debt_payment",name:"Debt Payment",desc:"Move cash from the Finance Ministry discretionary budget to the national debt. Reduces debt principal and future interest service. $2 transaction fee plus the principal you choose. 1 tick cooldown.",cost:"$2 + payment",costColor:"#c8a832",tags:["FINANCE","COSTS BUDGET"]},at],energy:[{id:"national_energy_survey",name:"National Energy Survey",desc:"Commission a national energy resource survey. Roll 1d100 + ((100 − Energy) × 0.5): ≤45 finds nothing; 46-90 modest (+3-8); 91+ major (+5-16). Lower current Energy improves odds. Cost triples every use. 24-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["ENERGY","COSTS BUDGET"]},at],interior:[{id:"expand_infrastructure",name:"Expand Infrastructure",desc:"Post a public-works construction contract — Local Municipal Complex, Civic Center, or Provincial Infrastructure. Construction corps bid; the lowest qualified bid auto-wins. On completion your nation gains permanent stat boosts (Std of Living, GDP growth, Public Approval).",cost:"$2 – $12",costColor:"#5aafa5",tags:["INTERIOR","CONSTRUCTION"]},{id:"geological_survey_minerals",name:"Geological Survey — Minerals",desc:"Commission a national geological survey. Roll 1d100 + (Minerals × 0.5): ≤30 finds nothing; 31-60 small (+2-4); 61-85 moderate (+4-11); 86+ major (+4-18). Higher current Minerals improves odds. Cost doubles every use. 12-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["INTERIOR","COSTS BUDGET"]},{id:"agricultural_expansion",name:"Agricultural Expansion",desc:"Commission an agricultural expansion. Roll 1d100 + ((100 − Farmland) × 0.5): ≤30 nothing; 31-60 small (+2-4); 61-85 moderate (+4-11); 86+ major (+4-18, with -4-9 industry). Lower current Farmland improves odds. Cost doubles every use. 12-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["INTERIOR","COSTS BUDGET"]},at],healthcare:[at],justice:[at],education:[at],sports:[{id:"invest_in_sports_culture",name:"Invest in National Sports Culture",desc:"Fund local Vola leagues, training academies, and marketing campaigns. Pulls from the Sports Ministry discretionary budget; raises National Sports Culture immediately. 1 tick cooldown.",cost:"$2 – $8",costColor:"#c8a832",tags:["SPORTS","COSTS BUDGET"]},{id:"expand_stadium_infrastructure",name:"Expand Stadium Infrastructure",desc:"Post a stadium construction contract. Construction Corporations bid; you pick the winner. Once built, the stadium adds a permanent floor to National Sports Culture so decay can never bring you back to zero.",cost:"$3 – $10",costColor:"#c8a832",tags:["SPORTS","CONSTRUCTION"]},{id:"bid_to_host_vwc",name:"Bid to Host VWC",desc:"Submit your nation as a candidate to host the next available Vola World Cup. Multiple nations can bid; the highest score wins. Winner hosts the cycle, gains a treasury bump, Global Image, Public Approval, and home advantage in matches. Once per cup.",cost:"$10",costColor:"#c8a832",tags:["SPORTS","COSTS BUDGET"]}]};function Ka(a){const t=[],e=ve(a);e.isPM&&t.push("prime_minister"),e.isPresident&&kt(g?.nation)&&t.push("president");for(const o of Ya(a))t.push(o.ministry_key);return t}function Ja(a){const t=Ka(a);if(t.length===0)return"";const e=t.map(o=>{const r=Xe(o,a),i=V===r.roleId,n=(r.actions||[]).length;return`
            <div class="pa-leader-card pa-leader-card--ministry ${i?"active":""}"
                 data-role="${$(r.roleId)}"
                 style="${i?"border-left-color:#c8a832;":""}">
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:#c8a832;background:#c8a83215;border-color:#c8a83233;">${$(r.chip)}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:#c8a832;">${$(r.shortRole.toUpperCase())}</span>
                            ${n>0?`<span class="pa-leader-role-count">${n} action${n===1?"":"s"}</span>`:""}
                        </div>
                        <div class="pa-leader-name">${$(r.personName)}</div>
                    </div>
                </div>
            </div>
        `}).join("");return`
        <div class="pa-cabinet-header">
            <span class="pa-cabinet-header__title">Cabinet Ministries</span>
            <span class="pa-cabinet-header__count">${t.length} held</span>
        </div>
        ${e}
    `}function Xa(a,t,e){const o=g?.nation;if(a==="stateOwnedEnterprise")return"Coming soon — backend not yet wired.";if(a==="debt_payment"){if(Number(e?.discretionaryBalance??0)<3e6)return"Finance Ministry discretionary budget is below $3 — need at least $2 fee + $1 minimum payment.";if(Number(g?.nation?.debt??0)<=0)return"No national debt to pay down."}if(a==="allocate_funds"&&Number(e?.discretionaryBalance??0)<1e6)return"Defense Ministry discretionary budget is $0 — pass a funding bill first.";if(a==="invest_in_sports_culture"&&Number(e?.discretionaryBalance??0)<2e6)return"Sports Ministry discretionary budget is below $2M — pass a funding bill first.";if(a==="expand_infrastructure"&&Number(e?.discretionaryBalance??0)<2e6)return"Interior Ministry discretionary budget is below $2 — pass a funding bill first.";if(a==="call_early_elections"||a==="resign_as_pm"){if(K(o))return a==="call_early_elections"?"Elections are not held under absolute monarchy.":"PM serves at the Monarch’s pleasure; only the Monarch can replace them.";if(o?.__coalition_status==="caretaker")return"Government already in caretaker mode."}return""}function Qa(a,t){const e=V.startsWith("ministry:")?V.slice(9):null;if(!e)return"";const o=Xe(e,a),r=o.personAge!=null?`, Age ${o.personAge}`:"",i=e!=="prime_minister"&&e!=="president"&&o.ministryId,n=(o.actions||[]).map(d=>{const c=Xa(d.id,a,o),v=!!c,p=d.cost||"",s=(d.tags||[]).map(l=>`<span class="pa-action-tag" style="color:${Et[l]||"var(--text-dim)"};">${$(l)}</span>`).join("");return`
            <div class="pa-action-item ${v?"locked":""}" data-action-id="${$(d.id)}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(d.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${d.costColor||"var(--text-dim)"};">${$(p)}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${$(d.desc)}</div>
                ${v&&c?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>&#8856;</span><span>${$(c)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:#c8a832;background:#c8a83215;border-color:#c8a83233;">${$(o.chip)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:#c8a832;">${$(o.fullTitle.toUpperCase())}</span>
                        <span class="pa-detail-name">${$(o.personName)}</span>
                    </div>
                    <div class="pa-detail-meta">
                        ${$(o.shortRole)} &middot; ${$(a.faction_name)}${$(r)}
                        <span style="color:#c8a832;font-weight:700;"> &middot; ${$(o.domain)}</span>
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
            ${o.actions&&o.actions.length>0?n:`<div class="pa-vacant-msg"><div><div class="pa-vacant-title">${$(o.fullTitle)} — No actions yet</div><div class="pa-vacant-sub">Per-ministry actions land here as they ship.</div></div></div>`}
        </div>
    `}function ye(a,t,e){if(typeof V=="string"&&V.startsWith("ministry:"))return Qa(e);const o=K(g.nation),r=o&&g.nation?.monarch_faction_id===e?.id,i=Ge.find(m=>m.id===V);if(!i)return"";const n=V==="leader",d=V==="agitator",c=V==="campaign",v=V==="deputy";if(!n&&!d&&!c&&!v)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${$(i.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(d&&!rt)return`
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
        `;if(d&&j)return yo(i);if(v&&!F)return`
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
        `;if(v&&F)return eo(i);if(c)return mo(i,e);const s=X(e.leader_first_name,e.leader_last_name),l=e.leader_age?`, Age ${e.leader_age}`:"";e.seats,e.momentum;const h=(K(g.nation)&&g.nation?.monarch_faction_id===e.id?Ba:Ve).map(m=>{const x=m.tags.map(E=>`<span class="pa-action-tag" style="color:${Et[E]||"var(--text-dim)"};">${E}</span>`).join("");let b="",_=m.cost,M=m.costColor,w=m.locked;if(m.id==="no_confidence"){const E=K(g.nation),S=!!B&&B.pm_party_id===e.id;if(E)w=!0,m.lockReason="Parliament cannot remove the Monarch’s Prime Minister. Only the Monarch can dismiss the PM.";else if(S)w=!0,m.lockReason="Your party is the Prime Minister — file from another party.";else if(re)w=!0,m.lockReason="A motion of no confidence is already pending in Parliament.";else if(zt>0){w=!0;const L=zt;m.lockReason=`Cooldown: ${L} tick${L!==1?"s":""} remaining before another motion can be filed against this PM party.`}else!B||!B.pm_party_id?(w=!0,m.lockReason="No active Prime Minister to file against."):m.lockReason=""}else if(m.id==="form_coalition"){const E=g.nation,S=(E?.government_type||"").toLowerCase(),L=S.includes("absolute monarchy"),T=S.includes("presidential")&&!S.includes("semi"),P=Be(E),I=!L&&!T&&!P&&(S.includes("parliamentary")||E?.hos_election_method==="hereditary"),N=!!W,A=!!ot,q=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),Y=!e.seats||e.seats<=0;if(P)w=!0,m.lockReason="Coalition formation does not apply in semi-presidential systems — the President nominates the Prime Minister directly.";else if(!I)w=!0,m.lockReason="Coalition formation only applies to parliamentary systems.";else if(N&&A){const et=W?.formation_type==="emergency_minority";et&&q?m.lockReason="":(w=!0,m.lockReason=et?"A minority government is in place. Only its PM party can promote it to a coalition.":"A government is already in place.")}else N&&!A?(w=!0,m.lockReason=q?"A coalition exists but the Prime Minister is vacant — use Leadership Challenge instead.":"A coalition exists but the Prime Minister is vacant; only coalition members can claim it."):Y?(w=!0,m.lockReason="Your party has no parliamentary seats."):m.lockReason=""}else if(m.id==="form_minority_government")G.eligible?m.lockReason="":(w=!0,m.lockReason=G.lockReason||"Not currently available.");else if(m.id==="leadership_challenge"){const E=g.nation,S=(E?.government_type||"").toLowerCase(),L=S.includes("absolute monarchy"),T=S.includes("presidential")&&!S.includes("semi"),P=S.includes("semi-presidential")||S.includes("semi_presidential"),I=!L&&!T&&!P&&(S.includes("parliamentary")||E?.hos_election_method==="hereditary"),A=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),z=!ot,q=!!ot&&ot.faction_id===e.id,Y=!e.leader_first_name,et=!e.seats||e.seats<=0;I?q?(w=!0,m.lockReason="You are already the Prime Minister."):A?z?Y?(w=!0,m.lockReason="Your party has no leader to install."):et?(w=!0,m.lockReason="Your party has no parliamentary seats."):_t?(w=!0,m.lockReason="Challenge submitted — resolves next tick.",_="PENDING",M="var(--text-dim)"):m.lockReason="":(w=!0,m.lockReason="A Prime Minister is already serving."):(w=!0,m.lockReason="You must be in the governing coalition."):(w=!0,m.lockReason="Only available in parliamentary systems.")}else if(m.id==="leave_coalition"){const E=g.nation,S=Ht(E),T=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),P=!!ot&&ot.faction_id===e.id;S?W?!T||rt?(w=!0,m.lockReason="You are in opposition."):P?(w=!0,m.lockReason="Prime Minister’s party cannot leave — resign first."):m.lockReason="":(w=!0,m.lockReason="No active coalition to leave."):(w=!0,m.lockReason="Only available in parliamentary systems.")}else if(m.id==="disband_party"){const E=ve(e);E.isPM?(w=!0,m.lockReason="You are Prime Minister — resign before disbanding."):E.isPresident?(w=!0,m.lockReason="You are the sitting President — step down before disbanding."):E.isMonarchActing?(w=!0,m.lockReason="The reigning monarch cannot disband the royal house."):m.lockReason=""}else m.id==="fundraise"&&(_="ACTION",M="#c8a832",b=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Themed event · positions you with a voter bloc</span>
                ${$t>0?'<span style="color:var(--orange);">Used this tick</span>':""}
            </div>`,$t>=1&&(w=!0,b+='<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Already hosted a fundraiser this tick.</div>'));const k=m.id==="form_minority_government"&&G.metaLine?`<div class="pa-action-meta-minority" style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);font-weight:600;letter-spacing:0.3px;">${$(G.metaLine)}</div>`:"";return`
            <div class="pa-action-item ${w?"locked":""}" data-action-id="${m.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(m.name)}</span>
                        <div class="pa-action-tags">${x}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${M};">${_}</span>
                    </div>
                </div>
                ${k}
                <div class="pa-action-desc">${$(m.desc)}</div>
                ${b}
                ${w&&m.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${$(m.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${i.color};background:${i.color}15;border-color:${i.color}33;">${s}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${i.color};">${r?(g.nation?.monarch_title||"KING").toUpperCase():i.title}</span>
                        <span class="pa-detail-name">${$(a)}</span>
                        ${o&&g.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${$(g.nation.dynasty_name)}</span>`:""}
                        ${We(t)}
                    </div>
                    <div class="pa-detail-meta">${r?$((g.nation?.monarch_title||"King")+" of "+(g.nation?.name||"")):$(i.fullTitle)+" &middot; "+$(e.faction_name)}${l}${(()=>{if(r)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(g.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(o)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const m=B?.pm_party_id===e.id,x=g.nation?.hos_election_method==="elected"&&B?.president_party_id===e.id;return m?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':x?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':rt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
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
    `}const Za=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1},{id:"create_bloc",name:"Create Bloc",desc:"Found a pre-coalition alliance with other parties. Pick a name and invite any parties in your nation that aren't already in a bloc. Phase 1 is formation only — shared momentum, vote discipline, and coalition binding arrive in later phases.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["STRATEGIC","ALLIANCE"],locked:!1},{id:"leave_bloc",name:"Leave Bloc",desc:"Exit your current bloc. If you are the bloc leader, leaving dissolves the whole bloc and all pending invitations are withdrawn. Greyed out when you are not in a bloc.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"invite_to_bloc",name:"Invite Party to Bloc",desc:"Send a bloc invitation to an additional party. Leader-only. Eligible parties are in your nation, not already in a bloc, and not currently in government.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"impeach_president",name:"Impeach President",desc:"File articles of impeachment against the sitting President on charges of Abuse of Power, Gross Incompetence, or Constitutional Violation. Triggers a committee debate, then a floor vote requiring an absolute majority. If the motion passes, a 2/3 supermajority conviction vote follows. Presidential and Semi-Presidential systems only.",cost:"FREE",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1}],Ee=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function to(a,t){const e=a+t;return e>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:e>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:e>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function eo(a){const t=g.faction,e=t?.color||a.color,o=Za.map(i=>{const n=i.tags.map(v=>`<span class="pa-action-tag" style="color:${Et[v]||"var(--text-dim)"};">${v}</span>`).join("");let d=i.locked,c="";if(i.id==="create_bloc"){const v=ve(t);H?(d=!0,c=`Already in the ${H.name} bloc.`):v.isPM||v.isPresident||v.isMonarchActing?(d=!0,c="Head of Government cannot form blocs — you already lead the coalition."):(t.party_funds||0)<1e5&&(d=!0,c="Needs $100k party funds.")}else if(i.id==="leave_bloc")H?tt&&(c=`Leaving dissolves ${H.name} — all members will be removed.`):(d=!0,c="You are not in a bloc.");else if(i.id==="invite_to_bloc")H?tt||(d=!0,c="Only the bloc leader can send invitations."):(d=!0,c="You are not in a bloc.");else if(i.id==="impeach_president"){const p=(g.nation?.government_type||"").toLowerCase().includes("presidential"),s=Number(g.shard?.current_tick)||0,l=Number(g.nation?.impeachment_cooldown_until_tick)||0;p?st?st.faction_id===t.id?(d=!0,c="Your party holds the Presidency — you cannot impeach yourself."):(t.seats||0)<1?(d=!0,c="Need at least 1 seat in the legislature."):l>s&&(d=!0,c=`Impeachment cooldown: ${l-s} tick(s) remaining.`):(d=!0,c="No sitting President to impeach."):(d=!0,c="Presidential and Semi-Presidential systems only.")}return`
            <div class="pa-action-item ${d?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(i.name)}</span>
                        <div class="pa-action-tags">${n}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${i.costColor};">${i.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${$(i.desc)}</div>
                ${c?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${$(c)}</span></div>`:""}
            </div>
        `}).join(""),r=dt(F.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${X(F.first_name,F.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                        <span class="pa-detail-name">${$(F.first_name)} ${$(F.last_name)}</span>
                        ${We(e)}
                    </div>
                    <div class="pa-detail-meta">${$(a.fullTitle)} &middot; Age ${F.age} &middot; Skill: <span style="color:${r.color};font-weight:700;">${F.skill}</span></div>
                </div>
            </div>
        </div>
        ${Je(e)}
        ${Ke(e)}
        <div class="pa-actions-list" id="pa-actions-panel">${o}</div>
    `}function ao(a){const t=Fe(a),e=t.firstNames||[],o=t.lastNames||[];if(e.length===0||o.length===0)return[];const r=5+Math.floor(Math.random()*3),i=new Set,n=[];for(let d=0;d<r;d++){let c,v,p,s=0;do c=e[Math.floor(Math.random()*e.length)],v=o[Math.floor(Math.random()*o.length)],p=c+" "+v,s++;while(i.has(p)&&s<20);i.add(p);const l=20+Math.floor(Math.random()*66),y=28+Math.floor(Math.random()*30),u=Math.max(0,l-20)/65,f=Math.round((125e3+u*525e3)/25e3)*25e3;n.push({first_name:c,last_name:v,age:y,skill:l,hire_cost:f})}return n.sort((d,c)=>c.skill-d.skill)}async function Ce(a){const t=document.getElementById("pa-deputy-modal");if(!t)return;const e=g.nation?.name,o=ao(e);let r=null;function i(){const n=r!=null?o[r]:null,d=n?dt(n.skill):null,c=o.map((s,l)=>{const y=r===l,u=dt(s.skill);return`<div class="pa-hire-row ${y?"selected":""}" data-idx="${l}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${X(s.first_name,s.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${y?"var(--text-bright)":"var(--text-secondary)"};">${$(s.first_name)} ${$(s.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${s.skill}%;background:${u.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${u.color};">${s.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${s.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(s.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let v;n?v=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${X(n.first_name,n.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${$(n.first_name)} ${$(n.last_name)}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(g.faction?.party_funds||0)<n.hire_cost?' disabled title="Not enough funds"':""}>Hire ${$(n.first_name)}</button>
                </div>
            `:v=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                    <div style="flex:1;overflow-y:auto;">${v}</div>
                </div>
            </div>
        `;const p=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",p),t.onclick=s=>{s.target===t&&p()},document.getElementById("pa-dep-list")?.addEventListener("click",s=>{const l=s.target.closest(".pa-hire-row");l&&(r=parseInt(l.dataset.idx,10),i())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(r==null)return;const s=o[r],l=g.faction?.party_funds||0;if(l<s.hire_cost){alert("Not enough funds.");return}const y=document.getElementById("pa-dep-hire-confirm");y&&(y.disabled=!0,y.textContent="Hiring...");try{const u=l-s.hire_cost,f=g.shard?.current_tick||0,{data:h,error:m}=await C.from("faction_deputies").insert({faction_id:g.faction.id,first_name:s.first_name,last_name:s.last_name,age:s.age,skill:s.skill,status:"active",hired_at_tick:f}).select("*").single();if(m){alert("Failed: "+m.message);return}await C.from("factions").update({party_funds:u}).eq("id",g.faction.id),g.faction.party_funds=u,F=h,V="deputy",p(),O(a)}catch(u){console.error("[Deputy] Hire error:",u)}finally{y&&(y.disabled=!1)}})}t.classList.add("active"),i()}function oo(a){const t=document.getElementById("pa-rally-modal");if(!t||!F)return;const o=g.faction.party_funds||0;let r=null,i=null;function n(){const d=Ee.map((p,s)=>{const l=o>=p.cost,y=r===s;return`<div class="pa-action-item ${y?"selected":""} ${l?"":"locked"}" data-tier="${s}" style="cursor:${l?"pointer":"not-allowed"};${y?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${$(F.first_name)} ${$(F.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${F.skill}</span>
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

                    ${c}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${i?"Close":"Cancel"}</button>
                    ${i?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${r==null?"disabled":""}>Hold Rally</button>`}
                </div>
            </div>
        `;const v=()=>{t.classList.remove("active"),i&&O(a)};document.getElementById("rally-close")?.addEventListener("click",v),document.getElementById("rally-cancel")?.addEventListener("click",v),t.onclick=p=>{p.target===t&&v()},document.getElementById("rally-tiers")?.addEventListener("click",p=>{const s=p.target.closest("[data-tier]");!s||s.classList.contains("locked")||(r=parseInt(s.dataset.tier,10),n())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(r==null||i)return;const p=Ee[r],{data:s}=await C.from("factions").select("party_funds, momentum").eq("id",g.faction.id).single(),l=s?.party_funds||0;if(l<p.cost){alert("Not enough funds.");return}g.faction.party_funds=l,g.faction.momentum=s?.momentum??g.faction.momentum;const y=document.getElementById("rally-submit");y&&(y.disabled=!0,y.textContent="Rolling...");try{const u=1+Math.floor(Math.random()*6),f=to(u,p.bonus),h=l-p.cost,m=Math.max(1,(g.faction.momentum||0)+f.momentum);await C.from("factions").update({party_funds:h,momentum:m}).eq("id",g.faction.id);const x=g.shard?.current_tick||0;await C.from("campaign_actions").insert({party_id:g.faction.id,nation_id:g.nation?.id,action_type:"rally",ap_cost:0,money_cost:p.cost,tick_performed:x,result:{dieRoll:u,bonus:p.bonus,total:u+p.bonus,momentum:f.momentum,momentumDelta:f.momentum,label:f.label,outcomeName:f.label}}),g.faction.party_funds=h,g.faction.momentum=m,sessionStorage.removeItem("nationhood_state"),i={...f,dieRoll:u,bonus:p.bonus,total:u+p.bonus},n()}catch(u){console.error("[Rally] Error:",u),alert("Rally failed.")}})}t.classList.add("active"),n()}async function io(a,t){const e=document.getElementById("pa-vola-invest-modal");if(!e)return;const{data:o}=await C.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),r=Number(o?.discretionary_balance)||0;let i=!1,n=null;function d(){const v=["low","moderate","high"].map(l=>({key:l,cfg:ga[l]})).map(l=>{const y=r>=l.cfg.cost,u="$"+l.cfg.cost/1e6;return`<div class="pa-action-item ${!y||i?"locked":""}" data-tier="${l.key}" style="cursor:${y&&!i?"pointer":"not-allowed"};">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${l.cfg.label}</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">+${l.cfg.gain} National Sports Culture</span>
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
                    Sports Ministry's discretionary budget — <strong style="color:${r>0?"var(--green)":"var(--red)"};">${vt(r)}</strong> available.
                    Top it up via a funding article on a passed bill. 1 tick cooldown.
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="vola-tiers">${v}</div>
                    ${p}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="vola-cancel">${n?"Close":"Cancel"}</button>
                </div>
            </div>
        `;const s=()=>{e.classList.remove("active"),n&&O(a)};document.getElementById("vola-close")?.addEventListener("click",s),document.getElementById("vola-cancel")?.addEventListener("click",s),e.onclick=l=>{l.target===e&&s()},document.getElementById("vola-tiers")?.addEventListener("click",async l=>{const y=l.target.closest("[data-tier]");if(!y||y.classList.contains("locked")||i||n)return;const u=y.dataset.tier;i=!0,d();try{const{data:f}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),h=Number(f?.current_tick)||0,m=await ba(C,g.nation,t.id,u,h);m?.success?n=m:alert("Could not invest: "+(m?.reason||"unknown error"))}catch(f){alert("Investment failed: "+(f?.message||f))}finally{i=!1,d()}})}e.classList.add("active"),d()}async function no(a,t){const e=document.getElementById("pa-debt-payment-modal");if(!e)return;const o=_=>Math.floor((Number(_)||0)/1e6),r=2;let i="";const[n,d]=await Promise.all([C.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","finance").eq("is_active",!0).maybeSingle(),C.from("nations").select("debt").eq("id",g.nation.id).maybeSingle()]);(n.error||d.error)&&(i=(n.error||d.error).message||"Could not load ministry / nation data.");const c=o(n.data?.discretionary_balance),v=o(d.data?.debt),p=Math.max(0,c-r);let s=!1,l=null,y="",u=i;function f(){const _=parseInt(y,10);return Number.isFinite(_)?_:null}function h(){const _=f();return _!=null&&_>=1&&_<=p}function m(){const _=f(),M=_!=null&&_>=1?_+r:null,w=M!=null?c-M:c,k=_!=null&&_>=1?Math.max(0,v-_):v,E=h(),S=l?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Payment applied</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    $${l.payment} paid against debt · $${l.fee} transaction fee<br>
                    Discretionary: <strong>$${o(l.newBalance)}</strong> · Debt: <strong>$${o(l.newDebt)}</strong>
                </div>
            </div>
        `:"",L=u?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:6px;">${$(u)}</div>`:"";e.innerHTML=`
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
                    $${r} transaction fee + the principal you choose. 1 tick cooldown.
                </div>
                <div class="pa-modal-body" style="gap:10px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">DISCRETIONARY</div>
                            <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${c>0?"var(--green)":"var(--red)"};">$${c}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">NATIONAL DEBT</div>
                            <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright);">$${v}</div>
                        </div>
                    </div>

                    <div class="pa-modal-step-label">Payment Amount (whole dollars, 1 – ${p})</div>
                    <input id="pa-dp-input" class="pa-modal-input" type="number" min="1" max="${p}" step="1" placeholder="0" value="${$(y)}" ${l||s?"disabled":""} style="font-family:var(--font-mono);font-size:14px;">

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:4px;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">AFTER · DISCRETIONARY</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${w>=0?"var(--text-bright)":"var(--red)"};">$${w}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">AFTER · DEBT</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">$${k}</div>
                        </div>
                    </div>
                    ${L}
                    ${S}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-dp-cancel">${l?"Close":"Cancel"}</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dp-pay" ${!E||s||l||i?"disabled":""}>${s?"Paying…":"Pay"}</button>
                </div>
            </div>
        `;const T=()=>{e.classList.remove("active"),l&&O(a)};document.getElementById("pa-dp-close")?.addEventListener("click",T),document.getElementById("pa-dp-cancel")?.addEventListener("click",T),e.onclick=I=>{I.target===e&&T()};const P=document.getElementById("pa-dp-input");P&&(P.addEventListener("input",I=>{y=(I.target.value||"").replace(/[^0-9]/g,""),u=i,m();const N=document.getElementById("pa-dp-input");N&&(N.focus(),N.setSelectionRange(N.value.length,N.value.length))}),P.addEventListener("keydown",I=>{I.key==="Enter"&&h()&&!s&&!l&&!i&&(I.preventDefault(),x())})),document.getElementById("pa-dp-pay")?.addEventListener("click",x)}async function x(){if(s||l||i)return;const _=f();if(!h()){u=`Enter an integer between 1 and ${p}.`,m();return}s=!0,u="",m();try{const{data:M,error:w}=await C.rpc("pay_down_national_debt",{p_payment:_});w?u=w.message||"Payment failed.":M?.success?l=M:u=b(M?.reason)||"Payment failed."}catch(M){u=M?.message||"Network error."}finally{s=!1,m()}}function b(_){switch(_){case"invalid_payment":return"Enter an integer of at least $1.";case"not_minister":return"Only the Finance Minister can fire this action.";case"no_shard":return"Shard not initialized.";case"cooldown":return"Already used this tick. Try again next tick.";case"insufficient_balance":return"Not enough discretionary budget for fee + payment.";case"no_debt":return"There is no national debt to pay down.";default:return _||""}}e.classList.add("active"),m()}async function ro(a){const t=document.getElementById("pa-allocate-funds-modal");if(!t)return;const e=w=>Math.floor((Number(w)||0)/1e6),o=g?.nation?.name||"the Nation";let r="";const[i,n]=await Promise.all([C.from("ministries").select("discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","defense").eq("is_active",!0).maybeSingle(),C.from("factions").select("party_funds").eq("nation_id",g.nation.id).eq("faction_type","military").eq("branch","army").is("abandoned_at",null).or("is_banned.is.null,is_banned.eq.false").order("created_at",{ascending:!0}).limit(1).maybeSingle()]);i.error&&(r=i.error.message||"Could not load ministry data."),n.error&&n.error.code!=="PGRST116"&&(r=r||n.error.message||"Could not load army faction.");const d=e(i.data?.discretionary_balance),c=n.data||null,v=!!c,p=e(c?.party_funds),s=Math.max(0,d);let l=!1,y=null,u="",f=r;function h(){const w=parseInt(u,10);return Number.isFinite(w)?w:null}function m(){const w=h();return v&&w!=null&&w>=1&&w<=s}function x(w,k){return`
            <div style="border:1px solid var(--border-main);padding:10px 12px;${k.enabled?"":"opacity:0.45;"}">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);letter-spacing:0.04em;">${$(w)}</div>
                ${k.note?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">${$(k.note)}</div>`:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
                        <div><div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.06em;">CURRENT BRIGADES</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);">${k.brigades}</div></div>
                        <div><div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.06em;">CURRENT BUDGET</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">$${k.budget}</div></div>
                    </div>`}
            </div>`}function b(){const w=h(),k=m(),E=w!=null&&w>=1?d-w:d,S=w!=null&&w>=1?p+w:p,L=y?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Funds allocated</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    $${y.allocated} → Army of ${$(o)}<br>
                    Discretionary: <strong>$${e(y.newBalance)}</strong> · Army budget: <strong>$${e(y.newArmyFunds)}</strong>
                </div>
            </div>`:"",T=f?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:6px;">${$(f)}</div>`:"";t.innerHTML=`
            <div class="pa-modal" style="width:500px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Allocate Funds</span>
                    </div>
                    <button class="pa-modal-close" id="pa-af-close">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    Distribute the Defense Ministry's discretionary budget to a military branch. Funds move 1:1 into that branch's treasury.
                </div>
                <div class="pa-modal-body" style="gap:10px;">
                    <div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">YOUR MINISTRY'S DISCRETIONARY FUNDS</div>
                        <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${d>0?"var(--green)":"var(--red)"};">$${d}</div>
                    </div>

                    ${x(`Army of ${o}`,v?{enabled:!0,brigades:0,budget:p}:{enabled:!1,note:"No army established."})}

                    ${v?`
                        <div class="pa-modal-step-label">Allocate to Army (whole dollars, 1 – ${s})</div>
                        <input id="pa-af-input" class="pa-modal-input" type="number" min="1" max="${s}" step="1" placeholder="0" value="${$(u)}" ${y||l?"disabled":""} style="font-family:var(--font-mono);font-size:14px;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:4px;">
                            <div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">AFTER · DISCRETIONARY</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${E>=0?"var(--text-bright)":"var(--red)"};">$${E}</div></div>
                            <div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">AFTER · ARMY BUDGET</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">$${S}</div></div>
                        </div>
                    `:""}

                    ${x(`Navy of ${o}`,{enabled:!1,note:"Not yet established."})}
                    ${x(`Air Force of ${o}`,{enabled:!1,note:"Not yet established."})}
                    ${T}
                    ${L}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-af-cancel">${y?"Close":"Cancel"}</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-af-submit" ${!k||l||y||r?"disabled":""}>${l?"Allocating…":"Allocate"}</button>
                </div>
            </div>
        `;const P=()=>{t.classList.remove("active"),y&&O(a)};document.getElementById("pa-af-close")?.addEventListener("click",P),document.getElementById("pa-af-cancel")?.addEventListener("click",P),t.onclick=N=>{N.target===t&&P()};const I=document.getElementById("pa-af-input");I&&(I.addEventListener("input",N=>{u=(N.target.value||"").replace(/[^0-9]/g,""),f=r,b();const A=document.getElementById("pa-af-input");A&&(A.focus(),A.setSelectionRange(A.value.length,A.value.length))}),I.addEventListener("keydown",N=>{N.key==="Enter"&&m()&&!l&&!y&&!r&&(N.preventDefault(),_())})),document.getElementById("pa-af-submit")?.addEventListener("click",_)}async function _(){if(l||y||r)return;if(!m()){f=`Enter an integer between 1 and ${s}.`,b();return}const w=h();l=!0,f="",b();try{const{data:k,error:E}=await C.rpc("allocate_defense_funds",{p_branch:"army",p_amount:w});E?f=E.message||"Allocation failed.":k?.success?y=k:f=M(k?.reason)||"Allocation failed."}catch(k){f=k?.message||"Network error."}finally{l=!1,b()}}function M(w){switch(w){case"not_authenticated":return"You are not signed in.";case"branch_unavailable":return"Only the Army can receive funds right now.";case"invalid_amount":return"Enter an integer of at least $1.";case"not_minister":return"Only the Minister of Defense can allocate funds.";case"insufficient_funds":return"Not enough discretionary budget for that allocation.";case"no_army_faction":return"No army has been established for this nation yet.";default:return w||""}}t.classList.add("active"),b()}async function so(a,t){const e=document.getElementById("pa-vola-stadium-modal");if(!e)return;let o="",r="",i=null,n=!1,d=null,c=[],v=null;async function p(){const{data:y}=await C.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),u=Number(y?.discretionary_balance)||0,{data:f}=await C.from("corp_contracts").select("id, name, description, spec_category, expires_at_tick, created_at_tick").eq("issuer_nation_id",g.nation.id).eq("project_subtype","Vola Stadium").eq("status","open").order("created_at_tick",{ascending:!1}).limit(1).maybeSingle();if(d=f||null,c=[],d){const{data:h}=await C.from("corp_contract_bids").select("id, faction_id, bid_amount, quoted_timeline_months, status, created_at_tick, factions:faction_id(id, faction_name, nation_id, nations:nation_id(name))").eq("contract_id",d.id).eq("status","pending").order("created_at_tick",{ascending:!0});c=h||[]}return{balance:u,hasMinister:!!y,isMinister:y?.party_id===t.id}}async function s(){const{balance:y,hasMinister:u,isMinister:f}=await p(),h=["small","modest","extravagant"].map(k=>({key:k,cfg:xa[k]})),m=y>0?"var(--green)":"var(--red)";let x="";if(d){const k=d.spec_category==="Light Infrastructure"?2:d.spec_category==="Heavy Infrastructure"?4:d.spec_category==="Megaproject"?9:0,E=(d.description||"").replace(/^Home of:\s*/i,"").trim();if(x+=`
                <div class="pa-modal-step-label">Open Stadium Contract</div>
                <div class="pa-action-item" style="cursor:default;">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${$(d.name)}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">Floor +${k}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        ${E?"Home of "+$(E)+" · ":""}${$(d.spec_category)}
                    </div>
                </div>
            `,x+=`<div class="pa-modal-step-label" style="margin-top:14px;">Submitted Stadium Bids ${c.length?"· "+c.length:""}</div>`,c.length===0)x+='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;text-align:center;">Awaiting corporate bids…</div>';else{const S=L=>{if(L==null)return"—";const T=["January","February","March","April","May","June","July","August","September","October","November","December"],P=2e3+Math.floor(L/12);return`${T[L%12]}, ${P}`};x+=c.map(L=>{const T=L.factions?.faction_name||"Unknown Corp",P=L.factions?.nations?.name||"—",I=Number(L.bid_amount||0),N=I>=1e9?"$"+(I/1e9).toFixed(2)+"B":I>=1e6?"$"+(I/1e6).toFixed(1)+"M":"$"+Math.round(I).toLocaleString(),A=Number(L.quoted_timeline_months||0),z=Number(L.created_at_tick||0)+A;return`<div class="pa-action-item" style="cursor:default;" data-bid-id="${$(L.id)}">
                        <div class="pa-action-top">
                            <div>
                                <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${$(T)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                                    HQ ${$(P)} · Price ${N} · Timeline ${A} ticks · Finished ${S(z)}
                                </div>
                            </div>
                            <div style="display:flex;gap:6px;">
                                <button class="pa-modal-btn pa-modal-btn--submit" data-action="accept" data-bid-id="${$(L.id)}" ${n?"disabled":""} style="padding:4px 10px;font-size:9px;background:#5cc55c;border-color:#5cc55c;">Accept</button>
                                <button class="pa-modal-btn pa-modal-btn--cancel" data-action="reject" data-bid-id="${$(L.id)}" ${n?"disabled":""} style="padding:4px 10px;font-size:9px;">Reject</button>
                            </div>
                        </div>
                    </div>`}).join("")}}else{const k=h.map(E=>{const S=y>=E.cfg.postingCost,L=i===E.key,T="$"+E.cfg.postingCost/1e6,P="$"+E.cfg.budgetTarget/1e6+"M";return`<div class="pa-action-item ${!S||n?"locked":""} ${L?"selected":""}" data-size="${E.key}" style="cursor:${S&&!n?"pointer":"not-allowed"};${L?"border-color:#c8a832;background:rgba(200,168,50,0.06);":""}">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:${L?"#c8a832":"var(--text-bright)"};">${E.cfg.label}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">Floor +${E.cfg.floorContribution}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        Discretionary ${T} · Contract budget ${P} · Timeline ~${E.cfg.timelineMonths} ticks · ${E.cfg.crewsRequired} crew${E.cfg.crewsRequired===1?"":"s"} required
                    </div>
                    ${S?"":`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);margin-top:4px;">Insufficient discretionary — need ${T}</div>`}
                </div>`}).join("");x=`
                <div class="pa-modal-step-label">Stadium Name</div>
                <input id="vola-stadium-name" type="text" maxlength="60"
                       placeholder="e.g. Coastal Vola Park"
                       value="${$(o)}"
                       style="width:100%;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:12px;">

                <div class="pa-modal-step-label" style="margin-top:14px;">Home Of</div>
                <input id="vola-stadium-team" type="text" maxlength="60"
                       placeholder="e.g. F.C. Drevlak / Sporting San Maria / Real Avelia"
                       value="${$(r)}"
                       style="width:100%;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:12px;">

                <div class="pa-modal-step-label" style="margin-top:14px;">Choose Stadium Size</div>
                <div id="vola-stadium-tiers">${k}</div>

                ${v?`<div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${$(v)}</div>`:""}
            `}const b=d?`<button class="pa-modal-btn pa-modal-btn--cancel" id="vola-stadium-cancel-bid" ${n?"disabled":""}>Cancel Bid</button>
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
                    ${u&&f?`Posting cost pulls from the Sports Ministry's discretionary budget — <strong style="color:${m};">${vt(y)}</strong> available. Top it up via a funding article on a passed bill.`:'<span style="color:var(--red);">You are no longer the active Sports Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${x}
                </div>
                <div class="pa-modal-footer">${b}</div>
            </div>
        `;const _=()=>e.classList.remove("active");document.getElementById("vola-stadium-x")?.addEventListener("click",_),document.getElementById("vola-stadium-close")?.addEventListener("click",_),e.onclick=k=>{k.target===e&&_()};const M=document.getElementById("vola-stadium-name"),w=document.getElementById("vola-stadium-team");M?.addEventListener("input",k=>{o=k.target.value,document.getElementById("vola-stadium-post").disabled=!o.trim()||!i||n}),w?.addEventListener("input",k=>{r=k.target.value}),document.getElementById("vola-stadium-tiers")?.addEventListener("click",k=>{const E=k.target.closest("[data-size]");!E||E.classList.contains("locked")||n||(i=E.dataset.size,s())}),document.getElementById("vola-stadium-post")?.addEventListener("click",async()=>{if(!(n||!i||!o.trim())){n=!0,v=null,s();try{const{data:k}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),E=Number(k?.current_tick)||0,S=await ha(C,g.nation,t.id,{stadiumName:o.trim(),teamName:r.trim(),size:i},E);S?.success?(i=null,o="",r="",await s()):v=l(S?.reason)||"Could not post: "+(S?.reason||"unknown error")}catch(k){v="Posting failed: "+(k?.message||k)}finally{n=!1,s()}}}),document.querySelectorAll("[data-action]").forEach(k=>{k.addEventListener("click",async E=>{if(n)return;const S=k.dataset.action,L=k.dataset.bidId;if(L){n=!0,s();try{if(S==="accept"){const{data:T,error:P}=await C.rpc("award_stadium_bid_to_corp",{p_bid_id:L});if(P)throw P;if(!T?.success)throw new Error(T?.error||"Award failed")}else if(S==="reject"){const{data:T,error:P}=await C.rpc("reject_stadium_bid",{p_bid_id:L});if(P)throw P;if(!T?.success)throw new Error(T?.error||"Reject failed")}}catch(T){alert("Action failed: "+(T?.message||T))}finally{n=!1,s()}}})}),document.getElementById("vola-stadium-cancel-bid")?.addEventListener("click",async()=>{if(!(n||!d)&&confirm(`Cancel this stadium contract?

Discretionary cost will be refunded.`)){n=!0,s();try{const{data:k,error:E}=await C.rpc("cancel_stadium_contract",{p_contract_id:d.id});if(E)throw E;if(!k?.success)throw new Error(k?.error||"Cancel failed");d=null,c=[]}catch(k){alert("Cancel failed: "+(k?.message||k))}finally{n=!1,s()}}})}function l(y){return{no_minister:"No active Sports Minister.",not_minister:"Only the Sports Minister can post stadium contracts.",insufficient_balance:"Sports discretionary budget is below the tier cost — pass a funding bill first.",already_open:"A stadium contract is already open. Wait for it to resolve, or cancel it first.",no_stadium_name:"Stadium name is required.",invalid_size:"Pick a stadium size first.",insert_failed:"Could not post the contract. Try again in a moment."}[y]}e.classList.add("active"),await s()}async function lo(a,t){const e=document.getElementById("pa-expand-infra-modal");if(!e)return;let o=null,r=null,i=!1,n=null,d=[],c=null;async function v(){const{data:s}=await C.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","interior").eq("is_active",!0).maybeSingle(),l=Number(s?.discretionary_balance)||0,{data:y}=await C.from("corp_contracts").select("id, name, description, spec_category, budget, timeline_months, status, expires_at_tick, created_at_tick").eq("issuer_nation_id",g.nation.id).eq("project_subtype","Interior Infrastructure").in("status",["open","active"]).order("created_at_tick",{ascending:!1}).limit(1).maybeSingle();if(n=y||null,d=[],n&&n.status!=="active"){const{data:u}=await C.from("corp_contract_bids").select("id, faction_id, bid_amount, quoted_timeline_months, status, created_at_tick, factions:faction_id(id, faction_name, nation_id, nations:nation_id(name))").eq("contract_id",n.id).eq("status","pending").order("bid_amount",{ascending:!0});d=u||[]}if(!o){const{data:u,error:f}=await C.rpc("interior_infrastructure_tiers");f?(c="Could not load tier specs: "+f.message,o={}):o=u||{}}return{balance:l,isMinister:!!s&&s.party_id===t.id}}async function p(){const{balance:s,isMinister:l}=await v(),y=s>0?"var(--green)":"var(--red)",u=b=>"$"+(Number(b)/1e6).toFixed(Number(b)%1e6===0?0:1)+"M",f=n?.status==="active";let h="";if(n)h+=`
                <div class="pa-modal-step-label">${f?"Active Infrastructure Contract":"Open Infrastructure Contract"}</div>
                <div class="pa-action-item" style="cursor:default;">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${$(n.name)}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5aafa5;">${u(n.budget)}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        ${$(n.spec_category)} · Timeline ${n.timeline_months} ticks${f?"":` · Bidding closes tick ${n.expires_at_tick}`}
                    </div>
                </div>
            `,f?h+='<div style="margin-top:10px;padding:10px 12px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);background:rgba(90,175,165,0.06);border:1px solid rgba(90,175,165,0.2);">Construction is underway. Stat boosts apply on completion.</div>':(h+=`<div class="pa-modal-step-label" style="margin-top:14px;">Pending Bids ${d.length?"· "+d.length:""}</div>`,d.length===0?h+='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;text-align:center;">Awaiting construction corporation bids…</div>':h+=d.map(b=>{const _=b.factions?.faction_name||"Unknown Corp",M=b.factions?.nations?.name||"—",w=Number(b.bid_amount||0),k=w>=1e9?"$"+(w/1e9).toFixed(2)+"B":w>=1e6?"$"+(w/1e6).toFixed(1)+"M":"$"+Math.round(w).toLocaleString(),E=Number(b.quoted_timeline_months||0);return`<div class="pa-action-item" style="cursor:default;">
                            <div class="pa-action-top">
                                <div>
                                    <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${$(_)}</div>
                                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                                        HQ ${$(M)} · Bid ${k} · Timeline ${E} ticks
                                    </div>
                                </div>
                            </div>
                        </div>`}).join(""),h+='<div style="margin-top:10px;padding:8px 10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);">Auto-awarded to the best-scoring bid (cost, timeline, reputation) when the bid window closes.</div>');else{const b=["small","modest","extravagant"],_={small:"SMALL",modest:"MODEST",extravagant:"EXTRAVAGANT"};h=`
                <div class="pa-modal-step-label">Choose Tier</div>
                <div id="expand-infra-tiers">${b.map(w=>{const k=o?.[w];if(!k)return"";const E=Number(k.post_cost||0),S=Number(k.budget||0),L=s>=E,T=r===w,P=(k.stat_effects||[]).map(I=>{const N=Number(I.delta)>=0?"+":"",A=String(I.stat).replace(/_/g," ").replace(/\b\w/g,z=>z.toUpperCase());return`<span class="pa-action-tag" style="color:var(--green);">${N}${I.delta} ${A}</span>`}).join(" ");return`<div class="pa-action-item ${!L||i?"locked":""} ${T?"selected":""}" data-size="${w}" style="cursor:${L&&!i?"pointer":"not-allowed"};${T?"border-color:#5aafa5;background:rgba(90,175,165,0.06);":""}">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:${T?"#5aafa5":"var(--text-bright)"};">${$(k.name||_[w])}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5aafa5;">${_[w]}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        Post fee ${u(E)} · Contract budget ${u(S)} · Timeline ${k.timeline} ticks
                    </div>
                    ${P?`<div class="pa-action-tags" style="margin-top:4px;">${P}</div>`:""}
                    ${L?"":`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);margin-top:4px;">Insufficient discretionary — need ${u(E)}</div>`}
                </div>`}).join("")}</div>
                ${c?`<div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${$(c)}</div>`:""}
            `}const m=n?'<button class="pa-modal-btn" id="expand-infra-close" style="background:var(--bg-card);">Close</button>':`<button class="pa-modal-btn pa-modal-btn--cancel" id="expand-infra-close">Cancel</button>
               <button class="pa-modal-btn pa-modal-btn--submit" id="expand-infra-post" ${!r||i?"disabled":""} style="background:#5aafa5;">Post Infrastructure Contract</button>`;e.innerHTML=`
            <div class="pa-modal" style="width:560px;max-height:85vh;overflow-y:auto;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#5aafa5;"></div>
                        <span class="pa-modal-title">Expand Infrastructure</span>
                    </div>
                    <button class="pa-modal-close" id="expand-infra-x">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    ${l?`Post fee pulls from the Interior Ministry's discretionary budget — <strong style="color:${y};">${vt(s)}</strong> available. Construction corps bid; the best-scoring bid (cost, timeline, reputation) auto-wins when the bid window closes. Stat boosts apply on completion.`:'<span style="color:var(--red);">You are no longer the active Interior Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${h}
                </div>
                <div class="pa-modal-footer">${m}</div>
            </div>
        `;const x=()=>e.classList.remove("active");document.getElementById("expand-infra-x")?.addEventListener("click",x),document.getElementById("expand-infra-close")?.addEventListener("click",x),e.onclick=b=>{b.target===e&&x()},document.getElementById("expand-infra-tiers")?.addEventListener("click",b=>{const _=b.target.closest("[data-size]");!_||_.classList.contains("locked")||i||(r=_.dataset.size,p())}),document.getElementById("expand-infra-post")?.addEventListener("click",async()=>{if(!(i||!r)){i=!0,c=null,p();try{const{data:b,error:_}=await C.rpc("post_interior_infrastructure",{p_size:r});_?c=_.message||"Post failed":b?.success?r=null:c=b?.error||"Could not post contract"}catch(b){c="Posting failed: "+(b?.message||b)}finally{i=!1,p()}}})}e.classList.add("active"),await p()}const Ie=84,Me=24,co=12;function Vt(a){const t=a%100,e=a%10;return t>=11&&t<=13?a+"th":e===1?a+"st":e===2?a+"nd":e===3?a+"rd":a+"th"}function St(a){if(a==null)return"—";const t=["January","February","March","April","May","June","July","August","September","October","November","December"],e=2e3+Math.floor(a/12);return`${t[a%12]}, ${e}`}async function po(a,t){const e=document.getElementById("pa-vola-host-bid-modal");if(!e)return;let o=!1,r=null,i=null;const n=new Map;async function d(){const{data:p}=await C.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",g.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),{data:s}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),l=Number(s?.current_tick)||0,y=[];let u=0;for(;y.length<3&&u<200;){const f=u+1,h=Ie+Me*u,m=h-co;m>l&&y.push({cupNumber:f,cupStart:h,resolutionTick:m}),u++}if(y.length>0){const f=y.map(_=>_.cupNumber),[{data:h},{data:m}]=await Promise.all([C.from("vola_cup_hosts").select("cup_number, host_nation_id, nations:host_nation_id(name)").in("cup_number",f),C.from("vola_host_bids").select("cup_number, bid_at_tick").eq("nation_id",g.nation.id).in("cup_number",f)]),x=new Map((h||[]).map(_=>[_.cup_number,_])),b=new Map((m||[]).map(_=>[_.cup_number,_]));for(const _ of y){_.host=x.get(_.cupNumber)||null;const M=b.get(_.cupNumber),w=n.has(_.cupNumber);_.iBid=!!M||w,_.bidAtTick=M?.bid_at_tick??n.get(_.cupNumber)??null}for(const _ of y){const M=_.cupNumber>1?Ie+Me*(_.cupNumber-2):null,w=M===null||l>M;_.selectable=!_.host&&!_.iBid&&w}}return{balance:Number(p?.discretionary_balance)||0,isMinister:p?.party_id===t.id,cups:y}}async function c(){const{balance:p,isMinister:s,cups:l}=await d(),u=p>=1e7,f=l.length===0?'<div class="pa-empty-msg" style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">No upcoming Vola World Cups within the bid window.</div>':l.map(w=>{let k="",E="",S="",L="";if(w.host){const T=w.host.nations?.name||"Awarded";k=`<span class="pa-action-tag" style="color:var(--text-dim);">HOSTED — ${$(T.toUpperCase())}</span>`,S="locked",E="opacity:0.5;cursor:not-allowed;"}else if(w.iBid){k='<span class="pa-action-tag" style="color:#5cc55c;">YOUR BID PENDING</span>',S="locked",E="cursor:not-allowed;border-color:#5cc55c;background:rgba(92,197,92,0.06);";const T=w.bidAtTick!=null?`Bid placed on ${St(w.bidAtTick)} for $10`:"Bid placed earlier this session for $10";L=`<button class="pa-modal-btn pa-modal-btn--placed" disabled style="background:transparent;color:#5cc55c;border:1px solid #5cc55c;padding:4px 10px;font-size:9px;cursor:not-allowed;opacity:0.75;font-weight:600;letter-spacing:0.04em;">${$(T)}</button>`}else w.selectable&&s&&u?(k='<span class="pa-action-tag" style="color:#c8a832;">AVAILABLE</span>',E="cursor:pointer;border-color:#c8a832;background:rgba(200,168,50,0.06);",L=`<button class="pa-modal-btn pa-modal-btn--submit" data-cup-number="${w.cupNumber}" ${o?"disabled":""} style="background:#c8a832;padding:4px 10px;font-size:9px;">Submit Bid — $10</button>`):w.selectable&&!u?(k='<span class="pa-action-tag" style="color:var(--red);">INSUFFICIENT BUDGET</span>',S="locked",E="opacity:0.6;cursor:not-allowed;"):(k='<span class="pa-action-tag" style="color:var(--text-dim);">FUTURE CYCLE</span>',S="locked",E="opacity:0.5;cursor:not-allowed;");return`<div class="pa-action-item ${S}" data-cup-number="${w.cupNumber}" style="${E}">
                    <div class="pa-action-top">
                        <div>
                            <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${Vt(w.cupNumber)} World Vola Cup</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                                Begins ${St(w.cupStart)} · Bids resolve ${St(w.resolutionTick)}
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                            ${k}
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
        `:"",_=r?`
            <div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${$(r)}</div>
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
                    ${s?`Discretionary budget <strong style="color:${p>0?"var(--green)":"var(--red)"};">${vt(p)}</strong> available · cost <strong style="color:#c8a832;">$10</strong> per bid · once per cup.`:'<span style="color:var(--red);">You are no longer the active Sports Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${f}
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
        `;const M=()=>{e.classList.remove("active"),O(a)};document.getElementById("vola-host-x")?.addEventListener("click",M),document.getElementById("vola-host-close")?.addEventListener("click",M),e.onclick=w=>{w.target===e&&M()},e.querySelectorAll("[data-cup-number]").forEach(w=>{w.tagName==="BUTTON"&&w.addEventListener("click",async()=>{if(o||i)return;const k=Number(w.dataset.cupNumber);if(k&&confirm(`Submit a host bid for the ${Vt(k)} World Vola Cup?

$10 from discretionary budget.
Resolves at the qualifier tick (12 ticks before the cup begins).`)){o=!0,r=null,c();try{const E=await _a(C,k,g.nation.id);if(E?.success){i=E;const{data:S}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),L=Number(S?.current_tick)||Number(E.cupStartTick)-999;n.set(k,L)}else E?.reason==="already_bid"&&!n.has(k)&&n.set(k,null),r=v(E?.reason)||"Could not submit: "+(E?.reason||"unknown error")}catch(E){r="Bid failed: "+(E?.message||E)}finally{o=!1,c()}}})})}function v(p){return{invalid_cup:"Invalid cup selection.",invalid_nation:"Nation context unavailable. Reload and try again.",not_minister:"Only the Sports Minister can submit host bids.",insufficient_balance:"Sports discretionary budget is below $10M — pass a funding bill first.",no_shard:"Game state unavailable. Try again.",bidding_closed:"Bidding window has closed for this cup.",already_hosted:"This cup has already been awarded.",already_bid:"You have already bid for this cup.",cup_not_open_yet:"This cup’s bid window opens 1 tick after the previous cup begins."}[p]}e.classList.add("active"),await c()}const Qe=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],Se=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],se=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function mo(a,t){const e=Qe.map(o=>{const r=o.tags.map(i=>`<span class="pa-action-tag" style="color:${Et[i]||"var(--text-dim)"};">${i}</span>`).join("");return`
            <div class="pa-action-item ${o.locked?"locked":""}" data-action-id="${o.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(o.name)}</span>
                        <div class="pa-action-tags">${r}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${o.costColor};">${o.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${$(o.desc)}</div>
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">CM</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                    </div>
                    <div class="pa-detail-meta">${$(a.fullTitle)} &middot; ${$(t.faction_name)}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${e}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `}function fo(a){const t=document.getElementById("pa-modernize-modal");if(!t)return;const e=g.faction;let o=null,r=e.custom_logo_url||null,i=!1;function n(){const d=!!r,v=Number(e.party_funds??0)>=5e4,p=!!o&&v&&!i;t.innerHTML=`
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
                        ${r?`<img src="${$(r)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
                    </div>
                    <div style="text-align:center;">
                        <label style="display:inline-block;padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright);background:var(--bg-card);border:1px solid var(--border-mid);cursor:pointer;letter-spacing:0.06em;">
                            ${d?"CHANGE LOGO":"UPLOAD LOGO"}
                            <input type="file" accept="image/*" id="mod-file-input" style="display:none;">
                        </label>
                        ${e.custom_logo_url&&!o?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${o?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${v?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${p?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=s=>{s.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",s=>{const l=s.target.files?.[0];if(l){if(l.size>2*1024*1024){alert("Logo must be under 2MB.");return}o=l,r=URL.createObjectURL(l),n()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(i||!o)return;i=!0;const s=document.getElementById("mod-submit");s&&(s.disabled=!0,s.textContent="Uploading...");try{const l=o.name.split(".").pop()?.toLowerCase()||"png",y=`${e.id}/logo_${Date.now()}.${l}`,{error:u}=await C.storage.from("party-logos").upload(y,o,{cacheControl:"3600",upsert:!0,contentType:o.type});if(u)throw new Error("Upload failed: "+u.message);const{data:f}=C.storage.from("party-logos").getPublicUrl(y),h=f?.publicUrl;if(!h)throw new Error("Failed to get logo URL");const m=Math.max(0,Number(e.party_funds??0)-5e4),{error:x}=await C.from("factions").update({custom_logo_url:h,party_funds:m}).eq("id",e.id);if(x)throw x;e.custom_logo_url=h,e.party_funds=m,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),O(a)}catch(l){alert("Modernize failed: "+(l.message||"Error")),i=!1,s&&(s.disabled=!1,s.textContent="Modernize — $50k")}})}t.classList.add("active"),n()}function vo(a){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const e=g.faction;g.nation;const o=e.momentum??50;(g._allParties||[]).filter(l=>l.id!==e.id);const r={current:e.party_color||"#4a8aba"},i={current:0},n={current:e.custom_logo_url||null},d={current:null},c={current:!!e.custom_logo_url},v={current:!1};function p(){return r.current}function s(){const l=p(),y=Se.find(w=>w.hex===l)?.name||"Custom",u=se[i.current]?.emoji||"🏛️",f=c.current&&(n.current||d.current),h=n.current||(d.current?URL.createObjectURL(d.current):null),m=document.getElementById("rb-name")?.value??e.faction_name??"",x=document.getElementById("rb-abbr")?.value??e.abbreviation??"",b=document.getElementById("rb-desc")?.value??"",_=Se.map(w=>{const k=l===w.hex;return`<div class="rb-color-swatch ${k?"selected":""}" data-hex="${w.hex}" style="background:${w.hex};${k?`box-shadow:0 0 8px ${w.hex}44;border:2px solid var(--text-bright);`:""}">
                ${k?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),M=se.map((w,k)=>{const E=i.current===k;return`<div class="rb-logo-item ${E?"selected":""}" data-idx="${k}" style="${E?`background:${l}15;border:2px solid ${l};box-shadow:0 0 6px ${l}33;`:""}">
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
                            <input class="pa-modal-input" id="rb-name" value="${$(m)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${m.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${$(x)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${l};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${$(b)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${b.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${l};">${$(y)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${_}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${f?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${f?"opacity:0.3;":""}" id="rb-logos">${M}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${f?"solid var(--teal)":"dashed var(--border-mid)"};padding:10px 14px;background:${f?"rgba(90,170,138,0.04)":"var(--bg-card)"};">
                                ${f&&h?`
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
                        <div style="background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${l};padding:10px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <div style="width:40px;height:40px;background:${l}15;border:1.5px solid ${l};display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;">
                                    ${f&&h?`<img src="${h}" style="width:100%;height:100%;object-fit:contain;" alt="">`:u}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${$(m||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${l};letter-spacing:1px;">${$(x||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${$(b||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${l};background:${l}0a;border:1px solid ${l}25;">${$(x)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${l};background:${l}0a;border:1px solid ${l}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${l}08;border:1px solid ${l}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${l};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${l};">${$(y.toUpperCase())}</div>
                                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${l}</div>
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
                        ${v.current?'<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>':"This will change your party's identity across all UI, media, and diplomatic channels."}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${v.current?`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        `:`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=n.current,t._rbUseCustomLogo=c.current,s(),t.classList.add("active"),t.addEventListener("change",function(y){if(y.target.id==="rb-logo-file"){const u=y.target.files?.[0];if(!u)return;if(u.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(u.size/(1024*1024)).toFixed(1)+"MB"),y.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(u.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),y.target.value="";return}d.current=u,n.current=null,c.current=!0,t._rbCustomLogoFile=u,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,s()}}),t.addEventListener("click",function l(y){if(y.target===t||y.target.closest("#rb-close")||y.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",l);return}const u=y.target.closest(".rb-color-swatch");if(u){r.current=u.dataset.hex,s();return}const f=y.target.closest(".rb-logo-item");if(f){i.current=parseInt(f.dataset.idx)||0,c.current=!1,t._rbUseCustomLogo=!1,s();return}if(y.target.closest("#rb-remove-logo")){n.current=null,d.current=null,c.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,s();return}if(y.target.closest("#rb-submit")){const h=document.getElementById("rb-name")?.value?.trim()||"",m=document.getElementById("rb-abbr")?.value?.trim()||"";if(h.length<3||m.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}v.current=!0,s();return}if(y.target.closest("#rb-back")){v.current=!1,s();return}if(y.target.closest("#rb-confirm")){uo(t,a,l);return}})}async function uo(a,t,e){const o=g.faction,r=document.getElementById("rb-name")?.value?.trim()||"",i=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const n=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||o.party_color,d=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,c=d!=null?se[parseInt(d)]?.emoji:null,v=a._rbCustomLogoFile,p=a._rbUseCustomLogo,s=a._rbCustomLogoUrl,l=document.getElementById("rb-confirm");l&&(l.disabled=!0,l.textContent="Rebranding...");try{const y=g.shard?.current_tick||0;let u=s;if(p&&v){const b=v.name.split(".").pop()?.toLowerCase()||"png",_=`${o.id}/logo_${Date.now()}.${b}`,{data:M,error:w}=await C.storage.from("party-logos").upload(_,v,{cacheControl:"3600",upsert:!0,contentType:v.type});if(w){console.error("[Rebrand] Logo upload failed:",w.message),alert("Logo upload failed: "+w.message);return}const{data:k}=C.storage.from("party-logos").getPublicUrl(_);u=k?.publicUrl||null}else p||(u=null);const f=15e4,h=o.party_funds||0;if(h<f){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $150k.`);return}const m=h-f,x=Math.max(1,(o.momentum||0)-10);await C.from("factions").update({party_funds:m,momentum:x,faction_name:r,abbreviation:i.toUpperCase(),party_color:n,party_logo:p?null:c,custom_logo_url:u,rebrand_cooldown_until_tick:y+120}).eq("id",o.id),await C.from("campaign_actions").insert({party_id:o.id,nation_id:g.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:y,result:{oldName:o.faction_name,newName:r,oldAbbr:o.abbreviation,newAbbr:i,oldColor:o.party_color,newColor:n}}),o.party_funds=m,o.momentum=x,o.faction_name=r,o.abbreviation=i.toUpperCase(),o.party_color=n,o.party_logo=p?null:c,o.custom_logo_url=u,a.classList.remove("active"),a.removeEventListener("click",e),O(t)}catch(y){console.error("[PartyActions] Rebrand error:",y),alert("Failed to rebrand: "+(y.message||y))}finally{l&&(l.disabled=!1,l.textContent="⚠ Confirm Rebrand")}}const Ze=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1},{id:"petition_for_reform",name:"Petition for Reform",desc:"Organize a popular petition for political reform. Roll 1d100 + petition strength (education, professional/cultural/religious rapport, inequality, low SoL, crown authority). 0-40 ignored; 41-69 grants minor reform; 70+ forces major reform.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["POLITICAL","MONARCHY"],locked:!1,monarchyOnly:!0,cooldownTicks:6}];function yo(a){const t=j,e=X(t.first_name,t.last_name),o=dt(t.skill),r=rt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',i=K(g?.nation),n=Number(g?.shard?.current_tick)||0,d=g?.faction,v=Ze.filter(p=>!p.monarchyOnly||i).map(p=>{let s=null;if(p.id==="petition_for_reform"&&p.cooldownTicks){if(d?._petitionPending&&(s="A petition is already pending in this nation."),!s){const f=Number(d?.last_petition_for_reform_tick);if(Number.isFinite(f)&&f>0){const h=f+p.cooldownTicks;n<h&&(s=`Cooldown — ready at tick ${h}.`)}}const u=Number(d?.party_funds)||0;!s&&u<p.moneyCost&&(s="Insufficient party funds.")}const l=p.locked||!!s,y=p.tags.map(u=>`<span class="pa-action-tag" style="color:${Et[u]||"var(--text-dim)"};">${u}</span>`).join("");return`
            <div class="pa-action-item ${l?"locked":""}" data-action-id="${p.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(p.name)}</span>
                        <div class="pa-action-tags">${y}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${p.costColor};">${p.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${$(p.desc)}</div>
                ${s||p.locked&&p.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${$(s||p.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${e}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                        <span class="pa-detail-name">${$(t.first_name)} ${$(t.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${$(a.fullTitle)}, Age ${t.age}${r}</div>
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
        ${t.background?`<div style="padding:6px 16px;border:1px solid var(--border-main);border-top:none;border-bottom:none;background:var(--bg-panel);font-size:9px;color:var(--text-dim);font-style:italic;">${$(t.background)}</div>`:""}
        <div class="pa-actions-list">
            ${v}
        </div>
        ${go()}
        <div class="pa-skill-footer">
            <span style="color:${a.color};font-weight:700;">${a.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${o.color};font-weight:700;">${o.label}</span>: ${o.desc}
        </div>
    `}function go(){if(ne.length===0)return"";const a=g.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${ne.map(e=>{const o=Pt.find(m=>m.key===e.target_ministry),r=o?o.label:e.target_ministry,i=o?o.icon:"⚖️",n=me(e.corruption_growth||0),d=it[e.tier]||it[1],c=e.status==="active",v=Math.max(0,a-e.filed_at_tick),p=8,s=Math.min(1,v/p),l=Math.max(0,e.resolves_at_tick-a),y=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],u=y.map(m=>{const x=e.filed_at_tick+m.tick,b=a>=x,_=a>=x&&(m.tick===8||a<e.filed_at_tick+y[y.indexOf(m)+1]?.tick),M=m.tick/p*100;return`<div class="pa-ls-milestone ${b?"passed":""} ${_?"current":""}" style="left:${M}%;" title="${m.label} (Tick ${x})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${m.label}</div>
            </div>`}).join("");let f="";if(!c){const m=d===it[1]?"FRIVOLOUS":d===it[2]?"PARTIAL WIN":d===it[3]?"MAJOR WIN":"DEVASTATING",x=e.tier===1?"var(--red)":e.tier===2?"#ca5":e.tier===3?"#c84":"var(--green)";f=`<span class="pa-ls-tier-badge" style="color:${x};border-color:${x}44;background:${x}0a;">${m}</span>`}const h=c?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${e.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${e.momentum_effect>=0?"+":""}${e.momentum_effect} Mom</span>
                <span style="color:${e.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${e.gov_momentum_effect>=0?"+":""}${e.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${c?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${i}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${$(r)}</span>
                        <span class="pa-ls-tier-badge" style="color:${n.color};border-color:${n.color}44;background:${n.color}0a;">TIER ${e.tier}</span>
                        ${f}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${c?`${l} ticks left`:`Resolved tick ${e.resolves_at_tick}`}
                    </div>
                </div>
                ${c?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${s*100}%;"></div>
                        </div>
                        ${u}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${n.color};font-weight:700;">${(e.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${$(n.label)}
                </div>
                ${h}
            </div>
        `}).join("")}
        </div>
    `}let Yt=!1;async function bo(){if(Yt)return;const a=g.faction;if(!a)return;const t=Ze.find(e=>e.id==="petition_for_reform");if(t&&confirm(`File a Petition for Reform?

Cost: ${t.cost} (party funds)
${t.cooldownTicks}-tick cooldown after use.

The monarch has 3 ticks to respond. If they don't, the petition is accepted by default.`)){Yt=!0;try{const{data:e,error:o}=await C.rpc("petition_for_reform");if(o){alert("Petition failed: "+o.message);return}if(!e?.success){const i=e?.reason||"unknown error",n=e?.got_government_type?`

(government_type in DB: "${e.got_government_type}")`:"";alert("Could not file petition: "+i+n);return}a.party_funds=Math.max(0,(Number(a.party_funds)||0)-t.moneyCost),a.last_petition_for_reform_tick=Number(g?.shard?.current_tick)||0,a._petitionPending=!0,alert(`Petition filed. The nation now waits for the throne's response.

Track the petition in Government → Administrative → Pressing Issues.`);const r=document.getElementById("pa-actions-panel");r&&(r.innerHTML=ye(null,null,a)),window.dispatchEvent(new CustomEvent("petition:filed",{detail:{petitionId:e.petition_id}}))}catch(e){alert("Petition failed: "+(e?.message||e))}finally{Yt=!1}}}const Rt={geological_survey_minerals:{rpc:"geological_survey_minerals",nextCostRpc:"geological_survey_minerals_next_cost",cooldownRpc:"geological_survey_minerals_cooldown_until",ministryKey:"interior",ministryName:"Interior Ministry",actionLabel:"Geological Survey",actionNoun:"survey",costEscalation:"doubles",cooldownTicks:12,oddsHint:"Higher current Minerals improves your odds of a meaningful find.",primaryStat:"minerals",primaryStatLabel:"Minerals",bonusLabel:"minerals bonus",secondaryStat:null,secondaryStatLabel:null,bucketLabels:{none:"No Findings",small:"Small Find",moderate:"Moderate Find",major:"Major Discovery"},lockLineClass:"pa-gs-lock-line"},national_energy_survey:{rpc:"national_energy_survey",nextCostRpc:"national_energy_survey_next_cost",cooldownRpc:"national_energy_survey_cooldown_until",ministryKey:"energy",ministryName:"Energy Ministry",actionLabel:"National Energy Survey",actionNoun:"survey",costEscalation:"triples",cooldownTicks:24,oddsHint:"Lower current Energy improves your odds of a meaningful find.",primaryStat:"energy",primaryStatLabel:"Energy",bonusLabel:"energy headroom bonus",secondaryStat:null,secondaryStatLabel:null,bucketLabels:{none:"No Findings",modest:"Workable Opportunity",major:"Transformative Discovery"},lockLineClass:"pa-es-lock-line"},agricultural_expansion:{rpc:"agricultural_expansion",nextCostRpc:"agricultural_expansion_next_cost",cooldownRpc:"agricultural_expansion_cooldown_until",ministryKey:"interior",ministryName:"Interior Ministry",actionLabel:"Agricultural Expansion",actionNoun:"expansion",costEscalation:"doubles",cooldownTicks:12,oddsHint:"Lower current Farmland improves your odds. A Major result also displaces industry.",primaryStat:"farmland",primaryStatLabel:"Farmland",bonusLabel:"land-use bonus",secondaryStat:"industry",secondaryStatLabel:"Industry",bucketLabels:{none:"No Viable Zones",small:"Modest Reclamation",moderate:"Regional Reclamation Program",major:"Sweeping Land-Use Reform"},lockLineClass:"pa-ae-lock-line"}};function xo(a){return/^[aeiou]/i.test(a)?"an":"a"}async function ho(a,t){if(jt.has(a)||!t)return;const e=Rt[a];if(!e)return;const o=document.querySelector(`.pa-action-item[data-action-id="${a}"] .pa-action-cost`)?.textContent?.trim()||"",r=/^\$\d/.test(o)?`Cost: ${o} (charged from ${e.ministryName} discretionary budget).
`:`Cost is charged from ${e.ministryName} discretionary budget.
`;if(confirm(`Commission ${xo(e.actionLabel)} ${e.actionLabel}?

`+r+`Cost ${e.costEscalation} every use. ${e.cooldownTicks}-tick cooldown after firing.

`+e.oddsHint)){jt.add(a);try{const{data:i,error:n}=await C.rpc(e.rpc);if(n){alert(`${e.actionLabel} failed: ${n.message}`);return}if(!i?.success){const m=i?.reason||"unknown error";let x="";i?.reason==="insufficient_balance"&&i?.cost?x=`

(needed $${Math.round(Number(i.cost)/1e6)}, have $${Math.round(Number(i.balance)/1e6)})`:i?.reason==="cooldown"&&i?.ready_at_tick&&(x=`

Next ${e.actionNoun} ready at tick ${i.ready_at_tick}.`),alert(`Could not run ${e.actionNoun}: ${m}${x}`),ea(a);return}const d=e.bucketLabels[i.bucket]||i.bucket,c=(Number(i.total)-Number(i.d100)).toFixed(1),v=i[`${e.primaryStat}_before`],p=i[`${e.primaryStat}_after`],s=Number(p)-Number(v),l=`${e.primaryStatLabel}: ${v} → ${p}`+(s>0?" (+"+s+")":"");let y="";if(e.secondaryStat){const m=Number(i[`${e.secondaryStat}_delta`]||0);m>0&&(y=`
`+e.secondaryStatLabel+": "+i[`${e.secondaryStat}_before`]+" → "+i[`${e.secondaryStat}_after`]+" (-"+m+")")}alert(e.actionLabel+" — "+d+`

Roll: `+i.d100+" + "+c+" ("+e.bonusLabel+") = "+i.total+`
`+l+y+`

`+(i.description||"")),g?.nation&&(g.nation[e.primaryStat]=Number(p),e.secondaryStat&&(g.nation[e.secondaryStat]=Number(i[`${e.secondaryStat}_after`])));const u=(ft||[]).find(m=>m.ministry_key===e.ministryKey);if(u){const m=Number(i.cost_paid)||0;u.discretionary_balance=Math.max(0,Number(u.discretionary_balance||0)-m)}const f=document.getElementById("pa-actions-panel");f&&(f.innerHTML=ye(null,null,t));const h=document.querySelector(`.pa-action-item[data-action-id="${a}"]`);h&&ta(h,e,Number(i.next_cost),i.cooldown_until!=null?Number(i.cooldown_until):null)}catch(i){alert(`${e.actionLabel} failed: ${i?.message||i}`)}finally{jt.delete(a)}}}function ta(a,t,e,o){const r=a.querySelector(".pa-action-cost");r&&Number.isFinite(e)&&e>0&&(r.textContent="$"+Math.round(e/1e6));const i=Number(g?.shard?.current_tick)||0,n=(ft||[]).find(p=>p.ministry_key===t.ministryKey),d=Number(n?.discretionary_balance??0);let c="";if(Number.isFinite(o)&&o>i){const p=o-i;c=`Cooldown — next ${t.actionNoun} ready at tick ${o} (${p} tick${p===1?"":"s"} away).`}else if(Number.isFinite(e)&&d<e){const p=Math.round(e/1e6);c=`${t.ministryName} discretionary budget is below $${p} — next ${t.actionNoun} cost has outgrown the budget.`}const v=a.querySelector("."+t.lockLineClass);if(c)if(a.classList.add("locked"),v){const p=v.querySelector("span:last-child");p&&(p.textContent=c)}else{const p=document.createElement("div");p.className=t.lockLineClass,p.style.cssText="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;";const s=document.createElement("span");s.textContent="⊘";const l=document.createElement("span");l.textContent=c,p.appendChild(s),p.appendChild(l),a.appendChild(p)}else a.classList.remove("locked"),v&&v.remove()}async function ea(a){const t=Rt[a];if(!t)return;const e=document.querySelector(`.pa-action-item[data-action-id="${a}"]`);if(!e)return;const o=g?.nation?.id;if(!o)return;let r,i;try{[r,i]=await Promise.all([C.rpc(t.nextCostRpc,{p_nation_id:o}),C.rpc(t.cooldownRpc,{p_nation_id:o})])}catch(c){console.warn(`[${t.actionLabel}] RPC fetch threw:`,c?.message||c);return}r.error&&console.warn(`[${t.actionLabel}] next_cost RPC failed:`,r.error.message),i.error&&console.warn(`[${t.actionLabel}] cooldown_until RPC failed:`,i.error.message);const n=Number(r.data),d=i.data!=null?Number(i.data):null;ta(e,t,n,d)}let Wt=!1;async function Le(a){const t=document.getElementById("pa-hire-modal");if(!t)return;const e=g.nation?.id,o=g.nation?.name;if(!e||!o)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const r=await La(C,e,o);let i=null;function n(){const d=i!=null?r[i]:null,c=d?dt(d.skill):null,v=r.map((l,y)=>{const u=i===y,f=dt(l.skill);return`<div class="pa-hire-row ${u?"selected":""}" data-idx="${y}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${X(l.first_name,l.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${u?"var(--text-bright)":"var(--text-secondary)"};">${$(l.first_name)} ${$(l.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${l.skill}%;background:${f.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${f.color};">${l.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${l.age}</div>
            </div>`}).join("");let p;d?p=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${X(d.first_name,d.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${$(d.first_name)} ${$(d.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${d.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${d.skill}%;background:${c.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c.color};">${d.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${c.color};margin-top:3px;font-weight:700;">${c.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(d.hire_cost/1e3).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${$(d.background)}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(d.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(g.faction?.party_funds||0)<d.hire_cost?' disabled title="Not enough funds"':""}>Hire ${$(d.first_name)}</button>
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
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${r.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-hire-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-hire-list">
                        ${v}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${p}
                    </div>
                </div>
            </div>
        `;const s=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",s),t.onclick=l=>{l.target===t&&s()},document.getElementById("pa-hire-list")?.addEventListener("click",l=>{const y=l.target.closest(".pa-hire-row");y&&(i=parseInt(y.dataset.idx,10),n())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Wt||i==null)return;Wt=!0;const l=document.getElementById("pa-hire-confirm");l&&(l.disabled=!0,l.textContent="Hiring...");try{const y=g.shard?.current_tick||0,u=r[i],f=u.hire_cost||0,h=g.faction?.party_funds||0;if(f>0&&h<f){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $${Math.round(f/1e3)}k.`);return}if(f>0){const x=h-f,{error:b}=await C.from("factions").update({party_funds:x}).eq("id",g.faction.id);if(b){alert("Failed to deduct funds.");return}g.faction.party_funds=x}const m=await Na(C,g.faction?.id,u,y);if(!m.success){alert(m.error||"Failed to hire agitator.");return}j=m.agitator,V="agitator",s(),O(a)}catch(y){console.error("[PartyActions] Hire agitator error:",y)}finally{Wt=!1,l&&(l.disabled=!1)}})}n()}let Lt=!1;function _o(a){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!B){alert("No active government to file against.");return}const e=g.faction,o=j;let r=null,i=null;function n(){const d=r&&i,c=Pt.map(s=>{const l=r===s.key;return`<div class="pa-lawsuit-target ${l?"selected":""}" data-target="${s.key}">
                <span style="font-size:18px;">${s.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${l?"var(--text-bright)":"var(--text-secondary)"};">${$(s.label)}</span>
            </div>`}).join(""),v=Ue.map(s=>{const l=i===s.key;return`<div class="pa-lawsuit-basis ${l?"selected":""}" data-basis="${s.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${l?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${l?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${l?"var(--text-bright)":"var(--text-secondary)"};">${$(s.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${$(s.desc)}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">${$(o.first_name)} ${$(o.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Skill ${o.skill}</span>
                </div>`:""}

                <div class="pa-modal-body" style="gap:16px;">
                    <div>
                        <div class="pa-modal-step-label">1 &mdash; Target Ministry</div>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;" id="pa-lawsuit-targets">${c}</div>
                    </div>

                    <div>
                        <div class="pa-modal-step-label">2 &mdash; Legal Basis</div>
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${v}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${d?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const p=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",p),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",p),t.onclick=s=>{s.target===t&&p()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",s=>{const l=s.target.closest(".pa-lawsuit-target");l&&(r=l.dataset.target,n())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",s=>{const l=s.target.closest(".pa-lawsuit-basis");l&&(i=l.dataset.basis,n())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(Lt||!r||!i)return;Lt=!0;const s=document.getElementById("pa-lawsuit-submit");s&&(s.disabled=!0,s.textContent="Filing...");try{const{data:y}=await C.from("factions").select("party_funds").eq("id",e.id).single(),u=y?.party_funds||0;if(u<25e4){alert(`Not enough funds. You have $${Math.round(u/1e3)}k, need $250k.`),Lt=!1,s&&(s.disabled=!1,s.textContent="File Lawsuit");return}const f=u-25e4;await C.from("factions").update({party_funds:f}).eq("id",e.id),e.party_funds=f,sessionStorage.removeItem("nationhood_state");const h=g.shard?.current_tick||0,m=await Aa(C,{factionId:e?.id,nationId:g.nation?.id,agitatorId:o?.id,targetMinistry:r,basis:i,currentTick:h,partyName:e?.faction_name||"Opposition",administration:B});if(!m.success){alert(m.error||"Failed to file lawsuit.");return}const x=me(m.lawsuit?.corruption_growth||0),b=it[m.tier]||it[1];p(),alert(`Lawsuit filed against ${Pt.find(_=>_.key===r)?.label||r}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),O(a)}catch(l){console.error("[PartyActions] File lawsuit error:",l),alert("An error occurred. Please try again.")}finally{Lt=!1,s&&(s.disabled=!1,s.textContent="File Lawsuit")}})}t.classList.add("active"),n()}async function $o(a){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const e=g.nation,o=g.faction,{data:r}=await C.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),i=r||[];let n=null,d=!1;const{data:c}=await C.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",e.id).eq("active",!0).maybeSingle();function v(){const p=i.find(f=>f.id===n),s=c?`${c.first_name} ${c.last_name}`:null,l=c?.factions?.faction_name||null,y=c&&n===c.faction_id;t.innerHTML=`
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
                    ${s?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${$(s)}</strong> (${$(l||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${i.map(f=>{const h=f.id===n,m=c&&f.id===c.faction_id,x=f.leader_first_name&&f.leader_last_name?`${f.leader_first_name} ${f.leader_last_name}`:"?";return`<div class="pa-action-item ${h?"selected":""}" data-party-id="${f.id}" style="cursor:pointer;${h?`border-color:${f.party_color||"#888"};background:${f.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${f.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${$(f.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${$(x)}, Age ${f.leader_age||"?"} · ${f.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${m?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!p||d||y?"disabled":""} style="background:#c8a832;">${p?y?"Already PM":`Appoint ${$(p.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const u=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",u),document.getElementById("apm-cancel")?.addEventListener("click",u),t.onclick=f=>{f.target===t&&u()},t.querySelector(".pa-modal-body")?.addEventListener("click",f=>{const h=f.target.closest("[data-party-id]");h&&(n=h.dataset.partyId,v())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!n||d)return;const f=i.find(m=>m.id===n);if(!f||!confirm(`Appoint ${f.leader_first_name} ${f.leader_last_name} of ${f.faction_name} as Prime Minister?`))return;d=!0;const h=document.getElementById("apm-confirm");h&&(h.disabled=!0,h.textContent="Appointing...");try{const m=g.shard?.current_tick||0;await ya(C,{nationId:e.id,factionId:n,firstName:f.leader_first_name||"Unknown",lastName:f.leader_last_name||"Unknown",age:f.leader_age||50,currentTick:m});try{await C.from("government_formations").update({status:"dissolved"}).eq("nation_id",e.id).in("status",["formed","caretaker","active"]);const{data:E}=await C.from("shard").select("current_date").eq("name","Alpha Shard").single();await C.from("government_formations").insert({nation_id:e.id,election_id:null,proposed_by:o.id,party_ids:[n],status:"formed",formation_type:"monarchy",formed_at:new Date().toISOString(),ministry_assignments:{prime_minister:n},game_year:E?.current_date||""})}catch(E){console.warn("[AppointPM] government_formations write failed (non-blocking — synthetic fallback still works):",E?.message||E)}let x=0;const b=e.monarch_faction_id,_=c?.faction_id||null,M=_&&_!==b&&_!==n,w=n!==b&&n!==_;if(M&&(x-=4),w&&(x+=3),x!==0){const E=Number(e.crown_authority??50),S=Math.max(0,Math.min(100,E+x));try{await C.from("nations").update({crown_authority:S}).eq("id",e.id),e.crown_authority=S}catch{}}try{await C.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${e.monarch_title||"The King"} has appointed ${f.leader_first_name} ${f.leader_last_name} of ${f.faction_name} as Prime Minister.`,fired_at_tick:m})}catch{}u();const k=x>0?`

Crown Authority +${x}.`:x<0?`

Crown Authority ${x}.`:"";alert(`${f.leader_first_name} ${f.leader_last_name} of ${f.faction_name} has been appointed Prime Minister.${k}`),O(a)}catch(m){alert("Failed to appoint PM: "+(m.message||"Error")),d=!1,h&&(h.disabled=!1,h.textContent=`Appoint ${$(f.faction_name)}`)}})}t.classList.add("active"),v()}async function wo(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const e=g.nation,o=g.faction,r=o.seats||0,i=e?.total_seats||100,{data:n}=await C.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),d=(n||[]).filter(l=>l.id!==o.id);let c=null;const v=Math.max(0,r-1);let p=Math.min(5,v||1);function s(){const l=d.find(u=>u.id===c);t.innerHTML=`
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
                    You currently hold <strong>${r}</strong> of ${i} seats.
                    ${r/i>.7?'<div style="color:#d44a4a;font-weight:700;margin-top:4px;">⚠ You hold >70% of seats — tyranny crown authority decay active!</div>':""}
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${d.length>0?d.map(u=>{const f=u.id===c;return`<div class="pa-action-item ${f?"selected":""}" data-faction-id="${u.id}" style="cursor:pointer;${f?`border-color:${u.party_color||"#888"};background:${u.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${u.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${$(u.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,u.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${l?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${v}" value="${p}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${p}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Crown Authority gain: <span style="color:#5cc55c;font-weight:700;">+${(p*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${r-p} &middot; Their seats after: ${(l.seats||0)+p}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${l?"":"disabled"} style="background:#c8a832;">Grant ${p} Seats</button>
                </div>
            </div>
        `;const y=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",y),document.getElementById("royal-cancel")?.addEventListener("click",y),t.onclick=u=>{u.target===t&&y()},t.querySelector(".pa-modal-body")?.addEventListener("click",u=>{const f=u.target.closest("[data-faction-id]");f&&(c=f.dataset.factionId,s())}),document.getElementById("grant-slider")?.addEventListener("input",u=>{p=parseInt(u.target.value)||1,document.getElementById("grant-count").textContent=p;const f=document.getElementById("royal-grant");f&&(f.textContent=`Grant ${p} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!c||mt)return;mt=!0;const u=document.getElementById("royal-grant");u&&(u.disabled=!0,u.textContent="Granting...");try{const{data:f}=await C.from("factions").select("id, faction_name, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null),h=(f||[]).find(I=>I.id===o.id),m=(f||[]).find(I=>I.id===c);if(!h||!m){alert("Faction not found.");return}const x=(f||[]).reduce((I,N)=>I+Math.max(0,N.seats||0),0),b=new Map;for(const I of f||[])b.set(I.id,Math.max(0,I.seats||0));let _=p;const M=Math.max(0,(b.get(o.id)||0)-1),w=Math.min(_,M);if(w>0&&(b.set(o.id,(b.get(o.id)||0)-w),_-=w),_>0){const I=(f||[]).filter(A=>A.id!==o.id&&A.id!==c&&(b.get(A.id)||0)>0);let N=I.reduce((A,z)=>A+(b.get(z.id)||0),0);for(const A of I){if(_<=0||N<=0)break;const z=Math.round(_*(b.get(A.id)||0)/N),q=Math.min(z,b.get(A.id)||0,_);q>0&&(b.set(A.id,(b.get(A.id)||0)-q),N-=q,_-=q)}if(_>0)for(const A of I){if(_<=0)break;const z=b.get(A.id)||0,q=Math.min(_,z);q>0&&(b.set(A.id,z-q),_-=q)}}const k=p-_;if(k<=0){alert("No seats available to grant.");return}b.set(c,(b.get(c)||0)+k);let E=0;for(const I of b.values())E+=I;if(E!==x){console.error("[GrantSeats] Conservation violated",{sumBefore:x,sumAfter:E,grantAmount:p,actualGrant:k}),alert("Internal error: seat totals would not balance. Aborting.");return}const S=[];for(const I of f||[]){const N=Math.max(0,I.seats||0),A=b.get(I.id)||0;N!==A&&S.push({id:I.id,seats:A})}for(const I of S){const{error:N}=await C.from("factions").update({seats:I.seats}).eq("id",I.id);if(N){alert("Failed to grant seats: "+N.message);return}}const L=k*.5,T=Math.min(100,(Number(e.crown_authority)||50)+L),{error:P}=await C.from("nations").update({crown_authority:T}).eq("id",e.id);if(P){alert("Failed to update crown authority.");return}o.seats=b.get(o.id)||0,e.crown_authority=T;try{const I=d.find(N=>N.id===c);await C.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} grants ${k} seats to ${I?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${e.monarch_title||"King"} has granted ${k} parliamentary seat${k!==1?"s":""} to ${I?.faction_name}. Crown Authority +${L.toFixed(1)}.`,fired_at_tick:g.shard?.current_tick||0})}catch{}y(),O(a)}catch(f){console.error("[GrantSeats] Error:",f),alert("Failed to grant seats.")}finally{mt=!1}})}t.classList.add("active"),s()}async function ko(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const e=g.nation,o=g.faction,{data:r}=await C.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),i=(r||[]).filter(v=>v.id!==o.id&&(v.seats||0)>0);let n=null,d=1;function c(){const v=i.find(f=>f.id===n),p=v&&v.seats||0,l=d*1e5,y=o.party_funds||0;t.innerHTML=`
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
                        ${i.length>0?i.map(f=>{const h=f.id===n;return`<div class="pa-action-item ${h?"selected":""}" data-faction-id="${f.id}" style="cursor:pointer;${h?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${f.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${$(f.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${f.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${v?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${p}" value="${d}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${d}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(l/1e3)}k</span>
                                &middot; Crown Authority: <span style="color:#d44a4a;font-weight:700;">-${d}</span>
                                ${y<l?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!v||y<l?"disabled":""} style="background:#d44a4a;">Revoke ${d} Seats</button>
                </div>
            </div>
        `;const u=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",u),document.getElementById("royal-cancel")?.addEventListener("click",u),t.onclick=f=>{f.target===t&&u()},t.querySelector(".pa-modal-body")?.addEventListener("click",f=>{const h=f.target.closest("[data-faction-id]");h&&(n=h.dataset.factionId,d=1,c())}),document.getElementById("revoke-slider")?.addEventListener("input",f=>{d=parseInt(f.target.value)||1,document.getElementById("revoke-count").textContent=d;const h=document.getElementById("royal-revoke");h&&(h.textContent=`Revoke ${d} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!n||mt)return;mt=!0;const f=document.getElementById("royal-revoke");f&&(f.disabled=!0,f.textContent="Revoking...");try{const h=d*1e5,{data:m}=await C.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null),x=(m||[]).find(z=>z.id===o.id),b=(m||[]).find(z=>z.id===n);if(!x||!b){alert("Faction not found.");return}const _=x.party_funds||0;if(_<h){alert("Not enough funds.");return}const M=(m||[]).reduce((z,q)=>z+Math.max(0,q.seats||0),0),w=Math.min(d,b.seats||0);if(w<=0){alert("Target has no seats to revoke.");return}const k=_-h,E=(x.seats||0)+w,S=(b.seats||0)-w,L=w,T=Math.max(0,(Number(e.crown_authority)||50)-L),P=M-(x.seats||0)-(b.seats||0)+E+S;if(P!==M){console.error("[RevokeSeats] Conservation violated",{sumBefore:M,sumAfter:P,take:w}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:I}=await C.from("factions").update({seats:E,party_funds:k}).eq("id",o.id);if(I){alert("Failed to revoke seats: "+I.message);return}const{error:N}=await C.from("factions").update({seats:S}).eq("id",n);if(N){alert("Failed to revoke seats: "+N.message);return}const{error:A}=await C.from("nations").update({crown_authority:T}).eq("id",e.id);if(A){alert("Failed to update crown authority.");return}o.seats=E,o.party_funds=k,e.crown_authority=T,sessionStorage.removeItem("nationhood_state");try{await C.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} revokes ${w} seats from ${b.faction_name||"unknown"}`,category:"political",description_chosen:`The ${e.monarch_title||"King"} has revoked ${w} seat${w!==1?"s":""} from ${b.faction_name}. Crown Authority -${L}.`,fired_at_tick:g.shard?.current_tick||0})}catch{}u(),O(a)}catch(h){console.error("[RevokeSeats] Error:",h),alert("Failed to revoke seats.")}finally{mt=!1}})}t.classList.add("active"),c()}let Kt=!1;async function Eo(){if(Kt||!g?.faction?.id||!g?.nation?.id)return;if(!Ht(g.nation)){alert("Early elections are only available in parliamentary and semi-presidential systems.");return}if(K(g.nation)){alert("Elections are not held under absolute monarchy.");return}const a=B?.pm_party_id;if(!a||a!==g.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚡ CALL EARLY ELECTIONS?

Dissolves the legislature and puts the government into caretaker status.
Election fires after a short formation window.

Momentum effect depends on Gov. Approval:
• >50  → PM party +3 Momentum (fresh mandate)
• 35–50 → neutral
• <35  → opposition +5 Momentum each, +3 Stability

Proceed?`)){Kt=!0;try{const t=Array.isArray(B?.party_ids)?B.party_ids:B?.pm_party_id?[B.pm_party_id]:[],e=await $a(C,g.nation.id,a,t);if(e&&e.success===!1){alert("Could not call early elections: "+(e.error||"unknown error"));return}alert("⚡ Early elections called. Government is now in caretaker status."),window.location.reload()}catch(t){console.error("[PartyActions] Call early elections failed:",t),alert("Failed to call early elections: "+(t?.message||"unknown error"))}finally{Kt=!1}}}let Jt=!1,Xt=!1;async function Co(){if(!Xt&&g?.nation?.id&&confirm(`FORM MINORITY GOVERNMENT?

Consequences:
• Your party governs alone — no coalition partners
• Bills pass with -20% effective YES votes
• A snap election fires automatically in 36 ticks if a stable
  coalition isn't formed before then
• Other parties’ ministers are dismissed; only your PM remains

Proceed?`)){Xt=!0;try{const a=await ua(C,g.nation.id);if(!a?.success){const e={invalid_nation:"Nation context unavailable. Reload and try again.",not_parliamentary:"This action only applies to parliamentary governments.",not_party_leader:"Only a party leader can form a minority government.",no_shard:"Game state unavailable.",no_election:"No completed election to form a government from.",gate_not_elapsed:"The coalition window has not yet closed.",majority_exists:"A party already holds an outright majority — form a normal government instead.",coalition_exists:"A government has already been formed for this cycle.",already_minority:"A minority government is already in place.",no_active_parties:"No active parties qualify to form a government.",not_largest_active:"Only the largest active party may form a minority government.",rpc_failed:a?.error||"Server error — try again."}[a?.reason]||a?.reason||"Unknown error";alert(`Could not form minority government:

`+e);return}alert("Minority government formed."),window.location.reload()}catch(a){console.error("[PartyActions] Form Minority Government failed:",a),alert("Failed to form minority government: "+(a?.message||a))}finally{Xt=!1}}}async function Io(){if(!Jt&&g?.faction?.id&&confirm(`LEAVE COALITION?

Consequences:
• −3 Momentum to your party
• −5 Momentum to the Prime Minister’s party
• Any ministries you hold will be vacated
• Your party moves from governing to opposition
• Coalition flips to minority if your exit drops it below majority
• 12-tick cooldown before you can leave another coalition

Proceed?`)){Jt=!0;try{const{data:a,error:t}=await C.rpc("leave_coalition",{p_faction_id:g.faction.id});if(t)throw t;if(a&&a.success===!1)throw new Error(a.error||"Unknown error");const e=a?.became_minority?`

The government is now a minority.`:"",o=(a?.ministries_vacated||0)>0?`

${a.ministries_vacated} ministr${a.ministries_vacated===1?"y":"ies"} vacated.`:"";alert("You have left the coalition."+e+o),window.location.reload()}catch(a){console.error("[PartyActions] Leave Coalition failed:",a),alert("Failed to leave coalition: "+(a?.message||a))}finally{Jt=!1}}}let Qt=!1;async function Mo(a,t){if(!(Qt||_t)&&!(!g?.nation?.id||!t?.id)&&confirm(`LEADERSHIP CHALLENGE?

Claim the vacant Premiership for your party leader.
Resolves on the next tick. If multiple coalition parties claim, the
largest by seats wins (earliest claim breaks ties).

Winner gets +0.3 popularity across all voter sectors
(suppressed if your party held PM in the last 12 ticks).

Proceed?`)){Qt=!0;try{const{data:e}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=Number(e?.current_tick)||0,r=await va(C,g.nation,t,o);if(r?.success){_t=!0;const i=r.alreadyClaimed?"You already submitted this tick — sit tight, resolves next tick.":"Leadership Challenge submitted. Resolves on the next tick.";alert(i),O(a)}else{const n={wrong_gov_type:"Leadership Challenge is only available in parliamentary systems.",pm_already_installed:"A Prime Minister is already serving — vacancy required.",no_coalition:"No active coalition.",not_in_coalition:"Your party is not in the governing coalition.",not_owner:"This session is not authorized to act for that party. Refresh or re-select your faction; admins must deploy the admin-inspector Leadership Challenge migration.",no_leader:"Your party has no leader to install.",no_seats:"Your party holds no parliamentary seats.",rpc_failed:"Server function call failed. The claim_leadership_challenge RPC may not be deployed yet — run migration 20260917_claim_leadership_challenge_rpc.sql."}[r?.reason]||"Could not submit: "+(r?.reason||"unknown error"),d=r?.error?`

Detail: ${r.error}`:"";alert(n+d),console.warn("[LeadershipChallenge] failed:",r)}}catch(e){console.error("[PartyActions] Leadership Challenge failed:",e),alert("Leadership Challenge failed: "+(e?.message||e))}finally{Qt=!1}}}let Zt=!1;async function So(){if(Zt||!g?.faction?.id||!g?.nation?.id)return;if(!Ht(g.nation)){alert("Resignation is only available in parliamentary and semi-presidential systems.");return}if(K(g.nation)){alert("Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action.");return}const a=B?.pm_party_id;if(!a||a!==g.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚠ RESIGN AS PRIME MINISTER?

The PM seat vacates immediately. Coalition enters caretaker status with
a ${De}-tick window to nominate a successor via the cabinet panel.
If a new PM is installed, the administration continues under new leadership.
If the window expires, a snap election is called.

Cost to your party:
• −3 Momentum
• −0.05 Credibility
• Nation: −3 Stability
• 12-tick bar from the PM seat on your party

Proceed?`)){Zt=!0;try{const{data:t}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),e=t?.current_tick||g.shard?.current_tick||0;(await fa(C,g.nation.id,g.faction.id,e))?.result==="election_called"?alert("You have resigned. Snap election scheduled as fallback if no successor is nominated."):alert("You have resigned. Coalition has a short window to nominate a successor before a snap election fires."),window.location.reload()}catch(t){console.error("[PartyActions] Resign PM failed:",t),alert("Failed to resign: "+(t?.message||"unknown error"))}finally{Zt=!1}}}let te=!1;async function Lo(){if(te||!g?.faction?.id)return;const a=g.faction,t=a.faction_name||"this party",e=a.seats||0,o=Number(a.momentum||0).toFixed(1),r=Math.round(Number(a.party_funds||0)),i=r>=1e3?"$"+r.toLocaleString():"$"+r;if(confirm("DISBAND "+t.toUpperCase()+`?

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

This action CANNOT be undone.`)){te=!0;try{const{data:n,error:d}=await C.rpc("disband_party",{p_faction_id:a.id});if(d)throw d;if(n&&n.success===!1)throw new Error(n.error||"Unknown error");sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:{user:c}}=await C.auth.getUser();if(c){const{data:v}=await C.from("factions").select("id, faction_type").or(`id.eq.${c.id},linked_user_id.eq.${c.id}`),p=(v||[]).find(l=>l.faction_type==="party"),s=(v||[]).find(l=>l.faction_type==="corporation");if(p){sessionStorage.setItem("active_faction_id",p.id),alert(t+` has been disbanded.

Redirecting to your other party.`),window.location.href="dashboard.html";return}if(s){sessionStorage.setItem("active_faction_id",s.id),alert(t+` has been disbanded.

Redirecting to your corporation.`),window.location.href="corp-dashboard.html";return}}alert(t+` has been disbanded.

You have no remaining factions.`),window.location.href="faction-select.html"}catch(n){console.error("[PartyActions] Disband failed:",n),alert("Disband failed: "+(n?.message||n))}finally{te=!1}}}let ee=!1;async function No(){if(ee)return;const a=g?.faction,t=g?.nation;if(!(!a?.id||!t?.id)){if(!st){alert("No sitting President to impeach.");return}ee=!0;try{const e=Number(g?.shard?.current_tick)||0;await za(C,{faction:a,nation:t,president:st,isPresidentParty:st.faction_id===a.id,mySeats:a.seats||0,currentTick:e})}catch(e){console.error("[party-actions] impeachment threw:",e?.message||e),alert("Impeachment failed — check console.")}finally{ee=!1}}}let ae=!1;async function Ao(){if(ae||!g?.faction?.id||!g?.nation?.id)return;const a=g.faction,t=g.nation,e=Be(t);if(!Ht(t)){alert("A vote of no confidence is only possible in a parliamentary or semi-presidential system.");return}const{data:o}=await C.from("head_of_government").select("faction_id, last_name").eq("nation_id",t.id).eq("active",!0).maybeSingle(),r=o?.faction_id||t.ruling_faction_id||null,i=o?.last_name||null;if(!r){alert("No active Prime Minister to file against.");return}if(r===a.id){alert("Your party is the Prime Minister — you cannot file a vote of no confidence against yourself.");return}const n=g.faction?.seats!=null?Number(g.faction.seats):0;if(n<1){alert("Your party needs at least 1 seat in the legislature to file a motion.");return}const{data:d}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=d?.current_tick||g.shard?.current_tick||0,{data:v}=await C.from("bills").select("id").eq("nation_id",t.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(v&&v.length>0){alert("A motion of no confidence is already pending.");return}const{data:p}=await C.from("campaign_actions").select("tick_performed").eq("nation_id",t.id).eq("action_type","no_confidence_filed").eq("target_id",r).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(p){const y=c-Number(p.tick_performed||0);if(y<R.NO_CONFIDENCE_COOLDOWN_TICKS){const u=R.NO_CONFIDENCE_COOLDOWN_TICKS-y;alert(`Cooldown: ${u} tick${u!==1?"s":""} remaining before another motion can be filed against this PM party.`);return}}const s=i?e?`Motion of No Confidence in PM ${i}`:`Motion of No Confidence in the ${i} Government`:"Motion of No Confidence in the Government",l=e?`IF IT PASSES:
• PM removed — President must nominate a new PM
• Your party: +15 Momentum
• PM's party: -10 Momentum`:`IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Snap elections scheduled
• Your party: +15 Momentum
• PM's party: -10 Momentum`;if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${s}"

Cost: $0 — free to file
Voting period: ${R.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

${l}

IF IT FAILS:
• Your party: -10 Momentum
• ${R.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown on this PM party

Proceed?`)){ae=!0;try{const y=await ma(C,{faction:a,nation:t,pmFactionId:r,pmLastName:i,isSemiPres:e,tick:c,mySeats:n});if(!y.ok){alert("Failed to file motion: "+y.error);return}alert(`⚡ "${y.motionName}" has been filed!

Voting is now open for ${R.NO_CONFIDENCE_VOTING_TICKS} ticks.`),window.location.href=`bill.html?id=${y.billId}`}catch(y){console.error("[PartyActions] No confidence file failed:",y),alert("Failed to file motion: "+(y?.message||"unknown error"))}finally{ae=!1}}}let Tt=!1,lt=[],wt=null;async function To(){if(lt.length>0)return;const{data:a,error:t}=await C.from("fundraiser_events").select("event_key, name, icon, host_sector_key, opposition_sector_key, display_order").order("display_order");if(t){console.warn("[PartyActions] fundraiser_events load failed:",t.message),lt=[];return}lt=a||[]}async function Po(a){if(!a||!g?.nation?.id||!g?.faction?.id)return null;const{data:t}=await C.from("sectors").select("id, name, weight").eq("nation_id",g.nation.id).eq("sector_key",a).eq("is_active",!0).maybeSingle();if(!t?.id)return null;const{data:e}=await C.from("faction_sector_popularity").select("popularity").eq("faction_id",g.faction.id).eq("sector_id",t.id).maybeSingle();return{id:t.id,name:t.name,weight:Number(t.weight)||1,popularity_tenths:Number(e?.popularity)||0}}async function zo(a){if(!Tt){if($t>=1){alert("You have already hosted a fundraiser this tick. Try again next tick.");return}if(await To(),lt.length===0){alert("No fundraiser events configured. Run migration 20260728.");return}wt=null,await Ro(a)}}async function Ro(a){let t=document.getElementById("pa-fundraise-modal");t||(t=document.createElement("div"),t.id="pa-fundraise-modal",t.className="pa-modal-overlay",t.innerHTML=`
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
            </div>`,document.body.appendChild(t),t.addEventListener("click",n=>{(n.target.matches('[data-act="fr-close"]')||n.target===t)&&(t.style.display="none")})),t.style.display="flex";const e=t.querySelector("#pa-fundraise-body");e.innerHTML='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Loading sectors…</div>';const o={},r=new Set;for(const n of lt)r.add(n.host_sector_key),r.add(n.opposition_sector_key);await Promise.all(Array.from(r).map(async n=>{o[n]=await Po(n)}));const i=lt.map(n=>{const d=o[n.host_sector_key],c=d?(d.popularity_tenths/10).toFixed(1):"—",v=d?.weight||1;return`
            <div class="pa-fr-card" data-event-key="${$(n.event_key)}" style="padding:10px 14px;border-bottom:1px dashed var(--border-main);cursor:pointer;">
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-size:14px;">${n.icon}</span>
                    <span style="font-family:var(--font-serif, 'IBM Plex Serif', serif);font-size:14px;font-weight:600;color:var(--text-bright);">${$(n.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.06em;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">
                    ${$(d?.name||n.host_sector_key)} · w${v} · pop ${c}
                </div>
            </div>`}).join("");e.innerHTML=`
        <div id="pa-fr-list" style="overflow-y:auto;border-right:1px solid var(--border-main);">
            ${i}
        </div>
        <div id="pa-fr-detail" style="padding:14px 18px;overflow-y:auto;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;">Pick an event on the left to see details.</div>
        </div>`,e.querySelectorAll(".pa-fr-card").forEach(n=>{n.addEventListener("click",()=>{wt=n.dataset.eventKey,e.querySelectorAll(".pa-fr-card").forEach(d=>d.style.background=""),n.style.background="rgba(200,168,50,0.08)",Oo(e,o,a)})})}function Oo(a,t,e){const o=a.querySelector("#pa-fr-detail"),r=lt.find(f=>f.event_key===wt);if(!r)return;const i=t[r.host_sector_key],n=t[r.opposition_sector_key],d=i?(i.popularity_tenths/10).toFixed(1):"—",c=i?.weight||1,v=n?(n.popularity_tenths/10).toFixed(1):"—",p=!i,s=!n,l=r.event_key!=="corporate_gala",y=l&&i?1250*(i.popularity_tenths||0)*Math.max(1,i.weight||1):0;o.innerHTML=`
        <div style="display:flex;align-items:baseline;gap:8px;">
            <span style="font-size:18px;">${r.icon}</span>
            <span style="font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text-bright);">${$(r.name)}</span>
        </div>

        <div style="margin-top:14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Host bloc</div>
            <div style="font-family:var(--font-serif);font-size:14px;color:var(--text-bright);margin-top:2px;">${$(i?.name||r.host_sector_key)}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-top:2px;">Your popularity: <strong style="color:var(--text-bright);">${d}</strong> · National weight: <strong style="color:var(--text-bright);">w${c}</strong></div>
        </div>

        <div style="margin-top:14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Paired opposition</div>
            <div style="font-family:var(--font-serif);font-size:14px;color:var(--text-bright);margin-top:2px;">${$(n?.name||r.opposition_sector_key)}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-top:2px;">Your popularity: <strong style="color:var(--text-bright);">${v}</strong></div>
        </div>

        <div style="margin-top:18px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Costs (popularity)</div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↓ ${$(i?.name||r.host_sector_key)}</span><span style="color:#d44a4a;font-weight:700;">−0.3 (donor fatigue)</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↓ ${$(n?.name||r.opposition_sector_key)}</span>
                ${s?'<span style="color:var(--text-dim);font-style:italic;">not in this nation — no cost</span>':'<span style="color:#d44a4a;font-weight:700;">−0.5 (optics)</span>'}
            </div>
        </div>

        <div style="margin-top:10px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Projected yield</div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↑ Party funds</span>
                ${l?`<span style="color:#5cb85c;font-weight:700;">+${ze(y)}</span>`:'<span style="color:var(--text-dim);font-style:italic;">positioning only — no yield</span>'}
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
    `;const u=o.querySelector("#pa-fr-confirm");u&&u.addEventListener("click",()=>Fo(e))}async function Fo(a){if(!(Tt||!wt)){Tt=!0;try{const t=g.shard?.current_tick||0,{data:e,error:o}=await C.rpc("fundraise_themed",{p_faction_id:g.faction.id,p_nation_id:g.nation.id,p_event_key:wt,p_tick:t});if(o||!e?.success){alert("Fundraise failed: "+(o?.message||e?.error||"unknown"));return}const r=document.getElementById("pa-fundraise-modal");r&&(r.style.display="none"),sessionStorage.removeItem("nationhood_state"),$t++;const i=Number(e?.yield)||0;i>0&&alert("Fundraiser hosted. +"+ze(i)+" to party funds."),O(a)}catch(t){console.error("[PartyActions] Fundraise error:",t),alert("Fundraise failed.")}finally{Tt=!1}}}function Bo(a){const t=document.getElementById("pa-statement-modal");if(!t)return;const e=g.faction,o=e?.color||"#c8a832",r=e?.leader_first_name&&e?.leader_last_name?`${e.leader_first_name} ${e.leader_last_name}`:"Party Leader",i=we.map(p=>`<div class="pa-topic-card" data-topic="${p.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${p.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${$(p.label)}</span>
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
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${o};">${$(r)}</span>
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
    `,t.classList.add("active");let n=null,d=!1;const c=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",c),document.getElementById("pa-stmt-cancel")?.addEventListener("click",c),t.addEventListener("click",p=>{p.target===t&&c()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",p=>{const s=p.target.closest(".pa-topic-card");s&&(n=s.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(l=>{const y=l.dataset.topic===n;l.style.borderColor=y?o:"var(--border-mid)",l.style.background=y?o+"0a":"";const u=l.querySelector("span:last-child");u&&(u.style.color=y?"var(--text-bright)":"var(--text-secondary)")}),v())});const v=()=>{const p=document.getElementById("pa-stmt-body")?.value?.trim()||"",s=document.getElementById("pa-stmt-submit"),l=document.getElementById("pa-stmt-charcount");l&&(l.textContent=`${p.length} characters`),s&&(s.disabled=!(n&&p.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",v),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(d)return;const p=document.getElementById("pa-stmt-body")?.value?.trim();if(!n||!p||p.length<10)return;d=!0;const s=document.getElementById("pa-stmt-submit");s&&(s.disabled=!0,s.textContent="Issuing...");try{const l=g.shard?.current_tick||0,u=we.find(L=>L.id===n)?.label||n,f=2e4,{data:h}=await C.from("factions").select("party_funds").eq("id",e.id).single(),m=h?.party_funds||0;if(m<f){alert(`Not enough funds. You have $${Math.round(m/1e3)}k, need $20k.`);return}const x=m-f,{error:b}=await C.from("factions").update({party_funds:x}).eq("id",e.id);if(b){alert("Failed to deduct funds: "+b.message);return}e.party_funds=x;const M=ke[Math.floor(Math.random()*ke.length)].replace("{party_name}",e.faction_name||"Unknown Party").replace("{leader_name}",r).replace("{topic}",u),{error:w}=await C.from("campaign_actions").insert({party_id:e.id,nation_id:g.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:l,result:{topic:n,topicLabel:u,headline:M,body:p,leaderName:r}});w&&console.error("[PartyActions] Statement log failed:",w.message);const{error:k}=await C.from("valdorian_articles").insert({nation_id:g.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:M,subheadline:u,lede:p.substring(0,200)+(p.length>200?"...":""),body_paragraphs:JSON.stringify(p.split(/\n\n+/).filter(L=>L.trim())),quotes:JSON.stringify([{posture:"assertive",text:p.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([n]),source_event_id:"statement_"+Date.now(),tick:l});k&&console.error("[PartyActions] Article creation failed:",k.message);const{error:E}=await C.from("event_log").insert({nation_id:g.nation?.id,event_name:M,category:"political",description_chosen:`${e.faction_name} issues the following statement regarding ${u}: "${p}"`,fired_at_tick:l});E&&console.warn("[Statement] event_log insert failed:",E.message);const{error:S}=await C.from("admin_timeline_events").insert({nation_id:g.nation?.id,tick:l,type:"communications",title:"Statement Issued",description:`${r} issued a public statement on ${u}: "${p.substring(0,120)}${p.length>120?"...":""}"`});S&&console.warn("[Statement] timeline insert failed:",S.message),c(),O(a)}catch(l){console.error("[PartyActions] Statement error:",l),alert("Failed to issue statement. Please try again.")}finally{d=!1,s&&(s.disabled=!1,s.textContent="Issue Statement")}})}const Ot=10;function Ho(a){const t=document.getElementById("pa-platform-modal");if(!t)return;const e=g.faction;g.nation;const o=e?.color||"#c8a832";let r=null,i=!1;const n={};for(const v of fe)v.faction_id!==e?.id&&(n[v.platform_key]=(n[v.platform_key]||0)+1);const d=new Set(Z.map(v=>v.platform_key));function c(){const v=ht.find(f=>f.id===r),p=`+${(be.adoptTenths/10).toFixed(1)}`,s=(be.failTenths/10).toFixed(1),l="#5cc55c",y=ht.map(f=>{const h=r===f.id,m=d.has(f.id),x=n[f.id]||0;return`<div class="pa-plat-card ${h?"selected":""} ${m?"adopted":""}" data-plat="${f.id}">
                ${m?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:17px;">${f.icon}</span>
                    <span style="font-size:12px;font-weight:700;color:${m?o:h?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${$(f.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${$(f.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${l};">${p}</span>
                    ${x>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${x} rival${x>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let u;if(!v)u=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:28px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const f=v.improve.map(_=>{const M=xe(_,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:10px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${M.color};white-space:nowrap;">${M.arrow} ${he[_]||_}</span>`}).join(""),h=v.worsen.map(_=>{const M=xe(_,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:10px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${M.color};white-space:nowrap;">${M.arrow} ${he[_]||_}</span>`}).join(""),m=d.has(v.id),x=Z.length;let b;m?b=`<div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:x>=3?b='<div style="font-family:var(--font-mono);font-size:11px;color:var(--red);">All 3 platform slots are full.</div>':i?b=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:11px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${$(v.name)}?</span>
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
                        <span style="font-size:26px;">${v.icon}</span>
                        <div>
                            <div style="font-size:19px;font-weight:700;color:var(--text-bright);">${$(v.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${$(v.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${$(v.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">POPULARITY</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${l};">${p}</span>
                                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">all sectors on adopt — per-sector boosts also apply</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${v.improve.length} stats, +${Ot} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${f}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${v.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${h}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">${$(v.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:11px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${Ot}</strong>. Failure: <strong style="color:var(--red);">${s} popularity all sectors</strong> and the per-sector boosts revert with the constituencies you wooed (the alienated stay alienated). If you don't enter government, the promise abates.
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
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=f=>{f.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",f=>{const h=f.target.closest(".pa-plat-card");h&&(r=h.dataset.plat,i=!1,c())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{i=!0,c()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{i=!1,c()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>Do(a,r))}t.classList.add("active"),c()}let Nt=!1;async function Do(a,t){if(Nt)return;Nt=!0;const e=document.getElementById("pa-platform-modal"),o=g.faction,r=g.nation;if(!o||!r||!t){Nt=!1;return}const i=ht.find(v=>v.id===t);if(!i)return;const n={},d={},c=v=>Re.has(v);for(const v of i.improve){const p=Number(r[v]??50);n[v]=p,c(v)?d[v]=Math.max(0,p-Ot):d[v]=Math.min(100,p+Ot)}try{const v=g.shard?.current_tick||0,{data:p,error:s}=await C.rpc("adopt_platform",{p_faction_id:o.id,p_nation_id:r.id,p_platform_key:t,p_tick:v,p_baseline_stats:n,p_target_stats:d});if(s){console.error("[PartyActions] Platform adoption failed:",s.message),alert("Failed to adopt platform: "+s.message);return}if(p&&!p.success){alert(p.error||"Failed to adopt platform.");return}const l=p?.slot||Z.length+1;Z.push({faction_id:o.id,nation_id:r.id,platform_key:t,slot:l,adopted_at_tick:v,baseline_stats:n,target_stats:d,status:"active"}),fe.push(Z[Z.length-1]),e?.classList.remove("active"),O(a)}catch(v){console.error("[PartyActions] Platform adoption error:",v),alert("An error occurred. Please try again.")}finally{Nt=!1}}let ut=null,aa={isGoverning:!1,statusLabel:"OPPOSITION",administration:null,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],strongholdsByParty:{},passedBills:[],sectors:[],caucuses:[],nextElection:null,nextElectionTicks:null};function U(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function qo(a,t,e){const o={};for(const r of a)o[r.id]=wa(r.id,t,e,3);return o}function jo(a,t,e){const o=new Map(a.map(i=>[i.id,i])),r=new Map;for(const i of e){const n=r.get(i.sector_id)||[];n.push({party_id:i.faction_id,popularity:Number(i.popularity)||0}),r.set(i.sector_id,n)}return t.map(i=>{const n=(r.get(i.id)||[]).filter(d=>d.popularity>0&&o.has(d.party_id)).map(d=>{const c=o.get(d.party_id);return{party_id:c.id,abbreviation:c.abbreviation||(c.faction_name||"?").slice(0,3).toUpperCase(),color:c.party_color||"#888",seats:Number(c.seats)||0,popularity:d.popularity}});return n.sort((d,c)=>c.popularity!==d.popularity?c.popularity-d.popularity:c.seats-d.seats),{sector_key:i.sector_key,name:i.name,description:i.description||"",weight:Number(i.weight)||0,candidates:n}}).sort((i,n)=>n.weight!==i.weight?n.weight-i.weight:(i.name||"").localeCompare(n.name||""))}async function Uo(a,t,e){ut=t;const o=document.getElementById(e);if(!o)return;const r=t.faction,i=t.nation,n=i?.id,d=r?.id;if(!r||!n){o.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}o.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const c=t.shard?.current_tick||0,[v,p,s,l,y,u,f,h]=await Promise.all([qe(a,n,d),a.from("factions").select("*").eq("nation_id",n).eq("faction_type","party"),a.from("sectors").select("id, sector_key, name, description, weight, base_turnout, is_active").eq("nation_id",n).eq("is_active",!0).order("display_order"),a.from("bills").select("id, bill_name, bill_type, proposed_by, passed_tick, bill_articles(selected_option:policy_options!selected_option_id(sector_effects)), bill_support(faction_id, stance)").eq("nation_id",n).eq("status","passed").not("passed_tick","is",null).order("passed_tick",{ascending:!1}).limit(15),Promise.resolve({data:[],error:null}),a.from("elections").select("*").eq("nation_id",n).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5),a.from("ministries").select("party_id").eq("nation_id",n).eq("is_active",!0),ca(n)]);p.error&&console.error("[PartyOverview] Parties fetch error:",p.error.message),s.error&&console.error("[PartyOverview] Sectors fetch error:",s.error.message),y.error&&console.error("[PartyOverview] Caucus fetch error:",y.error.message),u.error&&console.error("[PartyOverview] Election fetch error:",u.error.message),l.error&&console.error("[PartyOverview] Passed-bills fetch error:",l.error.message);const m=p.data||[],x=s.data||[],b=v.administration,_=new Set((f.data||[]).map(I=>I.party_id).filter(Boolean));let M=[];if(m.length>0&&x.length>0){const I=m.map(z=>z.id),{data:N,error:A}=await a.from("faction_sector_popularity").select("faction_id, sector_id, popularity").in("faction_id",I);A&&console.error("[PartyOverview] Popularity fetch error:",A.message),M=N||[]}const w=qo(m,x,M),k=jo(m,x,M),E=b?.started_at_tick!=null?Math.max(0,c-b.started_at_tick):0,S=u.data||[],L=S[0]||null,T=L?Math.max(0,L.election_tick-c):null;let P=null;L&&i&&kt(i)&&(P=S.some(N=>N.election_type==="presidential"&&N.election_tick===L.election_tick)?"General":"Midterm"),aa={isGoverning:v.isGoverning,statusLabel:v.label,administration:b,ministryPartyIds:_,ticksInPower:E,myFaction:r,allParties:m,rivalParties:m.filter(I=>I.id!==d),blocMap:h,strongholdsByParty:w,sectorRanking:k,passedBills:l.data||[],sectors:x,caucuses:y.data||[],nextElection:L,nextElectionTicks:T,nextElectionLabel:P},Go(o)}catch(c){console.error("[PartyOverview] Init error:",c),o.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}function Go(a){const t=aa,e=t.myFaction,o=ut.nation,r=e?.party_color||e?.color||"#c8a832";ut.shard?.current_tick,t.administration?.admin_name||t.isGoverning;const i=t.statusLabel,n=t.isGoverning?"var(--green)":"var(--orange)",d=e?.seats||0,c=o?.total_seats||100,v=e?.momentum??50;a.innerHTML=`<div class="po-page">
        ${Vo(t,r,d,c,v)}
        <div class="po-columns">
            <div class="po-col-left">
                ${Yo(t,e,r,i,n)}
                ${Wo(t,e,r)}
                ${Ko(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${Jo()}
                ${Zo(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${ti(t,e)}
                ${ei()}
            </div>
        </div>
    </div>`}function Vo(a,t,e,o,r){const i=a.isGoverning?a.administration?.admin_name||"Government":"Opposition",n=(ut.nation?.government_type||"").toLowerCase().includes("monarchy"),d=n?"No elections":a.nextElectionTicks!=null?a.nextElectionTicks:"—",c=n?"var(--text-dim)":typeof d=="number"&&d<=3?"var(--red)":"var(--text-bright)",v=n?"NEXT ELECTION":a.nextElectionLabel?"NEXT "+a.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
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
                <span class="po-summary-value" style="color:var(--orange);">${r}</span>
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
            <div class="po-summary-label">${v}</div>
            <div class="po-summary-value" style="color:${c};">${d}${typeof d=="number"?" ticks":""}</div>
        </div>
    </div>`}function Yo(a,t,e,o,r){const i=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",n=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const d=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${e};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${e};background:${e}12;border-color:${e}33;">${n}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                    <span class="po-identity-name">${U(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${r};background:${r}0a;border-color:${r}44;">${o}</span>
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
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${d}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function Wo(a,t,e){const o=t?.id,r=a.sectorRanking||[],i=(d,c)=>{const v=d.party_id===o,p=v?e:d.color||"#888",s=(Math.round(d.popularity)/10).toFixed(1),l=v?'<span class="po-stronghold-chip-label" style="font-weight:700;">You</span>':`<span class="po-stronghold-chip-label">${U(d.abbreviation)}</span>`;return`<div class="po-stronghold-chip" style="border-color:${p}66;background:${p}14;">
            ${l}
            <span class="po-stronghold-chip-label" style="color:${p};font-weight:700;margin-left:4px;">${s}</span>
        </div>`};return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTOR RANKING</span>
            <span class="po-card-subtitle">all sectors · top 3 other parties · you on the right</span>
        </div>
        <div style="padding:8px 12px;">
            ${r.map(d=>{const c=d.candidates||[],v=c.filter(x=>x.party_id!==o).slice(0,3).map(x=>i(x)).join(""),p=c.find(x=>x.party_id===o)||null,s=i(p||{party_id:o,popularity:0,color:e}),l=v?`<div class="po-stronghold-chips">${v}</div>`:'<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">No other party popularity yet</div>',y=Number(d.weight)||0,u=y>=3?"var(--gold, #c9a449)":y===2?"var(--amber, #c8a64e)":"var(--text-secondary)",f=`<span style="display:inline-block;min-width:18px;padding:1px 5px;font-family:var(--font-mono);font-size:9px;font-weight:700;color:${u};border:1px solid ${u}66;background:${u}14;text-align:center;letter-spacing:0;">w${y}</span>`,h=(d.description||"").trim(),m=h?`<div style="font-family:var(--font-mono);font-size:9.5px;color:var(--text-dim);line-height:1.4;margin-top:2px;">${U(h)}</div>`:"";return`<div class="po-stronghold-row" style="align-items:flex-start;">
            <div class="po-stronghold-party" style="min-width:0;flex:1;">
                <div style="display:flex;align-items:center;gap:8px;">
                    ${f}
                    <span class="po-stronghold-party-name">${U(d.name)}</span>
                </div>
                ${m}
            </div>
            ${l}
            <div style="margin-left:14px;padding-left:14px;border-left:1px dashed var(--border-main, rgba(255,255,255,0.1));display:flex;align-items:center;">
                ${s}
            </div>
        </div>`}).join("")||'<div style="padding:8px 0;font-size:9px;color:var(--text-dim);font-family:var(--font-mono);">No active sectors in this nation.</div>'}
        </div>
    </div>`}function Ko(a){const t=(a.caucuses||[]).filter(r=>r.name&&r.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const e=a.faction?.seats||0,o=t.map(r=>{const i=r.relationship_score??50,n=i>60?"var(--green)":i>40?"var(--amber)":"var(--red)",d=Math.round((r.seat_share||0)*e),c=(r.dominant_axis||"").replace(/_/g,"/"),v=r.wing_end==="left"?c.split("/")[0]:c.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${U(r.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${U(v)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${d} seats</span>
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
    </div>`}function Jo(){return`<div class="po-card">
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
    </div>`}function Xo(a){const t=new Map;for(const e of a.bill_articles||[]){const o=e?.selected_option?.sector_effects||[];for(const r of o){if(!r||typeof r.sector_key!="string")continue;const i=Number(r.change_tenths);!Number.isFinite(i)||i===0||t.set(r.sector_key,(t.get(r.sector_key)||0)+i)}}return Array.from(t,([e,o])=>({sector_key:e,change_tenths:o}))}function Qo(a,t){if(!a)return"";const e=a.party_color||a.color||"#888",o=a.abbreviation||(a.faction_name||"?").slice(0,3).toUpperCase(),r=t?`<span style="font-family:var(--font-mono);font-size:6px;color:${e};margin-left:3px;letter-spacing:0.05em;">SPONSOR</span>`:"";return`<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border:1px solid ${e}55;background:${e}14;font-family:var(--font-mono);font-size:8px;font-weight:700;color:${e};">${U(o)}${r}</span>`}function Ne(a,t,e){return a.length?a.map(o=>{const i=(e?-o.change_tenths:o.change_tenths)/10,n=i>0?"+":i<0?"−":"",d=Math.abs(i).toFixed(1),c=i>0?"var(--green)":i<0?"var(--red)":"var(--text-dim)",v=t.get(o.sector_key)||o.sector_key;return`<span style="white-space:nowrap;"><span style="color:${c};font-weight:700;">${n}${d}</span> <span style="color:var(--text-secondary);">${U(v)}</span></span>`}).join('<span style="color:var(--text-dim);margin:0 4px;">·</span>'):'<span style="color:var(--text-dim);">no sector effects</span>'}function Zo(a){const t=a.passedBills||[],e=ut.shard?.current_tick||0,o=t.filter(d=>!["no_confidence","minister_confirmation","foundational","veto_override"].includes(d.bill_type));if(o.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT BILLS</span>
                <span class="po-card-subtitle">passed bills · sector outcomes</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No passed bills yet.</div>
        </div>`;const r=new Map((a.allParties||[]).map(d=>[d.id,d])),i=new Map((a.sectors||[]).map(d=>[d.sector_key,d.name]));return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT BILLS</span>
            <span class="po-card-subtitle">passed bills · sector outcomes</span>
        </div>
        <div style="max-height:520px;overflow-y:auto;">${o.map(d=>{const c=Xo(d),v=e-(d.passed_tick||0),p=v===0?"just now":v+"t ago",s=new Map;for(const x of d.bill_support||[]){const b=x.stance==="accept"?"yes":x.stance==="reject"?"no":x.stance;(b==="yes"||b==="no")&&s.set(x.faction_id,b)}d.proposed_by&&s.set(d.proposed_by,"yes");const l=[],y=[];for(const[x,b]of s){const _=r.get(x);if(!_)continue;const M=Qo(_,x===d.proposed_by);b==="yes"?l.push(M):b==="no"&&y.push(M)}const u=r.get(d.proposed_by),f=u?`<span style="color:${u.party_color||u.color||"#888"};font-weight:700;">${U(u.abbreviation||u.faction_name||"?")}</span>`:'<span style="color:var(--text-dim);">unknown</span>',h=l.length?`<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--green);letter-spacing:0.05em;width:36px;flex-shrink:0;">GAINED</span>
                    ${l.join("")}
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
                <span style="font-size:10px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${U(d.bill_name||"Untitled bill")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);flex-shrink:0;">${p}</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:1px;">sponsored by ${f}</div>
            ${h}
            ${m}
        </div>`}).join("")}</div>
    </div>`}function ti(a,t){const e=a.rivalParties,o=a.administration,r=ut.nation,i=o?.pm_party_id,n=r?.total_seats||100,d=e.map(c=>{const v=c.party_color||"#666",p=c.abbreviation||c.faction_name?.slice(0,3)?.toUpperCase()||"?",s=c.leader_first_name&&c.leader_last_name?`${c.leader_first_name} ${c.leader_last_name}`:"Unknown",l=c.seats||0,y=Sa(c,o,a.ministryPartyIds,r);let u=y.label;const f=y.isGoverning?"var(--green)":"var(--orange)";y.isGoverning&&y.label==="GOVERNING"&&(c.id===i?u="GOVERNING — LEAD":u="GOVERNING — JUNIOR");const h=l-(t?.seats||0),m=h>0?"var(--green)":h<0?"var(--red)":"var(--text-dim)",x=a.strongholdsByParty?.[c.id]||[],b=x.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;">${x.map(_=>`<span style="font-family:var(--font-mono);font-size:9px;padding:2px 6px;border:1px solid ${v}44;background:${v}10;color:var(--text-bright);white-space:nowrap;">${U(_.name)}</span>`).join("")}</div>`:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Unaligned</div>';return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${v}15;border:1px solid ${v}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${v};">${U(p)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${U(c.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${U(s)}</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${f};background:${f}0a;border:1px solid ${f}44;white-space:nowrap;">${u}</span>
                    ${Pe(c.bloc_id,a.blocMap)}
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${l>0?"var(--text-bright)":"var(--text-dim)"};">${l}</span>
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
        ${d||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`}function ei(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--text-bright);font-weight:700;">Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let xt=null,nt=[],le=[],gt={},Ft=null;function D(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function Bt(a){return a>=1e6?(a/1e6).toFixed(2)+"M":a>=1e3?Math.round(a/1e3)+"k":String(a)}function oa(a){return["January","February","March","April","May","June","July","August","September","October","November","December"][a%12]+", "+(2e3+Math.floor(a/12))}function ai(a,t){if((a.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const o=t?.end_reason||"";return o.includes("no_confidence")||o.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:o.includes("snap")||o.includes("dissolved")||o.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function oi(a,t){xt=t;const e=document.getElementById("pa-past-elections-root");if(!e)return;e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const o=t.nation?.id;if(!o){e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[r,i,n]=await Promise.all([a.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",o).eq("status","completed").order("election_tick",{ascending:!1}),a.from("administrations").select("*").eq("nation_id",o).order("started_at_tick",{ascending:!1}),a.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",o).eq("faction_type","party").is("abandoned_at",null)]);nt=r.data||[],le=i.data||[];const d=n.data||[];gt={};for(const c of d)gt[c.id]=c;for(const c of nt){const v=c.results?.votes||[];for(const s of v){const l=gt[s.party_id];s.color=l?.party_color||"#666",s.abbreviation=l?.abbreviation||s.party_name?.slice(0,3)?.toUpperCase()||"?"}const p=c.results?.presidential_candidates||[];for(const s of p){const l=gt[s.faction_id];s.color=l?.party_color||"#666",s.abbreviation=l?.abbreviation||s.party_name?.slice(0,3)?.toUpperCase()||"?"}}ii(e),ia(e)}function ii(a){a.addEventListener("click",t=>{const e=t.target.closest("[data-election-id]");if(e){const o=e.dataset.electionId;Ft=Ft===o?null:o,ia(a)}})}function ni(a){const t=Ft===a.id,e=(a.results?.presidential_candidates||[]).slice().sort((f,h)=>(h.votes||0)-(f.votes||0)),o=e.find(f=>f.winner)||null,r=a.results?.turnout_pct??0,i=a.results?.total_votes_cast??0,n=oa(a.election_tick),d="#5a8aaa",c=xt.faction?.id,v=a.results?.was_runoff===!0,p=v&&Array.isArray(a.results?.round_1_candidates)?[...a.results.round_1_candidates].sort((f,h)=>(h.votes||0)-(f.votes||0)):null;if(p)for(const f of p){const h=gt[f.faction_id];f.color=h?.party_color||f.color||"#666",f.abbreviation=h?.abbreviation||f.abbreviation||f.party_name?.slice(0,3)?.toUpperCase()||"?"}const s=e.slice(0,3),l=o?`${o.candidate_name||""}`.trim():"",y=o?.color||"#888";let u=`<div data-election-id="${a.id}" style="
        background:var(--bg-panel);border:1px solid var(--border-main);
        ${t?"border-bottom:none;":""}
    ">
        <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${n}</div>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${d};background:${d}0a;border:1px solid ${d}25;">PRESIDENTIAL ELECTION</span>
                ${v?'<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:#d4a83c;background:rgba(212,168,60,0.08);border:1px solid rgba(212,168,60,0.3);">RUNOFF</span>':""}
                <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                    ${s.map(f=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${f.color};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${D(f.abbreviation)}</span>
                        <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${(f.vote_percentage||0).toFixed(1)}%</span>
                    </div>`).join("")}
                </div>
            </div>
            <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                    President: <span style="color:${y};font-weight:700;">${D(l||"No winner")}</span>
                </div>
                <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${t?"▲":"▼"}</span>
            </div>
        </div>
    </div>`;if(t){const f=e.reduce((k,E)=>k+(Number(E.vote_percentage)||0),0)||100,h=e.map(k=>{const E=(Number(k.vote_percentage)||0)/f*100,S=(k.vote_percentage||0).toFixed(1);return`<div style="width:${E}%;background:${k.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${E>=8?9:6}px;font-weight:700;color:#000;">${E>=5?S+"%":""}</div>`}).join(""),m=e.map(k=>{const E=k.faction_id===c,S=!!k.winner;return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${E?`background:${k.color}08;`:""}">
                <div class="pe-col-logo" style="width:30px;height:30px;background:${k.color}15;border:1px solid ${k.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${(k.abbreviation||"?").slice(0,2)}</div>
                <div class="pe-col-party" style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:5px;">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${D(k.candidate_name||"Unknown")}</span>
                        ${S?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">WINNER</span>':""}
                        ${E?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:${k.color};">${D(k.party_name||"")}</div>
                </div>
                <span class="pe-col-votes" style="width:90px;text-align:right;font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright);">${Bt(k.votes||0)}</span>
                <span class="pe-col-pct" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(k.vote_percentage||0).toFixed(1)}%</span>
            </div>`}).join(""),x=o?v?"Won Runoff":"Elected Outright":null,b=v?"#d4a83c":"#5c5",_=o?`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${y};">
            <div style="padding:12px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">PRESIDENT-ELECT</span>
                    ${x?`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${b};background:${b}0a;border:1px solid ${b}30;">${D(x).toUpperCase()}</span>`:""}
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;background:${y}15;border:1.5px solid ${y};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${y};">${D((l||"?").split(" ").map(k=>k[0]||"").join("").slice(0,3))}</div>
                    <div>
                        <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${D(l)}</div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">President &middot; ${D(o.party_name||"")} &middot; ${(o.vote_percentage||0).toFixed(1)}% of vote${v?" (runoff)":""}</div>
                    </div>
                </div>
            </div>
        </div>`:"",M=new Set(e.map(k=>k.candidate_id)),w=v&&p&&p.length>0?`
            <div style="padding:12px 20px;border-bottom:1px solid var(--border-main);background:rgba(212,168,60,0.04);">
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:#d4a83c;">ROUND 1 — NO MAJORITY</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Top 2 advanced to runoff</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                    ${p.map(k=>{const E=M.has(k.candidate_id),S=(Number(k.vote_percentage)||0).toFixed(1);return`<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:${E?"rgba(91,155,213,0.06)":"transparent"};border-left:2px solid ${E?"#5b9bd5":"transparent"};">
                            <div style="width:10px;height:10px;background:${k.color};flex-shrink:0;"></div>
                            <span style="flex:1;font-size:12px;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${D(k.candidate_name||"Unknown")}</span>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);min-width:56px;text-align:right;">${D(k.party_name||"")}</span>
                            <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${E?"#5b9bd5":"var(--text-secondary)"};min-width:48px;text-align:right;">${S}%</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${E?"#5b9bd5":"#888"};min-width:80px;text-align:right;">${E?"ADVANCED":"ELIMINATED"}</span>
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
                        <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${r>70?"#5c5":r>60?"#ca5":"#c84"};">${r.toFixed(1)}%</div>
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
            ${w}
            <div style="padding:0 20px;">
                <div class="pe-tbl-head" style="display:flex;padding:8px 0;border-bottom:1px solid var(--border-main);font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">
                    <span class="pe-col-logo" style="width:30px;"></span>
                    <span class="pe-col-party" style="flex:1;">${v?"RUNOFF — FINAL RESULTS":"CANDIDATE"}</span>
                    <span class="pe-col-votes" style="width:90px;text-align:right;">VOTES</span>
                    <span class="pe-col-pct" style="width:70px;text-align:right;">VOTE %</span>
                </div>
                ${e.length>0?m:'<div style="padding:20px 0;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:11px;">No candidate data on record.</div>'}
            </div>
            ${_}
        </div>`}return u}function ia(a){if(nt.length===0){a.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const t=xt.faction?.id,e=xt.nation?.total_seats||100,o=Math.ceil(e/2)+1,r=nt.map((i,n)=>{if(i.election_type==="presidential")return ni(i);const d=Ft===i.id,c=(i.results?.votes||[]).sort((E,S)=>(S.seats||0)-(E.seats||0)),v=c.slice(0,3),p=i.results?.turnout_pct??0,s=i.results?.total_votes_cast??0,l=i.results?.sector_breakdown?.independent_seats??0,y=oa(i.election_tick),u=le.find(E=>E.started_at_tick>=i.election_tick&&E.started_at_tick<=i.election_tick+5),f=le.find(E=>E.ended_at_tick!=null&&E.ended_at_tick>=i.election_tick-2&&E.ended_at_tick<=i.election_tick+2),h=ai(i,f),m=kt(xt.nation),x=m?"President":"PM",b=u?.prime_minister||"Unknown",_=u?.pm_party_id&&c.find(E=>E.party_id===u.pm_party_id)?.color||"#888",w=(n<nt.length-1?nt[n+1]:null)?.results?.votes||[];let k=`<div data-election-id="${i.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${d?"border-bottom:none;":""}
        ">
            <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                    <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${y}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${h.color};background:${h.color}0a;border:1px solid ${h.color}25;">${h.label.toUpperCase()}</span>
                    <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                        ${v.map(E=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${E.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${D(E.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${E.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${x}: <span style="color:${_};font-weight:700;">${D(b)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${d?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(d){const E=c.map(I=>`<div style="width:${I.seats/e*100}%;background:${I.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${I.seats>=8?9:6}px;font-weight:700;color:#000;">${I.seats>=5?I.seats:""}</div>`).join(""),S=l>0?`<div style="width:${l/e*100}%;background:#ffffff;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${l>=8?9:6}px;font-weight:700;color:#000;" title="Independents">${l>=5?l:""}</div>`:"",L=E+S,T=c.map(I=>{const N=I.party_id===t,A=w.find(et=>et.party_id===I.party_id),z=A?I.seats-(A.seats||0):null,Y=I.seats/e*100-(I.vote_percentage||0);return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${N?`background:${I.color}08;`:""}">
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
                </div>`}).join("")+(l>0?`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;color:#fff;">IN</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);">Independents</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:#cccccc;">IND</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${l}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">—</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">—</span>
                </div>`:"");let P="";if(u){const I=u.coalition_parties||[],N=u.total_seats||I.reduce((J,It)=>J+(It.seats||0),0),A=N>=o,z=A?"Majority Coalition":"Minority Coalition",q=u.ended_at_tick?u.end_reason||"Ended":"Current Government",Y=u.ended_at_tick?"var(--text-dim)":"#5c5",et=u.ended_at_tick?Math.abs(u.ended_at_tick-u.started_at_tick)+" ticks":"Ongoing",ra=I.map(J=>{const It=c.find(Dt=>Dt.party_id===J.party_id)?.color||"#666";return`<div style="width:${N>0?(J.seats||0)/N*100:0}%;background:${It};height:100%;"></div>`}).join(""),sa=I.map(J=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${c.find(Dt=>Dt.party_id===J.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${D(J.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${J.seats||0}</span>
                    </div>`).join("");P=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${_};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${Y};background:${Y}0a;border:1px solid ${Y}25;">${D(q.toUpperCase())}</span>
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
                </div>`}k+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
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
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${Bt(s)}</div>
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
            </div>`}return k}).join("");a.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${nt.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${r}</div>
    </div>`}let Q=null,de=!1,Ae=!1,ce=!1,Te=!1,pe=!1;function na(a){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===a)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+a)),sessionStorage.setItem("party_subtab",a),a==="actions"&&!de&&Q&&(de=!0,Ye(pt,Q)),a==="parties"&&!Ae&&Q&&(Ae=!0,Uo(pt,Q,"pa-parties-root")),a==="election"&&!ce&&Q&&(ce=!0,pe?oe(document.getElementById("pa-election-root")):Oe(pt,Q).then(()=>{pe=!0,oe(document.getElementById("pa-election-root"))})),a==="past-elections"&&!Te&&Q&&(Te=!0,oi(pt,Q))}document.getElementById("pa-subtabs").addEventListener("click",a=>{const t=a.target.closest(".pa-subtab");!t||t.classList.contains("active")||na(t.dataset.panel)});pa("politics",async a=>{Q=a,Oe(pt,a).then(()=>{pe=!0,ce&&oe(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?na(t):(de=!0,await Ye(pt,a))});
