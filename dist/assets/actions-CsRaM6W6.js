import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{r as lt}from"./role-actions-GCBcK_AR.js";import{e as p,h}from"./utils-oN1e812_.js";import{renderCorpTopBar as Ve}from"./corp-topbar-Dar6x8XP.js";import{c as ct}from"./corp-valuation-DGlSNvB8.js";import{E as be,a as he,g as Ke}from"./corp-executives-Bf1Oci80.js";import{a as We,G as Me,R as dt}from"./lawsuit-types-mDq47olK.js";import"./preload-helper-BXl3LOEh.js";import"./factions-qe2qC_cj.js";import"./political-actions-BCfwIhEF.js";import"./config-BdOpHGNJ.js";import"./government-types-CNjNcIHN.js";import"./stats-Nd7eW9dF.js";function me(e){if(e==null)return"";const t=document.createElement("div");return t.textContent=String(e),t.innerHTML}function pt(e,t){return(e||"?")[0]+(t||"?")[0]}function ft(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function He(e){const t=Number(e)||0,o=Math.abs(t),a=o>=1e9?(o/1e9).toFixed(1)+"B":o>=1e6?(o/1e6).toFixed(1)+"M":o>=1e3?Math.round(o/1e3)+"k":String(Math.round(o));return(t<0?"-$":"$")+a}function mt(e,t){if(!e)return;const{faction:o,shard:a,ownedProperties:r=[],vessels:n=[],executives:l=[],selectedExecIdx:i=0}=t||{},c=o?.faction_name||"Corporation",d=(o?.abbreviation||o?.corp_ticker||"??").toUpperCase(),m=o?.corp_sector||"",f=o?.corp_subsector||"",u=Number(o?.corp_cash_reserves||0),_=Number(o?.corp_loans||0),b=ct({cash:u,loans:_,properties:r,vessels:n,financeReceivables:0,currentTick:a?.current_tick||0}),$=Number(o?.corp_reputation??50),w=Math.max(0,Math.min(100,Math.round(Number.isFinite($)?$:50))),E=w>=60?"var(--green)":w>=40?"var(--text-bright)":"var(--red)",x=r.length,C=b<0?"var(--red)":"var(--green)";lt(e,{title:"Corporate Actions",entityName:`${c} · ${d}`,entityColor:"#8b9a6b",stats:[{label:"Cash",value:He(u),color:"var(--accent)"},{label:"Reputation",value:String(w),color:E},{label:"Valuation",value:He(b),color:C}],statusBarItems:[{type:"count",label:"Sector",big:m||"—",bigColor:"#8b9a6b",dim1:f||""},{type:"count",label:"Properties",big:String(x),bigColor:"#8b9a6b",dim1:x===1?"building":"buildings"}],rolesContainerId:"corp-exec-list",panelContainerId:"corp-actions-panel",rolesColumnWidth:262});const R=document.getElementById("corp-exec-list");if(R){const g=new Map(l.map(A=>[A.role,A]));let L="";for(let A=0;A<be.length;A++){const ee=be[A],nt=he[ee],N=g.get(ee)||null,fe=i===A,j=nt.color,at=!N;if(L+=`<div onclick="actSelectExec(${A})" style="
                padding:10px 12px;
                background:${fe?j+"0a":"var(--bg-2,#1a1a17)"};
                border:1px solid ${fe?j+"44":"var(--border-0,rgba(255,255,255,0.06))"};
                border-left:3px solid ${fe?j:"var(--border-0,rgba(255,255,255,0.06))"};
                cursor:pointer;
            ">`,at&&ee!=="CEO")L+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${j};">${me(ee)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                        <div style="margin-top:4px;">
                            <span onclick="event.stopPropagation();openExecSearch('${ee}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                        </div>
                    </div>
                </div>`;else{const it=N?`${N.first_name} ${N.last_name}`:"—",Ue=N?N.age:0,rt=N?N.salary_per_year:0,st=N?pt(N.first_name,N.last_name):"—";L+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background:${j}15;border:1px solid ${j}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${j};flex-shrink:0;">${me(st)}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${j};">${me(ee)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:${fe?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${me(it)}${Ue?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${Ue})</span>`:""}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${ft(rt)}/yr</span>
                        </div>
                    </div>
                </div>`}L+="</div>"}R.innerHTML=L}const T=document.getElementById("corp-actions-panel");T&&(T.innerHTML='<div id="actions-right-panel"></div>')}const vt=1e6,yt=1e10,Ge=1,Ye=50,ut=12;function gt(e){if(e<0)return"A";const t=Math.min(e,25);return String.fromCharCode(65+t)}async function xt(e,t,o){if(!e||!t||!o)return;if((e.corp_sector||"").toLowerCase()==="finance"){alert("Finance-sector corps fund equity; they do not raise it.");return}const a=prompt(`APPLY FOR EQUITY — STEP 1 / 3

How much capital do you want to raise? (in millions USD)

Example: 50 for a $50M raise.
Range: $1M – $10B.`);if(a===null)return;const r=parseFloat(a);if(isNaN(r)||r<=0){alert("Amount must be a positive number.");return}const n=Math.round(r*1e6);if(n<vt){alert("Minimum raise is $1M.");return}if(n>yt){alert("Maximum raise is $10B.");return}const l=prompt(`APPLY FOR EQUITY — STEP 2 / 3

What stake are you offering in exchange? (percent)

Example: 12.5 for a 12.5% share of monthly profits.
Range: 1% – 50%.`);if(l===null)return;const i=parseFloat(l);if(isNaN(i)||i<Ge||i>Ye){alert(`Stake must be between ${Ge}% and ${Ye}%.`);return}const c=prompt(`APPLY FOR EQUITY — STEP 3 / 3

Describe the purpose of this raise.

Example: "Series B to fund fleet expansion across Mira ports."
Investment corps see this in Deal Flow when deciding whether to fund you.`);if(c===null)return;const d=(c||"").trim()||"Equity capital raise",{data:m,error:f}=await o.from("finance_loan_requests").select("id").eq("requesting_faction_id",e.id).eq("request_type","equity").eq("status","funded");if(f){alert("Could not look up prior raises: "+f.message);return}const u=gt((m||[]).length),_=`Post Series ${u} equity raise?

Amount:   $${r}M
Stake:    ${i}%
Series:   ${u}
Purpose:  ${d}

This becomes visible to Investment corps in Deal Flow. Once an investor buys in, your corp pays them ${i}% of monthly profit each tick.`;if(!confirm(_))return;const b=Number(t.current_tick||0),{error:$}=await o.from("finance_loan_requests").insert({requesting_faction_id:e.id,nation_id:e.nation_id,request_type:"equity",amount:n,equity_pct:i,series:u,term_months:120,purpose:d,status:"open",created_tick:b,expires_tick:b+ut});if($){alert("Failed to post equity raise: "+$.message);return}try{const w=e.faction_name+" ["+(e.abbreviation||e.corp_ticker||"??")+"]";await o.from("event_log").insert({nation_id:e.nation_id,event_name:"Series "+u+" Raise Opened",category:"corporate",faction_id:e.id,description_used:w+" has started the process of raising their series "+u+" and seeks investors.",fired_at_tick:b})}catch(w){console.warn("[equity-apply] Event log insert failed:",w?.message||w)}alert(`Series ${u} raise posted to Deal Flow. Investment corps can now fund you.`)}let $e=!1;async function bt(){if($e)return;const{data:{user:e}}=await y.auth.getUser();if(!e){alert("Not logged in.");return}const t=sessionStorage.getItem("active_faction_id");if(!t){alert("No active faction selected.");return}const{data:o,error:a}=await y.from("factions").select("id, faction_name, corp_sector, faction_type, abandoned_at").eq("id",t).single();if(a||!o||o.faction_type!=="corporation"||o.abandoned_at){alert("No active corporation found. It may have already been dissolved.");return}const r=o.faction_name||"this corporation";if(confirm("DECLARE BANKRUPTCY — "+r.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`)){$e=!0;try{const{data:n,error:l}=await y.rpc("declare_corp_bankruptcy",{p_faction_id:t});if(l)throw l;const i=Number(n?.total_payback||0),c=i>0?`
$`+i.toLocaleString()+" repaid to creditors.":"";sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:d,error:m}=await y.from("factions").select("id, faction_type").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);m&&console.warn("[Bankruptcy] remaining-factions lookup failed:",m.message);const f=(d||[]).find(_=>_.faction_type==="party"),u=(d||[]).find(_=>_.faction_type==="corporation");f?(sessionStorage.setItem("active_faction_id",f.id),alert(r+" has declared bankruptcy."+c+`

Redirecting to your political party.`),window.location.href="dashboard.html"):u?(sessionStorage.setItem("active_faction_id",u.id),alert(r+" has declared bankruptcy."+c+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(r+" has declared bankruptcy."+c+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(n){alert("Bankruptcy failed: "+(n?.message||n)+`

Please try again or contact support.`)}finally{$e=!1}}}const _e=2e6;let v=null;async function ht(e){if(!e?.id)return;v={plaintiff:e,relationships:[],loading:!0,submitting:!1,selectedDefendantId:null,selectedGrievance:null,selectedRelief:null,error:null};const t=document.createElement("div");t.id="sue-overlay",t.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:flex-start;justify-content:center;padding:40px 24px;overflow-y:auto;",t.onclick=o=>{o.target===t&&Te()},document.body.appendChild(t),B();try{v.relationships=await _t(e)}catch(o){console.warn("[sue-corp] relationship load failed:",o),v.relationships=[]}v.loading=!1,B()}function Te(){const e=document.getElementById("sue-overlay");e&&e.remove(),v=null}async function _t(e){const{data:t,error:o}=await y.from("bank_loans").select("id, lender_faction_id, borrower_faction_id, principal, outstanding, status").or(`borrower_faction_id.eq.${e.id},lender_faction_id.eq.${e.id}`).in("status",["active","called","late","delinquent"]);if(o)return console.warn("[sue-corp] loan fetch failed:",o.message),[];const a=t||[];if(a.length===0)return[];const r=new Set;for(const c of a){const d=c.borrower_faction_id===e.id?c.lender_faction_id:c.borrower_faction_id;d&&r.add(d)}if(r.size===0)return[];const{data:n,error:l}=await y.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_sector, nation_id, nations:nation_id(name)").in("id",Array.from(r));if(l)return console.warn("[sue-corp] counterparty fetch failed:",l.message),[];const i=new Map((n||[]).map(c=>[c.id,c]));return a.flatMap(c=>{const d=c.borrower_faction_id===e.id?c.lender_faction_id:c.borrower_faction_id,m=i.get(d);return m?[{id:c.id,kind:"loan",defendantId:m.id,defendantName:m.faction_name,defendantTicker:m.corp_ticker||m.abbreviation||"",defendantNation:m.nations?.name||"",defendantSector:m.corp_sector||"",label:`Active Loan ${h(c.outstanding??c.principal)}`,relationshipKind:"loan",snapshot:{principal:c.principal,outstanding:c.outstanding,status:c.status}}]:[]})}function wt(e){const t=v.relationships[e];if(!t)return;v.selectedDefendantId=t.defendantId,v.selectedRelationshipIdx=e;const o=We(t.defendantSector);if(v.selectedGrievance){const a=Me.find(r=>r.key===v.selectedGrievance);(!a||!o.has(a.sector))&&(v.selectedGrievance=null)}B()}function kt(e){v.selectedGrievance=e,B()}function $t(e){v.selectedRelief=e,B()}function Xe(){return!!v&&!v.submitting&&v.selectedDefendantId&&v.selectedGrievance&&v.selectedRelief&&Number(v.plaintiff?.corp_cash_reserves??0)>=_e}function B(){const e=document.getElementById("sue-overlay");if(!e||!v)return;const t=Number(v.plaintiff?.corp_cash_reserves??0),o=t>=_e,a=v.selectedRelationshipIdx!=null?v.relationships[v.selectedRelationshipIdx]:null,r=a?We(a.defendantSector):new Set(["universal"]);let n='<div onclick="event.stopPropagation()" style="width:760px;max-width:94vw;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';if(n+=`<div style="padding:18px 24px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.22em;color:#c55;text-transform:uppercase;margin-bottom:4px;">Legal Action · Step 1 of 2</div>
            <div style="font-size:22px;font-weight:600;color:var(--panel-text);letter-spacing:-0.01em;">Sue Corporation</div>
            <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:6px;">Filing on behalf of: <span style="color:#c8a832;">${p(v.plaintiff.abbreviation||v.plaintiff.corp_ticker||"")}</span> ${p(v.plaintiff.faction_name||"")}</div>
        </div>
        <span onclick="window.sueCorpClose()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;padding:0 6px;">&times;</span>
    </div>`,n+='<div style="padding:20px 24px;max-height:70vh;overflow-y:auto;">',n+=Ce("I.","Select Defendant","Active Relationships Only"),v.loading)n+='<div style="padding:24px;text-align:center;font-family:var(--font-mono);font-size:11px;color:#6a6660;">Loading relationships…</div>';else if(v.relationships.length===0)n+='<div style="padding:24px;text-align:center;font-family:var(--font-mono);font-size:11px;color:#6a6660;">No active business relationships. You can only sue corporations you have an open loan, trade agreement, or contract with.</div>';else{n+='<div style="display:flex;flex-direction:column;gap:6px;">';for(let c=0;c<v.relationships.length;c++){const d=v.relationships[c],m=c===v.selectedRelationshipIdx,f=d.kind==="loan"?"#5a8aaa":d.kind==="trade"?"#c8a832":"#a0633a";n+=`<div onclick="window.sueCorpSelectRel(${c})" style="
                padding:12px 14px;
                background:${m?"rgba(200,90,58,0.06)":"var(--bg-2,#1a1a17)"};
                border:1px solid ${m?"#c55":"var(--panel-border)"};
                cursor:pointer;
                display:grid;grid-template-columns:18px 1fr auto;gap:14px;align-items:center;
            ">
                <div style="width:14px;height:14px;border:1px solid ${m?"#c55":"var(--panel-border)"};border-radius:50%;position:relative;background:var(--bg-panel);">
                    ${m?'<div style="position:absolute;inset:3px;background:#c55;border-radius:50%;"></div>':""}
                </div>
                <div style="min-width:0;">
                    <div style="font-size:14px;font-weight:600;color:var(--panel-text);"><span style="font-family:var(--font-mono);font-size:10px;color:#c8a832;letter-spacing:0.12em;margin-right:8px;">${p(d.defendantTicker)}</span>${p(d.defendantName)}</div>
                    <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.1em;text-transform:uppercase;margin-top:2px;">${p(d.defendantNation)} · ${p(d.defendantSector)}</div>
                </div>
                <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;padding:4px 9px;border:1px solid ${f}66;color:${f};background:${f}14;">${p(d.label)}</span>
            </div>`}n+="</div>"}const l=a?`Defendant: ${a.defendantSector||"Unknown"} Sector`:"Pick a defendant first";n+=Ce("II.","Grievance Type",l),n+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">';for(const c of Me){const d=v.selectedGrievance===c.key,m=!a||!r.has(c.sector),f=c.sector==="universal"?"#8a722f":c.sector==="banking"?"#5a8aaa":c.sector==="construction"?"#a0633a":"#4a8a87";n+=`<button ${m?"disabled":`onclick="window.sueCorpSelectGrievance('${c.key}')"`} style="
            padding:12px 14px;
            background:${d?"rgba(200,90,58,0.06)":"var(--bg-2,#1a1a17)"};
            border:1px solid ${d?"#c55":"var(--panel-border)"};
            cursor:${m?"not-allowed":"pointer"};
            opacity:${m?.35:1};
            text-align:left;
            display:grid;grid-template-columns:18px 1fr;gap:12px;align-items:flex-start;
            font-family:inherit;
        ">
            <div style="width:14px;height:14px;border:1px solid ${d?"#c55":"var(--panel-border)"};border-radius:50%;position:relative;background:var(--bg-panel);margin-top:2px;">
                ${d?'<div style="position:absolute;inset:3px;background:#c55;border-radius:50%;"></div>':""}
            </div>
            <div>
                <div style="font-size:13px;font-weight:600;color:var(--panel-text);">${p(c.name)}</div>
                <div style="font-size:11px;color:#9e9a92;margin-top:3px;line-height:1.4;">${p(c.desc)}</div>
                <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.16em;text-transform:uppercase;color:${f};margin-top:4px;">${p(c.sector==="universal"?"UNIVERSAL":c.sector+" ONLY")}</div>
            </div>
        </button>`}n+="</div>",n+=Ce("III.","Relief Sought","What You Want the Court to Order"),n+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">';for(const c of dt){const d=v.selectedRelief===c.key;n+=`<button onclick="window.sueCorpSelectRelief('${c.key}')" style="
            padding:12px 14px;
            background:${d?"rgba(200,90,58,0.06)":"var(--bg-2,#1a1a17)"};
            border:1px solid ${d?"#c55":"var(--panel-border)"};
            cursor:pointer;
            text-align:left;
            display:grid;grid-template-columns:18px 1fr;gap:12px;align-items:flex-start;
            font-family:inherit;
        ">
            <div style="width:14px;height:14px;border:1px solid ${d?"#c55":"var(--panel-border)"};border-radius:50%;position:relative;background:var(--bg-panel);margin-top:2px;">
                ${d?'<div style="position:absolute;inset:3px;background:#c55;border-radius:50%;"></div>':""}
            </div>
            <div>
                <div style="font-size:13px;font-weight:600;color:var(--panel-text);">${p(c.name)}</div>
                <div style="font-size:11px;color:#9e9a92;margin-top:3px;line-height:1.4;">${p(c.desc)}</div>
            </div>
        </button>`}n+="</div>",n+="</div>";const i=Xe();n+=`<div style="padding:14px 24px;border-top:1px solid var(--panel-border);background:var(--bg-panel);display:flex;justify-content:space-between;align-items:center;gap:18px;">
        <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;">
            Filing fee: <span style="color:${o?"#c8a832":"#c55"};">${h(_e)}</span> · Public record · Cash on hand: <span style="color:${o?"var(--panel-text)":"#c55"};">${h(t)}</span>
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="window.sueCorpClose()" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#9e9a92;border:1px solid var(--panel-border);cursor:pointer;">Cancel</div>
            <div id="sue-submit" onclick="${i?"window.sueCorpSubmit()":""}" style="padding:9px 22px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${i?"#fff":"#6a6660"};background:${i?"#c55":"var(--panel-border)"};border:1px solid ${i?"#c55":"var(--panel-border)"};cursor:${i?"pointer":"not-allowed"};${i?"":"opacity:0.45;pointer-events:none;"}">File Lawsuit ▸</div>
        </div>
    </div>`,v.error&&(n+=`<div style="padding:8px 24px;font-family:var(--font-mono);font-size:10px;color:#c55;background:var(--bg-panel);border-top:1px solid var(--panel-border);">${p(v.error)}</div>`),n+="</div>",e.innerHTML=n}function Ce(e,t,o){return`<div style="display:flex;justify-content:space-between;align-items:baseline;margin:18px 0 10px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border);">
        <div style="font-size:15px;font-weight:600;color:var(--panel-text);"><span style="font-family:var(--font-mono);font-size:11px;color:#8a722f;letter-spacing:0.1em;margin-right:10px;">${p(e)}</span>${p(t)}</div>
        <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">${p(o)}</div>
    </div>`}async function Ct(){if(!v||v.submitting||!Xe())return;v.submitting=!0,v.error=null,B();const e=v.relationships[v.selectedRelationshipIdx],t=Me.find(r=>r.key===v.selectedGrievance);let o,a;try{({data:o,error:a}=await y.rpc("file_commercial_lawsuit",{p_plaintiff_id:v.plaintiff.id,p_defendant_id:e.defendantId,p_grievance_type:v.selectedGrievance,p_grievance_sector:t?.sector||"universal",p_relief_sought:v.selectedRelief,p_relationship_ref:{kind:e.relationshipKind,id:e.id,snapshot:e.snapshot}}))}catch(r){v.submitting=!1,v.error="Network error: "+(r?.message||String(r)),B();return}if(a){v.submitting=!1,v.error="RPC failed: "+a.message,B();return}if(!o?.success){v.submitting=!1,v.error=o?.error||"Filing failed.",B();return}v.plaintiff.corp_cash_reserves=Math.max(0,Number(v.plaintiff.corp_cash_reserves??0)-_e),Te()}window.sueCorpClose=Te;window.sueCorpSelectRel=wt;window.sueCorpSelectGrievance=kt;window.sueCorpSelectRelief=$t;window.sueCorpSubmit=Ct;let U=[],s=null,k=null,ce=[],de=[],ae=0,H=null,q=-1,Qe=[];async function Et(){if(!s?.id)return;const{data:e}=await y.from("corp_properties").select("*").eq("faction_id",s.id).eq("is_active",!0);Qe=e||[]}async function Ae(){if(!s)return;const[e,t]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",s.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",s.nation_id).eq("status","available").order("skill",{ascending:!1})]);e.error&&console.warn("Failed to load executives:",e.error.message),t.error&&console.warn("Failed to load executive pool:",t.error.message),ce=e.data||[],de=t.data||[]}function K(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function Z(e){return ce.find(t=>t.role===e)||null}function Ie(e,t){return(e||"?")[0]+(t||"?")[0]}const Ee=new Set;function zt(e){if(!e||e.contract_end_tick==null)return`${e?.contract_years||0}yr`;const t=k?.current_tick||0,o=Number(e.contract_end_tick)-t;return o<=0?"expired":o===1?"1 tick left":`${o} ticks left`}const St=15;async function It(e,t,o,a){if(Ee.has(e))return;const r=St,n=Math.round(Number(a||0)*(100+r)/100),l=`RENEW ${t}: ${o}

Predicted contract:
  Salary: ${K(n)}/yr  (+${r}% counter-offer)
  Length: 4 years
  Cost:   FREE

Confirm renewal?`;if(confirm(l)){Ee.add(e);try{const{data:i,error:c}=await y.rpc("renew_executive_contract",{p_exec_id:e});if(c){alert("Renewal failed: "+c.message);return}if(!i?.success){alert("Renewal failed: "+(i?.reason||"unknown"));return}alert(`${t} ${o} renewed.
New salary: ${K(i.new_salary)}/yr  (+${i.markup_pct}%)`),await Ae(),D()}catch(i){alert("Renewal failed: "+(i?.message||i))}finally{Ee.delete(e)}}}window.confirmRenewExec=It;function D(){const e=document.getElementById("actions-container");e&&(mt(e,{faction:s,shard:k,ownedProperties:Qe,vessels:[],executives:ce,selectedExecIdx:ae}),Nt())}const Pe={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]},{id:"equity",name:"Apply for Equity",desc:"Raise capital by offering Investment corps a stake in your monthly profits. Series (A/B/C…) is auto-assigned by your prior funded raise count. No repayment — investors get a percentage of profit each tick going forward.",cost:"FREE",costColor:"#c89a4a",tags:["FINANCIAL","STRUCTURAL"],hideForSector:"Finance"},{id:"paydown",name:"Pay Down Debt",desc:"Use cash to retire outstanding loan principal early. Reduces debt and improves your credit standing. Paying off a loan in full grants +1 Reputation. Costs $100k admin fee.",cost:"$100k",costColor:"#5a8aaa",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Takes a small reputation hit.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Costs ~$2M and takes a small reputation hit.",cost:"~$2M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"},{id:"branding",name:"Branding",desc:"Upload a custom corporate logo. Replaces the default monogram on the dashboard, nation roster, and shipping vessels.",cost:"$1M",costColor:"#ca5",tags:["IDENTITY"],cooldownTicks:12}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation you have a business relationship with. The Ministry of Justice in your nation reviews and rules on the case.",cost:"$2M",costColor:"#c55",tags:["LEGAL"]}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function pe(e){return 1}let Je={};function Rt(e){const t=k?.current_tick||0;return Je[e]===t}function ie(e){const t=k?.current_tick||0;Je[e]=t}function Nt(){const e=document.getElementById("actions-right-panel");if(!e)return;const t=be[ae],o=he[t],a=Z(t),r=(Pe[t]||[]).filter(l=>!l.hideForSector||(s?.corp_sector||"")!==l.hideForSector);if(!a){e.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${o.color};margin-bottom:6px;">${p(t)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${p(o.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${t}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
            ${t==="CEO"?`<div style="margin-top:22px;padding-top:18px;border-top:1px solid var(--border-0,rgba(255,255,255,0.06));">
                <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-bottom:10px;line-height:1.5;">Insolvent with no CEO to recover? The board can still file for bankruptcy.</div>
                <div onclick="actExecute('bankruptcy','CEO')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#c55;cursor:pointer;">DECLARE BANKRUPTCY</div>
            </div>`:""}
        </div>`;return}let n="";n+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${o.color}15;border:1px solid ${o.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${o.color};">${p(Ie(a.first_name,a.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${o.color};">${p(t)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${p(a.first_name)} ${p(a.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${p(o.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${K(a.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${zt(a)}</div>
            </div>
            <div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmRenewExec('${a.id}','${p(t)}','${p(a.first_name+" "+a.last_name)}',${a.salary_per_year||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#5cb85c;border:1px solid rgba(92,184,92,0.3);background:rgba(92,184,92,0.07);cursor:pointer;">RENEW</span>
            </div>
            ${t!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${a.id}','${p(t)}','${p(a.first_name+" "+a.last_name)}',${a.salary_per_year},${a.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,n+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let l=0;l<r.length;l++){const i=r[l],c=!!i.locked;n+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${c?"transparent":o.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${l<r.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${c?"0.4":"1"};
            cursor:${c?"not-allowed":"pointer"};
        ">`,n+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${c?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${p(i.name)}</span>`;for(const d of i.tags)n+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${d==="IRREVERSIBLE"?"#c55":d==="OFFENSIVE"?"#c84":d==="STRUCTURAL"?"#ca5":d==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${p(d)}</span>`;n+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${i.costColor};">${p(i.cost)}</span>
            </div>
        </div>`,n+=`<div style="font-size:14px;color:${c?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${p(i.desc)}</div>`,i.descRed&&(n+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${p(i.descRed)}</div>`),c&&i.lockReason&&(n+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${p(i.lockReason)}</span>
            </div>`),c||(n+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${i.id}','${t}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${o.color};cursor:pointer;">EXECUTE</span>
            </div>`),n+="</div>"}n+="</div>",e.innerHTML=n,e.querySelectorAll("[onmouseenter]").forEach(l=>{l.addEventListener("mouseenter",function(){const i=this.querySelector(".act-exec-btn");i&&(i.style.display="block")}),l.addEventListener("mouseleave",function(){const i=this.querySelector(".act-exec-btn");i&&(i.style.display="none")})})}function Mt(e,t,o,a,r){const n=k?.current_tick||0,l=Math.max(0,r-n),i=Math.round(a*(l/12)),c=`FIRE ${t}: ${o}

Contract remaining: ${l} ticks
Payout (prorated): $${(i/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(c)&&Tt(e,t,i)}async function Tt(e,t,o){try{const a=Number(s?.corp_cash_reserves??0);if(a<o){alert(`Insufficient funds. You need $${(o/1e6).toFixed(2)}M but only have $${(a/1e6).toFixed(2)}M.`);return}const r=a-o,{error:n}=await y.from("factions").update({corp_cash_reserves:r}).eq("id",s.id);if(n){alert("Failed to process payout: "+n.message);return}const{error:l}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",e);if(l){await y.from("factions").update({corp_cash_reserves:a}).eq("id",s.id),alert("Failed to fire executive: "+l.message);return}s.corp_cash_reserves=r,ce=ce.filter(i=>i.id!==e),D()}catch(a){console.error("[CorpOps] Fire executive error:",a),alert("An error occurred.")}}function At(e,t){const o=(Pe[t]||[]).find(a=>a.id===e);if(o?.cooldown==="once/tick"&&Rt(e)){alert("This action can only be used once per tick. Wait for the next tick.");return}if(o?.cooldownTicks){const a=Pt(e);if(a>0){alert(`On cooldown — ${a} tick${a===1?"":"s"} remaining.`);return}}switch(e){case"statement":return Lt();case"loan":return Ot();case"equity":return xt(s,k,y);case"paydown":return ao();case"restructure":return Kt();case"rebrand":return Xt();case"branding":return Jt();case"donate":return to();case"sue_corp":return ht(s);case"bankruptcy":return bt()}}function Pt(e){if(e!=="branding")return 0;const o=(Pe.CMO||[]).find(l=>l.id===e)?.cooldownTicks||0,a=Number(s?.last_branding_tick);if(!Number.isFinite(a)||a<=0)return 0;const n=(Number(k?.current_tick)||0)-a;return n>=o?0:o-n}let Re=!1;function Lt(){if(Re)return;Re=!0;const e=document.createElement("div");e.id="stmt-overlay",e.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",e.onclick=function(c){c.target===e&&Le()};const t=s?.faction_name||"Corporation",o=(s?.abbreviation||s?.corp_ticker||"??").toUpperCase(),a=Number(s?.corp_cash_reserves??0),r=Z("CEO"),n=r?`${r.first_name} ${r.last_name}`:"CEO";e.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Issue Statement</span>
                </div>
                <span onclick="actCloseStatement()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${p(o)}</span>
                <span style="font-size:10px;color:var(--panel-text);">${p(t)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${p(n)}</span>
            </div>
        </div>
        <div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PRESS RELEASE</div>
            <textarea id="stmt-text" rows="4" maxlength="500" placeholder="Type your public statement here. All players will see this in the events feed."
                style="width:100%;padding:8px 10px;font-family:var(--font-ui);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;resize:none;box-sizing:border-box;line-height:1.5;"></textarea>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Visible to all players in all nations</span>
                <span id="stmt-chars" style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">0/500</span>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;gap:12px;">
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#5cb85c;">$20k</div></div>
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${a<2e4?"#c55":"var(--panel-text)"};">${h(a)}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="actCloseStatement()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
                    <div id="stmt-submit-btn" onclick="actSubmitStatement()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c8a832;cursor:pointer;">PUBLISH</div>
                </div>
            </div>
            <div id="stmt-error" style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
        </div>
    </div>`,document.body.appendChild(e);const l=document.getElementById("stmt-text"),i=document.getElementById("stmt-chars");l&&i&&(l.addEventListener("input",function(){i.textContent=this.value.length+"/500"}),l.focus())}function Le(){const e=document.getElementById("stmt-overlay");e&&e.remove(),Re=!1}let se=!1;async function Bt(){if(!s||!k||se)return;const e=document.getElementById("stmt-text"),t=document.getElementById("stmt-error"),o=(e?.value||"").trim();if(!o){t&&(t.textContent="Statement cannot be empty.",t.style.display="block");return}if(o.length>500){t&&(t.textContent="Statement too long (max 500 chars).",t.style.display="block");return}const a=Z("CEO"),r=a?a.skill:50,n=Math.round(2e4*pe()),l=Number(s.corp_cash_reserves??0);if(l<n){t&&(t.textContent="Insufficient cash. Need "+h(n)+".",t.style.display="block");return}se=!0;const i=document.getElementById("stmt-submit-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const c=s.faction_name||"Corporation",d=a?`${a.first_name} ${a.last_name}`:"CEO",m=k.current_tick||0,{error:f}=await y.from("factions").update({corp_cash_reserves:l-n}).eq("id",s.id);if(f){se=!1,t&&(t.textContent="Failed to deduct cost: "+f.message,t.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:u}=await y.from("event_log").insert({nation_id:s.nation_id,faction_id:s.id,event_name:c+" — Press Release",description_used:d+", CEO of "+c+': "'+o.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:n,ceo:d,skill:r},fired_at_tick:m});if(u){await y.from("factions").update({corp_cash_reserves:l}).eq("id",s.id),se=!1,t&&(t.textContent="Failed to publish: "+u.message,t.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}s.corp_cash_reserves=l-n,se=!1,ie("statement"),Le()}const we=5e6,ke=5e8,Ne=5e6;let O=25e7,I=new Set,X=new Set,z=[],G=[];function Ot(){O=25e7,I=new Set,X=new Set,z=[],G=[],document.getElementById("lr-overlay").style.display="flex",J(),Promise.all([Ht(),Gt()]).then(()=>J()).catch(e=>console.error("[lrOpen] load failed:",e))}function Ze(){document.getElementById("lr-overlay").style.display="none"}function Ft(e){const t=Number(e)||0,o=Math.round(t/Ne)*Ne;O=Math.max(we,Math.min(ke,o)),J()}function qt(e){e&&(I.has(e)?I.delete(e):I.add(e),J())}function Dt(){I.size===z.length&&z.length>0?I=new Set:I=new Set(z.map(e=>e.id)),J()}function jt(){const e=s?.nation_id;if(e){for(const t of z)t.nation_id===e&&I.add(t.id);J()}}function Ut(e){e&&(X.has(e)?X.delete(e):X.add(e),J())}async function Ht(){if(!s){z=[];return}const{data:e,error:t}=await y.from("factions").select("id, faction_name, corp_company_type, nation_id, corp_lending_capital, corp_interest_rates, corp_overleverage, nations:nation_id(name)").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",s.id);if(t){console.warn("[lrLoadFinanceCorps] error:",t.message),z=[];return}z=e||[]}async function Gt(){if(!s){G=[];return}const{data:e,error:t}=await y.from("corp_properties").select("id, name, purchase_price, nation_id, role, nations:nation_id(name)").eq("faction_id",s.id).eq("is_active",!0).order("purchase_price",{ascending:!1});if(t){console.warn("[lrLoadCollateral] error:",t.message),G=[];return}G=e||[]}function ze(e,t){const o=Math.max(0,Math.min(10,Math.round(Number(e)||0))),a=[];for(let r=0;r<10;r++){const n=r<o;let l="";n&&(t==="leverage"?l=r<=2?" green":r<=5?" rust":" red":t&&t!=="gold"&&(l=" "+t)),a.push(`<span class="lr-pip${n?" filled"+l:""}"></span>`)}return a.join("")}function Yt(e){const t=Number(e)||0;return t>=7?"var(--red, #d9534f)":t>=4?"var(--orange, #e8724a)":"var(--green, #5cb85c)"}function J(){const e=document.getElementById("lr-modal-content");if(!e)return;const t=s?.faction_name||"Corporation",o=(s?.abbreviation||s?.corp_ticker||"??").toUpperCase(),a=Math.round(O/1e6),r=a/5*.1;let n=0;for(const x of G)X.has(x.id)&&(n+=Number(x.purchase_price||0));const l=O>0?Math.round(n/O*100):0,i=n===0?"unsecured":l<100?"partial":l<150?"full":"over",c=i==="unsecured"?"var(--text-dim, #6a6660)":i==="partial"?"var(--orange, #e8724a)":"var(--green, #5cb85c)",d=I.size,m=d===0;let f="";if(f+=`<div style="padding:18px 24px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:2px;color:#8a722f;text-transform:uppercase;margin-bottom:4px;">— Treasury Action —</div>
            <div style="font-family:var(--font-serif, 'IBM Plex Serif', serif);font-weight:500;font-size:28px;line-height:1;letter-spacing:-0.02em;color:var(--text-bright, #f0efe6);">Request <em style="font-style:italic;color:var(--gold, #c8a832);">Loan</em></div>
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:#6a6660;margin-top:6px;">From: <strong style="color:var(--gold, #c8a832);font-weight:500;">${p(o)}</strong> ${p(t)}</div>
        </div>
        <div onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;border:1px solid var(--panel-border);width:28px;height:28px;display:flex;align-items:center;justify-content:center;">&#215;</div>
    </div>`,f+='<div style="flex:1;overflow-y:auto;padding:24px;">',f+=`<div style="margin-bottom:24px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border);">
            <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-style:italic;font-weight:500;font-size:16px;color:var(--text-bright,#f0efe6);">
                <span style="font-family:var(--font-mono);font-style:normal;font-size:10px;color:#8a722f;margin-right:8px;letter-spacing:0.1em;">I.</span>Loan Amount
            </div>
            <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">$5M = +0.1 LENDING CAPITAL</span>
        </div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:18px 20px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;">
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:400;font-size:44px;line-height:1;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;letter-spacing:-0.025em;">
                    <span style="font-family:var(--font-sans,'IBM Plex Sans',sans-serif);font-size:18px;color:#6a6660;margin-right:2px;vertical-align:top;line-height:44px;">$</span>${a}M
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;margin-bottom:4px;">Lending Capital Demand</div>
                    <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:22px;color:var(--gold,#c8a832);line-height:1;font-variant-numeric:tabular-nums;">+${r.toFixed(1)}</div>
                </div>
            </div>
            <input type="range" min="${we}" max="${ke}" step="${Ne}" value="${O}"
                oninput="lrSetAmount(this.value)"
                style="width:100%;height:4px;accent-color:var(--gold,#c8a832);" />
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;color:#6a6660;text-transform:uppercase;margin-top:6px;">
                <span>$5M</span><span>$500M</span>
            </div>
        </div>
    </div>`,f+=`<div style="margin-bottom:24px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border);">
            <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-style:italic;font-weight:500;font-size:16px;color:var(--text-bright,#f0efe6);">
                <span style="font-family:var(--font-mono);font-style:normal;font-size:10px;color:#8a722f;margin-right:8px;letter-spacing:0.1em;">II.</span>Collateral Offered
            </div>
            <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">Optional ◊ Stronger pledges earn better terms</span>
        </div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:12px 16px;margin-bottom:10px;display:grid;grid-template-columns:1fr auto 1fr;gap:18px;align-items:center;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;margin-bottom:3px;">Total Pledged</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-size:20px;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;line-height:1;">${n===0?"—":"$"+Math.round(n/1e6)+'<span style="font-family:var(--font-sans,sans-serif);font-size:11px;color:#6a6660;margin-left:2px;">M</span>'}</div>
            </div>
            <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-style:italic;font-size:18px;color:#8a722f;">◊</div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;margin-bottom:3px;">Coverage of Loan</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-size:20px;font-variant-numeric:tabular-nums;line-height:1;color:${c};">${i==="unsecured"?"UNSECURED":l+'<span style="font-family:var(--font-sans,sans-serif);font-size:11px;color:#6a6660;margin-left:2px;">%</span>'}</div>
            </div>
        </div>`,G.length===0)f+='<div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:18px;text-align:center;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;color:#6a6660;font-style:italic;">No corporate properties available to pledge.</div>';else{f+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">';for(const x of G){const C=X.has(x.id),R=Math.round(Number(x.purchase_price||0)/1e6),T=x.name||(x.role||"Property").replace(/_/g," ").toUpperCase(),g=x.nations?.name||"—",L=x.synthetic?'<span style="font-family:var(--font-mono);font-size:7px;letter-spacing:0.12em;color:#8a722f;border:1px solid rgba(138,114,47,0.4);background:rgba(138,114,47,0.06);padding:1px 5px;margin-left:6px;text-transform:uppercase;">Structural</span>':"";f+=`<div onclick="lrToggleCollateral('${p(x.id)}')" style="background:${C?"rgba(200,168,50,0.04)":"var(--bg-panel)"};border:1px solid ${C?"var(--gold,#c8a832)":"var(--panel-border)"};padding:10px 12px;cursor:pointer;display:grid;grid-template-columns:14px 1fr auto;gap:10px;align-items:center;">
                <div style="width:12px;height:12px;border:1px solid ${C?"var(--gold,#c8a832)":"var(--panel-border)"};background:${C?"var(--gold,#c8a832)":"var(--bg-panel)"};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#0e0e0c;">${C?"✓":""}</div>
                <div style="min-width:0;">
                    <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:13px;color:var(--text-bright,#f0efe6);line-height:1.2;">${p(T)}${L}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.1em;color:#6a6660;text-transform:uppercase;margin-top:2px;">${p(g)} ◊ ${p((x.role||"").replace(/_/g," "))}${x.synthetic?" · Cannot be seized on default":""}</div>
                </div>
                <div style="font-family:var(--font-mono);font-size:12px;font-weight:500;color:var(--green,#5cb85c);font-variant-numeric:tabular-nums;">$${R}M</div>
            </div>`}f+="</div>"}f+="</div>";const _=z.length>0&&d===z.length?"Deselect All":"Select All",b=s?.nation||"",$=!!s?.nation_id&&z.some(x=>x.nation_id===s.nation_id),w=z.length>0,E=x=>`font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold,#c8a832);padding:4px 9px;border:1px solid rgba(200,168,50,0.4);background:rgba(200,168,50,0.06);user-select:none;${x?"cursor:pointer;":"opacity:0.4;pointer-events:none;"}`;if(f+=`<div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border);gap:12px;flex-wrap:wrap;">
            <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-style:italic;font-weight:500;font-size:16px;color:var(--text-bright,#f0efe6);">
                <span style="font-family:var(--font-mono);font-style:normal;font-size:10px;color:#8a722f;margin-right:8px;letter-spacing:0.1em;">III.</span>Select Lenders
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span ${w?'onclick="lrToggleSelectAll()"':""} style="${E(w)}">${_}</span>
                ${b?`<span ${$?'onclick="lrSelectAllInMyNation()"':""} style="${E($)}">Select All in ${p(b)}</span>`:""}
                <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">${d} of ${z.length} selected</span>
            </div>
        </div>`,z.length===0)f+='<div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:18px;text-align:center;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;color:#6a6660;font-style:italic;">No Finance corporations available to lend.</div>';else{f+='<div style="display:flex;flex-direction:column;gap:5px;">';for(const x of z){const C=I.has(x.id),R=Number(x.corp_lending_capital??0),T=Number(x.corp_interest_rates??0),g=Number(x.corp_overleverage??0),L=x.nations?.name||"—",A=(x.corp_company_type||"PRIVATE").toUpperCase();f+=`<div onclick="lrToggleBank('${p(x.id)}')" style="background:${C?"rgba(200,168,50,0.04)":"var(--bg-panel)"};border:1px solid ${C?"var(--gold,#c8a832)":"var(--panel-border)"};padding:12px 14px;cursor:pointer;display:grid;grid-template-columns:16px 1fr 88px 88px 88px;gap:14px;align-items:center;">
                <div style="width:12px;height:12px;border:1px solid ${C?"var(--gold,#c8a832)":"var(--panel-border)"};background:${C?"var(--gold,#c8a832)":"var(--bg-panel)"};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#0e0e0c;">${C?"✓":""}</div>
                <div style="min-width:0;">
                    <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:14px;color:var(--text-bright,#f0efe6);line-height:1.2;">${p(x.faction_name||"Bank")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.12em;color:#6a6660;text-transform:uppercase;margin-top:3px;"><span style="color:var(--gold,#c8a832);">◊</span> ${p(L)} ◊ ${p(A)}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.16em;color:#6a6660;text-transform:uppercase;margin-bottom:3px;">Lending Cap.</div>
                    <div style="font-family:var(--font-mono);font-size:12px;font-weight:500;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;">${R.toFixed(R%1===0?0:1)}</div>
                    <div style="display:flex;gap:2px;margin-top:2px;">${ze(R,"green")}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.16em;color:#6a6660;text-transform:uppercase;margin-bottom:3px;">Interest</div>
                    <div style="font-family:var(--font-mono);font-size:12px;font-weight:500;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;">${T.toFixed(1)}%</div>
                    <div style="display:flex;gap:2px;margin-top:2px;">${ze(T,"rust")}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.16em;color:#6a6660;text-transform:uppercase;margin-bottom:3px;">Leverage</div>
                    <div style="font-family:var(--font-mono);font-size:12px;font-weight:500;font-variant-numeric:tabular-nums;color:${Yt(g)};">${g.toFixed(g%1===0?0:1)}</div>
                    <div style="display:flex;gap:2px;margin-top:2px;">${ze(g,"leverage")}</div>
                </div>
            </div>`}f+="</div>"}f+="</div>",f+="</div>",f+=`<div style="padding:14px 24px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;gap:24px;">
        <div style="display:flex;gap:24px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;margin-bottom:2px;">Requesting</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:16px;color:var(--gold,#c8a832);font-variant-numeric:tabular-nums;line-height:1;">$${a}M</div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;margin-bottom:2px;">Collateral</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:16px;color:${c};font-variant-numeric:tabular-nums;line-height:1;">${n===0?"Unsecured":"$"+Math.round(n/1e6)+"M"}</div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;margin-bottom:2px;">Sent To</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:16px;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;line-height:1;">${d} Lender${d===1?"":"s"}</div>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:9px 18px;font-family:var(--font-mono);font-size:10px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">Cancel</div>
            <div id="lr-submit-btn" onclick="${m?"":"lrSubmit()"}" style="padding:9px 22px;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#0e0e0c;background:var(--gold,#c8a832);border:1px solid var(--gold,#c8a832);cursor:${m?"not-allowed":"pointer"};${m?"opacity:0.4;":""}">Submit Request ▸</div>
        </div>
    </div>`,f+='<div id="lr-error" style="padding:6px 24px;font-family:var(--font-mono);font-size:9px;color:var(--red,#d9534f);display:none;background:var(--bg-panel);border-top:1px solid var(--panel-border);"></div>',e.innerHTML=f}let ve=!1;async function Vt(){if(!s||!k||ve)return;const e=document.getElementById("lr-error"),t=i=>{e&&(e.textContent=i,e.style.display="block")};if(O<we)return t(`Minimum loan amount is $${we/1e6}M.`);if(O>ke)return t(`Maximum loan amount is $${ke/1e6}M.`);if(I.size===0)return t("Select at least one lender.");const o=document.getElementById("lr-submit-btn");ve=!0,o&&(o.style.opacity="0.5",o.style.pointerEvents="none");const a=Array.from(I),r=(G||[]).filter(i=>X.has(i.id)&&!i.synthetic).map(i=>({kind:"property",id:i.id,name:i.name||(i.role||"Property").replace(/_/g," "),value:Math.round(Number(i.purchase_price||0))}));let n,l;try{const i=await y.rpc("submit_loan_request",{p_requesting_faction_id:s.id,p_target_bank_ids:a,p_principal:O,p_term_ticks:60,p_requested_apr:0,p_risk_grade:"B",p_purpose:null,p_expiry_ticks:6,p_collateral:r});n=i.data,l=i.error}catch(i){return ve=!1,o&&(o.style.opacity="1",o.style.pointerEvents="auto"),t("Network error: "+(i?.message||i))}if(ve=!1,o&&(o.style.opacity="1",o.style.pointerEvents="auto"),l)return t("Failed to submit: "+l.message);if(n&&n.success===!1)return t(n.error||"Loan request rejected.");Ze()}function Kt(){if(!s)return;const e=Number(s.corp_loans??0),t=Number(s.corp_reputation??50),o=Number(s.corp_general_workforce??0),a=Number(s.corp_skilled_workforce??0),r=Number(s.corp_innovative_workforce??0),n=o+a+r;if(n===0){alert("Cannot restructure — no employees to lay off.");return}const l=Z("COO");l&&l.skill;const i=pe(),c=10+Math.floor(Math.random()*11),d=Math.round(n*c/100),m=Math.round(e*.07),f=Math.round(m*(2-i)),u=3+Math.floor(Math.random()*10),_=Math.max(1,Math.round(u*i)),b=Math.round(o/n*d),$=Math.round(a/n*d),w=Math.max(0,Math.min(r,d-b-$)),E=document.createElement("div");E.id="restr-overlay",E.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",E.onclick=function(x){x.target===E&&Be()},E.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:8px;color:#8b9a6b;">&#9679;</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Restructure Operations</span>
                </div>
                <span onclick="actCloseRestructure()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
        </div>
        <div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Impact Preview</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:8px 12px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">WORKFORCE REDUCTION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${d} employees (${c}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${o} &rarr; ${o-b}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${b}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${a} &rarr; ${a-$}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${$}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${r} &rarr; ${r-w}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${w}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT REDUCTION (~7%)</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${h(f)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION HIT</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${_} (${t} &rarr; ${Math.max(0,t-_)})</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#c84;margin-top:6px;">&#9888; This action cannot be undone. Laid-off workers must be re-hired.</div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${c},${f},${_},${b},${$},${w})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(E)}function Be(){const e=document.getElementById("restr-overlay");e&&e.remove()}let ye=!1;async function Wt(e,t,o,a,r,n){if(!s||!k||ye)return;ye=!0;const l=document.getElementById("restr-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const i=Number(s.corp_general_workforce??0),c=Number(s.corp_skilled_workforce??0),d=Number(s.corp_innovative_workforce??0),m=Number(s.corp_loans??0),f=Number(s.corp_reputation??50),u={corp_general_workforce:Math.max(0,i-a),corp_skilled_workforce:Math.max(0,c-r),corp_innovative_workforce:Math.max(0,d-n),corp_loans:Math.max(0,m-t),corp_reputation:Math.max(0,f-o)},{error:_}=await y.from("factions").update(u).eq("id",s.id);if(_){ye=!1;const w=document.getElementById("restr-error");w&&(w.textContent="Failed: "+_.message,w.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}Object.assign(s,u);const b=k.current_tick||0,{error:$}=await y.from("event_log").insert({nation_id:s.nation_id,faction_id:s.id,event_name:(s.faction_name||"Corporation")+" — Restructuring",description_used:(s.faction_name||"A corporation")+" has announced a restructuring, laying off "+e+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:e,debt_cut:t,rep_loss:o},fired_at_tick:b});$&&console.warn("Failed to log restructure event:",$.message),ye=!1,ie("restructure"),Be(),D()}function Xt(){const e=Z("CMO");e&&e.skill;const t=pe(),o=Math.round(2e6*t),a=Math.max(1,Math.round(5*t)),r=Number(s?.corp_cash_reserves??0),n=Number(s?.corp_reputation??50),l=s?.faction_name||"",i=s?.abbreviation||s?.corp_ticker||"",c=document.createElement("div");c.id="rebrand-overlay",c.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",c.onclick=function(d){d.target===c&&Oe()},c.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:8px;color:#c84;">&#9679;</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Rebrand Corporation</span>
                </div>
                <span onclick="actCloseRebrand()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
        </div>
        <div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">NEW CORPORATION NAME</div>
            <input id="rebrand-name" type="text" maxlength="40" value="${p(l)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${p(i)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;text-transform:uppercase;" />
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Impact</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COST</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${h(o)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${a} (${n} &rarr; ${Math.max(0,n-a)})</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">SKILL MODIFIER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">&times;${t.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${r<o?"#c55":"var(--panel-text)"};">${h(r-o)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${o},${a})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${r>=o?"pointer":"not-allowed"};${r<o?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(c)}function Oe(){const e=document.getElementById("rebrand-overlay");e&&e.remove()}let ue=!1;async function Qt(e,t){if(!s||!k||ue)return;const o=e||2e6,a=t||5,r=document.getElementById("rebrand-error"),n=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),l=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!n||n.length<2){r&&(r.textContent="Name must be at least 2 characters.",r.style.display="block");return}if(!l||l.length<2||l.length>5){r&&(r.textContent="Abbreviation must be 2-5 characters.",r.style.display="block");return}const i=Number(s.corp_cash_reserves??0);if(i<o){r&&(r.textContent="Insufficient cash. Need "+h(o)+".",r.style.display="block");return}ue=!0;const c=document.getElementById("rebrand-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const d=Number(s.corp_reputation??50),m=s.faction_name||"Corporation",{error:f}=await y.from("factions").update({faction_name:n,abbreviation:l,corp_ticker:l,corp_cash_reserves:i-o,corp_reputation:Math.max(0,d-a)}).eq("id",s.id);if(f){ue=!1,r&&(r.textContent="Failed: "+f.message,r.style.display="block"),c&&(c.style.opacity="1",c.style.pointerEvents="auto");return}s.faction_name=n,s.abbreviation=l,s.corp_ticker=l,s.corp_cash_reserves=i-o,s.corp_reputation=Math.max(0,d-a);const u=k.current_tick||0,{error:_}=await y.from("event_log").insert({nation_id:s.nation_id,faction_id:s.id,event_name:"Corporation Rebranded",description_used:m+" has rebranded to "+n+" ("+l+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:m,new_name:n,new_abbr:l,rep_loss:a,cost:o},fired_at_tick:u});_&&console.warn("Failed to log rebrand event:",_.message),ue=!1,ie("rebrand"),Oe(),D(),document.getElementById("corp-name-bar").textContent=n;const b=document.getElementById("corp-logo");b&&(b.textContent=l.slice(0,2))}const P=1e6,xe=12;let F=null,te=!1;function Jt(){F=null;const e=Number(s?.corp_cash_reserves??0),t=s?.custom_logo_url||"",o=document.createElement("div");o.id="branding-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(r){r.target===o&&Fe()};const a=t?`<img src="${p(t)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:`<span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#6a6660;">${p((s?.abbreviation||s?.corp_ticker||"??").slice(0,2))}</span>`;o.innerHTML=`<div onclick="event.stopPropagation()" style="width:460px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:8px;color:#c84;">&#9679;</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Branding</span>
                </div>
                <span onclick="actCloseBranding()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
        </div>
        <div style="padding:14px 16px;display:flex;gap:14px;align-items:center;">
            <div id="branding-preview" style="width:84px;height:84px;background:var(--bg-panel);border:1px solid var(--panel-border);border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">${a}</div>
            <div style="flex:1;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">CORPORATE LOGO</div>
                <div style="font-size:11px;color:var(--text-muted);line-height:1.4;margin-bottom:8px;">PNG, JPG, or SVG. Max 128 KB. Square images render best — non-square will be cropped to fit.</div>
                <label for="branding-file" style="display:inline-block;padding:5px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#c8a832;border:1px solid rgba(200,168,50,0.4);background:rgba(200,168,50,0.06);cursor:pointer;text-transform:uppercase;">Choose File</label>
                <input id="branding-file" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none;" onchange="actBrandingPickFile(event)" />
                <span id="branding-filename" style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-left:8px;"></span>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Impact</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COST</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${h(P)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COOLDOWN</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);">${xe} TICKS</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${e<P?"#c55":"var(--panel-text)"};">${h(e-P)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseBranding()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="branding-btn" onclick="actSubmitBranding()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${e>=P?"pointer":"not-allowed"};${e<P?"opacity:0.4;pointer-events:none;":""}">UPLOAD &amp; CONFIRM</div>
        </div>
        <div id="branding-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(o)}function Fe(){const e=document.getElementById("branding-overlay");e&&e.remove(),F=null}function Zt(e){const t=e.target.files?.[0],o=document.getElementById("branding-error"),a=document.getElementById("branding-filename");if(!t){F=null,a&&(a.textContent="");return}if(t.size>128*1024){F=null,a&&(a.textContent=""),o&&(o.textContent="File too large — must be under 128 KB.",o.style.display="block");return}F=t,o&&(o.style.display="none"),a&&(a.textContent=t.name);const r=document.getElementById("branding-preview");if(r){const n=new FileReader;n.onload=l=>{r.innerHTML=`<img src="${l.target.result}" alt="" style="width:100%;height:100%;object-fit:cover;">`},n.readAsDataURL(t)}}async function eo(){if(!s||!k||te)return;const e=document.getElementById("branding-error"),t=document.getElementById("branding-btn");if(!F){e&&(e.textContent="Choose a logo file first.",e.style.display="block");return}const o=Number(k.current_tick)||0,{data:a,error:r}=await y.from("factions").select("corp_cash_reserves, last_branding_tick").eq("id",s.id).single();if(r||!a){e&&(e.textContent="Failed to verify cooldown: "+(r?.message||"unknown"),e.style.display="block");return}const n=a.last_branding_tick==null?null:Number(a.last_branding_tick);if(n!=null&&o-n<xe){const b=xe-(o-n);e&&(e.textContent=`On cooldown — ${b} tick${b===1?"":"s"} remaining.`,e.style.display="block");return}const l=Number(a.corp_cash_reserves??0);if(l<P){e&&(e.textContent="Insufficient cash. Need "+h(P)+".",e.style.display="block");return}te=!0,t&&(t.style.opacity="0.4",t.style.pointerEvents="none",t.textContent="UPLOADING...");let i;try{const b=(F.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png",$=`party-logos/${s.id}/${Date.now()}.${b}`,{error:w}=await y.storage.from("public-assets").upload($,F,{contentType:F.type,upsert:!0});if(w)throw w;const{data:E}=y.storage.from("public-assets").getPublicUrl($);if(i=E?.publicUrl||null,!i)throw new Error("Could not resolve public URL.")}catch(b){te=!1,e&&(e.textContent="Upload failed: "+(b.message||"Unknown error"),e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}const c={custom_logo_url:i,corp_cash_reserves:l-P,last_branding_tick:o};let d=y.from("factions").update(c).eq("id",s.id);d=n==null?d.is("last_branding_tick",null):d.eq("last_branding_tick",n);const{data:m,error:f}=await d.select("id");if(f){te=!1,e&&(e.textContent="Failed: "+f.message,e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}if(!m||m.length===0){te=!1,e&&(e.textContent="Branding is on cooldown. Refresh to see the latest state.",e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}s.custom_logo_url=i,s.corp_cash_reserves=l-P,s.last_branding_tick=o;const{error:u}=await y.from("event_log").insert({nation_id:s.nation_id,faction_id:s.id,event_name:"Corporation Rebranded (Logo)",description_used:`${s.faction_name||"Corporation"} unveiled a new corporate logo.`,category:"corporate",trigger_key:"corp_branding",effects_applied:{logo_url:i,cost:P,cooldown_ticks:xe},fired_at_tick:o});u&&console.warn("Failed to log branding event:",u.message),te=!1,Fe(),D();const _=document.getElementById("corp-logo");_&&(_.innerHTML=`<img src="${i}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`)}window.actBrandingPickFile=Zt;window.actSubmitBranding=eo;window.actCloseBranding=Fe;let W=[],Y=-1;async function to(){Number(s?.corp_cash_reserves??0);const e=[s.nation_id],t=new Set(U.map(r=>r.id)),{data:o}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id").eq("faction_type","party").in("nation_id",e).is("abandoned_at",null).order("seats",{ascending:!1});W=(o||[]).filter(r=>!t.has(r.id)).map(r=>({...r})),Y=-1;const a=document.createElement("div");a.id="donate-overlay",a.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",a.onclick=function(r){r.target===a&&qe()},document.body.appendChild(a),et()}function qe(){const e=document.getElementById("donate-overlay");e&&e.remove(),W=[],Y=-1}function oo(e){Y=e,et()}function et(){const e=document.getElementById("donate-overlay");if(!e)return;const t=Z("Lobbyist");t&&t.skill;const o=Math.round(1e6*pe()),a=1e5,r=Number(s?.corp_cash_reserves??0),n=Y>=0?W[Y]:null,l=r>=o;let i='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';i+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#8a6aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Political Donation</span>
            </div>
            <span onclick="actCloseDonation()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Cost:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#ca5;">${h(o)}</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">&rarr; Target party receives</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#5cb85c;">+${h(a)}</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in the nation where your National HQ is located. You cannot donate to your own party.</div>
    </div>`,i+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',i+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',W.length===0&&(i+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let c=0;c<W.length;c++){const d=W[c],m=Y===c,f=d.party_color||"#8a6aaa",u=(d.momentum||0)>0?"var(--panel-text)":"#c55";i+=`<div onclick="donateSelectParty(${c})" style="
            padding:10px 20px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${m?f:"transparent"};
            background:${m?f+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${f};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${m?"var(--panel-text)":"#9e9a92"};">${p(d.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${p(d.abbreviation||"??")} &middot; ${p(d.nation||"")} &middot; ${d.seats||0} seats</span>
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${h(d.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${u};font-weight:700;">${Number(d.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${m?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}i+="</div>",i+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${h(o)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l?"var(--panel-text)":"#c55"};">${h(r)}</div></div>
            ${n?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${p(n.abbreviation||n.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${n&&l?"#000":"#6a6660"};background:${n&&l?"#8a6aaa":"var(--panel-border)"};cursor:${n&&l?"pointer":"not-allowed"};${!n||!l?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,i+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',i+="</div>",e.innerHTML=i}let oe=!1;async function no(){if(!s||!k||Y<0||oe)return;const e=W[Y];if(!e)return;const t=Number(k?.current_tick||0);if(new Set(U.map(g=>g.id)).has(e.id)){const g=document.getElementById("donate-error");g&&(g.textContent="You cannot donate to your own party.",g.style.display="block");return}const a=Z("Lobbyist"),r=a?a.skill:50,n=Math.round(1e6*pe()),l=1e5,i=2,{data:c,error:d}=await y.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",s.id).single();if(d||!c){const g=document.getElementById("donate-error");g&&(g.textContent="Failed to verify cooldown: "+(d?.message||"unknown"),g.style.display="block");return}const m=Number(c.last_donation_tick??0);if(m===t){const g=document.getElementById("donate-error");g&&(g.textContent="Political Donation is on cooldown until next tick.",g.style.display="block"),ie("donate");return}const f=Number(c.corp_cash_reserves??0);if(f<n){const g=document.getElementById("donate-error");g&&(g.textContent="Insufficient cash. Need "+h(n)+", have "+h(f)+".",g.style.display="block");return}oe=!0;const u=document.getElementById("donate-btn");u&&(u.style.opacity="0.4",u.style.pointerEvents="none");const _=Number(s.corp_reputation??50),b=Math.max(0,_-i),{data:$,error:w}=await y.from("factions").update({corp_cash_reserves:f-n,corp_reputation:b,last_donation_tick:t}).eq("id",s.id).eq("last_donation_tick",m).select("id");if(w){const g=document.getElementById("donate-error");oe=!1,g&&(g.textContent="Failed: "+w.message,g.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}if(!$||$.length===0){const g=document.getElementById("donate-error");oe=!1,g&&(g.textContent="Political Donation is on cooldown until next tick.",g.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto"),ie("donate");return}const{data:E}=await y.from("factions").select("party_funds").eq("id",e.id).single(),x=Number(E?.party_funds??0),{error:C}=await y.from("factions").update({party_funds:x+l}).eq("id",e.id);if(C){await y.from("factions").update({corp_cash_reserves:f}).eq("id",s.id);const g=document.getElementById("donate-error");oe=!1,g&&(g.textContent="Failed to transfer funds: "+C.message,g.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}s.corp_cash_reserves=f-n,s.corp_reputation=b;const R=s.faction_name||"Corporation",{error:T}=await y.from("event_log").insert({nation_id:e.nation_id||s.nation_id,faction_id:s.id,event_name:R+" — Political Donation",description_chosen:R+" has donated "+h(n)+" to "+(e.faction_name||"a political party")+". The party receives "+h(l)+" in campaign funds. Corporate reputation decreases by "+i+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:n,recipient_faction_id:e.id,recipient_name:e.faction_name,funds_granted:l,reputation_loss:i,skill:r},fired_at_tick:t});T&&console.warn("Failed to log donation event:",T.message),oe=!1,ie("donate"),qe()}const re=1e5;let M=[],V=null,S=0,ne=!1,le=!1;async function ao(){M=[],V=null,S=0,ne=!1,le=!0;const e=document.createElement("div");if(e.id="paydown-overlay",e.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",e.onclick=function(a){a.target===e&&De()},document.body.appendChild(e),Q(),!s?.id){le=!1,Q();return}const{data:t,error:o}=await y.from("bank_loans").select("id, principal, outstanding, apr, issued_at_tick, matures_at_tick, status, lender:lender_faction_id(faction_name, abbreviation)").eq("borrower_faction_id",s.id).in("status",["active","called"]).gt("outstanding",0).order("issued_at_tick",{ascending:!0});o?(console.warn("[PayDown] failed to load loans:",o.message),M=[]):M=t||[],le=!1,Q()}function De(){const e=document.getElementById("paydown-overlay");e&&e.remove(),M=[],V=null,S=0,ne=!1,le=!1}function io(e){V=e;const t=M.find(r=>r.id===e),o=Number(s?.corp_cash_reserves??0),a=Math.max(0,o-re);t?S=Math.min(Number(t.outstanding)||0,a):S=0,Q()}function ro(e){const t=M.find(l=>l.id===V);if(!t){S=0,Q();return}const o=Number(s?.corp_cash_reserves??0),a=Math.max(0,o-re),r=Math.min(Number(t.outstanding)||0,a);let n=Number(String(e).replace(/[^0-9.]/g,""))||0;n=Math.max(0,Math.min(r,Math.floor(n))),S=n,Q()}function so(){const e=M.find(a=>a.id===V);if(!e)return;const t=Number(s?.corp_cash_reserves??0),o=Math.max(0,t-re);S=Math.min(Number(e.outstanding)||0,o),Q()}function Q(){const e=document.getElementById("paydown-overlay");if(!e)return;const t=Number(s?.corp_cash_reserves??0),o=M.find(i=>i.id===V)||null,a=o?S+re:0,r=o&&a>0&&t>=a&&S>0,n=o&&S>0&&S>=Number(o.outstanding||0);let l='<div onclick="event.stopPropagation()" style="width:620px;max-height:84vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';if(l+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Pay Down Debt</span>
            </div>
            <span onclick="actClosePayDown()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:6px;">Retire outstanding loan principal early. Pays down a single loan; the lender is credited the same amount. <span style="color:#ca5;">$100k admin fee</span> is charged on top of the payment. Paying a loan off in full grants <span style="color:#5cb85c;">+1 Reputation</span>.</div>
    </div>`,l+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',l+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Loan</div>',le)l+='<div style="padding:24px 20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">Loading…</div>';else if(M.length===0)l+='<div style="padding:24px 20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No active loans to pay down.</div>';else for(const i of M){const c=i.id===V,d=i.lender?.faction_name||"Unknown Lender",m=i.lender?.abbreviation||"",f=Number(i.apr||0).toFixed(2),u=Math.max(0,Number(i.matures_at_tick||0)-Number(k?.current_tick||0)),_=i.status==="called"?"#c55":"#5cb85c";l+=`<div onclick="paydownSelectLoan('${i.id}')" style="
                padding:10px 20px;
                border-bottom:1px solid var(--panel-border);
                border-left:3px solid ${c?"#5a8aaa":"transparent"};
                background:${c?"rgba(90,138,170,0.06)":"transparent"};
                cursor:pointer;
            ">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${c?"var(--panel-text)":"#9e9a92"};">${p(d)}</span>
                            ${m?`<span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${p(m)}</span>`:""}
                            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;color:${_};text-transform:uppercase;">${p(i.status)}</span>
                        </div>
                        <div style="display:flex;gap:14px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">Outstanding: <span style="color:var(--panel-text);font-weight:700;">${h(i.outstanding)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">Principal: <span style="color:#9e9a92;">${h(i.principal)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">APR: <span style="color:#ca5;">${f}%</span></span>
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">Matures in: <span style="color:#9e9a92;">${u}t</span></span>
                        </div>
                    </div>
                    ${c?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
                </div>
            </div>`}if(l+="</div>",o){const i=Math.max(0,t-re),c=Math.min(Number(o.outstanding||0),i);l+=`<div style="padding:14px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;letter-spacing:0.8px;text-transform:uppercase;flex-shrink:0;">Amount</span>
                <input type="text" value="${S}" oninput="paydownSetAmount(this.value)" style="flex:1;padding:6px 10px;font-family:var(--font-mono);font-size:13px;background:var(--bg-2,#1a1a17);border:1px solid var(--panel-border);color:var(--panel-text);outline:none;" />
                <span onclick="paydownMaxAmount()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.5px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.4);background:rgba(90,138,170,0.06);cursor:pointer;">MAX</span>
            </div>
            <div style="display:flex;gap:16px;font-family:var(--font-mono);font-size:10px;color:#6a6660;">
                <span>Max: <span style="color:#9e9a92;font-weight:700;">${h(c)}</span></span>
                <span>+ Admin: <span style="color:#ca5;font-weight:700;">${h(re)}</span></span>
                <span>= Total: <span style="color:${r?"var(--panel-text)":"#c55"};font-weight:700;">${h(a)}</span></span>
                ${n?'<span style="color:#5cb85c;font-weight:700;">PAYS OFF IN FULL · +1 REP</span>':""}
            </div>
        </div>`}l+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${t>=a?"var(--panel-text)":"#c55"};">${h(t)}</div></div>
            ${o?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CHARGE</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${h(a)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actClosePayDown()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="paydown-btn" onclick="${r?"actSubmitPayDown()":""}" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${r?"#000":"#6a6660"};background:${r?"#5a8aaa":"var(--panel-border)"};cursor:${r?"pointer":"not-allowed"};${r?"":"opacity:0.4;pointer-events:none;"}">CONFIRM</div>
        </div>
    </div>
    <div id="paydown-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>`,l+="</div>",e.innerHTML=l}async function lo(){if(ne)return;const e=M.find(d=>d.id===V);if(!e||!s||S<=0)return;const t=()=>document.getElementById("paydown-error"),o=d=>{const m=t();m&&(m.textContent=d,m.style.display="block")};ne=!0;const a=document.getElementById("paydown-btn");a&&(a.style.opacity="0.4",a.style.pointerEvents="none");const{data:r,error:n}=await y.rpc("pay_down_debt",{p_borrower_id:s.id,p_loan_id:e.id,p_amount:S});if(n){ne=!1,a&&(a.style.opacity="1",a.style.pointerEvents="auto"),o("RPC failed: "+n.message);return}if(!r?.success){ne=!1,a&&(a.style.opacity="1",a.style.pointerEvents="auto"),o(r?.error||"Payment failed.");return}const{data:l,error:i}=await y.from("factions").select("corp_cash_reserves, corp_reputation, corp_debt").eq("id",s.id).single();i?console.warn("[PayDown] post-RPC faction refresh failed:",i.message):l&&(s.corp_cash_reserves=l.corp_cash_reserves,s.corp_reputation=l.corp_reputation,s.corp_debt=l.corp_debt),De(),D();const c=document.getElementById("corp-topbar-container");c&&Ve(c,{faction:s,shard:k,activeTab:"actions",allUserFactions:U})}function co(e){ae=e,D()}async function po(e){if(H=e,q=-1,document.getElementById("exec-search-overlay").style.display="flex",de.length===0&&s?.nation_id){const t=s.nation||"",o=Ke(s.nation_id,t),{error:a}=await y.from("executive_pool").insert(o);a&&console.warn("Failed to generate executive pool:",a.message);const{data:r,error:n}=await y.from("executive_pool").select("*").eq("nation_id",s.nation_id).eq("status","available").order("skill",{ascending:!1});n&&console.warn("Failed to reload executive pool:",n.message),de=r||[]}je()}function tt(){document.getElementById("exec-search-overlay").style.display="none",H=null,q=-1}let Se=!1;async function fo(){if(Se||!s?.nation_id)return;const e=document.getElementById("exec-search-refresh");Se=!0,e&&(e.style.opacity="0.5",e.style.cursor="wait",e.textContent="Refreshing…");try{const t=s.nation||"",o=Ke(s.nation_id,t),{error:a}=await y.from("executive_pool").insert(o);if(a){console.warn("Failed to refresh executive pool:",a.message);return}const{data:r,error:n}=await y.from("executive_pool").select("*").eq("nation_id",s.nation_id).eq("status","available").order("skill",{ascending:!1});if(n){console.warn("Failed to reload executive pool after refresh:",n.message);return}de=r||[],q=-1,je()}finally{Se=!1}}function ot(e){return de.filter(t=>t.status==="available"&&Array.isArray(t.specializations)&&t.specializations.includes(e)).sort((t,o)=>o.skill-t.skill)}function mo(e){q=e,je()}let ge=!1;async function vo(){if(!s||!k||!H||q<0||ge)return;const t=ot(H)[q];if(!t)return;ge=!0;const o=k.current_tick||0,a=document.getElementById("es-hire-btn");a&&(a.style.opacity="0.4",a.style.pointerEvents="none");const{error:r}=await y.from("corp_executives").insert({faction_id:s.id,role:H,first_name:t.first_name,last_name:t.last_name,age:t.age,origin_nation:t.origin_nation,skill:t.skill,salary_per_year:t.required_salary,contract_years:t.required_years,contract_start_tick:o,contract_end_tick:o+t.required_years*12,status:"active"});if(r){ge=!1;const l=document.getElementById("es-error");l&&(l.textContent="Failed: "+r.message,l.style.display="block"),a&&(a.style.opacity="1",a.style.pointerEvents="auto");return}const{error:n}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:s.id}).eq("id",t.id);n&&console.warn("Failed to mark pool candidate as hired:",n.message),ge=!1,tt(),await Ae(),ae=be.indexOf(H),ae<0&&(ae=0),D()}function je(){const e=document.getElementById("exec-search-content");if(!e||!H)return;const t=H,o=he[t],a=ot(t),r=q>=0?a[q]:null;let n="";n+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${o.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <div style="display:flex;align-items:center;gap:14px;">
                <span onclick="refreshExecPool()" id="exec-search-refresh" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1.5px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.4);background:rgba(90,138,170,0.08);padding:4px 10px;cursor:pointer;text-transform:uppercase;">Refresh Pool</span>
                <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${o.color};">${p(t)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${p(o.fullTitle)}</span>
        </div>
    </div>`,n+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',n+='<div style="width:300px;border-right:1px solid var(--panel-border);overflow-y:auto;flex-shrink:0;">',a.length===0&&(n+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let l=0;l<a.length;l++){const i=a[l],c=q===l;n+=`<div onclick="esSelectCandidate(${l})" style="
            padding:10px 14px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${c?o.color:"transparent"};
            background:${c?o.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${o.color}10;border:1px solid ${o.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o.color};flex-shrink:0;">${p(Ie(i.first_name,i.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p(i.first_name)} ${p(i.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Age ${i.age||"—"}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">·</span>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${K(i.required_salary)}/yr</span>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">·</span>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${i.required_years||0}yr term</span>
                    </div>
                </div>
            </div>
        </div>`}if(n+="</div>",n+='<div style="flex:1;overflow-y:auto;">',!r)n+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${a.length} candidate${a.length!==1?"s":""} available for ${p(t)}</div>
        </div>`;else{const l=r.required_salary*r.required_years;n+=`<div style="padding:20px;border-bottom:1px solid var(--panel-border);">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${o.color}12;border:1px solid ${o.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${o.color};">${p(Ie(r.first_name,r.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${p(r.first_name)} ${p(r.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${p(r.origin_nation)} &middot; Age ${r.age}</div>
                </div>
            </div>
        </div>`,n+=`<div style="display:flex;gap:0;border-bottom:1px solid var(--panel-border);">
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">AGE</div>
                <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${r.age}</div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">ORIGIN</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${p(r.origin_nation)}</div>
            </div>
        </div>`,n+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const i of r.specializations||[]){const c=he[i],d=i===t;n+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${d?"#000":c?.color||"#9e9a92"};background:${d?c?.color||"#5a8aaa":(c?.color||"#5a8aaa")+"10"};border:1px solid ${d?"transparent":(c?.color||"#5a8aaa")+"30"};">${p(i)}</span>`}n+="</div></div>",n+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${r.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${K(r.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${K(l)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`}n+="</div>",n+="</div>",n+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,r?n+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${p(r.first_name)} ${p(r.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${K(r.required_salary)}/yr</div></div>`:n+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',n+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${r?"#000":"#6a6660"};background:${r?o.color:"var(--panel-border)"};cursor:${r?"pointer":"not-allowed"};${r?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,n+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',e.innerHTML=n}async function yo(){const{data:{user:e}}=await y.auth.getUser();if(!e){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(t){const{data:n,error:l}=await y.from("factions").select("*").eq("id",t).single();l?console.warn("[Inspector] faction fetch failed:",l.message):n?.faction_type==="corporation"&&(s=n)}if(!s){const{data:n}=await y.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);U=(n||[]).filter(i=>i.nation_id);const l=sessionStorage.getItem("active_faction_id");if(s=U.find(i=>i.id===l)||U.find(i=>i.faction_type==="corporation")||U[0],!s){await y.auth.signOut(),window.location.href="login.html";return}if(s.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[o,a]=await Promise.all([s.nation_id?y.from("nations").select("*").eq("id",s.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);o.data&&o.data,k=a.data;const r=document.getElementById("corp-topbar-container");r&&Ve(r,{faction:s,shard:k,activeTab:"actions",allUserFactions:U}),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",await Promise.all([Et(),Ae()]),D()}window.actExecute=At;window.actSelectExec=co;window.confirmFireExec=Mt;window.actCloseStatement=Le;window.actSubmitStatement=Bt;window.actCloseRestructure=Be;window.actSubmitRestructure=Wt;window.actCloseRebrand=Oe;window.actSubmitRebrand=Qt;window.actCloseDonation=qe;window.actSubmitDonation=no;window.donateSelectParty=oo;window.actClosePayDown=De;window.actSubmitPayDown=lo;window.paydownSelectLoan=io;window.paydownSetAmount=ro;window.paydownMaxAmount=so;window.lrClose=Ze;window.lrSetAmount=Ft;window.lrToggleBank=qt;window.lrToggleCollateral=Ut;window.lrToggleSelectAll=Dt;window.lrSelectAllInMyNation=jt;window.lrSubmit=Vt;window.openExecSearch=po;window.closeExecSearch=tt;window.refreshExecPool=fo;window.esSelectCandidate=mo;window.esHireCandidate=vo;yo();
