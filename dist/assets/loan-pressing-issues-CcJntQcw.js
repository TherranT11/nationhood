import{_ as b}from"./preload-helper-BXl3LOEh.js";import{e as i,h as x}from"./utils-oN1e812_.js";const g="loan-pi-pressing-styles",_=`
.loan-pi-card {
    background: #1a1a17;
    border: 1px solid rgba(255,255,255,0.06);
    border-left: 3px solid #c8a832;
    padding: 18px 22px;
    margin-bottom: 12px;
}
.loan-pi-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
}
.loan-pi-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 2px 8px;
    color: #c8a832;
    border: 1px solid rgba(200,168,50,0.40);
    background: rgba(200,168,50,0.06);
}
.loan-pi-tag.unread {
    color: #fff;
    background: #c8a832;
    border-color: #c8a832;
}
.loan-pi-activity {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.loan-pi-name {
    font-family: 'IBM Plex Serif', Georgia, serif;
    font-weight: 500;
    font-size: 19px;
    color: #f0efe6;
    line-height: 1.2;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
}
.loan-pi-purpose {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
}
.loan-pi-terms {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 8px 0 14px;
}
.loan-pi-terms > span {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.loan-pi-terms .label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    color: #666;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}
.loan-pi-terms .value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #f0efe6;
    font-weight: 600;
}
.loan-pi-actions { display: flex; gap: 8px; }
.loan-pi-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 8px 14px;
    background: #c8a832;
    border: 1px solid #c8a832;
    color: #1a1a17;
    cursor: pointer;
    transition: all 0.15s;
    flex: 1;
    font-weight: 600;
}
.loan-pi-btn:hover {
    background: #f0efe6;
    border-color: #f0efe6;
}
`;function v(){if(document.getElementById(g))return;const e=document.createElement("style");e.id=g,e.textContent=_,document.head.appendChild(e)}function w(e){if(!e)return"—";const n=new Date(e).getTime();if(!Number.isFinite(n))return"—";const a=Math.max(0,Math.floor((Date.now()-n)/1e3));return a<60?a+"s ago":a<3600?Math.floor(a/60)+"m ago":a<86400?Math.floor(a/3600)+"h ago":Math.floor(a/86400)+"d ago"}async function y(e,n){const{data:a,error:s}=await e.from("loan_negotiations").select(`
            id, principal, apr, term_ticks, purpose,
            borrower_agreed, lender_agreed,
            last_activity_at, last_seen_at_borrower,
            lender:lender_faction_id ( faction_name, corp_ticker )
        `).eq("borrower_faction_id",n).eq("status","open").order("last_activity_at",{ascending:!1});return s?(console.warn("[loan-pressing] fetch failed:",s.message),[]):a||[]}function h(e){const n=e.lender||{},a=n.corp_ticker||"—",s=n.faction_name||"Lender",l=Number(e.apr)||0,c=Number(e.term_ticks)||0,p=Number(e.principal)||0,r=e.purpose?String(e.purpose).trim():"",d=(e.borrower_agreed?1:0)+(e.lender_agreed?1:0),t=e.last_activity_at||null,o=!e.last_seen_at_borrower||t&&new Date(e.last_seen_at_borrower).getTime()<new Date(t).getTime();return`<div class="loan-pi-card">
        <div class="loan-pi-meta-row">
            <span class="loan-pi-tag${o?" unread":""}">${o?"NEGOTIATION ◊ UNREAD":"NEGOTIATION"}</span>
            <span class="loan-pi-activity">${i(w(t))}</span>
        </div>
        <div class="loan-pi-name">${i(a)} — ${i(s)}</div>
        ${r?`<div class="loan-pi-purpose">— ${i(r)}</div>`:""}
        <div class="loan-pi-terms">
            <span><span class="label">Principal</span><span class="value">${i(x(p))}</span></span>
            <span><span class="label">APR</span><span class="value">${l.toFixed(1)}%</span></span>
            <span><span class="label">Term</span><span class="value">${c} ticks</span></span>
            <span><span class="label">Agreement</span><span class="value">${d}/2</span></span>
        </div>
        <div class="loan-pi-actions">
            <button class="loan-pi-btn" data-action="loan-pi-open" data-id="${i(e.id)}">Open Negotiation ▸</button>
        </div>
    </div>`}function $({supabase:e,faction:n,host:a,emptyMessage:s="No pressing issues right now. Time-sensitive decisions will appear here when triggered.",emptyClass:l="",showEmpty:c=!0,onChange:p=null}){if(!a)return{refresh:async()=>{},getCount:()=>0};v();let r=[];function d(){if(r.length===0){if(!c){a.innerHTML="";return}const o=l?` class="${i(l)}"`:"";a.innerHTML=`<div${o}>${i(s)}</div>`;return}a.innerHTML=r.map(h).join("")}async function t(){if(r=await y(e,n.id),d(),typeof p=="function")try{p(r)}catch(o){console.warn("[loan-pressing] onChange threw:",o?.message||o)}}return a.addEventListener("click",async o=>{const m=o.target.closest('[data-action="loan-pi-open"]');if(!m)return;const u=m.dataset.id;if(u)try{await(await b(()=>import("./loan-negotiation-modal-DEcCZwBB.js"),[])).mountLoanNegotiationModal({supabase:e,negotiationId:u,onClose:t,onFired:t})}catch(f){console.warn("[loan-pressing] modal mount failed:",f?.message||f)}}),window.addEventListener("loan-negotiation:updated",t),t(),{refresh:t,getCount:()=>r.length}}export{$ as m};
