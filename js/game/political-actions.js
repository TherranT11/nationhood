/**
 * political-actions.js — Political actions, tick processors, crises, events, resign PM, disband party
 * Extracted from game-common.js
 */

import { deductAP, GAME_CONFIG, FORMATION_DEADLINE_TICKS } from './config.js';
import { CANONICAL_GOVERNMENT_TYPES, hasParliamentaryPM } from './government-types.js';
import { RAW_SCALING_DIVISORS, STAT_PROCESSOR_SKIP } from './diplomacy-constants.js';
import { MINISTER_APPROVAL_CONFIG, MINISTRY_TO_STATS, NATION_STAT_COLUMNS, NATION_STAT_COLUMN_SET, STAT_DECAY_CONFIG, buildMinistryBaselines, normalizeNationStatKey, translateStatEffect, statDirectionSign } from './stats.js';
import { adjustGovernmentApprovalEvent } from './momentum.js';
import { fetchActiveCoalition, deriveLeadPartyId } from './government-structure.js';
import { closeAdministration, createAdministration, dissolveCoalition } from './elections.js';
import { getTraitAPModifier, POSITIVE_TRAITS } from './party-leadership.js';
import { onAttack } from './electorate.js';

const _PA_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
function _tickToDate(tick) {
    return `${_PA_MONTHS[tick % 12]}, ${2000 + Math.floor(tick / 12)}`;
}

/**
 * Per-tick stat-debug ledger writer. No-op unless nation.debug_stat_logging is true.
 * Fire-and-forget — don't await; never let an instrumentation failure abort tick processing.
 * Writes to stat_debug_log (table from migration 20260426_stat_debug_log.sql).
 */
function _logStatDebug(supabase, nation, tick, statKey, contributorType, contributorName, rawRate, multiplier, effectiveDelta, notes) {
    if (!nation || !nation.debug_stat_logging) return;
    supabase.from('stat_debug_log').insert({
        nation_id: nation.id,
        tick,
        stat_key: statKey,
        contributor_type: contributorType,
        contributor_name: contributorName ?? null,
        raw_rate: rawRate ?? null,
        multiplier: multiplier ?? null,
        effective_delta: effectiveDelta ?? null,
        notes: notes ?? null
    }).then(() => {}, (e) => console.warn('[stat_debug_log] insert failed:', e?.message));
}

// ==================== STAT DECAY PROCESSING ====================

/**
 * Apply natural stat decay for a nation. Each tick, configured stats drift
 * toward their target (equilibrium or erosion). Policies can raise/lower
 * the target via active_laws → policies → stat_effects (floor/ceiling).
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row (in-memory, mutated on success)
 * @param {Object|null} policyDecayAdjustments - from buildPolicyDecayAdjustments
 * @param {number} currentTick
 * @returns {Array<object>}  Applied decay descriptors for tick summary
 */
/**
 * Build a map of policy-driven decay floor/ceiling adjustments for a nation.
 * Queries active_laws → policies and aggregates adjust_type/adjust_value
 * from stat_effects. Adjustments stack additively across multiple policies.
 *
 * @returns {{ [statKey: string]: { floor: number, ceiling: number } }}
 */
export async function buildPolicyDecayAdjustments(supabase, nationId) {
    const adjustments = {};

    // Phase 4.4 + Phase 5-fix: pull stat_effects from the chosen
    // policy_option. The legacy policies.stat_effects column is gone
    // from the live schema, so the option is the only source.
    const { data: activeLaws, error } = await supabase
        .from('active_laws')
        .select('policy_id, selected_option:policy_options!selected_option_id(stat_effects)')
        .eq('nation_id', nationId);

    if (error || !activeLaws) return adjustments;

    for (const law of activeLaws) {
        const effects = law.selected_option?.stat_effects;
        if (!Array.isArray(effects)) continue;

        for (const eff of effects) {
            if (!eff.adjust_type || !eff.adjust_value) continue;
            const statKey = normalizeNationStatKey(eff.stat_key);
            if (!statKey || !NATION_STAT_COLUMN_SET.has(statKey)) continue;

            if (!adjustments[statKey]) adjustments[statKey] = { floor: 0, ceiling: 0 };

            const val = Math.abs(Number(eff.adjust_value) || 0);
            if (eff.adjust_type === 'floor') {
                adjustments[statKey].floor += val;
            } else if (eff.adjust_type === 'ceiling') {
                adjustments[statKey].ceiling += val;
            }
        }
    }

    return adjustments;
}

// ════════════════════════════════════════════════════════════════
// Commodity demand-met effects per tick.
//
// Runs alongside processStatDecay in the per-nation loop. For each
// stat-derived commodity (Energy, Minerals, Food), computes:
//   supply  = production + net_trading_imports (where applicable)
//   met_pct = supply / demand
//
// Buckets per commodity:
//
//   ENERGY (production = energy / 3,
//           demand     = ((infra + industry) × sol × √pop_M) / 3500):
//     met_pct < 1.00 → SoL -0.1, public_approval -0.1, industry -0.1
//     met_pct ≥ 1.20 → SoL +0.05, cost_of_living -0.05,
//                      public_approval +0.05, service_sector +0.05
//
//   MINERALS (production = (minerals/3) × ((unskilled + industry)/200),
//             demand     = (infra/10) + (industry/16)):
//     met_pct < 1.00 → infrastructure -0.1, industry -0.1, gdp_growth -0.1
//     met_pct ≥ 1.20 → SoL +0.05, infrastructure +0.05,
//                      industry +0.05, gdp_growth +0.05
//
//   FOOD (production = (farmland / 2) × (unskilled / 100),
//         demand     = population_M / 3):
//     met_pct < 1.00 → health -0.2, public_approval -0.2,
//                      unrest +0.2, crime +0.1, workforce -0.1
//     met_pct ≥ 1.20 → health +0.1, public_approval +0.1,
//                      SoL +0.05, cost_of_living -0.05
//
//   Workforce tiering: Minerals (extraction), Food (agriculture),
//   and Consumer Goods (mass-production manufacturing) all read the
//   unskilled_workers tier. Luxury Goods uses Education × Services
//   as its operational multiplier — that pair stands in for the
//   skilled / knowledge-work tier and stays as-is.
//
//   demand = 0 → skip (no effects either way).
//   100-119% inclusive → no effects.
//
// Merging: when two commodities nudge the same stat (e.g. Energy
// under-supply −0.1 industry + Minerals under-supply −0.1 industry),
// deltas sum (industry → −0.2 net) and apply in a SINGLE update so
// neither overwrites the other. Trading volumes pre-computed once
// per tick by computeCommodityTradingByNation — every awarded
// shipping contract whose parent trade_agreement is active feeds
// into the right commodity bucket on both buyer (positive) and
// seller (negative) nations.
// ════════════════════════════════════════════════════════════════

// Five canonical commodities the trade-flow form spawns shipping
// contracts for. Kept in a constant so empty-flow defaults stay in
// sync with the migration-side allow-list.
const COMMODITY_KEYS = ['energy', 'minerals', 'food', 'consumer_goods', 'luxury_goods'];

function _emptyCommodityFlows() {
    const o = {};
    for (const k of COMMODITY_KEYS) o[k] = 0;
    return o;
}

export async function computeCommodityTradingByNation(supabase) {
    const map = new Map();
    const { data: contracts } = await supabase.from('shipping_contracts')
        .select('id, nation_id, trade_agreement_id, commodity')
        .eq('status', 'awarded')
        .not('trade_agreement_id', 'is', null);
    if (!contracts || contracts.length === 0) return map;

    const contractIds = contracts.map(c => c.id);
    // shipping_contract_bids.energy_per_tick is the units-per-tick
    // column; the historical name is energy-flavoured but the value
    // is generic (each bid is for the parent contract's commodity).
    const { data: bids } = await supabase.from('shipping_contract_bids')
        .select('contract_id, energy_per_tick')
        .in('contract_id', contractIds)
        .eq('status', 'accepted');
    const volumeByContract = new Map(
        (bids || []).map(b => [b.contract_id, Number(b.energy_per_tick) || 0])
    );

    const agreementIds = [...new Set(contracts.map(c => c.trade_agreement_id).filter(Boolean))];
    if (agreementIds.length === 0) return map;
    const { data: agreements } = await supabase.from('trade_agreements')
        .select('id, nation_a_id, nation_b_id, status')
        .in('id', agreementIds);
    const agByAgId = new Map(
        (agreements || []).filter(a => a.status === 'active').map(a => [a.id, a])
    );

    function bucket(nationId) {
        if (!map.has(nationId)) map.set(nationId, _emptyCommodityFlows());
        return map.get(nationId);
    }

    for (const c of contracts) {
        const volumePerTick = volumeByContract.get(c.id) || 0;
        if (volumePerTick === 0) continue;
        const commodity = c.commodity;
        if (!COMMODITY_KEYS.includes(commodity)) continue;
        const ag = agByAgId.get(c.trade_agreement_id);
        if (!ag) continue;
        const buyerId  = c.nation_id;
        const sellerId = ag.nation_a_id === buyerId ? ag.nation_b_id : ag.nation_a_id;
        if (buyerId)  bucket(buyerId)[commodity]  += volumePerTick;
        if (sellerId) bucket(sellerId)[commodity] -= volumePerTick;
    }
    return map;
}

// Lookup helper: trading volume for a single commodity on a single
// nation. Used by the build*BucketDeltas builders below.
function _commodityTradingFor(nation, tradingByNation, commodity) {
    if (!tradingByNation || !nation?.id) return 0;
    const flows = tradingByNation.get(nation.id);
    if (!flows) return 0;
    return Number(flows[commodity]) || 0;
}

// Build {bucket, met_pct, deltas} for ENERGY on this nation, or null
// if no effects fire. Pure — no DB writes.
function buildEnergyBucketDeltas(nation, tradingByNation) {
    const energyStat   = Number(nation.energy)             || 0;
    const infraStat    = Number(nation.infrastructure)     || 0;
    const industryStat = Number(nation.industry)           || 0;
    const solStat      = Number(nation.standard_of_living) || 0;
    const popMillions  = (Number(nation.population) || 0) / 1_000_000;

    const production = energyStat / 3;
    const demand     = ((infraStat + industryStat) * solStat * Math.sqrt(popMillions)) / 3500;
    if (demand <= 0) return null;

    const trading = _commodityTradingFor(nation, tradingByNation, 'energy');
    const supply  = production + trading;
    const metPct  = supply / demand;

    if (metPct < 1.0) {
        return {
            bucket:  'under',
            met_pct: Math.round(metPct * 100),
            deltas:  { standard_of_living: -0.1, public_approval: -0.1, industry: -0.1 },
        };
    }
    if (metPct >= 1.2) {
        return {
            bucket:  'over',
            met_pct: Math.round(metPct * 100),
            deltas:  { standard_of_living: 0.05, cost_of_living: -0.05, public_approval: 0.05, service_sector: 0.05 },
        };
    }
    return null;
}

// Build {bucket, met_pct, deltas} for MINERALS on this nation.
function buildMineralsBucketDeltas(nation, tradingByNation) {
    const mineralsStat  = Number(nation.minerals)       || 0;
    // Mining/extraction is unskilled physical labour — read the
    // unskilled tier directly instead of averaging both tiers.
    const unskilledStat = Number(nation.unskilled_workers) || 0;
    const industryStat  = Number(nation.industry)       || 0;
    const infraStat     = Number(nation.infrastructure) || 0;

    const production = (mineralsStat / 3) * ((unskilledStat + industryStat) / 200);
    const demand     = (infraStat / 10) + (industryStat / 16);
    if (demand <= 0) return null;

    const trading = _commodityTradingFor(nation, tradingByNation, 'minerals');
    const supply  = production + trading;
    const metPct  = supply / demand;

    if (metPct < 1.0) {
        return {
            bucket:  'under',
            met_pct: Math.round(metPct * 100),
            deltas:  { infrastructure: -0.1, industry: -0.1, gdp_growth: -0.1 },
        };
    }
    if (metPct >= 1.2) {
        return {
            bucket:  'over',
            met_pct: Math.round(metPct * 100),
            deltas:  { standard_of_living: 0.05, infrastructure: 0.05, industry: 0.05, gdp_growth: 0.05 },
        };
    }
    return null;
}

// Build {bucket, met_pct, deltas} for FOOD on this nation.
//   production = (farmland / 2) × (workforce / 100)
//   demand     = population_M / 3
function buildFoodBucketDeltas(nation, tradingByNation) {
    const farmlandStat  = Number(nation.farmland)  || 0;
    // Agriculture runs on the unskilled labour tier.
    const unskilledStat = Number(nation.unskilled_workers) || 0;
    const popMillions   = (Number(nation.population) || 0) / 1_000_000;

    const production = (farmlandStat / 2) * (unskilledStat / 100);
    const demand     = popMillions / 3;
    if (demand <= 0) return null;

    const trading = _commodityTradingFor(nation, tradingByNation, 'food');
    const supply  = production + trading;
    const metPct  = supply / demand;

    if (metPct < 1.0) {
        return {
            bucket:  'under',
            met_pct: Math.round(metPct * 100),
            deltas:  {
                health:          -0.2,
                public_approval: -0.2,
                unrest:           0.2,
                crime:            0.1,
                workforce:       -0.1,
            },
        };
    }
    if (metPct >= 1.2) {
        return {
            bucket:  'over',
            met_pct: Math.round(metPct * 100),
            deltas:  {
                health:              0.1,
                public_approval:     0.1,
                standard_of_living:  0.05,
                cost_of_living:     -0.05,
            },
        };
    }
    return null;
}

// Build {bucket, met_pct, deltas} for CONSUMER GOODS on this nation.
//   production = (industry / 3) × (workforce / 100)
//   demand     = (standard_of_living / 100) × population_M / 2
function buildConsumerGoodsBucketDeltas(nation, tradingByNation) {
    const industryStat  = Number(nation.industry)           || 0;
    // Mass-production manufacturing is unskilled labour.
    const unskilledStat = Number(nation.unskilled_workers) || 0;
    const solStat       = Number(nation.standard_of_living) || 0;
    const popMillions   = (Number(nation.population) || 0) / 1_000_000;

    const production = (industryStat / 3) * (unskilledStat / 100);
    const demand     = (solStat / 100) * popMillions / 2;
    if (demand <= 0) return null;

    const trading = _commodityTradingFor(nation, tradingByNation, 'consumer_goods');
    const supply  = production + trading;
    const metPct  = supply / demand;

    if (metPct < 1.0) {
        return {
            bucket:  'under',
            met_pct: Math.round(metPct * 100),
            deltas:  {
                standard_of_living: -0.1,
                public_approval:    -0.1,
                cost_of_living:      0.1,
                crime:               0.05,
            },
        };
    }
    if (metPct >= 1.2) {
        return {
            bucket:  'over',
            met_pct: Math.round(metPct * 100),
            deltas:  {
                standard_of_living:  0.05,
                public_approval:     0.05,
                cost_of_living:     -0.05,
                gdp_growth:          0.05,
            },
        };
    }
    return null;
}

// Build {bucket, met_pct, deltas} for LUXURY GOODS on this nation.
//   production = (standard_of_living / 6) × ((education × service_sector) / 10000)
//   demand     = (standard_of_living / 100)² × population_M
function buildLuxuryGoodsBucketDeltas(nation, tradingByNation) {
    const solStat       = Number(nation.standard_of_living) || 0;
    const educationStat = Number(nation.education)          || 0;
    const serviceStat   = Number(nation.service_sector)     || 0;
    const popMillions   = (Number(nation.population) || 0) / 1_000_000;

    const production = (solStat / 6) * ((educationStat * serviceStat) / 10000);
    const demand     = Math.pow(solStat / 100, 2) * popMillions;
    if (demand <= 0) return null;

    const trading = _commodityTradingFor(nation, tradingByNation, 'luxury_goods');
    const supply  = production + trading;
    const metPct  = supply / demand;

    if (metPct < 1.0) {
        return {
            bucket:  'under',
            met_pct: Math.round(metPct * 100),
            deltas:  {
                public_approval:    -0.05,
                standard_of_living: -0.05,
            },
        };
    }
    if (metPct >= 1.2) {
        return {
            bucket:  'over',
            met_pct: Math.round(metPct * 100),
            deltas:  {
                standard_of_living:  0.05,
                cost_of_living:      0.05,
                public_approval:     0.05,
                gdp_growth:          0.05,
            },
        };
    }
    return null;
}

export async function processCommodityDemandEffects(supabase, nation, tradingByNation) {
    const sources = [];
    const energy = buildEnergyBucketDeltas(nation, tradingByNation);
    if (energy)   sources.push({ commodity: 'energy',   ...energy });
    const minerals = buildMineralsBucketDeltas(nation, tradingByNation);
    if (minerals) sources.push({ commodity: 'minerals', ...minerals });
    const food = buildFoodBucketDeltas(nation, tradingByNation);
    if (food)     sources.push({ commodity: 'food',     ...food });
    const consumer = buildConsumerGoodsBucketDeltas(nation, tradingByNation);
    if (consumer) sources.push({ commodity: 'consumer_goods', ...consumer });
    const luxury = buildLuxuryGoodsBucketDeltas(nation, tradingByNation);
    if (luxury)   sources.push({ commodity: 'luxury_goods', ...luxury });

    if (sources.length === 0) return null;

    // Merge deltas additively across commodities so two stats nudging
    // the same column (e.g. Energy + Minerals both touching industry)
    // sum cleanly into one update.
    const merged = {};
    for (const s of sources) {
        for (const [k, d] of Object.entries(s.deltas)) {
            merged[k] = (merged[k] || 0) + d;
        }
    }

    const updates = {};
    for (const [k, d] of Object.entries(merged)) {
        const cur  = Number(nation[k]) || 0;
        const next = Math.max(0, Math.min(100, cur + d));
        if (next !== cur) updates[k] = next;
    }
    if (Object.keys(updates).length === 0) return null;

    const { error } = await supabase.from('nations').update(updates).eq('id', nation.id);
    if (error) {
        console.warn(`[CommodityDemand] update failed for ${nation.name}:`, error.message);
        return null;
    }
    return { sources, applied: updates };
}

export async function processStatDecay(supabase, nation, policyDecayAdjustments = null, currentTick = 0) {
    const appliedDecay = [];
    const nationUpdates = {};

    for (const [statKey, config] of Object.entries(STAT_DECAY_CONFIG)) {
        if (!NATION_STAT_COLUMN_SET.has(statKey)) continue;

        const rawDecayVal = nation[statKey];
        // Skip if stat is null/undefined — never default to 50
        if (rawDecayVal === undefined || rawDecayVal === null) continue;
        const currentVal = Number(rawDecayVal);
        if (Number.isNaN(currentVal)) continue;
        let target = config.target;

        // Apply policy-driven floor/ceiling adjustments to the decay target
        const adj = policyDecayAdjustments?.[statKey];
        if (adj) {
            if (adj.floor > 0) {
                // Floor: raise the target so the stat won't decay below it
                target = Math.min(100, target + adj.floor);
            }
            if (adj.ceiling > 0) {
                // Ceiling: lower the target so the stat decays down toward it
                target = Math.max(0, target - adj.ceiling);
            }
        }

        if (currentVal === target) continue;

        const speed = config.speed;
        if (speed === 0) continue;

        let newVal;
        if (currentVal > target) {
            newVal = Math.max(target, currentVal - speed);
        } else {
            newVal = Math.min(target, currentVal + speed);
        }

        newVal = Math.round(Math.max(2, Math.min(98, newVal)));

        if (newVal !== Math.round(currentVal * 10) / 10) {
            nationUpdates[statKey] = newVal;
            const prevRounded = Math.round(currentVal * 10) / 10;
            _logStatDebug(supabase, nation, currentTick, statKey,
                'decay',
                `natural-decay (target=${target}, speed=${speed})`,
                speed, null, newVal - prevRounded,
                'natural');
            appliedDecay.push({
                stat: statKey,
                type: config.type,
                previousValue: prevRounded,
                newValue: newVal,
                target,
                speed,
            });
        }
    }

    // Enforce foundational law caps on stats.
    // Judicial Appointment Politicization Act: caps public_approval
    // at 30 (was the legacy judicial_independence cap; Phase 7H
    // collapsed legitimacy + judicial_independence + freedom_index
    // into public_approval, so the cap now applies to the merged
    // signal).
    if (nation.judicial_appointment_politicization) {
        const pa = nationUpdates.public_approval ?? Number(nation.public_approval ?? 50);
        if (pa > 30) nationUpdates.public_approval = 30;
    }
    // State Media Control Act: cap press_freedom at 40
    if (nation.state_media_control) {
        const pf = nationUpdates.press_freedom ?? 50;
        if (pf > 40) nationUpdates.press_freedom = 40;
    }

    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);

        if (error) {
            console.error('[processStatDecay] Nation stat update FAILED',
                { nationId: nation.id, payload: nationUpdates, error: error.message });
            return [];
        }

        console.log(`[processStatDecay] Decay applied for ${nation.name}: ${appliedDecay.length} stat(s)`);
        Object.assign(nation, nationUpdates);
    }

    return appliedDecay;
}

// ==================== NATIONAL VOLA CULTURE (Sports subtab — multiplicative decay) ====================

// Hidden stat on `nations` (0.0-100.0, NUMERIC(5,1)). Decays 3% per tick
// toward 0; raised by Sports Minister "Invest in National Sports Culture"
// action. Kept outside STAT_DECAY_CONFIG because that pipeline is
// additive; vola culture is multiplicative by design.
export const VOLA_CULTURE_DECAY_RATE = 0.03;

// Round to 1 decimal place — matches NUMERIC(5,1) on the column.
function _roundCulture(v) { return Math.round(v * 10) / 10; }

export async function processVolaCultureDecay(supabase, nation) {
    const cur   = Number(nation.national_vola_culture) || 0;
    const floor = Number(nation.vola_culture_floor) || 0;
    // Single rule: next = max(floor, cur × 0.97). Covers every case:
    //   cur=0, floor=0      → decayed=0,    next=0     → no-op
    //   cur=0, floor=4      → decayed=0,    next=4     → raise to floor
    //   cur=10, floor=4     → decayed=9.7,  next=9.7   → normal decay
    //   cur=4.2, floor=4    → decayed=4.07, next=4.07  → decay clamped at floor
    //   cur=4, floor=4      → decayed=3.88, next=4     → no-op (already at floor)
    // The previous early returns (cur<=0 / cur<=floor) bypassed the
    // floor lift on cur=0 and made the floor stat invisible until the
    // player invested.
    const decayed = _roundCulture(cur * (1 - VOLA_CULTURE_DECAY_RATE));
    const next    = Math.max(floor, decayed);
    if (next === cur) return null;

    const { error } = await supabase.from('nations')
        .update({ national_vola_culture: next })
        .eq('id', nation.id);
    if (error) {
        console.error('[processVolaCultureDecay] update failed', { nationId: nation.id, error: error.message });
        return null;
    }
    nation.national_vola_culture = next;
    return { previous: cur, next, delta: next - cur, floor };
}

// ==================== VOLA INVESTMENT (Sports Minister action) ====================

// Three tiers — cost in raw dollars (millions), deducted from
// ministries.sports.discretionary_balance. Funding articles on bills
// are the canonical path to top up that balance from the national
// treasury; the action itself only ever touches what's been earmarked
// for the ministry. Display drops the M suffix per UI preference
// ($2 / $5 / $8 visible, $2M / $5M / $8M deducted).
const _M = 1_000_000;
export const VOLA_INVESTMENT_LEVELS = Object.freeze({
    low:      { cost: 2 * _M, gain: 3, label: 'Low Investment' },
    moderate: { cost: 5 * _M, gain: 5, label: 'Moderate Investment' },
    high:     { cost: 8 * _M, gain: 7, label: 'High Investment' },
});
export const VOLA_INVESTMENT_COOLDOWN_TICKS = 1;
export const VOLA_INVESTMENT_ACTION_KEY = 'invest_in_sports_culture';

/**
 * Sports Minister: invest discretionary funds to raise National Sports
 * Culture. Returns { success, ... } so the caller (the modal in
 * party-actions.js) can render success/failure feedback.
 *
 * Validates: callerFactionId must own the active sports ministry row,
 * level must be one of the three tiers, discretionary_balance must
 * cover the tier cost, and the nation must be off cooldown.
 */
export async function investInVolaCulture(supabase, nation, callerFactionId, level, currentTick) {
    if (!VOLA_INVESTMENT_LEVELS[level]) return { success: false, reason: 'invalid_level' };
    if (!nation?.id) return { success: false, reason: 'no_nation' };

    // Routed through the SECURITY DEFINER RPC so authenticated clients
    // can write nations.budget + ministry_action_log (both gated by RLS
    // for non-admins). Server-side callers (tick processor) pass a
    // service-role client that bypasses RLS, but we still go through
    // the RPC for consistency. callerFactionId is implicit from auth.uid()
    // inside the RPC; the parameter is kept for back-compat with the
    // signature.
    const { data, error } = await supabase.rpc('invest_in_vola_culture', { p_level: level });
    if (error) return { success: false, reason: 'rpc_failed', error: error.message };
    if (!data?.success) {
        return {
            success: false,
            reason: data?.reason || 'unknown',
            readyAtTick: data?.ready_at_tick,
        };
    }

    // Mirror the RPC's culture write onto the local nation object so
    // the calling UI can render fresh values without a re-fetch.
    if (data.newCulture != null) nation.national_vola_culture = Number(data.newCulture);

    return {
        success:    true,
        level:      data.level || level,
        gain:       Number(data.gain || 0),
        cost:       Number(data.cost || 0),
        newCulture: Number(data.newCulture || 0),
        newBalance: Number(data.newBalance || 0),
    };
}

// ==================== VWC RANKINGS (global per-tick) ====================

/**
 * Recompute Vola World Cup rankings across every nation. Sort by
 * (national_vola_culture + random(-5,+5)) descending — random delta is
 * the user-spec'd "+/- 5 for some randomness" that lets close-culture
 * nations swap rank position tick-to-tick.
 *
 * Top 12 get vwc_ranking 1..12, everyone else 0. Only writes rows
 * whose rank actually changed (avoids spamming UPDATEs every tick on
 * a stable leaderboard).
 *
 * Called once per tick from the post-loop block in handler-template
 * (NOT per-nation — needs the full sorted set).
 */
export async function recomputeVwcRankings(supabase) {
    const { data: nations, error } = await supabase
        .from('nations')
        .select('id, national_vola_culture, vwc_ranking');
    if (error) {
        console.error('[recomputeVwcRankings] fetch failed:', error.message);
        return null;
    }
    if (!nations || nations.length === 0) return null;

    const ranked = nations.map(n => ({
        id: n.id,
        currentRank: Number(n.vwc_ranking) || 0,
        // ±5 random delta on top of the real culture stat. This is the
        // ranking input only — the underlying national_vola_culture
        // column is untouched.
        effective: (Number(n.national_vola_culture) || 0) + (Math.random() * 10 - 5),
    }));
    ranked.sort((a, b) => b.effective - a.effective);

    const updates = [];
    for (let i = 0; i < ranked.length; i++) {
        const newRank = i < 12 ? (i + 1) : 0;
        if (newRank !== ranked[i].currentRank) {
            updates.push({ id: ranked[i].id, newRank });
        }
    }
    if (updates.length === 0) return { changed: 0 };

    for (const u of updates) {
        const { error: uErr } = await supabase.from('nations')
            .update({ vwc_ranking: u.newRank }).eq('id', u.id);
        if (uErr) {
            console.warn('[recomputeVwcRankings] rank update failed:', uErr.message);
        }
    }
    return { changed: updates.length };
}

// ==================== STAT CONNECTIONS (threshold-triggered ripple effects) ====================

/**
 * Process stat connections for a nation. Each enabled connection checks whether
 * a source stat has crossed a threshold and, if so, nudges the target stat.
 *
 * Supports:
 *   - Delay: connection only fires after the source has been past the threshold
 *     for `delay_ticks` consecutive ticks (tracked by checking the live value each tick).
 *   - Dampening: effect weakens as the target approaches its natural limit (0 or 100).
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row (in-memory, mutated on success)
 * @param {number} currentTick - Current game tick
 * @param {Array}  connections - Pre-fetched stat_connections rows (enabled only)
 * @returns {Array<object>} Applied connection descriptors for tick summary
 */
