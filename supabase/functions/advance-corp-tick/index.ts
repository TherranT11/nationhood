// @ts-nocheck
/**
 * Supabase Edge Function: advance-corp-tick
 *
 * Server-side corporation tick processor for Nationhood Alpha.
 * Called by pg_cron every minute — reads current_tick from the shard,
 * skips if already processed or not yet due. Runs once per tick at
 * the midpoint of the tick interval (e.g. 4 hours after advance-tick
 * for an 8-hour interval), then processes all corporation systems.
 *
 * This function does NOT advance the tick or acquire the tick lock.
 * advance-tick owns tick advancement; this function piggybacks on
 * the current tick number and processes corp effects for it.
 *
 * Sectors:
 *   - Construction (Phase 2)
 *   - Energy (future)
 *   - Finance (future)
 *   - Defense (future)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ════════════════════════════════════════════════════════════════════════════════
//  IDEMPOTENCY — in-memory tracker to skip duplicate cron fires
// ════════════════════════════════════════════════════════════════════════════════

let lastProcessedTick = -1;

// ════════════════════════════════════════════════════════════════════════════════
//  CONSTRUCTION SECTOR — Templates & Helpers
// ════════════════════════════════════════════════════════════════════════════════

const CC_CIVIL = [
    'municipal_hospital','regional_school','highway_extension','public_housing',
    'water_treatment','government_office','bridge_construction','transit_station',
    'waste_processing','flood_defense'
];
const CC_INDUSTRIAL = [
    'power_station','hydroelectric_dam','manufacturing_complex','oil_refinery',
    'shipping_port','military_installation','telecom_network','railway_corridor',
    'desalination_plant'
];
const CC_MEGA = [
    'sports_stadium','international_airport','high_speed_rail','parliament_complex',
    'national_freeway','deepwater_port','intercontinental_crossing','university_campus',
    'metro_system','flood_irrigation_network'
];

const CC_TEMPLATES = {
    // Civil ($25M-$300M, timeline 36-60 months)
    municipal_hospital:   { name: 'Municipal Hospital', sector: 'civil_engineering', budget: [80e6,220e6], ticks: [36,55], desc: 'Healthcare facility, 200-400 beds' },
    regional_school:      { name: 'Regional School Complex', sector: 'civil_engineering', budget: [25e6,75e6], ticks: [36,48], desc: '8-16 classrooms with gym and labs' },
    highway_extension:    { name: 'Highway Extension', sector: 'civil_engineering', budget: [100e6,300e6], ticks: [42,60], desc: '20-80km arterial road segment' },
    public_housing:       { name: 'Public Housing Development', sector: 'civil_engineering', budget: [50e6,150e6], ticks: [36,52], desc: '200-600 residential units' },
    water_treatment:      { name: 'Water Treatment Facility', sector: 'civil_engineering', budget: [60e6,160e6], ticks: [36,50], desc: 'Municipal water processing plant' },
    government_office:    { name: 'Government Office Building', sector: 'civil_engineering', budget: [60e6,160e6], ticks: [36,50], desc: 'Administrative complex' },
    bridge_construction:  { name: 'Bridge Construction', sector: 'civil_engineering', budget: [80e6,250e6], ticks: [40,58], desc: 'River crossing or interchange' },
    transit_station:      { name: 'Public Transit Station', sector: 'civil_engineering', budget: [25e6,90e6], ticks: [36,46], desc: 'Bus terminal or rail stop' },
    waste_processing:     { name: 'Municipal Waste Processing Plant', sector: 'civil_engineering', budget: [50e6,130e6], ticks: [36,50], desc: 'Solid waste or sewage processing' },
    flood_defense:        { name: 'Coastal Flood Defense System', sector: 'civil_engineering', budget: [70e6,200e6], ticks: [40,56], desc: 'Seawalls, levees, drainage' },
    // Industrial ($180M-$2.5B, timeline 36-85 months)
    power_station:        { name: 'Power Station', sector: 'industrial', budget: [300e6,900e6], ticks: [45,70], desc: 'Coal, gas, or oil-fired generating plant' },
    hydroelectric_dam:    { name: 'Hydroelectric Dam', sector: 'industrial', budget: [600e6,2.5e9], ticks: [55,85], desc: 'River dam with power generation' },
    manufacturing_complex:{ name: 'Industrial Manufacturing Complex', sector: 'industrial', budget: [250e6,800e6], ticks: [42,65], desc: 'Factory, warehousing, logistics' },
    oil_refinery:         { name: 'Oil Refinery Expansion', sector: 'industrial', budget: [400e6,1.5e9], ticks: [48,75], desc: 'Processing, storage, pipeline' },
    shipping_port:        { name: 'Commercial Shipping Port', sector: 'industrial', budget: [350e6,1.2e9], ticks: [48,72], desc: 'Docks, cranes, container yard' },
    military_installation:{ name: 'Military Installation', sector: 'industrial', budget: [180e6,600e6], ticks: [36,60], desc: 'Barracks, armory, training grounds' },
    telecom_network:      { name: 'Telecommunications Tower Network', sector: 'industrial', budget: [200e6,500e6], ticks: [36,55], desc: '8-20 tower regional deployment' },
    railway_corridor:     { name: 'Railway Corridor', sector: 'industrial', budget: [400e6,1.5e9], ticks: [48,75], desc: '50-200km rail line with stations' },
    desalination_plant:   { name: 'Desalination Plant', sector: 'industrial', budget: [250e6,700e6], ticks: [42,65], desc: 'Coastal water processing' },
    // Mega ($1.5B-$36B, timeline 60-100 months)
    sports_stadium:       { name: 'National Sports Stadium', sector: 'mega_project', budget: [1.5e9,4e9], ticks: [60,78], desc: '50,000+ seating capacity' },
    international_airport:{ name: 'International Airport', sector: 'mega_project', budget: [5e9,18e9], ticks: [72,95], desc: 'Terminals, runways, control tower' },
    high_speed_rail:      { name: 'High-Speed Rail Network', sector: 'mega_project', budget: [6e9,20e9], ticks: [75,98], desc: 'Dedicated high-speed rail line' },
    parliament_complex:   { name: 'National Parliament Complex', sector: 'mega_project', budget: [1.5e9,5e9], ticks: [60,80], desc: 'Seat of government' },
    national_freeway:     { name: 'National Freeway System', sector: 'mega_project', budget: [4e9,15e9], ticks: [70,92], desc: 'Multi-hundred km freeway network' },
    deepwater_port:       { name: 'Deepwater Commercial Port', sector: 'mega_project', budget: [3e9,10e9], ticks: [68,88], desc: 'Container terminals, breakwaters' },
    intercontinental_crossing: { name: 'Intercontinental Bridge or Tunnel', sector: 'mega_project', budget: [8e9,36e9], ticks: [80,100], desc: 'Landmark engineering project' },
    university_campus:    { name: 'National University Campus', sector: 'mega_project', budget: [1.5e9,4e9], ticks: [60,78], desc: 'Full university with all facilities' },
    metro_system:         { name: 'Metropolitan Subway System', sector: 'mega_project', budget: [4e9,16e9], ticks: [72,95], desc: 'Underground metro network' },
    flood_irrigation_network: { name: 'National Flood Control & Irrigation Network', sector: 'mega_project', budget: [3e9,10e9], ticks: [68,88], desc: 'Dams, canals, levees, irrigation' },
};

// Material/equipment/workforce requirements per template (ranges: [min, max])
const CC_REQUIREMENTS = {
    // Civil Engineering
    municipal_hospital:   { mat: { concrete:[6,10],steel:[4,8],lumber:[2,4],glass_facades:[3,5],em_systems:[4,7],heavy_parts:[1,3] }, equip: ['work_trucks','excavators','concrete_mixers','tower_cranes'], wf: { general:[80,140],skilled:[25,45] } },
    regional_school:      { mat: { concrete:[4,7],lumber:[3,5],steel:[2,4],glass_facades:[1,3],em_systems:[2,4] }, equip: ['work_trucks','concrete_mixers','bulldozers'], wf: { general:[40,80],skilled:[10,22] } },
    highway_extension:    { mat: { asphalt:[10,18],aggregate:[8,14],concrete:[4,8],steel:[2,5],heavy_parts:[2,4] }, equip: ['work_trucks','bulldozers','excavators','heavy_haulers','asphalt_plants'], wf: { general:[120,180],skilled:[20,40] } },
    public_housing:       { mat: { concrete:[6,11],steel:[4,7],lumber:[4,7],glass_facades:[2,4],em_systems:[3,5],aggregate:[2,4] }, equip: ['work_trucks','excavators','concrete_mixers','tower_cranes'], wf: { general:[80,140],skilled:[15,30] } },
    water_treatment:      { mat: { concrete:[6,10],steel:[4,7],em_systems:[5,8],heavy_parts:[3,5],aggregate:[3,5] }, equip: ['work_trucks','excavators','concrete_mixers','bulldozers'], wf: { general:[70,110],skilled:[20,35] } },
    government_office:    { mat: { concrete:[6,10],steel:[5,8],glass_facades:[4,7],em_systems:[4,6],lumber:[2,3] }, equip: ['work_trucks','excavators','concrete_mixers','tower_cranes'], wf: { general:[80,130],skilled:[20,35] } },
    bridge_construction:  { mat: { concrete:[8,14],steel:[8,14],aggregate:[5,8],heavy_parts:[3,6] }, equip: ['work_trucks','excavators','pile_drivers','tower_cranes','heavy_haulers'], wf: { general:[100,160],skilled:[25,45] } },
    transit_station:      { mat: { concrete:[4,7],steel:[3,5],glass_facades:[2,4],em_systems:[2,4],aggregate:[2,3] }, equip: ['work_trucks','excavators','concrete_mixers'], wf: { general:[50,90],skilled:[12,25] } },
    waste_processing:     { mat: { concrete:[5,9],steel:[4,7],em_systems:[4,7],heavy_parts:[3,5],aggregate:[3,5] }, equip: ['work_trucks','excavators','bulldozers','concrete_mixers'], wf: { general:[60,100],skilled:[18,30] } },
    flood_defense:        { mat: { concrete:[10,16],steel:[6,10],aggregate:[6,10],heavy_parts:[3,5] }, equip: ['work_trucks','excavators','bulldozers','pile_drivers','heavy_haulers'], wf: { general:[100,160],skilled:[22,40] } },
    // Industrial
    power_station:        { mat: { concrete:[10,16],steel:[10,16],heavy_parts:[6,10],em_systems:[6,10],aggregate:[5,8] }, equip: ['work_trucks','excavators','tower_cranes','heavy_haulers','pile_drivers','concrete_mixers'], wf: { general:[160,240],skilled:[50,80] } },
    hydroelectric_dam:    { mat: { concrete:[16,24],steel:[10,16],aggregate:[10,16],heavy_parts:[6,10],em_systems:[4,8] }, equip: ['work_trucks','excavators','bulldozers','tower_cranes','heavy_haulers','pile_drivers','concrete_mixers'], wf: { general:[200,300],skilled:[60,100] } },
    manufacturing_complex:{ mat: { steel:[12,18],concrete:[8,14],heavy_parts:[5,9],em_systems:[5,8],aggregate:[3,5],glass_facades:[2,4] }, equip: ['work_trucks','excavators','tower_cranes','heavy_haulers','concrete_mixers'], wf: { general:[140,220],skilled:[40,65] } },
    oil_refinery:         { mat: { steel:[14,22],heavy_parts:[8,14],concrete:[8,12],em_systems:[6,10],aggregate:[4,6] }, equip: ['work_trucks','tower_cranes','heavy_haulers','excavators','pile_drivers','concrete_mixers'], wf: { general:[160,240],skilled:[55,90] } },
    shipping_port:        { mat: { concrete:[12,20],steel:[10,16],aggregate:[8,12],heavy_parts:[5,8],em_systems:[4,7] }, equip: ['work_trucks','excavators','pile_drivers','tower_cranes','heavy_haulers','bulldozers'], wf: { general:[180,260],skilled:[50,80] } },
    military_installation:{ mat: { concrete:[10,16],steel:[6,10],aggregate:[5,8],lumber:[3,5],em_systems:[4,6],heavy_parts:[3,5] }, equip: ['work_trucks','excavators','bulldozers','concrete_mixers','heavy_haulers'], wf: { general:[140,200],skilled:[35,55] } },
    telecom_network:      { mat: { steel:[8,14],concrete:[4,7],em_systems:[8,14],heavy_parts:[3,5],aggregate:[2,4] }, equip: ['work_trucks','excavators','heavy_haulers','tower_cranes'], wf: { general:[80,140],skilled:[30,55] } },
    railway_corridor:     { mat: { steel:[10,16],concrete:[8,12],aggregate:[8,12],asphalt:[3,5],heavy_parts:[4,7] }, equip: ['work_trucks','excavators','bulldozers','heavy_haulers','asphalt_plants','pile_drivers'], wf: { general:[140,220],skilled:[35,60] } },
    desalination_plant:   { mat: { concrete:[8,14],steel:[6,10],em_systems:[6,10],heavy_parts:[4,7],aggregate:[3,5] }, equip: ['work_trucks','excavators','concrete_mixers','tower_cranes','pile_drivers'], wf: { general:[120,180],skilled:[35,60] } },
    // Mega
    sports_stadium:       { mat: { concrete:[20,30],steel:[18,28],glass_facades:[8,14],em_systems:[8,14],heavy_parts:[6,10],aggregate:[6,10],lumber:[3,5] }, equip: ['work_trucks','excavators','bulldozers','concrete_mixers','tower_cranes','heavy_haulers','pile_drivers'], wf: { general:[300,500],skilled:[80,140] } },
    international_airport:{ mat: { concrete:[24,36],steel:[18,28],asphalt:[14,22],aggregate:[12,18],glass_facades:[8,14],em_systems:[10,16],heavy_parts:[6,10] }, equip: ['work_trucks','excavators','bulldozers','concrete_mixers','tower_cranes','heavy_haulers','pile_drivers','asphalt_plants'], wf: { general:[400,600],skilled:[120,200] } },
    high_speed_rail:      { mat: { steel:[22,34],concrete:[18,28],aggregate:[14,22],asphalt:[6,10],heavy_parts:[8,14],em_systems:[6,10] }, equip: ['work_trucks','excavators','bulldozers','heavy_haulers','pile_drivers','asphalt_plants','tower_cranes','concrete_mixers'], wf: { general:[500,700],skilled:[120,200] } },
    parliament_complex:   { mat: { concrete:[16,24],steel:[12,18],glass_facades:[10,16],lumber:[6,10],em_systems:[6,10],heavy_parts:[4,6],aggregate:[4,6] }, equip: ['work_trucks','excavators','concrete_mixers','tower_cranes','heavy_haulers','pile_drivers'], wf: { general:[250,400],skilled:[70,120] } },
    national_freeway:     { mat: { asphalt:[20,30],aggregate:[16,24],concrete:[14,22],steel:[10,16],heavy_parts:[6,10] }, equip: ['work_trucks','excavators','bulldozers','heavy_haulers','asphalt_plants','concrete_mixers','pile_drivers'], wf: { general:[400,600],skilled:[80,140] } },
    deepwater_port:       { mat: { concrete:[22,32],steel:[16,24],aggregate:[10,16],heavy_parts:[8,12],em_systems:[6,10] }, equip: ['work_trucks','excavators','pile_drivers','tower_cranes','heavy_haulers','bulldozers','concrete_mixers'], wf: { general:[350,550],skilled:[90,150] } },
    intercontinental_crossing: { mat: { concrete:[28,40],steel:[24,36],aggregate:[14,20],heavy_parts:[10,16],em_systems:[6,10] }, equip: ['work_trucks','excavators','bulldozers','concrete_mixers','tower_cranes','heavy_haulers','pile_drivers'], wf: { general:[500,700],skilled:[140,220] } },
    university_campus:    { mat: { concrete:[16,24],steel:[10,16],glass_facades:[8,12],lumber:[6,10],em_systems:[6,10],aggregate:[4,6] }, equip: ['work_trucks','excavators','concrete_mixers','tower_cranes','heavy_haulers','bulldozers'], wf: { general:[250,400],skilled:[60,100] } },
    metro_system:         { mat: { concrete:[24,36],steel:[20,30],aggregate:[12,18],em_systems:[10,16],heavy_parts:[8,12] }, equip: ['work_trucks','excavators','bulldozers','tower_cranes','heavy_haulers','pile_drivers','concrete_mixers'], wf: { general:[400,600],skilled:[100,160] } },
    flood_irrigation_network: { mat: { concrete:[22,32],aggregate:[14,20],steel:[10,16],heavy_parts:[6,10],em_systems:[4,8] }, equip: ['work_trucks','excavators','bulldozers','pile_drivers','tower_cranes','heavy_haulers','concrete_mixers'], wf: { general:[350,500],skilled:[80,130] } },
};

function ccRand(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function ccPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ════════════════════════════════════════════════════════════════════════════════
//  CONSTRUCTION EVENTS — Templates
//
//  Phase windows: EARLY (Permits/Planning/Foundation), MID (Foundation/Structural/Systems),
//                 LATE (Systems/Finishing/Delivery), ANY (all phases)
//  category: 'notification' (no player choice) or 'choice' (requires response)
//  appliesTo: array of sectors or ['all']
//  govOnly: true if only fires on GOVERNMENT contracts
// ════════════════════════════════════════════════════════════════════════════════

const PHASE_WINDOWS = {
    EARLY: ['Permits', 'Planning', 'Foundation'],
    MID:   ['Foundation', 'Structural', 'Systems'],
    LATE:  ['Systems', 'Finishing', 'Delivery'],
    ANY:   ['Permits', 'Planning', 'Foundation', 'Structural', 'Systems', 'Finishing', 'Delivery'],
};

// ── NOTIFICATION EVENTS (N1-N10): No player choice, effects applied immediately ──

const NOTIFICATION_EVENTS = [
    // ── N1: FAVORABLE WEATHER WINDOW ──
    {
        key: 'favorable_weather', type: 'WEATHER', severity: 'LOW',
        category: 'notification', phaseWindow: 'MID', probability: 0.08,
        appliesTo: ['all'],
        title: 'Favorable Weather Window',
        desc: 'An extended dry spell with moderate temperatures has created ideal construction conditions. Concrete curing is optimal, earthmoving is efficient, and outdoor work is uninterrupted.',
        impact: 'Construction accelerated. Good conditions produce good work.',
        effects: { phaseProgress: 15, quality: 2 },
        statModifiers: [
            { stat: 'stability', baseline: 50, perPoint: 0.02, direction: 'above' },
        ],
    },
    // ── N2: WORKFORCE EFFICIENCY BREAKTHROUGH ──
    {
        key: 'workforce_efficiency', type: 'LABOR', severity: 'LOW',
        category: 'notification', phaseWindow: 'MID_LATE', probability: 0.05,
        appliesTo: ['all'],
        title: 'Workforce Efficiency Breakthrough',
        desc: 'Your crew has developed an optimized workflow for the current phase. A senior foreman reorganized the task sequencing and the team is completing work faster than projected without cutting corners.',
        impact: 'Crew working faster. Quality slightly improved.',
        effects: { phaseProgress: 10, quality: 1 },
        statModifiers: [
            { stat: 'workforce_skill', baseline: 50, perPoint: 0.01, direction: 'above' },
        ],
    },
    // ── N3: MATERIAL SURPLUS DISCOVERED ──
    {
        key: 'material_surplus', type: 'SUPPLY', severity: 'LOW',
        category: 'notification', phaseWindow: 'MID', probability: 0.04,
        appliesTo: ['all'],
        title: 'Material Surplus Discovered',
        desc: 'Post-delivery audit of recent material shipments reveals the supplier over-delivered by approximately 8%. The surplus is usable and already on-site. No additional cost incurred.',
        impact: 'Free materials. Small but meaningful cost savings this phase.',
        effects: { materialSavings: 0.08 },
        statModifiers: [],
    },
    // ── N4: POSITIVE INSPECTION PREVIEW ──
    {
        key: 'positive_inspection', type: 'REGULATORY', severity: 'LOW',
        category: 'notification', phaseWindow: 'LATE', probability: 0.06,
        appliesTo: ['all'],
        title: 'Positive Inspection Preview',
        desc: 'A government inspector conducted a routine mid-construction visit and noted that the project is "progressing well and meeting all current standards." This is not the final inspection but it\'s a strong signal.',
        impact: 'Early validation. Crew motivated to maintain standards.',
        effects: { quality: 3, reputation: 1 },
        statModifiers: [
            { stat: 'regulatory_standing', baseline: 60, perPoint: 0.02, direction: 'above' },
        ],
    },
    // ── N5: SUPPLY CHAIN DISRUPTION ──
    {
        key: 'supply_chain_disruption', type: 'SUPPLY', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'MID', probability: 0.10,
        appliesTo: ['all'],
        title: 'Supply Chain Disruption',
        desc: 'A key material supplier has reported delays due to transport disruption. Your next scheduled delivery will arrive 1 tick late. Material consumption continues from existing on-site stock but reserves are thinning.',
        impact: 'Delivery delayed 1 tick. Construction may slow if warehouse stock is low.',
        effects: { phaseProgress: -10 },
        statModifiers: [
            { stat: 'inflation', baseline: 50, perPoint: 0.03, direction: 'above' },
            { stat: 'physical_infrastructure', baseline: 30, perPoint: 0.02, direction: 'below' },
        ],
    },
    // ── N6: WORKER SAFETY INCIDENT ──
    {
        key: 'worker_safety_incident', type: 'LABOR', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'MID', probability: 0.08,
        appliesTo: ['all'],
        title: 'Worker Safety Incident',
        desc: 'A workplace accident has injured one worker. The crew member has been hospitalized. A safety review is underway and work in the affected sector has been temporarily halted while conditions are assessed.',
        impact: 'Progress slowed. Regulatory standing affected.',
        effects: { phaseProgress: -5, quality: -1 },
        statModifiers: [
            { stat: 'workforce_skill', baseline: 40, perPoint: -0.01, direction: 'above' },
        ],
    },
    // ── N7: UNEXPECTED SUBSURFACE CONDITIONS ──
    {
        key: 'subsurface_conditions', type: 'WEATHER', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'EARLY', probability: 0.12,
        appliesTo: ['all'],
        title: 'Unexpected Subsurface Conditions',
        desc: 'Excavation has encountered unexpected geological conditions — harder rock than soil surveys indicated, or an underground water table higher than mapped. Foundation design requires adjustment and additional excavation is needed.',
        impact: 'Foundation phase extended. Additional cost and quality impact.',
        effects: { delay: 1, cost: 180000, quality: -2 },
        statModifiers: [
            { stat: 'physical_infrastructure', baseline: 25, perPoint: 0.02, direction: 'below' },
        ],
    },
    // ── N8: PERMIT COMPLIANCE WARNING ──
    {
        key: 'permit_compliance_warning', type: 'REGULATORY', severity: 'HIGH',
        category: 'notification', phaseWindow: 'ANY', probability: 0.06,
        appliesTo: ['all'],
        title: 'Permit Compliance Warning',
        desc: 'A government compliance officer has flagged a potential violation in your permit documentation. The specific regulation cited is ambiguous and enforcement appears discretionary.',
        impact: 'Legal review required. Fine possible if permits not current.',
        effects: { cost: 25000 },
        statModifiers: [
            { stat: 'corruption', baseline: 60, perPoint: 0.02, direction: 'above' },
        ],
    },
    // ── N9: EQUIPMENT MALFUNCTION ──
    {
        key: 'equipment_malfunction', type: 'EQUIPMENT', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'MID', probability: 0.06,
        appliesTo: ['all'],
        title: 'Equipment Malfunction',
        desc: 'A critical piece of equipment has suffered a mechanical failure and is offline. Repairs are underway but the unit will be unavailable for 1 tick. Work requiring this equipment is stalled until the repair is complete.',
        impact: 'Equipment offline. Progress stalled. Emergency repair cost.',
        effects: { phaseProgress: -8, cost: 60000 },
        statModifiers: [],
    },
    // ── N10: LOCAL COMMUNITY OPPOSITION ──
    {
        key: 'community_opposition', type: 'POLITICAL', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'EARLY_MID', probability: 0.07,
        appliesTo: ['civil_engineering', 'industrial'],
        title: 'Local Community Opposition',
        desc: 'Residents near the construction site have organized protests against the project, citing noise, dust, traffic disruption, and environmental concerns. Local media is covering the protests.',
        impact: 'Political pressure on the issuing ministry. Reputation affected.',
        effects: { reputation: -1 },
        statModifiers: [
            { stat: 'civil_unrest', baseline: 50, perPoint: 0.03, direction: 'above' },
            { stat: 'pollution', baseline: 60, perPoint: 0.02, direction: 'above' },
            { stat: 'happiness', baseline: 60, perPoint: -0.02, direction: 'above' },
        ],
    },
];

// Phase window lookup including combo windows
const PHASE_WINDOW_LOOKUP = {
    ...PHASE_WINDOWS,
    MID_LATE: [...PHASE_WINDOWS.MID, ...new Set([...PHASE_WINDOWS.LATE].filter(p => !PHASE_WINDOWS.MID.includes(p)))],
    EARLY_MID: [...PHASE_WINDOWS.EARLY, ...new Set([...PHASE_WINDOWS.MID].filter(p => !PHASE_WINDOWS.EARLY.includes(p)))],
};
// Deduplicate
PHASE_WINDOW_LOOKUP.MID_LATE = [...new Set([...PHASE_WINDOWS.MID, ...PHASE_WINDOWS.LATE])];
PHASE_WINDOW_LOOKUP.EARLY_MID = [...new Set([...PHASE_WINDOWS.EARLY, ...PHASE_WINDOWS.MID])];

// ── CHOICE EVENTS (E1-E10): Placeholder — Phase 2 will add these ──
const CHOICE_EVENTS = [];

// Combined list for generation
const ALL_EVENT_TEMPLATES = [...NOTIFICATION_EVENTS, ...CHOICE_EVENTS];

// ════════════════════════════════════════════════════════════════════════════════
//  CONSTRUCTION SECTOR — Contract Generation & Bid Resolution
// ════════════════════════════════════════════════════════════════════════════════

async function generateConstructionContracts(supabase, nation, currentTick) {
    // Only generate every 3 ticks
    if (currentTick % 3 !== 0) return [];

    const gdp = Number(nation.gdp_growth ?? 50);

    // Determine how many contracts this GDP tier generates
    let targetContracts = 0;
    if (gdp >= 75) targetContracts = 4;
    else if (gdp >= 51) targetContracts = 2;
    else if (gdp >= 26) targetContracts = 1;
    if (targetContracts === 0) return [];

    // Count active corporations in this nation
    const { count: corpCount } = await supabase
        .from('factions')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'corporation');
    const maxOpen = (corpCount || 0) + 2;

    // Count currently open contracts
    const { count: openCount } = await supabase
        .from('construction_contracts')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .in('status', ['open', 'bidding']);
    const currentOpen = openCount || 0;

    const slotsAvailable = Math.max(0, maxOpen - currentOpen);
    const toGenerate = Math.min(targetContracts, slotsAvailable);
    if (toGenerate === 0) return [];

    // Check mega project cooldown
    let megaAllowed = gdp >= 75;
    if (megaAllowed) {
        const { data: cooldown } = await supabase
            .from('mega_project_cooldowns')
            .select('cooldown_until_tick')
            .eq('nation_id', nation.id)
            .maybeSingle();
        if (cooldown && cooldown.cooldown_until_tick > currentTick) {
            megaAllowed = false;
        }
    }

    // Build the slot allocation: civil engineering gets at least 1
    const slots = [];
    slots.push('civil_engineering'); // guaranteed first slot

    for (let i = 1; i < toGenerate; i++) {
        if (megaAllowed && Math.random() < 0.15) {
            slots.push('mega_project');
            megaAllowed = false; // only one mega per cycle
        } else if (gdp >= 51 && Math.random() < 0.4) {
            slots.push('industrial');
        } else {
            slots.push('civil_engineering');
        }
    }

    // Ministry issuers for GOVERNMENT contracts
    const ISSUERS = [
        'Ministry of Infrastructure', 'Ministry of Housing',
        'Ministry of Transport', 'Ministry of Energy',
        'Ministry of Health', 'Ministry of Education',
        'Ministry of Defense', 'Ministry of the Interior'
    ];

    // Sector prefix for project IDs
    const SECTOR_PREFIX = { civil_engineering: 'GOV-C', industrial: 'GOV-I', mega_project: 'GOV-M' };

    // GDP growth scaling factor: 0.3 at gdp_growth=0, 1.0 at gdp_growth=50, 1.8 at gdp_growth=100
    const gdpGrowth = Number(nation.gdp_growth ?? 50);
    const gdpScale = 0.3 + (gdpGrowth / 100) * 1.5;

    // Game year for project ID (e.g., "2014")
    const { data: shardDate } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
    const gameYear = (shardDate?.current_date || '').match(/\d{4}/)?.[0] || '2014';

    const generated = [];
    let contractSeq = 1; // sequence number within this generation batch
    for (const sector of slots) {
        const pool = sector === 'mega_project' ? CC_MEGA : sector === 'industrial' ? CC_INDUSTRIAL : CC_CIVIL;
        const key = ccPick(pool);
        const tmpl = CC_TEMPLATES[key];
        if (!tmpl) continue;

        // Scale budget by GDP growth: lerp within template range, then apply gdpScale
        const budgetBase = ccRand(tmpl.budget[0], tmpl.budget[1]);
        const budget = Math.round(budgetBase * gdpScale);

        // Timeline: for mega projects, scale proportionally to budget within range
        let timeline;
        if (sector === 'mega_project') {
            const budgetFraction = (budget - tmpl.budget[0] * gdpScale) / ((tmpl.budget[1] - tmpl.budget[0]) * gdpScale || 1);
            const clampedFraction = Math.max(0, Math.min(1, budgetFraction));
            timeline = Math.round(tmpl.ticks[0] + clampedFraction * (tmpl.ticks[1] - tmpl.ticks[0]));
            // Add 1d6 variation
            timeline += ccRand(-3, 3);
            timeline = Math.max(tmpl.ticks[0], Math.min(tmpl.ticks[1], timeline));
        } else {
            timeline = ccRand(tmpl.ticks[0], tmpl.ticks[1]);
        }

        // Project ID: GOV-C1-2014, GOV-I2-2014, GOV-M1-2014
        const projectId = `${SECTOR_PREFIX[sector]}${contractSeq}-${gameYear}`;
        contractSeq++;

        // Issuer: always GOVERNMENT with a ministry name for auto-generated
        const issuerName = ccPick(ISSUERS);

        const { data: contract, error } = await supabase.from('construction_contracts').insert({
            nation_id: nation.id,
            template_key: key,
            sector: tmpl.sector,
            name: tmpl.name,
            description: tmpl.desc,
            project_code: projectId,
            budget_ceiling: budget,
            timeline_ticks: timeline,
            required_materials: (() => {
                const reqs = CC_REQUIREMENTS[key];
                if (!reqs?.mat) return {};
                const m = {};
                for (const [k, [lo, hi]] of Object.entries(reqs.mat)) m[k] = ccRand(lo, hi);
                return m;
            })(),
            required_equipment: CC_REQUIREMENTS[key]?.equip || [],
            required_workforce: (() => {
                const reqs = CC_REQUIREMENTS[key];
                if (!reqs?.wf) return {};
                return { general: ccRand(reqs.wf.general[0], reqs.wf.general[1]), skilled: ccRand(reqs.wf.skilled[0], reqs.wf.skilled[1]) };
            })(),
            status: 'open',
            generated_at_tick: currentTick,
            bidding_ends_tick: currentTick + 3,
            issuer_type: 'GOVERNMENT',
            issuer_name: issuerName,
        }).select('id, name, sector').single();

        if (error) {
            console.error(`[ContractGen] Failed to insert contract for ${nation.name}:`, error.message);
        } else {
            generated.push(contract);
        }
    }

    if (generated.length > 0) {
        console.log(`[ContractGen] ${nation.name}: generated ${generated.length} contracts (GDP=${gdp}, open=${currentOpen}/${maxOpen})`);
    }
    return generated;
}

// ==================== PROPERTY MARKETPLACE GENERATOR ====================

async function replenishPropertyMarketplace(supabase, nation, currentTick) {
    const TARGET_COUNT = 8;
    const EXPIRY_TICKS = 12; // properties expire after 12 corp ticks (~4 days)

    // 1. Expire stale listings
    const { error: expireErr } = await supabase
        .from('available_properties')
        .update({ status: 'expired' })
        .eq('nation_id', nation.id)
        .eq('status', 'available')
        .lt('generated_at_tick', currentTick - EXPIRY_TICKS);
    if (expireErr) console.warn(`[PropertyMarket] Expire failed for ${nation.name}:`, expireErr.message);

    // 2. Count remaining available properties
    const { count, error: countErr } = await supabase
        .from('available_properties')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('status', 'available');
    if (countErr) return;

    const currentCount = count || 0;
    if (currentCount >= TARGET_COUNT) return;

    const toGenerate = TARGET_COUNT - currentCount;

    // 3. Load catalog templates that this nation qualifies for
    const gdpGrowth = Number(nation.gdp_growth ?? 50);
    const sol = Number(nation.standard_of_living ?? 50);
    const { data: catalog } = await supabase
        .from('property_catalog')
        .select('*')
        .lte('min_gdp_growth', Math.round(gdpGrowth))
        .lte('min_sol', Math.round(sol));

    if (!catalog || catalog.length === 0) return;

    // 4. Load existing available to avoid duplicates
    const { data: existing } = await supabase
        .from('available_properties')
        .select('catalog_id')
        .eq('nation_id', nation.id)
        .eq('status', 'available');
    const existingCatalogIds = new Set((existing || []).map(e => e.catalog_id));

    // 5. GDP-weighted selection: higher GDP growth biases toward larger properties
    // Weight: small=1, medium=2+(gdp/25), large=1+(gdp/20), campus=gdp>=60?2:0
    const weightedPool = [];
    for (const tmpl of catalog) {
        if (existingCatalogIds.has(tmpl.id)) continue; // skip duplicates
        let weight = 1;
        if (tmpl.size_class === 'medium') weight = 2 + gdpGrowth / 25;
        else if (tmpl.size_class === 'large') weight = 1 + gdpGrowth / 20;
        else if (tmpl.size_class === 'campus') weight = gdpGrowth >= 60 ? 2 : 0.2;
        // Premium/Innovative styles are rarer
        if (tmpl.style === 'Premium' || tmpl.style === 'Innovative') weight *= 0.6;
        for (let w = 0; w < Math.ceil(weight); w++) weightedPool.push(tmpl);
    }

    if (weightedPool.length === 0) {
        // Fall back to full catalog if all are duplicates
        for (const tmpl of catalog) weightedPool.push(tmpl);
    }

    // 6. Price modifiers from nation stats
    const inflation = Number(nation.inflation ?? 50);
    const inflMod = 1 + ((inflation - 50) / 100 * 0.3);
    const solMod = 1 + ((sol - 50) / 100 * 0.2);

    // City names from nation capital
    const capital = nation.capital || 'Capital';
    const cityMap = { capital: capital, port: capital + ' Port District', industrial: capital + ' Industrial Zone', suburban: capital + ' Suburbs', coastal: capital + ' Coast' };

    // 7. Generate listings
    const usedTemplates = new Set();
    const inserts = [];
    for (let i = 0; i < toGenerate; i++) {
        // Pick from weighted pool, avoid picking same template twice in one batch
        let template = null;
        for (let attempt = 0; attempt < 20; attempt++) {
            const candidate = weightedPool[Math.floor(Math.random() * weightedPool.length)];
            if (!usedTemplates.has(candidate.id)) {
                template = candidate;
                usedTemplates.add(candidate.id);
                break;
            }
        }
        if (!template) template = weightedPool[Math.floor(Math.random() * weightedPool.length)];

        const adjustedPrice = Math.round(template.base_cost * inflMod * solMod);
        const adjustedMaint = Math.round(template.base_maintenance * inflMod * 0.9);
        const condition = 55 + Math.floor(Math.random() * 40); // 55-95%
        const city = cityMap[template.city_template] || capital;

        inserts.push({
            nation_id: nation.id,
            catalog_id: template.id,
            name: template.name,
            type: template.type,
            style: template.style,
            capacity: template.capacity,
            price: adjustedPrice,
            monthly_maintenance: adjustedMaint,
            condition: condition,
            city: city,
            generated_at_tick: currentTick,
            expires_at_tick: currentTick + EXPIRY_TICKS,
            status: 'available',
        });
    }

    if (inserts.length > 0) {
        const { error } = await supabase.from('available_properties').insert(inserts);
        if (error) {
            console.error(`[PropertyMarket] Failed to insert for ${nation.name}:`, error.message);
        } else {
            console.log(`[PropertyMarket] Generated ${inserts.length} properties for ${nation.name} (${currentCount} → ${currentCount + inserts.length})`);
        }
    }
}

// ==================== PROPERTY EFFECTS ====================
// Each corp tick: deduct maintenance from cash, degrade condition, enforce capacity

async function processPropertyEffects(supabase, nation, corps, currentTick) {
    for (const corp of corps) {
        // Load owned properties for this corp in this nation
        const { data: properties, error: propErr } = await supabase
            .from('corp_properties')
            .select('id, monthly_maintenance, condition, capacity')
            .eq('faction_id', corp.id)
            .eq('nation_id', nation.id)
            .eq('is_active', true);

        if (propErr || !properties || properties.length === 0) continue;

        let totalMaintenance = 0;
        const conditionUpdates = [];

        for (const prop of properties) {
            // Sum maintenance
            totalMaintenance += Number(prop.monthly_maintenance || 0);

            // Condition degrades 0.5-1.5 per corp tick (random)
            // Heritage properties degrade faster (×1.3), Sustainable slower (×0.7)
            const degradeBase = 0.5 + Math.random() * 1.0;
            const newCondition = Math.max(0, Math.round((Number(prop.condition || 100) - degradeBase) * 10) / 10);

            if (newCondition !== prop.condition) {
                conditionUpdates.push({ id: prop.id, condition: Math.round(newCondition) });
            }
        }

        // Deduct maintenance from cash reserves
        if (totalMaintenance > 0) {
            const currentCash = Number(corp.corp_cash_reserves ?? 0);
            const newCash = Math.max(0, currentCash - totalMaintenance);
            const { error: cashErr } = await supabase
                .from('factions')
                .update({ corp_cash_reserves: newCash })
                .eq('id', corp.id);

            if (cashErr) {
                console.error(`[PropertyEffects] Cash deduction failed for ${corp.faction_name}:`, cashErr.message);
            } else if (totalMaintenance > 0) {
                console.log(`[PropertyEffects] ${corp.faction_name}: -${Math.round(totalMaintenance).toLocaleString()} maintenance (${properties.length} properties)`);
            }

            // If cash hit zero, log a warning (future: trigger maintenance crisis)
            if (newCash <= 0 && currentCash > 0) {
                console.warn(`[PropertyEffects] ${corp.faction_name} ran out of cash from property maintenance!`);
            }
        }

        // Batch update conditions (non-fatal per-property)
        for (const upd of conditionUpdates) {
            const { error: condErr } = await supabase.from('corp_properties').update({ condition: upd.condition }).eq('id', upd.id);
            if (condErr) console.warn(`[PropertyEffects] Condition update failed for property ${upd.id}:`, condErr.message);
        }

        // Workforce capacity enforcement:
        // Total workforce cannot exceed total capacity from owned properties + base HQ (500)
        // Condition scales effective capacity: 100% condition = full, 50% = half, 0% = none
        const totalCapacity = properties.reduce((sum, p) => {
            const cap = Number(p.capacity || 0);
            const cond = Number(p.condition || 0) / 100; // 0.0-1.0
            return sum + Math.floor(cap * cond);
        }, 0) + 500; // 500 = base HQ capacity
        const { data: factionWf } = await supabase
            .from('factions')
            .select('corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce')
            .eq('id', corp.id)
            .single();

        if (factionWf) {
            const totalWf = Number(factionWf.corp_general_workforce ?? 0) +
                            Number(factionWf.corp_skilled_workforce ?? 0) +
                            Number(factionWf.corp_innovative_workforce ?? 0);

            if (totalWf > totalCapacity) {
                // Reduce general workforce first to fit capacity
                const excess = totalWf - totalCapacity;
                const generalNow = Number(factionWf.corp_general_workforce ?? 0);
                const generalReduction = Math.min(excess, generalNow);
                const remainingExcess = excess - generalReduction;

                const updates = { corp_general_workforce: generalNow - generalReduction };

                if (remainingExcess > 0) {
                    const skilledNow = Number(factionWf.corp_skilled_workforce ?? 0);
                    const skilledReduction = Math.min(remainingExcess, skilledNow);
                    updates.corp_skilled_workforce = skilledNow - skilledReduction;

                    const stillExcess = remainingExcess - skilledReduction;
                    if (stillExcess > 0) {
                        const innovNow = Number(factionWf.corp_innovative_workforce ?? 0);
                        updates.corp_innovative_workforce = Math.max(0, innovNow - stillExcess);
                    }
                }

                const { error: wfErr } = await supabase.from('factions').update(updates).eq('id', corp.id);
                if (wfErr) console.error(`[PropertyEffects] Workforce cap update failed for ${corp.faction_name}:`, wfErr.message);
                else console.log(`[PropertyEffects] ${corp.faction_name}: workforce capped at ${totalCapacity} (was ${totalWf}, -${excess} excess)`);
            }
        }
    }
}

async function resolveExpiredBids(supabase, nationId, currentTick) {
    // Find contracts where bidding has ended
    const { data: expiredContracts } = await supabase
        .from('construction_contracts')
        .select('id, name, budget_ceiling')
        .eq('nation_id', nationId)
        .eq('status', 'open')
        .lte('bidding_ends_tick', currentTick);

    if (!expiredContracts || expiredContracts.length === 0) return [];

    const results = [];
    for (const contract of expiredContracts) {
        // Find all bids, sorted by price (cheapest first)
        const { data: bids } = await supabase
            .from('contract_bids')
            .select('id, faction_id, bid_price, estimated_quality')
            .eq('contract_id', contract.id)
            .eq('status', 'pending')
            .order('bid_price', { ascending: true });

        if (!bids || bids.length === 0) {
            // No bids — contract expires
            await supabase.from('construction_contracts')
                .update({ status: 'expired' })
                .eq('id', contract.id);
            results.push({ contract: contract.name, result: 'expired', reason: 'no_bids' });
            continue;
        }

        // Award to cheapest bid
        const winner = bids[0];
        await supabase.from('construction_contracts')
            .update({ status: 'awarded', awarded_to_faction: winner.faction_id, awarded_at_tick: currentTick })
            .eq('id', contract.id);
        await supabase.from('contract_bids')
            .update({ status: 'won' })
            .eq('id', winner.id);

        // Mark all other bids as lost
        for (const bid of bids.slice(1)) {
            await supabase.from('contract_bids')
                .update({ status: 'lost' })
                .eq('id', bid.id);
        }

        results.push({ contract: contract.name, result: 'awarded', winner: winner.faction_id, price: winner.bid_price });
    }

    return results;
}

// ════════════════════════════════════════════════════════════════════════════════
//  CONSTRUCTION SECTOR — Project Execution
// ════════════════════════════════════════════════════════════════════════════════

async function processActiveProjects(supabase, nationId, currentTick) {
    // 1. Move newly awarded contracts to in_progress
    const { data: newlyAwarded } = await supabase
        .from('construction_contracts')
        .select('id, name, awarded_to_faction, awarded_at_tick')
        .eq('nation_id', nationId)
        .eq('status', 'awarded');

    for (const contract of (newlyAwarded || [])) {
        await supabase.from('construction_contracts')
            .update({ status: 'in_progress' })
            .eq('id', contract.id);
        console.log(`[Projects] ${contract.name}: awarded → in_progress`);
    }

    // 2. Process in_progress contracts
    const { data: activeContracts } = await supabase
        .from('construction_contracts')
        .select('id, name, awarded_to_faction, awarded_at_tick, timeline_ticks, budget_ceiling, completed_at_tick')
        .eq('nation_id', nationId)
        .eq('status', 'in_progress');

    if (!activeContracts || activeContracts.length === 0) return [];

    const results = [];

    for (const contract of activeContracts) {
        const awardedTick = contract.awarded_at_tick || currentTick;
        const ticksElapsed = currentTick - awardedTick;
        const totalTicks = contract.timeline_ticks || 8;

        // Load the winning bid for cost calculations
        const { data: bid } = await supabase
            .from('contract_bids')
            .select('estimated_cost, bid_price, estimated_quality, material_grades, faction_id')
            .eq('contract_id', contract.id)
            .eq('status', 'won')
            .maybeSingle();

        if (!bid) continue;

        // Per-tick cost deduction from corp cash (skip award tick to avoid off-by-one)
        // Known limitation: corps can complete projects even with 0 cash (no bankruptcy system yet)
        const perTickCost = Math.round((bid.estimated_cost || 0) / totalTicks);
        if (perTickCost > 0 && ticksElapsed > 0) {
            const { data: corp } = await supabase
                .from('factions')
                .select('corp_cash_reserves')
                .eq('id', bid.faction_id)
                .single();
            if (corp) {
                const newCash = Math.max(0, Number(corp.corp_cash_reserves || 0) - perTickCost);
                await supabase.from('factions')
                    .update({ corp_cash_reserves: newCash })
                    .eq('id', bid.faction_id);
            }
        }

        // Check if project is complete
        if (ticksElapsed >= totalTicks) {
            const payment = bid.bid_price || 0;

            // Generate inspection report & delivery record
            const baseQuality = bid.estimated_quality || 65;
            const qualityVariance = Math.floor(Math.random() * 21) - 10;
            const qualityScore = Math.max(0, Math.min(100, baseQuality + qualityVariance));

            let deliveryResult = 'PASS';
            let repChange = 2;
            let qualityBonus = 0;
            let penalties = 0;
            if (qualityScore >= 85) { deliveryResult = 'DISTINCTION'; repChange = 5; qualityBonus = Math.round(payment * 0.15); }
            else if (qualityScore >= 60) { deliveryResult = 'PASS'; repChange = 2; }
            else if (qualityScore >= 40) { deliveryResult = 'CONDITIONAL'; repChange = 0; penalties = Math.round(payment * 0.20); }
            else { deliveryResult = 'FAIL'; repChange = -3; penalties = Math.round(payment * 0.40); }

            const actualPayment = payment + qualityBonus - penalties;
            const estCost = bid.estimated_cost || 0;
            const netProfit = actualPayment - estCost;
            const actualTicks = ticksElapsed;
            const onTime = actualTicks <= totalTicks;

            const inspCat = (base) => {
                const score = Math.max(0, Math.min(100, base + Math.floor(Math.random() * 15) - 7));
                const issues = [];
                if (score < 50) issues.push('Below acceptable standards — remediation required');
                else if (score < 65) issues.push('Minor deficiency noted — within tolerance');
                return { score, issues };
            };
            const inspection = {
                materials: inspCat(baseQuality),
                structural: inspCat(baseQuality - 3),
                systems: inspCat(baseQuality - 5),
                permits: { passed: true, issues: [] },
            };

            const bidGrades = bid.material_grades || {};
            const materialsUsed = Object.entries(bidGrades).map(([key, grade]) => {
                const impactMap = { HIGH: 'positive', STANDARD: 'neutral', LOW: 'negative' };
                return { name: key.replace(/_/g, ' '), grade, impact: impactMap[grade] || 'neutral' };
            });

            // Insert delivery record FIRST — if this fails, project stays in_progress and retries next tick
            const { error: delErr } = await supabase.from('construction_deliveries').insert({
                contract_id: contract.id,
                faction_id: bid.faction_id,
                nation_id: nationId,
                result: deliveryResult,
                quality_score: qualityScore,
                rep_change: repChange,
                inspection,
                materials_used: materialsUsed,
                contract_value: payment,
                quality_bonus: qualityBonus,
                penalties,
                payment_received: actualPayment,
                total_cost: estCost,
                net_profit: netProfit,
                timeline_expected: totalTicks,
                timeline_actual: actualTicks,
                on_time: onTime,
                delivered_at_tick: currentTick,
            });

            if (delErr) {
                // Delivery record failed — do NOT mark completed, will retry next tick
                console.error(`[Projects] Failed to create delivery record for ${contract.name} — project stays in_progress:`, delErr.message);
                continue;
            }

            // Delivery succeeded — now mark contract completed and pay corporation
            const { error: completeErr } = await supabase.from('construction_contracts')
                .update({ status: 'completed', completed_at_tick: currentTick })
                .eq('id', contract.id);
            if (completeErr) {
                console.error(`[Projects] Failed to mark ${contract.name} completed — delivery record exists but contract stays in_progress. Manual fix needed:`, completeErr.message);
                continue;
            }

            if (actualPayment > 0) {
                const { data: corpPay } = await supabase
                    .from('factions')
                    .select('corp_cash_reserves')
                    .eq('id', bid.faction_id)
                    .single();
                if (corpPay) {
                    const newCash = Number(corpPay.corp_cash_reserves || 0) + actualPayment;
                    await supabase.from('factions')
                        .update({ corp_cash_reserves: newCash })
                        .eq('id', bid.faction_id);
                }
            }

            // Check if this was a mega project — set cooldown
            const { data: contractFull } = await supabase
                .from('construction_contracts')
                .select('sector')
                .eq('id', contract.id)
                .single();
            if (contractFull?.sector === 'mega_project') {
                await supabase.from('mega_project_cooldowns')
                    .upsert({
                        nation_id: nationId,
                        last_completed_tick: currentTick,
                        cooldown_until_tick: currentTick + 360
                    }, { onConflict: 'nation_id' });
            }

            results.push({
                contract: contract.name,
                result: deliveryResult,
                payment: actualPayment,
                quality: qualityScore,
                repChange,
                netProfit,
            });

            console.log(`[Projects] ${contract.name}: ${deliveryResult} (quality=${qualityScore}, net=${netProfit > 0 ? '+' : ''}$${(netProfit / 1e6).toFixed(1)}M, rep=${repChange > 0 ? '+' : ''}${repChange})`);
        }
    }

    return results;
}

// ════════════════════════════════════════════════════════════════════════════════
//  CORPORATION INCOME
// ════════════════════════════════════════════════════════════════════════════════

async function processCorpMonthlyIncome(supabase, nation, corpFactions) {
    if (!corpFactions || corpFactions.length === 0) return;

    const ns = (key) => Number(nation[key] ?? 50);

    // Revenue: same formula as corp-dashboard.html renderFinances
    const BASE_RATE = 50_000_000;
    const gdpFactor     = 1 + (ns('gdp_growth') - 50) / 100 * 0.4;
    const urbanFactor   = 1 + (ns('urbanization') - 50) / 100 * 0.3;
    const popFactor     = 1 + (ns('population_growth') - 50) / 100 * 0.2;
    const solFactor     = 1 + (ns('standard_of_living') - 50) / 100 * 0.15;
    const infraFactor   = 1 + (50 - ns('physical_infrastructure')) / 100 * 0.1;
    const inflFactor    = 1 - Math.max(0, ns('inflation') - 50) / 100 * 0.1;
    const intFactor     = 1 - Math.max(0, ns('interest_rates') - 50) / 100 * 0.1;
    const multiplier = gdpFactor * urbanFactor * popFactor * solFactor * infraFactor * inflFactor * intFactor;
    const monthlyMarketRev = Math.round(Math.round(BASE_RATE * multiplier) / 12);

    // Wages: same formula as corp-dashboard.html renderWorkforce
    const TOTAL_WORKFORCE = 3000;
    const CONSTRUCTION_SECTOR_MULT = 0.20;
    const baseAnnualWage = 8000 + (ns('minimum_wage') / 100) * 32000;
    const generalWages = Math.round(TOTAL_WORKFORCE * 0.75) * baseAnnualWage * 1.00 * CONSTRUCTION_SECTOR_MULT;
    const skilledWages = Math.round(TOTAL_WORKFORCE * 0.20) * baseAnnualWage * 1.50 * CONSTRUCTION_SECTOR_MULT;
    const innovativeWages = (TOTAL_WORKFORCE - Math.round(TOTAL_WORKFORCE * 0.75) - Math.round(TOTAL_WORKFORCE * 0.20)) * baseAnnualWage * 2.75 * CONSTRUCTION_SECTOR_MULT;
    const monthlyWages = Math.round((generalWages + skilledWages + innovativeWages) / 12);

    const monthlyIncome = monthlyMarketRev - monthlyWages;

    for (const corp of corpFactions) {
        const currentCash = Number(corp.corp_cash_reserves || 0);
        const newCash = Math.max(0, currentCash + monthlyIncome);
        await supabase.from('factions')
            .update({ corp_cash_reserves: newCash })
            .eq('id', corp.id);
    }
    console.log(`[advance-corp-tick] Corp income: ${corpFactions.length} corps in ${nation.name}, monthly rev=${monthlyMarketRev}, wages=${monthlyWages}, net=${monthlyIncome}`);
}

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN ORCHESTRATOR
// ════════════════════════════════════════════════════════════════════════════════

async function advanceCorpTick(supabase, { force = false } = {}) {
    // 1. Read shard to get current tick and scheduling info
    const { data: shard, error: shardErr } = await supabase
        .from('shard')
        .select('current_tick, current_date, next_tick_at, tick_interval_hours, corp_last_processed_tick')
        .eq('name', 'Alpha Shard')
        .single();

    if (shardErr || !shard) {
        throw new Error(`Shard not found: ${shardErr?.message}`);
    }

    const currentTick = shard.current_tick || 0;

    // 2. Idempotency check — use DB-persisted corp_last_processed_tick (not in-memory,
    //    because Deno edge functions cold-start frequently, resetting in-memory state)
    const corpLastTick = shard.corp_last_processed_tick ?? -1;
    if (!force && currentTick <= corpLastTick) {
        return { status: 'already_processed', tick: currentTick };
    }

    // 3. Time-based gating — only run at the midpoint of the tick interval
    //    (e.g. 4 hours after tick advance for an 8-hour interval)
    if (!force && shard.next_tick_at) {
        const now = Date.now();
        const nextTickAt = new Date(shard.next_tick_at).getTime();
        const intervalMs = (shard.tick_interval_hours || 8) * 60 * 60 * 1000;
        const lastAdvanceAt = nextTickAt - intervalMs;
        const corpDueAt = lastAdvanceAt + (intervalMs / 2);

        if (now < corpDueAt) {
            const remainMs = corpDueAt - now;
            console.log(`[advance-corp-tick] Not due — tick ${currentTick}, corp due in ${Math.round(remainMs / 1000)}s`);
            return { status: 'not_due', tick: currentTick, corp_due_in_ms: remainMs };
        }
    }

    console.log(`[advance-corp-tick] Processing tick ${currentTick} (${shard.current_date})`);

    // 4. Load all nations
    const { data: nations, error: nationErr } = await supabase
        .from('nations')
        .select('*');

    if (nationErr) {
        throw new Error(`Failed to load nations: ${nationErr.message}`);
    }

    const nationList = nations || [];

    const summary = {
        tick: currentTick,
        nations: nationList.length,
        corpsProcessed: 0,
        construction: [],
        // Future sector summaries:
        // energy: [],
        // finance: [],
        // defense: [],
        errors: [],
    };

    // 5. Process each nation
    for (const nation of nationList) {
        try {
            // Load corporation factions for this nation
            const { data: corpFactions, error: corpErr } = await supabase
                .from('factions')
                .select('id, faction_name, corp_sector, corp_subsector, corp_cash_reserves, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce')
                .eq('nation_id', nation.id)
                .eq('faction_type', 'corporation');

            if (corpErr) {
                console.error(`[advance-corp-tick] Failed to load corps for ${nation.name}:`, corpErr.message);
                summary.errors.push({ nation: nation.name, error: corpErr.message });
                continue;
            }

            const corps = corpFactions || [];
            if (corps.length === 0) continue;

            summary.corpsProcessed += corps.length;
            console.log(`[advance-corp-tick] ${nation.name}: ${corps.length} corporation(s)`);

            // ── Construction Sector ──────────────────────────────────────
            try {
                // Project execution: advance in_progress, deduct costs, complete
                const projectResults = await processActiveProjects(supabase, nation.id, currentTick);
                if (projectResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'completions', data: projectResults });
                }

                // Contract generation: every 3 ticks, GDP-scaled
                const genResults = await generateConstructionContracts(supabase, nation, currentTick);
                if (genResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'generated', data: genResults });
                }

                // Bid resolution: expired bidding windows → cheapest wins
                const bidResults = await resolveExpiredBids(supabase, nation.id, currentTick);
                if (bidResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'bids', data: bidResults });
                }

                // Project events: generate random events on in_progress projects
                const eventResults = await generateProjectEvents(supabase, nation.id, currentTick);
                if (eventResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'events', data: eventResults });
                }

                // Property marketplace: ensure 8 available per nation
                try {
                    await replenishPropertyMarketplace(supabase, nation, currentTick);
                } catch (propErr) {
                    console.warn(`[advance-corp-tick] Property marketplace failed for ${nation.name}:`, propErr.message);
                }

                // Expired events: auto-resolve events the player ignored
                const expiredResults = await resolveExpiredEvents(supabase, nation.id, currentTick);
                if (expiredResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'expired_events', data: expiredResults });
                }
            } catch (constructionErr) {
                console.error(`[advance-corp-tick] Construction failed for ${nation.name} (non-fatal):`, constructionErr);
                summary.errors.push({ nation: nation.name, sector: 'construction', error: String(constructionErr) });
            }

            // ── Property Effects (maintenance, condition degradation) ──
            try {
                await processPropertyEffects(supabase, nation, corps, currentTick);
            } catch (propEffErr) {
                console.error(`[advance-corp-tick] Property effects failed for ${nation.name} (non-fatal):`, propEffErr);
                summary.errors.push({ nation: nation.name, sector: 'property_effects', error: String(propEffErr) });
            }

            // ── Corporation Monthly Income ──────────────────────────────
            try {
                await processCorpMonthlyIncome(supabase, nation, corps);
            } catch (incomeErr) {
                console.error(`[advance-corp-tick] Corp income failed for ${nation.name} (non-fatal):`, incomeErr);
                summary.errors.push({ nation: nation.name, sector: 'income', error: String(incomeErr) });
            }

            // ── Energy Sector ────────────────────────────────────────────
            // FUTURE: Energy production, grid management, fuel contracts

            // ── Finance Sector ───────────────────────────────────────────
            // FUTURE: Lending, investment returns, interest rate effects

            // ── Defense Sector ───────────────────────────────────────────
            // FUTURE: Arms contracts, military equipment production

        } catch (nationProcessErr) {
            console.error(`[advance-corp-tick] FAILED processing corps for ${nation.name}:`, nationProcessErr);
            summary.errors.push({ nation: nation.name, error: String(nationProcessErr) });
        }
    }

    // 6. Mark this tick as processed (persisted to DB to survive cold starts)
    lastProcessedTick = currentTick;
    await supabase.from('shard').update({ corp_last_processed_tick: currentTick }).eq('name', 'Alpha Shard');

    console.log(`[advance-corp-tick] Tick ${currentTick} complete. ${summary.corpsProcessed} corps across ${nationList.length} nations.`);
    return summary;
}

// ════════════════════════════════════════════════════════════════════════════════
//  EDGE FUNCTION HANDLER
// ════════════════════════════════════════════════════════════════════════════════

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
        // Check for force parameter (admin manual trigger)
        let force = false;
        try {
            const body = await Promise.race([
                req.json(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("body read timeout")), 3000)),
            ]);
            force = body?.force === true;
        } catch (_) {
            // No body, invalid JSON, or timeout — not forced
        }

        console.log(`[advance-corp-tick] Invoked (force=${force})`);

        const summary = await advanceCorpTick(supabase, { force });

        // If already processed, return early with 200
        if (summary.status === 'already_processed') {
            return new Response(
                JSON.stringify({ status: "already_processed", tick: summary.tick }),
                { headers: corsHeaders }
            );
        }

        return new Response(
            JSON.stringify({ status: "success", summary }),
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error("[advance-corp-tick] Edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
});
