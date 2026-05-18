// ─── Chief-of-Staff Report — Pressing Issues consumer (Phase 2) ────
//
// Renders army Chief-of-Staff reports into a Pressing Issues sub-host
// alongside (but separate from) the petition card. Mirrors
// petition-pressing-issues.js: injected styles, a mount that returns
// { refresh }, an onChange hook so the host page can own the combined
// empty state. The gated read RPC (get_cos_reports) is the security
// boundary — the confidential body never reaches an unauthorised
// party; this module only renders what the RPC returns.

import { escapeHtml } from './utils.js';

let _stylesInjected = false;
function injectStylesOnce() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const el = document.createElement('style');
  el.id = 'cosr-styles';
  el.textContent = `
.cosr-card { background:#0c1115; border:0.5px solid rgba(122,154,171,0.22); border-left:2px solid #7a9aab; border-radius:4px; padding:13px 16px; margin-bottom:8px; font-family:var(--font-mono,monospace); }
.cosr-top { display:flex; align-items:flex-start; gap:10px; }
.cosr-head { flex:1; font-size:12px; color:#c8d4dc; line-height:1.55; }
.cosr-head .nm { color:#fff; font-weight:600; }
.cosr-badge { font-size:8px; font-weight:700; letter-spacing:0.12em; padding:2px 6px; border-radius:2px; text-transform:uppercase; white-space:nowrap; }
.cosr-badge.pub { color:#9eb87a; background:rgba(158,184,122,0.12); border:0.5px solid rgba(158,184,122,0.3); }
.cosr-badge.res { color:#7a9aab; background:rgba(122,154,171,0.12); border:0.5px solid rgba(122,154,171,0.3); }
.cosr-actions { display:flex; align-items:center; gap:8px; margin-top:10px; }
.cosr-btn { font-family:var(--font-mono,monospace); font-size:9px; font-weight:700; letter-spacing:0.08em; padding:5px 12px; border-radius:2px; cursor:pointer; text-transform:uppercase; }
.cosr-btn.read { color:#c8d4dc; border:0.5px solid rgba(122,154,171,0.4); background:rgba(122,154,171,0.08); }
.cosr-btn.ack { color:#888; border:0.5px solid rgba(255,255,255,0.15); background:transparent; }
.cosr-btn[disabled] { opacity:0.5; pointer-events:none; }
.cosr-locked { font-size:10px; color:#7a9aab; font-style:italic; margin-top:8px; }
.cosr-detail { margin-top:10px; padding-top:10px; border-top:0.5px solid rgba(122,154,171,0.15); display:none; }
.cosr-detail.open { display:block; }
.cosr-body { font-family:Georgia,'Times New Roman',serif; font-size:13px; line-height:1.6; color:#d8d8d8; white-space:pre-wrap; }
.cosr-snap { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:12px; }
.cosr-snap .c { background:#121518; border:0.5px solid rgba(122,154,171,0.15); border-radius:3px; padding:7px 9px; }
.cosr-snap .c .k { font-size:8px; color:#7a9aab; letter-spacing:0.08em; text-transform:uppercase; }
.cosr-snap .c .v { font-size:14px; font-weight:600; color:#fff; margin-top:2px; }
`;
  document.head.appendChild(el);
}

const SNAP_ROWS = [
  ['manpower', 'Manpower'], ['officer_corps', 'Officer Corps'], ['training', 'Training'],
  ['equipment', 'Equipment'], ['cohesion', 'Cohesion'], ['professionalism', 'Professionalism'],
  ['logistics', 'Logistics'], ['supplies', 'Supplies'],
];

