/**
 * three-pillar.js — Three-pillar preference engine
 * Extracted from game-common.js
 */

import { isAutocracy } from './government-types.js';
import { computeIdeologyAlignment, countIdeologyRelationship, ideologyOppositionMultiplier } from './ideology.js';
import { fetchActiveCoalition } from './government-structure.js';
import { recalcDerivedApproval } from './bills.js';
import { ISSUE_CATEGORY_STATS, statDirectionSign } from './stats.js';

// ==================== THREE-PILLAR PREFERENCE ENGINE ====================

/**
 * Master per-tick function that recalculates the three-pillar preference score
 * for every faction-bloc pair in a nation (democracies only).
 *
 * preference_score = ideology_alignment × 0.40
 *                  + performance_perception × 0.25
 *                  + clamp(momentum, 0, 100) × 0.35
 *
 * Governance feed: lead party gets full per-tick momentum nudge
 * from gov_approval: (gov_approval - 50) / 2.5, capped ±8.
 * Other cabinet parties get 25% of the nudge.
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

    // ── 1. Load all party factions (exclude inactive ≥12 ticks) ──
    const INACTIVITY_EXCLUSION = 12;
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id, seats, last_seen_tick')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');
    if (!allFactions || allFactions.length === 0) return;

    const factions = allFactions.filter(f =>
        f.last_seen_tick == null || (currentTick - f.last_seen_tick) < INACTIVITY_EXCLUSION
    );
    const inactiveFactions = allFactions.filter(f =>
        f.last_seen_tick != null && (currentTick - f.last_seen_tick) >= INACTIVITY_EXCLUSION
    );
    if (factions.length === 0) return;
    const factionIds = factions.map(f => f.id);

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    const coalitionPartyIds = new Set(coalition?.party_ids || []);
    const leadPartyId = coalition?.lead_party_id || null; // president/PM's party gets full gov momentum

    // ── 2. Load voter blocs first (needed for orphan detection) ──
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, population_weight, k_value, priority_issues, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nation.id)
        .eq('is_active', true);
    if (!voterBlocs || voterBlocs.length === 0) return;

    const blocMap = {};
    for (const b of voterBlocs) blocMap[b.id] = b;
    const activeBlocIds = new Set(voterBlocs.map(b => b.id));

    // ── 3. Load all faction_bloc_approval rows ──
    let { data: allBlocRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, faction_id, bloc_id, ideology_alignment, performance_perception, momentum, preference_score, last_platform')
        .in('faction_id', factionIds);
    if (!allBlocRows) allBlocRows = [];

    // ── 3b. Repair orphaned/stale bloc_id references ──
    // faction_bloc_approval rows referencing inactive/deleted voter_blocs will be
    // silently skipped by the calculation loop (`if (!bloc) continue`), leaving
    // preference_score permanently stuck at its seed value (40).
    const orphanedRows = allBlocRows.filter(r => !activeBlocIds.has(r.bloc_id));
    if (orphanedRows.length > 0) {
        console.warn(`[Three-Pillar] Deleting ${orphanedRows.length} orphaned faction_bloc_approval rows (stale bloc_ids) for nation ${nation.name}`);
        for (const row of orphanedRows) {
            await supabase.from('faction_bloc_approval').delete().eq('id', row.id);
        }
        allBlocRows = allBlocRows.filter(r => activeBlocIds.has(r.bloc_id));
    }

    // ── 3c. Seed missing faction_bloc_approval rows ──
    // Ensures every (faction, active_bloc) pair has a row.
    const existingPairs = new Set(allBlocRows.map(r => `${r.faction_id}:${r.bloc_id}`));
    const missingPairs = [];
    for (const fid of factionIds) {
        for (const bloc of voterBlocs) {
            if (!existingPairs.has(`${fid}:${bloc.id}`)) {
                missingPairs.push({ faction_id: fid, bloc_id: bloc.id, preference_score: 40 });
            }
        }
    }
    if (missingPairs.length > 0) {
        console.warn(`[Three-Pillar] Seeding ${missingPairs.length} missing faction_bloc_approval rows for nation ${nation.name}`);
        const { error: seedErr } = await supabase.from('faction_bloc_approval')
            .upsert(missingPairs, { onConflict: 'faction_id,bloc_id', ignoreDuplicates: true });
        if (seedErr) {
            console.error(`[Three-Pillar] Failed to seed missing rows:`, seedErr.message);
        }
        // Re-fetch all rows after any repairs
        const { data: refreshedRows } = await supabase
            .from('faction_bloc_approval')
            .select('id, faction_id, bloc_id, ideology_alignment, performance_perception, momentum, preference_score, last_platform')
            .in('faction_id', factionIds);
        if (refreshedRows && refreshedRows.length > 0) {
            allBlocRows = refreshedRows;
        }
    }

    if (allBlocRows.length === 0) return;

    // ── 3d. Detect and reset stuck rows ──
    // Rows stuck at seed defaults (preference_score=40, ideology_alignment=50) have never been
    // successfully updated by the three-pillar engine. Reset in-memory values to force fresh calculation.
    const stuckRows = allBlocRows.filter(r =>
        Number(r.preference_score) === 40 &&
        Number(r.ideology_alignment) === 50
    );
    if (stuckRows.length > 0) {
        const stuckFactions = [...new Set(stuckRows.map(r => r.faction_id))];
        console.warn(`[Three-Pillar] Detected ${stuckRows.length} stuck rows for ${stuckFactions.length} faction(s): ${stuckFactions.join(', ')}. Resetting to force recalculation.`);
        for (const sr of stuckRows) {
            sr.ideology_alignment = 0;
            sr.preference_score = 0;
            sr.momentum = 0;
        }
    }

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
    // Map declared ideology values to axis columns with ±30 strength
    const IDEOLOGY_AXIS_MAP = {
        'LIBERTY': { axis: 'liberty_equality', val: -30 },
        'EQUALITY': { axis: 'liberty_equality', val: 30 },
        'TRADITION': { axis: 'tradition_progress', val: -30 },
        'PROGRESS': { axis: 'tradition_progress', val: 30 },
        'SECURITY': { axis: 'security_freedom', val: -30 },
        'FREEDOM': { axis: 'security_freedom', val: 30 },
        'GLOBALISM': { axis: 'globalism_nationalism', val: -30 },
        'NATIONALISM': { axis: 'globalism_nationalism', val: 30 },
        'INDIVIDUALISM': { axis: 'individualism_collectivism', val: -30 },
        'COLLECTIVISM': { axis: 'individualism_collectivism', val: 30 },
    };

    const missingIdeoFactions = factionIds.filter(fid => !ideoMap[fid]);
    if (missingIdeoFactions.length > 0) {
        // Fetch declared ideologies for missing factions to seed axis values
        const { data: factionDetails } = await supabase
            .from('factions')
            .select('id, ideology_value_1, ideology_value_2')
            .in('id', missingIdeoFactions);
        const factionMap = {};
        for (const f of (factionDetails || [])) factionMap[f.id] = f;

        for (const fid of missingIdeoFactions) {
            const faction = factionMap[fid];
            const newRow = {
                faction_id: fid,
                liberty_equality: 0,
                tradition_progress: 0,
                security_freedom: 0,
                globalism_nationalism: 0,
                individualism_collectivism: 0
            };
            // Seed from declared ideologies (±30 per axis)
            for (const iv of [faction?.ideology_value_1, faction?.ideology_value_2]) {
                if (!iv) continue;
                const mapping = IDEOLOGY_AXIS_MAP[iv.toUpperCase()];
                if (mapping) {
                    newRow[mapping.axis] = Math.max(-100, Math.min(100, (newRow[mapping.axis] || 0) + mapping.val));
                }
            }
            console.log(`[three-pillar] Seeding faction_ideology for ${fid}: ${JSON.stringify(newRow)}`);
            // Try insert first (works even without unique constraint on faction_id).
            // Fall back to upsert if a constraint exists.
            let inserted = null;
            let insErr = null;
            const { data: d1, error: e1 } = await supabase
                .from('faction_ideology')
                .insert(newRow)
                .select()
                .single();
            if (!e1 && d1) {
                inserted = d1;
            } else if (e1) {
                // If insert fails (duplicate), try upsert
                const { data: d2, error: e2 } = await supabase
                    .from('faction_ideology')
                    .upsert(newRow, { onConflict: 'faction_id', ignoreDuplicates: true })
                    .select()
                    .single();
                inserted = d2;
                insErr = e2;
            }
            if (inserted) {
                ideoMap[fid] = inserted;
                console.log(`[three-pillar] Backfilled missing faction_ideology row for faction ${fid}`);
            } else if (insErr || e1) {
                console.error(`[three-pillar] Failed to backfill faction_ideology for ${fid}:`, (insErr || e1).message);
            }
        }
    }

    // ── 5. Calculate pillars for each faction-bloc pair ──
    const PILLAR_WEIGHT_IDEO = 0.40;
    const PILLAR_WEIGHT_PERF = 0.25;
    const PILLAR_WEIGHT_MOM  = 0.35;
    const MOMENTUM_DECAY     = 0.70; // 30% decay per tick
    const INACTIVITY_DRAIN   = 1.5;  // momentum drain per tick when inactive
    const INACTIVITY_THRESHOLD = 3;  // ticks without any campaign action to trigger drain

    // ── Engagement decay: ideology alignment loses effectiveness when inactive ──
    // After INACTIVITY_THRESHOLD ticks without a campaign action, ideology effectiveness
    // decays 5% per additional inactive tick, down to a 40% floor.
    // Rationale: voters may agree with you ideologically, but if you're not campaigning
    // they don't know you exist. High ideology alignment shouldn't be a free ride.
    const ENGAGEMENT_DECAY_RATE = 0.05;  // 5% per inactive tick beyond threshold
    const ENGAGEMENT_FLOOR     = 0.40;   // minimum 40% ideology effectiveness

    // ── Opposition performance drift: inactive opposition drifts toward skepticism ──
    // Instead of sitting at a free 50, inactive opposition parties drift toward 35.
    // Active opposition parties (recent campaign action) stay at 50.
    const OPPOSITION_INACTIVE_PERF_TARGET = 35;

    // ── 5a. Fetch last campaign action tick per faction (for inactivity detection) ──
    // We need the most recent action tick per faction for both inactivity drain (3-tick threshold)
    // and engagement decay (which scales with how many ticks since last action).
    // Fetch only the most recent action per faction to keep the query efficient.
    const { data: lastActions } = await supabase
        .from('campaign_actions')
        .select('party_id, tick_performed')
        .in('party_id', factionIds)
        .order('tick_performed', { ascending: false })
        .limit(factionIds.length * 2);
    const lastActionTickMap = new Map();
    for (const action of (lastActions || [])) {
        if (!lastActionTickMap.has(action.party_id)) {
            lastActionTickMap.set(action.party_id, action.tick_performed);
        }
    }

    // ── 5b. Governance → momentum feed ──
    // Lead party gets a per-tick momentum nudge based on gov_approval (other cabinet parties get 25%).
    // Formula: (gov_approval - 50) / 2.5, capped at ±8.
    // gov_approval 70 → +8.0/tick, 60 → +4.0, 53 → +1.2, 50 → 0, 40 → -4.0, 30 → -8.0
    const govApproval = Number(nation.gov_approval ?? 40);
    const govMomentumNudge = Math.max(-8, Math.min(8,
        Math.round(((govApproval - 50) / 2.5) * 100) / 100
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
        // Raw alignment from axis positions
        const rawIdeoScore = ideo ? computeIdeologyAlignment(ideo, bloc) : 50;

        // ─── Engagement decay: ideology loses effectiveness when inactive ───
        // Voters may agree with you, but if you're not visible they forget you exist.
        const lastAction = lastActionTickMap.get(row.faction_id) ?? -999;
        const ticksSinceAction = currentTick - lastAction;
        let engagementMult = 1.0;
        if (currentTick >= INACTIVITY_THRESHOLD && ticksSinceAction >= INACTIVITY_THRESHOLD) {
            const extraInactiveTicks = ticksSinceAction - INACTIVITY_THRESHOLD;
            engagementMult = Math.max(ENGAGEMENT_FLOOR, 1.0 - extraInactiveTicks * ENGAGEMENT_DECAY_RATE);
        }
        const ideoScore = Math.round(rawIdeoScore * engagementMult * 100) / 100;

        // ─── PILLAR 2: Performance Perception (drift-based) ───
        // Coalition parties: target based on how well nation stats match this bloc's priority issues.
        // Opposition parties: neutral 50 (they aren't governing, so no accountability).
        // Drifts by max ±3/tick toward target, clamped to [20, 80].
        const oldPerf = Number(row.performance_perception ?? 50);
        let perfTarget = 50; // neutral default for active opposition
        // Inactive opposition: drift toward skepticism (35) instead of free 50
        if (!coalitionPartyIds.has(row.faction_id) && currentTick >= INACTIVITY_THRESHOLD && ticksSinceAction >= INACTIVITY_THRESHOLD) {
            perfTarget = OPPOSITION_INACTIVE_PERF_TARGET;
        }
        if (coalitionPartyIds.has(row.faction_id)) {
            const blocIssues = bloc.priority_issues || [];
            let goodTotal = 0;
            let statCount = 0;
            for (const issue of blocIssues) {
                const statKeys = ISSUE_CATEGORY_STATS[issue];
                if (!statKeys) continue;
                for (const sk of statKeys) {
                    const val = Number(nation[sk] ?? 50);
                    const dir = statDirectionSign(sk);
                    // dir=+1 → higher is better (goodness = val)
                    // dir=-1 → lower is better (goodness = 100 - val)
                    // dir=0  → neutral, skip
                    if (dir === 0) continue;
                    goodTotal += dir === 1 ? val : (100 - val);
                    statCount++;
                }
            }
            if (statCount > 0) {
                perfTarget = Math.round(goodTotal / statCount);
            }
        }
        const perfDelta = Math.max(-3, Math.min(3, perfTarget - oldPerf));
        const newPerf = Math.max(20, Math.min(80, Math.round((oldPerf + perfDelta) * 100) / 100));

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
                const partyVal = ideo[axisKey] || 0; // -100 to +100
                const blocVal = bloc['axis_' + axisKey] ?? 50; // 0 to 100
                const partyNorm = (partyVal + 100) / 2; // map -100..+100 to 0..100
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

        // ─── Inactivity drain: parties with no campaign actions in recent ticks lose momentum ───
        // Skip drain in early ticks so parties aren't penalized before they've had a chance to act.
        const lastActionTick = lastActionTickMap.get(row.faction_id) ?? -999;
        if (currentTick >= INACTIVITY_THRESHOLD && (currentTick - lastActionTick) >= INACTIVITY_THRESHOLD) {
            newMomentum -= INACTIVITY_DRAIN;
        }

        // ─── Champion a Community: 2× governance momentum for championed blocs ───
        let govMultiplier = 1;
        if (platform.championed === true) {
            govMultiplier = 2;
        }

        // Governance momentum feed: lead party (president/PM) gets full nudge,
        // other cabinet parties get 25% — voters credit the president, not minor ministers.
        if (row.faction_id === leadPartyId) {
            newMomentum += govMomentumNudge * govMultiplier;
        } else if (coalitionPartyIds.has(row.faction_id)) {
            newMomentum += govMomentumNudge * govMultiplier * 0.25;
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
        // Map momentum from [-50,+50] to [0,100] for blending.
        // Zero momentum maps to 35 (not 50) so inactive parties start below neutral.
        // Multiplier 1.3 stretches the active range to still reach 100 at +50.
        const momMapped = Math.max(0, Math.min(100, 35 + newMomentum * 1.3));
        let prefScore = Math.round(
            (ideoScore * PILLAR_WEIGHT_IDEO + newPerf * PILLAR_WEIGHT_PERF + momMapped * PILLAR_WEIGHT_MOM) * 100
        ) / 100;

        // ─── IDEOLOGY OPPOSITION PENALTY (structural) ───
        // 3+ opposing → -50%, 2 opposing → -35%, 1 opposing → -15%, 0 aligned → -10%
        const oppositionMult = ideo ? ideologyOppositionMultiplier(ideo, bloc) : 1.0;
        prefScore = Math.round(prefScore * oppositionMult * 100) / 100;

        // ─── IDEOLOGY DRIFT: per-tick erosion based on opposition count ───
        // 3+ opposing → -3/tick, 2 opposing → -2/tick, 1 opposing → -1/tick, 0 aligned (with positions) → -0.5/tick
        let ideoDrift = 0;
        if (ideo) {
            const { opposed, aligned } = countIdeologyRelationship(ideo, bloc);
            if (opposed >= 3)       ideoDrift = -3;
            else if (opposed >= 2)  ideoDrift = -2;
            else if (opposed === 1) ideoDrift = -1;
            else if (aligned === 0) {
                // Only drift if the party actually has strong positions but none align.
                // Centrist parties with no positions should not be penalized.
                const IDEOLOGY_AXIS_KEYS = ['liberty_equality','tradition_progress','security_freedom','globalism_nationalism','individualism_collectivism'];
                const hasPosition = IDEOLOGY_AXIS_KEYS.some(k => Math.abs(ideo[k] || 0) >= 20);
                if (hasPosition) ideoDrift = -0.5;
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
        const k = Number(bloc?.k_value ?? 7);
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
    let updateFailCount = 0;
    for (const u of updates) {
        const { data: updatedRows, error: updateErr } = await supabase.from('faction_bloc_approval')
            .update({
                ideology_alignment: u.ideology_alignment,
                performance_perception: u.performance_perception,
                momentum: u.momentum,
                preference_score: u.preference_score,
                vote_share: u.vote_share,
                ideology_drift: u.ideology_drift
            })
            .eq('id', u.id)
            .select('id');
        if (updateErr) {
            console.error(`[Three-Pillar] Failed to update faction_bloc_approval row ${u.id} (faction=${u.faction_id}, bloc=${u.bloc_id}):`, updateErr.message);
            updateFailCount++;
        } else if (!updatedRows || updatedRows.length === 0) {
            // Update returned success but modified 0 rows — row likely missing or RLS blocked
            console.error(`[Three-Pillar] Update matched 0 rows for faction_bloc_approval id=${u.id} (faction=${u.faction_id}, bloc=${u.bloc_id}, pref=${u.preference_score}). Attempting upsert fallback.`);
            // Fallback: upsert to ensure the row exists with correct values
            const { error: upsertErr } = await supabase.from('faction_bloc_approval')
                .upsert({
                    id: u.id,
                    faction_id: u.faction_id,
                    bloc_id: u.bloc_id,
                    ideology_alignment: u.ideology_alignment,
                    performance_perception: u.performance_perception,
                    momentum: u.momentum,
                    preference_score: u.preference_score,
                    vote_share: u.vote_share,
                    ideology_drift: u.ideology_drift
                }, { onConflict: 'faction_id,bloc_id' });
            if (upsertErr) {
                console.error(`[Three-Pillar] Upsert fallback also failed for faction=${u.faction_id}, bloc=${u.bloc_id}:`, upsertErr.message);
                updateFailCount++;
            } else {
                console.log(`[Three-Pillar] Upsert fallback succeeded for faction=${u.faction_id}, bloc=${u.bloc_id}`);
            }
        }
    }
    if (updateFailCount > 0) {
        console.error(`[Three-Pillar] ${updateFailCount}/${updates.length} updates failed for nation ${nation.name}`);
    }

    // ── 9b. Write back platform changes (bridge expiry cleanup) ──
    for (const pu of platformUpdates) {
        const { error: platErr } = await supabase.from('faction_bloc_approval')
            .update({ last_platform: pu.last_platform })
            .eq('id', pu.id);
        if (platErr) {
            console.error(`[Three-Pillar] Failed to update platform for row ${pu.id}:`, platErr.message);
        }
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

    // ── 10b. Zero national_vote_share for inactive parties so stale data doesn't persist ──
    for (const f of inactiveFactions) {
        await supabase.from('factions')
            .update({ national_vote_share: 0 })
            .eq('id', f.id);
    }
    if (inactiveFactions.length > 0) {
        console.log(`[Three-Pillar] Zeroed national_vote_share for ${inactiveFactions.length} inactive parties in ${nation.name}`);
    }

    // ── 11. Update derived approval_rating cache (backward compat) ──
    for (const fId of factionIds) {
        const factionUpdates = updates.filter(r => r.faction_id === fId);
        await recalcDerivedApproval(supabase, fId, factionUpdates);
    }

    console.log(`[Three-Pillar] Recalculated preferences for ${factionIds.length} parties × ${voterBlocs.length} blocs in ${nation.name}`);
}
