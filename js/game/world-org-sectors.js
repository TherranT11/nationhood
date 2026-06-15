/**
 * world-org-sectors.js — the five World Organization category sectors.
 *
 * ONE source for both surfaces that show them: the read-only list on the
 * nations page (politician-nation.html) and the Foreign Affairs & Trade
 * minister's management page (world-organizations.html). Add/rename a sector
 * here and both pages follow.
 *
 * No organizations exist yet, so the counts render 0/0 until orgsBySector is
 * populated. The consuming page must carry the .wo-cat CSS.
 */
export const WORLD_ORG_SECTORS = [
  { key: 'universal_political',  name: 'Universal & Political',  icon: '☰', accent: '#5b8def' },
  { key: 'economic_financial',   name: 'Economic & Financial',   icon: '▦', accent: '#c79a3a' },
  { key: 'trade_commerce',       name: 'Trade & Commerce',       icon: '⇄', accent: '#4f9d5a' },
  { key: 'security_defense',     name: 'Security & Defense',     icon: '⚔', accent: '#b5564a' },
  { key: 'technical_functional', name: 'Technical & Functional', icon: '⚙', accent: '#3a9d9d' },
];

const _esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Render the five sectors as collapsible .wo-cat cards.
 * @param {Object<string, Array<{name:string, member_count?:number}>>} orgsBySector
 *        sector key → its organizations. Absent/empty ⇒ "0 Organizations
 *        representing 0 nations" and an empty body.
 */
export function worldOrgSectorsHtml(orgsBySector = {}) {
  return WORLD_ORG_SECTORS.map((s) => {
    const orgs    = orgsBySector[s.key] || [];
    const nations = orgs.reduce((n, o) => n + (Number(o.member_count) || 0), 0);
    const body = orgs.length
      ? orgs.map((o) => `<div class="wo-org">${_esc(o.name)}</div>`).join('')
      : '<div class="sec-empty">No organizations in this sector yet.</div>';
    return `<details class="wo-cat" style="--wo-accent:${s.accent};">
      <summary>
        <span class="wo-cat-left"><span class="wo-cat-ico">${s.icon}</span><span class="wo-cat-name">${_esc(s.name)}</span></span>
        <span class="wo-cat-meta"><b>${orgs.length} Organization${orgs.length === 1 ? '' : 's'}</b> representing ${nations} nation${nations === 1 ? '' : 's'}</span>
      </summary>
      <div class="wo-cat-body">${body}</div>
    </details>`;
  }).join('');
}
