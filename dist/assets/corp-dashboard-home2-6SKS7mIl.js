import{_supabase as f}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{escapeHtml as m,tickToDate as kt}from"./utils-A98FEun4.js";import{initMessaging as ae}from"./messaging-Btjj7Mcp.js";import{c as ie,m as At,l as re}from"./loan-math-C0TdxDmt.js";import{a as se}from"./corp-valuation-DvpMrhZz.js";import"./government-structure-C17uG6rl.js";function Ot(t,e){var n=Number(t?.purchase_price)||0,o=Number(t?.refurbish_count)||0,i=n*.1*(Number(e)||1);return Math.round(i*Math.pow(1.25,o))}async function le(t,e,n,o,i){if(!e||!n?.id)return{ok:!1,error:"Missing faction or property."};if(Number(n.condition)>=95)return{ok:!1,error:"Property already at excellent condition."};var s=Ot(n,i),{data:p,error:l}=await t.from("factions").select("corp_cash_reserves").eq("id",e).single();if(l)return{ok:!1,error:"Failed to read cash: "+l.message};var a=Number(p?.corp_cash_reserves??0);if(a<s)return{ok:!1,error:"Insufficient cash.",cost:s};var r=4+Math.floor(Math.random()*6),_=95+Math.floor(Math.random()*4),u=Number(o||0)+r,x=Math.max(0,a-s),{error:w}=await t.from("factions").update({corp_cash_reserves:x}).eq("id",e);if(w)return{ok:!1,error:"Cash deduct failed: "+w.message};var{data:T,error:q}=await t.from("corp_properties").update({refurbish_until_tick:u,refurbish_condition:_}).eq("id",n.id).is("refurbish_until_tick",null).select("id");return q||!T||T.length===0?(await t.from("factions").update({corp_cash_reserves:a}).eq("id",e),{ok:!1,error:q?.message||"Refurbishment already in progress on this property."}):{ok:!0,cost:s,duration:r,targetCondition:_,newCash:x}}let ht=[],d=null,Q=null;function v(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function mt(t){const e=Number(t)||0,n=Math.abs(e);return n>=1e9?{main:"$"+(e/1e9).toFixed(2),unit:"B"}:n>=1e6?{main:"$"+(e/1e6).toFixed(2),unit:"M"}:n>=1e3?{main:"$"+(e/1e3).toFixed(1),unit:"k"}:{main:"$"+Math.round(e).toLocaleString(),unit:""}}function ce(t){const e=Math.max(0,Math.min(100,Number(t)||0));return e>=90?{tag:"Aaa",tone:"good"}:e>=80?{tag:"Aa1",tone:"good"}:e>=70?{tag:"A1",tone:"good"}:e>=60?{tag:"Baa1",tone:"gold"}:e>=50?{tag:"Baa3",tone:"gold"}:e>=40?{tag:"Ba1",tone:"gold"}:e>=30?{tag:"Ba3",tone:"red"}:e>=20?{tag:"B2",tone:"red"}:e>=10?{tag:"Caa1",tone:"red"}:{tag:"Ca",tone:"red"}}function vt(t,e){return Number(t?.[e]??50)}async function de(){const{data:{user:t}}=await f.auth.getUser();if(!t){window.location.href="login.html";return}const{data:e}=await f.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);ht=(e||[]).filter(b=>b.nation_id&&!b.abandoned_at);const n=sessionStorage.getItem("active_faction_id");if(d=ht.find(b=>b.id===n)||ht.find(b=>b.faction_type==="corporation")||ht[0],!d){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",d.id),d.faction_type!=="corporation"){window.location.href="dashboard.html";return}let o=d.nation||"",i=null;const[s,p]=await Promise.all([d.nation_id?f.from("nations").select("*").eq("id",d.nation_id).single():Promise.resolve({data:null}),f.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);s.error&&console.warn("Nation load failed:",s.error.message),s.data&&(o=s.data.name,i=s.data),p.error&&console.warn("Shard load failed:",p.error.message),Q=p.data;let l=0;if(d?.id){const{data:b}=await f.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",d.id).in("status",["open","bidding"]);if(b)for(const g of b)l+=(g.contract_bids||[]).length}(function(){const g=(d.corp_ticker||d.abbreviation||"").toUpperCase(),c=Q?.current_date||"",K=c?c.replace(/.*,\s*/,""):"",R=Q?.current_tick,Y=document.getElementById("h2-plate-logo");Y&&(d.custom_logo_url?Y.innerHTML=`<img src="${m(d.custom_logo_url)}" alt="logo">`:Y.textContent=g.slice(0,3)||"—");const k=document.getElementById("h2-eyebrow-loc");k&&(k.textContent=o?`The Boardroom · ${o}`:"The Boardroom");const X=document.getElementById("h2-tick-date");if(X){const C=[];R!=null&&C.push("Tick "+R),c&&C.push(c),X.textContent=C.length?C.join(" · "):"Tick — · —"}const J=document.getElementById("h2-next-close");J&&(J.textContent="Next close —");const G=document.getElementById("h2-ceo");if(G){const C=[d.leader_first_name,d.leader_last_name].filter(Boolean);if(C.length){const P=d.leader_age?" ("+d.leader_age+")":"",V=d.leader_role||"Chairman & Chief Executive";G.textContent=`${C.join(" ")} · ${V}${P}`}else G.textContent="—"}const ot=document.getElementById("h2-brand");if(ot){const C=d.faction_name||"Unnamed Corporation",P=C.split(" ");if(P.length>1){const V=P.slice(0,-1).join(" "),Z=P[P.length-1];ot.innerHTML=`${m(V)} <em>${m(Z)}</em>`}else ot.textContent=C}const lt=document.getElementById("h2-brand-sub");if(lt){const C=[];d.corp_company_type&&C.push(d.corp_company_type),K&&C.push("Est. "+K);const P=d.corp_subsector||d.corp_sector;P&&C.push(P),lt.textContent=C.length?C.join(" · "):"—"}const ct=document.getElementById("h2-tail-code");if(ct){const C=(o||"").split(" ").map(Z=>Z[0]||"").join("").toUpperCase().slice(0,4),P=d.party_description?'"'+d.party_description+'"':"",V=[];g&&V.push(g),C&&V.push(C+" EXCH"),P&&V.push(P),ct.textContent=V.length?V.join(" · "):"—"}const M=document.getElementById("h2-wire-corp");if(M){const C=(d.faction_name||"your corp").split(" ").slice(0,2).join(" ");M.textContent=C}const h=document.getElementById("h2-edit-toggle");h&&h.addEventListener("click",()=>{const C=document.body.classList.toggle("h2-edit-open");h.classList.toggle("on",C),h.textContent=C?"Close ✕":"Logo"})})(),(function(){const g=document.getElementById("h2-logout-btn");if(g&&g.addEventListener("click",async()=>{try{sessionStorage.clear(),await f.auth.signOut()}catch{}window.location.href="login.html"}),l>0){const c=document.getElementById("h2-nav-actions-badge");c&&(c.textContent=l,c.style.display="",c.classList.add("ok"))}})(),document.getElementById("id-type-badge").textContent=d.corp_company_type||"—";const a=document.getElementById("id-logo"),r=(d.corp_ticker||d.abbreviation||"").toUpperCase();d.custom_logo_url?a.innerHTML=`<img src="${m(d.custom_logo_url)}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`:a.textContent=r.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=d.faction_name||"Unnamed Corp";const _=d.party_description||"";document.getElementById("id-slogan").textContent=_?'"'+_+'"':'"--"';const u=Q?.current_date?Q.current_date.replace(/.*,\s*/,""):"—",x=d.leader_first_name&&d.leader_last_name?d.leader_first_name+" "+d.leader_last_name+(d.leader_age?" ("+d.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${m(u)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${m(o||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${m(d.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${m(d.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${m(x)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${m(d.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${m(r)}</span>
        </div>
    `;const w=d.last_rename_tick||0,T=Q?.current_tick||0,N=Math.max(0,w+120-T),A=!_||_==="-"||_==='"-"'||N<=0,U=document.getElementById("slogan-editor");U.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${m(_)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${A?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${A?"60 characters max. 120 tick cooldown after change.":N+" ticks until you can change slogan."}</div>
    `;const O=document.getElementById("corp-logo-upload");O.innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Logo</span>
            <label class="id-row__value" style="cursor:pointer;text-decoration:underline;" id="corp-logo-label">
                ${d.custom_logo_url?"Change Logo":"Upload Logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" id="corp-logo-file" style="display:none;">
            </label>
        </div>
    `,document.getElementById("corp-logo-file")?.addEventListener("change",$e),window._corpFactionId=d.id,window._currentTick=T,window._nationStats=i,window._factionData=d;const $=pe(i,o,d);me(o,d);const L=await Bt(i,o,d,Q);let D=0;if(d?.id){const{data:b,error:g}=await f.from("corp_equipment").select("equipment_key, owned").eq("faction_id",d.id);g||(D=ie(b||[]))}let E=0;if(d?.id){const{data:b}=await f.from("corp_executives").select("salary_per_year").eq("faction_id",d.id).eq("status","active");E=(b||[]).reduce((g,c)=>g+(Number(c.salary_per_year)||0),0)}let S=0,H=0;if(d?.id&&d.corp_sector==="Shipping"){const{data:b}=await f.from("corp_vessels").select("base_maintenance, purchase_price, condition, built_at_tick, status").eq("faction_id",d.id).neq("status","for_sale");S=(b||[]).reduce((g,c)=>g+(Number(c.base_maintenance)||0),0),H=se(b,T)}await fe(i,Q,$,d,L.propertyMaintenance||0,D,E,L,S),await ue(i,o,d,$,L,H),ae(d,i,Q),st={nationId:d.nation_id},Qt(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function pe(t,e,n){const o=g=>vt(t,g),i=(e||"UNKNOWN").toUpperCase(),s=Number(n?.corp_general_workforce??2250),p=Number(n?.corp_skilled_workforce??600),l=Number(n?.corp_innovative_workforce??150),a=s+p+l,r=2,_=3,u=6,x=o("minimum_wage"),w=x/100*48e3,T=o("inflation"),q=o("standard_of_living"),N=1+(T-50)/100*.5,W=1+(q-50)/100*.5,A=g=>Math.round(w*g*N*W),U=A(r),O=A(_),$=A(u),L=s*U,D=p*O,E=l*$,S=L+D+E;function H(g){return"$"+Math.round(g).toLocaleString()+"/yr"}const b=`${N.toFixed(2)} &times; ${W.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=a.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${m(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${r}.0 &times; ${b})</span>
                <span class="wf-tier__value">${H(U)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${v(L)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${m(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${p.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${_}.0 &times; ${b})</span>
                <span class="wf-tier__value">${H(O)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${v(D)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${m(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${u}.0 &times; ${b})</span>
                <span class="wf-tier__value">${H($)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${v(E)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${m(i)})</span>
                <span class="wf-tier__value">${x}/100 → ${H(w)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${N.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${W.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${a.toLocaleString()}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Total Annual Wages</span>
                <span class="wf-total__value" style="color:var(--red);">${v(S)}</span>
            </div>
            <div class="wf-total__row">
                <span class="wf-total__label">Per Tick (÷12)</span>
                <span class="wf-total__value" style="color:var(--red);">${v(S/12)}</span>
            </div>
        </div>
    `,{totalWages:S,generalTotal:L,skilledTotal:D,innovativeTotal:E,monthlyWages:Math.round(S/12)}}async function fe(t,e,n,o,i,s,p,l,a){const r=e?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+r;const _=87e6,u=y=>vt(t,y),x=1+(u("gdp_growth")-50)/100*.4,w=1+(u("urbanization")-50)/100*.3,T=1+(u("population_growth")-50)/100*.2,q=1+(u("standard_of_living")-50)/100*.15,N=1+(50-u("physical_infrastructure"))/100*.1,W=1-Math.max(0,u("inflation")-50)/100*.1,A=1-Math.max(0,u("interest_rates")-50)/100*.1,U=x*w*T*q*N*W*A,O=Math.round(_*U),$=(o.corp_general_workforce||0)+(o.corp_skilled_workforce||0)+(o.corp_innovative_workforce||0),L=Math.max(500,l?.totalCapacity||500),D=Math.min(1,$/L),E=l?.propertyRevBonus||0,S=Math.round(Math.round(O/12)*D)+E;let H=0,b=0,g=0;if(o?.id){const y=o.corp_sector||"";if(y==="Finance"){const{data:B,error:I}=await f.from("finance_active_loans").select("monthly_payment, interest_rate, principal, original_principal, finance_loan_requests(request_type)").eq("lender_faction_id",o.id).in("status",["current","late","delinquent"]);I&&console.warn("[Finances] finance_active_loans query failed:",I.message);for(const z of B||[]){const F=z.finance_loan_requests?.request_type||"loan";F==="insurance"?b+=Number(z.monthly_payment||0):F==="loan"?b+=At(re(z),z.interest_rate):F==="bond"&&(b+=Number(z.monthly_payment||0))}}else if(y==="Construction"){const{data:B}=await f.from("construction_contracts").select("id, timeline_ticks").eq("awarded_to_faction",o.id).eq("status","in_progress"),I=(B||[]).map(F=>F.id).filter(Boolean);if(I.length>0){const{data:F}=await f.from("contract_bids").select("contract_id, estimated_cost").in("contract_id",I).eq("status","won"),ft={};for(const it of F||[])ft[it.contract_id]=Number(it.estimated_cost||0);for(const it of B||[]){const j=ft[it.id]||0;g+=Math.round(j/Math.max(1,it.timeline_ticks||1))}}const{data:z}=await f.from("construction_deliveries").select("payment_received").eq("faction_id",o.id).eq("delivered_at_tick",r);for(const F of z||[])b+=Number(F.payment_received||0)}else if(y==="Shipping"){const{data:B}=await f.from("shipping_claims").select("revenue_per_transit").eq("faction_id",o.id).eq("status","active");for(const I of B||[])b+=Number(I.revenue_per_transit||0)}}let c=[],K=0;try{const{data:y}=await f.from("corp_properties").select("id, nation_id, nations!nation_id(name)").eq("faction_id",o.id).eq("type","fuel_depot").eq("is_active",!0);if(y&&y.length>0){const B=y.map(I=>I.nation_id).filter(Boolean);if(B.length>0){const{data:I}=await f.from("shipping_claims").select("faction_id, shipping_routes!inner(destination_nation_id, status)").eq("status","active").in("shipping_routes.destination_nation_id",B),z=[...new Set((I||[]).map(j=>j.faction_id).filter(j=>j&&j!==o.id))],F=new Set;if(z.length>0){const{data:j}=await f.from("corp_properties").select("faction_id, nation_id").in("faction_id",z).in("nation_id",B).eq("type","fuel_depot").eq("is_active",!0);for(const et of j||[])F.add(et.faction_id+"|"+et.nation_id)}const ft={};for(const j of I||[]){const et=j.shipping_routes?.destination_nation_id;et&&j.faction_id!==o.id&&(F.has(j.faction_id+"|"+et)||(ft[et]=(ft[et]||0)+1))}const it=7500;for(const j of y){const et=ft[j.nation_id]||0,Pt=et*it;c.push({nation:j.nations?.name||"Unknown",revenue:Pt,visitors:et}),K+=Pt}c.sort((j,et)=>et.revenue-j.revenue)}}}catch(y){console.warn("Fuel depot revenue estimate failed (non-fatal):",y?.message||y)}const R=H+b+S+K,Y=n?.totalWages||0,k=Math.round(Y/12),X=0,J=i||0,G=s||0,ot=Number(o?.corp_loans)||0,lt=.05,ct=ot>0?Math.round(ot*(lt/12)/(1-Math.pow(1+lt/12,-120))):0;let M=0,h=0;if(o?.id)try{const{data:y}=await f.from("finance_active_loans").select("monthly_payment, finance_loan_requests(request_type)").eq("borrower_faction_id",o.id).in("status",["current","late","delinquent"]);for(const B of y||[]){const I=B.finance_loan_requests?.request_type||"loan",z=Number(B.monthly_payment||0);if(!(z<=0))if(I==="insurance")h+=z;else{if(I==="bond")continue;M+=z}}}catch(y){console.warn("[Finances] borrower finance_active_loans lookup failed:",y)}const C=Math.round((p||0)/12),P=a||0,V=75e3,Z=Math.max(0,Math.min(1,Number(t?.corporate_tax??0)/100||0)),at=k+C+X+J+G+P+ct+M+h+g+V,_t=Math.max(0,R-at),dt=Math.round(_t*Z);let ut="";try{const y=new Set([o.nation_id]),{data:B}=await f.from("corp_properties").select("nation_id").eq("faction_id",o.id).eq("is_active",!0);if((B||[]).forEach(I=>{I.nation_id&&y.add(I.nation_id)}),y.size>0){const{data:I}=await f.from("nations").select("id, name, corporate_tax").in("id",[...y]);I&&I.length>0&&(ut=I.sort((z,F)=>(z.name||"").localeCompare(F.name||"")).map(z=>{const F=Math.round(Number(z.corporate_tax??0)),ft=Math.round(_t*(F/100)/I.length),it=F>25?"#c55":F>15?"#ca5":"#5c5";return`<div style="display:flex;justify-content:space-between;padding:1px 0;font-family:var(--font-mono);font-size:8px;">
                        <span style="color:var(--text-dim);">${z.name} (<span style="color:${it}">${F}%</span>)</span>
                        <span style="color:#a44;">${v(ft)}</span>
                    </div>`}).join(""))}}catch{}const Et=at+dt,nt=Number(o?.monthly_profit||0),pt=Number(o?.corp_cash_reserves??0),Jt=ot;let gt=null,tt=null,Mt=null,Tt="Does not include all capital/financing cash transfers.";if(o?.id)try{const{data:y}=await f.from("corp_cash_history").select("tick, cash_start, cash_end, cash_delta, non_pnl_cash_movements").eq("faction_id",o.id).lte("tick",r).order("tick",{ascending:!1}).limit(2),B=(y||[]).find(z=>Number(z.tick)===Number(r))||(y||[])[0]||null,I=(y||[]).find(z=>Number(z.tick)<Number(B?.tick??r))||null;B?(gt=B.cash_start!=null?Number(B.cash_start):I?.cash_end!=null?Number(I.cash_end):null,tt=B.cash_delta!=null?Number(B.cash_delta):gt!=null?pt-gt:null,Mt=B.non_pnl_cash_movements!=null?Number(B.non_pnl_cash_movements):tt!=null?tt-nt:null):Tt="Does not include all capital/financing cash transfers. Cash history snapshot not yet available."}catch(y){console.warn("[Finances] corp_cash_history lookup failed:",y),Tt="Does not include all capital/financing cash transfers. Cash history snapshot unavailable."}ge(R,nt);const Zt=[{stat:"gdp_growth",value:u("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:u("urbanization"),weight:"0.3"},{stat:"population_growth",value:u("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:u("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:u("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:u("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:u("interest_rates"),weight:"-0.1",neg:!0}];function te(y){return y.neg?y.value>50?"var(--red)":"var(--green)":y.note?y.value<50?"var(--green)":"var(--red)":y.value>=50?"var(--green)":y.value>=35?"var(--amber)":"var(--red)"}const It=R||1,ee=(H/It*100).toFixed(1),ne=((b+K)/It*100).toFixed(1),oe=(S/It*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${ee}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${ne}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${oe}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${v(H)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${v(b)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${v(S-E)}</span></div>
            ${E>0?`<div class="fin-row"><span class="fin-row__label">Property Revenue<span class="fin-row__badge">BUILDINGS</span></span><span class="fin-row__value" style="color:var(--green)">${v(E)}</span></div>`:""}
            ${c.map(y=>`<div class="fin-row"><span class="fin-row__label">Fuel Depot (${y.nation})<span class="fin-row__badge">${y.visitors} visitor${y.visitors!==1?"s":""}</span></span><span class="fin-row__value" style="color:var(--green)">${v(y.revenue)}</span></div>`).join("")}
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${v(R)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${v(k)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Executive Compensation</span><span class="fin-row__value" style="color:#a44">${v(C)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${v(X)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${v(J)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${v(G)}</span></div>
            ${P>0?`<div class="fin-row"><span class="fin-row__label">Fleet Maintenance</span><span class="fin-row__value" style="color:#a44">${v(P)}</span></div>`:""}
            ${g>0?`<div class="fin-row"><span class="fin-row__label">Project Build Costs</span><span class="fin-row__value" style="color:#a44">${v(g)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${v(ct)}</span></div>
            ${M>0?`<div class="fin-row"><span class="fin-row__label">Loan Repayments</span><span class="fin-row__value" style="color:#a44">${v(M)}</span></div>`:""}
            ${h>0?`<div class="fin-row"><span class="fin-row__label">Insurance Premiums</span><span class="fin-row__value" style="color:#a44">${v(h)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${v(dt)}</span></div>
            ${ut?`<div style="padding:2px 12px 6px 20px;border-bottom:1px solid var(--border-hair);">${ut}</div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${v(Et)}</span>
            </div>
        </div>
        <!-- Last Tick Cash Change — primary bottom-line signal. Uses cashDelta
             (cash_end - cash_start from corp_cash_history) so the top-line
             figure captures operating P&L plus non-P&L cash movements. -->
        <div class="fin-net" style="background:${tt==null?"transparent":tt>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"};">
            <span class="fin-net__label">Last Tick Cash Change</span>
            <span class="fin-net__value" style="color:${tt==null?"var(--text-dim)":tt>=0?"var(--green)":"var(--red)"};">${tt==null?"—":v(tt)}</span>
        </div>
        <div style="padding:2px 14px 8px 14px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.2px;">${Tt}</div>
        <!-- Cash Reconciliation -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--text-bright);">Cash Change This Tick</div>
            <div class="fin-row"><span class="fin-row__label">Last Tick Net Profit</span><span class="fin-row__value" style="color:${nt>=0?"var(--green)":"var(--red)"}">${v(nt)}</span></div>
            <div class="fin-row"><span class="fin-row__label">+/- Non-P&amp;L cash movements</span><span class="fin-row__value" style="color:var(--text-bright)">${Mt==null?"—":v(Mt)}</span></div>
            <div class="fin-total">
                <span class="fin-total__label">= Actual Cash Change</span>
                <span class="fin-total__value" style="color:${(tt||0)>=0?"var(--green)":"var(--red)"}">${tt==null?"—":v(tt)}</span>
            </div>
            <div style="padding:2px 12px 4px 12px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.2px;">Computed from cash snapshots: current cash (${v(pt)}) ${gt==null?"with no prior snapshot":"- previous tick cash ("+v(gt)+")"}.</div>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${v(pt)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${v(Jt)}</div>
            </div>
        </div>
        <!-- Purchasing Power widget removed: built on currency_strength + inflation, both drop in Phase 9. -->

        <!-- Loans Section -->
        <div style="padding:8px 14px;border-top:1px solid var(--border-0);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;">Loans</span>
                <a href="corp-operations.html?tab=actions" style="padding:3px 10px;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);text-decoration:none;">CFO &rarr; ACTIONS</a>
            </div>
            <div id="fin-loans-list" style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">No active loans.</div>
        </div>
        <!-- Market Revenue Drivers -->
        <div style="padding:8px 14px;">
            <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:1.5px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;">Market Revenue Drivers</div>
            ${Zt.map(y=>`
                <div class="drv-row">
                    <span class="drv-row__name">${y.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${y.value}%;background:${te(y)}"></div></div>
                    <span class="drv-row__val">${y.value}</span>
                    <span class="drv-row__wt">&times;${y.weight}</span>
                    ${y.note?'<span class="drv-row__note">'+y.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${U.toFixed(2)}</span>
            </div>
        </div>
    `,St()}let Lt=!1;async function _e(t,e){if(!(!d||Lt)){Lt=!0;try{const{data:n,error:o}=await f.from("finance_loan_offers").select("*").eq("id",t).single();if(o||!n)return;const{data:i,error:s}=await f.from("finance_loan_requests").select("*").eq("id",e).single();if(s||!i||i.status!=="open")return;const p=i.term_months,l=At(i.amount,n.interest_rate),a=Math.round(i.amount/p),r=l+a,_=Q?.current_tick||0,{error:u}=await f.from("finance_loan_requests").update({status:"funded",accepted_offer_id:t,funded_tick:_}).eq("id",e);if(u)return;await f.from("finance_loan_offers").update({status:"accepted"}).eq("id",t),await f.from("finance_loan_offers").update({status:"declined"}).eq("request_id",e).neq("id",t).eq("status","pending"),await f.from("finance_active_loans").insert({request_id:e,offer_id:t,borrower_faction_id:i.requesting_faction_id,lender_faction_id:n.offering_faction_id,nation_id:i.nation_id,principal:i.amount,interest_rate:n.interest_rate,term_months:i.term_months,collateral_type:n.collateral_type,purpose:i.purpose,monthly_payment:r,started_tick:_});const{data:x}=await f.from("factions").select("corp_cash_reserves").eq("id",n.offering_faction_id).single();x&&await f.from("factions").update({corp_cash_reserves:Math.max(0,(Number(x.corp_cash_reserves)||0)-i.amount)}).eq("id",n.offering_faction_id);const{data:w}=await f.from("factions").select("corp_cash_reserves, corp_debt").eq("id",i.requesting_faction_id).single();if(w){const{error:T}=await f.from("factions").update({corp_cash_reserves:(Number(w.corp_cash_reserves)||0)+i.amount,corp_debt:(Number(w.corp_debt)||0)+i.amount}).eq("id",i.requesting_faction_id);T&&console.error("[Loans] Failed to credit borrower + track debt:",T.message)}}finally{Lt=!1}St()}}async function ve(t){await f.from("finance_loan_requests").update({status:"cancelled"}).eq("id",t),St()}async function St(){if(!d)return;const t=document.getElementById("fin-loans-list");if(t)try{const{data:e,error:n}=await f.from("finance_loan_requests").select("*, finance_loan_offers!request_id(*)").eq("requesting_faction_id",d.id).in("status",["open","funded"]).neq("request_type","equity").order("created_tick",{ascending:!1});n&&console.error("[Loans] Request query error:",n.message);const{data:o,error:i}=await f.from("finance_active_loans").select("*, finance_loan_requests!inner(request_type, insured_contract_id), lender:factions!lender_faction_id(faction_name, abbreviation)").eq("borrower_faction_id",d.id).in("status",["current","late","delinquent"]).is("equity_pct",null).order("started_tick",{ascending:!1});i&&console.error("[Loans] Active loans query error:",i.message);const s=[];for(const r of o||[]){const _=r.finance_loan_requests?.insured_contract_id;_&&s.push(_)}const p=[...new Set(s)];let l={};if(p.length>0){const{data:r,error:_}=await f.from("construction_contracts").select("id, status").in("id",p);_?console.error("[Loans] Contract status query error:",_.message):l=Object.fromEntries((r||[]).map(u=>[u.id,u.status]))}let a="";if(e&&e.length>0){for(const r of e)if(r.status==="open"){const _=(r.finance_loan_offers||[]).filter(u=>u.status==="pending");if(a+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${v(r.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${r.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${r.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${m(r.purpose||"")}</div>`,_.length>0){a+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${_.length} OFFER${_.length>1?"S":""}</div>`;for(const u of _.sort((x,w)=>x.interest_rate-w.interest_rate))a+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${u.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${u.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${u.id}','${r.id}')">ACCEPT</span>
                        </div>`}else a+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';a+="</div>"}}if(o&&o.length>0)for(const r of o){const _=r.finance_loan_requests?.request_type||"loan",u=r.finance_loan_requests?.insured_contract_id,x=u?l[u]:null;if(_==="insurance"){const A=(r.status==="late"||r.status==="delinquent")&&Number(r.payments_missed||0)===0,U=A?"#d9a441":r.status==="current"?"var(--green)":r.status==="late"?"#c84":"#c55",O=x==="completed"?"Project Completed":x==="in_progress"?"Project In Progress":null;a+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <span style="color:#5a8aaa;font-weight:700;">INSURANCE</span>
                            <span style="color:${U};font-weight:700;">${r.status.toUpperCase()}</span>
                            ${A?'<span style="color:#d9a441;background:rgba(217,164,65,0.14);border:1px solid rgba(217,164,65,0.32);padding:1px 6px;font-size:7px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">Status drift</span>':""}
                        </div>
                        ${x==="completed"?'<span style="color:#c8a64e;background:rgba(200,166,78,0.14);border:1px solid rgba(200,166,78,0.3);padding:1px 6px;font-size:7px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">Pending auto-close</span>':""}
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;font-size:7px;color:var(--text-dim);">
                        <span>Monthly Premium: ${v(r.monthly_payment)}/mo</span>
                        <span>Coverage: ${v(r.principal)}</span>
                    </div>
                    ${O?`<div style="margin-top:4px;">
                            <span style="color:#5a8aaa;background:rgba(90,138,170,0.14);border:1px solid rgba(90,138,170,0.32);padding:1px 6px;font-size:7px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">${O}</span>
                        </div>`:""}
                </div>`;continue}const w=(r.status==="late"||r.status==="delinquent")&&Number(r.payments_missed||0)===0,T=w?"#d9a441":r.status==="current"?"var(--green)":r.status==="late"?"#c84":"#c55",q=r.term_months>0?Math.round(r.payments_made/r.term_months*100):0,N=r.lender?.faction_name||"Unknown bank",W=kt(r.started_tick);a+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${T};font-weight:700;">${r.status.toUpperCase()}</span>
                        ${w?'<span style="color:#d9a441;background:rgba(217,164,65,0.14);border:1px solid rgba(217,164,65,0.32);padding:1px 6px;font-size:7px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;margin-left:4px;">Status drift</span>':""}
                        <span style="color:var(--text-primary);margin-left:4px;">${v(r.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${r.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${q}% repaid</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Bank: <span style="color:var(--text-primary);">${m(N)}</span></span>
                    <span>Issued: <span style="color:var(--text-primary);">${m(W)}</span></span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${q}%;background:${T};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Payment: ${v(r.monthly_payment)}/mo</span>
                    <span>${r.payments_made}/${r.term_months} payments</span>
                </div>
            </div>`}a||(a='<div style="color:var(--text-dim);">No active loans.</div>'),t.innerHTML=a}catch(e){console.error("[Loans] loadLoansSection error:",e)}}window.acceptOffer=_e;window.cancelRequest=ve;function me(t,e){const n=(t||"").toUpperCase(),o=Number(e.corp_general_workforce??0)+Number(e.corp_skilled_workforce??0)+Number(e.corp_innovative_workforce??0),i=[{label:"Reputation",value:Number(e.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:o||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(e.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(e.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(e.corp_market_share??5),change:0,nation:n,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(e.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(e.corp_regulatory_standing??50),change:0,nation:n,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(e.corp_political_influence??10),change:0,decay:!0,nation:n,max:100},{label:"Innovation",value:Number(e.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function s(a,r){if(!r||r>100)return"var(--text-primary)";const _=a/r*100;return _>=70?"var(--green)":_>=40?"var(--amber)":_>=20?"var(--orange, #d48a3c)":"var(--red)"}function p(a){const r=parseFloat(a),_=r>0?"var(--green)":r<0?"var(--red)":"var(--text-dim)",u=r>0?"▲":r<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${_}">${u}</span>
            <span class="stat-item__delta" style="color:${_}">${Math.abs(r).toFixed(1)}</span>
        </div>`}let l="";for(const a of i){if(a.isHero){l+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${a.label}</span>
                            ${a.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${Math.round(a.value)}</span>
                            <span class="stats-hero__max">/100</span>
                            ${p(a.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${Math.min(100,a.value)}%"></div></div>
                </div>`;continue}a.section&&(l+=`<div class="stats-section"><span class="stats-section__label">${a.section}</span></div>`);const r=a.max&&a.max<=100;l+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${a.label}</span>
                        ${a.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${a.nation?'<span class="stat-item__nation">'+m(a.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${r?s(a.value,a.max):"var(--text-primary)"}">${typeof a.value=="number"?r?Math.round(a.value):a.value.toLocaleString():a.value}</span>
                    ${r?'<span class="stat-item__max">/100</span>':""}
                    ${p(a.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=l}async function Bt(t,e,n,o){const i=(e||"UNKNOWN").toUpperCase();let s=[];if(n?.id){const{data:g}=await f.from("corp_properties").select("*").eq("faction_id",n.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});s=g||[]}const p={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let l=0,a=0;const r=Number(n?.corp_general_workforce??0)+Number(n?.corp_skilled_workforce??0)+Number(n?.corp_innovative_workforce??0),_=500,u=s.map(g=>{const c=Number(g.capacity||0),K=Number(g.condition||0)/100;return Math.floor(c*K)}),x=_+u.reduce((g,c)=>g+c,0),w=x>0?Math.min(r,Math.round(r*(_/x))):r,T=5e7,q=1+(vt(t,"inflation")-50)/100*.3,N=.8+vt(t,"stability")/100*.4,W=Math.round(T*q*N),A=Math.round(W*.005);l+=W,a+=A;let U=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${m(i)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${_}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${w.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(W)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${v(A)}</div>
            </div>
        </div>
    </div>`,O=w;for(let g=0;g<s.length;g++){const c=s[g],K=p[c.style]||p.Basic;l+=Number(c.purchase_price||0),a+=Number(c.monthly_maintenance||0);const R=c.condition>=75?"var(--green)":c.condition>=50?"var(--amber)":"var(--orange)",Y=Number(c.capacity||0),k=u[g]||0,X=x>0?Math.min(r-O,Math.round(r*(k/x))):0;O+=X,U+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${m(c.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${m(c.city||i)} · ${(c.type||"").replace(/_/g," ")} · <span style="color:${K.color}">${(c.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge" ${["branch_office","trading_floor","claims_office"].includes(c.type)?'style="background:rgba(138,106,170,0.12);color:#8a6aaa;border-color:rgba(138,106,170,0.3);"':""}>${["branch_office","trading_floor","claims_office"].includes(c.type)?c.type.replace(/_/g," ").replace(/\b\w/g,J=>J.toUpperCase()):"OWNED"}</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${Y.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${X.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(c.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${v(c.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${R}">${c.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${c.condition}%;height:100%;background:${R};"></div></div>
            ${c.refurbish_until_tick&&c.refurbish_until_tick>(o?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${c.refurbish_until_tick-(o?.current_tick||0)} tick${c.refurbish_until_tick-(o?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${c.id}','${m(c.name).replace(/'/g,"\\'")}',${c.purchase_price||0},${c.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${c.id}','${m(c.name).replace(/'/g,"\\'")}',${c.condition},${c.purchase_price||0},${c.refurbish_count||0})">REFURBISH</button>
                ${n?.corp_sector==="Finance"&&(c.type==="office"||c.type==="regional_hq")&&c.role!=="subsidiary"&&!["branch_office","trading_floor","claims_office"].includes(c.type)?`<button class="prop-action-btn" style="background:rgba(138,106,170,0.08);border-color:rgba(138,106,170,0.2);color:#8a6aaa;" onclick="showConvertModal('${c.id}','${m(c.name).replace(/'/g,"\\'")}',${c.purchase_price||0})">CONVERT</button>`:""}
            </div>`}
        </div>`}let $="",L=[];if(n?.id){const{data:g}=await f.from("construction_contracts").select("*, contract_bids(id, faction_id, bid_price, estimated_quality, estimated_cost, labor_count, markup_pct, material_grades, submitted_at_tick, status, factions!faction_id(faction_name, abbreviation, corp_reputation))").eq("issuer_faction_id",n.id).in("status",["open","bidding","awarded","in_progress"]).order("generated_at_tick",{ascending:!1});L=g||[];let c={};const K=L.filter(R=>R.status==="in_progress").map(R=>R.id);if(K.length>0){const{data:R}=await f.from("construction_events").select("contract_id, status, severity, title").in("contract_id",K).eq("status","ACTIVE");for(const Y of R||[])c[Y.contract_id]||(c[Y.contract_id]=[]),c[Y.contract_id].push(Y)}if(L.length>0){const R={open:{label:"OPEN",color:"#5a8aaa"},bidding:{label:"BIDDING",color:"#c8a832"},awarded:{label:"AWARDED",color:"#8b9a6b"},in_progress:{label:"IN PROGRESS",color:"#5aaa8b"}},Y={LOW:"#ca5",MODERATE:"#c84",HIGH:"#c55",CRITICAL:"#f44"};$=`<div class="cp-section">
                <div class="cp-section__header">
                    <span class="cp-section__title">Construction Projects</span>
                    <span class="cp-section__count">${L.length} ACTIVE</span>
                </div>`;for(const k of L){const X=R[k.status]||R.open,J=(k.contract_bids||[]).filter(M=>M.status==="pending"),G=(k.contract_bids||[]).find(M=>M.status==="won"),ot=o?.current_tick||0,lt=c[k.id]||[],ct=k.nation_id===n.nation_id?i:"";if($+=`<div class="cp-item">
                    <div class="cp-item__top">
                        <div>
                            <div class="cp-item__name">${m(k.name)}</div>
                            <div class="cp-item__sub">${m(k.project_code||"")} · ${m(k.sector||"")}${ct?" · "+m(ct):""}</div>
                        </div>
                        <span class="cp-badge" style="color:${X.color};border-color:${X.color}40;background:${X.color}08;">${X.label}</span>
                    </div>
                    <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:2px 0;">
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BUDGET</div>
                            <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(k.budget_ceiling||0)}</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">TIMELINE</div>
                            <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${k.timeline_ticks||"?"} ticks</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDS</div>
                            <div style="font-size:10px;font-weight:700;color:${J.length>0?"var(--amber)":"var(--text-dim)"};font-family:var(--font-mono);">${(k.contract_bids||[]).length}</div>
                        </div>
                    </div>`,(k.status==="awarded"||k.status==="in_progress")&&G){const M=Number(G.factions?.corp_reputation??50),h=M>=70?"#5c5":M>=40?"#ca5":"#c55",C=G.estimated_quality>=75?"#5c5":G.estimated_quality>=50?"#ca5":"#c55";if($+=`<div style="margin-top:6px;padding:6px 8px;background:var(--bg-3);border:1px solid var(--border-hair);">
                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.8px;margin-bottom:3px;">CONTRACTOR</div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${m(G.factions?.faction_name||"Unknown")}</div>
                        <div style="display:flex;gap:0;">
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID</div>
                                <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(G.bid_price)}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                <div style="font-size:9px;font-weight:700;color:${C};font-family:var(--font-mono);">${G.estimated_quality}/100</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${G.labor_count}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                <div style="font-size:9px;font-weight:700;color:${h};font-family:var(--font-mono);">${M}/100</div>
                            </div>
                        </div>`,k.status==="in_progress"&&k.awarded_at_tick!=null){const P=ot-k.awarded_at_tick,V=k.timeline_ticks||1,Z=k.stalled_ticks||0,at=Math.min(100,Math.round(P/(V+Z)*100)),_t=at>=75?"#5c5":at>=40?"#ca5":"#5aaa8b",dt=Math.max(0,V+Z-P);$+=`<div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);margin-top:6px;">
                            <span style="color:var(--text-dim);">PROGRESS</span>
                            <span style="color:${_t};">${at}%${Z>0?" · "+Z+" stalled":""} · ${dt} tick${dt!==1?"s":""} left</span>
                        </div>
                        <div class="cp-progress"><div class="cp-progress__bar" style="width:${at}%;background:${_t};"></div></div>`}else $+='<div style="font-size:8px;font-family:var(--font-mono);color:var(--amber);margin-top:6px;text-align:center;">Awarded — construction begins next tick</div>';$+="</div>"}if(lt.length>0)for(const M of lt){const h=Y[M.severity]||"#ca5";$+=`<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:3px 6px;background:${h}08;border:1px solid ${h}20;">
                            <span class="cp-badge" style="color:${h};border-color:${h}40;background:${h}12;">${M.severity}</span>
                            <span style="font-size:8px;font-family:var(--font-mono);color:${h};">${m(M.title)}</span>
                        </div>`}if((k.status==="open"||k.status==="bidding")&&J.length>0)for(let M=0;M<J.length;M++){const h=J[M],C=k.id.slice(0,8)+"-"+M,P=Number(h.factions?.corp_reputation??50),V=P>=70?"#5c5":P>=40?"#ca5":"#c55",Z=h.estimated_quality>=75?"#5c5":h.estimated_quality>=50?"#ca5":"#c55",at=h.markup_pct<=10?"#5c5":h.markup_pct<=20?"#ca5":"#c55",_t=h.material_grades||{},dt=Object.entries(_t),ut=nt=>nt.replace(/_/g," ").replace(/\b\w/g,pt=>pt.toUpperCase()),Et=nt=>nt==="HIGH"?"#5c5":nt==="LOW"?"#c55":"var(--text-muted)";$+=`<div class="cp-bid" style="flex-direction:column;gap:0;padding:0;cursor:pointer;" onclick="cpToggleBid('${C}')">
                            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
                                <span style="flex:1;font-size:8px;font-family:var(--font-mono);color:var(--text-muted);">
                                    ${m(h.factions?.faction_name||"Unknown")}
                                    · <span style="color:var(--gold);">${v(h.bid_price)}</span>
                                    · Q: <span style="color:${Z};">${h.estimated_quality}</span>
                                </span>
                                <span class="cp-bid__btn" style="color:#5c5;border-color:#5c540;background:#5c508;" onclick="event.stopPropagation();cpAcceptBid('${k.id}','${h.id}','${m((h.factions?.faction_name||"").replace(/'/g,""))}',${h.bid_price},${h.estimated_quality},${h.labor_count},'${h.faction_id}')">ACCEPT</span>
                            </div>
                            <div id="cp-bid-${C}" style="display:none;padding:4px 8px 6px;border-top:1px solid var(--border-hair);background: var(--border-hair);">
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID PRICE</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(h.bid_price)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">EST. COST</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${v(h.estimated_cost||0)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MARKUP</div>
                                        <div style="font-size:9px;font-weight:700;color:${at};font-family:var(--font-mono);">${h.markup_pct}%</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                        <div style="font-size:9px;font-weight:700;color:${Z};font-family:var(--font-mono);">${h.estimated_quality}/100</div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${h.labor_count}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                        <div style="font-size:9px;font-weight:700;color:${V};font-family:var(--font-mono);">${P}/100</div>
                                    </div>
                                    <div style="flex:2;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDDER</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${m(h.factions?.faction_name||"Unknown")}</div>
                                    </div>
                                </div>
                                ${dt.length>0?`<div style="padding:2px 4px;">
                                    <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;margin-bottom:2px;">MATERIAL GRADES</div>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        ${dt.map(([nt,pt])=>`<span style="font-size:7px;font-family:var(--font-mono);color:${Et(pt)};">${ut(nt)}: ${pt}</span>`).join("")}
                                    </div>
                                </div>`:""}
                            </div>
                        </div>`}if((k.status==="open"||k.status==="bidding")&&J.length===0){const M=(k.bidding_ends_tick||0)-(o?.current_tick||0);$+=`<div style="font-size:8px;font-family:var(--font-mono);color:var(--text-dim);margin-top:4px;text-align:center;">
                        Awaiting bids${M>0?" · "+M+" tick"+(M!==1?"s":"")+" remaining":""}
                    </div>`}$+="</div>"}$+="</div>"}}const D=document.getElementById("prop-count"),E=s.length+1,S=L.length,H=E+" ASSET"+(E!==1?"S":"")+(S>0?" · "+S+" PROJECT"+(S!==1?"S":""):"");D&&(D.textContent=H),document.getElementById("prop-body").innerHTML=`
        ${U}
        ${$}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${v(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${v(a)}/mo</span>
            </div>
        </div>
    `;let b=0;b+=Math.round(_*50);for(const g of s){if(g.refurbish_until_tick&&(o?.current_tick||0)<g.refurbish_until_tick)continue;const c=Number(g.condition||0)/100;c>=.6&&(b+=Math.round(Number(g.capacity||0)*c*50))}return{propertyValue:l,propertyMaintenance:a,totalCapacity:x,propertyRevBonus:b}}async function ue(t,e,n,o,i,s=0){(e||"UNKNOWN").toUpperCase();const p=n.corp_company_type||"Private",l=Number(n.corp_cash_reserves)||0,a=i?.propertyValue||0;let r=0;if(n?.id&&n.corp_sector==="Finance")try{const{data:L}=await f.from("finance_active_loans").select("remaining_principal, finance_loan_requests(request_type)").eq("lender_faction_id",n.id).in("status",["current","late","delinquent"]);for(const D of L||[]){const E=D.finance_loan_requests?.request_type||"loan";if(E==="loan"||E==="bond"){const S=Math.max(0,Number(D.remaining_principal||0));r+=S}}}catch(L){console.warn("[Valuation] finance_active_loans lookup failed:",L)}const _=l+a+s+r,u=Number(n.corp_loans)||0,w=o?.monthlyWages||0,T=0,q=u+w+T,N=_-q,A=Math.round(N*(1+.3)),U=A-N,O=U>0;document.getElementById("val-type-badge").textContent=p.toUpperCase();function $(L,D,E={}){const S=E.indent?"val-line val-line--indent":"val-line",H=E.bold?"val-line__label val-line__label--bold":"val-line__label",b=E.bold?"val-line__value val-line__value--bold":"val-line__value",g=E.color||(E.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${S}"><span class="${H}">${L}</span><span class="${b}" style="color:${g}">${v(D)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${$("Cash & Reserves",l,{indent:!0})}
        ${$("Property",a,{indent:!0})}
        ${$("Equipment",s,{indent:!0})}
        ${$("Active Contracts",r,{indent:!0})}
        ${$("Total Assets",_,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${$("Outstanding Loans",u,{indent:!0})}
        ${$("Accounts Payable",w,{indent:!0})}
        ${$("Pending Project Costs",T,{indent:!0})}
        ${$("Total Liabilities",q,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${N>=0?"var(--green)":"var(--red)"};">${v(N)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${v(A)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${O?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${O?"var(--green)":"var(--red)"};">${O?"+":""}${v(U)}</span>
            </div>
            <div class="val-market__note">${O?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `,ye({faction:n,nationName:e,cashReserves:l,propertyValue:a,equipmentValue:s,outstandingLoans:u,accountsPayable:w,totalLiabilities:q,netWorth:N,currentTickDate:t?._h2_close_label})}function ge(t,e){const n=document.getElementById("h2-kpi-rev"),o=document.getElementById("h2-kpi-rev-d");if(!n)return;const i=mt(t);if(n.innerHTML=`${i.main}<small>${i.unit}</small>`,o){const s=mt(Math.abs(e)),p=e>=0?"+":"−",l=e>=0?"up":"down";o.className="delta "+l,o.textContent=`${p}${s.main}${s.unit} net`}}function ye({faction:t,nationName:e,cashReserves:n,propertyValue:o,equipmentValue:i,outstandingLoans:s,accountsPayable:p,totalLiabilities:l,netWorth:a}){if(!document.getElementById("h2-kpi-cash"))return;const r=mt(n);document.getElementById("h2-kpi-cash").innerHTML=`${r.main}<small>${r.unit}</small>`;const _=document.getElementById("h2-kpi-cash-d");_&&(_.textContent=l>0?`Liab. ${mt(l).main}${mt(l).unit}`:"No liabilities");const u=mt(a);document.getElementById("h2-kpi-nw").innerHTML=`${u.main}<small>${u.unit}</small>`;const x=document.getElementById("h2-kpi-nw-d");if(x){const g=a>=0?"up":"down";x.className="delta "+g,x.textContent=a>=0?"positive equity":"negative equity"}const w=Number(t.corp_reputation??0),T=document.getElementById("h2-kpi-rep");T&&(T.innerHTML=`${Math.round(w)}<small> / 100</small>`);const q=document.getElementById("h2-kpi-rep-d");q&&(q.className="delta "+(w>=70?"up":w>=40?"flat":"down"),q.textContent=w>=70?"strong":w>=40?"steady":"weak");const N=Number(t.corp_market_share??0),W=document.getElementById("h2-kpi-mkt");W&&(W.innerHTML=`${Math.round(N)}<small>%</small>`);const A=document.getElementById("h2-kpi-mkt-d");A&&(A.className="delta "+(N>=15?"up":N>=5?"flat":"down"),A.textContent=N>=15?"major player":N>=5?"mid-tier":"niche");const U=(t.corp_ticker||t.abbreviation||"CORP").toUpperCase(),O=document.getElementById("h2-nw-sym");O&&(O.textContent=U);const $=document.getElementById("h2-nw-ex");if($){const g=(e||"").split(" ").map(c=>c[0]||"").join("").toUpperCase().slice(0,4);$.textContent=`${t.corp_company_type||"Private"}${g?" · "+g+" EXCH":""}`}const L=document.getElementById("h2-nw-price");L&&(L.innerHTML=`${u.main}<small>${u.unit}</small>`);const D=document.getElementById("h2-nw-d");D&&(D.className="d flat",D.textContent="no history yet");const E=(g,c,K)=>{const R=document.getElementById(g);R&&(R.textContent=v(c))};E("h2-tr-cash",n),E("h2-tr-property",o),E("h2-tr-equipment",i);const S=document.getElementById("h2-tr-loans");S&&(S.textContent=v(s),S.classList.toggle("good",s===0),S.classList.toggle("red",s>0)),E("h2-tr-payable",p);const H=ce(t.corp_credit_rating??50),b=document.getElementById("h2-tr-credit");b&&(b.textContent=`${H.tag} · ${H.tone==="good"?"stable":H.tone==="gold"?"watch":"caution"}`,b.classList.remove("good","gold","red"),b.classList.add(H.tone))}async function be(){const t=document.getElementById("slogan-input"),e=document.getElementById("slogan-hint"),n=document.getElementById("slogan-save-btn"),o=(t.value||"").trim().slice(0,60);if(o.length===0){e.textContent="Slogan cannot be empty.",e.className="slogan-hint slogan-hint--error";return}n.disabled=!0,n.textContent="...",e.textContent="";try{const{error:i}=await f.from("factions").update({party_description:o,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(i)throw i;document.getElementById("id-slogan").textContent='"'+o+'"',e.textContent="Slogan saved! Next change in 120 ticks.",e.className="slogan-hint slogan-hint--ok",n.textContent="Save"}catch(i){console.error("Slogan save failed:",i),e.textContent="Failed to save slogan.",e.className="slogan-hint slogan-hint--error",n.disabled=!1,n.textContent="Save"}}async function he(){await f.auth.signOut(),window.location.href="login.html"}function xe(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function we(t,e){const n=document.getElementById("corp-faction-dropdown");n&&n.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),n=document.getElementById("corp-faction-dropdown");n&&e&&!e.contains(t.target)&&n.classList.remove("open")});window.doLogout=he;async function $e(t){const e=t.target.files?.[0];if(!e)return;if(e.size>128*1024){alert("Logo must be under 128KB.");return}const n=window._corpFactionId;if(!n)return;const o=document.getElementById("corp-logo-label");o&&(o.textContent="Uploading...");try{const i=e.name.split(".").pop()||"png",s=`party-logos/${n}/${Date.now()}.${i}`,{error:p}=await f.storage.from("public-assets").upload(s,e,{contentType:e.type,upsert:!0});if(p)throw p;const{data:l}=f.storage.from("public-assets").getPublicUrl(s),a=l?.publicUrl||null;await f.from("factions").update({custom_logo_url:a}).eq("id",n);const r=document.getElementById("id-logo");r&&(r.innerHTML=`<img src="${a}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`);const _=document.getElementById("corp-logo");_&&(_.innerHTML=`<img src="${a}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`),o&&(o.textContent="Change Logo")}catch(i){console.error("Logo upload failed:",i),alert("Upload failed: "+(i.message||"Unknown error")),o&&(o.textContent="Upload Logo")}}window.saveSlogan=be;window.toggleCorpDropdown=xe;window.switchToFaction=we;let xt=!1;function ke(t,e,n,o){if(xt)return;const i=window._nationStats,p=1+(vt(i,"inflation")-50)/100*.3,l=Math.max(.1,o/100),a=Math.round(n*p*l),r=document.getElementById("prop-modal-overlay"),_=document.getElementById("prop-modal-content");_.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${m(e)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${v(n)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${p.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${o>=75?"var(--green)":o>=50?"var(--amber)":"var(--red)"};">${o}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${v(a)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${t}', ${a})">Confirm Sale</button>
        </div>
    `,r.style.display="flex"}async function Ce(t,e){if(xt)return;xt=!0;const n=document.getElementById("prop-sell-confirm");n&&(n.disabled=!0,n.textContent="Selling...");try{const o=window._corpFactionId;if(!o)throw new Error("No faction");const{error:i}=await f.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",o);if(i)throw new Error("Failed to sell property: "+i.message);const{data:s}=await f.from("factions").select("corp_cash_reserves").eq("id",o).single(),p=Number(s?.corp_cash_reserves??0),{error:l}=await f.from("factions").update({corp_cash_reserves:p+e}).eq("id",o);l&&console.error("[Property] Failed to credit cash:",l.message),Ct(),alert("Property sold for "+v(e)+". Cash credited."),location.reload()}catch(o){alert("Sale failed: "+o.message)}finally{xt=!1,n&&(n.disabled=!1,n.textContent="Confirm Sale")}}let wt=!1;function Ee(t,e,n,o,i){if(wt)return;const s=window._nationStats,p=window._factionData,a=1+(vt(s,"inflation")-50)/100*.3,r=Ot({purchase_price:o,refurbish_count:i},a),u=Number(p?.corp_cash_reserves??0)>=r,x=document.getElementById("prop-modal-overlay"),w=document.getElementById("prop-modal-content"),T=u&&n<95;let q="";n>=95?q='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property already at excellent condition ('+n+"%).</div>":u||(q='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>'),w.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${m(e)} — Refurbishment #${i+1} — Current Condition: ${n}%</div>
        ${q}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost${i>0?` (1.25<sup>${i}</sup> ×)`:""}</span>
                <span style="color:${u?"var(--gold, #c8a832)":"var(--red)"};">${v(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Duration</span>
                <span style="color:var(--amber, #b09a5b);">4–9 ticks</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">Outcome</span>
                <span style="color:var(--green);">Condition → 95–98%</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${o}, ${i}, ${n})" ${T?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,x.style.display="flex"}async function Me(t,e,n,o){if(wt)return;wt=!0;const i=document.getElementById("prop-refurb-confirm");i&&(i.disabled=!0,i.textContent="Starting...");try{const s=window._corpFactionId,p=window._currentTick,l=window._factionData,a=window._nationStats;if(!s)throw new Error("No faction");const _=1+(vt(a,"inflation")-50)/100*.3,x=await le(f,s,{id:t,purchase_price:e,refurbish_count:n,condition:o},p,_);if(!x.ok)throw new Error(x.error||"Refurbishment failed.");l&&(l.corp_cash_reserves=x.newCash),Ct(),alert(`Refurbishment started! Duration: ${x.duration} ticks. Target condition: ${x.targetCondition}%. Cost: ${v(x.cost)}.`),location.reload()}catch(s){alert("Refurbishment failed: "+s.message)}finally{wt=!1,i&&(i.disabled=!1,i.textContent="Begin Refurbishment")}}function Ct(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=ke;window.confirmSellProperty=Ce;window.showRefurbishModal=Ee;window.confirmRefurbish=Me;window.closePropModal=Ct;window.showConvertModal=Le;window.confirmConvertProperty=qe;let qt=!1;async function Te(t,e,n,o,i,s,p){if(!qt&&confirm("Accept bid from "+n+`?

Bid Price: `+v(o)+`
Quality: `+i+`/100
Workers: `+s+`

This will award the contract. The project begins immediately.`)){qt=!0;try{const{data:l}=await f.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a=l?.current_tick||0,{error:r}=await f.from("contract_bids").update({status:"won"}).eq("id",e);if(r)throw r;const{error:_}=await f.from("contract_bids").update({status:"lost"}).eq("contract_id",t).neq("id",e);if(_)throw _;const{error:u}=await f.from("construction_contracts").update({status:"awarded",awarded_to_faction:p,awarded_at_tick:a}).eq("id",t);if(u)throw u;alert("Contract awarded to "+n+`!

Bid: `+v(o)+`
Project begins immediately.`),window._nationStats&&window._factionData&&Q&&await Bt(window._nationStats,window._nationStats?.name||"",window._factionData,Q)}catch(l){alert("Failed to accept bid: "+(l.message||l))}finally{qt=!1}}}window.cpAcceptBid=Te;function Ie(t){const e=document.getElementById("cp-bid-"+t);e&&(e.style.display=e.style.display==="none"?"":"none")}window.cpToggleBid=Ie;let $t="branch_office",Nt=!1;function Le(t,e,n){const o=(d?.corp_subsector||"").toLowerCase(),i=o==="banking"?[["branch_office","Branch Office"]]:o==="investment"?[["trading_floor","Trading Floor"]]:o==="insurance"?[["claims_office","Claims Office"],["insurance_office","Insurance Office"]]:[];if(i.length===0)return;$t=i[0][0];const s=Math.round(n*.15),p=Math.floor(Math.random()*6)+4,l=document.getElementById("prop-modal-overlay"),a=document.getElementById("prop-modal-content");a.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Convert Property</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">${m(e)}</div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
            ${i.map(([r,_])=>`<span onclick="_convertTargetType='${r}';document.querySelectorAll('.conv-opt').forEach(e=>e.style.background='transparent');this.style.background='rgba(138,106,170,0.15)'" class="conv-opt" style="flex:1;text-align:center;padding:6px;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(138,106,170,0.3);color:#8a6aaa;${r===$t?"background:rgba(138,106,170,0.15)":""}">${_}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Cost</span>
            <span style="color:var(--gold);">${v(s)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Time</span>
            <span style="color:var(--text-bright);">${p} ticks</span>
        </div>
        <div style="font-size:8px;color:var(--text-dim);margin:8px 0;font-family:var(--font-mono);line-height:1.5;">Property will be offline during conversion. No revenue or workforce allocation until complete.</div>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button class="prop-action-btn prop-action-btn--sell" onclick="closePropModal()">Cancel</button>
            <button class="prop-action-btn" style="background:rgba(138,106,170,0.12);border-color:rgba(138,106,170,0.3);color:#8a6aaa;" onclick="confirmConvertProperty('${t}',${s},${p})">Convert</button>
        </div>
    `,l.style.display="flex"}async function qe(t,e,n){if(!Nt){Nt=!0;try{const o=Number(d?.corp_cash_reserves??0);if(o<e){alert("Insufficient cash. Need "+v(e)+".");return}const{data:i,error:s}=await f.from("corp_properties").select("role").eq("id",t).single();if(s||!i){alert("Conversion failed: "+(s?.message||"property not found"));return}if(i.role==="subsidiary"){alert("Subsidiary HQs cannot be converted.");return}const p=Q?.current_tick||0,l=Math.max(0,o-e),{error:a}=await f.from("factions").update({corp_cash_reserves:l}).eq("id",d.id);if(a){alert("Conversion failed: "+a.message);return}d.corp_cash_reserves=l;const{error:r}=await f.from("corp_properties").update({type:$t,role:$t,refurbish_until_tick:p+n,condition:100}).eq("id",t);if(r){const{error:u}=await f.from("factions").update({corp_cash_reserves:o}).eq("id",d.id);u||(d.corp_cash_reserves=o),alert("Conversion failed: "+r.message+(u?" (refund also failed — contact admin)":""));return}Ct();const _=window._nationStats;await Bt(_,_?.name||d?.nation,d,Q)}catch(o){alert("Conversion failed: "+o.message)}finally{Nt=!1}}}const Dt={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},Ht={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},Ne={crisis:"alert",protest:"alert",trade:"fin",economy:"fin",corporate:"fin",executive_order:"ops",military:"ops",bill:"pr",government:"pr",political:"pr",diplomatic:"pr",new_party:"pr"},Se={alert:"Alert",fin:"Fin",ops:"Ops",pr:"PR",crew:"Crew"};function Be(t){return Ne[(t||"").toLowerCase()]||"crew"}function rt(t){const e=document.getElementById("h2-wire-dispatches"),n=document.getElementById("h2-wire-live");if(!e)return;const o=Array.isArray(t)?t:[];if(o.length===0){e.innerHTML='<div class="h2-wire-empty">No dispatches</div>',n&&(n.textContent="0 events");return}n&&(n.textContent=`${o.length} event${o.length!==1?"s":""}`);const i=o.slice(0,12);e.innerHTML=i.map(s=>{const p=Be(s.category),l=s.fired_at_tick!=null?`T${s.fired_at_tick}`:"—",a=s.description_chosen||s.description_used||"",r=Ft(s.event_name),_=r&&a?`<b>${m(r)}</b> — ${m(a)}`:m(r||a||"Event");return`<div class="h2-disp">
            <span class="h2-when">${m(l)}</span>
            <span class="h2-src ${p}">${Se[p]}</span>
            <span class="h2-ln">${_}</span>
        </div>`}).join("")}const Re={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let yt="nation",bt="local",st=null;function Ft(t){return t?t.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()):""}function Rt(t,e){if(!t)return"<em>Unknown</em>";const n=m(t);return e?`<span style="color:${e.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${n}</span>`:`<strong>${n}</strong>`}function Ut(t,e,n){const o=t.factions?.nation_id===(t.nation_id||e),i=t.proposer_name||(o?t.factions?.faction_name:null)||"A former party",s=t.proposer_color||(o?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${Rt(i,s)} proposed "${m(t.bill_name)}"`,category:"bill",_synthetic:!0,...n}}function jt(t,e){const n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,o=n?` led by <strong>${m(n)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${Rt(t.faction_name,t.party_color)} founded${o}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...e}}function Wt(t,e){const n=Re[t.tier]||`Tier ${t.tier}`,o=t.demand_label?` demanding "${m(t.demand_label)}"`:"",i=t.status==="crisis_active",s=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",p=s?`<span style="color:${s};font-weight:600">${m(n)}</span>`:`<strong>${m(n)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:n,_desc_html:`${Rt(t.factions?.faction_name,t.factions?.party_color)} organised a protest${o} — ${p}${i?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...e}}function Vt(t,e,n,o,i){return[...t.map(s=>({...s,_synthetic:!1})),...e,...n,...o].sort((s,p)=>{const l=(p.fired_at_tick||0)-(s.fired_at_tick||0);if(l!==0)return l;const a=s._created_at||s.created_at||"",r=p._created_at||p.created_at||"";return r>a?1:r<a?-1:0}).slice(0,i)}function Gt(t){if(t._synthetic&&t._desc_html)return t._desc_html;const e=t.description_chosen||t.description_used||"",n=Ft(t.event_name),o=n?`<strong>${m(n)}</strong>`:"",i=e?m(e):"";return o&&i?`${o} — ${i}`:i||o||"Event"}function Kt(t){return t.map(e=>{const n=kt(e.fired_at_tick),o=Dt[(e.category||"").toLowerCase()]||Ht;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${m(n)}</span>
            <span class="corp-ev-icon" style="color:${o.color}">${o.icon}</span>
            <span class="corp-ev-text">${Gt(e)}</span>
            ${o.label?`<span class="corp-ev-cat" style="color:${o.color};background:${o.bg}">${o.label}</span>`:""}
        </div>`}).join("")}const zt=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function Pe(t){let e=0;for(let n=0;n<t.length;n++)e=(e<<5)-e+t.charCodeAt(n)|0;return zt[Math.abs(e)%zt.length]}function Yt(t){return t.map(e=>{const n=kt(e.fired_at_tick),o=Dt[(e.category||"").toLowerCase()]||Ht,i=e.nations?.name||"Unknown",s=e.nations?.nation_profiles,p=Array.isArray(s)?s[0]?.flag_url:s?.flag_url,l=Pe(i),a=p?`<img src="${m(p)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${m(n)}</span>
                <span class="corp-ev-nation-badge" style="color:${l.color};background:${l.bg};border-color:${l.border};">${a}${m(i)}</span>
            </span>
            <span class="corp-ev-text">${Gt(e)}</span>
            ${o.label?`<span class="corp-ev-cat" style="color:${o.color};background:${o.bg}">${o.label}</span>`:""}
        </div>`}).join("")}async function ze(){const t=document.getElementById("corp-events-list");if(!t||!st)return;const{nationId:e}=st;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,o]=await Promise.all([f.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),f.from("event_log").select("*").eq("nation_id",e).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=n.data||[],s=o.data||[],p=i.map(a=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${a.faction_name} [${a.corp_ticker||a.abbreviation||"??"}] was founded with a specialty in ${a.corp_subsector||a.corp_sector||"General"}. Led by CEO ${[a.leader_first_name,a.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:a.founded_tick||0})),l=[...s,...p].sort((a,r)=>(r.fired_at_tick||0)-(a.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>',rt([]);return}t.innerHTML=Kt(l),rt(l)}catch(n){console.error("Corp local events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function Ae(){const t=document.getElementById("corp-events-list");if(!t||!st)return;const{nationId:e}=st;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,o]=await Promise.all([f.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),f.from("event_log").select("*, nations(name, nation_profiles(flag_url))").neq("nation_id",e).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=n.data||[],s=o.data||[],p=i.map(a=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${a.faction_name} [${a.corp_ticker||a.abbreviation||"??"}] was founded in ${a.nation||"Unknown"} with a specialty in ${a.corp_subsector||a.corp_sector||"General"}. Led by CEO ${[a.leader_first_name,a.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:a.founded_tick||0,nations:{name:a.nation||"Unknown"}})),l=[...s,...p].sort((a,r)=>(r.fired_at_tick||0)-(a.fired_at_tick||0)).slice(0,40);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>',rt([]);return}t.innerHTML=Yt(l),rt(l);return}catch(n){console.error("Corp world events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>';return}try{const{data:n,error:o}=await f.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(o)throw o;if(!n||n.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>',rt([]);return}t.innerHTML=Oe(n,!0)}catch(n){console.error("Corp world events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function Oe(t,e){return t.map(n=>{const o=[n.leader_first_name,n.leader_last_name].filter(Boolean).join(" ")||"Unknown",i=n.nation||"Unknown",s=n.corp_subsector||n.corp_sector||"General",p=n.corp_ticker||n.abbreviation||"",l=n.founded_tick?kt(n.founded_tick):"";let a='<div class="corp-event-row">';return a+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+m(i.toUpperCase())+"</div>",a+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',a+='<span style="font-weight:600;">'+m(n.faction_name)+"</span>",p&&(a+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+m(p)+"]</span>"),a+=' was founded in <span style="font-weight:500;">'+m(i)+"</span>",a+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+m(s)+"</span>.",a+=' Led by CEO <span style="font-weight:500;">'+m(o)+"</span>.",a+="</div>",l&&(a+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+m(l)+"</div>"),a+="</div>",a}).join("")}async function Qt(){const t=document.getElementById("corp-events-list");if(!t||!st)return;const{nationId:e}=st;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,o,i,s]=await Promise.all([f.from("event_log").select("*").eq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(50),f.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),f.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",e).order("created_at",{ascending:!1}).limit(20),f.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(n.error)throw n.error;const p=n.data||[],l=Vt(p,(o.data||[]).map(a=>Ut(a,e)),(i.data||[]).map(a=>jt(a)),(s.data||[]).map(a=>Wt(a)),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>',rt([]);return}t.innerHTML=Kt(l),rt(l)}catch(n){console.error("Nation events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function De(){const t=document.getElementById("corp-events-list");if(!t||!st)return;const{nationId:e}=st;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[n,o,i,s]=await Promise.all([f.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(60),f.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),f.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("created_at",{ascending:!1}).limit(15),f.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(n.error)throw n.error;const p=n.data||[],l=Vt(p,(o.data||[]).map(a=>Ut(a,null,{nations:a.nations})),(i.data||[]).map(a=>jt(a,{nations:a.nations})),(s.data||[]).map(a=>Wt(a,{nations:a.nations})),60);if(l.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>',rt([]);return}t.innerHTML=Yt(l),rt(l)}catch(n){console.error("World events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==yt&&(yt=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.cat===t)),Xt())};window.switchCorpEventsScope=function(t){t!==bt&&(bt=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.scope===t)),Xt())};function Xt(){yt==="nation"&&bt==="local"?Qt():yt==="nation"&&bt==="world"?De():yt==="corporate"&&bt==="local"?ze():Ae()}de();