export async function processStatConnections(supabase, nation, currentTick, connections) {
    if (!connections || connections.length === 0) return [];

    const applied = [];
    const nationUpdates = {};

    for (const conn of connections) {
        if (!NATION_STAT_COLUMN_SET.has(conn.source_stat) ||
            !NATION_STAT_COLUMN_SET.has(conn.target_stat)) continue;
        // GDP and debt are driven by dedicated systems — skip
        if (STAT_PROCESSOR_SKIP.has(conn.target_stat)) continue;

        const rawSource = nation[conn.source_stat];
        const rawTarget = nation[conn.target_stat];
        // Skip if source or target stat is null/undefined — never default to 50
        if (rawSource === undefined || rawSource === null || rawTarget === undefined || rawTarget === null) continue;
        const sourceVal = Number(rawSource);
        const targetVal = Number(rawTarget);
        if (Number.isNaN(sourceVal) || Number.isNaN(targetVal)) continue;

        // Check whether the source stat has crossed the threshold
        const triggered = conn.source_dir === 'above'
            ? sourceVal > conn.threshold
            : sourceVal < conn.threshold;

        if (!triggered) continue;

        // Delay: skip if delay_ticks > 0 (simplified — fires only when threshold
        // is currently crossed; for precise "N consecutive ticks" tracking you'd
        // need a separate state table, but this captures the design intent: delayed
        // connections only fire on ticks that are >= delay_ticks past the start)
        // For now, delay acts as a minimum tick offset from game start (tick 0)
        // where the connection becomes active. A more sophisticated version can
        // track per-nation crossing state later.
        if (conn.delay_ticks > 0 && currentTick < conn.delay_ticks) continue;

        // Compute magnitude with optional dampening
        let effectiveMag = Number(conn.magnitude);
        if (conn.dampening) {
            if (conn.target_dir === 'up') {
                // Weakens as target approaches 100
                effectiveMag *= (1 - targetVal / 100);
            } else {
                // Weakens as target approaches 0
                effectiveMag *= (targetVal / 100);
            }
        }

        if (Math.abs(effectiveMag) < 0.001) continue;

        let newVal = conn.target_dir === 'up'
            ? targetVal + effectiveMag
            : targetVal - effectiveMag;

        // Raw-value stats (gdp, debt, population) must not be clamped to 0-100
        if (RAW_SCALING_DIVISORS[conn.target_stat]) {
            newVal = Math.max(0, newVal);
        } else {
            newVal = Math.round(Math.max(2, Math.min(98, newVal)));
        }

        if (newVal !== Math.round(targetVal * 10) / 10) {
            const thisDelta = newVal - targetVal;
            _logStatDebug(supabase, nation, currentTick, conn.target_stat,
                'stat_link',
                `${conn.source_stat} ${conn.source_dir} ${conn.threshold} → ${conn.target_dir}`,
                Number(conn.magnitude),
                conn.dampening ? (conn.target_dir === 'up' ? (1 - targetVal / 100) : (targetVal / 100)) : 1,
                thisDelta,
                `source=${sourceVal}, target_pre=${targetVal}, dampening=${!!conn.dampening}`);

            // Accumulate — multiple connections can affect the same target
            if (nationUpdates[conn.target_stat] !== undefined) {
                // Add delta on top of already-accumulated value
                const prevDelta = nationUpdates[conn.target_stat] - targetVal;
                const accumulated = targetVal + prevDelta + thisDelta;
                nationUpdates[conn.target_stat] = RAW_SCALING_DIVISORS[conn.target_stat]
                    ? Math.max(0, accumulated)
                    : Math.round(Math.max(0, Math.min(100, accumulated)));
            } else {
                nationUpdates[conn.target_stat] = newVal;
            }

            applied.push({
                source: conn.source_stat,
                sourceValue: sourceVal,
                threshold: Number(conn.threshold),
                target: conn.target_stat,
                direction: conn.target_dir,
                previousValue: Math.round(targetVal * 10) / 10,
                newValue: nationUpdates[conn.target_stat],
                magnitude: Number(conn.magnitude),
                effectiveMagnitude: Math.round(effectiveMag * 1000) / 1000,
                dampened: conn.dampening
            });
        }
    }

    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);

        if (error) {
            console.error('[processStatConnections] Nation stat update FAILED',
                { nationId: nation.id, payload: nationUpdates, error: error.message });
            return [];
        }

        console.log(`[processStatConnections] Connections applied for ${nation.name}: ${applied.length} effect(s)`);
        Object.assign(nation, nationUpdates);
    }

    return applied;
}


// Outreach system removed — voter_blocs table no longer exists.

export async function executeEndorsementPreference(supabase, factionId, nationId, endorsedFactionId, currentTick, reason = 'endorsement_preference_update') {
    // faction_endorsements table has been removed; endorsements are not currently available.
    return { success: false, error: 'Endorsements are not available.' };
}


// ==================== ATTACK CAMPAIGN ====================

export const ATTACK_CONFIG = {
    AP_COST: 3,                 // base cost (used when polarization < 50)
    CREDIBILITY_COST: 20,       // credibility drops 20 per attack
    COOLDOWN_WINDOW: 6,         // look back 6 ticks for recent attacks
    COUNTER_ATTACK_WINDOW: 3,   // target can counter-attack within 3 ticks
    COUNTER_ATTACK_AP_COST: 1,  // counter-attack costs only 1 AP
    COUNTER_ATTACK_BONUS: 2,    // +2 effectiveness bonus for counter-attacks
    // Escalating AP cost thresholds — attacks cost more when polarization is high
    AP_TIERS: [
        { minPol: 85, cost: 6 },
        { minPol: 70, cost: 5 },
        { minPol: 50, cost: 4 },
        { minPol: 0,  cost: 3 },
    ],
};

/**
 * Get the AP cost for a Campaign Attack based on current polarization.
 * Higher polarization → higher cost to discourage polarization farming.
 */
export function getAttackAPCost(polarization) {
    const pol = polarization || 0;
    for (const tier of ATTACK_CONFIG.AP_TIERS) {
        if (pol >= tier.minPol) return tier.cost;
    }
    return ATTACK_CONFIG.AP_COST;
}

export const ATTACK_VECTORS = [
    {
        id: 'voting_record',
        name: 'Voting Record',
        icon: '\u00A7',
        description: 'Highlight unpopular or controversial votes',
        evidence_required: true,
        effectiveness: 'high',
    },
    {
        id: 'ideology',
        name: 'Ideology',
        icon: '\u25C6',
        description: 'Frame their positions as extreme or out of touch',
        evidence_required: false,
        effectiveness: 'moderate',
    },
    {
        id: 'smear',
        name: 'General Smear',
        icon: '\u25CF',
        description: 'No specific ammunition \u2014 just negative framing',
        evidence_required: false,
        effectiveness: 'low',
    },
];

export const ATTACK_OUTCOMES = [
    { id: 'devastating', name: 'Devastating Hit', icon: '\u2726', targetMin: -7, targetMax: -5, selfMin: 3, selfMax: 3, polarization: 0.25 },
    { id: 'effective', name: 'Effective Attack', icon: '\u25CF', targetMin: -4, targetMax: -3, selfMin: 1, selfMax: 2, polarization: 0.25 },
    { id: 'glancing', name: 'Glancing Blow', icon: '\u25E6', targetMin: -1, targetMax: -1, selfMin: 0, selfMax: 0, polarization: 0.25 },
    { id: 'backfire', name: 'Backfire', icon: '\u26A0', targetMin: 1, targetMax: 2, selfMin: -4, selfMax: -2, polarization: 0.25 },
    { id: 'mutual', name: 'Mutual Destruction', icon: '\u2715', targetMin: -3, targetMax: -3, selfMin: -2, selfMax: -2, polarization: 0.25 },
];

/**
 * Get outcome probability weights based on evidence strength.
 */
export function getAttackOutcomeWeights(strength) {
    if (strength === 'strong') {
        return { devastating: 22, effective: 38, glancing: 22, backfire: 8, mutual: 10 };
    } else if (strength === 'moderate') {
        return { devastating: 10, effective: 28, glancing: 30, backfire: 18, mutual: 14 };
    } else {
        return { devastating: 4, effective: 18, glancing: 30, backfire: 30, mutual: 18 };
    }
}

/**
 * Roll an attack outcome from weighted probabilities.
 */
function rollAttackOutcome(weights) {
    const order = ['devastating', 'effective', 'glancing', 'backfire', 'mutual'];
    let sum = 0;
    const cumulative = [];
    for (const key of order) {
        sum += weights[key] || 0;
        cumulative.push({ id: key, threshold: sum });
    }
    const roll = Math.random() * sum;
    for (const c of cumulative) {
        if (roll <= c.threshold) return c.id;
    }
    return 'glancing';
}

/**
 * Generate a contextual headline for the attack outcome.
 */
function _attackHeadline(outcomeId, targetName, vectorId) {
    const headlines = {
        devastating: {
            voting_record: `${targetName}'s voting record exposed \u2014 public outrage mounts`,
            ideology: `${targetName} branded as extremists in viral opposition campaign`,
            smear: `Relentless attacks leave ${targetName} scrambling to respond`,
        },
        effective: {
            voting_record: `${targetName}'s controversial votes draw media scrutiny`,
            ideology: `Voters question ${targetName}'s ideological direction after critique`,
            smear: `Negative campaign against ${targetName} lands some punches`,
        },
        glancing: {
            voting_record: `Criticism of ${targetName}'s votes dismissed as political theatre`,
            ideology: `Ideological attack on ${targetName} largely ignored by public`,
            smear: `Smear campaign against ${targetName} fizzles \u2014 voters indifferent`,
        },
        backfire: {
            voting_record: `Voters rally behind ${targetName} after what they see as unfair attack`,
            ideology: `Ideological attack makes attackers look petty \u2014 ${targetName} gains sympathy`,
            smear: `Baseless smear against ${targetName} draws media rebuke`,
        },
        mutual: {
            voting_record: `Mudslinging over voting records erodes public trust in politics`,
            ideology: `Ideological warfare between parties leaves voters disgusted`,
            smear: `Negative spiral damages both parties \u2014 polarization spikes`,
        },
    };
    return (headlines[outcomeId] && headlines[outcomeId][vectorId])
        || `Attack campaign against ${targetName} produces ${outcomeId} result`;
}

/**
 * Gather attack evidence (controversial votes, stat deterioration)
 * for a target party. Used by the UI to show available attack vectors.
 */
export async function gatherAttackEvidence(supabase, targetFactionId, nationId, currentTick) {
    const evidence = {
        controversial_votes: [],
    };

    // 1. Controversial votes — bills where this party voted opposite to majority outcome
    const { data: recentBills } = await supabase
        .from('bills')
        .select('id, bill_name, status, bill_support(faction_id, stance), bill_articles(policy_id, policies(policy_name))')
        .eq('nation_id', nationId)
        .in('status', ['passed', 'failed', 'enacted'])
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

    for (const bill of (recentBills || [])) {
        const support = bill.bill_support || [];
        const targetVote = support.find(s => s.faction_id === targetFactionId);
        if (!targetVote) continue;

        // Controversial = voted against a bill that passed, or voted for a bill that failed
        const controversial =
            (bill.status === 'passed' || bill.status === 'enacted') && targetVote.stance === 'reject' ||
            bill.status === 'failed' && targetVote.stance === 'accept';

        if (controversial) {
            evidence.controversial_votes.push({
                bill: bill.bill_name,
                stance: targetVote.stance,
                outcome: bill.status,
            });
        }
    }
    evidence.controversial_votes = evidence.controversial_votes.slice(0, 5);

    return evidence;
}

/**
 * Build available attack vectors for a target based on gathered evidence.
 */
export function buildAttackVectors(evidence) {
    const vectors = [];

    if (evidence.controversial_votes.length > 0) {
        vectors.push({
            ...ATTACK_VECTORS[0],
            evidence: evidence.controversial_votes,
            strength: 'strong',
        });
    }

    // Ideology is always available (moderate strength)
    vectors.push({
        ...ATTACK_VECTORS[1],
        evidence: null,
        strength: 'moderate',
    });

    // General smear is always available (weak strength)
    vectors.push({
        ...ATTACK_VECTORS[2],
        evidence: null,
        strength: 'weak',
    });

    return vectors;
}

/**
 * Execute an attack campaign against a target party.
 * Returns { success, outcomeId, outcomeName, headline, effects, weights, opensCounter, newAp }
 */
export async function executeAttack(supabase, factionId, nationId, targetFactionId, vectorId, currentTick) {
    // ── 1. Validate AP (with leader trait modifiers + polarization scaling) ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, faction_name, leader_positive_traits, leader_negative_traits, last_action_tick').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    const baseAttackCost = getAttackAPCost(0);
    const attackApMod = getTraitAPModifier('attack', faction, currentTick);
    const effectiveAttackCost = Math.max(1, baseAttackCost + attackApMod);
    if ((faction.action_points || 0) < effectiveAttackCost)
        return { success: false, error: `Not enough AP. Need ${effectiveAttackCost}.` };

    // ── 2. Load target ──
    const { data: targetFaction } = await supabase
        .from('factions').select('faction_name, abbreviation').eq('id', targetFactionId).single();
    if (!targetFaction) return { success: false, error: 'Target party not found.' };

    // ── 3. Check recent attacks (cooldown) ──
    const { data: recentAttacks } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'attack')
        .gte('tick_performed', currentTick - ATTACK_CONFIG.COOLDOWN_WINDOW)
        .order('tick_performed', { ascending: false });

    const attackedThisTick = (recentAttacks || []).some(r => r.tick_performed === currentTick);
    if (attackedThisTick)
        return { success: false, error: 'Already launched an attack this tick.' };

    // ── 4. Gather evidence and validate vector ──
    const evidence = await gatherAttackEvidence(supabase, targetFactionId, nationId, currentTick);
    const vectors = buildAttackVectors(evidence);
    const vector = vectors.find(v => v.id === vectorId);
    if (!vector) return { success: false, error: 'Invalid attack vector.' };
    if (vector.evidence_required && (!vector.evidence || vector.evidence.length === 0))
        return { success: false, error: `No evidence available for ${vector.name}.` };

    // ── 5. Roll outcome ──
    const weights = getAttackOutcomeWeights(vector.strength);
    const outcomeId = rollAttackOutcome(weights);
    const outcome = ATTACK_OUTCOMES.find(o => o.id === outcomeId);

    // ── 6. Calculate effects ──
    const targetDelta = outcome.targetMin + Math.floor(Math.random() * (outcome.targetMax - outcome.targetMin + 1));
    const selfDelta = outcome.selfMin + Math.floor(Math.random() * (outcome.selfMax - outcome.selfMin + 1));

    // ── 7. Apply effects via electorate engine ──
    const effects = [];

    // Target party: approval hit + credibility damage
    if (targetDelta !== 0) {
        const approvalDelta = _round2(targetDelta * 0.3);
        const credDelta = _round3(targetDelta * 0.01);
        await _adjustMomentum(supabase, targetFactionId, nationId, approvalDelta, 'attack', currentTick);
        await _adjustCredibility(supabase, targetFactionId, nationId, credDelta, 0, currentTick, { source: 'attack:received' });
        effects.push({ label: targetFaction.faction_name, value: targetDelta });
    }

    // Self: credibility change (attacks can backfire or boost credibility)
    if (selfDelta !== 0) {
        const selfLabel = selfDelta > 0 ? 'Your party (credibility gain)' : 'Your party (credibility loss)';
        const selfCredDelta = _round3(selfDelta * 0.01);
        await _adjustCredibility(supabase, factionId, nationId, selfCredDelta, 0, currentTick, { source: 'attack:self' });
        effects.push({ label: selfLabel, value: selfDelta });
    }

    // Polarization mechanic retired by alpha stats refactor (column
    // deleted with no replacement). The outcome.polarization signal
    // from political-action templates still flows in but no longer
    // writes to a column. Effects record retained so historical
    // event_log shows the intended impact.
    if (outcome.polarization > 0) {
        effects.push({ label: 'Polarization', value: outcome.polarization });
    }

    // ── 8. Deduct AP + track last_action_tick ──
    const attackDetail = 'Campaign Attack' + (attackApMod !== 0 ? ' (trait ' + (attackApMod > 0 ? '+' : '') + attackApMod + ')' : '');
    const apResult = await deductAP(supabase, factionId, effectiveAttackCost, { reason: 'attack', detail: attackDetail, tick: currentTick });
    await supabase.from('factions').update({ last_action_tick: currentTick }).eq('id', factionId).then(({ error }) => { if (error) console.warn('[Attack] last_action_tick update failed:', error.message); });

    // ── 9. Generate headline ──
    const headline = _attackHeadline(outcomeId, targetFaction.faction_name, vectorId);

    // ── 10. Log action ──
    const opensCounter = ['devastating', 'effective'].includes(outcomeId);
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'attack',
        ap_cost: effectiveAttackCost,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            targetFactionId,
            targetName: targetFaction.faction_name,
            targetAbbrev: targetFaction.abbreviation,
            vectorId,
            vectorName: vector.name,
            strength: vector.strength,
            outcomeId,
            outcomeName: outcome.name,
            headline,
            effects,
            weights,
            opensCounter,
            counterWindowEnd: opensCounter ? currentTick + ATTACK_CONFIG.COUNTER_ATTACK_WINDOW : null,
        }
    });

    // Electorate engine: credibility damage + visibility + activity log
    try { await onAttack(supabase, factionId, targetFactionId, nationId, outcomeId, vector.strength, currentTick); } catch (e) {
        console.error('[Attack] Electorate hook failed (non-fatal):', e.message);
    }

    return {
        success: true,
        outcomeId,
        outcomeName: outcome.name,
        headline,
        effects,
        weights,
        opensCounter,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - effectiveAttackCost),
    };
}


// ── Rounding helpers (mirrors advance-tick) ──
function _round2(v) { return Math.round(v * 100) / 100; }
function _round3(v) { return Math.round(v * 1000) / 1000; }

/**
 * Nudge a faction's party_approval in faction_electoral_standing.
 * Local helper — calls adjust_momentum RPC with error handling and null guards.
 */
async function _adjustMomentum(supabase, factionId, nationId, delta, source, tick = 0) {
    if (!factionId || delta === 0) return;
    try {
        await supabase.rpc('adjust_momentum', {
            p_faction_id: factionId,
            p_delta: delta,
            p_label: source || 'unknown',
            p_tick: tick
        });
    } catch (e) {
        console.warn(`[_nudgeApproval] adjust_momentum failed for ${factionId}:`, e.message);
    }
}

// No-op: credibility_modifier column repurposed for momentum (3-pillar election system).
async function _adjustCredibility() { return; }


// ==================== AUTOCRACY SEAT REBALANCING ====================

/**
 * If a faction is disbanded (or for any reason the sum of all
 * faction seats is less than the nation's total_seats), proportionally
 * redistribute the vacant seats across the remaining factions.
 *
 * Uses the Largest Remainder method (same as allocateSeatsByVotes in
 * election-simulation.js) with existing seat counts as weights.
 */
export async function rebalanceVacantSeats(supabase, nation) {
    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;

    const { data: factions, error } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (error || !factions || factions.length === 0) return null;

    // Proportional redistribution of vacant seats
    const currentSum = factions.reduce((s, f) => s + (f.seats || 0), 0);
    const vacantSeats = totalSeats - currentSum;

    if (vacantSeats <= 0) return null; // No vacant seats

    // If no election has ever been held, don't distribute seats — they should
    // remain at 0 until the first election actually runs.
    if (currentSum === 0) {
        const { count: electionCount } = await supabase
            .from('elections')
            .select('id', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .eq('status', 'completed');
        if (!electionCount || electionCount === 0) {
            return null;
        }
    }

    console.log(`[rebalanceVacantSeats] ${nation.name}: ${vacantSeats} vacant seat(s) detected (${currentSum}/${totalSeats}). Redistributing.`);

    // All factions at 0 seats — distribute evenly (only reachable after an election has occurred)
    if (currentSum === 0) {
        const perParty = Math.floor(totalSeats / factions.length);
        let remainder = totalSeats - perParty * factions.length;
        const updates = [];
        for (const f of factions) {
            const newSeats = perParty + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder--;
            updates.push({ id: f.id, name: f.faction_name, oldSeats: f.seats || 0, newSeats });
        }
        for (const u of updates) {
            await supabase.from('factions').update({ seats: u.newSeats }).eq('id', u.id);
        }
        return { nation: nation.name, vacantSeats, updates };
    }

    // Standard Largest Remainder: allocate totalSeats proportionally by current seat share
    const quota = currentSum / totalSeats;
    const fractionals = [];
    const newSeats = {};
    let allocated = 0;

    for (const f of factions) {
        const raw = (f.seats || 0) / quota;
        const guaranteed = Math.floor(raw);
        newSeats[f.id] = guaranteed;
        allocated += guaranteed;
        fractionals.push({ id: f.id, fractional: raw - guaranteed });
    }

    let remaining = totalSeats - allocated;
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remaining && i < fractionals.length; i++) {
        newSeats[fractionals[i].id] = (newSeats[fractionals[i].id] || 0) + 1;
    }

    const updates = [];
    for (const f of factions) {
        const ns = newSeats[f.id] || 0;
        if (ns !== (f.seats || 0)) {
            updates.push({ id: f.id, name: f.faction_name, oldSeats: f.seats || 0, newSeats: ns });
            await supabase.from('factions').update({ seats: ns }).eq('id', f.id);
        }
    }

    if (updates.length > 0) {
        console.log(`[rebalanceVacantSeats] ${nation.name}: Seats rebalanced:`,
            updates.map(u => `${u.name}: ${u.oldSeats}→${u.newSeats}`).join(', '));
    }

    return { nation: nation.name, vacantSeats, updates };
}

// (Loyalty tick, Standing tick, Regime pillars tick removed — Phase 0)

// (Steward tick, Autocracy v2 faction actions, Coalition detection, Shakeup auto-resolve removed — Phase 0)

// ==================== STAT EFFECTS PROCESSING ====================

export async function processStatEffects(supabase, nation, currentTick) {
    let activeLaws;

    // Try join query first; fall back to separate lookup if FK is missing.
    // Phase 4.4: also embed the chosen policy_option so per-tick stat effects
    // come from the option that's actually active for this nation, not the
    // legacy policies.stat_effects column (which Phase 2.5 stopped writing).
    const { data, error: joinError } = await supabase
        .from('active_laws')
        .select('*, policies(*), selected_option:policy_options!selected_option_id(*)')
        .eq('nation_id', nation.id);

    if (joinError) {
        console.warn('[processStatEffects] Join query failed, falling back to separate policy lookup:', joinError.message);
        const { data: lawsOnly, error: fallbackError } = await supabase
            .from('active_laws')
            .select('*')
            .eq('nation_id', nation.id);

        if (fallbackError || !lawsOnly || lawsOnly.length === 0) {
            if (fallbackError) console.error('[processStatEffects] Fallback query also failed:', fallbackError.message);
            return [];
        }

        // Fetch policies separately and attach them
        const policyIds = [...new Set(lawsOnly.filter(l => l.policy_id).map(l => l.policy_id))];
        if (policyIds.length > 0) {
            const { data: policies } = await supabase
                .from('policies')
                .select('*')
                .in('id', policyIds);
            const policyMap = {};
            for (const p of (policies || [])) policyMap[p.id] = p;
            for (const law of lawsOnly) {
                law.policies = policyMap[law.policy_id] || null;
            }
        }
        activeLaws = lawsOnly;
    } else {
        activeLaws = data;
        // If join succeeded but policies are null for every law, try separate lookup
        if (activeLaws && activeLaws.length > 0 && activeLaws.every(l => !l.policies && l.policy_id)) {
            console.warn('[processStatEffects] Join returned null policies for all laws — fetching separately');
            const policyIds = [...new Set(activeLaws.filter(l => l.policy_id).map(l => l.policy_id))];
            if (policyIds.length > 0) {
                const { data: policies } = await supabase
                    .from('policies')
                    .select('*')
                    .in('id', policyIds);
                const policyMap = {};
                for (const p of (policies || [])) policyMap[p.id] = p;
                for (const law of activeLaws) {
                    if (!law.policies && law.policy_id) law.policies = policyMap[law.policy_id] || null;
                }
            }
        }
    }

    if (!activeLaws || activeLaws.length === 0) {
        console.log(`[processStatEffects] No active laws for ${nation.name}`);
        return [];
    }

    console.log(`[processStatEffects] Processing ${activeLaws.length} active law(s) for ${nation.name}`);

    const appliedEffects = [];
    const nationUpdates = {};
    const lawsToAdvance = [];
    const lawsToDelete = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        const effectSource = `active_law=${law.id}, bill=${law.bill_id || 'unknown'}, policy=${policy?.id || 'unknown'} (${policy?.policy_name || 'Unknown'})`;
        const lastApplied = law.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const passedTick = law.passed_tick || 0;

        let effects = [];
        const isReversal = law.is_reversal || false;

        if (isReversal && law.reversal_effects && Array.isArray(law.reversal_effects)) {
            effects = law.reversal_effects;
        } else if (policy) {
            // Phase 4.4: prefer the active option's stat_effects. Fall back
            // to policies.stat_effects (orphaned data) and finally to the
            // legacy single-stat columns.
            const optionEffects = law.selected_option?.stat_effects;
            if (Array.isArray(optionEffects) && optionEffects.length > 0) {
                effects.push(...optionEffects);
            } else if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
                effects.push(...policy.stat_effects);
            } else if (policy.target_stat) {
                effects.push({
                    stat_key: policy.target_stat,
                    direction: (policy.stat_direction || 'UP').toLowerCase(),
                    rate: policy.stat_change_per_tick || 1,
                    delay_ticks: 0,
                    duration_ticks: policy.duration_months || 12
                });
            }
        } else if (!isReversal) {
            console.warn(`[processStatEffects] Active law ${law.id} (bill=${law.bill_id}) has NULL policy (policy_id=${law.policy_id}) — no stat effects will be applied`);
        }

        if (effects.length === 0) {
            lawsToAdvance.push(law.id);
            continue;
        }

        let anyEffectApplied = false;
        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSincePassed = tick - passedTick;

            for (const eff of effects) {
                // Phase 4 alpha-stats shim: translateStatEffect remaps the
                // legacy 80-stat keys onto the new 19-column schema (and
                // flips direction for inversions like unemployment →
                // workforce). Returns null for stats deleted with no
                // replacement — those entries skip silently.
                const translated = translateStatEffect(eff);
                if (!translated) {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid/deleted stat_key "${eff.stat_key || eff.stat}" for ${effectSource}`
                        );
                    }
                    continue;
                }
                const delay = Number(translated.delay_ticks) || 0;
                const duration = Number(translated.duration_ticks) || 12;
                const rate = Number(translated.rate) || 1;
                const dir = String(translated.direction || '').toLowerCase();
                const statKey = translated.stat_key;

                if (dir !== 'up' && dir !== 'down') {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid direction "${translated.direction}" for stat_key="${eff.stat_key || eff.stat}" from ${effectSource}`
                        );
                    }
                    continue;
                }

                if (ticksSincePassed <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSincePassed > delay && ticksSincePassed <= delay + duration) {
                    // GDP and debt are driven by dedicated systems — skip
                    if (STAT_PROCESSOR_SKIP.has(statKey)) continue;

                    const rawVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : null);
                    // Guard: if stat is null/undefined in DB, log warning and skip — never default to 50
                    if (rawVal === null || Number.isNaN(rawVal)) {
                        console.warn(`[processStatEffects] Stat "${statKey}" is null/NaN for ${nation.name} — skipping effect to prevent corruption`);
                        continue;
                    }
                    const currentVal = rawVal;

                    // For raw-value stats (population), scale rate by divisor
                    // so rate: 1 means +1M for population
                    let scaledRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;

                    // Debt service burden: reduce government-spending-dependent stat effects
                    if (SPENDING_AFFECTED_STATS.has(statKey)) {
                        scaledRate *= getSpendingEffectivenessMultiplier(nation);
                    }

                    let newVal;
                    if (dir === 'up') {
                        newVal = currentVal + scaledRate;
                    } else {
                        newVal = currentVal - scaledRate;
                    }

                    // Raw-value stats — don't clamp to 0-100
                    if (RAW_SCALING_DIVISORS[statKey]) {
                        newVal = Math.max(0, newVal);
                    } else {
                        // Clamp 0-100 scale stats to 2-98 floor/ceiling to prevent edge-case corruption
                        newVal = Math.round(Math.max(2, Math.min(98, newVal)));
                    }
                    nationUpdates[statKey] = newVal;
                    anyEffectApplied = true;

                    const policyLabel = isReversal ? '↩ Reversal: ' + (policy?.policy_name || 'Unknown') : (policy?.policy_name || 'Unknown');
                    const signedRate = dir === 'up' ? rate : -rate;
                    const signedScaled = dir === 'up' ? scaledRate : -scaledRate;
                    _logStatDebug(supabase, nation, tick, statKey,
                        'policy',
                        policyLabel,
                        signedRate,
                        rate !== 0 ? (signedScaled / signedRate) : null,
                        newVal - currentVal,
                        `dir=${dir}, raw_to_applied_window_tick=${tick}, ticksSincePassed=${ticksSincePassed}`);

                    appliedEffects.push({
                        policy: policyLabel,
                        stat: statKey,
                        direction: dir,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        lawsToAdvance.push(law.id);

        if (isReversal && allEffectsComplete) {
            lawsToDelete.push(law.id);
        }
    }

    let nationUpdateError = null;
    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);
        nationUpdateError = error;
    }

    if (nationUpdateError) {
        console.error(
            '[processStatEffects] Nation stat update FAILED',
            { nationId: nation.id, payload: nationUpdates, error: nationUpdateError.message }
        );
        return [];
    }

    if (Object.keys(nationUpdates).length > 0) {
        console.log(`[processStatEffects] Nation stats updated for ${nation.name}:`, JSON.stringify(nationUpdates));
        // Propagate DB-written values to in-memory nation for downstream tick steps (3b-9)
        Object.assign(nation, nationUpdates);
    }

    for (const id of lawsToAdvance) {
        const { error: trackErr } = await supabase
            .from('active_laws')
            .update({ effects_applied_through_tick: currentTick })
            .eq('id', id);
        if (trackErr) {
            console.error(`[processStatEffects] Tracking update FAILED for active_law ${id}:`, trackErr.message);
        }
    }

    for (const id of lawsToDelete) {
        await supabase.from('active_laws').delete().eq('id', id);
    }

    return appliedEffects;
}

