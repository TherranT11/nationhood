// ══════════════════════════════════════════════════════════════════════
//  Construction Equipment — definitions, tiers, pricing, maintenance
// ══════════════════════════════════════════════════════════════════════

export const EQUIPMENT_TIERS = {
    1: { name: 'Light Infrastructure', tag: 'TIER 1', color: '#8b9a6b' },
    2: { name: 'Heavy Infrastructure', tag: 'TIER 2', color: '#c8a832' },
    3: { name: 'Megaprojects',         tag: 'TIER 3', color: '#c84' },
};

export const EQUIPMENT = [
    // ── Tier 1: Light Infrastructure ──
    {
        key: 'trucks',
        name: 'Work Trucks',
        tier: 1,
        basePrice: 280000,
        maintenancePerUnit: 1500,      // $/tick per unit
        conditionDecayRate: 2,          // %/tick when deployed
        startingOwned: 4,               // new corps start with these
    },
    {
        key: 'excavators',
        name: 'Excavators',
        tier: 1,
        basePrice: 1500000,
        maintenancePerUnit: 5500,
        conditionDecayRate: 2,
        startingOwned: 2,
    },
    {
        key: 'bulldozers',
        name: 'Bulldozers',
        tier: 1,
        basePrice: 1200000,
        maintenancePerUnit: 7000,
        conditionDecayRate: 2,
        startingOwned: 1,
    },
    {
        key: 'mixers',
        name: 'Concrete Mixers',
        tier: 1,
        basePrice: 800000,
        maintenancePerUnit: 4500,
        conditionDecayRate: 2,
        startingOwned: 2,
    },

    // ── Tier 2: Heavy Infrastructure ──
    {
        key: 'cranes',
        name: 'Tower Cranes',
        tier: 2,
        basePrice: 7200000,
        maintenancePerUnit: 32500,
        conditionDecayRate: 2,
        startingOwned: 0,
    },
    {
        key: 'haulers',
        name: 'Heavy Haulers',
        tier: 2,
        basePrice: 3500000,
        maintenancePerUnit: 15000,
        conditionDecayRate: 2,
        startingOwned: 0,
    },
    {
        key: 'piledrivers',
        name: 'Pile Drivers',
        tier: 2,
        basePrice: 4800000,
        maintenancePerUnit: 18000,
        conditionDecayRate: 2,
        startingOwned: 0,
    },
    {
        key: 'asphalt',
        name: 'Asphalt Plants',
        tier: 2,
        basePrice: 5500000,
        maintenancePerUnit: 22000,
        conditionDecayRate: 2,
        startingOwned: 0,
    },

    // ── Tier 3: Megaprojects ──
    {
        key: 'industrial',
        name: 'Industrial Cranes',
        tier: 3,
        basePrice: 18000000,
        maintenancePerUnit: 85000,
        conditionDecayRate: 2,
        startingOwned: 0,
    },
    {
        key: 'tbm',
        name: 'Tunnel Boring Machines',
        tier: 3,
        basePrice: 45000000,
        maintenancePerUnit: 200000,
        conditionDecayRate: 2,
        startingOwned: 0,
    },
    {
        key: 'dredge',
        name: 'Dredging Equipment',
        tier: 3,
        basePrice: 22000000,
        maintenancePerUnit: 95000,
        conditionDecayRate: 2,
        startingOwned: 0,
    },
];

/**
 * Get equipment definition by key.
 */
export function getEquipment(key) {
    return EQUIPMENT.find(e => e.key === key);
}

/**
 * Get all equipment for a tier.
 */
export function getEquipmentByTier(tier) {
    return EQUIPMENT.filter(e => e.tier === tier);
}

/**
 * Calculate market price for equipment in a nation.
 * Factors: base price × inflation × fuel × manufacturing × demand
 *
 * @param {string} equipmentKey
 * @param {object} nation - nation row with stat columns
 * @param {object} opts - { used: boolean, condition: number }
 * @returns {number} price per unit
 */
