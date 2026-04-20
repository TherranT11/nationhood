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
// Private-sector civil engineering templates (used when issuer_type = PRIVATE)
const CC_CIVIL_PRIVATE = [
    'commercial_tower','retail_complex','residential_tower','hotel_resort',
    'corporate_campus','logistics_center','mixed_use_development','medical_center',
    'shopping_mall','parking_structure'
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
    // Private civil ($25M-$300M, timeline 36-60 months)
    commercial_tower:     { name: 'Commercial Office Tower', sector: 'civil_engineering', budget: [80e6,250e6], ticks: [36,55], desc: '20-40 floor corporate office' },
    retail_complex:       { name: 'Retail & Entertainment Complex', sector: 'civil_engineering', budget: [60e6,180e6], ticks: [36,52], desc: 'Shopping, dining, entertainment' },
    residential_tower:    { name: 'Luxury Residential Tower', sector: 'civil_engineering', budget: [50e6,200e6], ticks: [36,52], desc: '100-300 premium apartments' },
    hotel_resort:         { name: 'Hotel & Conference Center', sector: 'civil_engineering', budget: [70e6,220e6], ticks: [36,55], desc: '200-500 room hospitality venue' },
    corporate_campus:     { name: 'Corporate Campus', sector: 'civil_engineering', budget: [100e6,300e6], ticks: [40,58], desc: 'Multi-building office park' },
    logistics_center:     { name: 'Distribution & Logistics Center', sector: 'civil_engineering', budget: [40e6,120e6], ticks: [36,48], desc: 'Warehouse, sorting, dispatch' },
    mixed_use_development:{ name: 'Mixed-Use Development', sector: 'civil_engineering', budget: [80e6,250e6], ticks: [38,56], desc: 'Residential + commercial + retail' },
    medical_center:       { name: 'Private Medical Center', sector: 'civil_engineering', budget: [70e6,200e6], ticks: [36,52], desc: 'Private hospital, 100-250 beds' },
    shopping_mall:        { name: 'Regional Shopping Mall', sector: 'civil_engineering', budget: [50e6,160e6], ticks: [36,50], desc: '80-200 retail units, anchor tenants' },
    parking_structure:    { name: 'Multi-Level Parking Structure', sector: 'civil_engineering', budget: [25e6,80e6], ticks: [36,44], desc: '500-2000 vehicle capacity' },
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
    // Civil Engineering — equip values are [min, max] quantities, randomized at generation
    municipal_hospital:   { mat: { concrete:[6,10],steel:[4,8],lumber:[2,4],glass_facades:[3,5],em_systems:[4,7],heavy_parts:[1,3] }, equip: { work_trucks:[2,4],excavators:[1,2],concrete_mixers:[1,2],tower_cranes:[1,1] }, wf: { general:[80,140],skilled:[25,45] } },
    regional_school:      { mat: { concrete:[4,7],lumber:[3,5],steel:[2,4],glass_facades:[1,3],em_systems:[2,4] }, equip: { work_trucks:[1,3],concrete_mixers:[1,1],bulldozers:[1,1] }, wf: { general:[40,80],skilled:[10,22] } },
    highway_extension:    { mat: { asphalt:[10,18],aggregate:[8,14],concrete:[4,8],steel:[2,5],heavy_parts:[2,4] }, equip: { work_trucks:[3,5],bulldozers:[2,3],excavators:[2,3],heavy_haulers:[1,2],asphalt_plants:[1,2] }, wf: { general:[120,180],skilled:[20,40] } },
    public_housing:       { mat: { concrete:[6,11],steel:[4,7],lumber:[4,7],glass_facades:[2,4],em_systems:[3,5],aggregate:[2,4] }, equip: { work_trucks:[2,4],excavators:[1,2],concrete_mixers:[1,2],tower_cranes:[1,2] }, wf: { general:[80,140],skilled:[15,30] } },
    water_treatment:      { mat: { concrete:[6,10],steel:[4,7],em_systems:[5,8],heavy_parts:[3,5],aggregate:[3,5] }, equip: { work_trucks:[2,3],excavators:[1,2],concrete_mixers:[1,1],bulldozers:[1,1] }, wf: { general:[70,110],skilled:[20,35] } },
    government_office:    { mat: { concrete:[6,10],steel:[5,8],glass_facades:[4,7],em_systems:[4,6],lumber:[2,3] }, equip: { work_trucks:[2,3],excavators:[1,2],concrete_mixers:[1,1],tower_cranes:[1,1] }, wf: { general:[80,130],skilled:[20,35] } },
    bridge_construction:  { mat: { concrete:[8,14],steel:[8,14],aggregate:[5,8],heavy_parts:[3,6] }, equip: { work_trucks:[2,4],excavators:[2,3],pile_drivers:[1,2],tower_cranes:[1,2],heavy_haulers:[1,2] }, wf: { general:[100,160],skilled:[25,45] } },
    transit_station:      { mat: { concrete:[4,7],steel:[3,5],glass_facades:[2,4],em_systems:[2,4],aggregate:[2,3] }, equip: { work_trucks:[1,2],excavators:[1,1],concrete_mixers:[1,1] }, wf: { general:[50,90],skilled:[12,25] } },
    waste_processing:     { mat: { concrete:[5,9],steel:[4,7],em_systems:[4,7],heavy_parts:[3,5],aggregate:[3,5] }, equip: { work_trucks:[2,3],excavators:[1,2],bulldozers:[1,1],concrete_mixers:[1,1] }, wf: { general:[60,100],skilled:[18,30] } },
    flood_defense:        { mat: { concrete:[10,16],steel:[6,10],aggregate:[6,10],heavy_parts:[3,5] }, equip: { work_trucks:[3,5],excavators:[2,3],bulldozers:[1,2],pile_drivers:[1,2],heavy_haulers:[1,2] }, wf: { general:[100,160],skilled:[22,40] } },
    // Private civil
    commercial_tower:     { mat: { concrete:[6,10],steel:[5,8],glass_facades:[5,8],em_systems:[4,6],lumber:[1,2] }, equip: { work_trucks:[2,3],tower_cranes:[1,2],concrete_mixers:[1,1],excavators:[1,2] }, wf: { general:[80,130],skilled:[20,35] } },
    retail_complex:       { mat: { concrete:[5,8],steel:[3,6],glass_facades:[3,6],em_systems:[3,5],lumber:[2,4],aggregate:[2,3] }, equip: { work_trucks:[2,3],excavators:[1,2],concrete_mixers:[1,1] }, wf: { general:[60,110],skilled:[15,28] } },
    residential_tower:    { mat: { concrete:[6,10],steel:[4,7],glass_facades:[3,5],em_systems:[3,5],lumber:[3,5] }, equip: { work_trucks:[2,3],tower_cranes:[1,2],concrete_mixers:[1,1],excavators:[1,1] }, wf: { general:[70,120],skilled:[15,30] } },
    hotel_resort:         { mat: { concrete:[5,9],steel:[4,7],glass_facades:[3,6],em_systems:[4,6],lumber:[2,4] }, equip: { work_trucks:[2,3],tower_cranes:[1,1],concrete_mixers:[1,1],excavators:[1,2] }, wf: { general:[70,120],skilled:[18,32] } },
    corporate_campus:     { mat: { concrete:[8,12],steel:[5,8],glass_facades:[4,7],em_systems:[5,8],lumber:[2,3],aggregate:[2,4] }, equip: { work_trucks:[3,4],excavators:[1,2],concrete_mixers:[1,2],tower_cranes:[1,1] }, wf: { general:[90,150],skilled:[22,38] } },
    logistics_center:     { mat: { concrete:[4,7],steel:[4,7],aggregate:[3,5],heavy_parts:[2,4],em_systems:[2,3] }, equip: { work_trucks:[2,3],excavators:[1,2],bulldozers:[1,1],concrete_mixers:[1,1] }, wf: { general:[50,80],skilled:[10,20] } },
    mixed_use_development:{ mat: { concrete:[7,11],steel:[5,8],glass_facades:[3,6],em_systems:[4,6],lumber:[3,5],aggregate:[2,3] }, equip: { work_trucks:[2,4],tower_cranes:[1,2],excavators:[1,2],concrete_mixers:[1,1] }, wf: { general:[80,140],skilled:[20,35] } },
    medical_center:       { mat: { concrete:[5,9],steel:[4,7],glass_facades:[2,4],em_systems:[4,7],lumber:[1,3],heavy_parts:[1,2] }, equip: { work_trucks:[2,3],excavators:[1,2],concrete_mixers:[1,1],tower_cranes:[1,1] }, wf: { general:[70,110],skilled:[22,38] } },
    shopping_mall:        { mat: { concrete:[5,8],steel:[3,5],glass_facades:[3,5],em_systems:[2,4],lumber:[2,4],aggregate:[2,3] }, equip: { work_trucks:[1,3],excavators:[1,1],concrete_mixers:[1,1],bulldozers:[1,1] }, wf: { general:[50,90],skilled:[12,25] } },
    parking_structure:    { mat: { concrete:[5,8],steel:[3,5],aggregate:[3,5] }, equip: { work_trucks:[1,2],excavators:[1,1],concrete_mixers:[1,1] }, wf: { general:[30,60],skilled:[8,16] } },
    // Industrial
    power_station:        { mat: { concrete:[10,16],steel:[10,16],heavy_parts:[6,10],em_systems:[6,10],aggregate:[5,8] }, equip: { work_trucks:[4,6],excavators:[2,4],tower_cranes:[2,3],heavy_haulers:[2,3],pile_drivers:[1,2],concrete_mixers:[2,3] }, wf: { general:[160,240],skilled:[50,80] } },
    hydroelectric_dam:    { mat: { concrete:[16,24],steel:[10,16],aggregate:[10,16],heavy_parts:[6,10],em_systems:[4,8] }, equip: { work_trucks:[5,8],excavators:[3,5],bulldozers:[2,3],tower_cranes:[2,3],heavy_haulers:[2,4],pile_drivers:[2,3],concrete_mixers:[2,4] }, wf: { general:[200,300],skilled:[60,100] } },
    manufacturing_complex:{ mat: { steel:[12,18],concrete:[8,14],heavy_parts:[5,9],em_systems:[5,8],aggregate:[3,5],glass_facades:[2,4] }, equip: { work_trucks:[3,5],excavators:[2,3],tower_cranes:[1,2],heavy_haulers:[1,2],concrete_mixers:[1,2] }, wf: { general:[140,220],skilled:[40,65] } },
    oil_refinery:         { mat: { steel:[14,22],heavy_parts:[8,14],concrete:[8,12],em_systems:[6,10],aggregate:[4,6] }, equip: { work_trucks:[4,6],tower_cranes:[2,3],heavy_haulers:[2,3],excavators:[2,3],pile_drivers:[1,2],concrete_mixers:[1,2] }, wf: { general:[160,240],skilled:[55,90] } },
    shipping_port:        { mat: { concrete:[12,20],steel:[10,16],aggregate:[8,12],heavy_parts:[5,8],em_systems:[4,7] }, equip: { work_trucks:[4,6],excavators:[2,4],pile_drivers:[2,3],tower_cranes:[1,2],heavy_haulers:[2,3],bulldozers:[1,2] }, wf: { general:[180,260],skilled:[50,80] } },
    military_installation:{ mat: { concrete:[10,16],steel:[6,10],aggregate:[5,8],lumber:[3,5],em_systems:[4,6],heavy_parts:[3,5] }, equip: { work_trucks:[3,5],excavators:[2,3],bulldozers:[1,2],concrete_mixers:[1,2],heavy_haulers:[1,2] }, wf: { general:[140,200],skilled:[35,55] } },
    telecom_network:      { mat: { steel:[8,14],concrete:[4,7],em_systems:[8,14],heavy_parts:[3,5],aggregate:[2,4] }, equip: { work_trucks:[2,4],excavators:[1,2],heavy_haulers:[1,2],tower_cranes:[1,1] }, wf: { general:[80,140],skilled:[30,55] } },
    railway_corridor:     { mat: { steel:[10,16],concrete:[8,12],aggregate:[8,12],asphalt:[3,5],heavy_parts:[4,7] }, equip: { work_trucks:[4,6],excavators:[2,3],bulldozers:[1,2],heavy_haulers:[2,3],asphalt_plants:[1,2],pile_drivers:[1,2] }, wf: { general:[140,220],skilled:[35,60] } },
    desalination_plant:   { mat: { concrete:[8,14],steel:[6,10],em_systems:[6,10],heavy_parts:[4,7],aggregate:[3,5] }, equip: { work_trucks:[3,4],excavators:[1,2],concrete_mixers:[1,2],tower_cranes:[1,2],pile_drivers:[1,1] }, wf: { general:[120,180],skilled:[35,60] } },
    // Mega
    sports_stadium:       { mat: { concrete:[20,30],steel:[18,28],glass_facades:[8,14],em_systems:[8,14],heavy_parts:[6,10],aggregate:[6,10],lumber:[3,5] }, equip: { work_trucks:[6,10],excavators:[3,5],bulldozers:[2,3],concrete_mixers:[3,4],tower_cranes:[2,4],heavy_haulers:[2,4],pile_drivers:[1,3] }, wf: { general:[300,500],skilled:[80,140] } },
    international_airport:{ mat: { concrete:[24,36],steel:[18,28],asphalt:[14,22],aggregate:[12,18],glass_facades:[8,14],em_systems:[10,16],heavy_parts:[6,10] }, equip: { work_trucks:[8,12],excavators:[4,6],bulldozers:[3,5],concrete_mixers:[3,5],tower_cranes:[3,5],heavy_haulers:[3,5],pile_drivers:[2,3],asphalt_plants:[2,3] }, wf: { general:[400,600],skilled:[120,200] } },
    high_speed_rail:      { mat: { steel:[22,34],concrete:[18,28],aggregate:[14,22],asphalt:[6,10],heavy_parts:[8,14],em_systems:[6,10] }, equip: { work_trucks:[8,12],excavators:[4,6],bulldozers:[3,5],heavy_haulers:[3,5],pile_drivers:[2,4],asphalt_plants:[2,3],tower_cranes:[2,3],concrete_mixers:[2,4] }, wf: { general:[500,700],skilled:[120,200] } },
    parliament_complex:   { mat: { concrete:[16,24],steel:[12,18],glass_facades:[10,16],lumber:[6,10],em_systems:[6,10],heavy_parts:[4,6],aggregate:[4,6] }, equip: { work_trucks:[5,8],excavators:[2,4],concrete_mixers:[2,3],tower_cranes:[2,3],heavy_haulers:[1,3],pile_drivers:[1,2] }, wf: { general:[250,400],skilled:[70,120] } },
    national_freeway:     { mat: { asphalt:[20,30],aggregate:[16,24],concrete:[14,22],steel:[10,16],heavy_parts:[6,10] }, equip: { work_trucks:[8,12],excavators:[4,6],bulldozers:[3,5],heavy_haulers:[3,5],asphalt_plants:[2,4],concrete_mixers:[2,3],pile_drivers:[1,2] }, wf: { general:[400,600],skilled:[80,140] } },
    deepwater_port:       { mat: { concrete:[22,32],steel:[16,24],aggregate:[10,16],heavy_parts:[8,12],em_systems:[6,10] }, equip: { work_trucks:[6,10],excavators:[3,5],pile_drivers:[2,4],tower_cranes:[2,3],heavy_haulers:[3,5],bulldozers:[2,3],concrete_mixers:[2,3] }, wf: { general:[350,550],skilled:[90,150] } },
    intercontinental_crossing: { mat: { concrete:[28,40],steel:[24,36],aggregate:[14,20],heavy_parts:[10,16],em_systems:[6,10] }, equip: { work_trucks:[10,14],excavators:[5,7],bulldozers:[3,5],concrete_mixers:[3,5],tower_cranes:[3,5],heavy_haulers:[4,6],pile_drivers:[2,4] }, wf: { general:[500,700],skilled:[140,220] } },
    university_campus:    { mat: { concrete:[16,24],steel:[10,16],glass_facades:[8,12],lumber:[6,10],em_systems:[6,10],aggregate:[4,6] }, equip: { work_trucks:[5,8],excavators:[2,3],concrete_mixers:[2,3],tower_cranes:[1,3],heavy_haulers:[1,2],bulldozers:[1,2] }, wf: { general:[250,400],skilled:[60,100] } },
    metro_system:         { mat: { concrete:[24,36],steel:[20,30],aggregate:[12,18],em_systems:[10,16],heavy_parts:[8,12] }, equip: { work_trucks:[8,12],excavators:[4,6],bulldozers:[3,4],tower_cranes:[2,4],heavy_haulers:[3,5],pile_drivers:[2,4],concrete_mixers:[2,4] }, wf: { general:[400,600],skilled:[100,160] } },
    flood_irrigation_network: { mat: { concrete:[22,32],aggregate:[14,20],steel:[10,16],heavy_parts:[6,10],em_systems:[4,8] }, equip: { work_trucks:[6,10],excavators:[3,5],bulldozers:[2,4],pile_drivers:[1,3],tower_cranes:[1,2],heavy_haulers:[2,4],concrete_mixers:[1,3] }, wf: { general:[350,500],skilled:[80,130] } },
};

