import{_ as mt}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{h as va,l as ua,c as qe,i as ya}from"./common-D2-5e1SV.js";import{t as _e,x as He}from"./utils-CzgKGX6o.js";import{P as _t,B as De,f as ga,b as $e,s as we,S as ke,i as je,r as ne}from"./coalition-formation-CNqIqIh4.js";import{g as Ge,r as ba,m as xa,n as ha,o as _a,V as $a,p as wa,q as ka,t as Ea,u as Ca}from"./political-actions-gAjzq9PT.js";import{a as K,h as Et,b as Ue,k as Gt}from"./government-types-BeJIFjWQ.js";import{f as Ye}from"./government-structure-DBjJ7E-l.js";import{GAME_CONFIG as O,FORMATION_DEADLINE_TICKS as Ve}from"./config-BER7HlcX.js";import{i as Ia,g as Sa}from"./elections-D08wBYru.js";import{d as La}from"./factions-C2s734Ze.js";import{I as Ma,M as Na}from"./issues-C728v86F.js";import{b as Ta}from"./event-helpers-C1AdfzfR.js";import"./preload-helper-BXl3LOEh.js";import"./stats-C5reUrev.js";import"./diplomacy-constants-DDYAx-fT.js";import"./electorate-DxBETa3S.js";import"./presidential-Bk0DF6qw.js";import"./budget-BS9gjSls.js";function J(a){if(a==null)return"";const t=document.createElement("div");return t.textContent=String(a),t.innerHTML}function Aa(a,t){if(!a)return{roles:null,panel:null};const e=t.entityColor||"#c8a832",o=(t.stats||[]).map(i=>`
        <div class="pa-header-stat">
            <div class="pa-header-stat-label">${J(i.label)}</div>
            <div class="pa-header-stat-value"${i.color?` style="color:${i.color};"`:""}>${J(i.value)}</div>
        </div>
    `).join(""),s=(t.statusBarItems||[]).map(i=>i.type==="count"?`
                <div class="pa-status-item">
                    <div class="pa-status-label">${J(i.label)}</div>
                    <div class="pa-status-value">
                        <span class="pa-status-big"${i.bigColor?` style="color:${i.bigColor};"`:""}>${J(i.big)}</span>
                        ${i.dim1?`<span class="pa-status-dim">${J(i.dim1)}</span>`:""}
                        ${i.dim2?`<span class="pa-status-dim">${J(i.dim2)}</span>`:""}
                    </div>
                </div>
            `:i.type==="list"?`
                <div class="pa-status-item">
                    <div class="pa-status-label">${J(i.label)}</div>
                    <div style="display:flex;gap:4px;margin-top:3px;">
                        ${(i.items||[]).map(n=>`<span class="pa-platform-slot ${n.statusClass||""}"${n.title?` title="${J(n.title)}"`:""}>${J(n.label)}</span>`).join("")}
                    </div>
                </div>
            `:"").join("");return a.innerHTML=`
        <div class="pa-page">
            <div class="pa-header">
                <div class="pa-header-left">
                    <span class="pa-title" style="color:${e};">${J(t.title)}</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${e};"></div>
                        <span class="pa-party-name">${J(t.entityName||"")}</span>
                    </div>
                </div>
                <div class="pa-header-stats">${o}</div>
            </div>
            <div class="pa-status-bar">${s}</div>
            <div class="pa-main">
                <div class="pa-leaders" id="${t.rolesContainerId}"${t.rolesColumnWidth?` style="width:${typeof t.rolesColumnWidth=="number"?t.rolesColumnWidth+"px":t.rolesColumnWidth};"`:""}></div>
                <div class="pa-actions-panel" id="${t.panelContainerId}"></div>
            </div>
        </div>
        ${t.extraHtml||""}
    `,{roles:document.getElementById(t.rolesContainerId),panel:document.getElementById(t.panelContainerId)}}function Pa(a,t){return a.map(e=>{const o=_t.find(i=>i.id===e.platform_key);if(!o)return{...e,stats:[]};const s=o.improve.map(i=>{const n=e.baseline_stats?.[i],l=e.target_stats?.[i],c=Number(t?.[i]??50),f=De.has(i);if(n==null||l==null)return{stat:i,baseline:c,target:c,current:c,progress:0,met:!1};const m=Math.abs(l-n),r=f?Math.max(0,n-c):Math.max(0,c-n),d=m>0?Math.min(1,r/m):1,u=f?c<=l:c>=l;return{stat:i,baseline:n,target:l,current:c,progress:d,met:u}});return{...e,stats:s,platformDef:o}})}const za=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function ct(a){return a>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:a>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:a>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:a>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function Ra(a){var t=Math.max(0,a-20)/65,e=12e4+t*28e4;return Math.round(e/25e3)*25e3}function Yt(a,t){return a+Math.floor(Math.random()*(t-a+1))}function Ee(a){return a[Math.floor(Math.random()*a.length)]}function Oa(a,t){var e=[],o=new Set,s=Yt(5,7),i=Ge(t),n=i.firstNames||[],l=i.lastNames||[];if(n.length===0||l.length===0)return[];for(var c=za.slice().sort(function(){return Math.random()-.5}),f=0;f<s;f++){var m,r,d,u=0;do m=Ee(n),r=Ee(l),d=m+" "+r,u++;while(o.has(d)&&u<20);o.add(d);var y=Yt(20,85),v=Yt(25,60),_=c[f%c.length],p=Ra(y);e.push({nation_id:a,first_name:m,last_name:r,age:v,skill:y,background:_,hire_cost:p,status:"available"})}return e.sort(function(x,g){return g.skill-x.skill}),e}async function We(a,t,e){var{data:o}=await a.from("nations").select("government_type, monarch_faction_id").eq("id",t).maybeSingle();if(K(o))return re({partyId:e,admin:null,ministryHolder:!1,nation:o});var[s,i,n,l]=await Promise.all([Ye(a,t).catch(function(p){return console.warn("[Agitator] fetchActiveCoalition failed:",p?.message||p),null}),a.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),a.from("head_of_government").select("faction_id").eq("nation_id",t).eq("active",!0).maybeSingle(),a.from("presidents").select("faction_id").eq("nation_id",t).eq("is_active",!0).maybeSingle()]);if(i.error)return console.error("[Agitator] Failed to check governing status:",i.error.message),{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var c=i.data,f=s,m=Et(o),r=n?.data?.faction_id||null,d=l?.data?.faction_id||null,u=Array.isArray(f?.party_ids)?f.party_ids.map(function(p){return{party_id:p}}):[];if(c){c.pm_party_id=r,c.president_party_id=d;var y=Array.isArray(c.coalition_parties)?c.coalition_parties:[];y.length===0&&u.length>0&&(c.coalition_parties=u)}else(f||r||d)&&(c={pm_party_id:r,president_party_id:d,coalition_parties:u});var v=!1;if(m){var{count:_}=await a.from("ministries").select("*",{count:"exact",head:!0}).eq("nation_id",t).eq("party_id",e).eq("is_active",!0);v=(_||0)>0}return re({partyId:e,admin:c,ministryHolder:v,nation:o})}function Ba(a,t,e,o){return re({partyId:a?.id,admin:t,ministryHolder:e?e.has(a?.id):!1,nation:o})}function re({partyId:a,admin:t,ministryHolder:e,nation:o}){if(K(o)){var s=o?.monarch_faction_id||null,i=!!(s&&a&&s===a);return{isGoverning:i,isOpposition:!i,label:i?"GOVERNING":"OPPOSITION",administration:null}}if(!t)return{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var n=Array.isArray(t.coalition_parties)?t.coalition_parties:[],l=n.some(function(r){return r?typeof r=="string"?r===a:typeof r=="object"?(r.party_id||r.id)===a:!1:!1}),c=t.pm_party_id===a,f=t.president_party_id===a,m=c||l||f||Et(o)&&!!e;return{isGoverning:m,isOpposition:!m,label:m?"GOVERNING":"OPPOSITION",administration:t}}async function Ke(a,t){var{data:e,error:o}=await a.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return o?(console.error("[Agitator] Failed to fetch agitator:",o.message),null):e}async function Fa(a,t,e){var{data:o,error:s}=await a.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(o&&o.length>0)return o;var i=Oa(t,e),{data:n,error:l}=await a.from("agitator_pool").insert(i).select("*");return l?(console.error("[Agitator] Failed to insert pool:",l.message),[]):(n||[]).sort(function(c,f){return f.skill-c.skill})}async function qa(a,t,e,o){var s=await Ke(a,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:i,error:n}=await a.from("faction_agitators").insert({faction_id:t,first_name:e.first_name,last_name:e.last_name,age:e.age,skill:e.skill,background:e.background,status:"active",hired_at_tick:o}).select("*").single();if(n)return console.error("[Agitator] Failed to hire:",n.message),{success:!1,agitator:null,error:n.message};var{error:l}=await a.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",e.id);return l&&console.error("[Agitator] Failed to mark pool candidate as hired:",l.message),{success:!0,agitator:i,error:null}}const Ot=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],Je=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function ue(a){return a<=5?{tier:1,label:"Clean Government",color:"#c55"}:a<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:a<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const nt={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5},gov:{momentum:3}},2:{resolution:"PARTIAL WIN",filer:{momentum:3},gov:{momentum:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7},gov:{momentum:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12},gov:{momentum:-10}}},Ce={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function gt(a,t){var e=a;for(var o in t)e=e.split("{"+o+"}").join(t[o]);return e}async function Ha(a,t){var{factionId:e,nationId:o,agitatorId:s,targetMinistry:i,basis:n,currentTick:l,partyName:c,administration:f}=t,m,r,d;if(n==="civil_rights"){var u=Number(f?.stats_at_start?.freedom_index??50);r=50,m=u,d=Math.max(0,m-r)}else{var y=Number(f?.stats_at_start?.corruption??50);r=50,m=y,d=Math.max(0,r-m)}var y=m,v=r,_=ue(d),p=nt[_.tier],x=l+8,g=Ot.find(function(T){return T.key===i}),h=g?"Ministry of "+g.label:i,I=Je.find(function(T){return T.key===n}),w=I?I.label:n,{data:k,error:C}=await a.from("lawsuits").insert({faction_id:e,nation_id:o,agitator_id:s,target_ministry:i,basis:n,filed_at_tick:l,resolves_at_tick:x,corruption_at_start:y,corruption_at_filing:v,corruption_growth:d,tier:_.tier,status:"active",resolution:null,momentum_effect:p.filer.momentum,gov_momentum_effect:p.gov.momentum}).select("*").single();if(C)return{success:!1,lawsuit:null,tier:0,error:C.message};var S=Ce[_.tier]||Ce[1],M={party:c||"Opposition",ministry:h,basis:w},A=[{event_tick:l,event_type:"filing",headline:gt(S.filing,M)},{event_tick:l+2,event_type:"discovery",headline:gt(S.discovery,M)},{event_tick:l+5,event_type:"evidence",headline:gt(S.evidence,M)},{event_tick:l+7,event_type:"pre_trial",headline:gt(S.pre_trial,M)},{event_tick:x,event_type:"resolution",headline:gt(S.resolution,M)}],P=A.map(function(T){return{lawsuit_id:k.id,nation_id:o,event_tick:T.event_tick,event_type:T.event_type,headline:T.headline,is_fired:T.event_tick===l}}),{error:L}=await a.from("lawsuit_events").insert(P);L&&console.error("[Lawsuits] Failed to insert milestone events:",L.message);var{error:N}=await a.from("event_log").insert({nation_id:o,event_name:"LAWSUIT FILED",event_type:"lawsuit",category:"political",description_chosen:A[0].headline,fired_at_tick:l,faction_id:e||null,effects_applied:{lawsuit_id:k.id,tier:_.tier,target_ministry:h,basis:w,milestone:"filing"}});return N&&console.warn("[Lawsuits] event_log insert (filing) failed:",N.message),{success:!0,lawsuit:k,tier:_.tier,error:null}}async function Da(a,t){var{data:e,error:o}=await a.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return o?(console.error("[Lawsuits] Failed to fetch lawsuits:",o.message),[]):e||[]}async function ja(a,t,e){const o=[],s=t.overreach_count??0,i=s>=O.IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD;o.push({type:"abuse_of_power",label:"Abuse of Power",available:i,reason:i?"":`Requires presidential overreach ≥ ${O.IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD} (currently ${s})`});const n=t.gov_approval??40,l=O.IMPEACHMENT_INCOMPETENCE_TICKS;let c=!1,f="";if(e&&e.faction_id){const{data:p}=await a.from("factions").select("nation_id, abandoned_at, is_banned").eq("id",e.faction_id).maybeSingle(),x=La(p);x&&(c=!0,f=x==="unassigned"?"unassigned to any nation":x)}let m=!1,r=0;if(n<=O.IMPEACHMENT_INCOMPETENCE_THRESHOLD){const{data:p}=await a.from("nations_history").select("tick, gov_approval").eq("nation_id",t.id).order("tick",{ascending:!1}).limit(l);r=(p||[]).filter(x=>x.gov_approval<=O.IMPEACHMENT_INCOMPETENCE_THRESHOLD).length,m=p&&p.length>=l&&r>=l}const d=c||m;let u="Gross Incompetence",y="";d?c&&(u=`Gross Incompetence (party ${f})`):y=`Requires gov approval ≤ ${O.IMPEACHMENT_INCOMPETENCE_THRESHOLD} for ${l} consecutive ticks (${r}/${l} met, currently ${Math.round(n)}), or the president's party to become inactive`,o.push({type:"incompetence",label:u,available:d,reason:y});let v=0;if(e){const{data:p}=await a.from("bills").select("id, bill_support(stance, seat_count)").eq("nation_id",t.id).eq("president_action","vetoed").gte("president_action_tick",e.elected_tick||0),x=Math.ceil(O.TOTAL_SEATS*(2/3));for(const g of p||[]){let h=0;for(const I of g.bill_support||[])(I.stance==="accept"?"yes":I.stance==="reject"?"no":I.stance)==="yes"&&(h+=I.seat_count||0);h>=x&&v++}}const _=v>=O.IMPEACHMENT_VETO_ABUSE_COUNT;return o.push({type:"constitutional_violation",label:"Constitutional Violation",available:_,reason:_?"":`Requires ≥ ${O.IMPEACHMENT_VETO_ABUSE_COUNT} vetoed bills with ⅔ support (currently ${v})`}),o}function pt(a){return String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}async function Ga(a,t){const{faction:e,nation:o,president:s,isPresidentParty:i,mySeats:n,currentTick:l}=t||{};if(!e||!o||!s)return{ok:!1};if((n||0)<1)return alert("Need at least 1 seat in the legislature to file impeachment."),{ok:!1};if(i)return alert("The president's own party cannot file impeachment."),{ok:!1};const{data:c}=await a.from("impeachment_proceedings").select("id").eq("nation_id",o.id).neq("phase","resolved").limit(1).maybeSingle();if(c)return alert("An impeachment proceeding is already active."),{ok:!1};if(o.impeachment_cooldown_until_tick&&l<o.impeachment_cooldown_until_tick){const p=o.impeachment_cooldown_until_tick-l;return alert(`Impeachment cooldown: ${p} tick${p!==1?"s":""} remaining.`),{ok:!1}}const f=await ja(a,o,s);if(!f.some(p=>p.available))return alert("No impeachment charges are currently available. All charges require specific preconditions to be met."),{ok:!1};const m=f.map(p=>{const x=p.available?"":"disabled",g=p.available?"":"opacity:0.4;",h=p.reason?` title="${pt(p.reason)}"`:"";return`<label style="display:block;margin:8px 0;${g}"${h}>
            <input type="checkbox" name="impeach-charge" value="${pt(p.type)}" ${x} style="margin-right:8px;">
            <strong>${pt(p.label)}</strong>${p.reason?` <span style="font-size:0.7rem;color:var(--text-secondary);">(${pt(p.reason)})</span>`:""}
        </label>`}).join(""),r=document.createElement("div");r.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;",r.innerHTML=`
        <div style="background:var(--bg-panel);border:1px solid var(--border-0);border-radius:3px;padding:24px;max-width:440px;width:90%;max-height:80vh;overflow-y:auto;">
            <div style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--red);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;">⚖ IMPEACH PRESIDENT</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">
                President ${pt(s.first_name)} ${pt(s.last_name)}
            </div>
            <div style="font-size:0.8rem;color:var(--text-primary);margin-bottom:12px;">Select at least one charge:</div>
            <div id="impeach-charges-list">${m}</div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-hair);font-size:0.75rem;color:var(--text-secondary);line-height:1.5;">
                <div>Cost: <strong style="color:var(--amber);">FREE</strong></div>
                <div>Committee debate: ${O.IMPEACHMENT_COMMITTEE_TICKS} ticks → Floor vote: ${O.IMPEACHMENT_MOTION_VOTING_TICKS} ticks</div>
                <div>Requires <strong style="color:var(--green);">simple majority</strong> (50%+1 of all seats) to impeach</div>
                <div style="margin-top:6px;">If impeached → Trial: ${O.IMPEACHMENT_TRIAL_TICKS}-tick conviction vote (⅔ supermajority)</div>
            </div>
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button id="impeach-cancel-btn" style="flex:1;padding:10px;background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border-0);border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Cancel</button>
                <button id="impeach-confirm-btn" style="flex:1;padding:10px;background:var(--red);color:#fff;border:none;border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">File Impeachment</button>
            </div>
        </div>`,document.body.appendChild(r);const d=await new Promise(p=>{r.querySelector("#impeach-cancel-btn").addEventListener("click",()=>p(null)),r.addEventListener("click",x=>{x.target===r&&p(null)}),r.querySelector("#impeach-confirm-btn").addEventListener("click",()=>{const x=[...r.querySelectorAll('input[name="impeach-charge"]:checked')].map(g=>g.value);if(x.length===0){alert("Select at least one charge.");return}p(x)})});if(r.remove(),!d)return{ok:!1};const u=d.map(p=>{const x=f.find(g=>g.type===p);return{type:p,label:x.label}}),y=`${s.first_name} ${s.last_name}`,v=`Articles of Impeachment Against President ${y}`,_=u.map(p=>p.label).join(", ");try{const{data:p}=await a.from("shard").select("current_tick").eq("name","Alpha Shard").single(),x=p?.current_tick||0,{data:g,error:h}=await a.from("impeachment_proceedings").insert({nation_id:o.id,president_id:s.id,initiated_by_faction_id:e.id,charges:u,phase:"motion_committee",created_at_tick:x}).select().single();if(h)throw h;const{data:I,error:w}=await a.from("bills").insert({nation_id:o.id,proposed_by:e.id,proposed_tick:x,bill_name:v,bill_type:"impeachment_motion",status:"committee",impeachment_id:g.id,proposer_name:e.faction_name,proposer_color:e.party_color,preamble:`This motion, filed by the ${e.faction_name}, calls for the impeachment of President ${y} on the following charges: ${_}. After ${O.IMPEACHMENT_COMMITTEE_TICKS} ticks of committee debate, the motion will proceed to a floor vote requiring an absolute majority (${O.MAJORITY_SEATS} of ${O.TOTAL_SEATS} seats) to pass.`}).select().single();if(w)throw w;await a.from("impeachment_proceedings").update({motion_bill_id:I.id}).eq("id",g.id);const{count:k}=await a.from("impeachment_proceedings").select("id",{count:"exact",head:!0}).eq("nation_id",o.id).neq("phase","resolved");if(k>1)return await a.from("bills").delete().eq("id",I.id),await a.from("impeachment_proceedings").delete().eq("id",g.id),alert("Another impeachment proceeding was just filed. Please refresh."),{ok:!1};await a.from("bill_support").upsert({bill_id:I.id,faction_id:e.id,stance:"yes",seat_count:n},{onConflict:"bill_id,faction_id"});const{error:C}=await a.from("event_log").insert({nation_id:o.id,event_name:`Impeachment Motion Filed Against President ${y}`,category:"government",trigger_key:"impeachment_motion_filed",description_chosen:`The ${e.faction_name} has filed articles of impeachment against President ${y}. Charges: ${_}. A ${O.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate will precede the floor vote.`,fired_at_tick:x});return C&&console.warn("[impeachment] event_log insert failed:",C.message),alert(`⚖ "${v}" has been filed!

${O.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate begins now. The motion will then proceed to a floor vote.`),window.location.href=`bill.html?id=${I.id}`,{ok:!0,billId:I.id}}catch(p){return console.error("[impeachment] file failed:",p?.message||p),alert("Error: "+(p?.message||p)),{ok:!1}}}let E=null,b=null,U="leader",tt=[],ye=[],j=null,B=null,st=!1,F=null,vt=[],se=[],ft=!1,it=null,W=null,$t=!1;const Lt=new Set;let lt=null,q=null,et=!1,xt=[],Mt=!1,Vt=!1,zt=new Set;function $(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function Q(a,t){return((a||"?")[0]+(t||"?")[0]).toUpperCase()}const Xe=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}];let wt=0,Bt=0,le=!1,Y={eligible:!1,lockReason:"Loading...",metaLine:""};async function Ua(){if(!E||!b?.faction?.id||!b?.shard?.current_tick)return;const{count:a,error:t}=await E.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",b.faction.id).eq("action_type","fundraise").eq("tick_performed",b.shard.current_tick);wt=!t&&a!=null?a:0}async function Ya(){if(Bt=0,le=!1,!E||!b?.nation?.id||!b?.shard?.current_tick)return;const a=b.shard.current_tick,t=F?.pm_party_id;try{const{data:e}=await E.from("bills").select("id").eq("nation_id",b.nation.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(le=!!(e&&e.length),t){const{data:o}=await E.from("campaign_actions").select("tick_performed").eq("nation_id",b.nation.id).eq("action_type","no_confidence_filed").eq("target_id",t).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(o){const s=a-Number(o.tick_performed||0),i=typeof O<"u"&&O.NO_CONFIDENCE_COOLDOWN_TICKS||12;Bt=Math.max(0,i-s)}}}catch(e){console.warn("[PartyActions] loadNoConfidenceState failed:",e?.message||e)}}async function Va(){if(Y={eligible:!1,lockReason:"Loading...",metaLine:""},!E||!b?.nation?.id||!b?.faction?.id)return;const a=b.nation,t=b.faction,e=Number(b?.shard?.current_tick)||0,o=(a.government_type||"").toLowerCase();if(o.includes("absolute monarchy")||o.includes("absolute_monarchy")){Y={eligible:!1,lockReason:"Only available in parliamentary systems.",metaLine:""};return}if((t.seats||0)<=0){Y={eligible:!1,lockReason:"Your party has no parliamentary seats.",metaLine:""};return}if(W&&(W.status==="formed"||W.status==="caretaker")){Y={eligible:!1,lockReason:W.formation_type==="emergency_minority"?"A minority government is already in place.":"A government is already in place.",metaLine:"Active Coalition"};return}const{data:s}=await E.from("elections").select("id, election_tick").eq("nation_id",a.id).eq("status","completed").not("results","is",null).order("election_tick",{ascending:!1}).limit(1).maybeSingle();if(!s){Y={eligible:!1,lockReason:"No completed election to form a government from.",metaLine:"No election yet"};return}const i=Number(s.election_tick||0),n=Ve,l=i+n,c=e-i,f=`Last election: ${_e(i)} · Becomes available ${_e(l)}`;if(c<n){const g=n-c;Y={eligible:!1,lockReason:`Coalition window still open: ${g} tick${g!==1?"s":""} remaining.`,metaLine:f};return}const m=Number(a.total_seats)||100,r=Math.floor(m/2)+1,{data:d,error:u}=await E.from("factions").select("id, faction_name, seats, last_seen_tick").eq("nation_id",a.id).eq("faction_type","party");if(u){Y={eligible:!1,lockReason:"Could not load party state.",metaLine:f};return}const y=d||[];if(y.some(g=>(g.seats||0)>=r)){Y={eligible:!1,lockReason:"A party already holds an outright majority — form a normal government instead.",metaLine:f};return}const _=4,x=y.filter(g=>(g.seats||0)>0&&(Number(g.last_seen_tick)||0)>=e-_).sort((g,h)=>(h.seats||0)-(g.seats||0)||(g.id<h.id?-1:1))[0];if(!x){Y={eligible:!1,lockReason:"No active parties qualify to form a government.",metaLine:f};return}if(x.id!==t.id&&!va()){Y={eligible:!1,lockReason:`Only the largest active party (${x.faction_name||"unknown"}) may form a minority government.`,metaLine:f};return}Y={eligible:!0,lockReason:"",metaLine:f}}const Qe=[{id:"fundraise",name:"Fundraise",desc:"Host a themed event for one voter bloc. Once per tick. Costs −0.3 popularity with the host bloc (donor fatigue) and −0.5 with a paired opposition bloc (optics). Yields cash to party funds based on your rapport with the host bloc and its national weight. Corporate Gala is positioning-only.",cost:"ACTION",costColor:"#c8a832",moneyCost:0,tags:["CAMPAIGN","POSITIONING"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1},{id:"no_confidence",name:"Vote of No Confidence",desc:"File a motion of no confidence against the Prime Minister. If a simple majority votes YES, the government falls and snap elections are triggered. PASS: +15 Momentum to you, -10 Momentum to the PM’s party. FAIL: -10 Momentum to you. 12-tick cooldown on the targeted PM party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1},{id:"leadership_challenge",name:"Leadership Challenge",desc:"Claim the vacant Premiership for your party leader. Available only when there is no sitting Prime Minister. If multiple coalition parties claim on the same tick, the largest-by-seats wins (earliest claim breaks ties). Winning parties get a one-time +0.3 popularity boost across all voter sectors.",cost:"COALITION ONLY",costColor:"#c8a832",moneyCost:0,tags:["GOVERNMENT","COALITION"],locked:!1},{id:"form_coalition",name:"Form Coalition",desc:"Open the coalition formation flow when no coalition government exists — invite parties, assemble at least the majority threshold of seats, then assign ministries and install a new Prime Minister. If a coalition exists but the PM is vacant, coalition members should use Leadership Challenge instead.",cost:"GOVERNMENT",costColor:"#c8a832",moneyCost:0,tags:["GOVERNMENT","COALITION"],locked:!1},{id:"form_minority_government",name:"Form Minority Government",desc:"Deadlock breaker. After the coalition window closes (3 ticks post-election) with no government formed, the leader of the largest active party can govern alone. Bills pass with -20% effective YES votes; a snap election fires automatically in 36 ticks if a stable coalition isn't formed before then.",cost:"GOVERNMENT",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","DEADLOCK"],locked:!1},{id:"leave_coalition",name:"Leave Coalition",desc:"Walk out of the current governing coalition. Any ministries your party holds are vacated. You drop from governing to opposition. Coalition flips to minority if your exit drops it below the majority threshold. Cost: −3 Momentum to you, −5 Momentum to the PM’s party. 12-tick cooldown. PM’s party cannot use this — resign first.",cost:"−3 MOM",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","RISKY"],locked:!1},{id:"disband_party",name:"Disband Party",desc:"Voluntarily dissolve your party. Your seats are vacated and sit empty until the next election (no backfill or redistribution). All party funds and momentum are lost. You are removed from every nation chat. Cannot be undone. 24-tick cooldown per user. Cannot be used while Prime Minister, sitting President, or reigning Monarch — step down first.",cost:"IRREVERSIBLE",costColor:"#c55",moneyCost:0,tags:["IRREVERSIBLE"],locked:!1}],Wa=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases crown authority (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Crown Authority per seat revoked. Use sparingly — the nobles do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Ct={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa",MONETARY:"#c8a832",STIMULUS:"#5cc55c",TIGHTENING:"#c84"},Ie=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],Se=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function Ze(a,t){E=a,b=t;const e=document.getElementById("pa-actions-root");if(!e)return;const o=t.faction;if(!o){e.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}try{const{data:m}=await E.from("factions").select("momentum, party_funds, seats, action_points, bloc_id, last_petition_for_reform_tick").eq("id",o.id).single();m&&(o.momentum=m.momentum??o.momentum,o.party_funds=m.party_funds??o.party_funds,o.seats=m.seats??o.seats,o.action_points=m.action_points??o.action_points,o.bloc_id=m.bloc_id??null,o.last_petition_for_reform_tick=m.last_petition_for_reform_tick??null)}catch(m){console.warn("[PartyActions] faction refresh failed, using cached state:",m)}try{const m=t.nation?.id;if(m){const{data:r}=await E.from("petitions").select("id").eq("nation_id",m).eq("status","pending").maybeSingle();o._petitionPending=!!r}}catch(m){console.warn("[PartyActions] petition-pending check failed:",m?.message||m),o._petitionPending=!1}const[s,i,n,l,c]=await Promise.all([E.from("faction_platforms").select("*").eq("faction_id",o.id).order("slot"),E.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),Ke(E,o.id),We(E,t.nation?.id,o.id),Ye(E,t.nation?.id)]);W=c||null,t.nation&&(t.nation.__coalition_status=c?.status||null),s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),i.error&&console.error("[PartyActions] Failed to load nation platforms:",i.error.message),tt=s.data||[],ye=i.data||[],j=n,st=l.isOpposition,F=l.administration,await Ua(),await Ya(),await Va();try{const[{data:m},{data:r}]=await Promise.all([E.from("head_of_government").select("id, faction_id, active").eq("nation_id",t.nation?.id).eq("active",!0).maybeSingle(),E.from("shard").select("current_tick").eq("name","Alpha Shard").single()]);it=m||null;const d=Number(r?.current_tick)||0,{data:u}=await E.from("leadership_challenges").select("id").eq("nation_id",t.nation?.id).eq("faction_id",o.id).is("resolved_at_tick",null).gte("claimed_at_tick",d-1).limit(1).maybeSingle();$t=!!u}catch(m){console.warn("[PartyActions] HOG / leadership claim state load failed:",m?.message||m),it=null,$t=!1}const{data:f}=await E.from("faction_deputies").select("*").eq("faction_id",o.id).eq("status","active").maybeSingle();if(B=f||null,lt=null,t.nation?.id&&(t.nation.government_type||"").toLowerCase().includes("presidential")){const{data:r}=await E.from("presidents").select("id, faction_id, first_name, last_name, elected_tick").eq("nation_id",t.nation.id).eq("is_active",!0).maybeSingle();lt=r||null}if(vt=[],o?.id&&t.nation?.id){const{data:m,error:r}=await E.from("ministries").select("id, ministry_key, party_id, is_active, minister_first_name, minister_last_name, minister_age, discretionary_balance").eq("nation_id",t.nation.id).eq("party_id",o.id).eq("is_active",!0);r?console.warn("[PartyActions] ministries fetch failed:",r.message):vt=(m||[]).filter(d=>d.minister_first_name)}j&&(se=await Da(E,o.id)),await It(o.id,t.nation?.id),R(e)}function ge(a){return a?{isPM:!!F&&F.pm_party_id===a.id,isPresident:b?.nation?.hos_election_method==="elected"&&F?.president_party_id===a.id,isMonarchActing:K(b?.nation)&&b?.nation?.monarch_faction_id===a.id}:{isPM:!1,isPresident:!1,isMonarchActing:!1}}async function It(a,t){if(!a||!t){q=null,et=!1,xt=[];return}try{const{data:e,error:o}=await E.from("bloc_invitations").select("id, bloc_id, invited_by_faction_id, created_at_tick, status, bloc:bloc_id(id,name,leader_faction_id), inviter:invited_by_faction_id(id,faction_name,party_color)").eq("invited_faction_id",a).eq("status","pending").order("created_at_tick",{ascending:!1});if(o)throw o;xt=e||[];const s=b?.faction?.bloc_id||null;if(s){const{data:i,error:n}=await E.from("blocs").select("*").eq("id",s).is("dissolved_at_tick",null).maybeSingle();if(n)throw n;if(i){const{data:l}=await E.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name").eq("bloc_id",i.id).order("seats",{ascending:!1});q={...i,members:l||[]},et=i.leader_faction_id===a}else q=null,et=!1}else q=null,et=!1}catch(e){console.warn("[PartyActions] loadBlocState failed:",e?.message||e)}}function ta(a){if(!q)return"";const t=et?`<span style="margin-left:6px;font-family:var(--font-mono);font-size:7px;color:${a};letter-spacing:0.08em;">LEADER</span>`:"";return`<span class="pa-bloc-tag" style="display:inline-flex;align-items:center;padding:2px 8px;background:${a}18;border:1px solid ${a}55;color:${a};font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        BLOC &middot; ${$(q.name)}${t}
    </span>`}function ea(a){if(!q)return"";const t=q.members||[],e=t.reduce((s,i)=>s+(Number(i.seats)||0),0),o=t.map(s=>{const i=s.id===q.leader_faction_id,n=s.party_color||a;return`<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid ${n}44;border-left:3px solid ${n};background:var(--bg-card);font-family:var(--font-mono);font-size:9px;">
            <span style="color:var(--text-bright);font-weight:700;">${$(s.faction_name||"Unknown")}</span>
            <span style="color:var(--text-dim);">${s.seats||0} seats</span>
            ${i?`<span style="color:${n};font-weight:700;letter-spacing:0.08em;">LEADER</span>`:""}
        </span>`}).join("");return`<div style="margin:8px 0;padding:8px 12px;background:${a}0a;border:1px solid ${a}33;border-left:3px solid ${a};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${a};letter-spacing:0.08em;">BLOC &middot; ${$(q.name)}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${t.length} member${t.length!==1?"s":""} &middot; ${e} combined seats</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${o}</div>
    </div>`}function aa(a){if(!xt||xt.length===0)return"";const t=o=>(Array.isArray(o)?o[0]:o)||null;return`<div style="margin:10px 0 4px;">${xt.map(o=>{const s=t(o.bloc),i=t(o.inviter),n=s?.name||"a bloc",l=i?.faction_name||"A party leader",c=i?.party_color||a,f=zt.has(o.id);return`<div style="margin:6px 0;padding:8px 12px;border:1px solid ${c}55;border-left:3px solid ${c};background:${c}08;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="flex:1;">
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${c};letter-spacing:0.08em;">BLOC INVITATION</div>
                <div style="font-size:11px;color:var(--text-bright);margin-top:2px;">
                    <strong>${$(l)}</strong> invites you to join <strong>${$(n)}</strong>.
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--submit" data-invite-id="${$(o.id)}" data-decision="accept"${f?" disabled":""}>Accept</button>
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--cancel" data-invite-id="${$(o.id)}" data-decision="decline"${f?" disabled":""}>Decline</button>
            </div>
        </div>`}).join("")}</div>`}async function be(a){const{data:t}=await E.from("factions").select("bloc_id, momentum").eq("id",a).single();t&&(b.faction.bloc_id=t.bloc_id||null,t.momentum!=null&&(b.faction.momentum=t.momentum))}async function Ka(a,t,e){try{const o=b?.faction?.id;if(!o)throw new Error("No active faction");const s=t==="accept"?"accept_bloc_invite":"decline_bloc_invite",i=t==="accept"?"p_accepting_faction_id":"p_declining_faction_id",{data:n,error:l}=await E.rpc(s,{p_invitation_id:a,[i]:o});if(l)throw l;if(n&&n.success===!1)throw new Error(n.error||"Unknown error");await be(o),await It(o,b.nation?.id),R(e)}catch(o){console.error("[PartyActions] respondToBlocInvite failed:",o),alert(t==="accept"?`Could not accept invitation: ${o.message||o}`:`Could not decline invitation: ${o.message||o}`)}}async function Ja(a){if(!q||Vt)return;const t=q,e=et?`Leaving ${t.name} will DISSOLVE the entire bloc. All ${t.members?.length||0} members will be removed and pending invitations rescinded.

Proceed?`:`Leave the ${t.name} bloc?`;if(confirm(e)){Vt=!0;try{const{data:o,error:s}=await E.rpc("leave_bloc",{p_faction_id:b.faction.id});if(s)throw s;if(o&&o.success===!1)throw new Error(o.error||"Unknown error");await be(b.faction.id),await It(b.faction.id,b.nation?.id),R(a)}catch(o){console.error("[PartyActions] leave_bloc failed:",o),alert(`Could not leave bloc: ${o.message||o}`)}finally{Vt=!1}}}async function Xa(a){const t=document.getElementById("pa-bloc-modal");if(!t||q)return;const e=b.faction,o=e?.color||"#c8a832";t.innerHTML=`
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
    `,t.classList.add("active");const s=new Set;let i=[];const n=()=>t.classList.remove("active");document.getElementById("pa-bloc-close")?.addEventListener("click",n),document.getElementById("pa-bloc-cancel")?.addEventListener("click",n),t.addEventListener("click",r=>{r.target===t&&n()});try{const r=b.nation?.id,{data:d}=await E.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name, leader_age, bloc_id").eq("nation_id",r).eq("faction_type","party").is("abandoned_at",null),u=(d||[]).filter(v=>v.id!==e.id);i=u;const y=document.getElementById("pa-bloc-party-list");if(!y)return;if(u.length===0){y.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No other parties in this nation.</div>';return}y.innerHTML=u.map(v=>{const _=v.party_color||"#7a7a7a",p=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"Party Leader",x=v.bloc_id?"Already in a bloc":null;return`<label class="pa-bloc-party-row" data-party-id="${$(v.id)}" data-ineligible="${x?"1":"0"}"
                style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border-mid);border-left:3px solid ${_};cursor:${x?"not-allowed":"pointer"};opacity:${x?"0.45":"1"};">
                <input type="checkbox" class="pa-bloc-party-check" ${x?"disabled":""} style="margin:0;">
                <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:baseline;gap:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${$(v.faction_name)}</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${v.seats||0} seats</span>
                    </div>
                    <div style="font-size:9px;color:var(--text-secondary);">${$(p)}</div>
                    ${x?`<div style="font-family:var(--font-mono);font-size:8px;color:var(--orange);margin-top:3px;">${x}</div>`:""}
                </div>
            </label>`}).join(""),y.addEventListener("change",v=>{const _=v.target.closest(".pa-bloc-party-row");if(!_)return;if(_.dataset.ineligible==="1"){v.target.checked=!1;return}const p=_.dataset.partyId;v.target.checked?s.add(p):s.delete(p),m()})}catch(r){console.error("[PartyActions] Create Bloc modal fetch failed:",r);const d=document.getElementById("pa-bloc-party-list");d&&(d.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${$(r.message||String(r))}</div>`)}const l=document.getElementById("pa-bloc-name"),c=document.getElementById("pa-bloc-submit"),f=document.getElementById("pa-bloc-name-count"),m=()=>{const r=(l?.value||"").trim();f&&(f.textContent=`${r.length} / 40`),c&&(c.disabled=!(r.length>0&&s.size>0)||Mt)};l?.addEventListener("input",m),c?.addEventListener("click",async()=>{if(Mt)return;const r=(l?.value||"").trim();if(!(r.length===0||s.size===0)){Mt=!0,c.disabled=!0,c.textContent="Creating...";try{const{data:d,error:u}=await E.rpc("create_bloc",{p_leader_faction_id:e.id,p_name:r,p_invitee_faction_ids:Array.from(s)});if(u)throw u;if(d&&d.success===!1)throw new Error(d.error||"Unknown error");b.faction.party_funds=Math.max(0,(b.faction.party_funds||0)-1e5),await be(e.id),n(),await It(e.id,b.nation?.id),R(a)}catch(d){console.error("[PartyActions] create_bloc failed:",d),alert(`Could not create bloc: ${d.message||d}`),c.disabled=!1,c.textContent="Create Bloc & Send Invites"}finally{Mt=!1}}})}async function Qa(a){if(!q||!et)return;const t=document.getElementById("pa-bloc-modal");if(!t)return;const e=b.faction?.color||"#c8a832";t.innerHTML=`
        <div class="pa-modal" style="width:520px;max-height:75vh;overflow:hidden;display:flex;flex-direction:column;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${e};"></div>
                    <span class="pa-modal-title">Invite to ${$(q.name)}</span>
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
        </div>`,t.classList.add("active");const o=()=>t.classList.remove("active");document.getElementById("pa-blinv-close")?.addEventListener("click",o),document.getElementById("pa-blinv-cancel")?.addEventListener("click",o),t.addEventListener("click",n=>{n.target===t&&o()});const s=b.nation?.id,i=document.getElementById("pa-blinv-list");if(!(!i||!s))try{const{data:n,error:l}=await E.from("factions").select("id, faction_name, seats, party_color, bloc_id").eq("nation_id",s).eq("faction_type","party").is("abandoned_at",null).is("bloc_id",null);if(l){i.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${$(l.message)}</div>`;return}const c=(n||[]).filter(f=>f.id!==b.faction.id);if(c.length===0){i.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No eligible parties to invite.</div>';return}i.innerHTML=c.map(f=>{const m=f.party_color||"#888";return`<div class="pa-blinv-row" data-faction-id="${$(f.id)}" style="padding:8px 10px;border:1px solid ${m}33;border-left:3px solid ${m};display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:var(--bg-card);">
                <div>
                    <div style="font-size:11px;color:var(--text-bright);font-weight:600;">${$(f.faction_name||"Unknown")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${f.seats||0} seats</div>
                </div>
                <button class="pa-modal-btn pa-modal-btn--submit pa-blinv-send" data-faction-id="${$(f.id)}">Invite</button>
            </div>`}).join(""),i.addEventListener("click",async f=>{const m=f.target.closest(".pa-blinv-send");if(!m)return;const r=m.dataset.factionId;if(r){m.disabled=!0,m.textContent="Sending…";try{const{error:d}=await E.rpc("invite_to_bloc",{p_bloc_id:q.id,p_invitee_faction_id:r});if(d)throw d;m.textContent="Invited",await It(b.faction.id,b.nation?.id),R(a)}catch(d){console.warn("[PartyActions] invite_to_bloc failed:",d),alert(`Could not invite: ${d.message||d}`),m.disabled=!1,m.textContent="Invite"}}})}catch(n){console.warn("[PartyActions] openInviteToBlocModal threw:",n),i.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Unexpected error.</div>'}}function R(a){const t=b.faction,e=b.nation,o=K(e),s=o&&e?.monarch_faction_id===t?.id,i=t.color||"#c8a832",n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",l=t.seats||0,c=e?.total_seats||120,f=c>0?Math.round(l/c*100):0;t.action_points,t.approval_rating;const m=t.momentum??50,r=t.party_funds??0,d=Pa(tt,e),u=[];for(let p=1;p<=3;p++){const x=tt.find(g=>g.slot===p);if(x){const g=_t.find(k=>k.id===x.platform_key),h=d.find(k=>k.id===x.id),I=h?h.stats.filter(k=>k.met).length:0,w=h?h.stats.length:0;u.push({name:g?.name||x.platform_key,status:x.status,metCount:I,totalCount:w,slot:p})}else u.push(null)}const y=u.map(p=>{if(!p)return{label:"No Platform"};const x=p.status==="fulfilled"?" ✓":p.status==="failed"?" ✗":p.status==="abated"?" —":"",g=p.status==="fulfilled"?"fulfilled":p.status==="failed"?"failed":p.status==="abated"?"abated":"filled",h=p.totalCount>0?` (${p.metCount}/${p.totalCount})`:"";return{label:p.name+h+x,statusClass:g,title:`${p.metCount} of ${p.totalCount} stats on target`}}),v="$"+(r>=1e6?(r/1e6).toFixed(1)+"M":r>=1e3?Math.round(r/1e3)+"k":r),_=Math.round(Number(o?b.nation?.crown_authority??50:b.nation?.gov_approval??0));Aa(a,{title:s?"Royal Court":"Party Actions",entityName:t.faction_name,entityColor:i,stats:[{label:"Party Funds",value:v,color:"var(--accent)"},{label:"Momentum",value:Number(m).toFixed(1),color:m>0?"var(--text-bright)":"var(--red)"},{label:o?"Crown Authority":"Nat. Approval",value:String(_),color:"var(--green)"}],statusBarItems:[{type:"count",label:"Seats",big:String(l),bigColor:i,dim1:`/ ${c}`,dim2:`(${f}%)`},{type:"list",label:"Platforms",items:y}],rolesContainerId:"pa-leaders",panelContainerId:"pa-actions-panel",extraHtml:`
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
            <div class="pa-modal-overlay" id="pa-cb-rate-modal"></div>
            <div class="pa-modal-overlay" id="pa-press-claim-modal"></div>
            <div class="pa-modal-overlay" id="pa-declare-war-modal"></div>
            <div class="pa-modal-overlay" id="pa-ceasefire-modal"></div>
        `}),document.getElementById("pa-leaders").innerHTML=Za(n,i,t),document.getElementById("pa-actions-panel").innerHTML=he(n,i,t);for(const p of Object.keys(qt))ce(p);ia(t),document.getElementById("pa-leaders")?.addEventListener("click",p=>{const x=p.target.closest(".pa-leader-card");if(!x||x.classList.contains("vacant"))return;const g=x.dataset.role;g&&g!==U&&(U=g,R(a))}),document.getElementById("pa-actions-panel")?.addEventListener("click",p=>{const x=p.target.closest(".pa-action-item");if(!x||x.classList.contains("locked"))return;const g=x.dataset.actionId;if(g==="fundraise")Jo(a);else if(g==="grant_seats")Bo(a);else if(g==="revoke_seats")Fo(a);else if(g==="rally")vo(a);else if(g==="statement")ti(a);else if(g==="platform")ei(a);else if(g==="file_lawsuit")Ro(a);else if(g==="petition_for_reform")Ao();else if(g==="appoint_pm")Oo(a);else if(g==="modernize")So(a);else if(g==="rebrand")Lo(a);else if(g==="no_confidence")Vo();else if(g==="call_early_elections")qo();else if(g==="resign_as_pm")Go();else if(g==="leave_coalition")Do();else if(g==="disband_party")Uo();else if(g==="create_bloc")Xa(a);else if(g==="leave_bloc")Ja(a);else if(g==="invite_to_bloc")Qa(a);else if(g==="impeach_president")Yo();else if(g==="debt_payment")yo(a);else if(g==="press_claim")bo(a);else if(g==="request_ceasefire")xo(a);else if(g==="declare_war")ho(a);else if(g==="allocate_funds")_o(a);else if(g==="cb_lower_rate")Te(a,"lower");else if(g==="cb_raise_rate")Te(a,"raise");else if(g==="invest_in_sports_culture")uo(a,t);else if(g==="expand_stadium_infrastructure")wo(a,t);else if(g==="expand_infrastructure")ko(a,t);else if(qt[g])zo(g,t);else if(g==="bid_to_host_vwc")Co(a,t);else if(g==="leadership_challenge")jo(a,t);else if(g==="form_coalition"){const h=document.querySelector('.pa-subtab[data-panel="election"]');h&&h.click()}else g==="form_minority_government"&&Ho()}),document.getElementById("pa-actions-panel")?.addEventListener("click",async p=>{const x=p.target.closest(".pa-bloc-invite-btn");if(!x)return;const g=x.dataset.inviteId,h=x.dataset.decision;if(!(!g||!h)&&!zt.has(g)){zt.add(g);try{await Ka(g,h,a)}finally{zt.delete(g)}}}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>Re(a)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",p=>{p.target.closest("#pa-hire-agitator-btn")||Re(a)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>Ne(a)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",p=>{p.target.closest("#pa-hire-deputy-btn")||Ne(a)})}function Za(a,t,e){const o=K(b.nation)&&b.nation?.monarch_faction_id===e?.id;return Xe.map(s=>{const i=s.id==="leader",n=s.id==="agitator",l=U===s.id;let c,f,m,r,d;if(i){c=!1,f=a,m=Q(e.leader_first_name,e.leader_last_name),r=Qe.length;const v=K(b.nation);if(v&&b.nation?.monarch_faction_id===e.id)d={text:(b.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(v)d={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const p=F?.pm_party_id===e.id,x=b.nation?.hos_election_method==="elected"&&F?.president_party_id===e.id;p?d={text:"PRIME MINISTER",color:"#5cc55c"}:x?d={text:"PRESIDENT",color:"#5cc55c"}:st?d={text:"OPPOSITION",color:"#c84"}:d={text:"GOVERNING",color:"#8b9a6b"}}}else n&&j?(c=!1,f=`${j.first_name} ${j.last_name}`,m=Q(j.first_name,j.last_name),r=1):n&&!j?(c=!1,f="Not Hired",m="+",r=0):s.id==="deputy"&&B?(c=!1,f=`${B.first_name} ${B.last_name}`,m=Q(B.first_name,B.last_name),r=1):s.id==="deputy"&&!B?(c=!1,f="Not Hired",m="+",r=0):s.id==="campaign"?(c=!1,f="Campaign Mgr",m="CM",r=na.length):(c=!0,f="Vacant",m="—",r=0);const u=s.oppositionOnly&&!st;return`
            <div class="pa-leader-card ${l?"active":""} ${c?"vacant":""} ${u?"vacant":""}"
                 data-role="${s.id}"
                 style="${l?`border-left-color:${s.color};`:""}${u?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${u?"var(--text-dim)":"#d44a4a"};background:${u?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${u?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${u?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${m}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${i&&o?(b.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${r>0?`<span class="pa-leader-role-count">${r} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${$(f)}</div>
                        ${d?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${d.color};margin-top:2px;">${d.text}</div>`:""}
                        ${n&&j?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${j.skill}%;background:${ct(j.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${j.skill}</span></div>`:""}
                        ${n&&!j?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
                    </div>
                </div>
            </div>
        `}).join("")+ro(e)+to(e)}function Ft(a){return Math.round(Number(a||0)/1e6)}function oa(a){const t=b?.nation;if(!t||!a?.id||t.central_bank_governor_party_id!==a.id)return!1;const e=Number(b?.shard?.current_tick??0);return Number(t.central_bank_governor_term_end_tick??0)>e}function to(a){if(!oa(a))return"";const t=xe("central_bank_governor",a),e=U===t.roleId,o=(t.actions||[]).length;return`
        <div class="pa-cabinet-header">
            <span class="pa-cabinet-header__title">Central Bank</span>
            <span class="pa-cabinet-header__count">Governor</span>
        </div>
        <div class="pa-leader-card pa-leader-card--ministry ${e?"active":""}"
             data-role="${$(t.roleId)}"
             style="${e?"border-left-color:#c8a832;":""}">
            <div class="pa-leader-top">
                <div class="pa-leader-avatar" style="color:#c8a832;background:#c8a83215;border-color:#c8a83233;">${$(t.chip)}</div>
                <div class="pa-leader-info">
                    <div class="pa-leader-role">
                        <span class="pa-leader-role-label" style="color:#c8a832;">${$(t.shortRole.toUpperCase())}</span>
                        ${o>0?`<span class="pa-leader-role-count">${o} action${o===1?"":"s"}</span>`:""}
                    </div>
                    <div class="pa-leader-name">${$(t.personName)}</div>
                </div>
            </div>
        </div>
    `}const eo={interior:{short:"MI",name:"Ministry of the Interior",short_role:"Interior",domain:"HOME AFFAIRS"},foreign:{short:"MFA",name:"Ministry of Foreign Affairs",short_role:"Foreign",domain:"DIPLOMACY"},finance:{short:"MoF",name:"Ministry of Finance",short_role:"Finance",domain:"TREASURY"},defense:{short:"MoD",name:"Ministry of Defense",short_role:"Defense",domain:"MILITARY"},justice:{short:"MoJ",name:"Ministry of Justice",short_role:"Justice",domain:"JUSTICE"},education:{short:"MoE",name:"Ministry of Education",short_role:"Education",domain:"EDUCATION"},healthcare:{short:"MoH",name:"Ministry of Health",short_role:"Health",domain:"HEALTH"},labor:{short:"MoL",name:"Ministry of Labor",short_role:"Labor",domain:"LABOR"},energy:{short:"MoEn",name:"Ministry of Energy",short_role:"Energy",domain:"ENERGY"},agriculture:{short:"MoAg",name:"Ministry of Agriculture",short_role:"Agriculture",domain:"AGRICULTURE"},transport:{short:"MoT",name:"Ministry of Transport",short_role:"Transport",domain:"INFRASTRUCTURE"},trade:{short:"MoTr",name:"Ministry of Trade",short_role:"Trade",domain:"TRADE"},environment:{short:"MoEv",name:"Ministry of Environment",short_role:"Environment",domain:"ENVIRONMENT"},sports:{short:"MoS",name:"Ministry of Sports",short_role:"Sports",domain:"SPORTS"}};function ao(a){return eo[a]||{short:(a||"?").slice(0,3).toUpperCase(),name:"Ministry",short_role:a||"Minister",domain:(a||"").toUpperCase()}}function oo(a){return a?.id?(vt||[]).filter(t=>t.party_id===a.id&&t.ministry_key!=="prime_minister"):[]}function xe(a,t){const e=b?.nation,o=`${t?.leader_first_name||""} ${t?.leader_last_name||""}`.trim(),s=t?.leader_age??null;if(a==="prime_minister")return{roleId:"ministry:prime_minister",chip:"PM",roleLabel:"PRIME MINISTER",fullTitle:e?.head_of_government_title||"Prime Minister",shortRole:"Prime Minister",domain:(e?.head_of_government_title||"Prime Minister").toUpperCase(),personFirst:t?.leader_first_name||"",personLast:t?.leader_last_name||"",personName:o||"Prime Minister",personAge:s,actions:Nt.prime_minister||[]};if(a==="president")return{roleId:"ministry:president",chip:"PR",roleLabel:"PRESIDENT",fullTitle:e?.head_of_state_title||"President",shortRole:"President",domain:(e?.head_of_state_title||"President").toUpperCase(),personFirst:t?.leader_first_name||"",personLast:t?.leader_last_name||"",personName:o||"President",personAge:s,actions:Nt.president||[]};if(a==="central_bank_governor")return{roleId:"ministry:central_bank_governor",chip:"CB",roleLabel:"GOVERNOR",fullTitle:"Governor of the Central Bank",shortRole:"Central Bank",domain:"MONETARY POLICY",personFirst:t?.leader_first_name||"",personLast:t?.leader_last_name||"",personName:o||t?.faction_name||"Governor",personAge:s,actions:Nt.central_bank_governor||[]};const i=(vt||[]).find(l=>l.ministry_key===a),n=ao(a);return{roleId:`ministry:${a}`,chip:n.short,roleLabel:"MINISTER",fullTitle:n.name,shortRole:n.short_role,domain:n.domain,personFirst:i?.minister_first_name||"",personLast:i?.minister_last_name||"",personName:`${i?.minister_first_name||""} ${i?.minister_last_name||""}`.trim()||"Vacant",personAge:i?.minister_age??null,ministryId:i?.id||null,discretionaryBalance:Number(i?.discretionary_balance??0),actions:Nt[a]||[]}}function ut(a){const t=Number(a)||0;return t<=0?"$0":"$"+Math.round(t/1e6)}const ot={id:"stateOwnedEnterprise",name:"State Owned Enterprise",desc:"Advocate for the creation of a State Owned Enterprise in this ministry.",cost:"$100K",costColor:"var(--text-dim)",tags:[]},io={id:"allocate_funds",name:"Allocate Funds",desc:"Distribute the Defense Ministry discretionary budget to a military branch. Funds move 1:1 into that branch faction’s treasury. Army only for now — Navy and Air Force are not yet established.",cost:"From budget",costColor:"#c8a832",tags:["MILITARY","COSTS BUDGET"]},Le={id:"declare_war",name:"Declare War",desc:'Bring an unprovoked declaration of war ("Our Honor") before parliament against a bordering nation. Paid on filing: −10 Public Approval and −3.0 popularity with your party in every sector. Passing requires a supermajority; on passage the two nations enter a state of war and their fronts activate. (Territorial wars start automatically when a dispute reaches maximum tension.)',cost:"$0",costColor:"var(--text-dim)",tags:["MILITARY","SUPERMAJORITY"]},Nt={prime_minister:[{id:"call_early_elections",name:"Call Early Elections",desc:"Dissolve the legislature. Government enters caretaker status; election fires after a short formation window. Momentum effect tiered by Gov. Approval.",cost:"$0",costColor:"var(--text-dim)",tags:["LEGISLATIVE","PM ONLY"]},{id:"resign_as_pm",name:"Resign as Prime Minister",desc:"Step down. Coalition enters caretaker status with a window to nominate a successor; otherwise a snap election fires. -3 Momentum, -0.05 Credibility, -3 Stability, 12-tick PM ban.",cost:"$0",costColor:"var(--text-dim)",tags:["GOVERNMENT","PM ONLY"]},Le],president:[Le],foreign:[{id:"press_claim",name:"Press Claim",desc:"Press a claim that is important to your nation against a bordering nation. Opens a territorial dispute — a 30-turn diplomatic contest that can escalate into armed conflict if tensions run too high.",cost:"$3",costColor:"#c8a832",tags:["DIPLOMACY","COSTS BUDGET"]},{id:"request_ceasefire",name:"Request Ceasefire",desc:"Sue for peace in a war you are fighting. Proposes a white-peace ceasefire — the fighting stops and the front line holds where it stands. The enemy's head of government must accept it in their War Room to end the war.",cost:"$0",costColor:"#c8a832",tags:["DIPLOMACY"]}],central_bank_governor:[{id:"cb_lower_rate",name:"Lower Interest",desc:"Lower the Central Bank policy rate by up to 3% for $1 from the lending pool. Stimulus: nudges GDP growth up (+3 per 1% cut). Rate clamps at 0%.",cost:"$1",costColor:"#c8a832",tags:["MONETARY","STIMULUS"]},{id:"cb_raise_rate",name:"Raise Interest",desc:"Raise the Central Bank policy rate by up to 3% for $1 from the lending pool. Tightening: nudges GDP growth down (−5 per 1% hike). Rate clamps at 20%.",cost:"$1",costColor:"#c8a832",tags:["MONETARY","TIGHTENING"]}],defense:[io,ot],transportation:[ot],finance:[{id:"debt_payment",name:"Debt Payment",desc:"Move cash from the Finance Ministry discretionary budget to the national debt. Reduces debt principal and future interest service. $2 transaction fee plus the principal you choose. 1 tick cooldown.",cost:"$2 + payment",costColor:"#c8a832",tags:["FINANCE","COSTS BUDGET"]},ot],energy:[{id:"national_energy_survey",name:"National Energy Survey",desc:"Commission a national energy resource survey. Roll 1d100 + ((100 − Energy) × 0.5): ≤45 finds nothing; 46-90 modest (+3-8); 91+ major (+5-16). Lower current Energy improves odds. Cost triples every use. 24-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["ENERGY","COSTS BUDGET"]},ot],interior:[{id:"expand_infrastructure",name:"Expand Infrastructure",desc:"Post a public-works construction contract — Local Municipal Complex, Civic Center, or Provincial Infrastructure. Construction corps bid; the lowest qualified bid auto-wins. On completion your nation gains permanent stat boosts (Std of Living, GDP growth, Public Approval).",cost:"$2 – $12",costColor:"#5aafa5",tags:["INTERIOR","CONSTRUCTION"]},{id:"geological_survey_minerals",name:"Geological Survey — Minerals",desc:"Commission a national geological survey. Roll 1d100 + (Minerals × 0.5): ≤30 finds nothing; 31-60 small (+2-4); 61-85 moderate (+4-11); 86+ major (+4-18). Higher current Minerals improves odds. Cost doubles every use. 12-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["INTERIOR","COSTS BUDGET"]},{id:"agricultural_expansion",name:"Agricultural Expansion",desc:"Commission an agricultural expansion. Roll 1d100 + ((100 − Farmland) × 0.5): ≤30 nothing; 31-60 small (+2-4); 61-85 moderate (+4-11); 86+ major (+4-18, with -4-9 industry). Lower current Farmland improves odds. Cost doubles every use. 12-tick cooldown.",cost:"$…",costColor:"#a87f4a",tags:["INTERIOR","COSTS BUDGET"]},ot],healthcare:[ot],justice:[ot],education:[ot],sports:[{id:"invest_in_sports_culture",name:"Invest in National Sports Culture",desc:"Fund local Vola leagues, training academies, and marketing campaigns. Pulls from the Sports Ministry discretionary budget; raises National Sports Culture immediately. 1 tick cooldown.",cost:"$2 – $8",costColor:"#c8a832",tags:["SPORTS","COSTS BUDGET"]},{id:"expand_stadium_infrastructure",name:"Expand Stadium Infrastructure",desc:"Post a stadium construction contract. Construction Corporations bid; you pick the winner. Once built, the stadium adds a permanent floor to National Sports Culture so decay can never bring you back to zero.",cost:"$3 – $10",costColor:"#c8a832",tags:["SPORTS","CONSTRUCTION"]},{id:"bid_to_host_vwc",name:"Bid to Host VWC",desc:"Submit your nation as a candidate to host the next available Vola World Cup. Multiple nations can bid; the highest score wins. Winner hosts the cycle, gains a treasury bump, Global Image, Public Approval, and home advantage in matches. Once per cup.",cost:"$10",costColor:"#c8a832",tags:["SPORTS","COSTS BUDGET"]}]};function no(a){const t=[],e=ge(a);e.isPM&&t.push("prime_minister"),e.isPresident&&Et(b?.nation)&&t.push("president");for(const o of oo(a))t.push(o.ministry_key);return t}function ro(a){const t=no(a);if(t.length===0)return"";const e=t.map(o=>{const s=xe(o,a),i=U===s.roleId,n=(s.actions||[]).length;return`
            <div class="pa-leader-card pa-leader-card--ministry ${i?"active":""}"
                 data-role="${$(s.roleId)}"
                 style="${i?"border-left-color:#c8a832;":""}">
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:#c8a832;background:#c8a83215;border-color:#c8a83233;">${$(s.chip)}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:#c8a832;">${$(s.shortRole.toUpperCase())}</span>
                            ${n>0?`<span class="pa-leader-role-count">${n} action${n===1?"":"s"}</span>`:""}
                        </div>
                        <div class="pa-leader-name">${$(s.personName)}</div>
                    </div>
                </div>
            </div>
        `}).join("");return`
        <div class="pa-cabinet-header">
            <span class="pa-cabinet-header__title">Cabinet Ministries</span>
            <span class="pa-cabinet-header__count">${t.length} held</span>
        </div>
        ${e}
    `}function so(a,t,e){const o=b?.nation;if(a==="stateOwnedEnterprise")return"Coming soon — backend not yet wired.";if(a==="debt_payment"){if(Number(e?.discretionaryBalance??0)<3e6)return"Finance Ministry discretionary budget is below $3 — need at least $2 fee + $1 minimum payment.";if(Number(b?.nation?.debt??0)<=0)return"No national debt to pay down."}if(a==="allocate_funds"&&Number(e?.discretionaryBalance??0)<1e6)return"Defense Ministry discretionary budget is $0 — pass a funding bill first.";if(a==="press_claim"&&Number(e?.discretionaryBalance??0)<3e6)return"Foreign Ministry discretionary budget is below $3 — pass a funding bill first.";if((a==="cb_lower_rate"||a==="cb_raise_rate")&&Number(o?.central_bank_discretionary??0)<1e6)return"The Central Bank lending pool is empty — $1 is required to move the rate. Fund it with a funding bill.";if(a==="invest_in_sports_culture"&&Number(e?.discretionaryBalance??0)<2e6)return"Sports Ministry discretionary budget is below $2M — pass a funding bill first.";if(a==="expand_infrastructure"&&Number(e?.discretionaryBalance??0)<2e6)return"Interior Ministry discretionary budget is below $2 — pass a funding bill first.";if(a==="call_early_elections"||a==="resign_as_pm"){if(K(o))return a==="call_early_elections"?"Elections are not held under absolute monarchy.":"PM serves at the Monarch’s pleasure; only the Monarch can replace them.";if(o?.__coalition_status==="caretaker")return"Government already in caretaker mode."}return""}function lo(a,t){const e=U.startsWith("ministry:")?U.slice(9):null;if(!e)return"";const o=xe(e,a),s=o.personAge!=null?`, Age ${o.personAge}`:"",i=e==="central_bank_governor",n=!i&&e!=="prime_minister"&&e!=="president"&&o.ministryId;let l="";if(i){const f=b?.nation||{},m=Number(f.central_bank_interest_rate??5),r=Ft(f.central_bank_discretionary),d=r*100,u=d>=1e3?`$${(d/1e3).toLocaleString(void 0,{maximumFractionDigits:1})}B`:`$${d.toLocaleString()}M`,y=Number(f.central_bank_governor_term_end_tick??0),v=Math.max(0,y-Number(b?.shard?.current_tick??0));l=`
            <div style="text-align:right;font-family:var(--font-mono);flex-shrink:0;">
                <div style="font-size:9px;letter-spacing:0.14em;color:var(--text-dim);text-transform:uppercase;">Policy Rate</div>
                <div style="font-size:18px;font-weight:700;color:#c8a832;margin-top:2px;">${m.toFixed(2)}%</div>
                <div style="font-size:8px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;margin-top:6px;">Lending Capital</div>
                <div style="font-size:12px;font-weight:700;color:var(--green);">${u}</div>
                <div style="font-size:8px;color:var(--text-dim);margin-top:4px;">Term: ${v} ticks left · pool $${r.toLocaleString()}</div>
            </div>`}const c=(o.actions||[]).map(f=>{const m=so(f.id,a,o),r=!!m,d=f.cost||"",u=(f.tags||[]).map(y=>`<span class="pa-action-tag" style="color:${Ct[y]||"var(--text-dim)"};">${$(y)}</span>`).join("");return`
            <div class="pa-action-item ${r?"locked":""}" data-action-id="${$(f.id)}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(f.name)}</span>
                        <div class="pa-action-tags">${u}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${f.costColor||"var(--text-dim)"};">${$(d)}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${$(f.desc)}</div>
                ${r&&m?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>&#8856;</span><span>${$(m)}</span></div>`:""}
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
                        ${$(o.shortRole)} &middot; ${$(a.faction_name)}${$(s)}
                        <span style="color:#c8a832;font-weight:700;"> &middot; ${$(o.domain)}</span>
                    </div>
                </div>
            </div>
            ${n?`
                <div style="text-align:right;font-family:var(--font-mono);flex-shrink:0;">
                    <div style="font-size:9px;letter-spacing:0.14em;color:var(--text-dim);text-transform:uppercase;">Discretionary Budget</div>
                    <div style="font-size:14px;font-weight:700;color:${o.discretionaryBalance>0?"var(--green)":"var(--red)"};margin-top:2px;">${ut(o.discretionaryBalance)}</div>
                </div>
            `:""}
            ${l}
        </div>
        ${i?'<div id="cb-loan-requests" style="margin-bottom:14px;"></div>':""}
        <div class="pa-actions-list">
            ${o.actions&&o.actions.length>0?c:`<div class="pa-vacant-msg"><div><div class="pa-vacant-title">${$(o.fullTitle)} — No actions yet</div><div class="pa-vacant-sub">Per-ministry actions land here as they ship.</div></div></div>`}
        </div>
    `}function co(a){return{not_governor:"You no longer hold the Governor seat.",term_expired:"Your term has expired.",not_pending:"This request was already decided.",loan_not_found:"Request not found.",insufficient_capacity:"Not enough lending capital to issue this loan.",not_authenticated:"Not signed in."}[a]||(a?String(a):"Action failed.")}async function ia(a){const t=document.getElementById("cb-loan-requests");if(!t)return;const e=b?.nation?.id;if(!E||!e||!oa(a)){t.innerHTML="";return}const{data:o,error:s}=await E.from("central_bank_loans").select("id, principal, term_ticks, borrower_corp_id, corp:entrepreneur_corps!borrower_corp_id(name, owner_faction_id)").eq("nation_id",e).eq("status","pending").order("created_at",{ascending:!0});if(s){console.warn("[party-actions] CB loan requests load failed:",s.message),t.innerHTML="";return}if(!o||!o.length){t.innerHTML="";return}const i=[...new Set(o.map(f=>f.corp?.owner_faction_id).filter(Boolean))],n={};if(i.length){const{data:f}=await E.from("factions").select("id, corp_reputation").in("id",i);for(const m of f||[])n[m.id]=Number(m.corp_reputation)}const l=await Promise.all(o.map(f=>E.rpc("entrepreneur_corp_outstanding_debt",{p_corp_id:f.borrower_corp_id}).then(m=>Number(m.data)||0).catch(()=>0))),c=f=>"$"+Ft(f).toLocaleString();t.innerHTML=`
        <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#c8a832;margin-bottom:8px;">New Loan Request${o.length>1?"s":""}</div>
        ${o.map((f,m)=>{const r=f.corp||{},d=n[r.owner_faction_id];return`
            <div class="cb-lr-card" data-loan-id="${$(f.id)}" style="border:0.5px solid #c8a83244;background:#c8a8320c;border-radius:6px;padding:12px 14px;margin-bottom:8px;">
                <div style="font-size:13px;font-weight:700;color:var(--text-bright);margin-bottom:8px;">${$(r.name||"Unknown corp")}</div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;font-family:var(--font-mono);">
                    <div><div style="font-size:8px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Loan Amount</div><div style="font-size:13px;font-weight:600;color:var(--text-bright);margin-top:2px;">${c(f.principal)}</div></div>
                    <div><div style="font-size:8px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Existing Debt</div><div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-top:2px;">${c(l[m])}</div></div>
                    <div><div style="font-size:8px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Reputation</div><div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-top:2px;">${Number.isFinite(d)?d.toFixed(1)+"/10":"—"}</div></div>
                    <div><div style="font-size:8px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Term</div><div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-top:2px;">${Number(f.term_ticks)} ticks</div></div>
                </div>
                <div class="cb-lr-err" hidden style="margin-top:8px;font-family:var(--font-mono);font-size:10px;color:var(--red);"></div>
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
                    <button data-cb-decide="reject" data-loan-id="${$(f.id)}" style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.06em;padding:7px 14px;border-radius:3px;cursor:pointer;background:none;border:1px solid var(--red);color:var(--red);">Reject</button>
                    <button data-cb-decide="issue" data-loan-id="${$(f.id)}" style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.06em;padding:7px 14px;border-radius:3px;cursor:pointer;background:#c8a832;border:1px solid #c8a832;color:#1a1a17;">Issue Loan</button>
                </div>
            </div>`}).join("")}`,t.querySelectorAll("[data-cb-decide]").forEach(f=>{f.addEventListener("click",async()=>{const m=f.closest(".cb-lr-card"),r=m?.querySelector(".cb-lr-err");m?.querySelectorAll("[data-cb-decide]").forEach(d=>{d.disabled=!0,d.style.opacity="0.5"}),r&&(r.hidden=!0,r.textContent="");try{const d=f.dataset.cbDecide==="issue"?"issue_central_bank_loan":"reject_central_bank_loan",{data:u,error:y}=await E.rpc(d,{p_loan_id:f.dataset.loanId});y||u&&u.success===!1?(r&&(r.textContent=co(u&&u.reason||y?.message),r.hidden=!1),m?.querySelectorAll("[data-cb-decide]").forEach(v=>{v.disabled=!1,v.style.opacity="1"})):await ia(a)}catch(d){r&&(r.textContent=d?.message||"Action failed.",r.hidden=!1),m?.querySelectorAll("[data-cb-decide]").forEach(u=>{u.disabled=!1,u.style.opacity="1"})}})})}function he(a,t,e){if(typeof U=="string"&&U.startsWith("ministry:"))return lo(e);const o=K(b.nation),s=o&&b.nation?.monarch_faction_id===e?.id,i=Xe.find(p=>p.id===U);if(!i)return"";const n=U==="leader",l=U==="agitator",c=U==="campaign",f=U==="deputy";if(!n&&!l&&!c&&!f)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${$(i.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(l&&!st)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(l&&!j)return`
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
        `;if(l&&j)return No(i);if(f&&!B)return`
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
        `;if(f&&B)return mo(i);if(c)return Io(i,e);const r=Q(e.leader_first_name,e.leader_last_name),d=e.leader_age?`, Age ${e.leader_age}`:"";e.seats,e.momentum;const _=(K(b.nation)&&b.nation?.monarch_faction_id===e.id?Wa:Qe).map(p=>{const x=p.tags.map(C=>`<span class="pa-action-tag" style="color:${Ct[C]||"var(--text-dim)"};">${C}</span>`).join("");let g="",h=p.cost,I=p.costColor,w=p.locked;if(p.id==="no_confidence"){const C=K(b.nation),S=!!F&&F.pm_party_id===e.id;if(C)w=!0,p.lockReason="Parliament cannot remove the Monarch’s Prime Minister. Only the Monarch can dismiss the PM.";else if(S)w=!0,p.lockReason="Your party is the Prime Minister — file from another party.";else if(le)w=!0,p.lockReason="A motion of no confidence is already pending in Parliament.";else if(Bt>0){w=!0;const M=Bt;p.lockReason=`Cooldown: ${M} tick${M!==1?"s":""} remaining before another motion can be filed against this PM party.`}else!F||!F.pm_party_id?(w=!0,p.lockReason="No active Prime Minister to file against."):p.lockReason=""}else if(p.id==="form_coalition"){const C=b.nation,S=(C?.government_type||"").toLowerCase(),M=S.includes("absolute monarchy"),A=S.includes("presidential")&&!S.includes("semi"),P=Ue(C),L=!M&&!A&&!P&&(S.includes("parliamentary")||C?.hos_election_method==="hereditary"),N=!!W,T=!!it,D=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),V=!e.seats||e.seats<=0;if(P)w=!0,p.lockReason="Coalition formation does not apply in semi-presidential systems — the President nominates the Prime Minister directly.";else if(!L)w=!0,p.lockReason="Coalition formation only applies to parliamentary systems.";else if(N&&T){const at=W?.formation_type==="emergency_minority";at&&D?p.lockReason="":(w=!0,p.lockReason=at?"A minority government is in place. Only its PM party can promote it to a coalition.":"A government is already in place.")}else N&&!T?(w=!0,p.lockReason=D?"A coalition exists but the Prime Minister is vacant — use Leadership Challenge instead.":"A coalition exists but the Prime Minister is vacant; only coalition members can claim it."):V?(w=!0,p.lockReason="Your party has no parliamentary seats."):p.lockReason=""}else if(p.id==="form_minority_government")Y.eligible?p.lockReason="":(w=!0,p.lockReason=Y.lockReason||"Not currently available.");else if(p.id==="leadership_challenge"){const C=b.nation,S=(C?.government_type||"").toLowerCase(),M=S.includes("absolute monarchy"),A=S.includes("presidential")&&!S.includes("semi"),P=S.includes("semi-presidential")||S.includes("semi_presidential"),L=!M&&!A&&!P&&(S.includes("parliamentary")||C?.hos_election_method==="hereditary"),T=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),z=!it,D=!!it&&it.faction_id===e.id,V=!e.leader_first_name,at=!e.seats||e.seats<=0;L?D?(w=!0,p.lockReason="You are already the Prime Minister."):T?z?V?(w=!0,p.lockReason="Your party has no leader to install."):at?(w=!0,p.lockReason="Your party has no parliamentary seats."):$t?(w=!0,p.lockReason="Challenge submitted — resolves next tick.",h="PENDING",I="var(--text-dim)"):p.lockReason="":(w=!0,p.lockReason="A Prime Minister is already serving."):(w=!0,p.lockReason="You must be in the governing coalition."):(w=!0,p.lockReason="Only available in parliamentary systems.")}else if(p.id==="leave_coalition"){const C=b.nation,S=Gt(C),A=(Array.isArray(W?.party_ids)?W.party_ids:[]).includes(e.id),P=!!it&&it.faction_id===e.id;S?W?!A||st?(w=!0,p.lockReason="You are in opposition."):P?(w=!0,p.lockReason="Prime Minister’s party cannot leave — resign first."):p.lockReason="":(w=!0,p.lockReason="No active coalition to leave."):(w=!0,p.lockReason="Only available in parliamentary systems.")}else if(p.id==="disband_party"){const C=ge(e);C.isPM?(w=!0,p.lockReason="You are Prime Minister — resign before disbanding."):C.isPresident?(w=!0,p.lockReason="You are the sitting President — step down before disbanding."):C.isMonarchActing?(w=!0,p.lockReason="The reigning monarch cannot disband the royal house."):p.lockReason=""}else p.id==="fundraise"&&(h="ACTION",I="#c8a832",g=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Themed event · positions you with a voter bloc</span>
                ${wt>0?'<span style="color:var(--orange);">Used this tick</span>':""}
            </div>`,wt>=1&&(w=!0,g+='<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Already hosted a fundraiser this tick.</div>'));const k=p.id==="form_minority_government"&&Y.metaLine?`<div class="pa-action-meta-minority" style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);font-weight:600;letter-spacing:0.3px;">${$(Y.metaLine)}</div>`:"";return`
            <div class="pa-action-item ${w?"locked":""}" data-action-id="${p.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(p.name)}</span>
                        <div class="pa-action-tags">${x}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${I};">${h}</span>
                    </div>
                </div>
                ${k}
                <div class="pa-action-desc">${$(p.desc)}</div>
                ${g}
                ${w&&p.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${$(p.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${i.color};background:${i.color}15;border-color:${i.color}33;">${r}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${i.color};">${s?(b.nation?.monarch_title||"KING").toUpperCase():i.title}</span>
                        <span class="pa-detail-name">${$(a)}</span>
                        ${o&&b.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${$(b.nation.dynasty_name)}</span>`:""}
                        ${ta(t)}
                    </div>
                    <div class="pa-detail-meta">${s?$((b.nation?.monarch_title||"King")+" of "+(b.nation?.name||"")):$(i.fullTitle)+" &middot; "+$(e.faction_name)}${d}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(b.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(o)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const p=F?.pm_party_id===e.id,x=b.nation?.hos_election_method==="elected"&&F?.president_party_id===e.id;return p?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':x?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':st?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        ${aa(t)}
        ${ea(t)}
        <div class="pa-actions-list">
            ${_}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${i.color};font-weight:700;">${i.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const po=[{id:"rally",name:"Hold a Rally",desc:"Pick a voter sector and spend party funds on a rally. Roll 1d6 plus a spend bonus — the result raises your popularity in that sector by +0.2 to +1.0. Never backfires.",cost:"$50k-$500k",costColor:"#8b9a6b",tags:["CAMPAIGN"],locked:!1},{id:"create_bloc",name:"Create Bloc",desc:"Found a pre-coalition alliance with other parties. Pick a name and invite any parties in your nation that aren't already in a bloc. Phase 1 is formation only — shared momentum, vote discipline, and coalition binding arrive in later phases.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["STRATEGIC","ALLIANCE"],locked:!1},{id:"leave_bloc",name:"Leave Bloc",desc:"Exit your current bloc. If you are the bloc leader, leaving dissolves the whole bloc and all pending invitations are withdrawn. Greyed out when you are not in a bloc.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"invite_to_bloc",name:"Invite Party to Bloc",desc:"Send a bloc invitation to an additional party. Leader-only. Eligible parties are in your nation, not already in a bloc, and not currently in government.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"impeach_president",name:"Impeach President",desc:"File articles of impeachment against the sitting President on charges of Abuse of Power, Gross Incompetence, or Constitutional Violation. Triggers a committee debate, then a floor vote requiring an absolute majority. If the motion passes, a 2/3 supermajority conviction vote follows. Presidential and Semi-Presidential systems only.",cost:"FREE",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1}],Me=[{spend:5e4,bonus:0,label:"$50k"},{spend:1e5,bonus:1,label:"$100k"},{spend:15e4,bonus:2,label:"$150k"},{spend:25e4,bonus:3,label:"$250k"},{spend:5e5,bonus:4,label:"$500k"}];function mo(a){const t=b.faction,e=t?.color||a.color,o=po.map(i=>{const n=i.tags.map(f=>`<span class="pa-action-tag" style="color:${Ct[f]||"var(--text-dim)"};">${f}</span>`).join("");let l=i.locked,c="";if(i.id==="create_bloc"){const f=ge(t);q?(l=!0,c=`Already in the ${q.name} bloc.`):f.isPM||f.isPresident||f.isMonarchActing?(l=!0,c="Head of Government cannot form blocs — you already lead the coalition."):(t.party_funds||0)<1e5&&(l=!0,c="Needs $100k party funds.")}else if(i.id==="leave_bloc")q?et&&(c=`Leaving dissolves ${q.name} — all members will be removed.`):(l=!0,c="You are not in a bloc.");else if(i.id==="invite_to_bloc")q?et||(l=!0,c="Only the bloc leader can send invitations."):(l=!0,c="You are not in a bloc.");else if(i.id==="impeach_president"){const m=(b.nation?.government_type||"").toLowerCase().includes("presidential"),r=Number(b.shard?.current_tick)||0,d=Number(b.nation?.impeachment_cooldown_until_tick)||0;m?lt?lt.faction_id===t.id?(l=!0,c="Your party holds the Presidency — you cannot impeach yourself."):(t.seats||0)<1?(l=!0,c="Need at least 1 seat in the legislature."):d>r&&(l=!0,c=`Impeachment cooldown: ${d-r} tick(s) remaining.`):(l=!0,c="No sitting President to impeach."):(l=!0,c="Presidential and Semi-Presidential systems only.")}return`
            <div class="pa-action-item ${l?"locked":""}" data-action-id="${i.id}">
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
        `}).join(""),s=ct(B.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${Q(B.first_name,B.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                        <span class="pa-detail-name">${$(B.first_name)} ${$(B.last_name)}</span>
                        ${ta(e)}
                    </div>
                    <div class="pa-detail-meta">${$(a.fullTitle)} &middot; Age ${B.age} &middot; Skill: <span style="color:${s.color};font-weight:700;">${B.skill}</span></div>
                </div>
            </div>
        </div>
        ${aa(e)}
        ${ea(e)}
        <div class="pa-actions-list" id="pa-actions-panel">${o}</div>
    `}function fo(a){const t=Ge(a),e=t.firstNames||[],o=t.lastNames||[];if(e.length===0||o.length===0)return[];const s=5+Math.floor(Math.random()*3),i=new Set,n=[];for(let l=0;l<s;l++){let c,f,m,r=0;do c=e[Math.floor(Math.random()*e.length)],f=o[Math.floor(Math.random()*o.length)],m=c+" "+f,r++;while(i.has(m)&&r<20);i.add(m);const d=20+Math.floor(Math.random()*66),u=28+Math.floor(Math.random()*30),y=Math.max(0,d-20)/65,v=Math.round((125e3+y*525e3)/25e3)*25e3;n.push({first_name:c,last_name:f,age:u,skill:d,hire_cost:v})}return n.sort((l,c)=>c.skill-l.skill)}async function Ne(a){const t=document.getElementById("pa-deputy-modal");if(!t)return;const e=b.nation?.name,o=fo(e);let s=null;function i(){const n=s!=null?o[s]:null,l=n?ct(n.skill):null,c=o.map((r,d)=>{const u=s===d,y=ct(r.skill);return`<div class="pa-hire-row ${u?"selected":""}" data-idx="${d}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${Q(r.first_name,r.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${u?"var(--text-bright)":"var(--text-secondary)"};">${$(r.first_name)} ${$(r.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${r.skill}%;background:${y.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${y.color};">${r.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${r.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(r.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let f;n?f=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${Q(n.first_name,n.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${$(n.first_name)} ${$(n.last_name)}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(b.faction?.party_funds||0)<n.hire_cost?' disabled title="Not enough funds"':""}>Hire ${$(n.first_name)}</button>
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
        `;const m=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",m),t.onclick=r=>{r.target===t&&m()},document.getElementById("pa-dep-list")?.addEventListener("click",r=>{const d=r.target.closest(".pa-hire-row");d&&(s=parseInt(d.dataset.idx,10),i())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const r=o[s],d=b.faction?.party_funds||0;if(d<r.hire_cost){alert("Not enough funds.");return}const u=document.getElementById("pa-dep-hire-confirm");u&&(u.disabled=!0,u.textContent="Hiring...");try{const y=d-r.hire_cost,v=b.shard?.current_tick||0,{data:_,error:p}=await E.from("faction_deputies").insert({faction_id:b.faction.id,first_name:r.first_name,last_name:r.last_name,age:r.age,skill:r.skill,status:"active",hired_at_tick:v}).select("*").single();if(p){alert("Failed: "+p.message);return}await E.from("factions").update({party_funds:y}).eq("id",b.faction.id),b.faction.party_funds=y,B=_,U="deputy",m(),R(a)}catch(y){console.error("[Deputy] Hire error:",y)}finally{u&&(u.disabled=!1)}})}t.classList.add("active"),i()}async function vo(a){const t=document.getElementById("pa-rally-modal");if(!t||!B)return;const e=b.faction;let o=null,s=null,i=null,n=!1;const l={not_authenticated:"You are not signed in.",no_sector:"Pick a sector to rally.",invalid_sector:"That sector is not available.",invalid_spend:"Invalid spend amount.",no_faction:"Rally unavailable: no party faction is linked to this account (or the 20270151 hold_rally migration is not deployed).",no_nation:"Rally unavailable: your party faction has no assigned nation.",no_shard:"Rally unavailable: game shard not found — contact admin.",already_rallied_this_tick:"You already held a rally this tick."};t.classList.add("active"),t.innerHTML='<div class="pa-modal" style="width:520px;"><div class="pa-modal-body" style="padding:24px;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">Loading sectors…</div></div>';const[c,f]=await Promise.all([E.from("sectors").select("id, name").eq("nation_id",b.nation?.id).eq("is_active",!0).order("name"),E.from("faction_sector_popularity").select("sector_id, popularity").eq("faction_id",e.id)]);c.error&&console.warn("[Rally] sector load failed:",c.error.message),f.error&&console.warn("[Rally] popularity load failed:",f.error.message);const m=new Map((f.data||[]).map(u=>[u.sector_id,Number(u.popularity)||0])),r=(c.data||[]).map(u=>({id:u.id,name:u.name,pop:m.get(u.id)||0}));function d(){const u=e.party_funds||0,y=r.length===0?'<div style="padding:10px;font-family:var(--font-mono);font-size:10px;color:#c55;">This nation has no voter sectors yet.</div>':r.map(g=>{const h=o===g.id;return`<div class="pa-action-item ${h?"selected":""}" data-sector="${g.id}" style="cursor:pointer;${h?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                    <div class="pa-action-top">
                        <span style="font-size:12px;font-weight:700;color:${h?"#8b9a6b":"var(--text-bright)"};">${$(g.name)}</span>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Pop ${(g.pop/10).toFixed(1)}</span>
                    </div>
                </div>`}).join(""),v=Me.map((g,h)=>{const I=u>=g.spend,w=s===h;return`<div class="pa-action-item ${w?"selected":""} ${I?"":"locked"}" data-tier="${h}" style="cursor:${I?"pointer":"not-allowed"};${w?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${w?"#8b9a6b":"var(--text-bright)"};">${g.label} Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${g.bonus} Roll Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${g.bonus} = range ${1+g.bonus} to ${6+g.bonus}</div>
            </div>`}).join("");let _="";i&&(_=`
                <div style="padding:16px;background:#5cc55c08;border:1px solid #5cc55c22;margin-top:12px;">
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5cc55c;margin-bottom:4px;">${$(i.outcomeName||"Rally held")}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-bottom:6px;">
                        Roll <strong>${i.roll}</strong> + bonus <strong>${i.bonus}</strong> = <strong>${i.total}</strong> &middot; ${$(i.sectorName||"")}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:#5cc55c;">
                        +${Number(i.popularityGain).toFixed(1)} Popularity
                    </div>
                </div>
            `);const p=n||o==null||s==null;t.innerHTML=`
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${$(B.first_name)} ${$(B.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${B.skill}</span>
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose a Sector</div>
                    <div id="rally-sectors">${y}</div>

                    <div class="pa-modal-step-label" style="margin-top:8px;">Choose Investment Level</div>
                    <div id="rally-tiers">${v}</div>

                    <div style="margin-top:8px;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                        <strong>Outcome:</strong> Roll 1d6 + spend bonus &rarr; popularity gain<br>
                        &le;2 = <span style="color:#ca5;">+0.2</span> &middot;
                        3-4 = <span style="color:#8b9a6b;">+0.4</span> &middot;
                        5-6 = <span style="color:#8b9a6b;">+0.6</span> &middot;
                        7-8 = <span style="color:#5cc55c;">+0.8</span> &middot;
                        &ge;9 = <span style="color:#5cc55c;">+1.0</span>
                    </div>

                    ${_}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${i?"Close":"Cancel"}</button>
                    ${i?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${p?"disabled":""}>${n?"Rolling…":"Hold Rally"}</button>`}
                </div>
            </div>
        `;const x=()=>{t.classList.remove("active"),i&&R(a)};document.getElementById("rally-close")?.addEventListener("click",x),document.getElementById("rally-cancel")?.addEventListener("click",x),t.onclick=g=>{g.target===t&&x()},document.getElementById("rally-sectors")?.addEventListener("click",g=>{const h=g.target.closest("[data-sector]");h&&(o=h.dataset.sector,d())}),document.getElementById("rally-tiers")?.addEventListener("click",g=>{const h=g.target.closest("[data-tier]");!h||h.classList.contains("locked")||(s=parseInt(h.dataset.tier,10),d())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(n||i||o==null||s==null)return;const g=Me[s];n=!0,d();try{const{data:h,error:I}=await E.rpc("hold_rally",{p_sector_id:o,p_spend:g.spend});if(I){console.error("[Rally] hold_rally RPC failed:",I.message),n=!1,alert("Rally failed. Please try again."),d();return}if(!h||h.success!==!0){n=!1;const w=h?.reason==="insufficient_funds"&&h?.need!=null?`Not enough party funds. Need $${Number(h.need).toLocaleString()}.`:l[h?.reason]||"Rally failed.";alert(w),d();return}h.newFunds!=null&&(b.faction.party_funds=h.newFunds),sessionStorage.removeItem("nationhood_state"),n=!1,i=h,d()}catch(h){console.error("[Rally] error:",h),n=!1,alert("Rally failed."),d()}})}d()}async function uo(a,t){const e=document.getElementById("pa-vola-invest-modal");if(!e)return;const{data:o}=await E.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",b.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),s=Number(o?.discretionary_balance)||0;let i=!1,n=null;function l(){const f=["low","moderate","high"].map(d=>({key:d,cfg:$a[d]})).map(d=>{const u=s>=d.cfg.cost,y="$"+d.cfg.cost/1e6;return`<div class="pa-action-item ${!u||i?"locked":""}" data-tier="${d.key}" style="cursor:${u&&!i?"pointer":"not-allowed"};">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${d.cfg.label}</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">+${d.cfg.gain} National Sports Culture</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Cost: ${y} from discretionary budget</div>
                ${u?"":`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);margin-top:4px;">Insufficient budget — need ${y}</div>`}
            </div>`}).join(""),m=n?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Investment applied</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    +${n.gain} National Sports Culture · new total <strong>${Number(n.newCulture).toFixed(1)}</strong><br>
                    $${(n.cost/1e6).toFixed(0)} deducted · remaining discretionary <strong>${ut(n.newBalance)}</strong>
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
                    Sports Ministry's discretionary budget — <strong style="color:${s>0?"var(--green)":"var(--red)"};">${ut(s)}</strong> available.
                    Top it up via a funding article on a passed bill. 1 tick cooldown.
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="vola-tiers">${f}</div>
                    ${m}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="vola-cancel">${n?"Close":"Cancel"}</button>
                </div>
            </div>
        `;const r=()=>{e.classList.remove("active"),n&&R(a)};document.getElementById("vola-close")?.addEventListener("click",r),document.getElementById("vola-cancel")?.addEventListener("click",r),e.onclick=d=>{d.target===e&&r()},document.getElementById("vola-tiers")?.addEventListener("click",async d=>{const u=d.target.closest("[data-tier]");if(!u||u.classList.contains("locked")||i||n)return;const y=u.dataset.tier;i=!0,l();try{const{data:v}=await E.from("shard").select("current_tick").eq("name","Alpha Shard").single(),_=Number(v?.current_tick)||0,p=await wa(E,b.nation,t.id,y,_);p?.success?n=p:alert("Could not invest: "+(p?.reason||"unknown error"))}catch(v){alert("Investment failed: "+(v?.message||v))}finally{i=!1,l()}})}e.classList.add("active"),l()}async function yo(a,t){const e=document.getElementById("pa-debt-payment-modal");if(!e)return;const o=h=>Math.floor((Number(h)||0)/1e6),s=2;let i="";const[n,l]=await Promise.all([E.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",b.nation.id).eq("ministry_key","finance").eq("is_active",!0).maybeSingle(),E.from("nations").select("debt").eq("id",b.nation.id).maybeSingle()]);(n.error||l.error)&&(i=(n.error||l.error).message||"Could not load ministry / nation data.");const c=o(n.data?.discretionary_balance),f=o(l.data?.debt),m=Math.max(0,c-s);let r=!1,d=null,u="",y=i;function v(){const h=parseInt(u,10);return Number.isFinite(h)?h:null}function _(){const h=v();return h!=null&&h>=1&&h<=m}function p(){const h=v(),I=h!=null&&h>=1?h+s:null,w=I!=null?c-I:c,k=h!=null&&h>=1?Math.max(0,f-h):f,C=_(),S=d?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Payment applied</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    $${d.payment} paid against debt · $${d.fee} transaction fee<br>
                    Discretionary: <strong>$${o(d.newBalance)}</strong> · Debt: <strong>$${o(d.newDebt)}</strong>
                </div>
            </div>
        `:"",M=y?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:6px;">${$(y)}</div>`:"";e.innerHTML=`
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

                    <div class="pa-modal-step-label">Payment Amount (whole dollars, 1 – ${m})</div>
                    <input id="pa-dp-input" class="pa-modal-input" type="number" min="1" max="${m}" step="1" placeholder="0" value="${$(u)}" ${d||r?"disabled":""} style="font-family:var(--font-mono);font-size:14px;">

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
                    ${M}
                    ${S}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-dp-cancel">${d?"Close":"Cancel"}</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dp-pay" ${!C||r||d||i?"disabled":""}>${r?"Paying…":"Pay"}</button>
                </div>
            </div>
        `;const A=()=>{e.classList.remove("active"),d&&R(a)};document.getElementById("pa-dp-close")?.addEventListener("click",A),document.getElementById("pa-dp-cancel")?.addEventListener("click",A),e.onclick=L=>{L.target===e&&A()};const P=document.getElementById("pa-dp-input");P&&(P.addEventListener("input",L=>{u=(L.target.value||"").replace(/[^0-9]/g,""),y=i,p();const N=document.getElementById("pa-dp-input");N&&(N.focus(),N.setSelectionRange(N.value.length,N.value.length))}),P.addEventListener("keydown",L=>{L.key==="Enter"&&_()&&!r&&!d&&!i&&(L.preventDefault(),x())})),document.getElementById("pa-dp-pay")?.addEventListener("click",x)}async function x(){if(r||d||i)return;const h=v();if(!_()){y=`Enter an integer between 1 and ${m}.`,p();return}r=!0,y="",p();try{const{data:I,error:w}=await E.rpc("pay_down_national_debt",{p_payment:h});w?y=w.message||"Payment failed.":I?.success?d=I:y=g(I?.reason)||"Payment failed."}catch(I){y=I?.message||"Network error."}finally{r=!1,p()}}function g(h){switch(h){case"invalid_payment":return"Enter an integer of at least $1.";case"not_minister":return"Only the Finance Minister can fire this action.";case"no_shard":return"Shard not initialized.";case"cooldown":return"Already used this tick. Try again next tick.";case"insufficient_balance":return"Not enough discretionary budget for fee + payment.";case"no_debt":return"There is no national debt to pay down.";default:return h||""}}e.classList.add("active"),p()}function go(){return(Ma.territorial_ownership?.starter_modifiers||[]).map(t=>{const e=Na[t]||{};return{modifier_key:t,category:e.category||"structural",applies_to:e.applies_to||"both",stat_effects:e.stat_effects||[],duration_remaining:e.duration??null,is_periodic:e.is_periodic||!1,periodic_interval:e.periodic_interval??null,periodic_duration:e.periodic_duration??null}})}async function bo(a,t){const e=document.getElementById("pa-press-claim-modal");if(!e)return;const o=b?.nation?.id,s=3,i=3e6,n=p=>Math.floor((Number(p)||0)/1e6);let l="",c=0,f=[];try{const[p,x,g]=await Promise.all([E.from("ministries").select("discretionary_balance").eq("nation_id",o).eq("ministry_key","foreign").eq("is_active",!0).maybeSingle(),E.from("diplomatic_relations").select("nation_a_id, nation_b_id, proximity").or(`nation_a_id.eq.${o},nation_b_id.eq.${o}`).eq("proximity",0),E.from("bilateral_issues").select("nation_a_id, nation_b_id").eq("issue_type","territorial_ownership").in("status",["active","partial"]).or(`nation_a_id.eq.${o},nation_b_id.eq.${o}`)]);if(p.error||x.error)throw p.error||x.error;c=Number(p.data?.discretionary_balance||0);const h=(x.data||[]).map(w=>w.nation_a_id===o?w.nation_b_id:w.nation_a_id),I=new Set((g.data||[]).map(w=>w.nation_a_id===o?w.nation_b_id:w.nation_a_id));if(h.length){const{data:w}=await E.from("nations").select("id, name").in("id",h);f=(w||[]).map(k=>({id:k.id,name:k.name,disputed:I.has(k.id)})).sort((k,C)=>String(k.name).localeCompare(String(C.name)))}}catch(p){l=p?.message||"Could not load bordering nations."}let m=!1,r=null,d=l,u=f.find(p=>!p.disputed)?.id||"";const y={farmland:"Farmland",minerals:"Minerals",energy:"Energy"};function v(){const p=c>=i,x=!!u,g=f.map(S=>`<option value="${$(S.id)}"${S.id===u?" selected":""}${S.disputed?" disabled":""}>${$(S.name)}${S.disputed?" — dispute active":""}</option>`).join(""),h=r?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Claim pressed</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    A territorial dispute has opened. What's at stake: <strong>${r.stake_quantity} ${$(y[r.stake_resource]||r.stake_resource||"")}</strong>.<br>
                    Track it under World &rarr; Diplomacy &rarr; Issues, or the Conflicts board.
                </div>
            </div>`:"",I=d?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:6px;">${$(d)}</div>`:"",w=f.length===0&&!l?'<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);">No bordering nations to press a claim against. Territorial claims can only be pressed against a nation you share a border with.</div>':`
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">DISCRETIONARY</div>
                        <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${p?"var(--green)":"var(--red)"};">$${n(c)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">COST</div>
                        <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c8a832;">$${s}</div>
                    </div>
                </div>
                <div class="pa-modal-step-label">Select a Nation</div>
                <select id="pa-pc-nation" class="pa-modal-input" ${r||m?"disabled":""} style="font-family:var(--font-ui);font-size:12px;">${g}</select>
                <div class="pa-modal-step-label">Select a Claim</div>
                <select class="pa-modal-input" disabled style="font-family:var(--font-ui);font-size:12px;"><option>Territorial Dispute</option></select>
                ${I}
                ${h}
            `;e.innerHTML=`
            <div class="pa-modal" style="width:460px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Press Claim</span>
                    </div>
                    <button class="pa-modal-close" id="pa-pc-close">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    Your nation will press a claim that is important to it, though this may bring you into active armed conflict if tensions escalate too high. Costs $${s} from the Foreign Ministry discretionary budget.
                </div>
                <div class="pa-modal-body" style="gap:10px;">${w}</div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-pc-cancel">${r?"Close":"Cancel"}</button>
                    ${r?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="pa-pc-press" ${!x||!p||m||l||f.length===0?"disabled":""}>${m?"Pressing…":"Press"}</button>`}
                </div>
            </div>`;const k=()=>{e.classList.remove("active"),r&&R(a)};document.getElementById("pa-pc-close")?.addEventListener("click",k),document.getElementById("pa-pc-cancel")?.addEventListener("click",k),e.onclick=S=>{S.target===e&&k()};const C=document.getElementById("pa-pc-nation");C&&C.addEventListener("change",S=>{u=S.target.value}),document.getElementById("pa-pc-press")?.addEventListener("click",_)}async function _(){if(!(m||r||!u)){m=!0,d="",v();try{const{data:p,error:x}=await E.rpc("press_claim",{p_target_nation_id:u,p_modifiers:go(),p_region_name:null,p_stake_resource:null,p_stake_quantity:null});if(x)d=x.message||"Could not press the claim.";else if(!p?.ok)d=p?.message||"Could not press the claim.";else{r=p;const g=b?.nation?.name||"A nation",h=f.find(I=>I.id===u)?.name||"another nation";await Ta(E,{eventName:"Territorial Claim Pressed",triggerKey:"dispute_press_claim",description:`${g} has pressed a territorial claim against ${h}.`,category:"diplomacy",currentTick:b?.shard?.current_tick})}}catch(p){d=p?.message||"Network error."}finally{m=!1,v()}}}e.classList.add("active"),v()}async function xo(a,t){const e=document.getElementById("pa-ceasefire-modal");if(!e)return;const o=b?.nation?.id;let s="",i=[];try{const{data:u,error:y}=await E.from("diplomatic_relations").select("nation_a_id, nation_b_id, relation_type, ceasefire_offer_nation_id").or(`nation_a_id.eq.${o},nation_b_id.eq.${o}`).eq("relation_type","war");if(y)throw y;const v=(u||[]).map(p=>p.nation_a_id===o?p.nation_b_id:p.nation_a_id),_=new Set((u||[]).filter(p=>p.ceasefire_offer_nation_id===o).map(p=>p.nation_a_id===o?p.nation_b_id:p.nation_a_id));if(v.length){const{data:p}=await E.from("nations").select("id, name").in("id",v);i=(p||[]).map(x=>({id:x.id,name:x.name,offered:_.has(x.id)})).sort((x,g)=>String(x.name).localeCompare(String(g.name)))}}catch(u){s=u?.message||"Could not load your wars."}let n=!1,l=null,c=s,f=i[0]?.id||"";const m=()=>i.find(u=>u.id===f)||null;function r(){const y=!!m()&&!n&&!l,v=i.map(I=>`<option value="${$(I.id)}"${I.id===f?" selected":""}>${$(I.name)}${I.offered?" — already requested":""}</option>`).join(""),_=l?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.25);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--amber,#c8a832);margin-bottom:4px;">Ceasefire requested</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);line-height:1.5;">
                    The enemy's head of government must accept it in their War Room. Until they do, the war continues.
                </div>
            </div>`:"",p=c?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:6px;">${$(c)}</div>`:"",x=i.length===0&&!s?'<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);">You are not at war with anyone. A ceasefire can only be requested during an active war.</div>':`
                <div class="pa-modal-step-label">Select a War</div>
                <select id="pa-cf-nation" class="pa-modal-input" ${l||n?"disabled":""} style="font-family:var(--font-ui);font-size:12px;">${v}</select>
                <div style="margin-top:10px;padding:10px 12px;border:1px solid rgba(200,168,50,0.3);border-radius:3px;background:rgba(200,168,50,0.06);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.5;">
                    <span style="color:var(--amber,#c8a832);font-weight:700;">White peace.</span> The fighting stops and the front line <strong>freezes where it stands</strong> — each side keeps the ground it currently holds, and the dispute ends. The other nation's head of government must accept — you cannot end the war alone.
                </div>
                ${p}
                ${_}
            `;e.innerHTML=`
            <div class="pa-modal" style="width:460px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:var(--amber,#c8a832);"></div>
                        <span class="pa-modal-title">Request Ceasefire</span>
                    </div>
                    <button class="pa-modal-close" id="pa-cf-close">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    Sue for peace. The enemy's head of government decides whether to accept.
                </div>
                <div class="pa-modal-body" style="gap:10px;">${x}</div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-cf-cancel">${l?"Close":"Cancel"}</button>
                    ${l?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="pa-cf-send" ${y?"":"disabled"}>${n?"Requesting…":"Request Ceasefire"}</button>`}
                </div>
            </div>`;const g=()=>{e.classList.remove("active"),l&&R(a)};document.getElementById("pa-cf-close")?.addEventListener("click",g),document.getElementById("pa-cf-cancel")?.addEventListener("click",g),e.onclick=I=>{I.target===e&&g()};const h=document.getElementById("pa-cf-nation");h&&h.addEventListener("change",I=>{f=I.target.value,r()}),document.getElementById("pa-cf-send")?.addEventListener("click",d)}async function d(){const u=m();if(!(n||l||!u)){n=!0,c="",r();try{const{data:y,error:v}=await E.rpc("request_ceasefire",{p_target_nation_id:f});v?c=v.message||"Could not request ceasefire.":y?.ok?l=y:c=y?.message||"Could not request ceasefire."}catch(y){c=y?.message||"Network error."}finally{n=!1,r()}}}e.classList.add("active"),r()}async function ho(a,t){const e=document.getElementById("pa-declare-war-modal");if(!e)return;const o=b?.nation?.id;let s="",i=[];try{const{data:u,error:y}=await E.from("diplomatic_relations").select("nation_a_id, nation_b_id, relation_type").or(`nation_a_id.eq.${o},nation_b_id.eq.${o}`).eq("proximity",0);if(y)throw y;const v=(u||[]).map(p=>p.nation_a_id===o?p.nation_b_id:p.nation_a_id),_=new Set((u||[]).filter(p=>p.relation_type==="war").map(p=>p.nation_a_id===o?p.nation_b_id:p.nation_a_id));if(v.length){const{data:p}=await E.from("nations").select("id, name").in("id",v);i=(p||[]).map(x=>({id:x.id,name:x.name,atWar:_.has(x.id)})).sort((x,g)=>String(x.name).localeCompare(String(g.name)))}}catch(u){s=u?.message||"Could not load bordering nations."}let n=!1,l=null,c=s,f=i.find(u=>!u.atWar)?.id||"";const m=()=>i.find(u=>u.id===f)||null;function r(){const u=m(),y=!!u&&!u.atWar&&!n&&!l,v=i.map(I=>`<option value="${$(I.id)}"${I.id===f?" selected":""}${I.atWar?" disabled":""}>${$(I.name)}${I.atWar?" — already at war":""}</option>`).join(""),_=l?`
            <div style="padding:12px;background:rgba(200,60,60,0.08);border:1px solid rgba(200,60,60,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--red);margin-bottom:4px;">Declaration filed</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);line-height:1.5;">
                    The motion is now before parliament and requires a <strong>supermajority</strong> to pass. If it carries, the two nations enter a state of war and the fronts between them activate.
                </div>
            </div>`:"",p=c?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:6px;">${$(c)}</div>`:"",x=i.length===0&&!s?'<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);">No bordering nations to declare war on. War can only be declared against a nation you share a border with.</div>':`
                <div class="pa-modal-step-label">Select a Nation</div>
                <select id="pa-dw-nation" class="pa-modal-input" ${l||n?"disabled":""} style="font-family:var(--font-ui);font-size:12px;">${v}</select>
                <div style="margin-top:10px;padding:10px 12px;border:1px solid rgba(200,60,60,0.3);border-radius:3px;background:rgba(200,60,60,0.06);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.5;">
                    <span style="color:var(--red);font-weight:700;">Casus Belli — Our Honor.</span> An unprovoked war, paid on filing: <strong>−10 Public Approval</strong> and <strong>−3.0 popularity</strong> with your party in every sector. (Territorial wars start automatically when a dispute hits maximum tension — no declaration needed.)
                </div>
                ${p}
                ${_}
            `;e.innerHTML=`
            <div class="pa-modal" style="width:460px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:var(--red);"></div>
                        <span class="pa-modal-title">Declare War</span>
                    </div>
                    <button class="pa-modal-close" id="pa-dw-close">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    File a declaration of war before parliament. Passage requires a supermajority. Until it passes, your nations are not at war.
                </div>
                <div class="pa-modal-body" style="gap:10px;">${x}</div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-dw-cancel">${l?"Close":"Cancel"}</button>
                    ${l?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="pa-dw-file" ${y?"":"disabled"}>${n?"Filing…":"Declare"}</button>`}
                </div>
            </div>`;const g=()=>{e.classList.remove("active"),l&&R(a)};document.getElementById("pa-dw-close")?.addEventListener("click",g),document.getElementById("pa-dw-cancel")?.addEventListener("click",g),e.onclick=I=>{I.target===e&&g()};const h=document.getElementById("pa-dw-nation");h&&h.addEventListener("change",I=>{f=I.target.value,r()}),document.getElementById("pa-dw-file")?.addEventListener("click",d)}async function d(){const u=m();if(!(n||l||!u||u.atWar)){n=!0,c="",r();try{const{data:y,error:v}=await E.rpc("declare_war",{p_target_nation_id:f});v?c=v.message||"Could not declare war.":y?.success?l=y:c=y?.error||"Could not declare war."}catch(y){c=y?.message||"Network error."}finally{n=!1,r()}}}e.classList.add("active"),r()}async function _o(a){const t=document.getElementById("pa-allocate-funds-modal");if(!t)return;const e=w=>Math.floor((Number(w)||0)/1e6),o=b?.nation?.name||"the Nation";let s="";const[i,n]=await Promise.all([E.from("ministries").select("discretionary_balance").eq("nation_id",b.nation.id).eq("ministry_key","defense").eq("is_active",!0).maybeSingle(),E.from("factions").select("party_funds").eq("nation_id",b.nation.id).eq("faction_type","military").eq("branch","army").is("abandoned_at",null).or("is_banned.is.null,is_banned.eq.false").order("created_at",{ascending:!0}).limit(1).maybeSingle()]);i.error&&(s=i.error.message||"Could not load ministry data."),n.error&&n.error.code!=="PGRST116"&&(s=s||n.error.message||"Could not load army faction.");const l=e(i.data?.discretionary_balance),c=n.data||null,f=!!c,m=e(c?.party_funds),r=Math.max(0,l);let d=!1,u=null,y="",v=s;function _(){const w=parseInt(y,10);return Number.isFinite(w)?w:null}function p(){const w=_();return f&&w!=null&&w>=1&&w<=r}function x(w,k){return`
            <div style="border:1px solid var(--border-main);padding:10px 12px;${k.enabled?"":"opacity:0.45;"}">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);letter-spacing:0.04em;">${$(w)}</div>
                ${k.note?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">${$(k.note)}</div>`:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
                        <div><div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.06em;">CURRENT BRIGADES</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);">${k.brigades}</div></div>
                        <div><div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.06em;">CURRENT BUDGET</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">$${k.budget}</div></div>
                    </div>`}
            </div>`}function g(){const w=_(),k=p(),C=w!=null&&w>=1?l-w:l,S=w!=null&&w>=1?m+w:m,M=u?`
            <div style="padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);margin-top:12px;">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Funds allocated</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    $${u.allocated} → Army of ${$(o)}<br>
                    Discretionary: <strong>$${e(u.newBalance)}</strong> · Army budget: <strong>$${e(u.newArmyFunds)}</strong>
                </div>
            </div>`:"",A=v?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:6px;">${$(v)}</div>`:"";t.innerHTML=`
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
                        <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${l>0?"var(--green)":"var(--red)"};">$${l}</div>
                    </div>

                    ${x(`Army of ${o}`,f?{enabled:!0,brigades:0,budget:m}:{enabled:!1,note:"No army established."})}

                    ${f?`
                        <div class="pa-modal-step-label">Allocate to Army (whole dollars, 1 – ${r})</div>
                        <input id="pa-af-input" class="pa-modal-input" type="number" min="1" max="${r}" step="1" placeholder="0" value="${$(y)}" ${u||d?"disabled":""} style="font-family:var(--font-mono);font-size:14px;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:4px;">
                            <div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">AFTER · DISCRETIONARY</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${C>=0?"var(--text-bright)":"var(--red)"};">$${C}</div></div>
                            <div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">AFTER · ARMY BUDGET</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">$${S}</div></div>
                        </div>
                    `:""}

                    ${x(`Navy of ${o}`,{enabled:!1,note:"Not yet established."})}
                    ${x(`Air Force of ${o}`,{enabled:!1,note:"Not yet established."})}
                    ${A}
                    ${M}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-af-cancel">${u?"Close":"Cancel"}</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-af-submit" ${!k||d||u||s?"disabled":""}>${d?"Allocating…":"Allocate"}</button>
                </div>
            </div>
        `;const P=()=>{t.classList.remove("active"),u&&R(a)};document.getElementById("pa-af-close")?.addEventListener("click",P),document.getElementById("pa-af-cancel")?.addEventListener("click",P),t.onclick=N=>{N.target===t&&P()};const L=document.getElementById("pa-af-input");L&&(L.addEventListener("input",N=>{y=(N.target.value||"").replace(/[^0-9]/g,""),v=s,g();const T=document.getElementById("pa-af-input");T&&(T.focus(),T.setSelectionRange(T.value.length,T.value.length))}),L.addEventListener("keydown",N=>{N.key==="Enter"&&p()&&!d&&!u&&!s&&(N.preventDefault(),h())})),document.getElementById("pa-af-submit")?.addEventListener("click",h)}async function h(){if(d||u||s)return;if(!p()){v=`Enter an integer between 1 and ${r}.`,g();return}const w=_();d=!0,v="",g();try{const{data:k,error:C}=await E.rpc("allocate_defense_funds",{p_branch:"army",p_amount:w});C?v=C.message||"Allocation failed.":k?.success?u=k:v=I(k?.reason)||"Allocation failed."}catch(k){v=k?.message||"Network error."}finally{d=!1,g()}}function I(w){switch(w){case"not_authenticated":return"You are not signed in.";case"branch_unavailable":return"Only the Army can receive funds right now.";case"invalid_amount":return"Enter an integer of at least $1.";case"not_minister":return"Only the Minister of Defense can allocate funds.";case"insufficient_funds":return"Not enough discretionary budget for that allocation.";case"no_army_faction":return"No army has been established for this nation yet.";default:return w||""}}t.classList.add("active"),g()}async function Te(a,t){const e=document.getElementById("pa-cb-rate-modal");if(!e)return;const o=t==="lower",s=o?"Lower":"Raise";let i=3,n=!1,l=null,c="";function f(){const r=b?.nation||{},d=Number(r.central_bank_interest_rate??5),u=Number(r.central_bank_discretionary??0),y=o?-i:i,v=Math.max(0,Math.min(20,d+y)),_=o?`+${3*i} GDP growth`:`−${5*i} GDP growth`,p=[1,2,3].map(I=>`<button class="pa-modal-btn ${I===i?"pa-modal-btn--submit":""}" data-pct="${I}" ${l||n?"disabled":""} style="${I===i?"background:#c8a832;":"background:transparent;border:1px solid var(--border-main);color:var(--text-secondary);"}padding:6px 14px;font-size:12px;">${I}%</button>`).join(""),x=l?`
            <div style="margin-top:12px;padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Rate updated</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">New policy rate <strong>${Number(l.rate).toFixed(2)}%</strong> · lending pool <strong>$${Ft(l.discretionary).toLocaleString()}</strong></div>
            </div>`:"",g=c?`<div style="font-family:var(--font-mono);font-size:10px;color:var(--red);margin-top:8px;">${$(c)}</div>`:"";e.innerHTML=`
            <div class="pa-modal" style="width:460px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">${s} Interest</span>
                    </div>
                    <button class="pa-modal-close" id="pa-cb-close">&times;</button>
                </div>
                <div style="padding:10px 16px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    Costs <strong style="color:#c8a832;">$1</strong> from the lending pool ($${Ft(u).toLocaleString()} available). ${o?"Stimulus — raises GDP growth.":"Tightening — lowers GDP growth."} Rate clamps 0–20%.
                </div>
                <div class="pa-modal-body" style="gap:12px;">
                    <div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">CURRENT RATE</div>
                        <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:#c8a832;">${d.toFixed(2)}%</div>
                    </div>
                    <div class="pa-modal-step-label">${s} by</div>
                    <div style="display:flex;gap:8px;">${p}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:4px;">
                        <div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">PROJECTED RATE</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${v.toFixed(2)}%</div></div>
                        <div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">GDP EFFECT</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${o?"var(--green)":"var(--red)"};">${_}</div></div>
                    </div>
                    ${g}
                    ${x}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-cb-cancel">${l?"Close":"Cancel"}</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-cb-submit" ${n||l?"disabled":""}>${n?"Working…":s}</button>
                </div>
            </div>`;const h=()=>{e.classList.remove("active"),l&&R(a)};document.getElementById("pa-cb-close")?.addEventListener("click",h),document.getElementById("pa-cb-cancel")?.addEventListener("click",h),e.onclick=I=>{I.target===e&&h()},e.querySelectorAll("[data-pct]").forEach(I=>I.addEventListener("click",()=>{i=parseInt(I.dataset.pct,10),c="",f()})),document.getElementById("pa-cb-submit")?.addEventListener("click",m)}async function m(){if(!(n||l)){n=!0,c="",f();try{const{data:r,error:d}=await E.rpc("central_bank_set_rate",{p_direction:t,p_pct:i});d?c=d.message||"Rate change failed.":r?.success?(l=r,b.nation.central_bank_interest_rate=r.rate,b.nation.central_bank_discretionary=r.discretionary,r.gdpGrowth!=null&&(b.nation.gdp_growth=r.gdpGrowth)):c=$o(r?.reason)}catch(r){c=r?.message||"Network error."}finally{n=!1,f()}}}e.classList.add("active"),f()}function $o(a){switch(a){case"not_authenticated":return"You are not signed in.";case"not_governor":return"Only the Governor of the Central Bank can move the rate.";case"term_expired":return"The Governor's term has ended — a successor must be appointed.";case"insufficient_discretionary":return"The lending pool is empty — $1 is required.";case"rate_at_limit":return"The rate is already at its limit (0% or 20%).";case"invalid_direction":case"invalid_pct":return"Invalid rate change.";default:return a||"Action failed."}}async function wo(a,t){const e=document.getElementById("pa-vola-stadium-modal");if(!e)return;let o="",s="",i=null,n=!1,l=null,c=[],f=null;async function m(){const{data:u}=await E.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",b.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),y=Number(u?.discretionary_balance)||0,{data:v}=await E.from("corp_contracts").select("id, name, description, spec_category, expires_at_tick, created_at_tick").eq("issuer_nation_id",b.nation.id).eq("project_subtype","Vola Stadium").eq("status","open").order("created_at_tick",{ascending:!1}).limit(1).maybeSingle();if(l=v||null,c=[],l){const{data:_}=await E.from("corp_contract_bids").select("id, faction_id, bid_amount, quoted_timeline_months, status, created_at_tick, factions:faction_id(id, faction_name, nation_id, nations:nation_id(name))").eq("contract_id",l.id).eq("status","pending").order("created_at_tick",{ascending:!0});c=_||[]}return{balance:y,hasMinister:!!u,isMinister:u?.party_id===t.id}}async function r(){const{balance:u,hasMinister:y,isMinister:v}=await m(),_=["small","modest","extravagant"].map(k=>({key:k,cfg:ka[k]})),p=u>0?"var(--green)":"var(--red)";let x="";if(l){const k=l.spec_category==="Light Infrastructure"?2:l.spec_category==="Heavy Infrastructure"?4:l.spec_category==="Megaproject"?9:0,C=(l.description||"").replace(/^Home of:\s*/i,"").trim();if(x+=`
                <div class="pa-modal-step-label">Open Stadium Contract</div>
                <div class="pa-action-item" style="cursor:default;">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${$(l.name)}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">Floor +${k}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        ${C?"Home of "+$(C)+" · ":""}${$(l.spec_category)}
                    </div>
                </div>
            `,x+=`<div class="pa-modal-step-label" style="margin-top:14px;">Submitted Stadium Bids ${c.length?"· "+c.length:""}</div>`,c.length===0)x+='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;text-align:center;">Awaiting corporate bids…</div>';else{const S=M=>{if(M==null)return"—";const A=["January","February","March","April","May","June","July","August","September","October","November","December"],P=2e3+Math.floor(M/12);return`${A[M%12]}, ${P}`};x+=c.map(M=>{const A=M.factions?.faction_name||"Unknown Corp",P=M.factions?.nations?.name||"—",L=Number(M.bid_amount||0),N=L>=1e9?"$"+(L/1e9).toFixed(2)+"B":L>=1e6?"$"+(L/1e6).toFixed(1)+"M":"$"+Math.round(L).toLocaleString(),T=Number(M.quoted_timeline_months||0),z=Number(M.created_at_tick||0)+T;return`<div class="pa-action-item" style="cursor:default;" data-bid-id="${$(M.id)}">
                        <div class="pa-action-top">
                            <div>
                                <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${$(A)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                                    HQ ${$(P)} · Price ${N} · Timeline ${T} ticks · Finished ${S(z)}
                                </div>
                            </div>
                            <div style="display:flex;gap:6px;">
                                <button class="pa-modal-btn pa-modal-btn--submit" data-action="accept" data-bid-id="${$(M.id)}" ${n?"disabled":""} style="padding:4px 10px;font-size:9px;background:#5cc55c;border-color:#5cc55c;">Accept</button>
                                <button class="pa-modal-btn pa-modal-btn--cancel" data-action="reject" data-bid-id="${$(M.id)}" ${n?"disabled":""} style="padding:4px 10px;font-size:9px;">Reject</button>
                            </div>
                        </div>
                    </div>`}).join("")}}else{const k=_.map(C=>{const S=u>=C.cfg.postingCost,M=i===C.key,A="$"+C.cfg.postingCost/1e6,P="$"+C.cfg.budgetTarget/1e6+"M";return`<div class="pa-action-item ${!S||n?"locked":""} ${M?"selected":""}" data-size="${C.key}" style="cursor:${S&&!n?"pointer":"not-allowed"};${M?"border-color:#c8a832;background:rgba(200,168,50,0.06);":""}">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:${M?"#c8a832":"var(--text-bright)"};">${C.cfg.label}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;">Floor +${C.cfg.floorContribution}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        Discretionary ${A} · Contract budget ${P} · Timeline ~${C.cfg.timelineMonths} ticks · ${C.cfg.crewsRequired} crew${C.cfg.crewsRequired===1?"":"s"} required
                    </div>
                    ${S?"":`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);margin-top:4px;">Insufficient discretionary — need ${A}</div>`}
                </div>`}).join("");x=`
                <div class="pa-modal-step-label">Stadium Name</div>
                <input id="vola-stadium-name" type="text" maxlength="60"
                       placeholder="e.g. Coastal Vola Park"
                       value="${$(o)}"
                       style="width:100%;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:12px;">

                <div class="pa-modal-step-label" style="margin-top:14px;">Home Of</div>
                <input id="vola-stadium-team" type="text" maxlength="60"
                       placeholder="e.g. F.C. Drevlak / Sporting San Maria / Real Avelia"
                       value="${$(s)}"
                       style="width:100%;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:12px;">

                <div class="pa-modal-step-label" style="margin-top:14px;">Choose Stadium Size</div>
                <div id="vola-stadium-tiers">${k}</div>

                ${f?`<div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${$(f)}</div>`:""}
            `}const g=l?`<button class="pa-modal-btn pa-modal-btn--cancel" id="vola-stadium-cancel-bid" ${n?"disabled":""}>Cancel Bid</button>
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
                    ${y&&v?`Posting cost pulls from the Sports Ministry's discretionary budget — <strong style="color:${p};">${ut(u)}</strong> available. Top it up via a funding article on a passed bill.`:'<span style="color:var(--red);">You are no longer the active Sports Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${x}
                </div>
                <div class="pa-modal-footer">${g}</div>
            </div>
        `;const h=()=>e.classList.remove("active");document.getElementById("vola-stadium-x")?.addEventListener("click",h),document.getElementById("vola-stadium-close")?.addEventListener("click",h),e.onclick=k=>{k.target===e&&h()};const I=document.getElementById("vola-stadium-name"),w=document.getElementById("vola-stadium-team");I?.addEventListener("input",k=>{o=k.target.value,document.getElementById("vola-stadium-post").disabled=!o.trim()||!i||n}),w?.addEventListener("input",k=>{s=k.target.value}),document.getElementById("vola-stadium-tiers")?.addEventListener("click",k=>{const C=k.target.closest("[data-size]");!C||C.classList.contains("locked")||n||(i=C.dataset.size,r())}),document.getElementById("vola-stadium-post")?.addEventListener("click",async()=>{if(!(n||!i||!o.trim())){n=!0,f=null,r();try{const{data:k}=await E.from("shard").select("current_tick").eq("name","Alpha Shard").single(),C=Number(k?.current_tick)||0,S=await Ea(E,b.nation,t.id,{stadiumName:o.trim(),teamName:s.trim(),size:i},C);S?.success?(i=null,o="",s="",await r()):f=d(S?.reason)||"Could not post: "+(S?.reason||"unknown error")}catch(k){f="Posting failed: "+(k?.message||k)}finally{n=!1,r()}}}),document.querySelectorAll("[data-action]").forEach(k=>{k.addEventListener("click",async C=>{if(n)return;const S=k.dataset.action,M=k.dataset.bidId;if(M){n=!0,r();try{if(S==="accept"){const{data:A,error:P}=await E.rpc("award_stadium_bid_to_corp",{p_bid_id:M});if(P)throw P;if(!A?.success)throw new Error(A?.error||"Award failed")}else if(S==="reject"){const{data:A,error:P}=await E.rpc("reject_stadium_bid",{p_bid_id:M});if(P)throw P;if(!A?.success)throw new Error(A?.error||"Reject failed")}}catch(A){alert("Action failed: "+(A?.message||A))}finally{n=!1,r()}}})}),document.getElementById("vola-stadium-cancel-bid")?.addEventListener("click",async()=>{if(!(n||!l)&&confirm(`Cancel this stadium contract?

Discretionary cost will be refunded.`)){n=!0,r();try{const{data:k,error:C}=await E.rpc("cancel_stadium_contract",{p_contract_id:l.id});if(C)throw C;if(!k?.success)throw new Error(k?.error||"Cancel failed");l=null,c=[]}catch(k){alert("Cancel failed: "+(k?.message||k))}finally{n=!1,r()}}})}function d(u){return{no_minister:"No active Sports Minister.",not_minister:"Only the Sports Minister can post stadium contracts.",insufficient_balance:"Sports discretionary budget is below the tier cost — pass a funding bill first.",already_open:"A stadium contract is already open. Wait for it to resolve, or cancel it first.",no_stadium_name:"Stadium name is required.",invalid_size:"Pick a stadium size first.",insert_failed:"Could not post the contract. Try again in a moment."}[u]}e.classList.add("active"),await r()}async function ko(a,t){const e=document.getElementById("pa-expand-infra-modal");if(!e)return;let o=null,s=null,i=!1,n=null,l=[],c=null;async function f(){const{data:r}=await E.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",b.nation.id).eq("ministry_key","interior").eq("is_active",!0).maybeSingle(),d=Number(r?.discretionary_balance)||0,{data:u}=await E.from("ent_construction_contracts").select("id, name, budget, status, spec_category:spec_tier, timeline_months:timeline_ticks, expires_at_tick:bidding_closes_tick, created_at_tick").eq("issuer_nation_id",b.nation.id).eq("contract_type","government").in("status",["open","active"]).order("created_at_tick",{ascending:!1}).limit(1).maybeSingle();if(n=u||null,l=[],n&&n.status!=="active"){const{data:y}=await E.from("ent_construction_bids").select("id, bid_amount, status, created_tick, factions:entrepreneur_corps!bidder_corp_id(faction_name:name)").eq("contract_id",n.id).eq("status","pending").order("bid_amount",{ascending:!0});l=y||[]}if(!o){const{data:y,error:v}=await E.rpc("interior_infrastructure_tiers");v?(c="Could not load tier specs: "+v.message,o={}):o=y||{}}return{balance:d,isMinister:!!r&&r.party_id===t.id}}async function m(){const{balance:r,isMinister:d}=await f(),u=r>0?"var(--green)":"var(--red)",y=g=>"$"+(Number(g)/1e6).toFixed(Number(g)%1e6===0?0:1)+"M",v=n?.status==="active";let _="";if(n)_+=`
                <div class="pa-modal-step-label">${v?"Active Infrastructure Contract":"Open Infrastructure Contract"}</div>
                <div class="pa-action-item" style="cursor:default;">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${$(n.name)}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5aafa5;">${y(n.budget)}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        ${$(n.spec_category)} · Timeline ${n.timeline_months} ticks${v?"":` · Bidding closes tick ${n.expires_at_tick}`}
                    </div>
                </div>
            `,v?_+='<div style="margin-top:10px;padding:10px 12px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);background:rgba(90,175,165,0.06);border:1px solid rgba(90,175,165,0.2);">Construction is underway. Stat boosts apply on completion.</div>':(_+=`<div class="pa-modal-step-label" style="margin-top:14px;">Pending Bids ${l.length?"· "+l.length:""}</div>`,l.length===0?_+='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;text-align:center;">Awaiting construction corporation bids…</div>':_+='<div id="expand-infra-bids">'+l.map(g=>{const h=g.factions?.faction_name||"Unknown Corp",I=Number(g.bid_amount||0),w=I>=1e9?"$"+(I/1e9).toFixed(2)+"B":I>=1e6?"$"+(I/1e6).toFixed(1)+"M":"$"+Math.round(I).toLocaleString(),k=i||!d?" disabled":"";return`<div class="pa-action-item" style="cursor:default;">
                            <div class="pa-action-top">
                                <div>
                                    <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${$(h)}</div>
                                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Bid ${w}</div>
                                </div>
                            </div>
                            ${d?`<div style="display:flex;gap:8px;margin-top:10px;">
                                <button class="pa-modal-btn pa-modal-btn--submit" data-bid-action="accept" data-bid-id="${$(g.id)}" style="flex:1;min-height:36px;background:#5aafa5;"${k}>Accept</button>
                                <button class="pa-modal-btn pa-modal-btn--cancel" data-bid-action="reject" data-bid-id="${$(g.id)}" style="flex:1;min-height:36px;"${k}>Reject</button>
                            </div>`:""}
                        </div>`}).join("")+"</div>",_+=`<div style="margin-top:10px;padding:8px 10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);">${d?"Accept any bid to award immediately, or reject specific bidders. If no action is taken, the lowest remaining bid auto-wins when the window closes.":"The lowest qualifying bid wins automatically when the bid window closes."}</div>`,c&&(_+=`<div style="margin-top:8px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${$(c)}</div>`));else{const g=["small","modest","extravagant"],h={small:"SMALL",modest:"MODEST",extravagant:"EXTRAVAGANT"};_=`
                <div class="pa-modal-step-label">Choose Tier</div>
                <div id="expand-infra-tiers">${g.map(w=>{const k=o?.[w];if(!k)return"";const C=Number(k.post_cost||0),S=Number(k.budget||0),M=r>=C,A=s===w,P=(k.stat_effects||[]).map(L=>{const N=Number(L.delta)>=0?"+":"",T=String(L.stat).replace(/_/g," ").replace(/\b\w/g,z=>z.toUpperCase());return`<span class="pa-action-tag" style="color:var(--green);">${N}${L.delta} ${T}</span>`}).join(" ");return`<div class="pa-action-item ${!M||i?"locked":""} ${A?"selected":""}" data-size="${w}" style="cursor:${M&&!i?"pointer":"not-allowed"};${A?"border-color:#5aafa5;background:rgba(90,175,165,0.06);":""}">
                    <div class="pa-action-top">
                        <span style="font-size:13px;font-weight:700;color:${A?"#5aafa5":"var(--text-bright)"};">${$(k.name||h[w])}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5aafa5;">${h[w]}</span>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                        Post fee ${y(C)} · Contract budget ${y(S)} · Timeline ${k.timeline} ticks
                    </div>
                    ${P?`<div class="pa-action-tags" style="margin-top:4px;">${P}</div>`:""}
                    ${M?"":`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);margin-top:4px;">Insufficient discretionary — need ${y(C)}</div>`}
                </div>`}).join("")}</div>
                ${c?`<div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${$(c)}</div>`:""}
            `}const p=n?'<button class="pa-modal-btn" id="expand-infra-close" style="background:var(--bg-card);">Close</button>':`<button class="pa-modal-btn pa-modal-btn--cancel" id="expand-infra-close">Cancel</button>
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
                    ${d?`Post fee pulls from the Interior Ministry's discretionary budget — <strong style="color:${u};">${ut(r)}</strong> available. Construction corps bid; the best-scoring bid (cost, timeline, reputation) auto-wins when the bid window closes. Stat boosts apply on completion.`:'<span style="color:var(--red);">You are no longer the active Interior Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${_}
                </div>
                <div class="pa-modal-footer">${p}</div>
            </div>
        `;const x=()=>e.classList.remove("active");document.getElementById("expand-infra-x")?.addEventListener("click",x),document.getElementById("expand-infra-close")?.addEventListener("click",x),e.onclick=g=>{g.target===e&&x()},document.getElementById("expand-infra-tiers")?.addEventListener("click",g=>{const h=g.target.closest("[data-size]");!h||h.classList.contains("locked")||i||(s=h.dataset.size,m())}),document.getElementById("expand-infra-post")?.addEventListener("click",async()=>{if(!(i||!s)){i=!0,c=null,m();try{const{data:g,error:h}=await E.rpc("post_interior_infrastructure",{p_size:s});h?c=h.message||"Post failed":g?.success?s=null:c=g?.error||"Could not post contract"}catch(g){c="Posting failed: "+(g?.message||g)}finally{i=!1,m()}}}),document.getElementById("expand-infra-bids")?.addEventListener("click",async g=>{const h=g.target.closest("[data-bid-action]");if(!h||i)return;const I=h.dataset.bidAction,w=h.dataset.bidId;if(!w||I!=="accept"&&I!=="reject")return;const k=I==="accept"?"interior_accept_construction_bid":"interior_reject_construction_bid",C={not_minister:"Only the active Interior Minister can act on these bids.",not_open:"This contract is no longer open.",not_government:"This is not a government contract.",bid_not_pending:"That bid is no longer pending.",bid_not_found:"That bid no longer exists.",contract_not_found:"Contract not found.",bidder_at_capacity:"That builder is at their construction-yard capacity.",not_authenticated:"Sign in to continue."};i=!0,c=null,m();try{const{data:S,error:M}=await E.rpc(k,{p_bid_id:w});M?c=M.message||`${I} failed`:S?.success||(c=C[S?.reason]||`Could not ${I} bid (${S?.reason||"unknown"}).`)}catch(S){c=`${I==="accept"?"Accept":"Reject"} failed: `+(S?.message||S)}finally{i=!1,m()}})}e.classList.add("active"),await m()}const Ae=84,Pe=24,Eo=12;function Wt(a){const t=a%100,e=a%10;return t>=11&&t<=13?a+"th":e===1?a+"st":e===2?a+"nd":e===3?a+"rd":a+"th"}function Tt(a){if(a==null)return"—";const t=["January","February","March","April","May","June","July","August","September","October","November","December"],e=2e3+Math.floor(a/12);return`${t[a%12]}, ${e}`}async function Co(a,t){const e=document.getElementById("pa-vola-host-bid-modal");if(!e)return;let o=!1,s=null,i=null;const n=new Map;async function l(){const{data:m}=await E.from("ministries").select("id, party_id, discretionary_balance").eq("nation_id",b.nation.id).eq("ministry_key","sports").eq("is_active",!0).maybeSingle(),{data:r}=await E.from("shard").select("current_tick").eq("name","Alpha Shard").single(),d=Number(r?.current_tick)||0,u=[];let y=0;for(;u.length<3&&y<200;){const v=y+1,_=Ae+Pe*y,p=_-Eo;p>d&&u.push({cupNumber:v,cupStart:_,resolutionTick:p}),y++}if(u.length>0){const v=u.map(h=>h.cupNumber),[{data:_},{data:p}]=await Promise.all([E.from("vola_cup_hosts").select("cup_number, host_nation_id, nations:host_nation_id(name)").in("cup_number",v),E.from("vola_host_bids").select("cup_number, bid_at_tick").eq("nation_id",b.nation.id).in("cup_number",v)]),x=new Map((_||[]).map(h=>[h.cup_number,h])),g=new Map((p||[]).map(h=>[h.cup_number,h]));for(const h of u){h.host=x.get(h.cupNumber)||null;const I=g.get(h.cupNumber),w=n.has(h.cupNumber);h.iBid=!!I||w,h.bidAtTick=I?.bid_at_tick??n.get(h.cupNumber)??null}for(const h of u){const I=h.cupNumber>1?Ae+Pe*(h.cupNumber-2):null,w=I===null||d>I;h.selectable=!h.host&&!h.iBid&&w}}return{balance:Number(m?.discretionary_balance)||0,isMinister:m?.party_id===t.id,cups:u}}async function c(){const{balance:m,isMinister:r,cups:d}=await l(),y=m>=1e7,v=d.length===0?'<div class="pa-empty-msg" style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">No upcoming Vola World Cups within the bid window.</div>':d.map(w=>{let k="",C="",S="",M="";if(w.host){const A=w.host.nations?.name||"Awarded";k=`<span class="pa-action-tag" style="color:var(--text-dim);">HOSTED — ${$(A.toUpperCase())}</span>`,S="locked",C="opacity:0.5;cursor:not-allowed;"}else if(w.iBid){k='<span class="pa-action-tag" style="color:#5cc55c;">YOUR BID PENDING</span>',S="locked",C="cursor:not-allowed;border-color:#5cc55c;background:rgba(92,197,92,0.06);";const A=w.bidAtTick!=null?`Bid placed on ${Tt(w.bidAtTick)} for $10`:"Bid placed earlier this session for $10";M=`<button class="pa-modal-btn pa-modal-btn--placed" disabled style="background:transparent;color:#5cc55c;border:1px solid #5cc55c;padding:4px 10px;font-size:9px;cursor:not-allowed;opacity:0.75;font-weight:600;letter-spacing:0.04em;">${$(A)}</button>`}else w.selectable&&r&&y?(k='<span class="pa-action-tag" style="color:#c8a832;">AVAILABLE</span>',C="cursor:pointer;border-color:#c8a832;background:rgba(200,168,50,0.06);",M=`<button class="pa-modal-btn pa-modal-btn--submit" data-cup-number="${w.cupNumber}" ${o?"disabled":""} style="background:#c8a832;padding:4px 10px;font-size:9px;">Submit Bid — $10</button>`):w.selectable&&!y?(k='<span class="pa-action-tag" style="color:var(--red);">INSUFFICIENT BUDGET</span>',S="locked",C="opacity:0.6;cursor:not-allowed;"):(k='<span class="pa-action-tag" style="color:var(--text-dim);">FUTURE CYCLE</span>',S="locked",C="opacity:0.5;cursor:not-allowed;");return`<div class="pa-action-item ${S}" data-cup-number="${w.cupNumber}" style="${C}">
                    <div class="pa-action-top">
                        <div>
                            <div style="font-size:13px;font-weight:700;color:var(--text-bright);">${Wt(w.cupNumber)} World Vola Cup</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">
                                Begins ${Tt(w.cupStart)} · Bids resolve ${Tt(w.resolutionTick)}
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                            ${k}
                            ${M}
                        </div>
                    </div>
                </div>`}).join(""),_=`
            <div style="margin-top:14px;padding:10px;background:var(--bg-card);border:1px solid var(--border-main);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                <div style="font-weight:700;color:var(--text-secondary);margin-bottom:4px;">Bid Score Formula</div>
                (Sports Culture &divide; 2) + (Infrastructure &times; 3) + (Global Image &times; 3) + (Stadiums &times; 5) + 1d20<br>
                Highest score wins · ties broken by Sports Culture
            </div>
        `,p=`
            <div style="margin-top:10px;padding:10px;background:rgba(92,197,92,0.06);border:1px solid rgba(92,197,92,0.2);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                <div style="font-weight:700;color:#5cc55c;margin-bottom:4px;">Win Effects</div>
                Host the VWC · +15 home advantage · +1d20+5 Budget · +3 Global Image · +0.5 Public Approval · +1d6 Sports Culture
            </div>
        `,x=`
            <div style="margin-top:6px;padding:10px;background:rgba(200,80,80,0.06);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                <div style="font-weight:700;color:var(--red);margin-bottom:4px;">Lose Effect</div>
                &minus;0.2 Public Approval (failed national bid)
            </div>
        `,g=i?`
            <div style="margin-top:12px;padding:12px;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.22);">
                <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-bottom:4px;">Bid submitted</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">
                    ${Wt(i.cupNumber)} World Vola Cup · resolves ${Tt(i.resolutionTick)}<br>
                    $${i.cost/1e6} deducted from discretionary
                </div>
            </div>
        `:"",h=s?`
            <div style="margin-top:10px;padding:8px 10px;background:rgba(200,80,80,0.08);border:1px solid rgba(200,80,80,0.2);font-family:var(--font-mono);font-size:10px;color:var(--red);">${$(s)}</div>
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
                    ${r?`Discretionary budget <strong style="color:${m>0?"var(--green)":"var(--red)"};">${ut(m)}</strong> available · cost <strong style="color:#c8a832;">$10</strong> per bid · once per cup.`:'<span style="color:var(--red);">You are no longer the active Sports Minister.</span>'}
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    ${v}
                    ${_}
                    ${p}
                    ${x}
                    ${g}
                    ${h}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="vola-host-close">Close</button>
                </div>
            </div>
        `;const I=()=>{e.classList.remove("active"),R(a)};document.getElementById("vola-host-x")?.addEventListener("click",I),document.getElementById("vola-host-close")?.addEventListener("click",I),e.onclick=w=>{w.target===e&&I()},e.querySelectorAll("[data-cup-number]").forEach(w=>{w.tagName==="BUTTON"&&w.addEventListener("click",async()=>{if(o||i)return;const k=Number(w.dataset.cupNumber);if(k&&confirm(`Submit a host bid for the ${Wt(k)} World Vola Cup?

$10 from discretionary budget.
Resolves at the qualifier tick (12 ticks before the cup begins).`)){o=!0,s=null,c();try{const C=await Ca(E,k,b.nation.id);if(C?.success){i=C;const{data:S}=await E.from("shard").select("current_tick").eq("name","Alpha Shard").single(),M=Number(S?.current_tick)||Number(C.cupStartTick)-999;n.set(k,M)}else C?.reason==="already_bid"&&!n.has(k)&&n.set(k,null),s=f(C?.reason)||"Could not submit: "+(C?.reason||"unknown error")}catch(C){s="Bid failed: "+(C?.message||C)}finally{o=!1,c()}}})})}function f(m){return{invalid_cup:"Invalid cup selection.",invalid_nation:"Nation context unavailable. Reload and try again.",not_minister:"Only the Sports Minister can submit host bids.",insufficient_balance:"Sports discretionary budget is below $10M — pass a funding bill first.",no_shard:"Game state unavailable. Try again.",bidding_closed:"Bidding window has closed for this cup.",already_hosted:"This cup has already been awarded.",already_bid:"You have already bid for this cup.",cup_not_open_yet:"This cup’s bid window opens 1 tick after the previous cup begins."}[m]}e.classList.add("active"),await c()}const na=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],ze=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],de=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function Io(a,t){const e=na.map(o=>{const s=o.tags.map(i=>`<span class="pa-action-tag" style="color:${Ct[i]||"var(--text-dim)"};">${i}</span>`).join("");return`
            <div class="pa-action-item ${o.locked?"locked":""}" data-action-id="${o.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(o.name)}</span>
                        <div class="pa-action-tags">${s}</div>
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
    `}function So(a){const t=document.getElementById("pa-modernize-modal");if(!t)return;const e=b.faction;let o=null,s=e.custom_logo_url||null,i=!1;function n(){const l=!!s,f=Number(e.party_funds??0)>=5e4,m=!!o&&f&&!i;t.innerHTML=`
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
                        ${s?`<img src="${$(s)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${m?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=r=>{r.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",r=>{const d=r.target.files?.[0];if(d){if(d.size>2*1024*1024){alert("Logo must be under 2MB.");return}o=d,s=URL.createObjectURL(d),n()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(i||!o)return;i=!0;const r=document.getElementById("mod-submit");r&&(r.disabled=!0,r.textContent="Uploading...");try{const d=o.name.split(".").pop()?.toLowerCase()||"png",u=`${e.id}/logo_${Date.now()}.${d}`,{error:y}=await E.storage.from("party-logos").upload(u,o,{cacheControl:"3600",upsert:!0,contentType:o.type});if(y)throw new Error("Upload failed: "+y.message);const{data:v}=E.storage.from("party-logos").getPublicUrl(u),_=v?.publicUrl;if(!_)throw new Error("Failed to get logo URL");const p=Math.max(0,Number(e.party_funds??0)-5e4),{error:x}=await E.from("factions").update({custom_logo_url:_,party_funds:p}).eq("id",e.id);if(x)throw x;e.custom_logo_url=_,e.party_funds=p,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),R(a)}catch(d){alert("Modernize failed: "+(d.message||"Error")),i=!1,r&&(r.disabled=!1,r.textContent="Modernize — $50k")}})}t.classList.add("active"),n()}function Lo(a){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const e=b.faction;b.nation;const o=e.momentum??50;(b._allParties||[]).filter(d=>d.id!==e.id);const s={current:e.party_color||"#4a8aba"},i={current:0},n={current:e.custom_logo_url||null},l={current:null},c={current:!!e.custom_logo_url},f={current:!1};function m(){return s.current}function r(){const d=m(),u=ze.find(w=>w.hex===d)?.name||"Custom",y=de[i.current]?.emoji||"🏛️",v=c.current&&(n.current||l.current),_=n.current||(l.current?URL.createObjectURL(l.current):null),p=document.getElementById("rb-name")?.value??e.faction_name??"",x=document.getElementById("rb-abbr")?.value??e.abbreviation??"",g=document.getElementById("rb-desc")?.value??"",h=ze.map(w=>{const k=d===w.hex;return`<div class="rb-color-swatch ${k?"selected":""}" data-hex="${w.hex}" style="background:${w.hex};${k?`box-shadow:0 0 8px ${w.hex}44;border:2px solid var(--text-bright);`:""}">
                ${k?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),I=de.map((w,k)=>{const C=i.current===k;return`<div class="rb-logo-item ${C?"selected":""}" data-idx="${k}" style="${C?`background:${d}15;border:2px solid ${d};box-shadow:0 0 6px ${d}33;`:""}">
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
                            <input class="pa-modal-input" id="rb-name" value="${$(p)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${p.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${$(x)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${d};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${$(g)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${g.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${d};">${$(u)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${h}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${v?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${v?"opacity:0.3;":""}" id="rb-logos">${I}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${v?"solid var(--teal)":"dashed var(--border-mid)"};padding:10px 14px;background:${v?"rgba(90,170,138,0.04)":"var(--bg-card)"};">
                                ${v&&_?`
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <img src="${_}" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--border-main);background:var(--bg-card);" alt="Custom logo">
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
                                    ${v&&_?`<img src="${_}" style="width:100%;height:100%;object-fit:contain;" alt="">`:y}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${$(p||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${d};letter-spacing:1px;">${$(x||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${$(g||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${d};background:${d}0a;border:1px solid ${d}25;">${$(x)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${d};background:${d}0a;border:1px solid ${d}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${d}08;border:1px solid ${d}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${d};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${d};">${$(u.toUpperCase())}</div>
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
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=n.current,t._rbUseCustomLogo=c.current,r(),t.classList.add("active"),t.addEventListener("change",function(u){if(u.target.id==="rb-logo-file"){const y=u.target.files?.[0];if(!y)return;if(y.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(y.size/(1024*1024)).toFixed(1)+"MB"),u.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(y.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),u.target.value="";return}l.current=y,n.current=null,c.current=!0,t._rbCustomLogoFile=y,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,r()}}),t.addEventListener("click",function d(u){if(u.target===t||u.target.closest("#rb-close")||u.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",d);return}const y=u.target.closest(".rb-color-swatch");if(y){s.current=y.dataset.hex,r();return}const v=u.target.closest(".rb-logo-item");if(v){i.current=parseInt(v.dataset.idx)||0,c.current=!1,t._rbUseCustomLogo=!1,r();return}if(u.target.closest("#rb-remove-logo")){n.current=null,l.current=null,c.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,r();return}if(u.target.closest("#rb-submit")){const _=document.getElementById("rb-name")?.value?.trim()||"",p=document.getElementById("rb-abbr")?.value?.trim()||"";if(_.length<3||p.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}f.current=!0,r();return}if(u.target.closest("#rb-back")){f.current=!1,r();return}if(u.target.closest("#rb-confirm")){Mo(t,a,d);return}})}async function Mo(a,t,e){const o=b.faction,s=document.getElementById("rb-name")?.value?.trim()||"",i=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const n=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||o.party_color,l=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,c=l!=null?de[parseInt(l)]?.emoji:null,f=a._rbCustomLogoFile,m=a._rbUseCustomLogo,r=a._rbCustomLogoUrl,d=document.getElementById("rb-confirm");d&&(d.disabled=!0,d.textContent="Rebranding...");try{const u=b.shard?.current_tick||0;let y=r;if(m&&f){const g=f.name.split(".").pop()?.toLowerCase()||"png",h=`${o.id}/logo_${Date.now()}.${g}`,{data:I,error:w}=await E.storage.from("party-logos").upload(h,f,{cacheControl:"3600",upsert:!0,contentType:f.type});if(w){console.error("[Rebrand] Logo upload failed:",w.message),alert("Logo upload failed: "+w.message);return}const{data:k}=E.storage.from("party-logos").getPublicUrl(h);y=k?.publicUrl||null}else m||(y=null);const v=15e4,_=o.party_funds||0;if(_<v){alert(`Not enough funds. You have $${Math.round(_/1e3)}k, need $150k.`);return}const p=_-v,x=Math.max(1,(o.momentum||0)-10);await E.from("factions").update({party_funds:p,momentum:x,faction_name:s,abbreviation:i.toUpperCase(),party_color:n,party_logo:m?null:c,custom_logo_url:y,rebrand_cooldown_until_tick:u+120}).eq("id",o.id),await E.from("campaign_actions").insert({party_id:o.id,nation_id:b.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:u,result:{oldName:o.faction_name,newName:s,oldAbbr:o.abbreviation,newAbbr:i,oldColor:o.party_color,newColor:n}}),o.party_funds=p,o.momentum=x,o.faction_name=s,o.abbreviation=i.toUpperCase(),o.party_color=n,o.party_logo=m?null:c,o.custom_logo_url=y,a.classList.remove("active"),a.removeEventListener("click",e),R(t)}catch(u){console.error("[PartyActions] Rebrand error:",u),alert("Failed to rebrand: "+(u.message||u))}finally{d&&(d.disabled=!1,d.textContent="⚠ Confirm Rebrand")}}const ra=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1},{id:"petition_for_reform",name:"Petition for Reform",desc:"Organize a popular petition for political reform. Roll 1d100 + petition strength (education, professional/cultural/religious rapport, inequality, low SoL, crown authority). 0-40 ignored; 41-69 grants minor reform; 70+ forces major reform.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["POLITICAL","MONARCHY"],locked:!1,monarchyOnly:!0,cooldownTicks:6}];function No(a){const t=j,e=Q(t.first_name,t.last_name),o=ct(t.skill),s=st?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',i=K(b?.nation),n=Number(b?.shard?.current_tick)||0,l=b?.faction,f=ra.filter(m=>!m.monarchyOnly||i).map(m=>{let r=null;if(m.id==="petition_for_reform"&&m.cooldownTicks){if(l?._petitionPending&&(r="A petition is already pending in this nation."),!r){const v=Number(l?.last_petition_for_reform_tick);if(Number.isFinite(v)&&v>0){const _=v+m.cooldownTicks;n<_&&(r=`Cooldown — ready at tick ${_}.`)}}const y=Number(l?.party_funds)||0;!r&&y<m.moneyCost&&(r="Insufficient party funds.")}const d=m.locked||!!r,u=m.tags.map(y=>`<span class="pa-action-tag" style="color:${Ct[y]||"var(--text-dim)"};">${y}</span>`).join("");return`
            <div class="pa-action-item ${d?"locked":""}" data-action-id="${m.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${$(m.name)}</span>
                        <div class="pa-action-tags">${u}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${m.costColor};">${m.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${$(m.desc)}</div>
                ${r||m.locked&&m.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${$(r||m.lockReason)}</span></div>`:""}
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
                    <div class="pa-detail-meta">${$(a.fullTitle)}, Age ${t.age}${s}</div>
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
            ${f}
        </div>
        ${To()}
        <div class="pa-skill-footer">
            <span style="color:${a.color};font-weight:700;">${a.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${o.color};font-weight:700;">${o.label}</span>: ${o.desc}
        </div>
    `}function To(){if(se.length===0)return"";const a=b.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${se.map(e=>{const o=Ot.find(p=>p.key===e.target_ministry),s=o?o.label:e.target_ministry,i=o?o.icon:"⚖️",n=ue(e.corruption_growth||0),l=nt[e.tier]||nt[1],c=e.status==="active",f=Math.max(0,a-e.filed_at_tick),m=8,r=Math.min(1,f/m),d=Math.max(0,e.resolves_at_tick-a),u=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],y=u.map(p=>{const x=e.filed_at_tick+p.tick,g=a>=x,h=a>=x&&(p.tick===8||a<e.filed_at_tick+u[u.indexOf(p)+1]?.tick),I=p.tick/m*100;return`<div class="pa-ls-milestone ${g?"passed":""} ${h?"current":""}" style="left:${I}%;" title="${p.label} (Tick ${x})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${p.label}</div>
            </div>`}).join("");let v="";if(!c){const p=l===nt[1]?"FRIVOLOUS":l===nt[2]?"PARTIAL WIN":l===nt[3]?"MAJOR WIN":"DEVASTATING",x=e.tier===1?"var(--red)":e.tier===2?"#ca5":e.tier===3?"#c84":"var(--green)";v=`<span class="pa-ls-tier-badge" style="color:${x};border-color:${x}44;background:${x}0a;">${p}</span>`}const _=c?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${e.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${e.momentum_effect>=0?"+":""}${e.momentum_effect} Mom</span>
                <span style="color:${e.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${e.gov_momentum_effect>=0?"+":""}${e.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${c?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${i}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${$(s)}</span>
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
                        ${y}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${n.color};font-weight:700;">${(e.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${$(n.label)}
                </div>
                ${_}
            </div>
        `}).join("")}
        </div>
    `}let Kt=!1;async function Ao(){if(Kt)return;const a=b.faction;if(!a)return;const t=ra.find(e=>e.id==="petition_for_reform");if(t&&confirm(`File a Petition for Reform?

Cost: ${t.cost} (party funds)
${t.cooldownTicks}-tick cooldown after use.

The monarch has 3 ticks to respond. If they don't, the petition is accepted by default.`)){Kt=!0;try{const{data:e,error:o}=await E.rpc("petition_for_reform");if(o){alert("Petition failed: "+o.message);return}if(!e?.success){const i=e?.reason||"unknown error",n=e?.got_government_type?`

(government_type in DB: "${e.got_government_type}")`:"";alert("Could not file petition: "+i+n);return}a.party_funds=Math.max(0,(Number(a.party_funds)||0)-t.moneyCost),a.last_petition_for_reform_tick=Number(b?.shard?.current_tick)||0,a._petitionPending=!0,alert(`Petition filed. The nation now waits for the throne's response.

Track the petition in Government → Administrative → Pressing Issues.`);const s=document.getElementById("pa-actions-panel");s&&(s.innerHTML=he(null,null,a)),window.dispatchEvent(new CustomEvent("petition:filed",{detail:{petitionId:e.petition_id}}))}catch(e){alert("Petition failed: "+(e?.message||e))}finally{Kt=!1}}}const qt={geological_survey_minerals:{rpc:"geological_survey_minerals",nextCostRpc:"geological_survey_minerals_next_cost",cooldownRpc:"geological_survey_minerals_cooldown_until",ministryKey:"interior",ministryName:"Interior Ministry",actionLabel:"Geological Survey",actionNoun:"survey",costEscalation:"doubles",cooldownTicks:12,oddsHint:"Higher current Minerals improves your odds of a meaningful find.",primaryStat:"minerals",primaryStatLabel:"Minerals",bonusLabel:"minerals bonus",secondaryStat:null,secondaryStatLabel:null,bucketLabels:{none:"No Findings",small:"Small Find",moderate:"Moderate Find",major:"Major Discovery"},lockLineClass:"pa-gs-lock-line"},national_energy_survey:{rpc:"national_energy_survey",nextCostRpc:"national_energy_survey_next_cost",cooldownRpc:"national_energy_survey_cooldown_until",ministryKey:"energy",ministryName:"Energy Ministry",actionLabel:"National Energy Survey",actionNoun:"survey",costEscalation:"triples",cooldownTicks:24,oddsHint:"Lower current Energy improves your odds of a meaningful find.",primaryStat:"energy",primaryStatLabel:"Energy",bonusLabel:"energy headroom bonus",secondaryStat:null,secondaryStatLabel:null,bucketLabels:{none:"No Findings",modest:"Workable Opportunity",major:"Transformative Discovery"},lockLineClass:"pa-es-lock-line"},agricultural_expansion:{rpc:"agricultural_expansion",nextCostRpc:"agricultural_expansion_next_cost",cooldownRpc:"agricultural_expansion_cooldown_until",ministryKey:"interior",ministryName:"Interior Ministry",actionLabel:"Agricultural Expansion",actionNoun:"expansion",costEscalation:"doubles",cooldownTicks:12,oddsHint:"Lower current Farmland improves your odds. A Major result also displaces industry.",primaryStat:"farmland",primaryStatLabel:"Farmland",bonusLabel:"land-use bonus",secondaryStat:"industry",secondaryStatLabel:"Industry",bucketLabels:{none:"No Viable Zones",small:"Modest Reclamation",moderate:"Regional Reclamation Program",major:"Sweeping Land-Use Reform"},lockLineClass:"pa-ae-lock-line"}};function Po(a){return/^[aeiou]/i.test(a)?"an":"a"}async function zo(a,t){if(Lt.has(a)||!t)return;const e=qt[a];if(!e)return;Lt.add(a),await ce(a);const o=document.querySelector(`.pa-action-item[data-action-id="${a}"] .pa-action-cost`)?.textContent?.trim()||"",s=/^\$\d/.test(o)?`Cost: ${o} (charged from ${e.ministryName} discretionary budget).
`:`Cost is charged from ${e.ministryName} discretionary budget.
`;if(!confirm(`Commission ${Po(e.actionLabel)} ${e.actionLabel}?

`+s+`Cost ${e.costEscalation} every use. ${e.cooldownTicks}-tick cooldown after firing.

`+e.oddsHint)){Lt.delete(a);return}try{const{data:i,error:n}=await E.rpc(e.rpc);if(n){alert(`${e.actionLabel} failed: ${n.message}`);return}if(!i?.success){const p=i?.reason||"unknown error";let x="";i?.reason==="insufficient_balance"&&i?.cost?x=`

(needed $${Math.round(Number(i.cost)/1e6)}, have $${Math.round(Number(i.balance)/1e6)})`:i?.reason==="cooldown"&&i?.ready_at_tick&&(x=`

Next ${e.actionNoun} ready at tick ${i.ready_at_tick}.`),alert(`Could not run ${e.actionNoun}: ${p}${x}`),ce(a);return}const l=e.bucketLabels[i.bucket]||i.bucket,c=(Number(i.total)-Number(i.d100)).toFixed(1),f=i[`${e.primaryStat}_before`],m=i[`${e.primaryStat}_after`],r=Number(m)-Number(f),d=`${e.primaryStatLabel}: ${f} → ${m}`+(r>0?" (+"+r+")":"");let u="";if(e.secondaryStat){const p=Number(i[`${e.secondaryStat}_delta`]||0);p>0&&(u=`
`+e.secondaryStatLabel+": "+i[`${e.secondaryStat}_before`]+" → "+i[`${e.secondaryStat}_after`]+" (-"+p+")")}alert(e.actionLabel+" — "+l+`

Roll: `+i.d100+" + "+c+" ("+e.bonusLabel+") = "+i.total+`
`+d+u+`

`+(i.description||"")),b?.nation&&(b.nation[e.primaryStat]=Number(m),e.secondaryStat&&(b.nation[e.secondaryStat]=Number(i[`${e.secondaryStat}_after`])));const y=(vt||[]).find(p=>p.ministry_key===e.ministryKey);if(y){const p=Number(i.cost_paid)||0;y.discretionary_balance=Math.max(0,Number(y.discretionary_balance||0)-p)}const v=document.getElementById("pa-actions-panel");v&&(v.innerHTML=he(null,null,t));const _=document.querySelector(`.pa-action-item[data-action-id="${a}"]`);_&&sa(_,e,Number(i.next_cost),i.cooldown_until!=null?Number(i.cooldown_until):null)}catch(i){alert(`${e.actionLabel} failed: ${i?.message||i}`)}finally{Lt.delete(a)}}function sa(a,t,e,o){const s=a.querySelector(".pa-action-cost");s&&Number.isFinite(e)&&e>0&&(s.textContent="$"+Math.round(e/1e6));const i=Number(b?.shard?.current_tick)||0,n=(vt||[]).find(m=>m.ministry_key===t.ministryKey),l=Number(n?.discretionary_balance??0);let c="";if(Number.isFinite(o)&&o>i){const m=o-i;c=`Cooldown — next ${t.actionNoun} ready at tick ${o} (${m} tick${m===1?"":"s"} away).`}else if(Number.isFinite(e)&&l<e){const m=Math.round(e/1e6);c=`${t.ministryName} discretionary budget is below $${m} — next ${t.actionNoun} cost has outgrown the budget.`}const f=a.querySelector("."+t.lockLineClass);if(c)if(a.classList.add("locked"),f){const m=f.querySelector("span:last-child");m&&(m.textContent=c)}else{const m=document.createElement("div");m.className=t.lockLineClass,m.style.cssText="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;";const r=document.createElement("span");r.textContent="⊘";const d=document.createElement("span");d.textContent=c,m.appendChild(r),m.appendChild(d),a.appendChild(m)}else a.classList.remove("locked"),f&&f.remove()}async function ce(a){const t=qt[a];if(!t)return;const e=document.querySelector(`.pa-action-item[data-action-id="${a}"]`);if(!e)return;const o=b?.nation?.id;if(!o)return;let s,i;try{[s,i]=await Promise.all([E.rpc(t.nextCostRpc,{p_nation_id:o}),E.rpc(t.cooldownRpc,{p_nation_id:o})])}catch(c){console.warn(`[${t.actionLabel}] RPC fetch threw:`,c?.message||c);return}s.error&&console.warn(`[${t.actionLabel}] next_cost RPC failed:`,s.error.message),i.error&&console.warn(`[${t.actionLabel}] cooldown_until RPC failed:`,i.error.message);const n=Number(s.data),l=i.data!=null?Number(i.data):null;sa(e,t,n,l)}let Jt=!1;async function Re(a){const t=document.getElementById("pa-hire-modal");if(!t)return;const e=b.nation?.id,o=b.nation?.name;if(!e||!o)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await Fa(E,e,o);let i=null;function n(){const l=i!=null?s[i]:null,c=l?ct(l.skill):null,f=s.map((d,u)=>{const y=i===u,v=ct(d.skill);return`<div class="pa-hire-row ${y?"selected":""}" data-idx="${u}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${Q(d.first_name,d.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${y?"var(--text-bright)":"var(--text-secondary)"};">${$(d.first_name)} ${$(d.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${d.skill}%;background:${v.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${v.color};">${d.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${d.age}</div>
            </div>`}).join("");let m;l?m=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${Q(l.first_name,l.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${$(l.first_name)} ${$(l.last_name)}</div>
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
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${$(l.background)}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(b.faction?.party_funds||0)<l.hire_cost?' disabled title="Not enough funds"':""}>Hire ${$(l.first_name)}</button>
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
                        ${f}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${m}
                    </div>
                </div>
            </div>
        `;const r=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",r),t.onclick=d=>{d.target===t&&r()},document.getElementById("pa-hire-list")?.addEventListener("click",d=>{const u=d.target.closest(".pa-hire-row");u&&(i=parseInt(u.dataset.idx,10),n())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Jt||i==null)return;Jt=!0;const d=document.getElementById("pa-hire-confirm");d&&(d.disabled=!0,d.textContent="Hiring...");try{const u=b.shard?.current_tick||0,y=s[i],v=y.hire_cost||0,_=b.faction?.party_funds||0;if(v>0&&_<v){alert(`Not enough funds. You have $${Math.round(_/1e3)}k, need $${Math.round(v/1e3)}k.`);return}if(v>0){const x=_-v,{error:g}=await E.from("factions").update({party_funds:x}).eq("id",b.faction.id);if(g){alert("Failed to deduct funds.");return}b.faction.party_funds=x}const p=await qa(E,b.faction?.id,y,u);if(!p.success){alert(p.error||"Failed to hire agitator.");return}j=p.agitator,U="agitator",r(),R(a)}catch(u){console.error("[PartyActions] Hire agitator error:",u)}finally{Jt=!1,d&&(d.disabled=!1)}})}n()}let At=!1;function Ro(a){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!F){alert("No active government to file against.");return}const e=b.faction,o=j;let s=null,i=null;function n(){const l=s&&i,c=Ot.map(r=>{const d=s===r.key;return`<div class="pa-lawsuit-target ${d?"selected":""}" data-target="${r.key}">
                <span style="font-size:18px;">${r.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${$(r.label)}</span>
            </div>`}).join(""),f=Je.map(r=>{const d=i===r.key;return`<div class="pa-lawsuit-basis ${d?"selected":""}" data-basis="${r.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${d?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${d?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${$(r.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${$(r.desc)}</div>
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
        `;const m=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",m),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",m),t.onclick=r=>{r.target===t&&m()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",r=>{const d=r.target.closest(".pa-lawsuit-target");d&&(s=d.dataset.target,n())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",r=>{const d=r.target.closest(".pa-lawsuit-basis");d&&(i=d.dataset.basis,n())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(At||!s||!i)return;At=!0;const r=document.getElementById("pa-lawsuit-submit");r&&(r.disabled=!0,r.textContent="Filing...");try{const{data:u}=await E.from("factions").select("party_funds").eq("id",e.id).single(),y=u?.party_funds||0;if(y<25e4){alert(`Not enough funds. You have $${Math.round(y/1e3)}k, need $250k.`),At=!1,r&&(r.disabled=!1,r.textContent="File Lawsuit");return}const v=y-25e4;await E.from("factions").update({party_funds:v}).eq("id",e.id),e.party_funds=v,sessionStorage.removeItem("nationhood_state");const _=b.shard?.current_tick||0,p=await Ha(E,{factionId:e?.id,nationId:b.nation?.id,agitatorId:o?.id,targetMinistry:s,basis:i,currentTick:_,partyName:e?.faction_name||"Opposition",administration:F});if(!p.success){alert(p.error||"Failed to file lawsuit.");return}const x=ue(p.lawsuit?.corruption_growth||0),g=nt[p.tier]||nt[1];m(),alert(`Lawsuit filed against ${Ot.find(h=>h.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),R(a)}catch(d){console.error("[PartyActions] File lawsuit error:",d),alert("An error occurred. Please try again.")}finally{At=!1,r&&(r.disabled=!1,r.textContent="File Lawsuit")}})}t.classList.add("active"),n()}async function Oo(a){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const e=b.nation,o=b.faction,{data:s}=await E.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),i=s||[];let n=null,l=!1;const{data:c}=await E.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",e.id).eq("active",!0).maybeSingle();function f(){const m=i.find(v=>v.id===n),r=c?`${c.first_name} ${c.last_name}`:null,d=c?.factions?.faction_name||null,u=c&&n===c.faction_id;t.innerHTML=`
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
                    ${r?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${$(r)}</strong> (${$(d||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${i.map(v=>{const _=v.id===n,p=c&&v.id===c.faction_id,x=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"?";return`<div class="pa-action-item ${_?"selected":""}" data-party-id="${v.id}" style="cursor:pointer;${_?`border-color:${v.party_color||"#888"};background:${v.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${$(v.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${$(x)}, Age ${v.leader_age||"?"} · ${v.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${p?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!m||l||u?"disabled":""} style="background:#c8a832;">${m?u?"Already PM":`Appoint ${$(m.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const y=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",y),document.getElementById("apm-cancel")?.addEventListener("click",y),t.onclick=v=>{v.target===t&&y()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const _=v.target.closest("[data-party-id]");_&&(n=_.dataset.partyId,f())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!n||l)return;const v=i.find(p=>p.id===n);if(!v||!confirm(`Appoint ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister?`))return;l=!0;const _=document.getElementById("apm-confirm");_&&(_.disabled=!0,_.textContent="Appointing...");try{const p=b.shard?.current_tick||0;await _a(E,{nationId:e.id,factionId:n,firstName:v.leader_first_name||"Unknown",lastName:v.leader_last_name||"Unknown",age:v.leader_age||50,currentTick:p});try{await E.from("government_formations").update({status:"dissolved"}).eq("nation_id",e.id).in("status",["formed","caretaker","active"]);const{data:C}=await E.from("shard").select("current_date").eq("name","Alpha Shard").single();await E.from("government_formations").insert({nation_id:e.id,election_id:null,proposed_by:o.id,party_ids:[n],status:"formed",formation_type:"monarchy",formed_at:new Date().toISOString(),ministry_assignments:{prime_minister:n},game_year:C?.current_date||""})}catch(C){console.warn("[AppointPM] government_formations write failed (non-blocking — synthetic fallback still works):",C?.message||C)}let x=0;const g=e.monarch_faction_id,h=c?.faction_id||null,I=h&&h!==g&&h!==n,w=n!==g&&n!==h;if(I&&(x-=4),w&&(x+=3),x!==0){const C=Number(e.crown_authority??50),S=Math.max(0,Math.min(100,C+x));try{await E.from("nations").update({crown_authority:S}).eq("id",e.id),e.crown_authority=S}catch{}}try{await E.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${e.monarch_title||"The King"} has appointed ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister.`,fired_at_tick:p})}catch{}y();const k=x>0?`

Crown Authority +${x}.`:x<0?`

Crown Authority ${x}.`:"";alert(`${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} has been appointed Prime Minister.${k}`),R(a)}catch(p){alert("Failed to appoint PM: "+(p.message||"Error")),l=!1,_&&(_.disabled=!1,_.textContent=`Appoint ${$(v.faction_name)}`)}})}t.classList.add("active"),f()}async function Bo(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const e=b.nation,o=b.faction,s=o.seats||0,i=e?.total_seats||100,{data:n}=await E.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),l=(n||[]).filter(d=>d.id!==o.id);let c=null;const f=Math.max(0,s-1);let m=Math.min(5,f||1);function r(){const d=l.find(y=>y.id===c);t.innerHTML=`
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
                        ${l.length>0?l.map(y=>{const v=y.id===c;return`<div class="pa-action-item ${v?"selected":""}" data-faction-id="${y.id}" style="cursor:pointer;${v?`border-color:${y.party_color||"#888"};background:${y.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${y.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${$(y.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,y.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${d?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${f}" value="${m}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${m}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Crown Authority gain: <span style="color:#5cc55c;font-weight:700;">+${(m*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-m} &middot; Their seats after: ${(d.seats||0)+m}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${d?"":"disabled"} style="background:#c8a832;">Grant ${m} Seats</button>
                </div>
            </div>
        `;const u=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",u),document.getElementById("royal-cancel")?.addEventListener("click",u),t.onclick=y=>{y.target===t&&u()},t.querySelector(".pa-modal-body")?.addEventListener("click",y=>{const v=y.target.closest("[data-faction-id]");v&&(c=v.dataset.factionId,r())}),document.getElementById("grant-slider")?.addEventListener("input",y=>{m=parseInt(y.target.value)||1,document.getElementById("grant-count").textContent=m;const v=document.getElementById("royal-grant");v&&(v.textContent=`Grant ${m} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!c||ft)return;ft=!0;const y=document.getElementById("royal-grant");y&&(y.disabled=!0,y.textContent="Granting...");try{const{data:v}=await E.from("factions").select("id, faction_name, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null),_=(v||[]).find(L=>L.id===o.id),p=(v||[]).find(L=>L.id===c);if(!_||!p){alert("Faction not found.");return}const x=(v||[]).reduce((L,N)=>L+Math.max(0,N.seats||0),0),g=new Map;for(const L of v||[])g.set(L.id,Math.max(0,L.seats||0));let h=m;const I=Math.max(0,(g.get(o.id)||0)-1),w=Math.min(h,I);if(w>0&&(g.set(o.id,(g.get(o.id)||0)-w),h-=w),h>0){const L=(v||[]).filter(T=>T.id!==o.id&&T.id!==c&&(g.get(T.id)||0)>0);let N=L.reduce((T,z)=>T+(g.get(z.id)||0),0);for(const T of L){if(h<=0||N<=0)break;const z=Math.round(h*(g.get(T.id)||0)/N),D=Math.min(z,g.get(T.id)||0,h);D>0&&(g.set(T.id,(g.get(T.id)||0)-D),N-=D,h-=D)}if(h>0)for(const T of L){if(h<=0)break;const z=g.get(T.id)||0,D=Math.min(h,z);D>0&&(g.set(T.id,z-D),h-=D)}}const k=m-h;if(k<=0){alert("No seats available to grant.");return}g.set(c,(g.get(c)||0)+k);let C=0;for(const L of g.values())C+=L;if(C!==x){console.error("[GrantSeats] Conservation violated",{sumBefore:x,sumAfter:C,grantAmount:m,actualGrant:k}),alert("Internal error: seat totals would not balance. Aborting.");return}const S=[];for(const L of v||[]){const N=Math.max(0,L.seats||0),T=g.get(L.id)||0;N!==T&&S.push({id:L.id,seats:T})}for(const L of S){const{error:N}=await E.from("factions").update({seats:L.seats}).eq("id",L.id);if(N){alert("Failed to grant seats: "+N.message);return}}const M=k*.5,A=Math.min(100,(Number(e.crown_authority)||50)+M),{error:P}=await E.from("nations").update({crown_authority:A}).eq("id",e.id);if(P){alert("Failed to update crown authority.");return}o.seats=g.get(o.id)||0,e.crown_authority=A;try{const L=l.find(N=>N.id===c);await E.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} grants ${k} seats to ${L?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${e.monarch_title||"King"} has granted ${k} parliamentary seat${k!==1?"s":""} to ${L?.faction_name}. Crown Authority +${M.toFixed(1)}.`,fired_at_tick:b.shard?.current_tick||0})}catch{}u(),R(a)}catch(v){console.error("[GrantSeats] Error:",v),alert("Failed to grant seats.")}finally{ft=!1}})}t.classList.add("active"),r()}async function Fo(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const e=b.nation,o=b.faction,{data:s}=await E.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),i=(s||[]).filter(f=>f.id!==o.id&&(f.seats||0)>0);let n=null,l=1;function c(){const f=i.find(v=>v.id===n),m=f&&f.seats||0,d=l*1e5,u=o.party_funds||0;t.innerHTML=`
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
                        ${i.length>0?i.map(v=>{const _=v.id===n;return`<div class="pa-action-item ${_?"selected":""}" data-faction-id="${v.id}" style="cursor:pointer;${_?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${$(v.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${v.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${f?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${m}" value="${l}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${l}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(d/1e3)}k</span>
                                &middot; Crown Authority: <span style="color:#d44a4a;font-weight:700;">-${l}</span>
                                ${u<d?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!f||u<d?"disabled":""} style="background:#d44a4a;">Revoke ${l} Seats</button>
                </div>
            </div>
        `;const y=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",y),document.getElementById("royal-cancel")?.addEventListener("click",y),t.onclick=v=>{v.target===t&&y()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const _=v.target.closest("[data-faction-id]");_&&(n=_.dataset.factionId,l=1,c())}),document.getElementById("revoke-slider")?.addEventListener("input",v=>{l=parseInt(v.target.value)||1,document.getElementById("revoke-count").textContent=l;const _=document.getElementById("royal-revoke");_&&(_.textContent=`Revoke ${l} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!n||ft)return;ft=!0;const v=document.getElementById("royal-revoke");v&&(v.disabled=!0,v.textContent="Revoking...");try{const _=l*1e5,{data:p}=await E.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null),x=(p||[]).find(z=>z.id===o.id),g=(p||[]).find(z=>z.id===n);if(!x||!g){alert("Faction not found.");return}const h=x.party_funds||0;if(h<_){alert("Not enough funds.");return}const I=(p||[]).reduce((z,D)=>z+Math.max(0,D.seats||0),0),w=Math.min(l,g.seats||0);if(w<=0){alert("Target has no seats to revoke.");return}const k=h-_,C=(x.seats||0)+w,S=(g.seats||0)-w,M=w,A=Math.max(0,(Number(e.crown_authority)||50)-M),P=I-(x.seats||0)-(g.seats||0)+C+S;if(P!==I){console.error("[RevokeSeats] Conservation violated",{sumBefore:I,sumAfter:P,take:w}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:L}=await E.from("factions").update({seats:C,party_funds:k}).eq("id",o.id);if(L){alert("Failed to revoke seats: "+L.message);return}const{error:N}=await E.from("factions").update({seats:S}).eq("id",n);if(N){alert("Failed to revoke seats: "+N.message);return}const{error:T}=await E.from("nations").update({crown_authority:A}).eq("id",e.id);if(T){alert("Failed to update crown authority.");return}o.seats=C,o.party_funds=k,e.crown_authority=A,sessionStorage.removeItem("nationhood_state");try{await E.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} revokes ${w} seats from ${g.faction_name||"unknown"}`,category:"political",description_chosen:`The ${e.monarch_title||"King"} has revoked ${w} seat${w!==1?"s":""} from ${g.faction_name}. Crown Authority -${M}.`,fired_at_tick:b.shard?.current_tick||0})}catch{}y(),R(a)}catch(_){console.error("[RevokeSeats] Error:",_),alert("Failed to revoke seats.")}finally{ft=!1}})}t.classList.add("active"),c()}let Xt=!1;async function qo(){if(Xt||!b?.faction?.id||!b?.nation?.id)return;if(!Gt(b.nation)){alert("Early elections are only available in parliamentary and semi-presidential systems.");return}if(K(b.nation)){alert("Elections are not held under absolute monarchy.");return}const a=F?.pm_party_id;if(!a||a!==b.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚡ CALL EARLY ELECTIONS?

Dissolves the legislature and puts the government into caretaker status.
Election fires after a short formation window.

Momentum effect depends on Gov. Approval:
• >50  → PM party +3 Momentum (fresh mandate)
• 35–50 → neutral
• <35  → opposition +5 Momentum each, +3 Stability

Proceed?`)){Xt=!0;try{const t=Array.isArray(F?.party_ids)?F.party_ids:F?.pm_party_id?[F.pm_party_id]:[],e=await Ia(E,b.nation.id,a,t);if(e&&e.success===!1){alert("Could not call early elections: "+(e.error||"unknown error"));return}alert("⚡ Early elections called. Government is now in caretaker status."),window.location.reload()}catch(t){console.error("[PartyActions] Call early elections failed:",t),alert("Failed to call early elections: "+(t?.message||"unknown error"))}finally{Xt=!1}}}let Qt=!1,Zt=!1;async function Ho(){if(!Zt&&b?.nation?.id&&confirm(`FORM MINORITY GOVERNMENT?

Consequences:
• Your party governs alone — no coalition partners
• Bills pass with -20% effective YES votes
• A snap election fires automatically in 36 ticks if a stable
  coalition isn't formed before then
• Other parties’ ministers are dismissed; only your PM remains

Proceed?`)){Zt=!0;try{const a=await ha(E,b.nation.id);if(!a?.success){const e={invalid_nation:"Nation context unavailable. Reload and try again.",not_parliamentary:"This action only applies to parliamentary governments.",not_party_leader:"Only a party leader can form a minority government.",no_shard:"Game state unavailable.",no_election:"No completed election to form a government from.",gate_not_elapsed:"The coalition window has not yet closed.",majority_exists:"A party already holds an outright majority — form a normal government instead.",coalition_exists:"A government has already been formed for this cycle.",already_minority:"A minority government is already in place.",no_active_parties:"No active parties qualify to form a government.",not_largest_active:"Only the largest active party may form a minority government.",rpc_failed:a?.error||"Server error — try again."}[a?.reason]||a?.reason||"Unknown error";alert(`Could not form minority government:

`+e);return}alert("Minority government formed."),window.location.reload()}catch(a){console.error("[PartyActions] Form Minority Government failed:",a),alert("Failed to form minority government: "+(a?.message||a))}finally{Zt=!1}}}async function Do(){if(!Qt&&b?.faction?.id&&confirm(`LEAVE COALITION?

Consequences:
• −3 Momentum to your party
• −5 Momentum to the Prime Minister’s party
• Any ministries you hold will be vacated
• Your party moves from governing to opposition
• Coalition flips to minority if your exit drops it below majority
• 12-tick cooldown before you can leave another coalition

Proceed?`)){Qt=!0;try{const{data:a,error:t}=await E.rpc("leave_coalition",{p_faction_id:b.faction.id});if(t)throw t;if(a&&a.success===!1)throw new Error(a.error||"Unknown error");const e=a?.became_minority?`

The government is now a minority.`:"",o=(a?.ministries_vacated||0)>0?`

${a.ministries_vacated} ministr${a.ministries_vacated===1?"y":"ies"} vacated.`:"";alert("You have left the coalition."+e+o),window.location.reload()}catch(a){console.error("[PartyActions] Leave Coalition failed:",a),alert("Failed to leave coalition: "+(a?.message||a))}finally{Qt=!1}}}let te=!1;async function jo(a,t){if(!(te||$t)&&!(!b?.nation?.id||!t?.id)&&confirm(`LEADERSHIP CHALLENGE?

Claim the vacant Premiership for your party leader.
Resolves on the next tick. If multiple coalition parties claim, the
largest by seats wins (earliest claim breaks ties).

Winner gets +0.3 popularity across all voter sectors
(suppressed if your party held PM in the last 12 ticks).

Proceed?`)){te=!0;try{const{data:e}=await E.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=Number(e?.current_tick)||0,s=await xa(E,b.nation,t,o);if(s?.success){$t=!0;const i=s.alreadyClaimed?"You already submitted this tick — sit tight, resolves next tick.":"Leadership Challenge submitted. Resolves on the next tick.";alert(i),R(a)}else{const n={wrong_gov_type:"Leadership Challenge is only available in parliamentary systems.",pm_already_installed:"A Prime Minister is already serving — vacancy required.",no_coalition:"No active coalition.",not_in_coalition:"Your party is not in the governing coalition.",not_owner:"This session is not authorized to act for that party. Refresh or re-select your faction; admins must deploy the admin-inspector Leadership Challenge migration.",no_leader:"Your party has no leader to install.",no_seats:"Your party holds no parliamentary seats.",rpc_failed:"Server function call failed. The claim_leadership_challenge RPC may not be deployed yet — run migration 20260917_claim_leadership_challenge_rpc.sql."}[s?.reason]||"Could not submit: "+(s?.reason||"unknown error"),l=s?.error?`

Detail: ${s.error}`:"";alert(n+l),console.warn("[LeadershipChallenge] failed:",s)}}catch(e){console.error("[PartyActions] Leadership Challenge failed:",e),alert("Leadership Challenge failed: "+(e?.message||e))}finally{te=!1}}}let ee=!1;async function Go(){if(ee||!b?.faction?.id||!b?.nation?.id)return;if(!Gt(b.nation)){alert("Resignation is only available in parliamentary and semi-presidential systems.");return}if(K(b.nation)){alert("Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action.");return}const a=F?.pm_party_id;if(!a||a!==b.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚠ RESIGN AS PRIME MINISTER?

The PM seat vacates immediately. Coalition enters caretaker status with
a ${Ve}-tick window to nominate a successor via the cabinet panel.
If a new PM is installed, the administration continues under new leadership.
If the window expires, a snap election is called.

Cost to your party:
• −3 Momentum
• −0.05 Credibility
• Nation: −3 Stability
• 12-tick bar from the PM seat on your party

Proceed?`)){ee=!0;try{const{data:t}=await E.from("shard").select("current_tick").eq("name","Alpha Shard").single(),e=t?.current_tick||b.shard?.current_tick||0;(await ba(E,b.nation.id,b.faction.id,e))?.result==="election_called"?alert("You have resigned. Snap election scheduled as fallback if no successor is nominated."):alert("You have resigned. Coalition has a short window to nominate a successor before a snap election fires."),window.location.reload()}catch(t){console.error("[PartyActions] Resign PM failed:",t),alert("Failed to resign: "+(t?.message||"unknown error"))}finally{ee=!1}}}let ae=!1;async function Uo(){if(ae||!b?.faction?.id)return;const a=b.faction,t=a.faction_name||"this party",e=a.seats||0,o=Number(a.momentum||0).toFixed(1),s=Math.round(Number(a.party_funds||0)),i=s>=1e3?"$"+s.toLocaleString():"$"+s;if(confirm("DISBAND "+t.toUpperCase()+`?

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

This action CANNOT be undone.`)){ae=!0;try{const{data:n,error:l}=await E.rpc("disband_party",{p_faction_id:a.id});if(l)throw l;if(n&&n.success===!1)throw new Error(n.error||"Unknown error");sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:{user:c}}=await E.auth.getUser();if(c){const{data:f}=await E.from("factions").select("id, faction_type").or(`id.eq.${c.id},linked_user_id.eq.${c.id}`),m=(f||[]).find(r=>r.faction_type==="party");if(m){sessionStorage.setItem("active_faction_id",m.id),alert(t+` has been disbanded.

Redirecting to your other party.`),window.location.href="dashboard.html";return}}alert(t+` has been disbanded.

You have no remaining factions.`),window.location.href="faction-select.html"}catch(n){console.error("[PartyActions] Disband failed:",n),alert("Disband failed: "+(n?.message||n))}finally{ae=!1}}}let oe=!1;async function Yo(){if(oe)return;const a=b?.faction,t=b?.nation;if(!(!a?.id||!t?.id)){if(!lt){alert("No sitting President to impeach.");return}oe=!0;try{const e=Number(b?.shard?.current_tick)||0;await Ga(E,{faction:a,nation:t,president:lt,isPresidentParty:lt.faction_id===a.id,mySeats:a.seats||0,currentTick:e})}catch(e){console.error("[party-actions] impeachment threw:",e?.message||e),alert("Impeachment failed — check console.")}finally{oe=!1}}}let ie=!1;async function Vo(){if(ie||!b?.faction?.id||!b?.nation?.id)return;const a=b.faction,t=b.nation,e=Ue(t);if(!Gt(t)){alert("A vote of no confidence is only possible in a parliamentary or semi-presidential system.");return}const{data:o}=await E.from("head_of_government").select("faction_id, last_name").eq("nation_id",t.id).eq("active",!0).maybeSingle(),s=o?.faction_id||t.ruling_faction_id||null,i=o?.last_name||null;if(!s){alert("No active Prime Minister to file against.");return}if(s===a.id){alert("Your party is the Prime Minister — you cannot file a vote of no confidence against yourself.");return}const n=b.faction?.seats!=null?Number(b.faction.seats):0;if(n<1){alert("Your party needs at least 1 seat in the legislature to file a motion.");return}const{data:l}=await E.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=l?.current_tick||b.shard?.current_tick||0,{data:f}=await E.from("bills").select("id").eq("nation_id",t.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(f&&f.length>0){alert("A motion of no confidence is already pending.");return}const{data:m}=await E.from("campaign_actions").select("tick_performed").eq("nation_id",t.id).eq("action_type","no_confidence_filed").eq("target_id",s).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(m){const u=c-Number(m.tick_performed||0);if(u<O.NO_CONFIDENCE_COOLDOWN_TICKS){const y=O.NO_CONFIDENCE_COOLDOWN_TICKS-u;alert(`Cooldown: ${y} tick${y!==1?"s":""} remaining before another motion can be filed against this PM party.`);return}}const r=i?e?`Motion of No Confidence in PM ${i}`:`Motion of No Confidence in the ${i} Government`:"Motion of No Confidence in the Government",d=e?`IF IT PASSES:
• PM removed — President must nominate a new PM
• Your party: +15 Momentum
• PM's party: -10 Momentum`:`IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Snap elections scheduled
• Your party: +15 Momentum
• PM's party: -10 Momentum`;if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${r}"

Cost: $0 — free to file
Voting period: ${O.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

${d}

IF IT FAILS:
• Your party: -10 Momentum
• ${O.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown on this PM party

Proceed?`)){ie=!0;try{const u=await ga(E,{faction:a,nation:t,pmFactionId:s,pmLastName:i,isSemiPres:e,tick:c,mySeats:n});if(!u.ok){alert("Failed to file motion: "+u.error);return}alert(`⚡ "${u.motionName}" has been filed!

Voting is now open for ${O.NO_CONFIDENCE_VOTING_TICKS} ticks.`),window.location.href=`bill.html?id=${u.billId}`}catch(u){console.error("[PartyActions] No confidence file failed:",u),alert("Failed to file motion: "+(u?.message||"unknown error"))}finally{ie=!1}}}let Rt=!1,dt=[],kt=null;async function Wo(){if(dt.length>0)return;const{data:a,error:t}=await E.from("fundraiser_events").select("event_key, name, icon, host_sector_key, opposition_sector_key, display_order").order("display_order");if(t){console.warn("[PartyActions] fundraiser_events load failed:",t.message),dt=[];return}dt=a||[]}async function Ko(a){if(!a||!b?.nation?.id||!b?.faction?.id)return null;const{data:t}=await E.from("sectors").select("id, name, weight").eq("nation_id",b.nation.id).eq("sector_key",a).eq("is_active",!0).maybeSingle();if(!t?.id)return null;const{data:e}=await E.from("faction_sector_popularity").select("popularity").eq("faction_id",b.faction.id).eq("sector_id",t.id).maybeSingle();return{id:t.id,name:t.name,weight:Number(t.weight)||1,popularity_tenths:Number(e?.popularity)||0}}async function Jo(a){if(!Rt){if(wt>=1){alert("You have already hosted a fundraiser this tick. Try again next tick.");return}if(await Wo(),dt.length===0){alert("No fundraiser events configured. Run migration 20260728.");return}kt=null,await Xo(a)}}async function Xo(a){let t=document.getElementById("pa-fundraise-modal");t||(t=document.createElement("div"),t.id="pa-fundraise-modal",t.className="pa-modal-overlay",t.innerHTML=`
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
            </div>`,document.body.appendChild(t),t.addEventListener("click",n=>{(n.target.matches('[data-act="fr-close"]')||n.target===t)&&(t.style.display="none")})),t.style.display="flex";const e=t.querySelector("#pa-fundraise-body");e.innerHTML='<div style="padding:14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Loading sectors…</div>';const o={},s=new Set;for(const n of dt)s.add(n.host_sector_key),s.add(n.opposition_sector_key);await Promise.all(Array.from(s).map(async n=>{o[n]=await Ko(n)}));const i=dt.map(n=>{const l=o[n.host_sector_key],c=l?(l.popularity_tenths/10).toFixed(1):"—",f=l?.weight||1;return`
            <div class="pa-fr-card" data-event-key="${$(n.event_key)}" style="padding:10px 14px;border-bottom:1px dashed var(--border-main);cursor:pointer;">
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-size:14px;">${n.icon}</span>
                    <span style="font-family:var(--font-serif, 'IBM Plex Serif', serif);font-size:14px;font-weight:600;color:var(--text-bright);">${$(n.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.06em;color:var(--text-dim);text-transform:uppercase;margin-top:2px;">
                    ${$(l?.name||n.host_sector_key)} · w${f} · pop ${c}
                </div>
            </div>`}).join("");e.innerHTML=`
        <div id="pa-fr-list" style="overflow-y:auto;border-right:1px solid var(--border-main);">
            ${i}
        </div>
        <div id="pa-fr-detail" style="padding:14px 18px;overflow-y:auto;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;">Pick an event on the left to see details.</div>
        </div>`,e.querySelectorAll(".pa-fr-card").forEach(n=>{n.addEventListener("click",()=>{kt=n.dataset.eventKey,e.querySelectorAll(".pa-fr-card").forEach(l=>l.style.background=""),n.style.background="rgba(200,168,50,0.08)",Qo(e,o,a)})})}function Qo(a,t,e){const o=a.querySelector("#pa-fr-detail"),s=dt.find(v=>v.event_key===kt);if(!s)return;const i=t[s.host_sector_key],n=t[s.opposition_sector_key],l=i?(i.popularity_tenths/10).toFixed(1):"—",c=i?.weight||1,f=n?(n.popularity_tenths/10).toFixed(1):"—",m=!i,r=!n,d=s.event_key!=="corporate_gala",u=d&&i?1250*(i.popularity_tenths||0)*Math.max(1,i.weight||1):0;o.innerHTML=`
        <div style="display:flex;align-items:baseline;gap:8px;">
            <span style="font-size:18px;">${s.icon}</span>
            <span style="font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text-bright);">${$(s.name)}</span>
        </div>

        <div style="margin-top:14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Host bloc</div>
            <div style="font-family:var(--font-serif);font-size:14px;color:var(--text-bright);margin-top:2px;">${$(i?.name||s.host_sector_key)}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-top:2px;">Your popularity: <strong style="color:var(--text-bright);">${l}</strong> · National weight: <strong style="color:var(--text-bright);">w${c}</strong></div>
        </div>

        <div style="margin-top:14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;">Paired opposition</div>
            <div style="font-family:var(--font-serif);font-size:14px;color:var(--text-bright);margin-top:2px;">${$(n?.name||s.opposition_sector_key)}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-top:2px;">Your popularity: <strong style="color:var(--text-bright);">${f}</strong></div>
        </div>

        <div style="margin-top:18px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Costs (popularity)</div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↓ ${$(i?.name||s.host_sector_key)}</span><span style="color:#d44a4a;font-weight:700;">−0.3 (donor fatigue)</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↓ ${$(n?.name||s.opposition_sector_key)}</span>
                ${r?'<span style="color:var(--text-dim);font-style:italic;">not in this nation — no cost</span>':'<span style="color:#d44a4a;font-weight:700;">−0.5 (optics)</span>'}
            </div>
        </div>

        <div style="margin-top:10px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.1em;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Projected yield</div>
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-bright);padding:2px 0;">
                <span>↑ Party funds</span>
                ${d?`<span style="color:#5cb85c;font-weight:700;">+${He(u)}</span>`:'<span style="color:var(--text-dim);font-style:italic;">positioning only — no yield</span>'}
            </div>
        </div>

        ${m?'<div style="margin-top:14px;font-family:var(--font-mono);font-size:10px;color:var(--red);">This nation does not have the host bloc seeded — pick a different event.</div>':""}

        <div style="margin-top:18px;text-align:right;">
            <button type="button" class="pa-modal-btn pa-modal-btn--primary"
                    id="pa-fr-confirm"
                    ${m?"disabled":""}
                    style="padding:8px 18px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:rgba(200,168,50,0.08);border:1px solid var(--gold, #c8a832);color:var(--gold, #c8a832);cursor:pointer;${m?"opacity:0.4;cursor:not-allowed;":""}">
                Host this fundraiser
            </button>
        </div>
    `;const y=o.querySelector("#pa-fr-confirm");y&&y.addEventListener("click",()=>Zo(e))}async function Zo(a){if(!(Rt||!kt)){Rt=!0;try{const t=b.shard?.current_tick||0,{data:e,error:o}=await E.rpc("fundraise_themed",{p_faction_id:b.faction.id,p_nation_id:b.nation.id,p_event_key:kt,p_tick:t});if(o||!e?.success){alert("Fundraise failed: "+(o?.message||e?.error||"unknown"));return}const s=document.getElementById("pa-fundraise-modal");s&&(s.style.display="none"),sessionStorage.removeItem("nationhood_state"),wt++;const i=Number(e?.yield)||0;i>0&&alert("Fundraiser hosted. +"+He(i)+" to party funds."),R(a)}catch(t){console.error("[PartyActions] Fundraise error:",t),alert("Fundraise failed.")}finally{Rt=!1}}}function ti(a){const t=document.getElementById("pa-statement-modal");if(!t)return;const e=b.faction,o=e?.color||"#c8a832",s=e?.leader_first_name&&e?.leader_last_name?`${e.leader_first_name} ${e.leader_last_name}`:"Party Leader",i=Ie.map(m=>`<div class="pa-topic-card" data-topic="${m.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${m.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${$(m.label)}</span>
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
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${o};">${$(s)}</span>
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
    `,t.classList.add("active");let n=null,l=!1;const c=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",c),document.getElementById("pa-stmt-cancel")?.addEventListener("click",c),t.addEventListener("click",m=>{m.target===t&&c()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",m=>{const r=m.target.closest(".pa-topic-card");r&&(n=r.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(d=>{const u=d.dataset.topic===n;d.style.borderColor=u?o:"var(--border-mid)",d.style.background=u?o+"0a":"";const y=d.querySelector("span:last-child");y&&(y.style.color=u?"var(--text-bright)":"var(--text-secondary)")}),f())});const f=()=>{const m=document.getElementById("pa-stmt-body")?.value?.trim()||"",r=document.getElementById("pa-stmt-submit"),d=document.getElementById("pa-stmt-charcount");d&&(d.textContent=`${m.length} characters`),r&&(r.disabled=!(n&&m.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",f),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(l)return;const m=document.getElementById("pa-stmt-body")?.value?.trim();if(!n||!m||m.length<10)return;l=!0;const r=document.getElementById("pa-stmt-submit");r&&(r.disabled=!0,r.textContent="Issuing...");try{const d=b.shard?.current_tick||0,y=Ie.find(M=>M.id===n)?.label||n,v=2e4,{data:_}=await E.from("factions").select("party_funds").eq("id",e.id).single(),p=_?.party_funds||0;if(p<v){alert(`Not enough funds. You have $${Math.round(p/1e3)}k, need $20k.`);return}const x=p-v,{error:g}=await E.from("factions").update({party_funds:x}).eq("id",e.id);if(g){alert("Failed to deduct funds: "+g.message);return}e.party_funds=x;const I=Se[Math.floor(Math.random()*Se.length)].replace("{party_name}",e.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",y),{error:w}=await E.from("campaign_actions").insert({party_id:e.id,nation_id:b.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:d,result:{topic:n,topicLabel:y,headline:I,body:m,leaderName:s}});w&&console.error("[PartyActions] Statement log failed:",w.message);const{error:k}=await E.from("valdorian_articles").insert({nation_id:b.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:I,subheadline:y,lede:m.substring(0,200)+(m.length>200?"...":""),body_paragraphs:JSON.stringify(m.split(/\n\n+/).filter(M=>M.trim())),quotes:JSON.stringify([{posture:"assertive",text:m.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([n]),source_event_id:"statement_"+Date.now(),tick:d});k&&console.error("[PartyActions] Article creation failed:",k.message);const{error:C}=await E.from("event_log").insert({nation_id:b.nation?.id,event_name:I,category:"political",description_chosen:`${e.faction_name} issues the following statement regarding ${y}: "${m}"`,fired_at_tick:d});C&&console.warn("[Statement] event_log insert failed:",C.message);const{error:S}=await E.from("admin_timeline_events").insert({nation_id:b.nation?.id,tick:d,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${y}: "${m.substring(0,120)}${m.length>120?"...":""}"`});S&&console.warn("[Statement] timeline insert failed:",S.message),c(),R(a)}catch(d){console.error("[PartyActions] Statement error:",d),alert("Failed to issue statement. Please try again.")}finally{l=!1,r&&(r.disabled=!1,r.textContent="Issue Statement")}})}const Ht=10;function ei(a){const t=document.getElementById("pa-platform-modal");if(!t)return;const e=b.faction;b.nation;const o=e?.color||"#c8a832";let s=null,i=!1;const n={};for(const f of ye)f.faction_id!==e?.id&&(n[f.platform_key]=(n[f.platform_key]||0)+1);const l=new Set(tt.map(f=>f.platform_key));function c(){const f=_t.find(v=>v.id===s),m=`+${($e.adoptTenths/10).toFixed(1)}`,r=($e.failTenths/10).toFixed(1),d="#5cc55c",u=_t.map(v=>{const _=s===v.id,p=l.has(v.id),x=n[v.id]||0;return`<div class="pa-plat-card ${_?"selected":""} ${p?"adopted":""}" data-plat="${v.id}">
                ${p?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:17px;">${v.icon}</span>
                    <span style="font-size:12px;font-weight:700;color:${p?o:_?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${$(v.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${$(v.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${d};">${m}</span>
                    ${x>0?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${x} rival${x>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let y;if(!f)y=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:28px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const v=f.improve.map(h=>{const I=we(h,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:10px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${I.color};white-space:nowrap;">${I.arrow} ${ke[h]||h}</span>`}).join(""),_=f.worsen.map(h=>{const I=we(h,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:10px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${I.color};white-space:nowrap;">${I.arrow} ${ke[h]||h}</span>`}).join(""),p=l.has(f.id),x=tt.length;let g;p?g=`<div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:x>=3?g='<div style="font-family:var(--font-mono);font-size:11px;color:var(--red);">All 3 platform slots are full.</div>':i?g=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:11px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${$(f.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:g=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${o};">Adopt Platform</button>
                </div>`,y=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:26px;">${f.icon}</span>
                        <div>
                            <div style="font-size:19px;font-weight:700;color:var(--text-bright);">${$(f.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${$(f.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${$(f.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">POPULARITY</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${d};">${m}</span>
                                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">all sectors on adopt — per-sector boosts also apply</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${f.improve.length} stats, +${Ht} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${v}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${f.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${_}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">${$(f.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:11px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${Ht}</strong>. Failure: <strong style="color:var(--red);">${r} popularity all sectors</strong> and the per-sector boosts revert with the constituencies you wooed (the alienated stay alienated). If you don't enter government, the promise abates.
                        </div>
                    </div>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;align-items:center;">
                    ${g}
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
                        ${u}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow-y:auto;" id="pa-plat-detail">
                        ${y}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=v=>{v.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",v=>{const _=v.target.closest(".pa-plat-card");_&&(s=_.dataset.plat,i=!1,c())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{i=!0,c()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{i=!1,c()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>ai(a,s))}t.classList.add("active"),c()}let Pt=!1;async function ai(a,t){if(Pt)return;Pt=!0;const e=document.getElementById("pa-platform-modal"),o=b.faction,s=b.nation;if(!o||!s||!t){Pt=!1;return}const i=_t.find(f=>f.id===t);if(!i)return;const n={},l={},c=f=>De.has(f);for(const f of i.improve){const m=Number(s[f]??50);n[f]=m,c(f)?l[f]=Math.max(0,m-Ht):l[f]=Math.min(100,m+Ht)}try{const f=b.shard?.current_tick||0,{data:m,error:r}=await E.rpc("adopt_platform",{p_faction_id:o.id,p_nation_id:s.id,p_platform_key:t,p_tick:f,p_baseline_stats:n,p_target_stats:l});if(r){console.error("[PartyActions] Platform adoption failed:",r.message),alert("Failed to adopt platform: "+r.message);return}if(m&&!m.success){alert(m.error||"Failed to adopt platform.");return}const d=m?.slot||tt.length+1;tt.push({faction_id:o.id,nation_id:s.id,platform_key:t,slot:d,adopted_at_tick:f,baseline_stats:n,target_stats:l,status:"active"}),ye.push(tt[tt.length-1]),e?.classList.remove("active"),R(a)}catch(f){console.error("[PartyActions] Platform adoption error:",f),alert("An error occurred. Please try again.")}finally{Pt=!1}}let yt=null,la={isGoverning:!1,statusLabel:"OPPOSITION",administration:null,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],strongholdsByParty:{},passedBills:[],sectors:[],caucuses:[],nextElection:null,nextElectionTicks:null};function G(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function oi(a,t,e){const o={};for(const s of a)o[s.id]=Sa(s.id,t,e,3);return o}function ii(a,t,e){const o=new Map(a.map(i=>[i.id,i])),s=new Map;for(const i of e){const n=s.get(i.sector_id)||[];n.push({party_id:i.faction_id,popularity:Number(i.popularity)||0}),s.set(i.sector_id,n)}return t.map(i=>{const n=(s.get(i.id)||[]).filter(l=>l.popularity>0&&o.has(l.party_id)).map(l=>{const c=o.get(l.party_id);return{party_id:c.id,abbreviation:c.abbreviation||(c.faction_name||"?").slice(0,3).toUpperCase(),color:c.party_color||"#888",seats:Number(c.seats)||0,popularity:l.popularity}});return n.sort((l,c)=>c.popularity!==l.popularity?c.popularity-l.popularity:c.seats-l.seats),{sector_key:i.sector_key,name:i.name,description:i.description||"",weight:Number(i.weight)||0,candidates:n}}).sort((i,n)=>n.weight!==i.weight?n.weight-i.weight:(i.name||"").localeCompare(n.name||""))}async function ni(a,t,e){yt=t;const o=document.getElementById(e);if(!o)return;const s=t.faction,i=t.nation,n=i?.id,l=s?.id;if(!s||!n){o.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}o.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const c=t.shard?.current_tick||0,[f,m,r,d,u,y,v,_]=await Promise.all([We(a,n,l),a.from("factions").select("*").eq("nation_id",n).eq("faction_type","party"),a.from("sectors").select("id, sector_key, name, description, weight, base_turnout, is_active").eq("nation_id",n).eq("is_active",!0).order("display_order"),a.from("bills").select("id, bill_name, bill_type, proposed_by, passed_tick, bill_articles(selected_option:policy_options!selected_option_id(sector_effects)), bill_support(faction_id, stance)").eq("nation_id",n).eq("status","passed").not("passed_tick","is",null).order("passed_tick",{ascending:!1}).limit(15),Promise.resolve({data:[],error:null}),a.from("elections").select("*").eq("nation_id",n).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5),a.from("ministries").select("party_id").eq("nation_id",n).eq("is_active",!0),ua(n)]);m.error&&console.error("[PartyOverview] Parties fetch error:",m.error.message),r.error&&console.error("[PartyOverview] Sectors fetch error:",r.error.message),u.error&&console.error("[PartyOverview] Caucus fetch error:",u.error.message),y.error&&console.error("[PartyOverview] Election fetch error:",y.error.message),d.error&&console.error("[PartyOverview] Passed-bills fetch error:",d.error.message);const p=m.data||[],x=r.data||[],g=f.administration,h=new Set((v.data||[]).map(L=>L.party_id).filter(Boolean));let I=[];if(p.length>0&&x.length>0){const L=p.map(z=>z.id),{data:N,error:T}=await a.from("faction_sector_popularity").select("faction_id, sector_id, popularity").in("faction_id",L);T&&console.error("[PartyOverview] Popularity fetch error:",T.message),I=N||[]}const w=oi(p,x,I),k=ii(p,x,I),C=g?.started_at_tick!=null?Math.max(0,c-g.started_at_tick):0,S=y.data||[],M=S[0]||null,A=M?Math.max(0,M.election_tick-c):null;let P=null;M&&i&&Et(i)&&(P=S.some(N=>N.election_type==="presidential"&&N.election_tick===M.election_tick)?"General":"Midterm"),la={isGoverning:f.isGoverning,statusLabel:f.label,administration:g,ministryPartyIds:h,ticksInPower:C,myFaction:s,allParties:p,rivalParties:p.filter(L=>L.id!==l),blocMap:_,strongholdsByParty:w,sectorRanking:k,passedBills:d.data||[],sectors:x,caucuses:u.data||[],nextElection:M,nextElectionTicks:A,nextElectionLabel:P},ri(o)}catch(c){console.error("[PartyOverview] Init error:",c),o.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}function ri(a){const t=la,e=t.myFaction,o=yt.nation,s=e?.party_color||e?.color||"#c8a832";yt.shard?.current_tick,t.administration?.admin_name||t.isGoverning;const i=t.statusLabel,n=t.isGoverning?"var(--green)":"var(--orange)",l=e?.seats||0,c=o?.total_seats||100;a.innerHTML=`<div class="po-page">
        ${si(t,s,l,c)}
        <div class="po-columns">
            <div class="po-col-left">
                ${li(t,e,s,i,n)}
                ${di(t,e,s)}
                ${ci(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${pi()}
                ${vi(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${ui(t,e)}
                ${yi()}
            </div>
        </div>
    </div>`}function si(a,t,e,o){const s=a.isGoverning?a.administration?.admin_name||"Government":"Opposition",i=(yt.nation?.government_type||"").toLowerCase().includes("monarchy"),n=i?"No elections":a.nextElectionTicks!=null?a.nextElectionTicks:"—",l=i?"var(--text-dim)":typeof n=="number"&&n<=3?"var(--red)":"var(--text-bright)",c=i?"NEXT ELECTION":a.nextElectionLabel?"NEXT "+a.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${G(s)}</div>
                <div class="po-summary-sub">${a.ticksInPower} ticks in power</div>
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
            <div class="po-summary-label">${c}</div>
            <div class="po-summary-value" style="color:${l};">${n}${typeof n=="number"?" ticks":""}</div>
        </div>
    </div>`}function li(a,t,e,o,s){const i=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",n=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const l=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${e};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${e};background:${e}12;border-color:${e}33;${t?.custom_logo_url?"overflow:hidden;":""}">${t?.custom_logo_url?`<img src="${G(t.custom_logo_url)}" alt="${G(t?.faction_name||"Party logo")}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'">`:n}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                    <span class="po-identity-name">${G(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${o}</span>
                    ${qe(t?.bloc_id,a.blocMap)}
                </div>
                <div class="po-identity-meta">${a.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${e};background:${e}15;border-color:${e}33;">${n}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${G(i)}</span>
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
    </div>`}function di(a,t,e){const o=t?.id,s=a.sectorRanking||[],i=(l,c)=>{const f=l.party_id===o,m=f?e:l.color||"#888",r=(Math.round(l.popularity)/10).toFixed(1),d=f?'<span class="po-stronghold-chip-label" style="font-weight:700;">You</span>':`<span class="po-stronghold-chip-label">${G(l.abbreviation)}</span>`;return`<div class="po-stronghold-chip" style="border-color:${m}66;background:${m}14;">
            ${d}
            <span class="po-stronghold-chip-label" style="color:${m};font-weight:700;margin-left:4px;">${r}</span>
        </div>`};return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTOR RANKING</span>
            <span class="po-card-subtitle">all sectors · top 3 other parties · you on the right</span>
        </div>
        <div style="padding:8px 12px;">
            ${s.map(l=>{const c=l.candidates||[],f=c.filter(x=>x.party_id!==o).slice(0,3).map(x=>i(x)).join(""),m=c.find(x=>x.party_id===o)||null,r=i(m||{party_id:o,popularity:0,color:e}),d=f?`<div class="po-stronghold-chips">${f}</div>`:'<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">No other party popularity yet</div>',u=Number(l.weight)||0,y=u>=3?"var(--gold, #c9a449)":u===2?"var(--amber, #c8a64e)":"var(--text-secondary)",v=`<span style="display:inline-block;min-width:18px;padding:1px 5px;font-family:var(--font-mono);font-size:9px;font-weight:700;color:${y};border:1px solid ${y}66;background:${y}14;text-align:center;letter-spacing:0;">w${u}</span>`,_=(l.description||"").trim(),p=_?`<div style="font-family:var(--font-mono);font-size:9.5px;color:var(--text-dim);line-height:1.4;margin-top:2px;">${G(_)}</div>`:"";return`<div class="po-stronghold-row" style="align-items:flex-start;">
            <div class="po-stronghold-party" style="min-width:0;flex:1;">
                <div style="display:flex;align-items:center;gap:8px;">
                    ${v}
                    <span class="po-stronghold-party-name">${G(l.name)}</span>
                </div>
                ${p}
            </div>
            ${d}
            <div style="margin-left:14px;padding-left:14px;border-left:1px dashed var(--border-main, rgba(255,255,255,0.1));display:flex;align-items:center;">
                ${r}
            </div>
        </div>`}).join("")||'<div style="padding:8px 0;font-size:9px;color:var(--text-dim);font-family:var(--font-mono);">No active sectors in this nation.</div>'}
        </div>
    </div>`}function ci(a){const t=(a.caucuses||[]).filter(s=>s.name&&s.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const e=a.faction?.seats||0,o=t.map(s=>{const i=s.relationship_score??50,n=i>60?"var(--green)":i>40?"var(--amber)":"var(--red)",l=Math.round((s.seat_share||0)*e),c=(s.dominant_axis||"").replace(/_/g,"/"),f=s.wing_end==="left"?c.split("/")[0]:c.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${G(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${G(f)}</div>
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
    </div>`}function pi(){return`<div class="po-card">
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
    </div>`}function mi(a){const t=new Map;for(const e of a.bill_articles||[]){const o=e?.selected_option?.sector_effects||[];for(const s of o){if(!s||typeof s.sector_key!="string")continue;const i=Number(s.change_tenths);!Number.isFinite(i)||i===0||t.set(s.sector_key,(t.get(s.sector_key)||0)+i)}}return Array.from(t,([e,o])=>({sector_key:e,change_tenths:o}))}function fi(a,t){if(!a)return"";const e=a.party_color||a.color||"#888",o=a.abbreviation||(a.faction_name||"?").slice(0,3).toUpperCase(),s=t?`<span style="font-family:var(--font-mono);font-size:6px;color:${e};margin-left:3px;letter-spacing:0.05em;">SPONSOR</span>`:"";return`<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border:1px solid ${e}55;background:${e}14;font-family:var(--font-mono);font-size:8px;font-weight:700;color:${e};">${G(o)}${s}</span>`}function Oe(a,t,e){return a.length?a.map(o=>{const i=(e?-o.change_tenths:o.change_tenths)/10,n=i>0?"+":i<0?"−":"",l=Math.abs(i).toFixed(1),c=i>0?"var(--green)":i<0?"var(--red)":"var(--text-dim)",f=t.get(o.sector_key)||o.sector_key;return`<span style="white-space:nowrap;"><span style="color:${c};font-weight:700;">${n}${l}</span> <span style="color:var(--text-secondary);">${G(f)}</span></span>`}).join('<span style="color:var(--text-dim);margin:0 4px;">·</span>'):'<span style="color:var(--text-dim);">no sector effects</span>'}function vi(a){const t=a.passedBills||[],e=yt.shard?.current_tick||0,o=t.filter(l=>!["no_confidence","minister_confirmation","foundational","veto_override"].includes(l.bill_type));if(o.length===0)return`<div class="po-card" style="flex:1;">
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
        <div style="max-height:520px;overflow-y:auto;">${o.map(l=>{const c=mi(l),f=e-(l.passed_tick||0),m=f===0?"just now":f+"t ago",r=new Map;for(const x of l.bill_support||[]){const g=x.stance==="accept"?"yes":x.stance==="reject"?"no":x.stance;(g==="yes"||g==="no")&&r.set(x.faction_id,g)}l.proposed_by&&r.set(l.proposed_by,"yes");const d=[],u=[];for(const[x,g]of r){const h=s.get(x);if(!h)continue;const I=fi(h,x===l.proposed_by);g==="yes"?d.push(I):g==="no"&&u.push(I)}const y=s.get(l.proposed_by),v=y?`<span style="color:${y.party_color||y.color||"#888"};font-weight:700;">${G(y.abbreviation||y.faction_name||"?")}</span>`:'<span style="color:var(--text-dim);">unknown</span>',_=d.length?`<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--green);letter-spacing:0.05em;width:36px;flex-shrink:0;">GAINED</span>
                    ${d.join("")}
               </div>
               <div style="margin-left:40px;font-family:var(--font-mono);font-size:8px;line-height:1.6;margin-top:2px;">
                    ${Oe(c,i,!1)}
               </div>`:"",p=u.length?`<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);letter-spacing:0.05em;width:36px;flex-shrink:0;">LOST</span>
                    ${u.join("")}
               </div>
               <div style="margin-left:40px;font-family:var(--font-mono);font-size:8px;line-height:1.6;margin-top:2px;">
                    ${Oe(c,i,!0)}
               </div>`:"";return`<div style="padding:8px 12px;border-bottom:1px solid rgba(200,196,184,0.05);">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
                <span style="font-size:10px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${G(l.bill_name||"Untitled bill")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);flex-shrink:0;">${m}</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:1px;">sponsored by ${v}</div>
            ${_}
            ${p}
        </div>`}).join("")}</div>
    </div>`}function ui(a,t){const e=a.rivalParties,o=a.administration,s=yt.nation,i=o?.pm_party_id,n=s?.total_seats||100,l=e.map(c=>{const f=c.party_color||"#666",m=c.abbreviation||c.faction_name?.slice(0,3)?.toUpperCase()||"?",r=c.leader_first_name&&c.leader_last_name?`${c.leader_first_name} ${c.leader_last_name}`:"Unknown",d=c.seats||0,u=Ba(c,o,a.ministryPartyIds,s);let y=u.label;const v=u.isGoverning?"var(--green)":"var(--orange)";u.isGoverning&&u.label==="GOVERNING"&&(c.id===i?y="GOVERNING — LEAD":y="GOVERNING — JUNIOR");const _=d-(t?.seats||0),p=_>0?"var(--green)":_<0?"var(--red)":"var(--text-dim)",x=a.strongholdsByParty?.[c.id]||[],g=x.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;">${x.map(h=>`<span style="font-family:var(--font-mono);font-size:9px;padding:2px 6px;border:1px solid ${f}44;background:${f}10;color:var(--text-bright);white-space:nowrap;">${G(h.name)}</span>`).join("")}</div>`:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Unaligned</div>';return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${f}15;border:1px solid ${f}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${f};">${G(m)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${G(c.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${G(r)}</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${v};background:${v}0a;border:1px solid ${v}44;white-space:nowrap;">${y}</span>
                    ${qe(c.bloc_id,a.blocMap)}
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
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${p};">${_>0?"+":""}${_}</span>
                </div>
            </div>
            ${g}
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${e.length} parties</span>
        </div>
        ${l||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`}function yi(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--text-bright);font-weight:700;">Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let ht=null,rt=[],pe=[],bt={},Dt=null;function H(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function jt(a){return a>=1e6?(a/1e6).toFixed(2)+"M":a>=1e3?Math.round(a/1e3)+"k":String(a)}function da(a){return["January","February","March","April","May","June","July","August","September","October","November","December"][a%12]+", "+(2e3+Math.floor(a/12))}function gi(a,t){if((a.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const o=t?.end_reason||"";return o.includes("no_confidence")||o.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:o.includes("snap")||o.includes("dissolved")||o.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function bi(a,t){ht=t;const e=document.getElementById("pa-past-elections-root");if(!e)return;e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const o=t.nation?.id;if(!o){e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,i,n]=await Promise.all([a.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",o).eq("status","completed").order("election_tick",{ascending:!1}),a.from("administrations").select("*").eq("nation_id",o).order("started_at_tick",{ascending:!1}),a.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",o).eq("faction_type","party").is("abandoned_at",null)]);rt=s.data||[],pe=i.data||[];const l=n.data||[];bt={};for(const c of l)bt[c.id]=c;for(const c of rt){const f=c.results?.votes||[];for(const r of f){const d=bt[r.party_id];r.color=d?.party_color||"#666",r.abbreviation=d?.abbreviation||r.party_name?.slice(0,3)?.toUpperCase()||"?"}const m=c.results?.presidential_candidates||[];for(const r of m){const d=bt[r.faction_id];r.color=d?.party_color||"#666",r.abbreviation=d?.abbreviation||r.party_name?.slice(0,3)?.toUpperCase()||"?"}}xi(e),ca(e)}function xi(a){a.addEventListener("click",t=>{const e=t.target.closest("[data-election-id]");if(e){const o=e.dataset.electionId;Dt=Dt===o?null:o,ca(a)}})}function hi(a){const t=Dt===a.id,e=(a.results?.presidential_candidates||[]).slice().sort((v,_)=>(_.votes||0)-(v.votes||0)),o=e.find(v=>v.winner)||null,s=a.results?.turnout_pct??0,i=a.results?.total_votes_cast??0,n=da(a.election_tick),l="#5a8aaa",c=ht.faction?.id,f=a.results?.was_runoff===!0,m=f&&Array.isArray(a.results?.round_1_candidates)?[...a.results.round_1_candidates].sort((v,_)=>(_.votes||0)-(v.votes||0)):null;if(m)for(const v of m){const _=bt[v.faction_id];v.color=_?.party_color||v.color||"#666",v.abbreviation=_?.abbreviation||v.abbreviation||v.party_name?.slice(0,3)?.toUpperCase()||"?"}const r=e.slice(0,3),d=o?`${o.candidate_name||""}`.trim():"",u=o?.color||"#888";let y=`<div data-election-id="${a.id}" style="
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
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${H(v.abbreviation)}</span>
                        <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${(v.vote_percentage||0).toFixed(1)}%</span>
                    </div>`).join("")}
                </div>
            </div>
            <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                    President: <span style="color:${u};font-weight:700;">${H(d||"No winner")}</span>
                </div>
                <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${t?"▲":"▼"}</span>
            </div>
        </div>
    </div>`;if(t){const v=e.reduce((k,C)=>k+(Number(C.vote_percentage)||0),0)||100,_=e.map(k=>{const C=(Number(k.vote_percentage)||0)/v*100,S=(k.vote_percentage||0).toFixed(1);return`<div style="width:${C}%;background:${k.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${C>=8?9:6}px;font-weight:700;color:#000;">${C>=5?S+"%":""}</div>`}).join(""),p=e.map(k=>{const C=k.faction_id===c,S=!!k.winner;return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${C?`background:${k.color}08;`:""}">
                <div class="pe-col-logo" style="width:30px;height:30px;background:${k.color}15;border:1px solid ${k.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${(k.abbreviation||"?").slice(0,2)}</div>
                <div class="pe-col-party" style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:5px;">
                        <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${H(k.candidate_name||"Unknown")}</span>
                        ${S?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">WINNER</span>':""}
                        ${C?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:${k.color};">${H(k.party_name||"")}</div>
                </div>
                <span class="pe-col-votes" style="width:90px;text-align:right;font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright);">${jt(k.votes||0)}</span>
                <span class="pe-col-pct" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(k.vote_percentage||0).toFixed(1)}%</span>
            </div>`}).join(""),x=o?f?"Won Runoff":"Elected Outright":null,g=f?"#d4a83c":"#5c5",h=o?`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${u};">
            <div style="padding:12px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">PRESIDENT-ELECT</span>
                    ${x?`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${g};background:${g}0a;border:1px solid ${g}30;">${H(x).toUpperCase()}</span>`:""}
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;background:${u}15;border:1.5px solid ${u};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${u};">${H((d||"?").split(" ").map(k=>k[0]||"").join("").slice(0,3))}</div>
                    <div>
                        <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${H(d)}</div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">President &middot; ${H(o.party_name||"")} &middot; ${(o.vote_percentage||0).toFixed(1)}% of vote${f?" (runoff)":""}</div>
                    </div>
                </div>
            </div>
        </div>`:"",I=new Set(e.map(k=>k.candidate_id)),w=f&&m&&m.length>0?`
            <div style="padding:12px 20px;border-bottom:1px solid var(--border-main);background:rgba(212,168,60,0.04);">
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:#d4a83c;">ROUND 1 — NO MAJORITY</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Top 2 advanced to runoff</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                    ${m.map(k=>{const C=I.has(k.candidate_id),S=(Number(k.vote_percentage)||0).toFixed(1);return`<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:${C?"rgba(91,155,213,0.06)":"transparent"};border-left:2px solid ${C?"#5b9bd5":"transparent"};">
                            <div style="width:10px;height:10px;background:${k.color};flex-shrink:0;"></div>
                            <span style="flex:1;font-size:12px;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${H(k.candidate_name||"Unknown")}</span>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);min-width:56px;text-align:right;">${H(k.party_name||"")}</span>
                            <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${C?"#5b9bd5":"var(--text-secondary)"};min-width:48px;text-align:right;">${S}%</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${C?"#5b9bd5":"#888"};min-width:80px;text-align:right;">${C?"ADVANCED":"ELIMINATED"}</span>
                        </div>`}).join("")}
                </div>
            </div>`:"";y+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
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
                        <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${jt(i)}</div>
                    </div>
                </div>
            </div>
            ${e.length>0?`<div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                <div style="display:flex;height:18px;gap:1px;">${_}</div>
            </div>`:""}
            ${w}
            <div style="padding:0 20px;">
                <div class="pe-tbl-head" style="display:flex;padding:8px 0;border-bottom:1px solid var(--border-main);font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">
                    <span class="pe-col-logo" style="width:30px;"></span>
                    <span class="pe-col-party" style="flex:1;">${f?"RUNOFF — FINAL RESULTS":"CANDIDATE"}</span>
                    <span class="pe-col-votes" style="width:90px;text-align:right;">VOTES</span>
                    <span class="pe-col-pct" style="width:70px;text-align:right;">VOTE %</span>
                </div>
                ${e.length>0?p:'<div style="padding:20px 0;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:11px;">No candidate data on record.</div>'}
            </div>
            ${h}
        </div>`}return y}function ca(a){if(rt.length===0){a.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const t=ht.faction?.id,e=ht.nation?.total_seats||100,o=Math.ceil(e/2)+1,s=rt.map((i,n)=>{if(i.election_type==="presidential")return hi(i);const l=Dt===i.id,c=(i.results?.votes||[]).sort((C,S)=>(S.seats||0)-(C.seats||0)),f=c.slice(0,3),m=i.results?.turnout_pct??0,r=i.results?.total_votes_cast??0,d=i.results?.sector_breakdown?.independent_seats??0,u=da(i.election_tick),y=pe.find(C=>C.started_at_tick>=i.election_tick&&C.started_at_tick<=i.election_tick+5),v=pe.find(C=>C.ended_at_tick!=null&&C.ended_at_tick>=i.election_tick-2&&C.ended_at_tick<=i.election_tick+2),_=gi(i,v),p=Et(ht.nation),x=p?"President":"PM",g=y?.prime_minister||"Unknown",h=y?.pm_party_id&&c.find(C=>C.party_id===y.pm_party_id)?.color||"#888",w=(n<rt.length-1?rt[n+1]:null)?.results?.votes||[];let k=`<div data-election-id="${i.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${l?"border-bottom:none;":""}
        ">
            <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                    <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${u}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${_.color};background:${_.color}0a;border:1px solid ${_.color}25;">${_.label.toUpperCase()}</span>
                    <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                        ${f.map(C=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${C.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${H(C.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${C.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${x}: <span style="color:${h};font-weight:700;">${H(g)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${l?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(l){const C=c.map(L=>`<div style="width:${L.seats/e*100}%;background:${L.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${L.seats>=8?9:6}px;font-weight:700;color:#000;">${L.seats>=5?L.seats:""}</div>`).join(""),S=d>0?`<div style="width:${d/e*100}%;background:#ffffff;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${d>=8?9:6}px;font-weight:700;color:#000;" title="Independents">${d>=5?d:""}</div>`:"",M=C+S,A=c.map(L=>{const N=L.party_id===t,T=w.find(at=>at.party_id===L.party_id),z=T?L.seats-(T.seats||0):null,V=L.seats/e*100-(L.vote_percentage||0);return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${N?`background:${L.color}08;`:""}">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:${L.color}15;border:1px solid ${L.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${L.abbreviation?.slice(0,2)||"?"}</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${H(L.party_name)}</span>
                            ${N?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${L.color};">${H(L.abbreviation)}</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${L.seats}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${z!=null?z>0?"#5c5":z<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${z!=null?z>0?"▲ "+z:z<0?"▼ "+Math.abs(z):"—":"NEW"}</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${jt(L.votes||0)}</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(L.vote_percentage||0).toFixed(1)}%</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(V)<2?"var(--text-dim)":V>0?"#5c5":"#c84"};">${V>0?"+":""}${V.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(V)<2?"proportional":V>0?"overrep.":"underrep."}</span></span>
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
                </div>`:"");let P="";if(y){const L=y.coalition_parties||[],N=y.total_seats||L.reduce((X,St)=>X+(St.seats||0),0),T=N>=o,z=T?"Majority Coalition":"Minority Coalition",D=y.ended_at_tick?y.end_reason||"Ended":"Current Government",V=y.ended_at_tick?"var(--text-dim)":"#5c5",at=y.ended_at_tick?Math.abs(y.ended_at_tick-y.started_at_tick)+" ticks":"Ongoing",ma=L.map(X=>{const St=c.find(Ut=>Ut.party_id===X.party_id)?.color||"#666";return`<div style="width:${N>0?(X.seats||0)/N*100:0}%;background:${St};height:100%;"></div>`}).join(""),fa=L.map(X=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${c.find(Ut=>Ut.party_id===X.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${H(X.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${X.seats||0}</span>
                    </div>`).join("");P=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${h};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${V};background:${V}0a;border:1px solid ${V}25;">${H(D.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${at}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${h}15;border:1.5px solid ${h};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${h};">${H(g.split(" ").map(X=>X[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${H(g)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${p?"President":"Prime Minister"} &middot; ${H(y.pm_party_name||"")} &middot; ${z}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${ma}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${fa}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${T?"#5c5":"#c84"};">${N} seats ${T?"(majority +"+(N-o)+")":"(minority, "+(o-N)+" short)"}</span>
                        </div>
                    </div>
                </div>`}k+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${H(_.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${m>70?"#5c5":m>60?"#ca5":"#c84"};">${m.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${jt(r)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${M}</div>
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
                    ${A}
                </div>

                ${P}
            </div>`}return k}).join("");a.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${rt.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${s}</div>
    </div>`}let Z=null,me=!1,Be=!1,fe=!1,Fe=!1,ve=!1;function pa(a){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===a)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+a)),sessionStorage.setItem("party_subtab",a),a==="actions"&&!me&&Z&&(me=!0,Ze(mt,Z)),a==="parties"&&!Be&&Z&&(Be=!0,ni(mt,Z,"pa-parties-root")),a==="election"&&!fe&&Z&&(fe=!0,ve?ne(document.getElementById("pa-election-root")):je(mt,Z).then(()=>{ve=!0,ne(document.getElementById("pa-election-root"))})),a==="past-elections"&&!Fe&&Z&&(Fe=!0,bi(mt,Z))}document.getElementById("pa-subtabs").addEventListener("click",a=>{const t=a.target.closest(".pa-subtab");!t||t.classList.contains("active")||pa(t.dataset.panel)});ya("politics",async a=>{Z=a,je(mt,a).then(()=>{ve=!0,fe&&ne(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?pa(t):(me=!0,await Ze(mt,a))});
