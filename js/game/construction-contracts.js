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
 *   MAX OPEN PROJECTS = active_corporations + 2
 *   Civil engineering always gets at least 1 slot
 *   Mega projects only at GDP 75+, 360-tick cooldown
 */

// ════════════════════════════════════════════════════════════════════════════════
//  CIVIL ENGINEERING TEMPLATES ($30M – $300M)
// ════════════════════════════════════════════════════════════════════════════════

export const CIVIL_ENGINEERING = [
    {
        key: 'municipal_hospital',
        name: 'Municipal Hospital',
        description: 'A healthcare facility with 200-400 beds, emergency wing, and outpatient services.',
        budgetRange: [80_000_000, 220_000_000],
        timelineTicks: [6, 12],
        materials: {
            concrete: [6, 10], steel: [4, 8], lumber: [2, 4],
            glass_facades: [3, 5], em_systems: [4, 7], heavy_parts: [1, 3],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes'],
        workforce: { general: [80, 140], skilled: [25, 45] },
    },
    {
        key: 'regional_school',
        name: 'Regional School Complex',
        description: 'An 8-16 classroom school with gymnasium, science labs, and library.',
        budgetRange: [30_000_000, 75_000_000],
        timelineTicks: [4, 8],
        materials: {
            concrete: [4, 7], lumber: [3, 5], steel: [2, 4],
            glass_facades: [1, 3], em_systems: [2, 4],
        },
        equipment: ['work_trucks', 'concrete_mixers', 'bulldozers'],
        workforce: { general: [40, 80], skilled: [10, 22] },
    },
    {
        key: 'highway_extension',
        name: 'Highway Extension',
        description: 'A 20-80km arterial road segment with interchanges and service roads.',
        budgetRange: [100_000_000, 300_000_000],
        timelineTicks: [8, 16],
        materials: {
            asphalt: [10, 18], aggregate: [8, 14], concrete: [4, 8],
            steel: [2, 5], heavy_parts: [2, 4],
        },
        equipment: ['work_trucks', 'bulldozers', 'excavators', 'heavy_haulers', 'asphalt_plants'],
        workforce: { general: [120, 180], skilled: [20, 40] },
    },
    {
        key: 'public_housing',
        name: 'Public Housing Development',
        description: 'A 200-600 unit residential development with community facilities and green space.',
        budgetRange: [50_000_000, 150_000_000],
        timelineTicks: [6, 12],
        materials: {
            concrete: [6, 11], steel: [4, 7], lumber: [4, 7],
            glass_facades: [2, 4], em_systems: [3, 5], aggregate: [2, 4],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes'],
        workforce: { general: [80, 140], skilled: [15, 30] },
    },
    {
        key: 'water_treatment',
        name: 'Water Treatment Facility',
        description: 'A municipal water processing plant serving urban and peri-urban areas.',
        budgetRange: [60_000_000, 160_000_000],
        timelineTicks: [6, 10],
        materials: {
            concrete: [6, 10], steel: [4, 7], em_systems: [5, 8],
            heavy_parts: [3, 5], aggregate: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'bulldozers'],
        workforce: { general: [70, 110], skilled: [20, 35] },
    },
    {
        key: 'government_office',
        name: 'Government Office Building',
        description: 'A multi-story administrative complex with secure facilities and public services.',
        budgetRange: [60_000_000, 160_000_000],
        timelineTicks: [6, 10],
        materials: {
            concrete: [6, 10], steel: [5, 8], glass_facades: [4, 7],
            em_systems: [4, 6], lumber: [2, 3],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes'],
        workforce: { general: [80, 130], skilled: [20, 35] },
    },
    {
        key: 'bridge_construction',
        name: 'Bridge Construction',
        description: 'A river crossing, overpass, or major interchange structure.',
        budgetRange: [80_000_000, 250_000_000],
        timelineTicks: [8, 14],
        materials: {
            concrete: [8, 14], steel: [8, 14], aggregate: [5, 8],
            heavy_parts: [3, 6],
        },
        equipment: ['work_trucks', 'excavators', 'pile_drivers', 'tower_cranes', 'heavy_haulers'],
        workforce: { general: [100, 160], skilled: [25, 45] },
    },
    {
        key: 'transit_station',
        name: 'Public Transit Station',
        description: 'A bus terminal or rail stop with platforms, ticketing, and passenger facilities.',
        budgetRange: [30_000_000, 90_000_000],
        timelineTicks: [4, 8],
        materials: {
            concrete: [4, 7], steel: [3, 5], glass_facades: [2, 4],
            em_systems: [2, 4], aggregate: [2, 3],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers'],
        workforce: { general: [50, 90], skilled: [12, 25] },
    },
    {
        key: 'waste_processing',
        name: 'Municipal Waste Processing Plant',
        description: 'A solid waste or sewage processing facility with environmental controls.',
        budgetRange: [50_000_000, 130_000_000],
        timelineTicks: [6, 10],
        materials: {
            concrete: [5, 9], steel: [4, 7], em_systems: [4, 7],
            heavy_parts: [3, 5], aggregate: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'concrete_mixers'],
        workforce: { general: [60, 100], skilled: [18, 30] },
    },
    {
        key: 'flood_defense',
        name: 'Coastal Flood Defense System',
        description: 'Seawalls, levees, and drainage infrastructure protecting coastal settlements.',
        budgetRange: [70_000_000, 200_000_000],
        timelineTicks: [8, 14],
        materials: {
            concrete: [10, 16], steel: [6, 10], aggregate: [6, 10],
            heavy_parts: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'pile_drivers', 'heavy_haulers'],
        workforce: { general: [100, 160], skilled: [22, 40] },
    },
];

// ════════════════════════════════════════════════════════════════════════════════
//  INDUSTRIAL CONSTRUCTION TEMPLATES ($200M – $800M)
// ════════════════════════════════════════════════════════════════════════════════

export const INDUSTRIAL_CONSTRUCTION = [
    {
        key: 'power_station',
        name: 'Power Station',
        description: 'A coal, gas, or oil-fired electrical generating plant.',
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
        key: 'hydroelectric_dam',
        name: 'Hydroelectric Dam',
        description: 'A river dam with power generation turbines and reservoir management.',
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
        key: 'manufacturing_complex',
        name: 'Industrial Manufacturing Complex',
        description: 'A factory floor with warehousing, logistics infrastructure, and worker facilities.',
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
        key: 'oil_refinery',
        name: 'Oil Refinery Expansion',
        description: 'Processing, storage, and pipeline connection expansion for an existing refinery.',
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
        key: 'shipping_port',
        name: 'Commercial Shipping Port',
        description: 'Docks, container cranes, yard facilities, and road/rail connections.',
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
        key: 'military_installation',
        name: 'Military Installation',
        description: 'Barracks, armory, training grounds, and support infrastructure.',
        budgetRange: [200_000_000, 500_000_000],
        timelineTicks: [10, 16],
        materials: {
            concrete: [10, 16], steel: [6, 10], aggregate: [5, 8],
            lumber: [3, 5], em_systems: [4, 6], heavy_parts: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'concrete_mixers', 'heavy_haulers'],
        workforce: { general: [140, 200], skilled: [35, 55] },
    },
    {
        key: 'telecom_network',
        name: 'Telecommunications Tower Network',
        description: 'Regional deployment of 8-20 communications towers with fiber backbone.',
        budgetRange: [200_000_000, 400_000_000],
        timelineTicks: [8, 14],
        materials: {
            steel: [8, 14], concrete: [4, 7], em_systems: [8, 14],
            heavy_parts: [3, 5], aggregate: [2, 4],
        },
        equipment: ['work_trucks', 'excavators', 'heavy_haulers', 'tower_cranes'],
        workforce: { general: [80, 140], skilled: [30, 55] },
    },
    {
        key: 'railway_corridor',
        name: 'Railway Corridor',
        description: 'A 50-200km rail line with stations, signaling, and grade crossings.',
        budgetRange: [300_000_000, 650_000_000],
        timelineTicks: [12, 20],
        materials: {
            steel: [10, 16], concrete: [8, 12], aggregate: [8, 12],
            asphalt: [3, 5], heavy_parts: [4, 7],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'heavy_haulers', 'asphalt_plants', 'pile_drivers'],
        workforce: { general: [140, 220], skilled: [35, 60] },
    },
    {
        key: 'desalination_plant',
        name: 'Desalination Plant',
        description: 'A reverse-osmosis facility providing fresh water to coastal populations.',
        budgetRange: [250_000_000, 500_000_000],
        timelineTicks: [10, 16],
        materials: {
            concrete: [8, 14], steel: [6, 10], em_systems: [6, 10],
            heavy_parts: [4, 7], aggregate: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes', 'pile_drivers'],
        workforce: { general: [120, 180], skilled: [35, 60] },
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
        description: 'A world-class multi-sport stadium with 50,000+ seating capacity and hospitality suites.',
        budgetRange: [800_000_000, 1_500_000_000],
        timelineTicks: [18, 30],
        materials: {
            concrete: [20, 30], steel: [18, 28], glass_facades: [8, 14],
            em_systems: [8, 14], heavy_parts: [6, 10], aggregate: [6, 10], lumber: [3, 5],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'pile_drivers'],
        workforce: { general: [300, 500], skilled: [80, 140] },
    },
    {
        key: 'international_airport',
        name: 'International Airport',
        description: 'A full-scale international airport with terminals, runways, control tower, and cargo facilities.',
        budgetRange: [2_000_000_000, 4_000_000_000],
        timelineTicks: [24, 36],
        materials: {
            concrete: [24, 36], steel: [18, 28], asphalt: [14, 22],
            aggregate: [12, 18], glass_facades: [8, 14], em_systems: [10, 16], heavy_parts: [6, 10],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'pile_drivers', 'asphalt_plants'],
        workforce: { general: [400, 600], skilled: [120, 200] },
    },
    {
        key: 'high_speed_rail',
        name: 'High-Speed Rail Network',
        description: 'A dedicated high-speed rail line connecting major cities with purpose-built stations.',
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
        key: 'parliament_complex',
        name: 'National Parliament Complex',
        description: 'A monumental seat of government with chambers, offices, security, and public galleries.',
        budgetRange: [900_000_000, 1_800_000_000],
        timelineTicks: [18, 28],
        materials: {
            concrete: [16, 24], steel: [12, 18], glass_facades: [10, 16],
            lumber: [6, 10], em_systems: [6, 10], heavy_parts: [4, 6], aggregate: [4, 6],
        },
        equipment: ['work_trucks', 'excavators', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'pile_drivers'],
        workforce: { general: [250, 400], skilled: [70, 120] },
    },
    {
        key: 'national_freeway',
        name: 'National Freeway System',
        description: 'A multi-hundred kilometer freeway network with interchanges, bridges, and rest areas.',
        budgetRange: [1_500_000_000, 3_500_000_000],
        timelineTicks: [24, 36],
        materials: {
            asphalt: [20, 30], aggregate: [16, 24], concrete: [14, 22],
            steel: [10, 16], heavy_parts: [6, 10],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'heavy_haulers', 'asphalt_plants', 'concrete_mixers', 'pile_drivers'],
        workforce: { general: [400, 600], skilled: [80, 140] },
    },
    {
        key: 'deepwater_port',
        name: 'Deepwater Commercial Port',
        description: 'A massive deepwater port with container terminals, breakwaters, and rail connections.',
        budgetRange: [1_200_000_000, 2_800_000_000],
        timelineTicks: [20, 30],
        materials: {
            concrete: [22, 32], steel: [16, 24], aggregate: [10, 16],
            heavy_parts: [8, 12], em_systems: [6, 10],
        },
        equipment: ['work_trucks', 'excavators', 'pile_drivers', 'tower_cranes', 'heavy_haulers', 'bulldozers', 'concrete_mixers'],
        workforce: { general: [350, 550], skilled: [90, 150] },
    },
    {
        key: 'intercontinental_crossing',
        name: 'Intercontinental Bridge or Tunnel',
        description: 'A landmark engineering project connecting landmasses via bridge or undersea tunnel.',
        budgetRange: [2_500_000_000, 4_000_000_000],
        timelineTicks: [28, 36],
        materials: {
            concrete: [28, 40], steel: [24, 36], aggregate: [14, 20],
            heavy_parts: [10, 16], em_systems: [6, 10],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'concrete_mixers', 'tower_cranes', 'heavy_haulers', 'pile_drivers'],
        workforce: { general: [500, 700], skilled: [140, 220] },
    },
    {
        key: 'university_campus',
        name: 'National University Campus',
        description: 'A full university with lecture halls, labs, dormitories, library, and sports facilities.',
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
        key: 'metro_system',
        name: 'Metropolitan Subway System',
        description: 'An underground metro transit network with multiple stations and depot facilities.',
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
        key: 'flood_irrigation_network',
        name: 'National Flood Control & Irrigation Network',
        description: 'A comprehensive national system of dams, canals, levees, and irrigation channels.',
        budgetRange: [1_200_000_000, 2_500_000_000],
        timelineTicks: [20, 30],
        materials: {
            concrete: [22, 32], aggregate: [14, 20], steel: [10, 16],
            heavy_parts: [6, 10], em_systems: [4, 8],
        },
        equipment: ['work_trucks', 'excavators', 'bulldozers', 'pile_drivers', 'tower_cranes', 'heavy_haulers', 'concrete_mixers'],
        workforce: { general: [350, 500], skilled: [80, 130] },
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
    // GDP tiers determine how many NEW contracts to generate per cycle
    GDP_TIERS: [
        { min: 0,  max: 25,  contracts: 0 },
        { min: 26, max: 50,  contracts: 1 },
        { min: 51, max: 74,  contracts: 2 },
        { min: 75, max: 100, contracts: 4 },
    ],
    // Max open contracts = active_corporations + 2
    // If max is already reached, no new contracts are generated
    MAX_OPEN_BUFFER: 2,
};

// Helper: pick a random integer in [min, max]
export function randRange(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// Helper: pick a random item from an array
export function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
