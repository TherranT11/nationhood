/**
 * trade-constants.js — Goods-trade economy (Phase 10A: WIPED for rebuild)
 *
 * The full goods-trade math (export capacity, import demand, food
 * allocation, tariff dampening, route distribution) was retired in
 * Phase 10A. This module is now a label-only shell:
 *
 *   * Sector + subsector key/label data is preserved so existing
 *     diplomacy.html agreement clauses, ledger Goods tab, corp UIs,
 *     and bills referencing sector keys keep rendering with intact
 *     labels.
 *   * Every math/calculation function is a stub returning a safe
 *     no-data default (0 / 1 / null / empty).
 *
 * To rebuild the economy, replace the stubs with real implementations
 * (and re-add the trade_flows / trade_summary tables + tick processor
 * if needed).
 */

// ==================== STRUCTURAL CONSTANTS ====================

export var TRADE_CONFIG = {
    BASE_TRADE_MULTIPLIER: 500_000_000,
    BASELINE_GDP: 100_000_000_000,
    HISTORY_TICKS: 24,
};

/**
 * Trade sectors — the 8 categories of goods/services nations trade.
 * Math fields (export_stat, export_threshold, etc.) intentionally
 * omitted from this label-only shell; rebuild will re-add as needed.
 */
export var TRADE_SECTORS = [
    { key: 'fuel_energy',        label: 'Fuel & Energy',                export_only: false },
    { key: 'minerals',           label: 'Minerals & Raw Materials',     export_only: false },
    { key: 'food_agriculture',   label: 'Food & Agriculture',           export_only: false },
    { key: 'manufactured_goods', label: 'Manufactured Goods',           export_only: false },
    { key: 'technology',         label: 'Technology & Electronics',     export_only: false },
    { key: 'arms',               label: 'Arms & Military Equipment',    export_only: false },
    { key: 'tourism',            label: 'Tourism',                       export_only: true  },
    { key: 'services_finance',   label: 'Services & Finance',           export_only: true  },
];

export var TRADE_SECTOR_KEYS = TRADE_SECTORS.map(function (s) { return s.key; });
export var TRADE_SECTOR_MAP  = (function () {
    var m = {};
    TRADE_SECTORS.forEach(function (s) { m[s.key] = s; });
    return m;
})();

// Real-world commodity-unit metadata for human-readable volume display.
// Used by formatSectorVolume below.
export var SECTOR_DISPLAY_UNITS = {
    fuel_energy:        { baseUnit: 'barrels per day',    scaleLabel: 'million',  scaleFactor: 1e6, factor: 1 / 5e9 },
    food_agriculture:   { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6, factor: 1 / 4e9 },
    grains_staples:     { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6, factor: 1 / 4e9 },
    livestock_dairy:    { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6, factor: 1 / 4e9 },
    fruits_vegetables:  { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6, factor: 1 / 4e9 },
    cash_crops:         { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6, factor: 1 / 4e9 },
    minerals:           { baseUnit: 'tonnes/year',        scaleLabel: 'million',  scaleFactor: 1e6, factor: 1 / 1e8 },
    manufactured_goods: { baseUnit: 'TEU/year',           scaleLabel: 'thousand', scaleFactor: 1e3, factor: 1 / 1e8 },
    arms:               { baseUnit: 'units/year',         scaleLabel: 'thousand', scaleFactor: 1e3, factor: 1 / 1e8 },
    tourism:            { baseUnit: 'visitor-days/year',   scaleLabel: 'million',  scaleFactor: 1e6, factor: 1 / 1e8 },
};

/**
 * Format a trade volume in real-world commodity units. Returns null
 * for sectors that use currency display (technology, services_finance).
 */
export function formatSectorVolume(val, sectorKey) {
    var def = SECTOR_DISPLAY_UNITS[sectorKey];
    if (!def) return null;
    var scaled = (Number(val) || 0) * def.factor;
    var abs = Math.abs(scaled);
    var sign = scaled < 0 ? '-' : '';
    if (abs >= 1) {
        var str = abs >= 100 ? abs.toFixed(0) : abs >= 10 ? abs.toFixed(1) : abs.toFixed(2);
        return sign + str + ' ' + def.scaleLabel + ' ' + def.baseUnit;
    }
    var raw = Math.round(abs * def.scaleFactor);
    return sign + raw.toLocaleString() + ' ' + def.baseUnit;
}

/**
 * Food sub-sectors (label-only). Math fields intentionally omitted;
 * rebuild will re-add stat_effects, drivers, demand_drivers, etc.
 */
