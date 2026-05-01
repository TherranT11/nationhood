import{_supabase as y}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{r as je}from"./role-actions-fros7AI4.js";import{escapeHtml as v,hfFmtBig as h}from"./utils-A98FEun4.js";import{renderCorpTopBar as He}from"./corp-topbar-BVNorCyj.js";import{c as Ye}from"./corp-valuation-CXafACL8.js";import{E as pe,a as fe,c as Ge,g as Ke}from"./corp-executives-Dy9E4H6_.js";import"./preload-helper-BXl3LOEh.js";import"./political-actions-CoM-LDWz.js";import"./config-CHsHqv7d.js";import"./government-structure-C17uG6rl.js";import"./stats-4gK98flh.js";function ae(e){if(e==null)return"";const t=document.createElement("div");return t.textContent=String(e),t.innerHTML}function Ve(e,t){return(e||"?")[0]+(t||"?")[0]}function We(e){return e>=70?"#5cb85c":e>=50?"#ca5":"#c84"}function Xe(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function Ce(e){const t=Number(e)||0,o=Math.abs(t),n=o>=1e9?(o/1e9).toFixed(1)+"B":o>=1e6?(o/1e6).toFixed(1)+"M":o>=1e3?Math.round(o/1e3)+"k":String(Math.round(o));return(t<0?"-$":"$")+n}function Qe(e,t){if(!e)return;const{faction:o,shard:n,ownedProperties:i=[],vessels:a=[],executives:s=[],selectedExecIdx:l=0}=t||{},c=o?.faction_name||"Corporation",p=(o?.abbreviation||o?.corp_ticker||"??").toUpperCase(),x=o?.corp_sector||"",g=o?.corp_subsector||"",f=Number(o?.corp_cash_reserves||0),m=Number(o?.corp_loans||0),d=Ye({cash:f,loans:m,properties:i,vessels:a,financeReceivables:0,currentTick:n?.current_tick||0}),u=Number(o?.corp_reputation??50),_=Math.max(0,Math.min(100,Math.round(Number.isFinite(u)?u:50))),S=_>=60?"var(--green)":_>=40?"var(--text-bright)":"var(--red)",$=i.length,B=d<0?"var(--red)":"var(--green)";je(e,{title:"Corporate Actions",entityName:`${c} · ${p}`,entityColor:"#8b9a6b",stats:[{label:"Cash",value:Ce(f),color:"var(--accent)"},{label:"Reputation",value:String(_),color:S},{label:"Valuation",value:Ce(d),color:B}],statusBarItems:[{type:"count",label:"Sector",big:x||"—",bigColor:"#8b9a6b",dim1:g||""},{type:"count",label:"Properties",big:String($),bigColor:"#8b9a6b",dim1:$===1?"building":"buildings"}],rolesContainerId:"corp-exec-list",panelContainerId:"corp-actions-panel",rolesColumnWidth:262});const V=document.getElementById("corp-exec-list");if(V){const b=new Map(s.map(R=>[R.role,R]));let X="";for(let R=0;R<pe.length;R++){const q=pe[R],Pe=fe[q],k=b.get(q)||null,ie=l===R,I=Pe.color,Be=!k;if(X+=`<div onclick="actSelectExec(${R})" style="
                padding:10px 12px;
                background:${ie?I+"0a":"var(--bg-2,#1a1a17)"};
                border:1px solid ${ie?I+"44":"var(--border-0,rgba(255,255,255,0.06))"};
                border-left:3px solid ${ie?I:"var(--border-0,rgba(255,255,255,0.06))"};
                cursor:pointer;
            ">`,Be&&q!=="CEO")X+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${I};">${ae(q)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                        <div style="margin-top:4px;">
                            <span onclick="event.stopPropagation();openExecSearch('${q}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                        </div>
                    </div>
                </div>`;else{const qe=k?`${k.first_name} ${k.last_name}`:"—",$e=k?k.age:0,ve=k?k.skill:0,Ue=k?k.salary_per_year:0,De=k?Ve(k.first_name,k.last_name):"—";X+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background:${I}15;border:1px solid ${I}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${I};flex-shrink:0;">${ae(De)}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${I};">${ae(q)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:${ie?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ae(qe)}${$e?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${$e})</span>`:""}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                            <div style="display:flex;align-items:center;gap:3px;flex:1;">
                                <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                    <div style="width:${ve}%;height:100%;background:${We(ve)};"></div>
                                </div>
                                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${ve}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${Xe(Ue)}/yr</span>
                        </div>
                    </div>
                </div>`}X+="</div>"}V.innerHTML=X}const W=document.getElementById("corp-actions-panel");W&&(W.innerHTML='<div id="actions-right-panel"></div>')}const Je=1e6,Ze=1e10,ze=1,Se=50,et=12;function tt(e){if(e<0)return"A";const t=Math.min(e,25);return String.fromCharCode(65+t)}async function ot(e,t,o){if(!e||!t||!o)return;if((e.corp_sector||"").toLowerCase()==="finance"){alert("Finance-sector corps fund equity; they do not raise it.");return}const n=prompt(`APPLY FOR EQUITY — STEP 1 / 3

How much capital do you want to raise? (in millions USD)

Example: 50 for a $50M raise.
Range: $1M – $10B.`);if(n===null)return;const i=parseFloat(n);if(isNaN(i)||i<=0){alert("Amount must be a positive number.");return}const a=Math.round(i*1e6);if(a<Je){alert("Minimum raise is $1M.");return}if(a>Ze){alert("Maximum raise is $10B.");return}const s=prompt(`APPLY FOR EQUITY — STEP 2 / 3

What stake are you offering in exchange? (percent)

Example: 12.5 for a 12.5% share of monthly profits.
Range: 1% – 50%.`);if(s===null)return;const l=parseFloat(s);if(isNaN(l)||l<ze||l>Se){alert(`Stake must be between ${ze}% and ${Se}%.`);return}const c=prompt(`APPLY FOR EQUITY — STEP 3 / 3

Describe the purpose of this raise.

Example: "Series B to fund fleet expansion across Mira ports."
Investment corps see this in Deal Flow when deciding whether to fund you.`);if(c===null)return;const p=(c||"").trim()||"Equity capital raise",{data:x,error:g}=await o.from("finance_loan_requests").select("id").eq("requesting_faction_id",e.id).eq("request_type","equity").eq("status","funded");if(g){alert("Could not look up prior raises: "+g.message);return}const f=tt((x||[]).length),m=`Post Series ${f} equity raise?

Amount:   $${i}M
Stake:    ${l}%
Series:   ${f}
Purpose:  ${p}

This becomes visible to Investment corps in Deal Flow. Once an investor buys in, your corp pays them ${l}% of monthly profit each tick.`;if(!confirm(m))return;const d=Number(t.current_tick||0),{error:u}=await o.from("finance_loan_requests").insert({requesting_faction_id:e.id,nation_id:e.nation_id,request_type:"equity",amount:a,equity_pct:l,series:f,term_months:120,purpose:p,status:"open",created_tick:d,expires_tick:d+et});if(u){alert("Failed to post equity raise: "+u.message);return}try{const _=e.faction_name+" ["+(e.abbreviation||e.corp_ticker||"??")+"]";await o.from("event_log").insert({nation_id:e.nation_id,event_name:"Series "+f+" Raise Opened",category:"corporate",faction_id:e.id,description_used:_+" has started the process of raising their series "+f+" and seeks investors.",fired_at_tick:d})}catch(_){console.warn("[equity-apply] Event log insert failed:",_?.message||_)}alert(`Series ${f} raise posted to Deal Flow. Investment corps can now fund you.`)}let ye=!1;async function nt(){if(ye)return;const{data:{user:e}}=await y.auth.getUser();if(!e){alert("Not logged in.");return}const t=sessionStorage.getItem("active_faction_id");if(!t){alert("No active faction selected.");return}const{data:o,error:n}=await y.from("factions").select("id, faction_name, corp_sector, faction_type, abandoned_at").eq("id",t).single();if(n||!o||o.faction_type!=="corporation"||o.abandoned_at){alert("No active corporation found. It may have already been dissolved.");return}const i=o.faction_name||"this corporation";if(!confirm("DECLARE BANKRUPTCY — "+i.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+i+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}ye=!0;try{const{data:s,error:l}=await y.rpc("declare_corp_bankruptcy",{p_faction_id:t});if(l)throw l;const c=Number(s?.total_payback||0),p=c>0?`
$`+c.toLocaleString()+" repaid to creditors.":"";sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:x,error:g}=await y.from("factions").select("id, faction_type").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);g&&console.warn("[Bankruptcy] remaining-factions lookup failed:",g.message);const f=(x||[]).find(d=>d.faction_type==="party"),m=(x||[]).find(d=>d.faction_type==="corporation");f?(sessionStorage.setItem("active_faction_id",f.id),alert(i+" has declared bankruptcy."+p+`

Redirecting to your political party.`),window.location.href="dashboard.html"):m?(sessionStorage.setItem("active_faction_id",m.id),alert(i+" has declared bankruptcy."+p+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(i+" has declared bankruptcy."+p+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(s){alert("Bankruptcy failed: "+(s?.message||s)+`

Please try again or contact support.`)}finally{ye=!1}}let L=[],r=null,w=null,G=[],te=[],j=0,N=null,A=-1,Te=[];async function it(){if(!r?.id)return;const{data:e}=await y.from("corp_properties").select("*").eq("faction_id",r.id).eq("is_active",!0);Te=e||[]}async function Re(){if(!r)return;const[e,t]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",r.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",r.nation_id).eq("status","available").order("skill",{ascending:!1})]);e.error&&console.warn("Failed to load executives:",e.error.message),t.error&&console.warn("Failed to load executive pool:",t.error.message),G=e.data||[],te=t.data||[];const o=await Ge({supabase:y,faction:r,currentTick:w?.current_tick||0,poolCandidates:te});o?.error&&console.warn("Failed to seed initial executive roster:",o.error.message||o.error),o?.executives&&(G=o.executives)}function J(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function F(e){return G.find(t=>t.role===e)||null}function ge(e,t){return(e||"?")[0]+(t||"?")[0]}function ee(e){return e>=70?"#5cb85c":e>=50?"#ca5":"#c84"}function P(){const e=document.getElementById("actions-container");e&&(Qe(e,{faction:r,shard:w,ownedProperties:Te,vessels:[],executives:G,selectedExecIdx:j}),rt())}const be={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]},{id:"equity",name:"Apply for Equity",desc:"Raise capital by offering Investment corps a stake in your monthly profits. Series (A/B/C…) is auto-assigned by your prior funded raise count. No repayment — investors get a percentage of profit each tick going forward.",cost:"FREE",costColor:"#c89a4a",tags:["FINANCIAL","STRUCTURAL"],hideForSector:"Finance"}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$2M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"},{id:"branding",name:"Branding",desc:"Upload a custom corporate logo. Replaces the default monogram on the dashboard, nation roster, and shipping vessels.",cost:"$1M",costColor:"#ca5",tags:["IDENTITY"],cooldownTicks:12}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function ne(e){return 1.5-e/100}let Ie={};function at(e){const t=w?.current_tick||0;return Ie[e]===t}function H(e){const t=w?.current_tick||0;Ie[e]=t}function rt(){const e=document.getElementById("actions-right-panel");if(!e)return;const t=pe[j],o=fe[t],n=F(t),i=(be[t]||[]).filter(s=>!s.hideForSector||(r?.corp_sector||"")!==s.hideForSector);if(!n){e.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${o.color};margin-bottom:6px;">${v(t)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${v(o.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${t}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${o.color}15;border:1px solid ${o.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${o.color};">${v(ge(n.first_name,n.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${o.color};">${v(t)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${v(n.first_name)} ${v(n.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${v(o.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${n.skill}%;height:100%;background:${ee(n.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${ee(n.skill)};">${n.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${J(n.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${n.contract_years}yr</div>
            </div>
            ${t!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${n.id}','${v(t)}','${v(n.first_name+" "+n.last_name)}',${n.salary_per_year},${n.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let s=0;s<i.length;s++){const l=i[s],c=!!l.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${c?"transparent":o.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${s<i.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${c?"0.4":"1"};
            cursor:${c?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${c?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${v(l.name)}</span>`;for(const p of l.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${p==="IRREVERSIBLE"?"#c55":p==="OFFENSIVE"?"#c84":p==="STRUCTURAL"?"#ca5":p==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${v(p)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l.costColor};">${v(l.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${c?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${v(l.desc)}</div>`,l.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${v(l.descRed)}</div>`),c&&l.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${v(l.lockReason)}</span>
            </div>`),c||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${l.id}','${t}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${o.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${o.color};font-weight:700;">${v(t)}</span> skill (${n.skill}/100) affects action outcomes.
            ${n.skill>=70?" High skill increases success probability and reduces costs.":n.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,e.innerHTML=a,e.querySelectorAll("[onmouseenter]").forEach(s=>{s.addEventListener("mouseenter",function(){const l=this.querySelector(".act-exec-btn");l&&(l.style.display="block")}),s.addEventListener("mouseleave",function(){const l=this.querySelector(".act-exec-btn");l&&(l.style.display="none")})})}function st(e,t,o,n,i){const a=w?.current_tick||0,s=Math.max(0,i-a),l=Math.round(n*(s/12)),c=`FIRE ${t}: ${o}

Contract remaining: ${s} ticks
Payout (prorated): $${(l/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(c)&&lt(e,t,l)}async function lt(e,t,o){try{const n=Number(r?.corp_cash_reserves??0);if(n<o){alert(`Insufficient funds. You need $${(o/1e6).toFixed(2)}M but only have $${(n/1e6).toFixed(2)}M.`);return}const i=n-o,{error:a}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",r.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:s}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",e);if(s){await y.from("factions").update({corp_cash_reserves:n}).eq("id",r.id),alert("Failed to fire executive: "+s.message);return}r.corp_cash_reserves=i,G=G.filter(l=>l.id!==e),P()}catch(n){console.error("[CorpOps] Fire executive error:",n),alert("An error occurred.")}}function ct(e,t){const o=(be[t]||[]).find(n=>n.id===e);if(o?.cooldown==="once/tick"&&at(e)){alert("This action can only be used once per tick. Wait for the next tick.");return}if(o?.cooldownTicks){const n=dt(e);if(n>0){alert(`On cooldown — ${n} tick${n===1?"":"s"} remaining.`);return}}switch(e){case"statement":return pt();case"loan":return mt();case"equity":return ot(r,w,y);case"restructure":return ht();case"rebrand":return wt();case"branding":return Et();case"donate":return zt();case"bankruptcy":return nt()}}function dt(e){if(e!=="branding")return 0;const o=(be.CMO||[]).find(s=>s.id===e)?.cooldownTicks||0,n=Number(r?.last_branding_tick);if(!Number.isFinite(n)||n<=0)return 0;const a=(Number(w?.current_tick)||0)-n;return a>=o?0:o-a}let ue=!1;function pt(){if(ue)return;ue=!0;const e=document.createElement("div");e.id="stmt-overlay",e.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",e.onclick=function(c){c.target===e&&he()};const t=r?.faction_name||"Corporation",o=(r?.abbreviation||r?.corp_ticker||"??").toUpperCase(),n=Number(r?.corp_cash_reserves??0),i=F("CEO"),a=i?`${i.first_name} ${i.last_name}`:"CEO";e.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${v(o)}</span>
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
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${n<2e4?"#c55":"var(--panel-text)"};">${h(n)}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="actCloseStatement()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
                    <div id="stmt-submit-btn" onclick="actSubmitStatement()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c8a832;cursor:pointer;">PUBLISH</div>
                </div>
            </div>
            <div id="stmt-error" style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
        </div>
    </div>`,document.body.appendChild(e);const s=document.getElementById("stmt-text"),l=document.getElementById("stmt-chars");s&&l&&(s.addEventListener("input",function(){l.textContent=this.value.length+"/500"}),s.focus())}function he(){const e=document.getElementById("stmt-overlay");e&&e.remove(),ue=!1}let Q=!1;async function ft(){if(!r||!w||Q)return;const e=document.getElementById("stmt-text"),t=document.getElementById("stmt-error"),o=(e?.value||"").trim();if(!o){t&&(t.textContent="Statement cannot be empty.",t.style.display="block");return}if(o.length>500){t&&(t.textContent="Statement too long (max 500 chars).",t.style.display="block");return}const n=F("CEO"),i=n?n.skill:50,a=Math.round(2e4*ne(i)),s=Number(r.corp_cash_reserves??0);if(s<a){t&&(t.textContent="Insufficient cash. Need "+h(a)+".",t.style.display="block");return}Q=!0;const l=document.getElementById("stmt-submit-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const c=r.faction_name||"Corporation",p=n?`${n.first_name} ${n.last_name}`:"CEO",x=w.current_tick||0,{error:g}=await y.from("factions").update({corp_cash_reserves:s-a}).eq("id",r.id);if(g){Q=!1,t&&(t.textContent="Failed to deduct cost: "+g.message,t.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}const{error:f}=await y.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:c+" — Press Release",description_used:p+", CEO of "+c+': "'+o.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:p,skill:i},fired_at_tick:x});if(f){await y.from("factions").update({corp_cash_reserves:s}).eq("id",r.id),Q=!1,t&&(t.textContent="Failed to publish: "+f.message,t.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}r.corp_cash_reserves=s-a,Q=!1,H("statement"),he()}const Ne=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],xe=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let E=25e7,oe="equipment",Y=48,C="equipment",me="",Z=[];function mt(){E=25e7,oe="equipment",Y=48,C="equipment",me="",document.getElementById("lr-overlay").style.display="flex",ut(),K()}function Ae(){document.getElementById("lr-overlay").style.display="none"}function vt(e){E=Math.max(1e6,Math.min(5e9,Number(e)||0)),K()}function yt(e){oe=e,K()}function xt(e){Y=e,K()}function gt(e){C=e,K()}async function ut(){if(!r)return;const{data:e}=await y.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",r.id);Z=e||[],K()}function K(){const e=document.getElementById("lr-modal-content");if(!e)return;const t=Number(r?.corp_cash_reserves??0),o=Number(r?.corp_loans??0),n=Number(r?.corp_reputation??50),i=r?.faction_name||"Corporation",a=(r?.abbreviation||r?.corp_ticker||"??").toUpperCase(),s=o+E,l=s>t*3?"#c55":s>t*1.5?"#c84":s>t?"#ca5":"#5c5",c=s>t*3?"DANGEROUS":s>t*1.5?"HEAVY":s>t?"MODERATE":"HEALTHY",p=C==="none"?"10-16%":C==="equipment"?"7-12%":C==="property"?"5-9%":"4-7%",g=Math.round(E*(C==="none"?.13:C==="equipment"?.095:C==="property"?.07:.055)/12+E/Y),f=xe.find(d=>d.id===C)||xe[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
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
            <span style="font-size:10px;color:var(--panel-text);">${v(i)}</span>
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
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c84;margin-top:1px;">${h(o)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REPUTATION</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${n}</div>
        </div>
    </div>`,m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${h(E)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${E}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const d of Ne){const u=oe===d.id;m+=`<div onclick="lrSetPurpose('${d.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${u?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${u?"#5a8aaa44":"var(--panel-border)"};border-left:2px solid ${u?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${u?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${d.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${u?"var(--panel-text)":"#9e9a92"};">${d.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${d.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${Y} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const d of[12,24,36,48,60,84,120]){const u=Y===d;m+=`<span onclick="lrSetTerm(${d})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${u?"#000":"#6a6660"};background:${u?"#5a8aaa":"transparent"};border:1px solid ${u?"#5a8aaa":"var(--panel-border)"};">${d}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const d of xe){const u=C===d.id;m+=`<div onclick="lrSetCollateral('${d.id}')" style="padding:6px 8px;cursor:pointer;background:${u?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${u?"#5a8aaa44":"var(--panel-border)"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${u?"#5a8aaa":"#6a6660"};">${d.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${d.riskColor};">${d.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${d.desc}</div>
        </div>`}if(m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${v(me)}</textarea>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${h(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${h(E)}</span>
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
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,Z.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const d of Z){const u=(d.corp_company_type||"").toLowerCase()==="state"?"#c84":(d.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--bg-panel);border:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${v((d.abbreviation||d.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:var(--panel-text);flex:1;">${v(d.faction_name)}</span>
                ${d.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${u};background:${u}12;border:1px solid ${u}25;">${v(d.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';m+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',m+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">${p}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">~${h(g)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${h(E)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${f.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${Z.length} lender${Z.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',e.innerHTML=m}let re=!1;async function bt(){if(!r||!w||re)return;const e=document.getElementById("lr-error");if(E<1e6){e.textContent="Minimum loan amount is $1M.",e.style.display="block";return}if(E>5e9){e.textContent="Maximum loan amount is $5B.",e.style.display="block";return}const o=((Ne.find(s=>s.id===oe)||{}).label||oe)+(me?" — "+me:""),n=document.getElementById("lr-submit-btn");re=!0,n.style.opacity="0.5",n.style.pointerEvents="none";const i=w.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:r.id,nation_id:r.nation_id,amount:E,term_months:Y,purpose:o,created_tick:i,expires_tick:i+5});if(n.style.opacity="1",n.style.pointerEvents="auto",a){re=!1,e.textContent="Failed to submit: "+a.message,e.style.display="block",n.style.opacity="1",n.style.pointerEvents="auto";return}re=!1,Ae()}function ht(){if(!r)return;const e=Number(r.corp_loans??0),t=Number(r.corp_reputation??50),o=Number(r.corp_general_workforce??0),n=Number(r.corp_skilled_workforce??0),i=Number(r.corp_innovative_workforce??0),a=o+n+i;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const s=F("COO"),l=s?s.skill:50,c=ne(l),p=10+Math.floor(Math.random()*11),x=Math.round(a*p/100),g=Math.round(e*.07),f=Math.round(g*(2-c)),m=3+Math.floor(Math.random()*10),d=Math.max(1,Math.round(m*c)),u=Math.round(o/a*x),_=Math.round(n/a*x),S=Math.max(0,Math.min(i,x-u-_)),$=document.createElement("div");$.id="restr-overlay",$.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",$.onclick=function(B){B.target===$&&_e()},$.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${x} employees (${p}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${o} &rarr; ${o-u}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${u}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${n} &rarr; ${n-_}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${_}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${i} &rarr; ${i-S}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${S}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT REDUCTION (~7%)</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${h(f)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION HIT</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${d} (${t} &rarr; ${Math.max(0,t-d)})</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#c84;margin-top:6px;">&#9888; This action cannot be undone. Laid-off workers must be re-hired.</div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${p},${f},${d},${u},${_},${S})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild($)}function _e(){const e=document.getElementById("restr-overlay");e&&e.remove()}let se=!1;async function _t(e,t,o,n,i,a){if(!r||!w||se)return;se=!0;const s=document.getElementById("restr-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const l=Number(r.corp_general_workforce??0),c=Number(r.corp_skilled_workforce??0),p=Number(r.corp_innovative_workforce??0),x=Number(r.corp_loans??0),g=Number(r.corp_reputation??50),f={corp_general_workforce:Math.max(0,l-n),corp_skilled_workforce:Math.max(0,c-i),corp_innovative_workforce:Math.max(0,p-a),corp_loans:Math.max(0,x-t),corp_reputation:Math.max(0,g-o)},{error:m}=await y.from("factions").update(f).eq("id",r.id);if(m){se=!1;const _=document.getElementById("restr-error");_&&(_.textContent="Failed: "+m.message,_.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}Object.assign(r,f);const d=w.current_tick||0,{error:u}=await y.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:(r.faction_name||"Corporation")+" — Restructuring",description_used:(r.faction_name||"A corporation")+" has announced a restructuring, laying off "+e+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:e,debt_cut:t,rep_loss:o},fired_at_tick:d});u&&console.warn("Failed to log restructure event:",u.message),se=!1,H("restructure"),_e(),P()}function wt(){const e=F("CMO"),t=e?e.skill:50,o=ne(t),n=Math.round(2e6*o),i=Math.max(1,Math.round(5*o)),a=Number(r?.corp_cash_reserves??0),s=Number(r?.corp_reputation??50),l=r?.faction_name||"",c=r?.abbreviation||r?.corp_ticker||"",p=document.createElement("div");p.id="rebrand-overlay",p.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",p.onclick=function(x){x.target===p&&we()},p.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${h(n)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${i} (${s} &rarr; ${Math.max(0,s-i)})</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">SKILL MODIFIER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${o<=1?"#5cb85c":"#c84"};">&times;${o.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${a<n?"#c55":"var(--panel-text)"};">${h(a-n)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${n},${i})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${a>=n?"pointer":"not-allowed"};${a<n?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(p)}function we(){const e=document.getElementById("rebrand-overlay");e&&e.remove()}let le=!1;async function kt(e,t){if(!r||!w||le)return;const o=e||2e6,n=t||5,i=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),s=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){i&&(i.textContent="Name must be at least 2 characters.",i.style.display="block");return}if(!s||s.length<2||s.length>5){i&&(i.textContent="Abbreviation must be 2-5 characters.",i.style.display="block");return}const l=Number(r.corp_cash_reserves??0);if(l<o){i&&(i.textContent="Insufficient cash. Need "+h(o)+".",i.style.display="block");return}le=!0;const c=document.getElementById("rebrand-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const p=Number(r.corp_reputation??50),x=r.faction_name||"Corporation",{error:g}=await y.from("factions").update({faction_name:a,abbreviation:s,corp_ticker:s,corp_cash_reserves:l-o,corp_reputation:Math.max(0,p-n)}).eq("id",r.id);if(g){le=!1,i&&(i.textContent="Failed: "+g.message,i.style.display="block"),c&&(c.style.opacity="1",c.style.pointerEvents="auto");return}r.faction_name=a,r.abbreviation=s,r.corp_ticker=s,r.corp_cash_reserves=l-o,r.corp_reputation=Math.max(0,p-n);const f=w.current_tick||0,{error:m}=await y.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:"Corporation Rebranded",description_used:x+" has rebranded to "+a+" ("+s+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:x,new_name:a,new_abbr:s,rep_loss:n,cost:o},fired_at_tick:f});m&&console.warn("Failed to log rebrand event:",m.message),le=!1,H("rebrand"),we(),P(),document.getElementById("corp-name-bar").textContent=a;const d=document.getElementById("corp-logo");d&&(d.textContent=s.slice(0,2))}const z=1e6,de=12;let T=null,U=!1;function Et(){T=null;const e=Number(r?.corp_cash_reserves??0),t=r?.custom_logo_url||"",o=document.createElement("div");o.id="branding-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(i){i.target===o&&ke()};const n=t?`<img src="${v(t)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:`<span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#6a6660;">${v((r?.abbreviation||r?.corp_ticker||"??").slice(0,2))}</span>`;o.innerHTML=`<div onclick="event.stopPropagation()" style="width:460px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
            <div id="branding-preview" style="width:84px;height:84px;background:var(--bg-panel);border:1px solid var(--panel-border);border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">${n}</div>
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${h(z)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COOLDOWN</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);">${de} TICKS</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${e<z?"#c55":"var(--panel-text)"};">${h(e-z)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseBranding()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="branding-btn" onclick="actSubmitBranding()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${e>=z?"pointer":"not-allowed"};${e<z?"opacity:0.4;pointer-events:none;":""}">UPLOAD &amp; CONFIRM</div>
        </div>
        <div id="branding-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(o)}function ke(){const e=document.getElementById("branding-overlay");e&&e.remove(),T=null}function $t(e){const t=e.target.files?.[0],o=document.getElementById("branding-error"),n=document.getElementById("branding-filename");if(!t){T=null,n&&(n.textContent="");return}if(t.size>128*1024){T=null,n&&(n.textContent=""),o&&(o.textContent="File too large — must be under 128 KB.",o.style.display="block");return}T=t,o&&(o.style.display="none"),n&&(n.textContent=t.name);const i=document.getElementById("branding-preview");if(i){const a=new FileReader;a.onload=s=>{i.innerHTML=`<img src="${s.target.result}" alt="" style="width:100%;height:100%;object-fit:cover;">`},a.readAsDataURL(t)}}async function Ct(){if(!r||!w||U)return;const e=document.getElementById("branding-error"),t=document.getElementById("branding-btn");if(!T){e&&(e.textContent="Choose a logo file first.",e.style.display="block");return}const o=Number(w.current_tick)||0,{data:n,error:i}=await y.from("factions").select("corp_cash_reserves, last_branding_tick").eq("id",r.id).single();if(i||!n){e&&(e.textContent="Failed to verify cooldown: "+(i?.message||"unknown"),e.style.display="block");return}const a=n.last_branding_tick==null?null:Number(n.last_branding_tick);if(a!=null&&o-a<de){const d=de-(o-a);e&&(e.textContent=`On cooldown — ${d} tick${d===1?"":"s"} remaining.`,e.style.display="block");return}const s=Number(n.corp_cash_reserves??0);if(s<z){e&&(e.textContent="Insufficient cash. Need "+h(z)+".",e.style.display="block");return}U=!0,t&&(t.style.opacity="0.4",t.style.pointerEvents="none",t.textContent="UPLOADING...");let l;try{const d=(T.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png",u=`party-logos/${r.id}/${Date.now()}.${d}`,{error:_}=await y.storage.from("public-assets").upload(u,T,{contentType:T.type,upsert:!0});if(_)throw _;const{data:S}=y.storage.from("public-assets").getPublicUrl(u);if(l=S?.publicUrl||null,!l)throw new Error("Could not resolve public URL.")}catch(d){U=!1,e&&(e.textContent="Upload failed: "+(d.message||"Unknown error"),e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}const c={custom_logo_url:l,corp_cash_reserves:s-z,last_branding_tick:o};let p=y.from("factions").update(c).eq("id",r.id);p=a==null?p.is("last_branding_tick",null):p.eq("last_branding_tick",a);const{data:x,error:g}=await p.select("id");if(g){U=!1,e&&(e.textContent="Failed: "+g.message,e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}if(!x||x.length===0){U=!1,e&&(e.textContent="Branding is on cooldown. Refresh to see the latest state.",e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}r.custom_logo_url=l,r.corp_cash_reserves=s-z,r.last_branding_tick=o;const{error:f}=await y.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:"Corporation Rebranded (Logo)",description_used:`${r.faction_name||"Corporation"} unveiled a new corporate logo.`,category:"corporate",trigger_key:"corp_branding",effects_applied:{logo_url:l,cost:z,cooldown_ticks:de},fired_at_tick:o});f&&console.warn("Failed to log branding event:",f.message),U=!1,ke(),P();const m=document.getElementById("corp-logo");m&&(m.innerHTML=`<img src="${l}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`)}window.actBrandingPickFile=$t;window.actSubmitBranding=Ct;window.actCloseBranding=ke;let M=[],O=-1;async function zt(){Number(r?.corp_cash_reserves??0);const e=[r.nation_id],t=new Set(L.map(i=>i.id)),{data:o}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id").eq("faction_type","party").in("nation_id",e).is("abandoned_at",null).order("seats",{ascending:!1});M=(o||[]).filter(i=>!t.has(i.id)).map(i=>({...i})),O=-1;const n=document.createElement("div");n.id="donate-overlay",n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",n.onclick=function(i){i.target===n&&Ee()},document.body.appendChild(n),Oe()}function Ee(){const e=document.getElementById("donate-overlay");e&&e.remove(),M=[],O=-1}function St(e){O=e,Oe()}function Oe(){const e=document.getElementById("donate-overlay");if(!e)return;const t=F("Lobbyist"),o=t?t.skill:50,n=Math.round(1e6*ne(o)),i=1e5,a=Number(r?.corp_cash_reserves??0),s=O>=0?M[O]:null,l=a>=n;let c='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';c+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#8a6aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Political Donation</span>
            </div>
            <span onclick="actCloseDonation()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Cost:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#ca5;">${h(n)}</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">&rarr; Target party receives</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#5cb85c;">+${h(i)}</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in the nation where your National HQ is located. You cannot donate to your own party.</div>
    </div>`,c+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',c+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',M.length===0&&(c+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let p=0;p<M.length;p++){const x=M[p],g=O===p,f=x.party_color||"#8a6aaa",m=(x.momentum||0)>0?"var(--panel-text)":"#c55";c+=`<div onclick="donateSelectParty(${p})" style="
            padding:10px 20px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${g?f:"transparent"};
            background:${g?f+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${f};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${g?"var(--panel-text)":"#9e9a92"};">${v(x.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${v(x.abbreviation||"??")} &middot; ${v(x.nation||"")} &middot; ${x.seats||0} seats</span>
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${h(x.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${m};font-weight:700;">${Number(x.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${g?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}c+="</div>",c+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${h(n)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l?"var(--panel-text)":"#c55"};">${h(a)}</div></div>
            ${s?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${v(s.abbreviation||s.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${s&&l?"#000":"#6a6660"};background:${s&&l?"#8a6aaa":"var(--panel-border)"};cursor:${s&&l?"pointer":"not-allowed"};${!s||!l?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,c+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',c+="</div>",e.innerHTML=c}let D=!1;async function Tt(){if(!r||!w||O<0||D)return;const e=M[O];if(!e)return;const t=Number(w?.current_tick||0);if(new Set(L.map(b=>b.id)).has(e.id)){const b=document.getElementById("donate-error");b&&(b.textContent="You cannot donate to your own party.",b.style.display="block");return}const n=F("Lobbyist"),i=n?n.skill:50,a=Math.round(1e6*ne(i)),s=1e5,l=2,{data:c,error:p}=await y.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",r.id).single();if(p||!c){const b=document.getElementById("donate-error");b&&(b.textContent="Failed to verify cooldown: "+(p?.message||"unknown"),b.style.display="block");return}const x=Number(c.last_donation_tick??0);if(x===t){const b=document.getElementById("donate-error");b&&(b.textContent="Political Donation is on cooldown until next tick.",b.style.display="block"),H("donate");return}const g=Number(c.corp_cash_reserves??0);if(g<a){const b=document.getElementById("donate-error");b&&(b.textContent="Insufficient cash. Need "+h(a)+", have "+h(g)+".",b.style.display="block");return}D=!0;const f=document.getElementById("donate-btn");f&&(f.style.opacity="0.4",f.style.pointerEvents="none");const m=Number(r.corp_reputation??50),d=Math.max(0,m-l),{data:u,error:_}=await y.from("factions").update({corp_cash_reserves:g-a,corp_reputation:d,last_donation_tick:t}).eq("id",r.id).eq("last_donation_tick",x).select("id");if(_){const b=document.getElementById("donate-error");D=!1,b&&(b.textContent="Failed: "+_.message,b.style.display="block"),f&&(f.style.opacity="1",f.style.pointerEvents="auto");return}if(!u||u.length===0){const b=document.getElementById("donate-error");D=!1,b&&(b.textContent="Political Donation is on cooldown until next tick.",b.style.display="block"),f&&(f.style.opacity="1",f.style.pointerEvents="auto"),H("donate");return}const{data:S}=await y.from("factions").select("party_funds").eq("id",e.id).single(),$=Number(S?.party_funds??0),{error:B}=await y.from("factions").update({party_funds:$+s}).eq("id",e.id);if(B){await y.from("factions").update({corp_cash_reserves:g}).eq("id",r.id);const b=document.getElementById("donate-error");D=!1,b&&(b.textContent="Failed to transfer funds: "+B.message,b.style.display="block"),f&&(f.style.opacity="1",f.style.pointerEvents="auto");return}r.corp_cash_reserves=g-a,r.corp_reputation=d;const V=r.faction_name||"Corporation",{error:W}=await y.from("event_log").insert({nation_id:e.nation_id||r.nation_id,faction_id:r.id,event_name:V+" — Political Donation",description_chosen:V+" has donated "+h(a)+" to "+(e.faction_name||"a political party")+". The party receives "+h(s)+" in campaign funds. Corporate reputation decreases by "+l+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:e.id,recipient_name:e.faction_name,funds_granted:s,reputation_loss:l,skill:i},fired_at_tick:t});W&&console.warn("Failed to log donation event:",W.message),D=!1,H("donate"),Ee()}function Rt(e){j=e,P()}async function It(e){if(N=e,A=-1,document.getElementById("exec-search-overlay").style.display="flex",te.length===0&&r?.nation_id){const t=r.nation||"",o=Ke(r.nation_id,t),{error:n}=await y.from("executive_pool").insert(o);n&&console.warn("Failed to generate executive pool:",n.message);const{data:i,error:a}=await y.from("executive_pool").select("*").eq("nation_id",r.nation_id).eq("status","available").order("skill",{ascending:!1});a&&console.warn("Failed to reload executive pool:",a.message),te=i||[]}Fe()}function Le(){document.getElementById("exec-search-overlay").style.display="none",N=null,A=-1}function Me(e){return te.filter(t=>t.status==="available"&&Array.isArray(t.specializations)&&t.specializations.includes(e)).sort((t,o)=>o.skill-t.skill)}function Nt(e){A=e,Fe()}let ce=!1;async function At(){if(!r||!w||!N||A<0||ce)return;const t=Me(N)[A];if(!t)return;ce=!0;const o=w.current_tick||0,n=document.getElementById("es-hire-btn");n&&(n.style.opacity="0.4",n.style.pointerEvents="none");const{error:i}=await y.from("corp_executives").insert({faction_id:r.id,role:N,first_name:t.first_name,last_name:t.last_name,age:t.age,origin_nation:t.origin_nation,skill:t.skill,salary_per_year:t.required_salary,contract_years:t.required_years,contract_start_tick:o,contract_end_tick:o+t.required_years*12,status:"active"});if(i){ce=!1;const s=document.getElementById("es-error");s&&(s.textContent="Failed: "+i.message,s.style.display="block"),n&&(n.style.opacity="1",n.style.pointerEvents="auto");return}const{error:a}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:r.id}).eq("id",t.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),ce=!1,Le(),await Re(),j=pe.indexOf(N),j<0&&(j=0),P()}function Fe(){const e=document.getElementById("exec-search-content");if(!e||!N)return;const t=N,o=fe[t],n=Me(t),i=A>=0?n[A]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${o.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${o.color};">${v(t)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${v(o.fullTitle)}</span>
        </div>
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid var(--panel-border);overflow-y:auto;flex-shrink:0;">',n.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let s=0;s<n.length;s++){const l=n[s],c=A===s,p=ee(l.skill);a+=`<div onclick="esSelectCandidate(${s})" style="
            padding:10px 14px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${c?o.color:"transparent"};
            background:${c?o.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${o.color}10;border:1px solid ${o.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o.color};flex-shrink:0;">${v(ge(l.first_name,l.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v(l.first_name)} ${v(l.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--panel-border);">
                                <div style="width:${l.skill}%;height:100%;background:${p};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${p};width:18px;text-align:right;">${l.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${J(l.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!i)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${n.length} candidate${n.length!==1?"s":""} available for ${v(t)}</div>
        </div>`;else{const s=i.required_salary*i.required_years,l=ee(i.skill);a+=`<div style="padding:20px;border-bottom:1px solid var(--panel-border);">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${o.color}12;border:1px solid ${o.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${o.color};">${v(ge(i.first_name,i.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${v(i.first_name)} ${v(i.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${v(i.origin_nation)} &middot; Age ${i.age}</div>
                </div>
            </div>
        </div>`,a+=`<div style="display:flex;gap:0;border-bottom:1px solid var(--panel-border);">
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">SKILL</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:5px;">
                    <div style="width:60px;height:4px;background:var(--panel-border);">
                        <div style="width:${i.skill}%;height:100%;background:${l};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${l};">${i.skill}</span>
                </div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">AGE</div>
                <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${i.age}</div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">ORIGIN</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${v(i.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const x of i.specializations||[]){const g=fe[x],f=x===t;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${f?"#000":g?.color||"#9e9a92"};background:${f?g?.color||"#5a8aaa":(g?.color||"#5a8aaa")+"10"};border:1px solid ${f?"transparent":(g?.color||"#5a8aaa")+"30"};">${v(x)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${i.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${J(i.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${J(s)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const c=i.skill>=80?"EXCEPTIONAL":i.skill>=65?"STRONG":i.skill>=50?"COMPETENT":i.skill>=35?"DEVELOPING":"WEAK",p=i.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":i.skill>=65?"Strong performer. Reliable outcomes across most actions.":i.skill>=50?"Adequate for the role. Outcomes are average.":i.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${l}08;border:1px solid ${l}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${l};letter-spacing:0.8px;margin-bottom:3px;">${c}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${p}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,i?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${v(i.first_name)} ${v(i.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${ee(i.skill)};">${i.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${J(i.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${i?"#000":"#6a6660"};background:${i?o.color:"var(--panel-border)"};cursor:${i?"pointer":"not-allowed"};${i?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',e.innerHTML=a}async function Ot(){const{data:{user:e}}=await y.auth.getUser();if(!e){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(t){const{data:a,error:s}=await y.from("factions").select("*").eq("id",t).single();s?console.warn("[Inspector] faction fetch failed:",s.message):a?.faction_type==="corporation"&&(r=a)}if(!r){const{data:a}=await y.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);L=(a||[]).filter(l=>l.nation_id);const s=sessionStorage.getItem("active_faction_id");if(r=L.find(l=>l.id===s)||L.find(l=>l.faction_type==="corporation")||L[0],!r){await y.auth.signOut(),window.location.href="login.html";return}if(r.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[o,n]=await Promise.all([r.nation_id?y.from("nations").select("*").eq("id",r.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);o.data&&o.data,w=n.data;const i=document.getElementById("corp-topbar-container");i&&He(i,{faction:r,shard:w,activeTab:"actions",allUserFactions:L}),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",await Promise.all([it(),Re()]),P()}window.actExecute=ct;window.actSelectExec=Rt;window.confirmFireExec=st;window.actCloseStatement=he;window.actSubmitStatement=ft;window.actCloseRestructure=_e;window.actSubmitRestructure=_t;window.actCloseRebrand=we;window.actSubmitRebrand=kt;window.actCloseDonation=Ee;window.actSubmitDonation=Tt;window.donateSelectParty=St;window.lrClose=Ae;window.lrSetAmount=vt;window.lrSetPurpose=yt;window.lrSetTerm=xt;window.lrSetCollateral=gt;window.lrSubmit=bt;window.openExecSearch=It;window.closeExecSearch=Le;window.esSelectCandidate=Nt;window.esHireCandidate=At;Ot();