export function mountCosReportPressingIssues({
  supabase, faction, nation, host, currentTick = () => 0, onChange = null,
}) {
  if (!host) return { refresh: async () => {}, getCount: () => 0 };
  injectStylesOnce();

  let reports = [];
  let inflight = false;
  const expanded = new Set();

  function card(r) {
    const minister = r.minister_name
      ? `Defense Minister <span class="nm">${escapeHtml(r.minister_name)}</span>`
      : 'the Defense Minister';
    // faction_name already encodes "{branch} of {nation}" (e.g.
    // "Army of Avelia"), so it is NOT followed by " of {nation_name}"
    // — that produced "Army of Avelia of Avelia". Consistent with the
    // join/resign events, which also use faction_name alone.
    const headline = `The <span class="nm">${escapeHtml(r.chief_name || 'Chief of Staff')}</span> of `
      + `<span class="nm">${escapeHtml(r.faction_name || 'the Army')}</span> has filed a report for `
      + `${escapeHtml(String(r.report_year || ''))} to ${minister}.`;
    const badge = r.is_public
      ? `<span class="cosr-badge pub">Public</span>`
      : `<span class="cosr-badge res">Restricted</span>`;

    let detail = '';
    if (r.can_read && (expanded.has(r.id))) {
      const snap = r.stat_snapshot || {};
      const cells = SNAP_ROWS.map(([k, lbl]) => {
        const v = snap[k];
        const shown = (v === null || v === undefined) ? '—' : Number(v).toLocaleString();
        return `<div class="c"><div class="k">${escapeHtml(lbl)}</div><div class="v">${shown}</div></div>`;
      }).join('');
      detail = `<div class="cosr-detail open">
        <div class="cosr-body">${escapeHtml(r.body || '')}</div>
        <div class="cosr-snap">${cells}</div>
      </div>`;
    }

    const readBtn = r.can_read
      ? `<span class="cosr-btn read" data-cosr="toggle" data-id="${escapeHtml(r.id)}">${expanded.has(r.id) ? 'Hide report' : 'Read report'}</span>`
      : '';
    const locked = r.can_read ? '' :
      `<div class="cosr-locked">Restricted — only the party controlling the Defense ministry may read this report.</div>`;

    return `<div class="cosr-card">
      <div class="cosr-top">
        <div class="cosr-head">${headline}</div>
        ${badge}
      </div>
      ${locked}
      ${detail}
      <div class="cosr-actions">
        ${readBtn}
        <span class="cosr-btn ack" data-cosr="ack" data-id="${escapeHtml(r.id)}">Acknowledged</span>
      </div>
    </div>`;
  }

  function render() {
    host.innerHTML = reports.length ? reports.map(card).join('') : '';
    if (typeof onChange === 'function') {
      try { onChange(reports.length); } catch (e) { console.warn('[cos-report] onChange threw:', e?.message || e); }
    }
  }

  async function refresh() {
    try {
      const { data, error } = await supabase.rpc('get_cos_reports', {
        p_nation_id: nation?.id,
        p_faction_id: faction?.id,
      });
      if (error) { console.warn('[cos-report] load failed:', error.message); reports = []; }
      else if (data && data.success === false) { console.warn('[cos-report] rpc:', data.error); reports = []; }
      else reports = Array.isArray(data?.reports) ? data.reports : [];
    } catch (e) {
      console.warn('[cos-report] load threw:', e?.message || e); reports = [];
    }
    render();
  }

  host.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-cosr]');
    if (!el) return;
    const id = el.dataset.id;
    const act = el.getAttribute('data-cosr');
    if (act === 'toggle') {
      if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
      render();
      return;
    }
    if (act === 'ack') {
      if (inflight) return;
      inflight = true;
      el.setAttribute('disabled', 'true');
      try {
        const { data, error } = await supabase.rpc('acknowledge_chief_of_staff_report', {
          p_report_id: id,
          p_faction_id: faction?.id,
        });
        if (error) { alert('Could not acknowledge: ' + error.message); return; }
        if (data && data.success === false) { alert(data.error || 'Could not acknowledge.'); return; }
        await refresh();
      } finally {
        inflight = false;
      }
    }
  });

  refresh();

  return { refresh, getCount: () => reports.length };
}