function ccRand(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function ccPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Resolve corp_properties metadata for a delivered contract when the contract has
// an issuer (corp-commissioned project). Returns null for national infrastructure
// or unrecognized templates so the caller can skip the property handoff. Keep the
// defaults here aligned with PF_CATALOG in corp-operations.html so client-side and
// tick-processor-delivered assets show up identically on the issuer's property card.
function getDeliveredPropertyMeta(contract, fallbackPaidPrice) {
    const tk = contract?.template_key;
    if (!tk) return null;
    if (tk === 'fuel_depot' || tk === 'dry_dock') {
        const style = contract.project_subtype || 'Basic';
        const isModern = style === 'Modern';
        const maintenance = tk === 'fuel_depot'
            ? (isModern ? 110000 : 85000)
            : (isModern ? 200000 : 150000);
        return {
            type: tk,
            style,
            capacity: isModern ? 500 : 250,
            maintenance,
        };
    }
    if (tk === 'custom_building') {
        return {
            type: 'office',
            style: contract.project_subtype || 'Basic',
            capacity: 500,
            maintenance: Math.max(10000, Math.round(Number(fallbackPaidPrice || 0) * 0.001)),
        };
    }
    return null;
}

function resolveIncidentNationId(vessel, corpNationId, claimRouteMap) {
    const destinationNationId = vessel?.active_claim_id
        ? claimRouteMap?.get(vessel.active_claim_id)?.shipping_routes?.destination_nation_id
        : null;
    return destinationNationId || vessel?.current_port_nation_id || corpNationId || null;
}

// ── Shipping margin model helpers ─────────────────────────────────────────────
const INCIDENT_RESERVE_RATE = 0.06; // Hold back 6% of modeled gross for incident/insurance shock
const MAINTENANCE_MULTIPLIER_BY_STATUS = {
    in_port: 0.55,     // idle in port: crew+systems still cost, but lower than sailing
    loading: 0.85,     // active handling/turnaround in port
    in_transit: 1.25,  // sustained sea operation wear
    anchored: 0.65,
    dry_dock: 1.15,
};
const VESSEL_FUEL_CLASS_FACTOR = {
    Coastal: 0.82,
    Container: 1.18,
    Bulk: 1.00,
    Tanker: 1.28,
    Reefer: 1.12,
    LNG: 1.34,
};

function maintenanceMultiplierForStatus(status) {
    return MAINTENANCE_MULTIPLIER_BY_STATUS[status] ?? 1.0;
}

function computeFuelCostForTransit({ route, vesselClass, depotTier }) {
    const baseFuelCost = 50000;
    const proximity = Math.max(0, Math.min(100, Number(route?.proximity) || 50));
    const scope = String(route?.scope || '').toUpperCase();
    const classFactor = VESSEL_FUEL_CLASS_FACTOR[vesselClass] || 1.0;

    // Route factor keeps lane length meaningful without making long lanes impossible.
    const proximityFactor = 0.75 + (proximity / 100) * 0.9; // 0.75x … 1.65x
    const scopeFactor = scope === 'COASTAL' ? 0.92 : scope === 'GOVERNMENT' ? 1.05 : 1.0;
    const routeFuelBase = Math.round(baseFuelCost * classFactor * proximityFactor * scopeFactor);

    if (depotTier === 'own') return routeFuelBase;
    if (depotTier === 'other') return Math.round(routeFuelBase * 1.15);
    // State fallback remains punitive but is capped below the old hard 3x markup.
    return Math.round(routeFuelBase * 1.65);
}

function estimateMonthlyClaimMargin({ route, claim, vessel, fuelCostPerTransit }) {
    const transitTicks = Math.max(1, Number(route?.transit_ticks) || 2);
    // Each claim alternates load + transit; monthly cycle ≈ 2*transit ticks.
    const transitsPerMonth = Math.max(1, 12 / (transitTicks * 2));
    const grossRevenue = Math.round((Number(claim?.revenue_per_transit) || 0) * transitsPerMonth);
    const fuelCost = Math.round((Number(fuelCostPerTransit) || 0) * transitsPerMonth);
    const maintenanceCost = Math.round(
        (Number(vessel?.base_maintenance) || 0) * maintenanceMultiplierForStatus(vessel?.status)
    );
    const incidentReserve = Math.round(grossRevenue * INCIDENT_RESERVE_RATE);
    const netMargin = grossRevenue - fuelCost - maintenanceCost - incidentReserve;
    return { grossRevenue, fuelCost, maintenanceCost, incidentReserve, netMargin };
}

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
    // ═══════════════════════════════════════════════════════════════════════════
    // PERMIT-LINKED EVENTS (N11-N26): Fire when corresponding permit policy
    // is NOT enacted or corp doesn't hold the permit. Probability reduced by
    // permit event_modifiers when the corp holds the relevant permit.
    // ═══════════════════════════════════════════════════════════════════════════

    // ── N11: NOISE COMPLAINT SHUTDOWN (noise_vibration permit) ──
    {
        key: 'noise_complaint_shutdown', type: 'POLITICAL', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'EARLY_MID', probability: 0.09,
        appliesTo: ['civil_engineering'],
        title: 'Noise Complaint Shutdown',
        desc: 'Residents near the construction site have filed a formal noise complaint with the local government. An injunction has been issued halting work during daytime hours until noise mitigation measures are installed.',
        impact: 'Construction halted. Noise barriers and restricted hours add cost and delay.',
        effects: { delay: 1, cost: 50000 },
        statModifiers: [
            { stat: 'urbanization', baseline: 55, perPoint: 0.02, direction: 'above' },
        ],
    },
    // ── N12: CHEMICAL SPILL (hazmat_handling permit) ──
    {
        key: 'environmental_contamination', type: 'REGULATORY', severity: 'CRITICAL',
        category: 'notification', phaseWindow: 'MID', probability: 0.05,
        appliesTo: ['industrial', 'mega_project'],
        title: 'Chemical Spill at Construction Site',
        desc: 'Hazardous materials stored improperly at the construction site have leaked into the surrounding soil. Environmental authorities have ordered an immediate site lockdown, soil remediation, and a full contamination assessment.',
        impact: 'Site locked down. Massive fines, remediation costs, and project delay.',
        effects: { delay: 3, cost: 500000, quality: -5 },
        statModifiers: [
            { stat: 'manufacturing_output', baseline: 50, perPoint: 0.01, direction: 'above' },
        ],
    },
    // ── N13: WATER TABLE CONTAMINATION (water_resource permit) ──
    {
        key: 'flooding_damage', type: 'WEATHER', severity: 'HIGH',
        category: 'notification', phaseWindow: 'EARLY_MID', probability: 0.07,
        appliesTo: ['civil_engineering', 'industrial', 'mega_project'],
        title: 'Water Table Contamination',
        desc: 'Construction runoff has contaminated the local groundwater supply. The environmental agency has ordered water testing, site drainage redesign, and compensation for affected residents.',
        impact: 'Groundwater remediation required. Public health concern.',
        effects: { delay: 2, cost: 200000, quality: -3 },
        statModifiers: [
            { stat: 'physical_infrastructure', baseline: 30, perPoint: 0.02, direction: 'below' },
        ],
    },
    // ── N14: COASTAL EROSION DAMAGE (coastal_maritime permit) ──
    {
        key: 'storm_damage', type: 'WEATHER', severity: 'HIGH',
        category: 'notification', phaseWindow: 'MID', probability: 0.06,
        appliesTo: ['civil_engineering', 'industrial', 'mega_project'],
        title: 'Coastal Erosion Damage',
        desc: 'Storm surge and tidal action have undermined the foundations of the coastal structure. The site requires emergency stabilization, foundation reinforcement, and a revised engineering assessment.',
        impact: 'Foundation compromised. Emergency repair and engineering review.',
        effects: { delay: 2, cost: 300000, quality: -4 },
        statModifiers: [
            { stat: 'physical_infrastructure', baseline: 40, perPoint: 0.02, direction: 'below' },
        ],
    },
    // ── N15: GRID INTEGRATION FAILURE (renewable_energy permit) ──
    {
        key: 'grid_integration_failure', type: 'EQUIPMENT', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'LATE', probability: 0.08,
        appliesTo: ['civil_engineering', 'industrial', 'mega_project'],
        title: 'Grid Integration Failure',
        desc: 'The renewable energy installation cannot connect to the national power grid. The grid operator has rejected the connection application citing non-compliance with grid stability standards. Rewiring and recertification required.',
        impact: 'Project cannot be commissioned until grid compliance achieved.',
        effects: { delay: 2, cost: 120000 },
        statModifiers: [
            { stat: 'energy_generation', baseline: 40, perPoint: 0.02, direction: 'below' },
        ],
    },
    // ── N16: SIGNAL INTERFERENCE (telecom_infrastructure permit) ──
    {
        key: 'signal_interference', type: 'REGULATORY', severity: 'LOW',
        category: 'notification', phaseWindow: 'LATE', probability: 0.07,
        appliesTo: ['civil_engineering', 'industrial'],
        title: 'Signal Interference Complaint',
        desc: 'The telecommunications installation is causing electromagnetic interference with existing networks. The spectrum regulator has ordered a temporary shutdown and compliance review.',
        impact: 'Installation offline pending spectrum recalibration.',
        effects: { delay: 1, cost: 30000 },
        statModifiers: [
            { stat: 'digital_infrastructure', baseline: 45, perPoint: 0.01, direction: 'above' },
        ],
    },
    // ── N17: ILLEGAL LAND CLEARING (agri_land_conversion permit) ──
    {
        key: 'illegal_land_clearing', type: 'POLITICAL', severity: 'HIGH',
        category: 'notification', phaseWindow: 'EARLY', probability: 0.06,
        appliesTo: ['civil_engineering', 'industrial'],
        title: 'Illegal Agricultural Land Clearing',
        desc: 'The construction site was cleared without proper food security impact review. Environmental and agricultural authorities have issued stop-work orders, and local farming communities are demanding compensation.',
        impact: 'Political fallout. Community anger. Food security concerns raised.',
        effects: { delay: 2, cost: 200000, reputation: -3 },
        statModifiers: [
            { stat: 'urbanization', baseline: 60, perPoint: 0.02, direction: 'above' },
        ],
    },
    // ── N18: HERITAGE SITE DESTROYED (heritage_preservation permit) ──
    {
        key: 'heritage_damage', type: 'POLITICAL', severity: 'CRITICAL',
        category: 'notification', phaseWindow: 'EARLY_MID', probability: 0.04,
        appliesTo: ['civil_engineering', 'mega_project'],
        title: 'Heritage Site Destroyed',
        desc: 'Construction equipment has damaged an unregistered but culturally significant archaeological site. International heritage organizations have condemned the destruction. Media coverage is intense and the government faces pressure to halt the project.',
        impact: 'International condemnation. Severe reputation damage. Possible project cancellation.',
        effects: { delay: 3, cost: 400000, quality: -5, reputation: -5 },
        statModifiers: [
            { stat: 'stability', baseline: 60, perPoint: 0.01, direction: 'above' },
        ],
    },
    // ── N19: BUILDING COLLAPSE — SEISMIC (seismic_resilience permit) ──
    {
        key: 'structural_failure', type: 'EQUIPMENT', severity: 'CRITICAL',
        category: 'notification', phaseWindow: 'MID_LATE', probability: 0.04,
        appliesTo: ['civil_engineering', 'industrial', 'mega_project'],
        title: 'Seismic Structural Failure',
        desc: 'A seismic event has caused partial structural collapse at the construction site. The building was not designed to earthquake-resistant standards. Emergency services have been called and a full structural reassessment is required.',
        impact: 'Catastrophic failure. Casualties possible. Project may be condemned.',
        effects: { delay: 4, cost: 600000, quality: -15, reputation: -8 },
        statModifiers: [
            { stat: 'stability', baseline: 30, perPoint: 0.03, direction: 'below' },
        ],
    },
    // ── N20: EMERGENCY SYSTEM FAILURE (disaster_preparedness permit) ──
    {
        key: 'disaster_casualties', type: 'REGULATORY', severity: 'HIGH',
        category: 'notification', phaseWindow: 'LATE', probability: 0.05,
        appliesTo: ['civil_engineering', 'mega_project'],
        title: 'Emergency System Failure',
        desc: 'During a safety drill, the building\'s emergency evacuation systems were found non-functional. Fire exits are blocked, backup power failed, and shelter capacity is inadequate. The building fails its emergency preparedness certification.',
        impact: 'Cannot pass final inspection. Retrofit required.',
        effects: { delay: 2, cost: 180000, quality: -5 },
        statModifiers: [
            { stat: 'stability', baseline: 35, perPoint: 0.02, direction: 'below' },
        ],
    },
    // ── N21: FOREIGN INFLUENCE SCANDAL (foreign_investment_clearance permit) ──
    {
        key: 'foreign_influence_scandal', type: 'POLITICAL', severity: 'HIGH',
        category: 'notification', phaseWindow: 'ANY', probability: 0.05,
        appliesTo: ['industrial', 'mega_project'],
        title: 'Foreign Influence Scandal',
        desc: 'Investigative journalists have revealed that the project\'s foreign funding comes with undisclosed political strings. The foreign investor has connections to a foreign government and the project may be a vector for foreign influence in national infrastructure.',
        impact: 'Diplomatic incident. Reputation damage. Government scrutiny.',
        effects: { cost: 150000, reputation: -4 },
        statModifiers: [
            { stat: 'foreign_investment', baseline: 60, perPoint: 0.01, direction: 'above' },
        ],
    },
    // ── N22: BRIBERY SCANDAL (anti_corruption permit) ──
    {
        key: 'corruption_scandal', type: 'POLITICAL', severity: 'HIGH',
        category: 'notification', phaseWindow: 'ANY', probability: 0.06,
        appliesTo: ['civil_engineering', 'industrial', 'mega_project'],
        title: 'Construction Bribery Scandal',
        desc: 'An employee has been caught offering bribes to government officials to expedite permit approvals and inspection sign-offs. The anti-corruption bureau has launched a formal investigation into the corporation.',
        impact: 'Criminal investigation. Severe reputation damage. Possible contract cancellation.',
        effects: { delay: 2, cost: 250000, quality: -3, reputation: -6 },
        statModifiers: [
            { stat: 'corruption', baseline: 50, perPoint: 0.02, direction: 'above' },
        ],
    },
    // ── N23: LABOR EXPLOITATION ALLEGATION (local_workforce permit) ──
    {
        key: 'labor_exploitation', type: 'LABOR', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'MID', probability: 0.07,
        appliesTo: ['civil_engineering', 'industrial', 'mega_project'],
        title: 'Labor Exploitation Allegation',
        desc: 'A media report has accused the corporation of using imported workers at below minimum wage while local residents remain unemployed. Union leaders are calling for a boycott and the labor ministry is investigating.',
        impact: 'Public backlash. Union pressure. Possible fines.',
        effects: { cost: 80000, reputation: -2 },
        statModifiers: [
            { stat: 'unemployment', baseline: 40, perPoint: 0.02, direction: 'above' },
        ],
    },
    // ── N24: SKILLS SHORTAGE FAILURE (apprenticeship_training permit) ──
    {
        key: 'skills_shortage', type: 'LABOR', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'MID_LATE', probability: 0.07,
        appliesTo: ['civil_engineering', 'industrial', 'mega_project'],
        title: 'Critical Skills Shortage',
        desc: 'The project requires specialized technical work but the crew lacks qualified tradespeople. No apprenticeship programs exist to develop these skills locally. Work quality on complex systems is suffering and the project timeline is slipping.',
        impact: 'Quality degradation on technical phases. Delay while specialists recruited.',
        effects: { delay: 1, cost: 60000, quality: -5 },
        statModifiers: [
            { stat: 'higher_education', baseline: 40, perPoint: 0.02, direction: 'below' },
        ],
    },
    // ── N25: COMMUNITY PROTEST BLOCKADE (community_consultation permit) ──
    {
        key: 'community_protest_blockade', type: 'POLITICAL', severity: 'HIGH',
        category: 'notification', phaseWindow: 'EARLY', probability: 0.06,
        appliesTo: ['civil_engineering', 'mega_project'],
        title: 'Community Protest Blockade',
        desc: 'Residents who were not consulted about the construction project have physically blockaded the site entrance. Demolition of existing homes began without community input. Local politicians are demanding the project be halted pending public hearings.',
        impact: 'Site blockaded. Political crisis. Construction halted.',
        effects: { delay: 2, cost: 100000, reputation: -3 },
        statModifiers: [
            { stat: 'urbanization', baseline: 65, perPoint: 0.02, direction: 'above' },
            { stat: 'civil_unrest', baseline: 40, perPoint: 0.02, direction: 'above' },
        ],
    },
    // ── N26: ACCESSIBILITY LAWSUIT (public_accessibility permit) ──
    {
        key: 'accessibility_lawsuit', type: 'REGULATORY', severity: 'MODERATE',
        category: 'notification', phaseWindow: 'LATE', probability: 0.07,
        appliesTo: ['civil_engineering', 'mega_project'],
        title: 'Accessibility Lawsuit Filed',
        desc: 'Disability advocacy groups have filed a lawsuit alleging the building fails to meet basic accessibility standards. No wheelchair ramps, no elevator to upper floors, no tactile wayfinding. The court has ordered a compliance review and potential forced retrofit.',
        impact: 'Forced retrofit at 2x cost. Legal fees. Reputation damage.',
        effects: { delay: 1, cost: 150000, quality: -2, reputation: -2 },
        statModifiers: [
            { stat: 'healthcare_accessibility', baseline: 40, perPoint: 0.02, direction: 'below' },
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

// ── REGULATORY & MATERIAL QUALITY EVENTS ──
// These fire based on missing permits and low-quality material usage.
// They are checked separately from the probability-based notification events
// because they require permit and material data not available in the template system.
const REGULATORY_EVENTS = {
    // Missing permits
    regulatory_inspection: {
        key: 'regulatory_inspection',
        name: 'Regulatory Compliance Inspection',
        severity: 'MODERATE',
        description: 'A government inspector found the project operating without required permits.',
        cost: 100000,
        delay: 1,
        quality: -2,
        reputation: 0,
    },
    stop_work_order: {
        key: 'stop_work_order',
        name: 'Government Stop-Work Order',
        severity: 'HIGH',
        description: 'Multiple missing permits triggered an immediate stop-work order from the government.',
        cost: 250000,
        delay: 2,
        quality: -5,
        reputation: -3,
    },
    worker_whistleblower: {
        key: 'worker_whistleblower',
        name: 'Worker Safety Whistleblower',
        severity: 'MODERATE',
        description: 'Workers reported unsafe conditions due to missing safety permits. An investigation has been launched.',
        cost: 50000,
        delay: 1,
        quality: -3,
        reputation: -2,
    },
    // Material quality
    material_defect_recall: {
        key: 'material_defect_recall',
        name: 'Material Defect Recall',
        severity: 'MODERATE',
        description: 'A supplier issued a recall on a batch of low-grade materials. Replacement required.',
        cost: 150000,
        delay: 1,
        quality: -3,
        reputation: 0,
    },
    foundation_subsidence: {
        key: 'foundation_subsidence',
        name: 'Foundation Subsidence',
        severity: 'HIGH',
        description: 'Low-grade concrete cracked under structural load, causing foundation settlement. Emergency remediation required.',
        cost: 300000,
        delay: 2,
        quality: -8,
        reputation: -1,
    },
    structural_integrity_failure: {
        key: 'structural_integrity_failure',
        name: 'Structural Integrity Failure',
        severity: 'CRITICAL',
        description: 'Widespread use of low-grade materials has compromised structural integrity. Emergency engineering review and reinforcement required.',
        cost: 500000,
        delay: 3,
        quality: -15,
        reputation: -5,
    },
};

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

    // Load building modifier definitions once
    let _buildingModifiers = null;
    try {
        const { data: modDefs } = await supabase.from('building_modifiers').select('*');
        _buildingModifiers = modDefs || [];
    } catch (_) { /* table may not exist yet */ }

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

    // Check mega project cooldown — available at moderate GDP growth (was 75)
    let megaAllowed = gdp >= 50;
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
        } else if (gdp >= 25 && Math.random() < 0.35) {
            // Industrial available even in struggling economies (was gdp>=51)
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
        // Private issuers get private-appropriate civil templates (Commercial Tower, Hotel, etc.)
        const pool = sector === 'mega_project' ? CC_MEGA : sector === 'industrial' ? CC_INDUSTRIAL : CC_CIVIL_PRIVATE;
        const key = ccPick(pool);
        const tmpl = CC_TEMPLATES[key];
        if (!tmpl) continue;

        // Generate required materials first (needed for budget calculation) — 10x base quantities
        const requiredMats: Record<string, number> = {};
        const reqs = CC_REQUIREMENTS[key];
        if (reqs?.mat) {
            for (const [k, [lo, hi]] of Object.entries(reqs.mat)) requiredMats[k] = Math.round(ccRand(lo as number, hi as number) * 10);
        }

        // Generate workforce (100x template ranges)
        const requiredWf = reqs?.wf
            ? { general: ccRand((reqs.wf as any).general[0], (reqs.wf as any).general[1]) * 100, skilled: ccRand((reqs.wf as any).skilled[0], (reqs.wf as any).skilled[1]) * 100 }
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

        // Roll building modifiers based on nation stats (0-3 per contract)
        const contractModifiers = [];
        if (_buildingModifiers) {
            const eligible = _buildingModifiers.filter(m =>
                m.category === 'site' || m.category === 'nation'
            ).filter(m => {
                // Check sector applicability
                const appliesTo = m.applies_to || [];
                if (!appliesTo.includes(sector)) return false;
                // Check stat threshold
                if (m.probability_stat) {
                    const statVal = Number(nation[m.probability_stat] ?? 50);
                    // For seismic_zone: low stability = higher chance (below threshold)
                    if (m.modifier_key === 'seismic_zone') return statVal < m.probability_threshold;
                    return statVal >= m.probability_threshold;
                }
                return m.probability_base > 0;
            });
            for (const mod of eligible) {
                if (contractModifiers.length >= 3) break; // max 3 modifiers
                if (Math.random() < (mod.probability_base || 0.1)) {
                    contractModifiers.push(mod.modifier_key);
                }
            }
        }

        // Apply cost multiplier from modifiers
        let modifiedBudget = budget;
        if (_buildingModifiers && contractModifiers.length > 0) {
            for (const mk of contractModifiers) {
                const mod = _buildingModifiers.find(m => m.modifier_key === mk);
                if (mod) modifiedBudget = Math.round(modifiedBudget * mod.cost_multiplier);
            }
        }

        const { data: contract, error } = await supabase.from('construction_contracts').insert({
            nation_id: nation.id,
            template_key: key,
            sector: tmpl.sector,
            name: tmpl.name,
            description: tmpl.desc,
            project_code: projectId,
            budget_ceiling: modifiedBudget,
            timeline_ticks: timeline,
            required_materials: requiredMats,
            required_equipment: (() => {
                const equipDef = CC_REQUIREMENTS[key]?.equip || {};
                const result = {};
                for (const [ek, range] of Object.entries(equipDef)) {
                    result[ek] = Array.isArray(range) ? ccRand(range[0], range[1]) * 5 : ((range || 1) * 5);
                }
                return result;
            })(),
            required_workforce: requiredWf,
            modifiers: contractModifiers,
            status: 'open',
            min_reputation: sector === 'mega_project' ? 60 : sector === 'industrial' ? 30 : 0,
            insurance_required: modifiedBudget >= 100000000,   // $100M+ requires insurance
            bond_required: modifiedBudget >= 200000000,        // $200M+ requires performance bond
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

// ==================== INFRASTRUCTURE RENEWAL POLICY CONTRACTS ====================
// When the National Infrastructure Renewal Act is active, generate bonus construction
// contracts on a staggered schedule:
//   Wave 1 (tick offset 1): 3 civil, 1 industrial, 1 megaproject
//   Wave 2 (tick offset 6): 3 civil, 2 industrial
//   Wave 3 (tick offset 12): 3 civil

const INFRA_RENEWAL_WAVES = [
    { tickOffset: 1,  civil: 3, industrial: 1, mega: 1 },
    { tickOffset: 6,  civil: 3, industrial: 2, mega: 0 },
    { tickOffset: 12, civil: 3, industrial: 0, mega: 0 },
];

async function generateInfraRenewalContracts(supabase, nation, currentTick) {
    // Check for active Infrastructure Renewal policy in this nation
    const { data: activePolicy } = await supabase
        .from('nation_policies')
        .select('id, activated_at_tick, ticks_elapsed')
        .eq('nation_id', nation.id)
        .eq('status', 'active')
        .eq('major_sector', 'ECONOMICS')
        .maybeSingle();

    // Also look up by joining to policies table for the specific policy_key
    const { data: renewalPolicy } = await supabase
        .from('nation_policies')
        .select('id, activated_at_tick, ticks_elapsed, policy_id, policies!inner(policy_key)')
        .eq('nation_id', nation.id)
        .eq('status', 'active')
        .eq('policies.policy_key', 'national_infrastructure_renewal')
        .maybeSingle();

    if (!renewalPolicy) return;

    const ticksSinceActivation = currentTick - (renewalPolicy.activated_at_tick || 0);

    // Check which wave fires this tick
    const wave = INFRA_RENEWAL_WAVES.find(w => w.tickOffset === ticksSinceActivation);
    if (!wave) return;

    console.log(`[InfraRenewal] ${nation.name}: Wave at tick offset ${wave.tickOffset} — ${wave.civil} civil, ${wave.industrial} industrial, ${wave.mega} mega`);

    // Game year for project codes
    const { data: shardDate } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
    const gameYear = (shardDate?.current_date || '').match(/\d{4}/)?.[0] || '2014';

    const GOVT_ISSUERS = [
        'Ministry of Public Works', 'National Infrastructure Agency',
        'Department of Urban Development', 'Bureau of Civil Engineering',
        'Government Construction Authority', 'National Building Commission',
    ];

    // Build the slot list
    const slots: string[] = [];
    for (let i = 0; i < wave.civil; i++) slots.push('civil_engineering');
    for (let i = 0; i < wave.industrial; i++) slots.push('industrial');
    for (let i = 0; i < wave.mega; i++) slots.push('mega_project');

    let seq = 1;
    for (const sector of slots) {
        const pool = sector === 'mega_project' ? CC_MEGA : sector === 'industrial' ? CC_INDUSTRIAL : CC_CIVIL_PRIVATE;
        const key = ccPick(pool);
        const tmpl = CC_TEMPLATES[key];
        if (!tmpl) continue;

        const reqs = CC_REQUIREMENTS[key];
        const requiredMats: Record<string, number> = {};
        if (reqs?.mat) {
            for (const [k, [lo, hi]] of Object.entries(reqs.mat)) requiredMats[k] = Math.round(ccRand(lo as number, hi as number) * 10);
        }
        const requiredWf = reqs?.wf
            ? { general: ccRand((reqs.wf as any).general[0], (reqs.wf as any).general[1]) * 100, skilled: ccRand((reqs.wf as any).skilled[0], (reqs.wf as any).skilled[1]) * 100 }
            : {};

        // Budget calculation (same as regular generation)
        const MAT_PRICE = { concrete: 360000, steel: 500000, glass_facades: 560000, em_systems: 640000, lumber: 240000, heavy_parts: 800000, aggregate: 160000, asphalt: 280000 };
        let lowCost = 0, highCost = 0;
        for (const [matKey, qty] of Object.entries(requiredMats)) {
            const basePrice = (MAT_PRICE as any)[matKey] || 300000;
            lowCost += qty * Math.round(basePrice * 0.5);
            highCost += qty * Math.round(basePrice * 2.0);
        }
        const totalWorkers = ((requiredWf as any).general || 0) + ((requiredWf as any).skilled || 0);
        const estTimeline = ccRand(tmpl.ticks[0], tmpl.ticks[1]);
        const laborCost = totalWorkers * 15200 * estTimeline;
        lowCost += laborCost;
        highCost = Math.round((highCost + laborCost) * 1.40);
        const budget = ccRand(lowCost, highCost);

        const projectId = `GOV-R${seq}-${gameYear}`;
        seq++;

        const issuerName = GOVT_ISSUERS[Math.floor(Math.random() * GOVT_ISSUERS.length)];

        const { error } = await supabase.from('construction_contracts').insert({
            nation_id: nation.id,
            template_key: key,
            sector: tmpl.sector,
            name: tmpl.name + ' (Infrastructure Renewal)',
            description: tmpl.desc + ' — Funded by the National Infrastructure Renewal Act.',
            project_code: projectId,
            budget_ceiling: budget,
            timeline_ticks: estTimeline,
            required_materials: requiredMats,
            required_equipment: (() => {
                const equipDef = CC_REQUIREMENTS[key]?.equip || {};
                const result = {};
                for (const [ek, range] of Object.entries(equipDef)) {
                    result[ek] = Array.isArray(range) ? ccRand(range[0], range[1]) * 5 : ((range || 1) * 5);
                }
                return result;
            })(),
            required_workforce: requiredWf,
            status: 'open',
            min_reputation: sector === 'mega_project' ? 60 : sector === 'industrial' ? 30 : 0,
            insurance_required: budget >= 100000000,
            bond_required: budget >= 200000000,
            generated_at_tick: currentTick,
            bidding_ends_tick: currentTick + 3,
            issuer_type: 'GOVERNMENT',
            issuer_name: issuerName,
        });
        if (error) console.error(`[InfraRenewal] Contract insert failed:`, error.message);
    }
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
// Each corp tick: subsidiaries gain or lose cash based on nation GDP Growth
// and their PARENT corp's reputation (which drifts on contract deliveries).
// Investment return = sub_cash × 0.02 × (1 + (gdpGrowth - 30)/100) × baseRepMult × parentRepMult
// Operating overhead = $200K/month base cost per subsidiary (scaled by GDP)
// Revenue = investment return - operating overhead
// GDP Growth < 30 → investment returns go negative, PLUS overhead → bleeds fast
// GDP Growth > 30 → investment returns grow, offset overhead
// baseRepMult is a flat 0.25 (legacy; was meant to be per-sub reputation).
// parentRepMult: symmetric around 1.0 at parent corp_reputation=50
//   (parent rep 0 → 0.3x revenue, rep 50 → 1.0x, rep 100 → 1.7x, clamped).
//   Natural growth loop: parent ships contracts → rep ↑ → sub revenue ↑ → cash compounds.
// sub_cash CAN go negative (subsidiary in debt — needs capital injection or dissolution)
// Losses clamped to max 5% of |sub_cash| per tick to prevent instant wipeout.

const SUB_REVENUE_BASE = 0.02;
const SUB_GDP_NEUTRAL = 30;
const SUB_DEFAULT_REPUTATION = 25;
const SUB_MAX_LOSS_RATE = 0.05;
const SUB_OPERATING_OVERHEAD = 200_000; // $200K/month base cost per subsidiary
const SUB_PARENT_REP_NEUTRAL = 50;       // at this rep the parent-rep multiplier is 1.0x
const SUB_PARENT_REP_MIN = 0.3;          // min multiplier at rep 0
const SUB_PARENT_REP_MAX = 1.7;          // max multiplier at rep 100

async function processSubsidiaryRevenue(supabase, nation, currentTick) {
    const gdpGrowth = Number(nation.gdp_growth ?? 50);

    // All active regional HQs in this nation (including those with 0 or negative cash)
    const { data: hqs, error: hqErr } = await supabase
        .from('corp_properties')
        .select('id, sub_cash, name, faction_id')
        .eq('nation_id', nation.id)
        .eq('type', 'regional_hq')
        .eq('is_active', true);

    if (hqErr) throw hqErr;
    if (!hqs || hqs.length === 0) {
        console.log(`[SubRevenue] ${nation.name}: processed 0 regional HQ(s) at tick ${currentTick}.`);
        return { hqCount: 0, updatedCount: 0 };
    }

    const parentCorpIds = [...new Set(hqs.map(hq => hq.faction_id).filter(Boolean))];
    let corpMap = {};
    if (parentCorpIds.length > 0) {
        const { data: parentCorps, error: corpErr } = await supabase
            .from('factions')
            .select('id, faction_name, corp_reputation')
            .in('id', parentCorpIds);
        if (corpErr) throw corpErr;
        corpMap = Object.fromEntries((parentCorps || []).map(c => [c.id, c]));
    }

    const baseRepMult = SUB_DEFAULT_REPUTATION / 100;
    let updatedCount = 0;
    for (const hq of hqs) {
        const subCash = Number(hq.sub_cash ?? 0);
        const corp = corpMap[hq.faction_id];

        // Parent corp's reputation drives the growth/shrink delta — symmetric
        // around 1.0 at rep 50, clamped so one bad tick can't zero revenue.
        const parentRep = Number(corp?.corp_reputation ?? SUB_PARENT_REP_NEUTRAL);
        const parentRepMult = Math.max(
            SUB_PARENT_REP_MIN,
            Math.min(SUB_PARENT_REP_MAX, (parentRep - SUB_PARENT_REP_NEUTRAL) / 100 + 1)
        );

        // Investment return: based on positive cash balance × GDP × reputation
        const investCash = Math.max(0, subCash);
        const gdpMod = (gdpGrowth - SUB_GDP_NEUTRAL) / 100;
        const investReturn = Math.round(investCash * SUB_REVENUE_BASE * (1 + gdpMod) * baseRepMult * parentRepMult);

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

        if (updErr) {
            console.warn(`[SubRevenue] Failed to update sub_cash for ${hq.name}:`, updErr.message);
        } else {
            updatedCount += 1;
            console.log(`[SubRevenue] ${corp?.faction_name || '?'} → ${hq.name}: ${revenue >= 0 ? '+' : ''}${revenue.toLocaleString()} (GDP:${gdpGrowth}, parentRep:${parentRep}, repMult:${parentRepMult.toFixed(2)}, overhead:${overhead.toLocaleString()}, cash:${subCash.toLocaleString()} → ${newSubCash.toLocaleString()})`);
        }
    }

    console.log(`[SubRevenue] ${nation.name}: processed ${hqs.length} regional HQ(s), updated ${updatedCount}, at tick ${currentTick}.`);
    return { hqCount: hqs.length, updatedCount };
}

function parseRequiredForSectors(rawRequiredFor) {
    if (Array.isArray(rawRequiredFor)) return rawRequiredFor.filter(Boolean);
    if (typeof rawRequiredFor === 'string') {
        try {
            const parsed = JSON.parse(rawRequiredFor);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch (_) { /* ignore malformed JSON */ }
    }
    return [];
}

function permitAppliesToSector(requiredFor, sector) {
    if (!sector) return true;
    const allowed = parseRequiredForSectors(requiredFor);
    if (allowed.length === 0) return true;
    return allowed.includes(sector) || allowed.includes('all') || allowed.includes('*');
}

async function getRequiredPermitKeysForProject(supabase, nationId, sector, cache = {}) {
    const cacheKey = `${nationId}:${sector || 'unknown'}`;
    if (cache[cacheKey]) return cache[cacheKey];

    const { data: reqLaws } = await supabase
        .from('active_laws')
        .select('policies(permit_key)')
        .eq('nation_id', nationId)
        .not('policies.permit_key', 'is', null);

    const lawPermitKeys = [...new Set((reqLaws || []).map(l => l.policies?.permit_key).filter(Boolean))];
    if (lawPermitKeys.length === 0) {
        const empty = [];
        cache[cacheKey] = empty;
        return empty;
    }

    const { data: permitDefs } = await supabase
        .from('construction_permits')
        .select('permit_key, required_for')
        .in('permit_key', lawPermitKeys);

    const requiredKeys = (permitDefs || [])
        .filter(def => permitAppliesToSector(def.required_for, sector))
        .map(def => def.permit_key);

    cache[cacheKey] = requiredKeys;
    return requiredKeys;
}

async function getPermitComplianceSnapshot(supabase, { nationId, sector, factionId, contractId, checkpoint, cache = {} }) {
    const requiredPermitKeys = await getRequiredPermitKeysForProject(supabase, nationId, sector, cache);
    const { data: heldPermitsRows } = await supabase
        .from('corp_permits')
        .select('permit_key')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .eq('status', 'active');
    const heldPermitKeys = [...new Set((heldPermitsRows || []).map(p => p.permit_key).filter(Boolean))];
    const heldSet = new Set(heldPermitKeys);
    const missingPermitKeys = requiredPermitKeys.filter(k => !heldSet.has(k));

    console.log(`[PermitCheck:${checkpoint}] project=${contractId} required=${JSON.stringify(requiredPermitKeys)} held=${JSON.stringify(heldPermitKeys)} missing=${JSON.stringify(missingPermitKeys)}`);

    return { requiredPermitKeys, heldPermitKeys, missingPermitKeys };
}

async function resolveExpiredBids(supabase, nationId, currentTick) {
    // Find contracts ready to resolve:
    // 1. Bidding timer expired (3 ticks), OR
    // 2. Already have 3+ bids (auto-resolve immediately)
    const { data: openContracts } = await supabase
        .from('construction_contracts')
        .select('id, name, budget_ceiling, bidding_ends_tick, sector')
        .eq('nation_id', nationId)
        .in('status', ['open', 'bidding']);

    if (!openContracts || openContracts.length === 0) return [];

    const results = [];
    const permitScopeCache = {};
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

        // Select winner: 50% lowest price, 50% highest quality (no random)
        // This rewards player strategy — either undercut on cost or invest in quality
        const roll = Math.random();
        let winner;
        let method: string;
        if (roll < 0.50) {
            // Lowest price (already sorted ascending)
            winner = bids![0];
            method = 'lowest_price';
        } else {
            // Highest quality
            winner = bids!.reduce((best, b) => (b.estimated_quality || 0) > (best.estimated_quality || 0) ? b : best, bids![0]);
            method = 'highest_quality';
        }

        const awardPermitSnapshot = await getPermitComplianceSnapshot(supabase, {
            nationId,
            sector: contract.sector,
            factionId: winner.faction_id,
            contractId: contract.id,
            checkpoint: 'award',
            cache: permitScopeCache,
        });
        if (awardPermitSnapshot.missingPermitKeys.length > 0) {
            try {
                await supabase.from('construction_events').insert({
                    contract_id: contract.id,
                    faction_id: winner.faction_id,
                    nation_id: nationId,
                    event_key: 'permit_compliance_warning',
                    type: 'REGULATORY',
                    severity: 'HIGH',
                    title: 'Permit Compliance Warning',
                    description: `Awarded bidder is missing required permits for this project sector: ${awardPermitSnapshot.missingPermitKeys.join(', ')}.`,
                    impact: 'Construction start is blocked until required permits are active.',
                    responses: [{
                        key: 'acknowledge',
                        label: 'Acknowledged',
                        tag: 'HIGH',
                        detail: 'Missing permits logged for compliance monitoring.',
                        cost: 0,
                        delay: 1,
                        qualityImpact: 0,
                    }],
                    status: 'ACTIVE',
                    fired_at_tick: currentTick,
                    expires_at_tick: currentTick + 3,
                });
            } catch (_) { /* non-fatal */ }
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

        // Log corporate event for news ticker
        try {
            const { data: winnerFaction } = await supabase.from('factions').select('faction_name').eq('id', winner.faction_id).single();
            const { data: contractNation } = await supabase.from('nations').select('name').eq('id', nationId).single();
            await supabase.from('event_log').insert({
                nation_id: nationId,
                event_name: 'Construction Contract Awarded',
                category: 'corporate',
                description_chosen: `${winnerFaction?.faction_name || 'A corporation'} has just won a contract to build ${contract.name} in the nation of ${contractNation?.name || 'Unknown'}.`,
                fired_at_tick: currentTick,
            });
        } catch (_) { /* non-blocking */ }

        // GDP growth nudge: +0.01 per $100M contracted (fire-and-forget)
        try {
            const gdpNudge = (winner.bid_price / 100_000_000) * 0.01;
            if (gdpNudge > 0.001) {
                const { data: curNation } = await supabase.from('nations')
                    .select('gdp_growth').eq('id', nationId).single();
                if (curNation) {
                    await supabase.from('nations').update({
                        gdp_growth: Math.min(100, Number(curNation.gdp_growth || 50) + gdpNudge)
                    }).eq('id', nationId);
                }
            }
        } catch (_gdpErr) { /* non-blocking */ }
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
        .select('id, name, awarded_to_faction, awarded_at_tick, stalled_ticks, sector')
        .eq('nation_id', nationId)
        .eq('status', 'awarded');

    const permitScopeCache = {};
    for (const contract of (newlyAwarded || [])) {
        const startPermitSnapshot = await getPermitComplianceSnapshot(supabase, {
            nationId,
            sector: contract.sector,
            factionId: contract.awarded_to_faction,
            contractId: contract.id,
            checkpoint: 'start',
            cache: permitScopeCache,
        });
        if (startPermitSnapshot.missingPermitKeys.length > 0) {
            await supabase.from('construction_contracts')
                .update({ stalled_ticks: Number(contract.stalled_ticks || 0) + 1 })
                .eq('id', contract.id);
            console.log(`[Projects] ${contract.name}: START BLOCKED — missing required permits ${startPermitSnapshot.missingPermitKeys.join(', ')}`);
            continue;
        }

        await supabase.from('construction_contracts')
            .update({ status: 'in_progress' })
            .eq('id', contract.id);
        console.log(`[Projects] ${contract.name}: awarded → in_progress`);
    }

    // 2. Process in_progress contracts
    const { data: activeContracts } = await supabase
        .from('construction_contracts')
        .select('id, name, awarded_to_faction, awarded_at_tick, timeline_ticks, budget_ceiling, completed_at_tick, stalled_ticks, current_phase, sector, required_materials, required_equipment, required_workforce, materials_consumed, equipment_condition, workers_assigned, modifiers, template_key, project_subtype, issuer_faction_id')
        .eq('nation_id', nationId)
        .eq('status', 'in_progress');

    if (!activeContracts || activeContracts.length === 0) return [];

    // Load building modifier definitions for reputation/permit enforcement
    let _modifierDefs = {};
    try {
        const { data: modRows } = await supabase.from('building_modifiers').select('modifier_key, name, reputation_bonus, required_permits, cost_multiplier');
        for (const m of (modRows || [])) _modifierDefs[m.modifier_key] = m;
    } catch (_) { /* table may not exist */ }

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

    // 4. Per-project worker staffing check (uses workers_assigned JSONB on each contract)
    //    Old system checked pooled faction workforce — new system requires manual assignment.

    // 6. Load material allocations for all active contracts (one batch query)
    let allAllocations = [];
    if (contractIds.length > 0) {
        const allocQuery = contractIds.length === 1
            ? supabase.from('project_material_allocations').select('contract_id, material_key, quality_tier, quantity, consumed').eq('contract_id', contractIds[0])
            : supabase.from('project_material_allocations').select('contract_id, material_key, quality_tier, quantity, consumed').in('contract_id', contractIds);
        const { data: allocData } = await allocQuery;
        allAllocations = allocData || [];
    }
    // Build allocation map: contractId → { materialKey → { totalAllocated, totalConsumed } }
    const allocMap = {};
    for (const a of allAllocations) {
        if (!allocMap[a.contract_id]) allocMap[a.contract_id] = {};
        if (!allocMap[a.contract_id][a.material_key]) allocMap[a.contract_id][a.material_key] = { allocated: 0, consumed: 0 };
        allocMap[a.contract_id][a.material_key].allocated += a.quantity;
        allocMap[a.contract_id][a.material_key].consumed += a.consumed;
    }

    // 7. Process each contract
    const results = [];

    for (const contract of activeContracts) {
        const bid = bidMap[contract.id];
        if (!bid) continue;

        const awardedTick = contract.awarded_at_tick || currentTick;
        const ticksElapsed = currentTick - awardedTick;
        const totalTicks = contract.timeline_ticks || 8;
        const stalledTicks = contract.stalled_ticks || 0;
        const effectiveProgress = ticksElapsed - stalledTicks;

        // Workforce gate: check per-project workers_assigned vs required_workforce
        const reqWf = contract.required_workforce || {};
        const assignedWf = contract.workers_assigned || {};
        const wfReqGeneral = Number(reqWf.general || 0);
        const wfReqSkilled = Number(reqWf.skilled || 0);
        const wfReqInnovative = Number(reqWf.innovative || 0);
        const wfHasGeneral = Number(assignedWf.general || 0);
        const wfHasSkilled = Number(assignedWf.skilled || 0);
        const wfHasInnovative = Number(assignedWf.innovative || 0);
        const workersStaffed = wfHasGeneral >= wfReqGeneral && wfHasSkilled >= wfReqSkilled && wfHasInnovative >= wfReqInnovative;
        if (!workersStaffed) {
            await supabase.from('construction_contracts')
                .update({ stalled_ticks: stalledTicks + 1 })
                .eq('id', contract.id);
            console.log(`[Projects] ${contract.name}: STALLED — understaffed (need G${wfReqGeneral}/S${wfReqSkilled}/I${wfReqInnovative}, assigned G${wfHasGeneral}/S${wfHasSkilled}/I${wfHasInnovative})`);
            continue;
        }

        // Material gate: check if allocated materials meet requirements for next tick of progress
        const reqMaterials = contract.required_materials || {};
        const contractAllocs = allocMap[contract.id] || {};
        const matKeys = Object.keys(reqMaterials);
        let materialsReady = true;
        if (matKeys.length > 0) {
            // Calculate how many units should be consumed by next tick
            const nextProgressPct = Math.min(1, (effectiveProgress + 1) / totalTicks);
            for (const mat of matKeys) {
                const required = Number(reqMaterials[mat]) || 0;
                const neededByNextTick = Math.min(required, Math.floor(required * nextProgressPct));
                const alloc = contractAllocs[mat];
                const totalAllocated = alloc ? alloc.allocated : 0;
                if (totalAllocated < neededByNextTick) {
                    materialsReady = false;
                    break;
                }
            }
        }
        if (!materialsReady) {
            await supabase.from('construction_contracts')
                .update({ stalled_ticks: stalledTicks + 1 })
                .eq('id', contract.id);
            console.log(`[Projects] ${contract.name}: STALLED — insufficient materials allocated (tick ${currentTick}, stalled ${stalledTicks + 1} total)`);
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

        // Material consumption: consume from allocations proportional to progress.
        // Each tick, calculate how many units SHOULD be consumed by this point,
        // then mark the delta as newly consumed in project_material_allocations.
        const prevConsumed = contract.materials_consumed || {};
        const newConsumed = {};
        for (const [mat, total] of Object.entries(reqMaterials)) {
            const targetConsumed = Math.min(Number(total), Math.floor(Number(total) * progressPct));
            const prevMatConsumed = Number(prevConsumed[mat] || 0);
            const delta = targetConsumed - prevMatConsumed;
            newConsumed[mat] = targetConsumed;

            // Update allocation consumed counts if delta > 0
            if (delta > 0) {
                // Distribute consumption across quality tiers (consume STD first, then LOW, then HIGH)
                const tierOrder = ['STD', 'LOW', 'HIGH'];
                let remaining = delta;
                for (const tier of tierOrder) {
                    if (remaining <= 0) break;
                    const allocRows = allAllocations.filter(a =>
                        a.contract_id === contract.id && a.material_key === mat && a.quality_tier === tier);
                    for (const row of allocRows) {
                        if (remaining <= 0) break;
                        const available = row.quantity - row.consumed;
                        if (available <= 0) continue;
                        const consume = Math.min(remaining, available);
                        await supabase.from('project_material_allocations')
                            .update({ consumed: row.consumed + consume })
                            .eq('contract_id', contract.id)
                            .eq('material_key', mat)
                            .eq('quality_tier', tier);
                        row.consumed += consume; // update in-memory too
                        remaining -= consume;
                    }
                }
            }
        }
        if (JSON.stringify(newConsumed) !== JSON.stringify(prevConsumed)) {
            tickUpdates.materials_consumed = newConsumed;
        }

        // Equipment condition: degrade 0.5-2.0 per tick, starting from 100
        // required_equipment is { key: qty } object (or legacy array)
        const reqEquipment = contract.required_equipment || {};
        const equipKeys = Array.isArray(reqEquipment) ? reqEquipment : Object.keys(reqEquipment);
        const prevEquipCond = contract.equipment_condition || {};
        if (equipKeys.length > 0) {
            const newEquipCond = { ...prevEquipCond };
            for (const equip of equipKeys) {
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

            // Apply permit quality bonuses from active permits held by this corp
            let permitQualityBonus = 0;
            try {
                const { data: corpActivePermits } = await supabase
                    .from('corp_permits')
                    .select('permit_key')
                    .eq('faction_id', bid.faction_id)
                    .eq('status', 'active');
                if (corpActivePermits) {
                    const { data: permitDefs } = await supabase.from('construction_permits')
                        .select('permit_key, quality_bonus')
                        .in('permit_key', corpActivePermits.map(p => p.permit_key));
                    for (const d of (permitDefs || [])) {
                        permitQualityBonus += d.quality_bonus || 0;
                    }
                }
            } catch (_pqErr) { /* non-fatal */ }

            // Apply material quality penalties based on LOW grade usage
            let materialQualityPenalty = 0;
            const bidGradesForQuality = bid.material_grades || {};
            const gradeVals = Object.values(bidGradesForQuality);
            const totalGrades = gradeVals.length;
            const lowGradeCount = gradeVals.filter(g => g === 'LOW').length;
            const lowGradePct = totalGrades > 0 ? lowGradeCount / totalGrades : 0;
            if (lowGradePct >= 1.0) materialQualityPenalty = -25;       // 100% LOW
            else if (lowGradePct >= 0.75) materialQualityPenalty = -20; // 75%+ LOW
            else if (lowGradePct >= 0.5) materialQualityPenalty = -10;  // 50%+ LOW

            // Missing required permits: additional inspection penalties
            let missingPermitPenalty = 0;
            let heldKeysDelivery = new Set();
            try {
                const deliveryPermitSnapshot = await getPermitComplianceSnapshot(supabase, {
                    nationId,
                    sector: contract.sector,
                    factionId: bid.faction_id,
                    contractId: contract.id,
                    checkpoint: 'completion',
                    cache: permitScopeCache,
                });
                heldKeysDelivery = new Set(deliveryPermitSnapshot.heldPermitKeys);

                for (const reqKey of deliveryPermitSnapshot.missingPermitKeys) {
                    if (!heldKeysDelivery.has(reqKey)) {
                        if (reqKey === 'municipal_zoning') missingPermitPenalty -= 100; // auto-FAIL
                        else if (reqKey === 'structural_engineering') missingPermitPenalty -= 10;
                        else if (reqKey === 'fire_safety') missingPermitPenalty -= 5;
                        else missingPermitPenalty -= 2; // generic missing permit
                    }
                }
            } catch (_mppErr) { /* non-fatal */ }

            // Modifier-required permits: check permits demanded by this contract's modifiers
            let modifierPermitPenalty = 0;
            const contractModifiers = contract.modifiers || [];
            for (const mk of contractModifiers) {
                const mdef = _modifierDefs[mk];
                if (!mdef) continue;
                for (const pk of (mdef.required_permits || [])) {
                    if (!heldKeysDelivery.has(pk)) {
                        modifierPermitPenalty -= 5; // missing modifier-required permit
                    }
                }
            }

            const qualityScore = Math.max(0, Math.min(100, baseQuality + qualityVariance + permitQualityBonus + materialQualityPenalty + missingPermitPenalty + modifierPermitPenalty));

            let deliveryResult = 'PASS';
            // Reputation: +3 per $100M spent, rounded up
            let repChange = Math.ceil((payment / 100_000_000) * 3);
            let qualityBonus = 0;
            let penalties = 0;
            if (qualityScore >= 85) { deliveryResult = 'DISTINCTION'; qualityBonus = Math.round(payment * 0.15); }
            else if (qualityScore >= 60) { deliveryResult = 'PASS'; }
            else if (qualityScore >= 40) { deliveryResult = 'CONDITIONAL'; repChange = 0; penalties = Math.round(payment * 0.20); }
            else { deliveryResult = 'FAIL'; repChange = -repChange; penalties = Math.round(payment * 0.40); }

            // Apply building modifier reputation bonuses/penalties at delivery
            let modifierRepBonus = 0;
            for (const mk of contractModifiers) {
                const mdef = _modifierDefs[mk];
                if (mdef) modifierRepBonus += mdef.reputation_bonus || 0;
            }
            repChange += modifierRepBonus;

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

            // Bond forfeiture on FAIL — bond amount goes to the lender (bond issuer), not refunded
            if (deliveryResult === 'FAIL' && contract.bond_id) {
                try {
                    const { data: bond } = await supabase.from('finance_active_loans')
                        .select('id, principal, lender_faction_id')
                        .eq('id', contract.bond_id).eq('status', 'current').maybeSingle();
                    if (bond) {
                        const { data: bondLender } = await supabase.from('factions')
                            .select('corp_cash_reserves').eq('id', bond.lender_faction_id).single();
                        if (bondLender) {
                            await supabase.from('factions').update({
                                corp_cash_reserves: Number(bondLender.corp_cash_reserves || 0) + Number(bond.principal),
                            }).eq('id', bond.lender_faction_id);
                        }
                        await supabase.from('finance_active_loans').update({
                            status: 'defaulted', completed_tick: currentTick,
                        }).eq('id', bond.id);
                        console.log(`[Projects] Performance bond $${Math.round(bond.principal / 1000)}k FORFEITED — project FAILED: ${contract.name}`);
                    }
                } catch (bondErr) {
                    console.warn(`[Projects] Bond forfeiture failed for ${contract.name}:`, bondErr.message);
                }
            }

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

            // Close any active insurance policies for this completed project
            try {
                // Deal Flow policies (finance_active_loans)
                const { data: insReq } = await supabase
                    .from('finance_loan_requests')
                    .select('id')
                    .eq('request_type', 'insurance')
                    .eq('insured_contract_id', contract.id)
                    .eq('status', 'funded')
                    .maybeSingle();
                if (insReq) {
                    await supabase.from('finance_active_loans').update({
                        status: 'repaid',
                        completed_tick: currentTick,
                    }).eq('request_id', insReq.id).eq('status', 'current');
                    console.log(`[Projects] Deal flow insurance closed for completed project: ${contract.name}`);
                }

                // Refund performance bond if one exists
                if (contract.bond_id) {
                    const { data: bond } = await supabase.from('finance_active_loans')
                        .select('id, principal, lender_faction_id, borrower_faction_id')
                        .eq('id', contract.bond_id).eq('status', 'current').maybeSingle();
                    if (bond) {
                        // Refund bond amount to the construction corp
                        const { data: bondBorrower } = await supabase.from('factions')
                            .select('corp_cash_reserves').eq('id', bond.borrower_faction_id).single();
                        if (bondBorrower) {
                            await supabase.from('factions').update({
                                corp_cash_reserves: Number(bondBorrower.corp_cash_reserves || 0) + Number(bond.principal),
                            }).eq('id', bond.borrower_faction_id);
                        }
                        await supabase.from('finance_active_loans').update({
                            status: 'repaid', completed_tick: currentTick,
                        }).eq('id', bond.id);
                        console.log(`[Projects] Performance bond $${Math.round(bond.principal / 1000)}k refunded for completed project: ${contract.name}`);
                    }
                }
            } catch (insCleanupErr) {
                console.warn(`[Projects] Insurance/bond cleanup failed for ${contract.name}:`, insCleanupErr.message);
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

            // Hand over the finished asset to the issuer — corp-commissioned projects
            // (issuer_faction_id set) become a property on the issuer's PROPERTY card.
            // National infrastructure with no corp issuer is skipped.
            if (contract.issuer_faction_id) {
                try {
                    const propMeta = getDeliveredPropertyMeta(contract, payment);
                    if (propMeta) {
                        const { error: propErr } = await supabase.from('corp_properties').insert({
                            faction_id: contract.issuer_faction_id,
                            nation_id: nationId,
                            name: contract.name,
                            type: propMeta.type,
                            style: propMeta.style,
                            capacity: propMeta.capacity,
                            purchase_price: actualPayment,
                            monthly_maintenance: propMeta.maintenance,
                            condition: Math.max(25, Math.min(100, qualityScore)),
                            purchased_at_tick: currentTick,
                            built_via_contract_id: contract.id,
                            is_active: true,
                        });
                        if (propErr) console.warn(`[Projects] Failed to register property for issuer on ${contract.name}:`, propErr.message);
                    }
                } catch (propErr) {
                    console.warn(`[Projects] Property handoff failed for ${contract.name}:`, propErr.message);
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

            console.log(`[Projects] ${contract.name}: ${deliveryResult} (quality=${qualityScore}, mat_penalty=${materialQualityPenalty}, permit_penalty=${missingPermitPenalty}, net=${netProfit > 0 ? '+' : ''}$${(netProfit / 1e6).toFixed(1)}M, rep=${repChange > 0 ? '+' : ''}${repChange})`);

            // ── Post-Delivery: Catastrophic Building Collapse ──
            // 100% LOW materials + quality < 40 = 10% chance the building collapses
            // 75%+ LOW materials + quality < 30 = 5% chance
            if (lowGradePct >= 1.0 && qualityScore < 40 && Math.random() < 0.10) {
                console.log(`[Projects] *** BUILDING COLLAPSE *** ${contract.name} — 100% LOW materials, quality ${qualityScore}`);
                // Refund contract value back to nation (corp must pay)
                const collapseRefund = payment;
                await supabase.from('factions').update({
                    corp_cash_reserves: Math.max(0, Number((await supabase.from('factions').select('corp_cash_reserves').eq('id', bid.faction_id).single()).data?.corp_cash_reserves ?? 0) - collapseRefund),
                    corp_reputation: Math.max(0, Number((await supabase.from('factions').select('corp_reputation').eq('id', bid.faction_id).single()).data?.corp_reputation ?? 65) - 10)
                }).eq('id', bid.faction_id);

                // Nation stat impact
                await supabase.from('nations').update({
                    stability: Math.max(2, Number(nation?.stability ?? 50) - 2),
                    happiness: Math.max(2, Number(nation?.happiness ?? 50) - 3),
                }).eq('id', nationId);

                // Log the collapse as a construction event
                await supabase.from('construction_events').insert({
                    contract_id: contract.id,
                    faction_id: bid.faction_id,
                    nation_id: nationId,
                    event_key: 'building_collapse',
                    type: 'CATASTROPHIC',
                    severity: 'CRITICAL',
                    title: 'Catastrophic Building Collapse',
                    description: `${contract.name} has collapsed due to widespread use of substandard materials. The contractor must refund the full contract value. Criminal investigation pending.`,
                    impact: 'Building destroyed. Full refund required. Reputation devastated. Nation stability and happiness impacted.',
                    responses: [{ key: 'acknowledge', label: 'Acknowledged', tag: 'CRITICAL', detail: 'Building collapsed', cost: collapseRefund, delay: 0, qualityImpact: -100 }],
                    status: 'RESOLVED',
                    fired_at_tick: currentTick,
                    expires_at_tick: currentTick,
                });

                results[results.length - 1].collapsed = true;
                results[results.length - 1].result = 'COLLAPSED';
            } else if (lowGradePct >= 0.75 && qualityScore < 30 && Math.random() < 0.05) {
                console.log(`[Projects] *** BUILDING COLLAPSE *** ${contract.name} — 75%+ LOW materials, quality ${qualityScore}`);
                await supabase.from('factions').update({
                    corp_reputation: Math.max(0, Number((await supabase.from('factions').select('corp_reputation').eq('id', bid.faction_id).single()).data?.corp_reputation ?? 65) - 8)
                }).eq('id', bid.faction_id);

                await supabase.from('construction_events').insert({
                    contract_id: contract.id, faction_id: bid.faction_id, nation_id: nationId,
                    event_key: 'building_collapse', type: 'CATASTROPHIC', severity: 'CRITICAL',
                    title: 'Post-Delivery Structural Failure',
                    description: `${contract.name} has experienced critical structural failure due to extensive use of low-grade materials.`,
                    impact: 'Major structural damage. Reputation devastated.',
                    responses: [{ key: 'acknowledge', label: 'Acknowledged', tag: 'CRITICAL', detail: 'Structural failure', cost: 0, delay: 0, qualityImpact: -50 }],
                    status: 'RESOLVED', fired_at_tick: currentTick, expires_at_tick: currentTick,
                });
                results[results.length - 1].collapsed = true;
            }
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
    const permitScopeCache = {};

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

    // Load permit event modifiers for all corps with active projects
    // Build: { factionId: { event_key: probability_multiplier } }
    const _permitEventMods = {};
    try {
        const factionIds = [...new Set(contracts.map(c => c.awarded_to_faction).filter(Boolean))];
        if (factionIds.length > 0) {
            const { data: activePermits } = await supabase
                .from('corp_permits')
                .select('faction_id, permit_key')
                .in('faction_id', factionIds)
                .eq('status', 'active');
            if (activePermits && activePermits.length > 0) {
                const permitKeys = [...new Set(activePermits.map(p => p.permit_key))];
                const { data: defs } = await supabase.from('construction_permits')
                    .select('permit_key, event_modifiers')
                    .in('permit_key', permitKeys);
                const defModMap = {};
                for (const d of (defs || [])) defModMap[d.permit_key] = d.event_modifiers || {};
                for (const p of activePermits) {
                    if (!_permitEventMods[p.faction_id]) _permitEventMods[p.faction_id] = {};
                    const mods = defModMap[p.permit_key] || {};
                    for (const [eventKey, multiplier] of Object.entries(mods)) {
                        // Use lowest multiplier if multiple permits affect same event
                        const current = _permitEventMods[p.faction_id][eventKey];
                        _permitEventMods[p.faction_id][eventKey] = current !== undefined ? Math.min(current, multiplier) : multiplier;
                    }
                }
            }
        }
    } catch (_pemErr) { /* non-fatal */ }

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

            // Apply permit event modifiers — active permits reduce event probability
            if (_permitEventMods && _permitEventMods[contract.awarded_to_faction]) {
                const mods = _permitEventMods[contract.awarded_to_faction];
                if (mods[template.key] !== undefined) {
                    prob *= mods[template.key]; // e.g. 0.5 = halve probability
                }
            }

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

        // ── Regulatory & Material Quality Events (only if no event fired above) ──
        if (!results.some(r => r.contract === contract.name)) {
            try {
                const permitSnapshot = await getPermitComplianceSnapshot(supabase, {
                    nationId,
                    sector: contract.sector,
                    factionId: contract.awarded_to_faction,
                    contractId: contract.id,
                    checkpoint: 'events',
                    cache: permitScopeCache,
                });
                const heldPermits = new Set(permitSnapshot.heldPermitKeys);
                const missingPermits = permitSnapshot.missingPermitKeys;
                const missingCount = missingPermits.length;

                // Regulatory events based on missing permits
                let regEvent = null;
                if (missingCount >= 3 && Math.random() < 0.25) {
                    regEvent = REGULATORY_EVENTS.stop_work_order;
                } else if (missingPermits.includes('ohs_compliance') || missingPermits.includes('working_hours')) {
                    if (Math.random() < 0.15) regEvent = REGULATORY_EVENTS.worker_whistleblower;
                } else if (missingCount >= 1 && Math.random() < 0.12) {
                    regEvent = REGULATORY_EVENTS.regulatory_inspection;
                }

                // Material quality events (check bid material grades)
                if (!regEvent) {
                    const { data: bidData } = await supabase.from('contract_bids')
                        .select('material_grades').eq('contract_id', contract.id).eq('status', 'won').limit(1).maybeSingle();
                    const grades = bidData?.material_grades || {};
                    const gradeValues = Object.values(grades);
                    const totalMats = gradeValues.length;
                    const lowCount = gradeValues.filter(g => g === 'LOW').length;
                    const lowPct = totalMats > 0 ? lowCount / totalMats : 0;

                    if (lowPct >= 0.6 && !heldPermits.has('structural_engineering') && Math.random() < 0.12) {
                        regEvent = REGULATORY_EVENTS.structural_integrity_failure;
                    } else if (grades.concrete === 'LOW' && !heldPermits.has('environmental_impact') && Math.random() < 0.10) {
                        regEvent = REGULATORY_EVENTS.foundation_subsidence;
                    } else if (lowCount > 0 && Math.random() < 0.08) {
                        regEvent = REGULATORY_EVENTS.material_defect_recall;
                    }
                }

                if (regEvent) {
                    const responses = [{
                        key: 'acknowledge', label: 'Acknowledged', tag: regEvent.severity,
                        detail: regEvent.description,
                        cost: regEvent.cost, delay: regEvent.delay, qualityImpact: regEvent.quality,
                    }];
                    await supabase.from('construction_events').insert({
                        contract_id: contract.id,
                        faction_id: contract.awarded_to_faction,
                        nation_id: nationId,
                        event_key: regEvent.key,
                        type: 'REGULATORY',
                        severity: regEvent.severity,
                        title: regEvent.name,
                        description: regEvent.description,
                        impact: regEvent.description,
                        responses,
                        status: 'ACTIVE',
                        fired_at_tick: currentTick,
                        expires_at_tick: currentTick + 3,
                    });
                    results.push({ contract: contract.name, event: regEvent.name, severity: regEvent.severity });
                    console.log(`[Events] ${contract.name}: ${regEvent.name} (${regEvent.severity}) — regulatory/material`);

                    // Apply reputation penalty immediately
                    if (regEvent.reputation && regEvent.reputation < 0) {
                        await supabase.from('factions').update({
                            corp_reputation: Math.max(0, Number((await supabase.from('factions').select('corp_reputation').eq('id', contract.awarded_to_faction).single()).data?.corp_reputation ?? 65) + regEvent.reputation)
                        }).eq('id', contract.awarded_to_faction);
                    }
                }
            } catch (_regErr) { /* non-fatal */ }
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

        // Check if contract has active insurance
        let insurancePaidClaim = false;
        if (costApplied > 0) {
            // Look up insurance by contract_id → funded request → active loan
            let policy = null;
            const { data: insReq } = await supabase
                .from('finance_loan_requests')
                .select('id')
                .eq('request_type', 'insurance')
                .eq('insured_contract_id', event.contract_id)
                .eq('status', 'funded')
                .maybeSingle();
            if (insReq) {
                const { data: activePol } = await supabase
                    .from('finance_active_loans')
                    .select('id, lender_faction_id, principal, interest_rate, claims_paid, claims_count, deductible_pct')
                    .eq('request_id', insReq.id)
                    .eq('status', 'current')
                    .maybeSingle();
                policy = activePol;
            }

            if (policy) {
                // Apply deductible: construction corp pays the deductible portion
                const deductiblePct = Number(policy.deductible_pct) || 0;
                const deductibleAmt = Math.round(costApplied * (deductiblePct / 100));
                // Insurance covers cost minus deductible
                let adjustedCost = costApplied - deductibleAmt;
                // Cap at coverage amount (principal)
                adjustedCost = Math.min(adjustedCost, Math.max(0, (policy.principal || 0) - (policy.claims_paid || 0)));

                // Claims Office effect: 15% chance to reduce payout by 25%
                const { data: claimsOffices } = await supabase
                    .from('corp_properties')
                    .select('id')
                    .eq('faction_id', policy.lender_faction_id)
                    .eq('type', 'claims_office')
                    .eq('is_active', true)
                    .limit(1);
                if (claimsOffices && claimsOffices.length > 0 && Math.random() < 0.15) {
                    adjustedCost = Math.round(costApplied * 0.75);
                    console.log(`[Events] Claims Office investigation: payout reduced from $${costApplied} to $${adjustedCost}`);
                }

                // Insurance covers the cost — deduct from insurer instead
                const { data: insurer } = await supabase.from('factions')
                    .select('corp_cash_reserves').eq('id', policy.lender_faction_id).single();
                if (insurer) {
                    await supabase.from('factions').update({
                        corp_cash_reserves: Math.max(0, Number(insurer.corp_cash_reserves || 0) - adjustedCost)
                    }).eq('id', policy.lender_faction_id);
                }
                // Track claim on the policy
                await supabase.from('finance_active_loans').update({
                    claims_paid: (policy.claims_paid || 0) + adjustedCost,
                    claims_count: (policy.claims_count || 0) + 1,
                }).eq('id', policy.id);

                // Construction corp still pays the deductible portion
                if (deductibleAmt > 0) {
                    const { data: deductCorp } = await supabase.from('factions')
                        .select('corp_cash_reserves').eq('id', event.faction_id).single();
                    if (deductCorp) {
                        await supabase.from('factions').update({
                            corp_cash_reserves: Math.max(0, Number(deductCorp.corp_cash_reserves || 0) - deductibleAmt)
                        }).eq('id', event.faction_id);
                    }
                }

                insurancePaidClaim = true;
                console.log(`[Events] Insurance claim: ${event.title} — insurer pays $${adjustedCost}, deductible $${deductibleAmt}`);
            }
        }

        // Deduct cost from construction corp (only if no insurance covered it)
        if (costApplied > 0 && !insurancePaidClaim) {
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
    const BASE_RATE = 87_000_000;
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
        const totalEmployees = generalCount + skilledCount + innovativeCount;
        const annualWages = (generalCount * calcWage(GENERAL_MULT))
                          + (skilledCount * calcWage(SKILLED_MULT))
                          + (innovativeCount * calcWage(INNOVATIVE_MULT));
        const monthlyWages = Math.round(annualWages / 12);

        // Executive salaries (C-suite: CEO, CFO, COO, CTO, CMO, CLO, Lobbyist)
        const { data: executives } = await supabase.from('corp_executives')
            .select('salary_per_year')
            .eq('faction_id', corp.id)
            .eq('status', 'active');
        const totalExecAnnual = (executives || []).reduce((sum, ex) => sum + (Number(ex.salary_per_year) || 0), 0);
        const monthlyExecSalaries = Math.round(totalExecAnnual / 12);

        // Scale market revenue by workforce utilization.
        // Properties provide capacity (condition-scaled). Base HQ = 500.
        const { data: corpProps } = await supabase.from('corp_properties')
            .select('capacity, condition, refurbish_until_tick')
            .eq('faction_id', corp.id).eq('is_active', true);
        const BASE_HQ_CAPACITY = 500;
        let propertyCapacity = BASE_HQ_CAPACITY;
        let propertyRevenueBonus = 0;
        if (corpProps) {
            for (const p of corpProps) {
                if (p.refurbish_until_tick && currentTick < p.refurbish_until_tick) continue; // offline
                const cap = Number(p.capacity || 0);
                const cond = Number(p.condition || 0) / 100;
                propertyCapacity += Math.floor(cap * cond);
                // Good-condition buildings generate bonus revenue: $50k/month per 1000 cap at 100% condition
                // Break-even ~60-80%, losing money below 60% (maintenance exceeds contribution)
                if (cond >= 0.6) {
                    propertyRevenueBonus += Math.round(cap * cond * 50); // $50 per seat per month
                }
            }
        }
        const workforceTarget = Math.max(500, propertyCapacity);
        const workforceUtil = Math.min(1, totalEmployees / workforceTarget);
        const corpMonthlyRev = Math.round(monthlyMarketRev * workforceUtil) + propertyRevenueBonus;

        // Fixed overhead: minimum operating costs even with 0 employees
        // Property maintenance, admin, insurance, utilities
        const FIXED_OVERHEAD_MONTHLY = 75_000;

        const monthlyIncome = corpMonthlyRev - monthlyWages - monthlyExecSalaries - FIXED_OVERHEAD_MONTHLY;

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

        // monthly_profit is the dividend base for equity positions (Phase 4).
        // Stored as netChange (post-debt, post-tax cash flow) so equity holders
        // share in what's actually left after the corp's own obligations.
        const updateFields = { corp_cash_reserves: newCash, monthly_profit: netChange };
        if (principalPaid > 0) updateFields.corp_loans = newLoans;

        const { error: updateErr } = await supabase.from('factions')
            .update(updateFields)
            .eq('id', corp.id);
        if (updateErr) console.error(`[advance-corp-tick] Income update failed for ${corp.faction_name}:`, updateErr.message);

        // Credit corporate tax to the nation's debt reduction
        if (taxAmount > 0) {
            const { data: nationRow } = await supabase.from('nations').select('debt').eq('id', nation.id).single();
            if (nationRow) {
                const newDebt = Math.max(0, Number(nationRow.debt || 0) - taxAmount);
                await supabase.from('nations').update({ debt: newDebt }).eq('id', nation.id);
            }
        }
    }
    console.log(`[advance-corp-tick] Corp income: ${corpFactions.length} corps in ${nation.name}, monthly rev=${monthlyMarketRev}, tax rate=${ns('corporate_tax')}%`);
}

// ════════════════════════════════════════════════════════════════════════════════
//  SHIP MARKET — Generate NPC listings + process vessel order deliveries
// ════════════════════════════════════════════════════════════════════════════════

const VESSEL_SPECS = {
    // base_maintenance halved from the original (180/290/350/380/280/580 × 0.5)
    // so organic-route bids at the current ceiling can actually clear fleet
    // overhead. Mirror copies live in corp-operations-shipping.html,
    // corp-operations.html, and corp-nation-select.html — keep them in sync.
    Coastal:   { capacity_dwt: 14000, capacity_unit: 'DWT', base_maintenance:  90000, fuel_capacity: 800,  purchase_price: 3000000 },
    Container: { capacity_dwt: 4800,  capacity_unit: 'TEU', base_maintenance: 145000, fuel_capacity: 2100, purchase_price: 65000000 },
    Bulk:      { capacity_dwt: 28000, capacity_unit: 'DWT', base_maintenance: 175000, fuel_capacity: 1800, purchase_price: 3000000 },
    Tanker:    { capacity_dwt: 42000, capacity_unit: 'DWT', base_maintenance: 190000, fuel_capacity: 2400, purchase_price: 53000000 },
    Reefer:    { capacity_dwt: 12000, capacity_unit: 'DWT', base_maintenance: 140000, fuel_capacity: 1600, purchase_price: 6000000 },
    LNG:       { capacity_dwt: 18000, capacity_unit: 'DWT', base_maintenance: 290000, fuel_capacity: 1400, purchase_price: 78000000 },
};

const VESSEL_CLASSES = ['Coastal', 'Container', 'Bulk', 'Tanker', 'Reefer', 'LNG'];

const NPC_SELLERS = [
    'Port Authority Auctions', 'Maritime Registry', 'Coastal Trade Corp',
    'National Shipping Board', 'Harbor Master Office', 'Naval Surplus Division',
    'Maritime Heritage Trust', 'Commercial Fleet Services',
];

const SALE_REASONS = [
    'Owner retired — well-maintained vessel',
    'Fleet downsizing — excess capacity',
    'Seized asset — previous owner defaulted on port fees',
    'Government decommission — surplus to requirements',
    'Corporate restructure — divesting non-core assets',
    'Replaced by newer vessel — good working condition',
    'Estate sale — reliable workhorse available',
    'Bankruptcy liquidation — priced to sell',
];

async function generateShipMarketListings(supabase, currentTick) {
    // Expire old NPC listings (24 ticks old)
    var { error: expireErr } = await supabase.from('ship_market_listings')
        .update({ status: 'expired' })
        .eq('status', 'available')
        .eq('seller_type', 'LOCAL')
        .lt('listed_at_tick', currentTick - 24);
    if (expireErr) console.warn('[Ship Market] Failed to expire old listings:', expireErr.message);

    // Load all nations
    const { data: nations } = await supabase.from('nations').select('id, name');
    if (!nations || nations.length === 0) return;

    var generated = 0;
    for (var ni = 0; ni < nations.length; ni++) {
        var nation = nations[ni];

        // 1 random vessel per nation
        var cls = VESSEL_CLASSES[Math.floor(Math.random() * VESSEL_CLASSES.length)];
        var specs = VESSEL_SPECS[cls];
        var ageTicks = 24 + Math.floor(Math.random() * 168); // 2-16 years old
        var condition = Math.max(20, 90 - Math.floor(ageTicks / 12) * 3 - Math.floor(Math.random() * 15));
        var fuel = 20 + Math.floor(Math.random() * 60);
        var priceRatio = (condition / 100) * 0.7; // 70% of new price at 100% condition
        var askingPrice = Math.round(specs.purchase_price * priceRatio);

        // Vary capacity slightly (+/- 20%)
        var capMod = 0.8 + Math.random() * 0.4;
        var capacity = Math.round(specs.capacity_dwt * capMod);

        // Pick NPC seller name and reason
        var seller = NPC_SELLERS[Math.floor(Math.random() * NPC_SELLERS.length)];
        var reason = SALE_REASONS[Math.floor(Math.random() * SALE_REASONS.length)];

        // Generate a name
        var prefixes = ['MV', 'SS', 'MT'];
        var names = ['Atlas', 'Horizon', 'Vanguard', 'Orinoco', 'Sierra', 'Estrella', 'Pacific', 'Cordillera', 'Bahía', 'Nordkapp', 'Costa', 'Meridian', 'Austral', 'Ventana', 'Cumbre'];
        var vesselName = prefixes[Math.floor(Math.random() * prefixes.length)] + " '" + names[Math.floor(Math.random() * names.length)] + "'";

        var { error: insertErr } = await supabase.from('ship_market_listings').insert({
            nation_id: nation.id,
            vessel_name: vesselName,
            vessel_class: cls,
            capacity_dwt: capacity,
            capacity_unit: specs.capacity_unit,
            condition: condition,
            fuel: fuel,
            age_ticks: ageTicks,
            fuel_capacity: specs.fuel_capacity,
            base_maintenance: specs.base_maintenance,
            asking_price: askingPrice,
            purchase_price_new: specs.purchase_price,
            seller_type: 'LOCAL',
            seller_name: seller + ' — ' + nation.name,
            sale_reason: reason,
            status: 'available',
            listed_at_tick: currentTick,
            expires_at_tick: currentTick + 24,
        });
        if (insertErr) console.warn('[Ship Market] Failed to generate listing for ' + nation.name + ':', insertErr.message);
        else generated++;
    }

    if (generated > 0) console.log('[Ship Market] Generated ' + generated + ' new listings at tick ' + currentTick);
}

async function processVesselOrderDeliveries(supabase, currentTick) {
    // Find orders due for delivery
    const { data: dueOrders, error: fetchErr } = await supabase.from('vessel_orders')
        .select('*')
        .eq('status', 'building')
        .lte('delivery_tick', currentTick);

    if (fetchErr || !dueOrders || dueOrders.length === 0) return;

    for (var oi = 0; oi < dueOrders.length; oi++) {
        var order = dueOrders[oi];

        // Deduct balance from corp cash
        const { data: corpData } = await supabase.from('factions')
            .select('corp_cash_reserves, nation_id').eq('id', order.faction_id).single();
        if (!corpData) { console.warn('[Vessel Orders] Corp not found for order:', order.id); continue; }

        var corpCash = Number(corpData.corp_cash_reserves || 0);
        var balance = Number(order.balance_due || 0);

        if (corpCash < balance) {
            // Can't afford balance — cancel order, forfeit deposit
            var { error: cancelErr } = await supabase.from('vessel_orders').update({
                status: 'cancelled', cancelled_at_tick: currentTick,
            }).eq('id', order.id);
            if (cancelErr) console.warn('[Vessel Orders] Cancel failed:', cancelErr.message);
            console.log('[Vessel Orders] Order cancelled (insufficient funds) for ' + order.vessel_name);
            continue;
        }

        // Deduct balance
        var { error: cashErr } = await supabase.from('factions').update({
            corp_cash_reserves: corpCash - balance,
        }).eq('id', order.faction_id);
        if (cashErr) { console.warn('[Vessel Orders] Cash deduction failed:', cashErr.message); continue; }

        // Credit balance to shipyard nation budget
        const { data: shipyardNation } = await supabase.from('nations')
            .select('budget_reserves').eq('id', order.shipyard_nation_id).single();
        if (shipyardNation) {
            var currentBudget = Number(shipyardNation.budget_reserves || 0);
            var { error: budgetErr } = await supabase.from('nations').update({
                budget_reserves: currentBudget + balance,
            }).eq('id', order.shipyard_nation_id);
            if (budgetErr) console.warn('[Vessel Orders] Budget credit failed:', budgetErr.message);
        }

        // Create the vessel
        var specs = VESSEL_SPECS[order.vessel_class] || VESSEL_SPECS.Coastal;
        var { error: vesselErr } = await supabase.from('corp_vessels').insert({
            faction_id: order.faction_id,
            nation_id: corpData.nation_id,
            vessel_name: order.vessel_name,
            vessel_class: order.vessel_class,
            condition: 100,
            fuel: 100,
            status: 'in_port',
            capacity_dwt: order.capacity_dwt || specs.capacity_dwt,
            capacity_unit: order.capacity_unit || specs.capacity_unit,
            base_maintenance: order.base_maintenance || specs.base_maintenance,
            fuel_capacity: order.fuel_capacity || specs.fuel_capacity,
            purchase_price: Number(order.total_cost),
            built_at_tick: currentTick,
            current_port_nation_id: corpData.nation_id,
        });
        if (vesselErr) { console.warn('[Vessel Orders] Vessel creation failed:', vesselErr.message); continue; }

        // Mark order as delivered
        var { error: deliverErr } = await supabase.from('vessel_orders').update({
            status: 'delivered', delivered_at_tick: currentTick,
        }).eq('id', order.id);
        if (deliverErr) console.warn('[Vessel Orders] Delivery status update failed:', deliverErr.message);

        console.log('[Vessel Orders] Delivered ' + order.vessel_name + ' (' + order.vessel_class + ') to ' + order.faction_id);
    }
}

// ════════════════════════════════════════════════════════════════════════════════
//  FINANCE SECTOR — Loan Processing
// ════════════════════════════════════════════════════════════════════════════════

// Each tick: expire unfunded loan requests, process repayments, handle defaults.
async function processFinanceLoans(supabase, nationId, currentTick) {
    const results = { expired: 0, payments: 0, defaults: 0 };

    // Check for Financial Sector Deregulation Act
    const { data: deregLaw } = await supabase
        .from('active_laws')
        .select('id, policy:policies!policy_id(policy_key)')
        .eq('nation_id', nationId)
        .limit(100);
    const hasDeregulation = (deregLaw || []).some(l =>
        l.policy?.policy_key?.startsWith('financial_sector_deregulation'));
    const interestBonus = hasDeregulation ? 0.10 : 0; // +10% interest income

    // 1. Expire unfunded loan requests past their deadline
    const { data: expiredReqs } = await supabase
        .from('finance_loan_requests')
        .update({ status: 'expired' })
        .eq('nation_id', nationId)
        .eq('status', 'open')
        .lte('expires_tick', currentTick)
        .select('id');
    results.expired = expiredReqs?.length || 0;

    if (results.expired > 0) {
        const expiredIds = expiredReqs.map(r => r.id);
        await supabase
            .from('finance_loan_offers')
            .update({ status: 'declined' })
            .in('request_id', expiredIds)
            .eq('status', 'pending');
    }

    // 2. Process active loan/bond/insurance payments (1 tick = 1 month)
    const { data: activeLoans } = await supabase
        .from('finance_active_loans')
        .select('*, finance_loan_requests!inner(request_type, issuer_nation_id)')
        .eq('nation_id', nationId)
        .in('status', ['current', 'late', 'delinquent'])
        .or(`last_payment_tick.is.null,last_payment_tick.neq.${currentTick}`);

    if (!activeLoans || activeLoans.length === 0) return results;

    for (const loan of activeLoans) {
        // Idempotency guard: do not process the same loan twice in one tick.
        if (Number(loan.last_payment_tick) === Number(currentTick)) continue;

        const requestType = loan.finance_loan_requests?.request_type || 'loan';

        // Insurance: collect premium from policyholder, credit to insurer
        if (requestType === 'insurance') {
            const premium = Number(loan.monthly_payment) || 0;
            if (premium <= 0) continue;

            // Deduct premium from policyholder (borrower) only when full premium is affordable.
            const { data: holder } = await supabase.from('factions')
                .select('corp_cash_reserves').eq('id', loan.borrower_faction_id).single();
            const holderCash = Number(holder?.corp_cash_reserves || 0);

            if (holderCash >= premium) {
                var { error: holderErr } = await supabase.from('factions').update({
                    corp_cash_reserves: holderCash - premium,
                }).eq('id', loan.borrower_faction_id);
                if (holderErr) console.warn('[Insurance] Premium deduction failed:', holderErr.message);

                // Credit premium to insurer (lender)
                const { data: insurer } = await supabase.from('factions')
                    .select('corp_cash_reserves').eq('id', loan.lender_faction_id).single();
                if (insurer) {
                    var { error: insurerErr } = await supabase.from('factions').update({
                        corp_cash_reserves: Number(insurer.corp_cash_reserves || 0) + premium,
                    }).eq('id', loan.lender_faction_id);
                    if (insurerErr) console.warn('[Insurance] Premium credit failed:', insurerErr.message);
                }

                // Update payment tracking (once per tick).
                var { error: trackErr } = await supabase.from('finance_active_loans').update({
                    payments_made: (loan.payments_made || 0) + 1,
                    total_paid: (Number(loan.total_paid) || 0) + premium,
                    total_interest_paid: (Number(loan.total_interest_paid) || 0) + premium,
                    payments_missed: 0,
                    status: 'current',
                    last_payment_tick: currentTick,
                }).eq('id', loan.id);
                if (trackErr) console.warn('[Insurance] Payment tracking update failed:', trackErr.message);

                results.payments++;
            } else {
                const newMissed = (loan.payments_missed || 0) + 1;
                const newStatus = newMissed >= 3 ? 'delinquent' : 'late';
                const { error: missErr } = await supabase.from('finance_active_loans').update({
                    payments_missed: newMissed,
                    status: newStatus,
                }).eq('id', loan.id);
                if (missErr) console.warn('[Insurance] Missed premium update failed:', missErr.message);
            }
            continue;
        }

        // Equity: pay dividend = equity_pct × target.monthly_profit (if profit > 0).
        // Losses don't flow to the investor — equity can't go negative, they just
        // earn nothing that tick. monthly_profit was written above by
        // processCorpMonthlyIncome for this same tick.
        if (requestType === 'equity') {
            const { data: target } = await supabase.from('factions')
                .select('corp_cash_reserves, monthly_profit')
                .eq('id', loan.borrower_faction_id).single();
            if (!target) {
                console.warn(`[Equity] Target ${loan.borrower_faction_id} not found; skipping`);
                continue;
            }

            const profit = Number(target.monthly_profit || 0);
            const stakePct = Number(loan.equity_pct || 0);
            const dividendDue = profit > 0 ? Math.floor(profit * stakePct / 100) : 0;
            const targetCash = Number(target.corp_cash_reserves || 0);
            // Clamp to cash on hand — a corp with a paper profit but empty till
            // pays what it can. No "missed payment" concept for equity.
            const actualPayout = Math.max(0, Math.min(dividendDue, targetCash));

            if (actualPayout > 0) {
                var { error: debitErr } = await supabase.from('factions').update({
                    corp_cash_reserves: targetCash - actualPayout,
                }).eq('id', loan.borrower_faction_id);
                if (debitErr) console.warn('[Equity] Target debit failed:', debitErr.message);

                const { data: lender } = await supabase.from('factions')
                    .select('corp_cash_reserves').eq('id', loan.lender_faction_id).single();
                if (lender) {
                    var { error: creditErr } = await supabase.from('factions').update({
                        corp_cash_reserves: Number(lender.corp_cash_reserves || 0) + actualPayout,
                    }).eq('id', loan.lender_faction_id);
                    if (creditErr) console.warn('[Equity] Investor credit failed:', creditErr.message);
                }
            }

            // Always tick the counters, even on a $0 dividend, so the position
            // reflects that a tick was processed.
            var { error: equityTrackErr } = await supabase.from('finance_active_loans').update({
                total_paid: (Number(loan.total_paid) || 0) + actualPayout,
                payments_made: (loan.payments_made || 0) + 1,
                last_payment_tick: currentTick,
            }).eq('id', loan.id);
            if (equityTrackErr) console.warn('[Equity] Position tracking update failed:', equityTrackErr.message);

            if (actualPayout > 0) results.payments++;
            continue;
        }

        // Bonds: coupon payments come from nation treasury (increases debt)
        if (requestType === 'bond') {
            let payment = loan.monthly_payment;
            const newPaymentsMade = loan.payments_made + 1;
            const isMatured = newPaymentsMade >= loan.term_months && loan.term_months > 0;

            // Trading Floor bonus: +0.5% annualized bonus yield on bond principal
            const { data: tradingFloors } = await supabase
                .from('corp_properties')
                .select('id')
                .eq('faction_id', loan.lender_faction_id)
                .eq('type', 'trading_floor')
                .eq('is_active', true)
                .limit(1);
            if (tradingFloors && tradingFloors.length > 0) {
                const bonusYield = Math.round(loan.principal * (0.005 / 12));
                payment += bonusYield;
            }

            // Nation pays coupon to bondholder (including trading floor bonus)
            // Coupons are interest expense — paid from treasury, do NOT change debt principal
            const { data: lender } = await supabase.from('factions')
                .select('corp_cash_reserves').eq('id', loan.lender_faction_id).single();
            if (lender) {
                await supabase.from('factions').update({
                    corp_cash_reserves: Number(lender.corp_cash_reserves || 0) + payment
                }).eq('id', loan.lender_faction_id);
            }

            // At maturity: return principal to bondholder and REDUCE nation debt
            // (nation repays the borrowed amount, so debt decreases)
            if (isMatured) {
                if (lender) {
                    const { data: lenderFresh } = await supabase.from('factions')
                        .select('corp_cash_reserves').eq('id', loan.lender_faction_id).single();
                    await supabase.from('factions').update({
                        corp_cash_reserves: Number(lenderFresh?.corp_cash_reserves || 0) + loan.principal
                    }).eq('id', loan.lender_faction_id);
                }
                const { data: nationFresh } = await supabase.from('nations')
                    .select('debt').eq('id', nationId).single();
                if (nationFresh) {
                    await supabase.from('nations').update({
                        debt: Math.max(0, Number(nationFresh.debt || 0) - loan.principal)
                    }).eq('id', nationId);
                }
                console.log(`[Bonds] Bond matured: $${Math.round(loan.principal / 1000)}k returned to ${loan.lender_faction_id}, nation debt reduced`);
            }

            await supabase.from('finance_active_loans').update({
                total_paid: loan.total_paid + payment,
                total_interest_paid: (loan.total_interest_paid || 0) + payment,
                payments_made: newPaymentsMade,
                last_payment_tick: currentTick,
                status: isMatured ? 'repaid' : 'current',
                completed_tick: isMatured ? currentTick : null,
            }).eq('id', loan.id);

            results.payments++;
            continue;
        }

        // Standard loans: borrower pays from corp cash
        const { data: borrower } = await supabase
            .from('factions')
            .select('corp_cash_reserves')
            .eq('id', loan.borrower_faction_id)
            .single();

        const borrowerCash = Number(borrower?.corp_cash_reserves) || 0;
        const payment = loan.monthly_payment;
        const monthlyRate = (loan.interest_rate / 100) / 12;
        const originalPrincipal = Math.max(0, Number(loan.original_principal ?? loan.principal ?? 0));
        const remainingPrincipal = Math.max(0, Number(loan.remaining_principal) || 0);
        const interestPortion = Math.round(originalPrincipal * monthlyRate);
        const principalPortion = Math.max(0, payment - interestPortion);
        const newRemainingPrincipal = Math.max(0, remainingPrincipal - principalPortion);

        if (borrowerCash >= payment) {
            const newTotalPaid = loan.total_paid + payment;
            const newInterestPaid = loan.total_interest_paid + interestPortion;
            const newPaymentsMade = loan.payments_made + 1;
            const isTermSatisfied = loan.term_months <= 0 || newPaymentsMade >= loan.term_months;
            const isRepaid = newRemainingPrincipal <= 0 && isTermSatisfied;

            await supabase.from('factions').update({
                corp_cash_reserves: borrowerCash - payment
            }).eq('id', loan.borrower_faction_id);

            // Lender receives payment + deregulation interest bonus
            const deregBonus = Math.round(interestPortion * interestBonus);
            const lenderReceives = payment + deregBonus;
            const { data: lender } = await supabase
                .from('factions')
                .select('corp_cash_reserves')
                .eq('id', loan.lender_faction_id)
                .single();
            await supabase.from('factions').update({
                corp_cash_reserves: (Number(lender?.corp_cash_reserves) || 0) + lenderReceives
            }).eq('id', loan.lender_faction_id);

            const loanUpdate = {
                total_paid: newTotalPaid,
                total_interest_paid: newInterestPaid,
                remaining_principal: newRemainingPrincipal,
                payments_made: newPaymentsMade,
                payments_missed: 0,
                last_payment_tick: currentTick,
                status: isRepaid ? 'repaid' : 'current',
                completed_tick: isRepaid ? currentTick : null,
            };
            if (loan.original_principal == null && originalPrincipal > 0) {
                loanUpdate.original_principal = originalPrincipal;
            }

            await supabase.from('finance_active_loans').update(loanUpdate).eq('id', loan.id);

            results.payments++;
        } else {
            const newMissed = loan.payments_missed + 1;
            let newStatus = loan.status;

            if (newMissed >= 4) {
                newStatus = 'defaulted';
                results.defaults++;

                let recovery = 0;
                if (loan.collateral_type === 'equipment') recovery = 0.6;
                else if (loan.collateral_type === 'property') recovery = 0.75;

                if (recovery > 0) {
                    const recoveredAmount = Math.round(remainingPrincipal * recovery);
                    const { data: lender } = await supabase
                        .from('factions')
                        .select('corp_cash_reserves')
                        .eq('id', loan.lender_faction_id)
                        .single();
                    await supabase.from('factions').update({
                        corp_cash_reserves: (Number(lender?.corp_cash_reserves) || 0) + recoveredAmount
                    }).eq('id', loan.lender_faction_id);
                }
            } else if (newMissed >= 3) {
                newStatus = 'delinquent';
            } else if (newMissed >= 1) {
                newStatus = 'late';
            }

            await supabase.from('finance_active_loans').update({
                payments_missed: newMissed,
                status: newStatus,
                completed_tick: newStatus === 'defaulted' ? currentTick : null,
            }).eq('id', loan.id);
        }
    }

    return results;
}

// ════════════════════════════════════════════════════════════════════════════════
//  SHIPPING ROUTE GENERATION
// ════════════════════════════════════════════════════════════════════════════════

const SHIPPING_SECTOR_MAP = {
    fuel_energy:        { subsector: 'bulk_cargo',           category: 'FUEL',     goods: 'Fuel & Energy Products',   goodsSub: 'Petroleum, LNG, coal, refined fuels',        vessel: 'Tanker',          vesselNote: 'Double-hull required.', unit: 'tons' },
    minerals:           { subsector: 'bulk_cargo',           category: 'MINERALS', goods: 'Minerals & Raw Materials', goodsSub: 'Iron ore, copper, bauxite, rare earths',      vessel: 'Bulk Carrier',    vesselNote: 'Heavy-load bulk.',      unit: 'tons' },
    grains_staples:     { subsector: 'bulk_cargo',           category: 'FOOD',     goods: 'Grains & Staples',         goodsSub: 'Wheat, rice, corn, soybeans',                 vessel: 'Bulk Carrier',    vesselNote: 'Dry bulk holds.',       unit: 'tons' },
    livestock_dairy:    { subsector: 'bulk_cargo',           category: 'FOOD',     goods: 'Livestock & Dairy',        goodsSub: 'Feed crops, processed dairy, frozen meat',    vessel: 'Bulk Carrier',    vesselNote: 'Temperature-controlled.', unit: 'tons' },
    cash_crops:         { subsector: 'bulk_cargo',           category: 'FOOD',     goods: 'Cash Crops',               goodsSub: 'Coffee, cocoa, tobacco, cotton, rubber',      vessel: 'Bulk Carrier',    vesselNote: 'Standard dry bulk.',    unit: 'tons' },
    manufactured_goods: { subsector: 'container_freight',    category: 'MFG',      goods: 'Manufactured Goods',       goodsSub: 'Consumer goods, vehicles, industrial parts',  vessel: 'Container Ship',  vesselNote: 'Standard container.',   unit: 'TEU' },
    technology:         { subsector: 'container_freight',    category: 'TECH',     goods: 'Technology & Electronics',  goodsSub: 'Semiconductors, electronics, equipment',      vessel: 'Container Ship',  vesselNote: 'Climate-controlled.',   unit: 'TEU' },
    fruits_vegetables:  { subsector: 'container_freight',    category: 'FOOD',     goods: 'Perishable Produce',       goodsSub: 'Fresh fruit, vegetables, seafood',            vessel: 'Reefer Ship',     vesselNote: 'Refrigerated holds.',   unit: 'tons' },
    arms:               { subsector: 'specialized_transport', category: 'ARMS',    goods: 'Arms & Military Equipment', goodsSub: 'Vehicles, munitions, defense systems',       vessel: 'Military Transport', vesselNote: 'Security clearance required.', unit: 'tons' },
};

const SHIPPING_ROUTE_THRESHOLD = 50000000;
const SHIPPING_REVENUE_RATES = { bulk_cargo: 0.010, container_freight: 0.012, specialized_transport: 0.016 };
const SHIPPING_MONTHS_PER_YEAR = 12;
const SHIPPING_MIN_PER_TRIP = 250000;
const SHIPPING_MIN_CEILING = 750000;
const SHIPPING_HARD_CEILING = 5000000;
const GOV_CONTRACT_VALUE_MIN = 1000000;
const GOV_CONTRACT_VALUE_MAX = 18000000;
const GOV_CONTRACT_DURATION_FLOOR = 2;
const GOV_CONTRACT_PREMIUM_MULT = 1.35;
function _computeServiceRateCeiling(tradeVolume, subsector) {
    const rate = SHIPPING_REVENUE_RATES[subsector] || SHIPPING_REVENUE_RATES.bulk_cargo;
    const uncapped = (Number(tradeVolume) || 0) * rate / SHIPPING_MONTHS_PER_YEAR;
    return Math.round(Math.min(SHIPPING_HARD_CEILING, Math.max(SHIPPING_MIN_CEILING, uncapped)));
}
function _clampServiceRate(v, ceiling) {
    const n = Number(v) || 0;
    let top = Number(ceiling) || SHIPPING_MIN_CEILING;
    if (top < SHIPPING_MIN_CEILING) top = SHIPPING_MIN_CEILING;
    if (top > SHIPPING_HARD_CEILING) top = SHIPPING_HARD_CEILING;
    if (n <= 0) return SHIPPING_MIN_PER_TRIP;
    return Math.round(Math.min(top, Math.max(SHIPPING_MIN_PER_TRIP, n)));
}

function _shipTransitTicks(prox) { return (Number(prox) || 0) >= 71 ? 1 : 0; }
function _shipDemand(vol) { return vol >= 500000000 ? 'CRITICAL' : vol >= 200000000 ? 'HIGH' : vol >= 100000000 ? 'MODERATE' : 'LOW'; }
function _shipScope(prox, isGov) { return isGov ? 'GOVERNMENT' : (prox <= 15 ? 'COASTAL' : 'INTERNATIONAL'); }
function _clampGovContractValue(v) {
    const n = Number(v) || 0;
    return Math.round(Math.min(GOV_CONTRACT_VALUE_MAX, Math.max(GOV_CONTRACT_VALUE_MIN, n)));
}
function _computeGovContractTerms(tradeVolume, subsector, transitTicks, estimatedRevenue) {
    const safeTransitTicks = Math.max(1, Number(transitTicks) || 1);
    const contractDuration = Math.max(GOV_CONTRACT_DURATION_FLOOR, safeTransitTicks);
    const perTransitEstimate = _clampServiceRate(
        Number(estimatedRevenue) || 0,
        _computeServiceRateCeiling(tradeVolume, subsector),
    );
    const contractValue = _clampGovContractValue(perTransitEstimate * contractDuration * GOV_CONTRACT_PREMIUM_MULT);
    return { contractDuration, contractValue };
}

async function generateShippingRoutes(supabase, currentTick) {
    const { data: tradePartners } = await supabase.from('trade_partners')
        .select('exporter_nation_id, importer_nation_id, sector, trade_volume')
        .eq('tick', currentTick).gte('trade_volume', SHIPPING_ROUTE_THRESHOLD);
    if (!tradePartners || tradePartners.length === 0) return { generated: 0, expired: 0, total: 0 };

    const { data: ports } = await supabase.from('nation_ports').select('nation_id, port_name');
    const portMap = {};
    for (const p of (ports || [])) portMap[p.nation_id] = p.port_name;

    const { data: relations } = await supabase.from('diplomatic_relations').select('nation_a_id, nation_b_id, proximity');
    const proxMap = {};
    for (const r of (relations || [])) { proxMap[r.nation_a_id + '|' + r.nation_b_id] = r.proximity; proxMap[r.nation_b_id + '|' + r.nation_a_id] = r.proximity; }

    const { data: agreements } = await supabase.from('trade_agreements').select('id, nation_a_id, nation_b_id, agreement_name').eq('status', 'active');
    const agMap = {};
    for (const a of (agreements || [])) { agMap[a.nation_a_id + '|' + a.nation_b_id] = a; agMap[a.nation_b_id + '|' + a.nation_a_id] = a; }

    const { data: nations } = await supabase.from('nations').select('id, tariffs');
    const tariffMap = {};
    for (const n of (nations || [])) tariffMap[n.id] = Number(n.tariffs) || 0;

    const routeRows = [];
    for (const tp of tradePartners) {
        const sm = SHIPPING_SECTOR_MAP[tp.sector];
        if (!sm) continue;
        const oPort = portMap[tp.exporter_nation_id], dPort = portMap[tp.importer_nation_id];
        if (!oPort || !dPort) continue;
        const prox = proxMap[tp.exporter_nation_id + '|' + tp.importer_nation_id] ?? 50;
        const ag = agMap[tp.exporter_nation_id + '|' + tp.importer_nation_id] || null;
        const tradeVolume = Math.round(tp.trade_volume);
        const transitTicks = _shipTransitTicks(prox);
        const estimatedRevenue = _clampServiceRate(
            tp.trade_volume * (SHIPPING_REVENUE_RATES[sm.subsector] || SHIPPING_REVENUE_RATES.bulk_cargo) / SHIPPING_MONTHS_PER_YEAR,
            _computeServiceRateCeiling(tp.trade_volume, sm.subsector),
        );
        const isGovRoute = tp.sector === 'arms';
        const govTerms = isGovRoute
            ? _computeGovContractTerms(tradeVolume, sm.subsector, transitTicks, estimatedRevenue)
            : null;
        routeRows.push({
            origin_nation_id: tp.exporter_nation_id, destination_nation_id: tp.importer_nation_id,
            origin_port: oPort, destination_port: dPort,
            trade_sector: tp.sector, cargo_category: sm.category, shipping_subsector: sm.subsector,
            scope: _shipScope(prox, isGovRoute),
            goods_name: sm.goods, goods_description: sm.goodsSub, vessel_class: sm.vessel, vessel_note: sm.vesselNote,
            trade_volume: tradeVolume, estimated_revenue: estimatedRevenue,
            volume_physical: Math.round(tp.trade_volume / 100), volume_unit: sm.unit,
            transit_ticks: transitTicks, proximity: prox, tariff_rate: tariffMap[tp.importer_nation_id] || 0,
            demand_level: _shipDemand(tp.trade_volume),
            trade_agreement_id: ag?.id || null, trade_agreement_name: ag?.agreement_name || null,
            gov_issuer: isGovRoute ? 'Ministry of Defense' : null,
            gov_contract_duration: govTerms?.contractDuration ?? null,
            gov_contract_value: govTerms?.contractValue ?? null,
            status: 'active', generated_at_tick: currentTick, last_refreshed_tick: currentTick,
        });
    }

    if (routeRows.length > 0) {
        for (let i = 0; i < routeRows.length; i += 50) {
            const { error } = await supabase.from('shipping_routes').upsert(routeRows.slice(i, i + 50), { onConflict: 'origin_nation_id,destination_nation_id,trade_sector,status' });
            if (error) console.error('[Shipping] Route upsert error:', error.message);
        }
    }

    const { data: expired } = await supabase.from('shipping_routes').update({ status: 'expired' })
        .eq('status', 'active').lt('last_refreshed_tick', currentTick).not('trade_agreement_id', 'is', null).select('id');
    // Note: organic routes (trade_agreement_id IS null) are expired separately by generateOrganicRoutes

    return { generated: routeRows.length, expired: expired?.length || 0, total: routeRows.length };
}

const ORGANIC_REVENUE_MULT = 0.35; // pre-bid: organic routes are generated at 35% of normal lane economics
// Proximity cap removed (third pass). Player feedback: long-haul lanes
// are fine, the problem was LOW-volume clutter, not geography. Kept as
// a null check only so pairs with no diplomatic_relations row still
// short-circuit — the downstream transit-time calc needs proximity to
// be a number.
const ORGANIC_MIN_VOLUME = 5_000_000_000;
// Minimum realized volume for a route to even be inserted. Raised from
// $50M → $5B to target roughly a 90% cut from the ~370-route baseline,
// leaving only the top-tier cross-border flows. Filters the long tail
// of small-economy / low-gdp pairs regardless of how close they sit.
const ORGANIC_MAX_INSERTS_PER_TICK = 140;
// Second safeguard: global insert cap per tick. Candidates are sorted by
// realized trade_volume descending before insert so highest-impact lanes win.
const ORGANIC_LIFETIME = 8;
const ORGANIC_SECTORS = ['fuel_energy','minerals','grains_staples','livestock_dairy','cash_crops','manufactured_goods','technology','fruits_vegetables'];

async function generateOrganicRoutes(supabase, currentTick) {
    const { data: nations } = await supabase.from('nations').select('id, name, population, gdp_growth, manufacturing_output, tariffs');
    if (!nations || nations.length < 2) return { generated: 0, expired: 0 };
    const nationMap = {}; for (const n of nations) nationMap[n.id] = n;

    const { data: ports } = await supabase.from('nation_ports').select('nation_id, port_name');
    const portMap = {}; for (const p of (ports || [])) portMap[p.nation_id] = p.port_name;

    const { data: rels } = await supabase.from('diplomatic_relations').select('nation_a_id, nation_b_id, proximity');
    const proxMap = {}; for (const r of (rels || [])) { proxMap[r.nation_a_id + '|' + r.nation_b_id] = r.proximity; proxMap[r.nation_b_id + '|' + r.nation_a_id] = r.proximity; }

    const { data: existing } = await supabase.from('shipping_routes').select('origin_nation_id, destination_nation_id, trade_sector')
        .eq('status', 'active').is('trade_agreement_id', null).gte('last_refreshed_tick', currentTick - ORGANIC_LIFETIME);
    const existSet = new Set(); for (const e of (existing || [])) existSet.add(e.origin_nation_id + '|' + e.destination_nation_id + '|' + e.trade_sector);

    function sRand(seed) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }

    const rows = [];
    for (let i = 0; i < nations.length; i++) {
        for (let j = i + 1; j < nations.length; j++) {
            const nA = nations[i], nB = nations[j];
            if (!portMap[nA.id] || !portMap[nB.id]) continue;
            const prox = proxMap[nA.id + '|' + nB.id];
            // Null check only — proximity cap was removed. A pair without
            // a diplomatic_relations row can't compute transit_ticks or a
            // proximity-weighted volume, so we still skip those.
            if (prox === undefined || prox === null) continue;

            const popF = Math.sqrt((nA.population || 1e6) * (nB.population || 1e6)) / 1e7;
            const gdpF = ((Number(nA.gdp_growth) || 50) + (Number(nB.gdp_growth) || 50)) / 100;
            const close = 1 - (prox / 100);
            // One route per pair, always. Previously close-neighbor pairs
            // (close > 0.7 → prox < 30) got a bonus second route; that rule
            // layered duplicate sectors on the same pair and roughly doubled
            // the list for every short-haul lane.
            const routeCount = 1;

            const mfg = ((Number(nA.manufacturing_output) || 50) + (Number(nB.manufacturing_output) || 50)) / 100;
            const weights = ORGANIC_SECTORS.map(s => {
                let w = 1;
                if (s === 'manufactured_goods' || s === 'technology') w = mfg;
                if (s === 'fuel_energy' || s === 'minerals') w = 1.2 - mfg * 0.3;
                if (s === 'grains_staples' || s === 'fruits_vegetables') w = 0.8 + popF * 0.2;
                return w;
            });
            const totalW = weights.reduce((a, b) => a + b, 0);

            for (let rc = 0; rc < routeCount; rc++) {
                const seed = currentTick * 1000 + i * 100 + j * 10 + rc;
                let pick = sRand(seed) * totalW, cum = 0, chosen = ORGANIC_SECTORS[0];
                for (let wi = 0; wi < weights.length; wi++) { cum += weights[wi]; if (pick <= cum) { chosen = ORGANIC_SECTORS[wi]; break; } }

                const originId = (Number(nA.gdp_growth) || 50) >= (Number(nB.gdp_growth) || 50) ? nA.id : nB.id;
                const destId = originId === nA.id ? nB.id : nA.id;
                const key = originId + '|' + destId + '|' + chosen;
                if (existSet.has(key)) continue;
                existSet.add(key);

                const sm = SHIPPING_SECTOR_MAP[chosen];
                if (!sm) continue;
                const vol = Math.round(Math.max(5e6, popF * gdpF * close * 3e7 * (0.7 + sRand(seed + 999) * 0.6)));
                // Volume gate: drop routes that would land below ORGANIC_MIN_VOLUME.
                // Small-economy and low-gdp pairs still calculate a floor of $5M;
                // this additional check filters them out so they don't clutter
                // the Available Routes list. Agreement-backed routes are
                // unaffected — this path only generates organic spot lanes.
                if (vol < ORGANIC_MIN_VOLUME) continue;
                // pre-bid: card/tick baseline for organic routes is discounted before clamp/ceiling.
                // post-bid organic multiplier is 1.0 (client approval path), so this base carries through.
                const rev = _clampServiceRate(vol * (SHIPPING_REVENUE_RATES[sm.subsector] || SHIPPING_REVENUE_RATES.bulk_cargo) * ORGANIC_REVENUE_MULT / SHIPPING_MONTHS_PER_YEAR, _computeServiceRateCeiling(vol * ORGANIC_REVENUE_MULT, sm.subsector));

                rows.push({
                    origin_nation_id: originId, destination_nation_id: destId,
                    origin_port: portMap[originId], destination_port: portMap[destId],
                    trade_sector: chosen, cargo_category: sm.category, shipping_subsector: sm.subsector,
                    scope: _shipScope(prox, false), goods_name: sm.goods, goods_description: 'Open market — ' + sm.goodsSub,
                    vessel_class: sm.vessel, vessel_note: sm.vesselNote,
                    trade_volume: vol, estimated_revenue: rev, volume_physical: Math.round(vol / 100), volume_unit: sm.unit,
                    transit_ticks: _shipTransitTicks(prox), proximity: prox, tariff_rate: Number(nationMap[destId]?.tariffs) || 0,
                    demand_level: vol >= 2e7 ? 'MODERATE' : 'LOW',
                    trade_agreement_id: null, trade_agreement_name: null,
                    status: 'active', generated_at_tick: currentTick, last_refreshed_tick: currentTick,
                });
            }
        }
    }

    const prioritizedRows = rows
        .sort((a, b) => Number(b.trade_volume || 0) - Number(a.trade_volume || 0))
        .slice(0, ORGANIC_MAX_INSERTS_PER_TICK);
    const cappedOut = Math.max(0, rows.length - prioritizedRows.length);

    if (prioritizedRows.length > 0) {
        for (let i = 0; i < prioritizedRows.length; i += 50) {
            const { error } = await supabase.from('shipping_routes').upsert(prioritizedRows.slice(i, i + 50), { onConflict: 'origin_nation_id,destination_nation_id,trade_sector,status' });
            if (error) console.error('[Shipping] Organic route upsert error:', error.message);
        }
    }

    const { data: expOrganic } = await supabase.from('shipping_routes').update({ status: 'expired' })
        .eq('status', 'active').is('trade_agreement_id', null).lt('last_refreshed_tick', currentTick - ORGANIC_LIFETIME).select('id');

    return { generated: prioritizedRows.length, expired: expOrganic?.length || 0, capped_out: cappedOut };
}

async function captureShippingRouteTelemetry(supabase, currentTick) {
    const { data: routes, error } = await supabase
        .from('shipping_routes')
        .select('scope, trade_agreement_id')
        .eq('status', 'active')
        .eq('generated_at_tick', currentTick);
    if (error) {
        console.warn('[advance-corp-tick] Shipping telemetry query failed:', error.message);
        return null;
    }

    const telemetry = { agreement: 0, organic: 0, government: 0 };
    for (const route of (routes || [])) {
        if (route.scope === 'GOVERNMENT') telemetry.government++;
        else if (route.trade_agreement_id) telemetry.agreement++;
        else telemetry.organic++;
    }
    return telemetry;
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
                .select('id, faction_name, corp_sector, corp_subsector, corp_cash_reserves, corp_loans, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce, corp_reputation')
                .eq('nation_id', nation.id)
                .eq('faction_type', 'corporation')
                .is('abandoned_at', null);

            if (corpErr) {
                console.error(`[advance-corp-tick] Failed to load corps for ${nation.name}:`, corpErr.message);
                summary.errors.push({ nation: nation.name, error: corpErr.message });
                continue;
            }

            const corps = corpFactions || [];

            // ── Construction Sector (runs for ALL nations) ───────────────
            // Contract generation, bid resolution, and project advancement
            // are not gated behind local corp presence — corps from any
            // nation can bid on contracts.
            try {
                // Bid resolution FIRST: expired bidding windows → award winners
                const bidResults = await resolveExpiredBids(supabase, nation.id, currentTick);
                if (bidResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'bids', data: bidResults });
                }

                // Project execution: advance awarded → in_progress, deduct costs, complete
                const projectResults = await processActiveProjects(supabase, nation.id, currentTick);
                if (projectResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'completions', data: projectResults });
                }

                // Contract generation: every 3 ticks, GDP-scaled
                const genResults = await generateConstructionContracts(supabase, nation, currentTick);
                if (genResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'generated', data: genResults });
                }

                // Policy-driven contract generation: Infrastructure Renewal Act
                try {
                    await generateInfraRenewalContracts(supabase, nation, currentTick);
                } catch (irErr) {
                    console.warn(`[advance-corp-tick] Infra Renewal contract gen failed for ${nation.name}:`, irErr.message);
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

                // ── Permit Lifecycle (pending→active, expiry) ─────────────
            try {
                // Advance pending permits to active
                const { data: pendingPermits } = await supabase
                    .from('corp_permits')
                    .select('id, faction_id, permit_key, applied_at_tick')
                    .eq('nation_id', nation.id)
                    .eq('status', 'pending');

                if (pendingPermits && pendingPermits.length > 0) {
                    const { data: permitDefs } = await supabase.from('construction_permits').select('permit_key, processing_ticks, duration_ticks');
                    const defMap = {};
                    for (const d of (permitDefs || [])) defMap[d.permit_key] = d;

                    for (const p of pendingPermits) {
                        const def = defMap[p.permit_key];
                        if (!def) continue;
                        const elapsed = currentTick - p.applied_at_tick;
                        if (elapsed >= def.processing_ticks) {
                            const expiresAt = def.duration_ticks ? currentTick + def.duration_ticks : null;
                            await supabase.from('corp_permits').update({
                                status: 'active',
                                granted_at_tick: currentTick,
                                expires_at_tick: expiresAt,
                                updated_at: new Date().toISOString()
                            }).eq('id', p.id);
                            console.log(`[Permits] ${p.permit_key} granted to faction ${p.faction_id} (expires tick ${expiresAt || 'never'})`);
                        }
                    }
                }

                // Expire active permits past their duration
                const { data: expiredCount } = await supabase
                    .from('corp_permits')
                    .update({ status: 'expired', updated_at: new Date().toISOString() })
                    .eq('nation_id', nation.id)
                    .eq('status', 'active')
                    .not('expires_at_tick', 'is', null)
                    .lte('expires_at_tick', currentTick)
                    .select('id');
                if (expiredCount && expiredCount.length > 0) {
                    console.log(`[Permits] Expired ${expiredCount.length} permit(s) in ${nation.name}`);
                }

                // Charge maintenance for active permits with maintenance_per_tick > 0
                const { data: activePermitsForMaint } = await supabase
                    .from('corp_permits')
                    .select('id, faction_id, permit_key')
                    .eq('nation_id', nation.id)
                    .eq('status', 'active');

                if (activePermitsForMaint && activePermitsForMaint.length > 0) {
                    const { data: maintDefs } = await supabase.from('construction_permits')
                        .select('permit_key, maintenance_per_tick')
                        .gt('maintenance_per_tick', 0);
                    const maintMap = {};
                    for (const d of (maintDefs || [])) maintMap[d.permit_key] = Number(d.maintenance_per_tick);

                    // Group maintenance costs by faction
                    const factionMaint = {};
                    for (const p of activePermitsForMaint) {
                        const cost = maintMap[p.permit_key] || 0;
                        if (cost > 0) {
                            factionMaint[p.faction_id] = (factionMaint[p.faction_id] || 0) + cost;
                        }
                    }
                    for (const [fId, totalMaint] of Object.entries(factionMaint)) {
                        const { data: corp } = await supabase.from('factions').select('corp_cash_reserves').eq('id', fId).single();
                        if (corp) {
                            await supabase.from('factions').update({
                                corp_cash_reserves: Math.max(0, Number(corp.corp_cash_reserves || 0) - totalMaint)
                            }).eq('id', fId);
                        }
                    }
                }
            } catch (permitErr) {
                console.error(`[advance-corp-tick] Permit lifecycle failed for ${nation.name} (non-fatal):`, permitErr);
            }

            // ── Construction GDP Boost ──
                // Per-project: (budget / $100M) × 0.1 / timeline_ticks
                // Spreads the 0.1-per-$100M impact evenly across the project lifetime.
                // Multiple projects stack additively.
                const { data: activeForGdp } = await supabase
                    .from('construction_contracts')
                    .select('budget_ceiling, timeline_ticks')
                    .eq('nation_id', nation.id)
                    .eq('status', 'in_progress');
                let gdpBoost = 0;
                for (const c of (activeForGdp || [])) {
                    const budget = Number(c.budget_ceiling || 0);
                    const ticks = Number(c.timeline_ticks || 1);
                    gdpBoost += (budget / 100_000_000) * 0.1 / ticks;
                }
                gdpBoost = Math.round(gdpBoost * 1000) / 1000; // 3 decimal places
                await supabase.from('nations')
                    .update({ construction_gdp_boost: gdpBoost })
                    .eq('id', nation.id);
                if (gdpBoost > 0) {
                    console.log(`[Construction GDP] ${nation.name}: +${gdpBoost}/tick gdp_growth from ${(activeForGdp || []).length} active project(s)`);
                }
            } catch (constructionErr) {
                console.error(`[advance-corp-tick] Construction failed for ${nation.name} (non-fatal):`, constructionErr);
                summary.errors.push({ nation: nation.name, sector: 'construction', error: String(constructionErr) });
            }

            // ── Subsidiary Revenue (GDP-based growth/loss per subsidiary) ──
            try {
                const subRevenueSummary = await processSubsidiaryRevenue(supabase, nation, currentTick);
                if (corps.length === 0) {
                    console.log(`[advance-corp-tick] ${nation.name}: 0 local corporations, subsidiary path processed ${subRevenueSummary?.hqCount || 0} regional HQ(s).`);
                }
            } catch (subRevErr) {
                console.error(`[advance-corp-tick] Subsidiary revenue failed for ${nation.name} (non-fatal):`, subRevErr);
                summary.errors.push({ nation: nation.name, sector: 'subsidiary_revenue', error: String(subRevErr) });
            }

            // ── Corp-specific processing (requires local corporations) ──
            if (corps.length === 0) continue;
            summary.corpsProcessed += corps.length;
            console.log(`[advance-corp-tick] ${nation.name}: ${corps.length} corporation(s)`);

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

            // ── Reputation Decay ─────────────────────────────────────────
            // Base: -0.25/tick. Accelerated to -1.0/tick when workforce is 0 (company is a shell).
            // Uses integer-safe rounding: multiply by 100, round, divide by 100.
            try {
                for (const corp of corps) {
                    const totalWf = Number(corp.corp_general_workforce ?? 0)
                                  + Number(corp.corp_skilled_workforce ?? 0)
                                  + Number(corp.corp_innovative_workforce ?? 0);
                    const repDecayRate = totalWf === 0 ? 1.0 : 0.25;
                    const currentRep = Number(corp.corp_reputation ?? 65);
                    const newRep = Math.max(0, Math.round((currentRep - repDecayRate) * 100) / 100);
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
            try {
                const loanResults = await processFinanceLoans(supabase, nation.id, currentTick);
                if (loanResults && (loanResults.expired > 0 || loanResults.payments > 0 || loanResults.defaults > 0)) {
                    summary.finance = summary.finance || [];
                    summary.finance.push({ nation: nation.name, ...loanResults });
                }
            } catch (finErr) {
                console.error(`[advance-corp-tick] Finance loan processing failed for ${nation.name} (non-fatal):`, finErr);
            }

            // ── Shipping Sector — Route Generation ───────────────────────
            // Generate shipping routes from bilateral trade_partners data.
            // Runs once per nation (routes are bilateral so each pair is processed once).
            try {
                if (!summary._shippingRoutesGenerated) {
                    const routeResult = await generateShippingRoutes(supabase, currentTick);
                    if (routeResult.generated > 0 || routeResult.expired > 0) {
                        summary.shipping = routeResult;
                        console.log(`[advance-corp-tick] Shipping routes: ${routeResult.generated} generated, ${routeResult.expired} expired`);
                    }
                    const organicResult = await generateOrganicRoutes(supabase, currentTick);
                    if (organicResult.generated > 0 || organicResult.expired > 0) {
                        summary.organicShipping = organicResult;
                        console.log(`[advance-corp-tick] Organic routes: ${organicResult.generated} generated, ${organicResult.expired} expired, ${organicResult.capped_out || 0} capped`);
                    }
                    const shippingTelemetry = await captureShippingRouteTelemetry(supabase, currentTick);
                    if (shippingTelemetry) {
                        summary.shippingTelemetry = shippingTelemetry;
                        console.log(`[advance-corp-tick] Shipping telemetry @ tick ${currentTick}: agreement=${shippingTelemetry.agreement}, organic=${shippingTelemetry.organic}, government=${shippingTelemetry.government}`);
                    }
                    summary._shippingRoutesGenerated = true;
                }
            } catch (shipErr) {
                console.error(`[advance-corp-tick] Shipping route generation failed (non-fatal):`, shipErr);
            }

            // ── Ship Market — Generate listings every 8 ticks ────────────
            try {
                if (!summary._shipMarketGenerated && currentTick % 8 === 0) {
                    await generateShipMarketListings(supabase, currentTick);
                    summary._shipMarketGenerated = true;
                }
            } catch (mktErr) {
                console.error(`[advance-corp-tick] Ship market generation failed (non-fatal):`, mktErr);
            }

            // ── Vessel Orders — Deliver completed commissions ────────────
            try {
                if (!summary._vesselOrdersProcessed) {
                    await processVesselOrderDeliveries(supabase, currentTick);
                    summary._vesselOrdersProcessed = true;
                }
            } catch (ordErr) {
                console.error(`[advance-corp-tick] Vessel order delivery failed (non-fatal):`, ordErr);
            }

            // ── Shipping Sector — Transit Cycles & Revenue ───────────────
            // Process active shipping claims: advance vessel status, collect
            // revenue on completed transits, restart transit cycles.
            //
            // Prior bug: this block referenced `corp.X` throughout, but the
            // `for (const corp of corps)` loop that originally held it
            // closed back at the reputation-decay catch (~line 3617). In
            // strict-mode ESM (which edge runtime uses), `corp` was out of
            // scope here → every tick `corp.id` on the vessels fetch threw
            // a ReferenceError that the surrounding try/catch swallowed
            // silently. Result: ships sat on LOADING forever. Fixed by
            // (a) fetching vessels via active_claim_id rather than
            // faction_id (claim id is the precise link, no corp ref
            // needed) and (b) resolving the per-claim corp from the
            // in-scope `corps` array inside the claim loop.
            try {
                const corpById = {};
                for (const c of corps) corpById[c.id] = c;

                const { data: activeClaims } = await supabase
                    .from('shipping_claims')
                    .select('id, route_id, faction_id, vessel_status, transit_started_tick, transit_arrives_tick, revenue_per_transit, total_revenue, transits_completed, shipping_routes!inner(transit_ticks, status, destination_nation_id)')
                    .eq('status', 'active')
                    .eq('nation_id', nation.id);

                // Fetch vessels keyed by claim id instead of corp id — covers
                // every claim in activeClaims regardless of which corp owns it.
                const claimIds = (activeClaims || []).map(c => c.id);
                const { data: corpVesselsForTransit } = claimIds.length > 0
                    ? await supabase.from('corp_vessels')
                        .select('id, vessel_name, vessel_class, fuel, condition, status, base_maintenance, active_claim_id, faction_id')
                        .in('active_claim_id', claimIds)
                    : { data: [] };

                // Cross-nation fix: shipping_claims.nation_id is the route's
                // origin nation (where the claim is processed), NOT the
                // claim-holder's home nation. Corps based in OTHER nations
                // claiming this nation's routes aren't in `corps` (which is
                // filtered by nation_id = nation.id), so corpById misses
                // them → the claim loop skipped them silently, leaving
                // vessels stuck in 'loading' forever. Lazy-fetch the
                // missing corps by id here.
                const claimFactionIds = [...new Set((activeClaims || []).map(c => c.faction_id))];
                const missingFactionIds = claimFactionIds.filter(id => !corpById[id]);
                if (missingFactionIds.length > 0) {
                    const { data: extraCorps, error: extraErr } = await supabase
                        .from('factions')
                        .select('id, faction_name, corp_sector, corp_subsector, corp_cash_reserves, corp_loans, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce, corp_reputation')
                        .in('id', missingFactionIds);
                    if (extraErr) console.warn('[advance-corp-tick] Failed to fetch cross-nation claim-holders:', extraErr.message);
                    for (const c of (extraCorps || [])) corpById[c.id] = c;
                }

                if (activeClaims && activeClaims.length > 0) {
                    let revenueCollected = 0;
                    let transitsCompleted = 0;
                    const routeMarginRows = [];

                    for (const claim of activeClaims) {
                        // Resolve the owning corp for this specific claim.
                        // Downstream code in this loop uses corp.* for cash
                        // deductions, event-log messages, and fleet bookkeeping.
                        const corp = corpById[claim.faction_id];
                        if (!corp) continue;
                        // Skip if route expired — release claim and free vessel
                        if (claim.shipping_routes?.status !== 'active') {
                            await supabase.from('shipping_claims').update({
                                status: 'released', released_at_tick: currentTick, vessel_status: 'idle'
                            }).eq('id', claim.id);
                            await supabase.from('factions').update({
                                shipping_fleet_deployed: Math.max(0, (await supabase.from('factions').select('shipping_fleet_deployed').eq('id', claim.faction_id).single()).data?.shipping_fleet_deployed - 1 || 0)
                            }).eq('id', claim.faction_id);
                            // Free the assigned vessel
                            var { error: freeErr } = await supabase.from('corp_vessels').update({
                                status: 'in_port', active_claim_id: null,
                            }).eq('active_claim_id', claim.id).eq('faction_id', claim.faction_id);
                            if (freeErr) console.warn('[advance-corp-tick] Failed to free vessel on route expiry:', freeErr.message);
                            continue;
                        }

                        const transitTicks = claim.shipping_routes?.transit_ticks || 2;

                        if (claim.vessel_status === 'loading') {
                            // Check fuel before departure — need at least 15% to start transit
                            const assignedVessel = (corpVesselsForTransit || []).find(v => v.active_claim_id === claim.id);
                            if (assignedVessel && assignedVessel.fuel < 15) {
                                console.log(`[advance-corp-tick] Vessel ${assignedVessel.vessel_name} too low on fuel (${assignedVessel.fuel}%) to depart. Skipping transit.`);
                                continue; // Ship stays loading, can't depart
                            }

                            // Start transit next tick. Capture error so silent
                            // failures surface — previously an UPDATE rejection
                            // (trigger, constraint, RLS) was swallowed and the
                            // claim stayed 'loading' forever with no signal.
                            var { error: claimTransitErr } = await supabase.from('shipping_claims').update({
                                vessel_status: 'in_transit',
                                transit_started_tick: currentTick,
                                transit_arrives_tick: currentTick + transitTicks,
                            }).eq('id', claim.id);
                            if (claimTransitErr) {
                                console.warn(`[advance-corp-tick] Claim transit UPDATE failed for claim=${claim.id} corp=${claim.faction_id}: ${claimTransitErr.message}`);
                                continue; // don't flip the vessel if the claim didn't update
                            }
                            console.log(`[advance-corp-tick] Claim ${claim.id} transitioned loading→in_transit (corp=${claim.faction_id}, transitTicks=${transitTicks}, arrives=${currentTick + transitTicks})`);

                            // Update assigned vessel to in_transit
                            var { error: transitErr } = await supabase.from('corp_vessels').update({
                                status: 'in_transit', current_port_nation_id: null,
                            }).eq('active_claim_id', claim.id).eq('faction_id', claim.faction_id);
                            if (transitErr) console.warn('[advance-corp-tick] Vessel transit update failed:', transitErr.message);

                        } else if (claim.vessel_status === 'in_transit' && currentTick >= (claim.transit_arrives_tick || 0)) {
                            // Transit complete — collect revenue and restart cycle
                            const revenue = Number(claim.revenue_per_transit) || 0;

                            // Credit revenue to corp
                            if (revenue > 0) {
                                const { data: corp } = await supabase.from('factions')
                                    .select('corp_cash_reserves').eq('id', claim.faction_id).single();
                                if (corp) {
                                    await supabase.from('factions').update({
                                        corp_cash_reserves: Number(corp.corp_cash_reserves || 0) + revenue
                                    }).eq('id', claim.faction_id);
                                }
                                revenueCollected += revenue;
                            }

                            // Update claim: increment transits, add revenue, restart loading
                            await supabase.from('shipping_claims').update({
                                vessel_status: 'loading',
                                transits_completed: (claim.transits_completed || 0) + 1,
                                total_revenue: (Number(claim.total_revenue) || 0) + revenue,
                                transit_started_tick: null,
                                transit_arrives_tick: null,
                            }).eq('id', claim.id);

                            // Update assigned vessel: arrived at destination port + auto-refuel
                            const destNationId = claim.shipping_routes?.destination_nation_id || claim.nation_id;

                            // Auto-refuel: check for fuel depot in destination nation.
                            // Base fuel cost = $50k per refuel. State = 3x ($150k). Other corp's depot = 1.15x.
                            // Prefer our OWN depot first — a previous LIMIT 1 without an
                            // owner filter could return another corp's depot and leave us
                            // paying the 1.15x rate even when our own was available.
                            let fuelDepot = null;
                            {
                                const { data: ownDepot } = await supabase.from('corp_properties')
                                    .select('id, faction_id')
                                    .eq('nation_id', destNationId)
                                    .eq('faction_id', claim.faction_id)
                                    .eq('type', 'fuel_depot')
                                    .eq('is_active', true)
                                    .limit(1)
                                    .maybeSingle();
                                if (ownDepot) {
                                    fuelDepot = ownDepot;
                                } else {
                                    const { data: anyDepot } = await supabase.from('corp_properties')
                                        .select('id, faction_id')
                                        .eq('nation_id', destNationId)
                                        .eq('type', 'fuel_depot')
                                        .eq('is_active', true)
                                        .limit(1)
                                        .maybeSingle();
                                    fuelDepot = anyDepot;
                                }
                            }

                            const depotTier = fuelDepot && fuelDepot.faction_id === claim.faction_id
                                ? 'own'
                                : fuelDepot
                                ? 'other'
                                : 'state';
                            const assignedVesselForArrival = (corpVesselsForTransit || []).find(v => v.active_claim_id === claim.id);
                            const fuelCost = computeFuelCostForTransit({
                                route: claim.shipping_routes,
                                vesselClass: assignedVesselForArrival?.vessel_class,
                                depotTier,
                            });
                            if (depotTier === 'other') {
                                // Pay premium margin to depot owner
                                const ownEquivalentFuel = computeFuelCostForTransit({
                                    route: claim.shipping_routes,
                                    vesselClass: assignedVesselForArrival?.vessel_class,
                                    depotTier: 'own',
                                });
                                const depotRevenue = Math.max(0, fuelCost - ownEquivalentFuel);
                                const { data: depotOwner } = await supabase.from('factions')
                                    .select('corp_cash_reserves').eq('id', fuelDepot.faction_id).single();
                                if (depotOwner) {
                                    await supabase.from('factions').update({
                                        corp_cash_reserves: Number(depotOwner.corp_cash_reserves || 0) + depotRevenue,
                                    }).eq('id', fuelDepot.faction_id);
                                }
                            }

                            // Deduct fuel cost from shipping corp
                            if (fuelCost > 0) {
                                const { data: shipCorp } = await supabase.from('factions')
                                    .select('corp_cash_reserves').eq('id', claim.faction_id).single();
                                if (shipCorp) {
                                    await supabase.from('factions').update({
                                        corp_cash_reserves: Math.max(0, Number(shipCorp.corp_cash_reserves || 0) - fuelCost),
                                    }).eq('id', claim.faction_id);
                                }
                            }

                            var { error: arriveErr } = await supabase.from('corp_vessels').update({
                                status: 'in_port', current_port_nation_id: destNationId,
                                fuel: 100, // refueled on arrival
                            }).eq('active_claim_id', claim.id).eq('faction_id', claim.faction_id);
                            if (arriveErr) console.warn('[advance-corp-tick] Vessel arrival update failed:', arriveErr.message);

                            transitsCompleted++;
                        }
                        // 'in_transit' but not yet arrived — no action needed

                        // Persist per-tick route margin diagnostics (active claims).
                        const diagVessel = (corpVesselsForTransit || []).find(v => v.active_claim_id === claim.id);
                        const diagDepotTier = 'state'; // structural baseline (no private depot guarantee)
                        const diagFuelPerTransit = computeFuelCostForTransit({
                            route: claim.shipping_routes,
                            vesselClass: diagVessel?.vessel_class,
                            depotTier: diagDepotTier,
                        });
                        const diagMargin = estimateMonthlyClaimMargin({
                            route: claim.shipping_routes,
                            claim,
                            vessel: diagVessel,
                            fuelCostPerTransit: diagFuelPerTransit,
                        });
                        routeMarginRows.push({
                            tick: currentTick,
                            route_id: claim.route_id,
                            corp_id: claim.faction_id,
                            claim_id: claim.id,
                            vessel_id: diagVessel?.id || null,
                            vessel_class: diagVessel?.vessel_class || null,
                            vessel_status: claim.vessel_status || diagVessel?.status || null,
                            gross_revenue: diagMargin.grossRevenue,
                            fuel_cost: diagMargin.fuelCost,
                            maintenance_cost: diagMargin.maintenanceCost,
                            incident_reserve: diagMargin.incidentReserve,
                            net_margin: diagMargin.netMargin,
                        });
                    }

                    if (routeMarginRows.length > 0) {
                        const { error: marginErr } = await supabase
                            .from('shipping_route_margin_ticks')
                            .upsert(routeMarginRows, { onConflict: 'tick,route_id,corp_id' });
                        if (marginErr) {
                            console.warn('[advance-corp-tick] Route margin diagnostics upsert failed:', marginErr.message);
                        }
                    }

                    if (revenueCollected > 0 || transitsCompleted > 0) {
                        console.log(`[advance-corp-tick] Shipping ${nation.name}: ${transitsCompleted} transits, $${Math.round(revenueCollected).toLocaleString()} revenue`);
                    }
                }
            } catch (shipRevErr) {
                console.error(`[advance-corp-tick] Shipping revenue failed for ${nation.name} (non-fatal):`, shipRevErr);
            }

            // ── Vessel Decay & Maintenance ──────────────────────────────
            // Condition degrades 1d2% per tick for all vessels.
            // Fuel degrades 1d10+5% for vessels in transit.
            // Maintenance deducted from corp cash.
            // Dry dock completion restores condition.
            //
            // Same out-of-scope-corp bug as the transit block above — this
            // try used `corp.id` / `corp.corp_cash_reserves` / `corp.faction_name`
            // without being inside a `for (const corp of corps)`, so every
            // tick the vessels fetch threw silently and maintenance never
            // ran, condition never decayed, incidents never fired. Wrapped
            // in a per-corp loop so each corp's fleet is processed in its
            // own scope.
            for (const corp of corps) {
            try {
                const { data: corpCashRow, error: corpCashErr } = await supabase.from('factions')
                    .select('corp_cash_reserves')
                    .eq('id', corp.id)
                    .single();
                if (corpCashErr) {
                    console.warn(`[advance-corp-tick] Failed to fetch fresh corp cash for ${corp.faction_name}:`, corpCashErr.message);
                }
                let corpCashRunning = Number(corpCashRow?.corp_cash_reserves ?? corp.corp_cash_reserves ?? 0);
                const cashAtTickStart = corpCashRunning;
                console.log('[advance-corp-tick] corp_cash_tick_start', {
                    faction_id: corp.id,
                    faction_name: corp.faction_name,
                    tick: currentTick,
                    before_balance: corpCashRunning,
                });

                const { data: vessels } = await supabase.from('corp_vessels')
                    .select('id, vessel_name, vessel_class, condition, fuel, status, base_maintenance, drydock_until_tick, active_claim_id, current_port_nation_id')
                    .eq('faction_id', corp.id);

                if (vessels && vessels.length > 0) {
                    let totalMaintenance = 0;

                    // Pre-fetch route info for every in-transit vessel — needed for
                    // the Job 2 incident rolls below (cargo-driven fire rates,
                    // proximity-driven storms, coastal-vs-international collision).
                    const transitClaimIds = vessels
                        .filter(v => v.status === 'in_transit' && v.active_claim_id)
                        .map(v => v.active_claim_id);
                    const claimRouteMap = new Map();
                    if (transitClaimIds.length > 0) {
                        try {
                            const { data: claimRoutes } = await supabase.from('shipping_claims')
                                .select('id, route_id, shipping_routes!inner(id, destination_nation_id, scope, trade_sector, proximity)')
                                .in('id', transitClaimIds);
                            for (const c of (claimRoutes || [])) claimRouteMap.set(c.id, c);
                        } catch (routeFetchErr) {
                            console.warn('[advance-corp-tick] Transit-route fetch for incidents failed:', routeFetchErr?.message || routeFetchErr);
                        }
                    }

                    // Profitability checkpoint: expected monthly revenue per active ship
                    // vs expected monthly direct ops (fuel + state-adjusted maintenance
                    // + incident reserve). Logs warnings for structurally negative lanes.
                    try {
                        const activeClaimIdsForCorp = vessels.filter(v => v.active_claim_id).map(v => v.active_claim_id);
                        if (activeClaimIdsForCorp.length > 0) {
                            const { data: activeClaimsForCorp } = await supabase.from('shipping_claims')
                                .select('id, route_id, revenue_per_transit, vessel_status, shipping_routes!inner(id, transit_ticks, scope, proximity)')
                                .in('id', activeClaimIdsForCorp)
                                .eq('faction_id', corp.id)
                                .eq('status', 'active');
                            for (const claim of (activeClaimsForCorp || [])) {
                                const vessel = vessels.find(v => v.active_claim_id === claim.id);
                                const fuelPerTransit = computeFuelCostForTransit({
                                    route: claim.shipping_routes,
                                    vesselClass: vessel?.vessel_class,
                                    depotTier: 'state',
                                });
                                const m = estimateMonthlyClaimMargin({
                                    route: claim.shipping_routes,
                                    claim,
                                    vessel,
                                    fuelCostPerTransit: fuelPerTransit,
                                });
                                const checkpoint = {
                                    faction_id: corp.id,
                                    faction_name: corp.faction_name,
                                    claim_id: claim.id,
                                    route_id: claim.route_id,
                                    vessel_id: vessel?.id || null,
                                    vessel_name: vessel?.vessel_name || null,
                                    expected_monthly_revenue: m.grossRevenue,
                                    expected_monthly_direct_cost: m.fuelCost + m.maintenanceCost + m.incidentReserve,
                                    expected_monthly_net: m.netMargin,
                                };
                                if (m.netMargin < 0) {
                                    console.warn('[advance-corp-tick] shipping_profitability_checkpoint_negative', checkpoint);
                                } else {
                                    console.log('[advance-corp-tick] shipping_profitability_checkpoint', checkpoint);
                                }
                            }
                        }
                    } catch (profitErr) {
                        console.warn('[advance-corp-tick] Shipping profitability checkpoint failed:', profitErr?.message || profitErr);
                    }

                    for (const v of vessels) {
                        const updates = {};

                        // Dry dock completion check
                        if (v.status === 'dry_dock' && v.drydock_until_tick && currentTick >= v.drydock_until_tick) {
                            updates.status = 'in_port';
                            updates.condition = 85 + Math.floor(Math.random() * 16); // restore to 85-100
                            updates.drydock_until_tick = null;
                            updates.last_refurbish_tick = currentTick;
                            console.log(`[advance-corp-tick] Vessel ${v.vessel_name}: dry dock complete, condition → ${updates.condition}%`);
                        }

                        // Condition decay: 1d2% per tick (all vessels except dry dock)
                        if (v.status !== 'dry_dock') {
                            const condDecay = 1 + Math.floor(Math.random() * 2); // 1-2%
                            const newCond = Math.max(0, (updates.condition || v.condition) - condDecay);
                            updates.condition = newCond;

                            // Forced dry dock if condition drops below 20%
                            if (newCond < 20 && v.status !== 'in_transit') {
                                // Check for dry dock: own > other corp > state
                                const portNationId = v.current_port_nation_id || nation.id;
                                const { data: ownDock } = await supabase.from('corp_properties')
                                    .select('id').eq('faction_id', corp.id).eq('nation_id', portNationId)
                                    .eq('type', 'dry_dock').eq('is_active', true).limit(1).maybeSingle();
                                const { data: otherDock } = !ownDock ? await supabase.from('corp_properties')
                                    .select('id, faction_id').neq('faction_id', corp.id).eq('nation_id', portNationId)
                                    .eq('type', 'dry_dock').eq('is_active', true).limit(1).maybeSingle() : { data: null };

                                // Repair cost based on damage: $2-5M base
                                const damagePercent = (100 - newCond) / 100;
                                const baseRepairCost = 2000000 + Math.round(damagePercent * 3000000);
                                let repairCost, repairTicks;

                                if (ownDock) {
                                    repairCost = baseRepairCost; // Own dock: base cost
                                    repairTicks = 2;
                                } else if (otherDock) {
                                    repairCost = Math.round(baseRepairCost * 1.2); // Other corp: +20%
                                    repairTicks = 2;
                                    // Pay revenue to dock owner
                                    const dockRevenue = repairCost - baseRepairCost;
                                    const { data: dockOwner } = await supabase.from('factions')
                                        .select('corp_cash_reserves').eq('id', otherDock.faction_id).single();
                                    if (dockOwner) {
                                        await supabase.from('factions').update({
                                            corp_cash_reserves: Number(dockOwner.corp_cash_reserves || 0) + dockRevenue,
                                        }).eq('id', otherDock.faction_id);
                                    }
                                } else {
                                    repairCost = baseRepairCost * 3; // State dock: 3x
                                    repairTicks = 3; // Slower at state dock
                                }

                                // Deduct repair cost
                                const beforeRepairCash = corpCashRunning;
                                const afterRepairCash = Math.max(0, beforeRepairCash - repairCost);
                                const { error: repairCashErr } = await supabase.from('factions').update({
                                    corp_cash_reserves: afterRepairCash,
                                }).eq('id', corp.id);
                                if (repairCashErr) {
                                    console.warn(`[advance-corp-tick] Forced dry dock repair deduction failed for ${corp.faction_name}:`, repairCashErr.message);
                                } else {
                                    corpCashRunning = afterRepairCash;
                                    console.log('[advance-corp-tick] corp_cash_update', {
                                        faction_id: corp.id,
                                        faction_name: corp.faction_name,
                                        tick: currentTick,
                                        reason: 'forced_dry_dock_repair',
                                        vessel_id: v.id,
                                        vessel_name: v.vessel_name,
                                        amount_delta: -repairCost,
                                        before_balance: beforeRepairCash,
                                        after_balance: corpCashRunning,
                                    });
                                }

                                updates.status = 'dry_dock';
                                updates.drydock_until_tick = currentTick + repairTicks;
                                updates.active_claim_id = null;
                                console.log(`[advance-corp-tick] Vessel ${v.vessel_name}: forced dry dock (condition ${newCond}%), cost: $${Math.round(repairCost/1000)}k, ${repairTicks} ticks, ${ownDock ? 'OWN' : otherDock ? 'OTHER CORP' : 'STATE'} dock`);
                            }
                        }

                        // ── Incident rolls (Job 2) ──────────────────────────
                        // While in transit, each vessel independently rolls for the
                        // five non-strand incident types. Rates are per-transit-tick;
                        // any that fire write a vessel_incidents row + event_log and
                        // apply vessel-state side effects (partial → condition hit,
                        // total → release claim + force 'anchored' like a strand).
                        // Strand remains handled separately below via fuel depletion.
                        if (v.status === 'in_transit') {
                            const claimInfo = claimRouteMap.get(v.active_claim_id);
                            const route     = claimInfo?.shipping_routes || null;
                            const scope     = route?.scope || 'INTERNATIONAL';
                            const cargo     = route?.trade_sector || '';
                            const prox      = Number(route?.proximity) || 0;
                            const incidentNationId = resolveIncidentNationId(v, corp.nation_id, claimRouteMap);
                            const firedIncidents = [];
                            const R = () => Math.random();

                            // Mechanical failure — scales with condition decay.
                            let mechChance = 0.005;
                            if (v.condition < 30)      mechChance *= 3;
                            else if (v.condition < 50) mechChance *= 2;
                            if (R() < mechChance) firedIncidents.push({
                                type: 'mechanical_failure',
                                severity: 'partial',
                                description: `${v.vessel_name} suffered a mechanical failure mid-transit. Engine / drive-train damage reported.`,
                            });

                            // Collision / grounding — coastal lanes have more traffic.
                            let colChance = 0.003;
                            if (scope === 'COASTAL') colChance *= 1.5;
                            if (R() < colChance) {
                                const isTotal = R() < 0.2; // 20% of collisions are total-loss
                                firedIncidents.push({
                                    type: 'collision',
                                    severity: isTotal ? 'total' : 'partial',
                                    description: isTotal
                                        ? `${v.vessel_name} lost in a collision — total loss reported.`
                                        : `${v.vessel_name} involved in a collision. Hull damage reported.`,
                                });
                            }

                            // Fire / explosion — fuel and arms cargoes carry elevated risk.
                            let fireChance = 0.0015;
                            if (cargo === 'fuel_energy' || cargo === 'arms') fireChance *= 2.5;
                            if (R() < fireChance) {
                                const isTotal = R() < 0.4; // fires escalate faster than collisions
                                firedIncidents.push({
                                    type: 'fire',
                                    severity: isTotal ? 'total' : 'partial',
                                    description: `Fire broke out aboard ${v.vessel_name}.` +
                                        (cargo === 'fuel_energy' ? ' Fuel cargo ignited.' :
                                         cargo === 'arms'        ? ' Munitions compartment compromised.' : '') +
                                        (isTotal ? ' Vessel reported total loss.' : ''),
                                });
                            }

                            // Piracy — flat per-transit rate for now (affinity-aware
                            // rates wait on a future diplomatic-relations spec).
                            if (R() < 0.005) firedIncidents.push({
                                type: 'piracy',
                                severity: 'partial',
                                description: `Pirates boarded ${v.vessel_name}. Cargo lost to seizure; crew safe. Ransom demanded.`,
                            });

                            // Storm damage — long-haul routes expose vessels to worse weather.
                            let stormChance = 0.004;
                            if (prox >= 50) stormChance *= 1.5;
                            if (R() < stormChance) firedIncidents.push({
                                type: 'storm_damage',
                                severity: 'partial',
                                description: `${v.vessel_name} caught in heavy weather. Structural damage reported.`,
                            });

                            for (const inc of firedIncidents) {
                                // Side effects first. Total losses get the same
                                // treatment as strand (anchored + claim released +
                                // fleet slot freed); partial losses knock condition.
                                if (inc.severity === 'total') {
                                    updates.status = 'anchored';
                                    updates.active_claim_id = null;
                                    if (v.active_claim_id) {
                                        const { error: relErr } = await supabase.from('shipping_claims').update({
                                            vessel_status: 'idle',
                                            status: 'released',
                                            released_at_tick: currentTick,
                                            revenue_per_transit: 0,
                                        }).eq('id', v.active_claim_id);
                                        if (relErr) console.warn('[advance-corp-tick] Claim release on total-loss incident failed:', relErr.message);
                                        const { data: fleetRow } = await supabase.from('factions')
                                            .select('shipping_fleet_deployed').eq('id', corp.id).single();
                                        const fleetNow = Math.max(0, Number(fleetRow?.shipping_fleet_deployed || 0) - 1);
                                        await supabase.from('factions').update({ shipping_fleet_deployed: fleetNow }).eq('id', corp.id);
                                    }
                                } else {
                                    // Partial — condition hit 20-40%, floored at 0.
                                    const hit = 20 + Math.floor(Math.random() * 21);
                                    const currentCond = Number(updates.condition ?? v.condition) || 0;
                                    updates.condition = Math.max(0, currentCond - hit);
                                }

                                try {
                                    const { error: incErr } = await supabase.from('vessel_incidents').insert({
                                        faction_id:    corp.id,
                                        vessel_id:     v.id,
                                        nation_id:     incidentNationId,
                                        incident_type: inc.type,
                                        incident_tick: currentTick,
                                        description:   inc.description,
                                        severity:      inc.severity,
                                        status:        'pending',
                                    });
                                    if (incErr) console.warn(`[advance-corp-tick] vessel_incidents insert failed for ${v.vessel_name} (${inc.type}):`, incErr.message);
                                } catch (incThrow) {
                                    console.warn(`[advance-corp-tick] vessel_incidents insert threw for ${v.vessel_name} (${inc.type}):`, incThrow?.message || incThrow);
                                }
                                try {
                                    await supabase.from('event_log').insert({
                                        nation_id:          incidentNationId,
                                        faction_id:         corp.id,
                                        event_name:         `${corp.faction_name || 'A corporation'}: ${inc.type.replace(/_/g, ' ')} on ${v.vessel_name}`,
                                        category:           'corporate',
                                        description_chosen: inc.description + ' If the vessel is insured, the owning corporation can file a claim from their Shipping Operations view.',
                                        fired_at_tick:      currentTick,
                                    });
                                } catch (evErr) {
                                    console.warn('[advance-corp-tick] incident event_log insert failed:', evErr?.message || evErr);
                                }
                            }

                        }

                        // Fuel decay: 1d10+5% for vessels in transit. Skip if a
                        // total-loss incident above already flipped the vessel to
                        // 'anchored' — the ship is lost, double-processing the
                        // strand path would double-free the fleet slot.
                        if (v.status === 'in_transit' && updates.status !== 'anchored') {
                            const fuelBurn = 5 + Math.floor(Math.random() * 10) + 1; // 6-15%
                            const newFuel = Math.max(0, v.fuel - fuelBurn);
                            updates.fuel = newFuel;

                            // Stranded: vessel ran out of fuel mid-transit
                            if (newFuel <= 0) {
                                updates.status = 'anchored'; // stranded at sea
                                updates.active_claim_id = null;
                                console.log(`[advance-corp-tick] Vessel ${v.vessel_name}: STRANDED (out of fuel mid-transit)`);

                                // Release the shipping claim, zero out the revenue going forward,
                                // and free the fleet slot so the corp doesn't keep earning from a
                                // lost ship. Insurance (below) is the only remaining cashflow.
                                if (v.active_claim_id) {
                                    const { error: relErr } = await supabase.from('shipping_claims').update({
                                        vessel_status: 'idle',
                                        status: 'released',
                                        released_at_tick: currentTick,
                                        revenue_per_transit: 0,
                                    }).eq('id', v.active_claim_id);
                                    if (relErr) console.warn('[advance-corp-tick] Claim release on strand failed:', relErr.message);
                                    // Re-read fleet_deployed before decrementing so multiple ship
                                    // losses in the same tick don't clobber each other's updates.
                                    const { data: fleetRow } = await supabase.from('factions')
                                        .select('shipping_fleet_deployed').eq('id', corp.id).single();
                                    const fleetNow = Math.max(0, Number(fleetRow?.shipping_fleet_deployed || 0) - 1);
                                    await supabase.from('factions').update({ shipping_fleet_deployed: fleetNow }).eq('id', corp.id);
                                }

                                // Record a claim-eligible incident and fire a news-ticker event.
                                // The corp decides from their Shipping Operations view whether to
                                // FILE CLAIM (spawns an insurance_claims row) or DISMISS the
                                // incident. No auto-file.
                                const strandNationId = resolveIncidentNationId(v, corp.nation_id, claimRouteMap);
                                const strandDescription = `Vessel ${v.vessel_name} stranded at sea — fuel depleted mid-transit.`;
                                try {
                                    const { error: incErr } = await supabase.from('vessel_incidents').insert({
                                        faction_id:    corp.id,
                                        vessel_id:     v.id,
                                        nation_id:     strandNationId,
                                        incident_type: 'stranded',
                                        incident_tick: currentTick,
                                        description:   strandDescription,
                                        status:        'pending',
                                    });
                                    if (incErr) console.warn(`[advance-corp-tick] vessel_incidents insert failed for ${v.vessel_name}:`, incErr.message);
                                } catch (incThrow) {
                                    console.warn(`[advance-corp-tick] vessel_incidents insert threw for ${v.vessel_name}:`, incThrow?.message || incThrow);
                                }
                                try {
                                    await supabase.from('event_log').insert({
                                        nation_id:          strandNationId,
                                        faction_id:         corp.id,
                                        event_name:         `${corp.faction_name || 'A corporation'} vessel stranded at sea`,
                                        category:           'corporate',
                                        description_chosen: strandDescription + ' If the vessel is insured, the owning corporation can file a claim from their Shipping Operations view.',
                                        fired_at_tick:      currentTick,
                                    });
                                } catch (evErr) {
                                    console.warn(`[advance-corp-tick] event_log insert failed for ${v.vessel_name}:`, evErr?.message || evErr);
                                }
                            }
                        }

                        // Maintenance cost by vessel activity state (idle in-port is cheaper;
                        // in-transit is higher wear).
                        const maintenanceMultiplier = maintenanceMultiplierForStatus(updates.status || v.status);
                        totalMaintenance += Math.round((Number(v.base_maintenance) || 0) * maintenanceMultiplier);

                        // Apply updates
                        if (Object.keys(updates).length > 0) {
                            const { error: vErr } = await supabase.from('corp_vessels').update(updates).eq('id', v.id);
                            if (vErr) console.warn(`[advance-corp-tick] Vessel update failed for ${v.vessel_name}:`, vErr.message);
                        }
                    }

                    // Deduct total fleet maintenance from corp cash
                    if (totalMaintenance > 0) {
                        const beforeMaintenanceCash = corpCashRunning;
                        const afterMaintenanceCash = Math.max(0, beforeMaintenanceCash - totalMaintenance);
                        const { error: maintErr } = await supabase.from('factions').update({
                            corp_cash_reserves: afterMaintenanceCash,
                        }).eq('id', corp.id);
                        if (maintErr) console.warn(`[advance-corp-tick] Fleet maintenance deduction failed for ${corp.faction_name}:`, maintErr.message);
                        if (!maintErr) {
                            corpCashRunning = afterMaintenanceCash;
                            console.log('[advance-corp-tick] corp_cash_update', {
                                faction_id: corp.id,
                                faction_name: corp.faction_name,
                                tick: currentTick,
                                reason: 'fleet_maintenance',
                                amount_delta: -totalMaintenance,
                                before_balance: beforeMaintenanceCash,
                                after_balance: corpCashRunning,
                            });
                        }
                    }
                }
                console.log('[advance-corp-tick] corp_cash_tick_end', {
                    faction_id: corp.id,
                    faction_name: corp.faction_name,
                    tick: currentTick,
                    after_balance: corpCashRunning,
                });
                const cashDelta = corpCashRunning - cashAtTickStart;
                const nonPnlCashMovements = null;
                const { error: cashHistoryErr } = await supabase
                    .from('corp_cash_history')
                    .upsert({
                        faction_id: corp.id,
                        tick: currentTick,
                        cash_start: cashAtTickStart,
                        cash_end: corpCashRunning,
                        cash_delta: cashDelta,
                        non_pnl_cash_movements: nonPnlCashMovements,
                    }, { onConflict: 'faction_id,tick' });
                if (cashHistoryErr) {
                    console.warn(`[advance-corp-tick] corp_cash_history upsert failed for ${corp.faction_name}:`, cashHistoryErr.message);
                }
            } catch (vesselErr) {
                console.error(`[advance-corp-tick] Vessel decay failed for ${corp.faction_name} (non-fatal):`, vesselErr);
            }
            } // end for (const corp of corps) — vessel decay/maintenance per-corp

            // ── Specialty Building Effects ────────────────────────────────
            try {
                const SPECIALTY_TYPES = ['branch_office', 'trading_floor', 'claims_office'];
                const { data: specialtyProps } = await supabase
                    .from('corp_properties')
                    .select('faction_id, type, capacity')
                    .eq('nation_id', nation.id)
                    .eq('is_active', true)
                    .in('type', SPECIALTY_TYPES);

                if (specialtyProps && specialtyProps.length > 0) {
                    // Group by faction, sum capacity across specialty buildings
                    const corpSpecialty = {};
                    for (const p of specialtyProps) {
                        if (!corpSpecialty[p.faction_id]) corpSpecialty[p.faction_id] = 0;
                        corpSpecialty[p.faction_id] += Number(p.capacity || 0);
                    }

                    // +1 reputation per 200 employees in specialty buildings (capped at +5/tick)
                    for (const [factionId, totalCapacity] of Object.entries(corpSpecialty)) {
                        const repBonus = Math.min(5, Math.floor(totalCapacity / 200));
                        if (repBonus > 0) {
                            const { data: corp } = await supabase.from('factions')
                                .select('corp_reputation').eq('id', factionId).single();
                            if (corp) {
                                const newRep = Math.min(100, Number(corp.corp_reputation || 50) + repBonus);
                                await supabase.from('factions').update({ corp_reputation: newRep }).eq('id', factionId);
                            }
                        }
                    }
                }
            } catch (specErr) {
                console.warn(`[advance-corp-tick] Specialty building effects failed for ${nation.name}:`, specErr.message);
            }

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
