/**
 * political-actions.js — Political actions, tick processors, crises, events, resign PM, disband party
 * Extracted from game-common.js
 */

import { deductAP, GAME_CONFIG, FORMATION_DEADLINE_TICKS } from './config.js';
import { CANONICAL_GOVERNMENT_TYPES, hasParliamentaryPM, isSemiPresidential } from './government-types.js';
import { RAW_SCALING_DIVISORS, STAT_PROCESSOR_SKIP } from './diplomacy-constants.js';
import { MINISTER_APPROVAL_CONFIG, MINISTRY_TO_STATS, NATION_STAT_COLUMNS, NATION_STAT_COLUMN_SET, STAT_DECAY_CONFIG, buildMinistryBaselines, getAveragedInstitutionDecay, normalizeNationStatKey, translateStatEffect, statDirectionSign, buildFundingPctMap, getInstFundingPct } from './stats.js';
import { adjustGovernmentApprovalEvent } from './momentum.js';
import { fetchActiveCoalition, deriveLeadPartyId } from './government-structure.js';
import { closeAdministration, createAdministration, dissolveCoalition } from './elections.js';
import { getTraitAPModifier, applyRallyTraitModifiers, getTraitApprovalMultiplier, getEffectiveBlocDisposition, POSITIVE_TRAITS } from './party-leadership.js';
import { onRally, onAttack } from './electorate.js';

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
 * toward their target (equilibrium or erosion).
 *
 * Institution funding modifies decay: fully-funded institutions block decay on
 * their primary/secondary stats entirely. Underfunded institutions let decay
 * through (or worsen it). When multiple institutions cover the same stat, their
 * rates are averaged. Stats not covered by any institution decay at natural rates.
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row (in-memory, mutated on success)
 * @param {Object|null} statInstitutionMap - from buildStatInstitutionMap(), or null to use natural rates
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

