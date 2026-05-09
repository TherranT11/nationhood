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
