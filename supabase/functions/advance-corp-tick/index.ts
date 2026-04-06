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

// ── Phase progression: 7 phases mapped to progress percentage ──
const CONSTRUCTION_PHASES = ['Permits', 'Planning', 'Foundation', 'Structural', 'Systems', 'Finishing', 'Delivery'];

function getPhaseForProgress(progressPct) {
    // Each phase gets an equal slice of the timeline
    const phaseIndex = Math.min(CONSTRUCTION_PHASES.length - 1, Math.floor(progressPct * CONSTRUCTION_PHASES.length));
    return CONSTRUCTION_PHASES[phaseIndex];
}

// ════════════════════════════════════════════════════════════════════════════════
//  CONSTRUCTION SECTOR — Contract Generation & Bid Resolution
// ════════════════════════════════════════════════════════════════════════════════

async function generateConstructionContracts(supabase, nation, currentTick) {
    // Only generate every 3 ticks
    if (currentTick % 3 !== 0) return [];

    const gdp = Number(nation.gdp_growth ?? 50);

    // Determine how many contracts this GDP tier generates
    let targetContracts = 2;
    if (gdp >= 75) targetContracts = 5;
    else if (gdp >= 51) targetContracts = 4;
    else if (gdp >= 26) targetContracts = 3;

    // Count active corporations in this nation (exclude dissolved)
    const { count: corpCount } = await supabase
        .from('factions')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'corporation')
        .is('abandoned_at', null);
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

    // Private organization issuers for auto-generated contracts
    const PRIVATE_ISSUERS = [
        'Meridian Development Group', 'Atlas Property Holdings', 'Continental Realty Corp',
        'Sovereign Capital Partners', 'Pinnacle Urban Development', 'Citadel Land Trust',
        'Pacific Rim Investments', 'Heritage Builders Alliance', 'Vanguard Real Estate Ltd',
        'Summit Infrastructure Fund', 'Cornerstone Properties Inc', 'Ironclad Holdings Group',
        'Anchor Estates Development', 'Sterling Land Associates', 'Bedrock Capital Partners',
    ];

    // Sector prefix for project IDs
    const SECTOR_PREFIX = { civil_engineering: 'PVT-C', industrial: 'PVT-I', mega_project: 'PVT-M' };

    // Material base prices (must match client-side MAT_BASE_PRICE)
    const MAT_PRICE = {
        concrete: 360000, steel: 500000, glass_facades: 560000, em_systems: 640000,
        lumber: 240000, heavy_parts: 800000, aggregate: 160000, asphalt: 280000,
    };
    const GRADE_LOW = 0.5;
    const GRADE_HIGH = 2.0;

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

        // Generate required materials first (needed for budget calculation) — 1.5x base quantities
        const requiredMats: Record<string, number> = {};
        const reqs = CC_REQUIREMENTS[key];
        if (reqs?.mat) {
            for (const [k, [lo, hi]] of Object.entries(reqs.mat)) requiredMats[k] = Math.round(ccRand(lo as number, hi as number) * 1.5);
        }

        // Generate workforce (doubled from template ranges)
        const requiredWf = reqs?.wf
            ? { general: ccRand((reqs.wf as any).general[0], (reqs.wf as any).general[1]) * 2, skilled: ccRand((reqs.wf as any).skilled[0], (reqs.wf as any).skilled[1]) * 2 }
            : {};

        // Budget: range from [all LOW materials, 0% markup] to [all HIGH materials, 40% markup]
        // Budget stays strictly within the range a player can bid
        let lowCost = 0, highCost = 0;
        for (const [matKey, qty] of Object.entries(requiredMats)) {
            const basePrice = (MAT_PRICE as any)[matKey] || 300000;
            lowCost += qty * Math.round(basePrice * GRADE_LOW);
            highCost += qty * Math.round(basePrice * GRADE_HIGH);
        }
        // Add labor cost estimate (wage rate 15200 per worker per tick)
        const totalWorkers = ((requiredWf as any).general || 0) + ((requiredWf as any).skilled || 0);
        const estTimeline = ccRand(tmpl.ticks[0], tmpl.ticks[1]);
        const laborCost = totalWorkers * 15200 * estTimeline;
        lowCost += laborCost;
        highCost += laborCost;
        // Apply 40% markup to high end (matches max player markup)
        highCost = Math.round(highCost * 1.40);
        const budget = ccRand(lowCost, highCost);

        // Timeline from template range
        let timeline = estTimeline;
        if (sector === 'mega_project') {
            timeline += ccRand(-3, 3);
            timeline = Math.max(tmpl.ticks[0], Math.min(tmpl.ticks[1], timeline));
        }

        // Project ID: PVT-C1-2014, PVT-I2-2014, PVT-M1-2014
        const projectId = `${SECTOR_PREFIX[sector]}${contractSeq}-${gameYear}`;
        contractSeq++;

        // Issuer: auto-generated contracts are private sector offerings
        const issuerName = PRIVATE_ISSUERS[Math.floor(Math.random() * PRIVATE_ISSUERS.length)];

        const { data: contract, error } = await supabase.from('construction_contracts').insert({
            nation_id: nation.id,
            template_key: key,
            sector: tmpl.sector,
            name: tmpl.name,
            description: tmpl.desc,
            project_code: projectId,
            budget_ceiling: budget,
            timeline_ticks: timeline,
            required_materials: requiredMats,
            required_equipment: CC_REQUIREMENTS[key]?.equip || [],
            required_workforce: requiredWf,
            status: 'open',
            generated_at_tick: currentTick,
            bidding_ends_tick: currentTick + 3,
            issuer_type: 'PRIVATE',
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

    // 4b. Check if active construction corps exist in this nation (for warehouse generation)
    const { count: constructionCorpCount } = await supabase
        .from('factions')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'corporation')
        .eq('corp_sector', 'Construction')
        .is('abandoned_at', null);
    const hasConstructionCorps = (constructionCorpCount || 0) > 0;

    // 5. GDP-weighted selection: higher GDP growth biases toward larger properties
    const weightedPool = [];
    for (const tmpl of catalog) {
        if (existingCatalogIds.has(tmpl.id)) continue;
        // Warehouse: only if construction corps exist, 10% chance per slot
        if (tmpl.type === 'warehouse' && !hasConstructionCorps) continue;
        let weight = 1;
        if (tmpl.type === 'warehouse') weight = hasConstructionCorps ? 0.5 : 0; // ~10% of pool
        else if (tmpl.size_class === 'medium') weight = 2 + gdpGrowth / 25;
        else if (tmpl.size_class === 'large') weight = 1 + gdpGrowth / 20;
        else if (tmpl.size_class === 'campus') weight = gdpGrowth >= 60 ? 2 : 0.2;
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
            .select('id, monthly_maintenance, condition, capacity, refurbish_until_tick, refurbish_condition')
            .eq('faction_id', corp.id)
            .eq('nation_id', nation.id)
            .eq('is_active', true);

        if (propErr || !properties || properties.length === 0) continue;

        let totalMaintenance = 0;
        const conditionUpdates = [];

        for (const prop of properties) {
            // Sum maintenance
            totalMaintenance += Number(prop.monthly_maintenance || 0);

            // Check if refurbishment is complete
            if (prop.refurbish_until_tick && currentTick >= prop.refurbish_until_tick) {
                const restoredCondition = Math.min(100, Number(prop.refurbish_condition || 100));
                conditionUpdates.push({
                    id: prop.id,
                    condition: restoredCondition,
                    refurbish_until_tick: null,
                    refurbish_condition: null,
                });
                console.log(`[PropertyEffects] ${corp.faction_name}: refurbishment complete on ${prop.id}, condition → ${restoredCondition}%`);
                continue; // skip degradation this tick
            }

            // Skip degradation for properties currently being refurbished
            if (prop.refurbish_until_tick && currentTick < prop.refurbish_until_tick) {
                continue;
            }

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
            const updateObj = { condition: upd.condition };
            if ('refurbish_until_tick' in upd) {
                updateObj.refurbish_until_tick = upd.refurbish_until_tick;
                updateObj.refurbish_condition = upd.refurbish_condition;
            }
            const { error: condErr } = await supabase.from('corp_properties').update(updateObj).eq('id', upd.id);
            if (condErr) console.warn(`[PropertyEffects] Condition update failed for property ${upd.id}:`, condErr.message);
        }

        // Workforce capacity enforcement:
        // Total workforce cannot exceed total capacity from owned properties + base HQ (500)
        // Condition scales effective capacity: 100% condition = full, 50% = half, 0% = none
        const totalCapacity = properties.reduce((sum, p) => {
            const cap = Number(p.capacity || 0);
            const cond = Number(p.condition || 0) / 100; // 0.0-1.0
            return sum + Math.floor(cap * cond);
        }, 0) + 500; // 500 = National HQ base capacity
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

            // ── Operational Efficiency ──
            // Company-wide staffing ratio: total workforce / total property capacity × 100
            // Represents how well-utilized the corporation's property portfolio is.
            // Understaffed buildings → low efficiency → wasted overhead.
            if (totalCapacity > 0) {
                const effectiveWf = Math.min(totalWf, totalCapacity);
                const efficiency = Math.min(100, Math.round((effectiveWf / totalCapacity) * 100));
                const { error: effErr } = await supabase
                    .from('factions')
                    .update({ corp_operational_efficiency: efficiency })
                    .eq('id', corp.id);
                if (effErr) console.warn(`[PropertyEffects] Efficiency update failed for ${corp.faction_name}:`, effErr.message);
                else console.log(`[PropertyEffects] ${corp.faction_name}: operational efficiency = ${efficiency}% (${effectiveWf}/${totalCapacity})`);
            }
        }
    }
}