export async function processStatDecay(supabase, nation, statInstitutionMap, policyDecayAdjustments = null, currentTick = 0) {
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

        // Determine effective decay speed: institution-modified or natural
        const instDecay = statInstitutionMap
            ? getAveragedInstitutionDecay(statInstitutionMap[statKey])
            : null;
        const speed = instDecay !== null ? instDecay : config.speed;

        if (speed === 0) continue;  // fully funded institutions block all decay

        let newVal;
        if (currentVal > target) {
            newVal = Math.max(target, currentVal - speed);
        } else {
            newVal = Math.min(target, currentVal + speed);
        }

        newVal = Math.round(Math.max(2, Math.min(98, newVal)) * 10) / 10;

        if (newVal !== Math.round(currentVal * 10) / 10) {
            nationUpdates[statKey] = newVal;
            const prevRounded = Math.round(currentVal * 10) / 10;
            _logStatDebug(supabase, nation, currentTick, statKey,
                'decay',
                instDecay !== null ? `institution-decay (target=${target}, avg=${speed})` : `natural-decay (target=${target}, speed=${speed})`,
                speed, null, newVal - prevRounded,
                instDecay !== null ? 'institution-modified' : 'natural');
            appliedDecay.push({
                stat: statKey,
                type: config.type,
                previousValue: prevRounded,
                newValue: newVal,
                target,
                speed,
                institutionModified: instDecay !== null
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

        const instCount = appliedDecay.filter(d => d.institutionModified).length;
        console.log(`[processStatDecay] Decay applied for ${nation.name}: ${appliedDecay.length} stat(s)${instCount > 0 ? ` (${instCount} institution-modified)` : ''}`);
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
    const cur = Number(nation.national_vola_culture) || 0;
    if (cur <= 0) return null;
    const floor = Number(nation.vola_culture_floor) || 0;
    if (cur <= floor) return null; // Already at or below floor — decay no-ops.
    const decayed = _roundCulture(cur * (1 - VOLA_CULTURE_DECAY_RATE));
    const next = Math.max(floor, decayed);
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

// Three tiers — cost in abstract dollars (matches nation.budget scale,
// the same $-figures the Government Budget panel headlines). Deducted
// directly from nation.budget; if budget runs negative, the per-tick
// balance math turns the shortfall into debt next tick.
export const VOLA_INVESTMENT_LEVELS = Object.freeze({
    low:      { cost: 2, gain: 3, label: 'Low Investment' },
    moderate: { cost: 5, gain: 5, label: 'Moderate Investment' },
    high:     { cost: 8, gain: 7, label: 'High Investment' },
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
    const cfg = VOLA_INVESTMENT_LEVELS[level];
    if (!cfg) return { success: false, reason: 'invalid_level' };
    if (!nation?.id) return { success: false, reason: 'no_nation' };

    // Active sports minister gate — the row exists for the
    // ownership check, but no balance check (Sports actions pull from
    // nation.budget, not discretionary).
    const { data: mRow, error: mErr } = await supabase.from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .eq('ministry_key', 'sports')
        .eq('is_active', true)
        .maybeSingle();
    if (mErr) return { success: false, reason: 'fetch_failed', error: mErr.message };
    if (!mRow) return { success: false, reason: 'no_minister' };
    if (mRow.party_id !== callerFactionId) return { success: false, reason: 'not_minister' };

    // Cooldown check — last log row for this action on this nation.
    const { data: lastLog } = await supabase
        .from('ministry_action_log')
        .select('cooldown_until_tick')
        .eq('nation_id', nation.id)
        .eq('ministry_key', 'sports')
        .eq('action_key', VOLA_INVESTMENT_ACTION_KEY)
        .order('applied_at_tick', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (lastLog && Number(lastLog.cooldown_until_tick) > currentTick) {
        return { success: false, reason: 'cooldown', readyAtTick: Number(lastLog.cooldown_until_tick) };
    }

    // Deduct from nation.budget directly (abstract scale = display scale).
    // No floor — going negative is fine; the per-tick balance math will
    // route the shortfall into debt next tick via processNationDebtTick.
    const prevBudget = Number(nation.budget) || 0;
    const newBudget = prevBudget - cfg.cost;
    const prevCulture = Number(nation.national_vola_culture) || 0;
    const newCulture = Math.min(100, _roundCulture(prevCulture + cfg.gain));

    const { error: updErr } = await supabase.from('nations')
        .update({ budget: newBudget, national_vola_culture: newCulture })
        .eq('id', nation.id);
    if (updErr) return { success: false, reason: 'update_failed', error: updErr.message };
    nation.budget = newBudget;
    nation.national_vola_culture = newCulture;

    // Log + cooldown. money_cost stores the abstract-dollar cost.
    await supabase.from('ministry_action_log').insert({
        nation_id: nation.id,
        ministry_key: 'sports',
        action_key: VOLA_INVESTMENT_ACTION_KEY,
        faction_id: callerFactionId,
        ap_cost: 0,
        money_cost: cfg.cost,
        applied_at_tick: currentTick,
        cooldown_until_tick: currentTick + VOLA_INVESTMENT_COOLDOWN_TICKS,
        action_data: { level, gain: cfg.gain, prevCulture, newCulture, prevBudget, newBudget },
    });

    return { success: true, level, gain: cfg.gain, cost: cfg.cost, newCulture, newBudget };
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
            newVal = Math.round(Math.max(2, Math.min(98, newVal)) * 10) / 10;
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
                    : Math.round(Math.max(0, Math.min(100, accumulated)) * 10) / 10;
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


// ==================== RALLY SYSTEM ====================

export const RALLY_CONFIG = {
    AP_COST: 3,
    COOLDOWN_WINDOW: 5,   // ticks to look back for rallied_recently count
};

export const RALLY_OUTCOMES = [
    {
        id: 'rousing', name: 'Rousing Success',
        targetMin: 6, targetMax: 8, spillover: 2, spilloverScope: 'adjacent',
        headline: bloc => `Massive turnout at ${bloc} rally — supporters overflow venue`,
    },
    {
        id: 'solid', name: 'Solid Turnout',
        targetMin: 3, targetMax: 5, spillover: 0, spilloverScope: 'none',
        headline: bloc => `Party rally draws steady crowd in ${bloc} district — a strong showing`,
    },
    {
        id: 'low', name: 'Low Turnout',
        targetMin: 1, targetMax: 2, spillover: 0, spilloverScope: 'none',
        headline: bloc => `Sparse attendance at ${bloc} rally raises questions about grassroots support`,
    },
    {
        id: 'gaffe', name: 'Gaffe',
        targetMin: -3, targetMax: -2, spillover: -1, spilloverScope: 'random_adjacent',
        headline: bloc => `Party leader's remarks draw swift backlash at ${bloc} event`,
    },
    {
        id: 'divisive', name: 'Divisive Speech',
        targetMin: 5, targetMax: 7, spillover: -2, spilloverScope: 'all_others',
        headline: bloc => `Fiery rally speech energizes ${bloc} base but draws condemnation from opposition`,
    },
    {
        id: 'counter', name: 'Counter-Protest',
        targetMin: -1, targetMax: -1, spillover: -2, spilloverScope: 'all',
        headline: bloc => `${bloc} rally disrupted by counter-protesters — police intervene as tensions escalate`,
    },
];

/**
 * Compute outcome weights for a rally targeting a voter bloc.
 * Weights shift based on approval, crises, unrest, and recent rallies.
 * Alpha refactor: polarization branch retired (column deleted; the
 * divisive/counter swing it triggered is functionally absorbed by the
 * existing high-unrest branch below).
 */
export function getRallyOutcomeWeights(blocApproval, ralliedRecently, nationState) {
    const weights = { rousing: 20, solid: 38, low: 15, gaffe: 12, divisive: 8, counter: 5 };

    // High approval → more rousing (thresholds calibrated for 45/55 pillar weights)
    if (blocApproval > 45) {
        weights.rousing += 12; weights.low -= 5; weights.gaffe -= 4;
    } else if (blocApproval < 20) {
        weights.rousing -= 10; weights.low += 10; weights.gaffe += 8;
    }

    // Active crises
    if (nationState.crisisCount > 0) {
        weights.gaffe += 6; weights.divisive += 4; weights.counter += 10;
        weights.rousing -= 8; weights.solid -= 6;
    }

    // Rallied recently → stale material
    if (ralliedRecently >= 1) {
        weights.gaffe += 5 * ralliedRecently;
        weights.rousing -= 3 * ralliedRecently;
        weights.low += 3 * ralliedRecently;
    }

    // High civil unrest
    if (nationState.civilUnrest > 40) {
        weights.counter += 8; weights.rousing -= 4;
    }

    // Clamp to minimum 1
    for (const k of Object.keys(weights)) weights[k] = Math.max(1, weights[k]);

    // Normalize to percentages
    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    for (const k of Object.keys(weights)) weights[k] = Math.round((weights[k] / total) * 100);

    return weights;
}

/**
 * Get a risk assessment label from outcome weights.
 */
export function getRallyRiskLevel(weights) {
    const badPct = (weights.gaffe || 0) + (weights.divisive || 0) + (weights.counter || 0);
    if (badPct >= 40) return 'dangerous';
    if (badPct >= 25) return 'risky';
    if (badPct >= 15) return 'moderate';
    return 'safe';
}

/**
 * Pick an outcome from weighted distribution.
 */
function rollRallyOutcome(weights) {
    const ids = ['rousing', 'solid', 'low', 'gaffe', 'divisive', 'counter'];
    let sum = 0;
    const cumulative = [];
    for (const id of ids) {
        sum += (weights[id] || 0);
        cumulative.push({ id, threshold: sum });
    }
    const roll = Math.random() * sum;
    return (cumulative.find(c => roll <= c.threshold) || cumulative[cumulative.length - 1]).id;
}

/**
 * Execute a rally targeting a specific voter bloc.
 * Returns { success, outcomeId, outcomeName, headline, effects, newAp }
 */
export async function executeRally(supabase, factionId, nationId, blocId, currentTick) {
    // ── 1. Validate AP (with leader trait modifiers + escalation) ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, leader_positive_traits, leader_negative_traits, last_action_tick').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };

    // ── 2. Check cooldown (one rally per tick) + compute escalation ──
    const { data: recentRallies } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'rally')
        .gte('tick_performed', currentTick - 10)
        .order('tick_performed', { ascending: false });

    if ((recentRallies || []).some(r => r.tick_performed === currentTick))
        return { success: false, error: 'Already held a rally this tick.' };

    // Escalating cost: +1 per recent use, -1 per tick since last use
    let rallyEscalation = 0;
    if (recentRallies && recentRallies.length > 0) {
        const lastRallyTick = Math.max(...recentRallies.map(r => r.tick_performed));
        rallyEscalation = Math.max(0, recentRallies.length - (currentTick - lastRallyTick));
    }

    const rallyApMod = getTraitAPModifier('rally', faction, currentTick);
    const effectiveRallyCost = Math.max(1, RALLY_CONFIG.AP_COST + rallyEscalation + rallyApMod);
    if ((faction.action_points || 0) < effectiveRallyCost)
        return { success: false, error: `Not enough AP. Need ${effectiveRallyCost}.` };

    // Count how many times this specific bloc was rallied recently (within cooldown window)
    const ralliedRecently = (recentRallies || []).filter(r => r.result?.blocId === blocId && r.tick_performed >= currentTick - RALLY_CONFIG.COOLDOWN_WINDOW).length;

    // ── 3. Load target bloc (optional) + nation stats ──
    // (voter_blocs table removed; default to General Public)
    let targetBloc = { id: null, bloc_name: 'General Public', population_weight: 100 };

    const { data: nation } = await supabase
        .from('nations').select('unrest, control').eq('id', nationId).single();
    const { count: crisisCount } = await supabase
        .from('active_crises').select('id', { count: 'exact', head: true }).eq('nation_id', nationId);

    // ── 4. Target approval (legacy bloc-approval removed; default to 50) ──
    const targetApproval = 50;

    // ── 5. Compute weights and roll outcome ──
    // Alpha refactor: polarization + stability fields dropped from
    // nationState — polarization column gone, stability was set but
    // never read. civilUnrest reads from `nation.unrest` (alpha-19
    // equivalent of the legacy civil_unrest column).
    const nationState = {
        civilUnrest: nation?.unrest || 0,
        crisisCount: crisisCount || 0,
    };
    const weights = getRallyOutcomeWeights(targetApproval, ralliedRecently, nationState);
    // Apply leader trait modifiers to rally weights (crowd_pleaser, wooden_speaker)
    applyRallyTraitModifiers(weights, faction);
    // Re-clamp after trait modifiers
    for (const k of Object.keys(weights)) weights[k] = Math.max(1, weights[k]);
    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    for (const k of Object.keys(weights)) weights[k] = Math.round((weights[k] / total) * 100);

    const outcomeId = rollRallyOutcome(weights);
    const outcome = RALLY_OUTCOMES.find(o => o.id === outcomeId);

    // ── 6. Roll specific target effect (with telegenic multiplier + diminishing returns) ──
    let targetDelta = outcome.targetMin + Math.floor(Math.random() * (outcome.targetMax - outcome.targetMin + 1));
    if (targetDelta > 0) {
        const mult = getTraitApprovalMultiplier(faction, 'rally', 'SWING'); // generic multiplier for rally
        targetDelta = Math.round(targetDelta * mult);
    }
    // Diminishing returns: reduce effect by 25% per escalation level (min 25% of original)
    if (rallyEscalation > 0 && targetDelta !== 0) {
        const sign = targetDelta > 0 ? 1 : -1;
        const diminish = Math.max(0.25, 1 - rallyEscalation * 0.25);
        targetDelta = Math.round(targetDelta * diminish);
        if (targetDelta === 0) targetDelta = sign; // preserve direction even at minimum
    }

    // Crowd Pleaser: +2 bonus momentum from rallies
    if ((faction.leader_positive_traits || []).includes('crowd_pleaser')) {
        targetDelta += 2;
    }

    // ── 7. Apply momentum from rally outcome ──
    const effects = [];
    const momSign = targetDelta >= 0 ? '+' : '';
    const { error: momErr } = await supabase.rpc('adjust_momentum', {
        p_faction_id: factionId, p_delta: targetDelta,
        p_label: `Rally: ${outcome.name} (${momSign}${targetDelta})`, p_tick: currentTick
    });
    if (momErr) console.warn('[Rally] Momentum RPC failed:', momErr.message);
    effects.push({ stat: 'Momentum', value: targetDelta });

    // ── 8. Deduct AP + track last_action_tick ──
    // KNOWN ISSUE: AP deducted after effects applied. Early check (step 1) prevents common case.
    // Atomic RPC prevents DB over-spending. Race condition is acceptable for alpha.
    const rallyDetail = 'Hold a Rally' + (rallyApMod !== 0 ? ' (trait ' + (rallyApMod > 0 ? '+' : '') + rallyApMod + ')' : '');
    const apResult = await deductAP(supabase, factionId, effectiveRallyCost, { reason: 'rally', detail: rallyDetail, tick: currentTick });
    await supabase.from('factions').update({ last_action_tick: currentTick }).eq('id', factionId).then(({ error }) => { if (error) console.warn('[Rally] last_action_tick update failed:', error.message); });

    // ── 9. Log ──
    const headline = outcome.headline(targetBloc.bloc_name);
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'rally',
        ap_cost: effectiveRallyCost,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            blocId, blocName: targetBloc.bloc_name,
            outcomeId, outcomeName: outcome.name,
            headline, effects, weights, ralliedRecently,
            // Keep tags for promise compatibility — derive from bloc axes
            tags: _deriveBlocTags(targetBloc),
        }
    });

    // Electorate engine: update visibility + activity log
    try {
        const rallyResult = await onRally(supabase, factionId, nationId, outcomeId, currentTick);
        if (rallyResult?.visBoost !== 0) {
            effects.push({ stat: 'Visibility', value: rallyResult.visBoost });
        }
        if (rallyResult?.approvalHit != null && rallyResult.approvalHit !== 0) {
            effects.push({ stat: 'Party Approval', value: rallyResult.approvalHit });
        }
    } catch (e) {
        console.error('[Rally] Electorate hook failed (non-fatal):', e.message);
    }

    return {
        success: true,
        outcomeId,
        outcomeName: outcome.name,
        headline,
        effects,
        weights,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - effectiveRallyCost),
    };
}

/** Derive ideology tags from a bloc's axis leanings (for promise compatibility). */
function _deriveBlocTags(bloc) {
    const AXIS_MAP = [
        { key: 'axis_liberty_equality', left: 'LIBERTY', right: 'EQUALITY' },
        { key: 'axis_tradition_progress', left: 'TRADITION', right: 'PROGRESS' },
        { key: 'axis_security_freedom', left: 'SECURITY', right: 'FREEDOM' },
        { key: 'axis_globalism_nationalism', left: 'GLOBALISM', right: 'NATIONALISM' },
        { key: 'axis_individualism_collectivism', left: 'INDIVIDUALISM', right: 'COLLECTIVISM' },
    ];
    const tags = [];
    for (const ax of AXIS_MAP) {
        const val = bloc[ax.key] ?? 50;
        if (val < 40) tags.push(ax.left);
        else if (val > 60) tags.push(ax.right);
    }
    return tags;
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
                        newVal = Math.round(Math.max(2, Math.min(98, newVal)) * 10) / 10;
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
                            newVal = Math.round(Math.max(2, Math.min(98, newVal)) * 10) / 10;
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

    // Count active crises — ministers decay faster when the nation is in crisis
    const { count: activeCrisisCount } = await supabase
        .from('active_crises')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nation.id);
    const crisisMultiplier = 1 + (activeCrisisCount || 0);

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
        // During crises, decay is multiplied: 1 crisis = 2×, 2 crises = 3×, etc.
        newApproval += cfg.BASELINE_DECAY * crisisMultiplier;
        // Apply delta-based movement on top of baseline decay.
        // Baselines are permanent (appointment snapshot), so cap the cumulative delta
        // to prevent runaway approval. ±5 cap means max ±3/tick from stat performance.
        const clampedDelta = Math.max(-5, Math.min(5, avgDelta));
        if (Math.abs(clampedDelta) >= 0.5) {
            newApproval += clampedDelta * cfg.DELTA_SENSITIVITY;
        }

        // Foreign Minister penalty: -0.25/tick per nation without an outgoing ambassador
        let missingAmbassadorCount = 0;
        if (ministry.ministry_key === 'foreign') {
            const { count: totalNations } = await supabase
                .from('nations')
                .select('id', { count: 'exact', head: true })
                .neq('id', nation.id);
            const { count: activeAmbassadors } = await supabase
                .from('ambassadors')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nation.id)
                .eq('is_active', true)
                .eq('status', 'active');
            missingAmbassadorCount = (totalNations || 0) - (activeAmbassadors || 0);
            if (missingAmbassadorCount > 0) {
                newApproval += missingAmbassadorCount * cfg.MISSING_AMBASSADOR_PENALTY;
            }
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

// All columns that nations_history tracks (must match the DB table schema).
// Phase 9 trimmed NATION_STAT_COLUMNS to alpha-23. Phase 9b dropped
// eligible_voters (derived from population × 0.65 at read time).
export const HISTORY_SNAPSHOT_COLUMNS = [
    ...NATION_STAT_COLUMNS,
    'gov_approval',
    'population',
];

export async function snapshotNationHistory(supabase, nation, currentTick) {
    const snapshot = { nation_id: nation.id, tick: currentTick };

    for (const key of HISTORY_SNAPSHOT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = Number(nation[key]);
        }
    }

    const { error: snapError } = await supabase.from('nations_history').upsert(snapshot, {
        onConflict: 'nation_id,tick'
    });
    if (snapError) {
        console.error('[snapshotNationHistory] FAILED for nation', nation.id, 'tick', currentTick, ':', snapError.message);
    } else {
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


// ==================== CRISIS TICK PROCESSOR ====================

/**
 * Process persistent crises for a nation.
 * - Activates crises when ALL trigger conditions are met
 * - Applies effects every tick while active
 * - Deactivates crises when ALL recovery conditions are met
 * - Effects cascade: nation stats, government/coalition approval, minister approval
 */
export async function processCrises(supabase, nation, currentTick) {
    // 1. Load all crisis templates (including is_active=false for programmatic crises like Sovereign Debt/Default)
    const { data: crisisTemplates } = await supabase
        .from('crisis_templates')
        .select('*, crisis_triggers(*), crisis_effects(*), crisis_end_triggers(*)');

    if (!crisisTemplates || crisisTemplates.length === 0) return [];

    // 2. Load currently active crises for this nation
    const { data: activeCrisisRecords } = await supabase
        .from('active_crises')
        .select('*')
        .eq('nation_id', nation.id);

    const activeMap = {};
    for (const ac of (activeCrisisRecords || [])) {
        activeMap[ac.crisis_id] = ac;
    }

    const crisisEvents = [];
    const nationUpdates = {};
    const statBounds = {}; // { stat_key: { floor: highestFloor, ceiling: lowestCeiling } }

    // Load per-institution funding allocations (written by enactBill funding articles)
    const { data: _fundingAllocRows } = await supabase.from('budget_item_allocations')
        .select('item_id, item_type, allocation_amount, needed_amount')
        .eq('nation_id', nation.id)
        .eq('item_type', 'institution')
        .order('created_at', { ascending: true });
    const _fundingMap = buildFundingPctMap(_fundingAllocRows);
    function getInstitutionFundingPct(instId) {
        return getInstFundingPct(_fundingMap, instId);
    }

    // 3. Check inactive crises for activation (skip programmatic crises with is_active=false)
    for (const template of crisisTemplates) {
        if (activeMap[template.id]) continue; // already active
        if (!template.is_active) continue; // programmatic crises are activated elsewhere, not by stat triggers

        let allTriggersMet = false;

        if (template.crisis_type === 'ministry') {
            // Ministry crisis: check institution funding levels
            const institutionIds = template.institution_ids || [];
            const threshold = Number(template.funding_threshold_pct) || 0;
            if (institutionIds.length === 0) continue;

            allTriggersMet = true;
            for (const instId of institutionIds) {
                const pct = getInstitutionFundingPct(instId);
                if (pct >= threshold) {
                    allTriggersMet = false;
                    break;
                }
            }
        } else {
            // Stat-based crisis: check crisis_triggers
            const triggers = template.crisis_triggers || [];
            if (triggers.length === 0) continue;

            allTriggersMet = true;
            for (const trigger of triggers) {
                const resolvedKey = normalizeNationStatKey(trigger.stat_key) || trigger.stat_key;
                const statValue = nation[resolvedKey];
                if (statValue === null || statValue === undefined) {
                    allTriggersMet = false;
                    break;
                }
                const val = Number(statValue);
                if (trigger.operator === 'gte' && val < Number(trigger.threshold)) {
                    allTriggersMet = false;
                    break;
                }
                if (trigger.operator === 'lte' && val > Number(trigger.threshold)) {
                    allTriggersMet = false;
                    break;
                }
            }
        }

        if (!allTriggersMet) continue;

        // Activate the crisis
        const { data: newActive, error: insertErr } = await supabase
            .from('active_crises')
            .insert({
                crisis_id: template.id,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            })
            .select()
            .single();

        if (insertErr) {
            console.warn('Crisis activation insert failed:', insertErr.message);
            continue;
        }

        activeMap[template.id] = newActive;

        // Log to event_log
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'CRISIS_STARTED: ' + template.name,
            trigger_key: 'crisis_started',
            description_used: template.description || template.name,
            category: 'crisis',
            effects_applied: [],
            fired_at_tick: currentTick
        });

        crisisEvents.push({
            type: 'crisis_started',
            crisisName: template.name,
            description: template.description,
            tick: currentTick
        });

        console.log(`Crisis activated: "${template.name}" in ${nation.name} (tick ${currentTick})`);
    }

    // 4. Process active crises: apply effects first, then check end triggers
    //    (Applying effects before deactivation check prevents crisis flicker when
    //     a crisis's own effects push a stat to exactly the deactivation threshold.)
    for (const template of crisisTemplates) {
        const activeRecord = activeMap[template.id];
        if (!activeRecord) continue;

        // 4a. Idempotency guard: skip if effects already applied for this tick
        const priorLog = activeRecord.effects_applied_log || [];
        if (priorLog.some(entry => entry.tick === currentTick)) {
            console.log(`[processCrises] Skipping "${template.name}" for ${nation.name} — already applied at tick ${currentTick}`);
            continue;
        }

        // 4b. Apply effects every tick
        const effects = template.crisis_effects || [];
        const appliedEffects = [];

        for (const effect of effects) {
            const changePT = Number(effect.change_per_tick);
            if (!Number.isFinite(changePT)) {
                console.warn(`[processCrises] Skipping effect with non-numeric change_per_tick: "${effect.change_per_tick}" in crisis "${template.name}" for ${nation.name}`);
                continue;
            }
            const hasFloor = effect.stat_floor !== null && effect.stat_floor !== undefined;
            const floorVal = hasFloor ? Number(effect.stat_floor) : null;

            // Helper: clamp value respecting the per-effect floor/ceiling (for non-nation targets)
            // Round to 1dp to match processStatEffects and prevent floating-point drift.
            function clampWithFloor(current, raw) {
                if (isNaN(raw) || isNaN(current)) return current ?? 50;
                let v = Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
                if (hasFloor) {
                    if (changePT < 0) v = Math.max(floorVal, v);   // floor
                    else if (changePT > 0) v = Math.min(floorVal, v); // ceiling
                }
                return v;
            }

            // Normalize + validate stat_key for nation targets
            const rawStatKey = effect.stat_key;
            const statKey = (effect.target === 'nation') ? normalizeNationStatKey(rawStatKey) : rawStatKey;
            if (effect.target === 'nation' && (!statKey || !NATION_STAT_COLUMN_SET.has(statKey))) {
                console.warn(`[processCrises] Skipping invalid stat_key "${rawStatKey}" in crisis "${template.name}" for ${nation.name}`);
                continue;
            }

            if (effect.target === 'nation') {
                // GDP and debt are driven by dedicated systems — skip
                if (STAT_PROCESSOR_SKIP.has(statKey)) continue;
                const currentVal = nationUpdates[statKey] !== undefined
                    ? nationUpdates[statKey]
                    : (nation[statKey] !== undefined && nation[statKey] !== null
                        ? Number(nation[statKey]) : 50);

                // Raw-value stats (population) must not be clamped to 0-100
                let newVal;
                if (RAW_SCALING_DIVISORS[statKey]) {
                    const scaledCrisisChange = changePT * RAW_SCALING_DIVISORS[statKey];
                    newVal = Math.max(0, currentVal + scaledCrisisChange);
                } else {
                    newVal = Math.round(Math.max(0, Math.min(100, currentVal + changePT)) * 10) / 10;
                }
                nationUpdates[statKey] = newVal;
                nation[statKey] = newVal;

                // Accumulate most-restrictive floor/ceiling bounds for final enforcement
                if (hasFloor) {
                    if (!statBounds[statKey]) statBounds[statKey] = {};
                    if (changePT < 0) {
                        const prev = statBounds[statKey].floor;
                        statBounds[statKey].floor = (prev !== undefined) ? Math.max(prev, floorVal) : floorVal;
                    } else if (changePT > 0) {
                        const prev = statBounds[statKey].ceiling;
                        statBounds[statKey].ceiling = (prev !== undefined) ? Math.min(prev, floorVal) : floorVal;
                    }
                }

                appliedEffects.push({
                    stat: statKey, change: changePT,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'government_approval' || effect.target === 'coalition_approval') {
                // Floor/ceiling enforcement for gov approval events modifier.
                // Note: only floor (negative changePT) is enforced; ceiling for positive changePT not implemented.
                let effectiveGovChange = changePT;
                if (hasFloor && changePT < 0) {
                    const { data: govNat, error: govErr } = await supabase.from('nations').select('gov_approval_events').eq('id', nation.id).single();
                    if (govErr) {
                        console.warn(`[processCrises] Failed to read gov_approval_events for floor check: ${govErr.message}`);
                    } else {
                        const curEvents = Number(govNat?.gov_approval_events ?? 0);
                        const eventsFloor = -(floorVal);
                        if (curEvents <= eventsFloor) {
                            effectiveGovChange = 0;
                        } else if (curEvents + changePT < eventsFloor) {
                            effectiveGovChange = eventsFloor - curEvents;
                        }
                    }
                }
                if (effectiveGovChange !== 0) {
                    const coalition = await fetchActiveCoalition(supabase, nation.id);
                    const partyIds = coalition?.party_ids || [];
                    for (const partyId of partyIds) {
                        const scaledDelta = _round2(effectiveGovChange * 0.3);
                        await _adjustMomentum(supabase, partyId, nation.id, scaledDelta, 'crisis:' + template.name, currentTick);
                        appliedEffects.push({
                            stat: 'party_approval', change: scaledDelta,
                            target: effect.target, faction_id: partyId
                        });
                    }
                    // Also push to gov approval events component
                    await adjustGovernmentApprovalEvent(supabase, nation.id, effectiveGovChange, 'crisis:' + template.name);
                }

            } else if (effect.target === 'pm_approval') {
                const { data: pmMinistry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', 'prime_minister')
                    .eq('is_active', true)
                    .maybeSingle();

                if (pmMinistry) {
                    const currentVal = pmMinistry.minister_approval ?? MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    const { error: pmUpdErr } = await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', 'prime_minister')
                        .eq('is_active', true);
                    if (pmUpdErr) console.error(`[processCrises] Failed to update PM approval for ${nation.name}:`, pmUpdErr.message);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'pm_approval', minister_key: 'prime_minister',
                        old: currentVal, new: newVal
                    });

                    // Cascade PM approval loss to party_approval (scaled)
                    if (changePT < 0 && pmMinistry.party_id) {
                        const cascadeDelta = _round2(-(Math.abs(changePT) * 0.5));
                        await _adjustMomentum(supabase, pmMinistry.party_id, nation.id, cascadeDelta, 'crisis:cascade:pm', currentTick);

                        appliedEffects.push({
                            stat: 'party_approval', change: cascadeDelta,
                            target: 'minister_cascade', faction_id: pmMinistry.party_id,
                            minister_key: 'prime_minister'
                        });
                    }
                }

            } else if (effect.target === 'minister_approval') {
                const { data: ministry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', effect.minister_key)
                    .eq('is_active', true)
                    .maybeSingle();

                if (ministry) {
                    const currentVal = ministry.minister_approval ?? MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    const { error: minUpdErr } = await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', effect.minister_key)
                        .eq('is_active', true);
                    if (minUpdErr) console.error(`[processCrises] Failed to update ${effect.minister_key} approval for ${nation.name}:`, minUpdErr.message);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'minister_approval', minister_key: effect.minister_key,
                        old: currentVal, new: newVal
                    });

                    // Cascade minister approval loss to party_approval (scaled; PM 0.5x, others 0.25x)
                    if (changePT < 0 && ministry.party_id) {
                        const loss = Math.abs(changePT);
                        const multiplier = effect.minister_key === 'prime_minister' ? 0.5 : 0.25;
                        const cascadeDelta = _round2(-(loss * multiplier));
                        await _adjustMomentum(supabase, ministry.party_id, nation.id, cascadeDelta, 'crisis:cascade:ministry', currentTick);

                        appliedEffects.push({
                            stat: 'party_approval', change: cascadeDelta,
                            target: 'minister_cascade', faction_id: ministry.party_id,
                            minister_key: effect.minister_key
                        });
                    }
                }
            }
        }

        // Update effects log on the active crisis record
        const logEntry = { tick: currentTick, effects: appliedEffects };
        const existingLog = activeRecord.effects_applied_log || [];
        // Keep last 50 entries to prevent unbounded growth
        if (existingLog.length >= 50) existingLog.shift();
        existingLog.push(logEntry);
        await supabase.from('active_crises')
            .update({ effects_applied_log: existingLog })
            .eq('id', activeRecord.id);

        if (appliedEffects.length > 0) {
            crisisEvents.push({
                type: 'crisis_effects',
                crisisName: template.name,
                effects: appliedEffects,
                tick: currentTick
            });
        }

        // 4c. Check end / recovery triggers AFTER effects applied (prevents flicker)
        let allEndConditionsMet = false;

        if (template.crisis_type === 'ministry') {
            // Ministry crisis: resolve when ALL institutions are at/above recovery_threshold_pct
            const institutionIds = template.institution_ids || [];
            const recoveryPct = Number(template.recovery_threshold_pct) || (Number(template.funding_threshold_pct) + 20);
            if (institutionIds.length > 0) {
                allEndConditionsMet = true;
                for (const instId of institutionIds) {
                    const pct = getInstitutionFundingPct(instId);
                    if (pct < recoveryPct) {
                        allEndConditionsMet = false;
                        break;
                    }
                }
            }
        } else {
            // Stat-based crisis: check crisis_end_triggers
            const endTriggers = template.crisis_end_triggers || [];
            allEndConditionsMet = endTriggers.length > 0;

            for (const endTrigger of endTriggers) {
                const resolvedEndKey = normalizeNationStatKey(endTrigger.stat_key) || endTrigger.stat_key;
                const statValue = nation[resolvedEndKey];
                if (statValue === null || statValue === undefined) {
                    allEndConditionsMet = false;
                    break;
                }
                const val = Number(statValue);
                if (endTrigger.operator === 'gte' && val < Number(endTrigger.threshold)) {
                    allEndConditionsMet = false;
                    break;
                }
                if (endTrigger.operator === 'lte' && val > Number(endTrigger.threshold)) {
                    allEndConditionsMet = false;
                    break;
                }
            }
        }

        // Protest crisis fizzle: T6/T7 crises auto-resolve when their
        // duration expires (1d6 ticks for T6, 1d12 for T7).
        if (!allEndConditionsMet && (template.id === PROTEST_CONFIG.TIER6_CRISIS_ID || template.id === PROTEST_CONFIG.TIER7_CRISIS_ID)) {
            try {
                const { data: protestRow } = await supabase.from('protest_log')
                    .select('id, crisis_started_tick, crisis_duration, faction_id')
                    .eq('nation_id', nation.id)
                    .eq('status', 'crisis_active')
                    .order('crisis_started_tick', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (protestRow && protestRow.crisis_started_tick != null && protestRow.crisis_duration != null) {
                    const ticksElapsed = currentTick - protestRow.crisis_started_tick;
                    if (ticksElapsed >= protestRow.crisis_duration) {
                        allEndConditionsMet = true;
                        // Mark protest as fizzled
                        await supabase.from('protest_log').update({
                            status: 'resolved',
                            tick_resolved: currentTick,
                        }).eq('id', protestRow.id);
                        // Clear lockouts
                        if (protestRow.faction_id) {
                            await supabase.from('factions')
                                .update({ action_lockout_until_tick: null })
                                .eq('id', protestRow.faction_id);
                        }
                        const tierLabel = template.id === PROTEST_CONFIG.TIER7_CRISIS_ID ? 'Tier 7' : 'Tier 6';
                        console.log(`[processCrises] Protest ${tierLabel} crisis fizzled in ${nation.name} after ${ticksElapsed} ticks`);
                        // Fire world-visible fizzle event
                        await supabase.from('event_log').insert({
                            nation_id: nation.id,
                            event_name: `Protest Crisis Fizzles`,
                            trigger_key: 'protest:crisis_fizzled',
                            description_chosen: `The ${tierLabel} protest crisis in ${nation.name} has fizzled out after ${ticksElapsed} ticks. Stability returning.`,
                            category: 'protest',
                            fired_at_tick: currentTick
                        });
                    }
                }
            } catch (fizzleErr) {
                console.warn('[processCrises] Protest fizzle check failed (non-fatal):', fizzleErr);
            }
        }

        if (allEndConditionsMet) {
            // Deactivate the crisis (effects already applied this final tick)
            await supabase.from('active_crises').delete().eq('id', activeRecord.id);
            delete activeMap[template.id];

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_RESOLVED: ' + template.name,
                trigger_key: 'crisis_ended',
                description_used: 'The crisis "' + template.name + '" has been resolved.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });

            // 1d6 government approval boost for resolving a crisis
            const crisisResolveBoost = Math.ceil(Math.random() * 6);
            await adjustGovernmentApprovalEvent(supabase, nation.id, crisisResolveBoost, `crisis:resolved:${template.name}`);

            // +8 momentum to governing coalition parties for resolving the crisis
            try {
                const { data: govFormation } = await supabase
                    .from('government_formations')
                    .select('party_ids')
                    .eq('nation_id', nation.id)
                    .in('status', ['formed', 'active', 'caretaker'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (govFormation?.party_ids) {
                    for (const pid of govFormation.party_ids) {
                        await supabase.rpc('adjust_momentum', {
                            p_faction_id: pid,
                            p_delta: 3,
                            p_label: `Crisis resolved: ${template.name} (+3)`,
                            p_tick: currentTick
                        });
                    }
                }
            } catch (momErr) {
                console.warn(`[Crisis] Momentum boost failed for crisis resolution:`, momErr.message);
            }

            crisisEvents.push({
                type: 'crisis_resolved',
                crisisName: template.name,
                duration: currentTick - activeRecord.started_at_tick,
                tick: currentTick
            });

            console.log(`Crisis resolved: "${template.name}" in ${nation.name} (tick ${currentTick}, duration: ${currentTick - activeRecord.started_at_tick} ticks, gov approval +${crisisResolveBoost})`);
        }
    }

    // 4d. Enforce most-restrictive floor/ceiling bounds across all crises
    for (const [stat, bounds] of Object.entries(statBounds)) {
        let val = nationUpdates[stat];
        if (val === undefined) continue;
        if (bounds.floor !== undefined) val = Math.max(bounds.floor, val);
        if (bounds.ceiling !== undefined) val = Math.min(bounds.ceiling, val);
        val = Math.round(val * 10) / 10;
        nationUpdates[stat] = val;
        nation[stat] = val;
    }

    // 5. Bulk update nation stats
    if (Object.keys(nationUpdates).length > 0) {
        const { error: crisisUpdateErr } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        if (crisisUpdateErr) {
            console.error(`[processCrises] Nation stat update FAILED for ${nation.name}:`, crisisUpdateErr.message, JSON.stringify(nationUpdates));
        } else {
            console.log(`[processCrises] Nation stats updated for ${nation.name}:`, JSON.stringify(nationUpdates));
        }
    }

    return crisisEvents;
}


// ==================== UTILITY FORMATTERS ====================
// (Democratic revolution and seize-autocratic-power systems removed — autocracy scrapped)

export function _removedProcessRevolution() { return null; }
export function formatStatName(stat) {
    // 'control' renders as "State Apparatus" — a relabel without a
    // schema rename. Every other stat falls through to the generic
    // title-case path. If more relabels accumulate, promote this to
    // a small lookup table.
    if (stat === 'control') return 'State Apparatus';
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

    // Snapshot the outgoing PM before deactivation so we can record the
    // transition in the open admin row's leader_changes log (semi-pres).
    const { data: outgoingHog } = await supabase
        .from('head_of_government')
        .select('faction_id, first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();

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

    // Tier 2 Phase 3: in semi-presidential nations the administration row
    // is bound to the PRESIDENT'S tenure, not the PM's. PM changes within
    // a presidential term are sub-events recorded as leader_changes
    // entries on the open admin row, never as new admin rows.
    try {
        const { data: nation } = await supabase.from('nations')
            .select('government_type').eq('id', nationId).single();
        if (isSemiPresidential(nation)) {
            const newPmName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;
            const oldPmName = outgoingHog
                ? [outgoingHog.first_name, outgoingHog.last_name].filter(Boolean).join(' ').trim() || null
                : null;
            await appendAdminLeaderChange(supabase, nationId, {
                tick: currentTick ?? null,
                role: 'prime_minister',
                reason,
                old_name: oldPmName,
                new_name: newPmName,
                old_party_id: outgoingHog?.faction_id || null,
                new_party_id: factionId,
            });
        }
    } catch (err) {
        console.warn('[installHOG] leader_changes write failed:', err?.message || err);
    }

    return { };
}

/**
 * Append a leader_changes event to the open administration row.
 * Used by both server-side installHOG (semi-pres PM rotation within a
 * presidential term) and the browser party-leadership UI (mid-term ruling-
 * party leader change). Non-blocking: SELECT/UPDATE failures log to console
 * but do not throw — the calling action has already mutated primary state
 * (head_of_government, factions) and shouldn't be rolled back over an
 * audit-trail write.
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
    // Semi-Presidential cohabitation rule: the President must manually
    // nominate a PM via nominatePMCandidate. Auto-appointing the party
    // leader breaks two scenarios:
    //   1. If the winning party is the President's own party, the party
    //      leader IS the President — appointing them as PM creates a
    //      same-person dual-role conflict.
    //   2. If the winning party is a different party, the President should
    //      still get to choose who they appoint — that's the whole point
    //      of semi-presidential constitutional design.
    // Bail early in semi-pres systems and let the manual flow take over.
    const { data: nationGovType } = await supabase.from('nations')
        .select('government_type').eq('id', nationId).single();
    if (isSemiPresidential(nationGovType)) {
        console.log('[autoAppointPartyLeaderAsPM] semi-presidential — skipping auto-appoint (President must manually nominate)');
        return null;
    }

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

    // Update/create PM ministry row
    const { data: pmMinistry } = await supabase.from('ministries')
        .select('id').eq('nation_id', nationId)
        .eq('ministry_key', 'prime_minister').eq('is_active', true)
        .maybeSingle();

    const { data: nationForBaseline } = await supabase.from('nations').select('*').eq('id', nationId).single();
    const pmBaselines = nationForBaseline ? buildMinistryBaselines('prime_minister', nationForBaseline) : {};

    if (pmMinistry) {
        await supabase.from('ministries').update({
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
        .select('control')
        .eq('id', nationId)
        .single();

    if (nation) {
        const newStability = Math.max(0, (nation.control ?? 50) - 3);
        await supabase
            .from('nations')
            .update({ control: newStability })
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
 */
export async function disbandParty(supabase, nationId, factionId, currentTick, opts = {}) {
    const { redistribute = true } = opts;
    // Guard: never disband corporations
    const { data: faction } = await supabase
        .from('factions')
        .select('disband_cooldown_until_tick, faction_name, faction_type')
        .eq('id', factionId)
        .single();

    if (faction?.faction_type === 'corporation') {
        throw new Error('Corporations cannot be disbanded.');
    }

    // 1. Cooldown check

    if (faction?.disband_cooldown_until_tick && faction.disband_cooldown_until_tick > currentTick) {
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
        .select('id, bill_name, bill_type, ambassador_id')
        .eq('nation_id', nationId)
        .eq('proposed_by', factionId)
        .in('status', ['committee', 'floor']);
    if (orphanedBills && orphanedBills.length > 0) {
        for (const bill of orphanedBills) {
            await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
            // Reject any pending ambassadors from failed confirmation bills
            if (bill.bill_type === 'confirmation' && bill.ambassador_id) {
                await supabase.from('ambassadors').update({ status: 'rejected', is_active: false }).eq('id', bill.ambassador_id);
            }
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
// + hereditary HoS). Absolute monarchy / presidential / semi-presidential
// are out — leadership challenge would undermine the monarch / president.
function _isParliamentaryForChallenge(nation) {
    const govType = (nation?.government_type || '').toLowerCase();
    const isAM    = govType.includes('absolute monarchy');
    const isPres  = govType.includes('presidential') && !govType.includes('semi');
    const isSemi  = govType.includes('semi-presidential') || govType.includes('semi_presidential');
    if (isAM || isPres || isSemi) return false;
    return govType.includes('parliamentary')
        || nation?.hos_election_method === 'hereditary';
}

/**
 * Player-initiated claim. Validates eligibility and inserts a row in
 * leadership_challenges; the next tick's resolveLeadershipChallenges
 * pass picks the winner from all rows with the same claimed_at_tick.
 *
 * Returns { success, reason?, alreadyClaimed? }.
 */
export async function claimLeadershipChallenge(supabase, nation, faction, currentTick) {
    if (!nation?.id || !faction?.id) return { success: false, reason: 'missing_args' };
    if (!_isParliamentaryForChallenge(nation)) return { success: false, reason: 'wrong_gov_type' };
    if (!faction.leader_first_name)        return { success: false, reason: 'no_leader' };
    if (!faction.seats || faction.seats <= 0) return { success: false, reason: 'no_seats' };

    // Vacancy check — no active head_of_government row.
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('active', true)
        .maybeSingle();
    if (hog) return { success: false, reason: 'pm_already_installed' };

    // Coalition membership check.
    const { data: formation } = await supabase
        .from('government_formations')
        .select('party_ids')
        .eq('nation_id', nation.id)
        .in('status', ['formed', 'active', 'caretaker'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (!formation) return { success: false, reason: 'no_coalition' };
    if (!(formation.party_ids || []).includes(faction.id)) return { success: false, reason: 'not_in_coalition' };

    // Insert claim. UNIQUE(nation_id, faction_id, claimed_at_tick) makes
    // a same-tick double-click a silent no-op (treated as success).
    const { error } = await supabase.from('leadership_challenges').insert({
        nation_id: nation.id,
        faction_id: faction.id,
        claimed_at_tick: currentTick,
        seats_at_claim: faction.seats,
    });
    if (error) {
        if (error.code === '23505') return { success: true, alreadyClaimed: true };
        return { success: false, reason: 'insert_failed', error: error.message };
    }
    return { success: true };
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

    // Coalition still active?
    const { data: formation } = await supabase
        .from('government_formations')
        .select('party_ids')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'active', 'caretaker'])
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();
    if (!formation) {
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
// contract (corp_contracts) for corps to bid on. Posting cost is in
// abstract dollars (matches nation.budget scale); contract budget target
// is raw dollars (the figure corps see + bid against).
//
// Cost mapping:
//     Small        $3 from budget, $60M target budget, floor +2 / 24 ticks
//     Modest       $7 from budget, $140M target budget, floor +4 / 36 ticks
//     Extravagant  $10 from budget, $450M target budget, floor +9 / 60 ticks
//
// spec_category is the cross-system identifier (corp Operations page
// reads this for filtering); project_subtype='Vola Stadium' is the
// discriminator for our completion sweep + RPCs.
const _STADIUM_M = 1_000_000;
export const VOLA_STADIUM_TIERS = Object.freeze({
    small: {
        label: 'Small',
        postingCost:       3,                  // abstract dollars deducted from nation.budget
        budgetTarget:      60  * _STADIUM_M,   // raw dollars on the contract row
        floorContribution: 2,
        timelineMonths:    24,
        specCategory:     'Light Infrastructure',
    },
    modest: {
        label: 'Modest',
        postingCost:       7,
        budgetTarget:      140 * _STADIUM_M,
        floorContribution: 4,
        timelineMonths:    36,
        specCategory:     'Heavy Infrastructure',
    },
    extravagant: {
        label: 'Extravagant',
        postingCost:       10,
        budgetTarget:      450 * _STADIUM_M,
        floorContribution: 9,
        timelineMonths:    60,
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
    if (!nation?.id || !callerFactionId) return { success: false, reason: 'missing_args' };
    const tier = VOLA_STADIUM_TIERS[params?.size];
    if (!tier) return { success: false, reason: 'invalid_size' };
    const stadiumName = String(params?.stadiumName || '').trim();
    const teamName    = String(params?.teamName    || '').trim();
    if (!stadiumName) return { success: false, reason: 'no_stadium_name' };

    // Active sports minister gate (no balance check — pulls from
    // nation.budget, negative balance is allowed).
    const { data: mRow, error: mErr } = await supabase.from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .eq('ministry_key', 'sports')
        .eq('is_active', true).maybeSingle();
    if (mErr) return { success: false, reason: 'fetch_failed', error: mErr.message };
    if (!mRow) return { success: false, reason: 'no_minister' };
    if (mRow.party_id !== callerFactionId) return { success: false, reason: 'not_minister' };

    // One-open-stadium-bid-per-nation gate.
    const { data: existing } = await supabase.from('corp_contracts')
        .select('id').eq('issuer_nation_id', nation.id)
        .eq('project_subtype', _STADIUM_PROJECT_SUBTYPE)
        .eq('status', 'open').limit(1).maybeSingle();
    if (existing) return { success: false, reason: 'already_open' };

    // Generate contract number — same convention as other gov contracts.
    const year = 2000 + Math.floor(currentTick / 12);
    const contractNumber = `GOV-${year}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Deduct posting cost from nation.budget first. Allowed to go
    // negative; the next-tick balance math sweeps the shortfall into
    // debt via processNationDebtTick.
    const prevBudget = Number(nation.budget) || 0;
    const newBudget  = prevBudget - tier.postingCost;
    const { error: budgetErr } = await supabase.from('nations')
        .update({ budget: newBudget }).eq('id', nation.id);
    if (budgetErr) return { success: false, reason: 'budget_update_failed', error: budgetErr.message };
    nation.budget = newBudget;

    // Insert the contract.
    const { data: contract, error: cErr } = await supabase.from('corp_contracts').insert({
        contract_number:    contractNumber,
        name:               stadiumName,
        description:        teamName ? `Home of: ${teamName}` : 'Vola Stadium',
        contract_type:      'GOVERNMENT',
        issuer_name:        'Ministry of Sports',
        issuer_faction_id:  null,
        issuer_nation_id:   nation.id,
        required_sector:    'Construction',
        spec_category:      tier.specCategory,
        budget:             tier.budgetTarget,
        timeline_months:    tier.timelineMonths,
        project_type:       'Civil Engineering',
        project_subtype:    _STADIUM_PROJECT_SUBTYPE,
        status:             'open',
        created_at_tick:    currentTick,
        expires_at_tick:    currentTick + _STADIUM_BID_WINDOW_TICKS,
    }).select('id').single();
    if (cErr) {
        // Refund the budget deduction since the contract didn't land.
        await supabase.from('nations')
            .update({ budget: prevBudget }).eq('id', nation.id);
        nation.budget = prevBudget;
        return { success: false, reason: 'insert_failed', error: cErr.message };
    }

    return { success: true, contractId: contract.id, tier: params.size };
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
        // Map spec_category back to floor contribution.
        const floor = c.spec_category === 'Light Infrastructure' ? 2
                    : c.spec_category === 'Heavy Infrastructure' ? 4
                    : c.spec_category === 'Megaproject'          ? 9
                    : 0;

        // Mark contract complete first (defensive — if a downstream
        // step fails we don't double-apply on the next tick).
        const { error: updErr } = await supabase.from('corp_contracts').update({
            status: 'completed',
            completed_at_tick: currentTick,
            payout_tick: currentTick + 3,
        }).eq('id', c.id).eq('status', 'active');
        if (updErr) {
            console.warn('[VolaStadiumCompletion] mark-complete failed for', c.id, ':', updErr.message);
            continue;
        }

        // Pull the host nation's current vola_stadiums + floor (NUMERIC
        // values — the schema lets the column hold decimals but the
        // stadium count is integer-valued).
        const { data: host } = await supabase.from('nations')
            .select('id, name, vola_stadiums, vola_culture_floor')
            .eq('id', c.issuer_nation_id).single();
        if (host) {
            const newCount = (Number(host.vola_stadiums) || 0) + 1;
            const newFloor = Math.min(100, _roundCulture((Number(host.vola_culture_floor) || 0) + floor));
            await supabase.from('nations').update({
                vola_stadiums: newCount,
                vola_culture_floor: newFloor,
            }).eq('id', host.id);
        }

        // Event log — "Coastal Vola Park opened · floor +7 · home of Coastal Tide".
        const teamLabel = (c.description || '').replace(/^Home of:\s*/i, '').trim();
        const desc = `${c.name} opened · floor +${floor}` + (teamLabel ? ` · home of ${teamLabel}` : '');
        await supabase.from('event_log').insert({
            nation_id:          c.issuer_nation_id,
            event_name:         'Vola Stadium Opened',
            category:           'political',
            trigger_key:        'vola_stadium_completed',
            description_chosen: desc,
            fired_at_tick:      currentTick,
        });

        completed++;
    }

    return { completed };
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
