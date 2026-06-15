/**
 * world-org-sectors.js — the five World Organization category sectors.
 *
 * ONE source for both surfaces that show them: the read-only list on the
 * nations page (politician-nation.html) and the Foreign Affairs & Trade
 * minister's management page (world-organizations.html). Add/rename a sector
 * here and both pages follow.
 *
 * No organizations backend exists yet, so every sector renders 0/0. When one
 * lands, give worldOrgSectorsHtml() the per-sector data then. The consuming
 * page must carry the .wo-cat CSS.
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

/** Render the five sectors as collapsible .wo-cat cards — empty (0/0) for now. */
export function worldOrgSectorsHtml() {
  return WORLD_ORG_SECTORS.map((s) => `
    <details class="wo-cat" style="--wo-accent:${s.accent};">
      <summary>
        <span class="wo-cat-left"><span class="wo-cat-ico">${s.icon}</span><span class="wo-cat-name">${_esc(s.name)}</span></span>
        <span class="wo-cat-meta"><b>0 Organizations</b> representing 0 nations</span>
      </summary>
      <div class="wo-cat-body"><div class="sec-empty">No organizations in this sector yet.</div></div>
    </details>`).join('');
}