// ==================== SUBSIDIARY REVENUE ====================
// Each corp tick: subsidiaries gain or lose cash based on nation GDP Growth.
// Investment return = sub_cash × 0.02 × (1 + (gdpGrowth - 30)/100) × (reputation/100)
// Operating overhead = $200K/month base cost per subsidiary (scaled by GDP)
// Revenue = investment return - operating overhead
// GDP Growth < 30 → investment returns go negative, PLUS overhead → bleeds fast
// GDP Growth > 30 → investment returns grow, offset overhead
// Reputation scales investment returns (25 = 0.25x, 50 = 0.50x, 100 = 1.0x)
// sub_cash CAN go negative (subsidiary in debt — needs capital injection or dissolution)
// Losses clamped to max 5% of |sub_cash| per tick to prevent instant wipeout.

const SUB_REVENUE_BASE = 0.02;
const SUB_GDP_NEUTRAL = 30;
const SUB_DEFAULT_REPUTATION = 25;
const SUB_MAX_LOSS_RATE = 0.05;
const SUB_OPERATING_OVERHEAD = 200_000; // $200K/month base cost per subsidiary

async function processSubsidiaryRevenue(supabase, nation, corps, currentTick) {
    const gdpGrowth = Number(nation.gdp_growth ?? 50);
    const corpIds = corps.map(c => c.id);
    const corpMap = Object.fromEntries(corps.map(c => [c.id, c]));

    // All active regional HQs in this nation (including those with 0 or negative cash)
    const { data: hqs, error: hqErr } = await supabase
        .from('corp_properties')
        .select('id, sub_cash, name, faction_id')
        .in('faction_id', corpIds)
        .eq('nation_id', nation.id)
        .eq('type', 'regional_hq')
        .eq('is_active', true);

    if (hqErr || !hqs || hqs.length === 0) return;

    const repMult = SUB_DEFAULT_REPUTATION / 100;
    for (const hq of hqs) {
        const subCash = Number(hq.sub_cash ?? 0);

        // Investment return: based on positive cash balance × GDP × reputation
        const investCash = Math.max(0, subCash);
        const gdpMod = (gdpGrowth - SUB_GDP_NEUTRAL) / 100;
        const investReturn = Math.round(investCash * SUB_REVENUE_BASE * (1 + gdpMod) * repMult);

        // Operating overhead: scales with GDP (bad GDP = higher costs)
        // At GDP 50 (average): 1.0x overhead. At GDP 10: 1.4x. At GDP 80: 0.7x.
        const overheadMult = Math.max(0.1, 1 + (50 - gdpGrowth) / 100);
        const overhead = Math.round(SUB_OPERATING_OVERHEAD * overheadMult);

        let revenue = investReturn - overhead;

        // Clamp losses to prevent instant wipeout
        const maxLoss = Math.max(SUB_OPERATING_OVERHEAD, Math.round(Math.abs(subCash) * SUB_MAX_LOSS_RATE));
        if (revenue < 0) revenue = Math.max(revenue, -maxLoss);
        if (revenue === 0) continue;

        // sub_cash can go negative (subsidiary in debt)
        const newSubCash = subCash + revenue;
        const { error: updErr } = await supabase
            .from('corp_properties')
            .update({ sub_cash: newSubCash })
            .eq('id', hq.id);

        const corp = corpMap[hq.faction_id];
        if (updErr) {
            console.warn(`[SubRevenue] Failed to update sub_cash for ${hq.name}:`, updErr.message);
        } else {
            console.log(`[SubRevenue] ${corp?.faction_name || '?'} → ${hq.name}: ${revenue >= 0 ? '+' : ''}${revenue.toLocaleString()} (GDP:${gdpGrowth}, overhead:${overhead.toLocaleString()}, cash:${subCash.toLocaleString()} → ${newSubCash.toLocaleString()})`);
        }
    }
}

