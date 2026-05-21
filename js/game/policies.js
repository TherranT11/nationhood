/**
 * policies.js — Target-based policy engine
 *
 * Per-tick processor for the target-based policy model introduced in the
 * Target-Based Policies Phase 1–4 work. Reads active_laws joined to
 * policy_options where is_target_based = TRUE, computes per-stat weighted
 * equilibria, and converges the actual nation column toward each
 * equilibrium each tick.
 *
 * Sector rapport effects are NOT processed here. They were originally a
 * per-tick accumulator on the proposing faction, but that produced
 * runaway popularity (every law eventually pinned every party at 0 or
 * max). The model is now a one-shot delta applied by
 * applyOptionRapportToVoters() in bills.js: YES voters move toward the
 * option's standing and NO voters away from it, at full magnitude on a
 * pass (enactBill) and reduced on a fail (processSectorShifts).
 *
 * Coexists with the legacy rate/duration model in
 * buildPolicyDecayAdjustments + processStatDecay — only options whose
 * is_target_based flag is TRUE hit this path. Legacy options pass through
 * the existing pipeline unchanged.
 *
 * The edge-function bundler concatenates this module after stats.js
 * (which exports normalizeNationStatKey, NATION_STAT_COLUMN_SET,
 * STAT_PROCESSOR_SKIP), so those symbols are in scope at sync time.
 * Imports declared here are stripped by scripts/sync-edge-function.js.
 */

import { normalizeNationStatKey, NATION_STAT_COLUMN_SET } from './stats.js';
import { STAT_PROCESSOR_SKIP, nationStatCap } from './diplomacy-constants.js';

// ════════════════════════════════════════════════════════════════
// Target-based policies — per-tick processor.
//
// For every nation, gather every active_laws row whose chosen
// policy_options.is_target_based = TRUE. For each per-stat target
// across those options, compute the weighted equilibrium
//
//     equilibrium = Σ(target × pull) / Σ(pull)         (0–100 scale)
//
// then converge the actual nation stat toward equilibrium at a
// global rate (10% of the remaining gap per tick). Pull is the
// weight in the equilibrium math; the convergence rate is a global
// constant for legibility — "primary driver" pull means dominant
// influence on the equilibrium, not faster speed.
//
// Target and the nation stat columns share the 0–100 scale. The
// previous 0–10 displayed-target convention was retired because
// authors think in stat values they actually see in-game.
//
// Skips stats not in NATION_STAT_COLUMN_SET, stats in
// STAT_PROCESSOR_SKIP (debt), and raw-scale stats that don't
// map sensibly onto a 0–10 target (population, eligible_voters,
// budget).
//
// Interaction with legacy floor/ceiling adjustments
// (buildPolicyDecayAdjustments → processStatDecay): floor and
// ceiling are decay-only concepts — they bound how far decay can
// push a stat each tick, not where the stat eventually sits.
// A target-based pull toward 30 will drag a stat below a legacy
// floor of 50 because pull and floor are separate systems. That's
// intentional. If you need a hard floor that target-based respects,
// re-author the policy as target-based with a target ≥ floor.
// ════════════════════════════════════════════════════════════════

export const TARGET_CONVERGENCE_RATE = 0.10;

// Stats whose column values are raw (population, debt, budget) don't map
// onto a 0–10 target. The policy builder lets admins pick them anyway;
// engine silently skips so nothing weird happens at apply time.
export const TARGET_BASED_STAT_SKIP = new Set([
    'population', 'eligible_voters', 'debt', 'budget'
]);

export async function processTargetBasedPolicies(supabase, nation) {
    const summary = { stats: [] };

    // 1. Pull active target-based options for this nation.
    const { data: laws, error: lawsErr } = await supabase
        .from('active_laws')
        .select('id, selected_option:policy_options!selected_option_id(is_target_based, stat_targets)')
        .eq('nation_id', nation.id);
    if (lawsErr) {
        console.error(`[processTargetBasedPolicies] active_laws fetch failed for ${nation.name}:`, lawsErr.message);
        return summary;
    }
    const targetLaws = (laws || []).filter(l => l.selected_option?.is_target_based);
    if (targetLaws.length === 0) return summary;

    // 2. Aggregate stat targets across every active option.
    //    perStat[statKey] = { sumTargetWeighted, sumPull }
    const perStat = {};
    for (const law of targetLaws) {
        const targets = Array.isArray(law.selected_option.stat_targets) ? law.selected_option.stat_targets : [];
        for (const t of targets) {
            const rawKey = t?.stat_key;
            const key = normalizeNationStatKey(rawKey);
            if (!key || !NATION_STAT_COLUMN_SET.has(key)) continue;
            if (STAT_PROCESSOR_SKIP.has(key) || TARGET_BASED_STAT_SKIP.has(key)) continue;
            const target = Number(t.target);
            const pull = Number(t.pull);
            if (!Number.isFinite(target) || !Number.isFinite(pull) || pull <= 0) continue;
            if (!perStat[key]) perStat[key] = { sumTargetWeighted: 0, sumPull: 0 };
            perStat[key].sumTargetWeighted += target * pull;
            perStat[key].sumPull += pull;
        }
    }

    // 3. For each stat with non-zero total pull, converge the nation
    //    column toward the equilibrium. One merged update at the end so
    //    twelve stats nudging at once cost one DB write, not twelve.
    const statUpdates = {};
    for (const [statKey, agg] of Object.entries(perStat)) {
        if (agg.sumPull <= 0) continue;
        // cap respects per-column CHECK constraints — tax columns are
        // 0–10, everything else 0–100. Without this, a tax target
        // authored on the 0–100 scale would crash the whole update
        // with a constraint violation.
        const cap = nationStatCap(statKey);
        const equilibrium = Math.max(0, Math.min(cap,
            agg.sumTargetWeighted / agg.sumPull
        ));
        const current = Number(nation[statKey]);
        if (!Number.isFinite(current)) continue;
        const next = current + (equilibrium - current) * TARGET_CONVERGENCE_RATE;
        // Round to integer — the canonical stat columns are smallint
        // (writing a fractional value triggers an "invalid input syntax
        // for type smallint" error). Convergence is gradual enough that
        // the precision loss doesn't matter.
        let clamped = Math.max(0, Math.min(cap, Math.round(next)));
        // Small-gap rescue: at 10% convergence any gap < 5 rounds back
        // to current, pinning the stat. If the rounded equilibrium sits
        // in a different integer bucket, take a 1-step nudge toward it
        // so multi-tick convergence still happens for fine targets.
        if (clamped === current) {
            const rounded = Math.round(equilibrium);
            if      (rounded > current) clamped = Math.min(cap, current + 1);
            else if (rounded < current) clamped = Math.max(0, current - 1);
        }
        if (clamped === current) continue;
        statUpdates[statKey] = clamped;
        summary.stats.push({
            stat: statKey, before: current, equilibrium, after: clamped
        });
    }
    if (Object.keys(statUpdates).length > 0) {
        const { error: updErr } = await supabase
            .from('nations').update(statUpdates).eq('id', nation.id);
        if (updErr) {
            console.error(`[processTargetBasedPolicies] Nation stat update failed for ${nation.name}:`, updErr.message);
            return summary;
        }
        Object.assign(nation, statUpdates);
    }

    return summary;
}
