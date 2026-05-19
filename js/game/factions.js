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
 *   2. unassigned  — faction has no nation_id (detached / never seeded);
 *                    entrepreneurs are exempt — they are nation-agnostic
 *                    by design and always have nation_id = null
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
    // Entrepreneurs are nation-agnostic by design (created with
    // nation_id = null); a missing nation_id is not "unassigned" for them.
    if (!f.nation_id && f.faction_type !== 'entrepreneur') return 'unassigned';
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
    if (factionType === 'corporation')  return { label: 'CORP',  color: 'var(--teal)'   };
    if (factionType === 'military')     return { label: 'MIL',   color: 'var(--red)'    };
    if (factionType === 'entrepreneur') return { label: 'ENTR',  color: 'var(--purple)' };
    return                                     { label: 'PARTY', color: 'var(--amber)'  };
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
    if (faction.faction_type === 'entrepreneur') return 'entrepreneur-dashboard.html';
    return null;
}

/**
 * Entrepreneur archetypes — single source of truth for the setup
 * archetype page. The player picks one; its fixed stat block + starting
 * cash are written to the new factions columns. Total is always the sum
 * of the four stats, derived wherever shown (never stored).
 */
export const ENTREPRENEUR_ARCHETYPES = Object.freeze({
    heir: {
        name: 'THE HEIR',
        quote: "You didn't build this. Your father did. Now it's yours to keep or lose.",
        description: "Inherited a substantial position. Comes with money and a name, but the field doesn't yet know whether you're worth your inheritance. Trusted because of who you are, doubted for the same reason.",
        stats: { ambition: 6, cunning: 4, reputation: 18, vision: 8 },
        startingCash: 95000000,
    },
    founder: {
        name: 'THE FOUNDER',
        quote: 'You built one thing well. Whether you can build another is the open question.',
        description: 'Sold a successful business and now have capital to deploy but no platform. Modest reputation among insiders, unknown to the public. You know how to make things; whether you know how to make more things is untested.',
        stats: { ambition: 16, cunning: 8, reputation: 10, vision: 14 },
        startingCash: 48000000,
    },
});