/**
 * Process ministry action stat effects during tick advancement.
 * Mirrors processStatEffects but reads from ministry_action_log.
 */
export async function processMinistryActions(supabase, nation, currentTick) {
    const { data: actions, error: fetchError } = await supabase
        .from('ministry_action_log')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('processed', false);

    if (fetchError) {
        console.error('[processMinistryActions] Failed to fetch actions:', fetchError.message);
        return [];
    }
    if (!actions || actions.length === 0) return [];

    const appliedEffects = [];
    const nationUpdates = {};
    // Track minister approval changes keyed by ministry_key + faction_id
    const ministerUpdates = {};
    // Track initial minister approval values for cascade delta calculation
    const ministerBaseline = {};
    // Track faction approval changes keyed by faction_id
    const factionUpdates = {};
    const factionBaseline = {};
    // Defer tracking updates until after nation stats are persisted
    const trackingUpdates = [];

    for (const action of actions) {
        const effects = action.stat_effects;
        if (!effects || !Array.isArray(effects) || effects.length === 0) {
            // No effects — mark as processed
            await supabase.from('ministry_action_log').update({ processed: true }).eq('id', action.id);
            continue;
        }

        const lastApplied = action.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const appliedTick = action.applied_at_tick || 0;

        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSinceAction = tick - appliedTick;

            for (const eff of effects) {
                const delay = Number(eff.delay_ticks) || 0;
                const duration = Number(eff.duration_ticks) || 4;
                const rate = Number(eff.rate) || 1;
                const target = eff.target || 'nation';
                const rawStatKey = eff.stat_key;
                const statKey = (target === 'nation') ? normalizeNationStatKey(rawStatKey) : rawStatKey;
                if (target === 'nation' && (!statKey || !NATION_STAT_COLUMN_SET.has(statKey))) {
                    console.warn(`[processMinistryActions] Skipping invalid stat_key "${rawStatKey}" for action "${action.action_key}" in ${nation.name}`);
                    continue;
                }

                if (ticksSinceAction <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSinceAction > delay && ticksSinceAction <= delay + duration) {
                    let currentVal, newVal;

                    if (target === 'minister') {
                        const mKey = action.ministry_key + ':' + action.faction_id;
                        if (ministerUpdates[mKey] === undefined) {
                            // Fetch current minister_approval from the ministries table
                            const { data: ministry } = await supabase
                                .from('ministries')
                                .select('minister_approval')
                                .eq('nation_id', nation.id)
                                .eq('ministry_key', action.ministry_key)
                                .eq('party_id', action.faction_id)
                                .single();
                            ministerUpdates[mKey] = (ministry?.minister_approval ?? MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL);
                            ministerBaseline[mKey] = ministerUpdates[mKey];
                        }
                        currentVal = ministerUpdates[mKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        ministerUpdates[mKey] = newVal;
                    } else if (target === 'faction') {
                        const fKey = action.faction_id;
                        if (factionUpdates[fKey] === undefined) {
                            const { data: standing } = await supabase
                                .from('faction_electoral_standing')
                                .select('party_approval')
                                .eq('faction_id', action.faction_id)
                                .eq('nation_id', nation.id)
                                .maybeSingle();
                            factionUpdates[fKey] = (standing?.party_approval ?? 50);
                            factionBaseline[fKey] = factionUpdates[fKey];
                        }
                        currentVal = factionUpdates[fKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        factionUpdates[fKey] = newVal;
                    } else {
                        // Default: nation stat
                        // GDP and debt are driven by dedicated systems — skip
                        if (STAT_PROCESSOR_SKIP.has(statKey)) continue;
                        const rawMinVal = nationUpdates[statKey] !== undefined
                            ? nationUpdates[statKey]
                            : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : null);
                        // Guard: skip if stat is null/NaN — never default to 50
                        if (rawMinVal === null || Number.isNaN(rawMinVal)) {
                            console.warn(`[processMinistryActions] Stat "${statKey}" is null/NaN for ${nation.name} — skipping`);
                            continue;
                        }
                        currentVal = rawMinVal;
                        let scaledMinistryRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;
                        newVal = eff.direction === 'up' ? currentVal + scaledMinistryRate : currentVal - scaledMinistryRate;
                        // Raw-value stats (debt, population) must not be clamped to 0-100
                        if (RAW_SCALING_DIVISORS[statKey]) {
                            newVal = Math.max(0, newVal);
                        } else {
                            newVal = Math.round(Math.max(2, Math.min(98, newVal)));
                        }
                        nationUpdates[statKey] = newVal;
                    }

                    appliedEffects.push({
                        action: action.action_key,
                        ministry: action.ministry_key,
                        stat: statKey,
                        target: target,
                        direction: eff.direction,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        // Defer tracking update — only apply after nation stats are persisted
        trackingUpdates.push({ id: action.id, allEffectsComplete, actionKey: action.action_key, ministryKey: action.ministry_key });
    }

    // Bulk update nation stats FIRST — before advancing tracking
    let nationUpdateFailed = false;
    if (Object.keys(nationUpdates).length > 0) {
        const { error: nationError } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        if (nationError) {
            console.error('[processMinistryActions] Nation stat update FAILED — effects will be retried next tick',
                { nationId: nation.id, payload: nationUpdates, error: nationError.message });
            nationUpdateFailed = true;
        } else {
            console.log('[processMinistryActions] Nation stats updated:', JSON.stringify(nationUpdates));
        }
    }

    // Only advance tracking if nation update succeeded (or had nothing to update)
    if (!nationUpdateFailed) {
        for (const tu of trackingUpdates) {
            await supabase.from('ministry_action_log').update({
                effects_applied_through_tick: currentTick,
                processed: tu.allEffectsComplete
            }).eq('id', tu.id);

            // Fire expiration event when oil reserve release effects conclude
            if (tu.allEffectsComplete && tu.actionKey === 'releaseOilReserves') {
                const { error: releaseEvtErr } = await supabase.rpc('fire_system_event', {
                    p_nation_id: nation.id,
                    p_trigger_key: 'energy_release_oil_reserves_expired',
                    p_tick: currentTick,
                    p_placeholders: {}
                });
                if (releaseEvtErr) console.error('[processMinistryActions] release expired event error:', releaseEvtErr.message);
            }
        }
    }

    // Bulk update minister approval
    for (const mKey of Object.keys(ministerUpdates)) {
        const [ministryKey, factionId] = mKey.split(':');
        await supabase.from('ministries')
            .update({ minister_approval: ministerUpdates[mKey] })
            .eq('nation_id', nation.id)
            .eq('ministry_key', ministryKey)
            .eq('party_id', factionId);
    }

    // Cascade minister approval LOSSES to party approval (PM losses at 2x)
    for (const mKey of Object.keys(ministerUpdates)) {
        const baseline = ministerBaseline[mKey];
        const current = ministerUpdates[mKey];
        if (baseline === undefined || current >= baseline) continue; // only losses cascade
        const [ministryKey, factionId] = mKey.split(':');
        const loss = baseline - current;
        const multiplier = ministryKey === 'prime_minister' ? 2 : 1;
        // Load faction approval into factionUpdates if not already tracked
        if (factionUpdates[factionId] === undefined) {
            const { data: standing } = await supabase
                .from('faction_electoral_standing')
                .select('party_approval')
                .eq('faction_id', factionId)
                .eq('nation_id', nation.id)
                .maybeSingle();
            factionUpdates[factionId] = (standing?.party_approval ?? 50);
            factionBaseline[factionId] = factionUpdates[factionId];
        }
        factionUpdates[factionId] = Math.max(0, factionUpdates[factionId] - (loss * multiplier));
    }

    // Bulk update faction party_approval via event cascades
    for (const fKey of Object.keys(factionUpdates)) {
        const delta = Math.round((factionUpdates[fKey] - (factionBaseline[fKey] ?? 50)) * 10) / 10;
        if (delta !== 0) {
            await _adjustMomentum(supabase, fKey, nation.id, _round2(delta * 0.3), 'rally', currentTick);
        }
    }

    return appliedEffects;
}

// ==================== LAYER 1: PER-TICK MINISTER APPROVAL ====================

/**
 * Delta-based minister approval model.
 *
 * Each minister's approval moves based on how their owned stats have changed
 * relative to their baseline (snapshot at appointment time). Ministers are
 * judged on improvement/deterioration, not inherited state.
 *
 * For each stat: delta = (current - baseline) × directionSign
 *   (positive delta = good direction, negative = bad direction)
 * avgDelta = average of all deltas
 * approval += BASELINE_DECAY + (avgDelta × DELTA_SENSITIVITY if |avgDelta| >= 0.5)
 * BASELINE_DECAY always applies; delta-based movement is added on top.
 *
 * Ministers without baselines get them auto-set to current values (migration path).
 *
 * @param {object} supabase
 * @param {object} nation - full nation row with current stat values
 * @param {number} currentTick
 * @returns {Array<object>} per-minister results for tick summary
 */
export async function updateMinisterApprovals(supabase, nation, currentTick) {
    const cfg = MINISTER_APPROVAL_CONFIG;

    const { data: ministries, error: fetchErr } = await supabase
        .from('ministries')
        .select('id, ministry_key, minister_approval, minister_first_name, party_id, stat_baselines')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (fetchErr) {
        console.error(`[updateMinisterApprovals] Failed to fetch ministries for ${nation.name}:`, fetchErr.message);
        return [];
    }
    if (!ministries || ministries.length === 0) return [];

    // Crisis-decay multiplier removed with the crisis-system sunset
    // (Phase 1). The "ministers decay faster while a crisis is active"
    // flavor went with it. If we want it back, count active_modifiers
    // with severity='red' here and multiply BASELINE_DECAY by it.

    const results = [];

    for (const ministry of ministries) {
        // Skip vacant ministries (no minister appointed)
        if (!ministry.minister_first_name) continue;

        const ownedStats = MINISTRY_TO_STATS[ministry.ministry_key];
        if (!ownedStats || ownedStats.length === 0) continue;

        // Auto-set baselines for ministers that don't have them yet (migration path)
        let baselines = ministry.stat_baselines;
        if (!baselines || Object.keys(baselines).length === 0) {
            baselines = buildMinistryBaselines(ministry.ministry_key, nation);
            const { error: blErr } = await supabase.from('ministries')
                .update({ stat_baselines: baselines })
                .eq('id', ministry.id);
            if (blErr) console.error(`[updateMinisterApprovals] Baseline init failed for ${ministry.ministry_key}:`, blErr.message);
        }

        // Calculate average delta: how much each stat moved in the "good" direction
        let deltaSum = 0;
        let deltaCount = 0;
        for (const statKey of ownedStats) {
            const sign = statDirectionSign(statKey);
            if (sign === 0) continue; // skip neutral stats (taxes, etc.)
            const current = Number(nation[statKey] ?? 50);
            const baseline = Number(baselines[statKey] ?? current);
            // sign=1 (higher-is-better): improvement = current - baseline (positive = good)
            // sign=-1 (lower-is-better): improvement = baseline - current (positive = good)
            const delta = (current - baseline) * sign;
            deltaSum += delta;
            deltaCount++;
        }

        if (deltaCount === 0) continue;
        const avgDelta = deltaSum / deltaCount;

        const oldApproval = ministry.minister_approval ?? cfg.NEW_MINISTER_APPROVAL;
        let newApproval = oldApproval;

        // Baseline decay always applies — approval erodes unless stats improve.
        newApproval += cfg.BASELINE_DECAY;
        // Apply delta-based movement on top of baseline decay.
        // Baselines are permanent (appointment snapshot), so cap the cumulative delta
        // to prevent runaway approval. ±5 cap means max ±3/tick from stat performance.
        const clampedDelta = Math.max(-5, Math.min(5, avgDelta));
        if (Math.abs(clampedDelta) >= 0.5) {
            newApproval += clampedDelta * cfg.DELTA_SENSITIVITY;
        }

        // PM approval capped at 70 — broad stat ownership makes 100% too easy
        const approvalCeiling = ministry.ministry_key === 'prime_minister' ? 70 : 100;
        // minister_approval is an integer column — round to whole number
        newApproval = Math.round(Math.max(0, Math.min(approvalCeiling, newApproval)));

        // Keep stat_baselines as the original appointment snapshot (never overwrite).
        // The UI uses baselines to show cumulative change since appointment.
        const { error: updateErr } = await supabase.from('ministries')
            .update({ minister_approval: newApproval })
            .eq('id', ministry.id);

        if (updateErr) {
            console.error(`[updateMinisterApprovals] Write failed for ${ministry.ministry_key} in ${nation.name}:`, updateErr.message);
        }

        results.push({
            ministry_key: ministry.ministry_key,
            old: oldApproval,
            new: newApproval,
            avgDelta: Math.round(avgDelta * 10) / 10,
            delta: Math.round((newApproval - oldApproval) * 10) / 10
        });
    }

    if (results.length > 0) {
        console.log(`[updateMinisterApprovals] ${nation.name}: ${results.map(r =>
            `${r.ministry_key} ${r.old}→${r.new} (avgDelta=${r.avgDelta})`
        ).join(', ')}`);
    }

    return results;
}

// ==================== LAYER 2: GOVERNMENT APPROVAL (SIMPLIFIED) ====================

/**
 * Simplified government approval calculation.
 *
 * govApproval = avg(filled minister approvals) + vacancyPenalty + eventModifier
 *
 * No composite pillars, no trend lookback, no embattled tracking,
 * no momentum feedback loop. Simple, transparent, and predictable.
 *
 * @param {object} supabase
 * @param {object} nation - nation row with current stat values
 * @param {number} currentTick
 * @returns {number|null} the computed government approval (0-100), or null if no government
 */
export async function calculateGovernmentApprovalTick(supabase, nation, currentTick) {
    const cfg = MINISTER_APPROVAL_CONFIG;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, minister_approval, minister_first_name')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return null;

    const filledMinistries = ministries.filter(m => m.minister_first_name);
    const vacantCount = ministries.length - filledMinistries.length;

    // Average of all filled minister approvals
    let ministerSum = 0;
    for (const m of filledMinistries) {
        ministerSum += (m.minister_approval ?? cfg.NEW_MINISTER_APPROVAL);
    }
    const ministerAvg = filledMinistries.length > 0 ? ministerSum / filledMinistries.length : cfg.NEW_MINISTER_APPROVAL;

    // Vacancy penalty: -3 per unfilled ministry seat
    const vacancyPenalty = vacantCount * cfg.VACANCY_PENALTY;

    // Event modifier (decayed before this call by the tick processor)
    const eventModifier = Number(nation.gov_approval_events ?? 0);

    // Composite target from minister averages + penalties + events
    let rawApproval = ministerAvg + vacancyPenalty + eventModifier;
    rawApproval = Math.max(0, Math.min(100, rawApproval));

    // Dynamic per-tick cap: base ±3, but scales with the gap so approval can
    // crash quickly during crises rather than crawling down 3 pts/tick.
    // Formula: max(3, |gap| × 0.25) — e.g. 36-point gap → cap of 9.
    const BASE_TICK_CHANGE = 3;
    const previousApproval = Number(nation.gov_approval ?? 40);
    const delta = rawApproval - previousApproval;
    const gap = Math.abs(delta);
    const maxChange = Math.max(BASE_TICK_CHANGE, Math.round(gap * 0.25));
    const clampedDelta = Math.max(-maxChange, Math.min(maxChange, delta));
    const govApproval = Math.round(Math.max(0, Math.min(100, previousApproval + clampedDelta)));

    // Store on nation
    await supabase.from('nations')
        .update({ gov_approval: govApproval })
        .eq('id', nation.id);

    // Update in-memory nation object
    nation.gov_approval = govApproval;

    console.log(`[GovApproval] ${nation.name}: ${govApproval} (target=${Math.round(rawApproval)}, delta=${Math.round(clampedDelta)}, prev=${previousApproval}, avg=${Math.round(ministerAvg)}, vacancies=${vacantCount}×${cfg.VACANCY_PENALTY}=${vacancyPenalty}, events=${eventModifier})`);

    return govApproval;
}

/**
 * Check for government collapse when approval is critically low.
 * At ≤5%: coalition parties lose -5 party approval/tick, opposition gains +2.
 * At 0%: government dissolves into caretaker status and bills freeze.
 * NO auto-snap election is scheduled — the existing natural-term
 * parliamentary election (or a player-triggered call_early_elections,
 * or PM resignation) is the only path back to a vote. Auto-snap was
 * retired because for AI nations it spiralled into a 1-2-tick election
 * grinder when approval kept ratcheting back to 0; the player-driven
 * paths keep snap elections available without the runaway loop.
 * Returns { collapsed, penalized } or null if no government or not in danger zone.
 */
export async function processGovernmentCollapseCheck(supabase, nation, currentTick) {
    if (!hasParliamentaryPM(nation)) return null;
    const govApproval = Number(nation.gov_approval ?? 50);
    if (govApproval > 5) return null;

    // Skip if a near-term election is already scheduled (PM called early elections, or snap already pending).
    // Only skip for elections within 5 ticks — far-future regular elections should not prevent collapse.
    const { data: pendingElections } = await supabase.from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .lte('election_tick', currentTick + 5)
        .limit(1);
    if (pendingElections && pendingElections.length > 0) {
        console.log(`[GovCollapse] ${nation.name}: skipping — near-term elections already scheduled`);
        return null;
    }

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    if (!coalition || !coalition.party_ids || coalition.party_ids.length === 0) return null;

    // Skip if coalition is already caretaker (dissolution already happened)
    if (coalition.status === 'caretaker') {
        console.log(`[GovCollapse] ${nation.name}: skipping — already caretaker government`);
        return null;
    }

    const coalitionIds = new Set(coalition.party_ids);

    // At 0%: dissolve to caretaker. The natural-term parliamentary
    // election (or a player-triggered call_early_elections, or PM
    // resignation) is the only path back to a vote — no auto-snap is
    // scheduled.
    if (govApproval <= 0) {
        console.log(`[GovCollapse] ${nation.name}: approval at ${govApproval}% — dissolving government to caretaker (no auto-snap)`);

        // Close administration
        try {
            const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            await closeAdministration(supabase, nation.id, nation, 'collapsed', currentTick, shard?.current_date || _tickToDate(currentTick), null);
        } catch (e) { console.warn('[GovCollapse] closeAdministration failed:', e); }

        await dissolveCoalition(supabase, nation.id);

        // Freeze active bills
        await supabase.from('bills')
            .update({ status: 'frozen' })
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor']);

        // Fire world-visible event
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'Government Collapses',
            trigger_key: 'government_collapsed',
            description_chosen: `The government of ${nation.name} has collapsed after approval hit 0%. The cabinet enters caretaker status until the next scheduled election or a snap election is called.`,
            category: 'government',
            fired_at_tick: currentTick
        });

        return { collapsed: true, penalized: false };
    }

    // At 1-5%: cascading penalties
    console.log(`[GovCollapse] ${nation.name}: approval at ${govApproval}% — applying collapse penalties`);

    const { data: allFactions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    let penalizedCount = 0;
    for (const f of (allFactions || [])) {
        const isCoalition = coalitionIds.has(f.id);
        if (isCoalition) {
            // Coalition parties lose -5 party approval per tick
            await _adjustMomentum(supabase, f.id, nation.id, -5, 'gov_collapse_penalty', currentTick);
            penalizedCount++;
        } else {
            // Opposition parties gain +2 party approval per tick
            await _adjustMomentum(supabase, f.id, nation.id, 2, 'gov_collapse_opposition_boost', currentTick);
        }
    }

    // Fire event (nation-visible)
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'Government on Verge of Collapse',
        trigger_key: 'government_collapse_warning',
        description_chosen: `Government approval in ${nation.name} has fallen to ${govApproval}%. Coalition parties are hemorrhaging support.`,
        category: 'government',
        fired_at_tick: currentTick
    });

    return { collapsed: false, penalized: penalizedCount };
}

export async function processOngoingCosts(supabase, nation, currentTick) {
    // Phase 4.4: embed the chosen option so the ongoing-cost loop reads
    // ongoing_base_cost / ongoing_scaling_stat from the option that's
    // actually active for this nation, not the legacy policies row
    // (which Phase 2.5 stopped writing).
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*), selected_option:policy_options!selected_option_id(ongoing_base_cost, ongoing_scaling_stat)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return { totalCost: 0, details: [] };

    let totalCost = 0;
    const details = [];

    for (const law of activeLaws) {
        if (law.is_reversal) continue; // Reversals undo stat effects, not ongoing costs
        const policy = law.policies;
        if (!policy) continue;
        if (policy.policy_type === 'lever') continue; // Levers are one-time — no ongoing cost

        const opt = law.selected_option || null;
        const baseCost = (opt?.ongoing_base_cost ?? policy.ongoing_base_cost ?? policy.ongoing_cost_per_tick) || 0;
        if (baseCost === 0) continue;

        const scalingStat = opt?.ongoing_scaling_stat || policy.ongoing_scaling_stat;
        let tickCost = baseCost;

        if (scalingStat && nation[scalingStat] !== undefined) {
            const scalingVal = Number(nation[scalingStat]) || 1;
            const divisor = RAW_SCALING_DIVISORS[scalingStat] || 50;
            tickCost = baseCost * (scalingVal / divisor);
        }

        totalCost += tickCost;

        const newAccum = (law.ongoing_accumulated || 0) + tickCost;
        await supabase.from('active_laws').update({
            ongoing_accumulated: newAccum
        }).eq('id', law.id);

        details.push({ policy: policy.policy_name, cost: tickCost });
    }

    // Policy costs are tracked in active_laws.ongoing_accumulated.

    return { totalCost, details };
}

// Fallback for the very first snapshot call before the RPC has been
// hit (or if the RPC fails). nation_history_columns() in SQL is the
// canonical source — see 20261133_nations_history_self_describing.sql.
// This list only kicks in if the function isn't reachable.
export const HISTORY_SNAPSHOT_FALLBACK = [
    ...NATION_STAT_COLUMNS,
    'gov_approval',
    'population',
];
let _historyColumnsCache = null;

// Pull the canonical column list from the SQL function on first use,
// cache for the rest of the process. The list refreshes naturally on
// each cold-start of the edge function (or on manual cache bust).
export async function getHistorySnapshotColumns(supabase) {
    if (_historyColumnsCache) return _historyColumnsCache;
    // Self-heal nations_history schema before caching the column list.
    // sync_nations_history_columns() ADDs every nations numeric column
    // that isn't already mirrored — idempotent, so when nothing drifted
    // it's a single function call that returns 0. Runs once per warm
    // process (same lifecycle as the column-list cache), and clearing
    // _historyMissingCols here pairs with the fresh schema fetch so a
    // previous warm session's skip-list can't poison the next cold one.
    try {
        const { error: syncErr } = await supabase.rpc('sync_nations_history_columns');
        if (syncErr) console.warn('[snapshotNationHistory] sync_nations_history_columns failed:', syncErr.message);
    } catch (e) {
        console.warn('[snapshotNationHistory] sync_nations_history_columns threw:', e?.message || e);
    }
    _historyMissingCols.clear();
    const { data, error } = await supabase.rpc('nation_history_columns');
    if (error || !Array.isArray(data) || data.length === 0) {
        console.warn('[snapshotNationHistory] nation_history_columns RPC unavailable, falling back to in-code list:', error?.message || 'empty result');
        return HISTORY_SNAPSHOT_FALLBACK;
    }
    _historyColumnsCache = data;
    return _historyColumnsCache;
}

// Columns the snapshot wants to write but that don't exist on
// nations_history yet — i.e. a numeric stat was added to `nations` but
// sync_nations_history_columns() hasn't been re-run. Learned at runtime
// from the PostgREST "column not found" error and skipped thereafter so
// ONE drifted column can't reject the whole row and zero out all trend
// history. Lives for the warm process; a cold start re-checks the schema.
const _historyMissingCols = new Set();

export async function snapshotNationHistory(supabase, nation, currentTick) {
    const columns = await getHistorySnapshotColumns(supabase);
    const snapshot = { nation_id: nation.id, tick: currentTick };

    for (const key of columns) {
        if (key === 'nation_id' || key === 'tick') continue;
        if (_historyMissingCols.has(key)) continue;
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = Number(nation[key]);
        }
    }

    // Resilient upsert. If a column in the snapshot is absent from
    // nations_history, PostgREST rejects the entire row (PGRST204:
    // "Could not find the 'X' column … in the schema cache"). Drop the
    // offending column and retry so the remaining stats still persist;
    // the missing one is remembered and pre-filtered next time. Only the
    // first nation in a warm process pays the retry round-trips.
    let snapError = null;
    for (let attempt = 0; attempt < 32; attempt++) {
        const { error } = await supabase.from('nations_history').upsert(snapshot, {
            onConflict: 'nation_id,tick'
        });
        if (!error) { snapError = null; break; }
        snapError = error;
        const m = /Could not find the '([^']+)' column/i.exec(error.message || '');
        const col = m && m[1];
        if (col && col in snapshot && col !== 'nation_id' && col !== 'tick') {
            _historyMissingCols.add(col);
            delete snapshot[col];
            continue;   // retry without it
        }
        break;          // unrelated error — stop retrying
    }

    if (snapError) {
        console.error('[snapshotNationHistory] FAILED for nation', nation.id, 'tick', currentTick, ':', snapError.message);
    } else {
        if (_historyMissingCols.size > 0) {
            console.warn('[snapshotNationHistory] nations_history is missing columns (run sync_nations_history_columns to add them):', [..._historyMissingCols].join(', '));
        }
        console.log(`[snapshotNationHistory] Stored ${Object.keys(snapshot).length - 2} stats for nation ${nation.id} at tick ${currentTick}`);
    }
}

/**
 * Record current nation stat values into stat_history for trend calculations.
 * Called once per tick, before minister/government approval calculations.
 * Uses upsert to prevent duplicate rows if tick is re-processed.
 */
export async function recordStatHistory(supabase, nation, currentTick) {
    const rows = [];
    for (const statKey of NATION_STAT_COLUMNS) {
        const val = nation[statKey];
        if (val !== undefined && val !== null) {
            rows.push({ nation_id: nation.id, stat_name: statKey, value: Number(val), tick: currentTick });
        }
    }
    if (rows.length === 0) return;
    const { error } = await supabase.from('stat_history').upsert(rows, { onConflict: 'nation_id,stat_name,tick' });
    if (error) {
        console.error('[recordStatHistory] FAILED for nation', nation.id, 'tick', currentTick, ':', error.message);
    }
}


// ==================== EVENT TICK PROCESSOR ====================

