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
  { key: 'diplomatic_political', name: 'Diplomatic & Political', icon: '♔', accent: '#5b8def', desc: 'Consultation, mediation, alignment among states.' },
  { key: 'economic_financial',   name: 'Economic & Financial',   icon: '$', accent: '#c79a3a', desc: 'Monetary, fiscal, development, lending bodies.' },
  { key: 'trade_commerce',       name: 'Trade & Commerce',       icon: '⇄', accent: '#4f9d5a', desc: 'Tariffs, customs, market access, supply chains.' },
  { key: 'security_defense',     name: 'Security & Defense',     icon: '⚔', accent: '#b5564a', desc: 'Mutual defense pacts, intelligence-sharing, joint command.' },
  { key: 'technical_functional', name: 'Technical & Functional', icon: '⚙', accent: '#3a9d9d', desc: 'Standards, regulation, science, health, transport.' },
];

const _esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Shared access gate for the world-organization surfaces (management page and
 * the founding form): the dedicated Foreign Minister post
 * (politician_foreign_minister_at_tick) or the nation's Head of Government may
 * manage/found. ONE place the rule lives; pages own their locked/error UI.
 * Nothing is written client-side yet — when a founding RPC lands it must
 * re-check this server-side.
 */
export async function worldOrgAccess(supabase, nation, faction) {
  const isFM = faction?.politician_foreign_minister_at_tick != null;
  const { data: hog, error: hogErr } = await supabase.from('head_of_government')
    .select('faction_id').eq('nation_id', nation?.id).eq('active', true).maybeSingle();
  const isPM = !!hog && hog.faction_id === faction?.id;
  return { isFM, isPM, allowed: isFM || isPM, hogErr };
}

/**
 * Fetch the world organizations a nation belongs to and group them by sector
 * key. ONE place the read query + shaping live, so the management page and the
 * nations page can't drift. Returns { bySector, error }.
 */
export async function fetchNationOrgs(supabase, nationId) {
  if (!nationId) return { bySector: {}, error: null };
  try {
    const { data, error } = await supabase.from('world_organizations')
      .select('category, name, abbreviation, purpose, status, member_nation_ids')
      .contains('member_nation_ids', [nationId]);
    if (error) return { bySector: {}, error };
    const bySector = {};
    for (const o of (data || [])) {
      (bySector[o.category] ||= []).push({
        name: o.name, abbreviation: o.abbreviation, purpose: o.purpose, status: o.status,
        member_count: (o.member_nation_ids || []).length,
      });
    }
    return { bySector, error: null };
  } catch (error) {
    return { bySector: {}, error };
  }
}

/**
 * Render the five sectors as collapsible .wo-cat cards. `bySector` maps a
 * sector key → its orgs (from fetchNationOrgs); absent/empty ⇒ 0/0 and an
 * empty body. The consuming page must carry the .wo-cat and .wo-org CSS.
 */
export function worldOrgSectorsHtml(bySector = {}) {
  return WORLD_ORG_SECTORS.map((s) => {
    const orgs    = bySector[s.key] || [];
    const nations = orgs.reduce((n, o) => n + (Number(o.member_count) || 0), 0);
    const body = orgs.length
      ? orgs.map((o) => `<div class="wo-org"${o.purpose ? ` title="${_esc(o.purpose)}"` : ''}><span class="wo-org-nm">${_esc(o.name)}`
          + `${o.abbreviation ? ` <span class="wo-org-ab">${_esc(o.abbreviation)}</span>` : ''}</span>`
          + `${o.status === 'forming' ? '<span class="wo-org-st">Forming</span>' : ''}</div>`).join('')
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
