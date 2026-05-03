/**
 * platform-promises.js — Platform promise tracking & evaluation.
 *
 * When a party adopts a platform, stat baselines are locked. If the party
 * enters government, they have 24 ticks to move each promised "improve" stat
 * by +20 (or -20 for bad stats). Failure: -20 momentum, -10 governance.
 *
 * Edge cases:
 *   - Elected and stat dropped below adoption baseline: target recalculates
 *     from current value at election time (baseline + 20 from wherever it is).
 *   - Elected and stat already above target: promise abated (already fulfilled).
 *   - Not elected: promise abated, no penalty.
 *
 * This module provides:
 *   - recalculateTargetsOnElection() — called when party enters government
 *   - evaluatePromises() — called per-tick or at administration end
 *   - getPromiseProgress() — UI helper for displaying progress bars
 */

import { PLATFORMS, BAD_STATS } from './platforms.js';

// Halved from 20 in 20260727 — sector-popularity bumps are now the
// headline reward; the stat-promise grind is a lighter secondary.
const PROMISE_DELTA = 10;
const PROMISE_DEADLINE_TICKS = 24;
// Failure now reverts the platform's popularity boosts (full magnitude)
// via _apply_platform_sector_effects(... 'fail') instead of docking
// momentum. Penalties applied at adoption stay — alienated voters
// don't reconcile because the party failed to deliver.

/**
 * Recalculate promise targets when a party enters government.
 * Called from createAdministration() or equivalent.
 *
 * For each platform the party holds:
 *   - If current stat is already past the original target → status = 'abated'
 *   - Otherwise, new target = current stat value + PROMISE_DELTA
 *   - deadline_tick = current_tick + PROMISE_DEADLINE_TICKS
 *
 * @param {object} supabase
 * @param {string} factionId
 * @param {object} nation — full nation row with current stats
 * @param {number} currentTick
 * @returns {Array} updated platform records
 */
export async function recalculateTargetsOnElection(supabase, factionId, nation, currentTick) {
    const { data: platforms, error } = await supabase
        .from('faction_platforms')
        .select('*')
        .eq('faction_id', factionId)
        .eq('status', 'active');

    if (error || !platforms || platforms.length === 0) return [];

    const results = [];

    for (const fp of platforms) {
        const platformDef = PLATFORMS.find(p => p.id === fp.platform_key);
        if (!platformDef) continue;

        const newBaseline = {};
        const newTargets = {};
        let allAbated = true;

        for (const stat of platformDef.improve) {
            const currentVal = Number(nation[stat] ?? 50);
            const originalTarget = fp.target_stats?.[stat];
            const isBad = BAD_STATS.has(stat);

            // Check if already fulfilled (stat already past target)
            if (originalTarget != null) {
                const fulfilled = isBad ? (currentVal <= originalTarget) : (currentVal >= originalTarget);
                if (fulfilled) {
                    // Already past target — abated for this stat
                    newBaseline[stat] = currentVal;
                    newTargets[stat] = currentVal; // target = current (already met)
                    continue;
                }
            }

            // Recalculate: target = current value +/- PROMISE_DELTA
            newBaseline[stat] = currentVal;
            if (isBad) {
                newTargets[stat] = Math.max(0, currentVal - PROMISE_DELTA);
            } else {
                newTargets[stat] = Math.min(100, currentVal + PROMISE_DELTA);
            }
            allAbated = false;
        }

        const newStatus = allAbated ? 'abated' : 'active';

        const { error: updateErr } = await supabase
            .from('faction_platforms')
            .update({
                baseline_stats: newBaseline,
                target_stats: newTargets,
                status: newStatus,
            })
            .eq('id', fp.id);

        if (updateErr) {
            console.error(`[platform-promises] Failed to update platform ${fp.id}:`, updateErr.message);
        }

        results.push({ ...fp, baseline_stats: newBaseline, target_stats: newTargets, status: newStatus });
    }

    return results;
}

/**
 * Evaluate all active platform promises for a nation.
 * Called per-tick from the tick processor.
 *
 * Checks each governing party's platforms:
 *   - If all improve stats meet targets → status = 'fulfilled'
 *   - If deadline passed and targets not met → status = 'failed', apply penalties
 *   - Otherwise → still active
 *
 * @param {object} supabase
 * @param {object} nation — full nation row with current stats
 * @param {number} currentTick
 * @param {Array} governingFactionIds — faction IDs currently in government
 * @returns {Array} evaluation results
 */
