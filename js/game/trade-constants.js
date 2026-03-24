/**
 * trade-constants.js — Trade system constants and calculation functions
 * Extracted from game-common.js
 */

import { calculateNationalBudget } from './budget.js';
import { isAutocracy } from './government-types.js';

// ==================== TRADE SYSTEM CONSTANTS ====================

export var TRADE_CONFIG = {
    BASE_TRADE_MULTIPLIER: 500000000,      // base dollar value per unit of export capacity
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
export var TRADE_SECTORS = [
    {
        key: 'fuel_energy',
        label: 'Fuel & Energy',
        export_only: false,
        export_stats: ['oil_and_gas', 'energy_generation'],
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
        export_stat: 'manufacturing_output',
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
        export_stat: 'service_output',
        export_threshold: 35
    }
];

export var TRADE_SECTOR_KEYS = [];
export var TRADE_SECTOR_MAP = {};
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
export function calculateExportCapacity(nation, sector, opts) {
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

    // ── Stability modifier ──
    // Political instability disrupts production across all sectors.
    // Below 40 stability, export capacity starts degrading.
    // At stability 20, capacity is halved. At 0, no exports at all.
    var stability = Number(nation.stability) || 50;
    var stabilityMod = Math.min(1.0, stability / 40);
    capacity *= stabilityMod;

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
export function calculateImportDemand(nation, sector, opts) {
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
    // Two-component demand model:
    // 1. Deficiency: import what you can't produce domestically (threshold 20)
    // 2. Industrial baseline: manufacturing, urbanization, cost of living,
    //    and poor rail networks all drive fuel consumption regardless of reserves
    if (sector.key === 'fuel_energy') {
        var oilGas = (Number(nation.oil_and_gas) || 0) / SN;
        var energyGen = (Number(nation.energy_generation) || 0) / SN;
        var domesticEnergy = (oilGas + energyGen) / 2;
        var deficiency = Math.max(0, 20 - domesticEnergy);

        // Industrial/urban energy consumption baseline
        var manufNorm = (Number(nation.manufacturing_output) || 0) / SN;
        var urbanNorm = (Number(nation.urbanization) || 0) / SN;
        var colNorm = (Number(nation.cost_of_living) || 0) / SN;
        var railNorm = (Number(nation.rail_network) || 0) / SN;
        // Low rail → more fuel for transport (inverted: 20 - rail score)
        var transportFuelNeed = Math.max(0, 12 - railNorm);
        // Industrial demand: factories + cities + high living standards + poor transit
        // Offset by domestic energy — nations that produce enough fuel domestically
        // don't need to import for industrial use either
        var grossIndustrialDemand = (manufNorm * 0.3 + urbanNorm * 0.2 + colNorm * 0.15 + transportFuelNeed * 0.15);
        var industrialDemand = Math.max(0, grossIndustrialDemand - domesticEnergy * 0.5);

        rawDemand = (deficiency + industrialDemand) * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;
    }

    // ── MINERALS & RAW MATERIALS ──
    // Import if you lack domestic minerals but have manufacturing that needs inputs.
    // Manufacturing creates demand for raw material imports.
    else if (sector.key === 'minerals') {
        var minerals = (Number(nation.rare_minerals) || 0) / SN;
        var manufScore = (Number(nation.manufacturing_output) || 0) / SN;
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
        var manufScore = (Number(nation.manufacturing_output) || 0) / SN;
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
export function calculatePriceModifier(totalSupply, totalDemand) {
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
 *   trade_agreement       +15 to +25 depending on agreement type
 *   embargo_penalty       -40 if active embargo/sanctions between nations
 *   proximity_bonus       +10 if same region (future)
 *   autocracy_penalty     -10 per autocratic nation in the pair
 *   fdi_bonus             avg foreign_investment → -15 to +15 (high FDI = attractive market)
 *   reputation_bonus      avg int'l reputation   → -10 to +10 (good standing = trustworthy partner)
 *
 * @param {Object} nationA   – nation row
 * @param {Object} nationB   – nation row
 * @param {Object} relation  – diplomatic_relations row { relation_score, active_treaties }
 * @param {Object} [opts]    – { has_trade_agreement, has_fta, has_pta, has_rsc, has_embargo, same_region }
 * @returns {number} affinity score (0 floor, no upper cap)
 */
export function calculateTradeAffinity(nationA, nationB, relation, opts) {
    var base = 50;

    // Diplomatic relations: -100 to +100 score → -30 to +30 affinity
    var relScore = (relation && Number(relation.relation_score)) || 0;
    var diplomaticBonus = relScore * 0.3;

    // Bilateral trade agreement: type-specific affinity boost
    // FTA (free trade) > RSC (supply contract) > PTA (partial reduction)
    var tradeBonus = 0;
    if (opts) {
        if (opts.has_fta) tradeBonus = 25;
        else if (opts.has_rsc) tradeBonus = 20;
        else if (opts.has_pta) tradeBonus = 15;
        else if (opts.has_trade_agreement) tradeBonus = 20;
    }

    // Active embargo/sanctions between these two nations: major penalty
    var embargoPenalty = (opts && opts.has_embargo) ? -40 : 0;

    // Geographic proximity: continuous bonus scaled from proximity 0-100.
    // Bordering (100) → +20, same region (50) → +10, distant (20) → +4.
    var proximity = (opts && opts.proximity != null) ? Number(opts.proximity) : 50;
    var proximityBonus = (proximity / 100) * 20;

    // Autocracy penalty: other nations are less willing to trade with autocratic regimes
    var autocracyPenalty = 0;
    if (isAutocracy(nationA)) autocracyPenalty -= 10;
    if (isAutocracy(nationB)) autocracyPenalty -= 10;

    // Foreign investment: high-FDI nations are integrated into global capital flows
    // Average of both nations' FDI: 50 (neutral) = +0, 80 = +9, 20 = -9
    var fdiA = Number(nationA.foreign_investment ?? 50);
    var fdiB = Number(nationB.foreign_investment ?? 50);
    var avgFdi = (fdiA + fdiB) / 2;
    var fdiBonus = ((avgFdi - 50) / 50) * 15;

    // International reputation: nations with good standing are trusted trade partners
    // Average of both nations' reputation: 50 (neutral) = +0, 80 = +6, 20 = -6
    var repA = Number(nationA.international_reputation ?? 50);
    var repB = Number(nationB.international_reputation ?? 50);
    var avgRep = (repA + repB) / 2;
    var reputationBonus = ((avgRep - 50) / 50) * 10;

    // Credit rating: nations with poor credit are unreliable trade partners
    // Uses the WORSE credit of the two nations (weakest-link principle)
    // Continuous curve: credit 50+ = no penalty, scales linearly to -20 at credit 0, floor -25 for negative
    var creditA = Number(nationA.credit ?? 50);
    var creditB = Number(nationB.credit ?? 50);
    var worstCredit = Math.min(creditA, creditB);
    var creditPenalty = 0;
    if (worstCredit < 50) {
        if (worstCredit <= 0) creditPenalty = -25;
        else creditPenalty = -((50 - worstCredit) / 50) * 20;
    }

    var affinity = base + diplomaticBonus + tradeBonus + embargoPenalty + proximityBonus + autocracyPenalty + fdiBonus + reputationBonus + creditPenalty;
    return Math.round(Math.max(0, affinity));
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
export function distributeTradeAmongPartners(exportCapacity, importers) {
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
export function deriveTradeBalanceIndex(tradeSurplus, gdp) {
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
export function calculateTariffRevenue(totalImports, tariffRate, collectionRate) {
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
export async function processTradeFlows(supabase, nationList, currentTick) {
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

            // Export controls: nations can cap exports per sector (e.g., OPEC strategy)
            // export_caps is a JSONB object like { energy: 50, minerals: 75 } meaning % of capacity
            var exportCaps = n.export_caps;
            if (exportCaps && exportCaps[sector.key] != null) {
                expCap = Math.round(expCap * (exportCaps[sector.key] / 100));
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

    // Build bilateral flags from active proposals (embargoes + legacy trade agreements)
    // flagsMap["idA|idB"] = { has_trade_agreement, has_embargo, has_fta, has_pta, has_rsc }
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

    // ── Step 4b: Fetch ALL active trade agreements (FTA, PTA, RSC, RT, ES, Embargo) ──
    var { data: activeTradeAgreements } = await supabase.from('trade_agreements')
        .select('id, nation_a_id, nation_b_id, agreement_type, articles')
        .eq('status', 'active')
        .in('agreement_type', ['fta', 'pta', 'resource_supply', 'retaliatory_tariff', 'export_subsidy', 'impose_embargo']);

    // Set type-specific affinity flags from trade_agreements
    // Build tariff modifier map: tariffModMap[importerId|exporterId][sector] = reduction fraction (0-1)
    // Build tariff surcharge map: tariffSurchargeMap[importerId|exporterId][sector] = surcharge fraction (e.g. 0.25 = +25%)
    // Build export subsidy map: exportSubsidyMap[nationId][sector] = subsidy fraction (e.g. 0.15 = +15% export boost)
    // Build embargo map: embargoMap[nationA|nationB][sector] = true (blocks trade in that sector)
    var tariffModMap = {};
    var tariffSurchargeMap = {};
    var exportSubsidyMap = {};
    var embargoMap = {};
    var activeRSCs = [];

    if (activeTradeAgreements) {
        for (var ti = 0; ti < activeTradeAgreements.length; ti++) {
            var ta = activeTradeAgreements[ti];
            var k1 = ta.nation_a_id + '|' + ta.nation_b_id;
            var k2 = ta.nation_b_id + '|' + ta.nation_a_id;
            if (!flagsMap[k1]) flagsMap[k1] = {};
            if (!flagsMap[k2]) flagsMap[k2] = {};

            if (ta.agreement_type === 'fta') {
                flagsMap[k1].has_fta = true;
                flagsMap[k2].has_fta = true;

                // FTA: 100% tariff reduction on all sectors, except exempted ones
                var arts = ta.articles || [];
                var exemptSectors = {};
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type === 'sector_exemption') {
                        exemptSectors[arts[ai].data.sector] = true;
                    }
                }
                if (!tariffModMap[k1]) tariffModMap[k1] = {};
                if (!tariffModMap[k2]) tariffModMap[k2] = {};
                for (var si = 0; si < sectors.length; si++) {
                    if (!exemptSectors[sectors[si].key]) {
                        tariffModMap[k1][sectors[si].key] = 1.0;
                        tariffModMap[k2][sectors[si].key] = 1.0;
                    }
                }
            } else if (ta.agreement_type === 'pta') {
                flagsMap[k1].has_pta = true;
                flagsMap[k2].has_pta = true;

                // PTA: per-sector tariff reductions from tariff_reduction articles
                var arts = ta.articles || [];
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type !== 'tariff_reduction') continue;
                    var d = arts[ai].data;
                    var reduction = (d.reduction_pct || 0) / 100;
                    var direction = d.direction || 'mutual';

                    // Resolve direction: "your_exports" / "their_exports" relative to author
                    var authorId = d.author_nation_id || ta.nation_a_id;
                    var partnerId = (authorId === ta.nation_a_id) ? ta.nation_b_id : ta.nation_a_id;

                    // your_exports: partner (importer) reduces tariffs on author's (exporter's) goods
                    // their_exports: author (importer) reduces tariffs on partner's (exporter's) goods
                    if (direction === 'mutual' || direction === 'your_exports') {
                        var impExpKey = partnerId + '|' + authorId;
                        if (!tariffModMap[impExpKey]) tariffModMap[impExpKey] = {};
                        tariffModMap[impExpKey][d.sector] = Math.max(tariffModMap[impExpKey][d.sector] || 0, reduction);
                    }
                    if (direction === 'mutual' || direction === 'their_exports') {
                        var impExpKey = authorId + '|' + partnerId;
                        if (!tariffModMap[impExpKey]) tariffModMap[impExpKey] = {};
                        tariffModMap[impExpKey][d.sector] = Math.max(tariffModMap[impExpKey][d.sector] || 0, reduction);
                    }
                }
            } else if (ta.agreement_type === 'resource_supply') {
                flagsMap[k1].has_rsc = true;
                flagsMap[k2].has_rsc = true;
                activeRSCs.push(ta);
            } else if (ta.agreement_type === 'retaliatory_tariff') {
                // Retaliatory tariff: unilateral surcharge on imports from target nation
                // articles contain tariff_surcharge entries with imposer_nation_id, sector, surcharge_pct
                var arts = ta.articles || [];
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type !== 'tariff_surcharge') continue;
                    var d = arts[ai].data;
                    var imposerId = d.imposer_nation_id;
                    var targetId = (imposerId === ta.nation_a_id) ? ta.nation_b_id : ta.nation_a_id;
                    var surcharge = (d.surcharge_pct || 0) / 100;
                    // Key: importer (imposer) | exporter (target) — surcharge on imports FROM target
                    var surKey = imposerId + '|' + targetId;
                    if (!tariffSurchargeMap[surKey]) tariffSurchargeMap[surKey] = {};
                    // Stack surcharges per sector (take max if multiple)
                    tariffSurchargeMap[surKey][d.sector] = Math.max(tariffSurchargeMap[surKey][d.sector] || 0, surcharge);
                }
            } else if (ta.agreement_type === 'export_subsidy') {
                // Export subsidy: unilateral — nation_a subsidizes its own exports in a sector
                var arts = ta.articles || [];
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type !== 'subsidized_sector') continue;
                    var d = arts[ai].data;
                    var subsidyPct = (d.subsidy_pct || 0) / 100;
                    var nationId = ta.nation_a_id;
                    if (!exportSubsidyMap[nationId]) exportSubsidyMap[nationId] = {};
                    exportSubsidyMap[nationId][d.sector] = Math.max(exportSubsidyMap[nationId][d.sector] || 0, subsidyPct);
                }
            } else if (ta.agreement_type === 'impose_embargo') {
                // Impose embargo: per-sector trade blocking between imposer (nation_a) and target (nation_b)
                var arts = ta.articles || [];
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type !== 'embargo_sector') continue;
                    var d = arts[ai].data;
                    var imposerId = d.imposer_nation_id || ta.nation_a_id;
                    var embTargetId = ta.nation_b_id;
                    // Block both directions
                    var ek1 = imposerId + '|' + embTargetId;
                    var ek2 = embTargetId + '|' + imposerId;
                    if (!embargoMap[ek1]) embargoMap[ek1] = {};
                    if (!embargoMap[ek2]) embargoMap[ek2] = {};
                    embargoMap[ek1][d.sector] = true;
                    embargoMap[ek2][d.sector] = true;
                }
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
            // Pass continuous proximity (0-100) for gravity-model weighting
            flags.proximity = (rel && rel.proximity != null) ? rel.proximity : 50;
            var aff = calculateTradeAffinity(a, b, rel, flags);
            affinityMap[a.id + '|' + b.id] = aff;
            affinityMap[b.id + '|' + a.id] = aff;
        }
    }

    // ── Step 4c: Pre-allocate RSC guaranteed volumes ──

    var rscPreAllocations = [];
    if (activeRSCs && activeRSCs.length > 0) {
        for (var ri = 0; ri < activeRSCs.length; ri++) {
            var rsc = activeRSCs[ri];
            var arts = rsc.articles || [];

            // Find supply_commitment and price_terms articles
            var supplyArt = null;
            var priceArt = null;
            for (var ai = 0; ai < arts.length; ai++) {
                if (arts[ai].type === 'supply_commitment') supplyArt = arts[ai].data;
                if (arts[ai].type === 'price_terms') priceArt = arts[ai].data;
            }

            if (!supplyArt || !supplyArt.sector || !supplyArt.commitment_pct) continue;

            // Resolve buyer/seller from direction + author_nation_id
            var authorNationId = supplyArt.author_nation_id || rsc.nation_a_id;
            var otherNationId = (authorNationId === rsc.nation_a_id) ? rsc.nation_b_id : rsc.nation_a_id;
            var buyerNationId, sellerNationId;
            if (supplyArt.direction === 'we_buy') {
                buyerNationId = authorNationId;
                sellerNationId = otherNationId;
            } else {
                sellerNationId = authorNationId;
                buyerNationId = otherNationId;
            }

            // Calculate guaranteed volume from seller's export capacity
            var sellerFlows = nationFlows[sellerNationId];
            var buyerFlows = nationFlows[buyerNationId];
            if (!sellerFlows || !buyerFlows) continue;

            var sellerExport = (sellerFlows[supplyArt.sector] && sellerFlows[supplyArt.sector].exportCapacity) || 0;
            var buyerDemand = (buyerFlows[supplyArt.sector] && buyerFlows[supplyArt.sector].importDemand) || 0;
            if (sellerExport <= 0 || buyerDemand <= 0) continue;

            var guaranteedVolume = Math.round(sellerExport * (supplyArt.commitment_pct / 100));
            guaranteedVolume = Math.min(guaranteedVolume, buyerDemand);

            // Apply price modifier based on price_terms article
            var sectorPriceMod = priceModifiers[supplyArt.sector] || 1.0;
            var rscPriceMod = sectorPriceMod;
            if (priceArt) {
                if (priceArt.price_type === 'fixed') rscPriceMod = 1.0;
                else if (priceArt.price_type === 'discounted') rscPriceMod = sectorPriceMod * (1 - (priceArt.modifier_pct || 0) / 100);
                else if (priceArt.price_type === 'premium') rscPriceMod = sectorPriceMod * (1 + (priceArt.modifier_pct || 0) / 100);
            }

            var adjustedVolume = Math.round(guaranteedVolume * rscPriceMod);
            if (adjustedVolume <= 0) continue;

            rscPreAllocations.push({
                sellerNationId: sellerNationId,
                buyerNationId: buyerNationId,
                sector: supplyArt.sector,
                volume: adjustedVolume,
                agreementId: rsc.id
            });
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

    // Pre-allocate RSC guaranteed volumes before normal distribution
    for (var ri = 0; ri < rscPreAllocations.length; ri++) {
        var rscAlloc = rscPreAllocations[ri];
        if (actualExports[rscAlloc.sellerNationId] && actualImports[rscAlloc.buyerNationId]) {
            actualExports[rscAlloc.sellerNationId][rscAlloc.sector] += rscAlloc.volume;
            actualImports[rscAlloc.buyerNationId][rscAlloc.sector] += rscAlloc.volume;

            partnerRows.push({
                tick: currentTick,
                exporter_nation_id: rscAlloc.sellerNationId,
                importer_nation_id: rscAlloc.buyerNationId,
                sector: rscAlloc.sector,
                trade_volume: rscAlloc.volume,
                affinity_score: affinityMap[rscAlloc.sellerNationId + '|' + rscAlloc.buyerNationId] || 0
            });
        }
    }

    // ── Simultaneous proportional distribution ──
    // Instead of iterating exporters sequentially (which lets the first exporter
    // saturate all demand), we collect ALL bilateral (exporter→importer) pairs per
    // sector and allocate simultaneously using a gravity-model weight:
    //   weight = exportCapacity × importDemand × affinity × proximityFactor
    // Each pair's allocation is capped by both the exporter's capacity and the
    // importer's demand. Two passes handle the caps + redistribute surplus.

    for (var si = 0; si < sectors.length; si++) {
        var sector = sectors[si];
        var priceMod = priceModifiers[sector.key];
        var priceDampener = 1 / Math.sqrt(priceMod);

        // Collect all viable bilateral pairs for this sector
        // pairs[i] = { expId, impId, expCap, impDem, affinity, weight }
        var pairs = [];
        for (var ei = 0; ei < nationCount; ei++) {
            var exporter = nationList[ei];
            var expCap = nationFlows[exporter.id][sector.key].exportCapacity;
            if (expCap <= 0) continue;
            // Subtract RSC pre-allocated exports
            var remainingExpCap = expCap - (actualExports[exporter.id][sector.key] || 0);
            if (remainingExpCap <= 0) continue;
            var adjustedCap = Math.round(remainingExpCap * priceMod);
            // Apply export subsidy: subsidized sectors get a competitiveness boost
            var subsidyBoost = exportSubsidyMap[exporter.id] && exportSubsidyMap[exporter.id][sector.key];
            if (subsidyBoost) {
                adjustedCap = Math.round(adjustedCap * (1 + subsidyBoost));
            }
            if (adjustedCap <= 0) continue;

            for (var ii = 0; ii < nationCount; ii++) {
                if (ii === ei) continue;
                var importer = nationList[ii];

                // Hard embargo block (from diplomatic_proposals — blocks all sectors)
                var pairFlags = flagsMap[exporter.id + '|' + importer.id];
                if (pairFlags && pairFlags.has_embargo) continue;

                // Per-sector embargo block (from trade_agreements impose_embargo)
                var pairEmbargo = embargoMap[exporter.id + '|' + importer.id];
                if (pairEmbargo && pairEmbargo[sector.key]) continue;

                var impDem = nationFlows[importer.id][sector.key].importDemand;
                // Subtract RSC pre-allocated imports
                var remainingDem = impDem - (actualImports[importer.id][sector.key] || 0);
                if (remainingDem <= 0) continue;
                remainingDem = Math.round(remainingDem * priceDampener);
                if (remainingDem <= 0) continue;

                var aff = affinityMap[exporter.id + '|' + importer.id] || 0;
                // Strategic necessity: fuel & energy trades even through poor relations
                // Floor scales with exporter capacity — major producers always find buyers
                if (sector.key === 'fuel_energy' && !(pairFlags && pairFlags.has_embargo)) {
                    var strategicFloor = Math.min(15, Math.round(nationFlows[exporter.id][sector.key].exportCapacity / 6));
                    if (aff < strategicFloor) aff = strategicFloor;
                }
                if (aff <= 0) continue;

                // Gravity-model weight: supply × demand × affinity
                var w = adjustedCap * remainingDem * aff;
                pairs.push({
                    expId: exporter.id,
                    impId: importer.id,
                    expCap: adjustedCap,
                    impDem: remainingDem,
                    affinity: aff,
                    weight: w,
                    volume: 0
                });
            }
        }

        if (pairs.length === 0) continue;

        // Build per-exporter and per-importer capacity/demand budgets
        var expBudget = {};  // expBudget[expId] = remaining capacity
        var impBudget = {};  // impBudget[impId] = remaining demand
        for (var pi = 0; pi < pairs.length; pi++) {
            var p = pairs[pi];
            if (expBudget[p.expId] == null) expBudget[p.expId] = p.expCap;
            if (impBudget[p.impId] == null) impBudget[p.impId] = p.impDem;
        }

        // Iterative proportional fitting (2 passes to handle caps)
        for (var pass = 0; pass < 2; pass++) {
            // Compute total weight per exporter and per importer
            var expWeightSum = {};
            var impWeightSum = {};
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                if (p.weight <= 0) continue;
                if (!expWeightSum[p.expId]) expWeightSum[p.expId] = 0;
                if (!impWeightSum[p.impId]) impWeightSum[p.impId] = 0;
                expWeightSum[p.expId] += p.weight;
                impWeightSum[p.impId] += p.weight;
            }

            // Allocate each pair: min of (exporter's share, importer's share)
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                if (p.weight <= 0) { p.volume = 0; continue; }

                // Share of this exporter's capacity going to this importer
                var expShare = (expBudget[p.expId] || 0) * (p.weight / (expWeightSum[p.expId] || 1));
                // Share of this importer's demand filled by this exporter
                var impShare = (impBudget[p.impId] || 0) * (p.weight / (impWeightSum[p.impId] || 1));
                p.volume = Math.round(Math.min(expShare, impShare));
            }

            // Update budgets: subtract allocated volumes, zero out fully-allocated pairs
            for (var eid in expBudget) expBudget[eid] = 0;
            for (var iid in impBudget) impBudget[iid] = 0;
            // First compute how much was allocated per exporter/importer
            var expUsed = {};
            var impUsed = {};
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                if (!expUsed[p.expId]) expUsed[p.expId] = 0;
                if (!impUsed[p.impId]) impUsed[p.impId] = 0;
                expUsed[p.expId] += p.volume;
                impUsed[p.impId] += p.volume;
            }
            // Recompute remaining budgets from original caps minus total used
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                expBudget[p.expId] = p.expCap - (expUsed[p.expId] || 0);
                impBudget[p.impId] = p.impDem - (impUsed[p.impId] || 0);
            }
            // Zero out weights for pairs where either side is exhausted
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                if ((expBudget[p.expId] || 0) <= 0 || (impBudget[p.impId] || 0) <= 0) {
                    p.weight = 0;
                }
            }
        }

        // Record final allocations
        for (var pi = 0; pi < pairs.length; pi++) {
            var p = pairs[pi];
            if (p.volume <= 0) continue;

            actualExports[p.expId][sector.key] += p.volume;
            actualImports[p.impId][sector.key] += p.volume;

            partnerRows.push({
                tick: currentTick,
                exporter_nation_id: p.expId,
                importer_nation_id: p.impId,
                sector: sector.key,
                trade_volume: p.volume,
                affinity_score: p.affinity
            });
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

        // Tariff revenue: calculated bilaterally to account for FTA/PTA tariff reductions
        var budget = budgetMap[n.id];
        var baseTariffRate = (Number(n.tariffs) || 0) / 100;
        var collectionRate = budget ? budget.collectionRate : 0.7;
        var tariffRev = 0;

        // Sum tariff revenue across all bilateral partner flows for this importer
        for (var pi = 0; pi < partnerRows.length; pi++) {
            var pr = partnerRows[pi];
            if (pr.importer_nation_id !== n.id) continue;
            var effectiveRate = baseTariffRate;
            // Apply FTA/PTA tariff reduction if one exists for this importer-exporter pair and sector
            var modKey = n.id + '|' + pr.exporter_nation_id;
            if (tariffModMap[modKey] && tariffModMap[modKey][pr.sector] !== undefined) {
                effectiveRate = baseTariffRate * (1 - tariffModMap[modKey][pr.sector]);
            }
            // Apply retaliatory tariff surcharge (stacks on top of effective rate)
            if (tariffSurchargeMap[modKey] && tariffSurchargeMap[modKey][pr.sector]) {
                effectiveRate += tariffSurchargeMap[modKey][pr.sector];
            }
            tariffRev += pr.trade_volume * effectiveRate * collectionRate;
        }
        tariffRev = Math.round(tariffRev);

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

        // ── Trade-driven stat nudges ──
        var nationUpdates = { trade_balance: tradeBalanceIdx };

        // GDP growth: trade volume (exports + imports) as % of GDP
        // Neutral at 50% of GDP; more trade = better growth, isolation = drag
        // Capped at ±0.2 per tick (~20% of max gdp_growth swing)
        var tradeVolume = totalExp + totalImp;
        var tradeVolumeRatio = gdp > 0 ? tradeVolume / gdp : 0;
        var tradeGdpNudge = Math.max(-0.2, Math.min(0.2, (tradeVolumeRatio - 0.5) * 0.4));
        if (Math.abs(tradeGdpNudge) >= 0.01) {
            var currentGdpGrowth = Number(n.gdp_growth) || 50;
            nationUpdates.gdp_growth = Math.round(Math.max(0, Math.min(100, currentGdpGrowth + tradeGdpNudge)) * 10) / 10;
        }

        // Currency strength: trade surplus strengthens currency, deficit weakens it
        // Gentler than GDP nudge: (tradeBalance - 50) / 100 → range -0.5 to +0.5 per tick
        var currentCurrency = Number(n.currency_strength) || 50;
        var currencyNudge = (tradeBalanceIdx - 50) / 100;
        if (Math.abs(currencyNudge) >= 0.01) {
            nationUpdates.currency_strength = Math.round(Math.max(0, Math.min(100, currentCurrency + currencyNudge)) * 10) / 10;
        }

        // Inflation from import prices: weighted average price modifier of imports
        // If average import prices > 1.0, inflation pressure rises (imported inflation)
        var importWeightedPrice = 0;
        var totalImpForPrice = 0;
        for (var si2 = 0; si2 < sectors.length; si2++) {
            var sKey2 = sectors[si2].key;
            var impVol2 = actualImports[n.id][sKey2] || 0;
            if (impVol2 > 0) {
                importWeightedPrice += impVol2 * (priceModifiers[sKey2] || 1.0);
                totalImpForPrice += impVol2;
            }
        }
        var avgImportPrice = totalImpForPrice > 0 ? importWeightedPrice / totalImpForPrice : 1.0;
        // Nudge inflation: (avgPrice - 1.0) scaled to ±0.5 per tick
        var currentInflation = Number(n.inflation) || 50;
        var inflationNudge = (avgImportPrice - 1.0) * 1.0; // price 1.5 → +0.5 nudge, price 0.7 → -0.3
        if (Math.abs(inflationNudge) >= 0.01) {
            nationUpdates.inflation = Math.round(Math.max(0, Math.min(100, currentInflation + inflationNudge)) * 10) / 10;
        }

        // Unemployment from trade displacement: net imports in job-heavy sectors (manufacturing + services)
        // indicate domestic producers being outcompeted → unemployment pressure
        var mfgNet = (actualImports[n.id]['manufactured_goods'] || 0) - (actualExports[n.id]['manufactured_goods'] || 0);
        var svcNet = (actualImports[n.id]['services_finance'] || 0) - (actualExports[n.id]['services_finance'] || 0);
        if (gdp > 0) {
            var displacementRatio = (mfgNet + svcNet) / gdp;
            // Positive ratio = net importer in job sectors → unemployment nudge up
            // Negative ratio = net exporter in job sectors → unemployment nudge down (job creation)
            var unemploymentNudge = Math.max(-0.5, Math.min(0.5, displacementRatio * 100));
            if (Math.abs(unemploymentNudge) >= 0.01) {
                var currentUnemployment = Number(n.unemployment) || 50;
                nationUpdates.unemployment = Math.round(Math.max(0, Math.min(100, currentUnemployment + unemploymentNudge)) * 10) / 10;
            }
        }

        // ── Unmet import demand consequences ──
        // When a nation needs imports but can't get them, critical sectors suffer.
        // Penalty scales with the unmet ratio: (demand - actual) / demand
        // Self-sufficient nations (demand = 0) are never penalized.
        for (var si3 = 0; si3 < sectors.length; si3++) {
            var sKey3 = sectors[si3].key;
            var demand3 = nationFlows[n.id][sKey3].importDemand;
            var actual3 = actualImports[n.id][sKey3] || 0;
            if (demand3 <= 0) continue;
            var unmetRatio = Math.max(0, (demand3 - actual3) / demand3);
            if (unmetRatio < 0.05) continue;

            var severity = unmetRatio * unmetRatio;

            if (sKey3 === 'fuel_energy') {
                var fuelEnergyPen = severity * 1.5;
                var fuelManufPen = severity * 1.0;
                var fuelInflation = severity * 1.0;
                var fuelCol = severity * 0.8;
                nationUpdates.energy_generation = Math.round(Math.max(0, (Number(n.energy_generation) || 50) - fuelEnergyPen) * 10) / 10;
                nationUpdates.manufacturing_output = Math.round(Math.max(0, (Number(n.manufacturing_output) || 50) - fuelManufPen) * 10) / 10;
                nationUpdates.inflation = Math.round(Math.min(100, (nationUpdates.inflation != null ? nationUpdates.inflation : (Number(n.inflation) || 50)) + fuelInflation) * 10) / 10;
                nationUpdates.cost_of_living = Math.round(Math.min(100, (Number(n.cost_of_living) || 50) + fuelCol) * 10) / 10;
            } else if (sKey3 === 'food_agriculture') {
                var foodHappiness = severity * 1.2;
                var foodUnrest = severity * 1.5;
                var foodHealth = severity * 0.8;
                nationUpdates.happiness = Math.round(Math.max(0, (Number(n.happiness) || 50) - foodHappiness) * 10) / 10;
                nationUpdates.civil_unrest = Math.round(Math.min(100, (Number(n.civil_unrest) || 0) + foodUnrest) * 10) / 10;
                nationUpdates.healthcare_quality = Math.round(Math.max(0, (Number(n.healthcare_quality) || 50) - foodHealth) * 10) / 10;
            } else if (sKey3 === 'minerals') {
                var minManuf = severity * 1.0;
                var minInfra = severity * 0.7;
                nationUpdates.manufacturing_output = Math.round(Math.max(0, (nationUpdates.manufacturing_output != null ? nationUpdates.manufacturing_output : (Number(n.manufacturing_output) || 50)) - minManuf) * 10) / 10;
                nationUpdates.infrastructure = Math.round(Math.max(0, (Number(n.infrastructure) || 50) - minInfra) * 10) / 10;
            } else if (sKey3 === 'manufactured_goods') {
                var mfgSol = severity * 1.0;
                var mfgCol = severity * 0.8;
                nationUpdates.standard_of_living = Math.round(Math.max(0, (Number(n.standard_of_living) || 50) - mfgSol) * 10) / 10;
                nationUpdates.cost_of_living = Math.round(Math.min(100, (nationUpdates.cost_of_living != null ? nationUpdates.cost_of_living : (Number(n.cost_of_living) || 50)) + mfgCol) * 10) / 10;
            } else if (sKey3 === 'technology') {
                var techDigi = severity * 0.8;
                var techInnov = severity * 0.8;
                nationUpdates.digital_infrastructure = Math.round(Math.max(0, (Number(n.digital_infrastructure) || 50) - techDigi) * 10) / 10;
                nationUpdates.innovation_index = Math.round(Math.max(0, (Number(n.innovation_index) || 50) - techInnov) * 10) / 10;
            } else if (sKey3 === 'arms') {
                var armsMil = severity * 1.0;
                nationUpdates.military_strength = Math.round(Math.max(0, (Number(n.military_strength) || 50) - armsMil) * 10) / 10;
            }
        }

        await supabase.from('nations')
            .update(nationUpdates)
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
        'total volume $' + Math.round(totalGlobalVolume).toLocaleString() +
        (rscPreAllocations.length > 0 ? ', ' + rscPreAllocations.length + ' RSC pre-allocations' : ''));

    return { processed: nationCount, totalVolume: totalGlobalVolume };
}