export async function processEvents(supabase, nation, currentTick) {
    const { data: events } = await supabase
        .from('event_templates')
        .select('*, event_descriptions(*), event_triggers(*), event_effects(*)')
        .eq('is_active', true);

    if (!events || events.length === 0) return [];

    const { data: recentLog } = await supabase
        .from('event_log')
        .select('event_id, fired_at_tick')
        .eq('nation_id', nation.id)
        .order('fired_at_tick', { ascending: false })
        .limit(200);

    const lastFiredMap = {};
    for (const entry of (recentLog || [])) {
        if (!lastFiredMap[entry.event_id]) {
            lastFiredMap[entry.event_id] = entry.fired_at_tick;
        }
    }

    const firedEvents = [];

    for (const event of events) {
        const lastFired = lastFiredMap[event.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < event.cooldown_ticks) continue;
        }

        const triggers = event.event_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersPass = true;
        for (const trigger of triggers) {
            const statValue = nation[trigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allTriggersPass = false;
                break;
            }
            const val = Number(statValue);
            if (trigger.min_value !== null && trigger.min_value !== undefined && val < trigger.min_value) {
                allTriggersPass = false;
                break;
            }
            if (trigger.max_value !== null && trigger.max_value !== undefined && val > trigger.max_value) {
                allTriggersPass = false;
                break;
            }
        }
        if (!allTriggersPass) continue;

        const roll = Math.random() * 100;
        if (roll >= event.probability) continue;

        const descriptions = event.event_descriptions || [];
        let description = descriptions.length > 0
            ? descriptions[Math.floor(Math.random() * descriptions.length)].description_text
            : event.name;

        // Resolve placeholders in event description
        description = description.replace(/\{nation\}/g, nation.name || 'Unknown');

        const effects = event.event_effects || [];
        const appliedEffects = [];
        const nationUpdates = {};

        for (const effect of effects) {
            // Normalize + validate stat_key for nation targets
            const rawEvtStatKey = effect.stat_key;
            const evtStatKey = (effect.target === 'nation') ? normalizeNationStatKey(rawEvtStatKey) : rawEvtStatKey;
            if (effect.target === 'nation' && (!evtStatKey || !NATION_STAT_COLUMN_SET.has(evtStatKey))) {
                console.warn(`[processEvents] Skipping invalid stat_key "${rawEvtStatKey}" in event "${event.name}" for ${nation.name}`);
                continue;
            }

            if (effect.target === 'nation') {
                // GDP and debt are driven by dedicated systems — skip
                if (STAT_PROCESSOR_SKIP.has(evtStatKey)) continue;
                const currentVal = nation[evtStatKey] !== undefined
                    ? Number(nation[evtStatKey]) : 50;
                const scaledChange = RAW_SCALING_DIVISORS[evtStatKey]
                    ? effect.change_value * RAW_SCALING_DIVISORS[evtStatKey]
                    : effect.change_value;
                // Raw-value stats (debt, population) must not be clamped to 0-100
                const newVal = RAW_SCALING_DIVISORS[evtStatKey]
                    ? Math.max(0, currentVal + scaledChange)
                    : Math.max(0, Math.min(100, currentVal + scaledChange));
                nationUpdates[evtStatKey] = newVal;
                nation[evtStatKey] = newVal;

                appliedEffects.push({
                    stat: evtStatKey, change: effect.change_value,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'ruling_party') {
                const rulingId = nation.ruling_faction_id;
                if (!rulingId) continue;

                const { data: faction } = await supabase
                    .from('factions')
                    .select(effect.stat_key)
                    .eq('id', rulingId)
                    .single();

                if (faction) {
                    const currentVal = faction[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', rulingId);

                    appliedEffects.push({
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'ruling_party', faction_id: rulingId,
                        old: currentVal, new: newVal
                    });
                }

            } else if (effect.target === 'random_faction') {
                const { data: factions } = await supabase
                    .from('factions')
                    .select('id, ' + effect.stat_key)
                    .eq('nation_id', nation.id)
                    .eq('faction_type', 'party');

                if (factions && factions.length > 0) {
                    const target = factions[Math.floor(Math.random() * factions.length)];
                    const currentVal = target[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', target.id);

                    appliedEffects.push({
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'random_faction', faction_id: target.id,
                        old: currentVal, new: newVal
                    });
                }
            }
        }

        if (Object.keys(nationUpdates).length > 0) {
            await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        }

        const targetFactionId = appliedEffects.find(e => e.faction_id)?.faction_id || null;
        await supabase.from('event_log').insert({
            event_id: event.id,
            nation_id: nation.id,
            event_name: event.name,
            faction_id: targetFactionId,
            description_used: description,
            effects_applied: appliedEffects,
            category: event.category,
            fired_at_tick: currentTick
        });

        firedEvents.push({
            eventName: event.name,
            category: event.category,
            description: description,
            effects: appliedEffects
        });

        console.log(`Event fired: "${event.name}" in ${nation.name} (tick ${currentTick})`);
    }

    return firedEvents;
}
// ==================== UTILITY FORMATTERS ====================
// (Democratic revolution and seize-autocratic-power systems removed — autocracy scrapped)

export function _removedProcessRevolution() { return null; }
export function formatStatName(stat) {
    // state_apparatus renders as "State Apparatus" (and the legacy
    // 'control' key still translates to the same label for any
    // pre-rename strings sitting in event_log / stat_effects JSON).
    // Every other stat falls through to the generic title-case path.
    if (stat === 'state_apparatus' || stat === 'control') return 'State Apparatus';
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}
export function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}


// ==================== PM CANDIDATE SYSTEM ====================

// Crucera names (Sangreza, Melizea, Montequilla, Palvera, San Estrella)
export const PM_FIRST_NAMES = [
    'Alejandro', 'Camila', 'Diego', 'Valentina', 'Mateo', 'Isabela', 'Sebastián', 'Luca',
    'Andrés', 'Gabriel', 'Joaquín', 'Mariana', 'Carlos', 'Tomas', 'Rafael', 'Edwin',
    'Emilio', 'Catalina', 'Fernando', 'Renata',
    'Ricardo', 'Héctor', 'Ignacio', 'Santiago', 'Esteban', 'Nicolás', 'Ramón', 'Arturo',
    'Álvaro', 'Gonzalo', 'Javier', 'Mauricio', 'Enrique', 'Sergio', 'Adrián', 'Hugo',
    'Cristián', 'Rubén', 'Germán', 'Felipe'
];

export const PM_LAST_NAMES = [
    'Velasco', 'Mendoza', 'Guerrero', 'Salazar', 'Castillo', 'Herrera', 'Morales', 'Ríos',
    'Delgado', 'Espinoza', 'Guzmán', 'Navarro', 'Córdoba', 'Echeverría', 'Pacheco', 'Montero',
    'Aguilar', 'Valenzuela', 'Carrasco', 'Ibarra',
    'Fuentes', 'Quiroga', 'Sepúlveda', 'Villalobos', 'Paredes', 'Arellano', 'Sandoval', 'Medina',
    'Estrada', 'Cervantes', 'Figueroa', 'Maldonado', 'Cisneros', 'Zúñiga', 'Bustamante', 'Roldán',
    'Camacho', 'Gallardo', 'Barrera', 'Saavedra'
];

// Avelian names (Spanish with Italian influence)
export const AVELIA_FIRST_NAMES = [
    'Marcelo', 'Luciana', 'Dante', 'Sofía', 'Lorenzo', 'Elena', 'Tomás', 'Rosario',
    'Fabrizio', 'Carolina', 'Leandro', 'Paloma', 'Giancarlo', 'Inés', 'Renato', 'Marisol',
    'Nico', 'Florencia', 'Aurelio', 'Celeste',
    'Valentín', 'Matías', 'Silvio', 'Bernardo', 'Cristóbal', 'Lazzaro', 'Osvaldo', 'Enzo',
    'Pascual', 'Damián'
];

export const AVELIA_LAST_NAMES = [
    'Montalbán', 'Ferretti', 'Salcedo', 'Conti', 'Valverde', 'Lucero', 'Maretti', 'Orellana',
    'Bellini', 'Calderón', 'Santoro', 'Vásquez', 'Lombardi', 'Peñaloza', 'Rinaldi', 'Escobar',
    'Castellani', 'Madrigal', 'Giacomo', 'Solano',
    'Traverso', 'Coronado', 'Benedetti', 'Villarreal', 'Rosetti', 'Mondragón', 'Falcone', 'Quirós',
    'Molinari', 'Saldaña'
];

const AVELIA_NATIONS = ['Avelia'];

// Calveth names (Danish)
export const CALVETH_FIRST_NAMES = [
    'Lukas', 'Noah', 'Victor', 'Oliver', 'Oscar', 'William', 'Emil', 'Alfred',
    'Magnus', 'Mads', 'Frederik', 'Christian', 'Mikkel', 'Anders', 'Lars',
    'Søren', 'Rasmus', 'Kristian', 'Morten', 'Jesper', 'Henrik', 'Thomas',
    'Jacob', 'Sebastian', 'Mathias', 'Valdemar', 'Karl', 'Arthur', 'Otto',
    'August', 'Erik', 'Jens', 'Niels', 'Hans', 'Poul', 'Viggo', 'Aksel',
    'Felix', 'Malthe', 'Gustav', 'Alma', 'Ida', 'Clara', 'Ella', 'Olivia',
    'Freja', 'Sofie', 'Astrid', 'Maja', 'Agnes'
];

export const CALVETH_LAST_NAMES = [
    'Jensen', 'Nielsen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen',
    'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen', 'Petersen', 'Madsen',
    'Kristensen', 'Olsen', 'Thomsen', 'Christiansen', 'Poulsen', 'Johansen',
    'Knudsen', 'Mortensen', 'Møller', 'Jacobsen', 'Jakobsen', 'Olesen',
    'Frederiksen', 'Mikkelsen', 'Henriksen', 'Laursen', 'Lund', 'Schmidt',
    'Eriksen', 'Holm', 'Clausen', 'Svendsen', 'Andreasen', 'Iversen',
    'Jeppesen', 'Vestergaard', 'Bertelsen', 'Nissen', 'Kjær', 'Gregersen',
    'Jepsen', 'Hermansen', 'Bayer', 'Buch', 'Dahl', 'Dam', 'Haugaard',
    'Høeg', 'Jespersen', 'Kjeldsen', 'Kofod', 'Kragh', 'Krogh', 'Lassen',
    'Lind', 'Lorentzen', 'Ludvigsen', 'Mathiasen', 'Mogensen', 'Munk',
    'Nedergaard', 'Nygaard', 'Nørgaard', 'Ottosen', 'Overgaard', 'Pallesen',
    'Schiøtz', 'Simonsen', 'Skov', 'Søndergaard', 'Villadsen', 'Winther'
];

const CALVETH_NATIONS = ['Calveth'];

// Flandis names (Dutch)
export const FLANDIS_FIRST_NAMES = [
    'Anneliese', 'Bregje', 'Clasien', 'Dymphna', 'Elske', 'Fenna', 'Grietje', 'Hanneke',
    'Ilse', 'Jobke', 'Karlijn', 'Lieselotte', 'Maaike', 'Nienke', 'Roos',
    'Adriaan', 'Bastiaan', 'Casper', 'Damiaan', 'Evert', 'Floris', 'Gerben', 'Harmen',
    'Ivo', 'Jasper', 'Klaas', 'Laurens', 'Maarten', 'Niels', 'Olaf', 'Pieter',
    'Quinten', 'Reinier', 'Sander', 'Thijs', 'Uwe', 'Valentijn', 'Wessel', 'Xander',
    'Yorick', 'Zeger', 'Arjen', 'Bram', 'Cor', 'Daan', 'Egbert', 'Folkert',
    'Gijs', 'Hedzer', 'Imro'
];

export const FLANDIS_LAST_NAMES = [
    'Bakker', 'Bos', 'Bosman', 'Brouwer', 'De Graaf', 'De Jong', 'De Vries', 'De Wit',
    'Dekker', 'Dijkstra', 'Dijk', 'Driessen', 'Gerritsen', 'Hendriks', 'Hermans',
    'Hoekstra', 'Huisman', 'Jacobs', 'Janssen', 'Koster', 'Kuiper', 'Lammers', 'Maas',
    'Meijer', 'Mulder', 'Peters', 'Pieters', 'Pijpers', 'Post', 'Prins', 'Smit',
    'Smits', 'Snel', 'Snoek', 'Timmers', 'Van Dam', 'Van den Berg', 'Van den Bosch',
    'Van der Laan', 'Van der Meer', 'Van Dijk', 'Van Houten', 'Van Leeuwen', 'Van Rijn',
    'Vermeer', 'Visser', 'Willems', 'Wolff', 'Zijlstra', 'Zwart'
];

const FLANDIS_NATIONS = ['Flandis'];

// Vostia names (Serbian/Montenegrin)
export const VOSTIA_FIRST_NAMES = [
    'Dragan', 'Goran', 'Vuk', 'Zoran', 'Dušan', 'Nemanja', 'Bogdan', 'Slobodan',
    'Vlastimir', 'Milorad', 'Gvozden', 'Radomir', 'Branislav', 'Jovan', 'Dimitrije',
    'Ognjen', 'Lazar', 'Miodrag', 'Zdravko', 'Nebojša', 'Predrag', 'Stojan',
    'Vojislav', 'Darko', 'Borislav', 'Momčilo', 'Uroš', 'Radoš', 'Božidar',
    'Gavrilo', 'Vasilije', 'Đorđe', 'Radovan', 'Blagoje', 'Veljko', 'Živko',
    'Krsto', 'Miloš', 'Draško', 'Balša',
    'Dragana', 'Svetlana', 'Jelena', 'Milica', 'Danica', 'Zora', 'Radmila',
    'Snežana', 'Vesna'
];

export const VOSTIA_LAST_NAMES = [
    'Jovanović', 'Petrović', 'Đorđević', 'Marković', 'Nikolić', 'Popović',
    'Stojanović', 'Ilić', 'Lukić', 'Babić', 'Ristić', 'Kostić', 'Vuković',
    'Lazarević', 'Kovačević', 'Simić', 'Milošević', 'Stevanović', 'Tomić',
    'Savić', 'Radović', 'Dimitrijević', 'Vasić', 'Bogdanović', 'Jović',
    'Krstić', 'Mladenović', 'Filipović', 'Gajić', 'Cvetković', 'Mitić',
    'Todorović', 'Milosavljević', 'Živković', 'Knežević', 'Pantić', 'Stanković',
    'Marić', 'Mihajlović', 'Tasić', 'Pavlović', 'Kuzmanović', 'Milanović',
    'Grbić', 'Obradović', 'Sekulić', 'Mašić', 'Bulatović', 'Krivokapić',
    'Đukanović', 'Ivanović', 'Pešić', 'Milovanović', 'Mitrović', 'Antić',
    'Perić', 'Blagojević', 'Drašković', 'Božić', 'Nedić', 'Vukotić',
    'Vujović', 'Radulović', 'Matić', 'Damjanović', 'Krsmanović', 'Urošević',
    'Šćepanović', 'Gojković', 'Zlatković', 'Arsić', 'Aleksić', 'Vidaković',
    'Vasiljević', 'Janković'
];

const VOSTIA_NATIONS = ['Vostia'];

// Female first names from both name pools (used for gendered title selection)
const FEMALE_NAMES = new Set([
    // Crucera
    'Camila', 'Valentina', 'Isabela', 'Mariana', 'Catalina', 'Renata',
    // Avelia
    'Luciana', 'Sofía', 'Elena', 'Rosario', 'Carolina', 'Paloma', 'Inés',
    'Marisol', 'Florencia', 'Celeste',
    // Calveth
    'Alma', 'Ida', 'Clara', 'Ella', 'Olivia', 'Freja', 'Sofie', 'Astrid',
    'Maja', 'Agnes',
    // Flandis
    'Anneliese', 'Bregje', 'Clasien', 'Dymphna', 'Elske', 'Fenna', 'Grietje',
    'Hanneke', 'Ilse', 'Jobke', 'Karlijn', 'Lieselotte', 'Maaike', 'Nienke', 'Roos',
    // Vostia
    'Dragana', 'Svetlana', 'Jelena', 'Milica', 'Danica', 'Zora', 'Radmila',
    'Snežana', 'Vesna',
    // Dravka
    'Afërdita', 'Bora', 'Era', 'Luljeta', 'Teuta'
    // Danwei: intentionally NO entries. Family-first convention stores
    // surnames (Chen, Lin, Han) in the FIRST_NAMES slot and given names
    // (Mei-ling, Kuo-yu) in LAST_NAMES — but isFemaleName() tests the
    // FIRST_NAMES slot only, so adding female given names here would
    // never match. Gender-aware titles (Queen/King in bills.js:4480 and
    // 4579) only fire for monarchies, which Danwei isn't, so the gap
    // is currently inert. If a future change wants gendered titles for
    // Danwei, the fix is to make isFemaleName nation-aware (check the
    // last-name slot for family-first cultures), not to add entries here.
]);

export function isFemaleName(firstName) {
    return FEMALE_NAMES.has(firstName);
}

// Al-Makir (Arabic) name pools
const ALMAKIR_NATIONS = ['Hajjara'];
export const ALMAKIR_FIRST_NAMES = [
    'Ahmad','Muhammad','Ali','Omar','Hassan','Hussein','Khalid','Abdullah','Ibrahim','Yusuf',
    'Ismail','Hamza','Tariq','Zayd','Saeed','Faisal','Nasser','Salman','Rashid','Kareem',
    'Mahmoud','Farid','Jamal','Samir','Hadi','Anwar','Imran','Bilal','Qasim','Majid',
    'Walid','Fadi','Rami','Zahir','Adnan','Amin','Haris','Yasin','Tamer','Nabil',
    'Bashir','Dawood','Zakaria','Munir','Latif','Jaber','Mazen','Kamil','Rauf','Shadi',
];
export const ALMAKIR_LAST_NAMES = [
    'Al-Farouq','Al-Hakim','Al-Masri','Al-Sabah','Al-Najjar','Al-Haddad','Al-Saleh','Al-Sharif',
    'Al-Khalifa','Al-Qahtani','Al-Harbi','Al-Otaibi','Al-Anzi','Al-Zahrani','Al-Ghamdi','Al-Dosari',
    'Al-Rashidi','Al-Suwaidi','Al-Mansouri','Al-Mutairi','Al-Ahmadi','Al-Saeed','Al-Jabari','Al-Khatib',
    'Al-Basri','Al-Tamimi','Al-Hashimi','Al-Kurdi','Al-Husseini','Al-Yamani','Al-Shammari','Al-Farsi',
    'Al-Hamadi','Al-Siddiqi','Al-Qureshi','Al-Azmi','Al-Salem','Al-Din','Al-Rahman','Al-Majid',
    'Al-Bakri','Al-Saadi','Al-Hilali','Al-Makki','Al-Madani','Al-Baghdadi','Al-Dimashqi','Al-Andalusi',
    'Al-Maghribi','Al-Samarrai','Al-Tikriti','Al-Nasiri','Al-Fahd','Al-Karim','Al-Nouri','Al-Sayegh',
    'Al-Rifai','Al-Qadri','Al-Ayoubi','Al-Barghouti','Al-Khatri','Al-Shihabi','Al-Awadi','Al-Sarraf',
    'Al-Zubaidi','Al-Hussein','Al-Attar','Al-Safadi','Al-Hourani','Al-Kassab','Al-Taleb','Al-Hamdan',
    'Al-Rantisi','Al-Banna','Al-Khatour',
];

// Danwei (Taiwanese) name pools.
//
// Convention: Danweian display order is family-first (e.g. "Han Kuo-yu"),
// so DANWEI_FIRST_NAMES holds Taiwanese family/surnames and
// DANWEI_LAST_NAMES holds given names. This way the existing
// "first_name + ' ' + last_name" display logic produces the correct
// Taiwanese-style ordering without rewriting display logic across the
// codebase. See sql/insert_danwei.sql Phase 2 (caretaker Han Kuo-yu).
const DANWEI_NATIONS = ['Danwei'];
export const DANWEI_FIRST_NAMES = [
    // Family / surnames (Wade-Giles transliteration; Taiwan-frequency order)
    'Chen', 'Lin', 'Huang', 'Chang', 'Lee', 'Wang', 'Wu', 'Liu', 'Tsai', 'Yang',
    'Hsu', 'Cheng', 'Chou', 'Hsieh', 'Kuo', 'Chiang', 'Tang', 'Lo', 'Pan', 'Chao',
    'Ho', 'Chu', 'Tseng', 'Yeh', 'Hsiao', 'Lai', 'Su', 'Ma', 'Hung', 'Chiu',
    'Shih', 'Chien', 'Liao', 'Han', 'Sun', 'Wei', 'Ku', 'Fang', 'Yu', 'Shen',
    'Fu', 'Hsiang', 'Tsao', 'Hu', 'Sung', 'Shao', 'Kao', 'Pao', 'Po', 'Lung',
];
export const DANWEI_LAST_NAMES = [
    // Given names (hyphenated 2-syllable Wade-Giles).
    // Male
    'Kuo-yu', 'Wei-ming', 'Ming-chen', 'Chih-yuan', 'Hsiao-ping', 'Wen-cheng',
    'Yu-ren', 'Ying-jeou', 'Teng-hui', 'Cheng-yi', 'Chen-yi', 'Tien-hsing',
    'Po-yu', 'Chih-hao', 'Yi-feng', 'Chih-hung', 'Wei-jen', 'Cheng-ming',
    'Po-chen', 'Hsing-kuo', 'Wen-fan', 'Po-hsiung', 'Tsung-hsien', 'Chao-ming',
    'Yi-chun', 'Chang-ting',
    // Female (also added to FEMALE_NAMES set above)
    'Mei-ling', 'Hsiu-lien', 'Wen-chi', 'Yu-hua', 'Su-chen', 'Yi-fang', 'Hsin-yi',
    'Yu-ling', 'Chia-ling', 'Pei-ling', 'Mei-feng', 'Hsiao-mei', 'Yu-chen',
    'Wen-ling', 'Mei-yu', 'Chia-hsuan', 'Pei-yi', 'Hsin-mei', 'Chia-jung',
    'Pei-chen', 'Hsiu-chen', 'Mei-chen', 'Yi-ling', 'Hsiu-mei',
];

// Dravka (Albanian) name pools
const DRAVKA_NATIONS = ['Dravka'];
export const DRAVKA_FIRST_NAMES = [
    // Male
    'Agon','Altin','Arban','Ardian','Ardit','Arian','Arlind','Armend','Artan','Auron',
    'Bardhyl','Besart','Besmir','Besnik','Bledar','Blerim','Burim','Dalmat','Dardan','Dasnor',
    'Dëfrim','Dorian','Drilon','Dritan','Edon','Endrit','Enver','Erion','Ermal','Ervin',
    'Fisnik','Flamur','Genti','Gezim','Ilir','Jetmir','Kastriot','Kreshnik','Luan','Mirlind',
    'Pajtim','Saimir','Skerdilaid','Taulant','Vigan',
    // Female
    'Afërdita','Bora','Era','Luljeta','Teuta',
];
export const DRAVKA_LAST_NAMES = [
    'Abazi','Ademi','Agolli','Ahmeti','Alia','Aliti','Asllani','Bajrami','Bakalli','Bala',
    'Balaj','Bardhi','Beqiri','Berisha','Biba','Bisha','Brahimi','Buda','Bushaj','Bushati',
    'Caka','Cami','Cani','Cela','Dajaku','Dauti','Deda','Dedaj','Demiri','Dervishi',
    'Dobi','Doda','Dragusha','Duka','Elezi','Fejzu','Ferati','Frashëri','Gashi','Gega',
    'Gjoni','Gjoka','Gurakuqi','Hadergjonaj','Hajdari','Halili','Hamiti','Haradinaj','Hasani','Hoti',
    'Hoxha','Ismaili','Jahjaga','Jashari','Kadiu','Kastrati','Kelmendi','Kodra','Kola','Konica',
    'Krasniqi','Kuqi','Kurti','Leka','Lekaj','Limaj','Luli','Lumi','Malo','Marku',
    'Mazreku','Mehmeti','Meidani','Meksi','Meta','Morina','Muka','Murati','Musliu','Mustafa',
    'Myftiu','Nano','Ndreu','Osmani','Pajaziti','Pasha','Prenga','Qosja','Rama','Rexhepi',
    'Rugova','Sadiku','Sejdiu','Selimi','Shala','Shehu','Smajlaj','Spahiu','Tafa','Zaimi',
];

export function getNationNames(nationName) {
    if (AVELIA_NATIONS.includes(nationName)) {
        return { firstNames: AVELIA_FIRST_NAMES, lastNames: AVELIA_LAST_NAMES };
    }
    if (CALVETH_NATIONS.includes(nationName)) {
        return { firstNames: CALVETH_FIRST_NAMES, lastNames: CALVETH_LAST_NAMES };
    }
    if (FLANDIS_NATIONS.includes(nationName)) {
        return { firstNames: FLANDIS_FIRST_NAMES, lastNames: FLANDIS_LAST_NAMES };
    }
    if (VOSTIA_NATIONS.includes(nationName)) {
        return { firstNames: VOSTIA_FIRST_NAMES, lastNames: VOSTIA_LAST_NAMES };
    }
    if (ALMAKIR_NATIONS.includes(nationName)) {
        return { firstNames: ALMAKIR_FIRST_NAMES, lastNames: ALMAKIR_LAST_NAMES };
    }
    if (DRAVKA_NATIONS.includes(nationName)) {
        return { firstNames: DRAVKA_FIRST_NAMES, lastNames: DRAVKA_LAST_NAMES };
    }
    if (DANWEI_NATIONS.includes(nationName)) {
        return { firstNames: DANWEI_FIRST_NAMES, lastNames: DANWEI_LAST_NAMES };
    }
    return { firstNames: PM_FIRST_NAMES, lastNames: PM_LAST_NAMES };
}


/**
 * Single source of truth for installing a Head of Government row.
 *
 * Every PM-install path (parliamentary auto-appoint, presidential PM
 * confirmation, monarchy royal appointment) routes through this helper so
 * the upsert columns and unique(nation_id) handling stay identical across
 * paths.
 *
 * @param {object} supabase
 * @param {object} opts
 * @param {string} opts.nationId
 * @param {string} opts.factionId           party that the new PM belongs to
 * @param {string} opts.firstName
 * @param {string} opts.lastName
 * @param {number} [opts.age]               defaults to 50 if unset
 * @param {number} opts.currentTick
 * @param {string} [opts.traitKey]          leader trait, optional
 * @param {string} [opts.candidateId]       presidential candidate row id, optional
 */
export async function installHOG(supabase, opts) {
    if (!opts?.nationId || !opts?.factionId) {
        throw new Error('installHOG: nationId and factionId are required');
    }
    const {
        nationId, factionId, firstName, lastName, age,
        currentTick, traitKey = null, candidateId = null,
        reason = 'pm_change',
    } = opts;

    // Primary path: SECURITY DEFINER RPC install_hog (20260803). The
    // RPC bypasses the head_of_government RLS that 20260302 stripped
    // for client writes, with an internal ownership check on the
    // incoming PM's faction. If the RPC isn't deployed yet, fall back
    // to the legacy client writes (which only work for service_role
    // callers — i.e. the tick processor).
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('install_hog', {
        p_nation_id:    nationId,
        p_faction_id:   factionId,
        p_first_name:   firstName,
        p_last_name:    lastName,
        p_age:          age || 50,
        p_current_tick: currentTick,
        p_trait_key:    traitKey,
        p_candidate_id: candidateId,
        p_reason:       reason,
    });

    if (rpcErr && rpcErr.code !== 'PGRST202') {
        // PGRST202 = function not found (RPC undeployed); any other
        // error is a real failure (auth, validation, etc.).
        throw rpcErr;
    }

    if (rpcErr || !rpcRes?.success) {
        if (rpcRes?.error) throw new Error(rpcRes.error);

        // Legacy fallback path. RLS will block this for non-service-role
        // callers; the throw will surface as a "Form Government" alert
        // until the 20260803 migration is applied.
        await supabase.from('head_of_government')
            .update({ active: false })
            .eq('nation_id', nationId)
            .eq('active', true);

        // History-preserving INSERT (Fix C, 20260827). The previous
        // upsert with onConflict: 'nation_id' clobbered prior rows in
        // place; after the partial unique on (nation_id) WHERE active,
        // inactive history rows are kept and the new active row is
        // simply inserted.
        const { error: hogErr } = await supabase
            .from('head_of_government')
            .insert({
                nation_id: nationId,
                faction_id: factionId,
                candidate_id: candidateId,
                first_name: firstName,
                last_name: lastName,
                age: age || 50,
                trait_key: traitKey,
                appointed_tick: currentTick,
                active: true,
            });

        if (hogErr) throw hogErr;
    }

    return { };
}

/**
 * Append a leader_changes event to the open administration row.
 * Called by the browser party-leadership UI on a mid-term ruling-party
 * leader change. Non-blocking: SELECT/UPDATE failures log to console
 * but do not throw — the calling action has already mutated primary
 * state (head_of_government, factions) and shouldn't be rolled back
 * over an audit-trail write.
 */
export async function appendAdminLeaderChange(supabase, nationId, event) {
    try {
        const { data: openAdmin, error: selErr } = await supabase
            .from('administrations')
            .select('id, leader_changes')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null)
            .order('started_at_tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (selErr) {
            console.warn('[appendAdminLeaderChange] select failed:', selErr.message);
            return;
        }
        if (!openAdmin) {
            console.warn(`[appendAdminLeaderChange] no open admin row for nation ${nationId}`);
            return;
        }
        const existing = Array.isArray(openAdmin.leader_changes) ? openAdmin.leader_changes : [];
        const { error: updErr } = await supabase.from('administrations')
            .update({ leader_changes: [...existing, event] })
            .eq('id', openAdmin.id);
        if (updErr) console.warn('[appendAdminLeaderChange] update failed:', updErr.message);
    } catch (err) {
        console.warn('[appendAdminLeaderChange] failed:', err?.message || err);
    }
}


/**
 * Auto-appoint the party leader as Prime Minister without candidate selection.
 * Used for parliamentary systems — the party leader becomes PM immediately
 * when their party receives the PM role during coalition formation.
 */
export async function autoAppointPartyLeaderAsPM(supabase, nationId, factionId, currentTick, opts) {
    // When called from coalition formation flow, skip the coalition check
    // (the formation was JUST set to 'formed' and cache may be stale)
    let _coalitionAtEntry = null;
    if (!opts?.skipCoalitionCheck) {
        _coalitionAtEntry = await fetchActiveCoalition(supabase, nationId);
        if (!_coalitionAtEntry || (_coalitionAtEntry.status !== 'formed' && _coalitionAtEntry.status !== 'active' && _coalitionAtEntry.status !== 'caretaker')) {
            throw new Error('Cannot appoint a Prime Minister until a coalition has been formed.');
        }
    }

    // Detect whether this install is filling a vacant PM seat (which is the
    // signal for resignation-succession: PM resigned, HOG was deactivated,
    // coalition went to caretaker, and we're now installing the successor
    // before the fallback snap election fires). If any HOG is still active
    // at entry, this is NOT a succession install — it's a normal PM swap or
    // a formation-time install — and we must NOT cancel the pending election
    // (that would undo a Call-Early-Elections caretaker by accident).
    let _isSuccessionInstall = false;
    if (!opts?.skipCoalitionCheck && _coalitionAtEntry && _coalitionAtEntry.status === 'caretaker') {
        const { data: existingActiveHog, error: hogLookupErr } = await supabase
            .from('head_of_government')
            .select('id')
            .eq('nation_id', nationId)
            .eq('active', true)
            .maybeSingle();
        // Bail to "not a succession" if the lookup itself failed — better to
        // leave a pending fallback election in place than to cancel one we
        // shouldn't have cancelled based on a transient DB error.
        if (hogLookupErr) {
            console.warn('[autoAppointPartyLeaderAsPM] HOG lookup failed during succession check (assuming non-succession):', hogLookupErr.message);
        } else {
            _isSuccessionInstall = !existingActiveHog;
        }
    }

    // Load faction leader data. leader_ideology was previously selected
    // here for a return-shape field that's been retired; the column is
    // no longer consumed in this function.
    const { data: faction, error: factionErr } = await supabase
        .from('factions')
        .select('id, faction_name, leader_first_name, leader_last_name, leader_age, leader_positive_traits')
        .eq('id', factionId)
        .single();
    if (factionErr || !faction) throw new Error('Faction not found');
    if (!faction.leader_first_name || !faction.leader_last_name) {
        throw new Error('Party leader data is incomplete — cannot auto-appoint PM.');
    }

    // Use the leader's first positive trait (from party leadership system)
    const traitKey = (faction.leader_positive_traits && faction.leader_positive_traits.length > 0)
        ? faction.leader_positive_traits[0]
        : null;

    const leaderAge = faction.leader_age || (35 + Math.floor(Math.random() * 16));

    // skipHogInstall is set by the coalition-formation flow because
    // finalize_government_formation already installed HOG inside the RPC.
    // Other callers (no opt) install HOG here.
    if (!opts?.skipHogInstall) {
        await installHOG(supabase, {
            nationId,
            factionId,
            firstName: faction.leader_first_name,
            lastName: faction.leader_last_name,
            age: leaderAge,
            currentTick,
            traitKey,
        });
    }

    // Tier 2 Phase 3: removed the mid-life UPDATE that rewrote the open
    // admin row's `prime_minister` and `admin_name` on every PM swap.
    // Identity-at-start fields are immutable post-INSERT — the admin row
    // records who started the administration. installHOG appends a
    // leader_changes event below for the historical record.
    const pmFullName = `${faction.leader_first_name} ${faction.leader_last_name}`;

    // Update/create PM ministry row.
    // Look up the row WITHOUT filtering on is_active — the
    // ministries_nation_ministry_unique constraint is on
    // (nation_id, ministry_key) regardless of is_active. If a prior
    // administration left an inactive PM row, filtering it out here
    // would push us into the INSERT branch and trigger a duplicate-
    // key violation. Matching it instead lets us reactivate in place.
    const { data: pmMinistry } = await supabase.from('ministries')
        .select('id').eq('nation_id', nationId)
        .eq('ministry_key', 'prime_minister')
        .maybeSingle();

    const { data: nationForBaseline } = await supabase.from('nations').select('*').eq('id', nationId).single();
    const pmBaselines = nationForBaseline ? buildMinistryBaselines('prime_minister', nationForBaseline) : {};

    if (pmMinistry) {
        await supabase.from('ministries').update({
            is_active: true,
            party_id: factionId,
            minister_first_name: faction.leader_first_name,
            minister_last_name: faction.leader_last_name,
            minister_age: leaderAge,
            minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL,
            stat_baselines: pmBaselines
        }).eq('id', pmMinistry.id);
    } else {
        await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: 'prime_minister',
            ministry_name: 'Prime Minister',
            is_active: true,
            party_id: factionId,
            minister_first_name: faction.leader_first_name,
            minister_last_name: faction.leader_last_name,
            minister_age: leaderAge,
            minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL,
            stat_baselines: pmBaselines
        });
    }

    // Fire system event
    const traitDef = traitKey ? POSITIVE_TRAITS.find(t => t.key === traitKey) : null;
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'pm_appointed',
            p_nation_id: nationId,
            p_tick: currentTick,
            p_placeholders: {
                nation: nationForBaseline?.name || '',
                pm_name: pmFullName,
                party: faction.faction_name,
                trait: traitDef?.name || traitKey || 'None'
            }
        });
    } catch (e) { console.warn('PM appointed event fire failed (non-blocking):', e); }

    console.log(`Auto-appointed party leader as PM: ${pmFullName} (${traitKey}) for faction ${factionId}`);

    // Succession-window cleanup: if this install filled the vacant PM seat
    // left by a resignation (see resignPM), roll the coalition back to
    // 'formed' and cancel the fallback snap election that resignPM
    // scheduled. The _isSuccessionInstall check above guarantees we only
    // run this when there was no active HOG at entry, so a Call-Early-
    // Elections caretaker (HOG still active, going to voters) is safely
    // excluded.
    if (_isSuccessionInstall) {
        try {
            await supabase.from('government_formations')
                .update({ status: 'formed' })
                .eq('nation_id', nationId)
                .eq('status', 'caretaker');
            const { error: elDelErr } = await supabase.from('elections')
                .delete()
                .eq('nation_id', nationId)
                .eq('status', 'scheduled')
                .eq('election_type', 'parliamentary');
            if (elDelErr) {
                console.warn('[autoAppointPartyLeaderAsPM] succession-install: election delete failed (non-fatal):', elDelErr.message);
            }
            // NOTE: bills that were frozen by resignPM stay frozen. The
            // original committee-vs-floor split is lost (both collapsed to
            // 'frozen') so blanket-unfreezing would wrongly promote committee
            // bills to the floor. Leaving them frozen is safe but means a
            // small UX gap — bills in flight when the PM resigned need to be
            // re-introduced by the successor. Intentional, not a landmine.
            console.log(`[autoAppointPartyLeaderAsPM] succession complete: coalition -> formed, fallback election cancelled.`);
        } catch (cancelErr) {
            console.warn('[autoAppointPartyLeaderAsPM] succession-window cleanup failed (non-fatal):', cancelErr);
        }
    }

    // Ideology has been retired — no field on the return shape. The
    // single existing caller (coalition-formation.js handleFormGovernment)
    // discards the return value entirely, so the shape only matters
    // for any future caller; keeping it minimal avoids re-introducing
    // dead state.
    return {
        first_name: faction.leader_first_name,
        last_name: faction.leader_last_name,
        age: leaderAge,
        trait_key: traitKey,
    };
}

