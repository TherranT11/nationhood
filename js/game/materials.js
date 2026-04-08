// ══════════════════════════════════════════════════════════════════════
//  Construction Materials — definitions, quality tiers, stat thresholds
// ══════════════════════════════════════════════════════════════════════

/**
 * Each material has three quality tiers: LOW, STD, HIGH.
 * Each tier has stat requirements that the HQ nation must meet for
 * domestic availability. Failing the threshold locks that tier —
 * the corp must import from a nation that meets the requirements.
 *
 * Quality colors: LOW = orange, STD = yellow, HIGH = green
 * These are consistent across warehouse, procurement, bid assembly,
 * and inspection results.
 */

export const MATERIAL_QUALITY_COLORS = {
    LOW: '#c84',     // orange
    STD: '#ca5',     // yellow
    HIGH: '#5c5',    // green
};

export const MATERIALS = [
    {
        key: 'concrete',
        name: 'Concrete',
        category: 'RAW',       // RAW = tariff on raw materials
        tiers: {
            LOW:  { requirements: [] },  // always available
            STD:  { requirements: [{ stat: 'manufacturing_output', min: 20 }] },
            HIGH: { requirements: [{ stat: 'manufacturing_output', min: 50 }, { stat: 'higher_education', min: 40 }] },
        },
        priceDrivers: ['manufacturing_output', 'inflation', 'fuel_prices', 'urbanization'],
    },
    {
        key: 'steel',
        name: 'Steel',
        category: 'RAW',
        tiers: {
            LOW:  { requirements: [{ stat: 'manufacturing_output', min: 10 }] },
            STD:  { requirements: [{ stat: 'manufacturing_output', min: 35 }, { stat: 'rare_minerals', min: 20 }] },
            HIGH: { requirements: [{ stat: 'manufacturing_output', min: 60 }, { stat: 'rare_minerals', min: 40 }, { stat: 'higher_education', min: 45 }] },
        },
        priceDrivers: ['manufacturing_output', 'rare_minerals', 'inflation', 'fuel_prices'],
    },
    {
        key: 'lumber',
        name: 'Lumber',
        category: 'RAW',
        tiers: {
            LOW:  { requirements: [{ stat: 'arable_land', min: 10 }] },
            STD:  { requirements: [{ stat: 'arable_land', min: 30 }, { stat: 'physical_infrastructure', min: 20 }] },
            HIGH: { requirements: [{ stat: 'arable_land', min: 50 }, { stat: 'manufacturing_output', min: 30 }] },
        },
        priceDrivers: ['arable_land', 'physical_infrastructure', 'inflation'],
    },
    {
        key: 'aggregate',
        name: 'Aggregate',
        category: 'RAW',
        tiers: {
            LOW:  { requirements: [] },  // it's rocks
            STD:  { requirements: [{ stat: 'rare_minerals', min: 15 }, { stat: 'physical_infrastructure', min: 20 }] },
            HIGH: { requirements: [{ stat: 'rare_minerals', min: 35 }, { stat: 'manufacturing_output', min: 25 }] },
        },
        priceDrivers: ['rare_minerals', 'physical_infrastructure', 'inflation'],
    },
    {
        key: 'em',
        name: 'E&M Systems',
        category: 'MANUFACTURED',   // MANUFACTURED = tariff on manufactured goods
        tiers: {
            LOW:  { requirements: [{ stat: 'manufacturing_output', min: 15 }] },
            STD:  { requirements: [{ stat: 'manufacturing_output', min: 40 }, { stat: 'digital_infrastructure', min: 25 }] },
            HIGH: { requirements: [{ stat: 'manufacturing_output', min: 55 }, { stat: 'digital_infrastructure', min: 50 }, { stat: 'energy_generation', min: 40 }] },
        },
        priceDrivers: ['manufacturing_output', 'digital_infrastructure', 'inflation', 'energy_generation'],
    },
    {
        key: 'glass',
        name: 'Glass & Facades',
        category: 'MANUFACTURED',
        tiers: {
            LOW:  { requirements: [{ stat: 'manufacturing_output', min: 20 }] },
            STD:  { requirements: [{ stat: 'manufacturing_output', min: 40 }, { stat: 'standard_of_living', min: 35 }] },
            HIGH: { requirements: [{ stat: 'manufacturing_output', min: 60 }, { stat: 'digital_infrastructure', min: 40 }, { stat: 'higher_education', min: 50 }] },
        },
        priceDrivers: ['manufacturing_output', 'standard_of_living', 'inflation'],
    },
    {
        key: 'asphalt',
        name: 'Asphalt',
        category: 'RAW',
        tiers: {
            LOW:  { requirements: [{ stat: 'oil_and_gas', min: 10 }] },
            STD:  { requirements: [{ stat: 'oil_and_gas', min: 30 }, { stat: 'manufacturing_output', min: 25 }] },
            HIGH: { requirements: [{ stat: 'oil_and_gas', min: 45 }, { stat: 'manufacturing_output', min: 40 }, { stat: 'physical_infrastructure', min: 40 }] },
        },
        priceDrivers: ['oil_and_gas', 'manufacturing_output', 'inflation', 'fuel_prices'],
    },
    {
        key: 'heavy',
        name: 'Heavy Machinery Parts',
        category: 'MANUFACTURED',
        tiers: {
            LOW:  { requirements: [{ stat: 'manufacturing_output', min: 40 }, { stat: 'rare_minerals', min: 30 }] },
            STD:  { requirements: [{ stat: 'manufacturing_output', min: 60 }, { stat: 'rare_minerals', min: 45 }, { stat: 'higher_education', min: 40 }] },
            HIGH: { requirements: [{ stat: 'manufacturing_output', min: 75 }, { stat: 'rare_minerals', min: 60 }, { stat: 'higher_education', min: 55 }, { stat: 'digital_infrastructure', min: 45 }] },
        },
        priceDrivers: ['manufacturing_output', 'rare_minerals', 'higher_education', 'digital_infrastructure'],
    },
];

