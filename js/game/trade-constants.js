/**
 * trade-constants.js — Trade system constants and calculation functions
 * Extracted from game-common.js
 */

import { calculateNationalBudget } from './budget.js';

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
        export_stat: 'oil_and_gas',            // primary: must clear threshold on its own
        export_bonus_stats: ['energy_generation'], // secondary: adds to capacity but doesn't gate it
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
        export_threshold: 10
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

// ==================== SECTOR DISPLAY UNITS ====================
// Maps sector keys to real-world commodity units for human-readable volume display.
// Technology and services_finance are intentionally omitted — they display in currency.
//
// Calibration basis (BASE_TRADE_MULTIPLIER = $500M, BASELINE_GDP = $100B):
//   A typical mid-GDP nation with stat=50 produces ~$5B capacity per sector.
//   fuel_energy $2.5B → 1 million barrels a day  (Saudi Arabia ≈ 10 Mbbl/d)
//   others      $100M → 1 unit                   (mid-tier exporter ≈ 50 units)
export var SECTOR_DISPLAY_UNITS = {
    fuel_energy:        { baseUnit: 'barrels per day',    scaleLabel: 'million',  scaleFactor: 1e6,  factor: 1 / 2500000000 },
    food_agriculture:   { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6,  factor: 1 / 4000000000 },
    grains_staples:     { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6,  factor: 1 / 4000000000 },
    livestock_dairy:    { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6,  factor: 1 / 4000000000 },
    fruits_vegetables:  { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6,  factor: 1 / 4000000000 },
    cash_crops:         { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6,  factor: 1 / 4000000000 },
    minerals:           { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6,  factor: 1 / 100000000  },
    manufactured_goods: { baseUnit: 'TEU/year',           scaleLabel: 'thousand', scaleFactor: 1e3,  factor: 1 / 100000000  },
    arms:               { baseUnit: 'units/year',         scaleLabel: 'thousand', scaleFactor: 1e3,  factor: 1 / 100000000  },
    tourism:            { baseUnit: 'visitor-days/year',   scaleLabel: 'million',  scaleFactor: 1e6,  factor: 1 / 100000000  },
};

/**
 * Format a trade volume in real-world commodity units.
 * Returns null for sectors that use currency display (technology, services_finance).
 * Values below the scale threshold (e.g. < 1 million) are shown as raw numbers
 * with commas (e.g. "340,000 barrels per day").
 * @param {number} val       - internal dollar value
 * @param {string} sectorKey - sector key
 * @returns {string|null}
 */
export function formatSectorVolume(val, sectorKey) {
    var def = SECTOR_DISPLAY_UNITS[sectorKey];
    if (!def) return null;
    var scaled = (Number(val) || 0) * def.factor;  // value in scaled units (e.g. millions)
    var abs = Math.abs(scaled);
    var sign = scaled < 0 ? '-' : '';
    if (abs >= 1) {
        // Show with scale label: "4.00 million barrels per day"
        var str = abs >= 100 ? abs.toFixed(0) : abs >= 10 ? abs.toFixed(1) : abs.toFixed(2);
        return sign + str + '\u00a0' + def.scaleLabel + ' ' + def.baseUnit;
    }
    // Below scale threshold: show raw number with commas: "340,000 barrels per day"
    var raw = Math.round(abs * def.scaleFactor);
    return sign + raw.toLocaleString() + '\u00a0' + def.baseUnit;
}

// ==================== FOOD & AGRICULTURE — 4-SECTOR SPLIT ====================
//
// The single "food_agriculture" trade sector is split into four sub-sectors,
// each competing for a nation's arable land allocation:
//
//   grains_staples      — survival sector, stockpilable, famine events
//   livestock_dairy     — middle class diet, demand scales with wealth
//   fruits_vegetables   — infrastructure-dependent, spoilage mechanic
//   cash_crops          — export revenue vs food security tension
//
// Arable land allocation: grains% + livestock% + perishables% + cash_crops% = 100%
// Stored in food_land_allocation table; effective land = nation.arable_land × (allocation% / 100)

/**
 * Food sub-sector definitions.
 *
 * Each sub-sector has:
 *   key               – unique identifier (used in trade_flows.sector column)
 *   label             – display name
 *   parent_sector     – parent trade sector key (always 'food_agriculture')
 *   allocation_key    – column name in food_land_allocation table
 *   export_threshold  – minimum effective arable land to generate exports (0-100 scale)
 *   export_multiplier – capacity reduction factor (domestic consumption priority)
 *   drivers           – nation stats that boost production capacity
 *   demand_drivers    – nation stats that drive import demand
 *   stat_effects      – stats affected by supply/shortage of this sub-sector
 */
export var FOOD_SUBSECTORS = [
    {
        key: 'grains_staples',
        label: 'Grains & Staples',
        description: 'Wheat, rice, corn, soybeans, legumes, cooking oils, sugar',
        parent_sector: 'food_agriculture',
        allocation_key: 'grains_pct',
        export_threshold: 5,
        export_multiplier: 0.07,
        drivers: [
            { stat: 'arable_land', weight: 1.0 },
            { stat: 'physical_infrastructure', weight: 0.3 },
            { stat: 'rail_network', weight: 0.2 }
        ],
        demand_drivers: [
            { stat: 'population', weight: 1.0, type: 'population' },
            { stat: 'population_growth', weight: 0.3, type: 'pressure' }
        ],
        stat_effects: {
            supplied: {
                poverty_rate: -0.15,
                cost_of_living: -0.10,
                inflation: -0.05,
                stability: 0.10,
                legitimacy: 0.10,
                happiness: 0.05,
                lifespan: 0.05
            },
            shortage: {
                poverty_rate: 0.30,
                cost_of_living: 0.20,
                inflation: 0.15,
                stability: -0.20,
                legitimacy: -0.20,
                civil_unrest: 0.25,
                political_violence: 0.15,
                emigration: 0.10,
                happiness: -0.15
            }
        },
        food_security_weight: 0.50,
        stockpilable: true
    },
    {
        key: 'livestock_dairy',
        label: 'Livestock & Dairy',
        description: 'Cattle, poultry, pigs, sheep, eggs, milk, cheese',
        parent_sector: 'food_agriculture',
        allocation_key: 'livestock_pct',
        export_threshold: 3,
        export_multiplier: 0.06,
        drivers: [
            { stat: 'arable_land', weight: 1.0 },
            { stat: 'physical_infrastructure', weight: 0.25 },
            { stat: 'unemployment', weight: 0.15, inverted: true }
        ],
        demand_drivers: [
            { stat: 'standard_of_living', weight: 0.8, type: 'wealth' },
            { stat: 'population', weight: 0.5, type: 'population' }
        ],
        stat_effects: {
            supplied: {
                standard_of_living: 0.10,
                happiness: 0.10,
                healthcare_quality: 0.05,
                lifespan: 0.05,
                unemployment: -0.08,
                labor_force_participation: 0.05
            },
            shortage: {
                cost_of_living: 0.15,
                inflation: 0.10,
                standard_of_living: -0.10,
                happiness: -0.10
            }
        },
        environmental_effects: {
            carbon_emissions: 0.10,
            pollution: 0.08
        },
        food_security_weight: 0.20,
        stockpilable: false
    },
    {
        key: 'fruits_vegetables',
        label: 'Fruits, Vegetables & Perishables',
        description: 'Fresh produce, market gardens, fishing, aquaculture',
        parent_sector: 'food_agriculture',
        allocation_key: 'perishables_pct',
        export_threshold: 3,
        export_multiplier: 0.05,
        drivers: [
            { stat: 'arable_land', weight: 1.0 },
            { stat: 'physical_infrastructure', weight: 0.5, critical: true },
            { stat: 'rail_network', weight: 0.5, critical: true },
            { stat: 'energy_generation', weight: 0.3 }
        ],
        demand_drivers: [
            { stat: 'urbanization', weight: 0.6, type: 'demand' },
            { stat: 'population', weight: 0.5, type: 'population' },
            { stat: 'standard_of_living', weight: 0.3, type: 'wealth' }
        ],
        stat_effects: {
            supplied: {
                happiness: 0.12,
                healthcare_quality: 0.10,
                lifespan: 0.08,
                standard_of_living: 0.08
            },
            shortage: {
                cost_of_living: 0.15,
                inflation: 0.10,
                happiness: -0.10,
                healthcare_quality: -0.05
            }
        },
        environmental_effects: {
            pollution: 0.05
        },
        // UNIQUE MECHANIC: Spoilage multiplier
        // When rail_network or physical_infrastructure fall below threshold,
        // effective supply is reduced regardless of production levels.
        spoilage: {
            rail_threshold: 40,
            infra_threshold: 35,
            energy_threshold: 30,
            max_spoilage_pct: 60
        },
        food_security_weight: 0.15,
        stockpilable: false
    },
    {
        key: 'cash_crops',
        label: 'Cash Crops & Plantation Agriculture',
        description: 'Coffee, tea, cocoa, tobacco, cotton, rubber, spices, palm oil',
        parent_sector: 'food_agriculture',
        allocation_key: 'cash_crops_pct',
        export_threshold: 4,
        export_multiplier: 0.14,
        drivers: [
            { stat: 'arable_land', weight: 1.0 },
            { stat: 'foreign_investment', weight: 0.4 },
            { stat: 'currency_strength', weight: 0.3, inverted: true },
            { stat: 'corruption', weight: 0.2 }
        ],
        demand_drivers: [
            // Cash crops are primarily EXPORT-driven; import demand is low
            { stat: 'standard_of_living', weight: 0.3, type: 'wealth' },
            { stat: 'population', weight: 0.2, type: 'population' }
        ],
        stat_effects: {
            supplied: {
                gdp_growth: 0.10,
                foreign_investment: 0.08,
                unemployment: -0.08,
                labor_force_participation: 0.06,
                currency_strength: 0.05
            },
            shortage: {
                // Cash crop shortage doesn't cause food insecurity
                // but hurts export revenue
                gdp_growth: -0.05,
                foreign_investment: -0.05
            }
        },
        // Negative externalities of plantation agriculture
        structural_effects: {
            income_inequality: 0.08,
            poverty_rate: 0.05,
            social_mobility: -0.05,
            corruption: 0.05,
            union_strength: 0.03
        },
        environmental_effects: {
            pollution: 0.08,
            carbon_emissions: 0.06
        },
        food_security_weight: 0.00,
        stockpilable: true
    }
];

