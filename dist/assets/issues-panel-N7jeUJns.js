import{a as c}from"./utils-CzgKGX6o.js";import{I as R}from"./issues-C728v86F.js";import{b as q}from"./event-helpers-C1AdfzfR.js";const j={mediate:{eventName:"Mediation Offered",triggerKey:"dispute_mediate_offered",line:(e,a,s)=>`${e} has offered to mediate the conflict between ${a} and ${s}.`},condemn_pressor:{eventName:"Dispute Condemnation",triggerKey:"dispute_condemn_pressor",line:(e,a,s)=>`${e} has condemned ${a} in the dispute between ${a} and ${s}.`},condemn_claimant:{eventName:"Dispute Condemnation",triggerKey:"dispute_condemn_claimant",line:(e,a,s)=>`${e} has condemned ${s} in the dispute between ${a} and ${s}.`},support_pressor:{eventName:"Dispute Support",triggerKey:"dispute_support_pressor",line:(e,a,s)=>`${e} is supporting ${a} in the dispute between ${a} and ${s}.`},support_claimant:{eventName:"Dispute Support",triggerKey:"dispute_support_claimant",line:(e,a,s)=>`${e} is supporting ${s} in the dispute between ${a} and ${s}.`}};function E(e){const a=String(e||"").trim().split(/\s+/).filter(Boolean);return a.length>=2?(a[0][0]+a[1][0]).toUpperCase():String(e||"?").slice(0,2).toUpperCase()}function K(e){const a=String(e||"").toLowerCase();return a.includes("fish")?{cls:"fishing",label:"FISHING RIGHTS"}:a.includes("trade")||a.includes("tariff")?{cls:"trade",label:"TRADE ACCESS"}:a.includes("territor")||a.includes("border")||a.includes("basin")?{cls:"",label:"TERRITORIAL"}:{cls:"",label:(R[e]?.name||a.replace(/_/g," ")||"dispute").toUpperCase()}}function W(e){const a=e.administering_nation_id||e.nation_a_id,s=e.initiative_nation_id||(a===e.nation_a_id?e.nation_b_id:e.nation_a_id),n=i=>i===e.nation_a_id?e.nation_a?.name:i===e.nation_b_id?e.nation_b?.name:null;return{claimantId:a,pressorId:s,claimantName:n(a)||"Unknown",pressorName:n(s)||"Unknown"}}function B(e,a,s){return a&&a===s.claimantId?"claimant":a&&a===s.pressorId?"pressor":"third"}function F(e){return e.contested_region_name||"the contested area"}function G(e,a){const s=[],n=Number(e.stake_quantity),i=String(e.stake_resource||"").trim();i&&Number.isFinite(n)&&n>0&&s.push(`${n} ${i.charAt(0).toUpperCase()}${i.slice(1)}`);const o=Number(e.population_stake_pct);return Number.isFinite(o)&&o>0&&Number.isFinite(a)&&a>0&&s.push(`${Math.round(a*o/100).toLocaleString()} people`),s.join(" · ")}const L=[{n:1,name:"Full Cession",tag:"HARDEST YES",desc:e=>`${e} is transferred outright — sovereignty, territory, and resources.`},{n:2,name:"Administrative Control",tag:"&mdash;",desc:(e,a,s)=>`${a} keeps nominal sovereignty; ${s} administers ${e} — its laws, police, and institutions.`},{n:3,name:"Joint Condominium",tag:"COMPROMISE",desc:e=>`${e} is governed jointly — shared administration and resource revenue, 50/50.`},{n:4,name:"Resource Rights",tag:"FLOOR &middot; EASIEST YES",desc:(e,a,s)=>`${a} keeps full sovereignty and governance; ${s} gets a guaranteed share of ${e}'s output.`}],D=e=>L[Math.min(4,Math.max(1,e.demand_rung||1))-1];function V(e,a){return e.issue_type==="territorial_ownership"?D(e).name:e.stake_resource?`Claim over ${e.stake_quantity!=null?`${e.stake_quantity} `:""}${e.stake_resource} in ${a}`:`Resolution of ${R[e.issue_type]?.name||a}`}function A(e,a){return e.decision_deadline_tick==null||a==null?null:Math.max(0,Number(e.decision_deadline_tick)-Number(a))}function P(e,a){const s=A(e,a);return s==null?'<span class="lab">CLOCK</span> &mdash;':s<=0?'<span class="lab">CLOCK</span> <b class="imminent">WAR IMMINENT</b>':`<span class="lab">CLOCK</span> ${s} tick${s===1?"":"s"} left`}function J(e,a){if(e.decision_deadline_tick==null||e.created_tick==null||a==null)return"";const s=Math.min(12,Math.max(1,Number(e.decision_deadline_tick)-Number(e.created_tick))),n=Math.min(s,Math.max(0,Number(a)-Number(e.created_tick)));let i="";for(let o=0;o<s;o++)i+=`<span class="cd-pip ${o<n?"spent":o===n?"current":""}"></span>`;return`<div class="cd-ticks">${i}</div>`}const O=e=>`<div class="iss-preview">${c(e)}</div>`;async function T(e){if(!e)return[];const s="id, issue_type, nation_a_id, nation_b_id, administering_nation_id, initiative_nation_id, contested_region_name, stake_resource, stake_quantity, demand_rung, created_tick, decision_deadline_tick, "+"nation_a:nations!bilateral_issues_nation_a_id_fkey(id, name), nation_b:nations!bilateral_issues_nation_b_id_fkey(id, name)",n=s+", mediator_nation_id, mediation_offer_nation_id, mediation_accept_a, mediation_accept_b, population_stake_pct";for(const i of[n,s]){const{data:o,error:g}=await e.from("bilateral_issues").select(i).in("status",["active","partial","escalated"]).order("tension",{ascending:!1});if(!g)return o||[];console.warn("[issues-panel] fetch failed, trying narrower columns:",g.message)}return[]}function Z(e,a,s,n,i,o,g,r){const p=K(e.issue_type),d=F(e),f=a==="claimant"?{cls:"role-claimant",txt:"YOU ARE THE CLAIMANT"}:a==="pressor"?{cls:"role-pressor",txt:"YOU ARE THE PRESSOR"}:{cls:"role-third",txt:"THIRD PARTY"},v=A(e,i),x=v!=null&&v<=0?"d-clock war":"d-clock",k=`<div class="d-summary">
      <span class="d-chevron">&#9656;</span>
      <span class="d-type ${p.cls}">${c(p.label)}</span>
      <span class="d-matchup">${c(s.pressorName)} <span class="vs">presses</span> ${c(s.claimantName)} <span class="over">&mdash; over ${c(d)}</span></span>
      <span class="d-role ${f.cls}">${f.txt}</span>
      <span class="${x}">${P(e,i)}</span>
    </div>`;return`<div class="dispute${n?" expanded":""}" data-id="${c(e.id)}">${k}<div class="d-detail">${Q(e,s,a,d,i,o,g,r)}</div></div>`}function H(e,a,s,n,i,o,g){const r=(Array.isArray(e)?e:[]).map(d=>{const f=W(d);return{issue:d,roles:f,role:B(d,a,f)}});if(!r.length)return'<div class="issues-empty">No ongoing issues</div>';const p=r.filter(d=>d.role!=="third").length;return`<div class="issues-sub">${r.length} ONGOING &middot; YOU ARE INVOLVED IN ${p}</div><div class="disputes">${r.map(d=>Z(d.issue,d.role,d.roles,d.issue.id===s,n,i,o,g)).join("")}</div>`}function Q(e,a,s,n,i,o,g,r){const p='<span class="you">YOU</span>',d=s==="claimant"?p:"",f=s==="pressor"?p:"",v=s==="claimant"?"THEY DEMAND":s==="pressor"?"YOU DEMAND":"THE DEMAND",x=A(e,i),k=r&&r.names&&r.names.get(a.claimantId)?.population,b=e.issue_type==="territorial_ownership"?G(e,k):"",N=o&&(s==="claimant"||s==="pressor")&&e.issue_type==="territorial_ownership",y=e.issue_type==="territorial_ownership"?`<div class="dem-region">Cession of <span class="rn">${c(n)}</span>`+(N?` <button type="button" class="region-edit" data-region-edit="${c(e.id)}" data-region="${c(e.contested_region_name||"")}" title="Rename the contested region">&#9998;</button>`:"")+"</div>":"",z=`<div class="combatants">
      <div class="comb a">
        <div class="role">&#9670; CLAIMANT &middot; HOLDS THE GROUND</div>
        <div class="nation"><div class="flag">${c(E(a.claimantName))}</div><div><div class="nm">${c(a.claimantName)} ${d}</div><div class="nsub">Defending ${c(n)}</div></div></div>
      </div>
      <div class="comb-center">
        <div class="dem-lab">${v}</div>
        <div class="dem">${c(V(e,n))}</div>
        ${b?`<div class="dem-stake">What's at Stake: <b>${c(b)}</b></div>`:""}
        ${y}
        ${J(e,i)}
        <div class="clk${x!=null&&x<=0?" war":""}">${P(e,i)}</div>
      </div>
      <div class="comb b">
        <div class="role">PRESSOR &middot; PRESSES THE CLAIM &#9670;</div>
        <div class="nation"><div class="flag">${c(E(a.pressorName))}</div><div><div class="nm">${c(a.pressorName)} ${f}</div><div class="nsub">Demanding ${c(n)}</div></div></div>
      </div>
    </div>`,S=ae(e,a,r),u=ne(e,a,s,o,r),t=s==="claimant"?X(e,o):s==="pressor"?ee(e,n,a,o):te(a,e,r),m=r&&r.nationId,l=e.mediator_nation_id||null,w=s==="claimant"||s==="pressor"||!!(l&&m===l),_=o&&(s==="claimant"||s==="pressor")||l&&r&&(r.governed===l||r.fmNation===l),$=g&&typeof g.get=="function"?g.get(e.id):null,Y=w?ie(e,m,_,$,r&&r.names):"";return z+u+S+t+Y}function X(e,a){if(e.issue_type!=="territorial_ownership")return`<div class="claimant-zone"><div class="cz-actions">
      <div class="lab">CLAIMANT &mdash; YOUR NATION'S OPTIONS</div>
      ${O("Claimant actions for this issue type are not yet active.")}
    </div></div>`;const s=c(e.id);return a?`<div class="claimant-zone">
    <div class="cz-actions">
      <div class="lab">YOUR OPTIONS AS THE CLAIMANT</div>
      <div class="cz-grid">
        <button type="button" class="cza concede" data-action="concede" data-id="${s}"><div class="cn">Concede</div><div class="cd">Accept the demand. The dispute ends in the pressor's favour.</div></button>
        <button type="button" class="cza stand"><div class="cn">Stand Strong</div><div class="cd">Hold the ground and let the clock run. (No action needed.)</div></button>
        <div class="cza compromise iss-inert"><div class="cn">Offer Compromise</div><div class="cd">Table a counter-offer. Not yet active.</div></div>
        <div class="cza mediate iss-inert"><div class="cn">Request Mediation</div><div class="cd">Bring in a broker. Not yet active.</div></div>
      </div>
      <div class="iss-error" hidden></div>
    </div>
  </div>`:`<div class="claimant-zone"><div class="cz-actions">
      <div class="lab">CLAIMANT &mdash; YOUR NATION'S OPTIONS</div>
      <div class="cz-grid iss-inert">
        <div class="cza concede"><div class="cn">Concede</div><div class="cd">Accept the demand. The dispute ends in the pressor's favour.</div></div>
        <div class="cza stand"><div class="cn">Stand Strong</div><div class="cd">Hold the ground and let the clock run.</div></div>
        <div class="cza compromise"><div class="cn">Offer Compromise</div><div class="cd">Table a counter-offer. Not yet active.</div></div>
        <div class="cza mediate"><div class="cn">Request Mediation</div><div class="cd">Bring in a broker. Not yet active.</div></div>
      </div>
      <div class="iss-note">Only the head of government can decide this dispute.</div>
    </div></div>`}function ee(e,a,s,n){if(e.issue_type!=="territorial_ownership")return`<div class="pressor-zone"><div class="pz-ladder">
      <div class="lab">YOUR MOVES</div>
      ${O("Pressor actions for this issue type are not yet active.")}
    </div></div>`;const i=D(e).n,o=c(a),g=c(s.claimantName),r=c(s.pressorName),p=L.map(v=>{const x=v.n<i?"rung past":v.n===i?"rung current":"rung",k=v.n===4?" floor":"",b=v.n<i?"WITHDRAWN":v.n===i?"CURRENT":v.tag;return`<div class="${x}${k}"><span class="dot"></span><span class="rname">${c(v.name)}</span><span class="rdesc">${v.desc(o,g,r)}</span><span class="rtag">${b}</span></div>`}).join(""),d=c(e.id);if(!n)return`<div class="pressor-zone"><div class="pz-ladder">
      <div class="lab">CURRENT DEMAND</div>
      <div class="ladder-rungs">${p}</div>
      <div class="iss-note">Only the head of government can act on this dispute.</div>
    </div></div>`;const f=i<4?`<button type="button" class="iss-btn soften" data-action="soften" data-id="${d}">&#9662; Soften one rung &mdash; smaller prize, easier yes (cannot be undone)</button>`:'<div class="iss-note">At the floor. The only moves left are to go to war or back down.</div>';return`<div class="pressor-zone">
    <div class="pz-ladder">
      <div class="lab">YOUR DEMAND &mdash; SOFTEN TO MAKE A "YES" EASIER</div>
      <div class="ladder-rungs">${p}</div>
      ${f}
    </div>
    <div class="pz-levers">
      <div class="lab">YOUR MOVE &mdash; WORK THE CLOCK</div>
      <div class="lever-grid">
        <button type="button" class="iss-lever" data-action="press_harder" data-id="${d}"><div class="ln">Press Harder</div><div class="ld">Burn one tick off the clock &mdash; tighten the screw.</div></button>
        <button type="button" class="iss-lever" data-action="extend" data-id="${d}"><div class="ln">Extend Deadline <span class="cost">&minus;8 Appr</span></div><div class="ld">Add 2 ticks. Your public tires of the delay.</div></button>
      </div>
    </div>
    <div class="pz-doors">
      <div class="lab">AT THE DEADLINE, YOU MUST CHOOSE</div>
      <div class="doors">
        <button type="button" class="door war" data-action="go_to_war" data-id="${d}"><div class="dn">&#9876; Go to War</div><div class="dc">Escalate to the front &mdash; a state of war begins immediately.</div></button>
        <button type="button" class="door back" data-action="drop" data-id="${d}"><div class="dn">Back Down</div><div class="dc">Drop the claim &mdash; &minus;25 approval, +10 unrest, 360-tick re-press cooldown.</div></button>
      </div>
    </div>
    <div class="iss-error" hidden></div>
  </div>`}function se(e,a,s){if(s)return"Mediating";switch(e){case"support_claimant":return`Supporting ${c(a.claimantName)}`;case"support_pressor":return`Supporting ${c(a.pressorName)}`;case"condemn_claimant":return`Condemning ${c(a.claimantName)}`;case"condemn_pressor":return`Condemning ${c(a.pressorName)}`;case"mediate":return"Offered to mediate";default:return"Neutral &middot; no position"}}function ae(e,a,s){const n=s&&s.names,i=s&&s.stances&&typeof s.stances.get=="function"&&s.stances.get(e.id)||[],o=new Map(i.map(p=>[p.nation_id,p.stance])),g=new Set([e.nation_a_id,e.nation_b_id]);let r="";if(n&&n.size)for(const[p,d]of n){if(g.has(p))continue;const f=d&&d.name||"",v=o.get(p)||"neutral",x=e.mediator_nation_id===p,k=p===(s&&s.nationId)?` <span class="on-you">&middot; that's you</span>`:"";r+=`<div class="on-row"><div class="on-flag">${c(E(f))}</div><div class="on-name">${c(f)}</div><div class="on-stance ${x?"mediate":v}">${se(v,a,x)}${k}</div></div>`}return'<div class="others"><div class="lab">OTHER NATIONS</div>'+(r?`<div class="on-list">${r}</div>`:O("No other nations on the continent."))+"</div>"}function ne(e,a,s,n,i){const o=e.mediation_offer_nation_id;if(!o||!n||s!=="claimant"&&s!=="pressor")return"";const r=(s==="claimant"?a.claimantId:a.pressorId)===e.nation_a_id?e.mediation_accept_a:e.mediation_accept_b,p=c(i&&i.names&&i.names.get(o)?.name||"A nation"),d=c(e.id);return r?`<div class="med-box pending"><div class="med-t">You accepted <b>${p}</b> as mediator &mdash; awaiting the other side.</div></div>`:`<div class="med-box">
      <div class="med-t"><b>${p}</b> has offered to mediate this dispute. If both sides accept, the clock gains 6 ticks and ${p} joins the channel.</div>
      <div class="med-acts">
        <button type="button" class="med-btn accept" data-mediate="accept" data-id="${d}">Accept mediator</button>
        <button type="button" class="med-btn reject" data-mediate="reject" data-id="${d}">Reject</button>
      </div>
    </div>`}function te(e,a,s){const n=c(e.claimantName),i=c(e.pressorName),o=c(a.id),g=!!(s&&s.fmNation&&s.fmNation===s.nationId),r=(s&&s.stances&&typeof s.stances.get=="function"&&s.stances.get(a.id)||[]).find(x=>x.nation_id===(s&&s.nationId))?.stance||"neutral",p=c(s&&s.names&&s.names.get(s.nationId)?.name||""),d=(x,k,b,N)=>g?`<button type="button" class="tpa ${k}${r===x?" sel":""}" data-stance="${x}" data-id="${o}" data-pressor-name="${i}" data-claimant-name="${n}" data-my-name="${p}"><div class="tn">${b}</div><div class="td">${N}</div></button>`:`<div class="tpa ${k}"><div class="tn">${b}</div><div class="td">${N}</div></div>`;return`<div class="tp-actions"><div class="lab">YOUR OPTIONS AS A THIRD PARTY</div>${`<div class="tpa-grid${g?"":" iss-inert"}">`+d("support_claimant","support-a",`Support ${n}`,"Lend strength &amp; legitimacy to the Claimant.")+d("support_pressor","support-b",`Support ${i}`,"Back the Pressor's claim.")+d("condemn_claimant","condemn-a",`Condemn ${n}`,"Censure the Claimant's intransigence.")+d("condemn_pressor","condemn-b",`Condemn ${i}`,"Censure the Pressor as an aggressor.")+d("mediate","mediate","Offer to Mediate","Volunteer as broker.")+"</div>"}${g?'<div class="tp-note">Changing your stance costs diplomatic standing with the affected nation. Mediation takes effect once both sides accept.</div>':`<div class="tp-note">Your nation's Foreign Minister sets its stance here. Only one mediator per issue.</div>`}</div>`}function ie(e,a,s,n,i){const o=Array.isArray(n)?n:[],g=f=>i&&i.get(f)?.name||"Unknown",r=o.length?o.map(f=>`<div class="msg ${f.sender_nation_id===a?"me":"them"}"><div class="who">${c(g(f.sender_nation_id))}</div><div class="bubble">${c(f.body)}</div><div class="ts">TICK ${Number(f.sent_at_tick)||0}</div></div>`).join(""):'<div class="ch-empty">No messages yet.</div>',p=c(e.id),d=s?`<div class="ch-input"><input type="text" data-chat-input="${p}" maxlength="1000" placeholder="Message the channel…"><button type="button" class="ch-send" data-chat-send="${p}">Send</button></div>`:'<div class="ch-note">Only the belligerent heads of government and the accepted mediator can post here.</div>';return`<div class="channel">
    <div class="ch-head"><span class="t">HEAD-OF-STATE CHANNEL</span><span class="secure">&#128274; PRIVATE</span></div>
    <div class="ch-body">${r}</div>
    ${d}
  </div>`}function U(){if(document.getElementById("issues-panel-styles"))return;const e=document.createElement("style");e.id="issues-panel-styles",e.textContent=`
    .issues-panel__head{font-family:var(--font-mono,monospace);font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-bright,#f0efe6);margin-bottom:12px;}
    .issues-panel .issues-sub{font-size:10px;letter-spacing:0.08em;color:#666;margin-bottom:12px;}
    .issues-panel .issues-empty{padding:30px 22px;text-align:center;font-size:12px;color:rgba(255,255,255,0.34);}
    .issues-panel .iss-preview{font-size:9px;letter-spacing:0.06em;color:#7a6a4a;background:#161208;border:0.5px solid rgba(200,158,110,0.25);padding:6px 10px;border-radius:3px;font-style:italic;}
    .issues-panel .iss-inert{pointer-events:none;opacity:0.55;margin-top:9px;}

    .issues-panel .disputes{display:flex;flex-direction:column;gap:10px;}
    .issues-panel .dispute{background:#0d0d0d;border:0.5px solid rgba(255,255,255,0.08);border-radius:6px;overflow:hidden;}
    .issues-panel .dispute.expanded{border-color:rgba(122,154,171,0.3);}
    .issues-panel .d-summary{display:flex;align-items:center;gap:16px;padding:15px 18px;cursor:pointer;transition:background 0.15s;}
    .issues-panel .d-summary:hover{background:#111;}
    .issues-panel .d-chevron{color:#666;font-size:11px;transition:transform 0.15s;flex-shrink:0;width:12px;}
    .issues-panel .dispute.expanded .d-chevron{transform:rotate(90deg);color:#7a9aab;}
    .issues-panel .d-type{font-size:8px;letter-spacing:0.13em;padding:3px 8px;border-radius:3px;background:#1a1414;color:#c87a7a;flex-shrink:0;}
    .issues-panel .d-type.fishing{background:#11181f;color:#7a9aab;}
    .issues-panel .d-type.trade{background:#1a160d;color:#c89e6e;}
    .issues-panel .d-matchup{flex:1;font-size:13px;color:#fff;font-weight:500;}
    .issues-panel .d-matchup .vs{color:#666;font-weight:400;margin:0 6px;font-style:italic;}
    .issues-panel .d-matchup .over{color:#888;font-weight:400;font-size:12px;}
    .issues-panel .d-role{font-size:9px;letter-spacing:0.1em;padding:3px 9px;border-radius:3px;flex-shrink:0;}
    .issues-panel .role-claimant{background:#11181f;color:#7a9aab;}
    .issues-panel .role-pressor{background:#1a1414;color:#c87a7a;}
    .issues-panel .role-third{background:#161616;color:#888;}
    .issues-panel .d-clock{font-size:10px;color:#888;letter-spacing:0.05em;flex-shrink:0;font-variant-numeric:tabular-nums;}
    .issues-panel .d-clock .lab{color:#666;}

    .issues-panel .d-detail{border-top:0.5px solid rgba(255,255,255,0.06);display:none;}
    .issues-panel .dispute.expanded .d-detail{display:block;}

    .issues-panel .combatants{display:grid;grid-template-columns:1fr auto 1fr;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .comb{padding:18px;}
    .issues-panel .comb.a{background:#0d0f12;} .issues-panel .comb.b{background:#120d0d;text-align:right;}
    .issues-panel .comb .role{font-size:8px;letter-spacing:0.13em;margin-bottom:11px;}
    .issues-panel .comb.a .role{color:#7a9aab;} .issues-panel .comb.b .role{color:#c87a7a;}
    .issues-panel .comb .nation{display:flex;align-items:center;gap:11px;}
    .issues-panel .comb.b .nation{flex-direction:row-reverse;}
    .issues-panel .comb .flag{width:36px;height:36px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;}
    .issues-panel .comb.a .flag{background:#15202a;border:0.5px solid #3a5a6a;color:#7a9aab;}
    .issues-panel .comb.b .flag{background:#2a1515;border:0.5px solid #6a3a3a;color:#c87a7a;}
    .issues-panel .comb .nm{font-size:16px;color:#fff;font-weight:500;}
    .issues-panel .comb .nm .you{font-size:8px;letter-spacing:0.13em;color:#7a9aab;border:0.5px solid rgba(122,154,171,0.4);padding:2px 6px;border-radius:2px;margin-left:6px;}
    .issues-panel .comb.b .nm .you{color:#c87a7a;border-color:rgba(200,122,122,0.4);}
    .issues-panel .comb .nsub{font-size:9px;color:#777;letter-spacing:0.04em;margin-top:2px;}
    .issues-panel .comb-center{background:#0a0a0a;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-left:0.5px solid rgba(255,255,255,0.05);border-right:0.5px solid rgba(255,255,255,0.05);min-width:170px;}
    .issues-panel .comb-center .dem-lab{font-size:8px;letter-spacing:0.13em;color:#666;margin-bottom:5px;}
    .issues-panel .comb-center .dem{font-size:11px;color:#fff;font-weight:500;text-align:center;line-height:1.4;margin-bottom:11px;}
    .issues-panel .comb-center .clk{font-size:10px;color:#888;text-align:center;}
    .issues-panel .comb-center .dem-stake{font-size:10px;color:#c89e6e;margin-bottom:5px;text-align:center;}
    .issues-panel .comb-center .dem-stake b{color:#e0b888;font-weight:600;}
    .issues-panel .comb-center .dem-region{font-size:10px;color:#888;margin-bottom:9px;text-align:center;line-height:1.5;}
    .issues-panel .comb-center .dem-region .rn{color:#cdd6dc;}
    .issues-panel .region-edit{background:none;border:none;color:#7a9aab;cursor:pointer;font-size:11px;padding:0 2px;font-family:inherit;vertical-align:baseline;}
    .issues-panel .region-edit:hover{color:#9ab4c4;}
    .issues-panel .comb-center .clk .lab{color:#666;display:block;font-size:8px;letter-spacing:0.1em;margin-bottom:2px;}

    .issues-panel .others{padding:14px 18px;background:#0c0c0c;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .others .lab{font-size:9px;letter-spacing:0.13em;color:#888;margin-bottom:11px;}
    .issues-panel .on-list{display:flex;flex-direction:column;gap:7px;}
    .issues-panel .on-row{display:flex;align-items:center;gap:11px;}
    .issues-panel .on-flag{width:26px;height:26px;border-radius:3px;background:#15171a;border:0.5px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#9a9a92;flex-shrink:0;}
    .issues-panel .on-name{font-size:12px;color:#cdd6dc;min-width:90px;}
    .issues-panel .on-stance{font-size:11px;color:#888;}
    .issues-panel .on-stance.support_claimant{color:#7a9aab;} .issues-panel .on-stance.support_pressor{color:#c87a7a;}
    .issues-panel .on-stance.condemn_claimant,.issues-panel .on-stance.condemn_pressor{color:#d49a9a;}
    .issues-panel .on-stance.mediate{color:#c89e6e;}
    .issues-panel .on-stance.neutral{color:#666;}
    .issues-panel .on-you{color:#7a9aab;font-style:italic;}
    .issues-panel .med-box{margin:0 18px 14px;padding:12px 14px;border-radius:5px;background:#1a160d;border:0.5px solid rgba(200,158,110,0.4);}
    .issues-panel .med-box.pending{background:#12120c;border-color:rgba(200,158,110,0.25);}
    .issues-panel .med-box .med-t{font-size:11px;color:#d4b87a;line-height:1.5;}
    .issues-panel .med-box .med-acts{display:flex;gap:8px;margin-top:10px;}
    .issues-panel .med-btn{font-family:inherit;cursor:pointer;font-size:11px;letter-spacing:0.05em;padding:8px 14px;border-radius:4px;border:0.5px solid;}
    .issues-panel .med-btn.accept{background:#0e1610;border-color:rgba(138,170,106,0.5);color:#8aaa6a;}
    .issues-panel .med-btn.reject{background:#160e0e;border-color:rgba(200,122,122,0.45);color:#c87a7a;}
    .issues-panel .med-btn.is-busy{opacity:0.5;}
    .issues-panel button.tpa{font-family:inherit;cursor:pointer;}
    .issues-panel .tpa.sel{box-shadow:0 0 0 1px rgba(212,184,122,0.5) inset;}
    .issues-panel .tpa.is-busy{opacity:0.5;}

    .issues-panel .cz-actions,.issues-panel .pz-ladder{padding:14px 18px;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .cz-actions .lab,.issues-panel .pz-ladder .lab{font-size:9px;letter-spacing:0.13em;margin-bottom:10px;}
    .issues-panel .cz-actions .lab{color:#7a9aab;} .issues-panel .pz-ladder .lab{color:#c87a7a;}
    .issues-panel .cz-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
    .issues-panel .cza{padding:12px 11px;border-radius:4px;text-align:center;border:0.5px solid;}
    .issues-panel .cza .cn{font-size:12px;font-weight:500;margin-bottom:3px;line-height:1.2;}
    .issues-panel .cza .cd{font-size:8px;color:#777;line-height:1.35;}
    .issues-panel .cza.concede{background:#160e0e;border-color:rgba(200,122,122,0.3);} .issues-panel .cza.concede .cn{color:#c87a7a;}
    .issues-panel .cza.compromise{background:#1a160d;border-color:rgba(200,158,110,0.3);} .issues-panel .cza.compromise .cn{color:#c89e6e;}
    .issues-panel .cza.mediate{background:#11181f;border-color:rgba(122,154,171,0.3);} .issues-panel .cza.mediate .cn{color:#7a9aab;}
    .issues-panel .cza.stand{background:#0e1610;border-color:rgba(138,170,106,0.35);} .issues-panel .cza.stand .cn{color:#8aaa6a;}

    .issues-panel .tp-actions{padding:14px 18px;}
    .issues-panel .tp-actions .lab{font-size:9px;letter-spacing:0.13em;color:#888;margin-bottom:10px;}
    .issues-panel .tpa-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
    .issues-panel .tpa{padding:11px 10px;border-radius:4px;text-align:center;border:0.5px solid;}
    .issues-panel .tpa .tn{font-size:11px;font-weight:500;margin-bottom:3px;line-height:1.2;}
    .issues-panel .tpa .td{font-size:8px;color:#777;line-height:1.35;}
    .issues-panel .tpa.support-a{background:#0e131a;border-color:rgba(122,154,171,0.3);} .issues-panel .tpa.support-a .tn{color:#7a9aab;}
    .issues-panel .tpa.support-b{background:#160e0e;border-color:rgba(200,122,122,0.3);} .issues-panel .tpa.support-b .tn{color:#c87a7a;}
    .issues-panel .tpa.condemn-a{background:#0e131a;border-color:rgba(122,154,171,0.2);} .issues-panel .tpa.condemn-a .tn{color:#9ab4c4;}
    .issues-panel .tpa.condemn-b{background:#160e0e;border-color:rgba(200,122,122,0.2);} .issues-panel .tpa.condemn-b .tn{color:#d49a9a;}
    .issues-panel .tpa.mediate{background:#1a160d;border-color:rgba(200,158,110,0.35);} .issues-panel .tpa.mediate .tn{color:#c89e6e;}
    .issues-panel .tp-note{margin-top:10px;font-size:9px;color:#666;letter-spacing:0.04em;line-height:1.5;font-style:italic;}

    .issues-panel .ladder-rungs{display:flex;flex-direction:column;gap:5px;}
    .issues-panel .rung{display:flex;align-items:center;gap:11px;padding:8px 11px;border-radius:4px;border:0.5px solid rgba(255,255,255,0.06);background:#0e0e0e;}
    .issues-panel .rung.current{background:#160e0e;border-color:rgba(200,122,122,0.4);}
    .issues-panel .rung.floor{opacity:0.7;}
    .issues-panel .rung .dot{width:10px;height:10px;border-radius:50%;border:1.5px solid #4a3a3a;flex-shrink:0;}
    .issues-panel .rung.current .dot{background:#c87a7a;border-color:#c87a7a;}
    .issues-panel .rung .rname{font-size:12px;font-weight:500;color:#ccc;flex:1;}
    .issues-panel .rung.current .rname{color:#fff;}
    .issues-panel .rung .rdesc{font-size:9px;color:#777;letter-spacing:0.02em;}
    .issues-panel .rung .rtag{font-size:8px;letter-spacing:0.1em;color:#888;}
    .issues-panel .rung.current .rtag{color:#c87a7a;}
    .issues-panel .rung.past{opacity:0.4;}
    .issues-panel .rung.past .rname{text-decoration:line-through;}
    .issues-panel .rung.past .dot{background:#333;border-color:#333;}
    .issues-panel .iss-btn{display:block;width:100%;margin-top:9px;padding:9px 11px;border-radius:4px;text-align:center;font-size:10px;letter-spacing:0.05em;font-family:inherit;cursor:pointer;border:0.5px solid;}
    .issues-panel .iss-btn.soften{background:#160e0e;border-color:rgba(200,122,122,0.35);color:#c87a7a;}
    .issues-panel .iss-btn.soften:hover{background:#1a1111;}
    .issues-panel .iss-btn:disabled,.issues-panel .iss-btn.is-busy{opacity:0.5;cursor:default;}
    .issues-panel .iss-note{margin-top:9px;font-size:9px;color:#888;letter-spacing:0.04em;font-style:italic;text-align:center;}
    .issues-panel .iss-error{margin:9px 18px 0;font-size:10px;color:#cf6b66;background:rgba(207,107,102,0.1);border:0.5px solid rgba(207,107,102,0.3);padding:7px 10px;border-radius:3px;}

    .issues-panel .d-clock.war b.imminent,.issues-panel .clk.war b.imminent{color:#e08080;font-weight:600;}
    .issues-panel .comb-center .cd-ticks{display:flex;gap:4px;margin:2px 0 8px;}
    .issues-panel .cd-pip{width:12px;height:12px;border-radius:2px;background:#1a1010;border:0.5px solid rgba(200,122,122,0.25);}
    .issues-panel .cd-pip.spent{background:#2a1212;border-color:#6a3030;}
    .issues-panel .cd-pip.current{background:#3a1818;border-color:#c87a7a;}
    .issues-panel .clk.war{color:#e08080;}

    .issues-panel .cz-grid button.cza{font-family:inherit;cursor:pointer;}
    .issues-panel .cza.stand{background:#0e1610;border-color:rgba(138,170,106,0.35);} .issues-panel .cza.stand .cn{color:#8aaa6a;}

    .issues-panel .pz-levers,.issues-panel .pz-doors{padding:12px 18px;border-bottom:0.5px solid rgba(255,255,255,0.05);}
    .issues-panel .pz-levers .lab{font-size:9px;letter-spacing:0.13em;color:#c87a7a;margin-bottom:9px;}
    .issues-panel .pz-doors .lab{font-size:9px;letter-spacing:0.13em;color:#888;margin-bottom:9px;}
    .issues-panel .lever-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .issues-panel .iss-lever{font-family:inherit;cursor:pointer;text-align:left;background:#120d0d;border:0.5px solid rgba(200,122,122,0.25);border-radius:5px;padding:11px 13px;}
    .issues-panel .iss-lever:hover{background:#1a1012;border-color:rgba(200,122,122,0.45);}
    .issues-panel .iss-lever .ln{font-size:12px;color:#fff;font-weight:500;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center;}
    .issues-panel .iss-lever .ln .cost{font-size:9px;color:#c89e6e;letter-spacing:0.04em;}
    .issues-panel .iss-lever .ld{font-size:9px;color:#999;line-height:1.4;}
    .issues-panel .doors{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .issues-panel .door{font-family:inherit;cursor:pointer;text-align:center;border-radius:4px;padding:12px 11px;border:0.5px solid;}
    .issues-panel .door.war{background:#1f0e0e;border-color:rgba(200,90,90,0.5);} .issues-panel .door.war:hover{background:#2a1212;}
    .issues-panel .door.back{background:#161616;border-color:rgba(255,255,255,0.15);} .issues-panel .door.back:hover{background:#1c1c1c;}
    .issues-panel .door .dn{font-size:12px;font-weight:600;margin-bottom:3px;} .issues-panel .door.war .dn{color:#e08080;} .issues-panel .door.back .dn{color:#aaa;}
    .issues-panel .door .dc{font-size:8px;line-height:1.4;} .issues-panel .door.war .dc{color:#a86a6a;} .issues-panel .door.back .dc{color:#777;}
    .issues-panel .iss-lever:disabled,.issues-panel .door:disabled,.issues-panel button.cza:disabled,.issues-panel .is-busy{opacity:0.5;cursor:default;}

    .issues-panel .channel .ch-head{padding:11px 18px;background:#0a0a0a;border-bottom:0.5px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;}
    .issues-panel .channel .ch-head .t{font-size:10px;letter-spacing:0.13em;color:#888;}
    .issues-panel .channel .ch-head .secure{font-size:8px;color:#6a8a5a;letter-spacing:0.1em;}
    .issues-panel .channel .ch-body{padding:14px 18px;display:flex;flex-direction:column;gap:10px;max-height:300px;overflow-y:auto;}
    .issues-panel .ch-empty{font-size:10px;color:#666;font-style:italic;text-align:center;padding:8px;}
    .issues-panel .msg{display:flex;flex-direction:column;max-width:78%;}
    .issues-panel .msg.them{align-self:flex-start;} .issues-panel .msg.me{align-self:flex-end;align-items:flex-end;}
    .issues-panel .msg .who{font-size:9px;letter-spacing:0.07em;margin-bottom:3px;color:#888;}
    .issues-panel .msg .bubble{padding:8px 11px;border-radius:8px;font-size:12px;line-height:1.5;overflow-wrap:anywhere;white-space:pre-wrap;}
    .issues-panel .msg.them .bubble{background:#13191f;color:#cdd6dc;border-bottom-left-radius:2px;}
    .issues-panel .msg.me .bubble{background:#1f1414;color:#e4cccc;border-bottom-right-radius:2px;}
    .issues-panel .msg .ts{font-size:8px;color:#555;margin-top:3px;letter-spacing:0.06em;}
    .issues-panel .ch-input{display:flex;gap:8px;padding:12px 18px;border-top:0.5px solid rgba(255,255,255,0.06);}
    .issues-panel .ch-input input{flex:1;background:#161616;border:0.5px solid rgba(255,255,255,0.12);color:#d4d4d4;padding:9px 12px;border-radius:4px;font-size:12px;font-family:inherit;}
    .issues-panel .ch-input input::placeholder{color:#555;font-style:italic;}
    .issues-panel .ch-input input:disabled{opacity:0.5;}
    .issues-panel .ch-send{background:#1f1414;border:0.5px solid rgba(200,122,122,0.4);color:#c87a7a;padding:9px 16px;border-radius:4px;font-size:11px;letter-spacing:0.08em;cursor:pointer;font-family:inherit;}
    .issues-panel .ch-send:hover{background:#2a1818;}
    .issues-panel .ch-note{padding:11px 18px;border-top:0.5px solid rgba(255,255,255,0.06);font-size:9px;color:#777;font-style:italic;letter-spacing:0.04em;}
  `,document.head.appendChild(e)}function oe(e,a,s,n={}){if(!e)return;U();const i=n.heading===void 0?"I. Issues":n.heading;e.innerHTML=`<section class="issues-panel">
      ${i?`<div class="issues-panel__head">${c(i)}</div>`:""}
      <div class="issues-content">${H(a,s,n.expandedId||null,n.currentTick??null,!!n.canManage,n.messages||null,n.stanceCtx||null)}</div>
    </section>`;const o=e.querySelector(".issues-panel");o&&!o.dataset.expandWired&&(o.dataset.expandWired="1",o.addEventListener("click",g=>{if(g.target.closest("[data-action]"))return;const r=g.target.closest(".d-summary");if(!r||!o.contains(r))return;const p=r.parentElement,d=p.classList.contains("expanded");o.querySelectorAll(".dispute.expanded").forEach(f=>f.classList.remove("expanded")),d||p.classList.add("expanded")}))}const re={soften:"soften_demand",drop:"drop_claim",press_harder:"press_harder",extend:"extend_deadline",go_to_war:"go_to_war",concede:"concede_claim"},de={soften:"Soften your demand one rung? This cannot be undone.",drop:"Back down — drop the claim entirely? You take −25 approval, +10 unrest, and cannot re-press this nation for 360 ticks.",press_harder:"Press harder? This burns one tick off the decision clock.",extend:"Extend the deadline by 2 ticks? This costs you 8 approval.",go_to_war:"Go to war? This is final — a state of war begins immediately.",concede:"Concede the claim? You accept the demand and the dispute resolves in the pressor’s favour."};async function C(e){try{const{data:a}=await e.from("shard").select("current_tick").eq("name","Alpha Shard").maybeSingle();return a?Number(a.current_tick)||0:null}catch{return null}}async function ce(e){try{const{data:a,error:s}=await e.rpc("dispute_actor_nation");return s?null:a||null}catch{return null}}async function M(e,a){const s=new Map;if(!a||!a.length)return s;try{const{data:n,error:i}=await e.from("bilateral_issue_stances").select("issue_id, nation_id, stance").in("issue_id",a);if(i)return console.warn("[issues-panel] stances fetch failed:",i.message),s;for(const o of n||[])s.has(o.issue_id)||s.set(o.issue_id,[]),s.get(o.issue_id).push(o)}catch(n){console.warn("[issues-panel] stances fetch failed:",n?.message||n)}return s}async function le(e){const a=new Map;try{const{data:s,error:n}=await e.from("nations").select("id, name, population");if(n)return console.warn("[issues-panel] nations fetch failed:",n.message),a;for(const i of s||[])a.set(i.id,{name:i.name,population:Number(i.population)||0})}catch(s){console.warn("[issues-panel] nations fetch failed:",s?.message||s)}return a}async function pe(e){try{const{data:a,error:s}=await e.rpc("foreign_ministry_nation");return s?null:a||null}catch{return null}}async function I(e,a){const s=new Map;if(!a||!a.length)return s;try{const{data:n,error:i}=await e.from("bilateral_issue_messages").select("issue_id, sender_nation_id, body, sent_at_tick").in("issue_id",a).order("created_at",{ascending:!0});if(i)return console.warn("[issues-panel] messages fetch failed:",i.message),s;for(const o of n||[])s.has(o.issue_id)||s.set(o.issue_id,[]),s.get(o.issue_id).push(o)}catch(n){console.warn("[issues-panel] messages fetch failed:",n?.message||n)}return s}async function fe(e,a,s,n={}){if(!s)return;U();const i=n.heading===void 0?"I. Issues":n.heading;s.innerHTML=`<section class="issues-panel">
      ${i?`<div class="issues-panel__head">${c(i)}</div>`:""}
      <div class="issues-content"><div class="issues-empty">Loading…</div></div>
    </section>`;let o=[],g=null,r=null,p=new Map,d=new Map,f=new Map,v=null;try{[o,g,r,f,v]=await Promise.all([T(e),C(e),ce(e),le(e),pe(e)]);const u=(o||[]).map(t=>t.id);[p,d]=await Promise.all([I(e,u),M(e,u)])}catch(u){console.warn("[issues-panel] mount failed:",u?.message||u)}const x=!!r&&r===a;oe(s,o,a,{...n,currentTick:g,canManage:x,messages:p,stanceCtx:{stances:d,names:f,fmNation:v,nationId:a,governed:r}});const b=s.querySelector(".issues-panel"),N=s.querySelector(".issues-content");if(!b||!N||b.dataset.actionWired)return;b.dataset.actionWired="1";let y=!1;async function z(){const u=b.querySelector(".dispute.expanded")?.dataset.id||null;let t=[],m=g,l=new Map,h=new Map;try{[t,m]=await Promise.all([T(e),C(e)]);const w=t.map(_=>_.id);[l,h]=await Promise.all([I(e,w),M(e,w)])}catch{}N.innerHTML=H(t,a,u,m,x,l,{stances:h,names:f,fmNation:v,nationId:a,governed:r})}b.addEventListener("click",async u=>{const t=u.target.closest("[data-action]");if(!t||!b.contains(t)||(u.stopPropagation(),y))return;const m=re[t.dataset.action];if(!m||typeof window<"u"&&typeof window.confirm=="function"&&!window.confirm(de[t.dataset.action]))return;const l=t.closest(".pressor-zone, .claimant-zone"),h=l?.querySelector(".iss-error"),w=_=>{h&&(h.textContent=_,h.hidden=!1),l?.querySelectorAll("[data-action]").forEach($=>{$.disabled=!1}),t.classList.remove("is-busy")};y=!0,l?.querySelectorAll("[data-action]").forEach(_=>{_.disabled=!0}),t.classList.add("is-busy"),h&&(h.hidden=!0,h.textContent="");try{const{data:_,error:$}=await e.rpc(m,{p_issue_id:t.dataset.id});$||_&&_.ok===!1?w(_&&_.message||$?.message||"Action failed."):await z()}catch(_){w(_?.message||"Action failed.")}finally{y=!1}});async function S(u,t){if(y)return;const m=t?t.value.trim():"";if(m){y=!0,t&&(t.disabled=!0);try{const{data:l,error:h}=await e.rpc("send_issue_message",{p_issue_id:u,p_body:m});!h&&!(l&&l.ok===!1)?await z():(t&&(t.disabled=!1),console.warn("[issues-panel] send failed:",l&&l.message||h?.message))}catch(l){t&&(t.disabled=!1),console.warn("[issues-panel] send failed:",l?.message||l)}finally{y=!1}}}b.addEventListener("click",u=>{const t=u.target.closest("[data-chat-send]");!t||!b.contains(t)||(u.stopPropagation(),S(t.dataset.chatSend,b.querySelector(`[data-chat-input="${t.dataset.chatSend}"]`)))}),b.addEventListener("keydown",u=>{const t=u.target.closest("[data-chat-input]");!t||u.key!=="Enter"||(u.preventDefault(),S(t.dataset.chatInput,t))}),b.addEventListener("click",async u=>{const t=u.target.closest("[data-mediate]");if(!(!t||!b.contains(t))&&(u.stopPropagation(),!y)){y=!0,t.classList.add("is-busy");try{const{data:m,error:l}=await e.rpc("respond_mediation",{p_issue_id:t.dataset.id,p_accept:t.dataset.mediate==="accept"});!l&&!(m&&m.ok===!1)?await z():(t.classList.remove("is-busy"),console.warn("[issues-panel] mediation failed:",m&&m.message||l?.message))}catch(m){t.classList.remove("is-busy"),console.warn("[issues-panel] mediation failed:",m?.message||m)}finally{y=!1}}}),b.addEventListener("click",async u=>{const t=u.target.closest("[data-stance]");if(!(!t||!b.contains(t))&&(u.stopPropagation(),!y)){y=!0,t.classList.add("is-busy");try{const{data:m,error:l}=await e.rpc("set_issue_stance",{p_issue_id:t.dataset.id,p_stance:t.dataset.stance});if(!l&&!(m&&m.ok===!1)){const h=j[t.dataset.stance];if(h){const w=t.dataset.myName||"A nation",_=t.dataset.pressorName||"the Pressor",$=t.dataset.claimantName||"the Claimant";await q(e,{eventName:h.eventName,triggerKey:h.triggerKey,description:h.line(w,_,$),category:"diplomacy"})}await z()}else t.classList.remove("is-busy"),console.warn("[issues-panel] stance failed:",m&&m.message||l?.message)}catch(m){t.classList.remove("is-busy"),console.warn("[issues-panel] stance failed:",m?.message||m)}finally{y=!1}}}),b.addEventListener("click",async u=>{const t=u.target.closest("[data-region-edit]");if(!t||!b.contains(t)||(u.stopPropagation(),y||typeof window>"u"||typeof window.prompt!="function"))return;const m=window.prompt("Name the contested region:",t.dataset.region||"");if(m!==null){y=!0;try{const{data:l,error:h}=await e.rpc("set_dispute_region",{p_issue_id:t.dataset.regionEdit,p_region:m.trim()});!h&&!(l&&l.ok===!1)?await z():console.warn("[issues-panel] region edit failed:",l&&l.message||h?.message)}catch(l){console.warn("[issues-panel] region edit failed:",l?.message||l)}finally{y=!1}}})}export{fe as m};