export async function processPMTraitEffects(supabase, nation, currentTick) {
    // Old leader_traits effect system removed — PM/President trait is now purely display
    // (shows the party leader's first positive trait from the candidate trait system).
    // Future: implement mechanical effects from POSITIVE_TRAITS if desired.
    return;

    if (!hasParliamentaryPM(nation)) {
        // For presidential systems, use the active president's trait
        const { data: president } = await supabase
            .from('presidents')
            .select('faction_id, trait')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (!president?.trait) return;

        const { data: traitData } = await supabase
            .from('leader_traits')
            .select('effects')
            .eq('trait_key', president.trait)
            .single();

        if (!traitData?.effects) return;
        effects = traitData.effects;
        factionId = president.faction_id;
    } else {
        const { data: hog } = await supabase
            .from('head_of_government')
            .select('*, leader_traits(*)')
            .eq('nation_id', nation.id)
            .eq('active', true)
            .single();

        if (!hog || !hog.leader_traits?.effects) return;
        effects = hog.leader_traits.effects;
        factionId = hog.faction_id;
    }

    if (effects.party_approval_per_tick) {
        await _adjustMomentum(supabase, factionId, nation.id, _round2(effects.party_approval_per_tick * 0.3), 'trait:pm_approval_per_tick', currentTick);
    }

    if (effects.nation_stat_per_tick) {
        const updates = {};
        for (const [rawStat, delta] of Object.entries(effects.nation_stat_per_tick)) {
            const stat = normalizeNationStatKey(rawStat);
            if (!stat || !NATION_STAT_COLUMN_SET.has(stat)) {
                console.warn(`[processPMTraitEffects] Skipping invalid stat_key "${rawStat}" in PM trait for ${nation.name}`);
                continue;
            }
            // GDP and debt are driven by dedicated systems — skip
            if (STAT_PROCESSOR_SKIP.has(stat)) continue;
            const currentVal = nation[stat];
            if (currentVal !== undefined && currentVal !== null) {
                if (RAW_SCALING_DIVISORS[stat]) {
                    // Raw-value stats (population): scale rate and don't clamp to 0-100
                    updates[stat] = Math.max(0, Number(currentVal) + delta * RAW_SCALING_DIVISORS[stat]);
                } else {
                    updates[stat] = Math.round(Math.max(0, Math.min(100, Number(currentVal) + delta)) * 10) / 10;
                }
            }
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }

    if (effects.approval_below_50_bonus || effects.approval_above_60_penalty) {
        const { data: standing } = await supabase
            .from('faction_electoral_standing')
            .select('party_approval')
            .eq('faction_id', factionId)
            .eq('nation_id', nation.id)
            .maybeSingle();

        if (standing) {
            let delta = 0;
            if (standing.party_approval < 40 && effects.approval_below_50_bonus) {
                delta = effects.approval_below_50_bonus;
            } else if (standing.party_approval > 50 && effects.approval_above_60_penalty) {
                delta = effects.approval_above_60_penalty;
            }
            if (delta !== 0) {
                await _adjustMomentum(supabase, factionId, nation.id, _round2(delta * 0.3), 'trait:pm_approval_conditional', currentTick);
            }
        }
    }

    if (effects.opposition_approval_per_tick) {
        const { data: oppParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .neq('id', factionId);

        for (const opp of (oppParties || [])) {
            await _adjustMomentum(supabase, opp.id, nation.id, _round2(effects.opposition_approval_per_tick * 0.3), 'trait:opposition_approval_per_tick', currentTick);
        }
    }

    if (effects.no_bill_penalty_per_tick) {
        const { count } = await supabase
            .from('bills')
            .select('*', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .eq('proposed_by', factionId)
            .eq('status', 'passed')
            .eq('passed_tick', currentTick - 1);

        if (!count || count === 0) {
            await _adjustMomentum(supabase, factionId, nation.id, _round2(effects.no_bill_penalty_per_tick * 0.3), 'trait:no_bill_penalty', currentTick);
        }
    }
}


// ==================== RESIGN PM ====================

export async function resignPM(supabase, nationId, factionId, currentTick) {
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('*')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .single();

    if (!hog) throw new Error('No active PM to resign');

    if (hog.trait_key === 'survivor') {
        throw new Error('A Survivor cannot resign. They cling to power.');
    }

    // 1. Deactivate PM
    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('id', hog.id);

    // 2. Approval, credibility & stability penalties
    await _adjustMomentum(supabase, factionId, nationId, -3, 'resign_pm', currentTick);
    await _adjustCredibility(supabase, factionId, nationId, -0.05, 0, currentTick, { source: 'resign_pm' });

    const { data: nation } = await supabase
        .from('nations')
        .select('state_apparatus')
        .eq('id', nationId)
        .single();

    if (nation) {
        const newStateApparatus = Math.max(0, (nation.state_apparatus ?? 50) - 3);
        await supabase
            .from('nations')
            .update({ state_apparatus: newStateApparatus })
            .eq('id', nationId);
    }

    // 3. 12-tick PM cooldown on resigning faction
    await supabase
        .from('factions')
        .update({ pm_cooldown_until: currentTick + 12 })
        .eq('id', factionId);

    // 4. Put the coalition into caretaker status and keep it intact for the
    //    succession window. The existing appoint-PM / nominate flow lets a
    //    coalition partner install a new PM during this window; if they do
    //    the snap election scheduled below can be cancelled at that point.
    //    Otherwise the snap election fires after FORMATION_DEADLINE_TICKS.
    //    (Previously this dissolved the coalition + scheduled an immediate
    //    election, which made Resign functionally indistinguishable from
    //    a more punitive Call-Early-Elections — the succession path is what
    //    gives the two actions distinct use-cases.)
    await supabase
        .from('government_formations')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .in('status', ['formed', 'active']);

    // 5. Freeze all active bills (same as early elections / no-confidence)
    await supabase
        .from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nationId)
        .in('status', ['committee', 'floor']);

    // 6. Schedule a fallback snap election one formation-window out. If the
    //    coalition installs a new PM before this tick, downstream logic can
    //    cancel the election and restore coalition status to 'formed'. If
    //    the window expires, the scheduled row fires normally.
    await supabase
        .from('elections')
        .delete()
        .eq('nation_id', nationId)
        .eq('status', 'scheduled')
        .eq('election_type', 'parliamentary');

    const fallbackTick = currentTick + FORMATION_DEADLINE_TICKS;
    await supabase.from('elections').insert({
        nation_id: nationId,
        election_tick: fallbackTick,
        status: 'scheduled',
        election_type: 'parliamentary'
    });

    console.log(`PM resignation: coalition \u2192 caretaker, succession window until tick ${fallbackTick}`);

    // Fire timeline event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'minister_resigned',
            p_nation_id: nationId,
            p_tick: currentTick,
            p_placeholders: { role: 'Prime Minister', name: `${hog.first_name} ${hog.last_name}` }
        });
    } catch (e) { /* non-blocking */ }

    return { result: 'succession_window', reason: hog.trait_key === 'iron_will' ? 'iron_will' : 'pm_resignation', fallbackTick };
}


// ==================== DISBAND PARTY ====================

/**
 * Disband a party.
 *
 * @param {object} opts
 * @param {boolean} [opts.redistribute=true] - When true (default, voluntary
 *   disband path) the disbanded party's seats are immediately redistributed
 *   to the remaining parties via rebalanceVacantSeats. When false (used by
 *   the inactivity auto-disband path) the seats stay vacant until the next
 *   election re-allocates the chamber.
 * @param {boolean} [opts.hardDelete=false] - When true (inactivity auto-
 *   disband only) the party row is physically DELETEd at the end of
 *   housekeeping instead of being soft-marked with abandoned_at. FK
 *   cascades wipe related state (forum posts, ap ledger, executive
 *   orders, etc.). Manual disband / no-confidence cascade keep the
 *   default soft-delete so the disband cooldown semantics still apply.
 */
export async function disbandParty(supabase, nationId, factionId, currentTick, opts = {}) {
    const { redistribute = true, hardDelete = false } = opts;
    // Guard: never disband corporations
    const { data: faction } = await supabase
        .from('factions')
        .select('disband_cooldown_until_tick, faction_name, faction_type')
        .eq('id', factionId)
        .single();

    if (faction?.faction_type === 'corporation') {
        throw new Error('Corporations cannot be disbanded.');
    }

    // 1. Cooldown check — only applies to player-initiated soft
    // disbands. The inactivity sweep + admin tools pass hardDelete:true
    // and should bypass the cooldown; the whole point of the
    // inactivity reaper is "this party has been dormant for N ticks,
    // remove it now" — a player-facing rate-limit can't gate that.
    if (!hardDelete
        && faction?.disband_cooldown_until_tick
        && faction.disband_cooldown_until_tick > currentTick) {
        const remaining = faction.disband_cooldown_until_tick - currentTick;
        throw new Error(`Disband is on cooldown for ${remaining} more tick${remaining !== 1 ? 's' : ''}.`);
    }

    // 2. Fetch nation for ruling checks + seat redistribution
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, ruling_faction_id, government_type, total_seats')
        .eq('id', nationId)
        .single();

    // 3. PM check — if this faction is the active PM, resign first
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('id, trait_key')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .maybeSingle();

    let pmResigned = false;
    if (hog) {
        if (hog.trait_key === 'survivor') {
            throw new Error('Cannot disband while your PM has the Survivor trait. They cling to power.');
        }
        await resignPM(supabase, nationId, factionId, currentTick);
        pmResigned = true;
    }

    // 4. Coalition check — handle if in coalition but not PM (or PM resignation didn't dissolve).
    // Lead-party detection routes through deriveLeadPartyId; the previous
    // direct lead_party_id select silently 42703'd against
    // government_formations and always sent the disbanding party through
    // the junior-partner branch.
    if (!pmResigned) {
        const { data: formations } = await supabase
            .from('government_formations')
            .select('id, party_ids, ministry_assignments, proposed_by')
            .eq('nation_id', nationId)
            .in('status', ['formed', 'caretaker']);

        const myFormation = (formations || []).find(f =>
            (f.party_ids || []).includes(factionId)
        );

        if (myFormation) {
            if (deriveLeadPartyId(myFormation) === factionId) {
                // Lead party disbanding — dissolve entire coalition
                await dissolveCoalition(supabase, nationId);
            } else {
                // Junior partner — remove from party_ids and vacate ministries
                const newPartyIds = (myFormation.party_ids || []).filter(id => id !== factionId);
                const { error: formErr } = await supabase
                    .from('government_formations')
                    .update({ party_ids: newPartyIds })
                    .eq('id', myFormation.id);
                if (formErr) console.warn('disbandParty: could not update formation party_ids:', formErr);

                const { error: minErr } = await supabase
                    .from('ministries')
                    .update({
                        party_id: null, minister_first_name: null, minister_last_name: null,
                        minister_age: null, pending_minister: null,
                        confirmation_status: null
                    })
                    .eq('nation_id', nationId)
                    .eq('party_id', factionId)
                    .eq('is_active', true);
                if (minErr) console.warn('disbandParty: could not vacate ministries:', minErr);
            }
        }
    }

    // 4b. Catch-all: vacate any remaining ministries held by this faction
    //     (covers edge cases where party holds ministries but isn't in an active coalition)
    const { error: catchAllMinErr } = await supabase
        .from('ministries')
        .update({
            party_id: null, minister_first_name: null, minister_last_name: null,
            minister_age: null, pending_minister: null,
            confirmation_status: null
        })
        .eq('nation_id', nationId)
        .eq('party_id', factionId)
        .eq('is_active', true);
    if (catchAllMinErr) console.warn('disbandParty: catch-all ministry vacate failed:', catchAllMinErr);

    // 4c. Clear any pending nominations in this nation where the pending_minister
    //     references the disbanded faction (the nomination bill is already gone)
    const { data: pendingMins } = await supabase
        .from('ministries')
        .select('id, pending_minister')
        .eq('nation_id', nationId)
        .eq('is_active', true)
        .not('pending_minister', 'is', null);
    if (pendingMins) {
        for (const m of pendingMins) {
            const pm = m.pending_minister;
            if (pm && (pm.party_id === factionId || pm.nominated_by === factionId)) {
                await supabase.from('ministries').update({
                    pending_minister: null,
                    confirmation_status: null,
                    minister_first_name: null, minister_last_name: null, minister_age: null
                }).eq('id', m.id);
            }
        }
    }

    // 5. Zero seats and redistribute to remaining parties
    const { data: dyingFaction } = await supabase
        .from('factions').select('seats').eq('id', factionId).single();
    const vacatedSeats = dyingFaction?.seats || 0;

    await supabase.from('factions')
        .update({ seats: 0 })
        .eq('id', factionId);

    // 6. Redistribute vacated seats to remaining parties — unless the
    //    caller asked us not to (inactivity auto-disband leaves the seats
    //    vacant until the next election).
    if (redistribute && nation && vacatedSeats > 0) {
        await rebalanceVacantSeats(supabase, nation);
    }

    // 6b. Nullify FK references that would block future hard-deletes of the faction
    // Tables removed: election_candidates, presidential_candidates don't exist.
    // protests → protest_log (renamed in migration).
    // Tier 2 Phase 3: removed the administrations.pm_party_id = null write.
    // The admin row is a historical ledger — it should preserve who was
    // PM at the time, even if that party later disbands. The pm_party_id
    // column is informational (no FK constraint) so a stale value
    // doesn't block faction hard-delete.
    const fkResults = await Promise.allSettled([
        supabase.from('active_laws').update({ proposed_by: null }).eq('proposed_by', factionId),
        supabase.from('protest_log').update({ faction_id: null }).eq('faction_id', factionId),
    ]);
    for (const r of fkResults) {
        if (r.status === 'rejected') console.warn('disbandParty: FK cleanup error:', r.reason);
        else if (r.value?.error) console.warn('disbandParty: FK cleanup error:', r.value.error.message);
    }

    // 7. Core disband — null out nation_id, reset all stats to fresh defaults
    const { error: disbandErr } = await supabase
        .from('factions')
        .update({
            nation_id: null,
            abandoned_at: new Date().toISOString(),
            disband_cooldown_until_tick: currentTick + 24,
            action_points: 0,
            last_seen_tick: null,
            founded_tick: null
        })
        .eq('id', factionId);

    if (disbandErr) throw new Error('Failed to disband party: ' + disbandErr.message);

    // 8. Fail any open bills proposed by this faction (they lose their sponsor)
    const { data: orphanedBills } = await supabase
        .from('bills')
        .select('id, bill_name')
        .eq('nation_id', nationId)
        .eq('proposed_by', factionId)
        .in('status', ['committee', 'floor']);
    if (orphanedBills && orphanedBills.length > 0) {
        for (const bill of orphanedBills) {
            await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
            console.log(`[disbandParty] Failed orphaned bill "${bill.bill_name}" (proposed by disbanded faction)`);
        }
    }

    // 9. Audit log (before cleanup so the insert isn't immediately deleted)
    const { error: logErr } = await supabase
        .from('campaign_actions')
        .insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'party_disbanded',
            ap_cost: 0,
            tick_performed: currentTick,
            result: { faction_name: faction?.faction_name || 'Unknown' }
        });
    if (logErr) console.warn('disbandParty: could not log action:', logErr);

    // 10. Clean up all faction-related data from the old nation
    // IPO: remove from all International Party Organisations, handle leadership succession
    const handledOrgIds = new Set();
    try {
        // Find all IPOs where this faction is president
        const { data: presidedOrgs } = await supabase
            .from('international_orgs')
            .select('id, name, founding_party_id')
            .eq('president_id', factionId)
            .eq('is_active', true);

        for (const org of (presidedOrgs || [])) {
            handledOrgIds.add(org.id);

            // Find remaining active full members (excluding this faction)
            const { data: remainingMembers } = await supabase
                .from('ipo_members')
                .select('faction_id, joined_at_tick')
                .eq('org_id', org.id)
                .eq('is_active', true)
                .eq('role', 'member')
                .neq('faction_id', factionId)
                .order('joined_at_tick', { ascending: true });

            if (remainingMembers && remainingMembers.length > 0) {
                // Appoint longest-serving member as new president
                const newPresidentId = remainingMembers[0].faction_id;
                const updates = { president_id: newPresidentId, president_term_start_tick: currentTick };
                if (org.founding_party_id === factionId) updates.founding_party_id = newPresidentId;
                const { error: presErr } = await supabase.from('international_orgs').update(updates).eq('id', org.id);
                if (presErr) console.warn(`disbandParty: failed to appoint new IPO president for ${org.name}:`, presErr.message);

                await supabase.from('ipo_chat').insert({
                    org_id: org.id, faction_id: null, is_system: true,
                    message_text: `${faction?.faction_name || 'A party'} has disbanded and been removed from the organisation. A new president has been automatically appointed.`,
                    tick_posted: currentTick,
                });
            } else {
                // No remaining members — dissolve the org
                await supabase.from('international_orgs')
                    .update({ is_active: false, dissolved_at_tick: currentTick })
                    .eq('id', org.id);
            }
        }

        // Transfer founding_party_id for orgs where this faction is founder but NOT president
        const { data: foundedOrgs } = await supabase
            .from('international_orgs')
            .select('id, president_id')
            .eq('founding_party_id', factionId)
            .neq('president_id', factionId)
            .eq('is_active', true);
        for (const org of (foundedOrgs || [])) {
            if (org.president_id) {
                await supabase.from('international_orgs').update({ founding_party_id: org.president_id }).eq('id', org.id);
            }
        }

        // Post system message for non-presided orgs (skip orgs already handled above)
        const { data: memberships } = await supabase
            .from('ipo_members')
            .select('org_id')
            .eq('faction_id', factionId)
            .eq('is_active', true);
        for (const m of (memberships || [])) {
            if (handledOrgIds.has(m.org_id)) continue;
            await supabase.from('ipo_chat').insert({
                org_id: m.org_id, faction_id: null, is_system: true,
                message_text: `${faction?.faction_name || 'A party'} has disbanded and been removed from the organisation.`,
                tick_posted: currentTick,
            });
        }
    } catch (ipoSuccessionErr) {
        console.warn('disbandParty: IPO leadership succession failed (non-fatal):', ipoSuccessionErr);
    }

    // IPO table cleanup (each wrapped to skip if table doesn't exist)
    const ipoCleanup = [
        () => supabase.from('ipo_fund_transactions').delete().eq('faction_id', factionId),
        () => supabase.from('ipo_votes').delete().eq('proposed_by', factionId),
        () => supabase.from('ipo_action_log').delete().eq('faction_id', factionId),
        () => supabase.from('ipo_amendment_history').delete().eq('faction_id', factionId),
        () => supabase.from('ipo_actions').delete().eq('faction_id', factionId),
        () => supabase.from('ipo_actions').delete().eq('target_faction_id', factionId),
        () => supabase.from('ipo_ballots').delete().eq('faction_id', factionId),
        () => supabase.from('ipo_chat').delete().eq('faction_id', factionId),
        () => supabase.from('ipo_invitations').delete().eq('target_faction_id', factionId),
        () => supabase.from('ipo_invitations').delete().eq('invited_by', factionId),
        () => supabase.from('ipo_members').delete().eq('faction_id', factionId),
    ];
    for (const fn of ipoCleanup) { try { await fn(); } catch (_) { /* table may not exist */ } }

    // Phase 5b: faction_ideology / ideology_history / momentum_log tables dropped — no cleanup needed
    await supabase.from('bill_support').delete().eq('faction_id', factionId);
    await supabase.from('campaign_actions').delete().eq('party_id', factionId).neq('action_type', 'party_disbanded');
    await supabase.from('faction_coalitions').delete().eq('faction_a_id', factionId);
    await supabase.from('faction_coalitions').delete().eq('faction_b_id', factionId);
    await supabase.from('loyalty_demands').delete().eq('strongman_faction_id', factionId);
    await supabase.from('loyalty_demands').delete().eq('target_faction_id', factionId);
    // Remove from all group chats (nation chat, etc.) so rejoining a different nation starts clean
    await supabase.from('group_chat_members').delete().eq('faction_id', factionId);
    // Remove electoral standing from old nation
    await supabase.from('faction_electoral_standing').delete().eq('faction_id', factionId);

    // Hard-delete: physically remove the row after all housekeeping. FK
    // cascades take care of any remaining references. Used only by the
    // inactivity auto-disband path; manual disband leaves the row as a
    // tombstone so the 24-tick disband cooldown can prevent immediate
    // re-creation. Note: the campaign_actions audit row inserted above
    // will CASCADE-delete with this — by design (full wipe per spec).
    if (hardDelete) {
        const { error: delErr } = await supabase.from('factions').delete().eq('id', factionId);
        if (delErr) throw new Error('Failed to hard-delete party: ' + delErr.message);
        return { result: 'disbanded', hardDeleted: true };
    }

    return { result: 'disbanded' };
}


// (Appoint successor, Dynasty actions, Coup/Regime health systems removed — Phase 0)

// ==================== LEADERSHIP CHALLENGE (coalition vacancy claim) ====================

// "If you are in a coalition, and the Head of Government seat is vacant,
// you can click this and it appoints your party leader as PM. For every
// party that clicked on the same tick, when it processes on the next
// tick, the party with the most seats is always chosen. Earliest claim
// wins ties." — design spec.