// Lookup maps for food sub-sectors
export var FOOD_SUBSECTOR_KEYS = [];
export var FOOD_SUBSECTOR_MAP = {};
for (var _fsi = 0; _fsi < FOOD_SUBSECTORS.length; _fsi++) {
    FOOD_SUBSECTOR_KEYS.push(FOOD_SUBSECTORS[_fsi].key);
    FOOD_SUBSECTOR_MAP[FOOD_SUBSECTORS[_fsi].key] = FOOD_SUBSECTORS[_fsi];
}

/**
 * Check if a sector key is a food sub-sector.
 */
export function isFoodSubsector(sectorKey) {
    return FOOD_SUBSECTOR_MAP.hasOwnProperty(sectorKey);
}

/**
 * Get the effective arable land for a specific food sub-sector.
 *
 * effectiveLand = nation.arable_land × (allocation_pct / 100)
 *
 * @param {Object} nation      – nation row with arable_land stat (0-100)
 * @param {string} subsectorKey – food sub-sector key
 * @param {Object} allocation  – food_land_allocation row { grains_pct, livestock_pct, perishables_pct, cash_crops_pct }
 * @returns {number} effective arable land (0-100 scale)
 */
export function getEffectiveArableLand(nation, subsectorKey, allocation) {
    var subsector = FOOD_SUBSECTOR_MAP[subsectorKey];
    if (!subsector || !allocation) return 0;
    var totalArable = Number(nation.arable_land) || 0;
    var allocPct = Number(allocation[subsector.allocation_key]) || 0;
    return totalArable * (allocPct / 100);
}

/**
 * Calculate the spoilage multiplier for perishables.
 *
 * When rail_network and/or physical_infrastructure fall below thresholds,
 * effective supply is reduced — the nation can produce abundantly and still
 * face shortage due to logistics failure.
 *
 * @param {Object} nation – nation row with infrastructure stats
 * @returns {number} multiplier 0.4–1.0 (1.0 = no spoilage, 0.4 = maximum spoilage)
 */
export function calculateSpoilageMultiplier(nation) {
    var cfg = FOOD_SUBSECTOR_MAP.fruits_vegetables.spoilage;
    var rail = Number(nation.rail_network) || 0;
    var infra = Number(nation.physical_infrastructure) || 0;
    var energy = Number(nation.energy_generation) || 0;

    var spoilagePct = 0;

    // Rail below threshold: major spoilage (cannot move perishables fast enough)
    if (rail < cfg.rail_threshold) {
        spoilagePct += ((cfg.rail_threshold - rail) / cfg.rail_threshold) * 30;
    }

    // Infrastructure below threshold: cold chain failure
    if (infra < cfg.infra_threshold) {
        spoilagePct += ((cfg.infra_threshold - infra) / cfg.infra_threshold) * 20;
    }

    // Energy below threshold: refrigeration failure
    if (energy < cfg.energy_threshold) {
        spoilagePct += ((cfg.energy_threshold - energy) / cfg.energy_threshold) * 10;
    }

    // Cap at maximum spoilage
    spoilagePct = Math.min(spoilagePct, cfg.max_spoilage_pct);

    return 1 - (spoilagePct / 100);
}

/**
 * Default arable land allocation if no food_land_allocation row exists.
 * Mirrors the schema defaults in the food_land_allocation table.
 */
export var DEFAULT_FOOD_ALLOCATION = {
    grains_pct: 40,
    livestock_pct: 20,
    perishables_pct: 20,
    cash_crops_pct: 20
};

// ==================== GLOBAL AVERAGE UNIT PRICE ====================

/**
 * Base price per physical unit (tonnes) for food sub-sectors.
 * Derived from SECTOR_DISPLAY_UNITS: factor = 1/4000000000 means $4B = 1M tonnes,
 * so 1 tonne = $4,000 game-scale at price_modifier 1.0.
 * This absorbs the BASE_TRADE_MULTIPLIER inflation to produce realistic tonnage.
 */
export var FOOD_BASE_PRICE_PER_TONNE = 4000;

/**
 * Get the global average price per tonne for a food sub-sector.
 *
 * @param {string} sectorKey  – food sub-sector key
 * @param {number} priceMod   – current price_modifier from trade_flows (0.5–2.0)
 * @returns {number} price per tonne in dollars
 */
export function getGlobalAverageUnitPrice(sectorKey, priceMod) {
    var mod = Number(priceMod) || 1.0;
    return Math.round(FOOD_BASE_PRICE_PER_TONNE * mod * 100) / 100;
}

/**
 * Format a price per tonne for display.
 * @param {number} pricePerTonne – dollars per tonne
 * @returns {string} e.g. "$92/tonne"
 */
export function formatPricePerTonne(pricePerTonne) {
    var p = Number(pricePerTonne) || 0;
    if (p >= 1000) return '$' + (p / 1000).toFixed(1) + 'K/tonne';
    return '$' + Math.round(p) + '/tonne';
}

// ==================== STOCKPILE MECHANICS ====================

/**
 * Stockpile configuration for sectors where stockpilable = true.
 *
 * Spoilage: percentage of reserves lost per tick to degradation.
 * Scales with infrastructure — good warehousing halves spoilage.
 *
 * Capacity: max reserve = GDP × capacityFactor × (physical_infrastructure / 50).
 * Converted to tonnes via display unit factor.
 */
export var STOCKPILE_CONFIG = {
    grains_staples: {
        baseSpoilagePct: 2.0,       // 2% per tick (grain stores well)
        infraThreshold: 60,          // infra above this halves spoilage
        capacityFactor: 0.005,       // 0.5% of GDP as max reserve value
        securityMonths: 6            // months of reserves for "food secure" bonus
    },
    cash_crops: {
        baseSpoilagePct: 4.0,       // 4% per tick (cocoa, coffee degrade faster)
        infraThreshold: 60,
        capacityFactor: 0.003,       // 0.3% of GDP (less strategic need)
        securityMonths: 3
    }
};

/**
 * Calculate spoilage rate for a nation's stockpile.
 *
 * @param {string} sectorKey – stockpilable sector key
 * @param {Object} nation    – nation row with physical_infrastructure
 * @returns {number} spoilage percentage per tick (0–100)
 */
export function calculateStockpileSpoilage(sectorKey, nation) {
    var cfg = STOCKPILE_CONFIG[sectorKey];
    if (!cfg) return 0;
    var basePct = cfg.baseSpoilagePct;
    var infra = Number(nation.physical_infrastructure) || 0;
    if (infra >= cfg.infraThreshold) {
        basePct *= 0.5; // Good warehousing halves spoilage
    } else if (infra < 30) {
        basePct *= 2.0; // Poor infrastructure doubles spoilage
    }
    return Math.round(basePct * 100) / 100;
}

/**
 * Calculate maximum stockpile capacity in dollar value.
 *
 * @param {string} sectorKey – stockpilable sector key
 * @param {Object} nation    – nation row with gdp, physical_infrastructure
 * @returns {number} max capacity in dollars
 */
export function calculateStockpileCapacity(sectorKey, nation) {
    var cfg = STOCKPILE_CONFIG[sectorKey];
    if (!cfg) return 0;
    var gdp = Number(nation.gdp) || 0;
    var infra = Number(nation.physical_infrastructure) || 50;
    return Math.round(gdp * cfg.capacityFactor * (infra / 50));
}

