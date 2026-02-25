// @ts-nocheck
/**
 * Supabase Edge Function: advance-tick
 *
 * Server-side tick processor for Nationhood Alpha.
 * Called by pg_cron every minute — checks if next_tick_at has passed,
 * acquires a database lock, and processes the full game tick.
 *
 * AUTO-GENERATED — do not edit index.ts directly.
 * Source: js/game-common.js + supabase/functions/advance-tick/handler-template.ts
 * Regenerate with: node scripts/sync-edge-function.js
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let rpcPreflightCheckPromise = null;

async function ensureApRpcAvailability(supabase) {
    if (!rpcPreflightCheckPromise) {
        rpcPreflightCheckPromise = (async () => {
            const probeFactionId = "00000000-0000-0000-0000-000000000000";

            const probes = [
                {
                    name: "accumulate_ap",
                    call: () => supabase.rpc("accumulate_ap", {
                        p_faction_id: probeFactionId,
                        p_gain: 0,
                        p_max_ap: 20,
                    }),
                },
                {
                    name: "deduct_ap",
                    call: () => supabase.rpc("deduct_ap", {
                        p_faction_id: probeFactionId,
                        p_cost: 0,
                    }),
                },
            ];

            for (const probe of probes) {
                const { error } = await probe.call();
                if (error) {
                    throw new Error(
                        `Missing or inaccessible required RPC '${probe.name}'. Deploy SQL function/grants before rolling out advance-tick. Detail: ${error.message}`
                    );
                }
            }
            console.log("[advance-tick] RPC preflight passed for accumulate_ap and deduct_ap.");
        })();
    }

    return rpcPreflightCheckPromise;
}

// ===== GAME LOGIC (from js/game-common.js) =====

/**
 * game-common.js — Shared game logic for Nationhood Alpha
 *
 * Single source of truth for:
 *   - Seat loading (autocracy vs democracy)
 *   - Head faction detection
 *   - Coalition fetching (government_formations → active_coalitions)
 *   - Policy compatibility filtering
 *   - Bill support calculation
 *   - Vote tally syncing
 *   - Enactment approval impact
 *   - Dynamic Ideology System (axes, labels, shifts, drift, penalties)
 *   - Government vacancy penalties & snap elections
 *   - Random event processing
 *   - Game constants & utility formatters
 *
 * Used by: laws.html, bill.html, government.html, parties.html
 */

// ==================== CONSTANTS ====================

const GAME_CONFIG = {
    TOTAL_SEATS: 120,
    MAJORITY_SEATS: 61,
    VOTING_WINDOW_TICKS: 6,
    QUORUM_THRESHOLD: 0.6,           // 60% of seats must vote before quorum-based early resolution
    COMMITTEE_EXPIRY_TICKS: 6,
    DRAFT_BILL_AP_COST: 2,
    VETO_APPROVAL_COST: 3,
    NO_CONFIDENCE_AP_COST: 5,
    NO_CONFIDENCE_VOTING_TICKS: 6,
    NO_CONFIDENCE_COOLDOWN_TICKS: 6,
    FOUNDATIONAL_AP_COST: 3,
    FOUNDATIONAL_VOTING_TICKS: 6,
    SUPERMAJORITY_THRESHOLD: 2/3,
    EARLY_ELECTION_TICKS: 6,
    EARLY_ELECTION_PM_APPROVAL_COST: 5,
    EARLY_ELECTION_COALITION_APPROVAL_COST: 3,
    // Presidential Democracy
    PRESIDENTIAL_TERM_TICKS: 48,
    PARLIAMENTARY_TERM_TICKS: 24,
    VETO_OVERRIDE_THRESHOLD: 2/3,
    PRESIDENT_DESK_TICKS: 6,
    MINISTER_CONFIRMATION_VOTING_TICKS: 6,
    PRESIDENTIAL_CANDIDATE_LEAD_TICKS: 6, // ticks before presidential election to generate candidates
    MAX_AP: 20,  // maximum action points a party can accumulate
    TICKS_PER_YEAR: 12,
    BUDGET_BILL_VOTING_TICKS: null,   // budget bills persist until passed (never expire)
    NO_BUDGET_PENALTY_TICKS: 24,     // how many ticks without a budget before max penalty
    // Inactivity decay
    INACTIVITY_GRACE_TICKS: 12,              // no penalty for first 12 ticks of inactivity
    INACTIVITY_PREFERENCE_DECAY_PCT: 0.10,   // -10% voter bloc preference per tick while inactive
    INACTIVITY_MOMENTUM_DECAY: 7,            // -7 momentum per tick while inactive
    INACTIVITY_DISBAND_THRESHOLD: 24         // after 24 ticks inactive, auto-disband
};

// ==================== TRADE SYSTEM CONSTANTS ====================

var TRADE_CONFIG = {
    BASE_TRADE_MULTIPLIER: 50000000,       // base dollar value per unit of export capacity
    BASELINE_GDP: 100000000000,            // 100B — the "average" GDP for scaling
    HISTORY_TICKS: 24,                     // keep 2 game-years of trade history
};

/**
 * Trade sectors — the 8 categories of goods/services that nations trade.
 *
 * Each sector defines:
 *   key         – unique identifier (matches trade_flows.sector column)
 *   label       – display name
 *   export_only – if true, cannot be imported (tourism, services)
 *   export_stat / export_stats – nation stat(s) driving export capacity
 *   export_threshold – minimum stat value to generate any exports (0-100 scale)
 */
var TRADE_SECTORS = [
    {
        key: 'fuel_energy',
        label: 'Fuel & Energy',
        export_only: false,
        export_stat: 'oil_and_gas',
        export_threshold: 15
    },
    {
        key: 'minerals',
        label: 'Minerals & Raw Materials',
        export_only: false,
        export_stat: 'rare_minerals',
        export_threshold: 15
    },
    {
        key: 'food_agriculture',
        label: 'Food & Agriculture',
        export_only: false,
        export_stat: 'arable_land',
        export_threshold: 20
    },
    {
        key: 'manufactured_goods',
        label: 'Manufactured Goods',
        export_only: false,
        export_stats: ['physical_infrastructure', 'higher_education'],
        export_threshold: 25
    },
    {
        key: 'technology',
        label: 'Technology & Electronics',
        export_only: false,
        export_stats: ['digital_infrastructure', 'higher_education'],
        export_threshold: 30
    },
    {
        key: 'arms',
        label: 'Arms & Military Equipment',
        export_only: false,
        export_stats: ['physical_infrastructure', 'higher_education'],
        export_threshold: 30
    },
    {
        key: 'tourism',
        label: 'Tourism',
        export_only: true,
        export_stats: ['happiness', 'stability', 'physical_infrastructure'],
        export_threshold: 25
    },
    {
        key: 'services_finance',
        label: 'Services & Finance',
        export_only: true,
        export_stats: ['higher_education', 'digital_infrastructure', 'credit'],
        export_threshold: 35
    }
];

var TRADE_SECTOR_KEYS = [];
var TRADE_SECTOR_MAP = {};
for (var _tsi = 0; _tsi < TRADE_SECTORS.length; _tsi++) {
    TRADE_SECTOR_KEYS.push(TRADE_SECTORS[_tsi].key);
    TRADE_SECTOR_MAP[TRADE_SECTORS[_tsi].key] = TRADE_SECTORS[_tsi];
}

// ==================== TRADE CALCULATION FUNCTIONS (STUBS) ====================

/**
 * Calculate a nation's export capacity for a given sector.
 * Returns raw dollar value of potential exports.
 *
 * Formulas use 0-20 scale internally (spec baseline). Since codebase stats are
 * 0-100, scores are normalized by dividing by 5.
 *
 * @param {Object} nation    – nation row with all stats (gdp in raw dollars, stats 0-100)
 * @param {Object} sector    – TRADE_SECTORS entry
 * @param {Object} [opts]    – optional: { defense_pct } for arms sector (0-100, % of budget)
 * @returns {number} export capacity in dollars (value side, after currency modifier)
 */
function calculateExportCapacity(nation, sector, opts) {
    var cfg = TRADE_CONFIG;

    // GDP modifier: bigger economies trade more in absolute terms
    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = gdp / cfg.BASELINE_GDP;
    if (gdpModifier <= 0) return 0;

    // Calculate primary export score from sector stat(s) (0-100 scale)
    var score = 0;
    if (sector.export_stat) {
        score = Number(nation[sector.export_stat]) || 0;
    } else if (sector.export_stats) {
        var sum = 0;
        for (var i = 0; i < sector.export_stats.length; i++) {
            sum += Number(nation[sector.export_stats[i]]) || 0;
        }
        score = sum / sector.export_stats.length;
    }

    // Threshold check: stat must exceed sector threshold to generate any exports
    if (score <= (sector.export_threshold || 0)) return 0;

    // Normalize from 0-100 codebase scale to 0-20 spec scale
    var normalizedScore = score / 5;

    // Base capacity = normalizedScore × BASE_TRADE_MULTIPLIER × gdpModifier
    var capacity = normalizedScore * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;

    // ── Sector-specific modifiers ──

    // Arms: requires meaningful defense spending to have an arms industry
    if (sector.key === 'arms') {
        var defensePct = (opts && opts.defense_pct) || 0;
        if (defensePct <= 8) return 0;
        capacity *= (defensePct / 15);  // 15% defense spending = 1.0 multiplier
    }

    // Tourism: smaller than goods trade + requires stability
    if (sector.key === 'tourism') {
        capacity *= 0.5;
        if ((Number(nation.stability) || 0) <= 25) return 0;
    }

    // Services & Finance: smaller than goods trade
    if (sector.key === 'services_finance') {
        capacity *= 0.7;
    }

    // ── Currency strength modifier ──
    // Affects export VALUE (what appears on trade page).
    // Weak currency = exports are cheaper = lower value per unit.
    // currency_strength 50 = 1.0 (neutral), 25 = 0.5 (cheap), 75 = 1.5 (premium)
    var currencyStrength = Number(nation.currency_strength) || 50;
    var currencyModifier = currencyStrength / 50;
    capacity *= currencyModifier;

    return Math.round(capacity);
}

/**
 * Calculate a nation's import demand for a given sector.
 * Returns raw dollar value of desired imports (after currency + tariff dampening).
 *
 * Each sector has its own demand formula based on what the nation LACKS.
 * Stats are normalized from 0-100 to 0-20 spec scale (/5) for formula consistency.
 * Population is normalized from raw to ~0-20 equivalent (/5M).
 *
 * @param {Object} nation    – nation row (gdp in raw dollars, stats 0-100, population raw)
 * @param {Object} sector    – TRADE_SECTORS entry
 * @param {Object} [opts]    – optional: { defense_budget, has_arms_exports } for arms sector
 * @returns {number} import demand in dollars
 */
function calculateImportDemand(nation, sector, opts) {
    // Export-only sectors have no import demand
    if (sector.export_only) return 0;

    var cfg = TRADE_CONFIG;
    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = gdp / cfg.BASELINE_GDP;

    // Normalize stats from 0-100 codebase scale to 0-20 spec scale
    var SN = 5;   // stat normalizer: divide 0-100 stats by 5
    var PN = 5000000;  // population normalizer: raw pop / 5M ≈ 0-20 equivalent

    var rawDemand = 0;

    // ── FUEL & ENERGY ──
    // Import fuel if you don't produce enough domestically.
    // Driven by inverse of (oil_and_gas + energy_generation).
    if (sector.key === 'fuel_energy') {
        var oilGas = (Number(nation.oil_and_gas) || 0) / SN;
        var energyGen = (Number(nation.energy_generation) || 0) / SN;
        var domesticEnergy = (oilGas + energyGen) / 2;
        var deficiency = Math.max(0, 15 - domesticEnergy);
        rawDemand = deficiency * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;
    }

    // ── MINERALS & RAW MATERIALS ──
    // Import if you lack domestic minerals but have manufacturing that needs inputs.
    // Manufacturing creates demand for raw material imports.
    else if (sector.key === 'minerals') {
        var minerals = (Number(nation.rare_minerals) || 0) / SN;
        var infra = Number(nation.physical_infrastructure) || 0;
        var edu = Number(nation.higher_education) || 0;
        var manufScore = ((infra + edu) / 2) / SN;
        var deficiency = Math.max(0, 12 - minerals);
        rawDemand = deficiency * (manufScore / 10) * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;
    }

    // ── FOOD & AGRICULTURE ──
    // Everyone needs food. Import based on what you can't grow domestically.
    // Uses population as scaling factor (not GDP) — even poor nations need to eat.
    else if (sector.key === 'food_agriculture') {
        var arableLand = (Number(nation.arable_land) || 0) / SN;
        var popNorm = (Number(nation.population) || 1) / PN;
        var sufficiency = arableLand / Math.max(0.1, popNorm * 1.5);
        var deficit = Math.max(0, 1 - sufficiency);
        rawDemand = deficit * popNorm * cfg.BASE_TRADE_MULTIPLIER * 0.8;
    }

    // ── MANUFACTURED GOODS ──
    // Import what you can't make. Consumer demand (population × standard of living)
    // minus domestic production capacity.
    else if (sector.key === 'manufactured_goods') {
        var popNorm = (Number(nation.population) || 1) / PN;
        var sol = (Number(nation.standard_of_living) || 50) / SN;
        var infra = Number(nation.physical_infrastructure) || 0;
        var edu = Number(nation.higher_education) || 0;
        var manufScore = ((infra + edu) / 2) / SN;
        var consumerDemand = popNorm * (sol / 10);
        var domesticManuf = manufScore / 10;
        var deficit = Math.max(0, consumerDemand - domesticManuf);
        rawDemand = deficit * cfg.BASE_TRADE_MULTIPLIER * gdpModifier * 0.6;
    }

    // ── TECHNOLOGY & ELECTRONICS ──
    // Digital infrastructure needs minus domestic tech production.
    else if (sector.key === 'technology') {
        var popNorm = (Number(nation.population) || 1) / PN;
        var digi = (Number(nation.digital_infrastructure) || 0) / SN;
        var edu = Number(nation.higher_education) || 0;
        var techScore = ((Number(nation.digital_infrastructure) || 0) + edu) / 2 / SN;
        var techDemand = popNorm * (digi / 10) * 0.5;
        var domesticTech = techScore / 10;
        var deficit = Math.max(0, techDemand - domesticTech);
        rawDemand = deficit * cfg.BASE_TRADE_MULTIPLIER * gdpModifier * 0.5;
    }

    // ── ARMS & MILITARY EQUIPMENT ──
    // Driven by defense spending minus domestic arms production.
    // 15% of defense budget goes to equipment purchases.
    // Nations with domestic arms industries import less (only 40% of that 15%).
    else if (sector.key === 'arms') {
        var defenseBudget = (opts && opts.defense_budget) || 0;
        var domesticArms = (opts && opts.has_arms_exports) ? 0.6 : 0;
        rawDemand = defenseBudget * 0.15 * (1 - domesticArms);
    }

    if (rawDemand <= 0) return 0;

    // ── Currency strength on imports ──
    // Weak currency makes imports MORE expensive → you can afford LESS.
    // currency_strength 50 = 1.0, 25 = 0.5 (can only afford half), 75 = 1.5
    var currencyStrength = Number(nation.currency_strength) || 50;
    var affordability = currencyStrength / 50;
    rawDemand *= affordability;

    // ── Tariff dampener ──
    // Your own tariffs reduce import volume (makes foreign goods more expensive).
    // tariffs 0 = 1.0 (free trade), 50 = 0.75 (25% reduction), 100 = 0.50 (protectionist)
    var tariffs = Number(nation.tariffs) || 0;
    var tariffDampener = 1 - (tariffs / 200);
    rawDemand *= tariffDampener;

    return Math.round(rawDemand);
}

/**
 * Calculate supply/demand price modifier for a sector across all nations.
 *
 * price_ratio = totalDemand / totalSupply
 * Clamped to [0.5, 2.0] to prevent extreme swings:
 *   0.5 = severe oversupply (prices halved)
 *   1.0 = balanced market
 *   2.0 = severe undersupply (prices doubled)
 *
 * The caller should apply smoothing against the previous tick's price:
 *   smoothed = oldPrice * 0.7 + rawPrice * 0.3
 *
 * @param {number} totalSupply – aggregate export capacity across all nations
 * @param {number} totalDemand – aggregate import demand across all nations
 * @returns {number} price multiplier (0.5–2.0)
 */
function calculatePriceModifier(totalSupply, totalDemand) {
    if (totalSupply <= 0 && totalDemand <= 0) return 1.0;
    if (totalSupply <= 0) return 2.0;   // no supply, max price
    if (totalDemand <= 0) return 0.5;   // no demand, min price

    var ratio = totalDemand / totalSupply;
    return Math.max(0.5, Math.min(2.0, ratio));
}

/**
 * Calculate trade affinity between two nations.
 * Higher affinity = more likely to trade, and more volume flows between them.
 *
 * Components:
 *   base                  50 (neutral starting point)
 *   diplomatic_bonus      relation_score * 0.3           → -30 to +30
 *   trade_agreement       +20 if bilateral trade deal exists
 *   embargo_penalty       -40 if active embargo/sanctions between nations
 *   proximity_bonus       +10 if same region (future)
 *
 * @param {Object} nationA   – nation row
 * @param {Object} nationB   – nation row
 * @param {Object} relation  – diplomatic_relations row { relation_score, active_treaties }
 * @param {Object} [opts]    – { has_trade_agreement, has_embargo, same_region }
 * @returns {number} affinity score 0-100
 */
function calculateTradeAffinity(nationA, nationB, relation, opts) {
    var base = 50;

    // Diplomatic relations: -100 to +100 score → -30 to +30 affinity
    var relScore = (relation && Number(relation.relation_score)) || 0;
    var diplomaticBonus = relScore * 0.3;

    // Bilateral trade agreement: significant affinity boost
    var tradeBonus = (opts && opts.has_trade_agreement) ? 20 : 0;

    // Active embargo/sanctions between these two nations: major penalty
    var embargoPenalty = (opts && opts.has_embargo) ? -40 : 0;

    // Geographic proximity (future: use region data when available)
    var proximityBonus = (opts && opts.same_region) ? 10 : 0;

    var affinity = base + diplomaticBonus + tradeBonus + embargoPenalty + proximityBonus;
    return Math.round(Math.max(0, Math.min(100, affinity)));
}

/**
 * Distribute an exporter's capacity among importing partners.
 *
 * Each importer receives a share proportional to their weight:
 *   weight_i = affinity_i × demand_i
 *   volume_i = exportCapacity × (weight_i / totalWeight)
 *
 * Volume is also capped at each importer's actual demand (can't import
 * more than you need). Any leftover capacity is redistributed.
 *
 * @param {number} exportCapacity – exporter's total capacity in this sector ($)
 * @param {Array}  importers      – [{ nation_id, demand, affinity }, ...]
 * @returns {Array} [{ importer_nation_id, volume }, ...] – only entries with volume > 0
 */
function distributeTradeAmongPartners(exportCapacity, importers) {
    if (!exportCapacity || exportCapacity <= 0 || !importers || importers.length === 0) {
        return [];
    }

    // Calculate weights: affinity × demand
    var weighted = [];
    var totalWeight = 0;
    for (var i = 0; i < importers.length; i++) {
        var imp = importers[i];
        var aff = Number(imp.affinity) || 0;
        var dem = Number(imp.demand) || 0;
        if (aff <= 0 || dem <= 0) continue;
        var w = aff * dem;
        weighted.push({ nation_id: imp.nation_id, demand: dem, weight: w });
        totalWeight += w;
    }

    if (totalWeight <= 0 || weighted.length === 0) return [];

    // Distribute proportionally, capped at each importer's demand.
    // Two passes: first pass allocates, second pass redistributes any surplus
    // from capped importers to remaining partners.
    var results = [];
    var remaining = exportCapacity;

    // Sort by weight descending so high-affinity partners fill first
    weighted.sort(function (a, b) { return b.weight - a.weight; });

    // Pass 1: proportional allocation, capped at demand
    var uncapped = [];
    var uncappedWeight = 0;
    for (var i = 0; i < weighted.length; i++) {
        var share = exportCapacity * (weighted[i].weight / totalWeight);
        if (share > weighted[i].demand) {
            // Capped: this importer only takes what they need
            results.push({ importer_nation_id: weighted[i].nation_id, volume: Math.round(weighted[i].demand) });
            remaining -= weighted[i].demand;
        } else {
            uncapped.push({ idx: results.length, nation_id: weighted[i].nation_id, demand: weighted[i].demand, weight: weighted[i].weight, share: share });
            uncappedWeight += weighted[i].weight;
            results.push({ importer_nation_id: weighted[i].nation_id, volume: 0 }); // placeholder
        }
    }

    // Pass 2: distribute remaining capacity among uncapped importers
    if (uncappedWeight > 0 && remaining > 0) {
        for (var i = 0; i < uncapped.length; i++) {
            var alloc = remaining * (uncapped[i].weight / uncappedWeight);
            alloc = Math.min(alloc, uncapped[i].demand);
            results[uncapped[i].idx].volume = Math.round(alloc);
        }
    }

    // Filter out zero-volume entries
    return results.filter(function (r) { return r.volume > 0; });
}

/**
 * Derive trade_balance stat (0-100) from raw trade surplus/deficit.
 *
 * Maps surplus as a ratio of GDP onto a 0-100 index:
 *   50 = balanced trade (surplus ≈ 0)
 *   100 = large trade surplus (+10% of GDP or more)
 *   0 = large trade deficit (-10% of GDP or more)
 *
 * Formula: 50 + (tradeSurplus / gdp) * 500
 * Scaled so ±10% of GDP spans the full 0-100 range.
 *
 * @param {number} tradeSurplus – totalExports - totalImports (can be negative)
 * @param {number} gdp          – nation's GDP in raw dollars
 * @returns {number} trade balance index 0-100
 */
function deriveTradeBalanceIndex(tradeSurplus, gdp) {
    if (!gdp || gdp <= 0) return 50;
    var ratio = tradeSurplus / gdp;
    var index = 50 + (ratio * 500);
    return Math.round(Math.max(0, Math.min(100, index)) * 10) / 10;
}

/**
 * Calculate tariff revenue from actual import volumes.
 *
 * tariff_revenue = totalImports × (tariffRate / 100) × collectionRate
 *
 * tariffRate is the nation's tariff stat (0-100).
 * collectionRate is how efficiently tariffs are collected (0-1),
 * typically derived from bureaucratic efficiency (~0.7 average).
 *
 * @param {number} totalImports    – actual dollar value of all imports this tick
 * @param {number} tariffRate      – nation's tariff stat (0-100)
 * @param {number} collectionRate  – collection efficiency 0-1 (default 0.7)
 * @returns {number} tariff revenue in dollars
 */
function calculateTariffRevenue(totalImports, tariffRate, collectionRate) {
    if (!totalImports || totalImports <= 0) return 0;
    var rate = (Number(tariffRate) || 0) / 100;
    var efficiency = (collectionRate != null) ? Number(collectionRate) : 0.7;
    return Math.round(totalImports * rate * efficiency);
}

/**
 * Main trade engine — runs once per tick for ALL nations simultaneously.
 *
 * Pipeline:
 *   1. Compute per-nation per-sector export capacity + import demand
 *   2. Aggregate supply/demand per sector → price modifiers (with smoothing)
 *   3. Fetch diplomatic relations → compute bilateral affinity
 *   4. For each exporter-sector, distribute capacity among importers (weighted by affinity × demand)
 *   5. Write trade_flows, trade_partners, trade_summary rows
 *   6. Update nation trade_balance stat + add tariff revenue
 *
 * @param {Object} supabase     – Supabase client
 * @param {Array}  nationList   – array of nation rows (already fetched)
 * @param {number} currentTick  – current game tick
 * @returns {Object} { processed, totalVolume }
 */
async function processTradeFlows(supabase, nationList, currentTick) {
    if (!nationList || nationList.length < 2) {
        console.log('[processTradeFlows] Need at least 2 nations for trade, skipping');
        return { processed: 0, totalVolume: 0 };
    }

    var cfg = TRADE_CONFIG;
    var sectors = TRADE_SECTORS;
    var nationCount = nationList.length;

    // Build nation lookup by id
    var nationMap = {};
    for (var ni = 0; ni < nationCount; ni++) {
        nationMap[nationList[ni].id] = nationList[ni];
    }

    // ── Step 1: Compute per-nation budget info (for arms sector opts) ──
    var budgetMap = {};
    for (var ni = 0; ni < nationCount; ni++) {
        var n = nationList[ni];
        budgetMap[n.id] = calculateNationalBudget(n);
    }

    // ── Step 2: Compute export capacity + import demand for every nation × sector ──
    // nationFlows[nationId][sectorKey] = { exportCapacity, importDemand }
    var nationFlows = {};
    // sectorAgg[sectorKey] = { totalSupply, totalDemand }
    var sectorAgg = {};

    for (var si = 0; si < sectors.length; si++) {
        sectorAgg[sectors[si].key] = { totalSupply: 0, totalDemand: 0 };
    }

    for (var ni = 0; ni < nationCount; ni++) {
        var n = nationList[ni];
        nationFlows[n.id] = {};

        for (var si = 0; si < sectors.length; si++) {
            var sector = sectors[si];

            // Arms sector needs special opts
            var exportOpts = null;
            var importOpts = null;
            if (sector.key === 'arms') {
                // Estimate defense allocation as 10% of available budget (default assumption)
                var avail = budgetMap[n.id].availableBudget || 0;
                var defenseBudget = avail * 0.10;
                exportOpts = { defense_pct: 10 };
                importOpts = { defense_budget: defenseBudget, has_arms_exports: false };
            }

            var expCap = calculateExportCapacity(n, sector, exportOpts);
            var impDem = calculateImportDemand(n, sector, importOpts);

            // Check if this nation can export arms (for import reduction)
            if (sector.key === 'arms' && expCap > 0 && importOpts) {
                importOpts.has_arms_exports = true;
                impDem = calculateImportDemand(n, sector, importOpts);
            }

            nationFlows[n.id][sector.key] = { exportCapacity: expCap, importDemand: impDem };
            sectorAgg[sector.key].totalSupply += expCap;
            sectorAgg[sector.key].totalDemand += impDem;
        }
    }

    // ── Step 3: Price modifiers per sector (with smoothing from previous tick) ──
    var priceModifiers = {};
    var prevPrices = {};

    // Fetch previous tick's price modifiers for smoothing
    var prevTick = currentTick - 1;
    if (prevTick > 0) {
        var { data: prevFlows } = await supabase.from('trade_flows')
            .select('sector, price_modifier')
            .eq('tick', prevTick)
            .limit(sectors.length);
        if (prevFlows) {
            for (var i = 0; i < prevFlows.length; i++) {
                prevPrices[prevFlows[i].sector] = Number(prevFlows[i].price_modifier) || 1.0;
            }
        }
    }

    for (var si = 0; si < sectors.length; si++) {
        var key = sectors[si].key;
        var rawPrice = calculatePriceModifier(sectorAgg[key].totalSupply, sectorAgg[key].totalDemand);
        var oldPrice = prevPrices[key] || 1.0;
        // Smoothing: 70% old price + 30% new signal → prevents wild swings
        priceModifiers[key] = oldPrice * 0.7 + rawPrice * 0.3;
    }

    // ── Step 4: Fetch diplomatic relations + proposals for affinity ──
    var { data: relations } = await supabase.from('diplomatic_relations')
        .select('nation_a_id, nation_b_id, relation_score, active_treaties, proximity');

    var { data: activeProposals } = await supabase.from('diplomatic_proposals')
        .select('id, proposal_type, proposing_nation_id, target_nation_id')
        .eq('status', 'active')
        .in('proposal_type', ['trade_agreement', 'embargo']);

    // Build relation lookup: relMap["idA|idB"] = { relation_score, active_treaties, proximity }
    var relMap = {};
    if (relations) {
        for (var i = 0; i < relations.length; i++) {
            var r = relations[i];
            var k1 = r.nation_a_id + '|' + r.nation_b_id;
            var k2 = r.nation_b_id + '|' + r.nation_a_id;
            relMap[k1] = r;
            relMap[k2] = r;
        }
    }

    // Build bilateral flags from active proposals
    // flagsMap["idA|idB"] = { has_trade_agreement, has_embargo }
    var flagsMap = {};
    if (activeProposals) {
        for (var i = 0; i < activeProposals.length; i++) {
            var p = activeProposals[i];
            var k1 = p.proposing_nation_id + '|' + p.target_nation_id;
            var k2 = p.target_nation_id + '|' + p.proposing_nation_id;
            if (!flagsMap[k1]) flagsMap[k1] = {};
            if (!flagsMap[k2]) flagsMap[k2] = {};
            if (p.proposal_type === 'trade_agreement') {
                flagsMap[k1].has_trade_agreement = true;
                flagsMap[k2].has_trade_agreement = true;
            }
            if (p.proposal_type === 'embargo') {
                flagsMap[k1].has_embargo = true;
                flagsMap[k2].has_embargo = true;
            }
        }
    }

    // Pre-compute all bilateral affinities
    // affinityMap["exporterId|importerId"] = affinity score 0-100
    var affinityMap = {};
    for (var ai = 0; ai < nationCount; ai++) {
        for (var bi = ai + 1; bi < nationCount; bi++) {
            var a = nationList[ai];
            var b = nationList[bi];
            var pairKey = a.id + '|' + b.id;
            var rel = relMap[pairKey] || null;
            var flags = flagsMap[pairKey] || {};
            if (rel && rel.proximity >= 80) flags.same_region = true;
            var aff = calculateTradeAffinity(a, b, rel, flags);
            affinityMap[a.id + '|' + b.id] = aff;
            affinityMap[b.id + '|' + a.id] = aff;
        }
    }

    // ── Step 5: Distribute trade — for each exporter×sector, match to importers ──
    // Track actual volumes: actualExports[nationId][sector], actualImports[nationId][sector]
    var actualExports = {};
    var actualImports = {};
    for (var ni = 0; ni < nationCount; ni++) {
        actualExports[nationList[ni].id] = {};
        actualImports[nationList[ni].id] = {};
        for (var si = 0; si < sectors.length; si++) {
            actualExports[nationList[ni].id][sectors[si].key] = 0;
            actualImports[nationList[ni].id][sectors[si].key] = 0;
        }
    }

    var partnerRows = [];

    for (var si = 0; si < sectors.length; si++) {
        var sector = sectors[si];
        var priceMod = priceModifiers[sector.key];

        for (var ei = 0; ei < nationCount; ei++) {
            var exporter = nationList[ei];
            var expCap = nationFlows[exporter.id][sector.key].exportCapacity;
            if (expCap <= 0) continue;

            // Apply price modifier to export capacity
            var adjustedCapacity = Math.round(expCap * priceMod);

            // Build importer list for this exporter (everyone else with demand > 0)
            var importerList = [];
            for (var ii = 0; ii < nationCount; ii++) {
                if (ii === ei) continue;
                var importer = nationList[ii];
                var impDem = nationFlows[importer.id][sector.key].importDemand;
                // Subtract what they've already received from other exporters
                var remainingDemand = impDem - actualImports[importer.id][sector.key];
                if (remainingDemand <= 0) continue;

                var aff = affinityMap[exporter.id + '|' + importer.id] || 0;
                if (aff <= 0) continue;

                importerList.push({
                    nation_id: importer.id,
                    demand: remainingDemand,
                    affinity: aff
                });
            }

            if (importerList.length === 0) continue;

            // Distribute this exporter's capacity among importers
            var allocations = distributeTradeAmongPartners(adjustedCapacity, importerList);

            for (var ai = 0; ai < allocations.length; ai++) {
                var alloc = allocations[ai];
                if (alloc.volume <= 0) continue;

                actualExports[exporter.id][sector.key] += alloc.volume;
                actualImports[alloc.importer_nation_id][sector.key] += alloc.volume;

                partnerRows.push({
                    tick: currentTick,
                    exporter_nation_id: exporter.id,
                    importer_nation_id: alloc.importer_nation_id,
                    sector: sector.key,
                    trade_volume: alloc.volume,
                    affinity_score: affinityMap[exporter.id + '|' + alloc.importer_nation_id] || 0
                });
            }
        }
    }

    // ── Step 6: Build trade_flows + trade_summary rows, update nation stats ──
    var flowRows = [];
    var summaryRows = [];
    var totalGlobalVolume = 0;

    for (var ni = 0; ni < nationCount; ni++) {
        var n = nationList[ni];
        var totalExp = 0;
        var totalImp = 0;
        var topExpSector = null;
        var topExpVal = 0;
        var topImpSector = null;
        var topImpVal = 0;

        for (var si = 0; si < sectors.length; si++) {
            var sKey = sectors[si].key;
            var expVol = actualExports[n.id][sKey] || 0;
            var impVol = actualImports[n.id][sKey] || 0;
            totalExp += expVol;
            totalImp += impVol;

            if (expVol > topExpVal) { topExpVal = expVol; topExpSector = sKey; }
            if (impVol > topImpVal) { topImpVal = impVol; topImpSector = sKey; }

            flowRows.push({
                nation_id: n.id,
                tick: currentTick,
                sector: sKey,
                export_capacity: nationFlows[n.id][sKey].exportCapacity,
                export_volume: expVol,
                import_demand: nationFlows[n.id][sKey].importDemand,
                import_volume: impVol,
                net_flow: expVol - impVol,
                price_modifier: priceModifiers[sKey]
            });
        }

        var surplus = totalExp - totalImp;
        var gdp = Number(n.gdp) || 0;
        var tradeBalanceIdx = deriveTradeBalanceIndex(surplus, gdp);

        // Tariff revenue: based on actual imports
        var budget = budgetMap[n.id];
        var tariffRate = Number(n.tariffs) || 0;
        var collectionRate = budget ? budget.collectionRate : 0.7;
        var tariffRev = calculateTariffRevenue(totalImp, tariffRate, collectionRate);

        summaryRows.push({
            nation_id: n.id,
            tick: currentTick,
            total_exports: totalExp,
            total_imports: totalImp,
            trade_surplus: surplus,
            trade_balance_index: tradeBalanceIdx,
            tariff_revenue: tariffRev,
            top_export_sector: topExpSector,
            top_import_sector: topImpSector,
            dependency_alerts: []
        });

        totalGlobalVolume += totalExp;

        // Update the nation's trade_balance stat
        await supabase.from('nations')
            .update({ trade_balance: tradeBalanceIdx })
            .eq('id', n.id);
    }

    // ── Step 7: Write to database ──
    // Insert trade_flows in batches (8 sectors × N nations)
    if (flowRows.length > 0) {
        var { error: flowErr } = await supabase.from('trade_flows').upsert(flowRows, {
            onConflict: 'nation_id,tick,sector'
        });
        if (flowErr) console.error('[processTradeFlows] trade_flows upsert error:', flowErr.message);
    }

    // Insert trade_partners in batches
    if (partnerRows.length > 0) {
        // Batch in chunks of 500 to avoid payload limits
        var BATCH = 500;
        for (var bi = 0; bi < partnerRows.length; bi += BATCH) {
            var chunk = partnerRows.slice(bi, bi + BATCH);
            var { error: partErr } = await supabase.from('trade_partners').upsert(chunk, {
                onConflict: 'tick,exporter_nation_id,importer_nation_id,sector'
            });
            if (partErr) console.error('[processTradeFlows] trade_partners upsert error:', partErr.message);
        }
    }

    // Insert trade_summary
    if (summaryRows.length > 0) {
        var { error: sumErr } = await supabase.from('trade_summary').upsert(summaryRows, {
            onConflict: 'nation_id,tick'
        });
        if (sumErr) console.error('[processTradeFlows] trade_summary upsert error:', sumErr.message);
    }

    console.log('[processTradeFlows] tick ' + currentTick + ': ' + nationCount + ' nations, ' +
        flowRows.length + ' flow rows, ' + partnerRows.length + ' partner rows, ' +
        'total volume $' + Math.round(totalGlobalVolume).toLocaleString());

    return { processed: nationCount, totalVolume: totalGlobalVolume };
}

// Canonical government types used by nation state + ministry event template variants.
const MINISTRY_EVENT_GOV_TYPES = Object.freeze(['Democracy', 'Autocracy', 'Presidential']);

/**
 * Update GAME_CONFIG with nation-specific seat values.
 * Call after loading the nation on each page.
 */
function initGameConfigForNation(nation) {
    if (nation && nation.total_seats) {
        GAME_CONFIG.TOTAL_SEATS = nation.total_seats;
        GAME_CONFIG.MAJORITY_SEATS = Math.floor(nation.total_seats / 2) + 1;
    }
}

const FORMATION_DEADLINE_TICKS = 6; // ticks before snap election when no government
const SNAP_COOLDOWN_GAP = FORMATION_DEADLINE_TICKS + 2; // 8 — if two elections are this close, it's a snap cycle

/**
 * Atomic AP deduction via database RPC.
 * Returns { success: true, newAp } on success, or { success: false, error } on failure.
 * The DB function checks balance and deducts in a single UPDATE, preventing race conditions.
 */
async function deductAP(supabase, factionId, cost) {
    const { data, error } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: cost
    });
    if (error) {
        console.error(`[deductAP] RPC failed for faction ${factionId}, cost ${cost}:`, error.message);
        return { success: false, error: error.message };
    }
    if (data === -1) {
        return { success: false, error: 'Insufficient AP' };
    }
    // Update inactivity clock on every successful AP spend
    markFactionActive(supabase, factionId).catch(() => {});
    return { success: true, newAp: data };
}

/**
 * Atomic AP accumulation via database RPC.
 * Returns { success: true, newAp } on success, or { success: false, error } on failure.
 * The DB function atomically increments AP capped at max, preventing race conditions
 * with concurrent deductions.
 * Retries up to 2 additional times on transient RPC failure with short backoff.
 */
async function accumulateAP(supabase, factionId, gain, maxAp = GAME_CONFIG.MAX_AP) {
    const { data, error } = await supabase.rpc('accumulate_ap', {
        p_faction_id: factionId,
        p_gain: gain,
        p_max_ap: maxAp
    });
    if (error) {
        console.error(`[accumulateAP] RPC failed for faction ${factionId}, gain ${gain}:`, error.message);
        return { success: false, error: error.message };
    }
    if (data === -1) {
        return { success: false, error: 'Faction not found' };
    }
    return { success: true, newAp: data };
}

/**
 * Government type helpers.
 * Call with a nation object (must have government_type field).
 */
const CANONICAL_GOVERNMENT_TYPES = Object.freeze({
    PARLIAMENTARY_DEMOCRACY: 'Democracy',
    AUTOCRACY: 'Autocracy',
    PRESIDENTIAL_REPUBLIC: 'Presidential'
});

const GOVERNMENT_TYPE_ALIASES = Object.freeze({
    democracy: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    democratic: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    parliamentary: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    parliamentarian: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    'parliamentary democracy': CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    autocracy: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    authoritarian: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    authoritarianism: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    dictatorship: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    dictatorial: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    'military junta': CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    presidential: CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'presidential republic': CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'executive presidency': CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC
});

function getCanonicalGovernmentType(input, fallbackType = CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY) {
    const govType = typeof input === 'string' ? input : input?.government_type;
    if (typeof govType !== 'string') return fallbackType;
    return GOVERNMENT_TYPE_ALIASES[govType.trim().toLowerCase()] || fallbackType;
}

function isAutocracy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.AUTOCRACY; }
function isParliamentaryDemocracy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY; }
function isPresidentialRepublic(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC; }

function isGovernmentAutocracy(nation) { return isAutocracy(nation); }
function isGovernmentPresidential(nation) { return isPresidentialRepublic(nation); }

// Canonical government types used by nations and ministry event templates.
const canonicalNationGovTypes = ['Autocracy', 'Parliamentary Republic', 'Presidential'];

// Temporary aliases to support migration from legacy gov-type strings.
// TODO(next migration stub): remove aliases and require strict canonical-only values.
const legacyAliasMap = {
    Democracy: 'Parliamentary Republic'
};

function canonicalizeNationGovType(govType) {
    if (!govType) return null;
    return legacyAliasMap[govType] || govType;
}

function templateSupportsNationGovType(templateGovTypes, nationGovTypeRaw) {
    const nationGovTypeCanonical = canonicalizeNationGovType(nationGovTypeRaw);
    const templateGovTypesRaw = Array.isArray(templateGovTypes) ? templateGovTypes : [];
    const templateGovTypesCanonical = [...new Set(templateGovTypesRaw.map(canonicalizeNationGovType).filter(Boolean))];
    return {
        matches: !!nationGovTypeCanonical && templateGovTypesCanonical.includes(nationGovTypeCanonical),
        nationGovTypeCanonical,
        templateGovTypesRaw,
        templateGovTypesCanonical
    };
}

// ==================== DIPLOMACY CONSTANTS ====================

const DIPLOMACY_CONFIG = {
    // Ambassador actions
    FORMAL_PROTEST_AP: 2,
    PROPOSE_INITIATIVE_AP: 3,
    COVERT_OP_AP: 4,

    // Foreign Minister actions
    RECALL_AMBASSADOR_AP: 2,
    IMPOSE_EMBARGO_AP: 5,
    FOREIGN_AID_AP: 4,
    ISSUE_ULTIMATUM_AP: 3,

    // Head of Government actions
    DECLARE_WAR_AP: 8,
    SUE_FOR_PEACE_AP: 4,
    SIGN_ALLIANCE_AP: 6,

    // Timing
    FM_REVIEW_EXPIRY_TICKS: 3,
    ULTIMATUM_DEADLINE_TICKS: 3,
    STATE_VISIT_ACCEPT_WINDOW: 2,
    STATE_VISIT_COOLDOWN: 6,
    TREATY_RATIFICATION_VOTING_TICKS: 6,
    AMBASSADOR_CONFIRMATION_VOTING_TICKS: 6,
    AMBASSADOR_TERM_LENGTH: 36,         // ticks (36 ticks = 3 years)
    AMBASSADOR_RETIREMENT_WARNING: 3,   // warn this many ticks before retirement

    // War stat penalties (per tick)
    WAR_STABILITY_DRAIN: 2,
    WAR_CIVIL_UNREST_GAIN: 3,
    WAR_TRADE_DRAIN: 2,
    WAR_REPUTATION_DRAIN: 1,

    // Reputation costs
    WAR_WITH_JUSTIFICATION_REP_COST: 3,
    WAR_WITHOUT_JUSTIFICATION_REP_COST: 10,
    FORMAL_PROTEST_TARGET_REP_COST: 1,

    // Covert operation success thresholds (0-1, higher = harder)
    COVERT_INTEL_THRESHOLD: 0.45,
    COVERT_PROPAGANDA_THRESHOLD: 0.55,
    COVERT_BRIBE_THRESHOLD: 0.60,

    // Trade negotiation AP costs
    PROPOSE_TRADE_NEGOTIATION_AP: 1,      // Ambassador or MoT proposes trade negotiations
    ACCEPT_TRADE_NEGOTIATION_AP: 1,       // Other ambassador or MoT accepts
    JOIN_NEGOTIATION_PM_AP: 2,            // PM/HoG party joins negotiation
    JOIN_NEGOTIATION_FM_AP: 1,            // FM party joins
    JOIN_NEGOTIATION_MOT_AP: 2,           // Minister of Trade joins (required)
    HOG_DRAFT_INITIATIVE_AP: 3,           // HoG drafting when no ambassador (penalty)
    MOT_JOIN_DEADLINE_TICKS: 4,           // Ticks before negotiations cancel if MoT hasn't joined

    // Trade negotiation timing
    NEGOTIATION_DEFAULT_DURATION: 4,      // ticks until negotiation expires
    NEGOTIATION_EXTENSION_TICKS: 12,      // ticks added per extension (1 month)
    NEGOTIATION_MAX_EXTENSIONS: 3,        // max times negotiations can be extended
    TRADE_RATIFICATION_VOTING_TICKS: 6    // ticks for parliament to vote on trade bill
};

/**
 * Trade Agreement types that can be negotiated as Diplomatic Initiatives.
 *
 * 4 types:
 *   FTA  — Free Trade Agreement: comprehensive tariff elimination
 *   PTA  — Preferential Tariff Agreement: sector-specific tariff reduction
 *   RSC  — Resource Supply Contract: guaranteed purchase commitment
 *   ES   — Export Subsidy: unilateral, no partner needed
 */
const TRADE_AGREEMENT_TYPES = {
    fta: {
        key: 'fta',
        label: 'Free Trade Agreement',
        shortLabel: 'FTA',
        description: 'Comprehensive tariff elimination between two nations. Removes all tariffs across all sectors unless specific exemptions are carved out.',
        bilateral: true,
        required_articles: ['duration'],
        optional_articles: ['sector_exemption', 'text_article'],
        icon: 'handshake'
    },
    pta: {
        key: 'pta',
        label: 'Preferential Tariff Agreement',
        shortLabel: 'PTA',
        description: 'Sector-specific tariff reduction. Each side can negotiate different reductions for different sectors and directions.',
        bilateral: true,
        required_articles: ['tariff_reduction', 'duration'],
        optional_articles: ['text_article'],
        icon: 'chart'
    },
    resource_supply: {
        key: 'resource_supply',
        label: 'Resource Supply Contract',
        shortLabel: 'RSC',
        description: 'Guaranteed purchase commitment for raw resources. The buyer commits to purchasing a minimum percentage from the seller.',
        bilateral: true,
        required_articles: ['supply_commitment', 'price_terms', 'duration'],
        optional_articles: ['breach_penalty', 'text_article'],
        icon: 'truck'
    },
    export_subsidy: {
        key: 'export_subsidy',
        label: 'Export Subsidy',
        shortLabel: 'ES',
        description: 'Unilateral policy — subsidize your own exporters to make goods cheaper on the international market. No partner nation needed.',
        bilateral: false,
        required_articles: ['subsidized_sector', 'duration', 'funding_source'],
        optional_articles: ['text_article'],
        icon: 'money'
    }
};

/**
 * The 6 tradeable sectors for trade agreements.
 * Subset of the full 8 TRADE_SECTORS (excludes tourism and services_finance).
 */
const TRADEABLE_SECTORS = [
    { key: 'fuel_energy',        label: 'Fuel & Energy',            raw_resource: true  },
    { key: 'minerals',           label: 'Minerals & Raw Materials', raw_resource: true  },
    { key: 'food_agriculture',   label: 'Food & Agriculture',       raw_resource: true  },
    { key: 'manufactured_goods', label: 'Manufactured Goods',       raw_resource: false },
    { key: 'technology',         label: 'Technology & Electronics', raw_resource: false },
    { key: 'arms',               label: 'Arms & Military Equipment', raw_resource: false }
];

// Lookup map for tradeable sectors
var TRADEABLE_SECTOR_MAP = {};
for (var _tasi = 0; _tasi < TRADEABLE_SECTORS.length; _tasi++) {
    TRADEABLE_SECTOR_MAP[TRADEABLE_SECTORS[_tasi].key] = TRADEABLE_SECTORS[_tasi];
}

/**
 * Article type definitions for trade agreements.
 * Each defines the schema of what data the article captures.
 */
const TRADE_ARTICLE_TYPES = {
    // ── Duration (required for all types) ──
    duration: {
        key: 'duration',
        label: 'Duration',
        description: 'How long the agreement lasts.',
        repeatable: false,
        schema: {
            duration_type: 'permanent|fixed',   // permanent or fixed term
            duration_ticks: 'number',           // min 8, max 48 for FTA/PTA; min 8, max 36 for RSC; min 4, max 24 for ES
            auto_renew: 'boolean',              // only for fixed term
            withdrawal_notice_ticks: 'number'   // 1-6 ticks notice to withdraw
        }
    },

    // ── Sector Exemption (FTA only, optional) ──
    sector_exemption: {
        key: 'sector_exemption',
        label: 'Sector Exemption',
        description: 'Exempt specific sectors from the FTA.',
        repeatable: true,
        applies_to: ['fta'],
        schema: {
            sector: 'string',                   // tradeable sector key
            reason: 'string'                    // optional flavor text
        }
    },

    // ── Tariff Reduction (PTA, required, repeatable per sector) ──
    tariff_reduction: {
        key: 'tariff_reduction',
        label: 'Tariff Reduction',
        description: 'Reduce tariffs on a specific sector.',
        repeatable: true,
        applies_to: ['pta'],
        schema: {
            sector: 'string',                   // tradeable sector key
            direction: 'mutual|your_exports|their_exports',
            reduction_pct: 'number'             // 0-100 (100 = full elimination)
        }
    },

    // ── Supply Commitment (RSC, required) ──
    supply_commitment: {
        key: 'supply_commitment',
        label: 'Supply Commitment',
        description: 'Guaranteed purchase commitment for a raw resource.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            sector: 'string',                   // must be raw_resource sector
            direction: 'we_buy|we_sell',        // who is buyer vs seller
            commitment_pct: 'number'            // 10-90%
        }
    },

    // ── Price Terms (RSC, required) ──
    price_terms: {
        key: 'price_terms',
        label: 'Price Terms',
        description: 'How the resource price is determined.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            price_type: 'market|fixed|discounted|premium',
            modifier_pct: 'number'              // discount/premium percentage (0-25)
        }
    },

    // ── Breach Penalty (RSC, optional) ──
    breach_penalty: {
        key: 'breach_penalty',
        label: 'Breach Penalty',
        description: 'Penalties if either party breaks the contract early.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            relations_penalty: 'number',        // 1-8
            reputation_penalty: 'number',       // 0-4
            financial_penalty: 'number'         // 0-500 (in millions)
        }
    },

    // ── Subsidized Sector (Export Subsidy, required) ──
    subsidized_sector: {
        key: 'subsidized_sector',
        label: 'Export Subsidy',
        description: 'Subsidize exports in a specific sector.',
        repeatable: false,
        applies_to: ['export_subsidy'],
        schema: {
            sector: 'string',                   // any tradeable sector
            subsidy_pct: 'number'               // 5-30%
        }
    },

    // ── Funding Source (Export Subsidy, required) ──
    funding_source: {
        key: 'funding_source',
        label: 'Funding Source',
        description: 'Where the subsidy money comes from.',
        repeatable: false,
        applies_to: ['export_subsidy'],
        schema: {
            source: 'general_treasury|ministry_budget'
        }
    },

    // ── Text Article (optional for all types) ──
    text_article: {
        key: 'text_article',
        label: 'Text Article',
        description: 'Free-text article for flavor/RP. No mechanical effect.',
        repeatable: true,
        applies_to: ['fta', 'pta', 'resource_supply', 'export_subsidy'],
        schema: {
            title: 'string',
            body: 'string'
        }
    }
};

/**
 * Diplomatic proposal types with tier classification.
 * Tier 1 = Minor (ambassador approves directly)
 * Tier 2 = FM approval needed (no bill)
 * Tier 3 = Requires Parliament ratification bill
 */
const PROPOSAL_TYPES = {
    // === Tier 1: Minor — Ambassador approves directly ===
    cultural_exchange: {
        tier: 1,
        label: 'Cultural Exchange',
        description: 'Establish cultural exchange programs between nations.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    visa_agreement: {
        tier: 1,
        label: 'Visa Agreement',
        description: 'Simplify visa requirements for travel between nations.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'immigration', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    joint_statement: {
        tier: 1,
        label: 'Joint Statement',
        description: 'Issue a joint diplomatic statement signaling cooperation.',
        stat_effects: []  // Purely cosmetic — shows in event feeds
    },
    student_exchange: {
        tier: 1,
        label: 'Student Exchange',
        description: 'Create student exchange programs to boost education.',
        stat_effects: [
            { stat_key: 'higher_education', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },

    // === Tier 3: Major — Escalates to FM, then Parliament ratification bill ===
    non_aggression_pact: {
        tier: 3,
        label: 'Non-Aggression Pact',
        description: 'Binding commitment not to declare war for a set period.',
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    military_alliance: {
        tier: 3,
        label: 'Military Alliance',
        description: 'Mutual defense pact — if one is attacked, the other must respond.',
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    embargo: {
        tier: 3,
        label: 'Embargo/Sanctions',
        description: 'Economic warfare — tanks target trade stats, also hurts your own.',
        stat_effects: [
            { stat_key: 'trade_balance', direction: 'down', rate: 3, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'sanctions', direction: 'up', rate: 3, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    ceasefire: {
        tier: 3,
        label: 'Ceasefire',
        description: 'Stop active conflict between warring nations.',
        requires_war: true,
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'civil_unrest', direction: 'down', rate: 2, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    open_borders: {
        tier: 3,
        label: 'Open Borders',
        description: 'Major immigration and security implications — open borders between nations.',
        stat_effects: [
            { stat_key: 'immigration', direction: 'up', rate: 3, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'trade_balance', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    close_embassy: {
        tier: 3,
        label: 'Close Embassy',
        description: 'Shut down diplomatic presence in the target nation.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'down', rate: 2, delay_ticks: 0, duration_ticks: 1 }
        ]
    }
};

// War justification types — required for declaring war without massive reputation penalty
const WAR_JUSTIFICATIONS = {
    ultimatum_ignored:    { label: 'Ignored Ultimatum',     description: 'A formal ultimatum was ignored by the target nation.' },
    caught_spy:           { label: 'Caught Spy',            description: 'A covert agent from the target nation was caught operating in your territory.' },
    broken_treaty:        { label: 'Broken Treaty',         description: 'The target nation violated an existing treaty or agreement.' },
    attacked:             { label: 'Attacked',              description: 'Your nation was attacked by the target nation.' },
    alliance_obligation:  { label: 'Alliance Obligation',   description: 'An allied nation was attacked, triggering mutual defense obligations.' }
};

const MAJOR_SECTORS = [
    { key: 'ECONOMICS',     label: 'Economics',           icon: '💰' },
    { key: 'LABOR',         label: 'Labor',               icon: '👷' },
    { key: 'EDUCATION',     label: 'Education',           icon: '📚' },
    { key: 'ENERGY',        label: 'Energy',              icon: '⚡' },
    { key: 'WELFARE',       label: 'Welfare',             icon: '🏥' },
    { key: 'SOCIAL',        label: 'Social',              icon: '🤝' },
    { key: 'MILITARY',      label: 'Military & Security', icon: '🛡️' },
    { key: 'GOVERNANCE',    label: 'Governance',          icon: '🏛️' },
    { key: 'IMMIGRATION',   label: 'Immigration',         icon: '🌍' },
    { key: 'INTERNATIONAL', label: 'International',       icon: '🌐' },
    { key: 'TRADE',         label: 'Trade',               icon: '📦' }
];

// Policy Platform stances — each sector has 4 stances, each leaning toward 2 ideology poles.
// Used by the "Policy Platform" campaign action (3 AP).
const POLICY_STANCES = {
    ECONOMICS: [
        { key: 'free_market_reform',  name: 'Free Market Reform',  desc: 'Deregulate industries and lower trade barriers.',          poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'workers_first',       name: 'Workers First',       desc: 'Strengthen labor protections and raise minimum wages.',    poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'protectionist_trade', name: 'Protectionist Trade', desc: 'Shield domestic industries with tariffs and subsidies.',   poles: ['INDIVIDUALISM', 'TRADITION'] },
        { key: 'green_economy',       name: 'Green Economy',       desc: 'Invest in sustainable industries and green jobs.',         poles: ['PROGRESS', 'COLLECTIVISM'] }
    ],
    LABOR: [
        { key: 'business_friendly', name: 'Business Friendly', desc: 'Reduce regulations and empower employers.',             poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'union_power',       name: 'Union Power',       desc: 'Strengthen unions and collective bargaining.',           poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'full_employment',   name: 'Full Employment',   desc: 'Government programs to guarantee jobs for all.',         poles: ['COLLECTIVISM', 'SECURITY'] },
        { key: 'gig_economy',       name: 'Gig Economy',       desc: 'Embrace flexible work arrangements and innovation.',    poles: ['LIBERTY', 'PROGRESS'] }
    ],
    EDUCATION: [
        { key: 'religious_schooling', name: 'Religious Schooling', desc: 'Expand faith-based education and traditional curricula.', poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'universal_access',    name: 'Universal Access',    desc: 'Guarantee free education for all citizens.',              poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'stem_investment',     name: 'STEM Investment',     desc: 'Prioritize science and technology programs.',             poles: ['PROGRESS', 'LIBERTY'] },
        { key: 'vocational_focus',    name: 'Vocational Focus',    desc: 'Expand trade schools and apprenticeship programs.',       poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    ENERGY: [
        { key: 'nuclear_power',        name: 'Nuclear Power',        desc: 'Invest in nuclear energy for reliable power.',              poles: ['PROGRESS', 'SECURITY'] },
        { key: 'fossil_fuels',         name: 'Fossil Fuels',         desc: 'Maintain traditional energy sources for stability.',        poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'green_transition',     name: 'Green Transition',     desc: 'Rapidly shift to renewable energy sources.',                poles: ['PROGRESS', 'COLLECTIVISM'] },
        { key: 'energy_independence',  name: 'Energy Independence',  desc: 'Develop domestic energy to reduce foreign dependence.',     poles: ['SECURITY', 'INDIVIDUALISM'] }
    ],
    WELFARE: [
        { key: 'universal_benefits', name: 'Universal Benefits', desc: 'Provide welfare programs for all citizens.',                     poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'targeted_aid',       name: 'Targeted Aid',       desc: 'Focus welfare on those who need it most.',                       poles: ['EQUALITY', 'INDIVIDUALISM'] },
        { key: 'self_reliance',      name: 'Self-Reliance',      desc: 'Reduce welfare dependency and promote personal responsibility.', poles: ['INDIVIDUALISM', 'LIBERTY'] },
        { key: 'community_care',     name: 'Community Care',     desc: 'Channel welfare through community and religious organizations.', poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    SOCIAL: [
        { key: 'traditional_values',  name: 'Traditional Values',  desc: 'Uphold cultural heritage and social norms.',            poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'social_safety_net',   name: 'Social Safety Net',   desc: 'Expand social programs and public services.',           poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'individual_freedoms', name: 'Individual Freedoms', desc: 'Protect civil liberties and personal choices.',          poles: ['FREEDOM', 'LIBERTY'] },
        { key: 'community_standards', name: 'Community Standards', desc: 'Strengthen community-level governance and norms.',       poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    MILITARY: [
        { key: 'expand_military',  name: 'Expand the Military', desc: 'Increase defense spending and military capabilities.',     poles: ['SECURITY', 'INDIVIDUALISM'] },
        { key: 'peace_dividend',   name: 'Peace Dividend',      desc: 'Reduce military spending and invest in social programs.',  poles: ['FREEDOM', 'EQUALITY'] },
        { key: 'national_service', name: 'National Service',    desc: 'Implement mandatory national service for citizens.',       poles: ['COLLECTIVISM', 'TRADITION'] },
        { key: 'smart_defense',    name: 'Smart Defense',        desc: 'Invest in advanced technology and cyber capabilities.',   poles: ['PROGRESS', 'LIBERTY'] }
    ],
    GOVERNANCE: [
        { key: 'law_and_order',     name: 'Law and Order',         desc: 'Strengthen law enforcement and judicial authority.',        poles: ['SECURITY', 'TRADITION'] },
        { key: 'anti_corruption',   name: 'Anti-Corruption Drive', desc: 'Increase transparency and root out corruption.',           poles: ['LIBERTY', 'PROGRESS'] },
        { key: 'strong_executive',  name: 'Strong Executive',      desc: 'Concentrate executive power for decisive governance.',     poles: ['SECURITY', 'INDIVIDUALISM'] },
        { key: 'decentralization',  name: 'Decentralization',      desc: 'Distribute power to local communities and regions.',       poles: ['FREEDOM', 'EQUALITY'] }
    ],
    IMMIGRATION: [
        { key: 'closed_borders',       name: 'Closed Borders',       desc: 'Restrict immigration and strengthen border security.',  poles: ['NATIONALISM', 'SECURITY'] },
        { key: 'skilled_migration',    name: 'Skilled Migration',    desc: 'Attract highly skilled immigrants selectively.',         poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'open_arms',           name: 'Open Arms',            desc: 'Welcome refugees and increase immigration quotas.',      poles: ['GLOBALISM', 'FREEDOM'] },
        { key: 'cultural_integration', name: 'Cultural Integration', desc: 'Require cultural assimilation for new arrivals.',       poles: ['NATIONALISM', 'TRADITION'] }
    ],
    INTERNATIONAL: [
        { key: 'non_interventionist',  name: 'Non-Interventionist',  desc: 'Avoid foreign entanglements and focus on domestic affairs.', poles: ['NATIONALISM', 'FREEDOM'] },
        { key: 'global_leadership',    name: 'Global Leadership',    desc: 'Lead international institutions and alliances.',             poles: ['GLOBALISM', 'PROGRESS'] },
        { key: 'military_deterrence',  name: 'Military Deterrence',  desc: 'Project strength to deter foreign aggression.',              poles: ['SECURITY', 'NATIONALISM'] },
        { key: 'humanitarian_focus',   name: 'Humanitarian Focus',   desc: 'Prioritize foreign aid and human rights advocacy.',           poles: ['GLOBALISM', 'EQUALITY'] }
    ],
    TRADE: [
        { key: 'free_trade',          name: 'Free Trade',            desc: 'Eliminate tariffs and open markets to global commerce.',      poles: ['GLOBALISM', 'LIBERTY'] },
        { key: 'buy_domestic',         name: 'Buy Domestic',          desc: 'Promote domestic products and restrict foreign goods.',      poles: ['NATIONALISM', 'TRADITION'] },
        { key: 'fair_trade',           name: 'Fair Trade',            desc: 'Enforce ethical standards and workers\' rights in trade.',   poles: ['GLOBALISM', 'COLLECTIVISM'] },
        { key: 'economic_sovereignty', name: 'Economic Sovereignty',  desc: 'Protect national industries from foreign ownership.',       poles: ['NATIONALISM', 'INDIVIDUALISM'] }
    ]
};

// Stats where LOWER is better (inverted approval logic)
const INVERTED_STATS = [
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'pollution', 'carbon_emissions', 'crime_rate', 'incarceration_rate',
    'drug_use', 'corruption', 'polarization', 'civil_unrest', 'terrorism',
    'political_violence', 'emigration', 'sanctions', 'debt', 'debt_growth',
    'inflation', 'illegal_immigration', 'fuel_prices'
];

// Stats stored as raw numbers (not 0-100 indices).
// GDP and debt are stored as raw dollars (88B = 88,000,000,000).
// All other stats (0-100 indices) use the default divisor of 50.
const RAW_SCALING_DIVISORS = {
    population: 1_000_000,
    gdp: 1_000_000_000,
    debt: 1_000_000_000
};

// ==================== NATIONAL BUDGET CALCULATION ====================

function calculateNationalBudget(nation) {
    // GDP and Debt are stored as raw dollars
    const gdp = Number(nation.gdp ?? nation.GDP ?? 0);
    const debt = Number(nation.debt ?? 0);

    // Tax rates: 0-100 percentages
    const incomeTaxRate  = Number(nation.income_tax ?? 0);
    const corpTaxRate    = Number(nation.corporate_tax ?? 0);
    const salesTaxRate   = Number(nation.sales_tax ?? 0);
    const tariffsRate    = Number(nation.tariffs ?? 0);

    // Other 0-100 stats
    const efficiency     = Number(nation.efficiency ?? 50);
    const corruption     = Number(nation.corruption ?? 50);
    const oilGas         = Number(nation.oil_and_gas ?? 0);
    const creditRating   = Number(nation.credit ?? 50);

    // Collection Rate = (Efficiency + (100 - Corruption)) / 200  →  0.0 to 1.0
    const collectionRate = (efficiency + (100 - corruption)) / 200;

    // Tax Revenue (raw dollars, since GDP is raw dollars)
    const incomeRevenue  = gdp * (incomeTaxRate / 100) * 0.40 * collectionRate;
    const corpRevenue    = gdp * (corpTaxRate / 100)   * 0.10 * collectionRate;
    const salesRevenue   = gdp * (salesTaxRate / 100)  * 0.30 * collectionRate;
    const tariffRevenue  = gdp * (tariffsRate / 100)   * 0.05 * collectionRate;

    // Oil & Gas Revenue (only if oil_and_gas stat > 30)
    const oilRevenue = oilGas > 30 ? gdp * (oilGas / 100) * 0.06 : 0;

    const grossRevenue = incomeRevenue + corpRevenue + salesRevenue + tariffRevenue + oilRevenue;

    // Debt Service: Effective Interest = 15% - (Credit × 0.13%), clamped 2%-18%
    const effectiveInterest = Math.min(0.18, Math.max(0.02, 0.15 - (creditRating * 0.0013)));
    const debtService = debt * effectiveInterest;

    // Available Budget = Revenue - Debt Service
    const availableBudget = grossRevenue - debtService;

    return {
        grossRevenue, debtService, availableBudget, collectionRate,
        incomeRevenue, corpRevenue, salesRevenue, tariffRevenue, oilRevenue
    };
}

/**
 * Override formula-based tariff revenue with real trade engine data.
 * Mutates the budget object in place and returns it.
 */
function applyTradeTariffOverride(budget, tradeTariffRevenue) {
    if (tradeTariffRevenue != null && Number(tradeTariffRevenue) > 0) {
        const oldTariff = budget.tariffRevenue;
        budget.tariffRevenue = Number(tradeTariffRevenue);
        budget.grossRevenue = budget.grossRevenue - oldTariff + budget.tariffRevenue;
        budget.availableBudget = budget.grossRevenue - budget.debtService;
    }
    return budget;
}

// ==================== TAX CONFIG ====================

/**
 * Static metadata for each adjustable tax type.
 * Effects are NOT hardcoded — they come from stat_connections at runtime.
 */
const TAX_CONFIG = [
    {
        key: 'income_tax',
        name: 'Income Tax',
        category: 'Income',
        categoryClass: 'pill-income',
        revenueKey: 'incomeRevenue',
        gdpMultiplier: 0.40,
        maxRate: 50
    },
    {
        key: 'sales_tax',
        name: 'Sales Tax',
        category: 'Consumption',
        categoryClass: 'pill-consumption',
        revenueKey: 'salesRevenue',
        gdpMultiplier: 0.30,
        maxRate: 50
    },
    {
        key: 'corporate_tax',
        name: 'Corporate Tax',
        category: 'Corporate',
        categoryClass: 'pill-corporate',
        revenueKey: 'corpRevenue',
        gdpMultiplier: 0.10,
        maxRate: 50
    }
];

// ==================== BUDGET BILL HELPERS ====================

/**
 * Fiscal categories that map 1:1 to ministries.
 */
const FISCAL_CATEGORIES = [
    'Interior', 'Labor', 'Healthcare', 'Education',
    'Transportation', 'Energy', 'Justice', 'Foreign Ministry', 'Finance', 'Defense', 'Trade'
];

/**
 * Map fiscal category names → ministry_key used in ministry_institution_config.
 */
const FISCAL_TO_MINISTRY_KEY = {
    'Interior': 'interior', 'Labor': 'labor', 'Healthcare': 'healthcare',
    'Education': 'education', 'Transportation': 'transportation', 'Energy': 'energy',
    'Justice': 'justice', 'Foreign Ministry': 'foreign', 'Finance': 'finance',
    'Defense': 'defense', 'Trade': 'trade'
};

/**
 * Compute inflation cost multiplier from the 0-100 inflation stat.
 * Inflation stat 50 = 0% increase, 100 = +25% increase, 0 = -25% increase.
 * Applied as (inflation - 50) / 2 percent increase per budget cycle.
 * e.g. inflation=56 → costs increase by 3%
 */
function getInflationMultiplier(inflationStat) {
    const pct = (Number(inflationStat || 50) - 50) / 2;
    return 1 + (pct / 100);
}

/**
 * Compute the annualized cost of all active policies for a given fiscal category.
 * Returns raw dollars. Applies inflation adjustment.
 */
function computeMinistryPolicyCost(activeLaws, fiscalCategory, nation) {
    let total = 0;
    const policies = [];

    for (const law of (activeLaws || [])) {
        if (law.is_reversal) continue;
        const policy = law.policies;
        if (!policy || policy.fiscal_category !== fiscalCategory) continue;

        let annualCost = 0;
        const ongoingBase = policy.ongoing_base_cost || policy.ongoing_cost_per_tick || 0;
        if (ongoingBase > 0) {
            let scaled = ongoingBase;
            if (policy.ongoing_scaling_stat && nation[policy.ongoing_scaling_stat] !== undefined) {
                const statVal = Number(nation[policy.ongoing_scaling_stat]) || 1;
                const divisor = RAW_SCALING_DIVISORS[policy.ongoing_scaling_stat] || 50;
                scaled = ongoingBase * (statVal / divisor);
            }
            annualCost = scaled * GAME_CONFIG.TICKS_PER_YEAR * 1_000_000;
        }

        if (annualCost > 0) {
            policies.push({ policy_id: policy.id, policy_name: policy.policy_name, cost: annualCost });
            total += annualCost;
        }
    }

    // Apply inflation
    const inflationMult = getInflationMultiplier(nation.inflation);
    total *= inflationMult;
    for (const p of policies) p.cost *= inflationMult;

    return { total, policies };
}

/**
 * Compute the annualized cost of all institutions for a given fiscal category.
 * Population-scaled: base_cost_per_capita × population × inflation.
 * GDP-scaled:        base_cost_per_capita (as % of GDP, e.g. 0.5 = 0.5%) × GDP × inflation.
 * @param {Array} institutions - rows from ministry_institution_config
 * @param {string} fiscalCategory - e.g. 'Healthcare', 'Trade'
 * @param {Object} nation
 */
function computeMinistryInstitutionCost(institutions, fiscalCategory, nation) {
    const ministryKey = FISCAL_TO_MINISTRY_KEY[fiscalCategory] || fiscalCategory.toLowerCase();
    const insts = (institutions || []).filter(i => i.ministry_key === ministryKey);
    const population = Number(nation.population || 0);
    const gdp = Number(nation.gdp ?? nation.GDP ?? 0);
    const inflationMult = getInflationMultiplier(nation.inflation);

    let total = 0;
    const items = [];
    for (const inst of insts) {
        const baseVal = Number(inst.base_cost_per_capita || 0);
        const scalingType = inst.scaling_type || 'population';
        let cost;
        if (scalingType === 'gdp') {
            // baseVal is a percentage of GDP (e.g. 0.5 means 0.5%)
            cost = (baseVal / 100) * gdp;
        } else {
            cost = baseVal * population;
        }
        cost *= inflationMult;
        items.push({
            id: inst.id, institution_name: inst.institution_name, cost,
            base_cost_per_capita: inst.base_cost_per_capita,
            scaling_type: scalingType
        });
        total += cost;
    }
    return { total, institutions: items };
}

/**
 * Build full budget data for a nation: revenue, expenditures per ministry, debt service, etc.
 */
function buildBudgetData(nation, activeLaws, tradeTariffRevenue, institutions) {
    const budget = calculateNationalBudget(nation);
    applyTradeTariffOverride(budget, tradeTariffRevenue);
    const inflationStat = Number(nation.inflation || 50);
    const inflationPct = (inflationStat - 50) / 2;
    const reserves = Number(nation.budget_reserves || 0);

    const ministries = {};
    let totalExpenditure = 0;

    for (const cat of FISCAL_CATEGORIES) {
        const polResult = computeMinistryPolicyCost(activeLaws, cat, nation);
        const instResult = computeMinistryInstitutionCost(institutions || [], cat, nation);
        const fulfilledCost = polResult.total + instResult.total;
        ministries[cat] = {
            fulfilledCost,
            allocation: fulfilledCost,  // default: fulfill
            policies: polResult.policies,
            institutions: instResult.institutions,
            institutionTotal: instResult.total,
            policyTotal: polResult.total
        };
        totalExpenditure += fulfilledCost;
    }

    const available = budget.grossRevenue + reserves - budget.debtService;

    return {
        ...budget,
        inflationPct,
        inflationStat,
        reserves,
        ministries,
        totalExpenditure,
        available,
        currentDebt: Number(nation.debt || 0),
        projectedDebt: Number(nation.debt || 0) + Math.max(0, totalExpenditure - available)
    };
}

/**
 * Auto-generate a budget bill for a nation.
 * Called at January ticks (tick % 12 === 1, since tick 1 = January after start).
 */
async function generateBudgetBill(supabase, nation, currentTick, activeLaws) {
    // Fetch latest trade summary for tariff revenue (matches Economy page)
    let tradeTariffRevenue = null;
    try {
        const { data: tradeSummary } = await supabase.from('trade_summary')
            .select('tariff_revenue')
            .eq('nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (tradeSummary) tradeTariffRevenue = Number(tradeSummary.tariff_revenue);
    } catch (e) { /* no trade data yet — use formula fallback */ }

    // Load institution config for cost calculations
    const { data: instRows } = await supabase.from('ministry_institution_config')
        .select('*');

    const budgetData = buildBudgetData(nation, activeLaws, tradeTariffRevenue, instRows || []);

    const gameYear = 2000 + Math.floor(currentTick / 12);
    const billName = `Budget Act of ${gameYear}`;

    // Find the ruling faction to be the sponsor (PM's party or ruling_faction_id)
    let sponsorId = nation.ruling_faction_id;
    if (!sponsorId) {
        // Fallback: first party faction
        const { data: parties } = await supabase.from('factions')
            .select('id').eq('nation_id', nation.id).eq('faction_type', 'party').limit(1);
        sponsorId = parties?.[0]?.id;
    }
    if (!sponsorId) return null;

    const preamble = `Annual budget for the fiscal year ${gameYear}. ` +
        `This bill allocates $${(budgetData.available / 1e9).toFixed(1)}B in available revenue across all government ministries. ` +
        (budgetData.inflationPct > 0
            ? `Inflation (${budgetData.inflationStat.toFixed(0)}/100) has increased all costs by ~${budgetData.inflationPct.toFixed(1)}% since the last budget cycle.`
            : `Inflation is currently under control.`);

    // Insert the bill into committee (voting_ends_tick set when sent to floor)
    const { data: bill, error: billError } = await supabase.from('bills').insert({
        nation_id: nation.id,
        proposed_by: sponsorId,
        proposed_tick: currentTick,
        bill_name: billName,
        status: 'committee',
        preamble,
        bill_type: 'budget'
    }).select('id').single();

    if (billError || !bill) {
        console.error('[generateBudgetBill] Failed to create budget bill:', billError?.message);
        return null;
    }

    // Insert budget allocations per ministry
    const allocRows = [];
    for (const cat of FISCAL_CATEGORIES) {
        const m = budgetData.ministries[cat];
        allocRows.push({
            bill_id: bill.id,
            nation_id: nation.id,
            fiscal_category: cat,
            allocation_amount: m.allocation,
            fulfilled_cost: m.fulfilledCost
        });
    }

    const { error: allocError } = await supabase.from('budget_allocations').insert(allocRows);
    if (allocError) {
        console.error('[generateBudgetBill] Failed to insert allocations:', allocError.message);
    }

    // Insert per-item allocations (institutions + policies)
    const itemRows = [];
    for (const cat of FISCAL_CATEGORIES) {
        const m = budgetData.ministries[cat];
        for (const inst of (m.institutions || [])) {
            itemRows.push({
                bill_id: bill.id, nation_id: nation.id, fiscal_category: cat,
                item_type: 'institution', item_id: inst.id,
                item_name: inst.institution_name,
                allocation_amount: inst.cost, needed_amount: inst.cost, is_cut: false
            });
        }
        for (const pol of (m.policies || [])) {
            itemRows.push({
                bill_id: bill.id, nation_id: nation.id, fiscal_category: cat,
                item_type: 'policy', item_id: pol.policy_id,
                item_name: pol.policy_name,
                allocation_amount: pol.cost, needed_amount: pol.cost, is_cut: false
            });
        }
    }
    if (itemRows.length > 0) {
        const { error: itemError } = await supabase.from('budget_item_allocations').insert(itemRows);
        if (itemError) console.error('[generateBudgetBill] Failed to insert item allocations:', itemError.message);
    }

    console.log(`[generateBudgetBill] Created budget bill "${billName}" for ${nation.name} (bill ${bill.id})`);
    return bill.id;
}

/**
 * Resolve a passed budget bill: adjust debt based on surplus/deficit, update reserves.
 */
async function resolveBudgetBill(supabase, bill, currentTick) {
    const { data: allocations } = await supabase.from('budget_allocations')
        .select('*').eq('bill_id', bill.id);

    const { data: nation } = await supabase.from('nations')
        .select('*').eq('id', bill.nation_id).single();
    if (!nation) return;

    const budget = calculateNationalBudget(nation);

    // Override tariff revenue with real trade engine data
    let tradeTariffRevenue = null;
    try {
        const { data: tradeSummary } = await supabase.from('trade_summary')
            .select('tariff_revenue')
            .eq('nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (tradeSummary) tradeTariffRevenue = Number(tradeSummary.tariff_revenue);
    } catch (e) { /* no trade data yet */ }
    applyTradeTariffOverride(budget, tradeTariffRevenue);

    const reserves = Number(nation.budget_reserves || 0);
    const available = budget.grossRevenue + reserves - budget.debtService;

    let totalSpending = 0;
    for (const alloc of (allocations || [])) {
        totalSpending += Number(alloc.allocation_amount || 0);
    }

    const gap = available - totalSpending;
    let newDebt = Number(nation.debt || 0);
    let newReserves = 0;

    if (gap >= 0) {
        // Surplus: reduce debt (or build reserves if no debt)
        if (newDebt > 0) {
            const debtReduction = Math.min(gap, newDebt);
            newDebt -= debtReduction;
            newReserves = gap - debtReduction;
        } else {
            newReserves = gap;
        }
    } else {
        // Deficit: add to debt
        newDebt += Math.abs(gap);
        newReserves = 0;
    }

    // Update nation
    const { error: updateErr } = await supabase.from('nations').update({
        debt: newDebt,
        budget_reserves: newReserves,
        last_budget_tick: currentTick,
        last_budget_bill_id: bill.id
    }).eq('id', nation.id);

    if (updateErr) {
        console.error(`[resolveBudgetBill] CRITICAL: Failed to update nation ${nation.name} (last_budget_tick=${currentTick}):`, updateErr.message);
    }

    console.log(`[resolveBudgetBill] Nation ${nation.name}: spending=$${(totalSpending/1e9).toFixed(2)}B, gap=$${(gap/1e9).toFixed(2)}B, newDebt=$${(newDebt/1e9).toFixed(2)}B, last_budget_tick=${currentTick}`);
}

/**
 * Check if a nation is missing a budget and apply penalties.
 * Called each tick. If no budget has passed in the current fiscal year, apply penalties.
 */
async function processNoBudgetPenalty(supabase, nation, currentTick) {
    const lastBudgetTick = nation.last_budget_tick;
    const ticksSinceLastBudget = lastBudgetTick != null ? (currentTick - lastBudgetTick) : currentTick;

    // Grace period: no penalty in the first year (first 12 ticks)
    if (currentTick < 12) return null;

    // If budget was passed within the last year, no penalty
    if (ticksSinceLastBudget <= GAME_CONFIG.TICKS_PER_YEAR) return null;

    // Penalty scales: the longer without a budget, the worse
    const ticksOverdue = ticksSinceLastBudget - GAME_CONFIG.TICKS_PER_YEAR;
    const maxPenaltyTicks = GAME_CONFIG.NO_BUDGET_PENALTY_TICKS;
    const severity = Math.min(ticksOverdue / maxPenaltyTicks, 1.0);

    // Apply penalties: efficiency drops, stability drops, credit drops
    const effPenalty = -Math.round(severity * 2);  // up to -2/tick
    const stabPenalty = -Math.round(severity * 1.5);  // up to -1.5/tick
    const creditPenalty = -Math.round(severity * 1);  // up to -1/tick

    const updates = {};
    if (effPenalty !== 0) updates.efficiency = Math.max(0, Number(nation.efficiency || 50) + effPenalty);
    if (stabPenalty !== 0) updates.stability = Math.max(0, Number(nation.stability || 50) + stabPenalty);
    if (creditPenalty !== 0) updates.credit = Math.max(0, Number(nation.credit || 50) + creditPenalty);

    if (Object.keys(updates).length > 0) {
        await supabase.from('nations').update(updates).eq('id', nation.id);
        Object.assign(nation, updates);
    }

    return { ticksOverdue, severity, effPenalty, stabPenalty, creditPenalty };
}

// ==================== GOVERNMENT SHUTDOWN ====================
// Stable UUID for the Government Shutdown crisis template (matches SQL migration)
const GOVERNMENT_SHUTDOWN_CRISIS_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Check if a government shutdown is active for this nation.
 * Shutdown triggers when 2+ ticks have passed since the budget expired
 * (i.e., ticksSinceLastBudget >= TICKS_PER_YEAR + 2).
 *
 * @returns {boolean} true if shutdown is active
 */
function isGovernmentShutdown(nation, currentTick) {
    // Grace period: no shutdown in the first fiscal year + 2 ticks
    if (currentTick < GAME_CONFIG.TICKS_PER_YEAR + 2) return false;

    const lastBudgetTick = nation.last_budget_tick;
    const ticksSinceLastBudget = lastBudgetTick != null ? (currentTick - lastBudgetTick) : currentTick;

    return ticksSinceLastBudget >= GAME_CONFIG.TICKS_PER_YEAR + 2;
}

/**
 * Build a forced-Collapsed statInstitutionMap: every institution at 0% funding.
 * Used during government shutdown to force all institution-covered stats to decay
 * at the Collapsed tier rate (primary: 2.7, secondary: 1.7).
 */
function buildShutdownStatInstMap(institutionConfig) {
    const statMap = {};
    for (const inst of (institutionConfig || [])) {
        for (const role of ['primary', 'secondary']) {
            const statKey = inst[`${role}_stat`];
            if (!statKey) continue;
            if (!statMap[statKey]) statMap[statKey] = [];
            statMap[statKey].push({ id: inst.id, role, fundingPct: 0 });
        }
    }
    return statMap;
}

/**
 * Government Shutdown Crisis — coalition/approval/momentum penalties + active_crises management.
 * Called each tick when isGovernmentShutdown() returns true.
 *
 * Effects (in addition to Collapsed institution decay handled by the main loop):
 *   - All coalition parties: -2 Momentum and -2 Approval per voter bloc per tick
 *   - Prime Minister's party: additional -3 Approval/tick
 *   - President's party (presidential systems): -3 Approval/tick
 *   - Inserts an active_crises row so it shows on nation.html
 *   - Fires a system event notification
 */
async function processGovernmentShutdown(supabase, nation, currentTick) {
    const lastBudgetTick = nation.last_budget_tick;
    const ticksSinceLastBudget = lastBudgetTick != null ? (currentTick - lastBudgetTick) : currentTick;
    const ticksOverdue = ticksSinceLastBudget - GAME_CONFIG.TICKS_PER_YEAR;

    console.log(`[GovernmentShutdown] ACTIVE for ${nation.name} — ${ticksSinceLastBudget} ticks since last budget (overdue by ${ticksOverdue} ticks)`);

    // --- 0. Activate crisis record (insert into active_crises if not already present) ---
    const { data: existingCrises, error: checkErr } = await supabase
        .from('active_crises')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('crisis_id', GOVERNMENT_SHUTDOWN_CRISIS_ID);

    if (checkErr) {
        console.error(`[GovernmentShutdown] Failed to check existing crisis for ${nation.name}:`, checkErr.message);
    }

    if (!existingCrises || existingCrises.length === 0) {
        const { error: insertErr } = await supabase
            .from('active_crises')
            .insert({
                crisis_id: GOVERNMENT_SHUTDOWN_CRISIS_ID,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            });
        if (insertErr) {
            console.warn(`[GovernmentShutdown] Failed to insert active_crises row:`, insertErr.message);
        } else {
            console.log(`[GovernmentShutdown] Crisis activated for ${nation.name} at tick ${currentTick}`);

            // Log to event_log
            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_STARTED: Government Shutdown',
                description_used: 'The government has shut down due to failure to pass a budget.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });
        }
    }

    // --- 1. Coalition party penalties: -2 Momentum and -2 Approval per voter bloc ---
    const coalition = await fetchActiveCoalition(supabase, nation.id);
    const coalitionPartyIds = coalition?.party_ids || [];

    for (const partyId of coalitionPartyIds) {
        await adjustMomentumAll(supabase, nation.id, partyId, -4, 'crisis:government_shutdown');
    }
    if (coalitionPartyIds.length > 0) {
        console.log(`[GovernmentShutdown] Applied -4 Momentum to ${coalitionPartyIds.length} coalition parties for ${nation.name}`);
    }

    // --- 2. PM party extra penalty: -3/tick + gov approval event ---
    const pmPartyId = coalition?.lead_party_id;
    if (pmPartyId) {
        await adjustMomentumAll(supabase, nation.id, pmPartyId, -3, 'crisis:government_shutdown_pm');
        await adjustGovernmentApprovalEvent(supabase, nation.id, -3, 'crisis:government_shutdown');
        console.log(`[GovernmentShutdown] Applied -3 Momentum to PM party ${pmPartyId} + -3 gov approval event for ${nation.name}`);
    }

    // --- 3. President approval penalty: -3/tick (presidential systems) ---
    if (isPresidentialRepublic(nation)) {
        const { data: president } = await supabase
            .from('presidents')
            .select('id, faction_id')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .order('elected_tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (president) {
            await adjustMomentumAll(supabase, nation.id, president.faction_id, -3, 'crisis:government_shutdown_president');
            console.log(`[GovernmentShutdown] Applied -3 Momentum to President party ${president.faction_id} for ${nation.name}`);
        }
    }

    // --- 4. Fire system event (once per tick while shutdown is active) ---
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'government_shutdown',
            p_nation_id: nation.id,
            p_tick: currentTick,
            p_placeholders: {
                nation: nation.name || 'Unknown',
                ticks_overdue: String(ticksOverdue)
            }
        });
    } catch (e) {
        // Non-critical — don't block shutdown processing if event template doesn't exist
        console.warn(`[GovernmentShutdown] fire_system_event failed (template may not exist):`, e.message);
    }

    return {
        active: true,
        ticksSinceLastBudget,
        ticksOverdue,
        coalitionPartiesAffected: coalitionPartyIds.length
    };
}

/**
 * Deactivate the Government Shutdown crisis when a budget has been passed.
 * Called each tick when isGovernmentShutdown() returns false — removes the
 * active_crises row if one exists, so it disappears from nation.html.
 */
async function resolveGovernmentShutdown(supabase, nation, currentTick) {
    // Delete directly by nation_id + crisis_id (more robust than query-then-delete)
    const { data: deleted, error: delErr } = await supabase
        .from('active_crises')
        .delete()
        .eq('nation_id', nation.id)
        .eq('crisis_id', GOVERNMENT_SHUTDOWN_CRISIS_ID)
        .select('id, started_at_tick');

    if (delErr) {
        console.error(`[GovernmentShutdown] CRITICAL: Failed to delete active_crises for ${nation.name}:`, delErr.message);
        return;
    }

    if (!deleted || deleted.length === 0) return; // No active shutdown to resolve

    const duration = currentTick - (deleted[0].started_at_tick || 0);

    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'CRISIS_RESOLVED: Government Shutdown',
        description_used: 'The government shutdown has ended. A budget has been passed.',
        category: 'crisis',
        effects_applied: [],
        fired_at_tick: currentTick
    });

    console.log(`[GovernmentShutdown] Crisis resolved for ${nation.name} at tick ${currentTick} (duration: ${duration} ticks)`);
}

// Apply GDP growth rate: gdp_growth (0-100) centered at 50 maps to -1% to +1% per month
// Formula: monthlyChange% = (gdp_growth - 50) / 50  →  0=-1%, 50=0%, 100=+1%
async function applyGdpGrowth(supabase, nation) {
    const gdpGrowth = Number(nation.gdp_growth ?? 50);
    const currentGdp = Number(nation.gdp ?? 0);
    if (currentGdp <= 0) return;

    const monthlyChangePercent = (gdpGrowth - 50) / 50;
    const newGdp = Math.max(0, currentGdp * (1 + monthlyChangePercent / 100));
    nation.gdp = newGdp;

    await supabase.from('nations').update({ gdp: newGdp }).eq('id', nation.id);
}

// Ideology spectrum opposites
const IDEOLOGY_OPPOSITES = {
    'LIBERTY': 'EQUALITY',           'EQUALITY': 'LIBERTY',
    'FREEDOM': 'SECURITY',           'SECURITY': 'FREEDOM',
    'TRADITION': 'PROGRESS',         'PROGRESS': 'TRADITION',
    'GLOBALISM': 'NATIONALISM',      'NATIONALISM': 'GLOBALISM',
    'INDIVIDUALISM': 'COLLECTIVISM', 'COLLECTIVISM': 'INDIVIDUALISM'
};

// Audit: detect stances with opposed poles on the same axis
for (const [sector, stances] of Object.entries(POLICY_STANCES)) {
    for (const stance of stances) {
        if (stance.poles.length === 2 && IDEOLOGY_OPPOSITES[stance.poles[0]] === stance.poles[1]) {
            console.error(`STANCE CONFLICT: ${sector}.${stance.key} has opposed poles: ${stance.poles.join(' vs ')}`);
        }
    }
}

// ==================== DYNAMIC IDEOLOGY SYSTEM ====================

const IDEOLOGY_AXES = [
    {
        key: 'liberty_equality',
        left: 'LIBERTY',       right: 'EQUALITY',
        leftLabel: 'Liberty',  rightLabel: 'Equality',
        leftColor: '#3b82f6',  rightColor: '#ef4444',
        description: 'Individual rights vs. collective fairness'
    },
    {
        key: 'tradition_progress',
        left: 'TRADITION',      right: 'PROGRESS',
        leftLabel: 'Tradition', rightLabel: 'Progress',
        leftColor: '#a855f7',   rightColor: '#22c55e',
        description: 'Cultural conservatism vs. social reform'
    },
    {
        key: 'security_freedom',
        left: 'SECURITY',      right: 'FREEDOM',
        leftLabel: 'Security', rightLabel: 'Freedom',
        leftColor: '#f59e0b',  rightColor: '#06b6d4',
        description: 'State protection vs. personal autonomy'
    },
    {
        key: 'globalism_nationalism',
        left: 'GLOBALISM',       right: 'NATIONALISM',
        leftLabel: 'Globalism',  rightLabel: 'Nationalism',
        leftColor: '#14b8a6',    rightColor: '#f97316',
        description: 'International integration vs. national sovereignty'
    },
    {
        key: 'individualism_collectivism',
        left: 'INDIVIDUALISM',       right: 'COLLECTIVISM',
        leftLabel: 'Individualism',  rightLabel: 'Collectivism',
        leftColor: '#eab308',        rightColor: '#ec4899',
        description: 'Personal self-reliance vs. communal structures'
    }
];

const IDEOLOGY_TO_AXIS = {};
for (const axis of IDEOLOGY_AXES) {
    IDEOLOGY_TO_AXIS[axis.left]  = { axisKey: axis.key, direction: -1 };
    IDEOLOGY_TO_AXIS[axis.right] = { axisKey: axis.key, direction: +1 };
}


/**
 * Return an alignment CSS class ('aligned', 'opposed', 'neutral') for
 * an ideology tag relative to a faction's ideology scores.
 */
function getIdeologyChipClass(ideologyTag, factionIdeology) {
    if (!factionIdeology) return 'neutral';
    const tag = (ideologyTag || '').toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 'neutral';
    const score = factionIdeology[mapping.axisKey] || 0;
    const alignment = score * mapping.direction;
    if (alignment > 10) return 'aligned';
    if (alignment < -10) return 'opposed';
    return 'neutral';
}

// ==================== IDEOLOGY LABELS ====================

const IDEOLOGY_LABEL_THRESHOLDS = [
    { min: 0,  max: 10,  label: 'Centrist' },
    { min: 11, max: 30,  label: 'Leaning' },
    { min: 31, max: 60,  label: 'Strong' },
    { min: 61, max: 100, label: 'Radical' }
];

function getIdeologyLabel(score, axisDef) {
    const abs = Math.abs(score);
    const threshold = IDEOLOGY_LABEL_THRESHOLDS.find(t => abs >= t.min && abs <= t.max);
    const intensityLabel = threshold ? threshold.label : 'Centrist';

    if (intensityLabel === 'Centrist') return 'Centrist';

    const sideName = score < 0 ? axisDef.leftLabel : axisDef.rightLabel;
    return `${intensityLabel} ${sideName}`;
}

function getFullIdeologyProfile(ideologyRow) {
    return IDEOLOGY_AXES.map(axis => {
        const score = ideologyRow[axis.key] || 0;
        return {
            axisKey: axis.key,
            axisDef: axis,
            score: score,
            label: getIdeologyLabel(score, axis)
        };
    });
}


// ==================== DYNAMIC OPPOSITION PENALTY ====================

function calculateDynamicOppositionPenalty(factionIdeology, policyIdeologyTag, basePenalty = 2) {
    const tag = policyIdeologyTag.toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 0;

    const factionScore = factionIdeology[mapping.axisKey] || 0;
    const policyDirection = mapping.direction;
    const oppositionScore = -policyDirection * factionScore;

    if (oppositionScore <= 0) return 0;

    const penaltyScale = oppositionScore / 100;
    return -Math.round(basePenalty * penaltyScale * 10) / 10;
}

function calculateBillDynamicPenalty(factionIdeology, articles, basePenalty = 2) {
    let totalPenalty = 0;

    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        for (const tag of ideos) {
            totalPenalty += calculateDynamicOppositionPenalty(factionIdeology, tag, basePenalty);
        }
    }

    return totalPenalty;
}


// ==================== IDEOLOGY ALIGNMENT (DYNAMIC SCORES) ====================

/**
 * Compute ideology alignment (0-100) between a faction and a voter bloc
 * using the faction's dynamic axis scores.
 *
 * Returns 50 for a fully centrist party (neutral), >50 for alignment,
 * <50 for opposition. Axes are weighted by how strongly the party
 * leans on each axis, so centrist axes are naturally ignored.
 *
 * @param {object} factionIdeology - Row from faction_ideology (keys: liberty_equality, etc.)
 * @param {object} bloc - Voter bloc row with axis_* columns (0-100 scale, 50 = neutral)
 * @returns {number} 0-100 alignment score
 */
function computeIdeologyAlignment(factionIdeology, bloc) {
    const AXIS_KEYS = [
        'liberty_equality', 'tradition_progress', 'security_freedom',
        'globalism_nationalism', 'individualism_collectivism'
    ];

    let weightedAlignment = 0;
    let totalWeight = 0;

    for (const axisKey of AXIS_KEYS) {
        const partyScore = factionIdeology[axisKey] || 0; // -100 to +100
        const blocScore = bloc['axis_' + axisKey] ?? 50;  // 0-100

        // How strongly the party leans on this axis (0 = centrist, 1 = extreme)
        const partyStrength = Math.abs(partyScore) / 100;
        if (partyStrength < 0.01) continue; // Skip negligible positions

        // Convert party score to 0-100 scale to match bloc
        const partyNorm = (partyScore + 100) / 2; // -100→0, 0→50, +100→100

        // Alignment = 1 when identical, 0 when at opposite ends
        const alignment = 1 - Math.abs(partyNorm - blocScore) / 100;

        weightedAlignment += alignment * partyStrength;
        totalWeight += partyStrength;
    }

    if (totalWeight === 0) return 50; // Fully centrist → neutral
    return (weightedAlignment / totalWeight) * 100;
}


// ==================== IDEOLOGY DATABASE HELPERS ====================

async function loadFactionIdeology(supabase, factionId) {
    const cacheKey = 'faction_ideo_' + factionId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*')
        .eq('faction_id', factionId)
        .maybeSingle();

    if (error) {
        console.error('Error loading faction ideology:', error);
        return null;
    }
    if (data && typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 2 * 60 * 1000);
    return data;
}

async function loadNationIdeologies(supabase, nationId) {
    const cacheKey = 'nation_ideos_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data: factions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return [];

    const factionIds = factions.map(f => f.id);
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*, factions(id, faction_name, faction_type, is_npc, nation_id)')
        .in('faction_id', factionIds);

    if (error) {
        console.error('Error loading nation ideologies:', error);
        return [];
    }
    const result = data || [];
    if (result.length && typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 2 * 60 * 1000);
    return result;
}

function extractAxisScores(ideologyRow) {
    const scores = {};
    for (const axis of IDEOLOGY_AXES) {
        scores[axis.key] = ideologyRow[axis.key] || 0;
    }
    return scores;
}


// ==================== SEAT LOADING ====================

async function loadSeats(supabase, nationId, isAutocracy, allParties, currentFactionId) {
    const allPartySeats = {};

    if (isAutocracy) {
        allParties.forEach(p => {
            allPartySeats[p.id] = p.seats || 0;
        });
    } else {
        const cacheKey = 'seats_' + nationId;
        let election = null;
        if (typeof qCache === 'function') {
            const cached = qCache(cacheKey);
            if (cached) { election = cached; }
        }
        if (!election) {
            const res = await supabase
                .from('elections')
                .select('results')
                .eq('nation_id', nationId)
                .eq('status', 'completed')
                .eq('election_type', 'parliamentary')
                .order('election_tick', { ascending: false })
                .limit(1)
                .maybeSingle();
            election = res.data;
            if (election && typeof qCacheSet === 'function') qCacheSet(cacheKey, election, 2 * 60 * 1000);
        }

        if (election?.results?.votes) {
            election.results.votes.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        } else if (election?.results?.seats) {
            election.results.seats.forEach(s => {
                allPartySeats[s.party_id] = s.seats;
            });
        }

        allParties.forEach(p => {
            if (allPartySeats[p.id] === undefined) {
                allPartySeats[p.id] = p.seats || 0;
            }
        });
    }

    const currentSeats = allPartySeats[currentFactionId] ??
        allParties.find(p => p.id === currentFactionId)?.seats ?? 0;

    return { allPartySeats, currentSeats };
}


// ==================== HEAD FACTION ====================

async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id')
        .eq('id', nationId)
        .single();

    if (nation?.ruling_faction_id) {
        return {
            headFactionId: nation.ruling_faction_id,
            isHeadFaction: currentFactionId === nation.ruling_faction_id
        };
    }

    const { data: gov } = await supabase
        .from('nation_governments')
        .select('head_of_state_party')
        .eq('nation_id', nationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (gov?.head_of_state_party) {
        return {
            headFactionId: gov.head_of_state_party,
            isHeadFaction: currentFactionId === gov.head_of_state_party
        };
    }

    return { headFactionId: null, isHeadFaction: false };
}


// ==================== COALITION FETCHING ====================

async function fetchActiveCoalition(supabase, nationId) {
    const cacheKey = 'coalition_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }

    // === PRESIDENTIAL SYSTEMS: return virtual coalition from active president ===
    const { data: nationRow } = await supabase
        .from('nations')
        .select('government_type')
        .eq('id', nationId)
        .single();

    if (isPresidentialRepublic(nationRow)) {
        const { data: president } = await supabase
            .from('presidents')
            .select('id, nation_id, faction_id, first_name, last_name, elected_tick, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true)
            .order('elected_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!president) return null; // No active president yet (candidate selection pending)

        // Build ministry_allocations from active ministries
        const { data: ministries } = await supabase
            .from('ministries')
            .select('ministry_key, party_id')
            .eq('nation_id', nationId)
            .eq('is_active', true);

        const ministryAllocations = {};
        const cabinetPartyIds = new Set([president.faction_id]);
        for (const m of (ministries || [])) {
            if (m.party_id) {
                ministryAllocations[m.ministry_key] = m.party_id;
                cabinetPartyIds.add(m.party_id);
            }
        }

        const result = {
            id: president.id,
            nation_id: nationId,
            party_ids: Array.from(cabinetPartyIds),
            lead_party_id: president.faction_id,
            ministry_allocations: ministryAllocations,
            formed_at: null,
            status: 'formed',  // Always 'formed' while president is active
            _source: 'presidential'
        };
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 15 * 1000);
        return result;
    }

    // === PARLIAMENTARY DEMOCRACY / AUTOCRACY: existing logic ===

    // Helper: if status looks active but frozen bills exist, it's actually caretaker
    async function inferCaretakerStatus(result) {
        if (result && (!result.status || result.status === 'formed')) {
            const { count } = await supabase
                .from('bills')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nationId)
                .eq('status', 'frozen');
            if (count && count > 0) {
                result.status = 'caretaker';
            }
        }
        return result;
    }

    const { data: newGov } = await supabase
        .from('government_formations')
        .select('*')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (newGov) {
        const pmPartyId = newGov.ministry_assignments?.prime_minister || newGov.proposed_by;
        const result = {
            id: newGov.id,
            nation_id: newGov.nation_id,
            election_id: newGov.election_id,
            party_ids: newGov.party_ids || [],
            lead_party_id: pmPartyId,
            ministry_allocations: newGov.ministry_assignments || {},
            formed_at: newGov.formed_at,
            status: newGov.status,
            _source: 'government_formations'
        };
        await inferCaretakerStatus(result);

        // Reconcile: if government_formations has a definitive status, ensure active_coalitions matches
        if (result.status === 'dissolved' || result.status === 'caretaker') {
            supabase.from('active_coalitions')
                .update(result.status === 'dissolved'
                    ? { status: 'dissolved', dissolved_at: new Date().toISOString() }
                    : { status: 'caretaker' })
                .eq('nation_id', nationId)
                .is('dissolved_at', null)
                .then(() => {}) // fire-and-forget reconciliation
                .catch(e => console.warn('Coalition table reconciliation failed:', e));
        }

        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 15 * 1000);
        return result;
    }

    const { data } = await supabase
        .from('active_coalitions')
        .select('*')
        .eq('nation_id', nationId)
        .is('dissolved_at', null)
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data) {
        await inferCaretakerStatus(data);
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 15 * 1000);
    }
    return data;
}


// ==================== POLICY COMPATIBILITY ====================

function getCompatiblePolicies(sector, allPolicies, faction, isAutocracy, excludePolicyIds = [], activePolicyIds = null) {
    const ideo1 = (faction?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (faction?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    const factionOpposites = new Set(
        factionIdeos.map(fi => IDEOLOGY_OPPOSITES[fi]).filter(Boolean)
    );

    return allPolicies
        .filter(p => p.major_sector === sector && !excludePolicyIds.includes(p.id))
        .map(p => {
            const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);

            const isOpposed = factionIdeos.length > 0 &&
                policyIdeos.length > 0 &&
                policyIdeos.some(pi => factionOpposites.has(pi));

            let prerequisiteMissing = false;
            let prerequisiteName = null;
            if (p.requires_policy_id && activePolicyIds) {
                if (!activePolicyIds.has(p.requires_policy_id)) {
                    prerequisiteMissing = true;
                    const prereq = allPolicies.find(pp => pp.id === p.requires_policy_id);
                    prerequisiteName = prereq?.policy_name || 'Unknown Policy';
                }
            }

            // Structural policies that are already active laws cannot be enacted again
            const alreadyEnacted = activePolicyIds && activePolicyIds.has(p.id) && p.policy_type === 'structural';

            return { ...p, isOpposed, prerequisiteMissing, prerequisiteName, alreadyEnacted };
        });
}


// ==================== BILL SUPPORT ====================

function calculateBillSupport(billSupport, sponsorPartyId, allPartySeats) {
    const sponsorSeats = allPartySeats[sponsorPartyId] || 0;
    const acceptedSeats = (billSupport || [])
        .filter(s => s.stance === 'accept' && s.faction_id !== sponsorPartyId)
        .reduce((sum, s) => sum + (allPartySeats[s.faction_id] || s.seat_count || 0), 0);
    const totalSupport = sponsorSeats + acceptedSeats;
    const percent = Math.round((totalSupport / GAME_CONFIG.TOTAL_SEATS) * 100);
    return { sponsorSeats, acceptedSeats, totalSupport, percent };
}


// ==================== VOTE TALLY SYNC ====================

async function syncVoteTallies(supabase, billId) {
    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('stance, seat_count')
        .eq('bill_id', billId);

    let votesFor = 0, votesAgainst = 0;
    (allVotes || []).forEach(v => {
        if (v.stance === 'yes')       votesFor += v.seat_count;
        else if (v.stance === 'no')   votesAgainst += v.seat_count;
    });

    await supabase.from('bills').update({
        votes_for: votesFor,
        votes_against: votesAgainst
    }).eq('id', billId);

    return { votesFor, votesAgainst };
}


// ==================== ENACTMENT APPROVAL IMPACT ====================

function calculateEnactmentApproval(articles, billSupport, sponsorId, factionIdeologies) {
    const APPROVAL_CAP_POSITIVE = 2;
    const APPROVAL_CAP_NEGATIVE = -5;
    const OPPOSITION_KICKER = -1;

    // Collect all ideology tags from bill articles
    const allTags = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    if (allTags.length === 0) return {};

    // Calculate net direction per axis from all article tags
    const axisNetScores = {};
    for (const tag of allTags) {
        const mapping = IDEOLOGY_TO_AXIS[tag];
        if (!mapping) continue;
        axisNetScores[mapping.axisKey] = (axisNetScores[mapping.axisKey] || 0) + mapping.direction;
    }

    if (Object.keys(axisNetScores).length === 0) return {};

    // Build voter map: factionId -> stance
    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            votes[s.faction_id] = s.stance;
        }
    }

    const approvalDeltas = {};

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance !== 'yes' && stance !== 'no') continue;

        const factionAxes = factionIdeologies[factionId];
        if (!factionAxes) continue;

        // Sum net alignment: positive = bill aligns with faction, negative = opposes
        let netAlignment = 0;
        for (const [axisKey, netDirection] of Object.entries(axisNetScores)) {
            const factionScore = factionAxes[axisKey] || 0;
            // factionScore > 0 means faction leans "right" on this axis
            // netDirection > 0 means bill pushes "right" on this axis
            // Same sign = aligned
            if (factionScore !== 0 && netDirection !== 0) {
                netAlignment += Math.sign(factionScore) === Math.sign(netDirection)
                    ? Math.abs(netDirection)
                    : -Math.abs(netDirection);
            }
        }

        // YES vote: aligned bill = positive, opposed bill = negative
        // NO vote: inverted — opposed bill = positive, aligned bill = negative
        let delta = stance === 'yes' ? netAlignment : -netAlignment;

        // Apply opposition kicker: extra -1 when the result is negative
        if (delta < 0) {
            delta += OPPOSITION_KICKER;
        }

        // Cap the final value
        delta = Math.max(APPROVAL_CAP_NEGATIVE, Math.min(APPROVAL_CAP_POSITIVE, delta));
        approvalDeltas[factionId] = Math.round(delta * 10) / 10;
    }

    return approvalDeltas;
}

async function applyEnactmentApproval(supabase, nationId, approvalDeltas) {
    for (const [factionId, delta] of Object.entries(approvalDeltas)) {
        if (delta === 0) continue;
        await adjustMomentumAll(supabase, nationId, factionId, delta, 'bill:enactment');
    }
}


// ==================== NO-VOTE PENALTY ====================

/**
 * Penalize factions that did not cast any vote (YES/NO/ABSTAIN) on a bill.
 * - Momentum: lose [1d3+1] (2-4) across all blocs
 * - Preference: -2 preference_score with every voter bloc whose ideology axis score
 *   is at least ±10 from center (≤40 or ≥60) on any axis present in the bill.
 *
 * @param {object} supabase
 * @param {object} bill - Full bill row with bill_articles (with policies) and bill_support
 * @param {string} nationId
 */
async function applyNoVotePenalty(supabase, bill, nationId) {
    const PREFERENCE_PENALTY = -2;
    const AXIS_THRESHOLD = 10; // distance from center (50) to count as "having" an ideology

    // 1. Get all party factions in this nation
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!allFactions || allFactions.length === 0) return [];

    // 2. Determine which factions voted (have a bill_support row)
    const votedFactionIds = new Set();
    // Sponsor always counts as having voted (they implicitly support their own bill)
    if (bill.proposed_by) votedFactionIds.add(bill.proposed_by);
    for (const s of (bill.bill_support || [])) {
        if (s.faction_id) votedFactionIds.add(s.faction_id);
    }

    // 3. Find non-voters
    const nonVoters = allFactions.filter(f => !votedFactionIds.has(f.id));
    if (nonVoters.length === 0) return [];

    // 4. Extract ideology tags from bill articles
    const allTags = [];
    for (const art of (bill.bill_articles || [])) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    // Map tags to unique axis keys
    const affectedAxes = new Set();
    for (const tag of allTags) {
        const mapping = IDEOLOGY_TO_AXIS[tag];
        if (mapping) affectedAxes.add(mapping.axisKey);
    }

    // 5. Load voter blocs for this nation (need axis scores to filter)
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    // 6. Determine which blocs are affected (lean ±10 from center on any affected axis)
    const affectedBlocIds = new Set();
    for (const bloc of (voterBlocs || [])) {
        for (const axisKey of affectedAxes) {
            const score = bloc['axis_' + axisKey] ?? 50;
            if (Math.abs(score - 50) >= AXIS_THRESHOLD) {
                affectedBlocIds.add(bloc.id);
                break; // one matching axis is enough
            }
        }
    }

    // 7. Apply penalties to each non-voter
    const penalized = [];
    for (const faction of nonVoters) {
        // Momentum: lose 1d3+1 (2-4) across ALL blocs
        const momentumLoss = -(Math.floor(Math.random() * 3) + 2);
        await adjustMomentumAll(supabase, nationId, faction.id, momentumLoss, 'penalty:no_vote');

        // Preference: -2 preference_score on matched blocs only
        if (affectedBlocIds.size > 0) {
            const { data: blocRows } = await supabase
                .from('faction_bloc_approval')
                .select('id, bloc_id, preference_score')
                .eq('faction_id', faction.id)
                .in('bloc_id', [...affectedBlocIds]);

            for (const row of (blocRows || [])) {
                const newPref = Math.round(Math.max(0, Math.min(100, (row.preference_score ?? 50) + PREFERENCE_PENALTY)));
                await supabase.from('faction_bloc_approval')
                    .update({ preference_score: newPref })
                    .eq('id', row.id);
            }
        }

        penalized.push({
            factionId: faction.id,
            factionName: faction.faction_name,
            momentumLoss,
            preferencePenalty: affectedBlocIds.size > 0 ? PREFERENCE_PENALTY : 0,
            affectedBlocCount: affectedBlocIds.size
        });
    }

    return penalized;
}


// ==================== STATIC IDEOLOGY PENALTY (LEGACY) ====================

function calculateIdeologyPenalty(stage, opposedCount, polarization) {
    if (opposedCount === 0) return 0;

    const pol = polarization || 0;
    let penalty = 0;

    if (stage === 'floor') {
        if (pol >= 50) {
            penalty = -1 * opposedCount;
        } else {
            penalty = -1 * Math.floor(opposedCount / 2);
        }
    } else if (stage === 'passed') {
        penalty = -1 * opposedCount;
        if (pol >= 75) {
            penalty += -2 * opposedCount;
        }
    }

    return penalty;
}


// ==================== BLOC APPROVAL HELPERS ====================

/**
 * Recalculate derived overall approval_rating for a faction from
 * faction_bloc_approval preference_scores weighted by voter_blocs population_weight.
 * Updates the factions.approval_rating cache column.
 */
async function recalcDerivedApproval(supabase, factionId, blocRows) {
    if (!blocRows) {
        const { data } = await supabase
            .from('faction_bloc_approval')
            .select('bloc_id, preference_score')
            .eq('faction_id', factionId);
        blocRows = data || [];
    }
    if (blocRows.length === 0) return null;

    const blocIds = blocRows.map(r => r.bloc_id);
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('id, population_weight')
        .in('id', blocIds);
    if (!blocs || blocs.length === 0) return null;

    const weightMap = {};
    for (const b of blocs) weightMap[b.id] = parseFloat(b.population_weight) || 0;

    let weightedSum = 0;
    for (const row of blocRows) {
        const score = row.preference_score ?? 50;
        weightedSum += score * (weightMap[row.bloc_id] || 0);
    }
    const derived = Math.round(weightedSum / 100);

    await supabase.from('factions')
        .update({ approval_rating: derived })
        .eq('id', factionId);

    return derived;
}

/**
 * Ensures faction_bloc_approval rows exist for a given faction.
 * If none exist, seeds them with default preference_score of 40 for all active blocs.
 * Returns the (possibly newly created) bloc approval rows, or null on failure.
 */
async function ensureBlocApprovals(supabase, factionId, nationId) {
    const { data: existing, error: checkErr } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score')
        .eq('faction_id', factionId);

    if (checkErr) {
        console.error('[ensureBlocApprovals] Check failed:', checkErr.message);
        return null;
    }

    if (existing && existing.length > 0) {
        return existing;
    }

    const { data: blocs, error: blocErr } = await supabase
        .from('voter_blocs')
        .select('id')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    if (blocErr || !blocs || blocs.length === 0) {
        console.warn('[ensureBlocApprovals] No active voter blocs found for nation', nationId);
        return null;
    }

    const rows = blocs.map(bloc => ({
        faction_id: factionId,
        bloc_id: bloc.id,
        preference_score: 40
    }));

    const { error: upsertErr } = await supabase
        .from('faction_bloc_approval')
        .upsert(rows, { onConflict: 'faction_id,bloc_id', ignoreDuplicates: true });

    if (upsertErr) {
        console.error('[ensureBlocApprovals] Upsert failed:', upsertErr.message);
        return null;
    }

    const { data: newRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score')
        .eq('faction_id', factionId);

    console.log(`[ensureBlocApprovals] Seeded ${rows.length} bloc approval rows for faction ${factionId}`);
    return newRows;
}


// ==================== IDEOLOGY SHIFT PROCESSOR ====================

async function processIdeologyShifts(supabase, nationId, resolutions, currentTick) {
    if (!resolutions || resolutions.length === 0) return;

    const billIds = resolutions.map(r => r.billId);

    const { data: bills } = await supabase
        .from('bills')
        .select('id, proposed_by, bill_type, bill_articles(*, policies(*)), bill_support(faction_id, stance)')
        .in('id', billIds);

    if (!bills || bills.length === 0) return;

    // Only legislative bills affect ideology
    const legislativeBills = bills.filter(b =>
        !['no_confidence', 'confirmation', 'minister_confirmation', 'foundational', 'veto_override', 'budget'].includes(b.bill_type)
    );
    if (legislativeBills.length === 0) return;

    const passedBillIds = new Set(resolutions.filter(r => r.result === 'passed').map(r => r.billId));

    // Accumulate shifts: { factionId: { axisKey: totalShift } }
    const factionShifts = {};

    function addShift(factionId, axisKey, amount) {
        if (!factionShifts[factionId]) factionShifts[factionId] = {};
        factionShifts[factionId][axisKey] = (factionShifts[factionId][axisKey] || 0) + amount;
    }

    for (const bill of legislativeBills) {
        // Collect ideology tags from articles (per-article, with duplicates)
        const tags = [];
        for (const art of (bill.bill_articles || [])) {
            const p = art.policies || art;
            if (!p) continue;
            const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);
            tags.push(...ideos);
        }
        if (tags.length === 0) continue;

        const isPassed = passedBillIds.has(bill.id);

        // Build YES voter set (normalize committee stances)
        const yesVoters = new Set();
        for (const s of (bill.bill_support || [])) {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesVoters.add(s.faction_id);
        }
        // Sponsor always counts as YES
        if (bill.proposed_by) yesVoters.add(bill.proposed_by);

        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;

            // +1 for proposing (sponsor only)
            if (bill.proposed_by) {
                addShift(bill.proposed_by, mapping.axisKey, 1 * mapping.direction);
            }

            // +2 for voting YES (all YES voters including sponsor)
            for (const factionId of yesVoters) {
                addShift(factionId, mapping.axisKey, 2 * mapping.direction);
            }

            // +2 if bill passed (YES voters only)
            if (isPassed) {
                for (const factionId of yesVoters) {
                    addShift(factionId, mapping.axisKey, 2 * mapping.direction);
                }
            }
        }
    }

    // Apply accumulated shifts to faction_ideology
    const historyRows = [];

    for (const [factionId, axisShifts] of Object.entries(factionShifts)) {
        let ideologyRow = await loadFactionIdeology(supabase, factionId);
        if (!ideologyRow) {
            const newRow = { faction_id: factionId, liberty_equality: 0, tradition_progress: 0, security_freedom: 0, globalism_nationalism: 0, individualism_collectivism: 0 };
            await supabase.from('faction_ideology').upsert(newRow, { onConflict: 'faction_id' });
            ideologyRow = newRow;
            console.warn(`Created missing faction_ideology row for faction ${factionId}`);
        }

        const currentScores = extractAxisScores(ideologyRow);
        const updateObj = {};
        let hasChanges = false;

        for (const [axisKey, shift] of Object.entries(axisShifts)) {
            const oldScore = currentScores[axisKey] || 0;
            const newScore = Math.max(-100, Math.min(100, oldScore + shift));
            if (newScore !== oldScore) {
                updateObj[axisKey] = newScore;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await supabase.from('faction_ideology').update(updateObj).eq('faction_id', factionId);

            // Record snapshot for ideology_history
            if (typeof currentTick === 'number') {
                const finalScores = { ...currentScores, ...updateObj };
                historyRows.push({
                    faction_id: factionId,
                    nation_id: nationId,
                    tick: currentTick,
                    liberty_equality: finalScores.liberty_equality || 0,
                    tradition_progress: finalScores.tradition_progress || 0,
                    security_freedom: finalScores.security_freedom || 0,
                    globalism_nationalism: finalScores.globalism_nationalism || 0,
                    individualism_collectivism: finalScores.individualism_collectivism || 0
                });
            }
        }
    }

    // Batch insert ideology history snapshots
    if (historyRows.length > 0) {
        const { error: histErr } = await supabase
            .from('ideology_history')
            .insert(historyRows);
        if (histErr) {
            console.warn('[processIdeologyShifts] ideology_history insert failed (table may not exist yet):', histErr.message);
        }
    }
}


// ==================== BILL RESOLUTION ENGINE ====================

/**
 * Returns true if this bill type uses simple/relative majority (YES > NO)
 * rather than an absolute seat threshold.
 */
function isSimpleMajorityBill(billType) {
    return billType !== 'foundational' && billType !== 'veto_override';
}

/**
 * Get the number of YES seats required for a bill to pass.
 *
 * For supermajority bills (foundational, veto_override) the threshold is a
 * fixed fraction of TOTAL_SEATS.
 *
 * For all other bills the rule is simple majority: YES > NO.  When
 * `votesAgainst` is provided, we return `votesAgainst + 1` so the display
 * updates dynamically as votes come in.  Without it we fall back to the
 * absolute half-chamber number for backward compat.
 */
function getRequiredSeats(billType, votesAgainst) {
    if (billType === 'foundational')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.SUPERMAJORITY_THRESHOLD);
    if (billType === 'veto_override')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    if (votesAgainst != null) return votesAgainst + 1;
    return GAME_CONFIG.MAJORITY_SEATS;
}

/**
 * Auto-expire committee bills that have been sitting for COMMITTEE_EXPIRY_TICKS
 * without being sent to the floor. Sets status to 'failed'.
 */
async function expireCommitteeBills(supabase, nationId, currentTick) {
    const deadline = currentTick - GAME_CONFIG.COMMITTEE_EXPIRY_TICKS;
    const { data: expired, error } = await supabase
        .from('bills')
        .select('id, bill_name, proposed_by')
        .eq('nation_id', nationId)
        .eq('status', 'committee')
        .neq('bill_type', 'budget')  // budget bills persist until passed
        .lte('proposed_tick', deadline);

    if (error || !expired || expired.length === 0) return [];

    const results = [];
    for (const bill of expired) {
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
        const { data: nation } = await supabase.from('nations').select('name').eq('id', nationId).single();
        await supabase.rpc('insert_news_event', {
            p_nation_id: nationId,
            p_trigger_key: 'bill_failed',
            p_tick: currentTick,
            p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, reason: 'expired in committee' }
        });
        console.log(`[expireCommitteeBills] ${bill.bill_name} expired in committee after ${GAME_CONFIG.COMMITTEE_EXPIRY_TICKS} ticks`);
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'expired_committee' });
    }
    return results;
}

/**
 * Check all active floor bills for early majority (for or against).
 * If a definitive majority is detected, lock the outcome and shorten
 * voting_ends_tick to currentTick + 1 (one grace tick) so the UI can
 * display the result before resolution.
 *
 * Must run BEFORE resolveExpiredVotes each tick.
 */
async function checkEarlyMajority(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Bills still voting, not yet locked, not yet expired
    // Include budget bills with null voting_ends_tick (they persist until passed)
    const { data: activeBills, error } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, voting_ends_tick, bill_support(faction_id, stance, seat_count)')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .is('early_resolution_status', null)
        .or(`voting_ends_tick.gt.${currentTick},voting_ends_tick.is.null`);

    if (error || !activeBills || activeBills.length === 0) return [];

    const quorumSeats = Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.QUORUM_THRESHOLD);
    const results = [];

    for (const bill of activeBills) {
        let yesSeats = 0, noSeats = 0;
        (bill.bill_support || []).forEach(s => {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesSeats += s.seat_count;
            else if (stance === 'no') noSeats += s.seat_count;
        });

        let earlyStatus = null;
        const totalVoted = yesSeats + noSeats;
        const undeclaredSeats = GAME_CONFIG.TOTAL_SEATS - totalVoted;

        // ── Check 1: Mathematical lock (outcome impossible to change) ──
        if (isSimpleMajorityBill(bill.bill_type)) {
            // Locked YES: even if ALL undeclared vote NO, YES still wins.
            if (yesSeats > noSeats + undeclaredSeats) {
                earlyStatus = 'majority_reached';
            // Locked NO: even if ALL undeclared vote YES, NO still wins/ties.
            } else if (noSeats >= yesSeats + undeclaredSeats) {
                earlyStatus = 'majority_opposed';
            }
        } else {
            // Supermajority: fixed seat threshold
            const requiredSeats = getRequiredSeats(bill.bill_type);
            if (yesSeats >= requiredSeats) {
                earlyStatus = 'majority_reached';
            } else if (noSeats > GAME_CONFIG.TOTAL_SEATS - requiredSeats) {
                earlyStatus = 'majority_opposed';
            }
        }

        // ── Check 2: Quorum-based early resolution ──
        // If not math-locked but quorum (60% of seats) has voted,
        // resolve based on the majority among those who voted.
        // Gives remaining parties a 1-tick grace period to cast their vote.
        if (!earlyStatus && totalVoted >= quorumSeats) {
            if (isSimpleMajorityBill(bill.bill_type)) {
                if (yesSeats > noSeats) {
                    earlyStatus = 'quorum_reached';
                } else if (noSeats > yesSeats) {
                    earlyStatus = 'quorum_opposed';
                }
                // Exact tie at quorum: wait for more votes or deadline
            } else {
                const requiredSeats = getRequiredSeats(bill.bill_type);
                if (yesSeats >= requiredSeats) {
                    earlyStatus = 'quorum_reached';
                } else {
                    earlyStatus = 'quorum_opposed';
                }
            }
        }

        if (earlyStatus) {
            // Grace tick: resolve one tick from now, but never extend past original deadline
            // Budget bills have null voting_ends_tick, so just use currentTick + 1
            const graceEndTick = bill.voting_ends_tick != null
                ? Math.min(currentTick + 1, bill.voting_ends_tick)
                : currentTick + 1;

            await supabase.from('bills').update({
                early_resolution_status: earlyStatus,
                early_resolution_tick: currentTick,
                voting_ends_tick: graceEndTick
            }).eq('id', bill.id);

            const resolveType = earlyStatus.startsWith('quorum') ? 'QUORUM' : 'MATH-LOCK';
            console.log(`[checkEarlyMajority] ${bill.bill_name}: ${earlyStatus} [${resolveType}] (YES=${yesSeats}, NO=${noSeats}, quorum=${quorumSeats}, voted=${totalVoted}). Resolves tick ${graceEndTick}`);
            results.push({ billId: bill.id, billName: bill.bill_name, status: earlyStatus, yesSeats, noSeats });
        }
    }

    return results;
}

async function resolveExpiredVotes(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    const { data: expiredBills, error } = await supabase
        .from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    if (error || !expiredBills || expiredBills.length === 0) return [];

    const results = [];

    for (const bill of expiredBills) {
        const { data: nation } = await supabase
            .from('nations')
            .select('name, government_type')
            .eq('id', bill.nation_id)
            .single();
        let votesFor = 0, votesAgainst = 0;

        (bill.bill_support || []).forEach(s => {
            // Normalize committee stances: 'accept' → 'yes', 'reject' → 'no'
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') votesFor += s.seat_count;
            else if (stance === 'no') votesAgainst += s.seat_count;
        });

        const totalVoted = votesFor + votesAgainst;

        // Determine pass/fail — re-verify actual votes even if early lock was set,
        // since voters may change their stance between the lock tick and resolution tick
        const isNoConfidence = bill.bill_type === 'no_confidence';
        const isFoundational = bill.bill_type === 'foundational';
        let passed;
        if (totalVoted === 0) {
            passed = false;
        } else if (bill.bill_type === 'foundational' || bill.bill_type === 'veto_override') {
            // Supermajority bills require their threshold
            passed = votesFor >= getRequiredSeats(bill.bill_type);
        } else {
            // All other bills: relative majority — YES > NO passes
            passed = votesFor > votesAgainst;
        }

        if (isNoConfidence) {
            // Handle no-confidence resolution (pass or fail)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
            } else {
                await failBill(supabase, bill);
            }
            await resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick);
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'no_confidence', earlyResolution: bill.early_resolution_status || null });
        } else if (isFoundational) {
            // Handle foundational bill resolution (electoral makeup, etc.)
            let enacted = false;
            if (passed) {
                enacted = await enactFoundationalBill(supabase, bill, currentTick);
            }
            if (!passed || !enacted) {
                if (!enacted && passed) {
                    // enactFoundationalBill already marked it 'failed' internally
                    console.warn(`[resolveExpiredVotes] Foundational bill ${bill.id} had enough votes but enactment failed (invalid proposed_seats).`);
                } else {
                    await failBill(supabase, bill);
                }
            }
            const eventKey = enacted ? 'bill_passed' : 'bill_failed';
            await supabase.rpc('fire_system_event', {
                p_trigger_key: eventKey,
                p_nation_id: bill.nation_id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation?.name || 'Unknown',
                    bill_name: bill.bill_name,
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: String(votesFor),
                    votes_against: String(votesAgainst),
                    article_count: '0'
                }
            });
            results.push({ billId: bill.id, billName: bill.bill_name, result: enacted ? 'passed' : 'failed', votesFor, votesAgainst, type: 'foundational', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'confirmation' && bill.ambassador_id) {
            // Ambassador confirmation bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Activate the ambassador — term starts now
                await supabase.from('ambassadors').update({
                    status: 'active',
                    is_active: true,
                    appointed_at_tick: currentTick
                }).eq('id', bill.ambassador_id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: '0'
                    }
                });
            } else {
                await failBill(supabase, bill);
                // Reject the ambassador
                await supabase.from('ambassadors').update({
                    status: 'rejected',
                    is_active: false
                }).eq('id', bill.ambassador_id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_failed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst)
                    }
                });
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'confirmation', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'minister_confirmation' && bill.ministry_key) {
            // Minister confirmation bill (Presidential systems)
            const mKey = bill.ministry_key;
            const { data: ministry } = await supabase.from('ministries')
                .select('id, pending_minister, rejected_parties')
                .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
                .maybeSingle();

            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                if (!ministry) {
                    // Ministry row doesn't exist — create it so the confirmation can proceed
                    console.warn(`Minister confirmation passed but ministry row missing for ${mKey} in nation ${bill.nation_id}. Creating it.`);
                    const { data: createdMinistry } = await supabase.from('ministries').insert({
                        nation_id: bill.nation_id,
                        ministry_key: mKey,
                        ministry_name: mKey,
                        is_active: true,
                        confirmation_status: 'pending',
                        pending_minister: null,
                        rejected_parties: []
                    }).select('id, pending_minister, rejected_parties').single();
                    // Use the bill's metadata as fallback for pending_minister
                    if (createdMinistry && bill.metadata?.pending_minister) {
                        await supabase.from('ministries').update({
                            pending_minister: bill.metadata.pending_minister
                        }).eq('id', createdMinistry.id);
                    }
                }

                if (ministry?.pending_minister) {
                    const pm = ministry.pending_minister;
                    const ministryNames = {
                        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
                        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
                        finance: 'Ministry of Finance', education: 'Ministry of Education',
                        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
                        justice: 'Ministry of Justice', trade: 'Ministry of Trade',
                        energy: 'Ministry of Energy', transportation: 'Ministry of Transportation',
                        security: 'Ministry of Security'
                    };
                    await supabase.from('ministries').update({
                        party_id: pm.party_id,
                        minister_first_name: pm.first_name,
                        minister_last_name: pm.last_name,
                        minister_age: pm.age,
                        minister_approval: 50,
                        ministry_name: ministryNames[mKey] || mKey,
                        confirmation_status: 'confirmed',
                        pending_minister: null
                    }).eq('id', ministry.id);
                }

                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            nation: nation?.name || 'Unknown',
                            bill_name: bill.bill_name,
                            sponsor: bill.factions?.faction_name || 'Unknown',
                            votes_for: String(votesFor),
                            votes_against: String(votesAgainst),
                            article_count: '0'
                        }
                    });
                } catch (e) { /* non-blocking */ }
            } else {
                await failBill(supabase, bill);

                // Record rejected party so President can't re-nominate same party for this slot
                if (ministry?.pending_minister) {
                    const rejectedPartyId = ministry.pending_minister.party_id;
                    const existingRejected = ministry.rejected_parties || [];
                    if (!existingRejected.includes(rejectedPartyId)) {
                        existingRejected.push(rejectedPartyId);
                    }
                    await supabase.from('ministries').update({
                        confirmation_status: 'rejected',
                        pending_minister: null,
                        rejected_parties: existingRejected
                    }).eq('id', ministry.id);
                }

                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            nation: nation?.name || 'Unknown',
                            bill_name: bill.bill_name,
                            sponsor: bill.factions?.faction_name || 'Unknown',
                            votes_for: String(votesFor),
                            votes_against: String(votesAgainst)
                        }
                    });
                } catch (e) { /* non-blocking */ }
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'minister_confirmation', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'veto_override' && bill.original_bill_id) {
            // Veto override bill (Presidential systems)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Enact the ORIGINAL vetoed bill
                const { data: originalBill } = await supabase.from('bills')
                    .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
                    .eq('id', bill.original_bill_id).single();
                if (originalBill) {
                    await supabase.from('bills').update({ president_action: 'overridden' }).eq('id', originalBill.id);
                    await enactBill(supabase, originalBill, currentTick);
                }
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'veto_override', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'veto_override', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.diplomatic_proposal_id) {
            // Diplomatic ratification bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Activate the linked diplomatic proposal
                const { data: proposal } = await supabase.from('diplomatic_proposals')
                    .select('*').eq('id', bill.diplomatic_proposal_id).single();
                if (proposal) {
                    const pd = proposal.proposal_data || {};
                    const updatedPipeline = { ...(pd.pipeline || {}), ratified_at: currentTick };
                    pd.pipeline = updatedPipeline;
                    await supabase.from('diplomatic_proposals')
                        .update({ status: 'active', activated_at_tick: currentTick, proposal_data: pd })
                        .eq('id', bill.diplomatic_proposal_id);
                    // Apply relation effects from active articles
                    const articles = pd.articles || [];
                    const struckIndices = new Set(pd.struck_articles || []);
                    let totalRel = 0;
                    articles.forEach((art, i) => {
                        if (!struckIndices.has(i)) totalRel += art.relations || 0;
                    });
                    if (totalRel !== 0) {
                        const nationA = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.proposing_nation_id : proposal.target_nation_id;
                        const nationB = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.target_nation_id : proposal.proposing_nation_id;
                        const { data: rel } = await supabase.from('diplomatic_relations')
                            .select('id, relation_score, active_treaties')
                            .eq('nation_a_id', nationA).eq('nation_b_id', nationB).maybeSingle();
                        if (rel) {
                            const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) + totalRel));
                            const treaties = Array.isArray(rel.active_treaties) ? [...rel.active_treaties, proposal.id] : [proposal.id];
                            await supabase.from('diplomatic_relations')
                                .update({ relation_score: newScore, active_treaties: treaties }).eq('id', rel.id);
                        }
                    }
                    try {
                        await supabase.rpc('fire_system_event', {
                            p_trigger_key: 'bill_passed',
                            p_nation_id: bill.nation_id,
                            p_tick: currentTick,
                            p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                        });
                    } catch (e) { /* non-blocking */ }
                }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'ratification', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                // Mark proposal as ratification_failed so FM can abandon or retry
                await supabase.from('diplomatic_proposals')
                    .update({ status: 'ratification_failed' })
                    .eq('id', bill.diplomatic_proposal_id);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'ratification', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.trade_negotiation_id) {
            // Trade agreement ratification bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                // Check if the OTHER nation's ratification bill has also passed
                const { data: neg } = await supabase.from('trade_negotiations')
                    .select('*').eq('id', bill.trade_negotiation_id).single();

                if (neg) {
                    const isNationA = bill.nation_id === neg.nation_a_id;
                    const otherBillId = isNationA ? neg.bill_b_id : neg.bill_a_id;

                    let otherPassed = false;
                    if (otherBillId) {
                        const { data: otherBill } = await supabase.from('bills')
                            .select('status').eq('id', otherBillId).single();
                        otherPassed = otherBill?.status === 'passed';
                    }

                    if (otherPassed) {
                        // Both parliaments ratified — activate the trade agreement
                        // Extract duration info from draft articles
                        const articles = neg.draft_articles || [];
                        const durationArt = articles.find(a => a.type === 'duration');
                        const durData = durationArt?.data || {};
                        const isPermanent = durData.duration_type === 'permanent';
                        const durationTicks = durData.duration_ticks || null;
                        const autoRenew = durData.auto_renew || false;
                        const withdrawalNotice = durData.withdrawal_notice_ticks || 3;

                        // Ensure canonical nation order (nation_a_id < nation_b_id)
                        const nA = neg.nation_a_id < neg.nation_b_id ? neg.nation_a_id : neg.nation_b_id;
                        const nB = neg.nation_a_id < neg.nation_b_id ? neg.nation_b_id : neg.nation_a_id;

                        // Insert into trade_agreements
                        await supabase.from('trade_agreements').insert({
                            nation_a_id: nA,
                            nation_b_id: nB,
                            negotiation_id: neg.id,
                            bill_a_id: neg.bill_a_id,
                            bill_b_id: neg.bill_b_id,
                            agreement_type: neg.agreement_type,
                            agreement_name: neg.agreement_name || 'Trade Agreement',
                            articles: articles,
                            duration_type: isPermanent ? 'permanent' : 'fixed',
                            duration_ticks: isPermanent ? null : durationTicks,
                            auto_renew: autoRenew,
                            withdrawal_notice_ticks: withdrawalNotice,
                            status: 'active',
                            enacted_at_tick: currentTick,
                            expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null)
                        });

                        // Mark negotiation as concluded
                        await supabase.from('trade_negotiations')
                            .update({ status: 'concluded', concluded_at_tick: currentTick })
                            .eq('id', neg.id);

                        // Update diplomatic relations
                        const { data: rel } = await supabase.from('diplomatic_relations')
                            .select('id, relation_score, active_treaties')
                            .eq('nation_a_id', nA).eq('nation_b_id', nB).maybeSingle();
                        if (rel) {
                            const bonus = 5; // relation boost for ratified trade agreement
                            const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) + bonus));
                            await supabase.from('diplomatic_relations')
                                .update({ relation_score: newScore }).eq('id', rel.id);
                        }
                    }
                    // If only one side ratified so far, just leave negotiation in 'ratification' status
                }

                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'trade_ratification', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                // Mark negotiation as ratification_failed
                await supabase.from('trade_negotiations')
                    .update({ status: 'ratification_failed' })
                    .eq('id', bill.trade_negotiation_id);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'trade_ratification', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'budget') {
            // Budget bill resolution
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                await resolveBudgetBill(supabase, bill, currentTick);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'budget', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'budget', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (passed) {
            // Presidential systems: route regular/repeal bills to president's desk
            if (isPresidentialRepublic(nation)) {
                await supabase.from('bills').update({
                    status: 'president_desk',
                    passed_tick: currentTick,
                    president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
                }).eq('id', bill.id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name + ' (sent to President\'s desk)',
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: String((bill.bill_articles || []).length)
                    }
                });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'president_desk', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
            } else {
                await enactBill(supabase, bill, currentTick);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: String((bill.bill_articles || []).length)
                    }
                });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
            }
        } else {
            await failBill(supabase, bill);
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'bill_failed',
                p_nation_id: bill.nation_id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation?.name || 'Unknown',
                    bill_name: bill.bill_name,
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: String(votesFor),
                    votes_against: String(votesAgainst)
                }
            });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
        }

        // ── No-vote penalty: punish factions that didn't cast any vote ──
        try {
            const penalized = await applyNoVotePenalty(supabase, bill, bill.nation_id);
            if (penalized.length > 0) {
                const names = penalized.map(p => `${p.factionName} (${p.momentumLoss} momentum, ${p.preferencePenalty} pref to ${p.affectedBlocCount} blocs)`).join(', ');
                console.log(`[resolveExpiredVotes] No-vote penalty on "${bill.bill_name}": ${names}`);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'no_vote_penalty',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            bill_name: bill.bill_name,
                            party_names: penalized.map(p => p.factionName).join(', '),
                            party_count: String(penalized.length)
                        }
                    });
                } catch (e) { /* non-blocking if event key doesn't exist yet */ }
            }
        } catch (penaltyErr) {
            console.error(`[resolveExpiredVotes] No-vote penalty failed for bill ${bill.id}:`, penaltyErr.message);
        }
    }

    return results;
}

async function enactBill(supabase, bill, currentTick) {
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    const { data: currentActiveLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', bill.nation_id);

    if (bill.bill_type === 'repeal' && bill.repeal_active_law_id) {
        const targetLaw = (currentActiveLaws || []).find(l => l.id === bill.repeal_active_law_id);
        if (targetLaw && targetLaw.policies) {
            await reversePolicy(supabase, nation, targetLaw.policies, targetLaw.passed_tick, currentTick);
            await supabase.from('active_laws').delete().eq('id', bill.repeal_active_law_id);
        }
    } else {
        const articles = (bill.bill_articles || []).filter(a => a.policy_id);

        for (const art of articles) {
            const policy = art.policies;
            if (!policy) continue;

            if (policy.opposed_policy_ids && Array.isArray(policy.opposed_policy_ids)) {
                for (const opposedId of policy.opposed_policy_ids) {
                    const opposedLaw = (currentActiveLaws || []).find(l => l.policy_id === opposedId);
                    if (opposedLaw && opposedLaw.policies) {
                        await reversePolicy(supabase, nation, opposedLaw.policies, opposedLaw.passed_tick, currentTick);
                        await supabase.from('active_laws').delete().eq('id', opposedLaw.id);
                    }
                }
            }

            const { error: activeLawError } = await supabase.from('active_laws').insert({
                nation_id: bill.nation_id,
                policy_id: policy.id,
                passed_tick: currentTick,
                proposed_by: bill.proposed_by,
                effects_applied_through_tick: currentTick - 1
            });
            if (activeLawError) {
                console.error(`[enactBill] Failed to insert active_law for policy ${policy.id} (${policy.policy_name}):`, activeLawError.message);
            }
        }
    }

    // Load ideology axes for all voting factions (sponsor + voters)
    const voterFactionIds = [bill.proposed_by, ...(bill.bill_support || []).map(s => s.faction_id)];
    const uniqueFactionIds = [...new Set(voterFactionIds.filter(Boolean))];
    const { data: ideoRows } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', uniqueFactionIds);

    const factionIdeologies = {};
    for (const row of (ideoRows || [])) {
        factionIdeologies[row.faction_id] = row;
    }

    const approvalDeltas = calculateEnactmentApproval(
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by,
        factionIdeologies
    );
    await applyEnactmentApproval(supabase, bill.nation_id, approvalDeltas);
}

async function reversePolicy(supabase, nation, policy, passedTick, currentTick) {
    const ticksActive = currentTick - (passedTick || 0);
    if (ticksActive <= 0) return;

    const sourceEffects = [];
    if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
        sourceEffects.push(...policy.stat_effects);
    } else if (policy.target_stat) {
        sourceEffects.push({
            stat_key: policy.target_stat,
            direction: (policy.stat_direction || 'UP').toLowerCase(),
            rate: policy.stat_change_per_tick || 1,
            delay_ticks: 0,
            duration_ticks: policy.duration_months || 12
        });
    }

    if (sourceEffects.length === 0) return;

    const reversalEffects = [];

    for (const eff of sourceEffects) {
        const delay = eff.delay_ticks || 0;
        const duration = eff.duration_ticks || 12;

        let effectiveTicks = 0;
        if (ticksActive > delay) {
            effectiveTicks = Math.min(ticksActive - delay, duration);
        }

        if (effectiveTicks <= 0) continue;

        reversalEffects.push({
            stat_key: eff.stat_key,
            direction: eff.direction === 'up' ? 'down' : 'up',
            rate: eff.rate || 1,
            delay_ticks: 0,
            duration_ticks: effectiveTicks
        });
    }

    if (reversalEffects.length === 0) return;

    const { error: reversalInsertError } = await supabase.from('active_laws').insert({
        nation_id: nation.id,
        policy_id: policy.id,
        passed_tick: currentTick,
        proposed_by: null,
        effects_applied_through_tick: currentTick - 1,
        is_reversal: true,
        reversal_effects: reversalEffects
    });
    if (reversalInsertError) {
        console.error(`[reversePolicy] Failed to insert reversal active_law for policy ${policy.id}:`, reversalInsertError.message);
    }
}

// ==================== FOUNDATIONAL BILL ENACTMENT ====================

async function enactFoundationalBill(supabase, bill, currentTick) {
    // Validate proposed_seats BEFORE marking the bill as passed
    let newTotalSeats = bill.proposed_seats;

    // Fallback: if proposed_seats is null (column missing or data lost), parse from preamble
    if (!newTotalSeats && bill.preamble) {
        const match = bill.preamble.match(/from\s+\d+\s+to\s+(\d+)/i);
        if (match) {
            newTotalSeats = parseInt(match[1], 10);
            console.warn(`[enactFoundationalBill] proposed_seats was null, recovered ${newTotalSeats} from preamble`);
        }
    }

    if (!newTotalSeats || newTotalSeats < 50 || newTotalSeats > 500) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_seats: ${newTotalSeats}. Marking as failed.`);
        await supabase.from('bills').update({
            status: 'failed',
            passed_tick: currentTick
        }).eq('id', bill.id);
        return false;
    }

    // Validation passed — mark bill as passed
    console.log(`[enactFoundationalBill] Bill ${bill.id}: proposed_seats=${newTotalSeats}. Marking as passed.`);
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    // Get current total seats to compute delta
    const { data: nationData } = await supabase
        .from('nations')
        .select('total_seats')
        .eq('id', bill.nation_id)
        .single();
    const currentTotalSeats = nationData?.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const delta = newTotalSeats - currentTotalSeats;

    // 1. Update nation's total_seats
    await supabase.from('nations').update({
        total_seats: newTotalSeats
    }).eq('id', bill.nation_id);

    if (delta !== 0) {
        // SEATS CHANGE — proportionally rescale all party seats to the new total
        const { data: election } = await supabase
            .from('elections')
            .select('id, results')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'completed')
            .eq('election_type', 'parliamentary')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (election?.results?.votes) {
            const voteTotals = {};
            for (const v of election.results.votes) {
                voteTotals[v.party_id] = v.votes || 0;
            }
            const newSeats = allocateSeatsByVotes(voteTotals, newTotalSeats);

            for (const [partyId, seats] of Object.entries(newSeats)) {
                await supabase.from('factions').update({ seats }).eq('id', partyId);
            }
        }
        console.log(`[enactFoundationalBill] ${currentTotalSeats} -> ${newTotalSeats} (${delta > 0 ? '+' : ''}${delta}). Seats rescaled.`);
    } else {
        console.log(`[enactFoundationalBill] No seat change (already ${newTotalSeats}).`);
    }

    // Update GAME_CONFIG for current session
    GAME_CONFIG.TOTAL_SEATS = newTotalSeats;
    GAME_CONFIG.MAJORITY_SEATS = Math.floor(newTotalSeats / 2) + 1;
    return true;
}

async function failBill(supabase, bill) {
    await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
}

/**
 * Ensure ambassador rows stay in sync when confirmation bills are failed
 * through bulk/force-fail paths that bypass resolveExpiredVotes.
 */
async function syncAmbassadorsForFailedConfirmationBills(supabase, failedBills) {
    if (!Array.isArray(failedBills) || failedBills.length === 0) return;

    const ambassadorIds = [...new Set(
        failedBills
            .filter(b => b?.bill_type === 'confirmation' && b?.ambassador_id)
            .map(b => b.ambassador_id)
    )];

    if (ambassadorIds.length === 0) return;

    const { error } = await supabase
        .from('ambassadors')
        .update({
            status: 'rejected',
            is_active: false
        })
        .in('id', ambassadorIds);

    if (error) {
        console.warn('[syncAmbassadorsForFailedConfirmationBills] Failed to reject ambassadors:', error.message);
    }
}


// ==================== AMBASSADOR TERM LIMITS ====================

/**
 * Process ambassador retirements and warnings for a single nation.
 * Called once per nation per tick inside the advanceTick loop.
 *
 * 1. Retire ambassadors whose term has expired (current_tick - appointed_at_tick >= term_length).
 * 2. Cancel in-progress diplomatic proposals involving the retiring ambassador's nation pair.
 * 3. Appoint a replacement ambassador with a fresh 36-tick term.
 * 4. Fire event log entries for retirements and lapsed negotiations.
 * 5. Show retirement warning at (term_length - AMBASSADOR_RETIREMENT_WARNING) ticks.
 */
async function processAmbassadorRetirements(supabase, nation, currentTick) {
    const results = [];

    // Fetch all active ambassadors for this nation
    const { data: ambassadors, error: fetchErr } = await supabase
        .from('ambassadors')
        .select('id, nation_id, target_nation_id, faction_id, ambassador_first_name, ambassador_last_name, ambassador_age, appointed_at_tick, term_length, retirement_warning_shown')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .eq('status', 'active');

    if (fetchErr || !ambassadors || ambassadors.length === 0) return results;

    // Load target nation names for event messages
    const targetNationIds = [...new Set(ambassadors.map(a => a.target_nation_id))];
    const { data: targetNations } = await supabase
        .from('nations')
        .select('id, name')
        .in('id', targetNationIds);
    const nationNameMap = {};
    if (targetNations) targetNations.forEach(n => { nationNameMap[n.id] = n.name; });

    for (const amb of ambassadors) {
        const appointedTick = amb.appointed_at_tick;
        if (appointedTick == null) continue; // No term tracking — skip

        const termLength = amb.term_length || DIPLOMACY_CONFIG.AMBASSADOR_TERM_LENGTH;
        const ticksServed = currentTick - appointedTick;
        const ticksRemaining = termLength - ticksServed;
        const targetNationName = nationNameMap[amb.target_nation_id] || 'Unknown';
        const ambName = ((amb.ambassador_first_name || '') + ' ' + (amb.ambassador_last_name || '')).trim();

        // ---- RETIREMENT ----
        if (ticksServed >= termLength) {
            const yearsServed = Math.floor(ticksServed / 12);

            // 1. Retire the ambassador
            await supabase.from('ambassadors').update({
                status: 'recalled',
                is_active: false,
                recalled_at_tick: currentTick
            }).eq('id', amb.id);

            // 2. Cancel in-progress diplomatic proposals involving this nation pair
            const cancelStatuses = ['proposed', 'fm_review', 'ratification'];
            const { data: lapsedProposals } = await supabase
                .from('diplomatic_proposals')
                .select('id, proposal_type, proposal_data, proposing_nation_id, target_nation_id, proposing_bill_id, target_bill_id')
                .in('status', cancelStatuses)
                .or(`and(proposing_nation_id.eq.${nation.id},target_nation_id.eq.${amb.target_nation_id}),and(proposing_nation_id.eq.${amb.target_nation_id},target_nation_id.eq.${nation.id})`);

            if (lapsedProposals && lapsedProposals.length > 0) {
                const lapsedIds = lapsedProposals.map(p => p.id);
                await supabase.from('diplomatic_proposals')
                    .update({ status: 'expired', terminated_at_tick: currentTick })
                    .in('id', lapsedIds);

                // Cancel any linked ratification bills
                for (const lp of lapsedProposals) {
                    if (lp.proposing_bill_id) {
                        await supabase.from('bills')
                            .update({ status: 'failed' })
                            .eq('id', lp.proposing_bill_id)
                            .in('status', ['floor', 'committee']);
                    }
                    if (lp.target_bill_id) {
                        await supabase.from('bills')
                            .update({ status: 'failed' })
                            .eq('id', lp.target_bill_id)
                            .in('status', ['floor', 'committee']);
                    }
                }

                // Fire lapsed negotiation event for the OTHER nation
                await supabase.from('event_log').insert({
                    nation_id: amb.target_nation_id,
                    event_name: 'Diplomatic Negotiations Lapsed',
                    category: 'Diplomatic',
                    description_chosen: `${nation.name}'s ambassador has retired. ${lapsedProposals.length} pending negotiation(s) have lapsed. The new ambassador may re-propose if desired.`,
                    fired_at_tick: currentTick
                });
            }

            // 3. Generate replacement ambassador
            let newFirst, newLast;
            do { newFirst = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
            while (newFirst === amb.ambassador_first_name);
            do { newLast = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
            while (newLast === amb.ambassador_last_name);
            const newAge = 35 + Math.floor(Math.random() * 20); // 35-54

            await supabase.from('ambassadors').insert({
                nation_id: nation.id,
                target_nation_id: amb.target_nation_id,
                faction_id: amb.faction_id,
                ambassador_first_name: newFirst,
                ambassador_last_name: newLast,
                ambassador_age: newAge,
                status: 'active',
                is_active: true,
                appointed_at_tick: currentTick,
                term_length: termLength
            });

            // 4. Fire retirement event for this nation
            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Ambassador Retired',
                category: 'Diplomatic',
                description_chosen: `${ambName} has retired after ${yearsServed} year${yearsServed !== 1 ? 's' : ''} of service as Ambassador to ${targetNationName}. ${newFirst} ${newLast} has been appointed as replacement.`,
                fired_at_tick: currentTick
            });

            results.push({ ambassadorId: amb.id, name: ambName, target: targetNationName, action: 'retired', replacement: `${newFirst} ${newLast}` });
            console.log(`[processAmbassadorRetirements] ${ambName} retired from ${nation.name} → ${targetNationName}. Replaced by ${newFirst} ${newLast}.`);

        // ---- RETIREMENT WARNING (3 ticks before) ----
        } else if (ticksRemaining <= DIPLOMACY_CONFIG.AMBASSADOR_RETIREMENT_WARNING && !amb.retirement_warning_shown) {
            await supabase.from('ambassadors')
                .update({ retirement_warning_shown: true })
                .eq('id', amb.id);

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Ambassador Retirement Approaching',
                category: 'Diplomatic',
                description_chosen: `Ambassador ${ambName} to ${targetNationName} will retire in ${ticksRemaining} tick${ticksRemaining !== 1 ? 's' : ''}. Conclude any active negotiations before the transition.`,
                fired_at_tick: currentTick
            });

            results.push({ ambassadorId: amb.id, name: ambName, target: targetNationName, action: 'warning' });
            console.log(`[processAmbassadorRetirements] Retirement warning for ${ambName} (${nation.name} → ${targetNationName}): ${ticksRemaining} ticks remaining.`);
        }
    }

    return results;
}


// ==================== ADMINISTRATION LIFECYCLE ====================

/**
 * Canonical nation stat columns — the SINGLE SOURCE OF TRUTH.
 *
 * Every stat key in every effect table (policies, crises, events, ministry
 * actions, PM traits, diplomacy) MUST match one of these keys exactly.
 * If a legacy key exists in the database, add it to STAT_KEY_ALIASES below
 * so normalizeNationStatKey() can resolve it.
 *
 * Used by: processStatEffects, processCrises, processEvents,
 *          processMinistryActions, processPMTraitEffects, auditStatKeys,
 *          snapshotNationHistory, administration snapshots.
 *
 * CANONICAL STAT KEY REFERENCE:
 *   --- Economic ---
 *   gdp                        GDP ($B)
 *   gdp_growth                 Annual economic growth rate
 *   debt                       Government debt obligations ($B)
 *   debt_growth                Rate of debt accumulation
 *   inflation                  Rate of price increases
 *   interest_rates             Central bank lending rate
 *   trade_balance              Exports minus imports
 *   currency_strength          Value of national currency
 *   foreign_investment         International capital inflow
 *   credit                     National creditworthiness
 *   --- Taxation ---
 *   income_tax                 Tax rate on personal income
 *   corporate_tax              Tax rate on business profits
 *   sales_tax                  Tax on goods and services
 *   tariffs                    Import/export duties
 *   --- Labor & Employment ---
 *   unemployment               Percentage without work
 *   labor_force_participation  Working-age adults employed
 *   minimum_wage               Lowest legal hourly wage
 *   union_strength             Power of labor unions
 *   poverty_rate               Population below poverty line
 *   income_inequality          Gap between rich and poor
 *   --- Demographics ---
 *   population                 Total population (raw number)
 *   population_growth          Rate of population change
 *   birth_rate                 Births per 1,000 people
 *   death_rate                 Deaths per 1,000 people
 *   median_age                 Average age of population
 *   eligible_voters            Citizens able to vote
 *   ethnic_diversity           Cultural heterogeneity
 *   --- Healthcare ---
 *   healthcare_quality         Overall medical care standard
 *   healthcare_accessibility   Access to medical services
 *   beds_per_100k              Hospital beds per 100,000 people  (NOT "hospital_beds")
 *   lifespan                   Average lifespan in years         (NOT "life_expectancy")
 *   drug_use                   Substance abuse prevalence
 *   --- Education ---
 *   literacy                   Population able to read/write     (NOT "literacy_rate")
 *   higher_education           University graduation rate        (NOT "education_quality")
 *   education_accessibility    Access to schooling
 *   academic_immigration       Scholars attracted to nation
 *   --- Infrastructure ---
 *   physical_infrastructure    Roads, bridges, ports, public works (NOT "infrastructure")
 *   digital_infrastructure     Internet and tech networks        (NOT "technology")
 *   rail_network               Train connectivity
 *   urbanization               Population in cities
 *   energy_generation          Power production capacity
 *   renewable_energy_percentage Clean energy percentage
 *   --- Resources ---
 *   arable_land                Farmable land area
 *   rare_minerals              Strategic mineral reserves
 *   oil_and_gas                Fossil fuel reserves
 *   fuel_prices                Consumer fuel costs
 *   --- Environment ---
 *   pollution                  Environmental contamination
 *   carbon_emissions           CO2 output
 *   --- Social ---
 *   standard_of_living         Quality of life index
 *   happiness                  Population wellbeing
 *   social_mobility            Ability to change economic class
 *   benefits                   Government welfare programs
 *   crime_rate                 Criminal activity level           (NOT "crime")
 *   incarceration_rate         Prison population per capita
 *   --- Religion ---
 *   religious                  Religiosity index
 *   --- Governance ---
 *   stability                  Political stability               (also used for "military_strength")
 *   legitimacy                 Government legitimacy
 *   efficiency                 Bureaucratic efficiency
 *   corruption                 Government corruption
 *   press_freedom              Media independence
 *   judicial_independence      Court system independence
 *   freedom_index              Civil liberties composite
 *   polarization               Political division
 *   --- Security ---
 *   civil_unrest               Public disorder
 *   terrorism                  Terrorist threat level
 *   political_violence         Political violence
 *   --- Immigration ---
 *   immigration                Legal immigration rate
 *   illegal_immigration        Unauthorized entry rate
 *   emigration                 Citizens leaving
 *   --- International ---
 *   international_reputation   Global standing                   (NOT "diplomatic_standing")
 *   trade_agreements           Number of trade agreements        (NOT "trade")
 *   sanctions                  Active sanctions against nation
 */
const NATION_STAT_COLUMNS = [
    'gdp', 'gdp_growth', 'debt', 'debt_growth', 'inflation', 'interest_rates',
    'trade_balance', 'currency_strength', 'foreign_investment', 'credit',
    'income_tax', 'corporate_tax', 'sales_tax', 'tariffs',
    'unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength',
    'poverty_rate', 'income_inequality',
    'population', 'population_growth', 'birth_rate', 'death_rate', 'median_age', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network', 'urbanization', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals', 'oil_and_gas', 'fuel_prices',
    'pollution', 'carbon_emissions',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits', 'crime_rate', 'incarceration_rate',
    'religious',
    'stability', 'legitimacy', 'efficiency', 'corruption', 'press_freedom', 'judicial_independence',
    'freedom_index', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'immigration', 'illegal_immigration', 'emigration',
    'international_reputation', 'trade_agreements', 'sanctions'
];

const NATION_STAT_COLUMN_SET = new Set(NATION_STAT_COLUMNS);

const STAT_KEY_ALIASES = {
    intl_reputation: 'international_reputation',
    diplomatic_standing: 'international_reputation',
    credit_rating: 'credit',
    credit_score: 'credit',
    trade: 'trade_balance',
    trade_volume: 'trade_balance',
    education: 'higher_education',
    education_quality: 'higher_education',
    military_strength: 'stability',
    literacy_rate: 'literacy',
    hospital_beds: 'beds_per_100k',
    technology: 'digital_infrastructure',
    infrastructure: 'physical_infrastructure',
    tourism: 'international_reputation'
};

function normalizeNationStatKey(statKey) {
    if (!statKey || typeof statKey !== 'string') return null;
    return STAT_KEY_ALIASES[statKey] || statKey;
}

/**
 * Stats where HIGHER values are better (increase = achievement).
 */
const STATS_HIGHER_IS_BETTER = [
    'gdp', 'gdp_growth', 'currency_strength', 'foreign_investment', 'credit',
    'labor_force_participation', 'minimum_wage', 'union_strength',
    'population_growth', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits',
    'stability', 'legitimacy', 'efficiency', 'press_freedom', 'judicial_independence', 'freedom_index',
    'immigration', 'international_reputation', 'trade_agreements'
];

/**
 * Stats where LOWER values are better (decrease = achievement).
 */
const STATS_LOWER_IS_BETTER = [
    'debt', 'debt_growth', 'inflation', 'interest_rates',
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'drug_use', 'fuel_prices', 'pollution', 'carbon_emissions',
    'crime_rate', 'incarceration_rate', 'corruption', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'illegal_immigration', 'emigration', 'sanctions'
];

// ==================== STAT DECAY CONFIGURATION ====================

const DECAY_SPEED = { VERY_SLOW: 0.5, SLOW: 1, MEDIUM: 2, FAST: 3 };

/**
 * Stats that decay each tick. Two types:
 *   - 'equilibrium': drifts toward a midpoint (requires constant governing effort)
 *   - 'erosion': degrades toward a bad floor (punishes neglect)
 * Stats not listed are persistent — they hold value indefinitely.
 */
const STAT_DECAY_CONFIG = {
    // ── Equilibrium (drift back to midpoint) ──
    inflation:           { type: 'equilibrium', target: 50, speed: DECAY_SPEED.MEDIUM },
    interest_rates:      { type: 'equilibrium', target: 50, speed: DECAY_SPEED.MEDIUM },
    currency_strength:   { type: 'equilibrium', target: 50, speed: DECAY_SPEED.SLOW },
    civil_unrest:        { type: 'equilibrium', target: 20, speed: DECAY_SPEED.FAST },
    polarization:        { type: 'equilibrium', target: 30, speed: DECAY_SPEED.SLOW },
    terrorism:           { type: 'equilibrium', target: 10, speed: DECAY_SPEED.SLOW },
    political_violence:  { type: 'equilibrium', target: 10, speed: DECAY_SPEED.MEDIUM },
    happiness:           { type: 'equilibrium', target: 50, speed: DECAY_SPEED.SLOW },
    foreign_investment:  { type: 'equilibrium', target: 50, speed: DECAY_SPEED.MEDIUM },
    trade_balance:       { type: 'equilibrium', target: 50, speed: DECAY_SPEED.SLOW },
    gdp_growth:          { type: 'equilibrium', target: 50, speed: DECAY_SPEED.MEDIUM },
    immigration:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.MEDIUM },
    illegal_immigration: { type: 'equilibrium', target: 30, speed: DECAY_SPEED.SLOW },
    emigration:          { type: 'equilibrium', target: 30, speed: DECAY_SPEED.MEDIUM },
    fuel_prices:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.MEDIUM },
    debt_growth:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.SLOW },

    // ── Erosion (degrade toward bad floor if neglected) ──
    physical_infrastructure:  { type: 'erosion', target: 0,  speed: DECAY_SPEED.VERY_SLOW },
    digital_infrastructure:   { type: 'erosion', target: 0,  speed: DECAY_SPEED.SLOW },
    rail_network:             { type: 'erosion', target: 0,  speed: DECAY_SPEED.VERY_SLOW },
    energy_generation:        { type: 'erosion', target: 0,  speed: DECAY_SPEED.VERY_SLOW },
    efficiency:               { type: 'erosion', target: 30, speed: DECAY_SPEED.SLOW },
    corruption:               { type: 'erosion', target: 70, speed: DECAY_SPEED.SLOW },
    healthcare_quality:       { type: 'erosion', target: 30, speed: DECAY_SPEED.SLOW },
    healthcare_accessibility: { type: 'erosion', target: 30, speed: DECAY_SPEED.SLOW },
    beds_per_100k:            { type: 'erosion', target: 20, speed: DECAY_SPEED.VERY_SLOW },
    education_accessibility:  { type: 'erosion', target: 30, speed: DECAY_SPEED.SLOW },
    press_freedom:            { type: 'erosion', target: 40, speed: DECAY_SPEED.SLOW },
    judicial_independence:    { type: 'erosion', target: 40, speed: DECAY_SPEED.SLOW },
    freedom_index:            { type: 'erosion', target: 40, speed: DECAY_SPEED.VERY_SLOW },
    standard_of_living:       { type: 'erosion', target: 40, speed: DECAY_SPEED.VERY_SLOW },
    social_mobility:          { type: 'erosion', target: 30, speed: DECAY_SPEED.SLOW },
    benefits:                 { type: 'erosion', target: 0,  speed: DECAY_SPEED.MEDIUM },
};

// Validate decay config keys at module load
for (const key of Object.keys(STAT_DECAY_CONFIG)) {
    if (!NATION_STAT_COLUMN_SET.has(key)) {
        console.error(`[STAT_DECAY_CONFIG] Invalid stat key: "${key}" — not in NATION_STAT_COLUMNS`);
    }
}

// ==================== INSTITUTION FUNDING DECAY TIERS ====================
// Institutions counteract natural stat decay. At 100% funding, decay is fully
// blocked. Below 100%, the rates below REPLACE the natural decay rate for stats
// covered by that institution. When multiple institutions cover the same stat,
// their rates are averaged.

const INSTITUTION_DECAY_TIERS = [
    { minPct: 100, primary: 0,    secondary: 0    },  // Fully Funded
    { minPct: 90,  primary: 0.3,  secondary: 0    },  // Stretched
    { minPct: 75,  primary: 0.5,  secondary: 0.2  },  // Strained
    { minPct: 50,  primary: 0.9,  secondary: 0.5  },  // Underfunded
    { minPct: 25,  primary: 1.7,  secondary: 0.9  },  // Critical
    { minPct: 0,   primary: 2.7,  secondary: 1.7  },  // Collapsed
];

/**
 * Look up the institution decay rate for a given funding percentage.
 * @param {number} fundingPct - 0-100 funding percentage
 * @param {'primary'|'secondary'} role - whether this stat is the institution's primary or secondary
 * @returns {number} decay rate per tick (0 = no decay)
 */
function getInstitutionDecayRate(fundingPct, role) {
    for (const tier of INSTITUTION_DECAY_TIERS) {
        if (fundingPct >= tier.minPct) return tier[role];
    }
    return INSTITUTION_DECAY_TIERS[INSTITUTION_DECAY_TIERS.length - 1][role];
}

/**
 * Build a map of statKey → array of { institutionId, role, fundingPct } from
 * institution config rows and budget_item_allocations for the active budget.
 *
 * @param {Array} instConfig - rows from ministry_institution_config
 * @param {Array} itemAllocations - rows from budget_item_allocations for the active bill
 * @returns {Object} e.g. { healthcare_quality: [{ id: 'workforce', role: 'primary', fundingPct: 85 }, ...] }
 */
function buildStatInstitutionMap(instConfig, itemAllocations) {
    const allocMap = {};
    for (const row of (itemAllocations || [])) {
        if (row.item_type === 'institution') {
            allocMap[row.item_id] = {
                allocated: Number(row.allocation_amount || 0),
                needed: Number(row.needed_amount || 0)
            };
        }
    }

    const statMap = {};
    for (const inst of (instConfig || [])) {
        const alloc = allocMap[inst.id];
        const fundingPct = alloc && alloc.needed > 0
            ? Math.min(100, Math.round((alloc.allocated / alloc.needed) * 100))
            : 0;  // no allocation row = unfunded

        for (const role of ['primary', 'secondary']) {
            const statKey = inst[`${role}_stat`];
            if (!statKey) continue;
            if (!statMap[statKey]) statMap[statKey] = [];
            statMap[statKey].push({ id: inst.id, role, fundingPct });
        }
    }
    return statMap;
}

/**
 * For a given stat, compute the effective institution decay rate by averaging
 * all institutions that cover it (as primary or secondary).
 *
 * @param {Array} institutions - entries from buildStatInstitutionMap()[statKey]
 * @returns {number|null} averaged decay rate, or null if no institutions cover this stat
 */
function getAveragedInstitutionDecay(institutions) {
    if (!institutions || institutions.length === 0) return null;
    let total = 0;
    for (const inst of institutions) {
        total += getInstitutionDecayRate(inst.fundingPct, inst.role);
    }
    return total / institutions.length;
}

// ==================== THREE-PILLAR VOTING SYSTEM MAPPINGS ====================

/**
 * Maps each nation stat to the ministry responsible for it.
 * Used by performance perception to credit/blame ministry-holding parties.
 */
const STAT_TO_MINISTRY = {
    // Finance
    gdp: 'finance', gdp_growth: 'finance', debt: 'finance', debt_growth: 'finance',
    inflation: 'finance', interest_rates: 'finance',
    currency_strength: 'finance', credit: 'finance',
    income_tax: 'finance', corporate_tax: 'finance', sales_tax: 'finance',
    // Healthcare
    healthcare_quality: 'healthcare', healthcare_accessibility: 'healthcare',
    beds_per_100k: 'healthcare', lifespan: 'healthcare', drug_use: 'healthcare',
    death_rate: 'healthcare',
    // Education
    literacy: 'education', higher_education: 'education',
    education_accessibility: 'education', academic_immigration: 'education',
    // Labor
    unemployment: 'labor', labor_force_participation: 'labor',
    minimum_wage: 'labor', union_strength: 'labor',
    poverty_rate: 'labor', income_inequality: 'labor',
    // Interior
    stability: 'interior', civil_unrest: 'interior',
    crime_rate: 'interior', incarceration_rate: 'interior',
    immigration: 'interior', illegal_immigration: 'interior',
    // Justice
    corruption: 'justice', judicial_independence: 'justice',
    press_freedom: 'justice', freedom_index: 'justice',
    // Energy
    energy_generation: 'energy', renewable_energy_percentage: 'energy',
    pollution: 'energy', carbon_emissions: 'energy',
    // Transportation
    physical_infrastructure: 'transportation', digital_infrastructure: 'transportation',
    rail_network: 'transportation', urbanization: 'transportation',
    // Defense
    terrorism: 'defense', political_violence: 'defense',
    // Trade
    trade_balance: 'trade', trade_agreements: 'trade',
    tariffs: 'trade', foreign_investment: 'trade',
    // Foreign
    international_reputation: 'foreign',
    sanctions: 'foreign', emigration: 'foreign',
    // Prime Minister (general governance & quality of life)
    legitimacy: 'prime_minister', efficiency: 'prime_minister', polarization: 'prime_minister',
    happiness: 'prime_minister', standard_of_living: 'prime_minister',
    social_mobility: 'prime_minister', benefits: 'prime_minister',
    fuel_prices: 'prime_minister'
};

/**
 * Maps voter-bloc priority issue categories to the nation stats they care about.
 * Each bloc has 1-2 priority_issues (e.g., ['Economics', 'Labor']).
 */
const ISSUE_CATEGORY_STATS = {
    Agriculture:     ['arable_land', 'fuel_prices', 'trade_balance', 'poverty_rate'],
    Economics:       ['gdp', 'gdp_growth', 'inflation', 'unemployment', 'currency_strength', 'trade_balance', 'debt'],
    Education:       ['literacy', 'higher_education', 'education_accessibility', 'academic_immigration'],
    Governance:      ['stability', 'legitimacy', 'efficiency', 'corruption', 'freedom_index'],
    Healthcare:      ['healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use'],
    Immigration:     ['immigration', 'illegal_immigration', 'emigration', 'ethnic_diversity'],
    Infrastructure:  ['physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage'],
    International:   ['international_reputation', 'trade_agreements', 'sanctions', 'foreign_investment'],
    Labor:           ['unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength', 'poverty_rate', 'income_inequality'],
    Military:        ['terrorism', 'political_violence', 'civil_unrest', 'stability'],
    Social:          ['standard_of_living', 'happiness', 'social_mobility', 'crime_rate', 'pollution', 'benefits']
};

const _HIGHER_IS_BETTER_SET = new Set(STATS_HIGHER_IS_BETTER);
const _LOWER_IS_BETTER_SET  = new Set(STATS_LOWER_IS_BETTER);

/**
 * Returns +1 if a positive delta is "good", -1 if negative delta is "good", 0 if neutral.
 */
function statDirectionSign(statKey) {
    if (_HIGHER_IS_BETTER_SET.has(statKey)) return 1;
    if (_LOWER_IS_BETTER_SET.has(statKey)) return -1;
    return 0;
}

// ==================== STAT TREND CALCULATION ====================

/** Weights for weighted-average trend: most recent delta gets 0.40, oldest gets 0.05 */
const TREND_WEIGHTS = [0.05, 0.05, 0.10, 0.15, 0.25, 0.40];

/**
 * Weighted trend for a single stat over the last `lookback` ticks.
 * Returns a signed value: positive = rising, negative = falling.
 * Requires stat_history rows populated by recordStatHistory().
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} statName  - nation stat key (e.g. 'unemployment')
 * @param {number} [lookback=6] - how many tick-deltas to consider
 * @returns {Promise<number>} weighted trend value
 */
async function statTrend(supabase, nationId, statName, lookback = 6) {
    const { data: rows } = await supabase
        .from('stat_history')
        .select('value, tick')
        .eq('nation_id', nationId)
        .eq('stat_name', statName)
        .order('tick', { ascending: true })
        .limit(lookback + 1);

    if (!rows || rows.length < 2) return 0;

    let weightedSum = 0;
    const deltas = rows.length - 1;
    for (let i = 1; i < rows.length; i++) {
        const delta = rows[i].value - rows[i - 1].value;
        const weightIdx = Math.max(0, TREND_WEIGHTS.length - deltas + i - 1);
        weightedSum += delta * (TREND_WEIGHTS[weightIdx] || 0.10);
    }
    return weightedSum;
}

/**
 * Batch version: compute weighted trends for multiple stats in a single query.
 * Returns { statName: trendValue, ... }.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string[]} statNames - array of stat keys
 * @param {number} [lookback=6]
 * @returns {Promise<Object.<string, number>>}
 */
async function statTrendBatch(supabase, nationId, statNames, lookback = 6) {
    if (!statNames || statNames.length === 0) return {};

    const { data: rows } = await supabase
        .from('stat_history')
        .select('stat_name, value, tick')
        .eq('nation_id', nationId)
        .in('stat_name', statNames)
        .order('tick', { ascending: true });

    if (!rows || rows.length === 0) return {};

    // Group by stat_name
    const byName = {};
    for (const r of rows) {
        if (!byName[r.stat_name]) byName[r.stat_name] = [];
        byName[r.stat_name].push(r);
    }

    const trends = {};
    for (const [name, vals] of Object.entries(byName)) {
        const recent = vals.slice(-(lookback + 1));
        if (recent.length < 2) { trends[name] = 0; continue; }
        let weightedSum = 0;
        const deltas = recent.length - 1;
        for (let i = 1; i < recent.length; i++) {
            const delta = recent[i].value - recent[i - 1].value;
            const weightIdx = Math.max(0, TREND_WEIGHTS.length - deltas + i - 1);
            weightedSum += delta * (TREND_WEIGHTS[weightIdx] || 0.10);
        }
        trends[name] = weightedSum;
    }
    return trends;
}

// ==================== MINISTER & GOVERNMENT APPROVAL SYSTEM ====================

/**
 * Reverse map: ministry_key → [stat_keys] derived from STAT_TO_MINISTRY.
 * Used by the per-tick minister approval calculation to find which stats
 * each minister "owns".
 */
const MINISTRY_TO_STATS = {};
for (const [statKey, ministryKey] of Object.entries(STAT_TO_MINISTRY)) {
    if (!MINISTRY_TO_STATS[ministryKey]) MINISTRY_TO_STATS[ministryKey] = [];
    MINISTRY_TO_STATS[ministryKey].push(statKey);
}

/**
 * Threshold-based approval contribution for a single stat.
 * Returns how much a stat's current value helps or hurts the responsible minister.
 *
 * Normal stats (higher=better): >=70 → +1.5, 50-69 → +0.5, 30-49 → -1.5, <30 → -3.0
 * Inverse stats (lower=better): <=15 → +1.5, 16-30 → +0.5, 31-50 → -1.5, >50  → -3.0
 *
 * @param {string} statKey - nation stat key
 * @param {number} value   - current stat value
 * @returns {number} approval contribution (-3.0 to +1.5)
 */
function statApprovalContribution(statKey, value) {
    const sign = statDirectionSign(statKey);
    if (sign === 0) return 0;

    if (sign === 1) {
        // Higher is better
        if (value >= 70) return 1.5;
        if (value >= 50) return 0.5;
        if (value >= 30) return -1.5;
        return -3.0;
    } else {
        // Lower is better (inverse)
        if (value <= 15) return 1.5;
        if (value <= 30) return 0.5;
        if (value <= 50) return -1.5;
        return -3.0;
    }
}

const GOV_APPROVAL_CONFIG = {
    // ─── New spec weights (Phase 4) ───
    INSTITUTIONAL_WEIGHT: 0.45,
    OUTCOMES_WEIGHT: 0.35,
    EVENTS_WEIGHT: 0.20,

    // Events component decay (12% per tick — transient shocks fade naturally)
    EVENTS_DECAY_RATE: 0.12,

    // Outcome stats: universal stats everyone cares about, with relative weights
    OUTCOME_STATS: [
        { stat: 'standard_of_living', weight: 0.18 },
        { stat: 'unemployment',       weight: 0.15, inverted: true },
        { stat: 'inflation',          weight: 0.12, inverted: true },
        { stat: 'crime_rate',         weight: 0.10, inverted: true },
        { stat: 'healthcare_quality', weight: 0.10 },
        { stat: 'happiness',          weight: 0.10 },
        { stat: 'poverty_rate',       weight: 0.08, inverted: true },
        { stat: 'gdp_growth',         weight: 0.07 },
        { stat: 'stability',          weight: 0.05 },
        { stat: 'corruption',         weight: 0.05, inverted: true },
    ],
    OUTCOME_TREND_LOOKBACK: 8,
    OUTCOME_TREND_WEIGHT: 0.6,    // 60% trend direction
    OUTCOME_ABSOLUTE_WEIGHT: 0.4, // 40% absolute level

    // Gov approval → momentum feedback
    FEEDBACK_THRESHOLD: 2,          // min delta to trigger feedback
    FEEDBACK_COALITION_COEFF: 0.15, // coalition gets 15% of delta as momentum
    FEEDBACK_OPPOSITION_COEFF: 0.08, // opposition gets inverse 8%

    // Vacancy penalty per unfilled ministry
    VACANCY_PENALTY: -5,

    // Embattled / Crisis thresholds (kept from original)
    EMBATTLED_THRESHOLD: 30,
    EMBATTLED_TICKS_REQUIRED: 5,
    EMBATTLED_GOV_PENALTY: -1,
    CRISIS_THRESHOLD: 20,
    CRISIS_GOV_PENALTY: -2,

    // Minister firing (kept from original)
    FIRE_MINISTER_AP_COST: 1,
    NEW_MINISTER_APPROVAL: 45,
    FIRE_GOV_APPROVAL_BONUS: 3,

};

/**
 * Snapshot all nation stats into a flat JSONB object.
 */
function snapshotNationStats(nation) {
    const snapshot = {};
    for (const key of NATION_STAT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = nation[key];
        }
    }
    return snapshot;
}

/**
 * Close the current administration for a nation.
 * Snapshots end stats, queries bills/crises during the admin's tenure, sets end fields.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot)
 * @param {string} endReason - Why the admin ended: 'election_loss', 'new_coalition', 'coalition_collapse', 'coup'
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string (e.g., "March, 2001")
 * @param {number|null} governmentApproval - Current government approval percentage
 */
async function closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval) {
    try {
        // Find all currently open administrations (defensive against legacy duplicates)
        const { data: openAdmins, error: openAdminsErr } = await supabase
            .from('administrations')
            .select('*')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null)
            .order('started_at_tick', { ascending: false })
            .order('created_at', { ascending: false });

        if (openAdminsErr) throw openAdminsErr;

        if (!openAdmins || openAdmins.length === 0) {
            console.warn('closeAdministration: No open administration found for nation', nationId);
            return;
        }

        if (openAdmins.length > 1) {
            console.warn('closeAdministration: duplicate open administrations detected', {
                event: 'duplicate_open_administrations',
                nation_id: nationId,
                open_count: openAdmins.length,
                open_admin_ids: openAdmins.map(a => a.id),
                resolution: 'closing_all_open_rows_with_consistent_end_fields',
                end_reason: endReason,
                end_tick: currentTick
            });
        }

        const statsAtEnd = snapshotNationStats(nation);

        for (const currentAdmin of openAdmins) {
            // Query bills passed during this administration
            const { data: passedBills, error: passedBillsErr } = await supabase
                .from('bills')
                .select('id, bill_name, passed_tick')
                .eq('nation_id', nationId)
                .eq('status', 'passed')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            if (passedBillsErr) throw passedBillsErr;

            const billsPassed = (passedBills || []).map(b => ({
                bill_id: b.id,
                bill_name: b.bill_name,
                passed_tick: b.passed_tick
            }));

            // Query crises (events with category 'crisis' or matching crisis event names)
            const { data: eventsDuring, error: eventsErr } = await supabase
                .from('event_log')
                .select('event_id, event_name, category, fired_at_tick')
                .eq('nation_id', nationId)
                .gte('fired_at_tick', currentAdmin.started_at_tick)
                .lte('fired_at_tick', currentTick);
            if (eventsErr) throw eventsErr;

            const crisisEvents = (eventsDuring || []).filter(e =>
                e.category === 'crisis' || e.category === 'disaster' || e.category === 'conflict'
            );

            const crisesStarted = crisisEvents
                .filter(e => !e.event_name || !e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    event_id: e.event_id,
                    title: e.event_name,
                    started_tick: e.fired_at_tick
                }));

            const crisesSolved = (eventsDuring || [])
                .filter(e => e.event_name && e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    title: e.event_name.replace('CRISIS_RESOLVED: ', ''),
                    solved_tick: e.fired_at_tick
                }));

            // Count elections survived (elections that occurred during this admin where the coalition continued)
            const { data: electionsDuring, error: electionsErr } = await supabase
                .from('elections')
                .select('id, election_tick')
                .eq('nation_id', nationId)
                .eq('status', 'completed')
                .gte('election_tick', currentAdmin.started_at_tick)
                .lt('election_tick', currentTick);
            if (electionsErr) throw electionsErr;

            // Update the administration record
            const { error: updateErr } = await supabase
                .from('administrations')
                .update({
                    stats_at_end: statsAtEnd,
                    approval_at_end: governmentApproval,
                    ended_at_tick: currentTick,
                    ended_at_date: currentDate,
                    end_reason: endReason,
                    bills_passed: billsPassed,
                    laws_repealed: [],
                    crises_started: crisesStarted,
                    crises_solved: crisesSolved,
                    elections_survived: (electionsDuring || []).length,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentAdmin.id);
            if (updateErr) throw updateErr;

            console.log(`Administration closed: "${currentAdmin.admin_name}" — reason: ${endReason}`);
        }
    } catch (err) {
        console.error('closeAdministration error:', err);
        throw err;
    }
}

/**
 * Create a new administration record when a coalition forms.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot + HOS)
 * @param {object} coalition - Active coalition object (party_ids, lead_party_id)
 * @param {Array} allParties - Array of faction objects with id, faction_name, seats
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string
 * @param {number|null} governmentApproval - Current government approval percentage
 */
async function createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval) {
    try {
        // Safety net: close any orphaned open administrations before creating a new one
        const { data: orphaned } = await supabase
            .from('administrations')
            .select('id')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null);
        if (orphaned && orphaned.length > 0) {
            console.warn(`createAdministration: closing ${orphaned.length} orphaned open administration(s) for nation ${nationId}`);
            await supabase
                .from('administrations')
                .update({ ended_at_tick: currentTick, ended_at_date: currentDate, end_reason: 'new_coalition' })
                .eq('nation_id', nationId)
                .is('ended_at_tick', null);
        }

        const statsAtStart = snapshotNationStats(nation);

        // Build coalition party info
        const coalitionPartyIds = coalition?.party_ids || [];
        const coalitionParties = coalitionPartyIds.map(pid => {
            const party = allParties.find(p => p.id === pid);
            return {
                party_id: pid,
                party_name: party?.faction_name || 'Unknown',
                seats: party?.seats || 0
            };
        });
        const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

        // Get PM party info
        const leadPartyId = coalition?.lead_party_id;
        const leadParty = allParties.find(p => p.id === leadPartyId);
        const pmPartyName = leadParty?.faction_name || 'Unknown';

        // Get active PM name
        const { data: activeHOG } = await supabase
            .from('head_of_government')
            .select('first_name, last_name')
            .eq('nation_id', nationId)
            .eq('active', true)
            .maybeSingle();

        const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;

        // Head of state name
        const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
            ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
            : null;

        // Generate admin name from PM last name, falling back to HOS
        const adminName = activeHOG?.last_name
            ? `${activeHOG.last_name} Administration`
            : (nation.head_of_state_last_name
                ? `${nation.head_of_state_last_name} Administration`
                : `${pmPartyName} Administration`);

        const { error: insertErr } = await supabase
            .from('administrations')
            .insert({
                nation_id: nationId,
                admin_name: adminName,
                head_of_state: hosName,
                prime_minister: pmName,
                pm_party_name: pmPartyName,
                pm_party_id: leadPartyId,
                coalition_parties: coalitionParties,
                total_seats: totalSeats,
                government_type: getCanonicalGovernmentType(nation),
                started_at_tick: currentTick,
                started_at_date: currentDate,
                stats_at_start: statsAtStart,
                approval_at_start: governmentApproval
            });
        if (insertErr) throw insertErr;

        console.log(`Administration created: "${adminName}" at tick ${currentTick}`);
    } catch (err) {
        console.error('createAdministration error:', err);
        throw err;
    }
}

/**
 * Atomically close existing open administrations and create a new one.
 * Falls back to sequential close + create if RPC is unavailable.
 */
async function rolloverAdministration(supabase, nationId, nation, endReason, coalition, allParties, currentTick, currentDate, governmentApproval) {
    const statsAtStart = snapshotNationStats(nation);

    const coalitionPartyIds = coalition?.party_ids || [];
    const coalitionParties = coalitionPartyIds.map(pid => {
        const party = allParties.find(p => p.id === pid);
        return {
            party_id: pid,
            party_name: party?.faction_name || 'Unknown',
            seats: party?.seats || 0
        };
    });
    const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

    const leadPartyId = coalition?.lead_party_id;
    const leadParty = allParties.find(p => p.id === leadPartyId);
    const pmPartyName = leadParty?.faction_name || 'Unknown';

    const { data: activeHOG, error: hogErr } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    if (hogErr) throw hogErr;

    const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;
    const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
        ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
        : null;
    const adminName = activeHOG?.last_name
        ? `${activeHOG.last_name} Administration`
        : (nation.head_of_state_last_name
            ? `${nation.head_of_state_last_name} Administration`
            : `${pmPartyName} Administration`);

    const payload = {
        nation_id: nationId,
        admin_name: adminName,
        head_of_state: hosName,
        prime_minister: pmName,
        pm_party_name: pmPartyName,
        pm_party_id: leadPartyId,
        coalition_parties: coalitionParties,
        total_seats: totalSeats,
        government_type: getCanonicalGovernmentType(nation),
        started_at_tick: currentTick,
        started_at_date: currentDate,
        stats_at_start: statsAtStart,
        approval_at_start: governmentApproval
    };

    const { error: rpcErr } = await supabase.rpc('rollover_administration', {
        p_nation_id: nationId,
        p_end_reason: endReason,
        p_end_tick: currentTick,
        p_end_date: currentDate,
        p_end_approval: governmentApproval,
        p_new_administration: payload
    });

    if (!rpcErr) {
        console.log(`Administration rolled over atomically: "${adminName}" at tick ${currentTick}`);
        return;
    }

    // Graceful fallback if DB function has not been deployed yet
    const rpcUnavailable = /rollover_administration/i.test(rpcErr.message || '') || rpcErr.code === 'PGRST202';
    if (!rpcUnavailable) throw rpcErr;

    console.warn('rolloverAdministration RPC unavailable; falling back to sequential close + create');
    await closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval);
    await createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval);
}


// ==================== COALITION DISSOLUTION ====================

/**
 * Dissolve the current coalition government.
 * - Sets government_formations status to 'dissolved'
 * - Deactivates PM in head_of_government
 * - Vacates all ministries
 * Nation enters formation period (processGovernmentVacancy handles penalties).
 */
async function dissolveCoalition(supabase, nationId, excludeFormationId) {
    // Bust coalition cache so pages immediately see the dissolved state
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // Dissolve government_formations (skip the new formation if one is being created)
    let dissolveQuery = supabase
        .from('government_formations')
        .update({ status: 'dissolved' })
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker']);
    if (excludeFormationId) dissolveQuery = dissolveQuery.neq('id', excludeFormationId);
    const { error: formErr } = await dissolveQuery;
    if (formErr) console.warn('dissolveCoalition: formations update failed:', formErr);

    // Also dissolve legacy active_coalitions
    const { error: acErr } = await supabase
        .from('active_coalitions')
        .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);
    if (acErr) console.warn('dissolveCoalition: active_coalitions update failed:', acErr);

    // Deactivate PM
    const { error: pmErr } = await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);
    if (pmErr) console.warn('dissolveCoalition: PM deactivation failed:', pmErr);

    // Vacate all ministries
    const { error: minErr } = await supabase
        .from('ministries')
        .update({
            minister_first_name: null,
            minister_last_name: null,
            minister_age: null,
            party_id: null
        })
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (minErr) console.warn('dissolveCoalition: ministry vacating failed:', minErr);
}


// ==================== NO-CONFIDENCE RESOLUTION ====================

/**
 * Resolve a passed or failed vote of no confidence.
 *
 * PASSED:
 *   - Coalition immediately dissolved (all ministries vacated, PM removed)
 *   - Calling party gets +3 approval
 *   - All coalition parties get -5 approval
 *   - Event logged
 *
 * FAILED:
 *   - Calling party gets -5 approval
 *   - PM's party gets +3 approval
 *   - 6-tick cooldown recorded
 *   - Event logged
 */
async function resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick) {
    const callingPartyId = bill.proposed_by;
    const nationId = bill.nation_id;

    const { data: nation } = await supabase
        .from('nations')
        .select('name, government_type')
        .eq('id', nationId)
        .single();

    // Presidential systems do not have votes of no confidence
    if (isPresidentialRepublic(nation)) return;

    // Get PM's last name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('last_name, faction_id')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();

    const pmLastName = hog?.last_name || 'Unknown';
    const pmFactionId = hog?.faction_id || null;

    if (passed) {
        // Get coalition party IDs before dissolving
        const coalition = await fetchActiveCoalition(supabase, nationId);
        const coalitionPartyIds = coalition?.party_ids || [];

        // Guard: skip dissolution if coalition was already dissolved (e.g. by election on same tick)
        if (!coalition || coalition.status === 'dissolved') {
            console.warn('resolveNoConfidence: coalition already dissolved, skipping dissolution penalties');
        } else {
            // Close the current administration before dissolving
            try {
                const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
                const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                if (fullNation) {
                    await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
                }
            } catch (adminErr) { console.warn('Could not close administration on no-confidence:', adminErr); }

            // Dissolve coalition
            await dissolveCoalition(supabase, nationId);

            // Calling party gets +3 momentum
            await adjustMomentumAll(supabase, nationId, callingPartyId, 3, 'no_confidence:success');

            // All coalition parties get -5 momentum
            for (const partyId of coalitionPartyIds) {
                await adjustMomentumAll(supabase, nationId, partyId, -5, 'no_confidence:coalition_falls');
            }

            // Schedule snap election (same pattern as early elections)
            await supabase.from('elections').delete()
                .eq('nation_id', nationId).eq('status', 'scheduled');
            await supabase.from('elections').insert({
                nation_id: nationId,
                election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
                status: 'scheduled',
                election_type: 'parliamentary'
            });

            // Freeze active bills (same as early elections)
            await supabase.from('bills')
                .update({ status: 'frozen' })
                .eq('nation_id', nationId)
                .in('status', ['committee', 'floor']);

            // Log event
            await supabase.from('event_log').insert({
                nation_id: nationId,
                event_name: 'No Confidence — Government Falls',
                fired_at_tick: currentTick,
                category: 'government',
                description_chosen: `The ${pmLastName} Government has fallen. A motion of no confidence passed ${votesFor} to ${votesAgainst}. Snap elections scheduled.`,
                effects_applied: { coalition_dissolved: true, caller_approval: +3, coalition_approval: -5, election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS, bills_frozen: true }
            });
        } // end else (coalition not already dissolved)

    } else {
        // FAILED: calling party gets -5 momentum
        await adjustMomentumAll(supabase, nationId, callingPartyId, -5, 'no_confidence:failed');

        // PM's party gets +3 momentum
        if (pmFactionId) {
            await adjustMomentumAll(supabase, nationId, pmFactionId, 3, 'no_confidence:pm_survives');
        }

        // Record cooldown: store the tick when the no-confidence failed
        await supabase.from('campaign_actions').insert({
            party_id: callingPartyId,
            nation_id: nationId,
            action_type: 'no_confidence_failed',
            tick_performed: currentTick,
            result: { votes_for: votesFor, votes_against: votesAgainst, pm_last_name: pmLastName }
        });

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'No Confidence — Motion Fails',
            fired_at_tick: currentTick,
            category: 'government',
            description_chosen: `Motion of no confidence against the ${pmLastName} Government failed ${votesFor} to ${votesAgainst}.`,
            effects_applied: { caller_approval: -5, pm_approval: +3 }
        });
    }
}


// ==================== EARLY ELECTIONS ====================

/**
 * Call for early elections (PM action).
 * Transitions government to caretaker, freezes legislation, schedules election in 2 ticks.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} nationId    - Nation UUID
 * @param {string} pmFactionId - PM's faction UUID
 * @param {Array}  coalitionPartyIds - All coalition party IDs
 */
async function callEarlyElectionsAction(supabase, nationId, pmFactionId, coalitionPartyIds) {
    // Presidential systems cannot call early elections
    const { data: nationCheck } = await supabase.from('nations').select('government_type').eq('id', nationId).single();
    if (isPresidentialRepublic(nationCheck)) return { success: false, error: 'Presidential systems cannot call early elections' };

    // 0. Server-side guard: only proceed if coalition is still 'formed' (check both tables)
    let govStatus = null;
    const { data: activeGov } = await supabase
        .from('government_formations')
        .select('id, status')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (activeGov) {
        govStatus = activeGov.status;
    } else {
        // Fallback: check legacy active_coalitions
        const { data: legacyGov } = await supabase
            .from('active_coalitions')
            .select('id, status')
            .eq('nation_id', nationId)
            .is('dissolved_at', null)
            .order('formed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        govStatus = legacyGov?.status || 'formed'; // legacy rows without status default to formed
    }

    if (govStatus === 'caretaker') {
        throw new Error('The government is already in caretaker mode.');
    }

    // 1. Get current tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    const currentTick = shard?.current_tick || 0;

    // 2. Set government to caretaker (both tables — legacy active_coalitions may be source)
    // Use status='formed' filter as optimistic lock — only one caller can transition formed→caretaker
    const { data: updatedGov, count: updatedCount } = await supabase
        .from('government_formations')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .in('status', ['formed'])
        .select('id');
    if (!updatedGov || updatedGov.length === 0) {
        throw new Error('Government was already changed by another action. Please refresh.');
    }
    await supabase
        .from('active_coalitions')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);

    // 3. Apply approval penalties — PM party: -5, other coalition parties: -3
    // (After status transition so penalties aren't lost if transition fails)
    for (const partyId of coalitionPartyIds) {
        const penalty = partyId === pmFactionId
            ? GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST
            : GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST;
        await adjustMomentumAll(supabase, nationId, partyId, -penalty, 'early_election:penalty');
    }

    // Bust coalition cache after caretaker transition
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // 4. Cancel any existing scheduled elections
    await supabase
        .from('elections')
        .delete()
        .eq('nation_id', nationId)
        .eq('status', 'scheduled');

    // 5. Schedule early election
    await supabase.from('elections').insert({
        nation_id: nationId,
        election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
        status: 'scheduled',
        election_type: 'parliamentary'
    });

    // 6. Freeze all active bills (committee and floor)
    await supabase
        .from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nationId)
        .in('status', ['committee', 'floor']);

    // 7. Get PM name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    const pmName = hog ? `${hog.first_name} ${hog.last_name}` : 'The Prime Minister';

    // 8. Fire system event
    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Legislature Dissolved — Early Elections Called',
        fired_at_tick: currentTick,
        category: 'government',
        description_chosen: `Prime Minister ${pmName} has dissolved the Legislature. Caretaker government in place until elections.`,
        effects_applied: {
            caretaker: true,
            election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
            pm_approval: -GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST,
            coalition_approval: -GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST,
            bills_frozen: true
        }
    });

    return { success: true, electionTick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS };
}


// ==================== GOVERNMENT VACANCY PENALTIES ====================

/**
 * Process government vacancy penalties for democracies.
 *
 * When a democracy has no active coalition after an election:
 *   - Every tick: -2 approval to ALL parties, -1 stability to nation
 *   - At FORMATION_DEADLINE_TICKS: snap election triggered
 *     - Largest party: -10% approval before snap vote
 *     - Second largest: -5% approval before snap vote
 *     - New election scheduled for next tick
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick number
 * @returns {Promise<object|null>} Summary of actions taken, or null if not applicable
 */
async function processGovernmentVacancy(supabase, nation, currentTick) {
    // Only applies to parliamentary democracies
    if (isAutocracy(nation)) return null;
    if (isPresidentialRepublic(nation)) return null; // No coalition formation needed

    // Check for active coalition
    const coalition = await fetchActiveCoalition(supabase, nation.id);

    // Safety net: detect stale caretaker government with overdue election
    if (coalition && coalition.status === 'caretaker') {
        const { data: overdueElection } = await supabase
            .from('elections')
            .select('id, election_tick')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (overdueElection) {
            const overdueBy = currentTick - overdueElection.election_tick;
            if (overdueBy >= 2) {
                // Election has been stuck for 2+ ticks — reschedule to next tick
                await supabase.from('elections')
                    .update({ election_tick: currentTick + 1 })
                    .eq('id', overdueElection.id);
                console.log(`Safety net: rescheduled stale caretaker election ${overdueElection.id} to tick ${currentTick + 1} (was overdue by ${overdueBy} ticks)`);
            }
        }
        return null; // Caretaker is a valid government state
    }

    if (coalition) return null;

    // Get latest completed election (filter out records without results to avoid
    // picking up scheduled-turned-completed records that lack election data)
    const { data: election } = await supabase
        .from('elections')
        .select('id, election_tick, results')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .not('results', 'is', null)
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!election) return null;

    // Check if any party has outright majority (no coalition needed)
    // Use nation-specific total_seats for correct majority threshold
    const majoritySeatThreshold = Math.floor((nation.total_seats || GAME_CONFIG.TOTAL_SEATS) / 2) + 1;
    const votes = election.results?.votes || [];
    const majorityParty = votes.find(p => p.seats >= majoritySeatThreshold);
    if (majorityParty) return null;

    // Calculate ticks since election
    const ticksElapsed = currentTick - election.election_tick;
    if (ticksElapsed <= 0) return null;

    const result = {
        nation: nation.name,
        ticksElapsed,
        penaltiesApplied: true,
        approvalLoss: -2,
        stabilityLoss: -1
    };

    // ===== SNAP ELECTION CHECK =====
    // Doom-loop guard: if the two most recent completed elections happened within
    // SNAP_COOLDOWN_GAP ticks of each other, the last one was a snap election.
    // Block further snap elections to prevent an infinite cycle.
    let snapBlocked = false;
    if (ticksElapsed >= FORMATION_DEADLINE_TICKS) {
        const { data: recentElections } = await supabase
            .from('elections')
            .select('id, election_tick')
            .eq('nation_id', nation.id)
            .eq('status', 'completed')
            .not('results', 'is', null)
            .order('election_tick', { ascending: false })
            .limit(2);

        if (recentElections && recentElections.length >= 2) {
            const gap = recentElections[0].election_tick - recentElections[1].election_tick;
            if (gap <= SNAP_COOLDOWN_GAP) {
                snapBlocked = true;
                console.log(`SNAP ELECTION COOLDOWN for ${nation.name} — last two elections were ${gap} ticks apart (snap cycle detected). Continuing penalties only.`);
            }
        }
    }

    if (ticksElapsed >= FORMATION_DEADLINE_TICKS && !snapBlocked) {
        console.log(`SNAP ELECTION triggered for ${nation.name} — ${ticksElapsed} ticks without government`);

        // Get all parties sorted by seats for penalty targeting
        const { data: parties } = await supabase
            .from('factions')
            .select('id, faction_name, approval_rating, seats')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .order('seats', { ascending: false });

        if (parties && parties.length > 0) {
            // Largest party: -10 momentum
            const largest = parties[0];
            await adjustMomentumAll(supabase, nation.id, largest.id, -10, 'snap_election:largest_penalty');
            console.log(`  Snap penalty: ${largest.faction_name} -10 momentum`);

            // Second largest: -5 momentum
            if (parties.length > 1) {
                const second = parties[1];
                await adjustMomentumAll(supabase, nation.id, second.id, -5, 'snap_election:second_penalty');
                console.log(`  Snap penalty: ${second.faction_name} -5 momentum`);
            }
        }

        // Schedule snap election for next tick
        const { data: existingScheduled } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .limit(1)
            .maybeSingle();

        if (existingScheduled) {
            await supabase.from('elections')
                .update({ election_tick: currentTick + 1 })
                .eq('id', existingScheduled.id);
            console.log(`  Moved existing scheduled election to tick ${currentTick + 1}`);
        } else {
            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: currentTick + 1,
                status: 'scheduled'
            });
            console.log(`  Scheduled snap election for tick ${currentTick + 1}`);
        }

        // Log the snap election event
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'SNAP_ELECTION',
            description_used: `Snap election called in ${nation.name} after ${ticksElapsed} ticks without a government.`,
            category: 'POLITICAL',
            effects_applied: {
                largest_party: parties?.[0]?.faction_name,
                largest_penalty: -10,
                second_party: parties?.[1]?.faction_name,
                second_penalty: -5,
                ticks_without_gov: ticksElapsed
            },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Snap election event log failed:', error.message);
        });

        result.snapElection = true;
        result.snapTick = currentTick + 1;
        return result;
    }

    // ===== ONGOING PENALTIES =====
    // -2 momentum to ALL parties
    const { data: parties } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    for (const party of (parties || [])) {
        await adjustMomentumAll(supabase, nation.id, party.id, -2, 'government_vacancy:ongoing');
    }

    // -1 stability to nation
    const newStability = Math.max(0, (nation.stability ?? 50) - 1);
    await supabase.from('nations')
        .update({ stability: newStability })
        .eq('id', nation.id);

    // Update in-memory nation object for downstream processors
    nation.stability = newStability;

    console.log(`Government vacancy: ${nation.name} tick ${ticksElapsed}/${FORMATION_DEADLINE_TICKS} — all parties -2 approval, nation -1 stability (→ ${newStability})`);

    if (snapBlocked) {
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'SNAP_ELECTION_COOLDOWN',
            description_used: `Snap election cooldown in ${nation.name}. ${ticksElapsed} ticks without government; previous snap too recent.`,
            category: 'POLITICAL',
            effects_applied: { ticks_without_gov: ticksElapsed, snap_blocked: true },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Snap cooldown event log failed:', error.message);
        });
        result.snapBlocked = true;
    }

    return result;
}


// ==================== TICK PROCESSOR ====================

// ==================== PARTIAL ELECTION (FOUNDATIONAL BILL) ====================

async function processPartialElection(supabase, nation, election, currentTick) {
    const deltaSeats = election.partial_seats;
    console.log(`Processing partial election for ${nation.name}: +${deltaSeats} new seats`);

    // 1. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs').select('*')
        .eq('nation_id', nation.id).eq('is_active', true);

    if (!blocs || blocs.length === 0) {
        console.warn('No voter blocs found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_blocs', bloc_details: [] } }).eq('id', election.id);
        return;
    }

    // 2. Scale bloc voter_counts to eligible_voters (same pattern as runElectionPreview)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties with ideology axes
    const { data: factions } = await supabase
        .from('factions').select('id, faction_name, seats')
        .eq('nation_id', nation.id).eq('faction_type', 'party');

    if (!factions || factions.length === 0) {
        console.warn('No parties found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_parties', bloc_details: [] } }).eq('id', election.id);
        return;
    }

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology').select('*').in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    const parties = factions.map(f => ({
        id: f.id, faction_name: f.faction_name,
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 3b. Load per-bloc preference data
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval').select('faction_id, bloc_id, preference_score')
        .in('faction_id', factionIds);
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        allBlocApprovals[row.bloc_id][row.faction_id] = row.preference_score ?? 40;
    }

    // 4. Run election simulation for ONLY the delta seats
    const result = runElectionSimulation(blocs, parties, deltaSeats, allBlocApprovals);

    // 5. ADD delta seats to each party's existing seats
    for (const faction of factions) {
        const deltaForParty = result.seats[faction.id] || 0;
        const newTotal = (faction.seats || 0) + deltaForParty;
        await supabase.from('factions').update({ seats: newTotal }).eq('id', faction.id);
    }

    // 6. Build results and mark election as completed
    const seatResults = factions.map(f => ({
        party_id: f.id,
        party_name: f.faction_name,
        existing_seats: f.seats || 0,
        new_seats: result.seats[f.id] || 0,
        total_seats: (f.seats || 0) + (result.seats[f.id] || 0),
        votes: result.votes[f.id] || 0
    }));

    await supabase.from('elections').update({
        status: 'completed',
        results: {
            partial: true,
            delta_seats: deltaSeats,
            votes: seatResults,
            seats: seatResults,
            bloc_details: result.details,
            total_votes_cast: result.totalVotesCast,
            total_abstentions: result.totalAbstentions
        }
    }).eq('id', election.id);

    console.log(`Partial election completed: ${deltaSeats} new seats allocated across ${factions.length} parties`);
}

async function resolveManualElectionContext(supabase, nation, currentTick, requestedElectionType = null) {
    const governmentType = getCanonicalGovernmentType(nation);
    if (governmentType !== CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC) {
        return {
            governmentType,
            electionType: 'parliamentary',
            forcedOutsideSchedule: false,
            nextScheduledTick: null
        };
    }

    let electionType = requestedElectionType;
    if (!electionType) {
        const { data: dueScheduledElection } = await supabase
            .from('elections')
            .select('id, election_type')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();
        electionType = dueScheduledElection?.election_type || 'presidential';
    }

    const { data: nextScheduled } = await supabase
        .from('elections')
        .select('election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', electionType)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    const nextScheduledTick = nextScheduled?.election_tick ?? null;
    return {
        governmentType,
        electionType,
        forcedOutsideSchedule: !!(nextScheduledTick && nextScheduledTick > currentTick),
        nextScheduledTick
    };
}

async function runManualElectionByGovernmentType(supabase, nation, options = {}) {
    if (!nation?.id) throw new Error('Nation is required');

    let currentTick;
    if (Number.isInteger(options.currentTick)) {
        currentTick = options.currentTick;
    } else {
        const { data: _shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        currentTick = _shard?.current_tick || 0;
    }

    const context = await resolveManualElectionContext(supabase, nation, currentTick, options.electionType);
    const isPresidential = context.governmentType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC;
    const normalizedElectionType = context.electionType || 'parliamentary';

    // Use candidate-based voting for presidential elections, party-based for parliamentary
    let electionResults;
    if (isPresidential && normalizedElectionType === 'presidential') {
        // Ensure candidates exist — generate for parties that have none
        const { data: allParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');

        if (allParties) {
            for (const party of allParties) {
                const { count } = await supabase
                    .from('pm_candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('nation_id', nation.id)
                    .eq('faction_id', party.id)
                    .eq('candidate_type', 'presidential');
                if (!count || count === 0) {
                    console.log(`Generating presidential candidates for faction ${party.id} (manual election)`);
                    await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');
                }
            }
        }

        // Auto-select candidates for any party that hasn't chosen
        await autoSelectPresidentialCandidates(supabase, nation, currentTick);
        const { data, error: runError } = await supabase.rpc('run_presidential_election', { p_nation_id: nation.id });
        if (runError) throw runError;
        electionResults = data;
    } else {
        const { data, error: runError } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: normalizedElectionType });
        if (runError) throw runError;
        electionResults = data;
    }

    // Create the election record (SQL RPCs no longer insert their own)
    const { data: scheduledElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', normalizedElectionType)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (scheduledElection) {
        await supabase.from('elections')
            .update({ status: 'completed', results: electionResults, election_tick: currentTick })
            .eq('id', scheduledElection.id);
    } else {
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick,
            election_type: normalizedElectionType,
            status: 'completed',
            results: electionResults
        });
    }

    const { data: completedElection, error: electionError } = await supabase
        .from('elections')
        .select('id, election_tick, election_type, results, created_at')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (electionError) throw electionError;

    // Sync seats for parliamentary elections only (presidential results have no seats)
    const seatResults = completedElection?.results?.seats || [];
    for (const r of seatResults) {
        await supabase
            .from('factions')
            .update({ seats: r.seats })
            .eq('id', r.party_id);
    }

    // Dissolve legislature — fail all pending bills (new parliament must re-propose)
    const { data: dissolvedBills } = await supabase.from('bills')
        .update({ status: 'failed' })
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor'])
        .select('id, bill_type, ambassador_id');
    await syncAmbassadorsForFailedConfirmationBills(supabase, dissolvedBills);

    if (isPresidential && normalizedElectionType === 'presidential') {
        // Fail bills on president's desk
        const { data: deskBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .eq('status', 'president_desk')
            .select('id, bill_type, ambassador_id');
        await syncAmbassadorsForFailedConfirmationBills(supabase, deskBills);
        await processPresidentialElectionResult(supabase, nation, completedElection, currentTick);
    } else if (isPresidential && normalizedElectionType === 'parliamentary') {
        // Midterm parliamentary election — seats reshuffled, president stays
        console.log(`Manual midterm parliamentary election for ${nation.name} — president stays in office`);
    } else {
        // Parliamentary democracy: dissolve existing government after election
        const { data: frozenBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .eq('status', 'frozen')
            .select('id, bill_type, ambassador_id');
        await syncAmbassadorsForFailedConfirmationBills(supabase, frozenBills);

        let existingGov = null;
        const { data: govFormation } = await supabase
            .from('government_formations')
            .select('id, status')
            .eq('nation_id', nation.id)
            .in('status', ['formed', 'caretaker'])
            .maybeSingle();
        if (govFormation) {
            existingGov = govFormation;
        } else {
            const { data: legacyGov } = await supabase
                .from('active_coalitions')
                .select('id, status')
                .eq('nation_id', nation.id)
                .is('dissolved_at', null)
                .maybeSingle();
            if (legacyGov) existingGov = legacyGov;
        }

        if (existingGov) {
            console.log(`Dissolving government after manual election for ${nation.name}`);

            try {
                const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                if (fullNation) {
                    await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || '', null);
                }
            } catch (adminErr) { console.warn('Could not close administration on manual election:', adminErr); }

            await supabase
                .from('government_formations')
                .update({ status: 'dissolved' })
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'caretaker']);

            await supabase
                .from('active_coalitions')
                .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
                .eq('nation_id', nation.id)
                .is('dissolved_at', null);

            await supabase
                .from('head_of_government')
                .update({ active: false })
                .eq('nation_id', nation.id)
                .eq('active', true);

            await supabase
                .from('ministries')
                .update({
                    minister_first_name: null,
                    minister_last_name: null,
                    minister_age: null,
                    party_id: null
                })
                .eq('nation_id', nation.id)
                .eq('is_active', true);
        }
    }

    return {
        success: true,
        nationId: nation.id,
        governmentType: context.governmentType,
        electionType: normalizedElectionType,
        forcedOutsideSchedule: context.forcedOutsideSchedule,
        nextScheduledTick: context.nextScheduledTick,
        currentTick,
        completedElection,
        seatResults
    };
}

async function processElections(supabase, nation, currentTick) {
    if (isAutocracy(nation)) return [];

    const isPresidential = isPresidentialRepublic(nation);
    const results = [];

    const { data: dueElections } = await supabase
        .from('elections')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .lte('election_tick', currentTick);

    // For presidential systems, process parliamentary elections before presidential ones
    // so seats are allocated before we determine the popular vote winner
    const sorted = (dueElections || []).sort((a, b) => {
        const aType = a.election_type || 'parliamentary';
        const bType = b.election_type || 'parliamentary';
        if (aType === 'parliamentary' && bType === 'presidential') return -1;
        if (aType === 'presidential' && bType === 'parliamentary') return 1;
        return 0;
    });

    for (const election of sorted) {
        const electionType = election.election_type || 'parliamentary';
        console.log(`Processing ${electionType} election for ${nation.name} (tick ${currentTick})`);

        // Partial election — only allocate delta seats (from foundational bill)
        if (election.partial_seats && election.partial_seats > 0) {
            await processPartialElection(supabase, nation, election, currentTick);
            results.push({ electionId: election.id, nation: nation.name, partial: true, deltaSeats: election.partial_seats });
            continue;
        }

        // Auto-select presidential candidates for any party that hasn't chosen yet
        if (electionType === 'presidential') {
            await autoSelectPresidentialCandidates(supabase, nation, currentTick);
        }

        // Use candidate-based voting for presidential elections, party-based for parliamentary
        let data, error;
        if (electionType === 'presidential') {
            ({ data, error } = await supabase.rpc('run_presidential_election', { p_nation_id: nation.id }));
        } else {
            ({ data, error } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: electionType }));
        }

        if (error) {
            console.error(`Election RPC failed (attempt 1) for ${nation.name}:`, error);
            // Retry once
            if (electionType === 'presidential') {
                ({ data, error } = await supabase.rpc('run_presidential_election', { p_nation_id: nation.id }));
            } else {
                ({ data, error } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: electionType }));
            }

            if (error) {
                console.error(`Election RPC failed (attempt 2) for ${nation.name}:`, error);
                // If overdue, reschedule to next tick to prevent permanent stuck state
                if (election.election_tick < currentTick) {
                    await supabase.from('elections')
                        .update({ election_tick: currentTick + 1 })
                        .eq('id', election.id);
                    console.log(`Rescheduled overdue election ${election.id} to tick ${currentTick + 1}`);
                }
                continue;
            }
            console.log(`Election RPC succeeded on retry for ${nation.name}`);
        }

        // Mark the scheduled election record as completed with full results
        await supabase.from('elections')
            .update({ status: 'completed', results: data })
            .eq('id', election.id);

        // Sync seats back to factions table from the completed election results
        const { data: completedElection } = await supabase
            .from('elections').select('results')
            .eq('nation_id', nation.id)
            .eq('status', 'completed')
            .not('results', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (completedElection?.results?.seats) {
            for (const r of completedElection.results.seats) {
                await supabase
                    .from('factions')
                    .update({ seats: r.seats })
                    .eq('id', r.party_id);
            }
            console.log(`Seats synced to factions for ${nation.name}`);
        }

        // Dissolve legislature — fail all pending bills (new parliament must re-propose)
        const { data: dissolvedBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor'])
            .select('id, bill_type, ambassador_id');

        await syncAmbassadorsForFailedConfirmationBills(supabase, dissolvedBills);

        if (dissolvedBills?.length > 0) {
            console.log(`Dissolved ${dissolvedBills.length} pending bill(s) after election for ${nation.name}`);
        }

        // === PRESIDENTIAL SYSTEM: handle presidential vs parliamentary elections ===
        if (isPresidential && electionType === 'presidential') {
            // Fail any bills sitting on the outgoing president's desk
            const { data: deskBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'president_desk')
                .select('id, bill_type, ambassador_id');
            await syncAmbassadorsForFailedConfirmationBills(supabase, deskBills);
            if (deskBills?.length > 0) {
                console.log(`Failed ${deskBills.length} bill(s) on president's desk after presidential election for ${nation.name}`);
            }

            await processPresidentialElectionResult(supabase, nation, completedElection, currentTick);
        } else if (isPresidential && electionType === 'parliamentary') {
            // Midterm parliamentary election — seats reshuffled, president stays, desk bills remain
            console.log(`Midterm parliamentary election for ${nation.name} — president stays in office`);
        } else {
            // === PARLIAMENTARY DEMOCRACY: dissolve existing government after election ===
            // After any election, the old government (whether 'formed' or 'caretaker')
            // must be dissolved so that processGovernmentVacancy can apply -2 approval
            // penalties until a new coalition is formed.
            let existingGov = null;
            let existingGovSource = null;
            const { data: govFormation } = await supabase
                .from('government_formations')
                .select('id, status')
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'caretaker'])
                .maybeSingle();
            if (govFormation) {
                existingGov = govFormation;
                existingGovSource = 'government_formations';
            } else {
                const { data: legacyGov } = await supabase
                    .from('active_coalitions')
                    .select('id, status')
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null)
                    .maybeSingle();
                if (legacyGov) {
                    existingGov = legacyGov;
                    existingGovSource = 'active_coalitions';
                }
            }

            // Fail all frozen bills (from caretaker period) regardless of whether
            // an existing government row was found — bills may have been frozen by
            // early elections even if the government row was already cleaned up.
            const { data: frozenBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'frozen')
                .select('id, bill_type, ambassador_id');

            await syncAmbassadorsForFailedConfirmationBills(supabase, frozenBills);

            if (existingGov) {
                console.log(`Dissolving ${existingGov.status} government after election for ${nation.name} (source: ${existingGovSource})`);

                // Close the administration
                try {
                    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                    if (fullNation) {
                        await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || '', null);
                    }
                } catch (adminErr) { console.warn('Could not close administration on election:', adminErr); }

                // Dissolve government in BOTH tables
                await supabase
                    .from('government_formations')
                    .update({ status: 'dissolved' })
                    .eq('nation_id', nation.id)
                    .in('status', ['formed', 'caretaker']);

                await supabase
                    .from('active_coalitions')
                    .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null);

                // Deactivate PM
                await supabase
                    .from('head_of_government')
                    .update({ active: false })
                    .eq('nation_id', nation.id)
                    .eq('active', true);

                // Vacate all ministries
                await supabase
                    .from('ministries')
                    .update({
                        minister_first_name: null,
                        minister_last_name: null,
                        minister_age: null,
                        party_id: null
                    })
                    .eq('nation_id', nation.id)
                    .eq('is_active', true);
            }
        }

        results.push({
            electionId: election.id,
            nation: nation.name,
            electionType,
            result: data
        });
    }

    // === SCHEDULE NEXT ELECTIONS ===
    if (isPresidential) {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } else {
        const { data: futureElection } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .gt('election_tick', currentTick)
            .limit(1)
            .maybeSingle();

        if (!futureElection) {
            const frequency = nation.election_frequency || 48;
            const nextTick = currentTick + frequency;

            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: nextTick,
                status: 'scheduled'
            });

            console.log(`Scheduled next election for ${nation.name} at tick ${nextTick}`);
        }
    }

    return results;
}

/**
 * Presidential election result: read candidate-level popular vote results
 * and inaugurate the winning candidate.
 */
async function processPresidentialElectionResult(supabase, nation, completedElection, currentTick) {
    let candidateResults = completedElection?.results?.presidential_candidates || [];
    if (candidateResults.length === 0) {
        console.warn(`No candidate vote data for presidential election in ${nation.name}`);
        return;
    }

    // Identify the outgoing president BEFORE deactivating (for incumbent win/loss effects)
    const { data: outgoingPresident } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // === RUNOFF SYSTEM ===
    // Round 1: Check if any candidate received >50% of total votes
    const totalVotes = completedElection?.results?.total_votes_cast || 0;
    const sortedRound1 = [...candidateResults].sort((a, b) => b.votes - a.votes);
    const topCandidate = sortedRound1[0];
    const topPct = totalVotes > 0 ? (topCandidate.votes / totalVotes) * 100 : 0;

    let winner;
    let wasRunoff = false;
    let runoffResults = null;

    if (topPct > 50 || candidateResults.length <= 2) {
        // Clear winner with majority — no runoff needed
        winner = topCandidate;
        console.log(`Presidential election Round 1 winner: ${winner.candidate_name} (${winner.party_name}) with ${topPct.toFixed(1)}% — majority achieved (${nation.name})`);
    } else {
        // === RUNOFF: No majority — top 2 candidates advance ===
        wasRunoff = true;
        const runoffCandidates = sortedRound1.slice(0, 2);
        console.log(`Presidential election RUNOFF triggered for ${nation.name}: ${runoffCandidates[0].candidate_name} vs ${runoffCandidates[1].candidate_name} (top was ${topPct.toFixed(1)}%)`);

        // Delete all non-runoff candidates from pm_candidates so the RPC only sees 2
        const runoffCandidateIds = new Set(runoffCandidates.map(c => c.candidate_id));
        const { data: allPresidentialCandidates } = await supabase
            .from('pm_candidates')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('candidate_type', 'presidential');

        for (const pc of (allPresidentialCandidates || [])) {
            if (!runoffCandidateIds.has(pc.id)) {
                await supabase.from('pm_candidates').delete().eq('id', pc.id);
            }
        }

        // Run the presidential election RPC again with only the top 2
        const { data: runoffData, error: runoffErr } = await supabase.rpc('run_presidential_election', { p_nation_id: nation.id });

        if (runoffErr) {
            console.error(`Runoff RPC failed for ${nation.name}:`, runoffErr);
            // Fallback: use round 1 winner
            winner = topCandidate;
        } else {
            runoffResults = runoffData?.presidential_candidates || [];
            const runoffSorted = [...runoffResults].sort((a, b) => b.votes - a.votes);
            winner = runoffSorted[0] || topCandidate;
            console.log(`Runoff winner: ${winner.candidate_name} (${winner.party_name}) with ${winner.vote_percentage}% (${nation.name})`);

            // Update the election record with combined round data
            const combinedResults = {
                ...completedElection.results,
                round_1_candidates: candidateResults,
                runoff_candidates: runoffResults,
                was_runoff: true
            };
            await supabase.from('elections')
                .update({ results: combinedResults })
                .eq('nation_id', nation.id)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1);
        }
    }

    console.log(`Presidential election winner: ${winner.candidate_name} (${winner.party_name}) with ${winner.votes} votes (${nation.name})`);

    // === INCUMBENT WIN/LOSS DETECTION ===
    const incumbentFactionId = outgoingPresident?.faction_id;
    const isIncumbentWin = incumbentFactionId && winner.faction_id === incumbentFactionId;
    const isIncumbentRunoffLoss = wasRunoff && incumbentFactionId && winner.faction_id !== incumbentFactionId;
    const isChallengerWin = incumbentFactionId && winner.faction_id !== incumbentFactionId;

    // Deactivate previous president
    await supabase
        .from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    // Close previous administration
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            const endReason = isIncumbentWin ? 'reelection' : 'election_loss';
            await closeAdministration(supabase, nation.id, fullNation, endReason, currentTick, shardData?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on presidential election:', adminErr); }

    // Set ruling faction to the winner's party
    await supabase.from('nations')
        .update({ ruling_faction_id: winner.faction_id })
        .eq('id', nation.id);

    // Look up the winning candidate from pm_candidates by candidate_id
    const { data: winningCandidate } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', winner.candidate_id)
        .maybeSingle();

    if (winningCandidate) {
        await inauguratePresident(supabase, winningCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
        console.log(`President inaugurated: ${winner.candidate_name} (${winner.party_name})`);
    } else {
        // Fallback: candidate may have been cleaned up, try by faction
        const { data: fallbackCandidate } = await supabase
            .from('pm_candidates')
            .select('*')
            .eq('nation_id', nation.id)
            .eq('faction_id', winner.faction_id)
            .eq('candidate_type', 'presidential')
            .eq('selected', true)
            .limit(1)
            .maybeSingle();

        if (fallbackCandidate) {
            await inauguratePresident(supabase, fallbackCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
            console.log(`President inaugurated (fallback): ${fallbackCandidate.first_name} ${fallbackCandidate.last_name} (${winner.party_name})`);
        } else {
            // No candidates at all — generate one and inaugurate immediately
            console.warn(`No presidential candidate found for winner ${winner.candidate_name} in ${nation.name} — generating emergency candidate`);
            const emergencyCandidates = await generatePresidentCandidates(supabase, nation.id, winner.faction_id, currentTick, 'presidential');
            if (emergencyCandidates && emergencyCandidates.length > 0) {
                await inauguratePresident(supabase, emergencyCandidates[0], nation.id, winner.faction_id, currentTick, outgoingPresident);
                console.log(`Emergency president inaugurated: ${emergencyCandidates[0].first_name} ${emergencyCandidates[0].last_name}`);
            }
        }
    }

    // === WINNER/LOSER EFFECTS ===
    try {
        const { data: nationStats } = await supabase.from('nations')
            .select('stability, legitimacy, happiness, civil_unrest')
            .eq('id', nation.id).single();

        if (nationStats) {
            const updates = {};
            if (isIncumbentWin) {
                // Incumbent wins: +3 legitimacy, +2 stability (mandate renewed)
                updates.legitimacy = Math.min(100, Math.round(((nationStats.legitimacy || 50) + 3) * 10) / 10);
                updates.stability = Math.min(100, Math.round(((nationStats.stability || 50) + 2) * 10) / 10);
                console.log(`Incumbent win effects: +3 legitimacy, +2 stability (${nation.name})`);
            } else if (isChallengerWin && !wasRunoff) {
                // Challenger wins (no runoff): transition effects
                updates.stability = Math.max(0, Math.round(((nationStats.stability || 50) - 2) * 10) / 10);
                updates.civil_unrest = Math.min(100, Math.round(((nationStats.civil_unrest || 0) + 3) * 10) / 10);
                updates.happiness = Math.min(100, Math.round(((nationStats.happiness || 50) + 1) * 10) / 10);
                console.log(`Challenger win effects: -2 stability, +3 civil_unrest, +1 happiness (${nation.name})`);
            } else if (isIncumbentRunoffLoss) {
                // Incumbent loses in runoff: extra penalties (contested transition)
                updates.stability = Math.max(0, Math.round(((nationStats.stability || 50) - 4) * 10) / 10);
                updates.legitimacy = Math.max(0, Math.round(((nationStats.legitimacy || 50) - 2) * 10) / 10);
                updates.civil_unrest = Math.min(100, Math.round(((nationStats.civil_unrest || 0) + 5) * 10) / 10);
                updates.happiness = Math.min(100, Math.round(((nationStats.happiness || 50) + 2) * 10) / 10);
                console.log(`Incumbent runoff loss effects: -4 stability, -2 legitimacy, +5 civil_unrest, +2 happiness (${nation.name})`);
            }

            if (Object.keys(updates).length > 0) {
                await supabase.from('nations').update(updates).eq('id', nation.id);
            }
        }

        // Momentum effects: incumbent win boosts their faction, challenger win penalizes losing incumbent faction
        if (isIncumbentWin && incumbentFactionId) {
            await adjustMomentumAll(supabase, nation.id, incumbentFactionId, 3, 'election:incumbent_win');
            console.log(`Incumbent re-elected: +3 momentum to ${winner.party_name}`);
        } else if (isChallengerWin && incumbentFactionId) {
            await adjustMomentumAll(supabase, nation.id, incumbentFactionId, -5, 'election:incumbent_loss');
            await adjustMomentumAll(supabase, nation.id, winner.faction_id, 3, 'election:challenger_win');
            console.log(`Challenger wins: -5 momentum to outgoing party, +3 to ${winner.party_name}`);
        }
    } catch (effectsErr) { console.warn('Could not apply winner/loser effects:', effectsErr); }

    // Clean up all presidential candidates after election
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    // Sort for runner-up info in event
    const sorted = [...candidateResults].sort((a, b) => b.votes - a.votes);

    // Fire system event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'presidential_election',
            p_nation_id: nation.id,
            p_tick: currentTick,
            p_placeholders: {
                nation: nation.name,
                winning_party: winner.party_name,
                winning_candidate: winner.candidate_name,
                votes: winner.votes,
                vote_percentage: winner.vote_percentage || '?',
                runner_up: sorted[1]?.candidate_name || 'N/A',
                runner_up_party: sorted[1]?.party_name || 'N/A',
                was_runoff: wasRunoff ? 'true' : 'false',
                incumbent_win: isIncumbentWin ? 'true' : 'false'
            }
        });
    } catch (e) { console.warn('Presidential election event fire failed (non-blocking):', e); }

    // Proactively schedule next elections (instead of relying on processPresidentialTermEnd safety net)
    try {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } catch (e) { console.warn('Could not schedule next presidential elections:', e); }
}

/**
 * Inaugurate a president from a candidate record. Creates the president row,
 * applies ideology shift, applies trait effects, and creates an administration.
 * Used by both processPresidentialElectionResult (auto-inauguration) and
 * selectPresidentCandidate (manual/legacy selection).
 */
async function inauguratePresident(supabase, candidate, nationId, factionId, currentTick, outgoingPresident = null) {
    // Deactivate any previous president
    await supabase.from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nationId)
        .eq('is_active', true);

    // Look up trait data for trait_upside / trait_downside
    const { data: trait } = await supabase.from('leader_traits').select('*').eq('trait_key', candidate.trait_key).maybeSingle();

    // Determine terms_served: if re-elected (same person), increment; otherwise start at 1
    let termsServed = 1;
    if (outgoingPresident &&
        outgoingPresident.first_name === candidate.first_name &&
        outgoingPresident.last_name === candidate.last_name &&
        outgoingPresident.faction_id === factionId) {
        termsServed = (outgoingPresident.terms_served || 1) + 1;
        console.log(`President re-elected: ${candidate.first_name} ${candidate.last_name} — term ${termsServed}`);
    }

    // Insert president record (with trait_upside / trait_downside populated)
    const { error: presErr } = await supabase.from('presidents').insert({
        nation_id: nationId,
        faction_id: factionId,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        age: candidate.age,
        ideology: candidate.ideology,
        trait: candidate.trait_key,
        trait_upside: trait?.upside || null,
        trait_downside: trait?.downside || null,
        elected_tick: currentTick,
        term_ends_tick: currentTick + GAME_CONFIG.PRESIDENTIAL_TERM_TICKS,
        is_active: true,
        terms_served: termsServed
    });
    if (presErr) throw presErr;

    // Apply ideology shift (+15 on candidate's axis)
    const axisKey = candidate.ideology_axis;
    const direction = candidate.ideology_direction;
    if (axisKey && typeof direction === 'number') {
        const shift = 15 * direction;
        let factionIdeology = await loadFactionIdeology(supabase, factionId);
        if (!factionIdeology) {
            const newRow = { faction_id: factionId, liberty_equality: 0, tradition_progress: 0, security_freedom: 0, globalism_nationalism: 0, individualism_collectivism: 0 };
            await supabase.from('faction_ideology').upsert(newRow, { onConflict: 'faction_id' });
            factionIdeology = newRow;
            console.warn(`Created missing faction_ideology row for faction ${factionId}`);
        }
        const currentVal = factionIdeology[axisKey] || 0;
        const newVal = Math.max(-100, Math.min(100, currentVal + shift));
        await supabase.from('faction_ideology').update({ [axisKey]: newVal }).eq('faction_id', factionId);
        console.log(`President ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);
    }

    // Apply trait effects (same logic as PM)
    if (trait?.effects) {
        if (trait.effects.on_appoint_stability) {
            const { data: nationRow } = await supabase.from('nations').select('stability').eq('id', nationId).single();
            if (nationRow) {
                const newStability = Math.max(0, Math.min(100, (nationRow.stability || 50) + trait.effects.on_appoint_stability));
                await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
            }
        }
    }

    // Get faction info for administration record
    const { data: faction } = await supabase.from('factions').select('faction_name, seats, approval_rating').eq('id', factionId).single();
    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();

    // Parse year safely from current_date (handles formats like "Month Day, Year" or just "Year")
    const dateStr = shardData?.current_date || '';
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';

    // Create new administration
    await supabase.from('administrations').insert({
        nation_id: nationId,
        admin_name: `${candidate.last_name} Administration${year ? ', ' + year : ''}`,
        head_of_state: `${candidate.first_name} ${candidate.last_name}`,
        president_name: `${candidate.first_name} ${candidate.last_name}`,
        president_party_id: factionId,
        president_party_name: faction?.faction_name || '',
        coalition_parties: [{ party_id: factionId, party_name: faction?.faction_name || '', seats: faction?.seats || 0 }],
        total_seats: faction?.seats || 0,
        government_type: 'Presidential',
        started_at_tick: currentTick,
        started_at_date: dateStr,
        stats_at_start: fullNation ? snapshotNationStats(fullNation) : {},
        approval_at_start: faction?.approval_rating ?? 50
    });

    return candidate;
}

/**
 * Schedule next presidential + parliamentary elections independently.
 * Presidential every PRESIDENTIAL_TERM_TICKS, parliamentary every PARLIAMENTARY_TERM_TICKS.
 */
async function scheduleNextPresidentialElections(supabase, nation, currentTick) {
    // Check for future parliamentary election
    const { data: futureParl } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'parliamentary')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futureParl) {
        const nextParl = currentTick + GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextParl,
            election_type: 'parliamentary',
            status: 'scheduled'
        });
        console.log(`Scheduled next parliamentary election for ${nation.name} at tick ${nextParl}`);
    }

    // Check for future presidential election
    const { data: futurePres } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futurePres) {
        const nextPres = currentTick + GAME_CONFIG.PRESIDENTIAL_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextPres,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Scheduled next presidential election for ${nation.name} at tick ${nextPres}`);
    }
}

/**
 * Generate 3 president candidates for a party (reuses PM candidate generation pattern).
 * Candidates are stored in pm_candidates table with candidate_type = 'presidential';
 * select-president.html reads them.
 *
 * @param {string} candidateType - 'presidential' (default)
 */
async function generatePresidentCandidates(supabase, nationId, factionId, currentTick, candidateType = 'presidential') {
    const factionIdeology = await loadFactionIdeology(supabase, factionId);

    // Clear any existing unselected presidential candidates for this faction
    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16); // Presidents: age 35-50
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            candidate_type: candidateType,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating president candidates:', error);
        throw error;
    }

    console.log(`Generated 3 president candidates for faction ${factionId}`);
    return data;
}

/**
 * Select a presidential nominee BEFORE the election. Marks the candidate as selected
 * and deletes the other options. The actual inauguration happens automatically when
 * the election resolves via processPresidentialElectionResult → inauguratePresident.
 */
async function selectPresidentCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    // Mark selected, delete others for this faction
    await supabase.from('pm_candidates').update({ selected: true }).eq('id', candidateId);
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    console.log(`Presidential nominee selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key}) for faction ${factionId}`);
    return candidate;
}


// ==================== PRESIDENTIAL MINISTER NOMINATION ====================

/**
 * President nominates a minister for a cabinet slot.
 * Writes pending data to the ministries table and creates a confirmation bill.
 * Parliament votes simple majority; if rejected, the party is blocked for that slot.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} presidentFactionId - The president's faction (must match active president)
 * @param {string} ministryKey - Which ministry slot (e.g. 'defense', 'finance')
 * @param {object} nominee - { partyId, partyName, firstName, lastName, age }
 */
async function nominateMinister(supabase, nationId, presidentFactionId, ministryKey, nominee) {
    // Validate: must be Presidential system
    const { data: nation } = await supabase.from('nations').select('name, government_type').eq('id', nationId).single();
    if (!isPresidentialRepublic(nation)) throw new Error('Minister nominations only apply to Presidential systems');

    // Validate: caller must be president's party
    const { data: president } = await supabase.from('presidents')
        .select('id, faction_id')
        .eq('nation_id', nationId).eq('is_active', true)
        .limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can nominate ministers');

    // Validate: no existing pending confirmation for this slot
    const { data: existingMinistry } = await supabase.from('ministries')
        .select('id, confirmation_status, rejected_parties')
        .eq('nation_id', nationId).eq('ministry_key', ministryKey).eq('is_active', true)
        .maybeSingle();

    if (existingMinistry?.confirmation_status === 'pending') {
        throw new Error('A confirmation vote is already pending for this ministry');
    }

    // Validate: nominee's party was not already rejected for this slot
    const rejectedParties = existingMinistry?.rejected_parties || [];
    if (rejectedParties.includes(nominee.partyId)) {
        throw new Error('This party\'s nominee was already rejected for this ministry slot');
    }

    // Get current tick
    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Write pending minister data to the ministry row
    const pendingData = {
        party_id: nominee.partyId,
        first_name: nominee.firstName,
        last_name: nominee.lastName,
        age: nominee.age
    };

    const ministryDisplayName = {
        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
        finance: 'Ministry of Finance', education: 'Ministry of Education',
        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
        justice: 'Ministry of Justice', trade: 'Ministry of Trade',
        energy: 'Ministry of Energy', transportation: 'Ministry of Transportation',
        security: 'Ministry of Security'
    }[ministryKey] || ministryKey;

    if (existingMinistry) {
        const { error: updErr } = await supabase.from('ministries').update({
            confirmation_status: 'pending',
            pending_minister: pendingData
        }).eq('id', existingMinistry.id);
        if (updErr) throw new Error('Failed to update ministry: ' + updErr.message);
    } else {
        const { error: insErr } = await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: ministryKey,
            ministry_name: ministryDisplayName,
            is_active: true,
            confirmation_status: 'pending',
            pending_minister: pendingData,
            rejected_parties: []
        });
        if (insErr) throw new Error('Failed to create ministry row: ' + insErr.message);
    }

    // Create confirmation bill (goes straight to floor vote)
    const ministerTitle = {
        prime_minister: 'Prime Minister', interior: 'Minister of the Interior',
        foreign: 'Minister of Foreign Affairs', defense: 'Minister of Defense',
        finance: 'Minister of Finance', education: 'Minister of Education',
        healthcare: 'Minister of Healthcare', labor: 'Minister of Labor',
        justice: 'Minister of Justice', trade: 'Minister of Trade',
        energy: 'Minister of Energy', transportation: 'Minister of Transportation',
        security: 'Minister of Security'
    }[ministryKey] || ministryDisplayName;

    const billName = `Confirmation of ${nominee.firstName} ${nominee.lastName} as ${ministerTitle}`;
    const preamble = `The President nominates ${nominee.firstName} ${nominee.lastName} (${nominee.partyName}) to serve as ${ministerTitle}. A simple majority (${GAME_CONFIG.MAJORITY_SEATS} of ${GAME_CONFIG.TOTAL_SEATS} seats) is required for confirmation.`;

    const { data: bill, error: billErr } = await supabase.from('bills').insert({
        nation_id: nationId,
        proposed_by: presidentFactionId,
        proposed_tick: currentTick,
        bill_name: billName,
        bill_type: 'minister_confirmation',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.MINISTER_CONFIRMATION_VOTING_TICKS,
        ministry_key: ministryKey,
        preamble
    }).select().single();

    if (billErr) throw billErr;

    console.log(`Minister nomination: ${nominee.firstName} ${nominee.lastName} for ${ministryKey} (bill ${bill.id})`);
    return { bill, nominee };
}


// ==================== PRESIDENTIAL VETO SYSTEM ====================

/**
 * President signs a bill into law.
 * Called from the UI when the President's party clicks "Sign Into Law".
 */
async function signPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    // Validate caller is president's party
    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can sign bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    await supabase.from('bills').update({
        president_action: 'signed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    await enactBill(supabase, bill, currentTick);

    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_passed',
            p_nation_id: bill.nation_id,
            p_tick: currentTick,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (signed by President)',
                sponsor: bill.factions?.faction_name || 'Unknown',
                votes_for: '0', votes_against: '0',
                article_count: String((bill.bill_articles || []).length)
            }
        });
    } catch (e) { /* non-blocking */ }
}

/**
 * President vetoes a bill.
 * Auto-creates a veto_override bill requiring 2/3 supermajority.
 */
async function vetoPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name)')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can veto bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Mark bill as vetoed
    await supabase.from('bills').update({
        status: 'vetoed',
        president_action: 'vetoed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    // Auto-create veto override bill (goes straight to floor)
    const overrideSeats = Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    const { data: overrideBill } = await supabase.from('bills').insert({
        nation_id: bill.nation_id,
        proposed_by: bill.proposed_by,
        proposed_tick: currentTick,
        bill_name: 'Veto Override: ' + bill.bill_name,
        bill_type: 'veto_override',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.VOTING_WINDOW_TICKS,
        original_bill_id: bill.id,
        is_veto_override: true,
        preamble: `The President has vetoed "${bill.bill_name}". The legislature may override this veto with a two-thirds supermajority (${overrideSeats} of ${GAME_CONFIG.TOTAL_SEATS} seats).`
    }).select().single();

    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_failed',
            p_nation_id: bill.nation_id,
            p_tick: currentTick,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (VETOED by President)',
                sponsor: bill.factions?.faction_name || 'Unknown',
                votes_for: '0', votes_against: '0'
            }
        });
    } catch (e) { /* non-blocking */ }

    return overrideBill;
}

/**
 * Auto-sign bills that have been on the president's desk past the deadline.
 * Called during advanceTick().
 */
async function processPresidentDesk(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return [];

    const { data: expiredDesks } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nation.id)
        .eq('status', 'president_desk')
        .lte('president_desk_deadline', currentTick);

    if (!expiredDesks || expiredDesks.length === 0) return [];

    const results = [];
    for (const bill of expiredDesks) {
        // Auto-sign: president didn't act in time
        await supabase.from('bills').update({
            president_action: 'auto_signed',
            president_action_tick: currentTick
        }).eq('id', bill.id);

        await enactBill(supabase, bill, currentTick);

        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'bill_passed',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    bill_name: bill.bill_name + ' (auto-signed by President)',
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: '0', votes_against: '0',
                    article_count: String((bill.bill_articles || []).length)
                }
            });
        } catch (e) { /* non-blocking */ }

        results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed' });
    }
    return results;
}

/**
 * Pre-election candidate generation: PRESIDENTIAL_CANDIDATE_LEAD_TICKS (6) ticks
 * before a scheduled presidential election, generate 3 presidential candidates for
 * each non-incumbent party. The incumbent president is automatically locked in as
 * their party's candidate (no player choice). Other parties' players pick their
 * nominee; autoSelectPresidentialCandidates() handles unselected parties on election day.
 *
 * Candidates are stored in pm_candidates with candidate_type = 'presidential'.
 */
async function triggerPresidentialCandidateSelection(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;

    // Find scheduled presidential elections that are exactly leadTicks away
    const targetTick = currentTick + leadTicks;
    const { data: upcomingElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .eq('election_tick', targetTick)
        .limit(1)
        .maybeSingle();

    if (!upcomingElection) return;

    // Check if candidates were already generated for this election
    const { count: existingCount } = await supabase
        .from('pm_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    if (existingCount > 0) return; // already generated

    console.log(`Generating presidential candidates for all parties in ${nation.name} (election at tick ${targetTick})`);

    // Check for active incumbent president
    const { data: incumbentPresident } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Get all parties in this nation
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!allParties || allParties.length === 0) return;

    for (const party of allParties) {
        if (incumbentPresident && party.id === incumbentPresident.faction_id) {
            // === INCUMBENT LOCK-IN: auto-create incumbent as their party's candidate ===
            // The incumbent president is automatically locked in as their faction's nominee.
            // No player choice — they must run for re-election. Player must impeach/resign to change.
            const factionIdeology = await loadFactionIdeology(supabase, incumbentPresident.faction_id);

            // Determine the incumbent's ideology axis from faction ideology
            // Use the faction's strongest axis as a proxy since we don't store axis on presidents
            let ideologyAxis = 'tradition_progress';
            let ideologyDirection = 1;
            if (factionIdeology) {
                const axes = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
                let maxAbs = 0;
                for (const axis of axes) {
                    const val = Math.abs(factionIdeology[axis] || 0);
                    if (val > maxAbs) {
                        maxAbs = val;
                        ideologyAxis = axis;
                        ideologyDirection = (factionIdeology[axis] || 0) >= 0 ? 1 : -1;
                    }
                }
            }

            // Clear any existing unselected presidential candidates for this faction
            await supabase.from('pm_candidates').delete()
                .eq('nation_id', nation.id)
                .eq('faction_id', incumbentPresident.faction_id)
                .eq('candidate_type', 'presidential')
                .eq('selected', false);

            // Insert the incumbent as a pre-selected candidate
            const { error: incumbentErr } = await supabase.from('pm_candidates').insert({
                nation_id: nation.id,
                faction_id: incumbentPresident.faction_id,
                first_name: incumbentPresident.first_name,
                last_name: incumbentPresident.last_name,
                age: incumbentPresident.age,
                ideology: incumbentPresident.ideology || 'PROGRESS',
                ideology_axis: ideologyAxis,
                ideology_direction: ideologyDirection,
                trait_key: incumbentPresident.trait || PM_TRAIT_KEYS[0],
                created_at_tick: currentTick,
                candidate_type: 'presidential',
                selected: true // Auto-selected — locked in
            });

            if (incumbentErr) {
                console.error(`Error creating incumbent candidate for ${incumbentPresident.first_name} ${incumbentPresident.last_name}:`, incumbentErr);
            } else {
                console.log(`INCUMBENT LOCK-IN: President ${incumbentPresident.first_name} ${incumbentPresident.last_name} auto-locked as ${party.faction_name}'s candidate (${nation.name})`);
            }
        } else {
            // Normal candidate generation for non-incumbent parties
            await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');
        }
    }

    // Fire system event for incumbent lock-in
    if (incumbentPresident) {
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'incumbent_lockin',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    president_name: `${incumbentPresident.first_name} ${incumbentPresident.last_name}`,
                    election_tick: String(targetTick),
                    ticks_remaining: String(leadTicks)
                }
            });
        } catch (e) { console.warn('Incumbent lock-in event fire failed (non-blocking):', e); }
    }
}

/**
 * Safety net: if an active president's term has expired and no presidential election
 * is scheduled, schedule one immediately. Also deactivates the president if term
 * has expired and a new president was already elected (shouldn't happen, but guards).
 */
async function processPresidentialTermEnd(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const { data: president } = await supabase
        .from('presidents')
        .select('id, faction_id, term_ends_tick')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!president) return;

    // Term hasn't expired yet
    if (president.term_ends_tick > currentTick) return;

    // Term has expired — check if a presidential election is already scheduled
    const { data: scheduledElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .limit(1)
        .maybeSingle();

    if (!scheduledElection) {
        // No election scheduled — schedule one for next tick
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 1,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Emergency presidential election scheduled for ${nation.name} at tick ${currentTick + 1} (term expired)`);
    }
}

/**
 * Auto-select a presidential candidate for every party that has unselected
 * candidates but no selected one. Called immediately before a presidential
 * election fires so every party participates in the candidate popular vote.
 */
async function autoSelectPresidentialCandidates(supabase, nation, currentTick) {
    // Find all unselected presidential candidates for this nation
    const { data: unselected } = await supabase
        .from('pm_candidates')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', false)
        .order('created_at', { ascending: true });

    if (!unselected || unselected.length === 0) return;

    // Find which factions already have a selected candidate
    const { data: alreadySelected } = await supabase
        .from('pm_candidates')
        .select('faction_id')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', true);

    const selectedFactions = new Set((alreadySelected || []).map(r => r.faction_id));

    // Group unselected by faction, auto-select the first for factions with no selection
    const factionGroups = {};
    for (const c of unselected) {
        if (selectedFactions.has(c.faction_id)) continue;
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = c;
    }

    for (const [factionId, pick] of Object.entries(factionGroups)) {
        console.log(`Auto-selecting presidential candidate for election: ${pick.first_name} ${pick.last_name} (faction ${factionId}) in ${nation.name}`);
        try {
            await selectPresidentCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting presidential candidate for ${nation.name}:`, e);
        }
    }
}

/**
 * No-op: presidential candidate selection stays open for the full 6-tick window
 * until election day. autoSelectPresidentialCandidates() handles auto-selection
 * at election time inside processElections().
 */
async function processPresidentCandidateTimeout(supabase, nation, currentTick) {
    return;
}

/**
 * Auto-select parliamentary PM candidates that have timed out (3 ticks).
 * Mirrors processPresidentCandidateTimeout but for parliamentary systems.
 */
async function processParliamentaryPMTimeout(supabase, nation, currentTick) {
    if (!isParliamentaryDemocracy(nation)) return;

    const timeoutTicks = 3;
    const { data: staleCandidates } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'parliamentary')
        .eq('selected', false)
        .lte('created_at_tick', currentTick - timeoutTicks)
        .order('created_at_tick', { ascending: true });

    if (!staleCandidates || staleCandidates.length === 0) return;

    // Group by faction to auto-select one per party
    const factionGroups = {};
    for (const c of staleCandidates) {
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = [];
        factionGroups[c.faction_id].push(c);
    }

    for (const [factionId, candidates] of Object.entries(factionGroups)) {
        // Check if this faction already has a selected candidate
        const { data: alreadySelected } = await supabase
            .from('pm_candidates')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_id', factionId)
            .eq('candidate_type', 'parliamentary')
            .eq('selected', true)
            .limit(1)
            .maybeSingle();
        if (alreadySelected) continue;

        const pick = candidates[0];
        console.log(`Auto-selecting parliamentary PM for ${nation.name}: ${pick.first_name} ${pick.last_name} — selection timed out after ${timeoutTicks} ticks`);

        try {
            await selectPMCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting parliamentary PM for ${nation.name}:`, e);
        }
    }
}

// Tick lock and tick mutation are intentionally Edge Function only.

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
async function calculateThreePillarPreferences(supabase, nation, currentTick) {
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
        const prefScore = Math.round(
            (ideoScore * PILLAR_WEIGHT_IDEO + newPerf * PILLAR_WEIGHT_PERF + momMapped * PILLAR_WEIGHT_MOM) * 100
        ) / 100;

        updates.push({
            id: row.id,
            faction_id: row.faction_id,
            bloc_id: row.bloc_id,
            ideology_alignment: Math.round(ideoScore * 100) / 100,
            performance_perception: newPerf,
            momentum: newMomentum,
            preference_score: prefScore
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

/**
 * Adjust momentum for a faction, optionally targeting a specific voter bloc.
 * Clamps to [-50, +50]. Writes an audit row to momentum_log.
 *
 * @param {object} supabase
 * @param {string} nationId  - nation UUID (for audit log)
 * @param {string} factionId - faction UUID
 * @param {string|null} blocId - specific bloc UUID, or null for all blocs
 * @param {number} amount    - positive = boost, negative = penalty
 * @param {string} source    - audit tag, e.g. 'crisis:government_shutdown'
 */
async function adjustMomentum(supabase, nationId, factionId, blocId, amount, source) {
    if (amount === 0) return;

    const query = supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, momentum')
        .eq('faction_id', factionId);
    if (blocId) query.eq('bloc_id', blocId);

    const { data: rows } = await query;
    if (!rows || rows.length === 0) return;

    for (const row of rows) {
        const old = Number(row.momentum ?? 0);
        const clamped = Math.round(Math.max(-50, Math.min(50, old + amount)) * 100) / 100;
        await supabase.from('faction_bloc_approval')
            .update({ momentum: clamped })
            .eq('id', row.id);
    }

    // Audit log (best-effort — don't fail the caller)
    const { data: shard } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    await supabase.from('momentum_log').insert({
        nation_id: nationId,
        faction_id: factionId,
        bloc_id: blocId || null,
        amount,
        source: source || 'unknown',
        tick: shard?.current_tick || 0
    });

    console.log(`[Momentum] ${amount > 0 ? '+' : ''}${amount} for faction ${factionId}${blocId ? ` bloc ${blocId}` : ` (${rows.length} blocs)`} — ${source}`);
}

/**
 * Convenience wrapper: adjust momentum uniformly across ALL blocs for a faction.
 * Use this for events that affect a party's overall standing (crises, elections, etc.).
 */
async function adjustMomentumAll(supabase, nationId, factionId, amount, source) {
    await adjustMomentum(supabase, nationId, factionId, null, amount, source);
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
async function processStatDecay(supabase, nation, statInstitutionMap, isShutdown = false) {
    const appliedDecay = [];
    const nationUpdates = {};

    for (const [statKey, config] of Object.entries(STAT_DECAY_CONFIG)) {
        if (!NATION_STAT_COLUMN_SET.has(statKey)) continue;

        const currentVal = nation[statKey] !== undefined && nation[statKey] !== null
            ? Number(nation[statKey]) : 50;
        let target = config.target;

        // During a government shutdown, institution-covered stats decay toward
        // worst-case values instead of their normal equilibrium targets.
        // This ensures the shutdown has a catastrophic, tangible impact on stats
        // even when they've already settled near their natural equilibrium.
        if (isShutdown && statInstitutionMap && statInstitutionMap[statKey]) {
            const sign = statDirectionSign(statKey);
            if (sign === 1)       target = Math.min(target, 10);  // higher-is-better → tank toward 10
            else if (sign === -1) target = Math.max(target, 90);  // lower-is-better → spike toward 90
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

        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;

        if (newVal !== Math.round(currentVal * 10) / 10) {
            nationUpdates[statKey] = newVal;
            appliedDecay.push({
                stat: statKey,
                type: config.type,
                previousValue: Math.round(currentVal * 10) / 10,
                newValue: newVal,
                target,
                speed,
                institutionModified: instDecay !== null
            });
        }
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
async function processStatConnections(supabase, nation, currentTick, connections) {
    if (!connections || connections.length === 0) return [];

    const applied = [];
    const nationUpdates = {};

    for (const conn of connections) {
        if (!NATION_STAT_COLUMN_SET.has(conn.source_stat) ||
            !NATION_STAT_COLUMN_SET.has(conn.target_stat)) continue;

        const sourceVal = Number(nation[conn.source_stat] ?? 50);
        const targetVal = Number(nation[conn.target_stat] ?? 50);

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

        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;

        if (newVal !== Math.round(targetVal * 10) / 10) {
            // Accumulate — multiple connections can affect the same target
            if (nationUpdates[conn.target_stat] !== undefined) {
                // Add delta on top of already-accumulated value
                const prevDelta = nationUpdates[conn.target_stat] - targetVal;
                const thisDelta = newVal - targetVal;
                nationUpdates[conn.target_stat] = Math.round(
                    Math.max(0, Math.min(100, targetVal + prevDelta + thisDelta)) * 10
                ) / 10;
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

const RALLY_CONFIG = {
    AP_COST: 1,
    MONEY_COST: 100000,
    DIMINISH_WINDOW: 5,
    ENERGIZE_THRESHOLD: 60,
    GLOBAL_MOMENTUM_MIN: 3,
    GLOBAL_MOMENTUM_MAX: 5,
    ENERGIZE_MOMENTUM: 3,
};

const RALLY_SUBJECTS = [
    { name: 'Protect Domestic Industry',       tags: ['NATIONALISM', 'COLLECTIVISM'] },
    { name: 'Religious Freedom',               tags: ['TRADITION', 'SECURITY'] },
    { name: 'Tax Cuts for Growth',             tags: ['LIBERTY', 'INDIVIDUALISM'] },
    { name: 'Close the Wage Gap',              tags: ['EQUALITY', 'COLLECTIVISM'] },
    { name: 'Strong Borders, Safe Nation',     tags: ['NATIONALISM', 'SECURITY'] },
    { name: 'Defend Free Speech',              tags: ['FREEDOM', 'LIBERTY'] },
    { name: "Invest in Our Children's Future", tags: ['PROGRESS', 'COLLECTIVISM'] },
    { name: 'Cut Red Tape',                    tags: ['LIBERTY', 'INDIVIDUALISM'] },
    { name: 'Support Our Troops',              tags: ['SECURITY', 'NATIONALISM'] },
    { name: "Workers' Rights Now",             tags: ['EQUALITY', 'COLLECTIVISM'] },
    { name: 'Preserve Our Heritage',           tags: ['TRADITION', 'NATIONALISM'] },
    { name: 'Green Energy Revolution',         tags: ['PROGRESS', 'GLOBALISM'] },
    { name: 'Law and Order',                   tags: ['SECURITY', 'TRADITION'] },
    { name: 'Open Markets, Open Minds',        tags: ['GLOBALISM', 'LIBERTY'] },
    { name: 'Power to the People',             tags: ['EQUALITY', 'FREEDOM'] },
    { name: 'Fair Trade, Not Free Trade',      tags: ['NATIONALISM', 'EQUALITY'] },
    { name: 'Digital Privacy Rights',          tags: ['FREEDOM', 'INDIVIDUALISM'] },
    { name: 'Expand Foreign Aid',              tags: ['GLOBALISM', 'COLLECTIVISM'] },
    { name: 'Community and Family Values',     tags: ['TRADITION', 'COLLECTIVISM'] },
    { name: 'Affordable Housing Now',          tags: ['EQUALITY', 'PROGRESS'] },
    { name: 'Entrepreneurship Unleashed',      tags: ['INDIVIDUALISM', 'PROGRESS'] },
    { name: 'International Cooperation',       tags: ['GLOBALISM', 'EQUALITY'] },
    { name: 'End Government Corruption',       tags: ['FREEDOM', 'EQUALITY'] },
    { name: 'Safe Streets Initiative',         tags: ['SECURITY', 'COLLECTIVISM'] },
    { name: 'Defend Our Sovereignty',          tags: ['NATIONALISM', 'INDIVIDUALISM'] },
    { name: 'Empower Local Communities',       tags: ['TRADITION', 'INDIVIDUALISM'] },
    { name: 'Reform the Justice System',       tags: ['FREEDOM', 'PROGRESS'] },
    { name: 'Fiscal Responsibility',           tags: ['LIBERTY', 'SECURITY'] },
    { name: 'Protect Civil Liberties',         tags: ['LIBERTY', 'FREEDOM'] },
    { name: 'Celebrate Cultural Diversity',    tags: ['GLOBALISM', 'PROGRESS'] },
];

/**
 * Classify voter blocs as energized / alienated / unaffected for a rally subject.
 * A bloc is energized if it leans toward ANY of the rally's ideology tags (axis >= 60).
 * A bloc is alienated if it leans OPPOSITE to any tag AND is not energized.
 */
function classifyRallyBlocs(subject, blocs) {
    const results = [];
    const threshold = RALLY_CONFIG.ENERGIZE_THRESHOLD;
    for (const bloc of blocs) {
        let energized = false;
        let alienated = false;
        let matchTag = null;
        let opposeTag = null;
        for (const tag of subject.tags) {
            const axisInfo = IDEOLOGY_TO_AXIS[tag];
            if (!axisInfo) continue;
            const blocVal = bloc['axis_' + axisInfo.axisKey] ?? 50;
            // direction +1 means right pole: high blocVal = aligned
            // direction -1 means left pole: low blocVal = aligned
            const alignment = axisInfo.direction === 1 ? blocVal : (100 - blocVal);
            if (alignment >= threshold) {
                energized = true;
                matchTag = tag;
            } else if (alignment <= (100 - threshold) && !energized) {
                alienated = true;
                opposeTag = tag;
            }
        }
        results.push({
            blocId: bloc.id,
            blocName: bloc.bloc_name,
            popWeight: bloc.population_weight || 0,
            classification: energized ? 'energized' : (alienated ? 'alienated' : 'unaffected'),
            matchTag: energized ? matchTag : null,
            opposeTag: alienated ? opposeTag : null,
        });
    }
    return results;
}

/**
 * Execute a rally: validate, roll effects, update DB, log.
 * Returns { success, subject, globalMomentum, blocResults, newAp, oldTreasury, newTreasury }
 */
async function executeRally(supabase, factionId, nationId, subjectIndex, currentTick) {
    const subject = RALLY_SUBJECTS[subjectIndex];
    if (!subject) return { success: false, error: 'Invalid rally subject.' };

    // ── 1. Validate AP + funds ──
    const { data: faction } = await supabase
        .from('factions').select('party_funds, action_points').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < RALLY_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${RALLY_CONFIG.AP_COST}.` };
    if ((faction.party_funds || 0) < RALLY_CONFIG.MONEY_COST)
        return { success: false, error: `Not enough funds. Need $${RALLY_CONFIG.MONEY_COST.toLocaleString()}.` };

    // ── 2. Check cooldown + diminishing returns ──
    const { data: recentRallies } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'rally')
        .gte('tick_performed', currentTick - RALLY_CONFIG.DIMINISH_WINDOW)
        .order('tick_performed', { ascending: false });

    if ((recentRallies || []).some(r => r.tick_performed === currentTick))
        return { success: false, error: 'Already held a rally this tick.' };

    const tagUseCounts = {};
    for (const tag of subject.tags) tagUseCounts[tag] = 0;
    for (const r of (recentRallies || [])) {
        for (const tag of (r.result?.tags || [])) {
            if (tagUseCounts[tag] !== undefined) tagUseCounts[tag]++;
        }
    }

    // ── 3. Classify blocs ──
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId).eq('is_active', true);

    const classified = classifyRallyBlocs(subject, blocs || []);

    // ── 4. Fetch current approval rows ──
    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score, momentum')
        .eq('faction_id', factionId);
    const byBloc = {};
    for (const row of (approvalRows || [])) byBloc[row.bloc_id] = row;

    // ── 5. Roll effects ──
    const globalMomentum = Math.floor(Math.random() * (RALLY_CONFIG.GLOBAL_MOMENTUM_MAX - RALLY_CONFIG.GLOBAL_MOMENTUM_MIN + 1)) + RALLY_CONFIG.GLOBAL_MOMENTUM_MIN;
    const blocResults = [];

    for (const c of classified) {
        const row = byBloc[c.blocId];
        if (!row) continue;
        const oldPref = Math.round(row.preference_score || 0);
        let prefDelta = 0;
        let momentumDelta = globalMomentum;

        if (c.classification === 'energized') {
            let roll = Math.floor(Math.random() * 2) + 1; // 1D2: 1 or 2
            let bMom = RALLY_CONFIG.ENERGIZE_MOMENTUM;
            const uses = tagUseCounts[c.matchTag] || 0;
            if (uses === 1) { roll = Math.max(1, Math.ceil(roll / 2)); bMom = Math.max(1, Math.ceil(bMom / 2)); }
            else if (uses >= 2) { roll = Math.max(1, Math.ceil(roll / 4)); bMom = Math.max(1, Math.ceil(bMom / 4)); }
            prefDelta = roll;
            momentumDelta += bMom;
        } else if (c.classification === 'alienated') {
            prefDelta = -(Math.floor(Math.random() * 3)); // 0, -1, or -2
        }

        const newPref = Math.max(0, Math.min(100, oldPref + prefDelta));
        const newMomentum = Math.round(((row.momentum || 0) + momentumDelta) * 100) / 100;

        await supabase.from('faction_bloc_approval')
            .update({ preference_score: newPref, momentum: newMomentum })
            .eq('id', row.id);

        blocResults.push({ ...c, prefDelta, momentumDelta, oldPref, newPref });
    }

    // ── 6. Deduct AP + money ──
    const apResult = await deductAP(supabase, factionId, RALLY_CONFIG.AP_COST);
    const oldTreasury = faction.party_funds || 0;
    const newTreasury = oldTreasury - RALLY_CONFIG.MONEY_COST;
    await supabase.from('factions')
        .update({ party_funds: newTreasury })
        .eq('id', factionId);

    // ── 7. Log ──
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'rally',
        ap_cost: RALLY_CONFIG.AP_COST,
        money_cost: RALLY_CONFIG.MONEY_COST,
        tick_performed: currentTick,
        result: { subject: subject.name, tags: subject.tags, subjectIndex, globalMomentum, blocResults }
    });

    return {
        success: true,
        subject,
        globalMomentum,
        blocResults,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - RALLY_CONFIG.AP_COST),
        oldTreasury,
        newTreasury,
    };
}


// ==================== PRESS CONFERENCE ====================

const PRESS_CONF_CONFIG = {
    AP_COST: 2,
    MONEY_COST: 50000,
    SAME_STAT_WINDOW: 3,        // ticks within which same-stat penalty applies
    // Taking Credit (your ministry, stat trending well)
    CREDIT_MOMENTUM_MIN: 3,     // 1D3+2
    CREDIT_MOMENTUM_MAX: 5,
    CREDIT_PREF_DELTA: 1,       // +1 preference for caring blocs
    // Taking Credit backfire (your ministry, stat trending badly)
    CREDIT_BACKFIRE_MOMENTUM: -2,
    CREDIT_BACKFIRE_PREF: -1,
    // Attack (rival ministry, stat trending badly)
    ATTACK_TARGET_MOM_MIN: 2,   // -(1D3+1) → -2 to -4
    ATTACK_TARGET_MOM_MAX: 4,
    ATTACK_SELF_MOM_MIN: 1,     // 1D3 → +1 to +3
    ATTACK_SELF_MOM_MAX: 3,
    ATTACK_PREF_SHIFT: 1,       // -1 from target, +1 to you
    // Attack backfire (rival ministry, stat trending well)
    ATTACK_BACKFIRE_SELF_MOMENTUM: -2,
    ATTACK_BACKFIRE_TARGET_MOMENTUM: 1,
    // Drawing Attention (no ministry holds it)
    ATTENTION_MOMENTUM_MIN: 1,  // 1D2
    ATTENTION_MOMENTUM_MAX: 2,
    // Flat-stat multiplier (stat unchanged — works but at reduced effect)
    FLAT_MOMENTUM_MULT: 0.6,
};

/**
 * Execute a press conference about a specific national stat.
 *
 * Modes:
 *  - "credit": Player holds the responsible ministry. Backfires only if stat is actively declining.
 *  - "attack": Another party holds the ministry. Backfires only if stat is actively improving.
 *  - "attention": No party holds the ministry. Small momentum gain.
 * Flat stats (no change) work at reduced effect (60% momentum) but never backfire.
 */
async function executePressConference(supabase, factionId, nationId, statKey, currentTick) {
    const ministryKey = STAT_TO_MINISTRY[statKey];
    if (!ministryKey) return { success: false, error: 'Unknown stat.' };

    const sign = statDirectionSign(statKey);
    if (sign === 0) return { success: false, error: 'Stat has no clear direction.' };

    // ── 1. Validate AP + funds ──
    const { data: faction } = await supabase
        .from('factions').select('party_funds, action_points, abbreviation, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < PRESS_CONF_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${PRESS_CONF_CONFIG.AP_COST}.` };
    if ((faction.party_funds || 0) < PRESS_CONF_CONFIG.MONEY_COST)
        return { success: false, error: `Not enough funds. Need $${PRESS_CONF_CONFIG.MONEY_COST.toLocaleString()}.` };

    // ── 2. Check cooldown ──
    const { data: recentPCs } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'press_conference')
        .gte('tick_performed', currentTick - PRESS_CONF_CONFIG.SAME_STAT_WINDOW)
        .order('tick_performed', { ascending: false });

    if ((recentPCs || []).some(r => r.tick_performed === currentTick))
        return { success: false, error: 'Already held a press conference this tick.' };

    // Same-stat penalty
    const sameStatRecent = (recentPCs || []).filter(r => r.result?.statKey === statKey);
    const sameStatPenalty = sameStatRecent.length > 0;

    // ── 3. Determine mode ──
    const { data: allMinistries } = await supabase
        .from('ministries')
        .select('party_id, ministry_key')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    // Also check who is PM (lead coalition party) for prime_minister stats
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const isPM = coalition && coalition.lead_party_id === factionId;

    let holderPartyId = null;
    const ministryRow = (allMinistries || []).find(m => m.ministry_key === ministryKey);
    if (ministryRow) {
        holderPartyId = ministryRow.party_id;
    }
    if (ministryKey === 'prime_minister' && coalition) {
        holderPartyId = coalition.lead_party_id;
    }

    let mode; // 'credit' | 'attack' | 'attention'
    let targetPartyId = null;
    if (holderPartyId === factionId || (ministryKey === 'prime_minister' && isPM)) {
        mode = 'credit';
    } else if (holderPartyId) {
        mode = 'attack';
        targetPartyId = holderPartyId;
    } else {
        mode = 'attention';
    }

    // ── 4. Determine stat trend ──
    const { data: nation } = await supabase
        .from('nations').select('*').eq('id', nationId).single();
    let prevStats = null;
    const PC_TREND_WINDOW = 3;
    if (currentTick > 0) {
        const lookbackTick = Math.max(0, currentTick - PC_TREND_WINDOW);
        const { data: histRow } = await supabase
            .from('nations_history')
            .select('*')
            .eq('nation_id', nationId)
            .eq('tick', lookbackTick)
            .maybeSingle();
        if (histRow) {
            prevStats = histRow;
        } else {
            const { data: fallbackRows } = await supabase
                .from('nations_history')
                .select('*')
                .eq('nation_id', nationId)
                .lt('tick', currentTick)
                .order('tick', { ascending: true })
                .limit(1);
            prevStats = fallbackRows?.[0] || null;
        }
    }

    const currentVal = nation ? nation[statKey] : null;
    const prevVal = prevStats ? prevStats[statKey] : null;
    const rawDelta = (currentVal != null && prevVal != null) ? currentVal - prevVal : 0;
    const improvement = rawDelta * sign; // positive = trending in the good direction
    const FLAT_THRESHOLD = 0.15;
    const trendingWell = improvement > FLAT_THRESHOLD;
    const trendingBadly = improvement < -FLAT_THRESHOLD;

    // ── 5. Determine backfire ──
    // Backfire ONLY when the trend actively contradicts your claim:
    //   Credit backfires if stat is actively declining (not flat).
    //   Attack backfires if stat is actively improving (not flat).
    // Flat stats work at reduced effect (FLAT_MOMENTUM_MULT) but never backfire.
    let backfire = false;
    let flatStat = !trendingWell && !trendingBadly;
    if (mode === 'credit' && trendingBadly) backfire = true;
    if (mode === 'attack' && trendingWell) backfire = true;

    // ── 6. Find blocs who care about this stat ──
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, priority_issues')
        .eq('nation_id', nationId).eq('is_active', true);

    const caringBlocs = [];
    for (const b of (blocs || [])) {
        const issues = b.priority_issues || [];
        for (const issue of issues) {
            const catStats = ISSUE_CATEGORY_STATS[issue] || [];
            if (catStats.includes(statKey)) {
                caringBlocs.push(b);
                break;
            }
        }
    }

    // ── 7. Fetch approval rows for both player and target ──
    const partyIdsNeeded = [factionId];
    if (targetPartyId) partyIdsNeeded.push(targetPartyId);

    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, faction_id, bloc_id, preference_score, momentum')
        .in('faction_id', partyIdsNeeded);

    const myByBloc = {};
    const targetByBloc = {};
    for (const row of (approvalRows || [])) {
        if (row.faction_id === factionId) myByBloc[row.bloc_id] = row;
        if (targetPartyId && row.faction_id === targetPartyId) targetByBloc[row.bloc_id] = row;
    }

    // ── 8. Get target party info ──
    let targetAbbr = null;
    if (targetPartyId) {
        const { data: targetFaction } = await supabase
            .from('factions').select('abbreviation, faction_name').eq('id', targetPartyId).single();
        targetAbbr = targetFaction?.abbreviation || targetFaction?.faction_name || '???';
    }

    // ── 9. Roll effects ──
    // Momentum multipliers stack: same-stat penalty (0.5) and flat-stat reduction (0.6)
    const sameStatMult = sameStatPenalty ? 0.5 : 1;
    const flatMult = (!backfire && flatStat) ? PRESS_CONF_CONFIG.FLAT_MOMENTUM_MULT : 1;
    const momMult = sameStatMult * flatMult;
    const statLabel = statKey.replace(/_/g, ' ');
    let selfMomentumDelta = 0;
    let targetMomentumDelta = 0;
    const blocResults = [];
    let headline = '';

    const playerAbbr = faction.abbreviation || faction.faction_name;
    const titleCase = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    function roll(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    if (mode === 'credit') {
        if (backfire) {
            selfMomentumDelta = Math.round(PRESS_CONF_CONFIG.CREDIT_BACKFIRE_MOMENTUM * sameStatMult);
            headline = `${playerAbbr} Claims Credit for Worsening ${titleCase(statLabel)} — Public Not Convinced`;
            // Blocs who care: -1 preference
            for (const b of caringBlocs) {
                const row = myByBloc[b.id];
                if (!row) continue;
                const oldPref = Math.round(row.preference_score || 0);
                const delta = PRESS_CONF_CONFIG.CREDIT_BACKFIRE_PREF;
                const newPref = Math.max(0, Math.min(100, oldPref + delta));
                await supabase.from('faction_bloc_approval').update({ preference_score: newPref }).eq('id', row.id);
                blocResults.push({ blocId: b.id, blocName: b.bloc_name, party: 'self', prefDelta: delta, oldPref, newPref });
            }
        } else {
            selfMomentumDelta = Math.max(1, Math.round(roll(PRESS_CONF_CONFIG.CREDIT_MOMENTUM_MIN, PRESS_CONF_CONFIG.CREDIT_MOMENTUM_MAX) * momMult));
            headline = flatStat
                ? `${playerAbbr} Highlights Stable ${titleCase(statLabel)} Under Their Watch`
                : `${playerAbbr} Takes Credit for Improving ${titleCase(statLabel)}`;
            for (const b of caringBlocs) {
                const row = myByBloc[b.id];
                if (!row) continue;
                const oldPref = Math.round(row.preference_score || 0);
                const delta = PRESS_CONF_CONFIG.CREDIT_PREF_DELTA;
                const newPref = Math.max(0, Math.min(100, oldPref + delta));
                await supabase.from('faction_bloc_approval').update({ preference_score: newPref }).eq('id', row.id);
                blocResults.push({ blocId: b.id, blocName: b.bloc_name, party: 'self', prefDelta: delta, oldPref, newPref });
            }
        }
    } else if (mode === 'attack') {
        if (backfire) {
            selfMomentumDelta = Math.round(PRESS_CONF_CONFIG.ATTACK_BACKFIRE_SELF_MOMENTUM * sameStatMult);
            targetMomentumDelta = PRESS_CONF_CONFIG.ATTACK_BACKFIRE_TARGET_MOMENTUM;
            headline = `${playerAbbr} Attacks ${targetAbbr} on ${titleCase(statLabel)} — But It's Improving`;
        } else {
            const targetMomRoll = roll(PRESS_CONF_CONFIG.ATTACK_TARGET_MOM_MIN, PRESS_CONF_CONFIG.ATTACK_TARGET_MOM_MAX);
            const selfMomRoll = roll(PRESS_CONF_CONFIG.ATTACK_SELF_MOM_MIN, PRESS_CONF_CONFIG.ATTACK_SELF_MOM_MAX);
            selfMomentumDelta = Math.max(1, Math.round(selfMomRoll * momMult));
            targetMomentumDelta = -Math.max(1, Math.round(targetMomRoll * flatMult));
            headline = flatStat
                ? `${playerAbbr} Criticizes ${targetAbbr} for Stagnant ${titleCase(statLabel)}`
                : `${playerAbbr} Blasts ${targetAbbr} Over Worsening ${titleCase(statLabel)}`;
            // Credit transfer: -1 from target, +1 to player for caring blocs
            for (const b of caringBlocs) {
                const myRow = myByBloc[b.id];
                const tgtRow = targetByBloc[b.id];
                if (myRow) {
                    const oldPref = Math.round(myRow.preference_score || 0);
                    const newPref = Math.max(0, Math.min(100, oldPref + PRESS_CONF_CONFIG.ATTACK_PREF_SHIFT));
                    await supabase.from('faction_bloc_approval').update({ preference_score: newPref }).eq('id', myRow.id);
                    blocResults.push({ blocId: b.id, blocName: b.bloc_name, party: 'self', prefDelta: PRESS_CONF_CONFIG.ATTACK_PREF_SHIFT, oldPref, newPref });
                }
                if (tgtRow) {
                    const oldPref = Math.round(tgtRow.preference_score || 0);
                    const newPref = Math.max(0, Math.min(100, oldPref - PRESS_CONF_CONFIG.ATTACK_PREF_SHIFT));
                    await supabase.from('faction_bloc_approval').update({ preference_score: newPref }).eq('id', tgtRow.id);
                    blocResults.push({ blocId: b.id, blocName: b.bloc_name, party: 'target', prefDelta: -PRESS_CONF_CONFIG.ATTACK_PREF_SHIFT, oldPref, newPref });
                }
            }
        }
    } else {
        // attention mode
        selfMomentumDelta = Math.max(1, Math.round(roll(PRESS_CONF_CONFIG.ATTENTION_MOMENTUM_MIN, PRESS_CONF_CONFIG.ATTENTION_MOMENTUM_MAX) * sameStatMult));
        headline = `${playerAbbr} Draws Attention to ${titleCase(statLabel)}`;
    }

    // ── 10. Apply momentum ──
    // Self momentum: apply to all our bloc rows
    if (selfMomentumDelta !== 0) {
        await adjustMomentumAll(supabase, nationId, factionId, selfMomentumDelta, 'campaign:press_conference');
    }
    // Target momentum (attack mode)
    if (targetPartyId && targetMomentumDelta !== 0) {
        await adjustMomentumAll(supabase, nationId, targetPartyId, targetMomentumDelta, 'campaign:press_conference_target');
    }

    // ── 11. Deduct AP + money ──
    const apResult = await deductAP(supabase, factionId, PRESS_CONF_CONFIG.AP_COST);
    const oldTreasury = faction.party_funds || 0;
    const newTreasury = oldTreasury - PRESS_CONF_CONFIG.MONEY_COST;
    await supabase.from('factions')
        .update({ party_funds: newTreasury })
        .eq('id', factionId);

    // ── 12. Log ──
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'press_conference',
        ap_cost: PRESS_CONF_CONFIG.AP_COST,
        money_cost: PRESS_CONF_CONFIG.MONEY_COST,
        tick_performed: currentTick,
        result: {
            statKey,
            ministryKey,
            mode,
            backfire,
            flatStat,
            headline,
            selfMomentumDelta,
            targetMomentumDelta,
            targetPartyId,
            targetAbbr,
            sameStatPenalty,
            blocResults,
            trendingWell,
            trendingBadly,
        }
    });

    return {
        success: true,
        mode,
        backfire,
        flatStat,
        headline,
        statKey,
        statLabel,
        ministryKey,
        selfMomentumDelta,
        targetMomentumDelta,
        targetAbbr,
        targetPartyId,
        sameStatPenalty,
        blocResults,
        caringBlocNames: caringBlocs.map(b => b.bloc_name),
        trendingWell,
        trendingBadly,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - PRESS_CONF_CONFIG.AP_COST),
        oldTreasury,
        newTreasury,
    };
}


// ==================== VOTER OUTREACH ====================

const OUTREACH_CONFIG = {
    AP_COST: 3,
    MONEY_COST: 25000,
    PREF_MIN: 1,        // 1D2
    PREF_MAX: 2,
    COOLDOWN_TICKS: 2,  // can't target the same bloc 2 ticks in a row
};

/**
 * Execute a voter outreach campaign targeting a specific voter bloc.
 * Guaranteed small preference gain (+1D2), no backlash, no headlines.
 */
async function executeOutreach(supabase, factionId, nationId, blocId, currentTick) {
    // ── 1. Validate AP + funds ──
    const { data: faction } = await supabase
        .from('factions').select('party_funds, action_points')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < OUTREACH_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${OUTREACH_CONFIG.AP_COST}.` };
    if ((faction.party_funds || 0) < OUTREACH_CONFIG.MONEY_COST)
        return { success: false, error: `Not enough funds. Need $${OUTREACH_CONFIG.MONEY_COST.toLocaleString()}.` };

    // ── 2. Check cooldown (same bloc within COOLDOWN_TICKS) ──
    const { data: recentOutreach } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'outreach')
        .gte('tick_performed', currentTick - OUTREACH_CONFIG.COOLDOWN_TICKS + 1)
        .order('tick_performed', { ascending: false });

    const recentBlocIds = (recentOutreach || []).map(r => r.result?.blocId).filter(Boolean);
    if (recentBlocIds.includes(blocId))
        return { success: false, error: 'You targeted this bloc too recently. Choose a different bloc.' };

    // ── 3. Fetch bloc info ──
    const { data: bloc } = await supabase
        .from('voter_blocs').select('id, bloc_name, population_weight')
        .eq('id', blocId).single();
    if (!bloc) return { success: false, error: 'Bloc not found.' };

    // ── 4. Fetch current approval row ──
    const { data: approvalRow } = await supabase
        .from('faction_bloc_approval')
        .select('id, preference_score')
        .eq('faction_id', factionId)
        .eq('bloc_id', blocId)
        .single();
    if (!approvalRow) return { success: false, error: 'No approval row for this bloc.' };

    // ── 5. Roll effect ──
    const prefDelta = Math.floor(Math.random() * (OUTREACH_CONFIG.PREF_MAX - OUTREACH_CONFIG.PREF_MIN + 1)) + OUTREACH_CONFIG.PREF_MIN;
    const oldPref = Math.round(approvalRow.preference_score || 0);
    const newPref = Math.max(0, Math.min(100, oldPref + prefDelta));

    await supabase.from('faction_bloc_approval')
        .update({ preference_score: newPref })
        .eq('id', approvalRow.id);

    // ── 6. Deduct AP + money ──
    const apResult = await deductAP(supabase, factionId, OUTREACH_CONFIG.AP_COST);
    const oldTreasury = faction.party_funds || 0;
    const newTreasury = oldTreasury - OUTREACH_CONFIG.MONEY_COST;
    await supabase.from('factions')
        .update({ party_funds: newTreasury })
        .eq('id', factionId);

    // ── 7. Log ──
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'outreach',
        ap_cost: OUTREACH_CONFIG.AP_COST,
        money_cost: OUTREACH_CONFIG.MONEY_COST,
        tick_performed: currentTick,
        result: {
            blocId,
            blocName: bloc.bloc_name,
            prefDelta,
            oldPref,
            newPref,
        }
    });

    return {
        success: true,
        blocName: bloc.bloc_name,
        prefDelta,
        oldPref,
        newPref,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - OUTREACH_CONFIG.AP_COST),
        oldTreasury,
        newTreasury,
    };
}


// ==================== FUNDRAISER SYSTEM ====================

const FUNDRAISER_CONFIG = {
    AP_COST: 2,
    MONEY_COST: 0,
    PROMISE_KEPT_PREF_BONUS: 5,
    PROMISE_KEPT_MOMENTUM: 4,
    PROMISE_KEPT_DONATION_MULTIPLIER_BONUS: 0.25,  // +25% future large donations
    PROMISE_BROKEN_DONOR_PREF: -8,
    PROMISE_BROKEN_ALL_PREF: -2,
    PROMISE_BROKEN_MOMENTUM: -12,
    PROMISE_BROKEN_LOCKOUT_TICKS: 30,
    PROMISE_BROKEN_NERVOUS_PREF: -1,  // other active promise holders get nervous
    GLOBAL_BROKEN_LOCKOUT_THRESHOLD: 2,  // 2 broken within 20 ticks = no big offers
    GLOBAL_BROKEN_WINDOW_TICKS: 20,
};

/**
 * Donation amount ranges by voter bloc name.
 * { small: [min, max], large: [min, max] }
 */
const DONATION_RANGES = {
    'Business Owners':        { small: [120000, 180000], large: [400000, 800000] },
    'Rural Traditionalists':  { small: [80000, 120000],  large: [250000, 500000] },
    'Academics & Professionals': { small: [60000, 100000], large: [180000, 400000] },
    'Religious Conservatives': { small: [60000, 100000], large: [200000, 400000] },
    'Military & Security':    { small: [50000, 90000],   large: [150000, 350000] },
    'Nationalist Bloc':       { small: [50000, 90000],   large: [150000, 350000] },
    'Urban Progressives':     { small: [50000, 90000],   large: [150000, 350000] },
    'Urban Workers':          { small: [40000, 80000],   large: [120000, 300000] },
    'Ethnic Minorities':      { small: [40000, 70000],   large: [120000, 280000] },
};

/**
 * Donor demands by voter bloc.
 * Each bloc has 10 possible demands with:
 *   - text: Display text (may contain placeholders like {current_val}, {target_val})
 *   - type: Category of demand for fulfillment checking
 *   - deadline: Ticks allowed
 *   - conditions: Structured fulfillment criteria
 */
const DONOR_DEMANDS = {
    'Rural Traditionalists': [
        {
            text: 'Win the Interior Ministry and get immigration below {target_val}',
            type: 'ministry_and_stat',
            deadline: 24,
            conditions: { ministry_key: 'interior', stat_key: 'immigration', direction: 'below', delta: 5 },
        },
        {
            text: 'Propose and pass the National Heritage Protection Act',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['TRADITION'], bill_name: 'National Heritage Protection Act' },
        },
        {
            text: 'Block the Open Borders Trade Agreement',
            type: 'block_bill',
            deadline: 20,
            conditions: { bill_tags: ['GLOBALISM'], bill_pattern: 'trade' },
        },
        {
            text: 'Bring crime_rate below {target_val}',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'crime_rate', direction: 'below', absolute_target: 30 },
        },
        {
            text: 'Publicly break with any party that supports globalist trade policy',
            type: 'coalition_restriction',
            deadline: 18,
            conditions: { block_coalition_with_tag: 'GLOBALISM' },
        },
        {
            text: 'Ensure no legislation passes that reduces agricultural subsidies',
            type: 'block_stat_decrease',
            deadline: 20,
            conditions: { protected_stat: 'arable_land', direction: 'no_decrease' },
        },
        {
            text: 'Hold three rallies on Nationalism themes within the deadline',
            type: 'rally_count',
            deadline: 15,
            conditions: { required_tags: ['NATIONALISM'], count: 3 },
        },
        {
            text: 'Get our representative appointed as Minister of Agriculture',
            type: 'ministry_appointment',
            deadline: 20,
            conditions: { ministry_key: 'agriculture' },
        },
        {
            text: 'Vote against every bill proposed by the most Globalist party',
            type: 'vote_pattern',
            deadline: 18,
            conditions: { oppose_ideology: 'GLOBALISM', vote: 'no' },
        },
        {
            text: 'Achieve stability above 70 and keep it there for 5 consecutive ticks',
            type: 'stat_sustained',
            deadline: 24,
            conditions: { stat_key: 'stability', direction: 'above', threshold: 70, sustained_ticks: 5 },
        },
    ],
    'Religious Conservatives': [
        {
            text: 'Pass the Family Values and Public Morality Act',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['TRADITION', 'SECURITY'], bill_name: 'Family Values and Public Morality Act' },
        },
        {
            text: 'Get drug_use below {target_val}',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'drug_use', direction: 'below', absolute_target: 25 },
        },
        {
            text: 'Block any bill that secularizes education',
            type: 'block_stat_decrease',
            deadline: 20,
            conditions: { protected_stat: 'religious', direction: 'no_decrease' },
        },
        {
            text: 'Win the Education Ministry and increase the religious stat by 5',
            type: 'ministry_and_stat',
            deadline: 24,
            conditions: { ministry_key: 'education', stat_key: 'religious', direction: 'above', delta: 5 },
        },
        {
            text: 'Remove the current Minister of Healthcare',
            type: 'no_confidence',
            deadline: 18,
            conditions: { target_ministry: 'healthcare' },
        },
        {
            text: 'Publicly condemn the most Progressive party three times',
            type: 'press_conference_count',
            deadline: 15,
            conditions: { target_ideology: 'PROGRESS', count: 3 },
        },
        {
            text: 'Ensure crime_rate drops by at least 3 points',
            type: 'stat_target',
            deadline: 20,
            conditions: { stat_key: 'crime_rate', direction: 'below', delta: 3 },
        },
        {
            text: 'Oppose any coalition that includes the most Freedom-leaning party',
            type: 'coalition_restriction',
            deadline: 20,
            conditions: { block_coalition_with_ideology: 'FREEDOM' },
        },
        {
            text: 'Appoint a party member from our bloc as Minister of Education',
            type: 'ministry_appointment',
            deadline: 20,
            conditions: { ministry_key: 'education' },
        },
        {
            text: 'Pass two bills tagged Tradition within the deadline',
            type: 'pass_bill_count',
            deadline: 22,
            conditions: { bill_tags: ['TRADITION'], count: 2 },
        },
    ],
    'Nationalist Bloc': [
        {
            text: 'Pass the National Sovereignty and Border Security Act',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['NATIONALISM', 'SECURITY'], bill_name: 'National Sovereignty and Border Security Act' },
        },
        {
            text: 'Get immigration below {target_val}',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'immigration', direction: 'below', delta: 8 },
        },
        {
            text: 'Win the Defense Ministry and reduce terrorism by 5',
            type: 'ministry_and_stat',
            deadline: 24,
            conditions: { ministry_key: 'defense', stat_key: 'terrorism', direction: 'below', delta: 5 },
        },
        {
            text: 'Block all Globalism-tagged bills for the duration',
            type: 'block_bill_tag',
            deadline: 20,
            conditions: { blocked_tag: 'GLOBALISM' },
        },
        {
            text: 'File a no-confidence motion against the Prime Minister',
            type: 'no_confidence',
            deadline: 18,
            conditions: { target_ministry: 'prime_minister', partial_reward: true },
        },
        {
            text: 'Achieve political_violence below 15',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'political_violence', direction: 'below', absolute_target: 15 },
        },
        {
            text: 'Leave any coalition that signs a foreign trade agreement',
            type: 'coalition_restriction',
            deadline: 20,
            conditions: { leave_if_bill_tag: 'GLOBALISM', leave_window: 2 },
        },
        {
            text: 'Hold five rallies on Security or Nationalism themes',
            type: 'rally_count',
            deadline: 18,
            conditions: { required_tags: ['SECURITY', 'NATIONALISM'], count: 5 },
        },
        {
            text: 'Ensure stability stays above 60 for the entire duration',
            type: 'stat_floor',
            deadline: 20,
            conditions: { stat_key: 'stability', floor: 60 },
        },
        {
            text: 'Propose a constitutional amendment strengthening national identity',
            type: 'constitutional_amendment',
            deadline: 22,
            conditions: { bill_tags: ['NATIONALISM'], supermajority: true },
        },
    ],
    'Business Owners': [
        {
            text: 'Win Finance Ministry and lower corporate_tax by 5 points',
            type: 'ministry_and_stat',
            deadline: 24,
            conditions: { ministry_key: 'finance', stat_key: 'corporate_tax', direction: 'below', delta: 5 },
        },
        {
            text: 'Rescind the most recent Collectivism-tagged bill',
            type: 'repeal_bill',
            deadline: 20,
            conditions: { repeal_tag: 'COLLECTIVISM' },
        },
        {
            text: 'Block any minimum wage increase for the duration',
            type: 'block_stat_increase',
            deadline: 20,
            conditions: { protected_stat: 'minimum_wage', direction: 'no_increase' },
        },
        {
            text: 'Reduce government regulation — get efficiency above {target_val}',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'efficiency', direction: 'above', delta: 5 },
        },
        {
            text: 'Propose and pass the Free Enterprise Deregulation Act',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['LIBERTY', 'INDIVIDUALISM'], bill_name: 'Free Enterprise Deregulation Act' },
        },
        {
            text: 'Ensure interest_rates drop by at least 3 points',
            type: 'stat_target',
            deadline: 22,
            conditions: { stat_key: 'interest_rates', direction: 'below', delta: 3 },
        },
        {
            text: 'Vote against every Equality-tagged bill for the duration',
            type: 'vote_pattern',
            deadline: 18,
            conditions: { oppose_tag: 'EQUALITY', vote: 'no' },
        },
        {
            text: 'Remove the Minister of Labor',
            type: 'no_confidence',
            deadline: 18,
            conditions: { target_ministry: 'labor' },
        },
        {
            text: 'Achieve GDP growth above 4%',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'gdp_growth', direction: 'above', absolute_target: 4 },
        },
        {
            text: 'Publicly oppose unionization three times',
            type: 'press_conference_count',
            deadline: 15,
            conditions: { target_topic: 'unionization', count: 3 },
        },
    ],
    'Urban Workers': [
        {
            text: "Pass the Workers' Rights and Fair Wages Act",
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['EQUALITY', 'COLLECTIVISM'], bill_name: "Workers' Rights and Fair Wages Act" },
        },
        {
            text: 'Win Labor Ministry and raise minimum_wage by 5 points',
            type: 'ministry_and_stat',
            deadline: 24,
            conditions: { ministry_key: 'labor', stat_key: 'minimum_wage', direction: 'above', delta: 5 },
        },
        {
            text: 'Block any corporate tax cut for the duration',
            type: 'block_stat_decrease',
            deadline: 20,
            conditions: { protected_stat: 'corporate_tax', direction: 'no_decrease' },
        },
        {
            text: 'Get unemployment below {target_val}',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'unemployment', direction: 'below', delta: 5 },
        },
        {
            text: 'Publicly attack the most Liberty-leaning party on worker exploitation three times',
            type: 'press_conference_count',
            deadline: 15,
            conditions: { target_ideology: 'LIBERTY', count: 3 },
        },
        {
            text: 'Propose and pass an income inequality reduction bill',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['EQUALITY'], stat_effects: { income_inequality: 'decrease' } },
        },
        {
            text: 'Ensure benefits stat stays above current level for the duration',
            type: 'stat_floor',
            deadline: 18,
            conditions: { stat_key: 'benefits', floor_from_current: true },
        },
        {
            text: 'Leave any coalition that passes anti-worker legislation',
            type: 'coalition_restriction',
            deadline: 20,
            conditions: { leave_if_stat_decrease: ['minimum_wage', 'benefits'], leave_window: 2 },
        },
        {
            text: 'File a no-confidence motion against the Finance Minister',
            type: 'no_confidence',
            deadline: 18,
            conditions: { target_ministry: 'finance' },
        },
        {
            text: 'Vote against every Individualism-tagged bill for the duration',
            type: 'vote_pattern',
            deadline: 18,
            conditions: { oppose_tag: 'INDIVIDUALISM', vote: 'no' },
        },
    ],
    'Urban Progressives': [
        {
            text: 'Pass the Education Reform and Modernization Act',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['PROGRESS', 'FREEDOM'], bill_name: 'Education Reform and Modernization Act' },
        },
        {
            text: 'Get freedom_index above {target_val}',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'freedom_index', direction: 'above', delta: 8 },
        },
        {
            text: 'Repeal the most recent Security-tagged bill',
            type: 'repeal_bill',
            deadline: 20,
            conditions: { repeal_tag: 'SECURITY' },
        },
        {
            text: 'Win Education Ministry and raise education_accessibility by 5',
            type: 'ministry_and_stat',
            deadline: 24,
            conditions: { ministry_key: 'education', stat_key: 'education_accessibility', direction: 'above', delta: 5 },
        },
        {
            text: 'Block any bill that restricts press_freedom for the duration',
            type: 'block_stat_decrease',
            deadline: 20,
            conditions: { protected_stat: 'press_freedom', direction: 'no_decrease' },
        },
        {
            text: 'Publicly condemn government surveillance three times',
            type: 'press_conference_count',
            deadline: 15,
            conditions: { target_topic: 'surveillance', count: 3 },
        },
        {
            text: 'Reduce corruption by 5 points',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'corruption', direction: 'below', delta: 5 },
        },
        {
            text: 'Oppose any coalition with the most Tradition-leaning party',
            type: 'coalition_restriction',
            deadline: 20,
            conditions: { block_coalition_with_ideology: 'TRADITION' },
        },
        {
            text: 'Propose a constitutional amendment on civil liberties',
            type: 'constitutional_amendment',
            deadline: 22,
            conditions: { bill_tags: ['FREEDOM'], supermajority: true },
        },
        {
            text: 'Ensure education_accessibility never drops below current level',
            type: 'stat_floor',
            deadline: 18,
            conditions: { stat_key: 'education_accessibility', floor_from_current: true },
        },
    ],
    'Academics & Professionals': [
        {
            text: 'Pass the Government Accountability and Transparency Act',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['COLLECTIVISM', 'SECURITY'], bill_name: 'Government Accountability and Transparency Act' },
        },
        {
            text: 'Get corruption below {target_val}',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'corruption', direction: 'below', absolute_target: 20 },
        },
        {
            text: 'Win Interior Ministry and improve both efficiency and corruption by 3',
            type: 'ministry_and_dual_stat',
            deadline: 24,
            conditions: { ministry_key: 'interior', stats: [
                { stat_key: 'efficiency', direction: 'above', delta: 3 },
                { stat_key: 'corruption', direction: 'below', delta: 3 },
            ]},
        },
        {
            text: 'Remove any minister with a corruption scandal',
            type: 'no_confidence_conditional',
            deadline: 20,
            conditions: { trigger: 'corruption_scandal', auto_success_if_none: true },
        },
        {
            text: 'Block any bill that increases bureaucratic corruption',
            type: 'block_stat_increase',
            deadline: 20,
            conditions: { protected_stat: 'corruption', direction: 'no_increase' },
        },
        {
            text: 'Propose and pass an institutional reform bill',
            type: 'pass_bill',
            deadline: 18,
            conditions: { stat_effects: { efficiency: 'increase' } },
        },
        {
            text: 'Ensure stability stays above 55 for the duration',
            type: 'stat_floor',
            deadline: 20,
            conditions: { stat_key: 'stability', floor: 55 },
        },
        {
            text: 'Publicly expose government waste three times',
            type: 'press_conference_count',
            deadline: 15,
            conditions: { target_topic: 'efficiency', count: 3 },
        },
        {
            text: 'Achieve efficiency above 65',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'efficiency', direction: 'above', absolute_target: 65 },
        },
        {
            text: 'Vote against any bill from a party with an active corruption scandal',
            type: 'vote_pattern',
            deadline: 18,
            conditions: { oppose_scandal_party: true, vote: 'no' },
        },
    ],
    'Military & Security': [
        {
            text: 'Pass the National Defense Strengthening Act',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['SECURITY', 'NATIONALISM'], bill_name: 'National Defense Strengthening Act' },
        },
        {
            text: 'Win Defense Ministry and reduce terrorism below {target_val}',
            type: 'ministry_and_stat',
            deadline: 24,
            conditions: { ministry_key: 'defense', stat_key: 'terrorism', direction: 'below', delta: 5 },
        },
        {
            text: 'Block any bill that cuts defense spending',
            type: 'block_bill_tag',
            deadline: 20,
            conditions: { blocked_tag: 'defense_cut', stat_effects: { terrorism: 'increase' } },
        },
        {
            text: 'Achieve political_violence below 10',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'political_violence', direction: 'below', absolute_target: 10 },
        },
        {
            text: 'Remove the current Defense Minister and replace with a hardliner',
            type: 'no_confidence',
            deadline: 20,
            conditions: { target_ministry: 'defense', replace_required: true },
        },
        {
            text: 'Publicly support military action or defense buildup five times',
            type: 'rally_count',
            deadline: 18,
            conditions: { required_tags: ['SECURITY'], count: 5 },
        },
        {
            text: 'Ensure stability never drops below 50',
            type: 'stat_floor',
            deadline: 20,
            conditions: { stat_key: 'stability', floor: 50 },
        },
        {
            text: 'Oppose any coalition with the most Freedom-leaning party',
            type: 'coalition_restriction',
            deadline: 20,
            conditions: { block_coalition_with_ideology: 'FREEDOM' },
        },
        {
            text: 'Get immigration below 30',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'immigration', direction: 'below', absolute_target: 30 },
        },
        {
            text: 'Propose a constitutional amendment on national security',
            type: 'constitutional_amendment',
            deadline: 22,
            conditions: { bill_tags: ['SECURITY'], supermajority: true },
        },
    ],
    'Ethnic Minorities': [
        {
            text: 'Pass the Equal Rights and Anti-Discrimination Act',
            type: 'pass_bill',
            deadline: 20,
            conditions: { bill_tags: ['EQUALITY', 'GLOBALISM'], bill_name: 'Equal Rights and Anti-Discrimination Act' },
        },
        {
            text: 'Get freedom_index above {target_val}',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'freedom_index', direction: 'above', delta: 5 },
        },
        {
            text: 'Block any bill that restricts immigration for the duration',
            type: 'block_stat_decrease',
            deadline: 20,
            conditions: { protected_stat: 'immigration', direction: 'no_decrease' },
        },
        {
            text: 'Reduce income_inequality by 5 points',
            type: 'stat_target',
            deadline: 24,
            conditions: { stat_key: 'income_inequality', direction: 'below', delta: 5 },
        },
        {
            text: 'Publicly defend minority rights five times',
            type: 'rally_count',
            deadline: 18,
            conditions: { required_tags: ['EQUALITY', 'GLOBALISM'], count: 5 },
        },
        {
            text: 'Oppose any coalition with the most Nationalism-leaning party',
            type: 'coalition_restriction',
            deadline: 20,
            conditions: { block_coalition_with_ideology: 'NATIONALISM' },
        },
        {
            text: 'Ensure press_freedom never drops below current level',
            type: 'stat_floor',
            deadline: 18,
            conditions: { stat_key: 'press_freedom', floor_from_current: true },
        },
        {
            text: 'Repeal the most recent Nationalism-tagged bill',
            type: 'repeal_bill',
            deadline: 20,
            conditions: { repeal_tag: 'NATIONALISM' },
        },
        {
            text: 'Win Interior Ministry and raise freedom_index by 5',
            type: 'ministry_and_stat',
            deadline: 24,
            conditions: { ministry_key: 'interior', stat_key: 'freedom_index', direction: 'above', delta: 5 },
        },
        {
            text: 'Vote against every Nationalism-tagged bill for the duration',
            type: 'vote_pattern',
            deadline: 18,
            conditions: { oppose_tag: 'NATIONALISM', vote: 'no' },
        },
    ],
};

/**
 * Generate a random integer in [min, max] inclusive.
 */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * Generate a fundraiser offer for a given bloc.
 * Returns { smallAmount, largeAmount, demand, demandIndex, deadline }
 * @param {string} blocName - Voter bloc name
 * @param {object} nationStats - Current nation stats
 * @param {number} trustMultiplier - Trust bonus multiplier
 * @param {Array|null} dbDemands - Optional demand templates from database (overrides hardcoded)
 */
function generateFundraiserOffer(blocName, nationStats, trustMultiplier = 1.0, dbDemands = null) {
    const ranges = DONATION_RANGES[blocName];
    if (!ranges) return null;

    // Use DB demands if provided, otherwise fall back to hardcoded
    const demands = (dbDemands && dbDemands.length > 0)
        ? dbDemands.map(d => ({ text: d.demand_text, type: d.demand_type, deadline: d.deadline, conditions: d.conditions }))
        : DONOR_DEMANDS[blocName];
    if (!demands || demands.length === 0) return null;

    // Roll donation amounts
    const smallAmount = randInt(ranges.small[0], ranges.small[1]);
    // Large amount gets the trust multiplier bonus
    const baseLarge = randInt(ranges.large[0], ranges.large[1]);
    const largeAmount = Math.round(baseLarge * Math.max(1.0, trustMultiplier));

    // Select a random demand
    const demandIndex = randInt(0, demands.length - 1);
    const demand = demands[demandIndex];

    // Resolve placeholders in demand text
    let demandText = demand.text;
    if (demand.conditions.delta && demand.conditions.stat_key) {
        const currentVal = Number(nationStats[demand.conditions.stat_key] ?? 50);
        if (demand.conditions.direction === 'below') {
            const target = demand.conditions.absolute_target ?? Math.round(currentVal - demand.conditions.delta);
            demandText = demandText.replace('{target_val}', target);
        } else if (demand.conditions.direction === 'above') {
            const target = demand.conditions.absolute_target ?? Math.round(currentVal + demand.conditions.delta);
            demandText = demandText.replace('{target_val}', target);
        }
    }
    if (demand.conditions.absolute_target !== undefined) {
        demandText = demandText.replace('{target_val}', demand.conditions.absolute_target);
    }

    return {
        smallAmount,
        largeAmount,
        demand: { ...demand, resolvedText: demandText },
        demandIndex,
        deadline: demand.deadline,
    };
}

/**
 * Build the conditions snapshot for a new promise, capturing current stat values.
 * This is stored in fundraiser_promises.conditions for tick-by-tick evaluation.
 */
function buildPromiseConditions(demand, nationStats, currentTick) {
    const cond = { ...demand.conditions };

    // Snapshot current stat values for delta-based demands
    if (cond.delta && cond.stat_key) {
        cond.baseline_value = Number(nationStats[cond.stat_key] ?? 50);
        if (cond.direction === 'below') {
            cond.target_value = cond.absolute_target ?? Math.round(cond.baseline_value - cond.delta);
        } else if (cond.direction === 'above') {
            cond.target_value = cond.absolute_target ?? Math.round(cond.baseline_value + cond.delta);
        }
    }
    if (cond.absolute_target !== undefined && !cond.target_value) {
        cond.target_value = cond.absolute_target;
    }

    // For stat_floor with floor_from_current, snapshot the current value
    if (cond.floor_from_current && cond.stat_key) {
        cond.floor = Math.round(Number(nationStats[cond.stat_key] ?? 50));
    }

    // For ministry_and_dual_stat, snapshot both stats
    if (cond.stats && Array.isArray(cond.stats)) {
        cond.stats = cond.stats.map(s => ({
            ...s,
            baseline_value: Number(nationStats[s.stat_key] ?? 50),
            target_value: s.direction === 'above'
                ? Math.round(Number(nationStats[s.stat_key] ?? 50) + (s.delta || 0))
                : Math.round(Number(nationStats[s.stat_key] ?? 50) - (s.delta || 0)),
        }));
    }

    return cond;
}

/**
 * Detect conflicts between a new demand and existing active promises.
 * Returns array of conflict descriptions.
 */
function detectPromiseConflicts(newDemand, activePromises) {
    const conflicts = [];
    const cond = newDemand.conditions;

    for (const promise of activePromises) {
        const pc = promise.conditions;

        // Stat direction conflicts: one wants increase, other wants decrease/block
        if (cond.stat_key && pc.protected_stat === cond.stat_key) {
            if (cond.direction === 'below' && pc.direction === 'no_decrease') {
                conflicts.push({
                    promise,
                    message: `This demand directly contradicts your active promise to ${promise.bloc_name} ("${promise.demand_text}"). Accepting both guarantees you break one.`
                });
            }
            if (cond.direction === 'above' && pc.direction === 'no_increase') {
                conflicts.push({
                    promise,
                    message: `This demand directly contradicts your active promise to ${promise.bloc_name} ("${promise.demand_text}"). Accepting both guarantees you break one.`
                });
            }
        }
        if (pc.stat_key && cond.protected_stat === pc.stat_key) {
            if (pc.direction === 'below' && cond.direction === 'no_decrease') {
                conflicts.push({
                    promise,
                    message: `This demand directly contradicts your active promise to ${promise.bloc_name} ("${promise.demand_text}"). Accepting both guarantees you break one.`
                });
            }
            if (pc.direction === 'above' && cond.direction === 'no_increase') {
                conflicts.push({
                    promise,
                    message: `This demand directly contradicts your active promise to ${promise.bloc_name} ("${promise.demand_text}"). Accepting both guarantees you break one.`
                });
            }
        }

        // Vote pattern conflicts: opposing all X-tagged + opposing all Y-tagged where X/Y are opposites
        if (cond.oppose_tag && pc.oppose_tag) {
            const myOpp = IDEOLOGY_OPPOSITES[cond.oppose_tag];
            if (myOpp === pc.oppose_tag || pc.oppose_tag === cond.oppose_tag) {
                conflicts.push({
                    promise,
                    message: `Combined with your promise to ${promise.bloc_name}, you'd be voting against nearly everything.`
                });
            }
        }

        // Coalition restriction conflicts
        if (cond.block_coalition_with_ideology && pc.block_coalition_with_ideology) {
            conflicts.push({
                promise,
                message: `Combined with your promise to ${promise.bloc_name}, your coalition options may be severely limited.`
            });
        }
    }

    return conflicts;
}

/**
 * Execute the fundraiser action for a specific voter bloc chosen by the player.
 * Steps: validate -> generate offer for chosen bloc -> return offer for UI.
 * The player then chooses (small / large+promise / decline) in a separate call.
 */
async function executeFundraiserOffer(supabase, factionId, nationId, currentTick, blocId) {
    // ── 1. Validate AP ──
    const { data: faction } = await supabase
        .from('factions').select('party_funds, action_points, abbreviation, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < FUNDRAISER_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${FUNDRAISER_CONFIG.AP_COST}.` };

    // ── 2. Load the chosen voter bloc ──
    const { data: selectedBloc } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('id', blocId).single();
    if (!selectedBloc) return { success: false, error: 'Voter bloc not found.' };

    // ── 4. Check bloc preference — blocs below 20 pref won't fund you ──
    const { data: approvalRow } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score, momentum')
        .eq('faction_id', factionId)
        .eq('bloc_id', blocId)
        .single();
    if (!approvalRow) return { success: false, error: 'No approval data for this bloc.' };

    const pref = Number(approvalRow.preference_score ?? 0);
    if (pref < 20) return { success: false, error: `${selectedBloc.bloc_name} won't fund you — your preference is too low (${Math.round(pref)}%).` };

    // ── 5. Check donor trust / lockout ──
    let trustRow = null;
    const { data: trustData } = await supabase
        .from('donor_trust')
        .select('*')
        .eq('party_id', factionId)
        .eq('bloc_id', selectedBloc.id)
        .single();
    trustRow = trustData;

    const isLockedOut = trustRow && trustRow.lockout_until_tick > currentTick;
    const globalBrokenRecent = trustRow?.recent_broken_count ?? 0;

    const trustMultiplier = trustRow?.large_donation_multiplier ?? 1.0;

    // ── 6. Load active promises — check for existing promise with this bloc ──
    const { data: activePromises } = await supabase
        .from('fundraiser_promises')
        .select('*')
        .eq('party_id', factionId)
        .eq('status', 'active');

    const hasActivePromiseWithBloc = (activePromises || []).some(p => p.bloc_id === selectedBloc.id);

    // If active promise with this bloc: small donation halved, large blocked
    // If trust locked out or too many broken promises: large also blocked
    const bigOffersBlocked = hasActivePromiseWithBloc || isLockedOut || globalBrokenRecent >= FUNDRAISER_CONFIG.GLOBAL_BROKEN_LOCKOUT_THRESHOLD;
    const smallHalved = hasActivePromiseWithBloc;

    // ── 7. Load nation stats for demand generation ──
    const { data: nation } = await supabase
        .from('nations').select('*').eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };

    // ── 8. Load demand templates from DB, fall back to hardcoded ──
    let dbDemands = null;
    const { data: demandRows } = await supabase
        .from('demand_templates')
        .select('*')
        .eq('bloc_name', selectedBloc.bloc_name)
        .eq('is_active', true)
        .order('sort_order');
    if (demandRows && demandRows.length > 0) {
        dbDemands = demandRows;
    }

    const offer = generateFundraiserOffer(selectedBloc.bloc_name, nation, trustMultiplier, dbDemands);
    if (!offer) return { success: false, error: 'Could not generate an offer for this bloc.' };

    // Halve the small amount if they already have an active promise with this bloc
    if (smallHalved) {
        offer.smallAmount = Math.round(offer.smallAmount / 2);
    }

    const conflicts = detectPromiseConflicts(offer.demand, activePromises || []);

    // ── 9. Build the ideology tags for the bloc ──
    const blocIdeologyTags = [];
    const axisKeys = [
        { key: 'axis_liberty_equality', left: 'EQUALITY', right: 'LIBERTY' },
        { key: 'axis_tradition_progress', left: 'PROGRESS', right: 'TRADITION' },
        { key: 'axis_security_freedom', left: 'FREEDOM', right: 'SECURITY' },
        { key: 'axis_globalism_nationalism', left: 'NATIONALISM', right: 'GLOBALISM' },
        { key: 'axis_individualism_collectivism', left: 'COLLECTIVISM', right: 'INDIVIDUALISM' },
    ];
    for (const ax of axisKeys) {
        const val = selectedBloc[ax.key] ?? 50;
        if (val >= 65) blocIdeologyTags.push(ax.right);
        else if (val <= 35) blocIdeologyTags.push(ax.left);
    }

    return {
        success: true,
        bloc: selectedBloc,
        blocIdeologyTags,
        offer,
        bigOffersBlocked,
        smallHalved,
        hasActivePromiseWithBloc,
        conflicts,
        currentTreasury: faction.party_funds || 0,
        currentAP: faction.action_points || 0,
        factionAbbr: faction.abbreviation || faction.faction_name,
        currentTick,
        nationStats: nation,
    };
}

/**
 * Accept the small donation (no strings).
 */
async function acceptSmallDonation(supabase, factionId, nationId, blocId, blocName, amount, currentTick, factionAbbr) {
    // Deduct AP
    const apResult = await deductAP(supabase, factionId, FUNDRAISER_CONFIG.AP_COST);

    // Add money
    const { data: faction } = await supabase
        .from('factions').select('party_funds').eq('id', factionId).single();
    const oldTreasury = faction?.party_funds || 0;
    const newTreasury = oldTreasury + amount;
    await supabase.from('factions')
        .update({ party_funds: newTreasury })
        .eq('id', factionId);

    // Log
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'fundraiser',
        ap_cost: FUNDRAISER_CONFIG.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            type: 'small_donation',
            blocId,
            blocName,
            amount,
            oldTreasury,
            newTreasury,
        }
    });

    return {
        success: true,
        type: 'small_donation',
        blocName,
        amount,
        oldTreasury,
        newTreasury,
        newAp: apResult.newAp,
    };
}

/**
 * Accept the large donation with a promise.
 */
async function acceptLargeDonation(supabase, factionId, nationId, blocId, blocName, amount, demand, demandIndex, deadline, currentTick, nationStats, factionAbbr) {
    // Deduct AP
    const apResult = await deductAP(supabase, factionId, FUNDRAISER_CONFIG.AP_COST);

    // Add money
    const { data: faction } = await supabase
        .from('factions').select('party_funds').eq('id', factionId).single();
    const oldTreasury = faction?.party_funds || 0;
    const newTreasury = oldTreasury + amount;
    await supabase.from('factions')
        .update({ party_funds: newTreasury })
        .eq('id', factionId);

    // Build conditions with current stat snapshots
    const conditions = buildPromiseConditions(demand, nationStats, currentTick);

    // Create promise record
    const tickDeadline = currentTick + deadline;
    const { data: promise, error: promiseErr } = await supabase
        .from('fundraiser_promises')
        .insert({
            party_id: factionId,
            nation_id: nationId,
            bloc_id: blocId,
            bloc_name: blocName,
            demand_index: demandIndex,
            demand_text: demand.resolvedText || demand.text,
            demand_type: demand.type,
            donation_amount: amount,
            small_amount: 0, // caller should set this
            tick_created: currentTick,
            deadline_ticks: deadline,
            tick_deadline: tickDeadline,
            conditions,
            progress: {},
            status: 'active',
        })
        .select()
        .single();

    if (promiseErr) {
        console.error('[Fundraiser] Promise insert failed:', promiseErr.message);
    }

    // Ensure donor_trust row exists
    const { data: existing } = await supabase
        .from('donor_trust')
        .select('id')
        .eq('party_id', factionId)
        .eq('bloc_id', blocId)
        .single();

    if (!existing) {
        await supabase.from('donor_trust').insert({
            party_id: factionId,
            nation_id: nationId,
            bloc_id: blocId,
            bloc_name: blocName,
        });
    }

    // Log
    const headline = `${blocName} Donors Contribute $${amount.toLocaleString()} to ${factionAbbr}`;
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'fundraiser',
        ap_cost: FUNDRAISER_CONFIG.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            type: 'large_donation',
            blocId,
            blocName,
            amount,
            oldTreasury,
            newTreasury,
            demandText: demand.resolvedText || demand.text,
            demandIndex,
            deadline,
            tickDeadline,
            headline,
            promiseId: promise?.id,
        }
    });

    return {
        success: true,
        type: 'large_donation',
        blocName,
        amount,
        oldTreasury,
        newTreasury,
        newAp: apResult.newAp,
        demandText: demand.resolvedText || demand.text,
        deadline,
        tickDeadline,
        headline,
        promiseId: promise?.id,
    };
}

/**
 * Decline both offers — still costs 1 AP (you spent time meeting donors).
 */
async function declineFundraiser(supabase, factionId, nationId, blocId, blocName, currentTick) {
    const apResult = await deductAP(supabase, factionId, FUNDRAISER_CONFIG.AP_COST);

    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'fundraiser',
        ap_cost: FUNDRAISER_CONFIG.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            type: 'declined',
            blocId,
            blocName,
        }
    });

    return { success: true, type: 'declined', newAp: apResult.newAp };
}


// ==================== PROMISE TICK PROCESSING ====================

/**
 * Evaluate promise fulfillment status for a single promise.
 * Returns { status: 'fulfilled' | 'in_progress' | 'at_risk' | 'broken', progress }
 *
 * This checks stat-based promises. Other types (pass_bill, rally_count, etc.)
 * are tracked via campaign_actions logs and updated externally.
 */
function evaluatePromiseStatus(promise, nationStats, currentTick, ministries, coalitionPartyIds, campaignActions) {
    const cond = promise.conditions;
    const elapsed = currentTick - promise.tick_created;
    const remaining = promise.tick_deadline - currentTick;
    const progress = { ...promise.progress };

    // Helper: check if party holds a specific ministry
    const holdsMinistry = (key) => {
        return (ministries || []).some(m => m.ministry_key === key && m.party_id === promise.party_id);
    };

    switch (promise.demand_type) {
        case 'stat_target': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const target = cond.target_value ?? cond.absolute_target;
            progress.current_value = currentVal;
            progress.target_value = target;

            if (cond.direction === 'below' && currentVal <= target) {
                return { status: 'fulfilled', progress };
            }
            if (cond.direction === 'above' && currentVal >= target) {
                return { status: 'fulfilled', progress };
            }

            // At risk if less than 25% time remaining
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) {
                return { status: 'at_risk', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'ministry_and_stat': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const target = cond.target_value ?? cond.absolute_target;
            progress.has_ministry = hasMinistry;
            progress.ministry_key = cond.ministry_key;
            progress.current_value = currentVal;
            progress.target_value = target;

            const statMet = cond.direction === 'below'
                ? currentVal <= target
                : currentVal >= target;

            if (hasMinistry && statMet) {
                return { status: 'fulfilled', progress };
            }
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) {
                return { status: 'at_risk', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'ministry_and_dual_stat': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            progress.has_ministry = hasMinistry;
            progress.stats = [];
            let allMet = hasMinistry;

            for (const s of (cond.stats || [])) {
                const currentVal = Number(nationStats[s.stat_key] ?? 50);
                const met = s.direction === 'above'
                    ? currentVal >= s.target_value
                    : currentVal <= s.target_value;
                progress.stats.push({ stat_key: s.stat_key, current: currentVal, target: s.target_value, met });
                if (!met) allMet = false;
            }

            if (allMet) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'stat_floor': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const floor = cond.floor;
            progress.current_value = currentVal;
            progress.floor = floor;

            if (currentVal < floor) {
                return { status: 'broken', progress }; // Instant break if floor violated
            }
            return { status: 'in_progress', progress };
        }

        case 'stat_sustained': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const threshold = cond.threshold;
            progress.current_value = currentVal;
            progress.threshold = threshold;
            progress.sustained_count = progress.sustained_count || 0;
            progress.required = cond.sustained_ticks;

            if (currentVal >= threshold) {
                progress.sustained_count++;
            } else {
                progress.sustained_count = 0; // Reset on dip
            }

            if (progress.sustained_count >= cond.sustained_ticks) {
                return { status: 'fulfilled', progress };
            }
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'block_stat_decrease':
        case 'block_stat_increase': {
            const currentVal = Number(nationStats[cond.protected_stat] ?? 50);
            const baseline = cond.baseline_value ?? currentVal;
            progress.current_value = currentVal;
            progress.baseline = baseline;

            if (cond.direction === 'no_decrease' && currentVal < baseline - 0.5) {
                return { status: 'broken', progress };
            }
            if (cond.direction === 'no_increase' && currentVal > baseline + 0.5) {
                return { status: 'broken', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'rally_count': {
            const requiredTags = cond.required_tags || [];
            const matchingRallies = (campaignActions || []).filter(a => {
                if (a.action_type !== 'rally') return false;
                if (a.party_id !== promise.party_id) return false;
                if (a.tick_performed < promise.tick_created) return false;
                if (a.tick_performed > promise.tick_deadline) return false;
                const tags = a.result?.tags || [];
                return requiredTags.some(rt => tags.includes(rt));
            });
            progress.completed = matchingRallies.length;
            progress.required = cond.count;

            if (matchingRallies.length >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'press_conference_count': {
            const matchingPCs = (campaignActions || []).filter(a => {
                if (a.action_type !== 'press_conference') return false;
                if (a.party_id !== promise.party_id) return false;
                if (a.tick_performed < promise.tick_created) return false;
                if (a.tick_performed > promise.tick_deadline) return false;
                return true; // All press conferences count for this
            });
            progress.completed = matchingPCs.length;
            progress.required = cond.count;

            if (matchingPCs.length >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'ministry_appointment': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            progress.has_ministry = hasMinistry;
            progress.ministry_key = cond.ministry_key;

            if (hasMinistry) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'pass_bill': {
            // Check if a matching bill was passed during the promise window
            const passed = progress.bill_passed || false;
            progress.bill_name = cond.bill_name || 'Required bill';
            if (passed) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'pass_bill_count': {
            const count = progress.bills_passed || 0;
            progress.required = cond.count;
            progress.completed = count;
            if (count >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'repeal_bill':
        case 'block_bill':
        case 'block_bill_tag':
        case 'vote_pattern':
        case 'coalition_restriction':
        case 'no_confidence':
        case 'no_confidence_conditional':
        case 'constitutional_amendment': {
            // These are tracked by external events updating the progress field
            if (progress.completed) return { status: 'fulfilled', progress };
            if (progress.violated) return { status: 'broken', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        default:
            return { status: 'in_progress', progress };
    }
}

/**
 * Process all active promises for a nation during tick advancement.
 * Checks fulfillment, applies rewards/penalties for expired promises.
 */
async function processPromiseTick(supabase, nation, currentTick) {
    const { data: activePromises } = await supabase
        .from('fundraiser_promises')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'active');

    if (!activePromises || activePromises.length === 0) return [];

    const results = [];

    // Load shared data once
    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    const coalitionPartyIds = coalition?.party_ids || [];

    // Load campaign actions for rally/press_conference counting
    const partyIds = [...new Set(activePromises.map(p => p.party_id))];
    const minTick = Math.min(...activePromises.map(p => p.tick_created));
    const { data: campaignActions } = await supabase
        .from('campaign_actions')
        .select('party_id, action_type, tick_performed, result')
        .in('party_id', partyIds)
        .gte('tick_performed', minTick);

    // Fresh nation stats
    const { data: freshNation } = await supabase
        .from('nations').select('*').eq('id', nation.id).single();
    const nationStats = freshNation || nation;

    for (const promise of activePromises) {
        const evaluation = evaluatePromiseStatus(promise, nationStats, currentTick, ministries, coalitionPartyIds, campaignActions);

        // Update progress
        await supabase.from('fundraiser_promises')
            .update({ progress: evaluation.progress, updated_at: new Date().toISOString() })
            .eq('id', promise.id);

        // Check if fulfilled
        if (evaluation.status === 'fulfilled') {
            await resolvePromise(supabase, promise, 'fulfilled', currentTick, nationStats);
            results.push({ promise, resolution: 'fulfilled' });
            continue;
        }

        // Check if broken (stat floor violated, or deadline passed)
        if (evaluation.status === 'broken' || currentTick >= promise.tick_deadline) {
            await resolvePromise(supabase, promise, 'broken', currentTick, nationStats);
            results.push({ promise, resolution: 'broken' });
            continue;
        }
    }

    return results;
}

/**
 * Apply rewards or penalties when a promise is resolved.
 */
async function resolvePromise(supabase, promise, resolution, currentTick, nationStats) {
    const cfg = FUNDRAISER_CONFIG;

    if (resolution === 'fulfilled') {
        // ── REWARDS ──
        // +5 preference with donor bloc
        const { data: blocRow } = await supabase
            .from('faction_bloc_approval')
            .select('id, preference_score')
            .eq('faction_id', promise.party_id)
            .eq('bloc_id', promise.bloc_id)
            .single();

        if (blocRow) {
            const newPref = Math.min(100, Math.round(blocRow.preference_score + cfg.PROMISE_KEPT_PREF_BONUS));
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref })
                .eq('id', blocRow.id);
        }

        // +4 momentum
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.PROMISE_KEPT_MOMENTUM, 'promise:kept');

        // Update donor trust: +25% multiplier
        await supabase.from('donor_trust')
            .update({
                large_donation_multiplier: supabase.rpc ? undefined : 1.0, // fallback
                promises_kept: (await supabase.from('donor_trust').select('promises_kept').eq('party_id', promise.party_id).eq('bloc_id', promise.bloc_id).single()).data?.promises_kept + 1 || 1,
                updated_at: new Date().toISOString(),
            })
            .eq('party_id', promise.party_id)
            .eq('bloc_id', promise.bloc_id);

        // Simpler trust update: increment multiplier
        const { data: trust } = await supabase
            .from('donor_trust')
            .select('large_donation_multiplier, promises_kept')
            .eq('party_id', promise.party_id)
            .eq('bloc_id', promise.bloc_id)
            .single();

        if (trust) {
            await supabase.from('donor_trust')
                .update({
                    large_donation_multiplier: Math.round((Number(trust.large_donation_multiplier || 1) + cfg.PROMISE_KEPT_DONATION_MULTIPLIER_BONUS) * 100) / 100,
                    promises_kept: (trust.promises_kept || 0) + 1,
                    updated_at: new Date().toISOString(),
                })
                .eq('party_id', promise.party_id)
                .eq('bloc_id', promise.bloc_id);
        }

        // Mark promise as fulfilled
        await supabase.from('fundraiser_promises')
            .update({ status: 'fulfilled', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);

    } else if (resolution === 'broken') {
        // ── PENALTIES ──
        // -8 preference with donor bloc
        const { data: blocRow } = await supabase
            .from('faction_bloc_approval')
            .select('id, preference_score')
            .eq('faction_id', promise.party_id)
            .eq('bloc_id', promise.bloc_id)
            .single();

        if (blocRow) {
            const newPref = Math.max(0, Math.round(blocRow.preference_score + cfg.PROMISE_BROKEN_DONOR_PREF));
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref })
                .eq('id', blocRow.id);
        }

        // -2 momentum with ALL blocs
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.PROMISE_BROKEN_ALL_PREF, 'promise:broken_penalty');

        // -12 momentum
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.PROMISE_BROKEN_MOMENTUM, 'promise:broken');

        // Lockout: bloc won't offer large donations for 30 ticks
        const { data: trust } = await supabase
            .from('donor_trust')
            .select('*')
            .eq('party_id', promise.party_id)
            .eq('bloc_id', promise.bloc_id)
            .single();

        if (trust) {
            await supabase.from('donor_trust')
                .update({
                    lockout_until_tick: currentTick + cfg.PROMISE_BROKEN_LOCKOUT_TICKS,
                    promises_broken: (trust.promises_broken || 0) + 1,
                    recent_broken_count: (trust.recent_broken_count || 0) + 1,
                    last_broken_tick: currentTick,
                    large_donation_multiplier: 1.0, // Reset trust
                    updated_at: new Date().toISOString(),
                })
                .eq('party_id', promise.party_id)
                .eq('bloc_id', promise.bloc_id);
        }

        // Nervous other promise holders: -1 pref with each
        const { data: otherPromises } = await supabase
            .from('fundraiser_promises')
            .select('bloc_id')
            .eq('party_id', promise.party_id)
            .eq('status', 'active')
            .neq('id', promise.id);

        if (otherPromises && otherPromises.length > 0) {
            const nervousBlocIds = [...new Set(otherPromises.map(p => p.bloc_id))];
            for (const nervousBlocId of nervousBlocIds) {
                const { data: nervousRow } = await supabase
                    .from('faction_bloc_approval')
                    .select('id, preference_score')
                    .eq('faction_id', promise.party_id)
                    .eq('bloc_id', nervousBlocId)
                    .single();

                if (nervousRow) {
                    const newPref = Math.max(0, Math.round(nervousRow.preference_score + cfg.PROMISE_BROKEN_NERVOUS_PREF));
                    await supabase.from('faction_bloc_approval')
                        .update({ preference_score: newPref })
                        .eq('id', nervousRow.id);
                }
            }
        }

        // Also update global broken count across all blocs for this party
        const { data: allTrust } = await supabase
            .from('donor_trust')
            .select('id, recent_broken_count, last_broken_tick')
            .eq('party_id', promise.party_id);

        if (allTrust) {
            for (const t of allTrust) {
                // Expire old broken counts
                const isRecent = t.last_broken_tick && (currentTick - t.last_broken_tick) < cfg.GLOBAL_BROKEN_WINDOW_TICKS;
                if (!isRecent && t.recent_broken_count > 0) {
                    await supabase.from('donor_trust')
                        .update({ recent_broken_count: 0, updated_at: new Date().toISOString() })
                        .eq('id', t.id);
                }
            }
        }

        // Mark promise as broken
        await supabase.from('fundraiser_promises')
            .update({ status: 'broken', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);
    }
}


// ==================== LOYALTY TICK PROCESSING ====================

async function processLoyaltyTick(supabase, nation) {
    const rulingId = nation.ruling_faction_id;
    if (!rulingId) return;

    const nationIsAutocracy = isAutocracy(nation);

    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .not('party_id', 'is', null);

    const ministryCounts = {};
    if (ministries) {
        for (const m of ministries) {
            ministryCounts[m.party_id] = (ministryCounts[m.party_id] || 0) + 1;
        }
    }

    for (const faction of factions) {
        let loyalty = faction.loyalty ?? 50;
        let seats = faction.seats || 0;

        if (faction.id === rulingId) {
            if (nationIsAutocracy) {
                // Autocracy ruling faction: dynamic loyalty drifting toward 80
                const ministryCount = ministryCounts[faction.id] || 0;
                if (loyalty > 80) loyalty -= 1;
                else if (loyalty < 80) loyalty += 1;
                loyalty += ministryCount * 0.5;
                loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));
                await supabase.from('factions')
                    .update({ loyalty })
                    .eq('id', faction.id);
            } else {
                if (loyalty !== 100) {
                    await supabase.from('factions')
                        .update({ loyalty: 100 })
                        .eq('id', faction.id);
                }
            }
            continue;
        }

        const ministryCount = ministryCounts[faction.id] || 0;

        if (ministryCount > 0) {
            loyalty += ministryCount * 0.5;
        } else {
            loyalty -= 2;
        }

        if (loyalty > 50) {
            loyalty -= 1;
        } else if (loyalty < 50) {
            loyalty += 1;
        }

        loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));

        // Loyalty is now informational only for autocracies (no AP/seat drain or auto-purges).

        await supabase.from('factions')
            .update({ loyalty, seats })
            .eq('id', faction.id);
    }
}


// ==================== REGIME PILLARS TICK ====================

/**
 * The six pillars of an autocratic regime. Each pillar decays by 1d2 per tick
 * and receives a 1d2 bonus per satisfied "want" condition.
 * The average of all pillar support values = Grip on Power.
 */
const REGIME_PILLAR_DEFS = [
    { key: 'military',    name: 'The Military',      wants: [
        { stat: 'stability', threshold: 50, direction: 'above' },
        { stat: '_armed_forces_funding', threshold: 90, direction: 'above' },
    ]},
    { key: 'security',    name: 'Security Services',  wants: [
        { stat: 'crime_rate', threshold: 40, direction: 'below' },
        { stat: 'corruption', threshold: 50, direction: 'above' },
    ]},
    { key: 'party',       name: 'The Party',          wants: [
        { stat: 'legitimacy', threshold: 50, direction: 'above' },
        { stat: 'standard_of_living', threshold: 50, direction: 'above' },
    ]},
    { key: 'oligarchs',   name: 'Oligarchs',          wants: [
        { stat: 'gdp_growth', threshold: 50, direction: 'above' },
        { stat: 'corporate_tax', threshold: 30, direction: 'below' },
    ]},
    { key: 'bureaucracy', name: 'Bureaucracy',        wants: [
        { stat: 'efficiency', threshold: 50, direction: 'above' },
        { stat: '_debt_ratio', threshold: 50, direction: 'below' },
    ]},
    { key: 'media',       name: 'State Media',        wants: [
        { stat: 'freedom_index', threshold: 40, direction: 'below' },
        { stat: 'legitimacy', threshold: 50, direction: 'above' },
    ]},
];

function d2() { return 1 + Math.floor(Math.random() * 2); } // 1 or 2

async function processRegimePillars(supabase, nation) {
    if (!isAutocracy(nation)) return;

    // Fetch existing pillars
    const { data: pillars } = await supabase
        .from('regime_pillars')
        .select('id, pillar_key, support')
        .eq('nation_id', nation.id);

    // If no pillars yet (new autocracy), seed them
    if (!pillars || pillars.length === 0) {
        const rows = REGIME_PILLAR_DEFS.map(def => ({
            nation_id: nation.id,
            pillar_key: def.key,
            pillar_name: def.name,
            support: 55 + Math.floor(Math.random() * 31), // 55-85
        }));
        await supabase.from('regime_pillars').insert(rows);
        return;
    }

    // Build a lookup of pillar_key → row
    const pillarMap = {};
    for (const p of pillars) pillarMap[p.pillar_key] = p;

    // Compute special synthetic stats:
    // _armed_forces_funding: % funding of the 'military' institution from the active budget
    let armedForcesFunding = 0;
    if (nation.last_budget_bill_id) {
        const { data: milAlloc } = await supabase
            .from('budget_item_allocations')
            .select('allocation_amount, needed_amount')
            .eq('bill_id', nation.last_budget_bill_id)
            .eq('item_type', 'institution')
            .eq('item_id', 'military')
            .maybeSingle();
        if (milAlloc && Number(milAlloc.needed_amount) > 0) {
            armedForcesFunding = Math.min(100, Math.round(
                (Number(milAlloc.allocation_amount) / Number(milAlloc.needed_amount)) * 100
            ));
        }
    }

    // _debt_ratio: simple 0-100 where lower is better
    // Use debt relative to GDP: debt/gdp * 100, clamped 0-100
    const gdp = Number(nation.gdp || 1);
    const debt = Number(nation.debt || 0);
    const debtRatio = Math.min(100, Math.max(0, Math.round((debt / Math.max(gdp, 1)) * 100)));

    const syntheticStats = {
        _armed_forces_funding: armedForcesFunding,
        _debt_ratio: debtRatio,
    };

    // Process each pillar
    for (const def of REGIME_PILLAR_DEFS) {
        const row = pillarMap[def.key];
        if (!row) continue;

        let support = row.support;

        // Natural decay: -1d2 per tick
        support -= d2();

        // Check each want: if satisfied, +1d2 bonus
        for (const want of def.wants) {
            const val = want.stat.startsWith('_')
                ? (syntheticStats[want.stat] ?? 0)
                : Number(nation[want.stat] ?? 50);

            const satisfied = want.direction === 'above'
                ? val >= want.threshold
                : val <= want.threshold;

            if (satisfied) {
                support += d2();
            }
        }

        support = Math.max(0, Math.min(100, support));

        await supabase.from('regime_pillars')
            .update({ support, updated_at: new Date().toISOString() })
            .eq('id', row.id);
    }
}

// ==================== SHAKEUP AUTO-RESOLVE ====================

async function autoResolveStaleShakeups(supabase, nationId, currentTick) {
    const { data: votingShakeups } = await supabase
        .from('shakeups')
        .select('id, created_at')
        .eq('nation_id', nationId)
        .eq('status', 'voting');

    if (!votingShakeups || votingShakeups.length === 0) return;

    const AUTO_RESOLVE_TICKS = 2;

    for (const shakeup of votingShakeups) {
        let tickAge = AUTO_RESOLVE_TICKS;

        if (shakeup.created_tick != null) {
            tickAge = currentTick - shakeup.created_tick;
        } else if (shakeup.created_at) {
            const ageMs = Date.now() - new Date(shakeup.created_at).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            tickAge = ageDays >= 1 ? AUTO_RESOLVE_TICKS : 0;
        }

        if (tickAge >= AUTO_RESOLVE_TICKS) {
            console.log(`Auto-resolving stale shakeup ${shakeup.id} (age: ${tickAge} ticks, now tick ${currentTick})`);
            try {
                const { data, error } = await supabase.rpc('resolve_shakeup', { p_shakeup_id: shakeup.id });
                if (error) console.error('Auto-resolve shakeup error:', error);
                else console.log('Auto-resolve result:', data);
            } catch (e) {
                console.error('Auto-resolve shakeup exception:', e);
            }
        }
    }
}


// ==================== STAT EFFECTS PROCESSING ====================

async function processStatEffects(supabase, nation, currentTick) {
    let activeLaws;

    // Try join query first; fall back to separate lookup if FK is missing
    const { data, error: joinError } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
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
            if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
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
                const delay = Number(eff.delay_ticks) || 0;
                const duration = Number(eff.duration_ticks) || 12;
                const rate = Number(eff.rate) || 1;
                const dir = String(eff.direction || '').toLowerCase();
                const rawStatKey = eff.stat_key;
                const statKey = normalizeNationStatKey(rawStatKey);

                if (!statKey || !NATION_STAT_COLUMN_SET.has(statKey)) {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid stat_key "${rawStatKey}" for ${effectSource}`
                        );
                    }
                    continue;
                }

                if (dir !== 'up' && dir !== 'down') {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid direction "${eff.direction}" for stat_key="${rawStatKey}" from ${effectSource}`
                        );
                    }
                    continue;
                }

                if (ticksSincePassed <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSincePassed > delay && ticksSincePassed <= delay + duration) {
                    // GDP is only changed by gdp_growth via applyGdpGrowth — skip stat effects
                    if (statKey === 'gdp') continue;

                    const currentVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);

                    // For raw-value stats (population), scale rate by divisor
                    // so rate: 1 means +1M for population
                    const scaledRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;

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
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                    }
                    nationUpdates[statKey] = newVal;
                    anyEffectApplied = true;

                    appliedEffects.push({
                        policy: isReversal ? '↩ Reversal: ' + (policy?.policy_name || 'Unknown') : (policy?.policy_name || 'Unknown'),
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
async function processMinistryActions(supabase, nation, currentTick) {
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
                            ministerUpdates[mKey] = (ministry?.minister_approval ?? 50);
                            ministerBaseline[mKey] = ministerUpdates[mKey];
                        }
                        currentVal = ministerUpdates[mKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        ministerUpdates[mKey] = newVal;
                    } else if (target === 'faction') {
                        const fKey = action.faction_id;
                        if (factionUpdates[fKey] === undefined) {
                            const { data: faction } = await supabase
                                .from('factions')
                                .select('approval_rating')
                                .eq('id', action.faction_id)
                                .single();
                            factionUpdates[fKey] = (faction?.approval_rating ?? 50);
                            factionBaseline[fKey] = factionUpdates[fKey];
                        }
                        currentVal = factionUpdates[fKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        factionUpdates[fKey] = newVal;
                    } else {
                        // Default: nation stat
                        currentVal = nationUpdates[statKey] !== undefined
                            ? nationUpdates[statKey]
                            : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
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
        trackingUpdates.push({ id: action.id, allEffectsComplete });
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
            const { data: faction } = await supabase
                .from('factions')
                .select('approval_rating')
                .eq('id', factionId)
                .single();
            factionUpdates[factionId] = (faction?.approval_rating ?? 50);
            factionBaseline[factionId] = factionUpdates[factionId];
        }
        factionUpdates[factionId] = Math.max(0, factionUpdates[factionId] - (loss * multiplier));
    }

    // Bulk update faction momentum via event cascades
    for (const fKey of Object.keys(factionUpdates)) {
        const delta = Math.round((factionUpdates[fKey] - (factionBaseline[fKey] ?? 50)) * 10) / 10;
        if (delta !== 0) {
            await adjustMomentumAll(supabase, nation.id, fKey, delta, 'event:cascade');
        }
    }

    return appliedEffects;
}

// ==================== LAYER 1: PER-TICK MINISTER APPROVAL ====================

/**
 * Update each minister's approval based on the current state of their owned stats.
 * Uses threshold-based scoring: the public doesn't care about marginal changes,
 * they care whether stats are at acceptable levels or in crisis.
 *
 * Excludes prime_minister (PM approval comes from the composite government approval).
 *
 * Also tracks embattled status: if a minister stays below 30 approval for 5+ ticks,
 * they become "embattled" and impose penalties on government approval.
 *
 * @param {object} supabase
 * @param {object} nation - nation row with current stat values
 * @param {number} currentTick
 * @returns {Array} results for logging
 */
async function updateMinisterApprovals(supabase, nation, currentTick) {
    const { data: ministries } = await supabase
        .from('ministries')
        .select('id, ministry_key, minister_approval, minister_first_name, embattled_since_tick, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return [];

    const results = [];

    for (const ministry of ministries) {
        // Skip PM — their approval is derived from the composite government score
        if (ministry.ministry_key === 'prime_minister') continue;
        // Skip vacant ministries (no minister appointed)
        if (!ministry.minister_first_name) continue;

        const ownedStats = MINISTRY_TO_STATS[ministry.ministry_key];
        if (!ownedStats || ownedStats.length === 0) continue;

        // Score each owned stat
        let contributionSum = 0;
        let statCount = 0;
        for (const statKey of ownedStats) {
            const value = Number(nation[statKey] ?? 0);
            const contribution = statApprovalContribution(statKey, value);
            if (contribution !== 0 || statDirectionSign(statKey) !== 0) {
                contributionSum += contribution;
                statCount++;
            }
        }

        if (statCount === 0) continue;

        const avgDelta = contributionSum / statCount;
        const oldApproval = ministry.minister_approval ?? 50;
        const newApproval = Math.round(Math.max(0, Math.min(100, oldApproval + avgDelta)) * 10) / 10;

        // Track embattled status
        let embattledSinceTick = ministry.embattled_since_tick;
        if (newApproval < GOV_APPROVAL_CONFIG.EMBATTLED_THRESHOLD) {
            if (embattledSinceTick === null || embattledSinceTick === undefined) {
                embattledSinceTick = currentTick;
            }
        } else {
            embattledSinceTick = null;
        }

        await supabase.from('ministries')
            .update({
                minister_approval: newApproval,
                embattled_since_tick: embattledSinceTick
            })
            .eq('id', ministry.id);

        results.push({
            ministry_key: ministry.ministry_key,
            old: oldApproval,
            new: newApproval,
            delta: Math.round(avgDelta * 10) / 10,
            embattled: embattledSinceTick !== null
        });
    }

    if (results.length > 0) {
        console.log(`[updateMinisterApprovals] ${nation.name}: ${results.map(r => `${r.ministry_key} ${r.old}→${r.new} (${r.delta >= 0 ? '+' : ''}${r.delta})`).join(', ')}`);
    }

    return results;
}

// ==================== LAYER 2: GOVERNMENT APPROVAL (COMPOSITE) ====================

/**
 * Apply a one-time event modifier to the government approval events component.
 * The events component decays 12% per tick, so transient shocks fade naturally.
 * Clamped to [-50, +50]. Writes an audit row to gov_approval_log.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {number} amount   - signed delta (positive = boost, negative = shock)
 * @param {string} source   - audit tag, e.g. 'crisis:government_shutdown'
 */
async function adjustGovernmentApprovalEvent(supabase, nationId, amount, source) {
    if (amount === 0) return;

    const { data: nation } = await supabase
        .from('nations')
        .select('gov_approval_events')
        .eq('id', nationId)
        .single();

    const current = Number(nation?.gov_approval_events ?? 0);
    const updated = Math.round(Math.max(-50, Math.min(50, current + amount)) * 100) / 100;

    await supabase.from('nations')
        .update({ gov_approval_events: updated })
        .eq('id', nationId);

    // Audit log
    const { data: shard } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    await supabase.from('gov_approval_log').insert({
        nation_id: nationId,
        amount,
        source: source || 'unknown',
        tick: shard?.current_tick || 0
    });

    console.log(`[GovApprovalEvent] ${amount > 0 ? '+' : ''}${amount} for nation ${nationId} — ${source}`);
}

/**
 * Calculate composite government approval from three components:
 *   45% — Institutional: minister approval avg + embattled penalties + vacancy penalty
 *   35% — Outcomes: weighted trend+absolute blend across key nation stats
 *   20% — Events: transient modifier (decays 12%/tick), fed by adjustGovernmentApprovalEvent()
 *
 * Stores the result in nations.gov_approval.
 * Caches component values in gov_approval_institutional, gov_approval_outcomes, gov_approval_events.
 * Triggers momentum feedback when gov approval shifts significantly.
 *
 * @param {object} supabase
 * @param {object} nation - nation row with current stat values
 * @param {number} currentTick
 * @returns {number|null} the computed government approval (0-100), or null if no government
 */
async function calculateGovernmentApprovalTick(supabase, nation, currentTick) {
    const cfg = GOV_APPROVAL_CONFIG;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, minister_approval, minister_first_name, embattled_since_tick')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return null;

    const filledMinistries = ministries.filter(m => m.minister_first_name);
    const vacantCount = ministries.length - filledMinistries.length;

    // ─── Component A (45%): Institutional — minister avg + embattled + vacancy ───
    let ministerSum = 0;
    let embattledPenalty = 0;

    for (const m of filledMinistries) {
        const approval = m.minister_approval ?? 50;
        ministerSum += approval;

        if (m.embattled_since_tick !== null && m.embattled_since_tick !== undefined && m.ministry_key !== 'prime_minister') {
            const ticksEmbattled = currentTick - m.embattled_since_tick;
            if (ticksEmbattled >= cfg.EMBATTLED_TICKS_REQUIRED) {
                if (approval < cfg.CRISIS_THRESHOLD) {
                    embattledPenalty += cfg.CRISIS_GOV_PENALTY;
                } else {
                    embattledPenalty += cfg.EMBATTLED_GOV_PENALTY;
                }
            }
        }
    }

    const ministerAvg = filledMinistries.length > 0 ? ministerSum / filledMinistries.length : 50;
    const vacancyPenalty = vacantCount * (cfg.VACANCY_PENALTY || -5);
    const institutional = Math.max(0, Math.min(100, ministerAvg + embattledPenalty + vacancyPenalty));

    // ─── Component B (35%): Outcomes — weighted trend+absolute blend ───
    const outcomeStatNames = cfg.OUTCOME_STATS.map(s => s.stat);
    const trends = await statTrendBatch(supabase, nation.id, outcomeStatNames, cfg.OUTCOME_TREND_LOOKBACK);

    let outcomesScore = 50; // neutral default
    let weightSum = 0;
    let blendedSum = 0;

    for (const entry of cfg.OUTCOME_STATS) {
        const rawVal = Number(nation[entry.stat] ?? 50);
        // Normalize absolute value to 0-100 quality scale (inverted stats: lower is better)
        const absQuality = entry.inverted ? (100 - rawVal) : rawVal;
        // Normalize trend: positive trend = good. For inverted stats, a negative raw trend is good.
        const rawTrend = trends[entry.stat] || 0;
        const trendSign = entry.inverted ? -rawTrend : rawTrend;
        // Map trend to 0-100 scale: clamp trend to [-5, +5] range then scale
        const trendQuality = Math.max(0, Math.min(100, 50 + trendSign * 10));

        const blended = absQuality * cfg.OUTCOME_ABSOLUTE_WEIGHT + trendQuality * cfg.OUTCOME_TREND_WEIGHT;
        blendedSum += blended * entry.weight;
        weightSum += entry.weight;
    }

    if (weightSum > 0) {
        outcomesScore = Math.max(0, Math.min(100, blendedSum / weightSum));
    }

    // ─── Component C (20%): Events — transient modifier, decayed before this call ───
    const eventsRaw = Number(nation.gov_approval_events ?? 0); // range: -50 to +50
    // Map [-50, +50] → [0, 100]
    const eventsComponent = Math.max(0, Math.min(100, 50 + eventsRaw));

    // ─── Composite ───
    const rawApproval = institutional * cfg.INSTITUTIONAL_WEIGHT
        + outcomesScore * cfg.OUTCOMES_WEIGHT
        + eventsComponent * cfg.EVENTS_WEIGHT;

    const govApproval = Math.round(Math.max(0, Math.min(100, rawApproval)));
    const prevGovApproval = Number(nation.gov_approval ?? 50);

    // Store all components + composite on the nation
    await supabase.from('nations')
        .update({
            gov_approval: govApproval,
            gov_approval_institutional: Math.round(institutional * 10) / 10,
            gov_approval_outcomes: Math.round(outcomesScore * 10) / 10,
            gov_approval_events: eventsRaw   // preserve raw value (already decayed)
        })
        .eq('id', nation.id);

    // Update in-memory nation object
    nation.gov_approval = govApproval;
    nation.gov_approval_institutional = institutional;
    nation.gov_approval_outcomes = outcomesScore;

    // ─── Momentum feedback: significant gov approval shifts affect party momentum ───
    const delta = govApproval - prevGovApproval;
    if (Math.abs(delta) > cfg.FEEDBACK_THRESHOLD) {
        const coalition = await fetchActiveCoalition(supabase, nation.id);
        const coalitionPartyIds = coalition?.party_ids || [];

        // Coalition parties gain/lose momentum proportional to approval shift
        for (const partyId of coalitionPartyIds) {
            const momDelta = Math.round(delta * cfg.FEEDBACK_COALITION_COEFF * 100) / 100;
            if (momDelta !== 0) {
                await adjustMomentumAll(supabase, nation.id, partyId, momDelta, 'gov_approval_shift');
            }
        }

        // Opposition benefits inversely (at reduced rate)
        const { data: oppParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .eq('is_npc', false);
        for (const opp of (oppParties || [])) {
            if (coalitionPartyIds.includes(opp.id)) continue;
            const momDelta = Math.round(-delta * cfg.FEEDBACK_OPPOSITION_COEFF * 100) / 100;
            if (momDelta !== 0) {
                await adjustMomentumAll(supabase, nation.id, opp.id, momDelta, 'gov_approval_shift');
            }
        }
    }

    console.log(`[GovApproval] ${nation.name}: ${govApproval} (inst=${Math.round(institutional)}, outcomes=${Math.round(outcomesScore)}, events=${Math.round(eventsComponent)}, vacancies=${vacantCount}, embattled=${embattledPenalty})`);

    return govApproval;
}

async function processOngoingCosts(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return { totalCost: 0, details: [] };

    let totalCost = 0;
    const details = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        if (!policy) continue;

        const baseCost = policy.ongoing_base_cost || policy.ongoing_cost_per_tick || 0;
        if (baseCost === 0) continue;

        let tickCost = baseCost;

        if (policy.ongoing_scaling_stat && nation[policy.ongoing_scaling_stat] !== undefined) {
            const scalingVal = Number(nation[policy.ongoing_scaling_stat]) || 1;
            const divisor = RAW_SCALING_DIVISORS[policy.ongoing_scaling_stat] || 50;
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

// All columns that nations_history tracks (must match the DB table schema)
const HISTORY_SNAPSHOT_COLUMNS = [
    ...NATION_STAT_COLUMNS,
    'gov_approval',
    'competition_voters', 'liberty_voters', 'security_voters', 'globalism_voters',
    'progressive_voters', 'liberal_voters', 'moderate_voters', 'conservative_voters', 'nationalist_voters'
];

async function snapshotNationHistory(supabase, nation, currentTick) {
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
async function recordStatHistory(supabase, nation, currentTick) {
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

async function processEvents(supabase, nation, currentTick) {
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
                const currentVal = nation[evtStatKey] !== undefined
                    ? Number(nation[evtStatKey]) : 50;
                const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
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
                    .eq('faction_type', 'party')
                    .eq('is_npc', false);

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
async function processCrises(supabase, nation, currentTick) {
    // 1. Load all active crisis templates
    const { data: crisisTemplates } = await supabase
        .from('crisis_templates')
        .select('*, crisis_triggers(*), crisis_effects(*), crisis_end_triggers(*)')
        .eq('is_active', true);

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

    // 3. Check inactive crises for activation
    for (const template of crisisTemplates) {
        if (activeMap[template.id]) continue; // already active
        if (template.id === GOVERNMENT_SHUTDOWN_CRISIS_ID) continue; // managed by dedicated shutdown code

        const triggers = template.crisis_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersMet = true;
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
                const currentVal = nationUpdates[statKey] !== undefined
                    ? nationUpdates[statKey]
                    : (nation[statKey] !== undefined && nation[statKey] !== null
                        ? Number(nation[statKey]) : 50);

                // Basic 0-100 clamp + 1dp rounding; floor/ceiling enforcement deferred to final pass
                let newVal = Math.round(Math.max(0, Math.min(100, currentVal + changePT)) * 10) / 10;
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
                const coalition = await fetchActiveCoalition(supabase, nation.id);
                const partyIds = coalition?.party_ids || [];
                for (const partyId of partyIds) {
                    await adjustMomentumAll(supabase, nation.id, partyId, changePT, 'crisis:' + template.name);
                    appliedEffects.push({
                        stat: 'momentum', change: changePT,
                        target: effect.target, faction_id: partyId
                    });
                }
                // Also push to gov approval events component
                await adjustGovernmentApprovalEvent(supabase, nation.id, changePT, 'crisis:' + template.name);

            } else if (effect.target === 'pm_approval') {
                const { data: pmMinistry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', 'prime_minister')
                    .eq('is_active', true)
                    .maybeSingle();

                if (pmMinistry) {
                    const currentVal = pmMinistry.minister_approval ?? 50;
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

                    // Cascade PM approval loss to party momentum (2x multiplier)
                    if (changePT < 0 && pmMinistry.party_id) {
                        const cascadeDelta = -(Math.abs(changePT) * 2);
                        await adjustMomentumAll(supabase, nation.id, pmMinistry.party_id, cascadeDelta, 'crisis:pm_cascade:' + template.name);

                        appliedEffects.push({
                            stat: 'momentum', change: cascadeDelta,
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
                    const currentVal = ministry.minister_approval ?? 50;
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

                    // Cascade minister approval loss to party momentum (2x for PM, 1x for others)
                    if (changePT < 0 && ministry.party_id) {
                        const loss = Math.abs(changePT);
                        const multiplier = effect.minister_key === 'prime_minister' ? 2 : 1;
                        const cascadeDelta = -(loss * multiplier);
                        await adjustMomentumAll(supabase, nation.id, ministry.party_id, cascadeDelta, 'crisis:minister_cascade:' + effect.minister_key);

                        appliedEffects.push({
                            stat: 'momentum', change: cascadeDelta,
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
        const endTriggers = template.crisis_end_triggers || [];
        let allEndConditionsMet = endTriggers.length > 0;

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

        if (allEndConditionsMet) {
            // Deactivate the crisis (effects already applied this final tick)
            await supabase.from('active_crises').delete().eq('id', activeRecord.id);
            delete activeMap[template.id];

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_RESOLVED: ' + template.name,
                description_used: 'The crisis "' + template.name + '" has been resolved.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });

            crisisEvents.push({
                type: 'crisis_resolved',
                crisisName: template.name,
                duration: currentTick - activeRecord.started_at_tick,
                tick: currentTick
            });

            console.log(`Crisis resolved: "${template.name}" in ${nation.name} (tick ${currentTick}, duration: ${currentTick - activeRecord.started_at_tick} ticks)`);
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


// ==================== DEMOCRATIC REVOLUTION ====================

/**
 * Process democratic revolution for autocracies.
 * Triggers when: stability < 15, freedom_index > 50, civil_unrest > 70 (Autocracy only).
 * Random 13-22 tick duration. Per-tick: stability -1, civil_unrest +1, intl_reputation -1.
 * Avertable if ANY trigger condition breaks. Fires regime change if duration expires.
 */
async function processRevolution(supabase, nation, currentTick) {
    // Only autocracies can have democratic revolutions
    if (!isAutocracy(nation)) {
        if (nation.revolution_started_tick != null) {
            await supabase.from('nations').update({ revolution_started_tick: null, revolution_duration: null }).eq('id', nation.id);
            nation.revolution_started_tick = null;
            nation.revolution_duration = null;
        }
        return null;
    }

    // Re-fetch nation to get post-effect stat values (processStatEffects etc. update DB but not in-memory)
    const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
    if (freshNation) Object.assign(nation, freshNation);

    // Check all trigger conditions
    const conditionsMet =
        Number(nation.stability) < 15 &&
        Number(nation.freedom_index) > 50 &&
        Number(nation.civil_unrest) > 70;

    const crisisActive = nation.revolution_started_tick != null;

    // Conditions NOT met — avert if active
    if (!conditionsMet) {
        if (crisisActive) {
            await supabase.from('nations').update({ revolution_started_tick: null, revolution_duration: null }).eq('id', nation.id);
            nation.revolution_started_tick = null;
            nation.revolution_duration = null;

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'REVOLUTION_AVERTED',
                description_used: 'The revolutionary movement has lost momentum. The regime has stabilized — for now.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });
            console.log(`[Revolution] AVERTED for ${nation.name} at tick ${currentTick}`);
        }
        return null;
    }

    // --- Conditions ARE met ---

    // Apply per-tick effects (stability -1, civil_unrest +1, intl_reputation -1)
    const newStability = Math.max(0, Math.round((Number(nation.stability) - 1) * 10) / 10);
    const newUnrest = Math.min(100, Math.round((Number(nation.civil_unrest) + 1) * 10) / 10);
    const newReputation = Math.max(0, Math.round((Number(nation.international_reputation) - 1) * 10) / 10);

    await supabase.from('nations').update({
        stability: newStability,
        civil_unrest: newUnrest,
        international_reputation: newReputation
    }).eq('id', nation.id);
    Object.assign(nation, { stability: newStability, civil_unrest: newUnrest, international_reputation: newReputation });

    // START new crisis
    if (!crisisActive) {
        const duration = Math.floor(Math.random() * 10) + 13; // 13-22 ticks
        await supabase.from('nations').update({
            revolution_started_tick: currentTick,
            revolution_duration: duration
        }).eq('id', nation.id);
        nation.revolution_started_tick = currentTick;
        nation.revolution_duration = duration;

        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'REVOLUTION_WARNING',
            description_used: 'Pro-democracy demonstrations have erupted across multiple cities. Opposition groups are calling for free elections. The regime must act to restore order — or face revolution.',
            category: 'crisis',
            effects_applied: [
                { stat: 'stability', change: -1, target: 'nation' },
                { stat: 'civil_unrest', change: 1, target: 'nation' },
                { stat: 'international_reputation', change: -1, target: 'nation' }
            ],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] WARNING — crisis started for ${nation.name}, duration ${duration} ticks`);
        return { phase: 'warning', nation: nation.name, tick: currentTick, duration };
    }

    // ONGOING crisis — check if duration expired
    const ticksElapsed = currentTick - nation.revolution_started_tick;
    const duration = Number(nation.revolution_duration);

    if (ticksElapsed < duration) {
        // Not yet expired — log escalation
        const remaining = duration - ticksElapsed;
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'REVOLUTION_ESCALATION',
            description_used: `The revolutionary movement grows stronger. General strikes have paralyzed the capital. International observers are calling for dialogue. ${remaining} tick${remaining !== 1 ? 's' : ''} remain before the regime falls.`,
            category: 'crisis',
            effects_applied: [
                { stat: 'stability', change: -1, target: 'nation' },
                { stat: 'civil_unrest', change: 1, target: 'nation' },
                { stat: 'international_reputation', change: -1, target: 'nation' }
            ],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] ESCALATION — ${nation.name}, ${remaining} ticks remaining`);
        return { phase: 'escalation', nation: nation.name, tick: currentTick, remaining };
    }

    // === REVOLUTION FIRES ===
    console.log(`[Revolution] REVOLUTION FIRES for ${nation.name} at tick ${currentTick}`);

    // 1. Pick new government type randomly
    const newGovType = Math.random() < 0.5 ? CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY : CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC;
    const govLabel = newGovType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC ? 'Presidential Democracy' : 'Parliamentary Democracy';

    // 2. Close current administration and dissolve government/ministries
    try {
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        await closeAdministration(supabase, nation.id, nation, 'revolution', currentTick, shardData?.current_date || '', null);
    } catch (err) {
        console.warn('[Revolution] Could not close administration:', err);
    }
    try {
        await dissolveCoalition(supabase, nation.id);
    } catch (err) {
        console.warn('[Revolution] Could not dissolve coalition:', err);
    }

    // 3. Update nation stats
    const newFreedomIndex = Math.min(100, Math.round((Number(nation.freedom_index) + 15) * 10) / 10);
    const newIntlRep = Math.min(100, Math.round((Number(nation.international_reputation) + 5) * 10) / 10);
    const nationUpdates = {
        government_type: newGovType,
        ruling_faction_id: null,
        stability: 30,
        freedom_index: newFreedomIndex,
        civil_unrest: 40,
        international_reputation: newIntlRep,
        revolution_started_tick: null,
        revolution_duration: null
    };
    await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    Object.assign(nation, nationUpdates);

    // 3b. Clear all active crises — revolution resets the political landscape
    await supabase.from('active_crises').delete().eq('nation_id', nation.id);

    // 4. Reset all faction bloc approvals to 50
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (allFactions && allFactions.length > 0) {
        for (const faction of allFactions) {
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: 50, momentum: 0 })
                .eq('faction_id', faction.id);
            await recalcDerivedApproval(supabase, faction.id);
        }
    }

    // 4b. Reset all faction loyalty to 50
    await supabase.from('factions')
        .update({ loyalty: 50 })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // 5. Flag factions for rebuild
    await supabase.from('factions')
        .update({ needs_rebuild: true })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // 5b. Freeze all active bills — government has fallen
    await supabase.from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor']);

    // 6. Schedule emergency election in 3 ticks
    await supabase.from('elections').delete()
        .eq('nation_id', nation.id).eq('status', 'scheduled');

    const electionType = newGovType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC ? 'presidential' : 'parliamentary';
    const { error: electionErr } = await supabase.from('elections').insert({
        nation_id: nation.id,
        election_tick: currentTick + 3,
        status: 'scheduled',
        election_type: electionType
    });
    if (electionErr) {
        console.error('[Revolution] Election insert failed, retrying:', electionErr);
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 3,
            status: 'scheduled',
            election_type: electionType
        });
    }

    // 7. Log the revolution event
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'DEMOCRATIC_REVOLUTION',
        description_used: `The people have risen. The autocratic regime has fallen. A ${govLabel} has been established — emergency elections will determine the first freely elected government.`,
        category: 'crisis',
        effects_applied: [
            { stat: 'government_type', change: `Autocracy → ${govLabel}`, target: 'nation' },
            { stat: 'stability', change: '→ 30', target: 'nation' },
            { stat: 'freedom_index', change: '+15', target: 'nation' },
            { stat: 'civil_unrest', change: '→ 40', target: 'nation' },
            { stat: 'international_reputation', change: '+5', target: 'nation' }
        ],
        fired_at_tick: currentTick
    });

    console.log(`[Revolution] COMPLETE — ${nation.name} is now a ${govLabel}. Emergency ${electionType} election at tick ${currentTick + 3}`);
    return { phase: 'revolution', nation: nation.name, tick: currentTick, newGovType: govLabel, electionTick: currentTick + 3 };
}


// ==================== MINISTRY INBOX EVENTS ====================

/**
 * Process ministry inbox events from templates.
 * For each nation:
 *  - Loads active ministry_event_templates
 *  - Filters by government type and active ministries
 *  - Checks cooldowns against previously fired inbox events
 *  - Evaluates weight conditions against nation stats
 *  - Rolls probability (boosted when weight conditions are met)
 *  - Creates ministry_events rows with randomly selected variants
 *  - Also expires overdue active ministry events
 */
async function processMinistryInboxEvents(supabase, nation, currentTick) {
    const firedEvents = [];
    const dbg = (msg) => console.log(`[MinistryEvents][${nation.name}][tick ${currentTick}] ${msg}`);

    // --- 1. Expire overdue active ministry events ---
    const { data: overdueEvents } = await supabase
        .from('ministry_events')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'active')
        .lt('expires_at_tick', currentTick);

    if (overdueEvents && overdueEvents.length > 0) {
        const overdueIds = overdueEvents.map(e => e.id);
        await supabase.from('ministry_events')
            .update({ status: 'expired' })
            .in('id', overdueIds);
    }

    // --- 2. Load all active templates ---
    const { data: templates, error: templateError } = await supabase
        .from('ministry_event_templates')
        .select('*')
        .eq('is_active', true);

    if (templateError) {
        dbg(`BLOCKED: failed to load ministry_event_templates: ${templateError.message}`);
        return firedEvents;
    }

    if (!templates || templates.length === 0) {
        dbg('BLOCKED: No active ministry_event_templates found in DB.');
        return firedEvents;
    }
    dbg(`Loaded ${templates.length} active template(s): [${templates.map(t => t.event_key).join(', ')}]`);

    // --- 3. Filter by government type ---
    const govTypeRaw = nation.government_type || '';
    const govType = getCanonicalGovernmentType(nation);
    const eligible = templates.filter(t => (t.gov_types || []).includes(govType));
    if (eligible.length === 0) {
        dbg(`BLOCKED: 0/${templates.length} templates match gov_type raw="${govTypeRaw}" canonical="${govType}". Template gov_types: ${templates.map(t => {
            const matchInfo = templateSupportsNationGovType(t.gov_types, govTypeRaw);
            return `${t.event_key}=raw:${JSON.stringify(matchInfo.templateGovTypesRaw)} canonical:${JSON.stringify(matchInfo.templateGovTypesCanonical)}`;
        }).join(', ')}. Canonical source of truth: ${JSON.stringify(canonicalNationGovTypes)}.`);
        return firedEvents;
    }
    dbg(`${eligible.length}/${templates.length} template(s) match gov_type raw="${govTypeRaw}" canonical="${govType}": [${eligible.map(t => t.event_key).join(', ')}]`);

    // --- 4. Load active ministries for this nation ---
    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) {
        dbg('BLOCKED: No active ministries found for this nation.');
        return firedEvents;
    }
    dbg(`Active ministries: [${ministries.map(m => `${m.ministry_key}(party=${m.party_id})`).join(', ')}]`);

    // For Presidential nations with pending-confirmation ministers, party_id may be null.
    // Fall back to the PM/President's faction so events can still fire.
    let fallbackFactionId = null;
    if (govType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC) {
        const { data: president } = await supabase
            .from('presidents')
            .select('party_id')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .maybeSingle();
        fallbackFactionId = president?.party_id || null;
    }

    const ministryMap = {};
    for (const m of ministries) {
        ministryMap[m.ministry_key] = m.party_id || fallbackFactionId;
    }
    dbg(`Ministry map: ${JSON.stringify(ministryMap)}`);

    // --- 5. Check cooldowns: find last fired tick for each template ---
    const templateIds = eligible.map(t => t.id);
    const { data: recentEvents } = await supabase
        .from('ministry_events')
        .select('template_id, created_at_tick')
        .eq('nation_id', nation.id)
        .in('template_id', templateIds)
        .order('created_at_tick', { ascending: false });

    const lastFiredMap = {};
    for (const entry of (recentEvents || [])) {
        if (entry.template_id && !lastFiredMap[entry.template_id]) {
            lastFiredMap[entry.template_id] = entry.created_at_tick;
        }
    }

    // --- 6. Also check how many active (unresolved) events already exist per ministry ---
    const { data: activeEvents } = await supabase
        .from('ministry_events')
        .select('ministry_key')
        .eq('nation_id', nation.id)
        .eq('status', 'active');

    const activeCountByMinistry = {};
    for (const ae of (activeEvents || [])) {
        activeCountByMinistry[ae.ministry_key] = (activeCountByMinistry[ae.ministry_key] || 0) + 1;
    }

    // --- 7. Process each eligible template ---
    dbg(`Processing ${eligible.length} eligible template(s)…`);
    for (const tmpl of eligible) {
        const tKey = tmpl.event_key;

        // Skip if this ministry doesn't exist or isn't staffed
        const controllingFactionId = ministryMap[tmpl.ministry_key];
        if (!controllingFactionId) {
            dbg(`  [${tKey}] SKIP: ministry "${tmpl.ministry_key}" not in ministryMap or has null faction. Map keys: [${Object.keys(ministryMap).join(', ')}]`);
            continue;
        }

        // Skip if ministry already has 3+ active events (prevent inbox flood)
        const activeCount = activeCountByMinistry[tmpl.ministry_key] || 0;
        if (activeCount >= 3) {
            dbg(`  [${tKey}] SKIP: ministry "${tmpl.ministry_key}" already has ${activeCount} active events (max 3).`);
            continue;
        }

        // Check cooldown
        const lastFired = lastFiredMap[tmpl.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < (tmpl.cooldown_ticks || 6)) {
                dbg(`  [${tKey}] SKIP: cooldown — last fired tick ${lastFired}, ${ticksSince} ticks ago, need ${tmpl.cooldown_ticks || 6}.`);
                continue;
            }
        }

        // --- 8. Evaluate weight conditions ---
        const variants = tmpl.variants || {};
        const weightConditions = variants.weight_conditions || [];

        // Fall back to old flat columns if no array conditions
        if (weightConditions.length === 0 && tmpl.weight_stat) {
            weightConditions.push({
                stat: tmpl.weight_stat,
                op: tmpl.weight_operator || '>',
                value: tmpl.weight_value
            });
        }

        let allConditionsMet = true;
        if (weightConditions.length > 0) {
            for (const cond of weightConditions) {
                const statVal = nation[cond.stat];
                if (statVal === null || statVal === undefined) {
                    dbg(`  [${tKey}] Weight cond: nation.${cond.stat} is ${statVal} (missing!) — condition FAILED`);
                    allConditionsMet = false;
                    break;
                }
                const val = Number(statVal);
                const threshold = Number(cond.value);
                const passed = (cond.op === '>' && val > threshold) ||
                               (cond.op === '<' && val < threshold) ||
                               (cond.op === '>=' && val >= threshold) ||
                               (cond.op === '<=' && val <= threshold);
                dbg(`  [${tKey}] Weight cond: nation.${cond.stat}=${val} ${cond.op} ${threshold} → ${passed ? 'PASS' : 'FAIL'}`);
                if (!passed) { allConditionsMet = false; break; }
            }
        }

        // --- 9. Probability roll ---
        // Base chance: 25% per tick if conditions met, 5% if not
        // (Events with no conditions always use base 25%)
        let fireProbability;
        if (weightConditions.length === 0) {
            fireProbability = 25;
        } else if (allConditionsMet) {
            fireProbability = 40;
        } else {
            fireProbability = 5;
        }

        const roll = Math.random() * 100;
        dbg(`  [${tKey}] Probability: ${fireProbability}% (conditions=${weightConditions.length}, met=${allConditionsMet}), roll=${roll.toFixed(1)} → ${roll < fireProbability ? 'FIRE!' : 'SKIP (bad roll)'}`);
        if (roll >= fireProbability) continue;

        // --- 10. Pick random variants ---
        const titles = variants.titles || [tmpl.title];
        const chosenTitle = titles[Math.floor(Math.random() * titles.length)] || tmpl.title;

        const govVariant = variants[govTypeCanonical] || {};
        const bodies = govVariant.bodies || [];
        const chosenBody = bodies.length > 0
            ? bodies[Math.floor(Math.random() * bodies.length)]
            : '';

        const options = govVariant.options || [];

        // --- 11. Insert into ministry_events ---
        const expiresAtTick = currentTick + (tmpl.deadline_ticks || 3);

        const { error } = await supabase.from('ministry_events').insert({
            nation_id: nation.id,
            ministry_key: tmpl.ministry_key,
            controlling_faction_id: controllingFactionId,
            template_id: tmpl.id,
            event_key: tmpl.event_key,
            title: chosenTitle,
            sender: tmpl.sender || 'Ministry Office',
            body: chosenBody,
            priority: tmpl.priority || 'routine',
            status: 'active',
            created_at_tick: currentTick,
            expires_at_tick: expiresAtTick,
            options: options,
            chosen_option: null,
            resolved_effects: null,
            resolved_at_tick: null
        });

        if (error) {
            dbg(`  [${tKey}] ERROR inserting ministry_event: ${error.message}`);
        } else {
            // Update active count to prevent flooding within same tick
            activeCountByMinistry[tmpl.ministry_key] = (activeCountByMinistry[tmpl.ministry_key] || 0) + 1;

            firedEvents.push({
                templateKey: tmpl.event_key,
                title: chosenTitle,
                ministry: tmpl.ministry_key,
                conditionsMet: allConditionsMet
            });

            dbg(`  [${tKey}] ✓ FIRED: "${chosenTitle}" → ${tmpl.ministry_key}`);
        }
    }

    dbg(`Done. Fired ${firedEvents.length} event(s) this tick.`);
    return firedEvents;
}


// ==================== INACTIVITY CLOCK ====================

async function markFactionActive(supabase, factionId, currentTick) {
    if (!factionId) return;
    if (!currentTick) {
        const { data: shard } = await supabase
            .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        currentTick = shard?.current_tick || 0;
    }
    await supabase.from('factions')
        .update({ last_ap_spent_tick: currentTick })
        .eq('id', factionId);
}

/**
 * Inactivity decay — penalises factions that haven't spent AP in a while.
 * Called once per nation during tick processing.
 *
 * Timeline:
 *   0 – GRACE ticks:   no penalty
 *   GRACE – DISBAND:   -10% voter bloc preference + -7 momentum per tick
 *   > DISBAND:         auto-disband (removed from nation)
 */
async function processInactivityDecay(supabase, nationId, currentTick) {
    const {
        INACTIVITY_GRACE_TICKS,
        INACTIVITY_PREFERENCE_DECAY_PCT,
        INACTIVITY_MOMENTUM_DECAY,
        INACTIVITY_DISBAND_THRESHOLD
    } = GAME_CONFIG;

    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, nation_id, last_ap_spent_tick, founded_tick, disband_cooldown_until_tick')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .eq('is_npc', false);

    if (!factions || factions.length === 0) return [];

    // Load nation for ruling faction guard (ruling faction in autocracy cannot be auto-disbanded)
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id, government_type')
        .eq('id', nationId)
        .single();

    const results = [];

    for (const faction of factions) {
        const lastActive = faction.last_ap_spent_tick ?? faction.founded_tick ?? 0;
        const ticksInactive = currentTick - lastActive;

        if (ticksInactive <= INACTIVITY_GRACE_TICKS) continue;

        const entry = {
            factionId: faction.id,
            factionName: faction.faction_name,
            ticksInactive,
            preferenceLost: 0,
            momentumLost: 0,
            blocsAffected: 0,
            disbanded: false
        };

        // Auto-disband check (skip ruling faction in autocracy)
        if (ticksInactive > INACTIVITY_DISBAND_THRESHOLD) {
            const isRulingFaction = isAutocracy(nation) && nation.ruling_faction_id === faction.id;
            if (!isRulingFaction) {
                // Remove from nation
                const { error: disbandErr } = await supabase
                    .from('factions')
                    .update({
                        nation_id: null,
                        abandoned_at: new Date().toISOString(),
                        disband_cooldown_until_tick: currentTick + 24
                    })
                    .eq('id', faction.id);

                if (!disbandErr) {
                    // Remove from coalition if applicable
                    const { data: formations } = await supabase
                        .from('government_formations')
                        .select('id, lead_party_id, party_ids')
                        .eq('nation_id', nationId)
                        .in('status', ['formed', 'caretaker']);

                    const myFormation = (formations || []).find(f =>
                        (f.party_ids || []).includes(faction.id)
                    );
                    if (myFormation) {
                        if (myFormation.lead_party_id === faction.id) {
                            await dissolveCoalition(supabase, nationId);
                        } else {
                            const newPartyIds = (myFormation.party_ids || []).filter(id => id !== faction.id);
                            await supabase.from('government_formations')
                                .update({ party_ids: newPartyIds })
                                .eq('id', myFormation.id);
                            await supabase.from('ministries')
                                .update({ party_id: null, minister_first_name: null, minister_last_name: null, minister_age: null })
                                .eq('nation_id', nationId)
                                .eq('party_id', faction.id)
                                .eq('is_active', true);
                        }
                    }

                    // Resign PM if this faction holds it
                    const { data: hog } = await supabase
                        .from('head_of_government')
                        .select('id')
                        .eq('nation_id', nationId)
                        .eq('faction_id', faction.id)
                        .eq('active', true)
                        .maybeSingle();
                    if (hog) {
                        await resignPM(supabase, nationId, faction.id, currentTick);
                    }

                    // Audit log
                    await supabase.from('campaign_actions').insert({
                        party_id: faction.id,
                        nation_id: nationId,
                        action_type: 'auto_disbanded_inactivity',
                        tick_performed: currentTick,
                        result: { faction_name: faction.faction_name, ticks_inactive: ticksInactive }
                    });

                    entry.disbanded = true;
                    console.log(`[inactivityDecay] Auto-disbanded "${faction.faction_name}" after ${ticksInactive} ticks inactive`);
                }
                results.push(entry);
                continue;
            }
        }

        // Decay voter bloc preference (-10%) and momentum (-7) for this faction
        const { data: blocRows } = await supabase
            .from('faction_bloc_approval')
            .select('id, preference_score, momentum')
            .eq('faction_id', faction.id);

        if (blocRows && blocRows.length > 0) {
            let totalPrefLost = 0;
            for (const row of blocRows) {
                const oldPref = Number(row.preference_score ?? 0);
                const prefLoss = Math.round(oldPref * INACTIVITY_PREFERENCE_DECAY_PCT * 100) / 100;
                const newPref = Math.round((oldPref - prefLoss) * 100) / 100;

                const oldMomentum = Number(row.momentum ?? 0);
                const newMomentum = Math.round((oldMomentum - INACTIVITY_MOMENTUM_DECAY) * 100) / 100;

                await supabase.from('faction_bloc_approval')
                    .update({ preference_score: newPref, momentum: newMomentum })
                    .eq('id', row.id);

                totalPrefLost += prefLoss;
            }
            entry.preferenceLost = Math.round((totalPrefLost / blocRows.length) * 100) / 100;
            entry.momentumLost = INACTIVITY_MOMENTUM_DECAY;
            entry.blocsAffected = blocRows.length;
        }

        // Recalculate derived approval_rating from updated preferences
        await recalcDerivedApproval(supabase, faction.id);

        if (entry.preferenceLost > 0 || entry.momentumLost > 0) {
            console.log(`[inactivityDecay] "${faction.faction_name}": ${ticksInactive} ticks idle → -${entry.preferenceLost} avg preference, -${entry.momentumLost} momentum across ${entry.blocsAffected} blocs`);
            results.push(entry);
        }
    }

    return results;
}


// ==================== UTILITY FORMATTERS ====================

function formatStatName(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}

function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}


// ==================== PM CANDIDATE SYSTEM ====================

const PM_FIRST_NAMES = [
    'Alejandro', 'Camila', 'Diego', 'Valentina', 'Mateo', 'Isabela', 'Sebastián', 'Luca',
    'Andrés', 'Gabriel', 'Joaquín', 'Mariana', 'Carlos', 'Tomas', 'Rafael', 'Edwin',
    'Emilio', 'Catalina', 'Fernando', 'Renata'
];

const PM_LAST_NAMES = [
    'Velasco', 'Mendoza', 'Guerrero', 'Salazar', 'Castillo', 'Herrera', 'Morales', 'Ríos',
    'Delgado', 'Espinoza', 'Guzmán', 'Navarro', 'Córdoba', 'Echeverría', 'Pacheco', 'Montero',
    'Aguilar', 'Valenzuela', 'Carrasco', 'Ibarra'
];

const IDEOLOGY_OPTIONS = [
    { tag: 'LIBERTY',         axisKey: 'liberty_equality',             direction: -1 },
    { tag: 'EQUALITY',        axisKey: 'liberty_equality',             direction: 1 },
    { tag: 'TRADITION',       axisKey: 'tradition_progress',           direction: -1 },
    { tag: 'PROGRESS',        axisKey: 'tradition_progress',           direction: 1 },
    { tag: 'SECURITY',        axisKey: 'security_freedom',             direction: -1 },
    { tag: 'FREEDOM',         axisKey: 'security_freedom',             direction: 1 },
    { tag: 'NATIONALISM',     axisKey: 'globalism_nationalism',        direction: -1 },
    { tag: 'GLOBALISM',       axisKey: 'globalism_nationalism',        direction: 1 },
    { tag: 'INDIVIDUALISM',   axisKey: 'individualism_collectivism',   direction: -1 },
    { tag: 'COLLECTIVISM',    axisKey: 'individualism_collectivism',   direction: 1 }
];

const PM_TRAIT_KEYS = [
    'dealmaker', 'showman', 'ideologue', 'economist', 'reformer',
    'iron_will', 'popular_champion', 'militarist', 'diplomat',
    'media_darling', 'hardliner', 'technocrat', 'survivor', 'firebrand'
];

async function generatePMCandidates(supabase, nationId, factionId, currentTick) {
    const factionIdeology = await loadFactionIdeology(supabase, factionId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16);
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating PM candidates:', error);
        throw error;
    }

    console.log(`Generated 3 PM candidates for faction ${factionId}`);
    return data;
}

function getWeightedIdeologies(factionIdeology) {
    if (!factionIdeology) {
        return IDEOLOGY_OPTIONS.map(opt => ({ item: opt, weight: 10 }));
    }

    return IDEOLOGY_OPTIONS.map(opt => {
        const score = factionIdeology[opt.axisKey] || 0;
        const alignment = score * opt.direction;

        let weight;
        if (alignment > 40) {
            weight = 2;
        } else if (alignment > 15) {
            weight = 5;
        } else if (alignment > -15) {
            weight = 12;
        } else if (alignment > -40) {
            weight = 10;
        } else {
            weight = 8;
        }

        return { item: opt, weight };
    });
}

function weightedRandomPick(weightedItems) {
    const totalWeight = weightedItems.reduce((sum, wi) => sum + wi.weight, 0);
    let random = Math.random() * totalWeight;

    for (const wi of weightedItems) {
        random -= wi.weight;
        if (random <= 0) return wi;
    }
    return weightedItems[weightedItems.length - 1];
}

async function selectPMCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    await supabase
        .from('pm_candidates')
        .update({ selected: true })
        .eq('id', candidateId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);

    const { error: hogErr } = await supabase
        .from('head_of_government')
        .upsert({
            nation_id: nationId,
            faction_id: factionId,
            candidate_id: candidateId,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            age: candidate.age,
            ideology: candidate.ideology,
            trait_key: candidate.trait_key,
            appointed_tick: currentTick,
            active: true
        }, { onConflict: 'nation_id' });

    if (hogErr) throw hogErr;

    // Update the open administration record with the newly appointed PM
    const pmFullName = `${candidate.first_name} ${candidate.last_name}`;
    const { error: adminUpdErr } = await supabase
        .from('administrations')
        .update({
            prime_minister: pmFullName,
            admin_name: `${candidate.last_name} Administration`,
            updated_at: new Date().toISOString()
        })
        .eq('nation_id', nationId)
        .is('ended_at_tick', null);
    if (adminUpdErr) console.warn('selectPMCandidate: could not update administration record:', adminUpdErr);

    // Update the prime_minister ministry row so ministry-actions picks it up
    const { data: pmMinistry } = await supabase.from('ministries')
        .select('id').eq('nation_id', nationId)
        .eq('ministry_key', 'prime_minister').eq('is_active', true)
        .maybeSingle();

    if (pmMinistry) {
        await supabase.from('ministries').update({
            party_id: factionId,
            minister_first_name: candidate.first_name,
            minister_last_name: candidate.last_name,
            minister_age: candidate.age,
            minister_approval: 50
        }).eq('id', pmMinistry.id);
    } else {
        await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: 'prime_minister',
            ministry_name: 'Prime Minister',
            is_active: true,
            party_id: factionId,
            minister_first_name: candidate.first_name,
            minister_last_name: candidate.last_name,
            minister_age: candidate.age,
            minister_approval: 50
        });
    }

    const axisKey = candidate.ideology_axis;
    const shift = 15 * candidate.ideology_direction;

    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (!factionIdeology) {
        const newRow = { faction_id: factionId, liberty_equality: 0, tradition_progress: 0, security_freedom: 0, globalism_nationalism: 0, individualism_collectivism: 0 };
        await supabase.from('faction_ideology').upsert(newRow, { onConflict: 'faction_id' });
        factionIdeology = newRow;
        console.warn(`Created missing faction_ideology row for faction ${factionId}`);
    }
    const currentVal = factionIdeology[axisKey] || 0;
    const newVal = Math.max(-100, Math.min(100, currentVal + shift));

    await supabase
        .from('faction_ideology')
        .update({ [axisKey]: newVal })
        .eq('faction_id', factionId);

    console.log(`Ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);


    const { data: trait } = await supabase
        .from('leader_traits')
        .select('*')
        .eq('trait_key', candidate.trait_key)
        .single();

    if (trait?.effects) {
        const effects = trait.effects;

        if (effects.on_appoint_stability) {
            const { data: nation } = await supabase
                .from('nations')
                .select('stability')
                .eq('id', nationId)
                .single();

            if (nation) {
                const newStability = Math.max(0, Math.min(100, (nation.stability || 50) + effects.on_appoint_stability));
                await supabase
                    .from('nations')
                    .update({ stability: newStability })
                    .eq('id', nationId);

                console.log(`On-appoint stability: +${effects.on_appoint_stability} → ${newStability}`);
            }
        }

    }

    console.log(`PM selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key})`);
    return candidate;
}

async function processPMTraitEffects(supabase, nation, currentTick) {
    let effects, factionId;

    if (isPresidentialRepublic(nation)) {
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
        await adjustMomentumAll(supabase, nation.id, factionId, effects.party_approval_per_tick, 'pm_trait:party_approval');
    }

    if (effects.nation_stat_per_tick) {
        const updates = {};
        for (const [rawStat, delta] of Object.entries(effects.nation_stat_per_tick)) {
            const stat = normalizeNationStatKey(rawStat);
            if (!stat || !NATION_STAT_COLUMN_SET.has(stat)) {
                console.warn(`[processPMTraitEffects] Skipping invalid stat_key "${rawStat}" in PM trait for ${nation.name}`);
                continue;
            }
            const currentVal = nation[stat];
            if (currentVal !== undefined && currentVal !== null) {
                updates[stat] = Math.round(Math.max(0, Math.min(100, currentVal + delta)) * 10) / 10;
            }
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }

    if (effects.approval_below_50_bonus || effects.approval_above_60_penalty) {
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();

        if (faction) {
            let delta = 0;
            if (faction.approval_rating < 50 && effects.approval_below_50_bonus) {
                delta = effects.approval_below_50_bonus;
            } else if (faction.approval_rating > 60 && effects.approval_above_60_penalty) {
                delta = effects.approval_above_60_penalty;
            }
            if (delta !== 0) {
                await adjustMomentumAll(supabase, nation.id, factionId, delta, 'pm_trait:conditional');
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
            await adjustMomentumAll(supabase, nation.id, opp.id, effects.opposition_approval_per_tick, 'pm_trait:opposition');
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
            await adjustMomentumAll(supabase, nation.id, factionId, effects.no_bill_penalty_per_tick, 'pm_trait:no_bill_penalty');
        }
    }
}


// ==================== RESIGN PM ====================

async function resignPM(supabase, nationId, factionId, currentTick) {
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

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('id', hog.id);

    await adjustMomentumAll(supabase, nationId, factionId, -5, 'pm:resignation');

    const { data: nation } = await supabase
        .from('nations')
        .select('stability')
        .eq('id', nationId)
        .single();

    if (nation) {
        const newStability = Math.max(0, (nation.stability ?? 50) - 3);
        await supabase
            .from('nations')
            .update({ stability: newStability })
            .eq('id', nationId);
    }

    await supabase
        .from('factions')
        .update({ pm_cooldown_until: currentTick + 12 })
        .eq('id', factionId);

    if (hog.trait_key === 'iron_will') {
        console.log('Iron Will resignation — coalition collapses');
        try {
            const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
            const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            if (fullNation) {
                await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
            }
        } catch (adminErr) { console.warn('Could not close administration on iron_will collapse:', adminErr); }
        await dissolveCoalition(supabase, nationId);
        return { result: 'coalition_collapsed', reason: 'iron_will' };
    }

    const { data: govFormation } = await supabase
        .from('government_formations')
        .select('party_ids')
        .eq('nation_id', nationId)
        .eq('status', 'formed')
        .single();

    if (govFormation) {
        const partnerIds = (govFormation.party_ids || [])
            .filter(pid => pid !== factionId);

        const { data: partners } = await supabase
            .from('factions')
            .select('id, faction_name, seats, pm_cooldown_until')
            .in('id', partnerIds)
            .order('seats', { ascending: false });

        const eligible = (partners || []).find(p =>
            !p.pm_cooldown_until || p.pm_cooldown_until <= currentTick
        );

        if (eligible) {
            await generatePMCandidates(supabase, nationId, eligible.id, currentTick);
            console.log(`PM offered to ${eligible.faction_name}`);
            return {
                result: 'pm_offered',
                newPmPartyId: eligible.id,
                newPmPartyName: eligible.faction_name
            };
        }
    }

    console.log('No eligible partner — coalition collapsed');
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
        const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on coalition collapse:', adminErr); }
    await dissolveCoalition(supabase, nationId);
    return { result: 'coalition_collapsed', reason: 'no_eligible_partner' };
}


// ==================== DISBAND PARTY ====================

async function disbandParty(supabase, nationId, factionId, currentTick) {
    // 1. Cooldown check
    const { data: faction } = await supabase
        .from('factions')
        .select('disband_cooldown_until_tick, faction_name')
        .eq('id', factionId)
        .single();

    if (faction?.disband_cooldown_until_tick && faction.disband_cooldown_until_tick > currentTick) {
        const remaining = faction.disband_cooldown_until_tick - currentTick;
        throw new Error(`Disband is on cooldown for ${remaining} more tick${remaining !== 1 ? 's' : ''}.`);
    }

    // 2. Autocracy ruling faction guard
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id, government_type')
        .eq('id', nationId)
        .single();

    if (isAutocracy(nation) && nation.ruling_faction_id === factionId) {
        throw new Error('The ruling faction cannot disband.');
    }

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

    // 4. Coalition check — handle if in coalition but not PM (or PM resignation didn't dissolve)
    if (!pmResigned) {
        const { data: formations } = await supabase
            .from('government_formations')
            .select('id, lead_party_id, party_ids')
            .eq('nation_id', nationId)
            .in('status', ['formed', 'caretaker']);

        const myFormation = (formations || []).find(f =>
            (f.party_ids || []).includes(factionId)
        );

        if (myFormation) {
            if (myFormation.lead_party_id === factionId) {
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
                    .update({ party_id: null, minister_first_name: null, minister_last_name: null, minister_age: null })
                    .eq('nation_id', nationId)
                    .eq('party_id', factionId)
                    .eq('is_active', true);
                if (minErr) console.warn('disbandParty: could not vacate ministries:', minErr);
            }
        }
    }

    // 5. Core disband — null out nation membership, set cooldown
    const { error: disbandErr } = await supabase
        .from('factions')
        .update({
            nation_id: null,
            abandoned_at: new Date().toISOString(),
            disband_cooldown_until_tick: currentTick + 24
        })
        .eq('id', factionId);

    if (disbandErr) throw new Error('Failed to disband party: ' + disbandErr.message);

    // 6. Audit log
    const { error: logErr } = await supabase
        .from('campaign_actions')
        .insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'party_disbanded',
            tick_performed: currentTick,
            result: { faction_name: faction?.faction_name || 'Unknown' }
        });
    if (logErr) console.warn('disbandParty: could not log action:', logErr);

    return { result: 'disbanded' };
}


// ==================== ELECTION SIMULATION ====================

/**
 * Get a party's alignment score toward a specific ideology tag.
 *
 * @param {object} partyAxes  - Row from faction_ideology (keys: liberty_equality, tradition_progress, etc.)
 * @param {string} tag        - Ideology tag (e.g. "PROGRESS", "Liberty") — case-insensitive
 * @returns {number} Alignment value: positive = supports, negative = opposes
 */
function getPartyAlignment(partyAxes, tag) {
    const info = IDEOLOGY_TO_AXIS[tag.toUpperCase()];
    if (!info) return 0;
    const axisValue = partyAxes[info.axisKey] ?? 0;
    return axisValue * info.direction;
}

// findEligibleParties removed — replaced by weighted competition model
// where ALL parties compete simultaneously for each bloc's voters.

/**
 * Distribute a voter bloc's votes among ALL parties using the Weighted Competition Model.
 *
 * weight = bloc_approval × ideology_multiplier
 * ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * No cascade steps. No leakage. All parties compete simultaneously.
 *
 * @param {object[]} parties           - All parties with axes
 * @param {string[]} tags              - Bloc ideology tags (may be empty for Unaligned)
 * @param {number}   blocCount         - Voters in this bloc
 * @param {object}   tally             - Mutable { [partyId]: voteCount } accumulator
 * @param {object}   [blocApprovals]   - { partyId: approval } per-bloc approval map
 * @param {object}   [ideologySaturation] - { tag: partyCount } saturation data
 * @param {number}   [avgSaturation]   - Average saturation across active tags
 * @returns {number} Number of abstentions produced
 */
function distributeVotes(parties, tags, blocCount, tally, blocApprovals, ideologySaturation, avgSaturation) {
    if (blocCount <= 0) return 0;

    const IDEOLOGY_RATE = 0.02;
    const MULT_MIN = 0.2;
    const MULT_MAX = 2.0;

    // Helper: get per-bloc approval for a party (default 40)
    const getApproval = (partyId) => (blocApprovals && blocApprovals[partyId] != null) ? blocApprovals[partyId] : 40;

    const upperTags = tags.map(t => t.toUpperCase());

    // ---- Abstention ----
    let abstainRate = upperTags.length === 0 ? 0.35 : 0.22;

    // Ideology Saturation modifier
    if (upperTags.length > 0 && ideologySaturation && avgSaturation > 0) {
        const blocSaturation = upperTags.reduce((s, t) => s + (ideologySaturation[t] || 0), 0) / upperTags.length;
        const SATURATION_RATE = 0.04;
        const SATURATION_CAP  = 0.12;
        let satMod = (blocSaturation - avgSaturation) * SATURATION_RATE;
        satMod = Math.max(-SATURATION_CAP, Math.min(SATURATION_CAP, satMod));
        abstainRate = Math.max(0.05, Math.min(0.85, abstainRate + satMod));
    }

    const abstentions = Math.floor(blocCount * abstainRate);
    const voters = blocCount - abstentions;
    if (voters <= 0) return blocCount;

    // ---- Calculate weights for ALL parties ----
    const weights = [];
    let totalWeight = 0;

    for (const party of parties) {
        const approval = getApproval(party.id);
        let multiplier = 1.0;

        if (upperTags.length > 0) {
            // Average alignment across bloc tags
            const alignSum = upperTags.reduce((s, t) => s + getPartyAlignment(party.axes, t), 0);
            const alignAvg = alignSum / upperTags.length;
            multiplier = Math.max(MULT_MIN, Math.min(MULT_MAX, 1.0 + alignAvg * IDEOLOGY_RATE));
        }

        const w = Math.max(0, approval * multiplier);
        weights.push({ id: party.id, weight: w });
        totalWeight += w;
    }

    // Edge case: all weights are 0 — distribute evenly
    if (totalWeight === 0) {
        const evenShare = Math.floor(voters / parties.length);
        for (const party of parties) {
            tally[party.id] = (tally[party.id] || 0) + evenShare;
        }
        const rem = voters - evenShare * parties.length;
        if (rem > 0) {
            tally[parties[0].id] = (tally[parties[0].id] || 0) + rem;
        }
        return abstentions;
    }

    // ---- Distribute proportionally with Largest Remainder ----
    let allocated = 0;
    const partyVotes = [];
    for (const { id, weight } of weights) {
        const exact = (voters * weight) / totalWeight;
        const floored = Math.floor(exact);
        tally[id] = (tally[id] || 0) + floored;
        allocated += floored;
        partyVotes.push({ id, fractional: exact - floored });
    }

    const remainder = voters - allocated;
    partyVotes.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remainder; i++) {
        tally[partyVotes[i].id] = (tally[partyVotes[i].id] || 0) + 1;
    }

    return abstentions;
}

/**
 * Allocate parliamentary seats from vote totals using
 * Largest Remainder / Hare Quota method.
 *
 * @param {object} voteTotals  - { partyId: totalVotes, ... }
 * @param {number} totalSeats  - Seats to allocate (default 120)
 * @returns {object} { partyId: seats, ... }
 */
function allocateSeatsByVotes(voteTotals, totalSeats = GAME_CONFIG.TOTAL_SEATS) {
    const totalVotes = Object.values(voteTotals).reduce((s, v) => s + v, 0);
    if (totalVotes === 0) {
        const seats = {};
        for (const id of Object.keys(voteTotals)) seats[id] = 0;
        return seats;
    }

    const quota = totalVotes / totalSeats;
    const seats = {};
    const fractionals = [];
    let allocatedSeats = 0;

    for (const [id, votes] of Object.entries(voteTotals)) {
        if (votes === 0) { seats[id] = 0; continue; }
        const raw = votes / quota;
        const guaranteed = Math.floor(raw);
        seats[id] = guaranteed;
        allocatedSeats += guaranteed;
        fractionals.push({ id, fractional: raw - guaranteed });
    }

    const remaining = totalSeats - allocatedSeats;
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remaining; i++) {
        seats[fractionals[i].id] = (seats[fractionals[i].id] || 0) + 1;
    }

    return seats;
}

/**
 * Run a full election simulation using the Weighted Competition Model.
 *
 * All parties compete simultaneously for each bloc's voters:
 *   weight = bloc_approval × ideology_multiplier
 *   ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * @param {object[]} blocs    - Rows from voter_blocs: { id, bloc_name, voter_count, ideology_1..5, is_active }
 * @param {object[]} parties  - Array of { id, faction_name, axes: { liberty_equality, ... } }
 * @param {number}   [totalSeats=120]
 * @param {object}   [allBlocApprovals] - { blocId: { partyId: approval } } from faction_bloc_approval
 * @returns {{ votes: object, seats: object, totalAbstentions: number, totalVotesCast: number, details: object[] }}
 */
function runElectionSimulation(blocs, parties, totalSeats = GAME_CONFIG.TOTAL_SEATS, allBlocApprovals = null) {
    const tally = {};
    for (const p of parties) tally[p.id] = 0;

    let totalAbstentions = 0;
    const details = [];

    // ---- Ideology Saturation: penalise over-served ideologies with higher abstention ----
    const ALL_IDEOLOGY_TAGS = ['LIBERTY','EQUALITY','TRADITION','PROGRESS','SECURITY','FREEDOM',
                               'GLOBALISM','NATIONALISM','INDIVIDUALISM','COLLECTIVISM'];
    const ideologySaturation = {};
    for (const tag of ALL_IDEOLOGY_TAGS) {
        ideologySaturation[tag] = parties.filter(p => getPartyAlignment(p.axes, tag) > 0).length;
    }
    const activeSatTags = ALL_IDEOLOGY_TAGS.filter(t => ideologySaturation[t] > 0);
    const avgSaturation = activeSatTags.length > 0
        ? activeSatTags.reduce((s, t) => s + ideologySaturation[t], 0) / activeSatTags.length
        : 1;

    for (const bloc of blocs) {
        if (!bloc.is_active) continue;
        const count = bloc.voter_count || 0;
        if (count === 0) continue;

        // Collect ideology tags from the bloc
        const tags = [bloc.ideology_1, bloc.ideology_2, bloc.ideology_3, bloc.ideology_4, bloc.ideology_5]
            .filter(t => t && t !== 'Unaligned');

        // Per-bloc approval map for this specific bloc
        const blocApprovals = allBlocApprovals ? allBlocApprovals[bloc.id] || null : null;

        // Snapshot tally before distribution to compute per-bloc party votes
        const snapshot = {};
        for (const p of parties) snapshot[p.id] = tally[p.id];

        // All parties compete simultaneously — no cascade
        const abstentions = distributeVotes(parties, tags, count, tally, blocApprovals, ideologySaturation, avgSaturation);

        // Compute per-party votes from this bloc
        const blocVotes = {};
        const partyVotes = [];
        for (const p of parties) {
            const gained = tally[p.id] - snapshot[p.id];
            if (gained > 0) blocVotes[p.id] = gained;
            partyVotes.push({
                party_id: p.id,
                party_name: p.faction_name,
                votes: Math.max(0, gained)
            });
        }

        totalAbstentions += abstentions;
        details.push({
            bloc_id: bloc.id,
            bloc_name: bloc.bloc_name,
            voter_count: count,
            tags,
            abstentions,
            party_votes: partyVotes,
            blocVotes
        });
    }

    const totalVotesCast = Object.values(tally).reduce((s, v) => s + v, 0);
    const seats = allocateSeatsByVotes(tally, totalSeats);

    return { votes: tally, seats, totalAbstentions, totalVotesCast, details };
}

/**
 * High-level helper: load all data from Supabase and run the election preview.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} nationId   - Nation UUID
 * @returns {Promise<object>} Full election result with party names, votes, seats, turnout
 */
async function runElectionPreview(supabase, nationId) {
    // 1. Load nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, total_seats, eligible_voters')
        .eq('id', nationId)
        .single();
    if (!nation) throw new Error('Nation not found');

    const totalSeats = nation.total_seats || 120;

    // 2. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('*')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!blocs || blocs.length === 0) throw new Error('No voter blocs found for this nation');

    // 2b. Scale bloc voter_counts so total matches eligible_voters (blocs are generated from population)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        // Fix rounding drift on the largest bloc
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties + their ideology axes
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    if (!factions || factions.length === 0) throw new Error('No parties found for this nation');

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('*')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // Build party objects with axes (no approval_rating or ideology_modifiers needed)
    const parties = factions.map(f => ({
        id: f.id,
        faction_name: f.faction_name,
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 3b. Load per-bloc preference data from faction_bloc_approval (Three-Pillar system)
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval')
        .select('faction_id, bloc_id, preference_score')
        .in('faction_id', factionIds);

    // Build allBlocApprovals map: { blocId: { partyId: preference_score } }
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        allBlocApprovals[row.bloc_id][row.faction_id] = row.preference_score ?? 40;
    }

    // 4. Run simulation with per-bloc approvals
    const result = runElectionSimulation(blocs, parties, totalSeats, allBlocApprovals);

    // 5. Build friendly results with weighted average approval per party
    const totalBlocWeight = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    const partyResults = parties.map(p => {
        let weightedApproval = 40;
        if (totalBlocWeight > 0) {
            let wSum = 0;
            for (const bloc of blocs) {
                const ba = allBlocApprovals[bloc.id];
                const approval = (ba && ba[p.id] != null) ? ba[p.id] : 40;
                wSum += approval * (bloc.voter_count || 0);
            }
            weightedApproval = Math.round(wSum / totalBlocWeight * 100) / 100;
        }
        return {
            party_id: p.id,
            party_name: p.faction_name,
            approval: weightedApproval,
            votes: result.votes[p.id] || 0,
            vote_percentage: result.totalVotesCast > 0
                ? Math.round(((result.votes[p.id] || 0) / result.totalVotesCast) * 10000) / 100
                : 0,
            seats: result.seats[p.id] || 0
        };
    }).sort((a, b) => b.seats - a.seats);

    // Build party name lookup for UI
    const partyNames = {};
    for (const p of parties) partyNames[p.id] = p.faction_name;

    return {
        nation: nation.name,
        total_seats: totalSeats,
        eligible_voters: nation.eligible_voters || 0,
        total_votes_cast: result.totalVotesCast,
        total_abstentions: result.totalAbstentions,
        turnout_pct: nation.eligible_voters
            ? Math.round((result.totalVotesCast / nation.eligible_voters) * 10000) / 100
            : 0,
        results: partyResults,
        bloc_details: result.details,
        partyNames
    };
}


// ===== END GAME LOGIC =====


// ===== TICK-ONLY HELPERS (edge-function-only — not in game-common.js) =====

async function processIncumbentCampaignBonuses(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const { data: president } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!president) return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;
    const { data: upcomingElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .lte('election_tick', currentTick + leadTicks)
        .limit(1)
        .maybeSingle();

    if (!upcomingElection) return;

    const ticksToElection = upcomingElection.election_tick - currentTick;
    console.log(`Campaign bonuses for incumbent ${president.first_name} ${president.last_name} in ${nation.name} (${ticksToElection} ticks to election)`);

    await adjustMomentumAll(supabase, nation.id, president.faction_id, 2, 'campaign:incumbent_bonus');

    const { data: nationStats } = await supabase
        .from('nations')
        .select('stability, happiness')
        .eq('id', nation.id)
        .single();

    if (nationStats) {
        const updates = {};
        if ((nationStats.stability || 0) >= 60) {
            updates.happiness = Math.max(0, Math.min(100, Math.round(((nationStats.happiness || 50) + 1) * 10) / 10));
        }
        if ((nationStats.happiness || 0) >= 60) {
            updates.stability = Math.max(0, Math.min(100, Math.round(((nationStats.stability || 50) + 1) * 10) / 10));
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }
}

function advanceMonth(currentDate) {
    const parts = currentDate.split(',');
    const month = parts[0].trim();
    const year = parseInt(parts[1].trim());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const idx = months.indexOf(month);
    if (idx === -1) { console.error('Invalid month:', month); return currentDate; }

    const nextIdx = (idx + 1) % 12;
    const nextYear = nextIdx === 0 ? year + 1 : year;
    return `${months[nextIdx]}, ${nextYear}`;
}

async function acquireTickLock(supabase) {
    const STALE_LOCK_MS = 5 * 60 * 1000; // 5 minutes
    const now = new Date().toISOString();

    // Attempt: acquire lock when tick_processing is false
    const { data: acquired, error: err1 } = await supabase
        .from('shard')
        .update({ tick_processing: true, tick_processing_started_at: now })
        .eq('name', 'Alpha Shard')
        .eq('tick_processing', false)
        .select('name');

    if (!err1 && acquired && acquired.length > 0) return true;

    // Check for stale lock (crashed tab)
    const { data: shard } = await supabase
        .from('shard')
        .select('tick_processing, tick_processing_started_at')
        .eq('name', 'Alpha Shard')
        .single();

    if (shard && shard.tick_processing && shard.tick_processing_started_at) {
        const lockAge = Date.now() - new Date(shard.tick_processing_started_at).getTime();
        if (lockAge > STALE_LOCK_MS) {
            console.warn('Stale tick lock detected (' + Math.round(lockAge / 1000) + 's old), forcing acquire');
            const { data: forced, error: err2 } = await supabase
                .from('shard')
                .update({ tick_processing: true, tick_processing_started_at: now })
                .eq('name', 'Alpha Shard')
                .eq('tick_processing', true)
                .select('name');
            return !err2 && forced && forced.length > 0;
        }
    }

    return false;
}

async function releaseTickLock(supabase) {
    await supabase
        .from('shard')
        .update({ tick_processing: false, tick_processing_started_at: null })
        .eq('name', 'Alpha Shard');
}

/**
 * Scan all effect records in the database for invalid stat keys.
 * Logs errors for any stat_key that doesn't match NATION_STAT_COLUMNS
 * (after alias resolution). Runs periodically as a safety net.
 */
async function auditStatKeys(supabase) {
    const invalid = [];

    // 1. Policy stat_effects
    const { data: policies } = await supabase.from('policies').select('id, policy_name, stat_effects');
    for (const p of (policies || [])) {
        for (const eff of (p.stat_effects || [])) {
            const resolved = normalizeNationStatKey(eff.stat_key);
            if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
                invalid.push({ source: 'policy', name: p.policy_name, id: p.id, bad_key: eff.stat_key });
            }
        }
    }

    // 2. Crisis effects
    const { data: crisisEffects } = await supabase.from('crisis_effects').select('id, crisis_template_id, stat_key, target');
    for (const ce of (crisisEffects || [])) {
        if (ce.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ce.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_effect', id: ce.id, template_id: ce.crisis_template_id, bad_key: ce.stat_key });
        }
    }

    // 3. Crisis triggers
    const { data: crisisTriggers } = await supabase.from('crisis_triggers').select('id, crisis_template_id, stat_key');
    for (const ct of (crisisTriggers || [])) {
        const resolved = normalizeNationStatKey(ct.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_trigger', id: ct.id, template_id: ct.crisis_template_id, bad_key: ct.stat_key });
        }
    }

    // 4. Crisis end triggers
    const { data: crisisEndTriggers } = await supabase.from('crisis_end_triggers').select('id, crisis_template_id, stat_key');
    for (const cet of (crisisEndTriggers || [])) {
        const resolved = normalizeNationStatKey(cet.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_end_trigger', id: cet.id, template_id: cet.crisis_template_id, bad_key: cet.stat_key });
        }
    }

    // 5. Event effects
    const { data: eventEffects } = await supabase.from('event_effects').select('id, event_id, stat_key, target');
    for (const ee of (eventEffects || [])) {
        if (ee.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ee.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_effect', id: ee.id, event_id: ee.event_id, bad_key: ee.stat_key });
        }
    }

    // 6. Event triggers
    const { data: eventTriggers } = await supabase.from('event_triggers').select('id, event_id, stat_key');
    for (const et of (eventTriggers || [])) {
        if (!et.stat_key) continue;
        const resolved = normalizeNationStatKey(et.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_trigger', id: et.id, event_id: et.event_id, bad_key: et.stat_key });
        }
    }

    if (invalid.length > 0) {
        console.error(`[auditStatKeys] Found ${invalid.length} invalid stat key(s) in the database:`);
        for (const entry of invalid) {
            console.error(`  - ${entry.source}: "${entry.bad_key}" (id=${entry.id}${entry.name ? ', name=' + entry.name : ''})`);
        }
    } else {
        console.log('[auditStatKeys] All stat keys valid.');
    }

    return invalid;
}

/**
 * Process lingering approval decay from minister purges (autocracy mechanic).
 */
async function processPurgeDecay(supabase, nationId, currentTick) {
    const { data: purgeActions } = await supabase
        .from('campaign_actions')
        .select('id, party_id, result')
        .eq('nation_id', nationId)
        .eq('action_type', 'purge_minister');

    if (!purgeActions || purgeActions.length === 0) return;

    for (const action of purgeActions) {
        const result = action.result;
        if (!result || !result.decay_ticks_remaining || result.decay_ticks_remaining <= 0) continue;

        const decayRate = result.decay_rate || 1;
        await adjustMomentumAll(supabase, nationId, action.party_id, -decayRate, 'purge:decay');

        const newRemaining = result.decay_ticks_remaining - 1;
        await supabase.from('campaign_actions')
            .update({ result: { ...result, decay_ticks_remaining: newRemaining } })
            .eq('id', action.id);
    }
}

// ==================== ADVANCE TICK ====================

async function advanceTick(supabase) {
    // 1. Pre-compute next tick metadata
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick, tick_interval_hours, current_date, next_tick_at')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) throw new Error('Shard not found');

    const newTick = (shard.current_tick || 0) + 1;
    // Anchor next_tick_at to the previous schedule to prevent drift
    // Uses UTC-safe millisecond arithmetic instead of setHours() which is timezone-dependent
    const intervalMs = (shard.tick_interval_hours || 12) * 60 * 60 * 1000;
    const prevTickAt = new Date(shard.next_tick_at || new Date());
    let nextTickAt = new Date(prevTickAt.getTime() + intervalMs);
    // Safety: if calculated next tick is in the past (e.g. server was down), advance to future
    const now = Date.now();
    while (nextTickAt.getTime() <= now) {
        nextTickAt = new Date(nextTickAt.getTime() + intervalMs);
    }
    const newDate = advanceMonth(shard.current_date || 'January, 2000');

    // 2. Load all nations
    const { data: nations } = await supabase.from('nations').select('*');
    const nationList = nations || [];

    // Lazy-loaded once per tick for all nations
    let _statConnections = null;
    let _institutionConfig = null;

    const summary = {
        tick: newTick,
        nations: nationList.length,
        effects: [],
        costs: [],
        resolutions: [],
        events: [],
        apFailures: []
    };
    const failedNationIds = new Set();
    const failedFactionIds = new Set();

    // Accumulate AP for party factions each tick:
    // base 5 AP, +1 if in government, +1 if approval > 60. Capped at MAX_AP.
    // Uses atomic RPC to prevent race conditions with concurrent player deductions.
    let apDistributed = 0;
    let apFailed = 0;
    for (const nation of nationList) {
      try {
        const { data: factions } = await supabase
            .from('factions')
            .select('id, approval_rating, faction_type')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');

        if (!factions || factions.length === 0) continue;

        const coalition = await fetchActiveCoalition(supabase, nation.id);
        const governmentPartyIds = new Set([
            ...(coalition?.party_ids || []),
            nation.ruling_faction_id
        ].filter(Boolean));

        for (const faction of factions) {
            const isInGovernment = governmentPartyIds.has(faction.id);
            let apGain = 5;
            if (isInGovernment) apGain += 1;
            if ((faction.approval_rating ?? 50) > 60) apGain += 1;

            const result = await accumulateAP(supabase, faction.id, apGain);
            if (result.success) {
                console.log(`[advanceTick] AP: faction ${faction.id} → ${result.newAp} (+${apGain})`);
                apDistributed++;
            } else {
                console.error(`[advanceTick] AP accumulation FAILED for faction ${faction.id}: ${result.error}`);
                apFailed++;
                summary.apFailures.push({
                    nationId: nation.id,
                    nation: nation.name,
                    factionId: faction.id,
                    error: result.error
                });
                failedNationIds.add(nation.id);
                failedFactionIds.add(faction.id);
            }
        }
      } catch (apErr) {
        console.error(`[advanceTick] AP distribution FAILED for nation ${nation.id} (${nation.name}):`, apErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, phase: 'ap_distribution', error: String(apErr) });
        apFailed++;
        summary.apFailures.push({
            nationId: nation.id,
            nation: nation.name,
            factionId: null,
            error: String(apErr)
        });
        failedNationIds.add(nation.id);
      }
    }
    summary.apDistributed = apDistributed;
    summary.apFailed = apFailed;

    if (apFailed > 0) {
        summary.partial = true;
        summary.failureReason = 'ap_distribution_failed';
        summary.failedNationIds = Array.from(failedNationIds);
        summary.failedFactionIds = Array.from(failedFactionIds);
        summary.message = 'Tick marked partial: AP distribution failed for one or more factions; shard tick was not advanced.';
        return summary;
    }

    // 3. Commit shard tick/date after critical AP phase succeeds
    await supabase.from('shard').update({
        current_tick: newTick,
        next_tick_at: nextTickAt.toISOString(),
        current_date: newDate
    }).eq('name', 'Alpha Shard');

    // Clear expired coup cooldowns
    await supabase.from('factions')
        .update({ action_lockout_until_tick: null })
        .not('action_lockout_until_tick', 'is', null)
        .lte('action_lockout_until_tick', newTick);

    // Periodic integrity scan for invalid stat keys
    if (newTick % 10 === 1) {
        try {
            await auditStatKeys(supabase);
        } catch (auditErr) {
            console.error('[advanceTick] auditStatKeys failed (non-fatal):', auditErr);
        }
    }

    // 3.5 Trade engine — runs across ALL nations simultaneously
    try {
        const tradeResult = await processTradeFlows(supabase, nationList, newTick);
        if (tradeResult.processed > 0) {
            summary.trade = tradeResult;
            console.log(`[advanceTick] Trade: ${tradeResult.processed} nations, $${Math.round(tradeResult.totalVolume).toLocaleString()} volume`);
        }
    } catch (tradeErr) {
        console.error('[advanceTick] Trade processing failed (non-fatal):', tradeErr);
    }

    // 4. Process each nation
    for (const nation of nationList) {
      try {
        // Set correct seat count for this nation (affects supermajority thresholds, etc.)
        initGameConfigForNation(nation);

        // Stat effects (from passed bills/active laws)
        const effectResults = await processStatEffects(supabase, nation, newTick);
        if (effectResults.length > 0) summary.effects.push({ nation: nation.name, effects: effectResults });

        // Ministry action effects
        const ministryResults = await processMinistryActions(supabase, nation, newTick);
        if (ministryResults.length > 0) {
            summary.ministryActions = summary.ministryActions || [];
            summary.ministryActions.push({ nation: nation.name, effects: ministryResults });
        }

        // Apply GDP growth rate
        await applyGdpGrowth(supabase, nation);

        // Stat decay (equilibrium drift + erosion, modified by institution funding)
        if (!_institutionConfig) {
            const { data: icRows } = await supabase.from('ministry_institution_config').select('*');
            _institutionConfig = icRows || [];
        }
        const shutdown = isGovernmentShutdown(nation, newTick);
        let statInstMap = null;
        if (shutdown && _institutionConfig.length > 0) {
            // Government shutdown: force ALL institutions to 0% funding → Collapsed decay rates
            statInstMap = buildShutdownStatInstMap(_institutionConfig);
            console.log(`[GovernmentShutdown] Forcing Collapsed institution decay for ${nation.name}`);
        } else if (nation.last_budget_bill_id && _institutionConfig.length > 0) {
            const { data: itemAllocs } = await supabase.from('budget_item_allocations')
                .select('item_type, item_id, allocation_amount, needed_amount')
                .eq('bill_id', nation.last_budget_bill_id)
                .eq('item_type', 'institution');
            statInstMap = buildStatInstitutionMap(_institutionConfig, itemAllocs);
        }
        const decayResults = await processStatDecay(supabase, nation, statInstMap, shutdown);
        if (decayResults.length > 0) {
            summary.decay = summary.decay || [];
            summary.decay.push({ nation: nation.name, effects: decayResults });
        }

        // Stat connections (threshold-triggered ripple effects)
        if (!_statConnections) {
            const { data: scRows } = await supabase.from('stat_connections').select('*').eq('enabled', true);
            _statConnections = scRows || [];
        }
        const connResults = await processStatConnections(supabase, nation, newTick, _statConnections);
        if (connResults.length > 0) {
            summary.statConnections = summary.statConnections || [];
            summary.statConnections.push({ nation: nation.name, effects: connResults });
        }

        // No-budget penalty (if nation hasn't passed a budget in over a year)
        const noBudgetResult = await processNoBudgetPenalty(supabase, nation, newTick);
        if (noBudgetResult) {
            summary.noBudgetPenalties = summary.noBudgetPenalties || [];
            summary.noBudgetPenalties.push({ nation: nation.name, ...noBudgetResult });
        }

        // Ongoing costs
        const costResult = await processOngoingCosts(supabase, nation, newTick);
        if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });

        // PM trait effects
        await processPMTraitEffects(supabase, nation, newTick);

        // Elections (democracy only)
        const electionResults = await processElections(supabase, nation, newTick);
        if (electionResults.length > 0) {
            summary.elections = summary.elections || [];
            summary.elections.push({ nation: nation.name, elections: electionResults });
        }

        // Government vacancy penalties (democracy only)
        const vacancyResult = await processGovernmentVacancy(supabase, nation, newTick);
        if (vacancyResult) {
            summary.vacancies = summary.vacancies || [];
            summary.vacancies.push(vacancyResult);
        }

        // Check for early majority on active floor bills (lock outcome + set grace tick)
        const earlyResults = await checkEarlyMajority(supabase, nation.id);
        if (earlyResults.length > 0) {
            summary.earlyMajority = summary.earlyMajority || [];
            summary.earlyMajority.push({ nation: nation.name, bills: earlyResults });
        }

        // Resolve expired votes (includes early-locked bills whose grace tick ended)
        const resolutions = await resolveExpiredVotes(supabase, nation.id);
        if (resolutions.length > 0) summary.resolutions.push({ nation: nation.name, bills: resolutions });

        // Auto-sign expired president's desk bills (Presidential systems)
        const deskResults = await processPresidentDesk(supabase, nation, newTick);
        if (deskResults.length > 0) {
            summary.presidentDesk = summary.presidentDesk || [];
            summary.presidentDesk.push({ nation: nation.name, bills: deskResults });
        }

        // Presidential pre-election candidate generation, term end safety net, + selection timeout
        await triggerPresidentialCandidateSelection(supabase, nation, newTick);
        await processPresidentialTermEnd(supabase, nation, newTick);
        await processPresidentCandidateTimeout(supabase, nation, newTick);
        await processParliamentaryPMTimeout(supabase, nation, newTick);

        // Incumbent campaign bonuses (+2 approval/tick during pre-election window)
        await processIncumbentCampaignBonuses(supabase, nation, newTick);

        // Ideology shifts from resolved bills
        await processIdeologyShifts(supabase, nation.id, resolutions, newTick);

        // Purge approval decay (autocracy scapegoat mechanic)
        if (isAutocracy(nation)) {
            await processPurgeDecay(supabase, nation.id, newTick);
        }

        // Re-fetch nation to get post-effect stat values for minister approval
        const { data: preApprovalNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (preApprovalNation) Object.assign(nation, preApprovalNation);

        // Record stat history for trend calculations (Phase 2)
        await recordStatHistory(supabase, nation, newTick);

        // Layer 1: Update minister approvals from stat thresholds
        const ministerApprovalResults = await updateMinisterApprovals(supabase, nation, newTick);
        if (ministerApprovalResults.length > 0) {
            summary.ministerApprovals = summary.ministerApprovals || [];
            summary.ministerApprovals.push({ nation: nation.name, results: ministerApprovalResults });
        }

        // Decay gov_approval_events by 12% per tick (transient shocks fade naturally)
        const oldEvents = Number(nation.gov_approval_events ?? 0);
        if (Math.abs(oldEvents) > 0.01) {
            const decayed = Math.round(oldEvents * (1 - GOV_APPROVAL_CONFIG.EVENTS_DECAY_RATE) * 100) / 100;
            await supabase.from('nations')
                .update({ gov_approval_events: decayed })
                .eq('id', nation.id);
            nation.gov_approval_events = decayed;
        }

        // Layer 2: Calculate composite government approval
        const govApproval = await calculateGovernmentApprovalTick(supabase, nation, newTick);

        // Three-pillar voter preference recalculation
        await calculateThreePillarPreferences(supabase, nation, newTick);

        // Re-evaluate shutdown status after resolveExpiredVotes may have passed a budget bill
        // (the original `shutdown` boolean was computed before bill resolution)
        const shutdownNow = isGovernmentShutdown(nation, newTick);

        // Government shutdown penalties (coalition momentum/approval + PM/President approval)
        if (shutdownNow) {
            const shutdownResult = await processGovernmentShutdown(supabase, nation, newTick);
            if (shutdownResult) {
                summary.governmentShutdowns = summary.governmentShutdowns || [];
                summary.governmentShutdowns.push({ nation: nation.name, ...shutdownResult });
            }
        } else {
            // If shutdown ended (budget passed), remove the active_crises row
            await resolveGovernmentShutdown(supabase, nation, newTick);
        }

        // Faction loyalty (autocracy)
        if (isAutocracy(nation)) {
            await processLoyaltyTick(supabase, nation);
        }

        // Regime pillars decay & bonus (autocracy)
        if (isAutocracy(nation)) {
            await processRegimePillars(supabase, nation);
        }

        // Auto-resolve shakeups that are 1+ ticks old
        if (isAutocracy(nation)) {
            await autoResolveStaleShakeups(supabase, nation.id, newTick);
        }

        // Re-fetch nation with post-effect values for remaining processors
        const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (freshNation) Object.assign(nation, freshNation);

        // Crises (persistent negative events that apply effects every tick)
        const crisisResults = await processCrises(supabase, nation, newTick);
        if (crisisResults.length > 0) {
            summary.crises = summary.crises || [];
            summary.crises.push({ nation: nation.name, crises: crisisResults });
        }

        // Democratic revolution (autocracy only)
        const revolutionResult = await processRevolution(supabase, nation, newTick);
        if (revolutionResult) {
            summary.revolutions = summary.revolutions || [];
            summary.revolutions.push(revolutionResult);
        }

        // Random events
        const eventResults = await processEvents(supabase, nation, newTick);
        if (eventResults.length > 0) summary.events.push({ nation: nation.name, events: eventResults });

        // Process active fundraiser promises
        const promiseResults = await processPromiseTick(supabase, nation, newTick);
        if (promiseResults.length > 0) {
            summary.promises = summary.promises || [];
            summary.promises.push({ nation: nation.name, promises: promiseResults });
        }

        // Ministry inbox events (fire from templates + expire overdue)
        const ministryEventResults = await processMinistryInboxEvents(supabase, freshNation || nation, newTick);
        if (ministryEventResults.length > 0) {
            summary.ministryEvents = summary.ministryEvents || [];
            summary.ministryEvents.push({ nation: nation.name, events: ministryEventResults });
        }

        // Ambassador term limits (retirements + warnings)
        const retirementResults = await processAmbassadorRetirements(supabase, freshNation || nation, newTick);
        if (retirementResults.length > 0) {
            summary.ambassadorRetirements = summary.ambassadorRetirements || [];
            summary.ambassadorRetirements.push({ nation: nation.name, retirements: retirementResults });
        }

        // Inactivity decay (preference + momentum erosion for idle factions, auto-disband)
        const inactivityResults = await processInactivityDecay(supabase, nation.id, newTick);
        if (inactivityResults.length > 0) {
            summary.inactivityDecay = summary.inactivityDecay || [];
            summary.inactivityDecay.push({ nation: nation.name, factions: inactivityResults });
        }

        // Final snapshot — capture everything that happened this tick
        const { data: finalNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        await snapshotNationHistory(supabase, finalNation || nation, newTick);
      } catch (nationErr) {
        console.error(`[advanceTick] FAILED processing nation ${nation.id} (${nation.name}):`, nationErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, error: String(nationErr) });
      }
    }

    return summary;
}

// ===== INTEGRITY CHECKS =====

const CANONICAL_TEMPLATE_GOV_TYPES = ['Democracy', 'Autocracy', 'Presidential'];
const TEMPLATE_GOV_TYPE_ALIASES = {
    democracy: 'Democracy',
    democratic: 'Democracy',
    parliamentary: 'Democracy',
    parliamentarian: 'Democracy',
    'parliamentary democracy': 'Democracy',
    autocracy: 'Autocracy',
    authoritarian: 'Autocracy',
    authoritarianism: 'Autocracy',
    dictatorship: 'Autocracy',
    dictatorial: 'Autocracy',
    'military junta': 'Autocracy',
    presidential: 'Presidential',
    'presidential republic': 'Presidential',
    'executive presidency': 'Presidential'
};

async function runMinistryEventTemplateGovTypeIntegrityCheck(supabase) {
    try {
        const { data: templates, error } = await supabase
            .from('ministry_event_templates')
            .select('id, event_key, gov_types, is_active');

        if (error) {
            console.error('[Integrity][ministry_event_templates] Failed to load template gov types:', error.message);
            return;
        }

        const unknownByTemplate = [];
        const distinctGovTypes = new Set();

        for (const tmpl of (templates || [])) {
            const values = Array.isArray(tmpl.gov_types) ? tmpl.gov_types : [];
            const unknown = [];
            for (const raw of values) {
                const trimmed = String(raw || '').trim();
                if (!trimmed) continue;
                distinctGovTypes.add(trimmed);
                const isCanonical = CANONICAL_TEMPLATE_GOV_TYPES.includes(trimmed);
                const isAlias = Object.prototype.hasOwnProperty.call(TEMPLATE_GOV_TYPE_ALIASES, trimmed.toLowerCase());
                if (!isCanonical && !isAlias) unknown.push(trimmed);
            }
            if (unknown.length > 0) {
                unknownByTemplate.push({
                    id: tmpl.id,
                    event_key: tmpl.event_key,
                    is_active: tmpl.is_active,
                    unknown_gov_types: [...new Set(unknown)].sort()
                });
            }
        }

        const distinctList = [...distinctGovTypes].sort();
        console.log('[Integrity][ministry_event_templates] Distinct template gov_types:', JSON.stringify(distinctList));
        console.log('[Integrity][ministry_event_templates] Canonical gov_types:', JSON.stringify(CANONICAL_TEMPLATE_GOV_TYPES));

        if (unknownByTemplate.length > 0) {
            console.error(
                `[Integrity][ministry_event_templates] UNKNOWN gov_types detected in ${unknownByTemplate.length} template(s). ` +
                `Canonical values: ${CANONICAL_TEMPLATE_GOV_TYPES.join(', ')}. ` +
                'Offenders:',
                JSON.stringify(unknownByTemplate)
            );
        }
    } catch (e) {
        console.error('[Integrity][ministry_event_templates] Integrity check failed unexpectedly:', e?.message || e);
    }
}

// ===== EDGE FUNCTION HANDLER =====

Deno.serve(async (req) => {
    const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
            JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
            { status: 500, headers: corsHeaders }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 0. Startup checks
        await ensureApRpcAvailability(supabase);
        await runMinistryEventTemplateGovTypeIntegrityCheck(supabase);

        // 1. Check for force parameter (admin manual trigger)
        let force = false;
        try {
            const body = await req.json();
            force = body?.force === true;
        } catch (_) {
            // No body or invalid JSON — not forced
        }

        // 2. Check if tick is due (skip check if force=true)
        const { data: shard, error: shardError } = await supabase
            .from("shard")
            .select("next_tick_at, current_tick, tick_processing")
            .eq("name", "Alpha Shard")
            .single();

        if (shardError || !shard) {
            return new Response(
                JSON.stringify({ error: "Shard not found", detail: shardError?.message }),
                { status: 404, headers: corsHeaders }
            );
        }

        if (!force) {
            const now = new Date();
            const nextTickAt = new Date(shard.next_tick_at);

            if (now < nextTickAt) {
                return new Response(
                    JSON.stringify({
                        status: "not_due",
                        current_tick: shard.current_tick,
                        next_tick_at: shard.next_tick_at,
                        time_remaining_ms: nextTickAt.getTime() - now.getTime(),
                    }),
                    { headers: corsHeaders }
                );
            }
        }

        // 3. Tick is due (or forced) — acquire lock
        const lockAcquired = await acquireTickLock(supabase);
        if (!lockAcquired) {
            return new Response(
                JSON.stringify({
                    status: "locked",
                    message: "Another process is already processing the tick",
                }),
                { headers: corsHeaders }
            );
        }

        // 4. Process the tick
        try {
            const summary = await advanceTick(supabase);
            const responseStatus = summary.partial ? "partial" : "success";
            console.log(
                `[advance-tick] Tick ${summary.tick} ${summary.partial ? 'partially processed' : 'processed'} (${summary.nations} nations)`
            );
            return new Response(
                JSON.stringify({ status: responseStatus, summary }),
                { headers: corsHeaders }
            );
        } catch (e) {
            console.error("[advance-tick] Tick processing failed:", e);
            return new Response(
                JSON.stringify({ error: e.message }),
                { status: 500, headers: corsHeaders }
            );
        } finally {
            await releaseTickLock(supabase);
        }
    } catch (error) {
        console.error("[advance-tick] Edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
});