const LEADERSHIP_CHALLENGE_POPULARITY_BOOST = 3;       // +0.3 in display = +3 in integer tenths
const LEADERSHIP_CHALLENGE_BOOST_COOLDOWN  = 12;       // ticks — same-party PM within this window suppresses the boost

// Returns true if the nation runs the parliamentary mechanic
// (parliamentary republic OR constitutional monarchy = parliamentary
// + hereditary HoS). Absolute monarchy / presidential are out —
// leadership challenge would undermine the monarch / president.
function _isParliamentaryForChallenge(nation) {
    const govType = (nation?.government_type || '').toLowerCase();
    const isAM    = govType.includes('absolute monarchy');
    const isPres  = govType.includes('presidential');
    if (isAM || isPres) return false;
    return govType.includes('parliamentary')
        || nation?.hos_election_method === 'hereditary';
}

/**
 * Player-initiated claim. Routes through the SECURITY DEFINER
 * claim_leadership_challenge RPC because authenticated client INSERTs
 * into leadership_challenges are blocked by the default RLS posture
 * on user-created tables. The RPC re-validates eligibility server-side
 * (parliamentary, vacancy, coalition membership, leader, seats), so
 * the JS-side checks here are kept as fast pre-flight bails only —
 * the RPC is the source of truth.
 *
 * Returns { success, reason?, alreadyClaimed? }.
 */
export async function claimLeadershipChallenge(supabase, nation, faction, currentTick) {
    if (!nation?.id || !faction?.id) return { success: false, reason: 'missing_args' };
    if (!_isParliamentaryForChallenge(nation)) return { success: false, reason: 'wrong_gov_type' };
    if (!faction.leader_first_name)        return { success: false, reason: 'no_leader' };
    if (!faction.seats || faction.seats <= 0) return { success: false, reason: 'no_seats' };

    const { data, error } = await supabase.rpc('claim_leadership_challenge', {
        p_nation_id:  nation.id,
        p_faction_id: faction.id,
    });
    if (error) return { success: false, reason: 'rpc_failed', error: error.message };
    if (!data?.success) return { success: false, reason: data?.reason || 'unknown' };
    return {
        success: true,
        alreadyClaimed: !!data.already_claimed,
        claimedAtTick: Number(data.claimed_at_tick) || currentTick,
    };
}

/**
 * Resolution pass — runs once per tick from the global post-loop block
 * in handler-template. Processes all unresolved claims with
 * claimed_at_tick < currentTick (i.e. from previous ticks). For each
 * affected nation: re-checks vacancy + coalition + per-faction validity,
 * picks the highest-seats / earliest-claim winner, installs them as PM,
 * applies the +0.3 popularity boost (gated by the 12-tick PM cooldown),
 * marks rows won/lost/discarded.
 */
export async function resolveLeadershipChallenges(supabase, currentTick) {
    const { data: pending, error } = await supabase
        .from('leadership_challenges')
        .select('id, nation_id, faction_id, claimed_at_tick, seats_at_claim, created_at')
        .is('resolved_at_tick', null)
        .lt('claimed_at_tick', currentTick);
    if (error) {
        console.error('[LeadershipChallenge] pending fetch failed:', error.message);
        return null;
    }
    if (!pending || pending.length === 0) return null;

    const byNation = new Map();
    for (const p of pending) {
        if (!byNation.has(p.nation_id)) byNation.set(p.nation_id, []);
        byNation.get(p.nation_id).push(p);
    }

    let installedCount = 0;
    for (const [nationId, claims] of byNation) {
        try {
            const installed = await _resolveOneNation(supabase, nationId, claims, currentTick);
            if (installed) installedCount++;
        } catch (err) {
            console.error('[LeadershipChallenge] nation resolution failed:', nationId, err);
        }
    }
    return { installedCount, totalNations: byNation.size };
}

async function _markResolution(supabase, ids, resolution, currentTick) {
    if (!ids.length) return;
    const { error } = await supabase.from('leadership_challenges')
        .update({ resolved_at_tick: currentTick, resolution })
        .in('id', ids);
    if (error) console.warn('[LeadershipChallenge] mark', resolution, 'failed:', error.message);
}

async function _resolveOneNation(supabase, nationId, claims, currentTick) {
    const allIds = claims.map(c => c.id);

    // Vacancy still open?
    const { data: hog } = await supabase
        .from('head_of_government').select('id')
        .eq('nation_id', nationId).eq('active', true).maybeSingle();
    if (hog) {
        await _markResolution(supabase, allIds, 'discarded', currentTick);
        return false;
    }

    // Nation still parliamentary?
    const { data: nation } = await supabase
        .from('nations').select('id, name, government_type, hos_election_method, successor_cooldown_end_tick')
        .eq('id', nationId).single();
    if (!nation || !_isParliamentaryForChallenge(nation)) {
        await _markResolution(supabase, allIds, 'discarded', currentTick);
        return false;
    }
    if (nation.successor_cooldown_end_tick && currentTick < nation.successor_cooldown_end_tick) {
        await _markResolution(supabase, allIds, 'discarded', currentTick);
        return false;
    }

    // Coalition still active? Use fetchActiveCoalition so the resolver
    // matches the same latest-election formed/caretaker source of truth as
    // the UI and claim RPC. Do not allow stale active proposals or monarchy
    // ministry fallbacks to decide a parliamentary PM challenge.
    const formation = await fetchActiveCoalition(supabase, nationId);
    if (!formation || !Array.isArray(formation.party_ids) || !formation.party_ids.length) {
        await _markResolution(supabase, allIds, 'discarded', currentTick);
        return false;
    }
    const coalitionIds = new Set(formation.party_ids || []);

    // Filter claims: faction must still be in coalition + have leader + have seats.
    const inCoalitionClaims = claims.filter(c => coalitionIds.has(c.faction_id));
    if (!inCoalitionClaims.length) {
        await _markResolution(supabase, allIds, 'discarded', currentTick);
        return false;
    }
    const { data: factions } = await supabase.from('factions')
        .select('id, faction_name, seats, leader_first_name, leader_last_name, leader_age')
        .in('id', inCoalitionClaims.map(c => c.faction_id));
    const factionMap = new Map((factions || []).map(f => [f.id, f]));
    const validClaims = inCoalitionClaims.filter(c => {
        const f = factionMap.get(c.faction_id);
        return f && (Number(f.seats) || 0) > 0 && f.leader_first_name;
    });
    if (!validClaims.length) {
        await _markResolution(supabase, allIds, 'discarded', currentTick);
        return false;
    }

    // Sort: most seats wins; earliest created_at breaks ties.
    validClaims.sort((a, b) => {
        const sa = Number(factionMap.get(a.faction_id)?.seats) || 0;
        const sb = Number(factionMap.get(b.faction_id)?.seats) || 0;
        if (sb !== sa) return sb - sa;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    const winnerClaim = validClaims[0];
    const winner = factionMap.get(winnerClaim.faction_id);

    // Install as PM.
    try {
        await installHOG(supabase, {
            nationId,
            factionId: winner.id,
            firstName: winner.leader_first_name,
            lastName:  winner.leader_last_name,
            age:       winner.leader_age || 50,
            currentTick,
            reason: 'leadership_challenge',
        });
    } catch (err) {
        console.error('[LeadershipChallenge] installHOG failed for', winner.id, err);
        // Don't mark anything — try again next tick.
        return false;
    }

    // Popularity boost (gated by the 12-tick same-party PM cooldown to
    // block resign→reclaim farming).
    const { data: recentPM } = await supabase
        .from('head_of_government')
        .select('id')
        .eq('nation_id', nationId)
        .eq('faction_id', winner.id)
        .gte('appointed_tick', currentTick - LEADERSHIP_CHALLENGE_BOOST_COOLDOWN)
        // Exclude the row we just inserted via installHOG (appointed at currentTick).
        .lt('appointed_tick', currentTick)
        .limit(1).maybeSingle();
    if (!recentPM) {
        await _applyAllSectorPopularityBoost(supabase, nationId, winner.id, LEADERSHIP_CHALLENGE_POPULARITY_BOOST);
    }

    // Mark winner / losers / discarded.
    await _markResolution(supabase, [winnerClaim.id], 'won', currentTick);
    const loserIds = validClaims.filter(c => c.id !== winnerClaim.id).map(c => c.id);
    await _markResolution(supabase, loserIds, 'lost', currentTick);
    const validIdSet = new Set(validClaims.map(c => c.id));
    const discardedIds = claims.filter(c => !validIdSet.has(c.id)).map(c => c.id);
    await _markResolution(supabase, discardedIds, 'discarded', currentTick);

    // Event log entry — surfaces in the executive timeline.
    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Leadership Challenge — PM Installed',
        category: 'political',
        trigger_key: 'leadership_challenge_won',
        description_chosen: `${winner.faction_name} claimed the Premiership via Leadership Challenge — ${winner.leader_first_name} ${winner.leader_last_name} installed as Prime Minister.`,
        fired_at_tick: currentTick,
    });

    return true;
}

// ==================== VOLA STADIUM CONSTRUCTION (Sports Minister action) ====================

// Three tiers — small/modest/extravagant. Each posts a Construction-sector
// contract (corp_contracts) for corps to bid on. Posting cost is in raw
// dollars deducted from ministries.sports.discretionary_balance; contract
// budget target is also raw dollars (the figure corps see + bid against).
//
// Tunings:
//     Small        $3M discretionary, $60M target,  floor +2 / 18-mo timeline / 1 crew
//     Modest       $7M discretionary, $140M target, floor +4 / 28-mo timeline / 1 crew
//     Extravagant  $10M discretionary, $450M target, floor +9 / 38-mo timeline / 2 crews
//
// timelineMonths is the contract's stated duration (corps may quote
// faster bids per the construction system, so on-the-ground build
// time averages slightly under these figures).
//
// crewsRequired writes to corp_contracts.requirements JSONB so the
// existing construction-sector bid gate (work_crews stat) filters
// out under-staffed corps.
//
// spec_category is the cross-system identifier (corp Operations page
// reads this for filtering); project_subtype='Vola Stadium' is the
// discriminator for our completion sweep + RPCs.
export const VOLA_STADIUM_TIERS = Object.freeze({
    small: {
        label: 'Small',
        postingCost:       3 * _M,
        budgetTarget:      60  * _M,
        floorContribution: 2,
        timelineMonths:    18,
        crewsRequired:     1,
        specCategory:     'Light Infrastructure',
    },
    modest: {
        label: 'Modest',
        postingCost:       7 * _M,
        budgetTarget:      140 * _M,
        floorContribution: 4,
        timelineMonths:    28,
        crewsRequired:     1,
        specCategory:     'Heavy Infrastructure',
    },
    extravagant: {
        label: 'Extravagant',
        postingCost:       10 * _M,
        budgetTarget:      450 * _M,
        floorContribution: 9,
        timelineMonths:    38,
        crewsRequired:     2,
        specCategory:     'Megaproject',
    },
});

const _STADIUM_PROJECT_SUBTYPE = 'Vola Stadium';
const _STADIUM_BID_WINDOW_TICKS = 6; // bids open for 6 ticks before auto-cancel

/**
 * Sports Minister posts a stadium construction contract. Validates only-one-
 * open-bid-per-nation, deducts the discretionary tier cost, inserts a
 * corp_contracts row corps can immediately bid on. Idempotent against
 * the discretionary deduction by virtue of the open-contract check —
 * if a bid is already open, this fails before the deduction runs.
 *
 * Returns { success, contractId? } or { success: false, reason }.
 */
export async function postStadiumConstruction(supabase, nation, callerFactionId, params, currentTick) {
    if (!nation?.id) return { success: false, reason: 'missing_args' };
    if (!VOLA_STADIUM_TIERS[params?.size]) return { success: false, reason: 'invalid_size' };
    const stadiumName = String(params?.stadiumName || '').trim();
    if (!stadiumName) return { success: false, reason: 'no_stadium_name' };

    // Routed through the SECURITY DEFINER RPC. Authenticated clients
    // can't INSERT corp_contracts or UPDATE nations.budget directly
    // (RLS); the RPC validates caller = active sports minister and
    // performs every write atomically.
    const { data, error } = await supabase.rpc('post_stadium_contract', {
        p_size:          params.size,
        p_stadium_name:  stadiumName,
        p_team_name:     String(params?.teamName || '').trim(),
    });
    if (error) return { success: false, reason: 'rpc_failed', error: error.message };
    if (!data?.success) return { success: false, reason: data?.reason || 'unknown' };

    // Mirror the budget deduction onto the local nation object.
    const tier = VOLA_STADIUM_TIERS[params.size];
    if (tier && nation.budget != null) {
        nation.budget = (Number(nation.budget) || 0) - tier.postingCost;
    }

    return { success: true, contractId: data.contract_id, tier: data.tier || params.size };
}

/**
 * Tick-processor sweep: detect stadium contracts that have hit their
 * expected_finish_tick and apply completion side-effects. Idempotent —
 * scoped to project_subtype='Vola Stadium' AND status='active', so
 * already-completed contracts are skipped.
 *
 * Side effects per completed contract:
 *   - status='completed', completed_at_tick=currentTick
 *   - issuer_nation_id: vola_stadiums += 1, vola_culture_floor += contribution
 *   - event_log entry: "Stadium NAME opened (floor +N) — home of TEAM"
 */
export async function processVolaStadiumCompletions(supabase, currentTick) {
    const { data: due, error } = await supabase.from('corp_contracts')
        .select('id, name, description, spec_category, issuer_nation_id, expected_finish_tick, winner_faction_id')
        .eq('project_subtype', _STADIUM_PROJECT_SUBTYPE)
        .eq('status', 'active')
        .not('expected_finish_tick', 'is', null)
        .lte('expected_finish_tick', currentTick);
    if (error) {
        console.warn('[VolaStadiumCompletion] fetch failed:', error.message);
        return null;
    }
    if (!due || due.length === 0) return null;

    let completed = 0;
    for (const c of due) {
        // spec_category drives both the floor contribution and the
        // annual upkeep cost added to the host's budget.
        const floor      = c.spec_category === 'Light Infrastructure' ? 2
                         : c.spec_category === 'Heavy Infrastructure' ? 4
                         : c.spec_category === 'Megaproject'          ? 9
                         : 0;
        const annualCost = c.spec_category === 'Light Infrastructure' ? 0.5
                         : c.spec_category === 'Heavy Infrastructure' ? 1.0
                         : c.spec_category === 'Megaproject'          ? 2.0
                         : 0;

        // Order matters: read + write the host BEFORE flipping the
        // contract's status flag. If either step fails we leave the
        // contract at 'active' so the next tick retries. (Previous
        // ordering marked the contract completed first; when a schema
        // drift caused the host SELECT to error, the side-effects were
        // silently lost forever — the missing-column bug hidden behind
        // the empty UI counts.)
        const { data: host, error: hostErr } = await supabase.from('nations')
            .select('id, name, vola_stadiums, vola_culture_floor, vola_stadium_annual_cost')
            .eq('id', c.issuer_nation_id).single();
        if (hostErr || !host) {
            console.error(
                `[VolaStadiumCompletion] host fetch failed for contract ${c.id} (nation ${c.issuer_nation_id}); leaving contract active for retry:`,
                hostErr?.message || 'no row returned'
            );
            continue;
        }

        const newCount      = (Number(host.vola_stadiums) || 0) + 1;
        const newFloor      = Math.min(100, _roundCulture((Number(host.vola_culture_floor) || 0) + floor));
        const newAnnualCost = Math.round(((Number(host.vola_stadium_annual_cost) || 0) + annualCost) * 10) / 10;
        const { error: hostUpdErr } = await supabase.from('nations').update({
            vola_stadiums:            newCount,
            vola_culture_floor:       newFloor,
            vola_stadium_annual_cost: newAnnualCost,
        }).eq('id', host.id);
        if (hostUpdErr) {
            console.error(
                `[VolaStadiumCompletion] host update failed for contract ${c.id} (nation ${host.name}); leaving contract active for retry:`,
                hostUpdErr.message
            );
            continue;
        }

        // Host columns are committed — now advance the contract flag.
        // The .eq('status', 'active') guard keeps this idempotent in
        // the (extremely unlikely) case another worker raced us.
        const { error: contractErr } = await supabase.from('corp_contracts').update({
            status: 'completed',
            completed_at_tick: currentTick,
            payout_tick: currentTick + 3,
        }).eq('id', c.id).eq('status', 'active');
        if (contractErr) {
            console.error(
                `[VolaStadiumCompletion] mark-complete failed for contract ${c.id} AFTER host update succeeded — host now has a double-count risk if this contract is reprocessed; manual reconciliation may be required:`,
                contractErr.message
            );
            // Don't skip the rest — the host columns are correct for
            // this stadium; the GDP bonus + event log should still fire
            // so the operator sees the partial-state in the timeline.
        }

        // Construction GDP bonus — host nation gains +0.1 gdp_growth on
        // every stadium completion. RPC trusts the caller; service_role
        // (this tick processor) goes through the no-auth.uid() path.
        // Best-effort — a failure shouldn't block the rest of the sweep.
        try {
            await supabase.rpc('award_construction_gdp_bonus', { p_nation_id: c.issuer_nation_id });
        } catch (gdpErr) {
            console.warn('[VolaStadiumCompletion] gdp bonus rpc failed for', c.id, ':', gdpErr?.message || gdpErr);
        }

        // Event log — "Coastal Vola Park opened · floor +7 · home of Coastal Tide".
        const teamLabel = (c.description || '').replace(/^Home of:\s*/i, '').trim();
        const desc = `${c.name} opened · floor +${floor}` + (teamLabel ? ` · home of ${teamLabel}` : '');
        const { error: evErr } = await supabase.from('event_log').insert({
            nation_id:          c.issuer_nation_id,
            event_name:         'Vola Stadium Opened',
            category:           'political',
            trigger_key:        'vola_stadium_completed',
            description_chosen: desc,
            fired_at_tick:      currentTick,
        });
        if (evErr) {
            console.warn('[VolaStadiumCompletion] event_log insert failed for', c.id, ':', evErr.message);
        }

        completed++;
    }

    return { completed };
}

// ==================== INTERIOR INFRASTRUCTURE COMPLETIONS ====================
//
// Mirror of processVolaStadiumCompletions for Ministry of the Interior
// "Expand Infrastructure" projects. Sweeps active corp_contracts with
// project_subtype='Interior Infrastructure' that have hit their
// expected_finish_tick, marks each as completed, applies tier-specific
// stat effects to the issuing nation, and fires the standard
// construction GDP bonus + an event-log entry. Tier specs are read
// from interior_infrastructure_tiers() (single source of truth).

const _INTERIOR_PROJECT_SUBTYPE = 'Interior Infrastructure';

export async function processInteriorInfrastructureCompletions(supabase, currentTick) {
    const { data: due, error } = await supabase.from('corp_contracts')
        .select('id, name, spec_category, issuer_nation_id, expected_finish_tick')
        .eq('project_subtype', _INTERIOR_PROJECT_SUBTYPE)
        .eq('status', 'active')
        .not('expected_finish_tick', 'is', null)
        .lte('expected_finish_tick', currentTick);
    if (error) {
        console.warn('[InteriorInfrastructure] fetch failed:', error.message);
        return null;
    }
    if (!due || due.length === 0) return null;

    // Pull the tier config once and index by spec_category. Both the
    // post RPC and this processor consult the same JSONB so the
    // effects can never disagree with what the player committed to.
    const { data: tiersData } = await supabase.rpc('interior_infrastructure_tiers');
    const tiers = tiersData || {};
    const bySpec = {};
    for (const key of Object.keys(tiers)) {
        const t = tiers[key];
        if (t && t.spec_category) bySpec[t.spec_category] = t;
    }

    let completed = 0;
    for (const c of due) {
        const tier = bySpec[c.spec_category];
        const effects = (tier && Array.isArray(tier.stat_effects)) ? tier.stat_effects : [];

        // Mark complete first — guards against double-apply if a
        // downstream step fails.
        const { error: updErr } = await supabase.from('corp_contracts').update({
            status:           'completed',
            completed_at_tick: currentTick,
            payout_tick:       currentTick + 3,
        }).eq('id', c.id).eq('status', 'active');
        if (updErr) {
            console.warn('[InteriorInfrastructure] mark-complete failed for', c.id, ':', updErr.message);
            continue;
        }

        // Apply tier stat effects. Read once, write once with all
        // bumps. public_approval clamped 0..100; sol/gdp_growth
        // unclamped (handled by global game systems).
        if (effects.length > 0) {
            const cols = effects.map(e => e.stat).filter(Boolean);
            const selectCols = ['id', ...cols].join(', ');
            const { data: nation } = await supabase.from('nations')
                .select(selectCols).eq('id', c.issuer_nation_id).single();
            if (nation) {
                const updates = {};
                for (const eff of effects) {
                    const cur = Number(nation[eff.stat]) || 0;
                    let next = cur + Number(eff.delta);
                    if (eff.stat === 'public_approval') {
                        next = Math.max(0, Math.min(100, next));
                    }
                    updates[eff.stat] = next;
                }
                await supabase.from('nations').update(updates).eq('id', c.issuer_nation_id);
            }
        }

        // Generic construction GDP bonus (+0.1) — same RPC every
        // construction completion fires. Stacks on top of the
        // tier-specific gdp_growth bumps above.
        try {
            await supabase.rpc('award_construction_gdp_bonus', { p_nation_id: c.issuer_nation_id });
        } catch (gdpErr) {
            console.warn('[InteriorInfrastructure] gdp bonus rpc failed for', c.id, ':', gdpErr?.message || gdpErr);
        }

        const effectsText = effects.map(e => {
            const sign = Number(e.delta) >= 0 ? '+' : '';
            return `${sign}${e.delta} ${e.stat.replace(/_/g, ' ')}`;
        }).join(' · ');
        await supabase.from('event_log').insert({
            nation_id:          c.issuer_nation_id,
            event_name:         'Interior Infrastructure Completed',
            category:           'political',
            trigger_key:        'interior_infrastructure_completed',
            description_chosen: `${c.name} opened${effectsText ? ' · ' + effectsText : ''}`,
            fired_at_tick:      currentTick,
        });

        completed++;
    }

    return { completed };
}

const _CAS_PROJECT_SUBTYPE = 'Combined Arms School';

// Combined Arms School completion sweep. Mirrors
// processInteriorInfrastructureCompletions, but the stat effects
// land on the ISSUING ARMY FACTION (issuer_faction_id), not the
// nation — and only if that faction still exists & is active
// (resign/disband during the 36-month build → skip the buff;
// product decision "Skip buff, keep the rest"). The build still
// completes, the corp is still paid via the standard payout_tick,
// and the $2/tick National Infrastructure upkeep still starts
// (computeCombinedArmsSchoolUpkeepAnnual keys off the nation).
// Effects + upkeep read combined_arms_school_spec() — the same
// single source of truth post_combined_arms_school committed to.
export async function processCombinedArmsSchoolCompletions(supabase, currentTick) {
    const { data: due, error } = await supabase.from('corp_contracts')
        .select('id, name, issuer_nation_id, issuer_faction_id, expected_finish_tick')
        .eq('project_subtype', _CAS_PROJECT_SUBTYPE)
        .eq('status', 'active')
        .not('expected_finish_tick', 'is', null)
        .lte('expected_finish_tick', currentTick);
    if (error) {
        console.warn('[CombinedArmsSchool] fetch failed:', error.message);
        return null;
    }
    if (!due || due.length === 0) return null;

    const { data: specData } = await supabase.rpc('combined_arms_school_spec');
    const effects = (specData && Array.isArray(specData.stat_effects)) ? specData.stat_effects : [];

    let completed = 0;
    for (const c of due) {
        // Mark complete first (atomic on status='active') — guards
        // double-apply if a downstream step fails or the cron re-fires.
        const { error: updErr } = await supabase.from('corp_contracts').update({
            status:            'completed',
            completed_at_tick: currentTick,
            payout_tick:       currentTick + 3,
        }).eq('id', c.id).eq('status', 'active');
        if (updErr) {
            console.warn('[CombinedArmsSchool] mark-complete failed for', c.id, ':', updErr.message);
            continue;
        }

        // Buff the issuing army faction — only if it still exists and
        // is an active army faction. issuer_faction_id is NULLed by the
        // FK (ON DELETE SET NULL) if the faction was deleted.
        if (c.issuer_faction_id && effects.length > 0) {
            const cols = effects.map(e => e.stat).filter(Boolean);
            const { data: fac } = await supabase.from('factions')
                .select(['id', 'faction_type', 'branch', 'abandoned_at', 'is_banned', ...cols].join(', '))
                .eq('id', c.issuer_faction_id)
                .maybeSingle();
            const active = fac && fac.faction_type === 'military' && fac.branch === 'army'
                && fac.abandoned_at == null && fac.is_banned !== true;
            if (active) {
                const updates = {};
                for (const eff of effects) {
                    const cur = Number(fac[eff.stat]) || 0;
                    updates[eff.stat] = Math.max(0, Math.min(100, cur + Number(eff.delta)));
                }
                const { error: facErr } = await supabase.from('factions')
                    .update(updates).eq('id', c.issuer_faction_id);
                if (facErr) console.warn('[CombinedArmsSchool] faction buff failed for', c.issuer_faction_id, ':', facErr.message);
            }
        }

        // Generic construction GDP bonus — same RPC every construction
        // completion fires (parity with Interior Infrastructure).
        try {
            await supabase.rpc('award_construction_gdp_bonus', { p_nation_id: c.issuer_nation_id });
        } catch (gdpErr) {
            console.warn('[CombinedArmsSchool] gdp bonus rpc failed for', c.id, ':', gdpErr?.message || gdpErr);
        }

        const effectsText = effects.map(e => {
            const sign = Number(e.delta) >= 0 ? '+' : '';
            return `${sign}${e.delta} ${e.stat.replace(/^army_/, '').replace(/_/g, ' ')}`;
        }).join(' · ');
        await supabase.from('event_log').insert({
            nation_id:          c.issuer_nation_id,
            event_name:         'Combined Arms School Opened',
            category:           'government',
            trigger_key:        'military_combined_arms_school_completed',
            description_chosen: `${c.name} opened${effectsText ? ' · ' + effectsText : ''}`,
            fired_at_tick:      currentTick,
        });

        completed++;
    }

    return { completed };
}

// ==================== VWC HOST BIDDING (Sports Minister action) ====================

// Sports Minister submits a host bid for a future World Vola Cup.
// $10M discretionary cost, once per cup per nation (UNIQUE constraint).
// Resolution fires 12 ticks before cup start (= the qualifier tick) via
// resolveVolaCupBids in the post-loop sweep.
//
// Cup ordinal helper duplicated locally rather than reaching across to
// sports-subtab code so the tick processor has zero UI deps.
function _cupOrdinal(n) {
    const v = n % 100;
    const last = n % 10;
    if (v >= 11 && v <= 13) return n + 'th';
    if (last === 1) return n + 'st';
    if (last === 2) return n + 'nd';
    if (last === 3) return n + 'rd';
    return n + 'th';
}

// Convert tick number to year. Lives here (not js/utils.js) because the
// edge bundle doesn't include utils.js.
function _tickToYear(tick) { return 2000 + Math.floor(Number(tick) / 12); }

/**
 * Player-triggered minority government. Routes through the
 * form_minority_government RPC; server validates caller is leader of
 * the largest active party, formation deadline has elapsed, no formed
 * coalition exists, and no party has outright majority. JS just relays.
 *
 * Returns { success, reason?, formationId?, pmParty?, autoSnapAtTick? }.
 */
export async function formMinorityGovernment(supabase, nationId) {
    if (!nationId) return { success: false, reason: 'invalid_nation' };
    const { data, error } = await supabase.rpc('form_minority_government', {
        p_nation_id: nationId,
    });
    if (error) return { success: false, reason: 'rpc_failed', error: error.message };
    if (!data?.success) return { success: false, reason: data?.reason || 'unknown' };
    return {
        success:         true,
        formationId:     data.formation_id,
        pmParty:         data.pm_party,
        formedAtTick:    Number(data.formed_at_tick || 0),
        autoSnapAtTick:  Number(data.auto_snap_at_tick || 0),
    };
}

/**
 * Player-initiated bid. Routes through the bid_to_host_vwc RPC for the
 * server-side validation + atomic discretionary deduction. The RPC owns
 * eligibility (minister, balance, deadline, no existing host or bid) so
 * the JS wrapper just relays the result.
 *
 * Returns { success, reason?, cupNumber?, resolutionTick?, cost? }.
 */
