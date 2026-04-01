/**
 * construction-contracts.js — Contract templates for automated government bid generation
 *
 * Three sub-sectors:
 *   1. Civil Engineering ($30M–$300M) — always at least 1 per generation cycle
 *   2. Industrial Construction ($200M–$800M)
 *   3. Mega Projects ($800M–$4B) — GDP 75+ only, 360-tick cooldown per nation
 *
 * Generation rules (every 3 ticks per nation):
 *   GDP 0–25:  0 contracts
 *   GDP 26–50: 1 contract
 *   GDP 51–74: 2 contracts
 *   GDP 75–100: 4 contracts
 *
 * Materials (from the 8-material system):
 *   Concrete, Steel, Lumber, Aggregate, E&M Systems, Glass & Facades, Asphalt, Heavy Machinery Parts
 *
 * Equipment (from the 8-vehicle system, Tier 1 + Tier 2):
 *   T1: Work Trucks, Excavators, Bulldozers, Concrete Mixers
 *   T2: Tower Cranes, Heavy Haulers, Pile Drivers, Asphalt Plants
 *
 * Workforce:
 *   General — laborers, helpers, site workers
 *   Skilled — GCs, architects, engineers, foremen
 */

// ── Material keys ──
// Each template specifies which of the 8 materials are required and a quantity range [min, max]
// Quantities are in abstract "units" — scaled by project budget at generation time

// ── Equipment keys ──
// Each template specifies required equipment by key

// ════════════════════════════════════════════════════════════════════════════════
//  CIVIL ENGINEERING TEMPLATES ($30M – $300M)
// ════════════════════════════════════════════════════════════════════════════════