export async function evaluatePromises(supabase, nation, currentTick, governingFactionIds) {
    if (!governingFactionIds || governingFactionIds.length === 0) return [];

    const { data: platforms, error } = await supabase
        .from('faction_platforms')
        .select('*')
        .in('faction_id', governingFactionIds)
        .eq('status', 'active');

    if (error || !platforms || platforms.length === 0) return [];

    const results = [];

    for (const fp of platforms) {
        const platformDef = PLATFORMS.find(p => p.id === fp.platform_key);
        if (!platformDef) continue;

        const ticksSinceAdoption = currentTick - (fp.adopted_at_tick || 0);
        const deadlineReached = ticksSinceAdoption >= PROMISE_DEADLINE_TICKS;

        let allMet = true;
        let anyTracked = false;

        for (const stat of platformDef.improve) {
            const target = fp.target_stats?.[stat];
            if (target == null) continue;

            const currentVal = Number(nation[stat] ?? 50);
            const isBad = BAD_STATS.has(stat);
            const met = isBad ? (currentVal <= target) : (currentVal >= target);

            if (!met) allMet = false;
            anyTracked = true;
        }

        if (!anyTracked) continue;

        if (allMet) {
            // All targets met — fulfilled
            await supabase.from('faction_platforms').update({ status: 'fulfilled' }).eq('id', fp.id);
            results.push({ factionId: fp.faction_id, platformKey: fp.platform_key, status: 'fulfilled' });
        } else if (deadlineReached) {
            // Deadline passed, targets not met — failed.
            // Per 20260727 design change: revert the platform's sector-
            // popularity boosts at full magnitude; penalties stay.
            // Replaces the previous −20 momentum / −10 governance hits.
            await supabase.from('faction_platforms').update({ status: 'failed' }).eq('id', fp.id);

            // popularity_applied gates the revert: only platforms whose
            // adoption actually fired the popularity bumps can have them
            // reverted. Pre-migration in-flight platforms (adopted
            // before 20260727) have popularity_applied=false and skip
            // the revert — the boost was never granted, so docking it
            // would unfairly reduce blocs the player never courted.
            if (fp.popularity_applied) {
                const { error: revertErr } = await supabase.rpc('_apply_platform_sector_effects', {
                    p_faction_id:   fp.faction_id,
                    p_nation_id:    fp.nation_id,
                    p_platform_key: fp.platform_key,
                    p_mode:         'fail',
                });
                if (revertErr) {
                    console.warn('[platform-promises] popularity-revert RPC failed for', fp.platform_key, ':', revertErr.message);
                }
            }

            results.push({ factionId: fp.faction_id, platformKey: fp.platform_key, status: 'failed' });
        }
    }

    return results;
}

/**
 * Abate all active promises for parties not in government.
 * Called when an administration ends or a party leaves the coalition.
 *
 * @param {object} supabase
 * @param {string} factionId
 */
export async function abatePromises(supabase, factionId) {
    const { error } = await supabase
        .from('faction_platforms')
        .update({ status: 'abated' })
        .eq('faction_id', factionId)
        .eq('status', 'active');

    if (error) console.error(`[platform-promises] Failed to abate promises for ${factionId}:`, error.message);
}

/**
 * Get promise progress for UI display.
 * Returns progress info for each stat in each active platform.
 *
 * @param {Array} myPlatforms — faction_platforms rows for this faction
 * @param {object} nation — current nation stats
 * @returns {Array} platform progress objects
 */
export function getPromiseProgress(myPlatforms, nation) {
    return myPlatforms.map(fp => {
        const platformDef = PLATFORMS.find(p => p.id === fp.platform_key);
        if (!platformDef) return { ...fp, stats: [] };

        const stats = platformDef.improve.map(stat => {
            const baseline = fp.baseline_stats?.[stat];
            const target = fp.target_stats?.[stat];
            const current = Number(nation?.[stat] ?? 50);
            const isBad = BAD_STATS.has(stat);

            if (baseline == null || target == null) {
                return { stat, baseline: current, target: current, current, progress: 0, met: false };
            }

            const total = Math.abs(target - baseline);
            const moved = isBad
                ? Math.max(0, baseline - current)    // for bad stats, decrease is progress
                : Math.max(0, current - baseline);   // for good stats, increase is progress
            const progress = total > 0 ? Math.min(1, moved / total) : 1;
            const met = isBad ? (current <= target) : (current >= target);

            return { stat, baseline, target, current, progress, met };
        });

        return { ...fp, stats, platformDef };
    });
}
