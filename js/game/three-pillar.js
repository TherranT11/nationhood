/**
 * three-pillar.js — Three-pillar preference engine
 * Extracted from game-common.js
 */

import { isAutocracy } from './government-types.js';
import { computeIdeologyAlignment, countIdeologyRelationship, ideologyOppositionMultiplier } from './ideology.js';
import { ISSUE_CATEGORY_STATS, STAT_TO_MINISTRY, statDirectionSign, statTrendBatch } from './stats.js';
import { fetchActiveCoalition } from './government-structure.js';
import { recalcDerivedApproval } from './bills.js';

// ==================== THREE-PILLAR PREFERENCE ENGINE ====================

/**
 * Master per-tick function that recalculates the three-pillar preference score
 * for every faction-bloc pair in a nation (democracies only).
 *
 * preference_score = ideology_alignment × 0.40
 *                  + performance_perception × 0.40
 *                  + clamp(momentum, 0, 100) × 0.20
 *
 * Then runs softmax per bloc to produce vote_share, and aggregates
 * national_vote_share weighted by bloc population.
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row
 * @param {number} currentTick - The tick just committed
 */
export async function calculateThreePillarPreferences(supabase, nation, currentTick) {
    if (isAutocracy(nation)) return;

    // ── 1. Load all party factions ──
    const { data: factions } = await supabase
        .from('factions')
        .select('id, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');
    if (!factions || factions.length === 0) return;
    const factionIds = factions.map(f => f.id);

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    const coalitionPartyIds = new Set(coalition?.party_ids || []);

    // ── 2. Load all faction_bloc_approval rows ──
    const { data: allBlocRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, faction_id, bloc_id, ideology_alignment, performance_perception, momentum, preference_score')
        .in('faction_id', factionIds);
    if (!allBlocRows || allBlocRows.length === 0) return;

    // ── 3. Load voter blocs (ideology axes + priority issues + k_value + weight) ──
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, population_weight, k_value, priority_issues, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nation.id)
        .eq('is_active', true);
    if (!voterBlocs || voterBlocs.length === 0) return;

    const blocMap = {};
    for (const b of voterBlocs) blocMap[b.id] = b;

    // ── 4. Load faction ideologies (dynamic axis scores) ──
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // ── 5. Load ministries (for performance credit/blame) ──
    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    const ministryHolder = {};
    for (const m of (ministries || [])) {
        if (m.party_id) ministryHolder[m.ministry_key] = m.party_id;
    }

    // ── 6. Collect all priority stat names for batch trend lookup ──
    const allPriorityStatNames = new Set();
    for (const bloc of voterBlocs) {
        const priorities = Array.isArray(bloc.priority_issues) ? bloc.priority_issues : [];
        for (const issue of priorities) {
            const stats = ISSUE_CATEGORY_STATS[issue];
            if (stats) stats.forEach(s => allPriorityStatNames.add(s));
        }
    }

    // Load weighted trends for all relevant stats in one batch query
    const trends = allPriorityStatNames.size > 0
        ? await statTrendBatch(supabase, nation.id, [...allPriorityStatNames], 6)
        : {};

    // Fresh nation stats (after this tick's effects have been applied)
    const curStats = nation;

    // ── 7. Calculate all three pillars for each faction-bloc pair ──
    const PILLAR_WEIGHT_IDEO = 0.40;
    const PILLAR_WEIGHT_PERF = 0.35;
    const PILLAR_WEIGHT_MOM  = 0.25;
    const MOMENTUM_DECAY     = 0.85; // 15% decay per tick
    const PERF_DECAY         = 0.05; // 5% drift toward neutral per tick

    const updates = [];

    for (const row of allBlocRows) {
        const bloc = blocMap[row.bloc_id];
        if (!bloc) continue;
        const ideo = ideoMap[row.faction_id];

        // ─── PILLAR 1: Ideology Alignment (0-100) ───
        const ideoScore = ideo ? computeIdeologyAlignment(ideo, bloc) : 50;

        // ─── PILLAR 2: Performance Perception (0-100) ───
        // Uses weighted 6-tick trends for stats the bloc cares about.
        // Ministry holders get credit/blame; non-holders get a muted signal.
        let perfDelta = 0;
        const priorities = Array.isArray(bloc.priority_issues) ? bloc.priority_issues : [];
        if (priorities.length > 0) {
            const relevantStats = new Set();
            for (const issue of priorities) {
                const stats = ISSUE_CATEGORY_STATS[issue];
                if (stats) stats.forEach(s => relevantStats.add(s));
            }

            let creditSum = 0;
            let statCount = 0;
            for (const statKey of relevantStats) {
                const rawTrend = trends[statKey] || 0;
                if (rawTrend === 0) continue;
                const sign = statDirectionSign(statKey);
                if (sign === 0) continue;
                const trendQuality = rawTrend * sign; // positive = improving

                statCount++;
                const ministryKey = STAT_TO_MINISTRY[statKey];
                const holderId = ministryKey ? ministryHolder[ministryKey] : null;

                if (holderId === row.faction_id) {
                    // Ministry holder: full credit/blame
                    creditSum += trendQuality * 1.5;
                } else if (coalitionPartyIds.has(row.faction_id)) {
                    // Coalition partner: partial credit/blame
                    creditSum += trendQuality * 0.3;
                }
                // Opposition: no direct credit (they benefit via momentum feedback in Phase 4)
            }

            if (statCount > 0) {
                perfDelta = (creditSum / statCount) * 3; // sensitivity multiplier
            }
        }

        // Decay toward 50 + apply trend-based delta
        const oldPerf = Number(row.performance_perception ?? 50);
        let newPerf = oldPerf * (1 - PERF_DECAY) + 50 * PERF_DECAY + perfDelta;
        newPerf = Math.round(Math.max(0, Math.min(100, newPerf)) * 100) / 100;

        // ─── PILLAR 3: Momentum (-50 to +50) ───
        // Decays 15% per tick. Adjusted externally via adjustMomentum().
        const oldMomentum = Number(row.momentum ?? 0);
        let newMomentum = Math.round(oldMomentum * MOMENTUM_DECAY * 100) / 100;
        // Zero out negligible values to avoid perpetual tiny drifts
        if (Math.abs(newMomentum) < 0.05) newMomentum = 0;

        // ─── COMBINE: preference_score ───
        // Map momentum from [-50,+50] to [0,100] for blending
        const momMapped = Math.max(0, Math.min(100, 50 + newMomentum));
        let prefScore = Math.round(
            (ideoScore * PILLAR_WEIGHT_IDEO + newPerf * PILLAR_WEIGHT_PERF + momMapped * PILLAR_WEIGHT_MOM) * 100
        ) / 100;

        // ─── IDEOLOGY OPPOSITION PENALTY (structural) ───
        // 2+ opposing → -30%, 1 opposing → -20%, 0 aligned → -10%
        const oppositionMult = ideo ? ideologyOppositionMultiplier(ideo, bloc) : 1.0;
        prefScore = Math.round(prefScore * oppositionMult * 100) / 100;

        // ─── IDEOLOGY DRIFT: per-tick erosion based on opposition count ───
        // 2+ opposing ideologies → -2/tick, 1 opposing → -1/tick, 0 aligned → -0.5/tick
        let ideoDrift = 0;
        if (ideo) {
            const { opposed, aligned } = countIdeologyRelationship(ideo, bloc);
            if (opposed >= 2)       ideoDrift = -2;
            else if (opposed === 1) ideoDrift = -1;
            else if (aligned === 0) ideoDrift = -0.5;
        }
        prefScore = Math.max(0, prefScore + ideoDrift);
        prefScore = Math.round(prefScore * 100) / 100;

        updates.push({
            id: row.id,
            faction_id: row.faction_id,
            bloc_id: row.bloc_id,
            ideology_alignment: Math.round(ideoScore * 100) / 100,
            performance_perception: newPerf,
            momentum: newMomentum,
            preference_score: prefScore,
            ideology_drift: ideoDrift
        });
    }

    // ── 8. Softmax vote share per bloc ──
    const byBloc = {};
    for (const u of updates) {
        if (!byBloc[u.bloc_id]) byBloc[u.bloc_id] = [];
        byBloc[u.bloc_id].push(u);
    }

    for (const blocId of Object.keys(byBloc)) {
        const bloc = blocMap[blocId];
        const k = Number(bloc?.k_value ?? 10);
        const entries = byBloc[blocId];

        const maxPref = Math.max(...entries.map(e => e.preference_score));
        const exps = entries.map(e => Math.exp((e.preference_score - maxPref) / k));
        const sumExp = exps.reduce((a, b) => a + b, 0);

        for (let i = 0; i < entries.length; i++) {
            entries[i].vote_share = sumExp > 0
                ? Math.round((exps[i] / sumExp) * 1000000) / 1000000
                : 1 / entries.length;
        }
    }

    // ── 9. Batch-update faction_bloc_approval rows ──
    for (const u of updates) {
        await supabase.from('faction_bloc_approval')
            .update({
                ideology_alignment: u.ideology_alignment,
                performance_perception: u.performance_perception,
                momentum: u.momentum,
                preference_score: u.preference_score,
                vote_share: u.vote_share
            })
            .eq('id', u.id);
    }

    // ── 10. Aggregate national_vote_share per faction ──
    const factionNationalShare = {};
    let totalWeight = 0;

    for (const blocId of Object.keys(byBloc)) {
        const bloc = blocMap[blocId];
        const weight = Number(bloc?.population_weight ?? 0);
        totalWeight += weight;

        for (const entry of byBloc[blocId]) {
            if (!factionNationalShare[entry.faction_id]) factionNationalShare[entry.faction_id] = 0;
            factionNationalShare[entry.faction_id] += (entry.vote_share * weight);
        }
    }

    for (const factionId of factionIds) {
        const rawShare = factionNationalShare[factionId] || 0;
        const pct = totalWeight > 0
            ? Math.round((rawShare / totalWeight) * 10000) / 100
            : 0;

        await supabase.from('factions')
            .update({ national_vote_share: pct })
            .eq('id', factionId);
    }

    // ── 11. Update derived approval_rating cache (backward compat) ──
    for (const fId of factionIds) {
        const factionUpdates = updates.filter(r => r.faction_id === fId);
        await recalcDerivedApproval(supabase, fId, factionUpdates);
    }

    console.log(`[Three-Pillar] Recalculated preferences for ${factionIds.length} parties × ${voterBlocs.length} blocs in ${nation.name}`);
}