export var FOOD_SUBSECTORS = [
    { key: 'grains_staples',    label: 'Grains & Staples',                description: 'Wheat, rice, corn, soybeans, legumes, cooking oils, sugar', parent_sector: 'food_agriculture', stockpilable: true  },
    { key: 'livestock_dairy',   label: 'Livestock & Dairy',               description: 'Cattle, poultry, pigs, sheep, eggs, milk, cheese',          parent_sector: 'food_agriculture', stockpilable: false },
    { key: 'fruits_vegetables', label: 'Fruits, Vegetables & Perishables', description: 'Fresh produce, market gardens, fishing, aquaculture',       parent_sector: 'food_agriculture', stockpilable: false },
    { key: 'cash_crops',        label: 'Cash Crops & Plantation Agriculture', description: 'Coffee, tea, cocoa, tobacco, cotton, rubber, spices, palm oil', parent_sector: 'food_agriculture', stockpilable: true },
];

export var FOOD_SUBSECTOR_KEYS = FOOD_SUBSECTORS.map(function (s) { return s.key; });
export var FOOD_SUBSECTOR_MAP  = (function () {
    var m = {};
    FOOD_SUBSECTORS.forEach(function (s) { m[s.key] = s; });
    return m;
})();

export function isFoodSubsector(sectorKey) {
    return Object.prototype.hasOwnProperty.call(FOOD_SUBSECTOR_MAP, sectorKey);
}

export var DEFAULT_FOOD_ALLOCATION = {
    grains_pct:      40,
    livestock_pct:   25,
    perishables_pct: 20,
    cash_crops_pct:  15,
};

export var FOOD_BASE_PRICE_PER_TONNE = 4000;

export var STOCKPILE_CONFIG = {
    BASE_CAPACITY_MONTHS: 6,
    SPOILAGE_RATE_PCT: 2,
};

export var FOOD_SECURITY_LEVELS = [
    { key: 'critical', label: 'Critical',  threshold: 0.20, color: 'var(--red)' },
    { key: 'low',      label: 'Low',       threshold: 0.50, color: 'var(--orange)' },
    { key: 'adequate', label: 'Adequate',  threshold: 0.80, color: 'var(--amber)' },
    { key: 'secure',   label: 'Secure',    threshold: 1.00, color: 'var(--green)' },
];

// ==================== STUBBED MATH / CALCULATION FUNCTIONS ====================
//
// All goods-trade math returns a safe no-data default until the
// rebuild lands. Callers continue to function — they just see 0
// capacity / no demand / no spoilage everywhere.

export function getEffectiveArableLand(_nation, _subsectorKey, _allocation) { return 0; }
export function calculateSpoilageMultiplier(_nation) { return 1; }
export function getGlobalAverageUnitPrice(_sectorKey, _priceMod) { return 0; }
export function formatPricePerTonne(pricePerTonne) {
    var n = Number(pricePerTonne) || 0;
    return '$' + n.toLocaleString() + '/t';
}
export function calculateStockpileSpoilage(_sectorKey, _nation) { return 0; }
export function calculateStockpileCapacity(_sectorKey, _nation) { return 0; }
export function calculateReserveMonths(_reserveValue, _monthlyConsumption) { return 0; }
export function computeFoodSecurityStatus(_flows) { return null; }
export function computeFoodStatEffects(_flows) { return {}; }
export function buildEffectiveSectorList() { return []; }
export function calculateFoodDomesticProduction(_nation, _subsector, _allocation) { return 0; }
export function calculateFoodExportCapacity(_nation, _subsector, _allocation) { return 0; }
export function getTariffDampener(_nation, _sectorKey) { return 1; }
export function calculateFoodImportDemand(_nation, _subsector, _allocation) { return 0; }
export function calculateDomesticProduction(_nation, _sector, _opts) { return 0; }
export function calculateExportCapacity(_nation, _sector, _opts) { return 0; }
export function calculateDomesticFuelDemand(_nation) { return 0; }
export function calculateDomesticManufDemand(_nation) { return 0; }
export function deriveFuelTradeFlowMetrics(_nation, _sector, _opts) { return null; }
export function calculateImportDemand(_nation, _sector, _opts) { return 0; }
export function calculatePriceModifier(_totalSupply, _totalDemand) { return 1; }
export function calculateTradeAffinity(_nationA, _nationB, _relation, _opts) { return 0; }
export function distributeTradeAmongPartners(_exportCapacity, _importers) { return []; }
export function deriveTradeBalanceIndex(_tradeSurplus, _gdp) { return 0; }
export function calculateTariffRevenue(_totalImports, _tariffRate, _collectionRate) { return 0; }
export function shippingNeedFor(_exporterNation, _importerNation, _borderTypes) { return null; }
