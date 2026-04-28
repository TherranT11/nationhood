import{_supabase as x}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{r as Fe}from"./role-actions-fros7AI4.js";import{escapeHtml as v,hfFmtBig as h}from"./utils-A98FEun4.js";import{renderCorpTopBar as qe}from"./corp-topbar-CPI0igZM.js";import{c as Be}from"./corp-valuation-C0hsb2EQ.js";import{E as se,a as le,c as Ue,g as De}from"./corp-executives-C6ZPFGg5.js";import"./preload-helper-BXl3LOEh.js";import"./political-actions-DKWURJip.js";import"./config-CKNXR-qR.js";import"./government-structure-DUNrPmll.js";import"./stats-tIiBSaQA.js";function oe(e){if(e==null)return"";const t=document.createElement("div");return t.textContent=String(e),t.innerHTML}function je(e,t){return(e||"?")[0]+(t||"?")[0]}function He(e){return e>=70?"#5cb85c":e>=50?"#ca5":"#c84"}function Ye(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function he(e){const t=Number(e)||0,n=Math.abs(t),i=n>=1e9?(n/1e9).toFixed(1)+"B":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?Math.round(n/1e3)+"k":String(Math.round(n));return(t<0?"-$":"$")+i}function Ve(e,t){if(!e)return;const{faction:n,shard:i,ownedProperties:o=[],vessels:a=[],executives:s=[],selectedExecIdx:l=0}=t||{},c=n?.faction_name||"Corporation",d=(n?.abbreviation||n?.corp_ticker||"??").toUpperCase(),y=n?.corp_sector||"",u=n?.corp_subsector||"",f=Number(n?.corp_cash_reserves||0),m=Number(n?.corp_loans||0),p=Be({cash:f,loans:m,properties:o,vessels:a,financeReceivables:0,currentTick:i?.current_tick||0}),g=Number(n?.corp_reputation??50),_=Math.max(0,Math.min(100,Math.round(Number.isFinite(g)?g:50))),N=_>=60?"var(--green)":_>=40?"var(--text-bright)":"var(--red)",E=o.length,O=p<0?"var(--red)":"var(--green)";Fe(e,{title:"Corporate Actions",entityName:`${c} · ${d}`,entityColor:"#8b9a6b",stats:[{label:"Cash",value:he(f),color:"var(--accent)"},{label:"Reputation",value:String(_),color:N},{label:"Valuation",value:he(p),color:O}],statusBarItems:[{type:"count",label:"Sector",big:y||"—",bigColor:"#8b9a6b",dim1:u||""},{type:"count",label:"Properties",big:String(E),bigColor:"#8b9a6b",dim1:E===1?"building":"buildings"}],rolesContainerId:"corp-exec-list",panelContainerId:"corp-actions-panel",rolesColumnWidth:262});const Y=document.getElementById("corp-exec-list");if(Y){const b=new Map(s.map(z=>[z.role,z]));let K="";for(let z=0;z<se.length;z++){const P=se[z],Ae=le[P],k=b.get(P)||null,te=l===z,S=Ae.color,Me=!k;if(K+=`<div onclick="actSelectExec(${z})" style="
                padding:10px 12px;
                background:${te?S+"0a":"var(--bg-2,#1a1a17)"};
                border:1px solid ${te?S+"44":"var(--border-0,rgba(255,255,255,0.06))"};
                border-left:3px solid ${te?S:"var(--border-0,rgba(255,255,255,0.06))"};
                cursor:pointer;
            ">`,Me&&P!=="CEO")K+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${S};">${oe(P)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                        <div style="margin-top:4px;">
                            <span onclick="event.stopPropagation();openExecSearch('${P}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                        </div>
                    </div>
                </div>`;else{const Le=k?`${k.first_name} ${k.last_name}`:"—",be=k?k.age:0,de=k?k.skill:0,Oe=k?k.salary_per_year:0,Pe=k?je(k.first_name,k.last_name):"—";K+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background:${S}15;border:1px solid ${S}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${S};flex-shrink:0;">${oe(Pe)}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${S};">${oe(P)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:${te?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${oe(Le)}${be?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${be})</span>`:""}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                            <div style="display:flex;align-items:center;gap:3px;flex:1;">
                                <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                    <div style="width:${de}%;height:100%;background:${He(de)};"></div>
                                </div>
                                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${de}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${Ye(Oe)}/yr</span>
                        </div>
                    </div>
                </div>`}K+="</div>"}Y.innerHTML=K}const V=document.getElementById("corp-actions-panel");V&&(V.innerHTML='<div id="actions-right-panel"></div>')}const Ke=1e6,Ge=1e10,_e=1,we=50,We=12;function Xe(e){if(e<0)return"A";const t=Math.min(e,25);return String.fromCharCode(65+t)}async function Qe(e,t,n){if(!e||!t||!n)return;if((e.corp_sector||"").toLowerCase()==="finance"){alert("Finance-sector corps fund equity; they do not raise it.");return}const i=prompt(`APPLY FOR EQUITY — STEP 1 / 3

How much capital do you want to raise? (in millions USD)

Example: 50 for a $50M raise.
Range: $1M – $10B.`);if(i===null)return;const o=parseFloat(i);if(isNaN(o)||o<=0){alert("Amount must be a positive number.");return}const a=Math.round(o*1e6);if(a<Ke){alert("Minimum raise is $1M.");return}if(a>Ge){alert("Maximum raise is $10B.");return}const s=prompt(`APPLY FOR EQUITY — STEP 2 / 3

What stake are you offering in exchange? (percent)

Example: 12.5 for a 12.5% share of monthly profits.
Range: 1% – 50%.`);if(s===null)return;const l=parseFloat(s);if(isNaN(l)||l<_e||l>we){alert(`Stake must be between ${_e}% and ${we}%.`);return}const c=prompt(`APPLY FOR EQUITY — STEP 3 / 3

Describe the purpose of this raise.

Example: "Series B to fund fleet expansion across Mira ports."
Investment corps see this in Deal Flow when deciding whether to fund you.`);if(c===null)return;const d=(c||"").trim()||"Equity capital raise",{data:y,error:u}=await n.from("finance_loan_requests").select("id").eq("requesting_faction_id",e.id).eq("request_type","equity").eq("status","funded");if(u){alert("Could not look up prior raises: "+u.message);return}const f=Xe((y||[]).length),m=`Post Series ${f} equity raise?

Amount:   $${o}M
Stake:    ${l}%
Series:   ${f}
Purpose:  ${d}

This becomes visible to Investment corps in Deal Flow. Once an investor buys in, your corp pays them ${l}% of monthly profit each tick.`;if(!confirm(m))return;const p=Number(t.current_tick||0),{error:g}=await n.from("finance_loan_requests").insert({requesting_faction_id:e.id,nation_id:e.nation_id,request_type:"equity",amount:a,equity_pct:l,series:f,term_months:120,purpose:d,status:"open",created_tick:p,expires_tick:p+We});if(g){alert("Failed to post equity raise: "+g.message);return}try{const _=e.faction_name+" ["+(e.abbreviation||e.corp_ticker||"??")+"]";await n.from("event_log").insert({nation_id:e.nation_id,event_name:"Series "+f+" Raise Opened",category:"corporate",faction_id:e.id,description_used:_+" has started the process of raising their series "+f+" and seeks investors.",fired_at_tick:p})}catch(_){console.warn("[equity-apply] Event log insert failed:",_?.message||_)}alert(`Series ${f} raise posted to Deal Flow. Investment corps can now fund you.`)}let pe=!1;async function Ze(){if(pe)return;const{data:{user:e}}=await x.auth.getUser();if(!e){alert("Not logged in.");return}const t=sessionStorage.getItem("active_faction_id");if(!t){alert("No active faction selected.");return}const{data:n,error:i}=await x.from("factions").select("id, faction_name, corp_sector, faction_type, abandoned_at").eq("id",t).single();if(i||!n||n.faction_type!=="corporation"||n.abandoned_at){alert("No active corporation found. It may have already been dissolved.");return}const o=n.faction_name||"this corporation";if(!confirm("DECLARE BANKRUPTCY — "+o.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+o+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}pe=!0;try{const{data:s,error:l}=await x.rpc("declare_corp_bankruptcy",{p_faction_id:t});if(l)throw l;const c=Number(s?.total_payback||0),d=c>0?`
$`+c.toLocaleString()+" repaid to creditors.":"";sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:y,error:u}=await x.from("factions").select("id, faction_type").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);u&&console.warn("[Bankruptcy] remaining-factions lookup failed:",u.message);const f=(y||[]).find(p=>p.faction_type==="party"),m=(y||[]).find(p=>p.faction_type==="corporation");f?(sessionStorage.setItem("active_faction_id",f.id),alert(o+" has declared bankruptcy."+d+`

Redirecting to your political party.`),window.location.href="dashboard.html"):m?(sessionStorage.setItem("active_faction_id",m.id),alert(o+" has declared bankruptcy."+d+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(o+" has declared bankruptcy."+d+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(s){alert("Bankruptcy failed: "+(s?.message||s)+`

Please try again or contact support.`)}finally{pe=!1}}let A=[],r=null,w=null,D=[],Z=[],q=0,R=null,T=-1,ke=[];async function Je(){if(!r?.id)return;const{data:e}=await x.from("corp_properties").select("*").eq("faction_id",r.id).eq("is_active",!0);ke=e||[]}async function $e(){if(!r)return;const[e,t]=await Promise.all([x.from("corp_executives").select("*").eq("faction_id",r.id).eq("status","active"),x.from("executive_pool").select("*").eq("nation_id",r.nation_id).eq("status","available").order("skill",{ascending:!1})]);e.error&&console.warn("Failed to load executives:",e.error.message),t.error&&console.warn("Failed to load executive pool:",t.error.message),D=e.data||[],Z=t.data||[];const n=await Ue({supabase:x,faction:r,currentTick:w?.current_tick||0,poolCandidates:Z});n?.error&&console.warn("Failed to seed initial executive roster:",n.error.message||n.error),n?.executives&&(D=n.executives)}function W(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function L(e){return D.find(t=>t.role===e)||null}function me(e,t){return(e||"?")[0]+(t||"?")[0]}function Q(e){return e>=70?"#5cb85c":e>=50?"#ca5":"#c84"}function j(){const e=document.getElementById("actions-container");e&&(Ve(e,{faction:r,shard:w,ownedProperties:ke,vessels:[],executives:D,selectedExecIdx:q}),tt())}const Ee={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]},{id:"equity",name:"Apply for Equity",desc:"Raise capital by offering Investment corps a stake in your monthly profits. Series (A/B/C…) is auto-assigned by your prior funded raise count. No repayment — investors get a percentage of profit each tick going forward.",cost:"FREE",costColor:"#c89a4a",tags:["FINANCIAL","STRUCTURAL"],hideForSector:"Finance"}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function ee(e){return 1.5-e/100}let Ce={};function et(e){const t=w?.current_tick||0;return Ce[e]===t}function B(e){const t=w?.current_tick||0;Ce[e]=t}function tt(){const e=document.getElementById("actions-right-panel");if(!e)return;const t=se[q],n=le[t],i=L(t),o=(Ee[t]||[]).filter(s=>!s.hideForSector||(r?.corp_sector||"")!==s.hideForSector);if(!i){e.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${n.color};margin-bottom:6px;">${v(t)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${v(n.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${t}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${n.color}15;border:1px solid ${n.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${n.color};">${v(me(i.first_name,i.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${n.color};">${v(t)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${v(i.first_name)} ${v(i.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${v(n.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${i.skill}%;height:100%;background:${Q(i.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${Q(i.skill)};">${i.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${W(i.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${i.contract_years}yr</div>
            </div>
            ${t!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${i.id}','${v(t)}','${v(i.first_name+" "+i.last_name)}',${i.salary_per_year},${i.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let s=0;s<o.length;s++){const l=o[s],c=!!l.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${c?"transparent":n.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${s<o.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${c?"0.4":"1"};
            cursor:${c?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${c?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${v(l.name)}</span>`;for(const d of l.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${d==="IRREVERSIBLE"?"#c55":d==="OFFENSIVE"?"#c84":d==="STRUCTURAL"?"#ca5":d==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${v(d)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l.costColor};">${v(l.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${c?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${v(l.desc)}</div>`,l.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${v(l.descRed)}</div>`),c&&l.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${v(l.lockReason)}</span>
            </div>`),c||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${l.id}','${t}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${n.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${n.color};font-weight:700;">${v(t)}</span> skill (${i.skill}/100) affects action outcomes.
            ${i.skill>=70?" High skill increases success probability and reduces costs.":i.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,e.innerHTML=a,e.querySelectorAll("[onmouseenter]").forEach(s=>{s.addEventListener("mouseenter",function(){const l=this.querySelector(".act-exec-btn");l&&(l.style.display="block")}),s.addEventListener("mouseleave",function(){const l=this.querySelector(".act-exec-btn");l&&(l.style.display="none")})})}function ot(e,t,n,i,o){const a=w?.current_tick||0,s=Math.max(0,o-a),l=Math.round(i*(s/12)),c=`FIRE ${t}: ${n}

Contract remaining: ${s} ticks
Payout (prorated): $${(l/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(c)&&nt(e,t,l)}async function nt(e,t,n){try{const i=Number(r?.corp_cash_reserves??0);if(i<n){alert(`Insufficient funds. You need $${(n/1e6).toFixed(2)}M but only have $${(i/1e6).toFixed(2)}M.`);return}const o=i-n,{error:a}=await x.from("factions").update({corp_cash_reserves:o}).eq("id",r.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:s}=await x.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",e);if(s){await x.from("factions").update({corp_cash_reserves:i}).eq("id",r.id),alert("Failed to fire executive: "+s.message);return}r.corp_cash_reserves=o,D=D.filter(l=>l.id!==e),j()}catch(i){console.error("[CorpOps] Fire executive error:",i),alert("An error occurred.")}}function it(e,t){if((Ee[t]||[]).find(i=>i.id===e)?.cooldown==="once/tick"&&et(e)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(e){case"statement":return at();case"loan":return st();case"equity":return Qe(r,w,x);case"restructure":return vt();case"rebrand":return xt();case"donate":return gt();case"bankruptcy":return Ze()}}let ve=!1;function at(){if(ve)return;ve=!0;const e=document.createElement("div");e.id="stmt-overlay",e.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",e.onclick=function(c){c.target===e&&ye()};const t=r?.faction_name||"Corporation",n=(r?.abbreviation||r?.corp_ticker||"??").toUpperCase(),i=Number(r?.corp_cash_reserves??0),o=L("CEO"),a=o?`${o.first_name} ${o.last_name}`:"CEO";e.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${v(n)}</span>
                <span style="font-size:10px;color:var(--panel-text);">${v(t)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${v(a)}</span>
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
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i<2e4?"#c55":"var(--panel-text)"};">${h(i)}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="actCloseStatement()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
                    <div id="stmt-submit-btn" onclick="actSubmitStatement()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c8a832;cursor:pointer;">PUBLISH</div>
                </div>
            </div>
            <div id="stmt-error" style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
        </div>
    </div>`,document.body.appendChild(e);const s=document.getElementById("stmt-text"),l=document.getElementById("stmt-chars");s&&l&&(s.addEventListener("input",function(){l.textContent=this.value.length+"/500"}),s.focus())}function ye(){const e=document.getElementById("stmt-overlay");e&&e.remove(),ve=!1}let G=!1;async function rt(){if(!r||!w||G)return;const e=document.getElementById("stmt-text"),t=document.getElementById("stmt-error"),n=(e?.value||"").trim();if(!n){t&&(t.textContent="Statement cannot be empty.",t.style.display="block");return}if(n.length>500){t&&(t.textContent="Statement too long (max 500 chars).",t.style.display="block");return}const i=L("CEO"),o=i?i.skill:50,a=Math.round(2e4*ee(o)),s=Number(r.corp_cash_reserves??0);if(s<a){t&&(t.textContent="Insufficient cash. Need "+h(a)+".",t.style.display="block");return}G=!0;const l=document.getElementById("stmt-submit-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const c=r.faction_name||"Corporation",d=i?`${i.first_name} ${i.last_name}`:"CEO",y=w.current_tick||0,{error:u}=await x.from("factions").update({corp_cash_reserves:s-a}).eq("id",r.id);if(u){G=!1,t&&(t.textContent="Failed to deduct cost: "+u.message,t.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}const{error:f}=await x.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:c+" — Press Release",description_used:d+", CEO of "+c+': "'+n.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:d,skill:o},fired_at_tick:y});if(f){await x.from("factions").update({corp_cash_reserves:s}).eq("id",r.id),G=!1,t&&(t.textContent="Failed to publish: "+f.message,t.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}r.corp_cash_reserves=s-a,G=!1,B("statement"),ye()}const ze=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],fe=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let $=25e7,J="equipment",U=48,C="equipment",ce="",X=[];function st(){$=25e7,J="equipment",U=48,C="equipment",ce="",document.getElementById("lr-overlay").style.display="flex",ft(),H()}function Se(){document.getElementById("lr-overlay").style.display="none"}function lt(e){$=Math.max(1e6,Math.min(5e9,Number(e)||0)),H()}function ct(e){J=e,H()}function dt(e){U=e,H()}function pt(e){C=e,H()}async function ft(){if(!r)return;const{data:e}=await x.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",r.id);X=e||[],H()}function H(){const e=document.getElementById("lr-modal-content");if(!e)return;const t=Number(r?.corp_cash_reserves??0),n=Number(r?.corp_loans??0),i=Number(r?.corp_reputation??50),o=r?.faction_name||"Corporation",a=(r?.abbreviation||r?.corp_ticker||"??").toUpperCase(),s=n+$,l=s>t*3?"#c55":s>t*1.5?"#c84":s>t?"#ca5":"#5c5",c=s>t*3?"DANGEROUS":s>t*1.5?"HEAVY":s>t?"MODERATE":"HEALTHY",d=C==="none"?"10-16%":C==="equipment"?"7-12%":C==="property"?"5-9%":"4-7%",u=Math.round($*(C==="none"?.13:C==="equipment"?.095:C==="property"?.07:.055)/12+$/U),f=fe.find(p=>p.id===C)||fe[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Request Loan</span>
            </div>
            <span onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${v(a)}</span>
            <span style="font-size:10px;color:var(--panel-text);">${v(o)}</span>
        </div>
    </div>`,m+='<div style="flex:1;overflow-y:auto;">',m+=`<div style="padding:6px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Your Financials (visible to lenders)</span>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid var(--panel-border);">
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CASH</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);margin-top:1px;">${h(t)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CURRENT DEBT</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c84;margin-top:1px;">${h(n)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REPUTATION</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${i}</div>
        </div>
    </div>`,m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${h($)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${$}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const p of ze){const g=J===p.id;m+=`<div onclick="lrSetPurpose('${p.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"var(--panel-border)"};border-left:2px solid ${g?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${g?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${p.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${g?"var(--panel-text)":"#9e9a92"};">${p.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${p.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${U} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const p of[12,24,36,48,60,84,120]){const g=U===p;m+=`<span onclick="lrSetTerm(${p})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${g?"#000":"#6a6660"};background:${g?"#5a8aaa":"transparent"};border:1px solid ${g?"#5a8aaa":"var(--panel-border)"};">${p}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const p of fe){const g=C===p.id;m+=`<div onclick="lrSetCollateral('${p.id}')" style="padding:6px 8px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"var(--panel-border)"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g?"#5a8aaa":"#6a6660"};">${p.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${p.riskColor};">${p.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${p.desc}</div>
        </div>`}if(m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${v(ce)}</textarea>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${h(n)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${h($)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--panel-text);">NEW TOTAL DEBT</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${h(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${l};background:${l}12;border:1px solid ${l}25;">${c}</span>
            </div>
        </div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,X.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const p of X){const g=(p.corp_company_type||"").toLowerCase()==="state"?"#c84":(p.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--bg-panel);border:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${v((p.abbreviation||p.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:var(--panel-text);flex:1;">${v(p.faction_name)}</span>
                ${p.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${g};background:${g}12;border:1px solid ${g}25;">${v(p.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';m+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',m+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">${d}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">~${h(u)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${h($)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${f.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${X.length} lender${X.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',e.innerHTML=m}let ne=!1;async function mt(){if(!r||!w||ne)return;const e=document.getElementById("lr-error");if($<1e6){e.textContent="Minimum loan amount is $1M.",e.style.display="block";return}if($>5e9){e.textContent="Maximum loan amount is $5B.",e.style.display="block";return}const n=((ze.find(s=>s.id===J)||{}).label||J)+(ce?" — "+ce:""),i=document.getElementById("lr-submit-btn");ne=!0,i.style.opacity="0.5",i.style.pointerEvents="none";const o=w.current_tick||0,{error:a}=await x.from("finance_loan_requests").insert({requesting_faction_id:r.id,nation_id:r.nation_id,amount:$,term_months:U,purpose:n,created_tick:o,expires_tick:o+5});if(i.style.opacity="1",i.style.pointerEvents="auto",a){ne=!1,e.textContent="Failed to submit: "+a.message,e.style.display="block",i.style.opacity="1",i.style.pointerEvents="auto";return}ne=!1,Se()}function vt(){if(!r)return;const e=Number(r.corp_loans??0),t=Number(r.corp_reputation??50),n=Number(r.corp_general_workforce??0),i=Number(r.corp_skilled_workforce??0),o=Number(r.corp_innovative_workforce??0),a=n+i+o;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const s=L("COO"),l=s?s.skill:50,c=ee(l),d=10+Math.floor(Math.random()*11),y=Math.round(a*d/100),u=Math.round(e*.07),f=Math.round(u*(2-c)),m=3+Math.floor(Math.random()*10),p=Math.max(1,Math.round(m*c)),g=Math.round(n/a*y),_=Math.round(i/a*y),N=Math.max(0,Math.min(o,y-g-_)),E=document.createElement("div");E.id="restr-overlay",E.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",E.onclick=function(O){O.target===E&&xe()},E.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${y} employees (${d}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${n} &rarr; ${n-g}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${g}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${i} &rarr; ${i-_}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${_}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${o} &rarr; ${o-N}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${N}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT REDUCTION (~7%)</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${h(f)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION HIT</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${p} (${t} &rarr; ${Math.max(0,t-p)})</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#c84;margin-top:6px;">&#9888; This action cannot be undone. Laid-off workers must be re-hired.</div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${d},${f},${p},${g},${_},${N})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(E)}function xe(){const e=document.getElementById("restr-overlay");e&&e.remove()}let ie=!1;async function yt(e,t,n,i,o,a){if(!r||!w||ie)return;ie=!0;const s=document.getElementById("restr-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const l=Number(r.corp_general_workforce??0),c=Number(r.corp_skilled_workforce??0),d=Number(r.corp_innovative_workforce??0),y=Number(r.corp_loans??0),u=Number(r.corp_reputation??50),f={corp_general_workforce:Math.max(0,l-i),corp_skilled_workforce:Math.max(0,c-o),corp_innovative_workforce:Math.max(0,d-a),corp_loans:Math.max(0,y-t),corp_reputation:Math.max(0,u-n)},{error:m}=await x.from("factions").update(f).eq("id",r.id);if(m){ie=!1;const _=document.getElementById("restr-error");_&&(_.textContent="Failed: "+m.message,_.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}Object.assign(r,f);const p=w.current_tick||0,{error:g}=await x.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:(r.faction_name||"Corporation")+" — Restructuring",description_used:(r.faction_name||"A corporation")+" has announced a restructuring, laying off "+e+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:e,debt_cut:t,rep_loss:n},fired_at_tick:p});g&&console.warn("Failed to log restructure event:",g.message),ie=!1,B("restructure"),xe(),j()}function xt(){const e=L("CMO"),t=e?e.skill:50,n=ee(t),i=Math.round(2e7*n),o=Math.max(1,Math.round(5*n)),a=Number(r?.corp_cash_reserves??0),s=Number(r?.corp_reputation??50),l=r?.faction_name||"",c=r?.abbreviation||r?.corp_ticker||"",d=document.createElement("div");d.id="rebrand-overlay",d.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",d.onclick=function(y){y.target===d&&ue()},d.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
            <input id="rebrand-name" type="text" maxlength="40" value="${v(l)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${v(c)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;text-transform:uppercase;" />
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Impact</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COST</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${h(i)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${o} (${s} &rarr; ${Math.max(0,s-o)})</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">SKILL MODIFIER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${n<=1?"#5cb85c":"#c84"};">&times;${n.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${a<i?"#c55":"var(--panel-text)"};">${h(a-i)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${i},${o})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${a>=i?"pointer":"not-allowed"};${a<i?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(d)}function ue(){const e=document.getElementById("rebrand-overlay");e&&e.remove()}let ae=!1;async function ut(e,t){if(!r||!w||ae)return;const n=e||2e7,i=t||5,o=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),s=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){o&&(o.textContent="Name must be at least 2 characters.",o.style.display="block");return}if(!s||s.length<2||s.length>5){o&&(o.textContent="Abbreviation must be 2-5 characters.",o.style.display="block");return}const l=Number(r.corp_cash_reserves??0);if(l<n){o&&(o.textContent="Insufficient cash. Need "+h(n)+".",o.style.display="block");return}ae=!0;const c=document.getElementById("rebrand-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const d=Number(r.corp_reputation??50),y=r.faction_name||"Corporation",{error:u}=await x.from("factions").update({faction_name:a,abbreviation:s,corp_ticker:s,corp_cash_reserves:l-n,corp_reputation:Math.max(0,d-i)}).eq("id",r.id);if(u){ae=!1,o&&(o.textContent="Failed: "+u.message,o.style.display="block"),c&&(c.style.opacity="1",c.style.pointerEvents="auto");return}r.faction_name=a,r.abbreviation=s,r.corp_ticker=s,r.corp_cash_reserves=l-n,r.corp_reputation=Math.max(0,d-i);const f=w.current_tick||0,{error:m}=await x.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:"Corporation Rebranded",description_used:y+" has rebranded to "+a+" ("+s+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:y,new_name:a,new_abbr:s,rep_loss:i,cost:n},fired_at_tick:f});m&&console.warn("Failed to log rebrand event:",m.message),ae=!1,B("rebrand"),ue(),j(),document.getElementById("corp-name-bar").textContent=a;const p=document.getElementById("corp-logo");p&&(p.textContent=s.slice(0,2))}let M=[],I=-1;async function gt(){Number(r?.corp_cash_reserves??0);const e=[r.nation_id],t=new Set(A.map(o=>o.id)),{data:n}=await x.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id").eq("faction_type","party").in("nation_id",e).is("abandoned_at",null).order("seats",{ascending:!1});M=(n||[]).filter(o=>!t.has(o.id)).map(o=>({...o})),I=-1;const i=document.createElement("div");i.id="donate-overlay",i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",i.onclick=function(o){o.target===i&&ge()},document.body.appendChild(i),Re()}function ge(){const e=document.getElementById("donate-overlay");e&&e.remove(),M=[],I=-1}function bt(e){I=e,Re()}function Re(){const e=document.getElementById("donate-overlay");if(!e)return;const t=L("Lobbyist"),n=t?t.skill:50,i=Math.round(1e6*ee(n)),o=1e5,a=Number(r?.corp_cash_reserves??0),s=I>=0?M[I]:null,l=a>=i;let c='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';c+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#8a6aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Political Donation</span>
            </div>
            <span onclick="actCloseDonation()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Cost:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#ca5;">${h(i)}</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">&rarr; Target party receives</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#5cb85c;">+${h(o)}</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in the nation where your National HQ is located. You cannot donate to your own party.</div>
    </div>`,c+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',c+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',M.length===0&&(c+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let d=0;d<M.length;d++){const y=M[d],u=I===d,f=y.party_color||"#8a6aaa",m=(y.momentum||0)>0?"var(--panel-text)":"#c55";c+=`<div onclick="donateSelectParty(${d})" style="
            padding:10px 20px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${u?f:"transparent"};
            background:${u?f+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${f};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${u?"var(--panel-text)":"#9e9a92"};">${v(y.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${v(y.abbreviation||"??")} &middot; ${v(y.nation||"")} &middot; ${y.seats||0} seats</span>
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${h(y.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${m};font-weight:700;">${Number(y.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${u?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}c+="</div>",c+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${h(i)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l?"var(--panel-text)":"#c55"};">${h(a)}</div></div>
            ${s?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${v(s.abbreviation||s.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${s&&l?"#000":"#6a6660"};background:${s&&l?"#8a6aaa":"var(--panel-border)"};cursor:${s&&l?"pointer":"not-allowed"};${!s||!l?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,c+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',c+="</div>",e.innerHTML=c}let F=!1;async function ht(){if(!r||!w||I<0||F)return;const e=M[I];if(!e)return;const t=Number(w?.current_tick||0);if(new Set(A.map(b=>b.id)).has(e.id)){const b=document.getElementById("donate-error");b&&(b.textContent="You cannot donate to your own party.",b.style.display="block");return}const i=L("Lobbyist"),o=i?i.skill:50,a=Math.round(1e6*ee(o)),s=1e5,l=2,{data:c,error:d}=await x.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",r.id).single();if(d||!c){const b=document.getElementById("donate-error");b&&(b.textContent="Failed to verify cooldown: "+(d?.message||"unknown"),b.style.display="block");return}const y=Number(c.last_donation_tick??0);if(y===t){const b=document.getElementById("donate-error");b&&(b.textContent="Political Donation is on cooldown until next tick.",b.style.display="block"),B("donate");return}const u=Number(c.corp_cash_reserves??0);if(u<a){const b=document.getElementById("donate-error");b&&(b.textContent="Insufficient cash. Need "+h(a)+", have "+h(u)+".",b.style.display="block");return}F=!0;const f=document.getElementById("donate-btn");f&&(f.style.opacity="0.4",f.style.pointerEvents="none");const m=Number(r.corp_reputation??50),p=Math.max(0,m-l),{data:g,error:_}=await x.from("factions").update({corp_cash_reserves:u-a,corp_reputation:p,last_donation_tick:t}).eq("id",r.id).eq("last_donation_tick",y).select("id");if(_){const b=document.getElementById("donate-error");F=!1,b&&(b.textContent="Failed: "+_.message,b.style.display="block"),f&&(f.style.opacity="1",f.style.pointerEvents="auto");return}if(!g||g.length===0){const b=document.getElementById("donate-error");F=!1,b&&(b.textContent="Political Donation is on cooldown until next tick.",b.style.display="block"),f&&(f.style.opacity="1",f.style.pointerEvents="auto"),B("donate");return}const{data:N}=await x.from("factions").select("party_funds").eq("id",e.id).single(),E=Number(N?.party_funds??0),{error:O}=await x.from("factions").update({party_funds:E+s}).eq("id",e.id);if(O){await x.from("factions").update({corp_cash_reserves:u}).eq("id",r.id);const b=document.getElementById("donate-error");F=!1,b&&(b.textContent="Failed to transfer funds: "+O.message,b.style.display="block"),f&&(f.style.opacity="1",f.style.pointerEvents="auto");return}r.corp_cash_reserves=u-a,r.corp_reputation=p;const Y=r.faction_name||"Corporation",{error:V}=await x.from("event_log").insert({nation_id:e.nation_id||r.nation_id,faction_id:r.id,event_name:Y+" — Political Donation",description_chosen:Y+" has donated "+h(a)+" to "+(e.faction_name||"a political party")+". The party receives "+h(s)+" in campaign funds. Corporate reputation decreases by "+l+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:e.id,recipient_name:e.faction_name,funds_granted:s,reputation_loss:l,skill:o},fired_at_tick:t});V&&console.warn("Failed to log donation event:",V.message),F=!1,B("donate"),ge()}function _t(e){q=e,j()}async function wt(e){if(R=e,T=-1,document.getElementById("exec-search-overlay").style.display="flex",Z.length===0&&r?.nation_id){const t=r.nation||"",n=De(r.nation_id,t),{error:i}=await x.from("executive_pool").insert(n);i&&console.warn("Failed to generate executive pool:",i.message);const{data:o,error:a}=await x.from("executive_pool").select("*").eq("nation_id",r.nation_id).eq("status","available").order("skill",{ascending:!1});a&&console.warn("Failed to reload executive pool:",a.message),Z=o||[]}Ne()}function Te(){document.getElementById("exec-search-overlay").style.display="none",R=null,T=-1}function Ie(e){return Z.filter(t=>t.status==="available"&&Array.isArray(t.specializations)&&t.specializations.includes(e)).sort((t,n)=>n.skill-t.skill)}function kt(e){T=e,Ne()}let re=!1;async function $t(){if(!r||!w||!R||T<0||re)return;const t=Ie(R)[T];if(!t)return;re=!0;const n=w.current_tick||0,i=document.getElementById("es-hire-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const{error:o}=await x.from("corp_executives").insert({faction_id:r.id,role:R,first_name:t.first_name,last_name:t.last_name,age:t.age,origin_nation:t.origin_nation,skill:t.skill,salary_per_year:t.required_salary,contract_years:t.required_years,contract_start_tick:n,contract_end_tick:n+t.required_years*12,status:"active"});if(o){re=!1;const s=document.getElementById("es-error");s&&(s.textContent="Failed: "+o.message,s.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:a}=await x.from("executive_pool").update({status:"hired",hired_by_faction_id:r.id}).eq("id",t.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),re=!1,Te(),await $e(),q=se.indexOf(R),q<0&&(q=0),j()}function Ne(){const e=document.getElementById("exec-search-content");if(!e||!R)return;const t=R,n=le[t],i=Ie(t),o=T>=0?i[T]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${n.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${n.color};">${v(t)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${v(n.fullTitle)}</span>
        </div>
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid var(--panel-border);overflow-y:auto;flex-shrink:0;">',i.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let s=0;s<i.length;s++){const l=i[s],c=T===s,d=Q(l.skill);a+=`<div onclick="esSelectCandidate(${s})" style="
            padding:10px 14px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${c?n.color:"transparent"};
            background:${c?n.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${n.color}10;border:1px solid ${n.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${n.color};flex-shrink:0;">${v(me(l.first_name,l.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v(l.first_name)} ${v(l.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--panel-border);">
                                <div style="width:${l.skill}%;height:100%;background:${d};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${d};width:18px;text-align:right;">${l.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${W(l.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!o)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${i.length} candidate${i.length!==1?"s":""} available for ${v(t)}</div>
        </div>`;else{const s=o.required_salary*o.required_years,l=Q(o.skill);a+=`<div style="padding:20px;border-bottom:1px solid var(--panel-border);">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${n.color}12;border:1px solid ${n.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${n.color};">${v(me(o.first_name,o.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${v(o.first_name)} ${v(o.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${v(o.origin_nation)} &middot; Age ${o.age}</div>
                </div>
            </div>
        </div>`,a+=`<div style="display:flex;gap:0;border-bottom:1px solid var(--panel-border);">
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">SKILL</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:5px;">
                    <div style="width:60px;height:4px;background:var(--panel-border);">
                        <div style="width:${o.skill}%;height:100%;background:${l};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${l};">${o.skill}</span>
                </div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">AGE</div>
                <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${o.age}</div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">ORIGIN</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${v(o.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const y of o.specializations||[]){const u=le[y],f=y===t;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${f?"#000":u?.color||"#9e9a92"};background:${f?u?.color||"#5a8aaa":(u?.color||"#5a8aaa")+"10"};border:1px solid ${f?"transparent":(u?.color||"#5a8aaa")+"30"};">${v(y)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${o.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${W(o.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${W(s)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const c=o.skill>=80?"EXCEPTIONAL":o.skill>=65?"STRONG":o.skill>=50?"COMPETENT":o.skill>=35?"DEVELOPING":"WEAK",d=o.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":o.skill>=65?"Strong performer. Reliable outcomes across most actions.":o.skill>=50?"Adequate for the role. Outcomes are average.":o.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${l}08;border:1px solid ${l}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${l};letter-spacing:0.8px;margin-bottom:3px;">${c}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${d}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,o?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${v(o.first_name)} ${v(o.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${Q(o.skill)};">${o.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${W(o.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${o?"#000":"#6a6660"};background:${o?n.color:"var(--panel-border)"};cursor:${o?"pointer":"not-allowed"};${o?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',e.innerHTML=a}async function Et(){const{data:{user:e}}=await x.auth.getUser();if(!e){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(t){const{data:a,error:s}=await x.from("factions").select("*").eq("id",t).single();s?console.warn("[Inspector] faction fetch failed:",s.message):a?.faction_type==="corporation"&&(r=a)}if(!r){const{data:a}=await x.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);A=(a||[]).filter(l=>l.nation_id);const s=sessionStorage.getItem("active_faction_id");if(r=A.find(l=>l.id===s)||A.find(l=>l.faction_type==="corporation")||A[0],!r){await x.auth.signOut(),window.location.href="login.html";return}if(r.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[n,i]=await Promise.all([r.nation_id?x.from("nations").select("*").eq("id",r.nation_id).single():Promise.resolve({data:null}),x.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.data&&n.data,w=i.data;const o=document.getElementById("corp-topbar-container");o&&qe(o,{faction:r,shard:w,activeTab:"actions",allUserFactions:A}),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",await Promise.all([Je(),$e()]),j()}window.actExecute=it;window.actSelectExec=_t;window.confirmFireExec=ot;window.actCloseStatement=ye;window.actSubmitStatement=rt;window.actCloseRestructure=xe;window.actSubmitRestructure=yt;window.actCloseRebrand=ue;window.actSubmitRebrand=ut;window.actCloseDonation=ge;window.actSubmitDonation=ht;window.donateSelectParty=bt;window.lrClose=Se;window.lrSetAmount=lt;window.lrSetPurpose=ct;window.lrSetTerm=dt;window.lrSetCollateral=pt;window.lrSubmit=mt;window.openExecSearch=wt;window.closeExecSearch=Te;window.esSelectCandidate=kt;window.esHireCandidate=$t;Et();
