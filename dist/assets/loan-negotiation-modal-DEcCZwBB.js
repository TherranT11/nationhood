const H="lnm-style";function D(){if(document.getElementById(H))return;const t=document.createElement("style");t.id=H,t.textContent=`
.lnm-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-ui, 'IBM Plex Sans', sans-serif);
}
.lnm-modal {
    background: var(--bg-2, #1a1a17);
    border: 1px solid var(--border-1, rgba(255,255,255,0.08));
    width: min(960px, 94vw);
    max-height: 90vh;
    display: flex; flex-direction: column;
    color: var(--text-primary, #c4c2b8);
}
.lnm-head {
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.06));
    display: grid; grid-template-columns: 1fr auto;
    gap: 10px; align-items: center;
}
.lnm-head__title {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text-dim, #4a4940);
    margin-bottom: 4px;
}
.lnm-head__pair {
    font-family: var(--font-ui); font-size: 14px; color: var(--text-bright, #f0efe6);
    font-weight: 600;
}
.lnm-head__pair small {
    font-family: var(--font-mono); font-size: 10px; color: var(--text-muted, #888);
    font-weight: 400; margin-left: 8px;
}
.lnm-head__activity {
    font-family: var(--font-mono); font-size: 9.5px; color: var(--text-dim);
    margin-top: 2px;
}
.lnm-close {
    background: transparent; border: 1px solid var(--border-1);
    color: var(--text-secondary, #888); cursor: pointer;
    padding: 4px 10px; font-family: var(--font-mono); font-size: 11px;
}
.lnm-close:hover { color: var(--text-bright); border-color: var(--border-2, rgba(255,255,255,0.12)); }

.lnm-body {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    flex: 1; min-height: 0;
}
@media (max-width: 720px) {
    .lnm-body { grid-template-columns: 1fr; }
}

.lnm-col {
    padding: 14px 18px;
    overflow-y: auto;
    min-height: 0;
}
.lnm-col + .lnm-col {
    border-left: 1px solid var(--border-0);
}
.lnm-section-h {
    font-family: var(--font-mono); font-size: 9.5px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-dim); margin-bottom: 8px;
}
.lnm-field {
    margin-bottom: 10px;
}
.lnm-field label {
    display: block;
    font-family: var(--font-mono); font-size: 9.5px; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;
}
.lnm-field input, .lnm-field textarea {
    width: 100%;
    background: var(--bg-3, #252525);
    border: 1px solid var(--border-1);
    color: var(--text-bright);
    padding: 6px 9px;
    font-family: var(--font-mono); font-size: 12px;
    box-sizing: border-box;
}
.lnm-field input:focus, .lnm-field textarea:focus {
    outline: 1px solid var(--amber, #c8a832);
    border-color: var(--amber, #c8a832);
}
.lnm-field input:disabled, .lnm-field textarea:disabled {
    color: var(--text-primary);
    cursor: default;
    opacity: 0.85;
}
.lnm-field textarea { resize: vertical; min-height: 56px; }

.lnm-action-row {
    display: flex; gap: 8px; align-items: center;
    margin-top: 10px;
}
.lnm-btn {
    padding: 6px 14px;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    background: var(--bg-3); border: 1px solid var(--border-1);
    color: var(--text-bright); cursor: pointer;
}
.lnm-btn:hover { border-color: var(--amber, #c8a832); color: var(--amber, #c8a832); }
.lnm-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: var(--border-1); color: var(--text-muted); }
.lnm-btn--primary {
    border-color: var(--amber, #c8a832);
    color: var(--amber, #c8a832);
    background: rgba(200,168,50,0.08);
}
.lnm-btn--primary:hover { background: rgba(200,168,50,0.18); }
.lnm-btn--danger {
    border-color: var(--accent-rust, #d48a3c);
    color: var(--accent-rust, #d48a3c);
    background: rgba(212,138,60,0.08);
}
.lnm-btn--danger:hover { background: rgba(212,138,60,0.22); }

.lnm-inline-error {
    margin-top: 6px;
    padding: 4px 8px;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--accent-rust, #d48a3c);
    background: rgba(212,138,60,0.05);
    border: 1px solid rgba(212,138,60,0.2);
}

.lnm-agreement {
    margin-top: 14px; padding-top: 12px;
    border-top: 1px dashed var(--border-0);
}
.lnm-agree-row {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 0;
    font-family: var(--font-mono); font-size: 11px;
}
.lnm-agree-row input[type=checkbox]:disabled { cursor: not-allowed; }
.lnm-agree-row input[type=checkbox]:not(:disabled) { cursor: pointer; }
.lnm-agreement-tally {
    margin-top: 8px;
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
}
.lnm-agreement-tally--0 { color: var(--accent-rust, #d48a3c); }
.lnm-agreement-tally--1 { color: var(--amber, #c8a832); }
.lnm-agreement-tally--2 { color: var(--green, #5cb85c); }

.lnm-status-pill {
    display: inline-block;
    padding: 2px 8px;
    font-family: var(--font-mono); font-size: 9px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    border: 1px solid;
    margin-left: 8px;
}
.lnm-status--open      { color: var(--green); border-color: rgba(92,184,92,0.4); background: rgba(92,184,92,0.08); }
.lnm-status--fired     { color: var(--blue, #5b9bd5); border-color: rgba(91,155,213,0.4); background: rgba(91,155,213,0.08); }
.lnm-status--abandoned { color: var(--text-muted); border-color: var(--border-1); background: transparent; }

.lnm-terminal-banner {
    margin-bottom: 10px;
    padding: 8px 12px;
    font-family: var(--font-mono); font-size: 11px;
    border: 1px solid;
}
.lnm-terminal-banner--fired     { color: var(--blue, #5b9bd5); border-color: rgba(91,155,213,0.4); background: rgba(91,155,213,0.05); }
.lnm-terminal-banner--abandoned { color: var(--text-muted); border-color: var(--border-1); background: rgba(255,255,255,0.02); }

.lnm-chat {
    flex: 1;
    overflow-y: auto;
    margin: 8px 0;
    padding-right: 4px;
    min-height: 240px;
    max-height: 60vh;
}
.lnm-msg {
    padding: 6px 0;
    border-bottom: 1px dashed var(--border-0);
    font-size: 12px;
    line-height: 1.4;
}
.lnm-msg:last-child { border-bottom: 0; }
.lnm-msg__head {
    font-family: var(--font-mono); font-size: 9.5px;
    color: var(--text-dim); margin-bottom: 2px;
    text-transform: uppercase; letter-spacing: 0.04em;
}
.lnm-msg--system .lnm-msg__head { color: var(--amber, #c8a832); }
.lnm-msg--system .lnm-msg__body { color: var(--text-muted); font-style: italic; }
.lnm-msg__body { color: var(--text-primary); white-space: pre-wrap; word-wrap: break-word; }

.lnm-empty-chat {
    padding: 20px; text-align: center;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text-dim);
}

.lnm-chat-input {
    display: grid; grid-template-columns: 1fr auto;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--border-0);
}
.lnm-chat-input input {
    background: var(--bg-3); border: 1px solid var(--border-1);
    color: var(--text-bright); padding: 6px 9px;
    font-family: var(--font-ui); font-size: 12px;
}
.lnm-chat-input input:focus { outline: 1px solid var(--amber); border-color: var(--amber); }
.lnm-chat-input input:disabled { opacity: 0.5; cursor: not-allowed; }

.lnm-loading, .lnm-error {
    padding: 60px 20px; text-align: center;
    font-family: var(--font-mono); font-size: 11px;
}
.lnm-loading { color: var(--text-dim); }
.lnm-error   { color: var(--accent-rust); }

.lnm-phase-note {
    margin-top: 10px;
    padding: 6px 10px;
    font-family: var(--font-mono); font-size: 9px;
    color: var(--text-dim); font-style: italic;
    border-left: 2px solid var(--border-0);
    background: rgba(255,255,255,0.015);
}

/* ── Collateral picker (Phase 5b) ── */
.lnm-collat-summary {
    display: flex; gap: 16px; align-items: center;
    font-family: var(--font-mono); font-size: 10.5px;
    color: var(--text-muted);
    margin-bottom: 6px;
}
.lnm-collat-empty {
    padding: 12px;
    font-family: var(--font-mono); font-size: 10px;
    color: var(--text-dim); font-style: italic;
    border: 1px dashed var(--border-0);
    text-align: center;
}
.lnm-collat-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 4px;
}
@media (max-width: 720px) {
    .lnm-collat-grid { grid-template-columns: 1fr; }
}
.lnm-collat-item {
    display: grid; grid-template-columns: 14px 1fr auto;
    gap: 8px; align-items: center;
    padding: 6px 8px;
    background: var(--bg-3, #252525);
    border: 1px solid var(--border-1);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
}
.lnm-collat-item:hover:not(.lnm-collat-item--readonly) {
    border-color: var(--amber, #c8a832);
}
.lnm-collat-item.selected {
    background: rgba(200,168,50,0.06);
    border-color: var(--amber, #c8a832);
}
.lnm-collat-item--readonly { cursor: default; }
.lnm-collat-check {
    width: 12px; height: 12px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-size: 10px; font-weight: 700;
    color: var(--amber, #c8a832);
    border: 1px solid var(--border-2, rgba(255,255,255,0.12));
}
.lnm-collat-item.selected .lnm-collat-check {
    background: var(--amber, #c8a832);
    color: var(--bg-0, #0e0e0c);
    border-color: var(--amber, #c8a832);
}
.lnm-collat-name {
    font-family: var(--font-ui); font-size: 11.5px; font-weight: 600;
    color: var(--text-bright);
    line-height: 1.2;
}
.lnm-collat-kind {
    font-family: var(--font-mono); font-size: 8.5px;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 1px;
}
.lnm-collat-value {
    font-family: var(--font-mono); font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--green, #5cb85c);
}

/* ── Lender inbox panel (Phase 5) ── */
.lnm-inbox-host {
    display: block;
}
.lnm-inbox-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px dashed var(--border-0);
    cursor: pointer;
    transition: background 0.12s;
}
.lnm-inbox-row:last-child { border-bottom: 0; }
.lnm-inbox-row:hover { background: var(--bg-hover, rgba(255,255,255,0.03)); }
.lnm-inbox-row__pair {
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-bright);
    margin-bottom: 2px;
}
.lnm-inbox-row__meta {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
}
.lnm-inbox-row__time {
    font-family: var(--font-mono);
    font-size: 9.5px;
    color: var(--text-dim);
    white-space: nowrap;
}
.lnm-inbox-pill {
    display: inline-block;
    padding: 1px 6px;
    margin-right: 6px;
    font-family: var(--font-mono); font-size: 8.5px;
    font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--amber, #c8a832);
    background: rgba(200,168,50,0.1);
    border: 1px solid rgba(200,168,50,0.4);
    vertical-align: middle;
}
`,document.head.appendChild(t)}function p(t){if(t==null)return"";const e=document.createElement("div");return e.textContent=String(t),e.innerHTML}function A(t){if(!t)return"—";const e=new Date(t).getTime(),a=Date.now(),o=Math.max(0,Math.floor((a-e)/1e3));return o<60?o+"s ago":o<3600?Math.floor(o/60)+"m ago":o<86400?Math.floor(o/3600)+"h ago":Math.floor(o/86400)+"d ago"}async function U(t,e){try{const{data:{user:a}={}}=await t.auth.getUser(),o=a?.id;if(!o)return null;const{data:v,error:c}=await t.from("factions").select("id").eq("faction_type","corporation").is("abandoned_at",null).or(`id.eq.${o},linked_user_id.eq.${o}`).limit(1).maybeSingle();return c?(console.warn("["+e+"] own-corp lookup failed:",c.message),null):v?.id||null}catch(a){return console.warn("["+e+"] auth resolve failed:",a?.message||a),null}}const j={regional:5e6,narrowbody:25e6,widebody:1e8},O={regional:"Regional",narrowbody:"Narrowbody",widebody:"Widebody"};function E(t,e){return t.from("loan_negotiations").select(`
            id, status, principal, apr, term_ticks, purpose, notes,
            borrower_agreed, lender_agreed, escrowed_lender_cash,
            last_activity_at, collateral,
            borrower:borrower_faction_id(id, faction_name, linked_user_id, corp_sector),
            lender:lender_faction_id(id, faction_name, linked_user_id)
        `).eq("id",e).maybeSingle()}async function K(t,e){if(!e?.id)return[];const a=[],o=t.from("corp_properties").select("id, name, role, purchase_price, condition").eq("faction_id",e.id).eq("is_active",!0),v=e.corp_sector==="Airline"?t.from("corp_aircraft").select("id, aircraft_class, condition, tail_number").eq("corp_id",e.id):Promise.resolve({data:[],error:null}),c=e.corp_sector==="Shipping"?t.from("corp_vessels").select("id, name, purchase_price").eq("faction_id",e.id):Promise.resolve({data:[],error:null}),[l,m,d]=await Promise.all([o,v,c]);if(l.error)console.warn("[lnm collateral] properties fetch failed:",l.error.message);else for(const n of l.data||[]){const i=Math.round(Number(n.purchase_price||0)*(Number(n.condition||0)/100)),b=n.name||(n.role||"Property").replace(/_/g," ");a.push({kind:"property",id:n.id,name:b,value:i})}if(m.error)console.warn("[lnm collateral] aircraft fetch failed:",m.error.message);else for(const n of m.data||[]){const i=n.aircraft_class||"regional",b=j[i]||0,w=Math.round(b*(Number(n.condition||0)/100)),x=n.tail_number?" · "+n.tail_number:"";a.push({kind:"aircraft",id:n.id,name:(O[i]||i)+x,value:w})}if(d.error)console.warn("[lnm collateral] vessels fetch failed:",d.error.message);else for(const n of d.data||[])a.push({kind:"vessel",id:n.id,name:n.name||"Vessel",value:Math.round(Number(n.purchase_price||0))});return a}function V(t,e){return t.from("loan_negotiation_messages").select(`
            id, body, system_msg, posted_at, posted_at_tick, author_faction_id,
            author:author_faction_id(id, faction_name)
        `).eq("negotiation_id",e).order("posted_at",{ascending:!0}).limit(50)}function W(t){const e=t.contains(document.activeElement)?document.activeElement:null;if(!e)return null;const a=e.dataset?.lnmField;if(!a)return null;const o=typeof e.selectionStart=="number"?e.selectionStart:null;return{fieldKey:a,sel:o}}function J(t,e){if(!e||!e.fieldKey)return;const a=t.querySelector('[data-lnm-field="'+e.fieldKey+'"]');if(a&&(a.focus(),e.sel!=null&&a.setSelectionRange))try{a.setSelectionRange(e.sel,e.sel)}catch{}}function Y(){const t=document.createElement("div");return t.className="lnm-overlay",t.innerHTML='<div class="lnm-modal"><div class="lnm-loading">Loading negotiation…</div></div>',t}function B(t,e){t.innerHTML=`
        <div class="lnm-head">
          <div>
            <div class="lnm-head__title">Loan Negotiation</div>
            <div class="lnm-head__pair">Could not open</div>
          </div>
          <button type="button" class="lnm-close" data-act="close">Close</button>
        </div>
        <div class="lnm-error">${p(e)}</div>`}function G(t,e,a,o){const l=t.status==="open"&&e==="borrower",m=Array.isArray(a)?a:Array.isArray(t.collateral)?t.collateral:[],d=m.reduce((x,f)=>x+(Number(f.value)||0),0),n=Number(t.principal)||0,i=n>0?Math.round(d/n*100):0;let b="";if(l){const x=Array.isArray(o)?o:[],f=new Set(m.map(y=>y.id));x.length===0?b='<div class="lnm-collat-empty">No assets available to pledge.</div>':b='<div class="lnm-collat-grid">'+x.map(y=>{const r=f.has(y.id),s=Math.round((Number(y.value)||0)/1e3)/1e3;return`
                  <div class="lnm-collat-item${r?" selected":""}"
                       data-act="collat-toggle"
                       data-collat-kind="${p(y.kind)}"
                       data-collat-id="${p(y.id)}"
                       data-collat-name="${p(y.name)}"
                       data-collat-value="${p(y.value)}">
                    <div class="lnm-collat-check">${r?"✓":""}</div>
                    <div class="lnm-collat-meta">
                      <div class="lnm-collat-name">${p(y.name)}</div>
                      <div class="lnm-collat-kind">${p(y.kind)}</div>
                    </div>
                    <div class="lnm-collat-value">$${s.toFixed(s>=10?1:2)}M</div>
                  </div>
                `}).join("")+"</div>"}else m.length===0?b='<div class="lnm-collat-empty">No collateral pledged.</div>':b='<div class="lnm-collat-grid">'+m.map(x=>{const f=Math.round((Number(x.value)||0)/1e3)/1e3;return`
              <div class="lnm-collat-item selected lnm-collat-item--readonly">
                <div class="lnm-collat-check">●</div>
                <div class="lnm-collat-meta">
                  <div class="lnm-collat-name">${p(x.name||"?")}</div>
                  <div class="lnm-collat-kind">${p(x.kind||"?")}</div>
                </div>
                <div class="lnm-collat-value">$${f.toFixed(f>=10?1:2)}M</div>
              </div>
            `}).join("")+"</div>";const w=Math.round(d/1e3)/1e3;return`
      <div class="lnm-field">
        <label>Collateral${l?"":" (read-only)"}</label>
        <div class="lnm-collat-summary">
          <span>Total pledged: <strong>$${w.toFixed(w>=10?1:2)}M</strong></span>
          <span>Coverage: <strong style="color:${i>=100?"var(--green, #5cb85c)":i>=50?"var(--amber, #c8a832)":"var(--accent-rust, #d48a3c)"};">${n>0?i+"%":"—"}</strong></span>
        </div>
        ${b}
      </div>`}function F(t,e,a,o,v,c){const l=(e.borrower_agreed?1:0)+(e.lender_agreed?1:0),m="lnm-status--"+e.status,d="lnm-agreement-tally--"+l,n=e.status==="open",i=n?"":"disabled",b=n&&o==="borrower",w=n&&o==="lender";let x="";e.status==="fired"?x=`<div class="lnm-terminal-banner lnm-terminal-banner--fired">
            ✓ Loan disbursed: $${Number(e.principal).toLocaleString()} at ${p(e.apr)}% for ${p(e.term_ticks)} ticks. This window closes shortly.
        </div>`:e.status==="abandoned"&&(x=`<div class="lnm-terminal-banner lnm-terminal-banner--abandoned">
            ✕ Negotiation was abandoned.
        </div>`),t.innerHTML=`
        <div class="lnm-head">
          <div>
            <div class="lnm-head__title">
                Loan Negotiation
                <span class="lnm-status-pill ${m}">${p(e.status)}</span>
            </div>
            <div class="lnm-head__pair">
                ${p(e.borrower?.faction_name||"Borrower")}
                <small>↔</small>
                ${p(e.lender?.faction_name||"Lender")}
            </div>
            <div class="lnm-head__activity">Last activity: ${A(e.last_activity_at)}</div>
          </div>
          <button type="button" class="lnm-close" data-act="close">Close</button>
        </div>

        <div class="lnm-body">
          <!-- TERMS -->
          <div class="lnm-col">
            ${x}
            <div class="lnm-section-h">Terms</div>

            <div class="lnm-field">
              <label>Principal ($)</label>
              <input type="number" min="1" step="1000"
                     data-lnm-field="principal"
                     value="${p(e.principal)}" ${i}>
            </div>
            <div class="lnm-field">
              <label>APR (%)</label>
              <input type="number" min="0" max="100" step="0.1"
                     data-lnm-field="apr"
                     value="${p(e.apr)}" ${i}>
            </div>
            <div class="lnm-field">
              <label>Term (ticks)</label>
              <input type="number" min="1" step="1"
                     data-lnm-field="term_ticks"
                     value="${p(e.term_ticks)}" ${i}>
            </div>
            <div class="lnm-field">
              <label>Purpose</label>
              <input type="text" maxlength="120"
                     data-lnm-field="purpose"
                     value="${p(e.purpose||"")}" placeholder="—" ${i}>
            </div>
            <div class="lnm-field">
              <label>Notes</label>
              <textarea rows="3" maxlength="2000"
                        data-lnm-field="notes" placeholder="—" ${i}>${p(e.notes||"")}</textarea>
            </div>

            ${G(e,o,v,c)}

            ${n?`
            <div class="lnm-action-row">
              <button type="button" class="lnm-btn lnm-btn--primary" data-act="apply-terms">Apply Changes</button>
              <button type="button" class="lnm-btn lnm-btn--danger"  data-act="walk-away">Walk Away</button>
              <span class="lnm-loading" id="lnm-terms-status" style="padding:0;font-size:10px;display:none;">Saving…</span>
            </div>
            <div class="lnm-inline-error" id="lnm-terms-error" style="display:none;"></div>
            `:""}

            <div class="lnm-agreement">
              <div class="lnm-agree-row">
                <input type="checkbox"
                       data-act="agree-borrower"
                       ${e.borrower_agreed?"checked":""}
                       ${b?"":"disabled"}>
                <span>Borrower agreed${o==="borrower"&&n?' <small style="color:var(--text-muted);margin-left:4px;">(you)</small>':""}</span>
              </div>
              <div class="lnm-agree-row">
                <input type="checkbox"
                       data-act="agree-lender"
                       ${e.lender_agreed?"checked":""}
                       ${w?"":"disabled"}>
                <span>Lender agreed${o==="lender"&&n?' <small style="color:var(--text-muted);margin-left:4px;">(you)</small>':""}
                ${e.escrowed_lender_cash>0?'<small style="color:var(--text-muted);margin-left:6px;">(escrowed $'+Number(e.escrowed_lender_cash).toLocaleString()+")</small>":""}
                </span>
              </div>
              <div class="lnm-agreement-tally ${d}">Agreement: ${l}/2</div>
              <div class="lnm-inline-error" id="lnm-agree-error" style="display:none;margin-top:6px;"></div>
            </div>
          </div>

          <!-- CHAT -->
          <div class="lnm-col" style="display:flex;flex-direction:column;">
            <div class="lnm-section-h">Chat</div>
            <div class="lnm-chat" id="lnm-chat-scroll">
              ${a.length===0?'<div class="lnm-empty-chat">No messages yet.</div>':a.map(y=>I(y,e)).join("")}
            </div>
            <div class="lnm-chat-input">
              <input type="text" maxlength="500"
                     data-lnm-field="chat-input"
                     placeholder="${n?"Type a message…":"Negotiation closed — chat disabled"}"
                     ${i}>
              <button type="button" class="lnm-btn" data-act="send-chat" ${i}>Send</button>
            </div>
            <div class="lnm-inline-error" id="lnm-chat-error" style="display:none;"></div>
          </div>
        </div>
    `;const f=t.querySelector("#lnm-chat-scroll");f&&(f.scrollTop=f.scrollHeight)}function Q(t,e){if(t.system_msg)return null;if(t.author?.faction_name)return t.author;const a=t.author_faction_id;return a==null?null:e?.borrower?.id===a?e.borrower:e?.lender?.id===a?e.lender:null}function I(t,e){const a=Q(t,e);return`
      <div class="lnm-msg ${t.system_msg?"lnm-msg--system":""}">
        <div class="lnm-msg__head">
          ${t.system_msg?"System":p(a?.faction_name||"Unknown")}
          · ${A(t.posted_at)}
        </div>
        <div class="lnm-msg__body">${p(t.body)}</div>
      </div>`}function X(t,e,a){const o=t.querySelector("#lnm-chat-scroll");if(!o)return;const v=o.querySelector(".lnm-empty-chat");v&&v.remove();const c=document.createElement("div");c.innerHTML=I(e,a);const l=c.firstElementChild;l&&(o.appendChild(l),o.scrollTop=o.scrollHeight)}const z=new Set;async function Z({supabase:t,negotiationId:e,onClose:a,onFired:o}={}){if(!t)throw new Error("mountLoanNegotiationModal: supabase client required");if(!e)throw new Error("mountLoanNegotiationModal: negotiationId required");if(z.has(e))return{close:()=>{}};z.add(e),D();const v=Y(),c=v.querySelector(".lnm-modal");document.body.appendChild(v);let l=null,m=[],d=null,n=null,i=!1;const b=()=>{if(d){try{t.removeChannel(d)}catch{}d=null}},w=()=>{n&&(clearInterval(n),n=null)},x=()=>{b(),w()};window.addEventListener("beforeunload",x);const f=()=>{i||(i=!0,z.delete(e),b(),w(),window.removeEventListener("beforeunload",x),v.remove(),typeof a=="function"&&a())};v.addEventListener("click",g=>{if(g.target.closest('[data-act="close"]')){f();return}if(g.target===v){f();return}});const[y,r]=await Promise.all([E(t,e),V(t,e)]);if(y.error)return B(c,"Failed to load negotiation: "+y.error.message),{close:f};if(!y.data)return B(c,"Negotiation not found, or you are not a party to it."),{close:f};r.error&&console.warn("[loan-negotiation-modal] messages fetch failed:",r.error.message),l=y.data,m=r.data||[];let s=null;try{const{data:{user:g}={}}=await t.auth.getUser(),h=g?.id;h&&(h===l.borrower?.id||h===l.borrower?.linked_user_id?s="borrower":(h===l.lender?.id||h===l.lender?.linked_user_id)&&(s="lender"))}catch(g){console.warn("[loan-negotiation-modal] auth.getUser failed:",g?.message||g)}let u=Array.isArray(l.collateral)?l.collateral.slice():[],k=[];s==="borrower"&&(k=await K(t,l.borrower)),F(c,l,m,s,u,k),R(c,t,e,()=>l,s,u);const S=()=>{s&&t.rpc("mark_negotiation_seen",{p_neg_id:e}).then(({error:g})=>{g&&console.warn("[loan-negotiation-modal] mark_seen failed:",g.message)})};S();let L=!1;const M=async()=>{if(i)return;const g=W(c),h=c.querySelector('[data-lnm-field="chat-input"]')?.value||"",$=l?.status,N=l?.last_activity_at,{data:q,error:T}=await E(t,e);if(i)return;if(T){console.warn("[loan-negotiation-modal] re-fetch failed:",T.message);return}if(!q||q.status===$&&q.last_activity_at===N)return;l=q,u=Array.isArray(l.collateral)?l.collateral.slice():[],F(c,l,m,s,u,k),R(c,t,e,()=>l,s,u);const C=c.querySelector('[data-lnm-field="chat-input"]');if(C&&h&&!C.value&&(C.value=h),J(c,g),!L&&$==="open"&&l.status==="fired"){if(L=!0,typeof o=="function")try{await o(l)}catch(P){console.warn("[loan-negotiation-modal] onFired callback threw:",P?.message||P)}setTimeout(()=>{i||f()},3e3)}S()};return d=t.channel("lnm:"+e),d.on("postgres_changes",{event:"UPDATE",schema:"public",table:"loan_negotiations",filter:"id=eq."+e},async()=>{await M()}).on("postgres_changes",{event:"INSERT",schema:"public",table:"loan_negotiation_messages",filter:"negotiation_id=eq."+e},g=>{if(i)return;const h=g.new;m.some($=>$.id===h.id)||(m.push(h),X(c,h,l),S())}).subscribe(),n=setInterval(()=>{M()},15e3),{close:f}}function R(t,e,a,o,v,c,l){const m=t.querySelector('[data-act="apply-terms"]');m&&m.addEventListener("click",async()=>{const r=t.querySelector("#lnm-terms-error"),s=t.querySelector("#lnm-terms-status"),u=t.querySelector('[data-act="walk-away"]');r&&(r.style.display="none",r.textContent="");const k=parseInt(t.querySelector('[data-lnm-field="principal"]')?.value,10),S=parseFloat(t.querySelector('[data-lnm-field="apr"]')?.value),L=parseInt(t.querySelector('[data-lnm-field="term_ticks"]')?.value,10),M=t.querySelector('[data-lnm-field="purpose"]')?.value||"",g=t.querySelector('[data-lnm-field="notes"]')?.value||"";if(!Number.isFinite(k)||k<=0){_(r,"Principal must be a positive number.");return}if(!Number.isFinite(S)||S<0||S>100){_(r,"APR must be between 0 and 100.");return}if(!Number.isInteger(L)||L<=0){_(r,"Term must be a positive whole number of ticks.");return}m.disabled=!0,u&&(u.disabled=!0),s&&(s.style.display="");try{const{data:h,error:$}=await e.rpc("update_negotiation_terms",{p_neg_id:a,p_principal:k,p_apr:S,p_term_ticks:L,p_purpose:M,p_notes:g,p_collateral:c});if($){_(r,$.message);return}if(!h?.success){_(r,h?.error||"Update failed.");return}}catch(h){_(r,h?.message||"Network error.")}finally{m.disabled=!1,u&&(u.disabled=!1),s&&(s.style.display="none")}});const d=t.querySelector('[data-act="walk-away"]');d&&d.addEventListener("click",async()=>{const r=t.querySelector("#lnm-terms-error");if(r&&(r.style.display="none",r.textContent=""),!!confirm("Walk away from this negotiation? Any escrowed funds are refunded.")){d.disabled=!0,m&&(m.disabled=!0);try{const{data:s,error:u}=await e.rpc("abandon_negotiation",{p_neg_id:a,p_reason:null});u?_(r,u.message):s?.success||_(r,s?.error||"Could not abandon.")}catch(s){_(r,s?.message||"Network error.")}finally{d.disabled=!1,m&&(m.disabled=!1)}}});const n=t.querySelector('[data-act="send-chat"]'),i=t.querySelector('[data-lnm-field="chat-input"]'),b=t.querySelector("#lnm-chat-error"),w=async()=>{b&&(b.style.display="none",b.textContent="");const r=(i?.value||"").trim();if(r){n.disabled=!0,i&&(i.disabled=!0);try{const{data:s,error:u}=await e.rpc("post_negotiation_message",{p_neg_id:a,p_body:r});if(u){_(b,u.message);return}if(!s?.success){_(b,s?.error||"Could not send.");return}i.value=""}catch(s){_(b,s?.message||"Network error.")}finally{n.disabled=!1,i&&(i.disabled=!1,i.focus())}}};n&&n.addEventListener("click",w),i&&i.addEventListener("keydown",r=>{r.key==="Enter"&&!r.shiftKey&&(r.preventDefault(),w())}),v==="borrower"&&o()?.status==="open"&&t.querySelectorAll('[data-act="collat-toggle"]').forEach(r=>{r.addEventListener("click",()=>{const s=r.dataset.collatId,u=r.dataset.collatKind,k=r.dataset.collatName,S=Number(r.dataset.collatValue)||0;if(!s)return;const L=c.findIndex(g=>g.id===s);L>=0?(c.splice(L,1),r.classList.remove("selected"),r.querySelector(".lnm-collat-check").textContent=""):(c.push({kind:u,id:s,name:k,value:S}),r.classList.add("selected"),r.querySelector(".lnm-collat-check").textContent="✓");const M=t.querySelector(".lnm-collat-summary");if(M){const g=c.reduce((T,C)=>T+(Number(C.value)||0),0),h=Math.round(g/1e3)/1e3,$=Number(o()?.principal)||0,N=$>0?Math.round(g/$*100):0,q=N>=100?"var(--green, #5cb85c)":N>=50?"var(--amber, #c8a832)":"var(--accent-rust, #d48a3c)";M.innerHTML=`
                        <span>Total pledged: <strong>$${h.toFixed(h>=10?1:2)}M</strong></span>
                        <span>Coverage: <strong style="color:${q};">${$>0?N+"%":"—"}</strong></span>`}})});const x=v==="borrower"?'[data-act="agree-borrower"]':v==="lender"?'[data-act="agree-lender"]':null,f=t.querySelector("#lnm-agree-error"),y=x?t.querySelector(x):null;y&&!y.disabled&&y.addEventListener("change",async r=>{f&&(f.style.display="none",f.textContent="");const s=!!r.target.checked;r.target.disabled=!0;try{const{data:u,error:k}=await e.rpc("set_negotiation_agreement",{p_neg_id:a,p_agreed:s});if(k){r.target.checked=!s,_(f,k.message);return}if(!u?.success){r.target.checked=!s,_(f,u?.error||"Could not change agreement.");return}}catch(u){r.target.checked=!s,_(f,u?.message||"Network error.")}finally{const u=o()?.status==="open";r.target.disabled=!u}})}function _(t,e){t&&(t.textContent=e,t.style.display="")}async function ee({supabase:t,container:e,lenderFactionId:a,onOpenNegotiation:o}={}){if(!t||!e)return;D(),e.classList.add("lnm-inbox-host"),e.innerHTML='<div class="lnm-loading" style="padding:14px;">Loading inbox…</div>';const v=a||await U(t,"lender-inbox");if(!v){e.innerHTML='<div class="lnm-empty-chat" style="padding:14px;">Sign in to see negotiations.</div>';return}const c=async()=>{const{data:l,error:m}=await t.from("loan_negotiations").select(`
                id, principal, apr, term_ticks, status,
                borrower_agreed, lender_agreed,
                last_activity_at, last_seen_at_lender,
                borrower:borrower_faction_id(id, faction_name)
            `).eq("lender_faction_id",v).eq("status","open").order("last_activity_at",{ascending:!1});if(m){e.innerHTML='<div class="lnm-error" style="padding:14px;">Failed to load inbox: '+p(m.message)+"</div>";return}if(!l||l.length===0){e.innerHTML='<div class="lnm-empty-chat" style="padding:14px;">No open negotiations.</div>';return}e.innerHTML=l.map(d=>{const n=(d.borrower_agreed?1:0)+(d.lender_agreed?1:0),i=!d.last_seen_at_lender||new Date(d.last_activity_at).getTime()>new Date(d.last_seen_at_lender).getTime();return`
              <div class="lnm-inbox-row" data-neg-id="${p(d.id)}">
                <div class="lnm-inbox-row__main">
                  <div class="lnm-inbox-row__pair">
                    ${i?'<span class="lnm-inbox-pill">unread</span>':""}
                    ${p(d.borrower?.faction_name||"Borrower")}
                  </div>
                  <div class="lnm-inbox-row__meta">
                    $${Number(d.principal).toLocaleString()} @ ${p(d.apr)}% · ${p(d.term_ticks)} ticks · Agreement ${n}/2
                  </div>
                </div>
                <div class="lnm-inbox-row__time">${A(d.last_activity_at)}</div>
              </div>
            `}).join(""),e.querySelectorAll(".lnm-inbox-row").forEach(d=>{d.addEventListener("click",async()=>{const n=d.dataset.negId;n&&(typeof o=="function"?await o(n,c):await Z({supabase:t,negotiationId:n,onClose:c}))})})};return await c(),{refresh:c}}export{Z as mountLoanNegotiationModal,ee as renderLenderInbox};