export const CIVIL_ENGINEERING = [
    {
        key: 'national_hospital',
        name: 'National Hospital',
        description: 'A major national healthcare facility with emergency, surgical, and specialist wings.',
        budgetRange: [120_000_000, 280_000_000],
        timelineTicks: [8, 14],
        materials: {
            concrete: [8, 14], steel: [6, 10], lumber: [3, 5],
            glass_facades: [4, 7], em_systems: [5, 8], heavy_parts: [2, 4],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes'],
        workforce: { general: [100, 160], skilled: [30, 50] },
    },
    {
        key: 'regional_hospital',
        name: 'Regional Hospital',
        description: 'A mid-size hospital serving a regional population with general and emergency care.',
        budgetRange: [50_000_000, 130_000_000],
        timelineTicks: [6, 10],
        materials: {
            concrete: [5, 9], steel: [3, 6], lumber: [2, 4],
            glass_facades: [2, 4], em_systems: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers'],
        workforce: { general: [60, 100], skilled: [15, 30] },
    },
    {
        key: 'primary_school',
        name: 'Primary School Complex',
        description: 'A public primary school with classrooms, gymnasium, and administrative offices.',
        budgetRange: [30_000_000, 60_000_000],
        timelineTicks: [4, 7],
        materials: {
            concrete: [4, 6], lumber: [3, 5], steel: [2, 3],
            glass_facades: [1, 3], em_systems: [2, 3],
        },
        equipment: ['work_trucks', 'concrete_mixers', 'bulldozers'],
        workforce: { general: [40, 70], skilled: [10, 20] },
    },
    {
        key: 'secondary_school',
        name: 'Secondary School & Vocational Center',
        description: 'A secondary school with science labs, workshops, and vocational training facilities.',
        budgetRange: [40_000_000, 85_000_000],
        timelineTicks: [5, 8],
        materials: {
            concrete: [4, 7], steel: [3, 5], lumber: [2, 4],
            glass_facades: [2, 4], em_systems: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers'],
        workforce: { general: [50, 80], skilled: [12, 25] },
    },
    {
        key: 'highway_extension',
        name: 'Highway Extension',
        description: 'A multi-lane highway extension connecting major population centers.',
        budgetRange: [80_000_000, 250_000_000],
        timelineTicks: [8, 16],
        materials: {
            asphalt: [10, 18], aggregate: [8, 14], concrete: [5, 9],
            steel: [3, 6], heavy_parts: [2, 4],
        },
        equipment: ['work_trucks', 'bulldozers', 'excavators', 'heavy_haulers', 'asphalt_plants'],
        workforce: { general: [120, 180], skilled: [20, 40] },
    },
    {
        key: 'urban_road_network',
        name: 'Urban Road Resurfacing',
        description: 'Comprehensive resurfacing and repair of urban road networks.',
        budgetRange: [30_000_000, 80_000_000],
        timelineTicks: [4, 8],
        materials: {
            asphalt: [6, 12], aggregate: [5, 9], concrete: [2, 4],
        },
        equipment: ['work_trucks', 'bulldozers', 'asphalt_plants'],
        workforce: { general: [60, 100], skilled: [10, 20] },
    },
    {
        key: 'government_office',
        name: 'Government Office Complex',
        description: 'A multi-story government administrative building with secure facilities.',
        budgetRange: [60_000_000, 150_000_000],
        timelineTicks: [6, 10],
        materials: {
            concrete: [6, 10], steel: [5, 8], glass_facades: [4, 7],
            em_systems: [4, 6], lumber: [2, 3],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes'],
        workforce: { general: [80, 130], skilled: [20, 35] },
    },
    {
        key: 'public_housing',
        name: 'Public Housing Development',
        description: 'Affordable housing blocks with community facilities and green spaces.',
        budgetRange: [40_000_000, 120_000_000],
        timelineTicks: [6, 12],
        materials: {
            concrete: [7, 12], steel: [4, 7], lumber: [4, 7],
            glass_facades: [2, 4], em_systems: [3, 5], aggregate: [2, 4],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes'],
        workforce: { general: [80, 140], skilled: [15, 30] },
    },
    {
        key: 'bridge_construction',
        name: 'River Bridge',
        description: 'A reinforced concrete and steel bridge spanning a major river crossing.',
        budgetRange: [70_000_000, 200_000_000],
        timelineTicks: [8, 14],
        materials: {
            concrete: [8, 14], steel: [8, 14], aggregate: [5, 8],
            heavy_parts: [3, 6],
        },
        equipment: ['work_trucks', 'excavators', 'pile_drivers', 'tower_cranes', 'heavy_haulers'],
        workforce: { general: [100, 160], skilled: [25, 45] },
    },
    {
        key: 'water_treatment',
        name: 'Water Treatment Plant',
        description: 'Municipal water treatment and purification facility serving urban areas.',
        budgetRange: [50_000_000, 140_000_000],
        timelineTicks: [6, 10],
        materials: {
            concrete: [6, 10], steel: [4, 7], em_systems: [5, 8],
            heavy_parts: [3, 5], aggregate: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'bulldozers'],
        workforce: { general: [70, 110], skilled: [20, 35] },
    },
];

// ════════════════════════════════════════════════════════════════════════════════
//  INDUSTRIAL CONSTRUCTION TEMPLATES ($200M – $800M)
// ════════════════════════════════════════════════════════════════════════════════

export const INDUSTRIAL_CONSTRUCTION = [
    {
        key: 'power_plant_gas',
        name: 'Natural Gas Power Plant',
        description: 'A combined-cycle natural gas power generation facility.',
        budgetRange: [300_000_000, 650_000_000],
        timelineTicks: [10, 18],
        materials: {
            concrete: [10, 16], steel: [10, 16], heavy_parts: [6, 10],
            em_systems: [6, 10], aggregate: [5, 8],
        },
        equipment: ['work_trucks', 'excavators', 'tower_cranes', 'heavy_haulers', 'pile_drivers', 'concrete_mixers'],
        workforce: { general: [160, 240], skilled: [50, 80] },
    },
    {
        key: 'solar_farm',
        name: 'Industrial Solar Farm',
        description: 'A large-scale photovoltaic installation with grid connection infrastructure.',
        budgetRange: [200_000_000, 450_000_000],
        timelineTicks: [8, 14],
        materials: {
            steel: [8, 14], em_systems: [8, 14], concrete: [4, 7],
            aggregate: [3, 6], heavy_parts: [3, 5],
        },
        equipment: ['work_trucks', 'bulldozers', 'excavators', 'heavy_haulers'],
        workforce: { general: [120, 180], skilled: [30, 50] },
    },
    {
        key: 'hydroelectric_dam',
        name: 'Hydroelectric Dam',
        description: 'A major hydroelectric power generation dam with reservoir management.',
        budgetRange: [450_000_000, 800_000_000],
        timelineTicks: [14, 24],
        materials: {
            concrete: [16, 24], steel: [10, 16], aggregate: [10, 16],
            heavy_parts: [6, 10], em_systems: [4, 8],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'tower_cranes', 'heavy_haulers', 'pile_drivers', 'concrete_mixers'],
        workforce: { general: [200, 300], skilled: [60, 100] },
    },
    {
        key: 'manufacturing_facility',
        name: 'Major Manufacturing Facility',
        description: 'A large-scale manufacturing and assembly plant with logistics infrastructure.',
        budgetRange: [250_000_000, 550_000_000],
        timelineTicks: [10, 16],
        materials: {
            steel: [12, 18], concrete: [8, 14], heavy_parts: [5, 9],
            em_systems: [5, 8], aggregate: [3, 5], glass_facades: [2, 4],
        },
        equipment: ['work_trucks', 'excavators', 'tower_cranes', 'heavy_haulers', 'concrete_mixers'],
        workforce: { general: [140, 220], skilled: [40, 65] },
    },
    {
        key: 'industrial_warehouse',
        name: 'Industrial Warehouse Complex',
        description: 'A massive logistics and warehousing facility with rail and road access.',
        budgetRange: [200_000_000, 400_000_000],
        timelineTicks: [8, 12],
        materials: {
            steel: [10, 16], concrete: [6, 10], aggregate: [4, 7],
            asphalt: [3, 5], em_systems: [3, 5],
        },
        equipment: ['work_trucks', 'bulldozers', 'excavators', 'heavy_haulers', 'concrete_mixers'],
        workforce: { general: [100, 160], skilled: [25, 40] },
    },
    {
        key: 'port_expansion',
        name: 'Commercial Port Expansion',
        description: 'Expansion of port facilities including new berths, cranes, and container yards.',
        budgetRange: [350_000_000, 700_000_000],
        timelineTicks: [12, 20],
        materials: {
            concrete: [12, 20], steel: [10, 16], aggregate: [8, 12],
            heavy_parts: [5, 8], em_systems: [4, 7],
        },
        equipment: ['work_trucks', 'excavators', 'pile_drivers', 'tower_cranes', 'heavy_haulers', 'bulldozers'],
        workforce: { general: [180, 260], skilled: [50, 80] },
    },
    {
        key: 'refinery',
        name: 'Oil Refinery Module',
        description: 'A new processing module for an existing refinery complex.',
        budgetRange: [400_000_000, 750_000_000],
        timelineTicks: [12, 20],
        materials: {
            steel: [14, 22], heavy_parts: [8, 14], concrete: [8, 12],
            em_systems: [6, 10], aggregate: [4, 6],
        },
        equipment: ['work_trucks', 'tower_cranes', 'heavy_haulers', 'excavators', 'pile_drivers', 'concrete_mixers'],
        workforce: { general: [160, 240], skilled: [55, 90] },
    },
    {
        key: 'rail_freight_terminal',
        name: 'Rail Freight Terminal',
        description: 'A major rail freight interchange with sorting yards and loading facilities.',
        budgetRange: [200_000_000, 450_000_000],
        timelineTicks: [10, 16],
        materials: {
            steel: [8, 14], concrete: [6, 10], aggregate: [6, 10],
            asphalt: [4, 7], heavy_parts: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'heavy_haulers', 'asphalt_plants'],
        workforce: { general: [120, 180], skilled: [30, 50] },
    },
    {
        key: 'desalination_plant',
        name: 'Desalination Plant',
        description: 'A reverse-osmosis desalination facility providing fresh water to coastal cities.',
        budgetRange: [250_000_000, 500_000_000],
        timelineTicks: [10, 16],
        materials: {
            concrete: [8, 14], steel: [6, 10], em_systems: [6, 10],
            heavy_parts: [4, 7], aggregate: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes', 'pile_drivers'],
        workforce: { general: [120, 180], skilled: [35, 60] },
    },
    {
        key: 'wind_farm',
        name: 'Offshore Wind Farm',
        description: 'An offshore wind energy installation with turbine foundations and grid connection.',
        budgetRange: [350_000_000, 700_000_000],
        timelineTicks: [12, 20],
        materials: {
            steel: [12, 20], concrete: [6, 10], heavy_parts: [8, 14],
            em_systems: [6, 10], aggregate: [3, 5],
        },
        equipment: ['work_trucks', 'heavy_haulers', 'tower_cranes', 'pile_drivers'],
        workforce: { general: [140, 200], skilled: [45, 75] },
    },
];

// ════════════════════════════════════════════════════════════════════════════════
//  MEGA PROJECT TEMPLATES ($800M – $4B)
//  GDP 75+ only. 360-tick cooldown per nation after one is completed.
// ════════════════════════════════════════════════════════════════════════════════

export const MEGA_PROJECTS = [
    {
        key: 'sports_stadium',
        name: 'National Sports Stadium',
        description: 'A world-class multi-sport stadium with 50,000+ seating capacity.',
        budgetRange: [800_000_000, 1_500_000_000],
        timelineTicks: [18, 30],
        materials: {
            concrete: [20, 30], steel: [18, 28], glass_facades: [8, 14],
            em_systems: [8, 14], heavy_parts: [6, 10], aggregate: [6, 10],
            lumber: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'pile_drivers'],
        workforce: { general: [300, 500], skilled: [80, 140] },
    },
    {
        key: 'international_airport',
        name: 'New International Airport',
        description: 'A full-scale international airport with terminal, runways, and control tower.',
        budgetRange: [2_000_000_000, 4_000_000_000],
        timelineTicks: [24, 36],
        materials: {
            concrete: [24, 36], steel: [18, 28], asphalt: [14, 22],
            aggregate: [12, 18], glass_facades: [8, 14], em_systems: [10, 16],
            heavy_parts: [6, 10],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'pile_drivers', 'asphalt_plants'],
        workforce: { general: [400, 600], skilled: [120, 200] },
    },
    {
        key: 'metro_system',
        name: 'Metro Rail System',
        description: 'An underground metropolitan rail transit system with multiple stations.',
        budgetRange: [1_500_000_000, 3_500_000_000],
        timelineTicks: [24, 36],
        materials: {
            concrete: [24, 36], steel: [20, 30], aggregate: [12, 18],
            em_systems: [10, 16], heavy_parts: [8, 12],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'tower_cranes', 'heavy_haulers', 'pile_drivers', 'concrete_mixers'],
        workforce: { general: [400, 600], skilled: [100, 160] },
    },
    {
        key: 'convention_center',
        name: 'International Convention Center',
        description: 'A massive exhibition and convention complex with hotels and conference halls.',
        budgetRange: [800_000_000, 1_800_000_000],
        timelineTicks: [16, 28],
        materials: {
            concrete: [16, 24], steel: [14, 22], glass_facades: [10, 16],
            em_systems: [8, 12], lumber: [4, 7], heavy_parts: [4, 7],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'pile_drivers'],
        workforce: { general: [250, 400], skilled: [70, 120] },
    },
    {
        key: 'high_speed_rail',
        name: 'High-Speed Rail Corridor',
        description: 'A dedicated high-speed rail line connecting two major cities.',
        budgetRange: [2_500_000_000, 4_000_000_000],
        timelineTicks: [24, 36],
        materials: {
            steel: [22, 34], concrete: [18, 28], aggregate: [14, 22],
            asphalt: [6, 10], heavy_parts: [8, 14], em_systems: [6, 10],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'heavy_haulers', 'pile_drivers', 'asphalt_plants', 'tower_cranes', 'concrete_mixers'],
        workforce: { general: [500, 700], skilled: [120, 200] },
    },
    {
        key: 'university_campus',
        name: 'National University Campus',
        description: 'A complete university campus with lecture halls, labs, dormitories, and sports facilities.',
        budgetRange: [900_000_000, 1_600_000_000],
        timelineTicks: [16, 26],
        materials: {
            concrete: [16, 24], steel: [10, 16], glass_facades: [8, 12],
            lumber: [6, 10], em_systems: [6, 10], aggregate: [4, 6],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'bulldozers'],
        workforce: { general: [250, 400], skilled: [60, 100] },
    },
    {
        key: 'satellite_city',
        name: 'Satellite City Development',
        description: 'A planned urban development with residential, commercial, and civic infrastructure.',
        budgetRange: [1_800_000_000, 3_800_000_000],
        timelineTicks: [24, 36],
        materials: {
            concrete: [24, 36], steel: [16, 24], aggregate: [12, 18],
            asphalt: [10, 16], glass_facades: [8, 12], em_systems: [8, 12],
            lumber: [6, 10], heavy_parts: [4, 7],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'pile_drivers', 'asphalt_plants'],
        workforce: { general: [500, 700], skilled: [130, 200] },
    },
    {
        key: 'naval_base',
        name: 'Naval Base Construction',
        description: 'A military naval base with dry docks, piers, and support facilities.',
        budgetRange: [1_200_000_000, 2_500_000_000],
        timelineTicks: [20, 30],
        materials: {
            concrete: [20, 30], steel: [16, 24], heavy_parts: [8, 14],
            aggregate: [8, 12], em_systems: [6, 10],
        },
        equipment: ['work_trucks', 'excavators', 'pile_drivers', 'tower_cranes', 'heavy_haulers', 'bulldozers', 'concrete_mixers'],
        workforce: { general: [300, 500], skilled: [80, 140] },
    },
    {
        key: 'opera_house',
        name: 'National Opera House',
        description: 'An iconic cultural landmark with world-class acoustics and architectural design.',
        budgetRange: [800_000_000, 1_400_000_000],
        timelineTicks: [16, 26],
        materials: {
            concrete: [12, 18], steel: [10, 16], glass_facades: [10, 16],
            lumber: [6, 10], em_systems: [6, 10], heavy_parts: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes', 'heavy_haulers'],
        workforce: { general: [200, 350], skilled: [70, 120] },
    },
    {
        key: 'flood_defense',
        name: 'National Flood Defense System',
        description: 'A comprehensive flood barrier and water management system protecting coastal areas.',
        budgetRange: [1_000_000_000, 2_200_000_000],
        timelineTicks: [18, 28],
        materials: {
            concrete: [22, 32], steel: [14, 22], aggregate: [12, 18],
            heavy_parts: [6, 10], em_systems: [4, 7],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'pile_drivers', 'tower_cranes', 'heavy_haulers', 'concrete_mixers'],
        workforce: { general: [300, 450], skilled: [80, 130] },
    },
];

// ════════════════════════════════════════════════════════════════════════════════
//  GENERATION CONFIG
// ════════════════════════════════════════════════════════════════════════════════

export const CONTRACT_GENERATION = {
    TICK_INTERVAL: 3,           // generate every 3 ticks
    BIDDING_WINDOW_TICKS: 3,    // bids open for 3 ticks
    MEGA_PROJECT_COOLDOWN: 360, // 360 ticks (30 years) between mega projects per nation
    MEGA_PROJECT_MIN_GDP: 75,   // GDP must be 75+ for mega projects
    GDP_TIERS: [
        { min: 0,  max: 25,  contracts: 0 },
        { min: 26, max: 50,  contracts: 1 },
        { min: 51, max: 74,  contracts: 2 },
        { min: 75, max: 100, contracts: 4 },
    ],
};

// Helper: pick a random value in a range [min, max]
export function randRange(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// Helper: pick a random item from an array
export function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