/**
 * Calculate months of reserves coverage.
 *
 * @param {number} reserveValue     – current stockpile in dollars
 * @param {number} monthlyConsumption – domestic consumption per tick (dollars)
 * @returns {number} months of coverage
 */
export function calculateReserveMonths(reserveValue, monthlyConsumption) {
    if (!monthlyConsumption || monthlyConsumption <= 0) return 99;
    return Math.round((reserveValue / monthlyConsumption) * 10) / 10;
}

// ==================== FOOD SECURITY STATUS ====================

/**
 * Food security status labels and thresholds.
 *
 * Computed from the ratio of effective food supply (production + imports)
 * to food demand across the 3 food-security sectors (grains, livestock,
 * perishables). Cash crops are excluded — they don't feed people.
 */
export var FOOD_SECURITY_LEVELS = [
    { key: 'surplus',     label: 'Surplus',          min: 1.10, color: '#5cb85c', description: 'Production exceeds demand. Food exports generate revenue.' },
    { key: 'secure',      label: 'Secure',           min: 0.90, color: '#4a9a5b', description: 'Adequate supply. Minor shortfalls covered by imports.' },
    { key: 'adequate',    label: 'Adequate',          min: 0.75, color: '#8ab563', description: 'Sufficient but fragile. Disruptions could trigger shortage.' },
    { key: 'strained',    label: 'Strained',          min: 0.60, color: '#d48a3c', description: 'Import-dependent. Trade disruption risks food shortage.' },
    { key: 'shortage',    label: 'Shortage',          min: 0.40, color: '#c0392b', description: 'Significant food deficit. Rationing likely.' },
    { key: 'crisis',      label: 'Crisis',            min: 0.20, color: '#8b0000', description: 'Severe food insecurity. Famine conditions emerging.' },
    { key: 'famine',      label: 'Famine',            min: 0.00, color: '#4a0000', description: 'Catastrophic food failure. Mass starvation imminent.' }
];

/**
 * Compute food security status for a nation based on trade_flows data.
 *
 * Uses the 3 food-security sectors (grains, livestock, perishables) weighted
 * by their food_security_weight values. Cash crops are excluded.
 *
 * Supply = domestic production (export_capacity) + actual imports (import_volume)
 * Demand = import_demand + domestic consumption (approximated from export_capacity)
 *
 * For simplicity, the ratio is computed as:
 *   (total supply that reached the population) / (total demand the population has)
 *
 * @param {Object} flows – { [sectorKey]: { export_capacity, export_volume, import_demand, import_volume } }
 * @returns {Object} { ratio, level, label, color, description, perSector }
 */
export function computeFoodSecurityStatus(flows) {
    if (!flows) return { ratio: 1.0, level: 'secure', label: 'Secure', color: '#4a9a5b', description: 'No data available.', perSector: {} };

    var totalWeightedSupply = 0;
    var totalWeightedDemand = 0;
    var perSector = {};

    for (var i = 0; i < FOOD_SUBSECTORS.length; i++) {
        var sub = FOOD_SUBSECTORS[i];
        if (sub.food_security_weight <= 0) continue; // Skip cash crops

        var flow = flows[sub.key];
        if (!flow) continue;

        var expCap = Number(flow.export_capacity) || 0;
        var expVol = Number(flow.export_volume) || 0;
        var impVol = Number(flow.import_volume) || 0;
        var impDem = Number(flow.import_demand) || 0;

        // Domestic supply = what we produced minus what we exported + what we imported
        var domesticProduction = expCap; // Total production capacity
        var domesticRetained = Math.max(0, domesticProduction - expVol); // Kept for domestic use
        var totalSupply = domesticRetained + impVol;

        // Total demand = domestic need + desired imports (import_demand represents the gap)
        // Domestic need ≈ production capacity (we produce to meet demand)
        // But actual total demand = domestic consumption + the unmet portion
        var totalDemand = domesticRetained + impDem;
        if (totalDemand <= 0) totalDemand = 1; // Prevent division by zero

        var sectorRatio = totalSupply / totalDemand;
        var weight = sub.food_security_weight;

        totalWeightedSupply += sectorRatio * weight;
        totalWeightedDemand += weight;

        perSector[sub.key] = {
            supply: totalSupply,
            demand: totalDemand,
            ratio: Math.round(sectorRatio * 100) / 100,
            label: sub.label
        };
    }

    var ratio = totalWeightedDemand > 0 ? totalWeightedSupply / totalWeightedDemand : 1.0;
    ratio = Math.round(ratio * 100) / 100;

    // Find matching security level
    var level = FOOD_SECURITY_LEVELS[FOOD_SECURITY_LEVELS.length - 1];
    for (var j = 0; j < FOOD_SECURITY_LEVELS.length; j++) {
        if (ratio >= FOOD_SECURITY_LEVELS[j].min) {
            level = FOOD_SECURITY_LEVELS[j];
            break;
        }
    }

    return {
        ratio: ratio,
        level: level.key,
        label: level.label,
        color: level.color,
        description: level.description,
        perSector: perSector
    };
}

/**
 * Compute stat effects from food sub-sector supply/shortage conditions.
 *
 * Called per-tick to apply ongoing stat nudges based on whether each
 * food sub-sector is well-supplied or in shortage. Effects are defined
 * in the FOOD_SUBSECTORS[].stat_effects config.
 *
 * @param {Object} flows – trade_flows for this nation { [sectorKey]: { ... } }
 * @returns {Object} accumulated stat deltas { statKey: delta, ... }
 */
export function computeFoodStatEffects(flows) {
    var effects = {};
    if (!flows) return effects;

    for (var i = 0; i < FOOD_SUBSECTORS.length; i++) {
        var sub = FOOD_SUBSECTORS[i];
        var flow = flows[sub.key];
        if (!flow) continue;

        var impDem = Number(flow.import_demand) || 0;
        var impVol = Number(flow.import_volume) || 0;
        var expCap = Number(flow.export_capacity) || 0;

        // Determine supply status
        var unmetRatio = impDem > 0 ? Math.max(0, (impDem - impVol) / impDem) : 0;
        var isShortage = unmetRatio >= 0.10;
        var isWellSupplied = unmetRatio < 0.05 && expCap > 0;

        var effectSet;
        var intensity;
        if (isShortage) {
            effectSet = sub.stat_effects.shortage;
            intensity = Math.min(1.0, unmetRatio); // Scale with severity
        } else if (isWellSupplied) {
            effectSet = sub.stat_effects.supplied;
            intensity = 1.0;
        } else {
            continue; // Neutral zone — no effects
        }

        if (!effectSet) continue;

        for (var statKey in effectSet) {
            var delta = effectSet[statKey] * intensity;
            if (!effects[statKey]) effects[statKey] = 0;
            effects[statKey] += delta;
        }

        // Environmental effects (always active when producing)
        if (sub.environmental_effects && expCap > 0) {
            var envIntensity = Math.min(1.0, expCap / 500000000); // Scale with production volume
            for (var envKey in sub.environmental_effects) {
                var envDelta = sub.environmental_effects[envKey] * envIntensity;
                if (!effects[envKey]) effects[envKey] = 0;
                effects[envKey] += envDelta;
            }
        }

        // Structural effects for cash crops (always active when producing)
        if (sub.structural_effects && expCap > 0) {
            var structIntensity = Math.min(1.0, expCap / 500000000);
            for (var structKey in sub.structural_effects) {
                var structDelta = sub.structural_effects[structKey] * structIntensity;
                if (!effects[structKey]) effects[structKey] = 0;
                effects[structKey] += structDelta;
            }
        }
    }

    return effects;
}

/**
 * Build the effective sector list for trade processing.
 * Replaces 'food_agriculture' with the 4 food sub-sectors.
 * Non-food sectors pass through unchanged.
 *
 * @returns {Array} sector objects for trade engine iteration
 */
export function buildEffectiveSectorList() {
    var result = [];
    for (var i = 0; i < TRADE_SECTORS.length; i++) {
        if (TRADE_SECTORS[i].key === 'food_agriculture') {
            // Replace with 4 sub-sectors
            for (var j = 0; j < FOOD_SUBSECTORS.length; j++) {
                result.push(FOOD_SUBSECTORS[j]);
            }
        } else {
            result.push(TRADE_SECTORS[i]);
        }
    }
    return result;
}

// ==================== FOOD SUB-SECTOR CALCULATION FUNCTIONS ====================

/**
 * Calculate export capacity for a food sub-sector.
 *
 * Uses effective arable land (total arable × allocation %) as the primary
 * driver, modified by sub-sector-specific stat drivers.
 *
 * @param {Object} nation      – nation row with all stats
 * @param {Object} subsector   – FOOD_SUBSECTORS entry
 * @param {Object} allocation  – food_land_allocation row (or DEFAULT_FOOD_ALLOCATION)
 * @returns {number} export capacity in dollars
 */
