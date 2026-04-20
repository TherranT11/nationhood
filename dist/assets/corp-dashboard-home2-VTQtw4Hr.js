import{_supabase as p}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{e as f,t as Mt}from"./utils-CY90Gazr.js";import{initMessaging as Xt}from"./messaging-BUrQna7p.js";import{c as Jt}from"./equipment-DsuDdEne.js";import{c as Zt}from"./corp-valuation-CgQIQIJ1.js";let bt=[],c=null,Z=null;function v(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(2)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(1)+"k":"$"+Math.round(t).toLocaleString()}function vt(t){const e=Number(t)||0,n=Math.abs(e);return n>=1e9?{main:"$"+(e/1e9).toFixed(2),unit:"B"}:n>=1e6?{main:"$"+(e/1e6).toFixed(2),unit:"M"}:n>=1e3?{main:"$"+(e/1e3).toFixed(1),unit:"k"}:{main:"$"+Math.round(e).toLocaleString(),unit:""}}function te(t){const e=Math.max(0,Math.min(100,Number(t)||0));return e>=90?{tag:"Aaa",tone:"good"}:e>=80?{tag:"Aa1",tone:"good"}:e>=70?{tag:"A1",tone:"good"}:e>=60?{tag:"Baa1",tone:"gold"}:e>=50?{tag:"Baa3",tone:"gold"}:e>=40?{tag:"Ba1",tone:"gold"}:e>=30?{tag:"Ba3",tone:"red"}:e>=20?{tag:"B2",tone:"red"}:e>=10?{tag:"Caa1",tone:"red"}:{tag:"Ca",tone:"red"}}function mt(t,e){return Number(t?.[e]??50)}async function ee(){const{data:{user:t}}=await p.auth.getUser();if(!t){window.location.href="login.html";return}const{data:e}=await p.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);bt=(e||[]).filter(h=>h.nation_id&&!h.abandoned_at);const n=sessionStorage.getItem("active_faction_id");if(c=bt.find(h=>h.id===n)||bt.find(h=>h.faction_type==="corporation")||bt[0],!c){sessionStorage.removeItem("active_faction_id"),window.location.href="faction-select.html";return}if(sessionStorage.setItem("active_faction_id",c.id),c.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i={Construction:"corp-operations.html",Finance:"corp-operations-finance.html",Shipping:"corp-operations.html"}[c.corp_sector]||"corp-operations.html",r=document.getElementById("nav-operations"),l=document.getElementById("nav-expansion");r&&(r.href=i),l&&(l.href="corp-operations.html?tab=expansion");let s=c.nation||"",o=null;const[d,m]=await Promise.all([c.nation_id?p.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),p.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);d.error&&console.warn("Nation load failed:",d.error.message),d.data&&(s=d.data.name,o=d.data),m.error&&console.warn("Shard load failed:",m.error.message),Z=m.data;let u=0;if(c?.id){const{data:h}=await p.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",c.id).in("status",["open","bidding"]);if(h)for(const L of h)u+=(L.contract_bids||[]).length}(function(){const L=(c.corp_ticker||c.abbreviation||"").toUpperCase(),g=Z?.current_date||"",tt=g?g.replace(/.*,\s*/,""):"",X=Z?.current_tick,G=document.getElementById("h2-plate-logo");G&&(c.custom_logo_url?G.innerHTML=`<img src="${f(c.custom_logo_url)}" alt="logo">`:G.textContent=L.slice(0,3)||"—");const dt=document.getElementById("h2-eyebrow-loc");dt&&(dt.textContent=s?`The Boardroom · ${s}`:"The Boardroom");const pt=document.getElementById("h2-tick-date");if(pt){const w=[];X!=null&&w.push("Tick "+X),g&&w.push(g),pt.textContent=w.length?w.join(" · "):"Tick — · —"}const ft=document.getElementById("h2-next-close");ft&&(ft.textContent="Next close —");const E=document.getElementById("h2-ceo");if(E){const w=[c.leader_first_name,c.leader_last_name].filter(Boolean);if(w.length){const A=c.leader_age?" ("+c.leader_age+")":"",D=c.leader_role||"Chairman & Chief Executive";E.textContent=`${w.join(" ")} · ${D}${A}`}else E.textContent="—"}const x=document.getElementById("h2-brand");if(x){const w=c.faction_name||"Unnamed Corporation",A=w.split(" ");if(A.length>1){const D=A.slice(0,-1).join(" "),st=A[A.length-1];x.innerHTML=`${f(D)} <em>${f(st)}</em>`}else x.textContent=w}const it=document.getElementById("h2-brand-sub");if(it){const w=[];c.corp_company_type&&w.push(c.corp_company_type),tt&&w.push("Est. "+tt);const A=c.corp_subsector||c.corp_sector;A&&w.push(A),it.textContent=w.length?w.join(" · "):"—"}const et=document.getElementById("h2-tail-code");if(et){const w=(s||"").split(" ").map(st=>st[0]||"").join("").toUpperCase().slice(0,4),A=c.party_description?'"'+c.party_description+'"':"",D=[];L&&D.push(L),w&&D.push(w+" EXCH"),A&&D.push(A),et.textContent=D.length?D.join(" · "):"—"}const rt=document.getElementById("h2-wire-corp");if(rt){const w=(c.faction_name||"your corp").split(" ").slice(0,2).join(" ");rt.textContent=w}const J=document.getElementById("h2-edit-toggle");J&&J.addEventListener("click",()=>{const w=document.body.classList.toggle("h2-edit-open");J.classList.toggle("on",w),J.textContent=w?"Close ✕":"Logo"})})(),(function(){const L=document.getElementById("h2-logout-btn");if(L&&L.addEventListener("click",async()=>{try{sessionStorage.clear(),await p.auth.signOut()}catch{}window.location.href="login.html"}),u>0){const g=document.getElementById("h2-nav-actions-badge");g&&(g.textContent=u,g.style.display="",g.classList.add("ok"))}})(),document.getElementById("id-type-badge").textContent=c.corp_company_type||"—";const k=document.getElementById("id-logo"),M=(c.corp_ticker||c.abbreviation||"").toUpperCase();c.custom_logo_url?k.innerHTML=`<img src="${f(c.custom_logo_url)}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`:k.textContent=M.slice(0,3)||"—",document.getElementById("id-corp-name").textContent=c.faction_name||"Unnamed Corp";const P=c.party_description||"";document.getElementById("id-slogan").textContent=P?'"'+P+'"':'"--"';const j=Z?.current_date?Z.current_date.replace(/.*,\s*/,""):"—",R=c.leader_first_name&&c.leader_last_name?c.leader_first_name+" "+c.leader_last_name+(c.leader_age?" ("+c.leader_age+")":""):"—";document.getElementById("id-rows").innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Established</span>
            <span class="id-row__value">${f(j)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Headquarters</span>
            <span class="id-row__value">${f(s||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Sector</span>
            <span class="id-row__value">${f(c.corp_sector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Specialization</span>
            <span class="id-row__value">${f(c.corp_subsector||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">CEO</span>
            <span class="id-row__value">${f(R)}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Company Type</span>
            <span class="id-row__value">${f(c.corp_company_type||"—")}</span>
        </div>
        <div class="id-row">
            <span class="id-row__label">Stock Ticker</span>
            <span class="id-row__value" style="color:var(--teal);letter-spacing:0.1em;">${f(M)}</span>
        </div>
    `;const W=c.last_rename_tick||0,N=Z?.current_tick||0,H=Math.max(0,W+120-N),q=!P||P==="-"||P==='"-"'||H<=0,O=document.getElementById("slogan-editor");O.innerHTML=`
        <div class="slogan-bar">
            <input type="text" id="slogan-input" placeholder="Enter a slogan..." maxlength="60" value="${f(P)}">
            <button id="slogan-save-btn" onclick="saveSlogan()" ${q?"":"disabled"}>Save</button>
        </div>
        <div class="slogan-hint" id="slogan-hint">${q?"60 characters max. 120 tick cooldown after change.":H+" ticks until you can change slogan."}</div>
    `;const T=document.getElementById("corp-logo-upload");T.innerHTML=`
        <div class="id-row">
            <span class="id-row__label">Logo</span>
            <label class="id-row__value" style="cursor:pointer;text-decoration:underline;" id="corp-logo-label">
                ${c.custom_logo_url?"Change Logo":"Upload Logo"}
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" id="corp-logo-file" style="display:none;">
            </label>
        </div>
    `,document.getElementById("corp-logo-file")?.addEventListener("change",ve),window._corpFactionId=c.id,window._currentTick=N,window._nationStats=o,window._factionData=c;const S=ne(o,s,c);re(s,c);const z=await It(o,s,c,Z);let I=0;if(c?.id){const{data:h,error:L}=await p.from("corp_equipment").select("equipment_key, owned").eq("faction_id",c.id);L||(I=Jt(h||[]))}let b=0;if(c?.id){const{data:h}=await p.from("corp_executives").select("salary_per_year").eq("faction_id",c.id).eq("status","active");b=(h||[]).reduce((L,g)=>L+(Number(g.salary_per_year)||0),0)}let _=0,Q=0;if(c?.id&&c.corp_sector==="Shipping"){const{data:h}=await p.from("corp_vessels").select("base_maintenance, purchase_price, condition, built_at_tick, status").eq("faction_id",c.id).neq("status","for_sale");_=(h||[]).reduce((L,g)=>L+(Number(g.base_maintenance)||0),0),Q=Zt(h,N)}await oe(o,Z,S,c,z.propertyMaintenance||0,I,b,z,_),await se(o,s,c,S,z,Q),Xt(c,o,Z),ct={nationId:c.nation_id},Ut(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}function ne(t,e,n){const a=b=>mt(t,b),i=(e||"UNKNOWN").toUpperCase(),r=Number(n?.corp_general_workforce??2250),l=Number(n?.corp_skilled_workforce??600),s=Number(n?.corp_innovative_workforce??150),o=r+l+s,d=2,m=3,u=6,k=a("minimum_wage"),M=k/100*48e3,P=a("inflation"),j=a("standard_of_living"),R=1+(P-50)/100*.5,W=1+(j-50)/100*.5,N=b=>Math.round(M*b*R*W),Y=N(d),H=N(m),$=N(u),q=r*Y,O=l*H,T=s*$,S=q+O+T;function z(b){return"$"+Math.round(b).toLocaleString()+"/yr"}const I=`${R.toFixed(2)} &times; ${W.toFixed(2)}`;return document.getElementById("wf-total-header").textContent=o.toLocaleString(),document.getElementById("wf-body").innerHTML=`
        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">General Workforce</span>
                    <span class="wf-tier__nation">${f(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--text-primary);">${r.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${d}.0 &times; ${I})</span>
                <span class="wf-tier__value">${z(Y)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${v(q)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Skilled Workforce</span>
                    <span class="wf-tier__nation">${f(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--blue);">${l.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${m}.0 &times; ${I})</span>
                <span class="wf-tier__value">${z(H)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${v(O)}</span>
            </div>
        </div>

        <div class="wf-tier">
            <div class="wf-tier__top">
                <div>
                    <span class="wf-tier__name">Innovative Workforce</span>
                    <span class="wf-tier__nation">${f(i)}</span>
                </div>
                <span class="wf-tier__count" style="color:var(--amber);">${s.toLocaleString()}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Wage (min &times; ${u}.0 &times; ${I})</span>
                <span class="wf-tier__value">${z($)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Total Annual Cost</span>
                <span class="wf-tier__value" style="color:var(--text-primary)">${v(T)}</span>
            </div>
        </div>

        <div class="wf-section" style="background:var(--bg-3);">
            <div class="wf-section__title" style="color:var(--text-dim);margin-bottom:2px;">Wage Inputs</div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Minimum Wage (${f(i)})</span>
                <span class="wf-tier__value">${k}/100 → ${z(M)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Inflation Modifier</span>
                <span class="wf-tier__value">&times;${R.toFixed(2)}</span>
            </div>
            <div class="wf-tier__detail">
                <span class="wf-tier__label">Std of Living Modifier</span>
                <span class="wf-tier__value">&times;${W.toFixed(2)}</span>
            </div>
        </div>

        <div class="wf-total">
            <div class="wf-total__row">
                <span class="wf-total__label">Total Workforce</span>
                <span class="wf-total__value" style="color:var(--text-bright);">${o.toLocaleString()}</span>
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
    `,{totalWages:S,generalTotal:q,skilledTotal:O,innovativeTotal:T,monthlyWages:Math.round(S/12)}}async function oe(t,e,n,a,i,r,l,s,o){const d=e?.current_tick||0;document.getElementById("fin-tick").textContent="TICK "+d;const m=87e6,u=y=>mt(t,y),k=1+(u("gdp_growth")-50)/100*.4,M=1+(u("urbanization")-50)/100*.3,P=1+(u("population_growth")-50)/100*.2,j=1+(u("standard_of_living")-50)/100*.15,R=1+(50-u("physical_infrastructure"))/100*.1,W=1-Math.max(0,u("inflation")-50)/100*.1,N=1-Math.max(0,u("interest_rates")-50)/100*.1,Y=k*M*P*j*R*W*N,H=Math.round(m*Y),$=(a.corp_general_workforce||0)+(a.corp_skilled_workforce||0)+(a.corp_innovative_workforce||0),q=Math.max(500,s?.totalCapacity||500),O=Math.min(1,$/q),T=s?.propertyRevBonus||0,S=Math.round(Math.round(H/12)*O)+T;let z=0,I=0,b=0;if(a?.id){const y=a.corp_sector||"";if(y==="Finance"){const{data:U}=await p.from("finance_active_loans").select("monthly_payment, interest_rate, remaining_principal, finance_loan_requests(request_type)").eq("lender_faction_id",a.id).in("status",["current","late","delinquent"]);for(const C of U||[]){const B=C.finance_loan_requests?.request_type||"loan";if(B==="insurance")I+=Number(C.monthly_payment||0);else if(B==="loan"){const F=Math.max(0,Number(C.remaining_principal||0)),V=C.interest_rate/100/12;I+=Math.round(F*V)}else B==="bond"&&(I+=Number(C.monthly_payment||0))}}else if(y==="Construction"){const{data:U}=await p.from("construction_contracts").select("id, budget_ceiling, timeline_ticks").eq("awarded_to_faction",a.id).eq("status","in_progress"),C=[];for(const B of U||[])I+=Math.round((B.budget_ceiling||0)/(B.timeline_ticks||1)),B.id&&C.push(B.id);if(C.length>0){const{data:B}=await p.from("contract_bids").select("contract_id, estimated_cost").in("contract_id",C).eq("status","won"),F={};for(const V of B||[])F[V.contract_id]=Number(V.estimated_cost||0);for(const V of U||[]){const _t=F[V.id]||0;b+=Math.round(_t/Math.max(1,V.timeline_ticks||1))}}}else if(y==="Shipping"){const{data:U}=await p.from("shipping_claims").select("revenue_per_transit").eq("faction_id",a.id).eq("status","active");for(const C of U||[])I+=Number(C.revenue_per_transit||0)}}let _=[],Q=0;try{const{data:y}=await p.from("corp_properties").select("id, nation_id, nations!nation_id(name)").eq("faction_id",a.id).eq("type","fuel_depot").eq("is_active",!0);if(y&&y.length>0){const U=y.map(C=>C.nation_id).filter(Boolean);if(U.length>0){const{data:C}=await p.from("shipping_claims").select("faction_id, shipping_routes!inner(destination_nation_id, status)").eq("status","active").in("shipping_routes.destination_nation_id",U),B=[...new Set((C||[]).map(K=>K.faction_id).filter(K=>K&&K!==a.id))],F=new Set;if(B.length>0){const{data:K}=await p.from("corp_properties").select("faction_id, nation_id").in("faction_id",B).in("nation_id",U).eq("type","fuel_depot").eq("is_active",!0);for(const nt of K||[])F.add(nt.faction_id+"|"+nt.nation_id)}const V={};for(const K of C||[]){const nt=K.shipping_routes?.destination_nation_id;nt&&K.faction_id!==a.id&&(F.has(K.faction_id+"|"+nt)||(V[nt]=(V[nt]||0)+1))}const _t=7500;for(const K of y){const nt=V[K.nation_id]||0,Nt=nt*_t;_.push({nation:K.nations?.name||"Unknown",revenue:Nt,visitors:nt}),Q+=Nt}_.sort((K,nt)=>nt.revenue-K.revenue)}}}catch(y){console.warn("Fuel depot revenue estimate failed (non-fatal):",y?.message||y)}const h=z+I+S+Q,L=n?.totalWages||0,g=Math.round(L/12),tt=0,X=i||0,G=r||0,dt=Number(a?.corp_loans)||0,pt=.05,ft=dt>0?Math.round(dt*(pt/12)/(1-Math.pow(1+pt/12,-120))):0;let E=0,x=0;if(a?.id)try{const{data:y}=await p.from("finance_active_loans").select("monthly_payment, finance_loan_requests(request_type)").eq("borrower_faction_id",a.id).in("status",["current","late","delinquent"]);for(const U of y||[]){const C=U.finance_loan_requests?.request_type||"loan",B=Number(U.monthly_payment||0);if(!(B<=0))if(C==="insurance")x+=B;else{if(C==="bond")continue;E+=B}}}catch(y){console.warn("[Finances] borrower finance_active_loans lookup failed:",y)}const it=Math.round((l||0)/12),et=o||0,rt=75e3,J=Math.max(0,Math.min(1,Number(t?.corporate_tax??0)/100||0)),w=g+it+tt+X+G+et+ft+E+x+b+rt,A=Math.max(0,h-w),D=Math.round(A*J);let st="";try{const y=new Set([a.nation_id]),{data:U}=await p.from("corp_properties").select("nation_id").eq("faction_id",a.id).eq("is_active",!0);if((U||[]).forEach(C=>{C.nation_id&&y.add(C.nation_id)}),y.size>0){const{data:C}=await p.from("nations").select("id, name, corporate_tax").in("id",[...y]);C&&C.length>0&&(st=C.sort((B,F)=>(B.name||"").localeCompare(F.name||"")).map(B=>{const F=Math.round(Number(B.corporate_tax??0)),V=Math.round(A*(F/100)/C.length),_t=F>25?"#c55":F>15?"#ca5":"#5c5";return`<div style="display:flex;justify-content:space-between;padding:1px 0;font-family:var(--font-mono);font-size:8px;">
                        <span style="color:var(--text-dim);">${B.name} (<span style="color:${_t}">${F}%</span>)</span>
                        <span style="color:#a44;">${v(V)}</span>
                    </div>`}).join(""))}}catch{}const yt=w+D,ot=h-yt,at=Number(a?.corp_cash_reserves??0),Wt=dt;le(h,ot);const Gt=[{stat:"gdp_growth",value:u("gdp_growth"),weight:"0.4"},{stat:"urbanization",value:u("urbanization"),weight:"0.3"},{stat:"population_growth",value:u("population_growth"),weight:"0.2"},{stat:"standard_of_living",value:u("standard_of_living"),weight:"0.15"},{stat:"physical_infra",value:u("physical_infrastructure"),weight:"0.1",note:"INV"},{stat:"inflation",value:u("inflation"),weight:"-0.1",neg:!0},{stat:"interest_rates",value:u("interest_rates"),weight:"-0.1",neg:!0}];function Vt(y){return y.neg?y.value>50?"var(--red)":"var(--green)":y.note?y.value<50?"var(--green)":"var(--red)":y.value>=50?"var(--green)":y.value>=35?"var(--amber)":"var(--red)"}const $t=h||1,Kt=(z/$t*100).toFixed(1),Yt=((I+Q)/$t*100).toFixed(1),Qt=(S/$t*100).toFixed(1);document.getElementById("fin-body").innerHTML=`
        <!-- Revenue -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--green);">Revenue</div>
            <div class="seg-bar">
                <div class="seg-bar__seg" style="width:${Kt}%;background:var(--teal);"></div>
                <div class="seg-bar__seg" style="width:${Yt}%;background:var(--amber);"></div>
                <div class="seg-bar__seg" style="width:${Qt}%;background:var(--text-dim);"></div>
            </div>
            <div class="seg-legend">
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--teal)"></div><span class="seg-legend__label">Gov</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--amber)"></div><span class="seg-legend__label">Private</span></div>
                <div class="seg-legend__item"><div class="seg-legend__dot" style="background:var(--text-dim)"></div><span class="seg-legend__label">Market</span></div>
            </div>
            <div class="fin-row"><span class="fin-row__label">Government Contracts</span><span class="fin-row__value" style="color:var(--green)">${v(z)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Private Contracts</span><span class="fin-row__value" style="color:var(--green)">${v(I)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Market Revenue<span class="fin-row__badge">DERIVED</span></span><span class="fin-row__value" style="color:var(--green)">${v(S-T)}</span></div>
            ${T>0?`<div class="fin-row"><span class="fin-row__label">Property Revenue<span class="fin-row__badge">BUILDINGS</span></span><span class="fin-row__value" style="color:var(--green)">${v(T)}</span></div>`:""}
            ${_.map(y=>`<div class="fin-row"><span class="fin-row__label">Fuel Depot (${y.nation})<span class="fin-row__badge">${y.visitors} visitor${y.visitors!==1?"s":""}</span></span><span class="fin-row__value" style="color:var(--green)">${v(y.revenue)}</span></div>`).join("")}
            <div class="fin-total">
                <span class="fin-total__label">Total Revenue</span>
                <span class="fin-total__value" style="color:var(--green)">${v(h)}</span>
            </div>
        </div>
        <!-- Expenses -->
        <div class="fin-section">
            <div class="fin-section__title" style="color:var(--red);">Expenses</div>
            <div class="fin-row"><span class="fin-row__label">Workforce Wages</span><span class="fin-row__value" style="color:#a44">${v(g)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Executive Compensation</span><span class="fin-row__value" style="color:#a44">${v(it)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Materials & Supplies</span><span class="fin-row__value" style="color:#a44">${v(tt)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Properties</span><span class="fin-row__value" style="color:#a44">${v(X)}</span></div>
            <div class="fin-row"><span class="fin-row__label">Equipment</span><span class="fin-row__value" style="color:#a44">${v(G)}</span></div>
            ${et>0?`<div class="fin-row"><span class="fin-row__label">Fleet Maintenance</span><span class="fin-row__value" style="color:#a44">${v(et)}</span></div>`:""}
            ${b>0?`<div class="fin-row"><span class="fin-row__label">Project Build Costs</span><span class="fin-row__value" style="color:#a44">${v(b)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Debt Service</span><span class="fin-row__value" style="color:#a44">${v(ft)}</span></div>
            ${E>0?`<div class="fin-row"><span class="fin-row__label">Loan Repayments</span><span class="fin-row__value" style="color:#a44">${v(E)}</span></div>`:""}
            ${x>0?`<div class="fin-row"><span class="fin-row__label">Insurance Premiums</span><span class="fin-row__value" style="color:#a44">${v(x)}</span></div>`:""}
            <div class="fin-row"><span class="fin-row__label">Taxes</span><span class="fin-row__value" style="color:#a44">${v(D)}</span></div>
            ${st?`<div style="padding:2px 12px 6px 20px;border-bottom:1px solid var(--border-hair);">${st}</div>`:""}
            <div class="fin-total">
                <span class="fin-total__label">Total Expenses</span>
                <span class="fin-total__value" style="color:var(--red)">${v(yt)}</span>
            </div>
        </div>
        <!-- Net Profit -->
        <div class="fin-net" style="background:${ot>=0?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)"}">
            <span class="fin-net__label">Net Profit</span>
            <span class="fin-net__value" style="color:${ot>=0?"var(--green)":"var(--red)"}">${v(ot)}</span>
        </div>
        <!-- Cash & Debt -->
        <div class="fin-cash-debt">
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Cash</div>
                <div class="fin-cash-debt__value" style="color:var(--text-bright)">${v(at)}</div>
            </div>
            <div class="fin-cash-debt__cell">
                <div class="fin-cash-debt__label">Debt</div>
                <div class="fin-cash-debt__value" style="color:var(--amber)">${v(Wt)}</div>
            </div>
        </div>
        <!-- Purchasing Power -->
        ${(()=>{const y=Number(t?.currency_strength??50),U=Number(t?.inflation??0),C=y/50,B=Math.max(.5,1-U/200),F=Math.round(at*C*B),V=F>=at?"var(--green)":F>=at*.8?"var(--amber)":"var(--red)",_t=at>0?Math.round(F/at*100):100;return`<div style="padding:4px 14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-hair);">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;text-transform:uppercase;">Purchasing Power</div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${V};">${v(F)}</span>
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${_t}% · CUR ${y} · INF ${Math.round(U)}</span>
                </div>
            </div>`})()}
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
            ${Gt.map(y=>`
                <div class="drv-row">
                    <span class="drv-row__name">${y.stat}</span>
                    <div class="drv-row__bar"><div class="drv-row__bar-fill" style="width:${y.value}%;background:${Vt(y)}"></div></div>
                    <span class="drv-row__val">${y.value}</span>
                    <span class="drv-row__wt">&times;${y.weight}</span>
                    ${y.note?'<span class="drv-row__note">'+y.note+"</span>":""}
                </div>
            `).join("")}
            <div class="drv-multiplier">
                <span class="drv-multiplier__label">EFFECTIVE MULTIPLIER</span>
                <span class="drv-multiplier__value">&times;${Y.toFixed(2)}</span>
            </div>
        </div>
    `,Tt()}let kt=!1;async function ae(t,e){if(!(!c||kt)){kt=!0;try{const{data:n,error:a}=await p.from("finance_loan_offers").select("*").eq("id",t).single();if(a||!n)return;const{data:i,error:r}=await p.from("finance_loan_requests").select("*").eq("id",e).single();if(r||!i||i.status!=="open")return;const l=n.interest_rate/100/12,s=i.term_months,o=l>0?Math.round(i.amount*l/(1-Math.pow(1+l,-s))):Math.round(i.amount/s),d=Z?.current_tick||0,{error:m}=await p.from("finance_loan_requests").update({status:"funded",accepted_offer_id:t,funded_tick:d}).eq("id",e);if(m)return;await p.from("finance_loan_offers").update({status:"accepted"}).eq("id",t),await p.from("finance_loan_offers").update({status:"declined"}).eq("request_id",e).neq("id",t).eq("status","pending"),await p.from("finance_active_loans").insert({request_id:e,offer_id:t,borrower_faction_id:i.requesting_faction_id,lender_faction_id:n.offering_faction_id,nation_id:i.nation_id,principal:i.amount,interest_rate:n.interest_rate,term_months:i.term_months,collateral_type:n.collateral_type,purpose:i.purpose,monthly_payment:o,started_tick:d});const{data:u}=await p.from("factions").select("corp_cash_reserves").eq("id",n.offering_faction_id).single();u&&await p.from("factions").update({corp_cash_reserves:Math.max(0,(Number(u.corp_cash_reserves)||0)-i.amount)}).eq("id",n.offering_faction_id);const{data:k}=await p.from("factions").select("corp_cash_reserves, corp_debt").eq("id",i.requesting_faction_id).single();if(k){const{error:M}=await p.from("factions").update({corp_cash_reserves:(Number(k.corp_cash_reserves)||0)+i.amount,corp_debt:(Number(k.corp_debt)||0)+i.amount}).eq("id",i.requesting_faction_id);M&&console.error("[Loans] Failed to credit borrower + track debt:",M.message)}}finally{kt=!1}Tt()}}async function ie(t){await p.from("finance_loan_requests").update({status:"cancelled"}).eq("id",t),Tt()}async function Tt(){if(!c)return;const t=document.getElementById("fin-loans-list");if(t)try{const{data:e,error:n}=await p.from("finance_loan_requests").select("*, finance_loan_offers!request_id(*)").eq("requesting_faction_id",c.id).in("status",["open","funded"]).order("created_tick",{ascending:!1});n&&console.error("[Loans] Request query error:",n.message);const{data:a,error:i}=await p.from("finance_active_loans").select("*").eq("borrower_faction_id",c.id).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!1});i&&console.error("[Loans] Active loans query error:",i.message);let r="";if(e&&e.length>0){for(const l of e)if(l.status==="open"){const s=(l.finance_loan_offers||[]).filter(o=>o.status==="pending");if(r+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span style="color:#5a8aaa;font-weight:700;">OPEN</span>
                            <span style="color:var(--text-primary);margin-left:4px;">${v(l.amount)}</span>
                            <span style="color:var(--text-dim);margin-left:4px;">${l.term_months}mo</span>
                        </div>
                        <span style="color:var(--text-dim);cursor:pointer;" onclick="cancelRequest('${l.id}')">&#10005;</span>
                    </div>
                    <div style="font-size:7px;color:var(--text-dim);margin-top:2px;">${f(l.purpose||"")}</div>`,s.length>0){r+=`<div style="margin-top:4px;font-size:7px;color:#5a8aaa;font-weight:700;">${s.length} OFFER${s.length>1?"S":""}</div>`;for(const o of s.sort((d,m)=>d.interest_rate-m.interest_rate))r+=`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--border-hair);">
                            <span style="color:var(--text-primary);font-weight:700;">${o.interest_rate}%</span>
                            <span style="color:var(--text-dim);">${o.collateral_type}</span>
                            <span style="flex:1;"></span>
                            <span style="padding:2px 8px;cursor:pointer;color:#000;background:#5a8aaa;font-weight:700;font-size:7px;" onclick="acceptOffer('${o.id}','${l.id}')">ACCEPT</span>
                        </div>`}else r+='<div style="margin-top:2px;font-size:7px;color:var(--text-dim);">Awaiting offers from finance corporations...</div>';r+="</div>"}}if(a&&a.length>0)for(const l of a){const s=l.status==="current"?"var(--green)":l.status==="late"?"#c84":"#c55",o=l.term_months>0?Math.round(l.payments_made/l.term_months*100):0;r+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="color:${s};font-weight:700;">${l.status.toUpperCase()}</span>
                        <span style="color:var(--text-primary);margin-left:4px;">${v(l.principal)}</span>
                        <span style="color:var(--text-dim);margin-left:4px;">@ ${l.interest_rate}%</span>
                    </div>
                    <span style="color:var(--text-dim);">${o}% repaid</span>
                </div>
                <div style="height:2px;background:var(--border-0);margin-top:3px;">
                    <div style="height:100%;width:${o}%;background:${s};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:7px;color:var(--text-dim);">
                    <span>Payment: ${v(l.monthly_payment)}/mo</span>
                    <span>${l.payments_made}/${l.term_months} payments</span>
                </div>
            </div>`}r||(r='<div style="color:var(--text-dim);">No active loans.</div>'),t.innerHTML=r}catch(e){console.error("[Loans] loadLoansSection error:",e)}}window.acceptOffer=ae;window.cancelRequest=ie;function re(t,e){const n=(t||"").toUpperCase(),a=Number(e.corp_general_workforce??0)+Number(e.corp_skilled_workforce??0)+Number(e.corp_innovative_workforce??0),i=[{label:"Reputation",value:Number(e.corp_reputation??65),change:0,decay:!0,max:100,isHero:!0},{label:"Workforce Size",value:a||3e3,change:0,section:"Core"},{label:"Workforce Skill",value:Number(e.corp_workforce_skill??50),change:0,decay:!0,max:100},{label:"Operational Efficiency",value:Number(e.corp_operational_efficiency??50),change:0,decay:!0,max:100},{label:"Market Share",value:Number(e.corp_market_share??5),change:0,nation:n,max:100,section:"Market & Financials"},{label:"Credit Rating",value:Number(e.corp_credit_rating??50),change:0,max:100},{label:"Regulatory Standing",value:Number(e.corp_regulatory_standing??50),change:0,nation:n,max:100,section:"Political Standing"},{label:"Political Influence",value:Number(e.corp_political_influence??10),change:0,decay:!0,nation:n,max:100},{label:"Innovation",value:Number(e.corp_innovation??20),change:0,decay:!0,max:100,section:"Innovation"}];function r(o,d){if(!d||d>100)return"var(--text-primary)";const m=o/d*100;return m>=70?"var(--green)":m>=40?"var(--amber)":m>=20?"var(--orange, #d48a3c)":"var(--red)"}function l(o){const d=parseFloat(o),m=d>0?"var(--green)":d<0?"var(--red)":"var(--text-dim)",u=d>0?"▲":d<0?"▼":"–";return`<div class="stat-item__change">
            <span class="stat-item__dir" style="color:${m}">${u}</span>
            <span class="stat-item__delta" style="color:${m}">${Math.abs(d).toFixed(1)}</span>
        </div>`}let s="";for(const o of i){if(o.isHero){s+=`
                <div class="stats-hero">
                    <div class="stats-hero__top">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span class="stats-hero__name">${o.label}</span>
                            ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                        </div>
                        <div class="stats-hero__right">
                            <span class="stats-hero__val">${Math.round(o.value)}</span>
                            <span class="stats-hero__max">/100</span>
                            ${l(o.change)}
                        </div>
                    </div>
                    <div class="stats-hero__bar"><div class="stats-hero__bar-fill" style="width:${Math.min(100,o.value)}%"></div></div>
                </div>`;continue}o.section&&(s+=`<div class="stats-section"><span class="stats-section__label">${o.section}</span></div>`);const d=o.max&&o.max<=100;s+=`
            <div class="stat-item">
                <div class="stat-item__left">
                    <div class="stat-item__name-row">
                        <span class="stat-item__name">${o.label}</span>
                        ${o.decay?'<span class="stat-item__decay">DECAYS</span>':""}
                    </div>
                    ${o.nation?'<span class="stat-item__nation">'+f(o.nation)+"</span>":""}
                </div>
                <div class="stat-item__right">
                    <span class="stat-item__val" style="color:${d?r(o.value,o.max):"var(--text-primary)"}">${typeof o.value=="number"?d?Math.round(o.value):o.value.toLocaleString():o.value}</span>
                    ${d?'<span class="stat-item__max">/100</span>':""}
                    ${l(o.change)}
                </div>
            </div>`}document.getElementById("stats-body").innerHTML=s}async function It(t,e,n,a){const i=(e||"UNKNOWN").toUpperCase();let r=[];if(n?.id){const{data:b}=await p.from("corp_properties").select("*").eq("faction_id",n.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});r=b||[]}const l={Basic:{color:"#6a6660"},Modern:{color:"#8b9a6b"},Sustainable:{color:"#5c5"},Innovative:{color:"#c8a832"},Heritage:{color:"#c84"},Premium:{color:"#ca5"}};let s=0,o=0;const d=Number(n?.corp_general_workforce??0)+Number(n?.corp_skilled_workforce??0)+Number(n?.corp_innovative_workforce??0),m=500,u=r.map(b=>{const _=Number(b.capacity||0),Q=Number(b.condition||0)/100;return Math.floor(_*Q)}),k=m+u.reduce((b,_)=>b+_,0),M=k>0?Math.min(d,Math.round(d*(m/k))):d,P=5e7,j=1+(mt(t,"inflation")-50)/100*.3,R=.8+mt(t,"stability")/100*.4,W=Math.round(P*j*R),N=Math.round(W*.005);s+=W,o+=N;let Y=`
    <div class="prop-asset" style="margin-bottom:6px;">
        <div class="prop-asset__top">
            <div>
                <div class="prop-asset__name">National Headquarters</div>
                <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${f(i)} · Headquarters</div>
            </div>
            <span class="prop-asset__badge">HQ</span>
        </div>
        <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${m}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${M.toLocaleString()}</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">VALUE</div>
                <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(W)}</div>
            </div>
            <div style="flex:1;padding:3px 6px;">
                <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${v(N)}</div>
            </div>
        </div>
    </div>`,H=M;for(let b=0;b<r.length;b++){const _=r[b],Q=l[_.style]||l.Basic;s+=Number(_.purchase_price||0),o+=Number(_.monthly_maintenance||0);const h=_.condition>=75?"var(--green)":_.condition>=50?"var(--amber)":"var(--orange)",L=Number(_.capacity||0),g=u[b]||0,tt=k>0?Math.min(d-H,Math.round(d*(g/k))):0;H+=tt,Y+=`
        <div class="prop-asset" style="margin-bottom:6px;">
            <div class="prop-asset__top">
                <div>
                    <div class="prop-asset__name">${f(_.name)}</div>
                    <div style="font-size:9px;color:var(--text-dim);margin-top:1px;">${f(_.city||i)} · ${(_.type||"").replace(/_/g," ")} · <span style="color:${Q.color}">${(_.style||"Basic").toUpperCase()}</span></div>
                </div>
                <span class="prop-asset__badge" ${["branch_office","trading_floor","claims_office"].includes(_.type)?'style="background:rgba(138,106,170,0.12);color:#8a6aaa;border-color:rgba(138,106,170,0.3);"':""}>${["branch_office","trading_floor","claims_office"].includes(_.type)?_.type.replace(/_/g," ").replace(/\b\w/g,X=>X.toUpperCase()):"OWNED"}</span>
            </div>
            <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:4px 0;">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${L.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKFORCE</div>
                    <div style="font-size:10px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${tt.toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">PAID</div>
                    <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(_.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px;">
                    <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MAINT/MO</div>
                    <div style="font-size:10px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${v(_.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">CONDITION</span>
                <span style="color:${h}">${_.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:var(--bg-2);margin-top:2px;"><div style="width:${_.condition}%;height:100%;background:${h};"></div></div>
            ${_.refurbish_until_tick&&_.refurbish_until_tick>(a?.current_tick||0)?`<div style="margin-top:4px;padding:3px 6px;background:var(--amber-faint, rgba(176,154,91,0.08));border:1px solid var(--amber-border, rgba(176,154,91,0.2));font-size:8px;font-family:var(--font-mono);color:var(--amber, #b09a5b);text-align:center;">REFURBISHING — ${_.refurbish_until_tick-(a?.current_tick||0)} tick${_.refurbish_until_tick-(a?.current_tick||0)!==1?"s":""} remaining</div>`:`<div style="display:flex;gap:4px;margin-top:4px;">
                <button class="prop-action-btn prop-action-btn--sell" onclick="showSellModal('${_.id}','${f(_.name).replace(/'/g,"\\'")}',${_.purchase_price||0},${_.condition})">SELL</button>
                <button class="prop-action-btn prop-action-btn--refurbish" onclick="showRefurbishModal('${_.id}','${f(_.name).replace(/'/g,"\\'")}',${_.condition},${L})">REFURBISH</button>
                ${n?.corp_sector==="Finance"&&(_.type==="office"||_.type==="regional_hq")&&!["branch_office","trading_floor","claims_office"].includes(_.type)?`<button class="prop-action-btn" style="background:rgba(138,106,170,0.08);border-color:rgba(138,106,170,0.2);color:#8a6aaa;" onclick="showConvertModal('${_.id}','${f(_.name).replace(/'/g,"\\'")}',${_.purchase_price||0})">CONVERT</button>`:""}
            </div>`}
        </div>`}let $="",q=[];if(n?.id){const{data:b}=await p.from("construction_contracts").select("*, contract_bids(id, faction_id, bid_price, estimated_quality, estimated_cost, labor_count, markup_pct, material_grades, submitted_at_tick, status, factions!faction_id(faction_name, abbreviation, corp_reputation))").eq("issuer_faction_id",n.id).in("status",["open","bidding","awarded","in_progress"]).order("generated_at_tick",{ascending:!1});q=b||[];let _={};const Q=q.filter(h=>h.status==="in_progress").map(h=>h.id);if(Q.length>0){const{data:h}=await p.from("construction_events").select("contract_id, status, severity, title").in("contract_id",Q).eq("status","ACTIVE");for(const L of h||[])_[L.contract_id]||(_[L.contract_id]=[]),_[L.contract_id].push(L)}if(q.length>0){const h={open:{label:"OPEN",color:"#5a8aaa"},bidding:{label:"BIDDING",color:"#c8a832"},awarded:{label:"AWARDED",color:"#8b9a6b"},in_progress:{label:"IN PROGRESS",color:"#5aaa8b"}},L={LOW:"#ca5",MODERATE:"#c84",HIGH:"#c55",CRITICAL:"#f44"};$=`<div class="cp-section">
                <div class="cp-section__header">
                    <span class="cp-section__title">Construction Projects</span>
                    <span class="cp-section__count">${q.length} ACTIVE</span>
                </div>`;for(const g of q){const tt=h[g.status]||h.open,X=(g.contract_bids||[]).filter(E=>E.status==="pending"),G=(g.contract_bids||[]).find(E=>E.status==="won"),dt=a?.current_tick||0,pt=_[g.id]||[],ft=g.nation_id===n.nation_id?i:"";if($+=`<div class="cp-item">
                    <div class="cp-item__top">
                        <div>
                            <div class="cp-item__name">${f(g.name)}</div>
                            <div class="cp-item__sub">${f(g.project_code||"")} · ${f(g.sector||"")}${ft?" · "+f(ft):""}</div>
                        </div>
                        <span class="cp-badge" style="color:${tt.color};border-color:${tt.color}40;background:${tt.color}08;">${tt.label}</span>
                    </div>
                    <div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-hair);margin:2px 0;">
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BUDGET</div>
                            <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(g.budget_ceiling||0)}</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-hair);">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">TIMELINE</div>
                            <div style="font-size:10px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${g.timeline_ticks||"?"} ticks</div>
                        </div>
                        <div style="flex:1;padding:3px 6px;">
                            <div style="font-size:7px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDS</div>
                            <div style="font-size:10px;font-weight:700;color:${X.length>0?"var(--amber)":"var(--text-dim)"};font-family:var(--font-mono);">${(g.contract_bids||[]).length}</div>
                        </div>
                    </div>`,(g.status==="awarded"||g.status==="in_progress")&&G){const E=Number(G.factions?.corp_reputation??50),x=E>=70?"#5c5":E>=40?"#ca5":"#c55",it=G.estimated_quality>=75?"#5c5":G.estimated_quality>=50?"#ca5":"#c55";if($+=`<div style="margin-top:6px;padding:6px 8px;background:var(--bg-3);border:1px solid var(--border-hair);">
                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.8px;margin-bottom:3px;">CONTRACTOR</div>
                        <div style="font-size:10px;font-weight:600;color:var(--text-bright);margin-bottom:4px;">${f(G.factions?.faction_name||"Unknown")}</div>
                        <div style="display:flex;gap:0;">
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID</div>
                                <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(G.bid_price)}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                <div style="font-size:9px;font-weight:700;color:${it};font-family:var(--font-mono);">${G.estimated_quality}/100</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${G.labor_count}</div>
                            </div>
                            <div style="flex:1;padding:2px 4px;">
                                <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                <div style="font-size:9px;font-weight:700;color:${x};font-family:var(--font-mono);">${E}/100</div>
                            </div>
                        </div>`,g.status==="in_progress"&&g.awarded_at_tick!=null){const et=dt-g.awarded_at_tick,rt=g.timeline_ticks||1,J=g.stalled_ticks||0,w=Math.min(100,Math.round(et/(rt+J)*100)),A=w>=75?"#5c5":w>=40?"#ca5":"#5aaa8b",D=Math.max(0,rt+J-et);$+=`<div style="display:flex;justify-content:space-between;font-size:8px;font-family:var(--font-mono);margin-top:6px;">
                            <span style="color:var(--text-dim);">PROGRESS</span>
                            <span style="color:${A};">${w}%${J>0?" · "+J+" stalled":""} · ${D} tick${D!==1?"s":""} left</span>
                        </div>
                        <div class="cp-progress"><div class="cp-progress__bar" style="width:${w}%;background:${A};"></div></div>`}else $+='<div style="font-size:8px;font-family:var(--font-mono);color:var(--amber);margin-top:6px;text-align:center;">Awarded — construction begins next tick</div>';$+="</div>"}if(pt.length>0)for(const E of pt){const x=L[E.severity]||"#ca5";$+=`<div style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:3px 6px;background:${x}08;border:1px solid ${x}20;">
                            <span class="cp-badge" style="color:${x};border-color:${x}40;background:${x}12;">${E.severity}</span>
                            <span style="font-size:8px;font-family:var(--font-mono);color:${x};">${f(E.title)}</span>
                        </div>`}if((g.status==="open"||g.status==="bidding")&&X.length>0)for(let E=0;E<X.length;E++){const x=X[E],it=g.id.slice(0,8)+"-"+E,et=Number(x.factions?.corp_reputation??50),rt=et>=70?"#5c5":et>=40?"#ca5":"#c55",J=x.estimated_quality>=75?"#5c5":x.estimated_quality>=50?"#ca5":"#c55",w=x.markup_pct<=10?"#5c5":x.markup_pct<=20?"#ca5":"#c55",A=x.material_grades||{},D=Object.entries(A),st=ot=>ot.replace(/_/g," ").replace(/\b\w/g,at=>at.toUpperCase()),yt=ot=>ot==="HIGH"?"#5c5":ot==="LOW"?"#c55":"var(--text-muted)";$+=`<div class="cp-bid" style="flex-direction:column;gap:0;padding:0;cursor:pointer;" onclick="cpToggleBid('${it}')">
                            <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
                                <span style="flex:1;font-size:8px;font-family:var(--font-mono);color:var(--text-muted);">
                                    ${f(x.factions?.faction_name||"Unknown")}
                                    · <span style="color:var(--gold);">${v(x.bid_price)}</span>
                                    · Q: <span style="color:${J};">${x.estimated_quality}</span>
                                </span>
                                <span class="cp-bid__btn" style="color:#5c5;border-color:#5c540;background:#5c508;" onclick="event.stopPropagation();cpAcceptBid('${g.id}','${x.id}','${f((x.factions?.faction_name||"").replace(/'/g,""))}',${x.bid_price},${x.estimated_quality},${x.labor_count},'${x.faction_id}')">ACCEPT</span>
                            </div>
                            <div id="cp-bid-${it}" style="display:none;padding:4px 8px 6px;border-top:1px solid var(--border-hair);background: var(--border-hair);">
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BID PRICE</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${v(x.bid_price)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">EST. COST</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${v(x.estimated_cost||0)}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">MARKUP</div>
                                        <div style="font-size:9px;font-weight:700;color:${w};font-family:var(--font-mono);">${x.markup_pct}%</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">QUALITY</div>
                                        <div style="font-size:9px;font-weight:700;color:${J};font-family:var(--font-mono);">${x.estimated_quality}/100</div>
                                    </div>
                                </div>
                                <div style="display:flex;gap:0;margin-bottom:4px;">
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">WORKERS</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${x.labor_count}</div>
                                    </div>
                                    <div style="flex:1;padding:2px 4px;border-right:1px solid var(--border-hair);">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">REPUTATION</div>
                                        <div style="font-size:9px;font-weight:700;color:${rt};font-family:var(--font-mono);">${et}/100</div>
                                    </div>
                                    <div style="flex:2;padding:2px 4px;">
                                        <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;">BIDDER</div>
                                        <div style="font-size:9px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);">${f(x.factions?.faction_name||"Unknown")}</div>
                                    </div>
                                </div>
                                ${D.length>0?`<div style="padding:2px 4px;">
                                    <div style="font-size:6px;color:var(--text-dim);font-family:var(--font-mono);letter-spacing:0.5px;margin-bottom:2px;">MATERIAL GRADES</div>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        ${D.map(([ot,at])=>`<span style="font-size:7px;font-family:var(--font-mono);color:${yt(at)};">${st(ot)}: ${at}</span>`).join("")}
                                    </div>
                                </div>`:""}
                            </div>
                        </div>`}if((g.status==="open"||g.status==="bidding")&&X.length===0){const E=(g.bidding_ends_tick||0)-(a?.current_tick||0);$+=`<div style="font-size:8px;font-family:var(--font-mono);color:var(--text-dim);margin-top:4px;text-align:center;">
                        Awaiting bids${E>0?" · "+E+" tick"+(E!==1?"s":"")+" remaining":""}
                    </div>`}$+="</div>"}$+="</div>"}}const O=document.getElementById("prop-count"),T=r.length+1,S=q.length,z=T+" ASSET"+(T!==1?"S":"")+(S>0?" · "+S+" PROJECT"+(S!==1?"S":""):"");O&&(O.textContent=z),document.getElementById("prop-body").innerHTML=`
        ${Y}
        ${$}
        <div style="flex:1;"></div>
        <div class="prop-total">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span class="prop-total__label">Total Value</span>
                <span class="prop-total__value">${v(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span class="prop-total__label">Total Maintenance</span>
                <span style="font-size:12px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${v(o)}/mo</span>
            </div>
        </div>
    `;let I=0;I+=Math.round(m*50);for(const b of r){if(b.refurbish_until_tick&&(a?.current_tick||0)<b.refurbish_until_tick)continue;const _=Number(b.condition||0)/100;_>=.6&&(I+=Math.round(Number(b.capacity||0)*_*50))}return{propertyValue:s,propertyMaintenance:o,totalCapacity:k,propertyRevBonus:I}}async function se(t,e,n,a,i,r=0){(e||"UNKNOWN").toUpperCase();const l=n.corp_company_type||"Private",s=Number(n.corp_cash_reserves)||0,o=i?.propertyValue||0;let d=0;if(n?.id&&n.corp_sector==="Finance")try{const{data:q}=await p.from("finance_active_loans").select("remaining_principal, finance_loan_requests(request_type)").eq("lender_faction_id",n.id).in("status",["current","late","delinquent"]);for(const O of q||[]){const T=O.finance_loan_requests?.request_type||"loan";if(T==="loan"||T==="bond"){const S=Math.max(0,Number(O.remaining_principal||0));d+=S}}}catch(q){console.warn("[Valuation] finance_active_loans lookup failed:",q)}const m=s+o+r+d,u=Number(n.corp_loans)||0,M=a?.monthlyWages||0,P=0,j=u+M+P,R=m-j,N=Math.round(R*(1+.3)),Y=N-R,H=Y>0;document.getElementById("val-type-badge").textContent=l.toUpperCase();function $(q,O,T={}){const S=T.indent?"val-line val-line--indent":"val-line",z=T.bold?"val-line__label val-line__label--bold":"val-line__label",I=T.bold?"val-line__value val-line__value--bold":"val-line__value",b=T.color||(T.bold?"var(--text-bright)":"var(--text-muted)");return`<div class="${S}"><span class="${z}">${q}</span><span class="${I}" style="color:${b}">${v(O)}</span></div>`}document.getElementById("val-body").innerHTML=`
        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--green);">Assets</span></div>
        ${$("Cash & Reserves",s,{indent:!0})}
        ${$("Property",o,{indent:!0})}
        ${$("Equipment",r,{indent:!0})}
        ${$("Active Contracts",d,{indent:!0})}
        ${$("Total Assets",m,{bold:!0,color:"var(--green)"})}

        <div class="val-section-hdr"><span class="val-section-hdr__label" style="color:var(--red);">Liabilities</span></div>
        ${$("Outstanding Loans",u,{indent:!0})}
        ${$("Accounts Payable",M,{indent:!0})}
        ${$("Pending Project Costs",P,{indent:!0})}
        ${$("Total Liabilities",j,{bold:!0,color:"var(--red)"})}

        <div class="val-net">
            <span class="val-net__label">Net Worth</span>
            <span class="val-net__value" style="color:${R>=0?"var(--green)":"var(--red)"};">${v(R)}</span>
        </div>

        <div style="flex:1;"></div>

        <div class="val-market">
            <div class="val-market__top">
                <span class="val-market__label">Market Valuation</span>
                <span class="val-market__value">${v(N)}</span>
            </div>
            <div class="val-market__gap">
                <span class="val-market__gap-label">${H?"ABOVE":"BELOW"} NET WORTH</span>
                <span class="val-market__gap-value" style="color:${H?"var(--green)":"var(--red)"};">${H?"+":""}${v(Y)}</span>
            </div>
            <div class="val-market__note">${H?"Market believes in future growth.":"Market doubts current trajectory."}</div>
        </div>
    `,ce({faction:n,nationName:e,cashReserves:s,propertyValue:o,equipmentValue:r,outstandingLoans:u,accountsPayable:M,totalLiabilities:j,netWorth:R,currentTickDate:t?._h2_close_label})}function le(t,e){const n=document.getElementById("h2-kpi-rev"),a=document.getElementById("h2-kpi-rev-d");if(!n)return;const i=vt(t);if(n.innerHTML=`${i.main}<small>${i.unit}</small>`,a){const r=vt(Math.abs(e)),l=e>=0?"+":"−",s=e>=0?"up":"down";a.className="delta "+s,a.textContent=`${l}${r.main}${r.unit} net`}}function ce({faction:t,nationName:e,cashReserves:n,propertyValue:a,equipmentValue:i,outstandingLoans:r,accountsPayable:l,totalLiabilities:s,netWorth:o}){if(!document.getElementById("h2-kpi-cash"))return;const d=vt(n);document.getElementById("h2-kpi-cash").innerHTML=`${d.main}<small>${d.unit}</small>`;const m=document.getElementById("h2-kpi-cash-d");m&&(m.textContent=s>0?`Liab. ${vt(s).main}${vt(s).unit}`:"No liabilities");const u=vt(o);document.getElementById("h2-kpi-nw").innerHTML=`${u.main}<small>${u.unit}</small>`;const k=document.getElementById("h2-kpi-nw-d");if(k){const b=o>=0?"up":"down";k.className="delta "+b,k.textContent=o>=0?"positive equity":"negative equity"}const M=Number(t.corp_reputation??0),P=document.getElementById("h2-kpi-rep");P&&(P.innerHTML=`${Math.round(M)}<small> / 100</small>`);const j=document.getElementById("h2-kpi-rep-d");j&&(j.className="delta "+(M>=70?"up":M>=40?"flat":"down"),j.textContent=M>=70?"strong":M>=40?"steady":"weak");const R=Number(t.corp_market_share??0),W=document.getElementById("h2-kpi-mkt");W&&(W.innerHTML=`${Math.round(R)}<small>%</small>`);const N=document.getElementById("h2-kpi-mkt-d");N&&(N.className="delta "+(R>=15?"up":R>=5?"flat":"down"),N.textContent=R>=15?"major player":R>=5?"mid-tier":"niche");const Y=(t.corp_ticker||t.abbreviation||"CORP").toUpperCase(),H=document.getElementById("h2-nw-sym");H&&(H.textContent=Y);const $=document.getElementById("h2-nw-ex");if($){const b=(e||"").split(" ").map(_=>_[0]||"").join("").toUpperCase().slice(0,4);$.textContent=`${t.corp_company_type||"Private"}${b?" · "+b+" EXCH":""}`}const q=document.getElementById("h2-nw-price");q&&(q.innerHTML=`${u.main}<small>${u.unit}</small>`);const O=document.getElementById("h2-nw-d");O&&(O.className="d flat",O.textContent="no history yet");const T=(b,_,Q)=>{const h=document.getElementById(b);h&&(h.textContent=v(_))};T("h2-tr-cash",n),T("h2-tr-property",a),T("h2-tr-equipment",i);const S=document.getElementById("h2-tr-loans");S&&(S.textContent=v(r),S.classList.toggle("good",r===0),S.classList.toggle("red",r>0)),T("h2-tr-payable",l);const z=te(t.corp_credit_rating??50),I=document.getElementById("h2-tr-credit");I&&(I.textContent=`${z.tag} · ${z.tone==="good"?"stable":z.tone==="gold"?"watch":"caution"}`,I.classList.remove("good","gold","red"),I.classList.add(z.tone))}async function de(){const t=document.getElementById("slogan-input"),e=document.getElementById("slogan-hint"),n=document.getElementById("slogan-save-btn"),a=(t.value||"").trim().slice(0,60);if(a.length===0){e.textContent="Slogan cannot be empty.",e.className="slogan-hint slogan-hint--error";return}n.disabled=!0,n.textContent="...",e.textContent="";try{const{error:i}=await p.from("factions").update({party_description:a,last_rename_tick:window._currentTick}).eq("id",window._corpFactionId);if(i)throw i;document.getElementById("id-slogan").textContent='"'+a+'"',e.textContent="Slogan saved! Next change in 120 ticks.",e.className="slogan-hint slogan-hint--ok",n.textContent="Save"}catch(i){console.error("Slogan save failed:",i),e.textContent="Failed to save slogan.",e.className="slogan-hint slogan-hint--error",n.disabled=!1,n.textContent="Save"}}async function pe(){await p.auth.signOut(),window.location.href="login.html"}function fe(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function _e(t,e){const n=document.getElementById("corp-faction-dropdown");n&&n.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"?window.location.href="corp-dashboard.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),n=document.getElementById("corp-faction-dropdown");n&&e&&!e.contains(t.target)&&n.classList.remove("open")});window.doLogout=pe;async function ve(t){const e=t.target.files?.[0];if(!e)return;if(e.size>128*1024){alert("Logo must be under 128KB.");return}const n=window._corpFactionId;if(!n)return;const a=document.getElementById("corp-logo-label");a&&(a.textContent="Uploading...");try{const i=e.name.split(".").pop()||"png",r=`party-logos/${n}/${Date.now()}.${i}`,{error:l}=await p.storage.from("public-assets").upload(r,e,{contentType:e.type,upsert:!0});if(l)throw l;const{data:s}=p.storage.from("public-assets").getPublicUrl(r),o=s?.publicUrl||null;await p.from("factions").update({custom_logo_url:o}).eq("id",n);const d=document.getElementById("id-logo");d&&(d.innerHTML=`<img src="${o}" alt="logo" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">`);const m=document.getElementById("corp-logo");m&&(m.innerHTML=`<img src="${o}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`),a&&(a.textContent="Change Logo")}catch(i){console.error("Logo upload failed:",i),alert("Upload failed: "+(i.message||"Unknown error")),a&&(a.textContent="Upload Logo")}}window.saveSlogan=de;window.toggleCorpDropdown=fe;window.switchToFaction=_e;let ht=!1;function me(t,e,n,a){if(ht)return;const i=window._nationStats,l=1+(mt(i,"inflation")-50)/100*.3,s=Math.max(.1,a/100),o=Math.round(n*l*s),d=document.getElementById("prop-modal-overlay"),m=document.getElementById("prop-modal-content");m.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Sell Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${f(e)}</div>
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Purchase Price</span>
                <span style="color:var(--text-primary);">${v(n)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Inflation Modifier</span>
                <span style="color:var(--amber, #b09a5b);">${l.toFixed(3)}x</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Condition</span>
                <span style="color:${a>=75?"var(--green)":a>=50?"var(--amber)":"var(--red)"};">${a}%</span>
            </div>
            <div style="border-top:1px solid var(--border-hair);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:11px;font-family:var(--font-mono);font-weight:700;">
                <span style="color:var(--text-primary);">Sale Price</span>
                <span style="color:var(--gold, #c8a832);">${v(o)}</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-sell-confirm" onclick="confirmSellProperty('${t}', ${o})">Confirm Sale</button>
        </div>
    `,d.style.display="flex"}async function ue(t,e){if(ht)return;ht=!0;const n=document.getElementById("prop-sell-confirm");n&&(n.disabled=!0,n.textContent="Selling...");try{const a=window._corpFactionId;if(!a)throw new Error("No faction");const{error:i}=await p.from("corp_properties").update({is_active:!1}).eq("id",t).eq("faction_id",a);if(i)throw new Error("Failed to sell property: "+i.message);const{data:r}=await p.from("factions").select("corp_cash_reserves").eq("id",a).single(),l=Number(r?.corp_cash_reserves??0),{error:s}=await p.from("factions").update({corp_cash_reserves:l+e}).eq("id",a);s&&console.error("[Property] Failed to credit cash:",s.message),wt(),alert("Property sold for "+v(e)+". Cash credited."),location.reload()}catch(a){alert("Sale failed: "+a.message)}finally{ht=!1,n&&(n.disabled=!1,n.textContent="Confirm Sale")}}let xt=!1;function ge(t,e,n,a){if(xt)return;const i=window._nationStats,r=window._factionData,s=1+(mt(i,"inflation")-50)/100*.3,o=Math.round(2e6*(a/1e3)),d=Math.round(o*s),m=Math.max(50,Math.round(a*.1)),u=Number(r?.corp_general_workforce??0),k=u>=m,P=Number(r?.corp_cash_reserves??0)>=d,j=document.getElementById("prop-modal-overlay"),R=document.getElementById("prop-modal-content"),W=k&&P&&n<100;let N="";n>=100?N='<div style="color:var(--green);font-size:9px;margin-bottom:8px;">Property is already at 100% condition.</div>':P?k||(N='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient general workforce (need '+m.toLocaleString()+", have "+u.toLocaleString()+").</div>"):N='<div style="color:var(--red);font-size:9px;margin-bottom:8px;">Insufficient cash reserves.</div>',R.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Refurbish Property</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:12px;">${f(e)} — Current Condition: ${n}%</div>
        ${N}
        <div style="background:var(--bg-3);border:1px solid var(--border-hair);padding:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Cost</span>
                <span style="color:${P?"var(--gold, #c8a832)":"var(--red)"};">${v(d)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Workforce Required</span>
                <span style="color:${k?"var(--blue)":"var(--red)"};">${m.toLocaleString()} General</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
                <span style="color:var(--text-dim);">Duration</span>
                <span style="color:var(--amber, #b09a5b);">1–6 ticks</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);">
                <span style="color:var(--text-dim);">Outcome</span>
                <span style="color:var(--green);">Condition → 94–100%</span>
            </div>
        </div>
        <div style="display:flex;gap:6px;">
            <button class="prop-modal-btn prop-modal-btn--cancel" onclick="closePropModal()">Cancel</button>
            <button class="prop-modal-btn prop-modal-btn--confirm" id="prop-refurb-confirm" onclick="confirmRefurbish('${t}', ${d}, ${m})" ${W?"":"disabled"}>Begin Refurbishment</button>
        </div>
    `,j.style.display="flex"}async function ye(t,e,n){if(xt)return;xt=!0;const a=document.getElementById("prop-refurb-confirm");a&&(a.disabled=!0,a.textContent="Starting...");try{const i=window._corpFactionId,r=window._currentTick;if(!i)throw new Error("No faction");const l=Math.floor(Math.random()*6)+1,o=94+(Math.floor(Math.random()*6)+1),d=r+l,{data:m}=await p.from("factions").select("corp_cash_reserves").eq("id",i).single(),u=Number(m?.corp_cash_reserves??0);if(u<e)throw new Error("Insufficient cash");const{error:k}=await p.from("factions").update({corp_cash_reserves:u-e}).eq("id",i);if(k)throw new Error("Failed to deduct cost: "+k.message);const{error:M}=await p.from("corp_properties").update({refurbish_until_tick:d,refurbish_condition:o}).eq("id",t).eq("faction_id",i);if(M)throw new Error("Failed to start refurbishment: "+M.message);wt(),alert("Refurbishment started! Duration: "+l+" tick"+(l!==1?"s":"")+". Condition will be restored to "+Math.min(100,o)+"% when complete."),location.reload()}catch(i){alert("Refurbishment failed: "+i.message)}finally{xt=!1,a&&(a.disabled=!1,a.textContent="Begin Refurbishment")}}function wt(){const t=document.getElementById("prop-modal-overlay");t&&(t.style.display="none")}window.showSellModal=me;window.confirmSellProperty=ue;window.showRefurbishModal=ge;window.confirmRefurbish=ye;window.closePropModal=wt;window.showConvertModal=xe;window.confirmConvertProperty=we;let Et=!1;async function be(t,e,n,a,i,r,l){if(!Et&&confirm("Accept bid from "+n+`?

Bid Price: `+v(a)+`
Quality: `+i+`/100
Workers: `+r+`

This will award the contract. The project begins immediately.`)){Et=!0;try{const{data:s}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=s?.current_tick||0,{error:d}=await p.from("contract_bids").update({status:"won"}).eq("id",e);if(d)throw d;const{error:m}=await p.from("contract_bids").update({status:"lost"}).eq("contract_id",t).neq("id",e);if(m)throw m;const{error:u}=await p.from("construction_contracts").update({status:"awarded",awarded_to_faction:l,awarded_at_tick:o}).eq("id",t);if(u)throw u;alert("Contract awarded to "+n+`!

Bid: `+v(a)+`
Project begins immediately.`),window._nationStats&&window._factionData&&Z&&await It(window._nationStats,window._nationStats?.name||"",window._factionData,Z)}catch(s){alert("Failed to accept bid: "+(s.message||s))}finally{Et=!1}}}window.cpAcceptBid=be;function he(t){const e=document.getElementById("cp-bid-"+t);e&&(e.style.display=e.style.display==="none"?"":"none")}window.cpToggleBid=he;let Ct="branch_office";function xe(t,e,n){const a=(c?.corp_subsector||"").toLowerCase(),i=a==="banking"?[["branch_office","Branch Office"]]:a==="investment"?[["trading_floor","Trading Floor"]]:a==="insurance"?[["claims_office","Claims Office"]]:[];if(i.length===0)return;Ct=i[0][0];const r=Math.round(n*.15),l=Math.floor(Math.random()*6)+4,s=document.getElementById("prop-modal-overlay"),o=document.getElementById("prop-modal-content");o.innerHTML=`
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Convert Property</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;">${f(e)}</div>
        <div style="display:flex;gap:4px;margin-bottom:10px;">
            ${i.map(([d,m])=>`<span onclick="_convertTargetType='${d}';document.querySelectorAll('.conv-opt').forEach(e=>e.style.background='transparent');this.style.background='rgba(138,106,170,0.15)'" class="conv-opt" style="flex:1;text-align:center;padding:6px;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(138,106,170,0.3);color:#8a6aaa;${d===Ct?"background:rgba(138,106,170,0.15)":""}">${m}</span>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Cost</span>
            <span style="color:var(--gold);">${v(r)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;font-family:var(--font-mono);margin-bottom:4px;">
            <span style="color:var(--text-dim);">Conversion Time</span>
            <span style="color:var(--text-bright);">${l} ticks</span>
        </div>
        <div style="font-size:8px;color:var(--text-dim);margin:8px 0;font-family:var(--font-mono);line-height:1.5;">Property will be offline during conversion. No revenue or workforce allocation until complete.</div>
        <div style="display:flex;gap:6px;justify-content:flex-end;">
            <button class="prop-action-btn prop-action-btn--sell" onclick="closePropModal()">Cancel</button>
            <button class="prop-action-btn" style="background:rgba(138,106,170,0.12);border-color:rgba(138,106,170,0.3);color:#8a6aaa;" onclick="confirmConvertProperty('${t}',${r},${l})">Convert</button>
        </div>
    `,s.style.display="flex"}async function we(t,e,n){const a=Number(c?.corp_cash_reserves??0);if(a<e){alert("Insufficient cash. Need "+v(e)+".");return}const i=Z?.current_tick||0;try{await p.from("factions").update({corp_cash_reserves:Math.max(0,a-e)}).eq("id",c.id),c.corp_cash_reserves=Math.max(0,a-e),await p.from("corp_properties").update({type:Ct,refurbish_until_tick:i+n,condition:100}).eq("id",t),wt();const r=window._nationStats;await It(r,r?.name||c?.nation,c,Z)}catch(r){alert("Conversion failed: "+r.message)}}const St={crisis:{icon:"⚠",color:"#e74c3c",bg:"rgba(231,76,60,0.12)",label:"CRISIS"},government:{icon:"⚖",color:"#f1c40f",bg:"rgba(241,196,15,0.10)",label:"GOV"},executive_order:{icon:"✍",color:"#e67e22",bg:"rgba(230,126,34,0.12)",label:"EXEC ORDER"},political:{icon:"★",color:"#3498db",bg:"rgba(52,152,219,0.12)",label:"POLITICAL"},trade:{icon:"⚓",color:"#2ecc71",bg:"rgba(46,204,113,0.12)",label:"TRADE"},diplomatic:{icon:"🌐",color:"#9b59b6",bg:"rgba(155,89,182,0.12)",label:"DIPLOMATIC"},bill:{icon:"📜",color:"#3498db",bg:"rgba(52,152,219,0.10)",label:"BILL"},new_party:{icon:"🏳",color:"#9b59b6",bg:"rgba(155,89,182,0.10)",label:"NEW PARTY"},protest:{icon:"✊",color:"#e67e22",bg:"rgba(230,126,34,0.10)",label:"PROTEST"},military:{icon:"⚔",color:"#b07a4a",bg:"rgba(176,122,74,0.12)",label:"MILITARY"},economy:{icon:"💰",color:"#7a9a5b",bg:"rgba(122,154,91,0.12)",label:"ECONOMY"},corporate:{icon:"🏢",color:"#c8a64e",bg:"rgba(200,166,78,0.10)",label:"CORP"}},Bt={icon:"•",color:"#888",bg:"rgba(136,136,136,0.08)",label:""},$e={crisis:"alert",protest:"alert",trade:"fin",economy:"fin",corporate:"fin",executive_order:"ops",military:"ops",bill:"pr",government:"pr",political:"pr",diplomatic:"pr",new_party:"pr"},ke={alert:"Alert",fin:"Fin",ops:"Ops",pr:"PR",crew:"Crew"};function Ee(t){return $e[(t||"").toLowerCase()]||"crew"}function lt(t){const e=document.getElementById("h2-wire-dispatches"),n=document.getElementById("h2-wire-live");if(!e)return;const a=Array.isArray(t)?t:[];if(a.length===0){e.innerHTML='<div class="h2-wire-empty">No dispatches</div>',n&&(n.textContent="0 events");return}n&&(n.textContent=`${a.length} event${a.length!==1?"s":""}`);const i=a.slice(0,12);e.innerHTML=i.map(r=>{const l=Ee(r.category),s=r.fired_at_tick!=null?`T${r.fired_at_tick}`:"—",o=r.description_chosen||r.description_used||"",d=Rt(r.event_name),m=d&&o?`<b>${f(d)}</b> — ${f(o)}`:f(d||o||"Event");return`<div class="h2-disp">
            <span class="h2-when">${f(s)}</span>
            <span class="h2-src ${l}">${ke[l]}</span>
            <span class="h2-ln">${m}</span>
        </div>`}).join("")}const Ce={1:"Embarrassing Backfire",2:"Protests Don't Materialise",3:"Modest Turnout",4:"Respectable Protest",5:"Strong Demonstration",6:"Nationwide Protests",7:"The Big One"};let ut="nation",gt="local",ct=null;function Rt(t){return t?t.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase()):""}function Lt(t,e){if(!t)return"<em>Unknown</em>";const n=f(t);return e?`<span style="color:${e.replace(/[^a-zA-Z0-9#(),.\s%]/g,"")};font-weight:600">${n}</span>`:`<strong>${n}</strong>`}function Pt(t,e,n){const a=t.factions?.nation_id===(t.nation_id||e),i=t.proposer_name||(a?t.factions?.faction_name:null)||"A former party",r=t.proposer_color||(a?t.factions?.party_color:null);return{fired_at_tick:t.proposed_tick,event_name:t.bill_name,_desc_html:`${Lt(i,r)} proposed "${f(t.bill_name)}"`,category:"bill",_synthetic:!0,...n}}function zt(t,e){const n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:null,a=n?` led by <strong>${f(n)}</strong>`:"";return{fired_at_tick:0,event_name:t.faction_name,_desc_html:`${Lt(t.faction_name,t.party_color)} founded${a}`,category:"new_party",_synthetic:!0,_created_at:t.created_at,...e}}function At(t,e){const n=Ce[t.tier]||`Tier ${t.tier}`,a=t.demand_label?` demanding "${f(t.demand_label)}"`:"",i=t.status==="crisis_active",r=t.tier>=6?"#e74c3c":t.tier>=4?"#f39c12":"",l=r?`<span style="color:${r};font-weight:600">${f(n)}</span>`:`<strong>${f(n)}</strong>`;return{fired_at_tick:t.tick_resolved||t.tick_called,event_name:n,_desc_html:`${Lt(t.factions?.faction_name,t.factions?.party_color)} organised a protest${a} — ${l}${i?' <span style="color:#e74c3c;font-weight:700;">(CRISIS)</span>':""}`,category:"protest",_synthetic:!0,...e}}function Ot(t,e,n,a,i){return[...t.map(r=>({...r,_synthetic:!1})),...e,...n,...a].sort((r,l)=>{const s=(l.fired_at_tick||0)-(r.fired_at_tick||0);if(s!==0)return s;const o=r._created_at||r.created_at||"",d=l._created_at||l.created_at||"";return d>o?1:d<o?-1:0}).slice(0,i)}function Ft(t){if(t._synthetic&&t._desc_html)return t._desc_html;const e=t.description_chosen||t.description_used||"",n=Rt(t.event_name),a=n?`<strong>${f(n)}</strong>`:"",i=e?f(e):"";return a&&i?`${a} — ${i}`:i||a||"Event"}function Ht(t){return t.map(e=>{const n=Mt(e.fired_at_tick),a=St[(e.category||"").toLowerCase()]||Bt;return`<div class="corp-ev-row">
            <span class="corp-ev-date">${f(n)}</span>
            <span class="corp-ev-icon" style="color:${a.color}">${a.icon}</span>
            <span class="corp-ev-text">${Ft(e)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}const qt=[{color:"#6b8cae",bg:"rgba(107,140,174,0.10)",border:"rgba(107,140,174,0.3)"},{color:"#7a9a5b",bg:"rgba(122,154,91,0.10)",border:"rgba(122,154,91,0.3)"},{color:"#b07a4a",bg:"rgba(176,122,74,0.10)",border:"rgba(176,122,74,0.3)"},{color:"#8b7ec8",bg:"rgba(139,126,200,0.10)",border:"rgba(139,126,200,0.3)"},{color:"#5b9a8b",bg:"rgba(91,154,139,0.10)",border:"rgba(91,154,139,0.3)"},{color:"#a65d5d",bg:"rgba(166,93,93,0.10)",border:"rgba(166,93,93,0.3)"}];function Me(t){let e=0;for(let n=0;n<t.length;n++)e=(e<<5)-e+t.charCodeAt(n)|0;return qt[Math.abs(e)%qt.length]}function Dt(t){return t.map(e=>{const n=Mt(e.fired_at_tick),a=St[(e.category||"").toLowerCase()]||Bt,i=e.nations?.name||"Unknown",r=e.nations?.nation_profiles,l=Array.isArray(r)?r[0]?.flag_url:r?.flag_url,s=Me(i),o=l?`<img src="${f(l)}" alt="">`:"";return`<div class="corp-ev-row">
            <span class="corp-ev-date-col">
                <span class="corp-ev-date">${f(n)}</span>
                <span class="corp-ev-nation-badge" style="color:${s.color};background:${s.bg};border-color:${s.border};">${o}${f(i)}</span>
            </span>
            <span class="corp-ev-text">${Ft(e)}</span>
            ${a.label?`<span class="corp-ev-cat" style="color:${a.color};background:${a.bg}">${a.label}</span>`:""}
        </div>`}).join("")}async function Te(){const t=document.getElementById("corp-events-list");if(!t||!ct)return;const{nationId:e}=ct;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,a]=await Promise.all([p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").eq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),p.from("event_log").select("*").eq("nation_id",e).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=n.data||[],r=a.data||[],l=i.map(o=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${o.faction_name} [${o.corp_ticker||o.abbreviation||"??"}] was founded with a specialty in ${o.corp_subsector||o.corp_sector||"General"}. Led by CEO ${[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:o.founded_tick||0})),s=[...r,...l].sort((o,d)=>(d.fired_at_tick||0)-(o.fired_at_tick||0)).slice(0,40);if(s.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events in this nation yet.</div>',lt([]);return}t.innerHTML=Ht(s),lt(s)}catch(n){console.error("Corp local events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function Ie(){const t=document.getElementById("corp-events-list");if(!t||!ct)return;const{nationId:e}=ct;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,a]=await Promise.all([p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30),p.from("event_log").select("*, nations(name, nation_profiles(flag_url))").neq("nation_id",e).eq("category","corporate").order("fired_at_tick",{ascending:!1}).limit(30)]),i=n.data||[],r=a.data||[],l=i.map(o=>({event_name:"Corporation Founded",category:"corporate",description_chosen:`${o.faction_name} [${o.corp_ticker||o.abbreviation||"??"}] was founded in ${o.nation||"Unknown"} with a specialty in ${o.corp_subsector||o.corp_sector||"General"}. Led by CEO ${[o.leader_first_name,o.leader_last_name].filter(Boolean).join(" ")||"Unknown"}.`,fired_at_tick:o.founded_tick||0,nations:{name:o.nation||"Unknown"}})),s=[...r,...l].sort((o,d)=>(d.fired_at_tick||0)-(o.fired_at_tick||0)).slice(0,40);if(s.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>',lt([]);return}t.innerHTML=Dt(s),lt(s);return}catch(n){console.error("Corp world events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>';return}try{const{data:n,error:a}=await p.from("factions").select("faction_name, abbreviation, corp_sector, corp_subsector, corp_ticker, leader_first_name, leader_last_name, nation_id, nation, created_at, founded_tick").eq("faction_type","corporation").neq("nation_id",e).is("abandoned_at",null).order("created_at",{ascending:!1}).limit(30);if(a)throw a;if(!n||n.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No corporate events from other nations yet.</div>',lt([]);return}t.innerHTML=Le(n,!0)}catch(n){console.error("Corp world events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}function Le(t,e){return t.map(n=>{const a=[n.leader_first_name,n.leader_last_name].filter(Boolean).join(" ")||"Unknown",i=n.nation||"Unknown",r=n.corp_subsector||n.corp_sector||"General",l=n.corp_ticker||n.abbreviation||"",s=n.founded_tick?Mt(n.founded_tick):"";let o='<div class="corp-event-row">';return o+='<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--teal);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);padding:1px 5px;display:inline-block;margin-bottom:2px;">'+f(i.toUpperCase())+"</div>",o+='<div style="font-size:11px;color:var(--text-primary);line-height:1.5;">',o+='<span style="font-weight:600;">'+f(n.faction_name)+"</span>",l&&(o+=' <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-dim);">['+f(l)+"]</span>"),o+=' was founded in <span style="font-weight:500;">'+f(i)+"</span>",o+=' with a specialty in <span style="color:var(--teal);font-weight:500;">'+f(r)+"</span>.",o+=' Led by CEO <span style="font-weight:500;">'+f(a)+"</span>.",o+="</div>",s&&(o+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">'+f(s)+"</div>"),o+="</div>",o}).join("")}async function Ut(){const t=document.getElementById("corp-events-list");if(!t||!ct)return;const{nationId:e}=ct;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading…</div>';try{const[n,a,i,r]=await Promise.all([p.from("event_log").select("*").eq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(50),p.from("bills").select("bill_name, proposed_tick, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id)").eq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(30),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, created_at").eq("nation_id",e).order("created_at",{ascending:!1}).limit(20),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, factions(faction_name, party_color)").eq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(20)]);if(n.error)throw n.error;const l=n.data||[],s=Ot(l,(a.data||[]).map(o=>Pt(o,e)),(i.data||[]).map(o=>zt(o)),(r.data||[]).map(o=>At(o)),60);if(s.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No nation events recorded yet.</div>',lt([]);return}t.innerHTML=Ht(s),lt(s)}catch(n){console.error("Nation events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}async function Ne(){const t=document.getElementById("corp-events-list");if(!t||!ct)return;const{nationId:e}=ct;if(!e){t.innerHTML='<div class="subs-card__empty">No nation linked.</div>';return}t.innerHTML='<div style="color:var(--text-secondary);padding:16px;font-size:0.7rem;text-align:center;">Loading world events…</div>';try{const[n,a,i,r]=await Promise.all([p.from("event_log").select("*, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("fired_at_tick",{ascending:!1}).limit(60),p.from("bills").select("bill_name, proposed_tick, nation_id, proposed_by, bill_type, proposer_name, proposer_color, factions!proposed_by(faction_name, party_color, nation_id), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).not("bill_type","in",'("no_confidence","confirmation","minister_confirmation","veto_override","impeachment_conviction")').order("proposed_tick",{ascending:!1}).limit(20),p.from("factions").select("faction_name, party_color, leader_first_name, leader_last_name, nation_id, created_at, nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).order("created_at",{ascending:!1}).limit(15),p.from("protest_log").select("id, tick_called, tick_resolved, tier, status, demand_label, faction_id, nation_id, factions(faction_name, party_color), nations!inner(name, nation_profiles(flag_url))").neq("nation_id",e).in("status",["resolved","crisis_active"]).order("tick_called",{ascending:!1}).limit(15)]);if(n.error)throw n.error;const l=n.data||[],s=Ot(l,(a.data||[]).map(o=>Pt(o,null,{nations:o.nations})),(i.data||[]).map(o=>zt(o,{nations:o.nations})),(r.data||[]).map(o=>At(o,{nations:o.nations})),60);if(s.length===0){t.innerHTML='<div class="subs-card__empty" style="padding:40px 0;">No world events recorded yet.</div>',lt([]);return}t.innerHTML=Dt(s),lt(s)}catch(n){console.error("World events error:",n),t.innerHTML='<div class="subs-card__empty">Failed to load events.</div>'}}window.switchCorpEventsCat=function(t){t!==ut&&(ut=t,document.querySelectorAll("#corp-events-cat-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.cat===t)),jt())};window.switchCorpEventsScope=function(t){t!==gt&&(gt=t,document.querySelectorAll("#corp-events-scope-bar .corp-events-tab").forEach(e=>e.classList.toggle("active",e.dataset.scope===t)),jt())};function jt(){ut==="nation"&&gt==="local"?Ut():ut==="nation"&&gt==="world"?Ne():ut==="corporate"&&gt==="local"?Te():Ie()}ee();