/**
 * Check if a quality tier is available in a nation.
 * @param {string} materialKey - e.g. "concrete", "steel"
 * @param {string} tier - "LOW", "STD", or "HIGH"
 * @param {object} nation - nation row with stat columns
 * @returns {{ available: boolean, failedStat?: string, failedMin?: number, nationValue?: number }}
 */
export function checkTierAvailability(materialKey, tier, nation) {
    const mat = MATERIALS.find(m => m.key === materialKey);
    if (!mat) return { available: false, failedStat: 'unknown_material' };

    const tierDef = mat.tiers[tier];
    if (!tierDef) return { available: false, failedStat: 'unknown_tier' };

    for (const req of tierDef.requirements) {
        const nationValue = Number(nation?.[req.stat] ?? 0);
        if (nationValue < req.min) {
            return {
                available: false,
                failedStat: req.stat,
                failedMin: req.min,
                nationValue,
            };
        }
    }

    return { available: true };
}

/**
 * Get all tier availability for a material in a nation.
 * @param {string} materialKey
 * @param {object} nation
 * @returns {{ LOW: object, STD: object, HIGH: object }}
 */
export function getMaterialAvailability(materialKey, nation) {
    return {
        LOW: checkTierAvailability(materialKey, 'LOW', nation),
        STD: checkTierAvailability(materialKey, 'STD', nation),
        HIGH: checkTierAvailability(materialKey, 'HIGH', nation),
    };
}

/**
 * Calculate base price per unit for a material tier in a nation.
 * Price is driven by the nation's stats — higher stats = better supply = lower prices.
 * Lower stats = scarcity = higher prices.
 *
 * @param {string} materialKey
 * @param {string} tier - "LOW", "STD", "HIGH"
 * @param {object} nation
 * @returns {number} price per unit in dollars
 */