/**
 * Gross domestic production of a food sub-sector for a nation, per tick.
 * After spoilage (perishables) + stability, BEFORE domestic-need
 * subtraction and BEFORE the export_multiplier / currency / floor.
 * This is what the farms actually produce.
 */
export function calculateFoodDomesticProduction(nation, subsector, allocation) {
    var cfg = TRADE_CONFIG;

    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = gdp / cfg.BASELINE_GDP;
    if (gdpModifier <= 0) return 0;

    // Food production is LAND-driven, not GDP-driven.
    // Use sqrt(gdpModifier) so economy matters but land dominates.
    var econScale = Math.sqrt(gdpModifier);

    var effectiveLand = getEffectiveArableLand(nation, subsector.key, allocation);
    if (effectiveLand <= (subsector.export_threshold || 0)) return 0;

    var normalizedScore = effectiveLand / 5;

    // Apply stat driver bonuses (secondary drivers boost capacity by up to ~30%)
    var driverBonus = 1.0;
    var drivers = subsector.drivers;
    for (var i = 0; i < drivers.length; i++) {
        var d = drivers[i];
        if (d.stat === 'arable_land') continue;
        var val = Number(nation[d.stat]) || 0;
        if (d.inverted) val = 100 - val;
        var bonus = ((val - 50) / 50) * d.weight * 0.3;
        driverBonus += bonus;
    }
    driverBonus = Math.max(0.5, Math.min(1.5, driverBonus));

    var totalProduction = normalizedScore * cfg.BASE_TRADE_MULTIPLIER * econScale * driverBonus;

    // Spoilage for perishables reduces actual farm output
    if (subsector.key === 'fruits_vegetables') {
        totalProduction *= calculateSpoilageMultiplier(nation);
    }

    // Stability (political disruption reduces real farm output)
    var stability = Number(nation.stability ?? 50);
    var stabilityMod = Math.min(1.0, stability / 40);
    totalProduction *= stabilityMod;

    return Math.round(totalProduction);
}

export function calculateFoodExportCapacity(nation, subsector, allocation) {
    var cfg = TRADE_CONFIG;
    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = gdp / cfg.BASELINE_GDP;
    if (gdpModifier <= 0) return 0;
    var econScale = Math.sqrt(gdpModifier);

    var totalProduction = calculateFoodDomesticProduction(nation, subsector, allocation);
    if (totalProduction <= 0) return 0;

    // ── Domestic demand cap: nations feed their own people first ──
    // Subtract domestic need from production BEFORE the export fraction
    // so the demand check operates at the right scale.
    var popNorm = (Number(nation.population) || 1) / 5000000;
    var domesticNeed = 0;

    if (subsector.key === 'grains_staples') {
        domesticNeed = popNorm * cfg.BASE_TRADE_MULTIPLIER * 0.45;
    } else if (subsector.key === 'livestock_dairy') {
        var sol = (Number(nation.standard_of_living ?? 50)) / 100;
        domesticNeed = popNorm * (0.3 + sol * 0.7) * cfg.BASE_TRADE_MULTIPLIER * 0.25;
    } else if (subsector.key === 'fruits_vegetables') {
        var urban = (Number(nation.urbanization ?? 50)) / 100;
        var solFV = (Number(nation.standard_of_living ?? 50)) / 100;
        domesticNeed = popNorm * (0.4 + urban * 0.4 + solFV * 0.3) * cfg.BASE_TRADE_MULTIPLIER * 0.2;
    } else if (subsector.key === 'cash_crops') {
        domesticNeed = popNorm * cfg.BASE_TRADE_MULTIPLIER * 0.04;
    }

    var surplus = totalProduction;
    if (domesticNeed > 0) {
        surplus = Math.max(0, totalProduction - domesticNeed);
    }

    // Export fraction of the surplus (most food stays domestic)
    var capacity = surplus * subsector.export_multiplier;

    // Currency strength modifier on EXPORTS
    var currencyStrength = Number(nation.currency_strength ?? 50);
    var currencyModifier = currencyStrength > 0 ? 50 / currencyStrength : 1;
    capacity *= currencyModifier;

    // Floor: minimal organic trade
    var minCapacity = Math.round(0.002 * cfg.BASE_TRADE_MULTIPLIER * econScale);
    return Math.max(minCapacity, Math.round(capacity));
}

/**
 * Calculate import demand for a food sub-sector.
 *
 * Each sub-sector has distinct demand drivers:
 *   grains_staples:    population-driven (everyone eats)
 *   livestock_dairy:   wealth-driven (standard_of_living scales demand)
 *   fruits_vegetables: urbanization + wealth driven
 *   cash_crops:        low import demand (export-oriented sector)
 *
 * @param {Object} nation      – nation row
 * @param {Object} subsector   – FOOD_SUBSECTORS entry
 * @param {Object} allocation  – food_land_allocation row (or DEFAULT_FOOD_ALLOCATION)
 * @returns {number} import demand in dollars
 */
export function calculateFoodImportDemand(nation, subsector, allocation) {
    var cfg = TRADE_CONFIG;
    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = gdp / cfg.BASELINE_GDP;
    var popNorm = (Number(nation.population) || 1) / 5000000;

    var grossDemand = 0;
    var domesticCoverage = 0;

    // Effective arable land for this sub-sector
    var effectiveLand = getEffectiveArableLand(nation, subsector.key, allocation);

    if (subsector.key === 'grains_staples') {
        // GRAINS: population-driven. Everyone needs staples.
        // Population growth creates additional pressure.
        var popGrowth = Number(nation.population_growth ?? 50);
        var growthPressure = Math.max(0, (popGrowth - 40) / 60) * 0.3;
        grossDemand = popNorm * (1.0 + growthPressure) * cfg.BASE_TRADE_MULTIPLIER * 0.45;

        // Domestic coverage: effective land scaled by population pressure
        // Large populations outstrip local farming even with good land
        domesticCoverage = (effectiveLand / 100) / Math.max(0.3, popNorm * 0.5);
    }

    else if (subsector.key === 'livestock_dairy') {
        // LIVESTOCK: wealth-driven. Demand scales with standard of living.
        // Poor nations eat little meat; wealthy nations demand a lot.
        var sol = (Number(nation.standard_of_living ?? 50)) / 100;
        grossDemand = popNorm * (0.3 + sol * 0.7) * cfg.BASE_TRADE_MULTIPLIER * 0.25;

        // Domestic coverage: effective land, but less efficient (feed crops compete)
        domesticCoverage = (effectiveLand / 100) / Math.max(0.2, popNorm * 0.4);
    }

    else if (subsector.key === 'fruits_vegetables') {
        // PERISHABLES: urbanization + wealth driven.
        // Urban populations need organized food supply chains.
        var urban = (Number(nation.urbanization ?? 50)) / 100;
        var sol = (Number(nation.standard_of_living ?? 50)) / 100;
        grossDemand = popNorm * (0.4 + urban * 0.4 + sol * 0.3) * cfg.BASE_TRADE_MULTIPLIER * 0.2;

        // Domestic coverage reduced by spoilage — production means nothing
        // without distribution infrastructure
        var spoilage = calculateSpoilageMultiplier(nation);
        domesticCoverage = ((effectiveLand / 100) / Math.max(0.2, popNorm * 0.5)) * spoilage;
    }

    else if (subsector.key === 'cash_crops') {
        // CASH CROPS: low import demand. These are export commodities.
        // Nations import coffee, tea, cocoa for domestic consumption but
        // volumes are small compared to staples.
        var sol = (Number(nation.standard_of_living ?? 50)) / 100;
        grossDemand = popNorm * (0.15 + sol * 0.2) * cfg.BASE_TRADE_MULTIPLIER * 0.12;

        // High domestic coverage if you grow them
        domesticCoverage = (effectiveLand / 100) / Math.max(0.15, popNorm * 0.3);
    }

    // Apply domestic coverage
    domesticCoverage = Math.min(1.0, Math.max(0, domesticCoverage));
    var rawDemand = grossDemand * (1 - domesticCoverage);

    if (rawDemand <= 0) return 0;

    // Currency strength: weak currency = imports cost more = can afford less
    var currencyStrength = Number(nation.currency_strength ?? 50);
    var affordability = currencyStrength / 50;
    rawDemand *= affordability;

    // Tariff dampener
    var tariffs = Number(nation.tariffs) || 0;
    var tariffDampener = 1 - (tariffs / 200);
    rawDemand *= tariffDampener;

    // Floor
    var minDemand = Math.round(0.005 * cfg.BASE_TRADE_MULTIPLIER * gdpModifier);
    return Math.max(minDemand, Math.round(rawDemand));
}

// ==================== TRADE CALCULATION FUNCTIONS ====================

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
// Resource sectors: production is a fixed endowment (no GDP scaling).
// You have oil in the ground or you don't — GDP doesn't create more.
var RESOURCE_SECTORS = new Set(['fuel_energy', 'minerals', 'food_agriculture',
    'grains_staples', 'livestock_dairy', 'fruits_vegetables', 'cash_crops']);