export async function bidToHostVwc(supabase, cupNumber, nationId) {
    if (!cupNumber || cupNumber <= 0) return { success: false, reason: 'invalid_cup' };
    if (!nationId)                     return { success: false, reason: 'invalid_nation' };
    const { data, error } = await supabase.rpc('bid_to_host_vwc', {
        p_cup_number: cupNumber,
        p_nation_id:  nationId,
    });
    if (error) return { success: false, reason: 'rpc_failed', error: error.message };
    if (!data?.success) return { success: false, reason: data?.reason || 'unknown' };
    return {
        success:        true,
        cupNumber:      Number(data.cup_number || cupNumber),
        cupStartTick:   Number(data.cup_start_tick || 0),
        resolutionTick: Number(data.resolution_tick || 0),
        cost:           Number(data.cost || 0),
    };
}

/**
 * Tick-processor sweep: pick the host for every cup whose qualifier
 * tick (= cup_start - 12) is the current tick. Per-cup formula:
 *
 *   bid_score = (sports_culture / 2)
 *             + (infrastructure × 3)
 *             + (global_image × 3)
 *             + (vola_stadiums × 5)
 *             + 1d20
 *
 * Highest score wins; tie → higher national_vola_culture. Winner gets
 * +1d20+5 budget, +3 global_image, +0.5 public_approval, +1d6 culture,
 * and a vola_cup_hosts row with home_advantage=15. Losers get -0.2
 * public_approval.
 *
 * Idempotent: skip cups that already have a vola_cup_hosts row.
 */
export async function resolveVolaCupBids(supabase, currentTick) {
    const targetCupStart = Number(currentTick) + 12;

    // Self-healing: catch any pending bid whose cup_start_tick is at or
    // before targetCupStart (originally .eq, but that meant a single
    // missed orchestrator pass at the exact resolution tick orphaned
    // the bids forever). .lte preserves normal-case behaviour — the
    // first tick where cup_start_tick reaches the window still
    // resolves on that tick — and additionally re-attempts on every
    // subsequent tick until the cup actually gets its host row.
    const { data: pending, error } = await supabase
        .from('vola_host_bids')
        .select('id, nation_id, cup_number, cup_start_tick')
        .lte('cup_start_tick', targetCupStart)
        .is('resolved_at_tick', null);
    if (error) {
        console.warn('[VWCHost] pending fetch failed:', error.message);
        return null;
    }
    if (!pending || pending.length === 0) return null;

    // Group by cup_number — each cup resolves independently.
    const byCup = new Map();
    for (const b of pending) {
        if (!byCup.has(b.cup_number)) byCup.set(b.cup_number, []);
        byCup.get(b.cup_number).push(b);
    }

    let resolved = 0;
    for (const [cupNumber, bids] of byCup) {
        try {
            // Use the bid row's own cup_start_tick — under the .eq filter
            // this always equaled targetCupStart, but .lte means they
            // can differ for orphan bids being resolved on a later
            // tick. Passing targetCupStart would write the wrong
            // cup_start_tick into vola_cup_hosts and the wrong year
            // into the host-announcement event log.
            const cupStartTick = Number(bids[0]?.cup_start_tick) || targetCupStart;
            const did = await _resolveOneCup(supabase, cupNumber, bids, cupStartTick, currentTick);
            if (did) resolved++;
        } catch (err) {
            console.error('[VWCHost] resolve failed for cup', cupNumber, err);
        }
    }
    return { resolved, cups: byCup.size };
}

async function _resolveOneCup(supabase, cupNumber, bids, cupStartTick, currentTick) {
    // Idempotency — skip cups that already have a host row.
    const { data: existingHost } = await supabase.from('vola_cup_hosts')
        .select('cup_number').eq('cup_number', cupNumber).maybeSingle();
    if (existingHost) return false;

    // Load every bidder's relevant stats.
    const nationIds = bids.map(b => b.nation_id);
    const { data: nations, error: nErr } = await supabase.from('nations')
        .select('id, name, national_vola_culture, infrastructure, global_image, vola_stadiums, public_approval, budget')
        .in('id', nationIds);
    if (nErr) {
        console.warn('[VWCHost] nation fetch failed:', nErr.message);
        return false;
    }
    const nationMap = new Map((nations || []).map(n => [n.id, n]));

    // Filter out bids whose nation is gone (e.g. nation deleted between
    // bid and resolution). Without this, a missing-nation bid scores
    // with all-zero stats but could still "win" with just +1d20, then
    // the win-effect UPDATE silently no-ops on the undefined id.
    const validBids = bids.filter(b => nationMap.has(b.nation_id));
    const stalebids = bids.filter(b => !nationMap.has(b.nation_id));
    if (stalebids.length > 0) {
        await supabase.from('vola_host_bids').update({
            resolved_at_tick: currentTick, won: false,
        }).in('id', stalebids.map(b => b.id));
    }
    if (validBids.length === 0) return false;

    const scored = validBids.map(b => {
        const n = nationMap.get(b.nation_id);
        const culture       = Number(n.national_vola_culture) || 0;
        const infrastructure = Number(n.infrastructure) || 0;
        const globalImage   = Number(n.global_image) || 0;
        const stadiums      = Number(n.vola_stadiums) || 0;
        const d20           = Math.floor(Math.random() * 20) + 1;
        const score = (culture / 2) + (infrastructure * 3) + (globalImage * 3) + (stadiums * 5) + d20;
        return { bid: b, nation: n, score, culture };
    });

    // Highest score wins; tie → higher national_vola_culture.
    scored.sort((a, b) => (b.score - a.score) || (b.culture - a.culture));
    const winner = scored[0];
    const losers = scored.slice(1);

    // Award. PRIMARY KEY on cup_number guards against a parallel
    // resolution duplicating the row.
    const { error: hostErr } = await supabase.from('vola_cup_hosts').insert({
        cup_number:      cupNumber,
        cup_start_tick:  cupStartTick,
        host_nation_id:  winner.bid.nation_id,
        awarded_at_tick: currentTick,
        winning_score:   winner.score,
        home_advantage:  15,
    });
    if (hostErr) {
        console.warn('[VWCHost] host insert failed for cup', cupNumber, hostErr.message);
        return false;
    }

    // Apply win effects to the winner.
    const winN = winner.nation;
    const budgetBonus  = (Math.floor(Math.random() * 20) + 1) + 5;            // 1d20 + 5
    const cultureBonus = Math.floor(Math.random() * 6) + 1;                   // 1d6
    const newBudget    = (Number(winN.budget) || 0) + budgetBonus;
    const newGI        = Math.min(100, (Number(winN.global_image) || 0) + 3);
    const newPA        = Math.min(100, (Number(winN.public_approval) || 0) + 0.5);
    const newCulture   = Math.min(100, _roundCulture((Number(winN.national_vola_culture) || 0) + cultureBonus));

    await supabase.from('nations').update({
        budget: newBudget,
        global_image: newGI,
        public_approval: newPA,
        national_vola_culture: newCulture,
    }).eq('id', winN.id);

    // Apply lose effect to losers (one UPDATE per loser keeps it
    // simple; bid sets are typically small).
    for (const s of losers) {
        const lN = s.nation;
        if (!lN || !lN.id) continue;
        const newLPA = Math.max(0, (Number(lN.public_approval) || 0) - 0.2);
        await supabase.from('nations').update({ public_approval: newLPA }).eq('id', lN.id);
    }

    // Mark bid rows resolved (winner first, then losers).
    await supabase.from('vola_host_bids').update({
        resolved_at_tick: currentTick,
        won: false,
    }).eq('cup_number', cupNumber);
    await supabase.from('vola_host_bids').update({
        won: true, bid_score: winner.score,
    }).eq('id', winner.bid.id);
    for (const s of losers) {
        await supabase.from('vola_host_bids').update({
            bid_score: s.score,
        }).eq('id', s.bid.id);
    }

    // Event log on the winning nation.
    const ord  = _cupOrdinal(cupNumber);
    const year = _tickToYear(cupStartTick);
    await supabase.from('event_log').insert({
        nation_id:           winN.id,
        event_name:          'VWC Host Awarded',
        category:            'political',
        trigger_key:         'vwc_host_awarded',
        description_chosen:  `The nation of ${winN.name} has won the bid and will host the ${ord} Vola World Cup in ${year}!`,
        fired_at_tick:       currentTick,
    });

    return true;
}

// ==================== NATIONAL VOLA TEAM (3-player roster lifecycle) ====================

// Each nation runs a 3-player Vola roster. Players retire after 1d36
// ticks; on retirement the tick processor draws a fresh name from the
// nation's pool and locks the new rating at floor(current_culture) + 6.
// Team Prowess (= sum of all 3 active player ratings) is mirrored onto
// nations.national_team_prowess so the UI + match resolver read one
// column instead of joining + summing every read.

const _VOLA_POSITION_NAMES = ['Forward', 'Midfielder', 'Defender']; // 1, 2, 3

