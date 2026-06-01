import{_ as i}from"./supabase-client-BXEzLDpS.js";const v={},c=typeof import.meta<"u"&&v?.VITE_SUPABASE_URL||"",l=typeof import.meta<"u"&&v?.VITE_WORK_SERVICE_ROLE_KEY||"";let s=!1;async function _(){if(document.getElementById("dev-toolbar"))return;const e=document.createElement("div");e.id="dev-toolbar",e.innerHTML=u(),m(e),document.body.appendChild(e),await g(),document.getElementById("dev-toolbar-toggle").addEventListener("click",f),document.getElementById("dev-advance-tick").addEventListener("click",()=>b(1)),document.getElementById("dev-advance-n").addEventListener("click",x),document.getElementById("dev-reset-seed").addEventListener("click",y),document.getElementById("dev-nation-select").addEventListener("change",E)}function u(){return`
        <button id="dev-toolbar-toggle" title="Dev Toolbar">DEV</button>
        <div id="dev-toolbar-panel" style="display:none;">
            <div class="dev-toolbar-section">
                <div class="dev-toolbar-label">Current Tick</div>
                <div id="dev-current-tick" class="dev-toolbar-value">--</div>
            </div>
            <div class="dev-toolbar-section">
                <button id="dev-advance-tick" class="dev-btn">Advance 1 Tick</button>
            </div>
            <div class="dev-toolbar-section">
                <div class="dev-toolbar-row">
                    <input id="dev-tick-count" type="number" min="1" max="100" value="5" class="dev-input">
                    <button id="dev-advance-n" class="dev-btn">Advance N</button>
                </div>
            </div>
            <div class="dev-toolbar-section">
                <button id="dev-reset-seed" class="dev-btn dev-btn-danger">Reset to Seed</button>
            </div>
            <div class="dev-toolbar-section">
                <div class="dev-toolbar-label">Switch Nation</div>
                <select id="dev-nation-select" class="dev-select">
                    <option value="">Loading...</option>
                </select>
            </div>
            <div id="dev-toolbar-status" class="dev-toolbar-status"></div>
        </div>
    `}function m(e){e.style.cssText=`
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 99999;
        font-family: monospace;
        font-size: 12px;
    `;const t=document.createElement("style");t.textContent=`
        #dev-toolbar-toggle {
            background: #1a6b1a;
            color: #fff;
            border: 2px solid #2d9b2d;
            padding: 6px 12px;
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 1px;
            cursor: pointer;
            font-family: monospace;
            border-radius: 4px;
        }
        #dev-toolbar-toggle:hover { background: #2d9b2d; }
        #dev-toolbar-panel {
            background: #1a1a2e;
            border: 2px solid #2d9b2d;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            min-width: 220px;
            color: #e0e0e0;
        }
        .dev-toolbar-section {
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #333;
        }
        .dev-toolbar-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .dev-toolbar-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 4px;
        }
        .dev-toolbar-value {
            font-size: 16px;
            font-weight: 700;
            color: #2d9b2d;
        }
        .dev-toolbar-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .dev-btn {
            background: #2d9b2d;
            color: #fff;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-family: monospace;
            font-size: 11px;
            font-weight: 600;
            border-radius: 4px;
            width: 100%;
        }
        .dev-btn:hover { background: #3db83d; }
        .dev-btn:disabled { background: #555; cursor: not-allowed; }
        .dev-btn-danger { background: #8B0000; }
        .dev-btn-danger:hover { background: #cc3300; }
        .dev-input {
            background: #111;
            color: #fff;
            border: 1px solid #444;
            padding: 4px 6px;
            font-family: monospace;
            font-size: 12px;
            width: 50px;
            border-radius: 4px;
            text-align: center;
        }
        .dev-select {
            background: #111;
            color: #fff;
            border: 1px solid #444;
            padding: 4px 6px;
            font-family: monospace;
            font-size: 11px;
            width: 100%;
            border-radius: 4px;
        }
        .dev-toolbar-status {
            font-size: 10px;
            color: #888;
            margin-top: 6px;
            min-height: 14px;
        }
    `,document.head.appendChild(t)}function f(){s=!s;const e=document.getElementById("dev-toolbar-panel");e.style.display=s?"block":"none"}function n(e){const t=document.getElementById("dev-toolbar-status");t&&(t.textContent=e)}function d(e){document.querySelectorAll("#dev-toolbar-panel button, #dev-toolbar-panel select, #dev-toolbar-panel input").forEach(o=>o.disabled=e)}async function g(){const{data:e}=await i.from("shard").select("current_tick").limit(1).maybeSingle(),t=document.getElementById("dev-current-tick");t&&e&&(t.textContent=e.current_tick);const{data:o}=await i.from("nations").select("id, name").order("name"),a=document.getElementById("dev-nation-select");if(a&&o){const p=new URLSearchParams(window.location.search).get("nation_id")||"";a.innerHTML='<option value="">-- Select Nation --</option>'+o.map(r=>`<option value="${r.id}" ${r.id===p?"selected":""}>${r.name}</option>`).join("")}}async function b(e){if(!c||!l){n("Missing VITE_WORK_SERVICE_ROLE_KEY in .env.work");return}d(!0);const t=c+"/functions/v1/advance-tick";for(let o=0;o<e;o++){n(`Advancing tick ${o+1} of ${e}...`);try{const a=await fetch(t,{method:"POST",headers:{Authorization:`Bearer ${l}`,"Content-Type":"application/json"}});if(!a.ok){n(`Tick ${o+1} failed: ${a.status} ${a.statusText}`),d(!1);return}}catch(a){n(`Tick ${o+1} error: ${a.message}`),d(!1);return}}n(`${e} tick(s) advanced. Reloading...`),setTimeout(()=>location.reload(),500)}async function x(){const e=document.getElementById("dev-tick-count"),t=parseInt(e?.value,10)||1;await b(Math.min(t,100))}async function y(){if(confirm("Reset Work DB to seed state? This will delete all game data.")){d(!0),n("Resetting tables...");try{const{error:e}=await i.rpc("admin_reset_tables");if(e){n("Reset failed: "+e.message),d(!1);return}n("Seeding test data...");const{error:t}=await i.rpc("seed_work_data");if(t){n("Seed failed: "+t.message),d(!1);return}n("Reset complete. Reloading..."),setTimeout(()=>location.reload(),500)}catch(e){n("Reset error: "+e.message),d(!1)}}}function E(){const t=document.getElementById("dev-nation-select")?.value;if(!t)return;const o=new URL(window.location.href);o.searchParams.set("nation_id",t),o.searchParams.delete("faction_id"),window.location.href=o.toString()}export{_ as renderDevToolbar};