/**
 * Calculate a nation's gross domestic production for a given sector.
 * Returns the raw output the nation generates each tick BEFORE domestic
 * demand is subtracted and BEFORE currency/export modifiers are applied.
 * Stability is baked in — political chaos reduces real output.
 *
 * This is the number the UI should show as "Prod": what the nation
 * actually makes, not what's left over to export.
 */
export function calculateDomesticProduction(nation, sector, opts) {
    var cfg = TRADE_CONFIG;

    // Resource sectors (oil, minerals, food) are fixed endowments — no GDP scaling.
    // Industrial/service sectors scale with economic size (sqrt for diminishing returns).
    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = RESOURCE_SECTORS.has(sector.key) ? 1.0 : Math.sqrt(gdp / cfg.BASELINE_GDP);
    if (gdpModifier <= 0) return 0;

    // Primary score: must clear threshold on its own. Bonus stats can add but not gate.
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

    if (score <= (sector.export_threshold || 0)) return 0;

    if (sector.export_bonus_stats) {
        var bonusSum = 0;
        for (var bi = 0; bi < sector.export_bonus_stats.length; bi++) {
            bonusSum += Number(nation[sector.export_bonus_stats[bi]]) || 0;
        }
        var bonusAvg = bonusSum / sector.export_bonus_stats.length;
        score += Math.min(score * 0.5, bonusAvg * 0.3); // bonus capped at 50% of primary, weighted at 30%
    }

    // Normalize from 0-100 codebase scale to 0-20 spec scale
    var normalizedScore = score / 5;
    var totalProduction = normalizedScore * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;

    // ── Sector-specific production scaling ──
    if (sector.key === 'food_agriculture') {
        totalProduction *= 0.167;  // tighter supply (equivalent to /30 normalization)
    }
    if (sector.key === 'arms') {
        var defensePct = (opts && opts.defense_pct) || 0;
        if (defensePct <= 8) return 0;
        totalProduction *= (defensePct / 15);  // 15% defense spending = 1.0 multiplier
    }
    if (sector.key === 'tourism') {
        totalProduction *= 0.5;
        if ((Number(nation.stability) || 0) <= 25) return 0;
    }
    if (sector.key === 'services_finance') {
        totalProduction *= 0.7;
    }

    // ── Stability modifier ──
    // Political instability disrupts production across all sectors.
    // Below 40 stability, output degrades. At 20, halved. At 0, zero.
    var stability = Number(nation.stability ?? 50);
    var stabilityMod = Math.min(1.0, stability / 40);
    totalProduction *= stabilityMod;

    return Math.round(totalProduction);
}

