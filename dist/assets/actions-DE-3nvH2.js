import{_supabase as x}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{r as qe}from"./role-actions-fros7AI4.js";import{escapeHtml as m,hfFmtBig as h}from"./utils-A98FEun4.js";import{renderCorpTopBar as Be}from"./corp-topbar-rMK78I65.js";import{c as Ue}from"./corp-valuation-C0hsb2EQ.js";import{E as le,a as ce,c as De,g as je}from"./corp-executives-Arzga-9x.js";import"./preload-helper-BXl3LOEh.js";import"./political-actions-DGca11uY.js";import"./config-CKNXR-qR.js";import"./government-structure-DjsO9xG_.js";import"./stats-tIiBSaQA.js";function ne(e){if(e==null)return"";const t=document.createElement("div");return t.textContent=String(e),t.innerHTML}function He(e,t){return(e||"?")[0]+(t||"?")[0]}function Ye(e){return e>=70?"#5cb85c":e>=50?"#ca5":"#c84"}function Ve(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function _e(e){const t=Number(e)||0,n=Math.abs(t),i=n>=1e9?(n/1e9).toFixed(1)+"B":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?Math.round(n/1e3)+"k":String(Math.round(n));return(t<0?"-$":"$")+i}function Ke(e,t){if(!e)return;const{faction:n,shard:i,ownedProperties:o=[],vessels:a=[],executives:s=[],selectedExecIdx:l=0}=t||{},c=n?.faction_name||"Corporation",d=(n?.abbreviation||n?.corp_ticker||"??").toUpperCase(),f=n?.corp_sector||"",u=n?.corp_subsector||"",v=Number(n?.corp_cash_reserves||0),y=Number(n?.corp_loans||0),p=Ue({cash:v,loans:y,properties:o,vessels:a,financeReceivables:0,currentTick:i?.current_tick||0}),g=Number(n?.corp_reputation??50),_=Math.max(0,Math.min(100,Math.round(Number.isFinite(g)?g:50))),N=_>=60?"var(--green)":_>=40?"var(--text-bright)":"var(--red)",E=o.length,O=p<0?"var(--red)":"var(--green)";qe(e,{title:"Corporate Actions",entityName:`${c} · ${d}`,entityColor:"#8b9a6b",stats:[{label:"Cash",value:_e(v),color:"var(--accent)"},{label:"Reputation",value:String(_),color:N},{label:"Valuation",value:_e(p),color:O}],statusBarItems:[{type:"count",label:"Sector",big:f||"—",bigColor:"#8b9a6b",dim1:u||""},{type:"count",label:"Properties",big:String(E),bigColor:"#8b9a6b",dim1:E===1?"building":"buildings"}],rolesContainerId:"corp-exec-list",panelContainerId:"corp-actions-panel",rolesColumnWidth:262});const V=document.getElementById("corp-exec-list");if(V){const b=new Map(s.map(z=>[z.role,z]));let G="";for(let z=0;z<le.length;z++){const F=le[z],Le=ce[F],k=b.get(F)||null,oe=l===z,S=Le.color,Me=!k;if(G+=`<div onclick="actSelectExec(${z})" style="
                padding:10px 12px;
                background:${oe?S+"0a":"var(--bg-2,#1a1a17)"};
                border:1px solid ${oe?S+"44":"var(--border-0,rgba(255,255,255,0.06))"};
                border-left:3px solid ${oe?S:"var(--border-0,rgba(255,255,255,0.06))"};
                cursor:pointer;
            ">`,Me&&F!=="CEO")G+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${S};">${ne(F)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                        <div style="margin-top:4px;">
                            <span onclick="event.stopPropagation();openExecSearch('${F}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                        </div>
                    </div>
                </div>`;else{const Oe=k?`${k.first_name} ${k.last_name}`:"—",he=k?k.age:0,pe=k?k.skill:0,Fe=k?k.salary_per_year:0,Pe=k?He(k.first_name,k.last_name):"—";G+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background:${S}15;border:1px solid ${S}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${S};flex-shrink:0;">${ne(Pe)}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${S};">${ne(F)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:${oe?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ne(Oe)}${he?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${he})</span>`:""}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                            <div style="display:flex;align-items:center;gap:3px;flex:1;">
                                <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                    <div style="width:${pe}%;height:100%;background:${Ye(pe)};"></div>
                                </div>
                                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${pe}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${Ve(Fe)}/yr</span>
                        </div>
                    </div>
                </div>`}G+="</div>"}V.innerHTML=G}const K=document.getElementById("corp-actions-panel");K&&(K.innerHTML='<div id="actions-right-panel"></div>')}const Ge=1e6,We=1e10,we=1,ke=50,Xe=12;function Qe(e){if(e<0)return"A";const t=Math.min(e,25);return String.fromCharCode(65+t)}async function Ze(e,t,n){if(!e||!t||!n)return;if((e.corp_sector||"").toLowerCase()==="finance"){alert("Finance-sector corps fund equity; they do not raise it.");return}const i=prompt(`APPLY FOR EQUITY — STEP 1 / 3

How much capital do you want to raise? (in millions USD)

Example: 50 for a $50M raise.
Range: $1M – $10B.`);if(i===null)return;const o=parseFloat(i);if(isNaN(o)||o<=0){alert("Amount must be a positive number.");return}const a=Math.round(o*1e6);if(a<Ge){alert("Minimum raise is $1M.");return}if(a>We){alert("Maximum raise is $10B.");return}const s=prompt(`APPLY FOR EQUITY — STEP 2 / 3

What stake are you offering in exchange? (percent)

Example: 12.5 for a 12.5% share of monthly profits.
Range: 1% – 50%.`);if(s===null)return;const l=parseFloat(s);if(isNaN(l)||l<we||l>ke){alert(`Stake must be between ${we}% and ${ke}%.`);return}const c=prompt(`APPLY FOR EQUITY — STEP 3 / 3

Describe the purpose of this raise.

Example: "Series B to fund fleet expansion across Mira ports."
Investment corps see this in Deal Flow when deciding whether to fund you.`);if(c===null)return;const d=(c||"").trim()||"Equity capital raise",{data:f,error:u}=await n.from("finance_loan_requests").select("id").eq("requesting_faction_id",e.id).eq("request_type","equity").eq("status","funded");if(u){alert("Could not look up prior raises: "+u.message);return}const v=Qe((f||[]).length),y=`Post Series ${v} equity raise?

Amount:   $${o}M
Stake:    ${l}%
Series:   ${v}
Purpose:  ${d}

This becomes visible to Investment corps in Deal Flow. Once an investor buys in, your corp pays them ${l}% of monthly profit each tick.`;if(!confirm(y))return;const p=Number(t.current_tick||0),{error:g}=await n.from("finance_loan_requests").insert({requesting_faction_id:e.id,nation_id:e.nation_id,request_type:"equity",amount:a,equity_pct:l,series:v,term_months:120,purpose:d,status:"open",created_tick:p,expires_tick:p+Xe});if(g){alert("Failed to post equity raise: "+g.message);return}try{const _=e.faction_name+" ["+(e.abbreviation||e.corp_ticker||"??")+"]";await n.from("event_log").insert({nation_id:e.nation_id,event_name:"Series "+v+" Raise Opened",category:"corporate",faction_id:e.id,description_used:_+" has started the process of raising their series "+v+" and seeks investors.",fired_at_tick:p})}catch(_){console.warn("[equity-apply] Event log insert failed:",_?.message||_)}alert(`Series ${v} raise posted to Deal Flow. Investment corps can now fund you.`)}let fe=!1;async function Je(){if(fe)return;const{data:{user:e}}=await x.auth.getUser();if(!e){alert("Not logged in.");return}const t=sessionStorage.getItem("active_faction_id");if(!t){alert("No active faction selected.");return}const{data:n,error:i}=await x.from("factions").select("id, faction_name, corp_sector, faction_type, abandoned_at").eq("id",t).single();if(i||!n||n.faction_type!=="corporation"||n.abandoned_at){alert("No active corporation found. It may have already been dissolved.");return}const o=n.faction_name||"this corporation";if(!confirm("DECLARE BANKRUPTCY — "+o.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+o+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}fe=!0;try{const{data:s,error:l}=await x.rpc("declare_corp_bankruptcy",{p_faction_id:t});if(l)throw l;const c=Number(s?.total_payback||0),d=c>0?`
$`+c.toLocaleString()+" repaid to creditors.":"";sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:f,error:u}=await x.from("factions").select("id, faction_type").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);u&&console.warn("[Bankruptcy] remaining-factions lookup failed:",u.message);const v=(f||[]).find(p=>p.faction_type==="party"),y=(f||[]).find(p=>p.faction_type==="corporation");v?(sessionStorage.setItem("active_faction_id",v.id),alert(o+" has declared bankruptcy."+d+`

Redirecting to your political party.`),window.location.href="dashboard.html"):y?(sessionStorage.setItem("active_faction_id",y.id),alert(o+" has declared bankruptcy."+d+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(o+" has declared bankruptcy."+d+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(s){alert("Bankruptcy failed: "+(s?.message||s)+`

Please try again or contact support.`)}finally{fe=!1}}let A=[],r=null,w=null,j=[],J=[],B=0,R=null,T=-1,$e=[];async function et(){if(!r?.id)return;const{data:e}=await x.from("corp_properties").select("*").eq("faction_id",r.id).eq("is_active",!0);$e=e||[]}async function Ee(){if(!r)return;const[e,t]=await Promise.all([x.from("corp_executives").select("*").eq("faction_id",r.id).eq("status","active"),x.from("executive_pool").select("*").eq("nation_id",r.nation_id).eq("status","available").order("skill",{ascending:!1})]);e.error&&console.warn("Failed to load executives:",e.error.message),t.error&&console.warn("Failed to load executive pool:",t.error.message),j=e.data||[],J=t.data||[];const n=await De({supabase:x,faction:r,currentTick:w?.current_tick||0,poolCandidates:J});n?.error&&console.warn("Failed to seed initial executive roster:",n.error.message||n.error),n?.executives&&(j=n.executives)}function X(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function M(e){return j.find(t=>t.role===e)||null}function ve(e,t){return(e||"?")[0]+(t||"?")[0]}function Z(e){return e>=70?"#5cb85c":e>=50?"#ca5":"#c84"}function H(){const e=document.getElementById("actions-container");e&&(Ke(e,{faction:r,shard:w,ownedProperties:$e,vessels:[],executives:j,selectedExecIdx:B}),ot())}const Ce={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]},{id:"equity",name:"Apply for Equity",desc:"Raise capital by offering Investment corps a stake in your monthly profits. Series (A/B/C…) is auto-assigned by your prior funded raise count. No repayment — investors get a percentage of profit each tick going forward.",cost:"FREE",costColor:"#c89a4a",tags:["FINANCIAL","STRUCTURAL"],hideForSector:"Finance"}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function te(e){return 1.5-e/100}let ze={};function tt(e){const t=w?.current_tick||0;return ze[e]===t}function U(e){const t=w?.current_tick||0;ze[e]=t}function ot(){const e=document.getElementById("actions-right-panel");if(!e)return;const t=le[B],n=ce[t],i=M(t),o=(Ce[t]||[]).filter(s=>!s.hideForSector||(r?.corp_sector||"")!==s.hideForSector);if(!i){e.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${n.color};margin-bottom:6px;">${m(t)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${m(n.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${t}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${n.color}15;border:1px solid ${n.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${n.color};">${m(ve(i.first_name,i.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${n.color};">${m(t)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${m(i.first_name)} ${m(i.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${m(n.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${i.skill}%;height:100%;background:${Z(i.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${Z(i.skill)};">${i.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${X(i.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${i.contract_years}yr</div>
            </div>
            ${t!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${i.id}','${m(t)}','${m(i.first_name+" "+i.last_name)}',${i.salary_per_year},${i.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let s=0;s<o.length;s++){const l=o[s],c=!!l.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${c?"transparent":n.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${s<o.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${c?"0.4":"1"};
            cursor:${c?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${c?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${m(l.name)}</span>`;for(const d of l.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${d==="IRREVERSIBLE"?"#c55":d==="OFFENSIVE"?"#c84":d==="STRUCTURAL"?"#ca5":d==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${m(d)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l.costColor};">${m(l.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${c?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${m(l.desc)}</div>`,l.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${m(l.descRed)}</div>`),c&&l.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${m(l.lockReason)}</span>
            </div>`),c||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${l.id}','${t}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${n.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${n.color};font-weight:700;">${m(t)}</span> skill (${i.skill}/100) affects action outcomes.
            ${i.skill>=70?" High skill increases success probability and reduces costs.":i.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,e.innerHTML=a,e.querySelectorAll("[onmouseenter]").forEach(s=>{s.addEventListener("mouseenter",function(){const l=this.querySelector(".act-exec-btn");l&&(l.style.display="block")}),s.addEventListener("mouseleave",function(){const l=this.querySelector(".act-exec-btn");l&&(l.style.display="none")})})}function nt(e,t,n,i,o){const a=w?.current_tick||0,s=Math.max(0,o-a),l=Math.round(i*(s/12)),c=`FIRE ${t}: ${n}

Contract remaining: ${s} ticks
Payout (prorated): $${(l/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(c)&&it(e,t,l)}async function it(e,t,n){try{const i=Number(r?.corp_cash_reserves??0);if(i<n){alert(`Insufficient funds. You need $${(n/1e6).toFixed(2)}M but only have $${(i/1e6).toFixed(2)}M.`);return}const o=i-n,{error:a}=await x.from("factions").update({corp_cash_reserves:o}).eq("id",r.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:s}=await x.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",e);if(s){await x.from("factions").update({corp_cash_reserves:i}).eq("id",r.id),alert("Failed to fire executive: "+s.message);return}r.corp_cash_reserves=o,j=j.filter(l=>l.id!==e),H()}catch(i){console.error("[CorpOps] Fire executive error:",i),alert("An error occurred.")}}function at(e,t){if((Ce[t]||[]).find(i=>i.id===e)?.cooldown==="once/tick"&&tt(e)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(e){case"statement":return rt();case"loan":return lt();case"equity":return Ze(r,w,x);case"restructure":return yt();case"rebrand":return ut();case"donate":return ht();case"bankruptcy":return Je()}}let ye=!1;function rt(){if(ye)return;ye=!0;const e=document.createElement("div");e.id="stmt-overlay",e.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",e.onclick=function(c){c.target===e&&xe()};const t=r?.faction_name||"Corporation",n=(r?.abbreviation||r?.corp_ticker||"??").toUpperCase(),i=Number(r?.corp_cash_reserves??0),o=M("CEO"),a=o?`${o.first_name} ${o.last_name}`:"CEO";e.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${m(n)}</span>
                <span style="font-size:10px;color:var(--panel-text);">${m(t)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${m(a)}</span>
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
    </div>`,document.body.appendChild(e);const s=document.getElementById("stmt-text"),l=document.getElementById("stmt-chars");s&&l&&(s.addEventListener("input",function(){l.textContent=this.value.length+"/500"}),s.focus())}function xe(){const e=document.getElementById("stmt-overlay");e&&e.remove(),ye=!1}let W=!1;async function st(){if(!r||!w||W)return;const e=document.getElementById("stmt-text"),t=document.getElementById("stmt-error"),n=(e?.value||"").trim();if(!n){t&&(t.textContent="Statement cannot be empty.",t.style.display="block");return}if(n.length>500){t&&(t.textContent="Statement too long (max 500 chars).",t.style.display="block");return}const i=M("CEO"),o=i?i.skill:50,a=Math.round(2e4*te(o)),s=Number(r.corp_cash_reserves??0);if(s<a){t&&(t.textContent="Insufficient cash. Need "+h(a)+".",t.style.display="block");return}W=!0;const l=document.getElementById("stmt-submit-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const c=r.faction_name||"Corporation",d=i?`${i.first_name} ${i.last_name}`:"CEO",f=w.current_tick||0,{error:u}=await x.from("factions").update({corp_cash_reserves:s-a}).eq("id",r.id);if(u){W=!1,t&&(t.textContent="Failed to deduct cost: "+u.message,t.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}const{error:v}=await x.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:c+" — Press Release",description_used:d+", CEO of "+c+': "'+n.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:d,skill:o},fired_at_tick:f});if(v){await x.from("factions").update({corp_cash_reserves:s}).eq("id",r.id),W=!1,t&&(t.textContent="Failed to publish: "+v.message,t.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}r.corp_cash_reserves=s-a,W=!1,U("statement"),xe()}const Se=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],me=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let $=25e7,ee="equipment",D=48,C="equipment",de="",Q=[];function lt(){$=25e7,ee="equipment",D=48,C="equipment",de="",document.getElementById("lr-overlay").style.display="flex",mt(),Y()}function Re(){document.getElementById("lr-overlay").style.display="none"}function ct(e){$=Math.max(1e6,Math.min(5e9,Number(e)||0)),Y()}function dt(e){ee=e,Y()}function pt(e){D=e,Y()}function ft(e){C=e,Y()}async function mt(){if(!r)return;const{data:e}=await x.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",r.id);Q=e||[],Y()}function Y(){const e=document.getElementById("lr-modal-content");if(!e)return;const t=Number(r?.corp_cash_reserves??0),n=Number(r?.corp_loans??0),i=Number(r?.corp_reputation??50),o=r?.faction_name||"Corporation",a=(r?.abbreviation||r?.corp_ticker||"??").toUpperCase(),s=n+$,l=s>t*3?"#c55":s>t*1.5?"#c84":s>t?"#ca5":"#5c5",c=s>t*3?"DANGEROUS":s>t*1.5?"HEAVY":s>t?"MODERATE":"HEALTHY",d=C==="none"?"10-16%":C==="equipment"?"7-12%":C==="property"?"5-9%":"4-7%",u=Math.round($*(C==="none"?.13:C==="equipment"?.095:C==="property"?.07:.055)/12+$/D),v=me.find(p=>p.id===C)||me[0];let y="";y+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Request Loan</span>
            </div>
            <span onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${m(a)}</span>
            <span style="font-size:10px;color:var(--panel-text);">${m(o)}</span>
        </div>
    </div>`,y+='<div style="flex:1;overflow-y:auto;">',y+=`<div style="padding:6px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
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
    </div>`,y+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${h($)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${$}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,y+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const p of Se){const g=ee===p.id;y+=`<div onclick="lrSetPurpose('${p.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"var(--panel-border)"};border-left:2px solid ${g?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${g?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${p.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${g?"var(--panel-text)":"#9e9a92"};">${p.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${p.desc}</div></div>
        </div>`}y+="</div></div>",y+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${D} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const p of[12,24,36,48,60,84,120]){const g=D===p;y+=`<span onclick="lrSetTerm(${p})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${g?"#000":"#6a6660"};background:${g?"#5a8aaa":"transparent"};border:1px solid ${g?"#5a8aaa":"var(--panel-border)"};">${p}</span>`}y+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',y+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const p of me){const g=C===p.id;y+=`<div onclick="lrSetCollateral('${p.id}')" style="padding:6px 8px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"var(--panel-border)"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g?"#5a8aaa":"#6a6660"};">${p.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${p.riskColor};">${p.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${p.desc}</div>
        </div>`}if(y+="</div></div>",y+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${m(de)}</textarea>
    </div>`,y+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
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
    </div>`,y+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,Q.length>0){y+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const p of Q){const g=(p.corp_company_type||"").toLowerCase()==="state"?"#c84":(p.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";y+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--bg-panel);border:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${m((p.abbreviation||p.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:var(--panel-text);flex:1;">${m(p.faction_name)}</span>
                ${p.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${g};background:${g}12;border:1px solid ${g}25;">${m(p.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}y+="</div>"}else y+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';y+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',y+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">${d}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">~${h(u)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,y+="</div>",y+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${h($)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${v.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${Q.length} lender${Q.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,y+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',e.innerHTML=y}let ie=!1;async function vt(){if(!r||!w||ie)return;const e=document.getElementById("lr-error");if($<1e6){e.textContent="Minimum loan amount is $1M.",e.style.display="block";return}if($>5e9){e.textContent="Maximum loan amount is $5B.",e.style.display="block";return}const n=((Se.find(s=>s.id===ee)||{}).label||ee)+(de?" — "+de:""),i=document.getElementById("lr-submit-btn");ie=!0,i.style.opacity="0.5",i.style.pointerEvents="none";const o=w.current_tick||0,{error:a}=await x.from("finance_loan_requests").insert({requesting_faction_id:r.id,nation_id:r.nation_id,amount:$,term_months:D,purpose:n,created_tick:o,expires_tick:o+5});if(i.style.opacity="1",i.style.pointerEvents="auto",a){ie=!1,e.textContent="Failed to submit: "+a.message,e.style.display="block",i.style.opacity="1",i.style.pointerEvents="auto";return}ie=!1,Re()}function yt(){if(!r)return;const e=Number(r.corp_loans??0),t=Number(r.corp_reputation??50),n=Number(r.corp_general_workforce??0),i=Number(r.corp_skilled_workforce??0),o=Number(r.corp_innovative_workforce??0),a=n+i+o;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const s=M("COO"),l=s?s.skill:50,c=te(l),d=10+Math.floor(Math.random()*11),f=Math.round(a*d/100),u=Math.round(e*.07),v=Math.round(u*(2-c)),y=3+Math.floor(Math.random()*10),p=Math.max(1,Math.round(y*c)),g=Math.round(n/a*f),_=Math.round(i/a*f),N=Math.max(0,Math.min(o,f-g-_)),E=document.createElement("div");E.id="restr-overlay",E.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",E.onclick=function(O){O.target===E&&ue()},E.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${f} employees (${d}%)</span>
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${h(v)}</span>
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
            <div id="restr-btn" onclick="actSubmitRestructure(${d},${v},${p},${g},${_},${N})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(E)}function ue(){const e=document.getElementById("restr-overlay");e&&e.remove()}let ae=!1;async function xt(e,t,n,i,o,a){if(!r||!w||ae)return;ae=!0;const s=document.getElementById("restr-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const l=Number(r.corp_general_workforce??0),c=Number(r.corp_skilled_workforce??0),d=Number(r.corp_innovative_workforce??0),f=Number(r.corp_loans??0),u=Number(r.corp_reputation??50),v={corp_general_workforce:Math.max(0,l-i),corp_skilled_workforce:Math.max(0,c-o),corp_innovative_workforce:Math.max(0,d-a),corp_loans:Math.max(0,f-t),corp_reputation:Math.max(0,u-n)},{error:y}=await x.from("factions").update(v).eq("id",r.id);if(y){ae=!1;const _=document.getElementById("restr-error");_&&(_.textContent="Failed: "+y.message,_.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}Object.assign(r,v);const p=w.current_tick||0,{error:g}=await x.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:(r.faction_name||"Corporation")+" — Restructuring",description_used:(r.faction_name||"A corporation")+" has announced a restructuring, laying off "+e+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:e,debt_cut:t,rep_loss:n},fired_at_tick:p});g&&console.warn("Failed to log restructure event:",g.message),ae=!1,U("restructure"),ue(),H()}function ut(){const e=M("CMO"),t=e?e.skill:50,n=te(t),i=Math.round(2e7*n),o=Math.max(1,Math.round(5*n)),a=Number(r?.corp_cash_reserves??0),s=Number(r?.corp_reputation??50),l=r?.faction_name||"",c=r?.abbreviation||r?.corp_ticker||"",d=document.createElement("div");d.id="rebrand-overlay",d.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",d.onclick=function(f){f.target===d&&ge()},d.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
            <input id="rebrand-name" type="text" maxlength="40" value="${m(l)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${m(c)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;text-transform:uppercase;" />
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
    </div>`,document.body.appendChild(d)}function ge(){const e=document.getElementById("rebrand-overlay");e&&e.remove()}let re=!1;async function gt(e,t){if(!r||!w||re)return;const n=e||2e7,i=t||5,o=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),s=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){o&&(o.textContent="Name must be at least 2 characters.",o.style.display="block");return}if(!s||s.length<2||s.length>5){o&&(o.textContent="Abbreviation must be 2-5 characters.",o.style.display="block");return}const l=Number(r.corp_cash_reserves??0);if(l<n){o&&(o.textContent="Insufficient cash. Need "+h(n)+".",o.style.display="block");return}re=!0;const c=document.getElementById("rebrand-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const d=Number(r.corp_reputation??50),f=r.faction_name||"Corporation",{error:u}=await x.from("factions").update({faction_name:a,abbreviation:s,corp_ticker:s,corp_cash_reserves:l-n,corp_reputation:Math.max(0,d-i)}).eq("id",r.id);if(u){re=!1,o&&(o.textContent="Failed: "+u.message,o.style.display="block"),c&&(c.style.opacity="1",c.style.pointerEvents="auto");return}r.faction_name=a,r.abbreviation=s,r.corp_ticker=s,r.corp_cash_reserves=l-n,r.corp_reputation=Math.max(0,d-i);const v=w.current_tick||0,{error:y}=await x.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+s+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:s,rep_loss:i,cost:n},fired_at_tick:v});y&&console.warn("Failed to log rebrand event:",y.message),re=!1,U("rebrand"),ge(),H(),document.getElementById("corp-name-bar").textContent=a;const p=document.getElementById("corp-logo");p&&(p.textContent=s.slice(0,2))}const bt={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function P(e){return bt[(e||"").toLowerCase()]||"#9C27B0"}let L=[],I=-1;async function ht(){Number(r?.corp_cash_reserves??0);const e=[r.nation_id],t=new Set(A.map(o=>o.id)),{data:n}=await x.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",e).is("abandoned_at",null).order("seats",{ascending:!1});L=(n||[]).filter(o=>!t.has(o.id)).map(o=>({...o})),I=-1;const i=document.createElement("div");i.id="donate-overlay",i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",i.onclick=function(o){o.target===i&&be()},document.body.appendChild(i),Te()}function be(){const e=document.getElementById("donate-overlay");e&&e.remove(),L=[],I=-1}function _t(e){I=e,Te()}function Te(){const e=document.getElementById("donate-overlay");if(!e)return;const t=M("Lobbyist"),n=t?t.skill:50,i=Math.round(1e6*te(n)),o=1e5,a=Number(r?.corp_cash_reserves??0),s=I>=0?L[I]:null,l=a>=i;let c='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';c+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
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
    </div>`,c+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',c+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',L.length===0&&(c+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let d=0;d<L.length;d++){const f=L[d],u=I===d,v=f.party_color||"#8a6aaa",y=(f.momentum||0)>0?"var(--panel-text)":"#c55";c+=`<div onclick="donateSelectParty(${d})" style="
            padding:10px 20px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${u?v:"transparent"};
            background:${u?v+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${v};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${u?"var(--panel-text)":"#9e9a92"};">${m(f.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${m(f.abbreviation||"??")} &middot; ${m(f.nation||"")} &middot; ${f.seats||0} seats</span>
                            ${f.ideology_value_1?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${P(f.ideology_value_1)};background:${P(f.ideology_value_1)}12;border:1px solid ${P(f.ideology_value_1)}30;">${m(f.ideology_value_1.toUpperCase())}</span>`:""}
                            ${f.ideology_value_2?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${P(f.ideology_value_2)};background:${P(f.ideology_value_2)}12;border:1px solid ${P(f.ideology_value_2)}30;">${m(f.ideology_value_2.toUpperCase())}</span>`:""}
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${h(f.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${y};font-weight:700;">${Number(f.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${u?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}c+="</div>",c+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${h(i)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l?"var(--panel-text)":"#c55"};">${h(a)}</div></div>
            ${s?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${m(s.abbreviation||s.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${s&&l?"#000":"#6a6660"};background:${s&&l?"#8a6aaa":"var(--panel-border)"};cursor:${s&&l?"pointer":"not-allowed"};${!s||!l?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,c+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',c+="</div>",e.innerHTML=c}let q=!1;async function wt(){if(!r||!w||I<0||q)return;const e=L[I];if(!e)return;const t=Number(w?.current_tick||0);if(new Set(A.map(b=>b.id)).has(e.id)){const b=document.getElementById("donate-error");b&&(b.textContent="You cannot donate to your own party.",b.style.display="block");return}const i=M("Lobbyist"),o=i?i.skill:50,a=Math.round(1e6*te(o)),s=1e5,l=2,{data:c,error:d}=await x.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",r.id).single();if(d||!c){const b=document.getElementById("donate-error");b&&(b.textContent="Failed to verify cooldown: "+(d?.message||"unknown"),b.style.display="block");return}const f=Number(c.last_donation_tick??0);if(f===t){const b=document.getElementById("donate-error");b&&(b.textContent="Political Donation is on cooldown until next tick.",b.style.display="block"),U("donate");return}const u=Number(c.corp_cash_reserves??0);if(u<a){const b=document.getElementById("donate-error");b&&(b.textContent="Insufficient cash. Need "+h(a)+", have "+h(u)+".",b.style.display="block");return}q=!0;const v=document.getElementById("donate-btn");v&&(v.style.opacity="0.4",v.style.pointerEvents="none");const y=Number(r.corp_reputation??50),p=Math.max(0,y-l),{data:g,error:_}=await x.from("factions").update({corp_cash_reserves:u-a,corp_reputation:p,last_donation_tick:t}).eq("id",r.id).eq("last_donation_tick",f).select("id");if(_){const b=document.getElementById("donate-error");q=!1,b&&(b.textContent="Failed: "+_.message,b.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto");return}if(!g||g.length===0){const b=document.getElementById("donate-error");q=!1,b&&(b.textContent="Political Donation is on cooldown until next tick.",b.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto"),U("donate");return}const{data:N}=await x.from("factions").select("party_funds").eq("id",e.id).single(),E=Number(N?.party_funds??0),{error:O}=await x.from("factions").update({party_funds:E+s}).eq("id",e.id);if(O){await x.from("factions").update({corp_cash_reserves:u}).eq("id",r.id);const b=document.getElementById("donate-error");q=!1,b&&(b.textContent="Failed to transfer funds: "+O.message,b.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto");return}r.corp_cash_reserves=u-a,r.corp_reputation=p;const V=r.faction_name||"Corporation",{error:K}=await x.from("event_log").insert({nation_id:e.nation_id||r.nation_id,faction_id:r.id,event_name:V+" — Political Donation",description_chosen:V+" has donated "+h(a)+" to "+(e.faction_name||"a political party")+". The party receives "+h(s)+" in campaign funds. Corporate reputation decreases by "+l+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:e.id,recipient_name:e.faction_name,funds_granted:s,reputation_loss:l,skill:o},fired_at_tick:t});K&&console.warn("Failed to log donation event:",K.message),q=!1,U("donate"),be()}function kt(e){B=e,H()}async function $t(e){if(R=e,T=-1,document.getElementById("exec-search-overlay").style.display="flex",J.length===0&&r?.nation_id){const t=r.nation||"",n=je(r.nation_id,t),{error:i}=await x.from("executive_pool").insert(n);i&&console.warn("Failed to generate executive pool:",i.message);const{data:o,error:a}=await x.from("executive_pool").select("*").eq("nation_id",r.nation_id).eq("status","available").order("skill",{ascending:!1});a&&console.warn("Failed to reload executive pool:",a.message),J=o||[]}Ae()}function Ie(){document.getElementById("exec-search-overlay").style.display="none",R=null,T=-1}function Ne(e){return J.filter(t=>t.status==="available"&&Array.isArray(t.specializations)&&t.specializations.includes(e)).sort((t,n)=>n.skill-t.skill)}function Et(e){T=e,Ae()}let se=!1;async function Ct(){if(!r||!w||!R||T<0||se)return;const t=Ne(R)[T];if(!t)return;se=!0;const n=w.current_tick||0,i=document.getElementById("es-hire-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const{error:o}=await x.from("corp_executives").insert({faction_id:r.id,role:R,first_name:t.first_name,last_name:t.last_name,age:t.age,origin_nation:t.origin_nation,skill:t.skill,salary_per_year:t.required_salary,contract_years:t.required_years,contract_start_tick:n,contract_end_tick:n+t.required_years*12,status:"active"});if(o){se=!1;const s=document.getElementById("es-error");s&&(s.textContent="Failed: "+o.message,s.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:a}=await x.from("executive_pool").update({status:"hired",hired_by_faction_id:r.id}).eq("id",t.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),se=!1,Ie(),await Ee(),B=le.indexOf(R),B<0&&(B=0),H()}function Ae(){const e=document.getElementById("exec-search-content");if(!e||!R)return;const t=R,n=ce[t],i=Ne(t),o=T>=0?i[T]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${n.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${n.color};">${m(t)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${m(n.fullTitle)}</span>
        </div>
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid var(--panel-border);overflow-y:auto;flex-shrink:0;">',i.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let s=0;s<i.length;s++){const l=i[s],c=T===s,d=Z(l.skill);a+=`<div onclick="esSelectCandidate(${s})" style="
            padding:10px 14px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${c?n.color:"transparent"};
            background:${c?n.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${n.color}10;border:1px solid ${n.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${n.color};flex-shrink:0;">${m(ve(l.first_name,l.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m(l.first_name)} ${m(l.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--panel-border);">
                                <div style="width:${l.skill}%;height:100%;background:${d};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${d};width:18px;text-align:right;">${l.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${X(l.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!o)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${i.length} candidate${i.length!==1?"s":""} available for ${m(t)}</div>
        </div>`;else{const s=o.required_salary*o.required_years,l=Z(o.skill);a+=`<div style="padding:20px;border-bottom:1px solid var(--panel-border);">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${n.color}12;border:1px solid ${n.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${n.color};">${m(ve(o.first_name,o.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${m(o.first_name)} ${m(o.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${m(o.origin_nation)} &middot; Age ${o.age}</div>
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
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${m(o.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of o.specializations||[]){const u=ce[f],v=f===t;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${v?"#000":u?.color||"#9e9a92"};background:${v?u?.color||"#5a8aaa":(u?.color||"#5a8aaa")+"10"};border:1px solid ${v?"transparent":(u?.color||"#5a8aaa")+"30"};">${m(f)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${o.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${X(o.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${X(s)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const c=o.skill>=80?"EXCEPTIONAL":o.skill>=65?"STRONG":o.skill>=50?"COMPETENT":o.skill>=35?"DEVELOPING":"WEAK",d=o.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":o.skill>=65?"Strong performer. Reliable outcomes across most actions.":o.skill>=50?"Adequate for the role. Outcomes are average.":o.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${l}08;border:1px solid ${l}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${l};letter-spacing:0.8px;margin-bottom:3px;">${c}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${d}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,o?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${m(o.first_name)} ${m(o.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${Z(o.skill)};">${o.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${X(o.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${o?"#000":"#6a6660"};background:${o?n.color:"var(--panel-border)"};cursor:${o?"pointer":"not-allowed"};${o?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',e.innerHTML=a}async function zt(){const{data:{user:e}}=await x.auth.getUser();if(!e){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(t){const{data:a,error:s}=await x.from("factions").select("*").eq("id",t).single();s?console.warn("[Inspector] faction fetch failed:",s.message):a?.faction_type==="corporation"&&(r=a)}if(!r){const{data:a}=await x.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);A=(a||[]).filter(l=>l.nation_id);const s=sessionStorage.getItem("active_faction_id");if(r=A.find(l=>l.id===s)||A.find(l=>l.faction_type==="corporation")||A[0],!r){await x.auth.signOut(),window.location.href="login.html";return}if(r.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[n,i]=await Promise.all([r.nation_id?x.from("nations").select("*").eq("id",r.nation_id).single():Promise.resolve({data:null}),x.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.data&&n.data,w=i.data;const o=document.getElementById("corp-topbar-container");o&&Be(o,{faction:r,shard:w,activeTab:"actions",allUserFactions:A}),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",await Promise.all([et(),Ee()]),H()}window.actExecute=at;window.actSelectExec=kt;window.confirmFireExec=nt;window.actCloseStatement=xe;window.actSubmitStatement=st;window.actCloseRestructure=ue;window.actSubmitRestructure=xt;window.actCloseRebrand=ge;window.actSubmitRebrand=gt;window.actCloseDonation=be;window.actSubmitDonation=wt;window.donateSelectParty=_t;window.lrClose=Re;window.lrSetAmount=ct;window.lrSetPurpose=dt;window.lrSetTerm=pt;window.lrSetCollateral=ft;window.lrSubmit=vt;window.openExecSearch=$t;window.closeExecSearch=Ie;window.esSelectCandidate=Et;window.esHireCandidate=Ct;zt();