export function calculateBasePrice(materialKey, tier, nation) {
    // Base prices per material (at stat=50 baseline)
    const BASE_PRICES = {
        concrete:  { LOW: 200, STD: 300, HIGH: 500 },
        steel:     { LOW: 400, STD: 700, HIGH: 1200 },
        lumber:    { LOW: 80,  STD: 130, HIGH: 200 },
        aggregate: { LOW: 40,  STD: 60,  HIGH: 100 },
        em:        { LOW: 400, STD: 700, HIGH: 1200 },
        glass:     { LOW: 300, STD: 500, HIGH: 900 },
        asphalt:   { LOW: 120, STD: 200, HIGH: 350 },
        heavy:     { LOW: 800, STD: 1400, HIGH: 2400 },
    };

    const basePrice = BASE_PRICES[materialKey]?.[tier];
    if (!basePrice) return 0;

    const mat = MATERIALS.find(m => m.key === materialKey);
    if (!mat) return basePrice;

    // Price modifier: average of driver stats inverted.
    // High stats = lower prices (better supply), low stats = higher prices (scarcity).
    // inflation directly increases price, others inversely affect it.
    let modifier = 1.0;
    for (const statKey of mat.priceDrivers) {
        const val = Number(nation?.[statKey] ?? 50);
        if (statKey === 'inflation' || statKey === 'fuel_prices') {
            // Higher inflation/fuel = higher prices
            modifier *= 1 + ((val - 50) / 200);
        } else {
            // Higher production stats = lower prices
            modifier *= 1 - ((val - 50) / 250);
        }
    }

    // Clamp modifier between 0.4 and 2.5
    modifier = Math.max(0.4, Math.min(2.5, modifier));

    return Math.round(basePrice * modifier);
}

/**
 * Calculate supply per tick for a material tier in a nation.
 * Higher production stats = more supply available.
 *
 * @param {string} materialKey
 * @param {string} tier
 * @param {object} nation
 * @returns {number} units available per tick
 */
export function calculateSupply(materialKey, tier, nation) {
    const BASE_SUPPLY = {
        concrete:  { LOW: 5000, STD: 3000, HIGH: 1000 },
        steel:     { LOW: 2000, STD: 1500, HIGH: 500 },
        lumber:    { LOW: 8000, STD: 4000, HIGH: 1500 },
        aggregate: { LOW: 15000, STD: 6000, HIGH: 2000 },
        em:        { LOW: 1000, STD: 700, HIGH: 300 },
        glass:     { LOW: 1500, STD: 800, HIGH: 300 },
        asphalt:   { LOW: 4000, STD: 2000, HIGH: 800 },
        heavy:     { LOW: 400, STD: 200, HIGH: 80 },
    };

    const base = BASE_SUPPLY[materialKey]?.[tier] || 0;

    // Primary driver stat for this material scales supply
    const mat = MATERIALS.find(m => m.key === materialKey);
    const primaryStat = mat?.priceDrivers?.[0];
    const statVal = primaryStat ? Number(nation?.[primaryStat] ?? 50) : 50;

    // Supply scales linearly with primary stat: 0.3x at stat=0, 1.0x at stat=50, 1.7x at stat=100
    const scale = 0.3 + (statVal / 50) * 0.7;
    return Math.round(base * scale);
}

/**
 * Calculate import cost multiplier for buying from another nation.
 * Based on fuel_prices, physical_infrastructure, and tariffs.
 *
 * @param {object} sourceNation - nation exporting the material
 * @param {object} destNation - nation importing (your HQ)
 * @param {string} category - "RAW" or "MANUFACTURED"
 * @returns {number} multiplier (e.g. 1.35 = 35% markup)
 */
export function calculateImportMultiplier(sourceNation, destNation, category) {
    const fuelCost = Number(destNation?.fuel_prices ?? 50);
    const srcInfra = Number(sourceNation?.physical_infrastructure ?? 50);
    const dstInfra = Number(destNation?.physical_infrastructure ?? 50);

    // Base transport markup: 10-40% depending on fuel and infrastructure
    const transportMult = 1 + (fuelCost / 200) + ((100 - srcInfra) / 500) + ((100 - dstInfra) / 500);

    // Tariff markup — would come from nation's trade policy
    // For now, placeholder: raw materials tariff vs manufactured goods tariff
    // These will be read from the nation's tariff settings once wired
    // Tariff rate: will be read from nation trade policy when tariff system is wired
    const tariffRate = 0;

    return Math.max(1.05, transportMult + tariffRate);
}

export const QUALITY_TIERS = ['LOW', 'STD', 'HIGH'];
export const QUALITY_LABELS = { LOW: 'Low', STD: 'Standard', HIGH: 'High' };