function _pickFromPool(pool, fallback) {
    const arr = Array.isArray(pool) ? pool : [];
    if (arr.length === 0) return fallback;
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Tick sweep: retire any player whose retires_at_tick has arrived,
 * recruit a replacement at the host nation's current culture, then
 * recompute national_team_prowess for every affected nation.
 *
 * Idempotent — once a player is replaced, the new player's
 * retires_at_tick is in the future so the same row won't be picked
 * up next tick.
 */
export async function processVolaTeamLifecycle(supabase, currentTick) {
    const { data: due, error } = await supabase.from('vola_team_players')
        .select('id, nation_id, position_number, position_name, is_captain')
        .lte('retires_at_tick', currentTick);
    if (error) {
        console.warn('[VolaTeam] retiring fetch failed:', error.message);
        return null;
    }
    if (!due || due.length === 0) return null;

    // Pull culture + name pools for the affected nations in one query.
    const nationIds = Array.from(new Set(due.map(p => p.nation_id)));
    const { data: nations } = await supabase.from('nations')
        .select('id, first_name_pool, last_name_pool, national_vola_culture')
        .in('id', nationIds);
    const nationMap = new Map((nations || []).map(n => [n.id, n]));

    const affectedNations = new Set();
    let replaced = 0;
    for (const p of due) {
        const n = nationMap.get(p.nation_id);
        if (!n) continue;
        const culture = Number(n.national_vola_culture) || 0;
        const newPlayer = {
            nation_id:           p.nation_id,
            position_number:     p.position_number,
            position_name:       p.position_name || _VOLA_POSITION_NAMES[p.position_number - 1] || 'Forward',
            first_name:          _pickFromPool(n.first_name_pool, 'Player'),
            last_name:           _pickFromPool(n.last_name_pool, 'Replacement'),
            age:                 18 + Math.floor(Math.random() * 18),
            rating:              Math.floor(culture) + 1 + Math.floor(Math.random() * 6),
            recruited_at_tick:   currentTick,
            recruited_at_culture: culture,
            retires_at_tick:     currentTick + 1 + Math.floor(Math.random() * 36),
            is_captain:          !!p.is_captain,
        };

        // Replace atomically: delete the slot, insert the new one.
        const { error: dErr } = await supabase.from('vola_team_players')
            .delete().eq('id', p.id);
        if (dErr) { console.warn('[VolaTeam] delete failed:', dErr.message); continue; }
        const { error: iErr } = await supabase.from('vola_team_players').insert(newPlayer);
        if (iErr) { console.warn('[VolaTeam] insert failed:', iErr.message); continue; }
        replaced++;
        affectedNations.add(p.nation_id);
    }

    // Recompute Team Prowess for every nation that lost a player.
    for (const nid of affectedNations) {
        const { data: roster } = await supabase.from('vola_team_players')
            .select('rating').eq('nation_id', nid);
        const sum = (roster || []).reduce((s, r) => s + (Number(r.rating) || 0), 0);
        await supabase.from('nations').update({ national_team_prowess: sum }).eq('id', nid);
    }

    return { replaced, nationsAffected: affectedNations.size };
}

// ==================== VWC PLACEMENT MATCHES (bottom-3 round-robin) ====================

// 13 nations world: top 10 auto-qualify, bottom 3 play 3 round-robin
// matches over 3 ticks starting at qualifier_tick (cup_start - 12).
// Top 2 of the round-robin take spots 11 + 12; bottom 1 is eliminated
// (label = Aspirant) and takes a -1 global_image penalty.
//
// All three pieces — schedule generation, per-tick match resolution,
// and final standings + penalties — live here. Wired from
// handler-template's post-loop block.

const _PLACEMENT_PENALTY_GLOBAL_IMAGE = 1;

// Match resolution per spec:
//   1. Each side rolls (Team Prowess + 1d20) → higher total wins
//      (re-roll on tie so wins are decisive).
//   2. 1d24 rolled twice independently; the higher result is assigned
//      to the winner, the lower to the loser. These 1d24 values are
//      what gets displayed as the match score (always 1..24).
function _resolveMatchScores(prowessA, prowessB) {
    let pA = (Number(prowessA) || 0) + Math.floor(Math.random() * 20) + 1;
    let pB = (Number(prowessB) || 0) + Math.floor(Math.random() * 20) + 1;
    let safety = 5;
    while (pA === pB && safety-- > 0) {
        pA = (Number(prowessA) || 0) + Math.floor(Math.random() * 20) + 1;
        pB = (Number(prowessB) || 0) + Math.floor(Math.random() * 20) + 1;
    }
    const winner = pA > pB ? 'A' : 'B';

    // 1d24 ×2 → assign higher to winner, lower to loser.
    const r1 = 1 + Math.floor(Math.random() * 24);
    const r2 = 1 + Math.floor(Math.random() * 24);
    const high = Math.max(r1, r2);
    const low  = Math.min(r1, r2);
    return winner === 'A'
        ? { scoreA: high, scoreB: low,  winner: 'A' }
        : { scoreA: low,  scoreB: high, winner: 'B' };
}

/**
 * Play a batch of matches for one of the Vola tables (placement,
 * group stage, or knockout). Pulls all involved nations once,
 * iterates rows, applies _resolveMatchScores, writes scores +
 * winner + resolved_at_tick. Returns count of resolved rows.
 *
 * Shared by processVolaPlacementMatches, processVolaCupGroupMatches,
 * and processVolaCupKnockoutMatches — all three tables use the same
 * column names (team_a/b_nation_id, team_a/b_score, winner_nation_id,
 * resolved_at_tick) so this helper stays table-agnostic. Caller does
 * its own pre/post-batch bookkeeping (e.g., settlement triggers).
 */
async function _playMatchBatch(supabase, tableName, rows, currentTick, logTag) {
    if (!rows || rows.length === 0) return 0;

    const teamIds = Array.from(new Set(rows.flatMap(r => [r.team_a_nation_id, r.team_b_nation_id]).filter(Boolean)));
    if (teamIds.length === 0) return 0;
    const { data: nations, error: nErr } = await supabase.from('nations')
        .select('id, name, national_team_prowess')
        .in('id', teamIds);
    if (nErr) {
        console.warn(`[${logTag}] nation fetch failed:`, nErr.message);
        return 0;
    }
    const teamMap = new Map((nations || []).map(n => [n.id, n]));

    let resolved = 0;
    for (const row of rows) {
        const A = teamMap.get(row.team_a_nation_id);
        const B = teamMap.get(row.team_b_nation_id);
        if (!A || !B) {
            await supabase.from(tableName).update({
                resolved_at_tick: currentTick,
            }).eq('id', row.id);
            continue;
        }
        const r = _resolveMatchScores(A.national_team_prowess, B.national_team_prowess);
        const winnerId = r.winner === 'A' ? A.id : B.id;
        const { error: updErr } = await supabase.from(tableName).update({
            team_a_score:     r.scoreA,
            team_b_score:     r.scoreB,
            winner_nation_id: winnerId,
            resolved_at_tick: currentTick,
        }).eq('id', row.id);
        if (updErr) {
            console.warn(`[${logTag}] match update failed:`, updErr.message);
            continue;
        }
        resolved++;
    }
    return resolved;
}

// Pick bottom 3 nations for the cup. Cycle 1: prowess → culture → name.
// Cycle 2+: vwc_ranking (1=best, 0=unranked = treated as worst).
function _pickBottomThree(nations, cupNumber) {
    const list = nations.slice();
    if (cupNumber <= 1) {
        // Cycle 1 fallback ordering.
        list.sort((a, b) => {
            const pa = Number(a.national_team_prowess) || 0;
            const pb = Number(b.national_team_prowess) || 0;
            if (pb !== pa) return pb - pa;
            const ca = Number(a.national_vola_culture) || 0;
            const cb = Number(b.national_vola_culture) || 0;
            if (cb !== ca) return cb - ca;
            return String(a.name || '').localeCompare(String(b.name || ''));
        });
    } else {
        // Cycle 2+: vwc_ranking ascending, but unranked (0) goes last.
        list.sort((a, b) => {
            const ra = Number(a.vwc_ranking) || 0;
            const rb = Number(b.vwc_ranking) || 0;
            const aRanked = ra > 0 ? ra : 9999;
            const bRanked = rb > 0 ? rb : 9999;
            if (aRanked !== bRanked) return aRanked - bRanked;
            // Same rank tier — break by prowess then culture then name.
            const pa = Number(a.national_team_prowess) || 0;
            const pb = Number(b.national_team_prowess) || 0;
            if (pb !== pa) return pb - pa;
            return String(a.name || '').localeCompare(String(b.name || ''));
        });
    }
    // Bottom 3 = ranks 11, 12, 13 in this ordering.
    return list.slice(10, 13);
}

/**
 * Generate the 3 round-robin match rows for the bottom 3 of a cup,
 * scheduled at qualifierTick, qualifierTick+1, qualifierTick+2.
 * Idempotent — re-runs no-op if any matches already exist for the cup.
 */
export async function generateVolaPlacementSchedule(supabase, cupNumber, qualifierTick) {
    const { data: existing } = await supabase.from('vola_placement_matches')
        .select('id').eq('cup_number', cupNumber).limit(1).maybeSingle();
    if (existing) return null;

    const { data: nations, error } = await supabase.from('nations')
        .select('id, name, national_team_prowess, national_vola_culture, vwc_ranking');
    if (error) {
        console.warn('[VolaPlacement] nation fetch failed:', error.message);
        return null;
    }
    if (!nations || nations.length < 13) return null;

    const bottom3 = _pickBottomThree(nations, cupNumber);
    if (bottom3.length !== 3) return null;
    const [A, B, C] = bottom3;

    // Round-robin: A-B, A-C, B-C.
    const matches = [
        { match_number: 1, scheduled_tick: qualifierTick + 0, a: A.id, b: B.id },
        { match_number: 2, scheduled_tick: qualifierTick + 1, a: A.id, b: C.id },
        { match_number: 3, scheduled_tick: qualifierTick + 2, a: B.id, b: C.id },
    ];

    const rows = matches.map(m => ({
        cup_number:       cupNumber,
        match_number:     m.match_number,
        scheduled_tick:   m.scheduled_tick,
        team_a_nation_id: m.a,
        team_b_nation_id: m.b,
    }));

    const { error: insErr } = await supabase.from('vola_placement_matches').insert(rows);
    if (insErr) {
        console.warn('[VolaPlacement] schedule insert failed:', insErr.message);
        return null;
    }

    // Reset is_vola_aspirant for the new cycle's bottom 3 — old aspirant
    // flag is stale once a new round starts.
    await supabase.from('nations').update({ is_vola_aspirant: false })
        .eq('is_vola_aspirant', true);

    return { cupNumber, matches: rows.length };
}

/**
 * Per-tick: resolve every placement match scheduled for currentTick.
 * Rolls prowess+1d20 for each side, picks the winner (re-rolls on tie),
 * updates the row. After Match 3 of any cup resolves, computes
 * standings and applies the -1 global_image penalty + aspirant flag
 * to the bottom 1.
 */
export async function processVolaPlacementMatches(supabase, currentTick) {
    // .lte (not .eq) so any unresolved row scheduled at OR BEFORE
    // currentTick gets caught up — covers the case where the schedule
    // was inserted late, the cron skipped a tick, or rows were
    // regenerated mid-cycle. Round-robin matches have no inter-match
    // dependency so multiple resolves in one tick batch are safe.
    // Don't tighten this back to .eq without also auditing the
    // late-insert + missed-cron failure modes.
    const { data: due, error } = await supabase.from('vola_placement_matches')
        .select('id, cup_number, match_number, team_a_nation_id, team_b_nation_id')
        .lte('scheduled_tick', currentTick)
        .is('resolved_at_tick', null);
    if (error) {
        console.warn('[VolaPlacement] due fetch failed:', error.message);
        return null;
    }

    // Track which cups had a Match-3 row scheduled this tick — settlement
    // runs for those after the play batch (idempotent, so it's safe even
    // if a particular Match-3 row failed to update). Empty `due` still
    // falls through so the orphan-recovery pass at the bottom can run.
    const cupsThatJustFinished = new Set(
        (due || []).filter(m => m.match_number === 3).map(m => m.cup_number)
    );
    const resolved = await _playMatchBatch(supabase, 'vola_placement_matches', due || [], currentTick, 'VolaPlacement');

    // Final standings — runs once per cup whose Match 3 just resolved.
    // Group draw chains right after settlement: by this point the
    // Aspirant flag is set, so the 12-team qualified pool is locked in.
    // Settle and draw run in independent try/catch blocks so a transient
    // settle failure doesn't permanently skip the draw — the draw is
    // idempotent so a manual retry of just the draw is safe.
    for (const cupNumber of cupsThatJustFinished) {
        let settled = false;
        try {
            await _settleVolaPlacement(supabase, cupNumber, currentTick);
            settled = true;
        } catch (err) {
            console.error('[VolaPlacement] settle failed for cup', cupNumber, err);
        }
        if (!settled) continue;
        // VWC ranking refresh — fires here at qualifier-end so the
        // group draw (next call in this loop) reads a fresh culture+
        // random ±5 seeding. nations.vwc_ranking has a sequenced
        // dual-writer pattern by design:
        //
        //   T(qualifier-end)      recompute  → drives THIS cycle's
        //                                       group draw via _seedCompare
        //   T(qualifier + 17 = F) settle     → drives NEXT cycle's
        //                                       placement bottom-3 via
        //                                       _pickBottomThree
        //   T(next qualifier-end) recompute  → cycle repeats
        //
        // Each write has a single downstream reader before the next
        // write overwrites it, so there's no contention. Failure here
        // is non-fatal — the draw falls back to prowess via
        // _seedCompare's 0-rank handler.
        try {
            await recomputeVwcRankings(supabase);
        } catch (vwcErr) {
            console.error('[VolaPlacement] VWC ranking recompute failed (non-fatal):', vwcErr);
        }
        let drawn = false;
        try {
            await generateVolaCupGroupDraw(supabase, cupNumber, currentTick);
            drawn = true;
        } catch (err) {
            console.error('[VolaCupGroups] draw failed for cup', cupNumber, err);
        }
        if (!drawn) continue;
        try {
            // cup_start = qualifier_tick + 12 = currentTick + 10
            // (currentTick is the tick Match 3 of placement just settled on,
            //  i.e. qualifier_tick + 2.)
            const cupStartTick = currentTick + 10;
            await generateVolaCupGroupSchedule(supabase, cupNumber, cupStartTick);
        } catch (err) {
            console.error('[VolaCupGroupSchedule] failed for cup', cupNumber, err);
        }
    }

    // ── Self-heal: orphaned cups ────────────────────────────────────
    // A cup is "orphaned" when its placement matches are all resolved
    // (settled normally) but vola_cup_groups has zero rows — i.e. the
    // group-draw step of the post-Match-3 chain didn't run, usually
    // because the target table didn't exist on that tick or some
    // transient failure killed the chain mid-flight. The original
    // cupsThatJustFinished loop only fires when Match 3 resolves on
    // THIS tick, so without this pass an orphan stays orphaned forever.
    //
    // _settleVolaPlacement is NOT idempotent (applies the −1
    // global_image penalty and inserts an event log row) so we
    // deliberately skip it for orphans — settlement already happened
    // on the original tick. We just run the remaining chain links:
    // VWC ranking recompute → group draw → group schedule.
    //
    // cup_start_tick = max(resolved_at_tick across the 3 matches) + 10
    //   (= qualifier_tick + 2 + 10 = qualifier_tick + 12, the
    //    canonical cup-start formula).
    let orphanCups = 0;
    try {
        const { data: settledRows } = await supabase.from('vola_placement_matches')
            .select('cup_number, resolved_at_tick')
            .not('resolved_at_tick', 'is', null);
        if (settledRows && settledRows.length > 0) {
            const byCup = new Map();
            for (const m of settledRows) {
                if (!byCup.has(m.cup_number)) byCup.set(m.cup_number, { matches: 0, lastResolved: 0 });
                const c = byCup.get(m.cup_number);
                c.matches++;
                c.lastResolved = Math.max(c.lastResolved, Number(m.resolved_at_tick) || 0);
            }
            for (const [cupNumber, info] of byCup) {
                if (info.matches < 3) continue;
                if (cupsThatJustFinished.has(cupNumber)) continue; // already handled
                const { data: existingDraw } = await supabase.from('vola_cup_groups')
                    .select('id').eq('cup_number', cupNumber).limit(1).maybeSingle();
                if (existingDraw) continue;

                console.log(`[VolaPlacement] self-healing orphan cup ${cupNumber} (settled at tick ${info.lastResolved}, no group draw)`);

                try { await recomputeVwcRankings(supabase); }
                catch (vwcErr) { console.error('[VolaPlacement] orphan VWC recompute failed (non-fatal):', vwcErr); }

                let drawn = false;
                try {
                    await generateVolaCupGroupDraw(supabase, cupNumber, currentTick);
                    drawn = true;
                } catch (err) {
                    console.error('[VolaCupGroups] orphan draw failed for cup', cupNumber, err);
                }
                if (!drawn) continue;

                try {
                    const cupStartTick = info.lastResolved + 10;
                    await generateVolaCupGroupSchedule(supabase, cupNumber, cupStartTick);
                    orphanCups++;
                } catch (err) {
                    console.error('[VolaCupGroupSchedule] orphan schedule failed for cup', cupNumber, err);
                }
            }
        }
    } catch (orphanErr) {
        console.error('[VolaPlacement] orphan recovery pass failed (non-fatal):', orphanErr);
    }

    return { resolved, cupsSettled: cupsThatJustFinished.size, orphansHealed: orphanCups };
}

/**
 * Phase 1 of the VWC pipeline: draw the 12 qualified nations into
 * Groups A / B / C (4 teams per group).
 *
 * Runs right after the placement matches settle for `cupNumber`.
 * The Aspirant (is_vola_aspirant=true) is excluded; the other 12
 * are the qualified set.
 *
 * Seeding: vwc_ranking ASC (best first); cycle 1 falls back to
 * national_team_prowess DESC because rankings don't exist yet.
 *
 * Pot draw: split the 12 into 4 pots of 3 by seed, shuffle each
 * pot, then deal pot 1 → A1/B1/C1, pot 2 → A2/B2/C2, etc. This
 * spreads seed strength evenly across the three groups.
 *
 * Idempotent — no-op if rows for this cup already exist.
 */
export async function generateVolaCupGroupDraw(supabase, cupNumber, currentTick) {
    const { data: existing } = await supabase.from('vola_cup_groups')
        .select('id').eq('cup_number', cupNumber).limit(1).maybeSingle();
    if (existing) return null;

    const { data: nations, error } = await supabase.from('nations')
        .select('id, name, national_team_prowess, vwc_ranking, is_vola_aspirant');
    if (error) {
        console.warn('[VolaCupGroups] nation fetch failed:', error.message);
        return null;
    }
    if (!nations || nations.length < 13) return null;

    // 12 qualified = all nations except the Aspirant. If multiple are
    // flagged (shouldn't happen) take the lowest-seeded as Aspirant by
    // ranking/prowess order.
    const aspirantIds = new Set(nations.filter(n => n.is_vola_aspirant).map(n => n.id));
    let qualified = nations.filter(n => !aspirantIds.has(n.id));
    if (qualified.length !== 12) {
        // Defensive fallback: take top 12 by seed.
        qualified = nations.slice().sort(_seedCompare).slice(0, 12);
    }

    qualified.sort(_seedCompare);

    // Track who came from placement (the bottom-3 set, of whom 2 made it
    // through). Used as informational metadata on the row.
    const aspirantPool = nations.filter(n => n.is_vola_aspirant).map(n => n.id);
    const placementWinnerIds = new Set();
    if (aspirantPool.length > 0 && cupNumber >= 1) {
        const { data: placementRows } = await supabase.from('vola_placement_matches')
            .select('team_a_nation_id, team_b_nation_id')
            .eq('cup_number', cupNumber);
        if (placementRows) {
            for (const m of placementRows) {
                placementWinnerIds.add(m.team_a_nation_id);
                placementWinnerIds.add(m.team_b_nation_id);
            }
            for (const aId of aspirantIds) placementWinnerIds.delete(aId);
        }
    }

    // Pot draw: 4 pots × 3 teams. Shuffle within each pot.
    const pots = [];
    for (let p = 0; p < 4; p++) {
        const slice = qualified.slice(p * 3, p * 3 + 3);
        for (let i = slice.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [slice[i], slice[j]] = [slice[j], slice[i]];
        }
        pots.push(slice);
    }

    const groupLetters = ['A', 'B', 'C'];
    const rows = [];
    for (let potIdx = 0; potIdx < 4; potIdx++) {
        for (let g = 0; g < 3; g++) {
            const team = pots[potIdx][g];
            if (!team) continue;
            rows.push({
                cup_number:    cupNumber,
                nation_id:     team.id,
                group_letter:  groupLetters[g],
                seed_rank:     potIdx + 1,
                qualified_via: placementWinnerIds.has(team.id) ? 'placement' : 'auto',
                drawn_at_tick: currentTick,
            });
        }
    }

    const { error: insErr } = await supabase.from('vola_cup_groups').insert(rows);
    if (insErr) {
        console.warn('[VolaCupGroups] draw insert failed:', insErr.message);
        return null;
    }
    return { cupNumber, drawn: rows.length };
}

function _seedCompare(a, b) {
    const ra = Number(a.vwc_ranking) || 0;
    const rb = Number(b.vwc_ranking) || 0;
    const aRank = ra > 0 ? ra : 9999;
    const bRank = rb > 0 ? rb : 9999;
    if (aRank !== bRank) return aRank - bRank;
    const pa = Number(a.national_team_prowess) || 0;
    const pb = Number(b.national_team_prowess) || 0;
    if (pb !== pa) return pb - pa;
    return String(a.name || '').localeCompare(String(b.name || ''));
}

/**
 * Phase 2: generate the 18 group-stage matches for `cupNumber`.
 *
 * Each group plays a 3-round round-robin (6 matches per group):
 *   R1 (cup_start+0): s1 v s2, s3 v s4
 *   R2 (cup_start+1): s1 v s3, s2 v s4
 *   R3 (cup_start+2): s1 v s4, s2 v s3
 *
 * Idempotent — no-op if rows for this cup already exist.
 */
export async function generateVolaCupGroupSchedule(supabase, cupNumber, cupStartTick) {
    const { data: existing } = await supabase.from('vola_cup_group_matches')
        .select('id').eq('cup_number', cupNumber).limit(1).maybeSingle();
    if (existing) return null;

    const { data: draw, error } = await supabase.from('vola_cup_groups')
        .select('group_letter, seed_rank, nation_id')
        .eq('cup_number', cupNumber);
    if (error) {
        console.warn('[VolaCupGroupSchedule] draw fetch failed:', error.message);
        return null;
    }
    if (!draw || draw.length !== 12) return null;

    // Bucket the draw by group, indexed by seed_rank (1..4).
    const byGroup = { A: {}, B: {}, C: {} };
    for (const row of draw) {
        if (!byGroup[row.group_letter]) continue;
        byGroup[row.group_letter][row.seed_rank] = row.nation_id;
    }

    const PAIRINGS = [
        { round: 1, pairs: [[1, 2], [3, 4]] },
        { round: 2, pairs: [[1, 3], [2, 4]] },
        { round: 3, pairs: [[1, 4], [2, 3]] },
    ];

    const rows = [];
    for (const letter of ['A', 'B', 'C']) {
        const g = byGroup[letter];
        if (!g[1] || !g[2] || !g[3] || !g[4]) {
            console.warn('[VolaCupGroupSchedule] incomplete group', letter, 'for cup', cupNumber);
            return null;
        }
        for (const block of PAIRINGS) {
            block.pairs.forEach(([sA, sB], i) => {
                rows.push({
                    cup_number:       cupNumber,
                    group_letter:     letter,
                    round_number:     block.round,
                    match_in_round:   i + 1,
                    scheduled_tick:   cupStartTick + (block.round - 1),
                    team_a_nation_id: g[sA],
                    team_b_nation_id: g[sB],
                });
            });
        }
    }

    const { error: insErr } = await supabase.from('vola_cup_group_matches').insert(rows);
    if (insErr) {
        console.warn('[VolaCupGroupSchedule] insert failed:', insErr.message);
        return null;
    }
    return { cupNumber, scheduled: rows.length };
}

/**
 * Phase 2 resolver: play out every group-stage match scheduled for
 * `currentTick`. Same prowess+1d20 + 1d24 score system as placement
 * and the upcoming knockout rounds — _resolveMatchScores is shared.
 */
export async function processVolaCupGroupMatches(supabase, currentTick) {
    // .lte (not .eq) so overdue rows catch up — same rationale as
    // processVolaPlacementMatches above. Group matches have no
    // inter-match dependency so multiple resolves per tick are safe.
    const { data: due, error } = await supabase.from('vola_cup_group_matches')
        .select('id, cup_number, group_letter, round_number, team_a_nation_id, team_b_nation_id')
        .lte('scheduled_tick', currentTick)
        .is('resolved_at_tick', null);
    if (error) {
        console.warn('[VolaCupGroup] due fetch failed:', error.message);
        return null;
    }
    if (!due || due.length === 0) return null;

    const resolved = await _playMatchBatch(supabase, 'vola_cup_group_matches', due, currentTick, 'VolaCupGroup');

    // Phase 3 hook: any cup that just played a group match might now
    // have its 18 group rows fully resolved. seedVolaCupKnockout is
    // idempotent and self-gates on the all-resolved + no-bracket-yet
    // condition, so calling it here for every touched cup is safe.
    const cupsThisTick = Array.from(new Set(due.map(m => m.cup_number)));
    for (const cupNumber of cupsThisTick) {
        try {
            await seedVolaCupKnockout(supabase, cupNumber, currentTick);
        } catch (err) {
            console.error('[VolaKnockout] seed failed for cup', cupNumber, err);
        }
    }

    return { resolved };
}

/**
 * Phase 3: seed the knockout bracket for `cupNumber`.
 *
 * Self-gating: bails if the 18 group matches aren't all resolved
 * yet, or if knockout rows already exist (idempotent).
 *
 * Standings per group: W → PTS → prowess → name. Top 2 advance
 * automatically. Across all 3 groups, the top 2 third-placers
 * also advance.
 *
 * Seeds 1-3 = group winners sorted by record;
 * seeds 4-6 = runners-up sorted by record;
 * seeds 7-8 = top 2 third-placers.
 *
 * Bracket: QF1=1v8, QF2=4v5, QF3=3v6, QF4=2v7; SF1 from QF1+QF2,
 * SF2 from QF3+QF4; F from SF1+SF2.
 */
export async function seedVolaCupKnockout(supabase, cupNumber, currentTick) {
    const { data: existing } = await supabase.from('vola_cup_knockout')
        .select('id').eq('cup_number', cupNumber).limit(1).maybeSingle();
    if (existing) return null;

    const { data: gmatches, error: gErr } = await supabase.from('vola_cup_group_matches')
        .select('group_letter, team_a_nation_id, team_b_nation_id, team_a_score, team_b_score, winner_nation_id, resolved_at_tick, scheduled_tick')
        .eq('cup_number', cupNumber);
    if (gErr) {
        console.warn('[VolaKnockout] group match fetch failed:', gErr.message);
        return null;
    }
    if (!gmatches || gmatches.length !== 18) return null;
    if (gmatches.some(m => m.resolved_at_tick == null)) return null;

    const { data: draw, error: dErr } = await supabase.from('vola_cup_groups')
        .select('group_letter, seed_rank, nation:nation_id(id, name, national_team_prowess)')
        .eq('cup_number', cupNumber);
    if (dErr) {
        console.warn('[VolaKnockout] draw fetch failed:', dErr.message);
        return null;
    }
    if (!draw || draw.length !== 12) return null;

    // Per-team registry: id → standings + metadata.
    const reg = new Map();
    for (const r of draw) {
        const n = r.nation;
        if (!n?.id) continue;
        reg.set(n.id, {
            id:      n.id,
            name:    n.name || '',
            prowess: Number(n.national_team_prowess) || 0,
            group:   r.group_letter,
            seedIn:  r.seed_rank,
            wins:    0,
            losses:  0,
            points:  0,
        });
    }

    for (const m of gmatches) {
        const a = reg.get(m.team_a_nation_id);
        const b = reg.get(m.team_b_nation_id);
        if (!a || !b) continue;
        a.points += Number(m.team_a_score) || 0;
        b.points += Number(m.team_b_score) || 0;
        if (m.winner_nation_id === a.id)      { a.wins++; b.losses++; }
        else if (m.winner_nation_id === b.id) { b.wins++; a.losses++; }
    }

    const cmp = (x, y) =>
        (y.wins   - x.wins)    ||
        (y.points - x.points)  ||
        (y.prowess - x.prowess) ||
        String(x.name || '').localeCompare(String(y.name || ''));

    // Per group: sort, take top 3 (winner / runner-up / 3rd-placer).
    const winners = [];
    const runners = [];
    const thirds  = [];
    for (const letter of ['A', 'B', 'C']) {
        const g = Array.from(reg.values()).filter(t => t.group === letter).sort(cmp);
        if (g.length < 4) {
            console.warn('[VolaKnockout] incomplete group', letter, 'for cup', cupNumber);
            return null;
        }
        winners.push(g[0]);
        runners.push(g[1]);
        thirds.push(g[2]);
    }

    winners.sort(cmp);
    runners.sort(cmp);
    const topThirds = thirds.slice().sort(cmp).slice(0, 2);

    const seeded = [
        ...winners.map((t, i) => ({ ...t, seed: i + 1 })),
        ...runners.map((t, i) => ({ ...t, seed: i + 4 })),
        ...topThirds.map((t, i) => ({ ...t, seed: i + 7 })),
    ];
    if (seeded.length !== 8) return null;
    const bySeed = new Map(seeded.map(t => [t.seed, t]));

    // Cup schedule — derive from the group matches we already fetched.
    // generateVolaCupGroupSchedule writes Round 1 at cupStart+0, R2 at
    // +1, R3 at +2, so the min scheduled_tick across the 18 rows IS
    // cupStart. Doing it this way (instead of the old canonical
    // 84 + 24*(N-1) formula) keeps QF/SF/F in lock-step with whatever
    // cupStart the placement post-settle handler chose — currently
    // qualifier_tick + 12, which can drift from the canonical cadence
    // if the placement round itself fired late.
    const cupStartTick = Math.min(...gmatches.map(m => Number(m.scheduled_tick)));
    const qfTick = cupStartTick + 3;
    const sfTick = cupStartTick + 4;
    const fTick  = cupStartTick + 5;

    const QF_PAIRS = [[1, 8], [4, 5], [3, 6], [2, 7]];
    const rows = [];
    QF_PAIRS.forEach(([sA, sB], i) => {
        const tA = bySeed.get(sA);
        const tB = bySeed.get(sB);
        if (!tA || !tB) return;
        rows.push({
            cup_number:       cupNumber,
            round:            'QF',
            match_number:     i + 1,
            scheduled_tick:   qfTick,
            team_a_nation_id: tA.id,
            team_b_nation_id: tB.id,
            team_a_seed:      sA,
            team_b_seed:      sB,
        });
    });
    if (rows.length !== 4) return null;

    rows.push(
        { cup_number: cupNumber, round: 'SF', match_number: 1, scheduled_tick: sfTick,
          feeder_a_match: 1, feeder_b_match: 2 },
        { cup_number: cupNumber, round: 'SF', match_number: 2, scheduled_tick: sfTick,
          feeder_a_match: 3, feeder_b_match: 4 },
        { cup_number: cupNumber, round: 'F',  match_number: 1, scheduled_tick: fTick,
          feeder_a_match: 1, feeder_b_match: 2 },
    );

    const { error: insErr } = await supabase.from('vola_cup_knockout').insert(rows);
    if (insErr) {
        console.warn('[VolaKnockout] seed insert failed:', insErr.message);
        return null;
    }
    return { cupNumber, qf: 4, sf: 2, f: 1 };
}

/**
 * Phase 4: resolve any QF / SF / F matches scheduled for `currentTick`.
 *
 * SF and F rows are seeded with team_a/b_nation_id NULL; the moment we
 * see a row at its scheduled tick we look up the feeder match's
 * winner_nation_id and persist it onto the row before playing.
 *
 * Same scoring as placement and group stage — _resolveMatchScores
 * stays the single source of truth so all 3 stages behave identically.
 *
 * Idempotent at the row level via `.is('resolved_at_tick', null)`. Champion
 * crowning + VWC ranking rewards are deliberately out of scope (Phase 5).
 */
export async function processVolaCupKnockoutMatches(supabase, currentTick) {
    // .lte (not .eq) so any unresolved row scheduled at OR BEFORE
    // currentTick gets caught up — covers missed-cron and late-insert
    // cases. Knockout has feeder dependencies (SF needs QF winners,
    // F needs SF winners), but Step 2's `playable` filter at line ~5853
    // excludes rows with null teams from the play batch, so an overdue
    // SF whose QF is also overdue stays null on this tick (Step 1 fill
    // sees QF.winner_nation_id is still NULL since QF hasn't played
    // yet) and gets played on the next tick after QF resolves. Cup
    // catches up one round per tick. Don't tighten this back to .eq
    // without also auditing the late-insert + missed-cron failure modes.
    const { data: due, error } = await supabase.from('vola_cup_knockout')
        .select('id, cup_number, round, match_number, team_a_nation_id, team_b_nation_id, feeder_a_match, feeder_b_match')
        .lte('scheduled_tick', currentTick)
        .is('resolved_at_tick', null);
    if (error) {
        console.warn('[VolaKnockout] due fetch failed:', error.message);
        return null;
    }
    if (!due || due.length === 0) return null;

    // ── Step 1: fill team_a/b on SF/F rows from upstream winners. ──
    // Feeders for SF rows live in QF; feeders for F rows live in SF. Anything
    // already filled (every QF row at this point) is skipped.
    const needsFill = due.filter(r => !r.team_a_nation_id || !r.team_b_nation_id);
    for (const row of needsFill) {
        const feederRound = row.round === 'SF' ? 'QF'
                          : row.round === 'F'  ? 'SF'
                          : null;
        if (!feederRound) {
            console.warn('[VolaKnockout] unexpected NULL teams on QF row', row.id);
            continue;
        }
        if (row.feeder_a_match == null || row.feeder_b_match == null) {
            console.warn('[VolaKnockout] missing feeder refs on', row.round, row.match_number);
            continue;
        }

        const { data: feeders, error: fErr } = await supabase.from('vola_cup_knockout')
            .select('match_number, winner_nation_id, resolved_at_tick')
            .eq('cup_number', row.cup_number)
            .eq('round', feederRound)
            .in('match_number', [row.feeder_a_match, row.feeder_b_match]);
        if (fErr) {
            console.warn('[VolaKnockout] feeder fetch failed:', fErr.message);
            continue;
        }
        const fmap = new Map((feeders || []).map(f => [f.match_number, f]));
        const fA = fmap.get(row.feeder_a_match);
        const fB = fmap.get(row.feeder_b_match);
        if (!fA?.winner_nation_id || !fB?.winner_nation_id) {
            // Upstream not resolved — shouldn't happen since the schedule
            // guarantees feeders run on the previous tick, but skip safely.
            console.warn('[VolaKnockout] feeder unresolved for', row.round, row.match_number);
            continue;
        }
        const { error: uErr } = await supabase.from('vola_cup_knockout').update({
            team_a_nation_id: fA.winner_nation_id,
            team_b_nation_id: fB.winner_nation_id,
        }).eq('id', row.id);
        if (uErr) {
            console.warn('[VolaKnockout] team-fill update failed:', uErr.message);
            continue;
        }
        row.team_a_nation_id = fA.winner_nation_id;
        row.team_b_nation_id = fB.winner_nation_id;
    }

    // ── Step 2: play every row whose teams are now both set. ──
    const playable = due.filter(r => r.team_a_nation_id && r.team_b_nation_id);
    const resolved = await _playMatchBatch(supabase, 'vola_cup_knockout', playable, currentTick, 'VolaKnockout');

    // ── Phase 5 hook: any cup whose Final row was due this tick is a
    // candidate for championship settlement. The settle function is
    // idempotent and self-gates on "Final has a winner + not already
    // settled", so calling it for every Final cup_number is safe.
    const finalsThisTick = Array.from(new Set(
        due.filter(r => r.round === 'F').map(r => r.cup_number)
    ));
    for (const cupNumber of finalsThisTick) {
        try {
            await settleVolaCupChampionship(supabase, cupNumber, currentTick);
        } catch (err) {
            console.error('[VolaChampion] settlement failed for cup', cupNumber, err);
        }
    }

    return { resolved };
}

const _CHAMPION_GLOBAL_IMAGE_BONUS  = 2;
const _RUNNER_UP_GLOBAL_IMAGE_BONUS = 1;

/**
 * Phase 5: crown the champion + write the 1..13 final standings +
 * push results back into nations.vwc_ranking so the next cup's
 * seed-by-ranking actually uses the latest results.
 *
 * Self-gating idempotency: bails if final_standings rows already
 * exist for this cup, or if the Final row doesn't yet have a
 * winner. Callable safely from every tick.
 *
 * Position assignment:
 *   1   Champion
 *   2   Runner-up
 *   3-4 SF losers, sorted by group record (W → PTS → prowess → name)
 *   5-8 QF losers, sorted same
 *   9-12 4 non-knockout participants (1 unlucky 3rd + 3 4th-placers), sorted same
 *   13  Aspirant (placement loser)
 *
 * Bonuses: +2 global_image to champion, +1 to runner-up. Aspirant's
 * −1 global_image penalty was already applied by _settleVolaPlacement
 * 8 ticks earlier.
 */
export async function settleVolaCupChampionship(supabase, cupNumber, currentTick) {
    const { data: existing } = await supabase.from('vola_cup_final_standings')
        .select('id').eq('cup_number', cupNumber).limit(1).maybeSingle();
    if (existing) return null;

    const { data: finalRow, error: fErr } = await supabase.from('vola_cup_knockout')
        .select('team_a_nation_id, team_b_nation_id, winner_nation_id, resolved_at_tick')
        .eq('cup_number', cupNumber)
        .eq('round', 'F')
        .maybeSingle();
    if (fErr) {
        console.warn('[VolaChampion] final fetch failed:', fErr.message);
        return null;
    }
    if (!finalRow?.winner_nation_id || finalRow.resolved_at_tick == null) return null;

    const { data: koRows, error: kErr } = await supabase.from('vola_cup_knockout')
        .select('round, team_a_nation_id, team_b_nation_id')
        .eq('cup_number', cupNumber);
    if (kErr || !koRows || koRows.length !== 7) {
        console.warn('[VolaChampion] knockout fetch incomplete for cup', cupNumber);
        return null;
    }

    const { data: groupRows, error: gErr } = await supabase.from('vola_cup_groups')
        .select('group_letter, nation:nation_id(id, name, national_team_prowess)')
        .eq('cup_number', cupNumber);
    if (gErr || !groupRows || groupRows.length !== 12) {
        console.warn('[VolaChampion] groups fetch incomplete for cup', cupNumber);
        return null;
    }

    const { data: gmatches, error: gmErr } = await supabase.from('vola_cup_group_matches')
        .select('team_a_nation_id, team_b_nation_id, team_a_score, team_b_score, winner_nation_id')
        .eq('cup_number', cupNumber);
    if (gmErr) {
        console.warn('[VolaChampion] group match fetch failed:', gmErr.message);
        return null;
    }

    // Per-team registry, tally group-stage stats for the tiebreak.
    const reg = new Map();
    for (const r of groupRows) {
        const n = r.nation;
        if (!n?.id) continue;
        reg.set(n.id, {
            id:      n.id,
            name:    n.name || '',
            prowess: Number(n.national_team_prowess) || 0,
            wins:    0,
            points:  0,
        });
    }
    for (const m of (gmatches || [])) {
        const a = reg.get(m.team_a_nation_id);
        const b = reg.get(m.team_b_nation_id);
        if (!a || !b) continue;
        a.points += Number(m.team_a_score) || 0;
        b.points += Number(m.team_b_score) || 0;
        if (m.winner_nation_id === a.id)      a.wins++;
        else if (m.winner_nation_id === b.id) b.wins++;
    }

    const cmp = (x, y) =>
        (y.wins   - x.wins)    ||
        (y.points - x.points)  ||
        (y.prowess - x.prowess) ||
        String(x.name || '').localeCompare(String(y.name || ''));

    // Bucket teams by knockout depth. SF teams = whoever appeared as
    // team_a/b on an SF row; QF teams = whoever was in QF.
    const qfTeams = new Set();
    const sfTeams = new Set();
    for (const k of koRows) {
        const ids = [k.team_a_nation_id, k.team_b_nation_id].filter(Boolean);
        if (k.round === 'QF') ids.forEach(id => qfTeams.add(id));
        else if (k.round === 'SF') ids.forEach(id => sfTeams.add(id));
    }

    const championId = finalRow.winner_nation_id;
    const runnerUpId = finalRow.team_a_nation_id === championId
        ? finalRow.team_b_nation_id
        : finalRow.team_a_nation_id;

    const positions = [];
    if (championId)  positions.push({ id: championId, position: 1, eliminated_at: 'champion' });
    if (runnerUpId)  positions.push({ id: runnerUpId, position: 2, eliminated_at: 'final' });

    const sfLosers = Array.from(sfTeams)
        .filter(id => id !== championId && id !== runnerUpId)
        .map(id => reg.get(id))
        .filter(Boolean)
        .sort(cmp);
    sfLosers.forEach((t, i) => positions.push({ id: t.id, position: 3 + i, eliminated_at: 'semifinal' }));

    const qfLosers = Array.from(qfTeams)
        .filter(id => !sfTeams.has(id))
        .map(id => reg.get(id))
        .filter(Boolean)
        .sort(cmp);
    qfLosers.forEach((t, i) => positions.push({ id: t.id, position: 5 + i, eliminated_at: 'quarterfinal' }));

    const nonAdvancers = Array.from(reg.values())
        .filter(t => !qfTeams.has(t.id))
        .sort(cmp);
    nonAdvancers.forEach((t, i) => positions.push({ id: t.id, position: 9 + i, eliminated_at: 'group_stage' }));

    // Aspirant rounds out 13th. Don't clear is_vola_aspirant — that
    // happens at the next cycle's qualifier tick (see
    // generateVolaPlacementSchedule).
    const { data: aspirantRows, error: aErr } = await supabase.from('nations')
        .select('id').eq('is_vola_aspirant', true).limit(1);
    if (aErr) {
        console.warn('[VolaChampion] aspirant fetch failed:', aErr.message);
    }
    const aspirantId = aspirantRows?.[0]?.id;
    if (aspirantId) positions.push({ id: aspirantId, position: 13, eliminated_at: 'placement' });

    if (positions.length === 0) return null;

    const standingRows = positions.map(p => ({
        cup_number:      cupNumber,
        nation_id:       p.id,
        final_position:  p.position,
        eliminated_at:   p.eliminated_at,
        settled_at_tick: currentTick,
    }));
    const { error: insErr } = await supabase.from('vola_cup_final_standings').insert(standingRows);
    if (insErr) {
        console.warn('[VolaChampion] standings insert failed:', insErr.message);
        return null;
    }

    // Write final positions (1..13) back into nations.vwc_ranking.
    // The downstream consumer is _pickBottomThree in the NEXT cycle's
    // generateVolaPlacementSchedule at T(this F + 5) — it picks the 3
    // worst-ranked nations to play placement. This is one half of the
    // dual-writer pattern documented in processVolaPlacementMatches:
    // recompute drives the group draw, settle drives the next placement.
    for (const p of positions) {
        const { error: rErr } = await supabase.from('nations')
            .update({ vwc_ranking: p.position })
            .eq('id', p.id);
        if (rErr) console.warn('[VolaChampion] ranking update failed for', p.id, rErr.message);
    }

    // Champion + runner-up global_image bonuses.
    const giBonusApply = async (nationId, bonus) => {
        if (!nationId) return;
        const { data: n } = await supabase.from('nations')
            .select('global_image').eq('id', nationId).single();
        const newGI = Math.min(100, (Number(n?.global_image) || 0) + bonus);
        await supabase.from('nations').update({ global_image: newGI }).eq('id', nationId);
    };
    await giBonusApply(championId, _CHAMPION_GLOBAL_IMAGE_BONUS);
    await giBonusApply(runnerUpId, _RUNNER_UP_GLOBAL_IMAGE_BONUS);

    // Event log: the headline crowning entry.
    const champion = reg.get(championId);
    const championName = champion?.name || 'Unknown';
    const runnerUp = runnerUpId ? reg.get(runnerUpId) : null;
    const runnerUpName = runnerUp?.name || 'Unknown';
    await supabase.from('event_log').insert({
        nation_id:          championId,
        event_name:         `${_cupOrdinal(cupNumber)} World Vola Cup — Champion`,
        category:           'political',
        trigger_key:        'vwc_champion',
        description_chosen: `${championName} are crowned champions of the ${_cupOrdinal(cupNumber)} World Vola Cup, defeating ${runnerUpName} in the Final. Global Image +${_CHAMPION_GLOBAL_IMAGE_BONUS}.`,
        fired_at_tick:      currentTick,
    });

    return { cupNumber, champion: championName, runnerUp: runnerUpName, settled: positions.length };
}

async function _settleVolaPlacement(supabase, cupNumber, currentTick) {
    // Pull all 3 matches for this cup.
    const { data: matches } = await supabase.from('vola_placement_matches')
        .select('team_a_nation_id, team_b_nation_id, team_a_score, team_b_score, winner_nation_id')
        .eq('cup_number', cupNumber);
    if (!matches || matches.length < 3) return;

    // Tally per-team wins + total points.
    const stats = new Map(); // nation_id → { wins, points }
    const bump = (id, isWin, points) => {
        if (!stats.has(id)) stats.set(id, { wins: 0, points: 0 });
        const s = stats.get(id);
        if (isWin) s.wins++;
        s.points += points;
    };
    for (const m of matches) {
        const a = m.team_a_nation_id, b = m.team_b_nation_id;
        const sa = Number(m.team_a_score) || 0, sb = Number(m.team_b_score) || 0;
        bump(a, m.winner_nation_id === a, sa);
        bump(b, m.winner_nation_id === b, sb);
    }

    // Sort: wins DESC, points DESC, random tiebreak.
    const standings = Array.from(stats.entries())
        .map(([id, s]) => ({ id, wins: s.wins, points: s.points, jitter: Math.random() }));
    standings.sort((a, b) => (b.wins - a.wins) || (b.points - a.points) || (b.jitter - a.jitter));

    if (standings.length < 3) return;
    const bottom = standings[2]; // last in the sorted standings = aspirant

    // -1 global_image penalty + aspirant flag.
    const { data: bottomN } = await supabase.from('nations')
        .select('id, global_image').eq('id', bottom.id).single();
    if (bottomN) {
        const newGI = Math.max(0, (Number(bottomN.global_image) || 0) - _PLACEMENT_PENALTY_GLOBAL_IMAGE);
        await supabase.from('nations').update({
            global_image:     newGI,
            is_vola_aspirant: true,
        }).eq('id', bottom.id);

        // Pull the nation name for the event description.
        const { data: nameRow } = await supabase.from('nations')
            .select('name').eq('id', bottom.id).maybeSingle();
        const nationLabel = nameRow?.name || 'The eliminated nation';

        await supabase.from('event_log').insert({
            nation_id:          bottom.id,
            event_name:         'VWC Placement Eliminated',
            category:           'political',
            trigger_key:        'vwc_placement_eliminated',
            description_chosen: `${nationLabel} fell short in the placement round and drops out of the ${_cupOrdinal(cupNumber)} World Vola Cup as Aspirant. Global Image −${_PLACEMENT_PENALTY_GLOBAL_IMAGE}.`,
            fired_at_tick:      currentTick,
        });
    }
}

// +N to faction_sector_popularity for every active sector in the nation,
// upserting (insert if missing, increment if present), capped at 100.
async function _applyAllSectorPopularityBoost(supabase, nationId, factionId, deltaTenths) {
    const { data: sectors, error: sErr } = await supabase
        .from('sectors').select('id').eq('nation_id', nationId).eq('is_active', true);
    if (sErr || !sectors || !sectors.length) return;

    const sectorIds = sectors.map(s => s.id);
    const { data: existing } = await supabase
        .from('faction_sector_popularity')
        .select('id, sector_id, popularity')
        .eq('faction_id', factionId)
        .in('sector_id', sectorIds);
    const existingMap = new Map((existing || []).map(r => [r.sector_id, r]));

    for (const s of sectors) {
        const ex = existingMap.get(s.id);
        if (ex) {
            const newPop = Math.min(100, (Number(ex.popularity) || 0) + deltaTenths);
            await supabase.from('faction_sector_popularity')
                .update({ popularity: newPop }).eq('id', ex.id);
        } else {
            await supabase.from('faction_sector_popularity').insert({
                faction_id: factionId,
                sector_id: s.id,
                popularity: deltaTenths,
            });
        }
    }
}
