/**
 * factions.js — Single source of truth for "is this faction inactive?"
 *
 * Before this module the check was inlined in 5+ places as
 * `f.nation_id && !f.abandoned_at`. The impeachment trigger needed
 * a third signal (is_banned), and we don't want each caller to
 * diverge on which flags count. One helper, one definition.
 *
 * Inactivity tiers (in priority order):
 *   1. abandoned   — player explicitly disbanded the faction
 *   2. unassigned  — faction has no nation_id (detached / never seeded)
 *   3. banned      — admin-banned via factions.is_banned
 *
 * If you only need a boolean, use isFactionInactive(f). If you need
 * to surface WHY (e.g., for a UI label), use getFactionInactiveReason(f).
 */

/**
 * Returns one of 'abandoned' | 'unassigned' | 'banned' | null.
 * null means the faction is structurally active.
 */
export function getFactionInactiveReason(f) {
    if (!f) return null;
    if (f.abandoned_at) return 'abandoned';
    if (!f.nation_id)   return 'unassigned';
    if (f.is_banned)    return 'banned';
    return null;
}

/**
 * Boolean convenience wrapper around getFactionInactiveReason.
 * True iff the faction is in any inactive state.
 */
export function isFactionInactive(f) {
    return getFactionInactiveReason(f) !== null;
}

/**
 * Branch → dashboard URL for military factions. Add entries as new
 * branch dashboards land. Importers should look up by faction.branch
 * and fall back gracefully if the entry is missing.
 */
export const BRANCH_DASHBOARDS = {
    army: 'army-dashboard.html',
};

/**
 * Branch key → uppercase display label for badges and headers
 * ("army" → "ARMY", "air_force" → "AIR FORCE"). Fallback handles any
 * future branch keys by upper-casing and converting underscores.
 */
export function getBranchDisplayLabel(branch) {
    if (branch === 'army')      return 'ARMY';
    if (branch === 'navy')      return 'NAVY';
    if (branch === 'air_force') return 'AIR FORCE';
    return (branch || '').toUpperCase().replace(/_/g, ' ');
}

/**
 * Badge label + color for a faction_type, used by the faction switcher
 * dropdowns in every topbar. Single source so adding or renaming a type
 * doesn't require touching every renderer.
 */
export function getFactionTypeBadge(factionType) {
    if (factionType === 'corporation') return { label: 'CORP',  color: 'var(--teal)'  };
    if (factionType === 'military')    return { label: 'MIL',   color: 'var(--red)'   };
    return                                    { label: 'PARTY', color: 'var(--amber)' };
}

/**
 * Dashboard URL for a faction the player is switching INTO from a faction
 * switcher dropdown. Returns null for unknown types so each caller can
 * apply its own home-page fallback (party pages default to dashboard.html,
 * corp pages to corp-dashboard.html). Military factions whose branch has
 * no dashboard yet (navy, air_force) route to faction-select.html so the
 * player isn't stranded.
 */
export function getFactionDashboardUrl(faction) {
    if (!faction) return null;
    if (faction.faction_type === 'corporation') return 'corp-dashboard.html';
    if (faction.faction_type === 'party')       return 'dashboard.html';
    if (faction.faction_type === 'military') {
        return BRANCH_DASHBOARDS[faction.branch] || 'faction-select.html';
    }
    return null;
}