export function calculateEquipmentPrice(equipmentKey, nation, opts = {}) {
    const eq = getEquipment(equipmentKey);
    if (!eq) return 0;

    let price = eq.basePrice;

    // Inflation modifier: higher inflation = higher prices
    const inflation = Number(nation?.inflation ?? 50);
    price *= 1 + ((inflation - 50) / 200);

    // Fuel transport cost: higher fuel = more expensive delivery
    const fuel = Number(nation?.fuel_prices ?? 50);
    price *= 1 + ((fuel - 50) / 300);

    // Manufacturing output: higher output = better supply = lower prices
    const mfg = Number(nation?.manufacturing_output ?? 50);
    price *= 1 - ((mfg - 50) / 400);

    // Tier 2/3 scarcity: less domestic supply for advanced equipment
    if (eq.tier === 2 && mfg < 40) price *= 1.15;
    if (eq.tier === 3 && mfg < 60) price *= 1.25;

    // Used equipment discount based on condition
    if (opts.used && opts.condition != null) {
        price *= opts.condition / 100;
    }

    return Math.round(Math.max(eq.basePrice * 0.3, price));
}

/**
 * Calculate import cost multiplier for buying from another nation.
 *
 * @param {object} sourceNation
 * @param {object} destNation
 * @returns {{ multiplier: number, tariff: number, transport: number, deliveryTicks: number }}
 */
export function calculateEquipmentImportCost(sourceNation, destNation) {
    const fuelCost = Number(destNation?.fuel_prices ?? 50);
    const srcInfra = Number(sourceNation?.physical_infrastructure ?? 50);
    const dstInfra = Number(destNation?.physical_infrastructure ?? 50);

    // Transport: 5-15% based on infrastructure quality
    const transportPct = 0.05 + ((100 - srcInfra) / 1000) + ((100 - dstInfra) / 1000) + (fuelCost / 500);

    // Tariff: manufactured goods tariff (equipment is manufactured)
    // Placeholder — will read from trade policy when tariff system is wired
    const tariffPct = 0.12;

    // Delivery time: 1 tick per "distance" (based on continent)
    // Same continent: 1-2 ticks, different: 3-4 ticks
    const srcContinent = sourceNation?.continent || 'unknown';
    const dstContinent = destNation?.continent || 'unknown';
    const deliveryTicks = srcContinent === dstContinent ? 2 : 4;

    return {
        multiplier: 1 + transportPct + tariffPct,
        tariff: tariffPct,
        transport: transportPct,
        deliveryTicks,
    };
}

/**
 * Calculate supply available per tick for an equipment type in a nation.
 * Higher manufacturing = more supply.
 *
 * @param {string} equipmentKey
 * @param {object} nation
 * @returns {{ newAvailable: number, usedAvailable: number, usedCondition: number }}
 */
export function calculateEquipmentSupply(equipmentKey, nation) {
    const eq = getEquipment(equipmentKey);
    if (!eq) return { newAvailable: 0, usedAvailable: 0, usedCondition: 50 };

    const mfg = Number(nation?.manufacturing_output ?? 50);

    // Base supply scales with manufacturing output and tier
    const tierMult = eq.tier === 1 ? 1.0 : eq.tier === 2 ? 0.4 : 0.15;
    const newBase = eq.tier === 1 ? 8 : eq.tier === 2 ? 2 : 1;
    const newAvailable = Math.max(0, Math.round(newBase * tierMult * (mfg / 50)));

    // Used equipment: more available in developed nations
    const usedBase = eq.tier === 1 ? 4 : eq.tier === 2 ? 1 : 0;
    const usedAvailable = Math.max(0, Math.round(usedBase * (mfg / 60)));
    const usedCondition = 40 + Math.round(Math.random() * 35); // 40-75% condition

    return { newAvailable, usedAvailable, usedCondition };
}

/**
 * Calculate total maintenance cost per tick for all equipment.
 *
 * @param {Array} equipmentRows - rows from corp_equipment table
 * @returns {number} total maintenance cost
 */
export function calculateTotalMaintenance(equipmentRows) {
    let total = 0;
    for (const row of (equipmentRows || [])) {
        const eq = getEquipment(row.equipment_key);
        if (eq && row.owned > 0) {
            total += eq.maintenancePerUnit * row.owned;
        }
    }
    return total;
}

/**
 * Get condition color for display.
 */
export function conditionColor(v) {
    if (v >= 75) return '#5c5';
    if (v >= 50) return '#ca5';
    if (v >= 25) return '#c84';
    return '#c55';
}

/**
 * Get the starting equipment for a new construction corporation.
 * Returns an array of { equipment_key, owned, condition } objects.
 */
export function getStartingEquipment() {
    return EQUIPMENT
        .filter(e => e.startingOwned > 0)
        .map(e => ({
            equipment_key: e.key,
            tier: e.tier,
            owned: e.startingOwned,
            deployed: 0,
            condition: 100,
            maintenance_per_tick: e.maintenancePerUnit * e.startingOwned,
        }));
}
