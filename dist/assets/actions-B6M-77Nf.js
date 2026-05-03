import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{r as He}from"./role-actions-ClNxOfgz.js";import{e as f,h as $}from"./utils-DGqmZD5X.js";import{renderCorpTopBar as Ge}from"./corp-topbar-B9cSZncf.js";import{c as Ye}from"./corp-valuation-DRgj4yjT.js";import{E as pe,a as fe,c as Ke,g as Ve}from"./corp-executives-Dy9E4H6_.js";import"./preload-helper-BXl3LOEh.js";import"./political-actions-CoM-LDWz.js";import"./config-CHsHqv7d.js";import"./government-structure-C17uG6rl.js";import"./stats-4gK98flh.js";function ae(e){if(e==null)return"";const t=document.createElement("div");return t.textContent=String(e),t.innerHTML}function Xe(e,t){return(e||"?")[0]+(t||"?")[0]}function We(e){return e>=70?"#5cb85c":e>=50?"#ca5":"#c84"}function Qe(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function Se(e){const t=Number(e)||0,o=Math.abs(t),i=o>=1e9?(o/1e9).toFixed(1)+"B":o>=1e6?(o/1e6).toFixed(1)+"M":o>=1e3?Math.round(o/1e3)+"k":String(Math.round(o));return(t<0?"-$":"$")+i}function Je(e,t){if(!e)return;const{faction:o,shard:i,ownedProperties:n=[],vessels:a=[],executives:s=[],selectedExecIdx:l=0}=t||{},c=o?.faction_name||"Corporation",d=(o?.abbreviation||o?.corp_ticker||"??").toUpperCase(),v=o?.corp_sector||"",p=o?.corp_subsector||"",m=Number(o?.corp_cash_reserves||0),h=Number(o?.corp_loans||0),u=Ye({cash:m,loans:h,properties:n,vessels:a,financeReceivables:0,currentTick:i?.current_tick||0}),_=Number(o?.corp_reputation??50),b=Math.max(0,Math.min(100,Math.round(Number.isFinite(_)?_:50))),z=b>=60?"var(--green)":b>=40?"var(--text-bright)":"var(--red)",x=n.length,k=u<0?"var(--red)":"var(--green)";He(e,{title:"Corporate Actions",entityName:`${c} · ${d}`,entityColor:"#8b9a6b",stats:[{label:"Cash",value:Se(m),color:"var(--accent)"},{label:"Reputation",value:String(b),color:z},{label:"Valuation",value:Se(u),color:k}],statusBarItems:[{type:"count",label:"Sector",big:v||"—",bigColor:"#8b9a6b",dim1:p||""},{type:"count",label:"Properties",big:String(x),bigColor:"#8b9a6b",dim1:x===1?"building":"buildings"}],rolesContainerId:"corp-exec-list",panelContainerId:"corp-actions-panel",rolesColumnWidth:262});const I=document.getElementById("corp-exec-list");if(I){const g=new Map(s.map(T=>[T.role,T]));let M="";for(let T=0;T<pe.length;T++){const Y=pe[T],Fe=fe[Y],E=g.get(Y)||null,ie=l===T,O=Fe.color,qe=!E;if(M+=`<div onclick="actSelectExec(${T})" style="
                padding:10px 12px;
                background:${ie?O+"0a":"var(--bg-2,#1a1a17)"};
                border:1px solid ${ie?O+"44":"var(--border-0,rgba(255,255,255,0.06))"};
                border-left:3px solid ${ie?O:"var(--border-0,rgba(255,255,255,0.06))"};
                cursor:pointer;
            ">`,qe&&Y!=="CEO")M+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${O};">${ae(Y)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                        <div style="margin-top:4px;">
                            <span onclick="event.stopPropagation();openExecSearch('${Y}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                        </div>
                    </div>
                </div>`;else{const Ue=E?`${E.first_name} ${E.last_name}`:"—",ze=E?E.age:0,ye=E?E.skill:0,je=E?E.salary_per_year:0,De=E?Xe(E.first_name,E.last_name):"—";M+=`<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background:${O}15;border:1px solid ${O}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${O};flex-shrink:0;">${ae(De)}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${O};">${ae(Y)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:${ie?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ae(Ue)}${ze?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${ze})</span>`:""}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                            <div style="display:flex;align-items:center;gap:3px;flex:1;">
                                <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                    <div style="width:${ye}%;height:100%;background:${We(ye)};"></div>
                                </div>
                                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${ye}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${Qe(je)}/yr</span>
                        </div>
                    </div>
                </div>`}M+="</div>"}I.innerHTML=M}const N=document.getElementById("corp-actions-panel");N&&(N.innerHTML='<div id="actions-right-panel"></div>')}const Ze=1e6,et=1e10,Ie=1,Ne=50,tt=12;function ot(e){if(e<0)return"A";const t=Math.min(e,25);return String.fromCharCode(65+t)}async function nt(e,t,o){if(!e||!t||!o)return;if((e.corp_sector||"").toLowerCase()==="finance"){alert("Finance-sector corps fund equity; they do not raise it.");return}const i=prompt(`APPLY FOR EQUITY — STEP 1 / 3

How much capital do you want to raise? (in millions USD)

Example: 50 for a $50M raise.
Range: $1M – $10B.`);if(i===null)return;const n=parseFloat(i);if(isNaN(n)||n<=0){alert("Amount must be a positive number.");return}const a=Math.round(n*1e6);if(a<Ze){alert("Minimum raise is $1M.");return}if(a>et){alert("Maximum raise is $10B.");return}const s=prompt(`APPLY FOR EQUITY — STEP 2 / 3

What stake are you offering in exchange? (percent)

Example: 12.5 for a 12.5% share of monthly profits.
Range: 1% – 50%.`);if(s===null)return;const l=parseFloat(s);if(isNaN(l)||l<Ie||l>Ne){alert(`Stake must be between ${Ie}% and ${Ne}%.`);return}const c=prompt(`APPLY FOR EQUITY — STEP 3 / 3

Describe the purpose of this raise.

Example: "Series B to fund fleet expansion across Mira ports."
Investment corps see this in Deal Flow when deciding whether to fund you.`);if(c===null)return;const d=(c||"").trim()||"Equity capital raise",{data:v,error:p}=await o.from("finance_loan_requests").select("id").eq("requesting_faction_id",e.id).eq("request_type","equity").eq("status","funded");if(p){alert("Could not look up prior raises: "+p.message);return}const m=ot((v||[]).length),h=`Post Series ${m} equity raise?

Amount:   $${n}M
Stake:    ${l}%
Series:   ${m}
Purpose:  ${d}

This becomes visible to Investment corps in Deal Flow. Once an investor buys in, your corp pays them ${l}% of monthly profit each tick.`;if(!confirm(h))return;const u=Number(t.current_tick||0),{error:_}=await o.from("finance_loan_requests").insert({requesting_faction_id:e.id,nation_id:e.nation_id,request_type:"equity",amount:a,equity_pct:l,series:m,term_months:120,purpose:d,status:"open",created_tick:u,expires_tick:u+tt});if(_){alert("Failed to post equity raise: "+_.message);return}try{const b=e.faction_name+" ["+(e.abbreviation||e.corp_ticker||"??")+"]";await o.from("event_log").insert({nation_id:e.nation_id,event_name:"Series "+m+" Raise Opened",category:"corporate",faction_id:e.id,description_used:b+" has started the process of raising their series "+m+" and seeks investors.",fired_at_tick:u})}catch(b){console.warn("[equity-apply] Event log insert failed:",b?.message||b)}alert(`Series ${m} raise posted to Deal Flow. Investment corps can now fund you.`)}let ge=!1;async function it(){if(ge)return;const{data:{user:e}}=await y.auth.getUser();if(!e){alert("Not logged in.");return}const t=sessionStorage.getItem("active_faction_id");if(!t){alert("No active faction selected.");return}const{data:o,error:i}=await y.from("factions").select("id, faction_name, corp_sector, faction_type, abandoned_at").eq("id",t).single();if(i||!o||o.faction_type!=="corporation"||o.abandoned_at){alert("No active corporation found. It may have already been dissolved.");return}const n=o.faction_name||"this corporation";if(!confirm("DECLARE BANKRUPTCY — "+n.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+n+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}ge=!0;try{const{data:s,error:l}=await y.rpc("declare_corp_bankruptcy",{p_faction_id:t});if(l)throw l;const c=Number(s?.total_payback||0),d=c>0?`
$`+c.toLocaleString()+" repaid to creditors.":"";sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:v,error:p}=await y.from("factions").select("id, faction_type").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);p&&console.warn("[Bankruptcy] remaining-factions lookup failed:",p.message);const m=(v||[]).find(u=>u.faction_type==="party"),h=(v||[]).find(u=>u.faction_type==="corporation");m?(sessionStorage.setItem("active_faction_id",m.id),alert(n+" has declared bankruptcy."+d+`

Redirecting to your political party.`),window.location.href="dashboard.html"):h?(sessionStorage.setItem("active_faction_id",h.id),alert(n+" has declared bankruptcy."+d+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(n+" has declared bankruptcy."+d+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(s){alert("Bankruptcy failed: "+(s?.message||s)+`

Please try again or contact support.`)}finally{ge=!1}}let q=[],r=null,w=null,J=[],oe=[],X=0,B=null,P=-1,Te=[];async function at(){if(!r?.id)return;const{data:e}=await y.from("corp_properties").select("*").eq("faction_id",r.id).eq("is_active",!0);Te=e||[]}async function Re(){if(!r)return;const[e,t]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",r.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",r.nation_id).eq("status","available").order("skill",{ascending:!1})]);e.error&&console.warn("Failed to load executives:",e.error.message),t.error&&console.warn("Failed to load executive pool:",t.error.message),J=e.data||[],oe=t.data||[];const o=await Ke({supabase:y,faction:r,currentTick:w?.current_tick||0,poolCandidates:oe});o?.error&&console.warn("Failed to seed initial executive roster:",o.error.message||o.error),o?.executives&&(J=o.executives)}function ee(e){return e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function H(e){return J.find(t=>t.role===e)||null}function ue(e,t){return(e||"?")[0]+(t||"?")[0]}function te(e){return e>=70?"#5cb85c":e>=50?"#ca5":"#c84"}function G(){const e=document.getElementById("actions-container");e&&(Je(e,{faction:r,shard:w,ownedProperties:Te,vessels:[],executives:J,selectedExecIdx:X}),st())}const _e={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]},{id:"equity",name:"Apply for Equity",desc:"Raise capital by offering Investment corps a stake in your monthly profits. Series (A/B/C…) is auto-assigned by your prior funded raise count. No repayment — investors get a percentage of profit each tick going forward.",cost:"FREE",costColor:"#c89a4a",tags:["FINANCIAL","STRUCTURAL"],hideForSector:"Finance"}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$2M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"},{id:"branding",name:"Branding",desc:"Upload a custom corporate logo. Replaces the default monogram on the dashboard, nation roster, and shipping vessels.",cost:"$1M",costColor:"#ca5",tags:["IDENTITY"],cooldownTicks:12}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function ne(e){return 1.5-e/100}let Me={};function rt(e){const t=w?.current_tick||0;return Me[e]===t}function W(e){const t=w?.current_tick||0;Me[e]=t}function st(){const e=document.getElementById("actions-right-panel");if(!e)return;const t=pe[X],o=fe[t],i=H(t),n=(_e[t]||[]).filter(s=>!s.hideForSector||(r?.corp_sector||"")!==s.hideForSector);if(!i){e.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${o.color};margin-bottom:6px;">${f(t)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${f(o.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${t}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${o.color}15;border:1px solid ${o.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${o.color};">${f(ue(i.first_name,i.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${o.color};">${f(t)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${f(i.first_name)} ${f(i.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${f(o.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${i.skill}%;height:100%;background:${te(i.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${te(i.skill)};">${i.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${ee(i.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${i.contract_years}yr</div>
            </div>
            ${t!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${i.id}','${f(t)}','${f(i.first_name+" "+i.last_name)}',${i.salary_per_year},${i.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let s=0;s<n.length;s++){const l=n[s],c=!!l.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${c?"transparent":o.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${s<n.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${c?"0.4":"1"};
            cursor:${c?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${c?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${f(l.name)}</span>`;for(const d of l.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${d==="IRREVERSIBLE"?"#c55":d==="OFFENSIVE"?"#c84":d==="STRUCTURAL"?"#ca5":d==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${f(d)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l.costColor};">${f(l.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${c?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${f(l.desc)}</div>`,l.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${f(l.descRed)}</div>`),c&&l.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${f(l.lockReason)}</span>
            </div>`),c||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${l.id}','${t}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${o.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${o.color};font-weight:700;">${f(t)}</span> skill (${i.skill}/100) affects action outcomes.
            ${i.skill>=70?" High skill increases success probability and reduces costs.":i.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,e.innerHTML=a,e.querySelectorAll("[onmouseenter]").forEach(s=>{s.addEventListener("mouseenter",function(){const l=this.querySelector(".act-exec-btn");l&&(l.style.display="block")}),s.addEventListener("mouseleave",function(){const l=this.querySelector(".act-exec-btn");l&&(l.style.display="none")})})}function lt(e,t,o,i,n){const a=w?.current_tick||0,s=Math.max(0,n-a),l=Math.round(i*(s/12)),c=`FIRE ${t}: ${o}

Contract remaining: ${s} ticks
Payout (prorated): $${(l/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(c)&&ct(e,t,l)}async function ct(e,t,o){try{const i=Number(r?.corp_cash_reserves??0);if(i<o){alert(`Insufficient funds. You need $${(o/1e6).toFixed(2)}M but only have $${(i/1e6).toFixed(2)}M.`);return}const n=i-o,{error:a}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",r.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:s}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",e);if(s){await y.from("factions").update({corp_cash_reserves:i}).eq("id",r.id),alert("Failed to fire executive: "+s.message);return}r.corp_cash_reserves=n,J=J.filter(l=>l.id!==e),G()}catch(i){console.error("[CorpOps] Fire executive error:",i),alert("An error occurred.")}}function dt(e,t){const o=(_e[t]||[]).find(i=>i.id===e);if(o?.cooldown==="once/tick"&&rt(e)){alert("This action can only be used once per tick. Wait for the next tick.");return}if(o?.cooldownTicks){const i=pt(e);if(i>0){alert(`On cooldown — ${i} tick${i===1?"":"s"} remaining.`);return}}switch(e){case"statement":return ft();case"loan":return vt();case"equity":return nt(r,w,y);case"restructure":return $t();case"rebrand":return Et();case"branding":return St();case"donate":return Tt();case"bankruptcy":return it()}}function pt(e){if(e!=="branding")return 0;const o=(_e.CMO||[]).find(s=>s.id===e)?.cooldownTicks||0,i=Number(r?.last_branding_tick);if(!Number.isFinite(i)||i<=0)return 0;const a=(Number(w?.current_tick)||0)-i;return a>=o?0:o-a}let be=!1;function ft(){if(be)return;be=!0;const e=document.createElement("div");e.id="stmt-overlay",e.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",e.onclick=function(c){c.target===e&&we()};const t=r?.faction_name||"Corporation",o=(r?.abbreviation||r?.corp_ticker||"??").toUpperCase(),i=Number(r?.corp_cash_reserves??0),n=H("CEO"),a=n?`${n.first_name} ${n.last_name}`:"CEO";e.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${f(o)}</span>
                <span style="font-size:10px;color:var(--panel-text);">${f(t)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${f(a)}</span>
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
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i<2e4?"#c55":"var(--panel-text)"};">${$(i)}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="actCloseStatement()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
                    <div id="stmt-submit-btn" onclick="actSubmitStatement()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c8a832;cursor:pointer;">PUBLISH</div>
                </div>
            </div>
            <div id="stmt-error" style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
        </div>
    </div>`,document.body.appendChild(e);const s=document.getElementById("stmt-text"),l=document.getElementById("stmt-chars");s&&l&&(s.addEventListener("input",function(){l.textContent=this.value.length+"/500"}),s.focus())}function we(){const e=document.getElementById("stmt-overlay");e&&e.remove(),be=!1}let Z=!1;async function mt(){if(!r||!w||Z)return;const e=document.getElementById("stmt-text"),t=document.getElementById("stmt-error"),o=(e?.value||"").trim();if(!o){t&&(t.textContent="Statement cannot be empty.",t.style.display="block");return}if(o.length>500){t&&(t.textContent="Statement too long (max 500 chars).",t.style.display="block");return}const i=H("CEO"),n=i?i.skill:50,a=Math.round(2e4*ne(n)),s=Number(r.corp_cash_reserves??0);if(s<a){t&&(t.textContent="Insufficient cash. Need "+$(a)+".",t.style.display="block");return}Z=!0;const l=document.getElementById("stmt-submit-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const c=r.faction_name||"Corporation",d=i?`${i.first_name} ${i.last_name}`:"CEO",v=w.current_tick||0,{error:p}=await y.from("factions").update({corp_cash_reserves:s-a}).eq("id",r.id);if(p){Z=!1,t&&(t.textContent="Failed to deduct cost: "+p.message,t.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}const{error:m}=await y.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:c+" — Press Release",description_used:d+", CEO of "+c+': "'+o.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:d,skill:n},fired_at_tick:v});if(m){await y.from("factions").update({corp_cash_reserves:s}).eq("id",r.id),Z=!1,t&&(t.textContent="Failed to publish: "+m.message,t.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}r.corp_cash_reserves=s-a,Z=!1,W("statement"),we()}const me=5e6,ve=5e8,he=5e6;let A=25e7,S=new Set,Q=new Set,C=[],j=[];function vt(){A=25e7,S=new Set,Q=new Set,C=[],j=[],document.getElementById("lr-overlay").style.display="flex",D(),Promise.all([ht(),_t()]).then(()=>D()).catch(e=>console.error("[lrOpen] load failed:",e))}function Ae(){document.getElementById("lr-overlay").style.display="none"}function yt(e){const t=Number(e)||0,o=Math.round(t/he)*he;A=Math.max(me,Math.min(ve,o)),D()}function gt(e){e&&(S.has(e)?S.delete(e):S.add(e),D())}function xt(){S.size===C.length&&C.length>0?S=new Set:S=new Set(C.map(e=>e.id)),D()}function ut(){const e=r?.nation_id;if(e){for(const t of C)t.nation_id===e&&S.add(t.id);D()}}function bt(e){e&&(Q.has(e)?Q.delete(e):Q.add(e),D())}async function ht(){if(!r){C=[];return}const{data:e,error:t}=await y.from("factions").select("id, faction_name, corp_company_type, nation_id, corp_lending_capital, corp_interest_rates, corp_overleverage, nations:nation_id(name)").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",r.id);if(t){console.warn("[lrLoadFinanceCorps] error:",t.message),C=[];return}C=e||[]}async function _t(){if(!r){j=[];return}const{data:e,error:t}=await y.from("corp_properties").select("id, name, purchase_price, nation_id, role, nations:nation_id(name)").eq("faction_id",r.id).eq("is_active",!0).order("purchase_price",{ascending:!1});if(t){console.warn("[lrLoadCollateral] error:",t.message),j=[];return}j=e||[]}function xe(e,t){const o=Math.max(0,Math.min(10,Math.round(Number(e)||0))),i=[];for(let n=0;n<10;n++){const a=n<o;let s="";a&&(t==="leverage"?s=n<=2?" green":n<=5?" rust":" red":t&&t!=="gold"&&(s=" "+t)),i.push(`<span class="lr-pip${a?" filled"+s:""}"></span>`)}return i.join("")}function wt(e){const t=Number(e)||0;return t>=7?"var(--red, #d9534f)":t>=4?"var(--orange, #e8724a)":"var(--green, #5cb85c)"}function D(){const e=document.getElementById("lr-modal-content");if(!e)return;const t=r?.faction_name||"Corporation",o=(r?.abbreviation||r?.corp_ticker||"??").toUpperCase(),i=Math.round(A/1e6),n=i/5*.1;let a=0;for(const x of j)Q.has(x.id)&&(a+=Number(x.purchase_price||0));const s=A>0?Math.round(a/A*100):0,l=a===0?"unsecured":s<100?"partial":s<150?"full":"over",c=l==="unsecured"?"var(--text-dim, #6a6660)":l==="partial"?"var(--orange, #e8724a)":"var(--green, #5cb85c)",d=S.size,v=d===0;let p="";if(p+=`<div style="padding:18px 24px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:2px;color:#8a722f;text-transform:uppercase;margin-bottom:4px;">— Treasury Action —</div>
            <div style="font-family:var(--font-serif, 'IBM Plex Serif', serif);font-weight:500;font-size:28px;line-height:1;letter-spacing:-0.02em;color:var(--text-bright, #f0efe6);">Request <em style="font-style:italic;color:var(--gold, #c8a832);">Loan</em></div>
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:#6a6660;margin-top:6px;">From: <strong style="color:var(--gold, #c8a832);font-weight:500;">${f(o)}</strong> ${f(t)}</div>
        </div>
        <div onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;border:1px solid var(--panel-border);width:28px;height:28px;display:flex;align-items:center;justify-content:center;">&#215;</div>
    </div>`,p+='<div style="flex:1;overflow-y:auto;padding:24px;">',p+=`<div style="margin-bottom:24px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border);">
            <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-style:italic;font-weight:500;font-size:16px;color:var(--text-bright,#f0efe6);">
                <span style="font-family:var(--font-mono);font-style:normal;font-size:10px;color:#8a722f;margin-right:8px;letter-spacing:0.1em;">I.</span>Loan Amount
            </div>
            <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">$5M = +0.1 LENDING CAPITAL</span>
        </div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:18px 20px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;">
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:400;font-size:44px;line-height:1;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;letter-spacing:-0.025em;">
                    <span style="font-family:var(--font-sans,'IBM Plex Sans',sans-serif);font-size:18px;color:#6a6660;margin-right:2px;vertical-align:top;line-height:44px;">$</span>${i}M
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;margin-bottom:4px;">Lending Capital Demand</div>
                    <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:22px;color:var(--gold,#c8a832);line-height:1;font-variant-numeric:tabular-nums;">+${n.toFixed(1)}</div>
                </div>
            </div>
            <input type="range" min="${me}" max="${ve}" step="${he}" value="${A}"
                oninput="lrSetAmount(this.value)"
                style="width:100%;height:4px;accent-color:var(--gold,#c8a832);" />
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;color:#6a6660;text-transform:uppercase;margin-top:6px;">
                <span>$5M</span><span>$500M</span>
            </div>
        </div>
    </div>`,p+=`<div style="margin-bottom:24px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border);">
            <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-style:italic;font-weight:500;font-size:16px;color:var(--text-bright,#f0efe6);">
                <span style="font-family:var(--font-mono);font-style:normal;font-size:10px;color:#8a722f;margin-right:8px;letter-spacing:0.1em;">II.</span>Collateral Offered
            </div>
            <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">Optional ◊ Stronger pledges earn better terms</span>
        </div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:12px 16px;margin-bottom:10px;display:grid;grid-template-columns:1fr auto 1fr;gap:18px;align-items:center;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;margin-bottom:3px;">Total Pledged</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-size:20px;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;line-height:1;">${a===0?"—":"$"+Math.round(a/1e6)+'<span style="font-family:var(--font-sans,sans-serif);font-size:11px;color:#6a6660;margin-left:2px;">M</span>'}</div>
            </div>
            <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-style:italic;font-size:18px;color:#8a722f;">◊</div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;margin-bottom:3px;">Coverage of Loan</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-size:20px;font-variant-numeric:tabular-nums;line-height:1;color:${c};">${l==="unsecured"?"UNSECURED":s+'<span style="font-family:var(--font-sans,sans-serif);font-size:11px;color:#6a6660;margin-left:2px;">%</span>'}</div>
            </div>
        </div>`,j.length===0)p+='<div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:18px;text-align:center;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;color:#6a6660;font-style:italic;">No corporate properties available to pledge.</div>';else{p+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">';for(const x of j){const k=Q.has(x.id),I=Math.round(Number(x.purchase_price||0)/1e6),N=x.name||(x.role||"Property").replace(/_/g," ").toUpperCase(),g=x.nations?.name||"—",M=x.synthetic?'<span style="font-family:var(--font-mono);font-size:7px;letter-spacing:0.12em;color:#8a722f;border:1px solid rgba(138,114,47,0.4);background:rgba(138,114,47,0.06);padding:1px 5px;margin-left:6px;text-transform:uppercase;">Structural</span>':"";p+=`<div onclick="lrToggleCollateral('${f(x.id)}')" style="background:${k?"rgba(200,168,50,0.04)":"var(--bg-panel)"};border:1px solid ${k?"var(--gold,#c8a832)":"var(--panel-border)"};padding:10px 12px;cursor:pointer;display:grid;grid-template-columns:14px 1fr auto;gap:10px;align-items:center;">
                <div style="width:12px;height:12px;border:1px solid ${k?"var(--gold,#c8a832)":"var(--panel-border)"};background:${k?"var(--gold,#c8a832)":"var(--bg-panel)"};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#0e0e0c;">${k?"✓":""}</div>
                <div style="min-width:0;">
                    <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:13px;color:var(--text-bright,#f0efe6);line-height:1.2;">${f(N)}${M}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.1em;color:#6a6660;text-transform:uppercase;margin-top:2px;">${f(g)} ◊ ${f((x.role||"").replace(/_/g," "))}${x.synthetic?" · Cannot be seized on default":""}</div>
                </div>
                <div style="font-family:var(--font-mono);font-size:12px;font-weight:500;color:var(--green,#5cb85c);font-variant-numeric:tabular-nums;">$${I}M</div>
            </div>`}p+="</div>"}p+="</div>";const h=C.length>0&&d===C.length?"Deselect All":"Select All",u=r?.nation||"",_=!!r?.nation_id&&C.some(x=>x.nation_id===r.nation_id),b=C.length>0,z=x=>`font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold,#c8a832);padding:4px 9px;border:1px solid rgba(200,168,50,0.4);background:rgba(200,168,50,0.06);user-select:none;${x?"cursor:pointer;":"opacity:0.4;pointer-events:none;"}`;if(p+=`<div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px dashed var(--panel-border);gap:12px;flex-wrap:wrap;">
            <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-style:italic;font-weight:500;font-size:16px;color:var(--text-bright,#f0efe6);">
                <span style="font-family:var(--font-mono);font-style:normal;font-size:10px;color:#8a722f;margin-right:8px;letter-spacing:0.1em;">III.</span>Select Lenders
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span ${b?'onclick="lrToggleSelectAll()"':""} style="${z(b)}">${h}</span>
                ${u?`<span ${_?'onclick="lrSelectAllInMyNation()"':""} style="${z(_)}">Select All in ${f(u)}</span>`:""}
                <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;">${d} of ${C.length} selected</span>
            </div>
        </div>`,C.length===0)p+='<div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:18px;text-align:center;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;color:#6a6660;font-style:italic;">No Finance corporations available to lend.</div>';else{p+='<div style="display:flex;flex-direction:column;gap:5px;">';for(const x of C){const k=S.has(x.id),I=Number(x.corp_lending_capital??0),N=Number(x.corp_interest_rates??0),g=Number(x.corp_overleverage??0),M=x.nations?.name||"—",T=(x.corp_company_type||"PRIVATE").toUpperCase();p+=`<div onclick="lrToggleBank('${f(x.id)}')" style="background:${k?"rgba(200,168,50,0.04)":"var(--bg-panel)"};border:1px solid ${k?"var(--gold,#c8a832)":"var(--panel-border)"};padding:12px 14px;cursor:pointer;display:grid;grid-template-columns:16px 1fr 88px 88px 88px;gap:14px;align-items:center;">
                <div style="width:12px;height:12px;border:1px solid ${k?"var(--gold,#c8a832)":"var(--panel-border)"};background:${k?"var(--gold,#c8a832)":"var(--bg-panel)"};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#0e0e0c;">${k?"✓":""}</div>
                <div style="min-width:0;">
                    <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:14px;color:var(--text-bright,#f0efe6);line-height:1.2;">${f(x.faction_name||"Bank")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.12em;color:#6a6660;text-transform:uppercase;margin-top:3px;"><span style="color:var(--gold,#c8a832);">◊</span> ${f(M)} ◊ ${f(T)}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.16em;color:#6a6660;text-transform:uppercase;margin-bottom:3px;">Lending Cap.</div>
                    <div style="font-family:var(--font-mono);font-size:12px;font-weight:500;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;">${I.toFixed(I%1===0?0:1)}</div>
                    <div style="display:flex;gap:2px;margin-top:2px;">${xe(I,"green")}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.16em;color:#6a6660;text-transform:uppercase;margin-bottom:3px;">Interest</div>
                    <div style="font-family:var(--font-mono);font-size:12px;font-weight:500;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;">${N.toFixed(1)}%</div>
                    <div style="display:flex;gap:2px;margin-top:2px;">${xe(N,"rust")}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:0.16em;color:#6a6660;text-transform:uppercase;margin-bottom:3px;">Leverage</div>
                    <div style="font-family:var(--font-mono);font-size:12px;font-weight:500;font-variant-numeric:tabular-nums;color:${wt(g)};">${g.toFixed(g%1===0?0:1)}</div>
                    <div style="display:flex;gap:2px;margin-top:2px;">${xe(g,"leverage")}</div>
                </div>
            </div>`}p+="</div>"}p+="</div>",p+="</div>",p+=`<div style="padding:14px 24px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;gap:24px;">
        <div style="display:flex;gap:24px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;margin-bottom:2px;">Requesting</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:16px;color:var(--gold,#c8a832);font-variant-numeric:tabular-nums;line-height:1;">$${i}M</div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;margin-bottom:2px;">Collateral</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:16px;color:${c};font-variant-numeric:tabular-nums;line-height:1;">${a===0?"Unsecured":"$"+Math.round(a/1e6)+"M"}</div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6a6660;margin-bottom:2px;">Sent To</div>
                <div style="font-family:var(--font-serif,'IBM Plex Serif',serif);font-weight:500;font-size:16px;color:var(--text-bright,#f0efe6);font-variant-numeric:tabular-nums;line-height:1;">${d} Lender${d===1?"":"s"}</div>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:9px 18px;font-family:var(--font-mono);font-size:10px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">Cancel</div>
            <div id="lr-submit-btn" onclick="${v?"":"lrSubmit()"}" style="padding:9px 22px;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#0e0e0c;background:var(--gold,#c8a832);border:1px solid var(--gold,#c8a832);cursor:${v?"not-allowed":"pointer"};${v?"opacity:0.4;":""}">Submit Request ▸</div>
        </div>
    </div>`,p+='<div id="lr-error" style="padding:6px 24px;font-family:var(--font-mono);font-size:9px;color:var(--red,#d9534f);display:none;background:var(--bg-panel);border-top:1px solid var(--panel-border);"></div>',e.innerHTML=p}let re=!1;async function kt(){if(!r||!w||re)return;const e=document.getElementById("lr-error"),t=s=>{e&&(e.textContent=s,e.style.display="block")};if(A<me)return t(`Minimum loan amount is $${me/1e6}M.`);if(A>ve)return t(`Maximum loan amount is $${ve/1e6}M.`);if(S.size===0)return t("Select at least one lender.");const o=document.getElementById("lr-submit-btn");re=!0,o&&(o.style.opacity="0.5",o.style.pointerEvents="none");const i=Array.from(S);let n,a;try{const s=await y.rpc("submit_loan_request",{p_requesting_faction_id:r.id,p_target_bank_ids:i,p_principal:A,p_term_ticks:60,p_requested_apr:0,p_risk_grade:"B",p_purpose:null,p_expiry_ticks:6});n=s.data,a=s.error}catch(s){return re=!1,o&&(o.style.opacity="1",o.style.pointerEvents="auto"),t("Network error: "+(s?.message||s))}if(re=!1,o&&(o.style.opacity="1",o.style.pointerEvents="auto"),a)return t("Failed to submit: "+a.message);if(n&&n.success===!1)return t(n.error||"Loan request rejected.");Ae()}function $t(){if(!r)return;const e=Number(r.corp_loans??0),t=Number(r.corp_reputation??50),o=Number(r.corp_general_workforce??0),i=Number(r.corp_skilled_workforce??0),n=Number(r.corp_innovative_workforce??0),a=o+i+n;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const s=H("COO"),l=s?s.skill:50,c=ne(l),d=10+Math.floor(Math.random()*11),v=Math.round(a*d/100),p=Math.round(e*.07),m=Math.round(p*(2-c)),h=3+Math.floor(Math.random()*10),u=Math.max(1,Math.round(h*c)),_=Math.round(o/a*v),b=Math.round(i/a*v),z=Math.max(0,Math.min(n,v-_-b)),x=document.createElement("div");x.id="restr-overlay",x.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",x.onclick=function(k){k.target===x&&ke()},x.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${v} employees (${d}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${o} &rarr; ${o-_}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${_}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${i} &rarr; ${i-b}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${b}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${n} &rarr; ${n-z}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${z}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT REDUCTION (~7%)</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${$(m)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION HIT</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${u} (${t} &rarr; ${Math.max(0,t-u)})</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#c84;margin-top:6px;">&#9888; This action cannot be undone. Laid-off workers must be re-hired.</div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${d},${m},${u},${_},${b},${z})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(x)}function ke(){const e=document.getElementById("restr-overlay");e&&e.remove()}let se=!1;async function Ct(e,t,o,i,n,a){if(!r||!w||se)return;se=!0;const s=document.getElementById("restr-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const l=Number(r.corp_general_workforce??0),c=Number(r.corp_skilled_workforce??0),d=Number(r.corp_innovative_workforce??0),v=Number(r.corp_loans??0),p=Number(r.corp_reputation??50),m={corp_general_workforce:Math.max(0,l-i),corp_skilled_workforce:Math.max(0,c-n),corp_innovative_workforce:Math.max(0,d-a),corp_loans:Math.max(0,v-t),corp_reputation:Math.max(0,p-o)},{error:h}=await y.from("factions").update(m).eq("id",r.id);if(h){se=!1;const b=document.getElementById("restr-error");b&&(b.textContent="Failed: "+h.message,b.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}Object.assign(r,m);const u=w.current_tick||0,{error:_}=await y.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:(r.faction_name||"Corporation")+" — Restructuring",description_used:(r.faction_name||"A corporation")+" has announced a restructuring, laying off "+e+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:e,debt_cut:t,rep_loss:o},fired_at_tick:u});_&&console.warn("Failed to log restructure event:",_.message),se=!1,W("restructure"),ke(),G()}function Et(){const e=H("CMO"),t=e?e.skill:50,o=ne(t),i=Math.round(2e6*o),n=Math.max(1,Math.round(5*o)),a=Number(r?.corp_cash_reserves??0),s=Number(r?.corp_reputation??50),l=r?.faction_name||"",c=r?.abbreviation||r?.corp_ticker||"",d=document.createElement("div");d.id="rebrand-overlay",d.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",d.onclick=function(v){v.target===d&&$e()},d.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
            <input id="rebrand-name" type="text" maxlength="40" value="${f(l)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${f(c)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;text-transform:uppercase;" />
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Impact</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COST</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${$(i)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${n} (${s} &rarr; ${Math.max(0,s-n)})</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">SKILL MODIFIER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${o<=1?"#5cb85c":"#c84"};">&times;${o.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${a<i?"#c55":"var(--panel-text)"};">${$(a-i)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${i},${n})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${a>=i?"pointer":"not-allowed"};${a<i?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(d)}function $e(){const e=document.getElementById("rebrand-overlay");e&&e.remove()}let le=!1;async function zt(e,t){if(!r||!w||le)return;const o=e||2e6,i=t||5,n=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),s=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){n&&(n.textContent="Name must be at least 2 characters.",n.style.display="block");return}if(!s||s.length<2||s.length>5){n&&(n.textContent="Abbreviation must be 2-5 characters.",n.style.display="block");return}const l=Number(r.corp_cash_reserves??0);if(l<o){n&&(n.textContent="Insufficient cash. Need "+$(o)+".",n.style.display="block");return}le=!0;const c=document.getElementById("rebrand-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const d=Number(r.corp_reputation??50),v=r.faction_name||"Corporation",{error:p}=await y.from("factions").update({faction_name:a,abbreviation:s,corp_ticker:s,corp_cash_reserves:l-o,corp_reputation:Math.max(0,d-i)}).eq("id",r.id);if(p){le=!1,n&&(n.textContent="Failed: "+p.message,n.style.display="block"),c&&(c.style.opacity="1",c.style.pointerEvents="auto");return}r.faction_name=a,r.abbreviation=s,r.corp_ticker=s,r.corp_cash_reserves=l-o,r.corp_reputation=Math.max(0,d-i);const m=w.current_tick||0,{error:h}=await y.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:"Corporation Rebranded",description_used:v+" has rebranded to "+a+" ("+s+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:v,new_name:a,new_abbr:s,rep_loss:i,cost:o},fired_at_tick:m});h&&console.warn("Failed to log rebrand event:",h.message),le=!1,W("rebrand"),$e(),G(),document.getElementById("corp-name-bar").textContent=a;const u=document.getElementById("corp-logo");u&&(u.textContent=s.slice(0,2))}const R=1e6,de=12;let L=null,K=!1;function St(){L=null;const e=Number(r?.corp_cash_reserves??0),t=r?.custom_logo_url||"",o=document.createElement("div");o.id="branding-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(n){n.target===o&&Ce()};const i=t?`<img src="${f(t)}" alt="" style="width:100%;height:100%;object-fit:cover;">`:`<span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#6a6660;">${f((r?.abbreviation||r?.corp_ticker||"??").slice(0,2))}</span>`;o.innerHTML=`<div onclick="event.stopPropagation()" style="width:460px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
            <div id="branding-preview" style="width:84px;height:84px;background:var(--bg-panel);border:1px solid var(--panel-border);border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">${i}</div>
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${$(R)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COOLDOWN</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--panel-text);">${de} TICKS</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${e<R?"#c55":"var(--panel-text)"};">${$(e-R)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseBranding()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="branding-btn" onclick="actSubmitBranding()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${e>=R?"pointer":"not-allowed"};${e<R?"opacity:0.4;pointer-events:none;":""}">UPLOAD &amp; CONFIRM</div>
        </div>
        <div id="branding-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(o)}function Ce(){const e=document.getElementById("branding-overlay");e&&e.remove(),L=null}function It(e){const t=e.target.files?.[0],o=document.getElementById("branding-error"),i=document.getElementById("branding-filename");if(!t){L=null,i&&(i.textContent="");return}if(t.size>128*1024){L=null,i&&(i.textContent=""),o&&(o.textContent="File too large — must be under 128 KB.",o.style.display="block");return}L=t,o&&(o.style.display="none"),i&&(i.textContent=t.name);const n=document.getElementById("branding-preview");if(n){const a=new FileReader;a.onload=s=>{n.innerHTML=`<img src="${s.target.result}" alt="" style="width:100%;height:100%;object-fit:cover;">`},a.readAsDataURL(t)}}async function Nt(){if(!r||!w||K)return;const e=document.getElementById("branding-error"),t=document.getElementById("branding-btn");if(!L){e&&(e.textContent="Choose a logo file first.",e.style.display="block");return}const o=Number(w.current_tick)||0,{data:i,error:n}=await y.from("factions").select("corp_cash_reserves, last_branding_tick").eq("id",r.id).single();if(n||!i){e&&(e.textContent="Failed to verify cooldown: "+(n?.message||"unknown"),e.style.display="block");return}const a=i.last_branding_tick==null?null:Number(i.last_branding_tick);if(a!=null&&o-a<de){const u=de-(o-a);e&&(e.textContent=`On cooldown — ${u} tick${u===1?"":"s"} remaining.`,e.style.display="block");return}const s=Number(i.corp_cash_reserves??0);if(s<R){e&&(e.textContent="Insufficient cash. Need "+$(R)+".",e.style.display="block");return}K=!0,t&&(t.style.opacity="0.4",t.style.pointerEvents="none",t.textContent="UPLOADING...");let l;try{const u=(L.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png",_=`party-logos/${r.id}/${Date.now()}.${u}`,{error:b}=await y.storage.from("public-assets").upload(_,L,{contentType:L.type,upsert:!0});if(b)throw b;const{data:z}=y.storage.from("public-assets").getPublicUrl(_);if(l=z?.publicUrl||null,!l)throw new Error("Could not resolve public URL.")}catch(u){K=!1,e&&(e.textContent="Upload failed: "+(u.message||"Unknown error"),e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}const c={custom_logo_url:l,corp_cash_reserves:s-R,last_branding_tick:o};let d=y.from("factions").update(c).eq("id",r.id);d=a==null?d.is("last_branding_tick",null):d.eq("last_branding_tick",a);const{data:v,error:p}=await d.select("id");if(p){K=!1,e&&(e.textContent="Failed: "+p.message,e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}if(!v||v.length===0){K=!1,e&&(e.textContent="Branding is on cooldown. Refresh to see the latest state.",e.style.display="block"),t&&(t.style.opacity="1",t.style.pointerEvents="auto",t.textContent="UPLOAD & CONFIRM");return}r.custom_logo_url=l,r.corp_cash_reserves=s-R,r.last_branding_tick=o;const{error:m}=await y.from("event_log").insert({nation_id:r.nation_id,faction_id:r.id,event_name:"Corporation Rebranded (Logo)",description_used:`${r.faction_name||"Corporation"} unveiled a new corporate logo.`,category:"corporate",trigger_key:"corp_branding",effects_applied:{logo_url:l,cost:R,cooldown_ticks:de},fired_at_tick:o});m&&console.warn("Failed to log branding event:",m.message),K=!1,Ce(),G();const h=document.getElementById("corp-logo");h&&(h.innerHTML=`<img src="${l}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`)}window.actBrandingPickFile=It;window.actSubmitBranding=Nt;window.actCloseBranding=Ce;let U=[],F=-1;async function Tt(){Number(r?.corp_cash_reserves??0);const e=[r.nation_id],t=new Set(q.map(n=>n.id)),{data:o}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id").eq("faction_type","party").in("nation_id",e).is("abandoned_at",null).order("seats",{ascending:!1});U=(o||[]).filter(n=>!t.has(n.id)).map(n=>({...n})),F=-1;const i=document.createElement("div");i.id="donate-overlay",i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",i.onclick=function(n){n.target===i&&Ee()},document.body.appendChild(i),Le()}function Ee(){const e=document.getElementById("donate-overlay");e&&e.remove(),U=[],F=-1}function Rt(e){F=e,Le()}function Le(){const e=document.getElementById("donate-overlay");if(!e)return;const t=H("Lobbyist"),o=t?t.skill:50,i=Math.round(1e6*ne(o)),n=1e5,a=Number(r?.corp_cash_reserves??0),s=F>=0?U[F]:null,l=a>=i;let c='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';c+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#8a6aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Political Donation</span>
            </div>
            <span onclick="actCloseDonation()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Cost:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#ca5;">${$(i)}</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">&rarr; Target party receives</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#5cb85c;">+${$(n)}</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in the nation where your National HQ is located. You cannot donate to your own party.</div>
    </div>`,c+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',c+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',U.length===0&&(c+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let d=0;d<U.length;d++){const v=U[d],p=F===d,m=v.party_color||"#8a6aaa",h=(v.momentum||0)>0?"var(--panel-text)":"#c55";c+=`<div onclick="donateSelectParty(${d})" style="
            padding:10px 20px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${p?m:"transparent"};
            background:${p?m+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${m};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${p?"var(--panel-text)":"#9e9a92"};">${f(v.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${f(v.abbreviation||"??")} &middot; ${f(v.nation||"")} &middot; ${v.seats||0} seats</span>
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${$(v.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${h};font-weight:700;">${Number(v.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${p?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}c+="</div>",c+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${$(i)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l?"var(--panel-text)":"#c55"};">${$(a)}</div></div>
            ${s?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${f(s.abbreviation||s.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${s&&l?"#000":"#6a6660"};background:${s&&l?"#8a6aaa":"var(--panel-border)"};cursor:${s&&l?"pointer":"not-allowed"};${!s||!l?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,c+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',c+="</div>",e.innerHTML=c}let V=!1;async function Mt(){if(!r||!w||F<0||V)return;const e=U[F];if(!e)return;const t=Number(w?.current_tick||0);if(new Set(q.map(g=>g.id)).has(e.id)){const g=document.getElementById("donate-error");g&&(g.textContent="You cannot donate to your own party.",g.style.display="block");return}const i=H("Lobbyist"),n=i?i.skill:50,a=Math.round(1e6*ne(n)),s=1e5,l=2,{data:c,error:d}=await y.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",r.id).single();if(d||!c){const g=document.getElementById("donate-error");g&&(g.textContent="Failed to verify cooldown: "+(d?.message||"unknown"),g.style.display="block");return}const v=Number(c.last_donation_tick??0);if(v===t){const g=document.getElementById("donate-error");g&&(g.textContent="Political Donation is on cooldown until next tick.",g.style.display="block"),W("donate");return}const p=Number(c.corp_cash_reserves??0);if(p<a){const g=document.getElementById("donate-error");g&&(g.textContent="Insufficient cash. Need "+$(a)+", have "+$(p)+".",g.style.display="block");return}V=!0;const m=document.getElementById("donate-btn");m&&(m.style.opacity="0.4",m.style.pointerEvents="none");const h=Number(r.corp_reputation??50),u=Math.max(0,h-l),{data:_,error:b}=await y.from("factions").update({corp_cash_reserves:p-a,corp_reputation:u,last_donation_tick:t}).eq("id",r.id).eq("last_donation_tick",v).select("id");if(b){const g=document.getElementById("donate-error");V=!1,g&&(g.textContent="Failed: "+b.message,g.style.display="block"),m&&(m.style.opacity="1",m.style.pointerEvents="auto");return}if(!_||_.length===0){const g=document.getElementById("donate-error");V=!1,g&&(g.textContent="Political Donation is on cooldown until next tick.",g.style.display="block"),m&&(m.style.opacity="1",m.style.pointerEvents="auto"),W("donate");return}const{data:z}=await y.from("factions").select("party_funds").eq("id",e.id).single(),x=Number(z?.party_funds??0),{error:k}=await y.from("factions").update({party_funds:x+s}).eq("id",e.id);if(k){await y.from("factions").update({corp_cash_reserves:p}).eq("id",r.id);const g=document.getElementById("donate-error");V=!1,g&&(g.textContent="Failed to transfer funds: "+k.message,g.style.display="block"),m&&(m.style.opacity="1",m.style.pointerEvents="auto");return}r.corp_cash_reserves=p-a,r.corp_reputation=u;const I=r.faction_name||"Corporation",{error:N}=await y.from("event_log").insert({nation_id:e.nation_id||r.nation_id,faction_id:r.id,event_name:I+" — Political Donation",description_chosen:I+" has donated "+$(a)+" to "+(e.faction_name||"a political party")+". The party receives "+$(s)+" in campaign funds. Corporate reputation decreases by "+l+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:e.id,recipient_name:e.faction_name,funds_granted:s,reputation_loss:l,skill:n},fired_at_tick:t});N&&console.warn("Failed to log donation event:",N.message),V=!1,W("donate"),Ee()}function At(e){X=e,G()}async function Lt(e){if(B=e,P=-1,document.getElementById("exec-search-overlay").style.display="flex",oe.length===0&&r?.nation_id){const t=r.nation||"",o=Ve(r.nation_id,t),{error:i}=await y.from("executive_pool").insert(o);i&&console.warn("Failed to generate executive pool:",i.message);const{data:n,error:a}=await y.from("executive_pool").select("*").eq("nation_id",r.nation_id).eq("status","available").order("skill",{ascending:!1});a&&console.warn("Failed to reload executive pool:",a.message),oe=n||[]}Pe()}function Oe(){document.getElementById("exec-search-overlay").style.display="none",B=null,P=-1}function Be(e){return oe.filter(t=>t.status==="available"&&Array.isArray(t.specializations)&&t.specializations.includes(e)).sort((t,o)=>o.skill-t.skill)}function Ot(e){P=e,Pe()}let ce=!1;async function Bt(){if(!r||!w||!B||P<0||ce)return;const t=Be(B)[P];if(!t)return;ce=!0;const o=w.current_tick||0,i=document.getElementById("es-hire-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const{error:n}=await y.from("corp_executives").insert({faction_id:r.id,role:B,first_name:t.first_name,last_name:t.last_name,age:t.age,origin_nation:t.origin_nation,skill:t.skill,salary_per_year:t.required_salary,contract_years:t.required_years,contract_start_tick:o,contract_end_tick:o+t.required_years*12,status:"active"});if(n){ce=!1;const s=document.getElementById("es-error");s&&(s.textContent="Failed: "+n.message,s.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:a}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:r.id}).eq("id",t.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),ce=!1,Oe(),await Re(),X=pe.indexOf(B),X<0&&(X=0),G()}function Pe(){const e=document.getElementById("exec-search-content");if(!e||!B)return;const t=B,o=fe[t],i=Be(t),n=P>=0?i[P]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${o.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${o.color};">${f(t)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${f(o.fullTitle)}</span>
        </div>
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid var(--panel-border);overflow-y:auto;flex-shrink:0;">',i.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let s=0;s<i.length;s++){const l=i[s],c=P===s,d=te(l.skill);a+=`<div onclick="esSelectCandidate(${s})" style="
            padding:10px 14px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${c?o.color:"transparent"};
            background:${c?o.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${o.color}10;border:1px solid ${o.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o.color};flex-shrink:0;">${f(ue(l.first_name,l.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f(l.first_name)} ${f(l.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--panel-border);">
                                <div style="width:${l.skill}%;height:100%;background:${d};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${d};width:18px;text-align:right;">${l.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${ee(l.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!n)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${i.length} candidate${i.length!==1?"s":""} available for ${f(t)}</div>
        </div>`;else{const s=n.required_salary*n.required_years,l=te(n.skill);a+=`<div style="padding:20px;border-bottom:1px solid var(--panel-border);">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${o.color}12;border:1px solid ${o.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${o.color};">${f(ue(n.first_name,n.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${f(n.first_name)} ${f(n.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${f(n.origin_nation)} &middot; Age ${n.age}</div>
                </div>
            </div>
        </div>`,a+=`<div style="display:flex;gap:0;border-bottom:1px solid var(--panel-border);">
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">SKILL</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:5px;">
                    <div style="width:60px;height:4px;background:var(--panel-border);">
                        <div style="width:${n.skill}%;height:100%;background:${l};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${l};">${n.skill}</span>
                </div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">AGE</div>
                <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${n.age}</div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">ORIGIN</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${f(n.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const v of n.specializations||[]){const p=fe[v],m=v===t;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${m?"#000":p?.color||"#9e9a92"};background:${m?p?.color||"#5a8aaa":(p?.color||"#5a8aaa")+"10"};border:1px solid ${m?"transparent":(p?.color||"#5a8aaa")+"30"};">${f(v)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${n.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${ee(n.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${ee(s)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const c=n.skill>=80?"EXCEPTIONAL":n.skill>=65?"STRONG":n.skill>=50?"COMPETENT":n.skill>=35?"DEVELOPING":"WEAK",d=n.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":n.skill>=65?"Strong performer. Reliable outcomes across most actions.":n.skill>=50?"Adequate for the role. Outcomes are average.":n.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${l}08;border:1px solid ${l}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${l};letter-spacing:0.8px;margin-bottom:3px;">${c}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${d}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,n?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${f(n.first_name)} ${f(n.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${te(n.skill)};">${n.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${ee(n.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${n?"#000":"#6a6660"};background:${n?o.color:"var(--panel-border)"};cursor:${n?"pointer":"not-allowed"};${n?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',e.innerHTML=a}async function Pt(){const{data:{user:e}}=await y.auth.getUser();if(!e){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(t){const{data:a,error:s}=await y.from("factions").select("*").eq("id",t).single();s?console.warn("[Inspector] faction fetch failed:",s.message):a?.faction_type==="corporation"&&(r=a)}if(!r){const{data:a}=await y.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);q=(a||[]).filter(l=>l.nation_id);const s=sessionStorage.getItem("active_faction_id");if(r=q.find(l=>l.id===s)||q.find(l=>l.faction_type==="corporation")||q[0],!r){await y.auth.signOut(),window.location.href="login.html";return}if(r.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[o,i]=await Promise.all([r.nation_id?y.from("nations").select("*").eq("id",r.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);o.data&&o.data,w=i.data;const n=document.getElementById("corp-topbar-container");n&&Ge(n,{faction:r,shard:w,activeTab:"actions",allUserFactions:q}),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",await Promise.all([at(),Re()]),G()}window.actExecute=dt;window.actSelectExec=At;window.confirmFireExec=lt;window.actCloseStatement=we;window.actSubmitStatement=mt;window.actCloseRestructure=ke;window.actSubmitRestructure=Ct;window.actCloseRebrand=$e;window.actSubmitRebrand=zt;window.actCloseDonation=Ee;window.actSubmitDonation=Mt;window.donateSelectParty=Rt;window.lrClose=Ae;window.lrSetAmount=yt;window.lrToggleBank=gt;window.lrToggleCollateral=bt;window.lrToggleSelectAll=xt;window.lrSelectAllInMyNation=ut;window.lrSubmit=kt;window.openExecSearch=Lt;window.closeExecSearch=Oe;window.esSelectCandidate=Ot;window.esHireCandidate=Bt;Pt();