export function calculateExportCapacity(nation, sector, opts) {
    var cfg = TRADE_CONFIG;
    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = RESOURCE_SECTORS.has(sector.key) ? 1.0 : Math.sqrt(gdp / cfg.BASELINE_GDP);
    if (gdpModifier <= 0) return 0;

    var totalProduction = calculateDomesticProduction(nation, sector, opts);
    if (totalProduction <= 0) return 0;

    // ── Domestic demand: feed your own people/industry first ──
    // Mirrors grossDemand from calculateImportDemand so both sides of trade
    // use consistent demand estimates. Only the surplus is available for export.
    //
    // Resource-sector demand is pinned (no GDP scaling) to match production,
    // which is also pinned at gdpModifier = 1.0. Otherwise demand grows with
    // economic size while production stays fixed.
    var demandGdpMod = RESOURCE_SECTORS.has(sector.key) ? 1.0 : Math.sqrt(gdp / cfg.BASELINE_GDP);
    var popNorm = (Number(nation.population) || 1) / 5000000;
    var SN = 5;
    var domesticDemand = 0;

    if (sector.key === 'fuel_energy') {
        var manufNorm = (Number(nation.manufacturing_output) || 0) / SN;
        var urbanNorm = (Number(nation.urbanization) || 0) / SN;
        var colNorm = (Number(nation.cost_of_living) || 0) / SN;
        var railNorm = (Number(nation.rail_network) || 0) / SN;
        var transportNeed = Math.max(0, 12 - railNorm) * 0.15;
        domesticDemand = (popNorm * 2 + manufNorm * 0.3 + urbanNorm * 0.2 + colNorm * 0.15 + transportNeed) * cfg.BASE_TRADE_MULTIPLIER * demandGdpMod;
    }
    else if (sector.key === 'minerals') {
        var manufScore = (Number(nation.manufacturing_output) || 0) / SN;
        var infraScore = (Number(nation.physical_infrastructure) || 0) / SN;
        var techScore = (Number(nation.digital_infrastructure) || 0) / SN;
        domesticDemand = (manufScore * 0.4 + infraScore * 0.15 + techScore * 0.1) * cfg.BASE_TRADE_MULTIPLIER * demandGdpMod;
    }
    else if (sector.key === 'manufactured_goods') {
        var solNorm = (Number(nation.standard_of_living ?? 50)) / SN;
        domesticDemand = popNorm * (solNorm / 8) * cfg.BASE_TRADE_MULTIPLIER * demandGdpMod * 0.7;
    }
    else if (sector.key === 'technology') {
        var solNorm = (Number(nation.standard_of_living ?? 50)) / SN;
        var digiNorm = (Number(nation.digital_infrastructure) || 0) / SN;
        domesticDemand = popNorm * ((solNorm + digiNorm) / 16) * cfg.BASE_TRADE_MULTIPLIER * demandGdpMod * 0.6;
    }

    var capacity = totalProduction;
    if (domesticDemand > 0) {
        capacity = Math.max(0, totalProduction - domesticDemand);
    }

    // ── Currency strength modifier on EXPORTS ──
    // Strong currency = exports expensive abroad = less competitive.
    // currency_strength 50 = 1.0 (neutral), 75 = 0.67x, 25 = 2.0x
    var currencyStrength = Number(nation.currency_strength ?? 50);
    var currencyModifier = currencyStrength > 0 ? 50 / currencyStrength : 1;
    capacity *= currencyModifier;

    // Floor: even distressed nations maintain some organic trade
    var minCapacity = Math.round(0.02 * cfg.BASE_TRADE_MULTIPLIER * gdpModifier);
    return Math.max(minCapacity, Math.round(capacity));
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
    // Resource sectors pin at 1.0 to stay consistent with the export-side
    // (calculateExportCapacity), so gross demand for fuel/minerals does
    // not scale with GDP while production is also pinned.
    var gdpModifier = RESOURCE_SECTORS.has(sector.key) ? 1.0 : Math.sqrt(gdp / cfg.BASELINE_GDP);
    var popNorm = (Number(nation.population) || 1) / 5000000;
    var SN = 5;   // stat normalizer: divide 0-100 stats by 5

    // Domestic production covers a FRACTION of demand (60-70%), never 100%.
    // Even nations with strong domestic industries import for variety,
    // specialization, quality, and competitive pricing.
    var grossDemand = 0;
    var domesticCoverage = 0;  // 0.0–0.7: how much domestic production offsets

    // ── FUEL & ENERGY ──
    // Demand: population + manufacturing + urbanization + transport needs.
    // Domestic offset: oil/gas + energy generation. Petro-states (oil >= 70)
    // can cover up to 95% of domestic demand; others cap at 70%.
    if (sector.key === 'fuel_energy') {
        var manufNorm = (Number(nation.manufacturing_output) || 0) / SN;
        var urbanNorm = (Number(nation.urbanization) || 0) / SN;
        var colNorm = (Number(nation.cost_of_living) || 0) / SN;
        var railNorm = (Number(nation.rail_network) || 0) / SN;
        var transportNeed = Math.max(0, 12 - railNorm) * 0.15;
        grossDemand = (popNorm * 2 + manufNorm * 0.3 + urbanNorm * 0.2 + colNorm * 0.15 + transportNeed) * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;

        var oilGas = (Number(nation.oil_and_gas) || 0) / 100;
        var energyGen = (Number(nation.energy_generation) || 0) / 100;
        // Petro-states scale the cap: oil >= 70 → up to 95% coverage
        var coverageCap = oilGas >= 0.7 ? 0.70 + (oilGas - 0.7) * 0.833 : 0.70;
        domesticCoverage = Math.min(coverageCap, (oilGas + energyGen) / 2);
    }

    // ── MINERALS & RAW MATERIALS ──
    // Demand: manufacturing needs + infrastructure development + technology production.
    // Domestic offset: rare_minerals (max 65%).
    else if (sector.key === 'minerals') {
        var manufScore = (Number(nation.manufacturing_output) || 0) / SN;
        var infraScore = (Number(nation.physical_infrastructure) || 0) / SN;
        var techScore = (Number(nation.digital_infrastructure) || 0) / SN;
        grossDemand = (manufScore * 0.4 + infraScore * 0.15 + techScore * 0.1) * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;

        var minerals = (Number(nation.rare_minerals) || 0) / 100;
        domesticCoverage = Math.min(0.65, minerals * 0.8);
    }

    // ── FOOD & AGRICULTURE ──
    // Demand: population-driven (everyone eats). Scales with standard of living
    // (wealthier populations consume more varied/imported food).
    // Uses population scaling, NOT GDP — even poor nations need food.
    // Domestic offset: arable_land (no cap — large populations outstrip local farming).
    else if (sector.key === 'food_agriculture') {
        var sol = (Number(nation.standard_of_living ?? 50)) / 100;
        grossDemand = popNorm * (1 + sol * 0.5) * cfg.BASE_TRADE_MULTIPLIER * 0.8;

        var arableLand = (Number(nation.arable_land) || 0) / 100;
        domesticCoverage = arableLand / Math.max(0.2, popNorm * 1.2);
    }

    // ── MANUFACTURED GOODS ──
    // Demand: population × standard of living (consumer purchasing power).
    // Domestic offset: manufacturing_output (max 60% — even industrial nations
    // import cars, electronics, clothing from abroad).
    else if (sector.key === 'manufactured_goods') {
        var sol = (Number(nation.standard_of_living ?? 50)) / SN;
        grossDemand = popNorm * (sol / 8) * cfg.BASE_TRADE_MULTIPLIER * gdpModifier * 0.7;

        var manufScore = (Number(nation.manufacturing_output) || 0) / 100;
        domesticCoverage = Math.min(0.60, manufScore * 0.7);
    }

    // ── TECHNOLOGY & ELECTRONICS ──
    // Demand: standard of living (wealthy populations buy tech) + digital
    // infrastructure needs + population base.
    // Domestic offset: higher_education + digital_infrastructure (max 60%).
    else if (sector.key === 'technology') {
        var sol = (Number(nation.standard_of_living ?? 50)) / SN;
        var digi = (Number(nation.digital_infrastructure) || 0) / SN;
        grossDemand = popNorm * ((sol + digi) / 16) * cfg.BASE_TRADE_MULTIPLIER * gdpModifier * 0.6;

        var edu = (Number(nation.higher_education) || 0) / 100;
        var digiProd = (Number(nation.digital_infrastructure) || 0) / 100;
        domesticCoverage = Math.min(0.60, (edu + digiProd) / 2 * 0.7);
    }

    // ── ARMS & MILITARY EQUIPMENT ──
    // Demand: defense budget + instability premium (unstable nations arm up).
    // Domestic offset: nations with arms exports cover 60% internally.
    else if (sector.key === 'arms') {
        var defenseBudget = (opts && opts.defense_budget) || 0;
        var stability = Number(nation.stability ?? 50);
        var instabilityPremium = Math.max(0, (50 - stability) / 50) * 0.3;
        grossDemand = defenseBudget * (0.15 + instabilityPremium);

        domesticCoverage = (opts && opts.has_arms_exports) ? 0.60 : 0;
    }

    // Apply domestic coverage: domestic production offsets demand but never fully
    var rawDemand = grossDemand * (1 - domesticCoverage);

    if (rawDemand <= 0) return 0;

    // ── Currency strength on imports ──
    // Weak currency makes imports MORE expensive → you can afford LESS.
    // currency_strength 50 = 1.0, 25 = 0.5 (can only afford half), 75 = 1.5
    var currencyStrength = Number(nation.currency_strength ?? 50);
    var affordability = currencyStrength / 50;
    rawDemand *= affordability;

    // ── Tariff dampener ──
    // Your own tariffs reduce import volume (makes foreign goods more expensive).
    // tariffs 0 = 1.0 (free trade), 50 = 0.75 (25% reduction), 100 = 0.50 (protectionist)
    var tariffs = Number(nation.tariffs) || 0;
    var tariffDampener = 1 - (tariffs / 200);
    rawDemand *= tariffDampener;

    // Floor: even distressed nations import essential goods (5% of GDP-scaled baseline)
    var minDemand = Math.round(0.02 * cfg.BASE_TRADE_MULTIPLIER * gdpModifier);
    return Math.max(minDemand, Math.round(rawDemand));
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
    var base = 30;

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

    // Geographic proximity: continuous bonus scaled from distance 0-100.
    // Bordering (0) → +20, same region (50) → +10, distant (80) → +4.
    var proximity = (opts && opts.proximity != null) ? Number(opts.proximity) : 50;
    var proximityBonus = ((100 - proximity) / 100) * 20;

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

    // Credit rating: nations with poor credit are unreliable trade partners; high credit signals trustworthiness
    // Penalty uses WORSE credit of the two nations (weakest-link): credit 50+ = no penalty, scales linearly to -20 at credit 0, floor -25 for negative
    // Bonus uses BETTER credit of the two nations (best-link): credit 50 = +0, scales linearly to +10 at credit 100
    var creditA = Number(nationA.credit ?? 50);
    var creditB = Number(nationB.credit ?? 50);
    var worstCredit = Math.min(creditA, creditB);
    var bestCredit = Math.max(creditA, creditB);
    var creditPenalty = 0;
    if (worstCredit < 50) {
        if (worstCredit < 0) creditPenalty = -25;
        else creditPenalty = -((50 - worstCredit) / 50) * 20;
    }
    var creditBonus = bestCredit > 50 ? ((bestCredit - 50) / 50) * 10 : 0;

    var affinity = base + diplomaticBonus + tradeBonus + embargoPenalty + proximityBonus + fdiBonus + reputationBonus + creditPenalty + creditBonus;

    // Poor relations cliff: nations that dislike each other barely trade organically.
    // Relations below 25 → affinity scaled to 30% (trade agreements can still override).
    if (relScore < 25) {
        affinity *= 0.3;
    }

    // Distance cliff: very distant nations have weak organic trade links.
    // Distance above 75 → affinity scaled to 40%.
    if (proximity > 75) {
        affinity *= 0.4;
    }

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
    var sectors = buildEffectiveSectorList(); // Replaces food_agriculture with 4 sub-sectors
    var nationCount = nationList.length;

    // Build nation lookup by id
    var nationMap = {};
    for (var ni = 0; ni < nationCount; ni++) {
        nationMap[nationList[ni].id] = nationList[ni];
    }

    // ── Step 0: Fetch food land allocations for all nations ──
    var foodAllocMap = {}; // foodAllocMap[nationId] = { grains_pct, livestock_pct, ... }
    var { data: foodAllocRows } = await supabase.from('food_land_allocation')
        .select('nation_id, grains_pct, livestock_pct, perishables_pct, cash_crops_pct');
    if (foodAllocRows) {
        for (var fi = 0; fi < foodAllocRows.length; fi++) {
            foodAllocMap[foodAllocRows[fi].nation_id] = foodAllocRows[fi];
        }
    }

    // ── Step 1: Compute per-nation budget info (for arms sector opts) ──
    var budgetMap = {};
    for (var ni = 0; ni < nationCount; ni++) {
        var n = nationList[ni];
        budgetMap[n.id] = calculateNationalBudget(n);
    }

    // ── Step 2: Compute export capacity + import demand for every nation × sector ──
    // nationFlows[nationId][sectorKey] = { domesticProduction, exportCapacity, importDemand }
    var nationFlows = {};
    // sectorAgg[sectorKey] = { totalSupply, totalDemand }
    var sectorAgg = {};

    for (var si = 0; si < sectors.length; si++) {
        sectorAgg[sectors[si].key] = { totalSupply: 0, totalDemand: 0 };
    }

    for (var ni = 0; ni < nationCount; ni++) {
        var n = nationList[ni];
        nationFlows[n.id] = {};
        var foodAlloc = foodAllocMap[n.id] || DEFAULT_FOOD_ALLOCATION;

        for (var si = 0; si < sectors.length; si++) {
            var sector = sectors[si];
            var expCap, impDem, domProd;

            if (isFoodSubsector(sector.key)) {
                // ── Food sub-sector: use specialized calculation ──
                domProd = calculateFoodDomesticProduction(n, sector, foodAlloc);
                expCap = calculateFoodExportCapacity(n, sector, foodAlloc);
                impDem = calculateFoodImportDemand(n, sector, foodAlloc);
            } else {
                // ── Regular sector ──
                var exportOpts = null;
                var importOpts = null;
                if (sector.key === 'arms') {
                    var avail = budgetMap[n.id].availableBudget || 0;
                    var defenseBudget = avail * 0.10;
                    exportOpts = { defense_pct: 10 };
                    importOpts = { defense_budget: defenseBudget, has_arms_exports: false };
                }

                domProd = calculateDomesticProduction(n, sector, exportOpts);
                expCap = calculateExportCapacity(n, sector, exportOpts);
                impDem = calculateImportDemand(n, sector, importOpts);

                if (sector.key === 'arms' && expCap > 0 && importOpts) {
                    importOpts.has_arms_exports = true;
                    impDem = calculateImportDemand(n, sector, importOpts);
                }
            }

            // Export controls: nations can cap exports per sector
            var exportCaps = n.export_caps;
            if (exportCaps && exportCaps[sector.key] != null) {
                expCap = Math.round(expCap * (exportCaps[sector.key] / 100));
            }
            // Also check parent food_agriculture cap for sub-sectors
            if (isFoodSubsector(sector.key) && exportCaps && exportCaps['food_agriculture'] != null) {
                expCap = Math.round(expCap * (exportCaps['food_agriculture'] / 100));
            }

            // Export caps only restrict what leaves the country — they don't
            // change what's produced, so domProd is captured pre-cap.
            nationFlows[n.id][sector.key] = { domesticProduction: domProd, exportCapacity: expCap, importDemand: impDem };
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
        // Fetch one nation's rows — price_modifier is identical across nations per sector
        var { data: prevFlows } = await supabase.from('trade_flows')
            .select('sector, price_modifier')
            .eq('tick', prevTick)
            .eq('nation_id', nationList[0].id)
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

    // Helper: expand a sector key to account for food sub-sectors.
    // If an agreement references 'food_agriculture', it applies to all 4 sub-sectors.
    function expandSectorKey(sectorKey) {
        if (sectorKey === 'food_agriculture') return FOOD_SUBSECTOR_KEYS;
        return [sectorKey];
    }

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
                    // Expand food_agriculture to all sub-sectors
                    var ptaSectors = expandSectorKey(d.sector);
                    for (var psi = 0; psi < ptaSectors.length; psi++) {
                        var ptaSec = ptaSectors[psi];
                        if (direction === 'mutual' || direction === 'your_exports') {
                            var impExpKey = partnerId + '|' + authorId;
                            if (!tariffModMap[impExpKey]) tariffModMap[impExpKey] = {};
                            tariffModMap[impExpKey][ptaSec] = Math.max(tariffModMap[impExpKey][ptaSec] || 0, reduction);
                        }
                        if (direction === 'mutual' || direction === 'their_exports') {
                            var impExpKey2 = authorId + '|' + partnerId;
                            if (!tariffModMap[impExpKey2]) tariffModMap[impExpKey2] = {};
                            tariffModMap[impExpKey2][ptaSec] = Math.max(tariffModMap[impExpKey2][ptaSec] || 0, reduction);
                        }
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
                    // Expand food_agriculture to sub-sectors
                    var rtSectors = expandSectorKey(d.sector);
                    for (var rti = 0; rti < rtSectors.length; rti++) {
                        tariffSurchargeMap[surKey][rtSectors[rti]] = Math.max(tariffSurchargeMap[surKey][rtSectors[rti]] || 0, surcharge);
                    }
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
                    // Expand food_agriculture to sub-sectors
                    var esSectors = expandSectorKey(d.sector);
                    for (var esi = 0; esi < esSectors.length; esi++) {
                        exportSubsidyMap[nationId][esSectors[esi]] = Math.max(exportSubsidyMap[nationId][esSectors[esi]] || 0, subsidyPct);
                    }
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
                    // Expand food_agriculture to sub-sectors
                    var embSectors = expandSectorKey(d.sector);
                    for (var embi = 0; embi < embSectors.length; embi++) {
                        embargoMap[ek1][embSectors[embi]] = true;
                        embargoMap[ek2][embSectors[embi]] = true;
                    }
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

            // Expand food_agriculture RSCs to all sub-sectors (split commitment proportionally)
            var rscSectors = expandSectorKey(supplyArt.sector);

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

            var sellerFlows = nationFlows[sellerNationId];
            var buyerFlows = nationFlows[buyerNationId];
            if (!sellerFlows || !buyerFlows) continue;

            for (var rsi = 0; rsi < rscSectors.length; rsi++) {
                var rscSec = rscSectors[rsi];

                var sellerExport = (sellerFlows[rscSec] && sellerFlows[rscSec].exportCapacity) || 0;
                var buyerDemand = (buyerFlows[rscSec] && buyerFlows[rscSec].importDemand) || 0;
                if (sellerExport <= 0 || buyerDemand <= 0) continue;

                var guaranteedVolume = Math.round(sellerExport * (supplyArt.commitment_pct / 100));
                guaranteedVolume = Math.min(guaranteedVolume, buyerDemand);

                var sectorPriceMod = priceModifiers[rscSec] || 1.0;
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
                    sector: rscSec,
                    volume: adjustedVolume,
                    agreementId: rsc.id
                });
            }
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

    // ── Export-only sector pass (Tourism, Services & Finance) ──
    // These sectors don't have bilateral importers — revenue comes from world
    // demand (tourists visiting, foreign businesses using services). We calculate
    // revenue based on export capacity weighted by average world affinity toward
    // the exporting nation, then distribute proportionally across trading partners.
    for (var si = 0; si < sectors.length; si++) {
        var eoSector = sectors[si];
        if (!eoSector.export_only) continue;

        for (var ei = 0; ei < nationCount; ei++) {
            var eoExporter = nationList[ei];
            var eoExpCap = nationFlows[eoExporter.id][eoSector.key].exportCapacity;
            if (eoExpCap <= 0) continue;

            // Calculate world demand: sum of (other nation GDP × affinity) / baseline
            // This represents how many tourists/clients this nation attracts
            var worldDemandScore = 0;
            var partnerContributions = [];
            for (var ii = 0; ii < nationCount; ii++) {
                if (ii === ei) continue;
                var eoImporter = nationList[ii];

                // Check embargoes
                var eoPairFlags = flagsMap[eoExporter.id + '|' + eoImporter.id];
                if (eoPairFlags && eoPairFlags.has_embargo) continue;

                var eoAff = affinityMap[eoImporter.id + '|' + eoExporter.id] || 0;
                if (eoAff <= 0) continue;

                var eoPartnerGdp = Number(eoImporter.gdp) || 0;
                var contribution = (eoPartnerGdp / TRADE_CONFIG.BASELINE_GDP) * eoAff;
                worldDemandScore += contribution;
                partnerContributions.push({
                    nationId: eoImporter.id,
                    contribution: contribution,
                    affinity: eoAff
                });
            }

            if (worldDemandScore <= 0 || partnerContributions.length === 0) continue;

            // Revenue = capacity × min(worldDemandFactor, 1.0) — capped at full capacity
            // worldDemandFactor normalized: avg affinity 50 + avg GDP ratio 1.0 → factor ~1.0
            var avgContribution = worldDemandScore / partnerContributions.length;
            var worldDemandFactor = Math.min(1.0, avgContribution / 50);
            var eoRevenue = Math.round(eoExpCap * worldDemandFactor);
            if (eoRevenue <= 0) continue;

            actualExports[eoExporter.id][eoSector.key] += eoRevenue;

            // Distribute revenue proportionally across contributing partners
            for (var ci = 0; ci < partnerContributions.length; ci++) {
                var pc = partnerContributions[ci];
                var partnerShare = Math.round(eoRevenue * (pc.contribution / worldDemandScore));
                if (partnerShare <= 0) continue;
                partnerRows.push({
                    tick: currentTick,
                    exporter_nation_id: eoExporter.id,
                    importer_nation_id: pc.nationId,
                    sector: eoSector.key,
                    trade_volume: partnerShare,
                    affinity_score: pc.affinity
                });
            }
        }
    }

    // ── Simultaneous proportional distribution (goods sectors only) ──
    // Instead of iterating exporters sequentially (which lets the first exporter
    // saturate all demand), we collect ALL bilateral (exporter→importer) pairs per
    // sector and allocate simultaneously using a gravity-model weight:
    //   weight = exportCapacity × importDemand × affinity × proximityFactor
    // Each pair's allocation is capped by both the exporter's capacity and the
    // importer's demand. Two passes handle the caps + redistribute surplus.

    for (var si = 0; si < sectors.length; si++) {
        var sector = sectors[si];
        if (sector.export_only) continue; // Already handled above
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
                // Strategic necessity: fuel & grains trade even through poor relations
                // Floor scales with exporter capacity — major producers always find buyers
                if ((sector.key === 'fuel_energy' || sector.key === 'grains_staples') && !(pairFlags && pairFlags.has_embargo)) {
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
                if (p.weight <= 0) continue; // preserve prior-pass volume for exhausted pairs

                // Share of this exporter's capacity going to this importer
                var expShare = (expBudget[p.expId] || 0) * (p.weight / (expWeightSum[p.expId] || 1));
                // Share of this importer's demand filled by this exporter
                var impShare = (impBudget[p.impId] || 0) * (p.weight / (impWeightSum[p.impId] || 1));
                // Accumulate across passes: pass 0 sets base, pass 1+ adds remaining
                p.volume += Math.round(Math.min(expShare, impShare));
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
                domestic_production: nationFlows[n.id][sKey].domesticProduction,
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
            var currentGdpGrowth = Number(n.gdp_growth ?? 50);
            nationUpdates.gdp_growth = Math.round(Math.max(0, Math.min(100, currentGdpGrowth + tradeGdpNudge)) * 10) / 10;
        }

        // Currency strength: trade surplus strengthens currency, deficit weakens it
        // Gentler than GDP nudge: (tradeBalance - 50) / 100 → range -0.5 to +0.5 per tick
        var currentCurrency = Number(n.currency_strength ?? 50);
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
        var currentInflation = Number(n.inflation ?? 50);
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
                var currentUnemployment = Number(n.unemployment ?? 50);
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
                nationUpdates.energy_generation = Math.round(Math.max(0, (Number(n.energy_generation ?? 50)) - fuelEnergyPen) * 10) / 10;
                nationUpdates.manufacturing_output = Math.round(Math.max(0, (Number(n.manufacturing_output ?? 50)) - fuelManufPen) * 10) / 10;
                nationUpdates.inflation = Math.round(Math.min(100, (nationUpdates.inflation != null ? nationUpdates.inflation : (Number(n.inflation ?? 50))) + fuelInflation) * 10) / 10;
                nationUpdates.cost_of_living = Math.round(Math.min(100, (Number(n.cost_of_living ?? 50)) + fuelCol) * 10) / 10;
            } else if (sKey3 === 'grains_staples') {
                // Grain shortage: famine risk — stability, legitimacy, civil unrest, emigration
                var grainHappiness = severity * 1.5;
                var grainUnrest = severity * 2.0;
                var grainStability = severity * 1.5;
                var grainLegitimacy = severity * 1.5;
                var grainPoverty = severity * 2.0;
                nationUpdates.happiness = Math.round(Math.max(0, (Number(n.happiness ?? 50)) - grainHappiness) * 10) / 10;
                nationUpdates.civil_unrest = Math.round(Math.min(100, (Number(n.civil_unrest) || 0) + grainUnrest) * 10) / 10;
                nationUpdates.stability = Math.round(Math.max(0, (nationUpdates.stability != null ? nationUpdates.stability : (Number(n.stability ?? 50))) - grainStability) * 10) / 10;
                nationUpdates.legitimacy = Math.round(Math.max(0, (Number(n.legitimacy ?? 50)) - grainLegitimacy) * 10) / 10;
                nationUpdates.poverty_rate = Math.round(Math.min(100, (Number(n.poverty_rate) || 0) + grainPoverty) * 10) / 10;
            } else if (sKey3 === 'livestock_dairy') {
                // Livestock shortage: quality of life decline
                var livestockSol = severity * 1.0;
                var livestockHappy = severity * 0.8;
                var livestockCol = severity * 0.8;
                nationUpdates.standard_of_living = Math.round(Math.max(0, (Number(n.standard_of_living ?? 50)) - livestockSol) * 10) / 10;
                nationUpdates.happiness = Math.round(Math.max(0, (nationUpdates.happiness != null ? nationUpdates.happiness : (Number(n.happiness ?? 50))) - livestockHappy) * 10) / 10;
                nationUpdates.cost_of_living = Math.round(Math.min(100, (nationUpdates.cost_of_living != null ? nationUpdates.cost_of_living : (Number(n.cost_of_living ?? 50))) + livestockCol) * 10) / 10;
            } else if (sKey3 === 'fruits_vegetables') {
                // Perishables shortage: health and happiness impact
                var fvHealth = severity * 1.0;
                var fvHappy = severity * 1.0;
                var fvCol = severity * 0.6;
                nationUpdates.healthcare_quality = Math.round(Math.max(0, (Number(n.healthcare_quality ?? 50)) - fvHealth) * 10) / 10;
                nationUpdates.happiness = Math.round(Math.max(0, (nationUpdates.happiness != null ? nationUpdates.happiness : (Number(n.happiness ?? 50))) - fvHappy) * 10) / 10;
                nationUpdates.cost_of_living = Math.round(Math.min(100, (nationUpdates.cost_of_living != null ? nationUpdates.cost_of_living : (Number(n.cost_of_living ?? 50))) + fvCol) * 10) / 10;
            } else if (sKey3 === 'cash_crops') {
                // Cash crop shortage: GDP and investment impact (not food security)
                var ccGdp = severity * 0.8;
                var ccFdi = severity * 0.6;
                nationUpdates.gdp_growth = Math.round(Math.max(0, (nationUpdates.gdp_growth != null ? nationUpdates.gdp_growth : (Number(n.gdp_growth ?? 50))) - ccGdp) * 10) / 10;
                nationUpdates.foreign_investment = Math.round(Math.max(0, (Number(n.foreign_investment ?? 50)) - ccFdi) * 10) / 10;
            } else if (sKey3 === 'minerals') {
                var minManuf = severity * 1.0;
                var minInfra = severity * 0.7;
                nationUpdates.manufacturing_output = Math.round(Math.max(0, (nationUpdates.manufacturing_output != null ? nationUpdates.manufacturing_output : (Number(n.manufacturing_output ?? 50))) - minManuf) * 10) / 10;
                nationUpdates.infrastructure = Math.round(Math.max(0, (Number(n.infrastructure ?? 50)) - minInfra) * 10) / 10;
            } else if (sKey3 === 'manufactured_goods') {
                var mfgSol = severity * 1.0;
                var mfgCol = severity * 0.8;
                nationUpdates.standard_of_living = Math.round(Math.max(0, (Number(n.standard_of_living ?? 50)) - mfgSol) * 10) / 10;
                nationUpdates.cost_of_living = Math.round(Math.min(100, (nationUpdates.cost_of_living != null ? nationUpdates.cost_of_living : (Number(n.cost_of_living ?? 50))) + mfgCol) * 10) / 10;
            } else if (sKey3 === 'technology') {
                var techDigi = severity * 0.8;
                var techInnov = severity * 0.8;
                nationUpdates.digital_infrastructure = Math.round(Math.max(0, (Number(n.digital_infrastructure ?? 50)) - techDigi) * 10) / 10;
                nationUpdates.innovation_index = Math.round(Math.max(0, (Number(n.innovation_index ?? 50)) - techInnov) * 10) / 10;
            } else if (sKey3 === 'arms') {
                var armsMil = severity * 1.0;
                nationUpdates.military_strength = Math.round(Math.max(0, (Number(n.military_strength ?? 50)) - armsMil) * 10) / 10;
            }
        }

        await supabase.from('nations')
            .update(nationUpdates)
            .eq('id', n.id);
    }

    // ── Step 6b: Apply shipping efficiency multiplier ──
    // Base efficiency: 85% without shipping. +3% per active shipping claim on the route.
    // Cap at 100%. Routes without any shipping coverage lose 15% of trade volume.
    try {
        // Fetch all active shipping claims grouped by route's trade agreement
        var { data: activeClaims } = await supabase.from('shipping_claims')
            .select('route_id, shipping_routes!inner(trade_agreement_id, origin_nation_id, destination_nation_id, trade_sector)')
            .eq('status', 'active');

        if (activeClaims && activeClaims.length > 0) {
            // Build a map: "exporterNationId|importerNationId|sector" → ship count
            var shipCountMap = {};
            for (var sci = 0; sci < activeClaims.length; sci++) {
                var cl = activeClaims[sci];
                var sr = cl.shipping_routes;
                if (!sr) continue;
                var key1 = sr.origin_nation_id + '|' + sr.destination_nation_id + '|' + sr.trade_sector;
                var key2 = sr.destination_nation_id + '|' + sr.origin_nation_id + '|' + sr.trade_sector;
                shipCountMap[key1] = (shipCountMap[key1] || 0) + 1;
                shipCountMap[key2] = (shipCountMap[key2] || 0) + 1;
            }

            // Apply efficiency to partner rows
            var BASE_EFFICIENCY = 0.85;
            var PER_SHIP_BONUS = 0.03;
            for (var pri = 0; pri < partnerRows.length; pri++) {
                var pr = partnerRows[pri];
                var prKey = pr.exporter_nation_id + '|' + pr.importer_nation_id + '|' + pr.sector;
                var ships = shipCountMap[prKey] || 0;
                var efficiency = Math.min(1.0, BASE_EFFICIENCY + (ships * PER_SHIP_BONUS));
                partnerRows[pri].trade_volume = Math.round(pr.trade_volume * efficiency);
            }

            console.log('[processTradeFlows] Shipping efficiency applied to ' + partnerRows.length + ' bilateral flows');
        } else {
            // No shipping at all — apply base 85% efficiency to all trade
            for (var pri2 = 0; pri2 < partnerRows.length; pri2++) {
                partnerRows[pri2].trade_volume = Math.round(partnerRows[pri2].trade_volume * 0.85);
            }
        }
    } catch (shipEffErr) {
        console.error('[processTradeFlows] Shipping efficiency calculation failed (non-fatal):', shipEffErr);
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