async function resolveExpiredBids(supabase, nationId, currentTick) {
    // Find contracts ready to resolve:
    // 1. Bidding timer expired (3 ticks), OR
    // 2. Already have 3+ bids (auto-resolve immediately)
    const { data: openContracts } = await supabase
        .from('construction_contracts')
        .select('id, name, budget_ceiling, bidding_ends_tick')
        .eq('nation_id', nationId)
        .in('status', ['open', 'bidding']);

    if (!openContracts || openContracts.length === 0) return [];

    const results = [];
    for (const contract of openContracts) {
        // Load all pending bids
        const { data: bids } = await supabase
            .from('contract_bids')
            .select('id, faction_id, bid_price, estimated_quality')
            .eq('contract_id', contract.id)
            .eq('status', 'pending')
            .order('bid_price', { ascending: true });

        const bidCount = bids?.length || 0;
        const timerExpired = currentTick >= (contract.bidding_ends_tick || 0);

        // Auto-resolve if: timer expired OR 3+ bids received
        if (!timerExpired && bidCount < 3) continue;

        if (bidCount === 0) {
            // No bids and timer expired — contract expires
            if (timerExpired) {
                await supabase.from('construction_contracts')
                    .update({ status: 'expired' })
                    .eq('id', contract.id);
                results.push({ contract: contract.name, result: 'expired', reason: 'no_bids' });
            }
            continue;
        }

        // Select winner: 33% lowest price, 33% highest quality, 33% random
        const roll = Math.random();
        let winner;
        let method: string;
        if (roll < 0.33) {
            // Lowest price (already sorted ascending)
            winner = bids![0];
            method = 'lowest_price';
        } else if (roll < 0.66) {
            // Highest quality
            winner = bids!.reduce((best, b) => (b.estimated_quality || 0) > (best.estimated_quality || 0) ? b : best, bids![0]);
            method = 'highest_quality';
        } else {
            // Random
            winner = bids![Math.floor(Math.random() * bids!.length)];
            method = 'random';
        }

        await supabase.from('construction_contracts')
            .update({ status: 'awarded', awarded_to_faction: winner.faction_id, awarded_at_tick: currentTick })
            .eq('id', contract.id);
        await supabase.from('contract_bids')
            .update({ status: 'won' })
            .eq('id', winner.id);

        // Mark all other bids as lost
        if (bids!.length > 1) {
            await supabase.from('contract_bids')
                .update({ status: 'lost' })
                .eq('contract_id', contract.id)
                .neq('id', winner.id);
        }

        results.push({ contract: contract.name, result: 'awarded', winner: winner.faction_id, price: winner.bid_price, method });
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
        .select('id, name, awarded_to_faction, awarded_at_tick, timeline_ticks, budget_ceiling, completed_at_tick, stalled_ticks, current_phase, sector, required_materials, required_equipment, materials_consumed, equipment_condition')
        .eq('nation_id', nationId)
        .eq('status', 'in_progress');

    if (!activeContracts || activeContracts.length === 0) return [];

    // 3. Load ALL winning bids for active contracts to check workforce
    const contractIds = activeContracts.map(c => c.id);
    let allBids = [];
    if (contractIds.length === 1) {
        const { data } = await supabase.from('contract_bids')
            .select('contract_id, faction_id, labor_count, estimated_cost, bid_price, estimated_quality, material_grades')
            .eq('contract_id', contractIds[0]).eq('status', 'won');
        allBids = data || [];
    } else {
        const { data } = await supabase.from('contract_bids')
            .select('contract_id, faction_id, labor_count, estimated_cost, bid_price, estimated_quality, material_grades')
            .in('contract_id', contractIds).eq('status', 'won');
        allBids = data || [];
    }

    const bidMap = {};
    for (const b of allBids) bidMap[b.contract_id] = b;

    // 4. Sum workforce needs per faction across all active projects
    //    Workforce composition: General 80%, Skilled 15%, Innovative 5%
    const factionNeeds = {};
    for (const contract of activeContracts) {
        const bid = bidMap[contract.id];
        if (!bid) continue;
        const labor = bid.labor_count || 0;
        if (!factionNeeds[bid.faction_id]) factionNeeds[bid.faction_id] = { general: 0, skilled: 0, innovative: 0 };
        factionNeeds[bid.faction_id].general += Math.ceil(labor * 0.80);
        factionNeeds[bid.faction_id].skilled += Math.ceil(labor * 0.15);
        factionNeeds[bid.faction_id].innovative += Math.ceil(labor * 0.05);
    }

    // 5. Fetch each faction's workforce and determine if they can staff all projects
    const factionStaffed = {};
    for (const fId of Object.keys(factionNeeds)) {
        const { data: corp } = await supabase.from('factions')
            .select('corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce')
            .eq('id', fId).single();
        const has = {
            general: Number(corp?.corp_general_workforce ?? 0),
            skilled: Number(corp?.corp_skilled_workforce ?? 0),
            innovative: Number(corp?.corp_innovative_workforce ?? 0),
        };
        const need = factionNeeds[fId];
        factionStaffed[fId] = has.general >= need.general && has.skilled >= need.skilled && has.innovative >= need.innovative;
        if (!factionStaffed[fId]) {
            console.log(`[Projects] Faction ${fId} understaffed: need G${need.general}/S${need.skilled}/I${need.innovative}, have G${has.general}/S${has.skilled}/I${has.innovative}`);
        }
    }

    // 6. Process each contract
    const results = [];

    for (const contract of activeContracts) {
        const bid = bidMap[contract.id];
        if (!bid) continue;

        const awardedTick = contract.awarded_at_tick || currentTick;
        const ticksElapsed = currentTick - awardedTick;
        const totalTicks = contract.timeline_ticks || 8;
        const stalledTicks = contract.stalled_ticks || 0;
        const effectiveProgress = ticksElapsed - stalledTicks;

        // Workforce gate: if faction can't staff all its projects, this one stalls
        if (!factionStaffed[bid.faction_id]) {
            await supabase.from('construction_contracts')
                .update({ stalled_ticks: stalledTicks + 1 })
                .eq('id', contract.id);
            console.log(`[Projects] ${contract.name}: STALLED (tick ${currentTick}, stalled ${stalledTicks + 1} total)`);
            // No cost deduction — no work done this tick
            continue;
        }

        // Per-tick cost deduction from corp cash (skip award tick to avoid off-by-one)
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

        // ── Phase progression, material consumption, equipment wear ──
        const progressPct = Math.min(1, effectiveProgress / totalTicks);
        const newPhase = getPhaseForProgress(progressPct);
        const tickUpdates = {};

        // Phase progression
        if (newPhase !== contract.current_phase) {
            tickUpdates.current_phase = newPhase;
            console.log(`[Projects] ${contract.name}: phase → ${newPhase} (${Math.round(progressPct * 100)}%)`);
        }

        // Material consumption: proportional to progress
        const reqMaterials = contract.required_materials || {};
        const prevConsumed = contract.materials_consumed || {};
        const newConsumed = {};
        for (const [mat, total] of Object.entries(reqMaterials)) {
            newConsumed[mat] = Math.min(Number(total), Math.floor(Number(total) * progressPct));
        }
        // Only update if changed
        if (JSON.stringify(newConsumed) !== JSON.stringify(prevConsumed)) {
            tickUpdates.materials_consumed = newConsumed;
        }

        // Equipment condition: degrade 0.5-2.0 per tick, starting from 100
        const reqEquipment = contract.required_equipment || [];
        const prevEquipCond = contract.equipment_condition || {};
        if (reqEquipment.length > 0) {
            const newEquipCond = { ...prevEquipCond };
            for (const equip of reqEquipment) {
                const current = newEquipCond[equip] ?? 100;
                const degradation = 0.5 + Math.random() * 1.5;
                newEquipCond[equip] = Math.max(5, Math.round((current - degradation) * 10) / 10);
            }
            tickUpdates.equipment_condition = newEquipCond;
        }

        if (Object.keys(tickUpdates).length > 0) {
            const { error: trackErr } = await supabase.from('construction_contracts')
                .update(tickUpdates).eq('id', contract.id);
            if (trackErr) console.warn(`[Projects] ${contract.name}: tracking update failed:`, trackErr.message);
        }

        // Check if project is complete (effective progress, not wall clock)
        if (effectiveProgress >= totalTicks) {
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
            const actualTicks = ticksElapsed; // wall clock ticks (includes stalled)
            const onTime = effectiveProgress <= totalTicks; // on-time based on actual work ticks

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
//  CONSTRUCTION EVENTS — Generation & Expiry
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Generate random construction events on in_progress projects.
 * Each project rolls against each eligible event template once per tick.
 * Events respect phase windows, sector filters, and stat-based probability modifiers.
 * Max 1 event per project per tick to avoid event spam.
 */
async function generateProjectEvents(supabase, nationId, currentTick) {
    const results = [];

    // Load in_progress contracts with phase and sector
    const { data: contracts } = await supabase
        .from('construction_contracts')
        .select('id, name, current_phase, sector, awarded_to_faction')
        .eq('nation_id', nationId)
        .eq('status', 'in_progress');

    if (!contracts || contracts.length === 0) return results;

    // Load nation stats for stat modifiers
    const { data: nation } = await supabase
        .from('nations')
        .select('stability, inflation, corruption, civil_unrest, pollution, happiness, physical_infrastructure')
        .eq('id', nationId)
        .single();
    const ns = (key) => Number(nation?.[key] ?? 50);

    // Check existing active events to avoid duplicates (max 1 active per project)
    const contractIds = contracts.map(c => c.id);
    const { data: activeEvents } = await supabase
        .from('construction_events')
        .select('contract_id')
        .in('contract_id', contractIds)
        .eq('status', 'ACTIVE');
    const hasActiveEvent = new Set((activeEvents || []).map(e => e.contract_id));

    for (const contract of contracts) {
        // Skip if project already has an active event
        if (hasActiveEvent.has(contract.id)) continue;

        const phase = contract.current_phase || 'Permits';

        // Roll against each template
        for (const template of ALL_EVENT_TEMPLATES) {
            // Sector filter
            if (!template.appliesTo.includes('all') && !template.appliesTo.includes(contract.sector)) continue;

            // Phase window filter
            const allowedPhases = PHASE_WINDOW_LOOKUP[template.phaseWindow] || PHASE_WINDOWS.ANY;
            if (!allowedPhases.includes(phase)) continue;

            // Base probability + stat modifiers
            let prob = template.probability;
            for (const mod of (template.statModifiers || [])) {
                const statVal = ns(mod.stat);
                if (mod.direction === 'above' && statVal > mod.baseline) {
                    prob += (statVal - mod.baseline) * mod.perPoint;
                } else if (mod.direction === 'below' && statVal < mod.baseline) {
                    prob += (mod.baseline - statVal) * Math.abs(mod.perPoint);
                }
            }
            prob = Math.max(0, Math.min(0.5, prob)); // Cap at 50%

            if (Math.random() > prob) continue;

            // Event fires! Build responses for notification events (auto-resolved)
            const responses = [{
                key: 'acknowledge',
                label: 'Acknowledged',
                tag: template.severity,
                detail: template.impact,
                cost: template.effects.cost || 0,
                delay: template.effects.delay || 0,
                qualityImpact: template.effects.quality || 0,
            }];

            const { error: insertErr } = await supabase.from('construction_events').insert({
                contract_id: contract.id,
                faction_id: contract.awarded_to_faction,
                nation_id: nationId,
                event_key: template.key,
                type: template.type,
                severity: template.severity,
                title: template.title,
                description: template.desc,
                impact: template.impact,
                responses,
                status: 'ACTIVE',
                fired_at_tick: currentTick,
                expires_at_tick: currentTick + 3, // Auto-resolve after 3 ticks if ignored
            });

            if (insertErr) {
                console.warn(`[Events] Failed to create event ${template.key} for ${contract.name}:`, insertErr.message);
            } else {
                results.push({ contract: contract.name, event: template.title, severity: template.severity });
                console.log(`[Events] ${contract.name}: ${template.title} (${template.severity})`);
            }

            // Max 1 event per project per tick
            break;
        }
    }

    return results;
}

/**
 * Auto-resolve expired construction events that the player ignored.
 * Notification events apply their effects automatically.
 * Choice events apply the worst outcome.
 */
async function resolveExpiredEvents(supabase, nationId, currentTick) {
    const results = [];

    const { data: expired } = await supabase
        .from('construction_events')
        .select('id, contract_id, faction_id, event_key, title, responses, severity')
        .eq('nation_id', nationId)
        .eq('status', 'ACTIVE')
        .lte('expires_at_tick', currentTick);

    if (!expired || expired.length === 0) return results;

    for (const event of expired) {
        // Use the first (or worst) response as the auto-resolution
        const response = event.responses?.[0] || { key: 'auto', cost: 0, delay: 0, qualityImpact: 0 };

        // Apply effects
        const costApplied = response.cost || 0;
        const delayApplied = response.delay || 0;
        const qualityApplied = response.qualityImpact || 0;

        // Deduct cost from corporation
        if (costApplied > 0) {
            const { data: corp } = await supabase.from('factions')
                .select('corp_cash_reserves').eq('id', event.faction_id).single();
            if (corp) {
                await supabase.from('factions')
                    .update({ corp_cash_reserves: Math.max(0, Number(corp.corp_cash_reserves || 0) - costApplied) })
                    .eq('id', event.faction_id);
            }
        }

        // Extend timeline
        if (delayApplied > 0) {
            const { data: contract } = await supabase.from('construction_contracts')
                .select('timeline_ticks').eq('id', event.contract_id).single();
            if (contract) {
                await supabase.from('construction_contracts')
                    .update({ timeline_ticks: (contract.timeline_ticks || 0) + delayApplied })
                    .eq('id', event.contract_id);
            }
        }

        // Modify quality
        if (qualityApplied !== 0) {
            const { data: bid } = await supabase.from('contract_bids')
                .select('id, estimated_quality').eq('contract_id', event.contract_id).eq('status', 'won').single();
            if (bid) {
                const newQuality = Math.max(0, Math.min(100, (bid.estimated_quality || 65) + qualityApplied));
                await supabase.from('contract_bids')
                    .update({ estimated_quality: newQuality }).eq('id', bid.id);
            }
        }

        // Mark event as resolved
        await supabase.from('construction_events').update({
            status: 'RESOLVED',
            chosen_response: response.key,
            resolution: `Auto-resolved: ${response.label || 'expired'}`,
            resolved_at_tick: currentTick,
            cost_applied: costApplied,
            delay_applied: delayApplied,
            quality_applied: qualityApplied,
        }).eq('id', event.id);

        results.push({ event: event.title, autoResolved: true, cost: costApplied, delay: delayApplied, quality: qualityApplied });
        console.log(`[Events] Auto-resolved: ${event.title} (cost=$${costApplied}, delay=${delayApplied}, quality=${qualityApplied > 0 ? '+' : ''}${qualityApplied})`);
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

    // Wages: matches corp-dashboard.html renderWorkforce formula exactly
    const baseAnnualWage = (ns('minimum_wage') / 100) * 48000;
    const inflation = ns('inflation');
    const sol = ns('standard_of_living');
    const inflMod = 1 + ((inflation - 50) / 100 * 0.5);
    const solMod = 1 + ((sol - 50) / 100 * 0.5);
    const GENERAL_MULT = 2, SKILLED_MULT = 3, INNOVATIVE_MULT = 6;
    const calcWage = (mult) => Math.round(baseAnnualWage * mult * inflMod * solMod);

    // Loan servicing constants (5% annual rate, 10-year amortization)
    const LOAN_ANNUAL_RATE = 0.05;
    const LOAN_TERM_MONTHS = 120;
    const monthlyRate = LOAN_ANNUAL_RATE / 12;

    for (const corp of corpFactions) {
        const currentCash = Number(corp.corp_cash_reserves || 0);
        const currentLoans = Number(corp.corp_loans || 0);

        // Per-corp wages from actual workforce counts
        const generalCount = Number(corp.corp_general_workforce ?? 0);
        const skilledCount = Number(corp.corp_skilled_workforce ?? 0);
        const innovativeCount = Number(corp.corp_innovative_workforce ?? 0);
        const annualWages = (generalCount * calcWage(GENERAL_MULT))
                          + (skilledCount * calcWage(SKILLED_MULT))
                          + (innovativeCount * calcWage(INNOVATIVE_MULT));
        const monthlyWages = Math.round(annualWages / 12);
        const monthlyIncome = monthlyMarketRev - monthlyWages;

        // Compute monthly loan payment (amortized) and split into interest + principal
        let debtPayment = 0;
        let principalPaid = 0;
        if (currentLoans > 0) {
            const monthlyPayment = Math.round((currentLoans * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -LOAN_TERM_MONTHS)));
            const interestPortion = Math.round(currentLoans * monthlyRate);
            principalPaid = Math.min(currentLoans, monthlyPayment - interestPortion);
            debtPayment = monthlyPayment;
        }

        // Corporate tax: applied to positive monthly income (profit only)
        // corporate_tax is 0-100 scale on the nation, treated as percentage
        const corpTaxRate = Math.max(0, Math.min(1, (Number(nation.corporate_tax ?? 0) / 100) || 0));
        const taxableIncome = Math.max(0, monthlyIncome);
        const taxAmount = Math.round(taxableIncome * corpTaxRate);

        const netChange = monthlyIncome - debtPayment - taxAmount;
        const newCash = Math.max(0, currentCash + netChange);
        const newLoans = Math.max(0, currentLoans - principalPaid);

        const updateFields = { corp_cash_reserves: newCash };
        if (principalPaid > 0) updateFields.corp_loans = newLoans;

        const { error: updateErr } = await supabase.from('factions')
            .update(updateFields)
            .eq('id', corp.id);
        if (updateErr) console.error(`[advance-corp-tick] Income update failed for ${corp.faction_name}:`, updateErr.message);
    }
    console.log(`[advance-corp-tick] Corp income: ${corpFactions.length} corps in ${nation.name}, monthly rev=${monthlyMarketRev}, tax rate=${ns('corporate_tax')}%`);
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
            // Load corporation factions for this nation (exclude dissolved corps)
            const { data: corpFactions, error: corpErr } = await supabase
                .from('factions')
                .select('id, faction_name, corp_sector, corp_subsector, corp_cash_reserves, corp_loans, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce')
                .eq('nation_id', nation.id)
                .eq('faction_type', 'corporation')
                .is('abandoned_at', null);

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

                // ── Construction GDP Boost ──
                // +0.1 gdp_growth per $100M of active (non-stalled) construction budget
                // Stored on nation for advance-tick to incorporate into GDP calculation
                const { data: activeForGdp } = await supabase
                    .from('construction_contracts')
                    .select('budget_ceiling')
                    .eq('nation_id', nation.id)
                    .eq('status', 'in_progress');
                const totalActiveValue = (activeForGdp || []).reduce((sum, c) => sum + Number(c.budget_ceiling || 0), 0);
                const gdpBoost = Math.round((totalActiveValue / 100_000_000) * 0.1 * 100) / 100; // 0.1 per $100M
                await supabase.from('nations')
                    .update({ construction_gdp_boost: gdpBoost })
                    .eq('id', nation.id);
                if (gdpBoost > 0) {
                    console.log(`[Construction GDP] ${nation.name}: +${gdpBoost} gdp_growth from $${(totalActiveValue / 1e6).toFixed(0)}M active construction`);
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

            // ── Subsidiary Revenue (GDP-based growth/loss per subsidiary) ──
            try {
                await processSubsidiaryRevenue(supabase, nation, corps, currentTick);
            } catch (subRevErr) {
                console.error(`[advance-corp-tick] Subsidiary revenue failed for ${nation.name} (non-fatal):`, subRevErr);
                summary.errors.push({ nation: nation.name, sector: 'subsidiary_revenue', error: String(subRevErr) });
            }

            // ── Corporation Monthly Income ──────────────────────────────
            try {
                await processCorpMonthlyIncome(supabase, nation, corps);
            } catch (incomeErr) {
                console.error(`[advance-corp-tick] Corp income failed for ${nation.name} (non-fatal):`, incomeErr);
                summary.errors.push({ nation: nation.name, sector: 'income', error: String(incomeErr) });
            }

            // ── Reputation Decay ─────────────────────────────────────────
            // All corps lose -0.25 reputation per tick (floor at 0)
            try {
                for (const corp of corps) {
                    const currentRep = Number(corp.corp_reputation ?? 65);
                    const newRep = Math.max(0, Math.round((currentRep - 0.25) * 100) / 100);
                    if (newRep !== currentRep) {
                        const { error: repErr } = await supabase.from('factions')
                            .update({ corp_reputation: newRep })
                            .eq('id', corp.id);
                        if (repErr) console.warn(`[RepDecay] Failed for ${corp.faction_name}:`, repErr.message);
                    }
                }
            } catch (repDecayErr) {
                console.error(`[advance-corp-tick] Reputation decay failed for ${nation.name} (non-fatal):`, repDecayErr);
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
