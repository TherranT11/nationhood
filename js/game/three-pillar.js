/**
 * three-pillar.js — Three-pillar preference engine
 * Extracted from game-common.js
 */

import { isAutocracy } from './government-types.js';
import { computeIdeologyAlignment, countIdeologyRelationship, ideologyOppositionMultiplier } from './ideology.js';
import { fetchActiveCoalition } from './government-structure.js';
import { recalcDerivedApproval } from './bills.js';

// ==================== THREE-PILLAR PREFERENCE ENGINE ====================

/**
 * Master per-tick function that recalculates the three-pillar preference score
 * for every faction-bloc pair in a nation (democracies only).
 *
 * preference_score = ideology_alignment × 0.60
 *                  + clamp(momentum, 0, 100) × 0.40
 *
 * Governance feed: coalition parties get per-tick momentum nudge
 * from gov_approval: (gov_approval - 50) / 10, capped ±5.
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

    // ── 2. Load all faction_bloc_approval rows (including last_platform for narrative action effects) ──
    const { data: allBlocRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, faction_id, bloc_id, ideology_alignment, performance_perception, momentum, preference_score, last_platform')
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

    // ── 4. Load faction ideologies (dynamic axis scores + conviction stacks) ──
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism, convictions')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // ── 4b. Backfill missing faction_ideology rows ──
    // Parties without an ideology row get ideoScore=50 for all blocs, locking
    // preference_score at 50. Create a centrist row so computeIdeologyAlignment
    // can produce varied scores (30-70) based on bloc positions.
    const missingIdeoFactions = factionIds.filter(fid => !ideoMap[fid]);
    if (missingIdeoFactions.length > 0) {
        for (const fid of missingIdeoFactions) {
            const newRow = {
                faction_id: fid,
                liberty_equality: 0,
                tradition_progress: 0,
                security_freedom: 0,
                globalism_nationalism: 0,
                individualism_collectivism: 0
            };
            const { data: inserted, error: insErr } = await supabase
                .from('faction_ideology')
                .upsert(newRow, { onConflict: 'faction_id', ignoreDuplicates: true })
                .select()
                .single();
            if (!insErr && inserted) {
                ideoMap[fid] = inserted;
                console.log(`[three-pillar] Backfilled missing faction_ideology row for faction ${fid}`);
            } else if (insErr) {
                console.error(`[three-pillar] Failed to backfill faction_ideology for ${fid}:`, insErr.message);
            }
        }
    }

    // ── 5. Calculate pillars for each faction-bloc pair ──
    const PILLAR_WEIGHT_IDEO = 0.60;
    const PILLAR_WEIGHT_MOM  = 0.40;
    const MOMENTUM_DECAY     = 0.70; // 30% decay per tick

    // ── 5b. Governance → momentum feed ──
    // Coalition parties get a per-tick momentum nudge based on gov_approval.
    // Formula: (gov_approval - 50) / 10, capped at ±5.
    // gov_approval 95 → +4.5/tick, 75 → +2.5, 50 → 0, 25 → -2.5, 5 → -4.5
    const govApproval = Number(nation.gov_approval ?? 50);
    const govMomentumNudge = Math.max(-5, Math.min(5,
        Math.round(((govApproval - 50) / 10) * 100) / 100
    ));

    const updates = [];

    // Track platform updates that need writing back (bridge expiry, etc.)
    const platformUpdates = [];

    for (const row of allBlocRows) {
        const bloc = blocMap[row.bloc_id];
        if (!bloc) continue;
        const ideo = ideoMap[row.faction_id];
        const platform = row.last_platform || {};
        let platformChanged = false;

        // ─── PILLAR 1: Ideology Alignment (0-100) ───
        const ideoScore = ideo ? computeIdeologyAlignment(ideo, bloc) : 50;

        // ─── PILLAR 2: Performance Perception — DISABLED ───
        const newPerf = 50; // neutral; column still written for schema compat

        // ─── PILLAR 3: Momentum (-50 to +50) ───
        // Base decay: 30% per tick. Conviction stacks reduce decay for aligned blocs.
        const oldMomentum = Number(row.momentum ?? 0);
        let effectiveDecay = MOMENTUM_DECAY;

        // ─── Double Down: conviction stacks reduce positive momentum decay for aligned blocs ───
        const convictions = ideo?.convictions || {};
        if (oldMomentum > 0 && Object.keys(convictions).length > 0) {
            // Find highest conviction stack on an axis where this bloc aligns with the faction
            let maxConvictionBonus = 0;
            for (const [axisKey, stacks] of Object.entries(convictions)) {
                if (!stacks || stacks <= 0) continue;
                const partyVal = ideo[axisKey] || 0; // -50 to +50
                const blocVal = bloc['axis_' + axisKey] ?? 50; // 0 to 100
                const partyNorm = 50 + partyVal; // map to 0-100
                const distance = Math.abs(partyNorm - blocVal);
                // Bloc must be aligned (within 30 points) for conviction to help
                if (distance <= 30) {
                    maxConvictionBonus = Math.max(maxConvictionBonus, stacks);
                }
            }
            // Each conviction stack reduces decay by 8% (3 stacks: 30% decay → 6% decay)
            if (maxConvictionBonus > 0) {
                effectiveDecay = Math.min(1.0, MOMENTUM_DECAY + maxConvictionBonus * 0.08);
            }
        }

        let newMomentum = Math.round(oldMomentum * effectiveDecay * 100) / 100;

        // ─── Champion a Community: 2× governance momentum for championed blocs ───
        let govMultiplier = 1;
        if (platform.championed === true) {
            govMultiplier = 2;
        }

        // Governance momentum feed: coalition parties get nudge from gov_approval
        if (coalitionPartyIds.has(row.faction_id)) {
            newMomentum += govMomentumNudge * govMultiplier;
        }

        // ─── Build a Bridge: ongoing momentum boost from active bridges ───
        if (platform.bridges && Array.isArray(platform.bridges)) {
            const activeBridges = [];
            for (const bridge of platform.bridges) {
                if (bridge.expires_tick > currentTick) {
                    // Active bridge: apply per-tick momentum boost
                    newMomentum += (bridge.boost || 2) * 0.5; // half the initial boost per tick
                    activeBridges.push(bridge);
                } else {
                    // Expired bridge: leave +1 permanent goodwill via momentum bump
                    newMomentum += 1;
                    platformChanged = true;
                }
            }
            // Keep only active bridges
            if (activeBridges.length !== platform.bridges.length) {
                platform.bridges = activeBridges;
                if (activeBridges.length === 0) {
                    delete platform.bridges;
                    delete platform.bridge;
                }
                platformChanged = true;
            }
        }

        // Clamp to [-50, +50] and zero out negligible values
        newMomentum = Math.max(-50, Math.min(50, newMomentum));
        newMomentum = Math.round(newMomentum * 100) / 100;
        if (Math.abs(newMomentum) < 0.05) newMomentum = 0;

        // ─── COMBINE: preference_score ───
        // Map momentum from [-50,+50] to [0,100] for blending
        const momMapped = Math.max(0, Math.min(100, 50 + newMomentum));
        let prefScore = Math.round(
            (ideoScore * PILLAR_WEIGHT_IDEO + momMapped * PILLAR_WEIGHT_MOM) * 100
        ) / 100;

        // ─── IDEOLOGY OPPOSITION PENALTY (structural) ───
        // 2+ opposing → -30%, 1 opposing → -20%, 0 aligned → -10%
        const oppositionMult = ideo ? ideologyOppositionMultiplier(ideo, bloc) : 1.0;
        prefScore = Math.round(prefScore * oppositionMult * 100) / 100;

        // ─── IDEOLOGY DRIFT: per-tick erosion based on opposition count ───
        // 2+ opposing → -1/tick, 1 opposing → -0.5/tick, 0 aligned (with positions) → -0.25/tick
        let ideoDrift = 0;
        if (ideo) {
            const { opposed, aligned } = countIdeologyRelationship(ideo, bloc);
            if (opposed >= 2)       ideoDrift = -1;
            else if (opposed === 1) ideoDrift = -0.5;
            else if (aligned === 0) {
                // Only drift if the party actually has strong positions but none align.
                // Centrist parties with no positions should not be penalized.
                const IDEOLOGY_AXIS_KEYS = ['liberty_equality','tradition_progress','security_freedom','globalism_nationalism','individualism_collectivism'];
                const hasPosition = IDEOLOGY_AXIS_KEYS.some(k => Math.abs(ideo[k] || 0) >= 20);
                if (hasPosition) ideoDrift = -0.25;
            }
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

        if (platformChanged) {
            platformUpdates.push({ id: row.id, last_platform: platform });
        }
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
                vote_share: u.vote_share,
                ideology_drift: u.ideology_drift
            })
            .eq('id', u.id);
    }

    // ── 9b. Write back platform changes (bridge expiry cleanup) ──
    for (const pu of platformUpdates) {
        await supabase.from('faction_bloc_approval')
            .update({ last_platform: pu.last_platform })
            .eq('id', pu.id);
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
