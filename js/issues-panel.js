// issues-panel.js — shared "Issues" panel.
//
// One source of truth for the player's nation's ongoing bilateral issues,
// rendered identically on the Army → Operations → "Issues" subtab and the
// World → Diplomacy "Issues" section. Both call mountIssuesPanel(), so they
// never diverge. The data is bilateral_issues (the same rows conflicts.html
// works from); "ongoing" = status active / partial / escalated involving the
// nation. None ongoing → "No ongoing issues".

import { escapeHtml } from './utils.js';

const ISSUE_TYPE_NAMES = {
  maritime_fishing_rights: 'Maritime Fishing Rights',
  territorial_ownership:   'Territorial Ownership Dispute',
  chronic_trade_imbalance: 'Chronic Trade Imbalance',
};

function tensionInfo(tension) {
  const t = Number(tension) || 0;
  if (t <= 2) return { label: 'Low',      cls: 'low'  };
  if (t <= 5) return { label: 'Moderate', cls: 'mod'  };
  if (t <= 8) return { label: 'High',     cls: 'high' };
  return { label: 'Critical', cls: 'crit' };
}

// Active/partial/escalated issues involving this nation, hottest first.
export async function fetchOngoingIssues(supabase, nationId) {
  if (!supabase || !nationId) return [];
  const { data, error } = await supabase
    .from('bilateral_issues')
    .select('id, issue_type, tension, status, nation_a_id, nation_b_id, '
          + 'nation_a:nations!bilateral_issues_nation_a_id_fkey(id, name), '
          + 'nation_b:nations!bilateral_issues_nation_b_id_fkey(id, name)')
    .or(`nation_a_id.eq.${nationId},nation_b_id.eq.${nationId}`)
    .in('status', ['active', 'partial', 'escalated'])
    .order('tension', { ascending: false });
  if (error) { console.warn('[issues-panel] fetch failed:', error.message); return []; }
  return data || [];
}

function issueRow(issue, nationId) {
  const t = tensionInfo(issue.tension);
  const other = issue.nation_a_id === nationId ? issue.nation_b?.name : issue.nation_a?.name;
  const typeName = ISSUE_TYPE_NAMES[issue.issue_type] || issue.issue_type;
  return `<div class="issues-row">
    <span class="issues-row__title">${escapeHtml(typeName)}</span>
    <span class="issues-row__nation">${escapeHtml(other || 'Unknown')}</span>
    <span class="issues-tension issues-tension--${t.cls}">${escapeHtml(t.label)}</span>
  </div>`;
}

function ensureStyles() {
  if (document.getElementById('issues-panel-styles')) return;
  const s = document.createElement('style');
  s.id = 'issues-panel-styles';
  s.textContent = `
    .issues-panel__head { font-family: var(--font-mono, monospace); font-size: 13px; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-bright, #f0efe6); margin-bottom: 12px; }
    .issues-panel__body { background: var(--bg-card, #1a1a17); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; }
    .issues-empty { padding: 30px 22px; text-align: center; font-family: var(--font-mono, monospace);
      font-size: 12px; color: rgba(255,255,255,0.34); }
    .issues-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06); font-family: var(--font-mono, monospace); font-size: 12px; }
    .issues-row:last-child { border-bottom: 0; }
    .issues-row__title { color: var(--text-bright, #f0efe6); font-weight: 600; }
    .issues-row__nation { color: rgba(255,255,255,0.5); flex: 1; }
    .issues-tension { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; }
    .issues-tension--low  { color: #6fae84; background: rgba(111,174,132,0.12); }
    .issues-tension--mod  { color: #cdaa3a; background: rgba(205,170,58,0.12); }
    .issues-tension--high { color: #cf8a4f; background: rgba(207,138,79,0.14); }
    .issues-tension--crit { color: #cf6b66; background: rgba(207,107,102,0.16); }
  `;
  document.head.appendChild(s);
}

// Render the panel into `host`. opts.heading: the section header text
// ("I. Issues"); pass null/'' to omit it (e.g. where a page title already
// names the section). nationId is needed to label the "other" nation.
export function renderIssuesPanel(host, issues, nationId, opts = {}) {
  if (!host) return;
  ensureStyles();
  const list = Array.isArray(issues) ? issues : [];
  const heading = opts.heading === undefined ? 'I. Issues' : opts.heading;
  const body = list.length
    ? list.map(it => issueRow(it, nationId)).join('')
    : '<div class="issues-empty">No ongoing issues</div>';
  host.innerHTML = `<section class="issues-panel">
      ${heading ? `<div class="issues-panel__head">${escapeHtml(heading)}</div>` : ''}
      <div class="issues-panel__body">${body}</div>
    </section>`;
}

// Fetch + render in one call. Both pages use this so they stay in lockstep.
export async function mountIssuesPanel(supabase, nationId, host, opts = {}) {
  if (!host) return;
  const issues = await fetchOngoingIssues(supabase, nationId);
  renderIssuesPanel(host, issues, nationId, opts);
}
