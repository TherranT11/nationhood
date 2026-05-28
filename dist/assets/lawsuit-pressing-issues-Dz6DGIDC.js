const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/lawsuit-respond-BtChnTN-.js","assets/supabase-client-CiYoFhIh.js","assets/utils-oN1e812_.js","assets/lawsuit-types-mDq47olK.js"])))=>i.map(i=>d[i]);
import{_ as x}from"./preload-helper-BXl3LOEh.js";import{b as h}from"./lawsuit-types-mDq47olK.js";const g="lp-lawsuit-pressing-styles",y=`
.lp-card {
    background: #1a1a17;
    border: 1px solid rgba(255,255,255,0.06);
    border-left-width: 3px;
    padding: 18px 22px;
    margin-bottom: 12px;
}
.lp-card.kind-defendant { border-left-color: #d9534f; box-shadow: inset 3px 0 12px rgba(217,83,79,0.15); }
.lp-card.kind-settle    { border-left-color: #c8a832; }

.lp-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
}
.lp-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: #1a1a17;
}
.lp-tag.kind-defendant { color: #fff; background: #d9534f; border-color: #d9534f; }
.lp-tag.kind-settle    { color: #c8a832; border-color: rgba(200,168,50,0.40); background: rgba(200,168,50,0.06); }

.lp-deadline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.lp-name {
    font-family: 'IBM Plex Serif', Georgia, serif;
    font-weight: 500;
    font-size: 19px;
    color: #f0efe6;
    line-height: 1.2;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
}
.lp-client {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
}
.lp-desc {
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    font-size: 12px;
    line-height: 1.55;
    color: #c4c2b8;
    margin: 8px 0 12px;
}

.lp-actions { display: flex; gap: 8px; }
.lp-btn {
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
.lp-btn:hover {
    background: #f0efe6;
    border-color: #f0efe6;
    color: #1a1a17;
}
`;function k(){if(document.getElementById(g))return;const e=document.createElement("style");e.id=g,e.textContent=y,document.head.appendChild(e)}function a(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function S(e){const t=Number(e)||0;return Math.abs(t)>=1e9?`$${(t/1e9).toFixed(2)}B`:Math.abs(t)>=1e6?`$${(t/1e6).toFixed(1)}M`:Math.abs(t)>=1e3?`$${Math.round(t/1e3)}k`:`$${t}`}async function $(e,t){const[n,s]=await Promise.all([e.from("commercial_lawsuits").select(`
                id, plaintiff_faction_id, defendant_faction_id, grievance_type,
                relief_sought, status, filed_at_tick, response_deadline_tick,
                settle_offer_amount, chat_id,
                plaintiff:plaintiff_faction_id(faction_name, abbreviation, corp_ticker)
            `).eq("defendant_faction_id",t).eq("status","pending").order("filed_at_tick",{ascending:!1}),e.from("commercial_lawsuits").select(`
                id, plaintiff_faction_id, defendant_faction_id, grievance_type,
                relief_sought, status, settle_offer_amount, chat_id,
                defendant:defendant_faction_id(faction_name, abbreviation, corp_ticker)
            `).eq("plaintiff_faction_id",t).eq("status","settle_offered").order("updated_at",{ascending:!1})]);return n.error&&console.warn("[lawsuit-pressing] defendant fetch failed:",n.error.message),s.error&&console.warn("[lawsuit-pressing] plaintiff fetch failed:",s.error.message),{defendantSuits:n.data||[],plaintiffSettleOffers:s.data||[]}}function M(e,t){const n=Math.max(0,Number(e.response_deadline_tick||0)-t),s=e.plaintiff?.faction_name||"Plaintiff",c=e.plaintiff?.corp_ticker||e.plaintiff?.abbreviation||"",f=h[e.grievance_type]||e.grievance_type;return`<div class="lp-card kind-defendant">
        <div class="lp-meta-row">
            <span class="lp-tag kind-defendant">LAWSUIT ◊ RESPONSE REQUIRED</span>
            <span class="lp-deadline">${n} tick${n===1?"":"s"} remaining</span>
        </div>
        <div class="lp-name">Sued by ${a(s)}</div>
        <div class="lp-client">— ${a(f)} ${c?"· "+a(c):""}</div>
        <div class="lp-desc">A civil lawsuit has been filed against you. Choose Refute, Settle, or Concede before the deadline or the case auto-concedes.</div>
        <div class="lp-actions">
            <button class="lp-btn" data-action="lawsuit-respond" data-id="${a(e.id)}">Respond ▸</button>
        </div>
    </div>`}function E(e){const t=e.defendant?.faction_name||"Defendant",n=Number(e.settle_offer_amount||0);return`<div class="lp-card kind-settle">
        <div class="lp-meta-row">
            <span class="lp-tag kind-settle">SETTLEMENT ◊ AWAITING YOU</span>
            <span class="lp-deadline">Decide</span>
        </div>
        <div class="lp-name">${a(t)} offered ${a(S(n))}</div>
        <div class="lp-client">— Accept to close, reject to proceed to trial</div>
        <div class="lp-actions">
            <button class="lp-btn" data-action="lawsuit-settle-review" data-id="${a(e.id)}">Review Offer ▸</button>
        </div>
    </div>`}function I({supabase:e,faction:t,host:n,currentTick:s=()=>0,emptyMessage:c="No pressing issues right now. Time-sensitive decisions will appear here when triggered.",emptyClass:f="",showEmpty:_=!0,onChange:m=null}){if(!n)return{refresh:async()=>{},getCount:()=>0};k();let i={defendantSuits:[],plaintiffSettleOffers:[]};function b(){const r=Number(s())||0,o=i.defendantSuits.map(d=>M(d,r)).concat(i.plaintiffSettleOffers.map(E));if(o.length===0){if(!_){n.innerHTML="";return}const d=f?` class="${a(f)}"`:"";n.innerHTML=`<div${d}>${a(c)}</div>`}else n.innerHTML=o.join("")}async function p(){if(i=await $(e,t.id),b(),typeof m=="function")try{m(i)}catch(r){console.warn("[lawsuit-pressing] onChange threw:",r?.message||r)}}return n.addEventListener("click",async r=>{const o=r.target.closest('[data-action="lawsuit-respond"], [data-action="lawsuit-settle-review"]');if(!o)return;const d=o.dataset.action,w=o.dataset.id;try{const l=await x(()=>import("./lawsuit-respond-BtChnTN-.js"),__vite__mapDeps([0,1,2,3])),u=(d==="lawsuit-respond"?i.defendantSuits:i.plaintiffSettleOffers).find(v=>v.id===w);if(!u)return;d==="lawsuit-respond"?l.openLawsuitResponseModal(u,t):l.openSettleReviewModal(u,t)}catch(l){console.warn("[lawsuit-pressing] modal mount failed:",l?.message||l)}}),window.addEventListener("lawsuit:responded",p),window.addEventListener("lawsuit:settled",p),p(),{refresh:p,getCount:()=>i.defendantSuits.length+i.plaintiffSettleOffers.length}}export{I as m};
