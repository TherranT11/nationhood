// topbar.js — the in-game top bar (Discord, party funds, party actions, date,
// and the settings gear). ONE source for every signed-in screen: a page drops
// <div class="topbar" id="topbar"></div> at the top of <main>, calls
// mountTopbar() once, then feeds live values via the setters as data loads.
import { wireDeletePartyMenu, currentTick } from '/supabase.js';
import { fmtFunds, tickToDate } from '/util.js';

const CSS = `
.topbar{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:26px}
.tb-discord{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#5865f2;color:#fff;flex:none;transition:background .15s}
.tb-discord:hover{background:#4752c4}
.tb-discord svg{width:18px;height:18px}
.tb-funds{display:flex;flex-direction:column;align-items:flex-start;gap:1px;border:1px solid var(--line);background:var(--chip);border-radius:11px;padding:8px 15px;white-space:nowrap}
.tb-funds__l{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft)}
.tb-funds__v{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;letter-spacing:.03em;color:var(--ink)}
.tb-actions{font-family:'Space Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--indigo);background:var(--indigo-soft);border:1px solid color-mix(in srgb,var(--indigo) 30%,transparent);border-radius:20px;padding:9px 15px;white-space:nowrap}
.tb-date{display:flex;flex-direction:column;align-items:flex-end;line-height:1.12}
.tb-date__l{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}
.tb-date__v{font-family:'Archivo',sans-serif;font-size:16px;font-weight:800;color:var(--ink);letter-spacing:.01em;white-space:nowrap}
.tb-next{display:flex;flex-direction:column;align-items:flex-start;gap:1px;border:1px solid var(--line);background:var(--chip);border-radius:11px;padding:8px 15px;white-space:nowrap}
.tb-next__l{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft)}
.tb-next__v{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;letter-spacing:.04em;color:var(--soft)}
.tb-gear{position:relative;flex:none}
.gear{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--chip);border:1px solid var(--line);color:var(--muted);cursor:pointer;transition:color .15s,border-color .15s}
.gear:hover{color:var(--ink);border-color:var(--ink)}
.gear svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.gearmenu{position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 44px -18px rgba(0,0,0,.4);padding:6px;min-width:210px;z-index:60}
.gearmenu[hidden]{display:none}
.gearmenu__item{display:block;width:100%;text-align:left;background:none;border:none;border-radius:8px;padding:10px 12px;font-family:inherit;font-size:13.5px;color:var(--ink);cursor:pointer}
.gearmenu__item:hover{background:var(--chip)}
.gearmenu__item--danger{color:var(--red);font-weight:700}
.gearmenu__item--danger:hover{background:#FBEAE9}
.gearmenu__warn{font-size:12.5px;line-height:1.5;color:var(--muted);padding:8px 10px 4px;margin:0}
.gearmenu__row{display:flex;gap:8px;padding:8px 6px 4px}
.gearmenu__btn{flex:1;border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:9px 10px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--ink);cursor:pointer}
.gearmenu__btn:hover{background:var(--chip)}
.gearmenu__btn--danger{background:var(--red);border-color:var(--red);color:#fff}
.gearmenu__btn--danger:hover{filter:brightness(1.05);background:var(--red)}
.gearmenu__btn:disabled{opacity:.6;cursor:not-allowed}
@media(max-width:560px){.topbar{gap:10px;margin-bottom:16px}.tb-next{display:none}}
`;

const HTML = `
<a class="tb-discord" href="https://discord.gg/HBvWxJUm8" target="_blank" rel="noopener" aria-label="Join our Discord"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.6 13.6 0 0 0-.6 1.23 18.27 18.27 0 0 0-5.487 0A13.6 13.6 0 0 0 9.87 3a19.79 19.79 0 0 0-3.76 1.369C2.72 9.046 1.79 13.605 2.255 18.1a19.9 19.9 0 0 0 6.073 3.058c.49-.668.926-1.377 1.302-2.122a12.93 12.93 0 0 1-2.05-.978c.172-.126.34-.257.502-.392a14.2 14.2 0 0 0 12.036 0c.164.135.332.266.502.392-.654.386-1.343.714-2.052.98.376.743.812 1.452 1.302 2.12a19.86 19.86 0 0 0 6.075-3.058c.546-5.21-.93-9.728-3.93-13.73ZM9.682 15.33c-1.182 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.097 2.157 2.42 0 1.334-.955 2.42-2.157 2.42Zm4.636 0c-1.182 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.097 2.157 2.42 0 1.334-.946 2.42-2.157 2.42Z"/></svg></a>
<span class="tb-funds" id="tbFunds" hidden><span class="tb-funds__l">Funds</span><span class="tb-funds__v" id="tbFundsV">—</span></span>
<span class="tb-actions" id="tbActions">Party Actions: 3 Available</span>
<span class="tb-date"><span class="tb-date__l">Date</span><span class="tb-date__v" id="tbDate">January, 1980</span></span>
<span class="tb-next"><span class="tb-next__l">Next Month</span><span class="tb-next__v">Not Running</span></span>
<div class="tb-gear">
  <button class="gear" id="gearBtn" type="button" aria-label="Settings" aria-haspopup="true" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
  <div class="gearmenu" id="gearMenu" hidden>
    <div id="gearMain">
      <button class="gearmenu__item gearmenu__item--danger" id="delPartyBtn" type="button">Delete Party</button>
    </div>
    <div id="gearConfirm" hidden>
      <p class="gearmenu__warn" id="gearWarn">Delete your party? This permanently removes your seats, politicians, and funds. This can&rsquo;t be undone.</p>
      <div class="gearmenu__row">
        <button class="gearmenu__btn gearmenu__btn--danger" id="delYes" type="button">Yes, delete</button>
        <button class="gearmenu__btn" id="delNo" type="button">Cancel</button>
      </div>
    </div>
  </div>
</div>
`;

// Inject the styles once, fill #topbar with the markup, and wire the gear menu.
export function mountTopbar(){
  if (!document.getElementById('tb-style')) {
    const s = document.createElement('style');
    s.id = 'tb-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  const host = document.getElementById('topbar');
  if (host) host.innerHTML = HTML;
  wireDeletePartyMenu();   // settings gear → Delete Party (shared; see supabase.js)

  // The game date is owned here — one source, read straight from the live tick.
  // Re-pull it whenever the page is (re)shown so it never goes stale after a tick
  // advances elsewhere: on first mount, on bfcache restore (back/forward), and
  // when a backgrounded tab is refocused.
  refreshTopbarDate();
  window.addEventListener('pageshow', refreshTopbarDate);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshTopbarDate(); });
}

export async function refreshTopbarDate(){
  try { setTopbarDate(tickToDate(await currentTick())); } catch (e) { /* keep the last shown date */ }
}

// Live-value setters — no-ops if the topbar isn't mounted on this page.
export function setTopbarActions(n){
  const el = document.getElementById('tbActions');
  if (el) el.textContent = 'Party Actions: ' + (n != null ? n : 3) + ' Available'; // 3 = the default budget, matching the static markup
}
export function setTopbarFunds(currency, funds){
  const v = document.getElementById('tbFundsV');
  if (v) v.textContent = (currency || '$') + fmtFunds(funds);
  const f = document.getElementById('tbFunds');
  if (f) f.hidden = false;
}
export function setTopbarDate(dateStr){
  const el = document.getElementById('tbDate');
  if (el) el.textContent = dateStr;
}
