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
//  LOAN MATH — verbatim copy of js/game/loan-math.js
//
//  This file is hand-maintained (no bundler), so the loan-math helpers
//  are inlined here. If you change either copy, update the other in the
//  same commit. The canonical home is js/game/loan-math.js.
// ════════════════════════════════════════════════════════════════════════════════

function monthlyInterest(principal, annualRatePct) {
    const safePrincipal = Math.max(0, Number(principal) || 0);
    const safeRate = Math.max(0, Number(annualRatePct) || 0);
    return Math.round(safePrincipal * (safeRate / 100) / 12);
}

function principalPortion(monthlyPayment, monthlyInterestAmount) {
    const safePayment = Number(monthlyPayment) || 0;
    const safeInterest = Number(monthlyInterestAmount) || 0;
    return Math.max(0, safePayment - safeInterest);
}

const COLLATERAL_RECOVERY_RATES = {
    equipment: 0.6,
    property: 0.75,
    unsecured: 0,
};

function collateralRecoveryRate(collateralType) {
    if (!collateralType) return 0;
    const rate = COLLATERAL_RECOVERY_RATES[collateralType];
    return typeof rate === 'number' ? rate : 0;
}

const DEFAULT_MISSED_THRESHOLD = 4;

// ════════════════════════════════════════════════════════════════════════════════
//  Option 4 — corp_cash_events SSoT (Phase 4: dual-write retired).
//
//  logCashEvent is the single entry point for per-corp P&L cash movements.
//  Events buffer in memory and flush in one batch at tick end so the
//  insert doesn't fan out into one round-trip per accrual. _currentTick is
//  captured at the top of advanceCorpTick so call sites don't have to thread
//  it through. The corp_cash_history writer reads from _pendingCashEvents
//  to derive non_pnl_cash_movements before flush.
//
//  KNOWN SCOPE GAP — cash events that still bypass the event log:
//    - advance-tick/index.ts gov_bailout path (non-P&L equity infusion — correct to skip)
//    - advance-tick/index.ts processAutoRatePolicies (subsidiary insurance
//      premiums, loan payments, claim payouts — these SHOULD flow through)
//    - js/corp-refurbish.js client-side refurbish cost (player-initiated expense)
//    - non-P&L principal transfers (loan principal debit/credit at ~L4355 /
//      ~L4378 / ~L5419, bond principal credit at ~L2713). These belong in
//      capital_in / capital_out / debt_principal categories, which need the
//      helper extended to skip P&L semantics — deferred.
//  Follow-up: route these through logCashEvent in a later phase.
// ════════════════════════════════════════════════════════════════════════════════

let _currentTick = 0;
const _pendingCashEvents = [];

// Sum buffered P&L deltas for one corp at the current tick. Used by the
// corp_cash_history writer to derive non_pnl_cash_movements before
// flushCashEvents persists the events.
function _accruedProfitForCorp(corpId) {
    let sum = 0;
    for (const ev of _pendingCashEvents) {
        if (ev.corp_id === corpId) sum += Number(ev.delta) || 0;
    }
    return sum;
}

function logCashEvent(corpId, category, label, delta) {
    if (!corpId || !Number.isFinite(delta) || delta === 0) return;
    _pendingCashEvents.push({
        corp_id:  corpId,
        tick:     _currentTick,
        category,
        label:    String(label || category),
        delta,
    });
}

async function flushCashEvents(supabase) {
    if (_pendingCashEvents.length === 0) return;
    // Splice first so a thrown insert can't double-write on retry.
    const batch = _pendingCashEvents.splice(0, _pendingCashEvents.length);
    try {
        const { error } = await supabase.from('corp_cash_events').insert(batch);
        if (error) {
            console.warn(`[advance-corp-tick] corp_cash_events insert failed (${batch.length} events):`, error.message);
        }
    } catch (err) {
        // Catch thrown exceptions (network, schema-cache, etc.) so they
        // don't abort tick completion — the tick already moved real cash
        // via corp_cash_reserves writes; losing the event log for one
        // tick is recoverable, re-running the whole tick is not.
        console.error('[advance-corp-tick] corp_cash_events insert threw:', err?.message || err);
    }
}

// Stuck vessels / claims / orders come from state-transition writes failing
// silently — the pre-transition state stays on disk, the next tick re-runs
// with the same result, forever. Every state-transition write in this file
// routes its error through here so the failure lands in event_log (player-
// and operator-visible) and surfaces at error level in server logs. One
// place, one format, one signal.
async function logShippingWriteFailure(supabase, ctx) {
    const { nationId, factionId, vesselName, operation, error, currentTick } = ctx || {};
    const msg = error?.message || String(error);
    console.error(`[advance-corp-tick] ${operation} failed for ${vesselName || '(unknown)'}:`, error);
    try {
        await supabase.from('event_log').insert({
            nation_id: nationId || null,
            faction_id: factionId || null,
            event_name: `Shipping write failure: ${operation}`,
            category: 'corporate',
            description_chosen: `${operation} failed${vesselName ? ' for ' + vesselName : ''}: ${msg}`,
            fired_at_tick: currentTick,
        });
    } catch (logErr) {
        console.error('[advance-corp-tick] event_log insert for shipping failure threw:', logErr);
    }
}

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
    // route may be null and transit_ticks may be missing; (Number(undefined)
    // is NaN and Math.max propagates NaN), so coerce to 0 first then floor at 1.
    const transitTicks = Math.max(1, Number(route?.transit_ticks) || 0);
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

// ════════════════════════════════════════════════════════════════════════════════
//  TIER-BASED CORP CONTRACT GENERATOR — writes to corp_contracts (the table the
//  Operations page reads). Runs once per shard tick. Ranks every active nation
//  by gdp_growth, splits into thirds, and generates a deterministic slate per
//  tier:
//      top    → mega_project, industrial, civil_engineering   (3 contracts)
//      middle → industrial, civil_engineering                 (2 contracts)
//      bottom → civil_engineering                             (1 contract)
//  Honors the corp_count + 2 open-contract cap per nation.
//
//  Reuses the existing CC_TEMPLATES / CC_CIVIL / CC_INDUSTRIAL / CC_MEGA pools
//  for names, budget ranges, and timeline ranges — the same template names as
//  the legacy construction_contracts generator, just routed to the new table.
// ════════════════════════════════════════════════════════════════════════════════
const CORP_GOV_ISSUERS = [
    'Government Construction Authority', 'National Building Commission',
    'Ministry of Infrastructure', 'Department of Public Works',
    'Federal Construction Office', 'Public Works Department',
];

async function generateCorpContractsByGdpTier(supabase, nationList, currentTick, gameYear) {
    if (!Array.isArray(nationList) || nationList.length === 0) return { generated: 0 };

    // Rank by gdp_growth desc; id as tiebreaker so the partition is stable
    const ranked = nationList
        .filter(n => n && n.id)
        .slice()
        .sort((a, b) => {
            const ga = Number(a.gdp_growth ?? 50);
            const gb = Number(b.gdp_growth ?? 50);
            if (gb !== ga) return gb - ga;
            return String(a.id).localeCompare(String(b.id));
        });

    const N = ranked.length;
    // ceil splits favor the top — 4 nations → 2 top / 1 mid / 1 bottom
    const topCutoff = Math.ceil(N / 3);
    const midCutoff = Math.ceil((2 * N) / 3);

    let generated = 0;
    for (let i = 0; i < ranked.length; i++) {
        const nation = ranked[i];
        const slate = i < topCutoff
            ? ['mega_project', 'industrial', 'civil_engineering']
            : i < midCutoff
                ? ['industrial', 'civil_engineering']
                : ['civil_engineering'];

        // Open-contract cap = corp_count + 2 (matches the legacy rule)
        const { count: corpCount } = await supabase
            .from('factions')
            .select('id', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .eq('faction_type', 'corporation')
            .is('abandoned_at', null);
        const cap = (corpCount || 0) + 2;

        const { count: openCount } = await supabase
            .from('corp_contracts')
            .select('id', { count: 'exact', head: true })
            .eq('issuer_nation_id', nation.id)
            .eq('status', 'open');
        const slots = Math.max(0, cap - (openCount || 0));
        if (slots === 0) continue;

        const toInsert = Math.min(slots, slate.length);
        for (let s = 0; s < toInsert; s++) {
            const ok = await insertCorpContract(supabase, nation, slate[s], currentTick, gameYear);
            if (ok) generated++;
        }
    }
    return { generated };
}

async function insertCorpContract(supabase, nation, sector, currentTick, gameYear) {
    const pool = sector === 'mega_project' ? CC_MEGA
               : sector === 'industrial'   ? CC_INDUSTRIAL
               :                             CC_CIVIL;
    const key = ccPick(pool);
    const tmpl = CC_TEMPLATES[key];
    if (!tmpl) return false;

    // Budget: random within template range, scaled by GDP growth (0.5×–1.5×)
    const gdpGrowth = Number(nation.gdp_growth ?? 50);
    const gdpScale = 0.5 + gdpGrowth / 100;
    const baseBudget = ccRand(tmpl.budget[0], tmpl.budget[1]);
    const budget = Math.round(baseBudget * gdpScale);
    const timelineMonths = ccRand(tmpl.ticks[0], tmpl.ticks[1]);

    // Requirement thresholds per tier on the 0-10 corp stats (work_crews,
    // supply_chain, regulatory_standing). The bid RPC validates these against
    // the bidder's matching faction columns.
    const requirements = sector === 'mega_project'
        ? { work_crews: 6, supply_chain: 5, regulatory_standing: 5 }
        : sector === 'industrial'
            ? { work_crews: 4, supply_chain: 4, regulatory_standing: 3 }
            : { work_crews: 2, supply_chain: 2 };

    const specCategory = sector === 'mega_project' ? 'Megaproject'
                       : sector === 'industrial'   ? 'Heavy Infrastructure'
                       :                             'Light Infrastructure';
    const projectType  = sector === 'mega_project' ? 'Megaproject'
                       : sector === 'industrial'   ? 'Industrial'
                       :                             'Civil Engineering';
    const sectorPrefix = sector === 'mega_project' ? 'GOV-M'
                       : sector === 'industrial'   ? 'GOV-I'
                       :                             'GOV-C';

    const issuer = CORP_GOV_ISSUERS[Math.floor(Math.random() * CORP_GOV_ISSUERS.length)];
    const seq = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const contractNumber = `${sectorPrefix}-${gameYear}-${seq}`;
    const biddingWindowTicks = 6;

    const { error } = await supabase.from('corp_contracts').insert({
        contract_number:   contractNumber,
        name:              tmpl.name,
        description:       tmpl.desc,
        contract_type:     'GOVERNMENT',
        issuer_name:       issuer,
        issuer_faction_id: null,
        issuer_nation_id:  nation.id,
        required_sector:   'Construction',
        spec_category:     specCategory,
        budget,
        timeline_months:   timelineMonths,
        project_type:      projectType,
        requirements,
        status:            'open',
        created_at_tick:   currentTick,
        expires_at_tick:   currentTick + biddingWindowTicks,
    });
    if (error) {
        console.error(`[corp_contracts gen] ${nation.name}/${sector} insert failed:`, error.message);
        return false;
    }
    return true;
}

// Legacy stubs — see Path 1 Phase 1A cull (2026-05). No new
// construction_contracts rows. The new pipeline writes to
// corp_contracts via generateCorpContractsByGdpTier (called once
// per shard tick). Both stubs stay only because they're still
// referenced from the per-nation construction try-block; they go
// away in Phase 1E along with the legacy table.
async function generateConstructionContracts() { return []; }
async function generateInfraRenewalContracts() { return; }

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
        // No nation filter: subsidiary properties can live in a different
        // nation than their parent corp. Filtering by nation.id here silently
        // skipped those rows — same bug pattern processSubsidiaryRevenue was
        // fixed for at line 1363. Each corp appears in exactly one nation's
        // corps list (its HQ nation), so this runs once per corp per tick.
        const { data: properties, error: propErr } = await supabase
            .from('corp_properties')
            .select('id, monthly_maintenance, condition, capacity, refurbish_until_tick, refurbish_condition, refurbish_count')
            .eq('faction_id', corp.id)
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
                    refurbish_count: (Number(prop.refurbish_count) || 0) + 1,
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
            if (!cashErr) logCashEvent(corp.id, 'maintenance', 'Property maintenance', -totalMaintenance);

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
                updateObj.refurbish_count = upd.refurbish_count;
            }
            const { error: condErr } = await supabase.from('corp_properties').update(updateObj).eq('id', upd.id);
            if (condErr) console.warn(`[PropertyEffects] Condition update failed for property ${upd.id}:`, condErr.message);
        }

        // Total property capacity (base HQ 500 + sum of (capacity × condition))
        // used by the Operational Efficiency calc below. Workforce is NOT
        // auto-trimmed when it exceeds capacity — players should only lose
        // headcount via explicit actions (e.g. selling a property that leaves
        // them over-capacity). A per-tick auto-layoff was previously here and
        // quietly fired employees as property condition decayed; removed.
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

// Regional HQ property income — flat-ish trickle scaled by purchase price.
// 0.2% of purchase price per tick × stability modifier. At a $20M HQ that's
// ~$40k/tick baseline, maintenance is charged separately in PropertyEffects.
const HQ_PROPERTY_INCOME_RATE = 0.002;

async function processSubsidiaryRevenue(supabase, nation, currentTick) {
    const gdpGrowth = Number(nation.gdp_growth ?? 50);

    // Subsidiaries only (role='subsidiary'). Regional HQ properties are
    // handled by processRegionalHqIncome with a different formula.
    // Cross-nation subsidiaries (parent corp in nation A, subsidiary in
    // nation B) are handled by this path via the parent-corp fetch below.
    const { data: hqs, error: hqErr } = await supabase
        .from('corp_properties')
        .select('id, sub_cash, name, faction_id')
        .eq('nation_id', nation.id)
        .eq('role', 'subsidiary')
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
    let skippedCount = 0;
    // Per-HQ try/catch: one bad row (unexpected null, math overflow, bigint
    // coercion failure) was aborting the whole nation's loop, leaving every
    // HQ after the failure silently untouched. The outer catch at the caller
    // only logs "Subsidiary revenue failed for <nation>" once — the HQs in
    // that nation were orphaned. Isolate each HQ so one row can't poison the
    // batch, and include hq.id + faction_id in the error message so the
    // specific failing row is diagnosable from logs alone.
    for (const hq of hqs) {
        try {
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
            if (revenue === 0) { skippedCount += 1; continue; }

            // sub_cash can go negative (subsidiary in debt)
            const newSubCash = subCash + revenue;
            const { error: updErr } = await supabase
                .from('corp_properties')
                .update({ sub_cash: newSubCash })
                .eq('id', hq.id);

            if (updErr) {
                console.warn(`[SubRevenue] Failed to update sub_cash for ${hq.name} (hq.id=${hq.id}, faction_id=${hq.faction_id}):`, updErr.message);
            } else {
                updatedCount += 1;
                console.log(`[SubRevenue] ${corp?.faction_name || '?'} → ${hq.name}: ${revenue >= 0 ? '+' : ''}${revenue.toLocaleString()} (GDP:${gdpGrowth}, parentRep:${parentRep}, repMult:${parentRepMult.toFixed(2)}, overhead:${overhead.toLocaleString()}, cash:${subCash.toLocaleString()} → ${newSubCash.toLocaleString()})`);
            }
        } catch (hqErr) {
            // Isolate the throw so the remaining HQs in this nation still
            // get processed. Include faction_id / hq.id / hq.name so the
            // specific failing row is identifiable from the log alone.
            console.error(`[SubRevenue] HQ threw (hq.id=${hq.id}, faction_id=${hq.faction_id}, name=${hq.name}):`, hqErr);
        }
    }

    console.log(`[SubRevenue] ${nation.name}: processed ${hqs.length} subsidiary(ies), updated ${updatedCount}, skipped(rev=0) ${skippedCount}, at tick ${currentTick}.`);
    return { hqCount: hqs.length, updatedCount, skippedCount };
}

// Regional HQ property income — simple flat-ish income based on purchase price.
// Purpose: a marketplace-purchased HQ is a property, not a business branch, so
// it earns property income (like rent) rather than business revenue. The
// amount is small and predictable — 0.2% of purchase price per tick, modified
// by the nation's stability. No GDP or reputation scaling.
async function processRegionalHqIncome(supabase, nation, currentTick) {
    const stabilityMod = Math.min(1.0, Number(nation.stability ?? 50) / 40);

    const { data: hqs, error: hqErr } = await supabase
        .from('corp_properties')
        .select('id, sub_cash, name, purchase_price')
        .eq('nation_id', nation.id)
        .eq('role', 'regional_hq')
        .eq('is_active', true);

    if (hqErr) throw hqErr;
    if (!hqs || hqs.length === 0) {
        console.log(`[HqIncome] ${nation.name}: processed 0 regional HQ(s) at tick ${currentTick}.`);
        return { hqCount: 0, updatedCount: 0 };
    }

    let updatedCount = 0;
    for (const hq of hqs) {
        try {
            const purchasePrice = Number(hq.purchase_price ?? 0);
            const income = Math.round(purchasePrice * HQ_PROPERTY_INCOME_RATE * stabilityMod);
            if (income <= 0) continue;

            const newSubCash = Number(hq.sub_cash ?? 0) + income;
            const { error: updErr } = await supabase
                .from('corp_properties')
                .update({ sub_cash: newSubCash })
                .eq('id', hq.id);

            if (updErr) {
                console.warn(`[HqIncome] Failed to update sub_cash for ${hq.name} (hq.id=${hq.id}):`, updErr.message);
            } else {
                updatedCount += 1;
                console.log(`[HqIncome] ${hq.name}: +${income.toLocaleString()} (price:${purchasePrice.toLocaleString()}, stabMod:${stabilityMod.toFixed(2)}, cash:${Number(hq.sub_cash ?? 0).toLocaleString()} → ${newSubCash.toLocaleString()})`);
            }
        } catch (hqErr) {
            console.error(`[HqIncome] HQ threw (hq.id=${hq.id}, name=${hq.name}):`, hqErr);
        }
    }

    console.log(`[HqIncome] ${nation.name}: processed ${hqs.length} regional HQ(s), updated ${updatedCount}, at tick ${currentTick}.`);
    return { hqCount: hqs.length, updatedCount };
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH INSURANCE — flavor tables for claim events (Phase 4)
//
// Intentionally generic / Western-neutral so claim headlines read naturally
// in any of the game's nations. Expand or localise later — the processor
// picks a random first × last × condition per claim.
// ═══════════════════════════════════════════════════════════════════════════
const HI_CITIZEN_FIRST_NAMES = [
    'Maria', 'James', 'Linda', 'Michael', 'Patricia', 'Robert', 'Jennifer',
    'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph',
    'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher',
    'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen',
    'Mark', 'Sandra', 'Donald',
];
const HI_CITIZEN_LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
    'Ramirez', 'Lewis', 'Robinson', 'Walker',
];
const HI_CONDITIONS = [
    { key: 'emergency_surgery',        blurb: 'was admitted for emergency surgery after a workplace accident.' },
    { key: 'cancer_treatment',         blurb: 'has been diagnosed with cancer and requires months of chemotherapy.' },
    { key: 'heart_attack',             blurb: 'suffered a heart attack and needs bypass surgery.' },
    { key: 'chronic_illness',          blurb: 'was diagnosed with a chronic autoimmune disease requiring lifetime treatment.' },
    { key: 'accident_trauma',          blurb: 'was hospitalised after a serious car accident.' },
    { key: 'childbirth_complications', blurb: 'is facing complications from a high-risk pregnancy.' },
    { key: 'mental_health',            blurb: 'is in intensive inpatient care for a mental-health crisis.' },
    { key: 'rare_disease',             blurb: 'has a rare genetic condition that requires specialist treatment.' },
    { key: 'stroke_rehab',             blurb: 'is in rehab after a severe stroke.' },
    { key: 'experimental_procedure',   blurb: "is seeking coverage for an experimental procedure no other insurer will approve." },
    { key: 'childhood_illness',        blurb: 'has a child with a serious illness requiring ongoing treatment.' },
    { key: 'organ_transplant',         blurb: 'is awaiting an organ transplant and the pre-op care.' },
];

// Generate a single claim event for a pool. Called once per faction per tick
// from inside processHealthInsurancePools; probability scales with
// policyholder count, severity scales with coverage tier × inflation. No-ops
// if a pending claim already exists for this pool (partial unique index on
// status='pending' also enforces this at the DB level — we catch 23505 to
// stay quiet on the rare race).
async function generateHealthInsuranceClaim(supabase, args) {
    const { poolId, factionId, nationId, policyholders, coverageMult, inflationMult, currentTick } = args;

    // Probability: 1% per 1000 policyholders, capped at 15% per tick.
    // At 10k policyholders ≈ one claim every ~10 ticks; at the cap ≈ every 7.
    const chance = Math.min(0.15, policyholders / 100000);
    if (chance <= 0 || Math.random() >= chance) return false;

    // Bail early if a pending claim already exists for this pool. The
    // partial unique index also rejects duplicates; this check just avoids
    // firing a pointless INSERT + catch.
    const { data: existing, error: exErr } = await supabase
        .from('health_insurance_claims')
        .select('id')
        .eq('pool_id', poolId)
        .eq('status', 'pending')
        .limit(1);
    if (exErr) {
        console.warn(`[HealthIns] pending-claim check failed for pool ${poolId}:`, exErr.message);
        return false;
    }
    if (existing && existing.length > 0) return false;

    // Flavor pick
    const first = HI_CITIZEN_FIRST_NAMES[Math.floor(Math.random() * HI_CITIZEN_FIRST_NAMES.length)];
    const last  = HI_CITIZEN_LAST_NAMES[Math.floor(Math.random() * HI_CITIZEN_LAST_NAMES.length)];
    const age   = 18 + Math.floor(Math.random() * 72);
    const cond  = HI_CONDITIONS[Math.floor(Math.random() * HI_CONDITIONS.length)];

    // Amount: random $50k-$300k base × coverage tier × inflation.
    const baseAmount  = 50000 + Math.floor(Math.random() * 250001);
    const claimAmount = Math.max(1, Math.round(baseAmount * coverageMult * inflationMult));

    const blurb = `${first} ${last} (${age}) ${cond.blurb} A $${claimAmount.toLocaleString()} claim is on your desk.`;

    const { error: insErr } = await supabase
        .from('health_insurance_claims')
        .insert({
            pool_id:       poolId,
            faction_id:    factionId,
            nation_id:     nationId,
            claim_amount:  claimAmount,
            citizen_name:  `${first} ${last}`,
            citizen_age:   age,
            condition_key: cond.key,
            flavor_blurb:  blurb,
            fired_at_tick: currentTick,
        });

    if (insErr) {
        // 23505 = unique_violation — another tick/batch beat us to it. Swallow.
        if ((insErr as any).code !== '23505') {
            console.warn(`[HealthIns] claim insert failed for pool ${poolId}:`, insErr.message);
        }
        return false;
    }

    return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH INSURANCE — Phase 2 tick processor (Phase 3 tier multipliers,
// Phase 4 claim generation)
//
// For each Insurance subsector corporation with an active Insurance Office in
// `nation`, grow (or attrition) the per-(faction, nation) pool of
// policyholders toward an addressable-market cap and credit premium revenue
// into factions.corp_cash_reserves. After the pool update, roll for a claim
// event (1 pending at a time per pool).
//
// Gates (any failing = zero revenue this tick, and no claim fires):
//   – Universal Healthcare Act active in this nation
//   – Corp subsector is not 'insurance' (defence-in-depth)
//   – Corp skilled workforce < 60% of total Insurance Office capacity
//
// All tunable numbers are at the top of the function so a designer can
// re-balance without re-reading the logic.
// ═══════════════════════════════════════════════════════════════════════════
async function processHealthInsurancePools(supabase, nation, currentTick) {
    // ── Tunables ──
    const POLICIES_PER_CAPACITY = 50;       // 50 policyholders per 1 employee capacity
    const BASE_PREMIUM_USD      = 50;       // monthly premium at inflation=50, tier=standard
    const TRICKLE_RATE          = 0.08;     // fraction of (target − current) closed per tick
    const ATTRITION_RATE        = 0.15;     // fraction of (current − target) shed per tick when over cap
    const SKILLED_WORKFORCE_RATIO = 0.60;   // must staff this fraction of office capacity
    const AFFORDABILITY_FLOOR   = 0.05;
    const AFFORDABILITY_CEILING = 0.80;
    const REP_NEUTRAL           = 65;       // rep at which share_multiplier from rep is 1.0

    // Phase 6 — competitive market split. Every operating corp's attractiveness
    // is summed; NEUTRAL_WEIGHT in the denominator is the "always uninsured"
    // slice that no corp can capture (people who refuse, don't trust anyone,
    // etc.). At 0.25, a solo perfect corp caps at ~80%, two equal competitors
    // split to ~44% each, three equal competitors to ~30% each.
    const NEUTRAL_WEIGHT        = 0.25;

    // Phase 3 tier multipliers. Mirror in corp-operations-finance.html —
    // keep the two tables in sync.
    const PREMIUM_TIER_MULT  = { budget: 0.7, standard: 1.0, premium: 1.5 };
    const COVERAGE_TIER_MULT = { basic: 0.6, standard: 1.0, comprehensive: 1.5 };

    // ── Gate 1: Universal Healthcare blocks every pool in this nation ──
    const { data: laws, error: lawsErr } = await supabase
        .from('active_laws')
        .select('policy:policies!policy_id(policy_key)')
        .eq('nation_id', nation.id);
    if (lawsErr) {
        console.warn(`[HealthIns] ${nation.name}: active_laws lookup failed, skipping:`, lawsErr.message);
        return { processed: 0, collected: 0, reason: 'laws_error' };
    }
    const universalActive = (laws || []).some(l => l.policy?.policy_key === 'universal_healthcare');
    if (universalActive) {
        console.log(`[HealthIns] ${nation.name}: Universal Healthcare Act active, no pools processed.`);
        return { processed: 0, collected: 0, reason: 'blocked_universal_healthcare' };
    }

    // ── Load active Insurance Offices in this nation, sum capacity per faction ──
    // Includes refurbish_until_tick so we can exclude offices mid-conversion:
    // when a player converts a generic office via the dashboard's Convert
    // modal, the row's type flips to 'insurance_office' immediately but
    // refurbish_until_tick is set ~4-9 ticks in the future. The property is
    // "offline" during that window — it shouldn't earn premium revenue or
    // count toward the corp's capacity cap until conversion completes.
    const { data: offices, error: offErr } = await supabase
        .from('corp_properties')
        .select('faction_id, capacity, refurbish_until_tick')
        .eq('nation_id', nation.id)
        .eq('type', 'insurance_office')
        .eq('is_active', true);
    if (offErr) throw offErr;
    if (!offices || offices.length === 0) {
        return { processed: 0, collected: 0 };
    }

    const capByFaction: Record<string, number> = {};
    for (const o of offices) {
        const fid = o.faction_id;
        if (!fid) continue;
        // Skip mid-refurbish offices — they're converting, not operating.
        const refurbUntil = Number(o.refurbish_until_tick ?? 0);
        if (refurbUntil > currentTick) continue;
        capByFaction[fid] = (capByFaction[fid] || 0) + Number(o.capacity || 0);
    }
    const factionIds = Object.keys(capByFaction);
    if (factionIds.length === 0) return { processed: 0, collected: 0 };

    // ── Load factions (subsector + skilled workforce + cash reserves) ──
    // Filter out abandoned/bankrupt corps so a defunct faction doesn't keep
    // earning premiums from offices that should be inert. Mirrors the
    // abandoned_at filter in processSubsidiaryRevenue / processCorpMonthlyIncome.
    const { data: factions, error: factErr } = await supabase
        .from('factions')
        .select('id, faction_name, corp_subsector, corp_skilled_workforce, corp_cash_reserves, corp_reputation')
        .in('id', factionIds)
        .is('abandoned_at', null);
    if (factErr) throw factErr;

    // ── Load existing pools for these factions in this nation ──
    const { data: existingPools, error: poolErr } = await supabase
        .from('health_insurance_pools')
        .select('*')
        .eq('nation_id', nation.id)
        .in('faction_id', factionIds);
    if (poolErr) throw poolErr;
    const poolByFaction = Object.fromEntries((existingPools || []).map(p => [p.faction_id, p]));

    // ── Nation-level affordability (single % applied to population) ──
    const population = Number(nation.population ?? 0);
    const poverty    = Number(nation.poverty_rate ?? 50) / 100;
    const unemp      = Number(nation.unemployment ?? 50) / 100;
    const col        = Number(nation.cost_of_living ?? 50);
    const hcAccess   = Number(nation.healthcare_accessibility ?? 50) / 100;
    const inflation  = Number(nation.inflation ?? 50);

    let affordable = 0.40
        - poverty * 0.50
        - unemp   * 0.30
        - ((col - 50) / 100) * 0.15
        - hcAccess * 0.15;
    affordable = Math.max(AFFORDABILITY_FLOOR, Math.min(AFFORDABILITY_CEILING, affordable));
    const addressable = Math.max(0, Math.round(population * affordable));

    // Inflation factor applied to every premium tier. 50→1.0x, 0→0.5x, 100→1.5x.
    const inflationMult = 1 + (inflation - 50) / 100;

    // ── Phase 6: pre-pass to build the competitive attractiveness pool ──
    // Every Insurance subsector corp that passes the staffing gate contributes
    // its attractiveness to the market sum. Understaffed / wrong-subsector
    // corps are not in the market — they get share=0 below, policyholders
    // freeze via the idle branch. The denominator adds NEUTRAL_WEIGHT for the
    // always-uninsured slice, so no corp can ever capture 100% of the market.
    const attractivenessByFaction: Record<string, number> = {};
    for (const f of (factions || [])) {
        if ((f.corp_subsector || '').toLowerCase() !== 'insurance') continue;
        const cap = capByFaction[f.id] || 0;
        const skilledReq = Math.ceil(cap * SKILLED_WORKFORCE_RATIO);
        if (Number(f.corp_skilled_workforce ?? 0) < skilledReq) continue;

        const pool = poolByFaction[f.id];
        const pTier = (pool?.premium_tier  as keyof typeof PREMIUM_TIER_MULT)  || 'standard';
        const cTier = (pool?.coverage_tier as keyof typeof COVERAGE_TIER_MULT) || 'standard';
        const pMult = PREMIUM_TIER_MULT[pTier]  ?? 1.0;
        const cMult = COVERAGE_TIER_MULT[cTier] ?? 1.0;
        const rep   = Number(f.corp_reputation ?? REP_NEUTRAL);
        attractivenessByFaction[f.id] = (cMult / pMult) * (rep / REP_NEUTRAL);
    }
    const sumAttractiveness = Object.values(attractivenessByFaction).reduce((s, a) => s + a, 0);
    const competitiveDenominator = sumAttractiveness + NEUTRAL_WEIGHT;

    let totalCollected = 0;
    let processedCount = 0;

    for (const faction of (factions || [])) {
        try {
            // Gate 2: defence-in-depth subsector check
            if ((faction.corp_subsector || '').toLowerCase() !== 'insurance') {
                console.warn(`[HealthIns] ${faction.faction_name} owns an insurance_office but corp_subsector='${faction.corp_subsector}' — skipping.`);
                continue;
            }

            const capacity = capByFaction[faction.id] || 0;
            const maxPolicyholders = capacity * POLICIES_PER_CAPACITY;

            // Gate 3: skilled-workforce staffing check
            const skilled = Number(faction.corp_skilled_workforce ?? 0);
            const skilledRequired = Math.ceil(capacity * SKILLED_WORKFORCE_RATIO);
            const operatingAllowed = skilled >= skilledRequired;

            const existing = poolByFaction[faction.id];
            const policyholders = existing ? Number(existing.policyholders ?? 0) : 0;

            // Per-pool tier multipliers (default to 'standard' if the pool row
            // doesn't exist yet — a brand-new corp pre-first-tick).
            const premiumTier  = (existing?.premium_tier  as keyof typeof PREMIUM_TIER_MULT)  || 'standard';
            const coverageTier = (existing?.coverage_tier as keyof typeof COVERAGE_TIER_MULT) || 'standard';
            const premiumMult  = PREMIUM_TIER_MULT[premiumTier]   ?? 1.0;
            const coverageMult = COVERAGE_TIER_MULT[coverageTier] ?? 1.0;

            // Premium = base × premium_tier × inflation factor.
            const premium = Math.max(1, Math.round(BASE_PREMIUM_USD * premiumMult * inflationMult));

            // Phase 6 — share of addressable market comes from the competitive
            // split. Non-operating corps (understaffed / wrong subsector) are
            // absent from attractivenessByFaction, so their share is 0 —
            // they'll enter the idle branch below and freeze their
            // policyholders rather than growing or shrinking toward 0.
            const myAttractiveness = attractivenessByFaction[faction.id] ?? 0;
            const yourShare = competitiveDenominator > 0
                ? myAttractiveness / competitiveDenominator
                : 0;

            const target = Math.min(Math.round(addressable * yourShare), maxPolicyholders);

            // Flow:
            //   – Idle (understaffed) → no change in policyholders, zero revenue
            //   – Over cap (office lost, or tier change shrinks share) → attrition
            //   – Otherwise → trickle toward target
            let newPolicyholders: number;
            if (!operatingAllowed) {
                newPolicyholders = policyholders;
            } else if (policyholders > target) {
                newPolicyholders = Math.max(0, Math.round(policyholders - (policyholders - target) * ATTRITION_RATE));
            } else {
                newPolicyholders = Math.round(policyholders + (target - policyholders) * TRICKLE_RATE);
            }

            const revenue = operatingAllowed ? newPolicyholders * premium : 0;

            // ── Upsert the pool row ──
            // Capture poolId from both branches so the claim generator below
            // can FK to it without a separate SELECT round-trip.
            let poolId: string;
            if (existing) {
                poolId = existing.id;
                const newTotal = Number(existing.total_revenue_collected || 0) + revenue;
                const { error: updErr } = await supabase
                    .from('health_insurance_pools')
                    .update({
                        policyholders: newPolicyholders,
                        last_tick_revenue: revenue,
                        last_tick_addressable: addressable,
                        last_tick_premium: premium,
                        total_revenue_collected: newTotal,
                    })
                    .eq('id', existing.id);
                if (updErr) {
                    console.warn(`[HealthIns] pool update failed for ${faction.faction_name} / ${nation.name}:`, updErr.message);
                    continue;
                }
            } else {
                const { data: inserted, error: insErr } = await supabase
                    .from('health_insurance_pools')
                    .insert({
                        faction_id: faction.id,
                        nation_id: nation.id,
                        policyholders: newPolicyholders,
                        last_tick_revenue: revenue,
                        last_tick_addressable: addressable,
                        last_tick_premium: premium,
                        total_revenue_collected: revenue,
                    })
                    .select('id')
                    .single();
                if (insErr || !inserted) {
                    console.warn(`[HealthIns] pool insert failed for ${faction.faction_name} / ${nation.name}:`, insErr?.message);
                    continue;
                }
                poolId = inserted.id;
            }

            // ── Credit revenue (skip the write entirely when zero) ──
            if (revenue > 0) {
                const currentCash = Number(faction.corp_cash_reserves ?? 0);
                const newCash = currentCash + revenue;
                const { error: cashErr } = await supabase
                    .from('factions')
                    .update({ corp_cash_reserves: newCash })
                    .eq('id', faction.id);
                if (cashErr) {
                    console.warn(`[HealthIns] cash credit failed for ${faction.faction_name}:`, cashErr.message);
                    continue;
                }
                totalCollected += revenue;
            }

            // ── Phase 4: roll for a claim event ──
            // Only operating pools with actual policyholders can generate
            // claims. Idle (understaffed) / blocked pools are dormant.
            let claimFired = false;
            if (operatingAllowed && newPolicyholders > 0) {
                try {
                    claimFired = await generateHealthInsuranceClaim(supabase, {
                        poolId,
                        factionId:    faction.id,
                        nationId:     nation.id,
                        policyholders: newPolicyholders,
                        coverageMult,
                        inflationMult,
                        currentTick,
                    });
                } catch (claimErr) {
                    console.error(`[HealthIns] claim generation threw for ${faction.faction_name}:`, claimErr);
                }
            }

            processedCount += 1;
            const staffStatus = operatingAllowed ? 'OK' : `UNDERSTAFFED(${skilled}/${skilledRequired})`;
            const claimTag = claimFired ? ' [+CLAIM]' : '';
            console.log(`[HealthIns] ${faction.faction_name} / ${nation.name}: ${premiumTier}/${coverageTier} share=${yourShare.toFixed(2)} holders ${policyholders}→${newPolicyholders} (target ${target}, cap ${maxPolicyholders}), premium $${premium}, revenue $${revenue.toLocaleString()} [${staffStatus}]${claimTag}`);
        } catch (factionErr) {
            console.error(`[HealthIns] faction loop threw (faction_id=${faction.id}):`, factionErr);
        }
    }

    return { processed: processedCount, collected: totalCollected, addressable };
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH INSURANCE — Phase 5 lawsuit resolution
//
// Scans health_insurance_lawsuits for rows whose resolution_tick has arrived,
// applies the pre-computed damages (deduct from corp_cash_reserves, drop
// corp_reputation), flips status to 'resolved', and emits a news-feed entry.
//
// The damages and reputation damage are pinned at filing time (inside
// resolve_health_insurance_claim), so drift between filing and verdict can't
// retroactively cheapen or inflate the award — the court has already decided,
// only the timing is delayed.
//
// Called from the per-nation loop after processHealthInsurancePools. Failures
// on any single lawsuit are isolated so they don't poison the batch.
// ═══════════════════════════════════════════════════════════════════════════
async function processHealthInsuranceLawsuits(supabase, nation, currentTick) {
    const { data: ripe, error: lawsuitErr } = await supabase
        .from('health_insurance_lawsuits')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'pending')
        .lte('resolution_tick', currentTick);

    if (lawsuitErr) throw lawsuitErr;
    if (!ripe || ripe.length === 0) return { resolved: 0, damagesPaid: 0 };

    // Load all faction cash + rep values in one hop so we don't N+1 the DB.
    const factionIds = [...new Set(ripe.map(l => l.faction_id))];
    const { data: factions, error: factErr } = await supabase
        .from('factions')
        .select('id, faction_name, corp_cash_reserves, corp_reputation, abandoned_at')
        .in('id', factionIds);
    if (factErr) throw factErr;

    const factionMap = Object.fromEntries((factions || []).map(f => [f.id, f]));

    let resolvedCount = 0;
    let totalDamages  = 0;

    for (const lawsuit of ripe) {
        try {
            const faction = factionMap[lawsuit.faction_id];
            if (!faction) {
                console.warn(`[HealthIns] lawsuit ${lawsuit.id}: faction not found, skipping.`);
                continue;
            }
            // Abandoned corp — the faction is gone in spirit, but the row may
            // still exist (defensive). Mark the lawsuit cancelled rather than
            // drain negative cash from a ghost. If the cancel update fails we
            // log and skip; leaving the row pending would keep the processor
            // retrying the same broken write every tick from now on.
            if (faction.abandoned_at) {
                const { error: cancelErr } = await supabase
                    .from('health_insurance_lawsuits')
                    .update({ status: 'cancelled', resolved_at_tick: currentTick })
                    .eq('id', lawsuit.id);
                if (cancelErr) {
                    console.warn(`[HealthIns] lawsuit ${lawsuit.id}: cancel update failed (abandoned faction):`, cancelErr.message);
                }
                continue;
            }

            const damages = Number(lawsuit.damages_amount || 0);
            const repHit  = Number(lawsuit.reputation_damage || 0);

            const curCash = Number(faction.corp_cash_reserves || 0);
            const curRep  = Number(faction.corp_reputation ?? 65);
            const newCash = curCash - damages;
            const newRep  = Math.max(0, Math.min(100, curRep + repHit));

            const { error: factionUpdErr } = await supabase
                .from('factions')
                .update({ corp_cash_reserves: newCash, corp_reputation: newRep })
                .eq('id', faction.id);
            if (factionUpdErr) {
                console.warn(`[HealthIns] lawsuit ${lawsuit.id}: faction update failed:`, factionUpdErr.message);
                continue;
            }
            // Keep the in-memory copy in sync so if the same faction has
            // multiple ripe lawsuits in this nation, later deductions see
            // the already-reduced balance.
            faction.corp_cash_reserves = newCash;
            faction.corp_reputation    = newRep;

            const { error: lawsuitUpdErr } = await supabase
                .from('health_insurance_lawsuits')
                .update({ status: 'resolved', resolved_at_tick: currentTick })
                .eq('id', lawsuit.id);
            if (lawsuitUpdErr) {
                console.warn(`[HealthIns] lawsuit ${lawsuit.id}: status update failed:`, lawsuitUpdErr.message);
                continue;
            }

            // News-feed entry. trigger_key lets the feed filter these out for
            // other lawsuits later (and matches the pattern used by the
            // bankruptcy RPC).
            const damagesLabel = damages >= 1_000_000
                ? '$' + (damages / 1_000_000).toFixed(1) + 'M'
                : '$' + Math.round(damages / 1000).toLocaleString() + 'k';

            try {
                await supabase.from('event_log').insert({
                    nation_id:        nation.id,
                    faction_id:       faction.id,
                    event_name:       `${faction.faction_name} — Insurance Lawsuit Settled`,
                    description_used: `${faction.faction_name} was ordered to pay ${damagesLabel} in damages to ${lawsuit.citizen_name} after denying a health insurance claim. Reputation fell by ${Math.abs(repHit)} points.`,
                    category:         'corporate',
                    trigger_key:      'health_insurance_lawsuit_resolved',
                    effects_applied:  {
                        lawsuit_id:     lawsuit.id,
                        damages_amount: damages,
                        rep_damage:     repHit,
                        new_reputation: newRep,
                        citizen_name:   lawsuit.citizen_name,
                    },
                    fired_at_tick:    currentTick,
                });
            } catch (eventErr) {
                // Non-fatal — the lawsuit is still resolved, just no news entry.
                console.warn(`[HealthIns] lawsuit ${lawsuit.id}: event_log insert failed:`, eventErr?.message || eventErr);
            }

            resolvedCount += 1;
            totalDamages  += damages;
            console.log(`[HealthIns] Lawsuit resolved: ${faction.faction_name} / ${nation.name}: -$${damages.toLocaleString()} damages to ${lawsuit.citizen_name}, rep ${curRep}→${newRep}`);
        } catch (lawsuitLoopErr) {
            console.error(`[HealthIns] lawsuit loop threw (lawsuit_id=${lawsuit.id}):`, lawsuitLoopErr);
        }
    }

    return { resolved: resolvedCount, damagesPaid: totalDamages };
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

// Idempotent stall increment. Each gate (start permit, workforce, materials)
// previously did its own update — under the per-minute cron + background-tasks
// pattern, processActiveProjects can run multiple times against the same shard
// tick, double-counting stalls. Routing every increment through this helper
// guarantees one bump per (contract, currentTick) pair.
async function bumpStalledTickOnce(supabase, contract, currentTick) {
    if (contract.last_stalled_tick === currentTick) return;
    await supabase.from('construction_contracts')
        .update({
            stalled_ticks: Number(contract.stalled_ticks || 0) + 1,
            last_stalled_tick: currentTick,
        })
        .eq('id', contract.id);
    contract.last_stalled_tick = currentTick;
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

        // Filter bids by permit qualification: only bidders holding all
        // required permits in the host nation can win. This pre-empts the
        // post-award start gate, so a contract either finds a qualifying
        // bidder or expires — it can't get stuck in 'awarded' with missing
        // permits.
        const requiredPermitKeys = await getRequiredPermitKeysForProject(supabase, nationId, contract.sector, permitScopeCache);
        let qualifiedBids = bids!;
        if (requiredPermitKeys.length > 0) {
            const bidderIds = [...new Set(bids!.map(b => b.faction_id))];
            const heldQuery = supabase.from('corp_permits')
                .select('faction_id, permit_key')
                .eq('nation_id', nationId)
                .eq('status', 'active');
            const { data: heldRows, error: heldErr } = bidderIds.length === 1
                ? await heldQuery.eq('faction_id', bidderIds[0])
                : await heldQuery.in('faction_id', bidderIds);
            if (heldErr) {
                // SELECT failure means we can't verify any bidder qualifies.
                // Skip resolution this tick rather than silently expiring a
                // contract or awarding to an unverified bidder; let the next
                // tick retry once whatever caused the error has cleared.
                console.warn(`[ResolveBids] corp_permits select failed for contract ${contract.id}: ${heldErr.message}; deferring resolution.`);
                continue;
            }
            const heldByFaction = new Map();
            for (const row of (heldRows || [])) {
                if (!heldByFaction.has(row.faction_id)) heldByFaction.set(row.faction_id, new Set());
                heldByFaction.get(row.faction_id).add(row.permit_key);
            }
            qualifiedBids = bids!.filter(b => {
                const held = heldByFaction.get(b.faction_id) || new Set();
                return requiredPermitKeys.every(k => held.has(k));
            });
        }

        if (qualifiedBids.length === 0) {
            // No bid holds the required permits. Wait for more qualifying
            // bids while the bidding window is open; expire the contract
            // once it closes.
            if (timerExpired) {
                await supabase.from('construction_contracts')
                    .update({ status: 'expired' })
                    .eq('id', contract.id);
                await supabase.from('contract_bids')
                    .update({ status: 'lost' })
                    .eq('contract_id', contract.id);
                results.push({ contract: contract.name, result: 'expired', reason: 'no_qualified_bids' });
            }
            continue;
        }

        // Select winner from qualified bids: 50% lowest price, 50% highest
        // quality. Rewards player strategy — undercut on cost or invest
        // in quality.
        const sortedQualified = qualifiedBids.slice().sort((a, b) => (a.bid_price || 0) - (b.bid_price || 0));
        const roll = Math.random();
        let winner;
        let method: string;
        if (roll < 0.50) {
            winner = sortedQualified[0];
            method = 'lowest_price';
        } else {
            winner = sortedQualified.reduce((best, b) => (b.estimated_quality || 0) > (best.estimated_quality || 0) ? b : best, sortedQualified[0]);
            method = 'highest_quality';
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
        .select('id, name, awarded_to_faction, awarded_at_tick, stalled_ticks, last_stalled_tick, sector')
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
            await bumpStalledTickOnce(supabase, contract, currentTick);
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
        .select('id, name, awarded_to_faction, awarded_at_tick, timeline_ticks, budget_ceiling, completed_at_tick, stalled_ticks, last_stalled_tick, current_phase, sector, required_materials, required_equipment, required_workforce, materials_consumed, equipment_condition, workers_assigned, modifiers, template_key, project_subtype, issuer_faction_id')
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
            await bumpStalledTickOnce(supabase, contract, currentTick);
            console.log(`[Projects] ${contract.name}: STALLED — understaffed (need G${wfReqGeneral}/S${wfReqSkilled}/I${wfReqInnovative}, assigned G${wfHasGeneral}/S${wfHasSkilled}/I${wfHasInnovative})`);
            continue;
        }

        // Material gate: check if allocated materials meet requirements for next tick of progress.
        //
        // Materials are only physically consumed once construction begins.
        // Permits and Planning are administrative phases — no concrete poured,
        // no steel erected — so the material allocation requirement is
        // suppressed until the project enters the Foundation phase.
        const _projectPhase = contract.current_phase || getPhaseForProgress(effectiveProgress / Math.max(1, totalTicks));
        const _phaseNeedsMaterials = _projectPhase !== 'Permits' && _projectPhase !== 'Planning';
        const reqMaterials = contract.required_materials || {};
        const contractAllocs = allocMap[contract.id] || {};
        const matKeys = Object.keys(reqMaterials);
        let materialsReady = true;
        if (_phaseNeedsMaterials && matKeys.length > 0) {
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
            await bumpStalledTickOnce(supabase, contract, currentTick);
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
                logCashEvent(bid.faction_id, 'event_cost', `Project: ${contract.name || 'Unnamed'}`, -perTickCost);
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
                            logCashEvent(bond.lender_faction_id, 'revenue_finance', 'Bond principal recovered', Number(bond.principal));
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

            // Release equipment that was deployed to this contract. Without
            // this block, corp_equipment rows kept stale assigned_projects
            // entries pointing at completed contracts — making those units
            // permanently "deployed" on something that no longer needs them
            // and preventing redeployment to the next project.
            try {
                if (contract.awarded_to_faction) {
                    const { data: eqRows } = await supabase
                        .from('corp_equipment')
                        .select('id, equipment_key, deployed, assigned_projects')
                        .eq('faction_id', contract.awarded_to_faction);

                    for (const eq of (eqRows || [])) {
                        const assignments = Array.isArray(eq.assigned_projects) ? eq.assigned_projects : [];
                        const thisContractAssignment = assignments.find(a => a?.contract_id === contract.id);
                        if (!thisContractAssignment) continue;

                        const unitsToRelease = Number(thisContractAssignment.units) || 0;
                        const newAssignments = assignments.filter(a => a?.contract_id !== contract.id);
                        const newDeployed = Math.max(0, Number(eq.deployed || 0) - unitsToRelease);

                        const { error: relErr } = await supabase.from('corp_equipment')
                            .update({ deployed: newDeployed, assigned_projects: newAssignments })
                            .eq('id', eq.id);
                        if (relErr) {
                            console.warn(`[Projects] Equipment release failed for ${eq.equipment_key} on ${contract.name}:`, relErr.message);
                        } else {
                            console.log(`[Projects] Released ${unitsToRelease} ${eq.equipment_key} from completed ${contract.name}`);
                        }
                    }
                }
            } catch (eqErr) {
                console.warn(`[Projects] Equipment release block threw for ${contract.name} (non-fatal):`, eqErr?.message || eqErr);
            }

            // Close any active insurance policies for this completed project
            try {
                // Find all insurance requests linked to this contract. The live
                // loan row (finance_active_loans) already carries the real policy
                // status — gating here on request.status hid every policy from
                // closure because nothing in production ever set request.status
                // to 'funded'. Rely on the loan-side status filter at line 2101.
                const { data: insReqs, error: insReqErr } = await supabase
                    .from('finance_loan_requests')
                    .select('id')
                    .eq('request_type', 'insurance')
                    .eq('insured_contract_id', contract.id);
                if (insReqErr) throw insReqErr;

                const linkedRequestIds = (insReqs || []).map((r) => r.id).filter(Boolean);
                let linkedPoliciesFound = 0;
                let linkedPoliciesClosed = 0;

                if (linkedRequestIds.length > 0) {
                    const closableStatuses = ['current', 'late', 'delinquent'];
                    const { data: linkedPolicies, error: linkedPoliciesErr } = await supabase
                        .from('finance_active_loans')
                        .select('id, status')
                        .in('request_id', linkedRequestIds)
                        .in('status', closableStatuses);
                    if (linkedPoliciesErr) throw linkedPoliciesErr;

                    linkedPoliciesFound = (linkedPolicies || []).length;

                    if (linkedPoliciesFound > 0) {
                        const { data: updatedPolicies, error: closeErr } = await supabase
                            .from('finance_active_loans')
                            .update({
                                status: 'repaid',
                                completed_tick: currentTick,
                            })
                            .in('request_id', linkedRequestIds)
                            .in('status', closableStatuses)
                            .select('id');
                        if (closeErr) throw closeErr;
                        linkedPoliciesClosed = (updatedPolicies || []).length;
                    }
                }

                console.log(
                    `[Projects] Insurance cleanup for completed project ${contract.name} (${contract.id}): ` +
                    `${linkedRequestIds.length} insurance request(s), ${linkedPoliciesFound} closable policy/policies found, ${linkedPoliciesClosed} closed`
                );

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
                    logCashEvent(bid.faction_id, 'revenue_market', 'Contract bid payment', actualPayment);
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
                // Refund contract value back to nation (corp must pay) — reverses
                // the payment the corp collected on delivery in the same tick.
                const collapseRefund = payment;
                logCashEvent(bid.faction_id, 'event_cost', 'Project collapse refund', -collapseRefund);
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
                    logCashEvent(policy.lender_faction_id, 'event_cost', 'Subsidiary policy claim', -adjustedCost);
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
                        logCashEvent(event.faction_id, 'event_cost', 'Insurance deductible', -deductibleAmt);
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
                logCashEvent(event.faction_id, 'event_cost', 'Contract event cost', -costApplied);
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
//  NEW PIPELINE: corp_contract_events
//
//  Path 1 Phase 1B retarget. Mirrors the legacy generateProjectEvents +
//  resolveExpiredEvents pair but reads from corp_contracts and writes to
//  corp_contract_events. Both old + new run concurrently during the drain;
//  the legacy pair dies with construction_contracts in Phase 1E.
//
//  Differences from the legacy version:
//    - Status filter: corp_contracts uses 'active', not 'in_progress'.
//    - Faction column: winner_faction_id, not awarded_to_faction.
//    - Sector match: corp_contracts.project_type is "Civil Engineering" /
//      "Industrial" / "Megaproject" (display form). The event catalog's
//      appliesTo uses 'civil_engineering' / 'industrial' / 'mega_project'
//      (snake_case keys). projectTypeToSectorKey() bridges them.
//    - The legacy material-grade regulatory branch is dropped — the new
//      bid pipeline (corp_contract_bids) doesn't track material_grades
//      yet. Permit-compliance regulatory branch is kept since corp_permits
//      is shared by both pipelines.
//    - resolveExpiredCorpContractEvents is simpler than its legacy
//      counterpart: no insurance integration, no claims-office reductions
//      (those rely on the dead finance_active_loans table). Just apply
//      response effect, flip to EXPIRED. Insurance will be re-added when
//      the new bank_loans pipeline grows insurance products.
//
//  Intentional duplication: ~90% of the template-iteration / probability /
//  permit-modifier logic mirrors the legacy generator. Refactoring into a
//  shared helper now would be undone in Phase 1E when the legacy version
//  is deleted, so the duplication is parked here on purpose.
//
//  Within this function, the "build response array + insert event row"
//  pattern repeats across three branches (main template / permit-compliance
//  regulatory / Phase 1C gap roll). Two of those use ALL_EVENT_TEMPLATES
//  shape; the third uses REGULATORY_EVENTS shape. Extraction would either
//  bridge two source-catalog shapes in one helper (more complex than the
//  inline duplication) or only dedupe two of three branches (low net win).
//  Left inline; revisit if a fourth branch ever lands.
//
//  Known carry-overs (not regressions): two read-modify-write patterns
//  (corp_reputation update on regulatory hits; corp_cash_reserves debit on
//  expired-event cost) inherit the legacy code's race window between
//  SELECT and UPDATE. Concurrent updates between the two queries would
//  lose changes. Low-frequency code paths; legacy has identical issue.
//  Refactor target when these paths move into a SECURITY DEFINER RPC.
// ════════════════════════════════════════════════════════════════════════════════

function projectTypeToSectorKey(projectType) {
    if (!projectType) return null;
    const norm = String(projectType).toLowerCase().replace(/\s+/g, '_');
    return norm === 'megaproject' ? 'mega_project' : norm;
}

// Gap-roll helpers. An event template counts as "negative" (incident-
// suitable) if any of its effect dimensions hurts the corp. Used to
// filter the catalog when the regulatory-gap roll picks a random event;
// firing positive_inspection because a corp is below its regulatory
// requirement would be incoherent.
function isNegativeEvent(template) {
    const e = template.effects || {};
    return (Number(e.cost) > 0)
        || (Number(e.delay) > 0)
        || (Number(e.quality) < 0)
        || (Number(e.phaseProgress) < 0)
        || (Number(e.reputation) < 0);
}

// Computes a corp's effective regulatory standing on a specific contract.
// Live evaluation per spec: re-read each tick from the corp's current
// stat plus held permits, minus required-but-missing permits.
function computeEffectiveRegulatoryStanding({
    factionId, regStanding, sectorKey, requiredPermits,
    permitsByFaction, permitDefMap,
}) {
    let effective = Number(regStanding) || 0;
    const heldPermits = permitsByFaction[factionId] || new Set();

    // +regulatory_bonus from held permits whose applies_to matches the
    // project's sector. Empty applies_to means "applies to all sectors".
    for (const permitKey of heldPermits) {
        const def = permitDefMap[permitKey];
        if (!def) continue;
        const appliesTo = def.applies_to || [];
        const matches = appliesTo.length === 0 || appliesTo.includes(sectorKey);
        if (matches) effective += def.regulatory_bonus;
    }

    // −1 per required permit the corp doesn't hold.
    for (const reqKey of (requiredPermits || [])) {
        if (!heldPermits.has(reqKey)) effective -= 1;
    }

    return effective;
}

async function generateCorpContractProjectEvents(supabase, nationId, currentTick) {
    const results = [];
    const permitScopeCache = {};

    // Load active corp_contracts on this nation. Includes timeline_months
    // (denominator for per-tick gap probability) and requirements (source
    // of regulatory_standing threshold + required_permits list).
    const { data: contracts } = await supabase
        .from('corp_contracts')
        .select('id, name, current_phase, project_type, winner_faction_id, timeline_months, requirements')
        .eq('issuer_nation_id', nationId)
        .eq('status', 'active');

    if (!contracts || contracts.length === 0) return results;

    const { data: nation } = await supabase
        .from('nations')
        .select('stability, inflation, corruption, civil_unrest, pollution, happiness, physical_infrastructure')
        .eq('id', nationId)
        .single();
    const ns = (key) => Number(nation?.[key] ?? 50);

    // Pre-fetch bidder corp_regulatory_standing for the gap math. One
    // batch query keyed by all winner_faction_ids on this nation's
    // active contracts.
    const factionIds = [...new Set(contracts.map(c => c.winner_faction_id).filter(Boolean))];
    const regStandingByFaction = {};
    if (factionIds.length > 0) {
        const { data: bidders, error: biddersErr } = await supabase
            .from('factions')
            .select('id, corp_regulatory_standing')
            .in('id', factionIds);
        if (biddersErr) {
            console.warn(`[CorpEvents] Bidder reg-standing fetch failed for nation ${nationId}:`, biddersErr.message);
        }
        for (const b of (bidders || [])) {
            regStandingByFaction[b.id] = Number(b.corp_regulatory_standing || 0);
        }
    }

    // Permit modifiers + bonuses + applies_to. Same lookup as legacy
    // serves both the event-modifier pipeline AND the new effective-
    // standing math (regulatory_bonus, applies_to).
    const _permitEventMods = {};
    const permitDefMap = {};        // permit_key -> { event_modifiers, regulatory_bonus, applies_to }
    const permitsByFaction = {};    // faction_id -> Set<permit_key>
    try {
        if (factionIds.length > 0) {
            const { data: activePermits } = await supabase
                .from('corp_permits')
                .select('faction_id, permit_key')
                .in('faction_id', factionIds)
                .eq('status', 'active');
            if (activePermits && activePermits.length > 0) {
                const permitKeys = [...new Set(activePermits.map(p => p.permit_key))];
                const { data: defs, error: defsErr } = await supabase.from('construction_permits')
                    .select('permit_key, event_modifiers, regulatory_bonus, applies_to')
                    .in('permit_key', permitKeys);
                if (defsErr) {
                    // Without this warning, a failed permit-defs fetch silently
                    // zeroes both permit event modifiers AND regulatory bonuses
                    // — every corp would look unprotected.
                    console.warn(`[CorpEvents] Permit defs fetch failed for nation ${nationId}:`, defsErr.message);
                }
                for (const d of (defs || [])) {
                    permitDefMap[d.permit_key] = {
                        event_modifiers:  d.event_modifiers || {},
                        regulatory_bonus: Number(d.regulatory_bonus || 0),
                        applies_to:       d.applies_to || [],
                    };
                }
                for (const p of activePermits) {
                    if (!permitsByFaction[p.faction_id]) permitsByFaction[p.faction_id] = new Set();
                    permitsByFaction[p.faction_id].add(p.permit_key);

                    if (!_permitEventMods[p.faction_id]) _permitEventMods[p.faction_id] = {};
                    const mods = (permitDefMap[p.permit_key] || {}).event_modifiers || {};
                    for (const [eventKey, multiplier] of Object.entries(mods)) {
                        const current = _permitEventMods[p.faction_id][eventKey];
                        _permitEventMods[p.faction_id][eventKey] = current !== undefined ? Math.min(current, multiplier) : multiplier;
                    }
                }
            }
        }
    } catch (_pemErr) { /* non-fatal */ }

    // Active-event dedup against corp_contract_events. If this query
    // fails, hasActiveEvent stays empty — without that warning it would
    // silently produce duplicate events on the same contract.
    const contractIds = contracts.map(c => c.id);
    const { data: activeEvents, error: activeEventsErr } = await supabase
        .from('corp_contract_events')
        .select('contract_id')
        .in('contract_id', contractIds)
        .eq('status', 'ACTIVE');
    if (activeEventsErr) {
        console.warn(`[CorpEvents] Active-event dedup query failed for nation ${nationId}; proceeding without dedup:`, activeEventsErr.message);
    }
    const hasActiveEvent = new Set((activeEvents || []).map(e => e.contract_id));

    for (const contract of contracts) {
        if (hasActiveEvent.has(contract.id)) continue;

        const phase = contract.current_phase || 'Permits';
        const sectorKey = projectTypeToSectorKey(contract.project_type);

        for (const template of ALL_EVENT_TEMPLATES) {
            if (!template.appliesTo.includes('all') && !template.appliesTo.includes(sectorKey)) continue;

            const allowedPhases = PHASE_WINDOW_LOOKUP[template.phaseWindow] || PHASE_WINDOWS.ANY;
            if (!allowedPhases.includes(phase)) continue;

            let prob = template.probability;
            for (const mod of (template.statModifiers || [])) {
                const statVal = ns(mod.stat);
                if (mod.direction === 'above' && statVal > mod.baseline) {
                    prob += (statVal - mod.baseline) * mod.perPoint;
                } else if (mod.direction === 'below' && statVal < mod.baseline) {
                    prob += (mod.baseline - statVal) * Math.abs(mod.perPoint);
                }
            }
            prob = Math.max(0, Math.min(0.5, prob));

            if (_permitEventMods && _permitEventMods[contract.winner_faction_id]) {
                const mods = _permitEventMods[contract.winner_faction_id];
                if (mods[template.key] !== undefined) prob *= mods[template.key];
            }

            if (Math.random() > prob) continue;

            const responses = [{
                key: 'acknowledge',
                label: 'Acknowledged',
                tag: template.severity,
                detail: template.impact,
                cost: template.effects.cost || 0,
                delay: template.effects.delay || 0,
                qualityImpact: template.effects.quality || 0,
            }];

            const { error: insertErr } = await supabase.from('corp_contract_events').insert({
                contract_id: contract.id,
                faction_id: contract.winner_faction_id,
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
                expires_at_tick: currentTick + 3,
            });

            if (insertErr) {
                console.warn(`[CorpEvents] Failed to create event ${template.key} for ${contract.name}:`, insertErr.message);
            } else {
                results.push({ contract: contract.name, event: template.title, severity: template.severity });
            }
            break; // Max 1 event per project per tick.
        }

        // Permit-compliance regulatory branch (no material_grades — that
        // table doesn't exist on the new pipeline yet).
        if (!results.some(r => r.contract === contract.name)) {
            try {
                const permitSnapshot = await getPermitComplianceSnapshot(supabase, {
                    nationId,
                    sector: sectorKey,
                    factionId: contract.winner_faction_id,
                    contractId: contract.id,
                    checkpoint: 'events',
                    cache: permitScopeCache,
                });
                const missingPermits = permitSnapshot.missingPermitKeys;
                const missingCount = missingPermits.length;

                let regEvent = null;
                if (missingCount >= 3 && Math.random() < 0.25) {
                    regEvent = REGULATORY_EVENTS.stop_work_order;
                } else if (missingPermits.includes('ohs_compliance') || missingPermits.includes('working_hours')) {
                    if (Math.random() < 0.15) regEvent = REGULATORY_EVENTS.worker_whistleblower;
                } else if (missingCount >= 1 && Math.random() < 0.12) {
                    regEvent = REGULATORY_EVENTS.regulatory_inspection;
                }

                if (regEvent) {
                    const responses = [{
                        key: 'acknowledge', label: 'Acknowledged', tag: regEvent.severity,
                        detail: regEvent.description,
                        cost: regEvent.cost, delay: regEvent.delay, qualityImpact: regEvent.quality,
                    }];
                    const { error: regInsertErr } = await supabase.from('corp_contract_events').insert({
                        contract_id: contract.id,
                        faction_id: contract.winner_faction_id,
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
                    if (regInsertErr) {
                        console.warn(`[CorpEvents] Failed to create regulatory event for ${contract.name}:`, regInsertErr.message);
                    } else {
                        results.push({ contract: contract.name, event: regEvent.name, severity: regEvent.severity });

                        // Apply reputation penalty immediately (same as legacy).
                        if (regEvent.reputation && regEvent.reputation < 0) {
                            const { data: corp } = await supabase.from('factions')
                                .select('corp_reputation').eq('id', contract.winner_faction_id).single();
                            await supabase.from('factions').update({
                                corp_reputation: Math.max(0, Number(corp?.corp_reputation ?? 5) + regEvent.reputation),
                            }).eq('id', contract.winner_faction_id);
                        }
                    }
                }
            } catch (_regErr) { /* non-fatal */ }
        }

        // ── Regulatory-gap incident roll (Phase 1C). ──
        // Live evaluation: each tick, recompute effective standing from
        // the corp's current corp_regulatory_standing + permit bonuses
        // − missing-required-permit penalty. Spec: lifetime probability
        // of an incident attributable to the gap is min(0.90, 0.15 × gap).
        // Spread over the contract's timeline_months as per-tick rolls.
        if (!results.some(r => r.contract === contract.name)) {
            const reqs = contract.requirements || {};
            const requiredStanding = Number(reqs.regulatory_standing || 0);
            if (requiredStanding > 0 && contract.winner_faction_id) {
                const factionRegStanding = regStandingByFaction[contract.winner_faction_id] ?? 0;
                const requiredPermits = Array.isArray(reqs.required_permits) ? reqs.required_permits : [];
                const effective = computeEffectiveRegulatoryStanding({
                    factionId:        contract.winner_faction_id,
                    regStanding:      factionRegStanding,
                    sectorKey,
                    requiredPermits,
                    permitsByFaction,
                    permitDefMap,
                });
                const gap = Math.max(0, requiredStanding - effective);
                if (gap > 0) {
                    const lifetimeProb = Math.min(0.90, 0.15 * gap);
                    // Denominator: original contract timeline. Approximate;
                    // good enough for typical gaps. Tune later if needed.
                    const timelineTicks = Math.max(1, Number(contract.timeline_months || 60));
                    const perTickProb = lifetimeProb / timelineTicks;
                    if (Math.random() < perTickProb) {
                        // Pool: any catalog event whose sector + phase match
                        // this contract AND whose effects are negative.
                        // Excludes positive_inspection-style positive events
                        // since those firing because a corp is under-regulated
                        // would be incoherent.
                        //
                        // If the pool is empty (no catalog event applies to
                        // this sector+phase combo), the roll silently no-ops.
                        // The 26-event catalog covers most combinations so
                        // this is rare; player just feels lucky.
                        const eligible = ALL_EVENT_TEMPLATES.filter(t => {
                            if (!t.appliesTo.includes('all') && !t.appliesTo.includes(sectorKey)) return false;
                            const allowedPhases = PHASE_WINDOW_LOOKUP[t.phaseWindow] || PHASE_WINDOWS.ANY;
                            if (!allowedPhases.includes(phase)) return false;
                            return isNegativeEvent(t);
                        });
                        if (eligible.length > 0) {
                            const tmpl = eligible[Math.floor(Math.random() * eligible.length)];
                            const responses = [{
                                key: 'acknowledge',
                                label: 'Acknowledged',
                                tag: tmpl.severity,
                                detail: tmpl.impact,
                                cost: tmpl.effects.cost || 0,
                                delay: tmpl.effects.delay || 0,
                                qualityImpact: tmpl.effects.quality || 0,
                            }];
                            const { error: gapInsertErr } = await supabase.from('corp_contract_events').insert({
                                contract_id: contract.id,
                                faction_id:  contract.winner_faction_id,
                                nation_id:   nationId,
                                event_key:   tmpl.key,
                                type:        tmpl.type,
                                severity:    tmpl.severity,
                                title:       tmpl.title,
                                description: tmpl.desc,
                                impact:      tmpl.impact,
                                responses,
                                status:           'ACTIVE',
                                fired_at_tick:    currentTick,
                                expires_at_tick:  currentTick + 3,
                            });
                            if (gapInsertErr) {
                                console.warn(`[CorpEvents] Gap-driven event insert failed for ${contract.name}:`, gapInsertErr.message);
                            } else {
                                results.push({
                                    contract: contract.name,
                                    event:    tmpl.title,
                                    severity: tmpl.severity,
                                    source:   'regulatory_gap',
                                    gap,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    return results;
}

async function resolveExpiredCorpContractEvents(supabase, nationId, currentTick) {
    const results = [];

    const { data: expired } = await supabase
        .from('corp_contract_events')
        .select('id, contract_id, faction_id, event_key, title, responses, severity')
        .eq('nation_id', nationId)
        .eq('status', 'ACTIVE')
        .lte('expires_at_tick', currentTick);

    if (!expired || expired.length === 0) return results;

    for (const event of expired) {
        const response = event.responses?.[0] || { key: 'auto', cost: 0, delay: 0 };
        const costApplied = Number(response.cost) || 0;
        const delayApplied = Number(response.delay) || 0;
        // qualityImpact is dropped here — corp_contracts has no quality
        // column to apply it to. If quality lands as a contract column
        // later, re-add the read+write here.

        // Apply cash cost directly to the corp. No insurance integration in
        // this phase — when the new bank_loans pipeline grows insurance,
        // this is where the lookup goes.
        // Known race: read-modify-write on corp_cash_reserves; concurrent
        // debits between SELECT and UPDATE would be lost. Same pattern as
        // legacy resolveExpiredEvents. Low-frequency path; safe to live
        // with until SECURITY DEFINER RPC refactor.
        if (costApplied > 0 && event.faction_id) {
            const { data: corp } = await supabase.from('factions')
                .select('corp_cash_reserves').eq('id', event.faction_id).single();
            if (corp) {
                await supabase.from('factions').update({
                    corp_cash_reserves: Math.max(0, Number(corp.corp_cash_reserves || 0) - costApplied),
                }).eq('id', event.faction_id);
            }
        }

        // Apply delay to the contract. expected_finish_tick slips by N ticks.
        if (delayApplied > 0) {
            const { data: contract } = await supabase.from('corp_contracts')
                .select('expected_finish_tick').eq('id', event.contract_id).single();
            if (contract && contract.expected_finish_tick != null) {
                await supabase.from('corp_contracts').update({
                    expected_finish_tick: contract.expected_finish_tick + delayApplied,
                }).eq('id', event.contract_id);
            }
        }

        const { error: updErr } = await supabase.from('corp_contract_events').update({
            status: 'EXPIRED',
            resolved_at_tick: currentTick,
            resolution_choice: response.key || 'auto',
            updated_at: new Date().toISOString(),
        }).eq('id', event.id);
        if (updErr) {
            console.warn(`[CorpEvents] Failed to expire event ${event.title}:`, updErr.message);
            continue;
        }

        results.push({ event: event.title, contract_id: event.contract_id, severity: event.severity });
    }

    return results;
}

// ════════════════════════════════════════════════════════════════════════════════
//  CORPORATION INCOME
// ════════════════════════════════════════════════════════════════════════════════

async function processCorpMonthlyIncome(supabase, nation, corpFactions, currentTick) {
    if (!corpFactions || corpFactions.length === 0) return;

    const ns = (key) => Number(nation[key] ?? 50);

    // Workforce-wages baseline removed (per design). Construction corps
    // still pay per-crew wages via apply_construction_wages_for_nation
    // ('wages' event, "Construction wages" label); other sectors no
    // longer carry a generic monthly headcount payroll.

    // Loan servicing constants (5% annual rate, 10-year amortization).
    // LOAN_ANNUAL_RATE_PCT is in percent form (5 = 5%) so the shared
    // monthlyInterest() helper can be used. monthlyRate is kept in
    // fraction form because the amortization formula on the next
    // step needs (1 + r) compounding.
    const LOAN_ANNUAL_RATE_PCT = 5;
    const LOAN_TERM_MONTHS = 120;
    const monthlyRate = (LOAN_ANNUAL_RATE_PCT / 100) / 12;

    for (const corp of corpFactions) {
        const currentCash = Number(corp.corp_cash_reserves || 0);

        // SOFT INSOLVENCY HALT: when a corp hits $0 cash, monthly operations
        // freeze — no revenue accrues, no wages/exec/overhead/internal-debt/tax
        // are charged, no corp_*_current_tick writes. Cash stays at $0 until
        // something recapitalizes the corp (loan, equity, manual grant), at
        // which point the next tick resumes operations normally.
        // External finance_active_loans run in their own processor and keep
        // ticking — missed-payments accumulate there as designed.
        if (currentCash <= 0) {
            continue;
        }

        const currentLoans = Number(corp.corp_loans || 0);

        // Executive salaries (C-suite: CEO, CFO, COO, CTO, CMO, CLO, Lobbyist)
        const { data: executives } = await supabase.from('corp_executives')
            .select('salary_per_year')
            .eq('faction_id', corp.id)
            .eq('status', 'active');
        const totalExecAnnual = (executives || []).reduce((sum, ex) => sum + (Number(ex.salary_per_year) || 0), 0);
        const monthlyExecSalaries = Math.round(totalExecAnnual / 12);

        // Generic monthly costs collapsed to executive salaries only.
        // Workforce wages and Fixed Overhead were both removed; sector-
        // specific costs (Construction crew wages, per-property
        // maintenance, aircraft ops, etc.) are billed in their own paths.
        const monthlyIncome = -monthlyExecSalaries;

        // Compute monthly loan payment (amortized) and split into interest + principal
        let debtPayment = 0;
        let principalPaid = 0;
        if (currentLoans > 0) {
            const monthlyPayment = Math.round((currentLoans * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -LOAN_TERM_MONTHS)));
            const interestPortion = monthlyInterest(currentLoans, LOAN_ANNUAL_RATE_PCT);
            principalPaid = Math.min(currentLoans, principalPortion(monthlyPayment, interestPortion));
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
        if (updateErr) {
            console.error(`[advance-corp-tick] Income update failed for ${corp.faction_name}:`, updateErr.message);
        } else {
            // Log each P&L component to corp_cash_events, only after the
            // cash write succeeded.
            logCashEvent(corp.id, 'exec_salary',    'Executive salaries',     -monthlyExecSalaries);
            // Debt service is currently lumped — interest + principal under
            // debt_interest. Splitting requires the loan-amortization fields
            // to be plumbed here; deferred to the cleanup phase.
            logCashEvent(corp.id, 'debt_interest',  'Internal debt service',  -debtPayment);
            logCashEvent(corp.id, 'tax',            'Corporate tax',          -taxAmount);
        }

        // Credit corporate tax to the nation's debt reduction
        if (taxAmount > 0) {
            const { data: nationRow } = await supabase.from('nations').select('debt').eq('id', nation.id).single();
            if (nationRow) {
                const newDebt = Math.max(0, Number(nationRow.debt || 0) - taxAmount);
                await supabase.from('nations').update({ debt: newDebt }).eq('id', nation.id);
            }
        }
    }
    console.log(`[advance-corp-tick] Corp income: ${corpFactions.length} corps in ${nation.name}, tax rate=${ns('corporate_tax')}%`);
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

// Keep in sync with js/game/equipment.js so delayed-delivery fulfillment
// computes maintenance/tier exactly the same way as immediate purchases.
const CORP_EQUIPMENT_DEFS = {
    trucks: { tier: 1, maintenancePerUnit: 1500 },
    excavators: { tier: 1, maintenancePerUnit: 5500 },
    bulldozers: { tier: 1, maintenancePerUnit: 7000 },
    mixers: { tier: 1, maintenancePerUnit: 4500 },
    cranes: { tier: 2, maintenancePerUnit: 32500 },
    haulers: { tier: 2, maintenancePerUnit: 15000 },
    piledrivers: { tier: 2, maintenancePerUnit: 18000 },
    asphalt: { tier: 2, maintenancePerUnit: 22000 },
    industrial: { tier: 3, maintenancePerUnit: 85000 },
    tbm: { tier: 3, maintenancePerUnit: 200000 },
    dredge: { tier: 3, maintenancePerUnit: 95000 },
};

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
    // Each delivery is atomic in the DB via the deliver_vessel_order RPC:
    // cash deduct + shipyard credit + vessel insert + order mark-delivered
    // in one transaction. Failure of any step rolls back the others, so the
    // old pattern where a partial failure drained cash on every retry is
    // gone. The RPC returns 'delivered' | 'cancelled' | 'no_op' so the
    // client can accrue in-memory P&L and log the outcome without a second
    // round-trip.
    const { data: dueOrders, error: fetchErr } = await supabase.from('vessel_orders')
        .select('id, faction_id, vessel_name, vessel_class, balance_due')
        .eq('status', 'building')
        .lte('delivery_tick', currentTick);

    if (fetchErr || !dueOrders || dueOrders.length === 0) return;

    for (const order of dueOrders) {
        const { data: result, error: rpcErr } = await supabase.rpc('deliver_vessel_order', {
            p_order_id: order.id,
            p_current_tick: currentTick,
        });
        if (rpcErr) {
            await logShippingWriteFailure(supabase, {
                factionId: order.faction_id,
                vesselName: order.vessel_name,
                operation: 'deliver_vessel_order',
                error: rpcErr,
                currentTick,
            });
            continue;
        }
        if (result === 'delivered') {
            logCashEvent(order.faction_id, 'event_cost', 'Vessel order delivery', -Number(order.balance_due || 0));
            console.log('[Vessel Orders] Delivered ' + order.vessel_name + ' (' + order.vessel_class + ') to ' + order.faction_id);
        } else if (result === 'cancelled') {
            console.log('[Vessel Orders] Order cancelled (insufficient funds) for ' + order.vessel_name);
        }
    }
}

async function processEquipmentDeliveries(supabase, currentTick) {
    const { data: dueDeliveries, error: fetchErr } = await supabase
        .from('corp_equipment_deliveries')
        .select('id, faction_id, equipment_key, quantity, condition')
        .lte('delivery_tick', currentTick);

    if (fetchErr) {
        console.error('[Equipment Deliveries] Failed to fetch due deliveries:', fetchErr.message);
        return;
    }
    if (!dueDeliveries || dueDeliveries.length === 0) return;

    const factionIds = [...new Set(dueDeliveries.map(d => d.faction_id).filter(Boolean))];
    const equipmentKeys = [...new Set(dueDeliveries.map(d => d.equipment_key).filter(Boolean))];

    const nationByFactionId = {};
    if (factionIds.length > 0) {
        const { data: factions, error: facErr } = await supabase
            .from('factions')
            .select('id, nation_id')
            .in('id', factionIds);
        if (facErr) {
            console.warn('[Equipment Deliveries] Could not load faction nation mapping:', facErr.message);
        } else {
            for (const f of (factions || [])) nationByFactionId[f.id] = f.nation_id;
        }
    }

    const equipmentByKey = {};
    if (factionIds.length > 0 && equipmentKeys.length > 0) {
        const { data: existingRows, error: existingErr } = await supabase
            .from('corp_equipment')
            .select('id, faction_id, nation_id, equipment_key, tier, owned, deployed, condition, maintenance_per_tick')
            .in('faction_id', factionIds)
            .in('equipment_key', equipmentKeys);
        if (existingErr) {
            console.warn('[Equipment Deliveries] Could not load existing corp_equipment rows:', existingErr.message);
        } else {
            for (const row of (existingRows || [])) {
                equipmentByKey[`${row.faction_id}:${row.equipment_key}`] = row;
            }
        }
    }

    const successfulIds = [];
    for (const delivery of dueDeliveries) {
        const eqKey = delivery.equipment_key;
        const qty = Math.max(0, Number(delivery.quantity) || 0);
        const incomingCond = Math.max(0, Math.min(100, Number(delivery.condition) || 100));
        const mapKey = `${delivery.faction_id}:${eqKey}`;
        const existing = equipmentByKey[mapKey];
        const def = CORP_EQUIPMENT_DEFS[eqKey];

        try {
            if (!delivery.faction_id || !eqKey || qty <= 0) {
                throw new Error('Invalid delivery payload');
            }

            const oldOwned = Math.max(0, Number(existing?.owned) || 0);
            const oldCondition = Math.max(0, Math.min(100, Number(existing?.condition) || 100));
            const newOwned = oldOwned + qty;
            const newCondition = Math.round(((oldCondition * oldOwned) + (incomingCond * qty)) / newOwned);
            const perUnitMaintenance = Number(def?.maintenancePerUnit)
                || (oldOwned > 0 ? Math.round((Number(existing?.maintenance_per_tick) || 0) / oldOwned) : 0);
            const maintenancePerTick = Math.round(perUnitMaintenance * newOwned);
            const tier = Number(existing?.tier) || Number(def?.tier) || 1;
            const nationId = existing?.nation_id || nationByFactionId[delivery.faction_id] || null;

            if (!nationId) throw new Error('Missing nation_id for faction');
            if (!perUnitMaintenance) throw new Error(`No maintenance definition for equipment_key=${eqKey}`);

            const { data: upsertedRow, error: upsertErr } = await supabase
                .from('corp_equipment')
                .upsert({
                    faction_id: delivery.faction_id,
                    nation_id: nationId,
                    equipment_key: eqKey,
                    tier,
                    owned: newOwned,
                    deployed: Number(existing?.deployed) || 0,
                    condition: newCondition,
                    maintenance_per_tick: maintenancePerTick,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'faction_id,equipment_key' })
                .select('id, faction_id, nation_id, equipment_key, tier, owned, deployed, condition, maintenance_per_tick')
                .single();

            if (upsertErr) throw upsertErr;

            equipmentByKey[mapKey] = upsertedRow || {
                faction_id: delivery.faction_id,
                nation_id: nationId,
                equipment_key: eqKey,
                tier,
                owned: newOwned,
                deployed: Number(existing?.deployed) || 0,
                condition: newCondition,
                maintenance_per_tick: maintenancePerTick,
            };
            successfulIds.push(delivery.id);
        } catch (err) {
            const msg = err?.message || String(err);
            console.error(`[Equipment Deliveries] Failed delivery ${delivery.id} (${delivery.faction_id}/${eqKey}):`, err);
            await supabase.from('event_log').insert({
                nation_id: nationByFactionId[delivery.faction_id] || null,
                faction_id: delivery.faction_id || null,
                event_name: 'Equipment delivery fulfillment failed',
                category: 'corporate',
                description_chosen: `Failed processing equipment delivery ${delivery.id} for ${eqKey}: ${msg}`,
                fired_at_tick: currentTick,
            });
        }
    }

    if (successfulIds.length === 0) return;

    const { error: deleteErr } = await supabase
        .from('corp_equipment_deliveries')
        .delete()
        .in('id', successfulIds);

    if (deleteErr) {
        console.error('[Equipment Deliveries] Failed to delete processed deliveries:', deleteErr.message);
        for (const id of successfulIds) {
            await supabase.from('event_log').insert({
                event_name: 'Equipment delivery cleanup failed',
                category: 'corporate',
                description_chosen: `Processed equipment delivery ${id} but failed to delete queue row: ${deleteErr.message}`,
                fired_at_tick: currentTick,
            });
        }
    } else {
        console.log(`[Equipment Deliveries] Processed ${successfulIds.length} due deliveries`);
    }
}

// ════════════════════════════════════════════════════════════════════════════════
//  FINANCE SECTOR — Loan Processing
// ════════════════════════════════════════════════════════════════════════════════

// L5: Bank loan request + offer expiry. Shard-wide (not per-nation) since
// any borrower from any nation can have a pending request, and the work
// is cheap enough that a single sweep is simpler than a per-nation loop.
//
// Lifecycle:
//   bank_loan_requests.status='pending' AND expires_at_tick <= currentTick
//     → flip request to 'expired'
//     → cascade: every still-pending offer on those requests → 'expired'
//   bank_loan_offers.status='pending' AND expires_at_tick <= currentTick
//     → catch-all flip to 'expired' for orphaned offers (offer's
//       expires_at_tick is set to mirror its parent request's at submit
//       time, so this branch should usually be empty; runs anyway as a
//       defensive sweep so an out-of-band drift can't strand offers)
//
// Idempotent: re-running on the same tick is a no-op because the
// .eq('status', 'pending') filter excludes rows that already terminated.
async function processBankLoanExpiry(supabase, currentTick) {
    const results = { expiredRequests: 0, expiredOffersCascade: 0, expiredOffersOrphan: 0 };
    // Single payload reused across both tables — every expiry update sets
    // the same three columns identically.
    const expirePayload = {
        status: 'expired',
        resolved_at_tick: currentTick,
        updated_at: new Date().toISOString(),
    };

    // 1. Flip pending requests past their expiry to 'expired'.
    const { data: expiredReqs, error: reqErr } = await supabase
        .from('bank_loan_requests')
        .update(expirePayload)
        .eq('status', 'pending')
        .lte('expires_at_tick', currentTick)
        .select('id');
    if (reqErr) {
        console.warn('[BankLoanExpiry] request expiry update failed:', reqErr.message);
        return results;
    }
    results.expiredRequests = expiredReqs?.length || 0;

    // 2. Cascade — every still-pending offer on the expired requests
    //    flips to 'expired' too.
    if (results.expiredRequests > 0) {
        const expiredIds = expiredReqs.map(r => r.id);
        const { data: cascadeOffers, error: cascadeErr } = await supabase
            .from('bank_loan_offers')
            .update(expirePayload)
            .in('request_id', expiredIds)
            .eq('status', 'pending')
            .select('id');
        if (cascadeErr) {
            console.warn('[BankLoanExpiry] offer cascade update failed:', cascadeErr.message);
        } else {
            results.expiredOffersCascade = cascadeOffers?.length || 0;
        }
    }

    // 3. Defensive catch-all for orphan offers whose own expires_at_tick
    //    has passed but whose parent request hasn't (shouldn't happen
    //    given the schema invariant; runs anyway). Also recovers any
    //    rows missed if Step 2 hit a transient failure — those offers
    //    have inherited their parent's now-passed expires_at_tick and
    //    will be caught here.
    const { data: orphanOffers, error: orphanErr } = await supabase
        .from('bank_loan_offers')
        .update(expirePayload)
        .eq('status', 'pending')
        .lte('expires_at_tick', currentTick)
        .select('id');
    if (orphanErr) {
        console.warn('[BankLoanExpiry] orphan offer sweep failed:', orphanErr.message);
    } else {
        results.expiredOffersOrphan = orphanOffers?.length || 0;
    }

    return results;
}

// LRP2: per-tick payment processor for bank_loans (the new counter-
// offer pipeline). Mirrors the ROLE of the legacy processFinanceLoans
// but reads bank_loans, computes amortized payments from the schema's
// principal/apr/term_ticks (no monthly_payment column on the table),
// and uses the LRP1 close_bank_loan helper for terminal transitions.
//
// Per-tick math (simple amortization at 12 ticks/year):
//   r       = (apr / 100) / 12               -- per-tick interest rate
//   payment = P × r × (1+r)^N / ((1+r)^N − 1)  level payment, r > 0
//   payment = P / N                            zero-interest fallback
// The final payment is capped at outstanding + interest_due so a
// rounding remainder doesn't keep the loan alive past maturity.
//
// Status escalation:
//   1 missed → 'late'      (warning state, payment retried next tick)
//   2 missed → 'delinquent'
//   3 missed → 'defaulted' (close_bank_loan('defaulted'))
// Successful payments don't decrement payments_missed — the counter
// is monotonic so escalation is a one-way ratchet.
//
// Borrower-side accounting: payment is logged via logCashEvent (debt
// service category) so it shows in the dashboard's expense breakdown.
// principal portion of the payment also decrements corp_debt so the
// dashboard's Outstanding Debt card amortizes alongside.
async function processBankLoanPayments(supabase, currentTick) {
    const results = {
        processed: 0, paid: 0, missed: 0, defaulted: 0,
        late_escalations: 0, delinquent_escalations: 0,
    };
    const TICKS_PER_YEAR = 12;

    const { data: loans, error: loansErr } = await supabase
        .from('bank_loans')
        .select('id, lender_faction_id, borrower_faction_id, principal, apr, term_ticks, outstanding, payments_missed, status, last_payment_tick')
        .in('status', ['active', 'late', 'delinquent'])
        .or(`last_payment_tick.is.null,last_payment_tick.neq.${currentTick}`);

    if (loansErr) {
        console.warn('[BankLoanPayments] fetch failed:', loansErr.message);
        return results;
    }
    if (!loans || loans.length === 0) return results;

    for (const loan of loans) {
        // Idempotency belt-and-suspenders.
        if (Number(loan.last_payment_tick) === Number(currentTick)) continue;

        const principal  = Number(loan.principal) || 0;
        const apr        = Number(loan.apr) || 0;
        const termTicks  = Number(loan.term_ticks) || 1;
        const outstanding = Number(loan.outstanding) || 0;
        let paymentsMissed = Number(loan.payments_missed) || 0;
        const r = (apr / 100) / TICKS_PER_YEAR;

        let payment;
        if (r > 0) {
            const factor = Math.pow(1 + r, termTicks);
            payment = Math.round(principal * (r * factor) / (factor - 1));
        } else {
            payment = Math.round(principal / Math.max(1, termTicks));
        }
        // Cap final payment at outstanding + interest due so a rounding
        // remainder closes the loan cleanly instead of leaving cents.
        const interestDue = Math.round(outstanding * r);
        if (payment > outstanding + interestDue) payment = outstanding + interestDue;
        const principalPortion = Math.max(0, payment - interestDue);

        const { data: borrower, error: bErr } = await supabase.from('factions')
            .select('corp_cash_reserves, corp_debt')
            .eq('id', loan.borrower_faction_id).single();
        if (bErr || !borrower) {
            console.warn(`[BankLoanPayments] borrower fetch failed for loan ${loan.id}:`, bErr?.message);
            continue;
        }
        const borrowerCash = Number(borrower.corp_cash_reserves) || 0;

        if (borrowerCash >= payment) {
            const newOutstanding = Math.max(0, outstanding - principalPortion);

            // Borrower: deduct cash, decrement debt by principal portion.
            const { error: bUpdErr } = await supabase.from('factions').update({
                corp_cash_reserves: borrowerCash - payment,
                corp_debt:          Math.max(0, (Number(borrower.corp_debt) || 0) - principalPortion),
            }).eq('id', loan.borrower_faction_id);
            if (bUpdErr) {
                console.warn(`[BankLoanPayments] borrower debit failed for loan ${loan.id}:`, bUpdErr.message);
                continue;
            }

            // Lender: credit cash. Read-modify-write same race as the
            // rest of the corp tick loop; service-role bypass keeps the
            // ordering tight. Errors here surface as warnings — the
            // borrower has already been debited, so a failed lender
            // credit means the payment effectively disappears for this
            // tick. Pre-existing money-flow pattern; closing it cleanly
            // would require a SECURITY DEFINER RPC for the whole
            // transaction (carry-over from processFinanceLoans).
            const { data: lender, error: lenderSelErr } = await supabase.from('factions')
                .select('corp_cash_reserves').eq('id', loan.lender_faction_id).single();
            if (lenderSelErr || !lender) {
                console.warn(`[BankLoanPayments] lender fetch failed for loan ${loan.id}:`, lenderSelErr?.message);
            } else {
                const { error: lenderUpdErr } = await supabase.from('factions').update({
                    corp_cash_reserves: (Number(lender.corp_cash_reserves) || 0) + payment,
                }).eq('id', loan.lender_faction_id);
                if (lenderUpdErr) {
                    console.warn(`[BankLoanPayments] lender credit failed for loan ${loan.id}:`, lenderUpdErr.message);
                }
            }

            // Ledger entries — split interest from principal so each side's
            // dashboard shows them as distinct categories. logCashEvent is a
            // no-op for delta=0, so zero-interest or interest-only edges
            // safely skip the irrelevant line.
            const interestPortion = payment - principalPortion;
            logCashEvent(loan.borrower_faction_id, 'debt_interest',  'Loan interest paid',      -interestPortion);
            logCashEvent(loan.borrower_faction_id, 'capital_out',    'Loan principal payment',  -principalPortion);
            logCashEvent(loan.lender_faction_id,   'revenue_finance', 'Loan interest received',  interestPortion);
            logCashEvent(loan.lender_faction_id,   'capital_in',     'Loan principal received',  principalPortion);

            if (newOutstanding <= 0) {
                // Final payment — close as 'paid'. close_bank_loan also
                // zeroes the (already-zero) outstanding, decrements the
                // borrower's corp_debt by 0, and recomputes the lender's
                // hero stats so headroom returns.
                await supabase.rpc('close_bank_loan', {
                    p_loan_id:      loan.id,
                    p_close_status: 'paid',
                });
                results.paid++;
            } else {
                await supabase.from('bank_loans').update({
                    outstanding:        newOutstanding,
                    last_payment_tick:  currentTick,
                    updated_at:         new Date().toISOString(),
                }).eq('id', loan.id);
                // Outstanding shrunk → recompute lender stats (overleverage
                // relaxes, lending headroom improves slightly).
                await supabase.rpc('recompute_finance_stats', { p_faction_id: loan.lender_faction_id });
            }
            results.processed++;
        } else {
            // Missed payment. Increment counter; escalate status.
            paymentsMissed++;
            results.missed++;

            if (paymentsMissed >= 3) {
                await supabase.rpc('close_bank_loan', {
                    p_loan_id:      loan.id,
                    p_close_status: 'defaulted',
                });
                results.defaulted++;
                continue;
            }

            const newStatus = paymentsMissed >= 2 ? 'delinquent' : 'late';
            if (newStatus === 'delinquent' && loan.status !== 'delinquent') results.delinquent_escalations++;
            if (newStatus === 'late'       && loan.status !== 'late')       results.late_escalations++;

            await supabase.from('bank_loans').update({
                payments_missed:    paymentsMissed,
                status:             newStatus,
                last_payment_tick:  currentTick,
                updated_at:         new Date().toISOString(),
            }).eq('id', loan.id);
        }
    }

    return results;
}

// SOP2: per-tick processor for shipping_routes. Three passes in
// strict order (auto-award → maturity → payment) to prevent the
// maturity-tick double-pay edge case. Service-role bypasses RLS.
//
// Pass A — Auto-award. Routes whose bid window has elapsed get a
// winner picked by award_criterion (lowest_price / fastest_delivery
// / lowest_risk). Tiebreaker: earliest created_at_tick. With zero
// bids, the route flips to 'expired'. The winner's offered terms
// snap onto the route (revenue_per_tick + term_ticks) so post-award
// the row reflects the actual deal, not the original ceilings.
//
// Pass B — Maturity sweep. Routes past ends_at_tick flip to
// 'completed'. Runs BEFORE payment so a route maturing on tick T
// doesn't get one extra payment on its last tick.
//
// Pass C — Per-tick payment. Active routes credit revenue_per_tick
// to the winner's cash and emit a revenue_shipping cash event.
// No issuer-side debit yet —
// payments are ambient (printed) for SOP2; private-issuer cash
// deduction is a future concern.
async function processShippingRoutes(supabase, currentTick) {
    const results = {
        awarded: 0, expired: 0, completed: 0, paid: 0,
        bidsAccepted: 0, bidsAutoRejected: 0,
    };

    // ── Pass A: Auto-award ──
    // Trade-agreement contracts (trade_agreement_id IS NOT NULL) are
    // handled by processTradeAgreementShipping — different scoring fields,
    // different payment model, no expiration on zero bids.
    const { data: closingContracts, error: closingErr } = await supabase
        .from('shipping_contracts')
        .select('id, award_criterion, freighters_required, min_fleet_health, max_route_risk, revenue_per_tick, term_ticks')
        .eq('status', 'open')
        .is('trade_agreement_id', null)
        .lte('expires_at_tick', currentTick);

    if (closingErr) {
        console.warn('[ShippingRoutes] closing-contracts fetch failed:', closingErr.message);
    } else if (closingContracts && closingContracts.length > 0) {
        for (const contract of closingContracts) {
            const { data: bids, error: bidsErr } = await supabase
                .from('shipping_contract_bids')
                .select('id, bidder_faction_id, offered_revenue_per_tick, offered_term_ticks, bidder_route_risk_snapshot, created_at_tick')
                .eq('contract_id', contract.id)
                .eq('status', 'pending')
                .order('created_at_tick', { ascending: true });
            if (bidsErr) {
                console.warn(`[ShippingRoutes] bids fetch failed for contract ${contract.id}:`, bidsErr.message);
                continue;
            }

            if (!bids || bids.length === 0) {
                // No bids — flip contract to 'expired'.
                const { error: expErr } = await supabase.from('shipping_contracts').update({
                    status: 'expired',
                    updated_at: new Date().toISOString(),
                }).eq('id', contract.id).eq('status', 'open');
                if (expErr) console.warn(`[ShippingRoutes] expire failed for contract ${contract.id}:`, expErr.message);
                else results.expired++;
                continue;
            }

            // Pick winner by criterion. bids is already sorted
            // ascending by created_at_tick so reduce keeps the
            // first-bid tiebreaker on equal values.
            let winner = bids[0];
            for (let i = 1; i < bids.length; i++) {
                const b = bids[i];
                let winnerScore, candidateScore;
                if (contract.award_criterion === 'fastest_delivery') {
                    winnerScore = Number(winner.offered_term_ticks);
                    candidateScore = Number(b.offered_term_ticks);
                } else if (contract.award_criterion === 'lowest_risk') {
                    winnerScore = Number(winner.bidder_route_risk_snapshot);
                    candidateScore = Number(b.bidder_route_risk_snapshot);
                } else {
                    // lowest_price (default)
                    winnerScore = Number(winner.offered_revenue_per_tick);
                    candidateScore = Number(b.offered_revenue_per_tick);
                }
                if (candidateScore < winnerScore) winner = b;
            }

            const winnerTerm    = Number(winner.offered_term_ticks);
            const winnerRevenue = Number(winner.offered_revenue_per_tick);
            const nowIso        = new Date().toISOString();

            // Flip winner bid → accepted.
            const { error: winErr } = await supabase.from('shipping_contract_bids').update({
                status: 'accepted',
                resolved_at_tick: currentTick,
                updated_at: nowIso,
            }).eq('id', winner.id).eq('status', 'pending');
            if (winErr) {
                console.warn(`[ShippingRoutes] winner-bid flip failed for contract ${contract.id}:`, winErr.message);
                continue;
            }
            results.bidsAccepted++;

            // Auto-reject siblings.
            const { data: rejected, error: rejErr } = await supabase.from('shipping_contract_bids').update({
                status: 'auto_rejected',
                resolved_at_tick: currentTick,
                updated_at: nowIso,
            }).eq('contract_id', contract.id)
              .neq('id', winner.id)
              .eq('status', 'pending')
              .select('id');
            if (rejErr) {
                console.warn(`[ShippingRoutes] sibling-reject failed for contract ${contract.id}:`, rejErr.message);
            } else {
                results.bidsAutoRejected += rejected?.length || 0;
            }

            // Flip contract → awarded with snapshot.
            const { error: awErr } = await supabase.from('shipping_contracts').update({
                status: 'awarded',
                winner_faction_id: winner.bidder_faction_id,
                awarded_at_tick:   currentTick,
                ends_at_tick:      currentTick + winnerTerm,
                revenue_per_tick:  winnerRevenue,
                term_ticks:        winnerTerm,
                updated_at:        nowIso,
            }).eq('id', contract.id).eq('status', 'open');
            if (awErr) {
                console.warn(`[ShippingRoutes] award flip failed for contract ${contract.id}:`, awErr.message);
                continue;
            }
            results.awarded++;
        }
    }

    // ── Pass B: Maturity sweep ──
    const { data: matured, error: matErr } = await supabase
        .from('shipping_contracts')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('status', 'awarded')
        .is('trade_agreement_id', null)
        .lte('ends_at_tick', currentTick)
        .select('id');
    if (matErr) {
        console.warn('[ShippingRoutes] maturity sweep failed:', matErr.message);
    } else {
        results.completed = matured?.length || 0;
    }

    // ── Pass C: Per-tick payment ──
    const { data: activeContracts, error: activeErr } = await supabase
        .from('shipping_contracts')
        .select('id, winner_faction_id, revenue_per_tick, total_paid, last_payment_tick')
        .eq('status', 'awarded')
        .is('trade_agreement_id', null)
        .or(`last_payment_tick.is.null,last_payment_tick.neq.${currentTick}`);

    if (activeErr) {
        console.warn('[ShippingRoutes] active-contracts fetch failed:', activeErr.message);
        return results;
    }
    if (!activeContracts || activeContracts.length === 0) return results;

    for (const contract of activeContracts) {
        if (!contract.winner_faction_id) continue;
        const revenue = Number(contract.revenue_per_tick) || 0;
        if (revenue <= 0) continue;

        const { data: winner, error: wErr } = await supabase.from('factions')
            .select('corp_cash_reserves')
            .eq('id', contract.winner_faction_id).single();
        if (wErr || !winner) {
            console.warn(`[ShippingRoutes] winner fetch failed for contract ${contract.id}:`, wErr?.message);
            continue;
        }

        const { error: credErr } = await supabase.from('factions').update({
            corp_cash_reserves: (Number(winner.corp_cash_reserves) || 0) + revenue,
        }).eq('id', contract.winner_faction_id);
        if (credErr) {
            console.warn(`[ShippingRoutes] credit failed for contract ${contract.id}:`, credErr.message);
            continue;
        }
        logCashEvent(contract.winner_faction_id, 'revenue_shipping', 'Shipping route revenue', revenue);

        const { error: contractErr } = await supabase.from('shipping_contracts').update({
            last_payment_tick: currentTick,
            total_paid:        (Number(contract.total_paid) || 0) + revenue,
            updated_at:        new Date().toISOString(),
        }).eq('id', contract.id);
        if (contractErr) {
            console.warn(`[ShippingRoutes] contract-payment update failed for contract ${contract.id}:`, contractErr.message);
            continue;
        }

        results.paid++;
    }

    return results;
}

// ════════════════════════════════════════════════════════════════
// Phase 4 — Trade-Agreement Shipping processor
//
// Handles shipping_contracts spawned by the AFTER INSERT trigger on
// trade_agreements (Phase 2). Different from SOP processShippingRoutes:
//
//   - Auto-award by delivery_priority (fastest/safest/cheapest):
//       fastest  → MAX(energy_per_tick)
//       safest   → MIN(route_risk_delta)
//       cheapest → MIN(offered_revenue_per_tick)
//     Universal tiebreaker: cheapest, then earliest applied_at_tick.
//
//   - Zero bids when window closes ⇒ extend window by +1 tick (poll
//     until at least one offer arrives). Phase 1 spec: "It will sit
//     until at least 1 offer is made."
//
//   - Per-tick payment debits the buyer nation's budget_reserves and
//     credits the corp's cash + emits a revenue_trade event. (SOP
//     path prints revenue ambiently — wrong model for trade agreements.)
//
//   - Route risk delta from the winning offer's modifiers is applied
//     to the corp's corp_route_risk on award (clamped 0..10) and
//     reverted on contract completion / maturity.
// ════════════════════════════════════════════════════════════════
async function processTradeAgreementShipping(supabase, currentTick) {
    const results = {
        awarded: 0, completed: 0, paid: 0, polling: 0, renewed: 0,
        missed: 0, bidsAccepted: 0, bidsAutoRejected: 0,
    };
    const nowIso = () => new Date().toISOString();

    // ── Pass A: Auto-award (trade-agreement contracts only) ──
    const { data: closing, error: closingErr } = await supabase
        .from('shipping_contracts')
        .select('id, delivery_priority, term_ticks, volume_required, trade_agreement_id, nation_id')
        .eq('status', 'open')
        .not('trade_agreement_id', 'is', null)
        .lte('expires_at_tick', currentTick);

    if (closingErr) {
        console.warn('[TradeAgreementShipping] closing fetch failed:', closingErr.message);
    } else if (closing && closing.length > 0) {
        for (const contract of closing) {
            const { data: bids, error: bidsErr } = await supabase
                .from('shipping_contract_bids')
                .select('id, bidder_faction_id, offered_revenue_per_tick, energy_per_tick, route_risk_delta, applied_at_tick')
                .eq('contract_id', contract.id)
                .eq('status', 'pending')
                .order('applied_at_tick', { ascending: true });
            if (bidsErr) {
                console.warn(`[TradeAgreementShipping] bids fetch failed for ${contract.id}:`, bidsErr.message);
                continue;
            }

            // Zero offers ⇒ extend window. Phase 1 spec: "sit until at
            // least 1 offer is made." +1 tick keeps the contract in the
            // closing-set next cycle without a backlog of stale rows.
            if (!bids || bids.length === 0) {
                const { error: pollErr } = await supabase.from('shipping_contracts')
                    .update({ expires_at_tick: currentTick + 1, updated_at: nowIso() })
                    .eq('id', contract.id).eq('status', 'open');
                if (pollErr) {
                    console.warn(`[TradeAgreementShipping] poll-extend failed for ${contract.id}:`, pollErr.message);
                } else {
                    results.polling++;
                }
                continue;
            }

            // Score per delivery_priority. Lower score = better in our
            // sort, so 'fastest' negates energy (higher energy wins).
            const priority = contract.delivery_priority || 'cheapest';
            const score = (b) => {
                if (priority === 'fastest') return -(Number(b.energy_per_tick) || 0);
                if (priority === 'safest')  return  Number(b.route_risk_delta) || 0;
                return Number(b.offered_revenue_per_tick) || 0;  // cheapest
            };
            bids.sort((a, b) => {
                const sa = score(a), sb = score(b);
                if (sa !== sb) return sa - sb;
                // Tiebreaker 1: cheapest (universal).
                const ca = Number(a.offered_revenue_per_tick) || 0;
                const cb = Number(b.offered_revenue_per_tick) || 0;
                if (ca !== cb) return ca - cb;
                // Tiebreaker 2: earliest applied.
                return (Number(a.applied_at_tick) || 0) - (Number(b.applied_at_tick) || 0);
            });

            // Phase 6 freighter-availability gate. Walk bids in score
            // order, skip any whose bidder no longer has enough free
            // freighters (committed elsewhere on awarded contracts since
            // the bid was placed). place_shipping_offer validates at bid
            // time; this is the second-line check at award time.
            //
            // Implementation: pre-fetch bidders' fleet sizes + every
            // 'accepted' bid + the contract status of each linked contract
            // in two queries, then compute available per bidder locally.
            // Avoids the brittle PostgREST 'embed.field=value' filter
            // pattern (not used anywhere else in this codebase).
            const bidderIds = [...new Set(bids.map(b => b.bidder_faction_id).filter(Boolean))];
            const fleetByBidder    = new Map();
            const committedByBidder = new Map();
            if (bidderIds.length > 0) {
                const { data: bidderFactions } = await supabase.from('factions')
                    .select('id, corp_freighters').in('id', bidderIds);
                for (const f of (bidderFactions || [])) {
                    fleetByBidder.set(f.id, Math.floor(Number(f.corp_freighters) || 0));
                }
                const { data: acceptedBids } = await supabase.from('shipping_contract_bids')
                    .select('bidder_faction_id, contract_id, freighters_allocated')
                    .in('bidder_faction_id', bidderIds)
                    .eq('status', 'accepted');
                const acceptedRows = acceptedBids || [];
                if (acceptedRows.length > 0) {
                    const linkedContractIds = [...new Set(acceptedRows.map(r => r.contract_id))];
                    const { data: linkedContracts } = await supabase.from('shipping_contracts')
                        .select('id, status').in('id', linkedContractIds);
                    const awardedSet = new Set(
                        (linkedContracts || []).filter(c => c.status === 'awarded').map(c => c.id)
                    );
                    for (const r of acceptedRows) {
                        if (!awardedSet.has(r.contract_id)) continue;
                        const cur = committedByBidder.get(r.bidder_faction_id) || 0;
                        committedByBidder.set(r.bidder_faction_id, cur + (Number(r.freighters_allocated) || 0));
                    }
                }
            }

            let winner = null;
            for (const b of bids) {
                const need      = Number(b.freighters_allocated) || 0;
                const total     = fleetByBidder.get(b.bidder_faction_id) || 0;
                const committed = committedByBidder.get(b.bidder_faction_id) || 0;
                const available = Math.max(0, total - committed);
                if (need <= available) {
                    winner = b;
                    break;
                }
                // Bidder over-committed since bid time → reject this bid
                // and continue scoring. Mark the bid auto_rejected so it
                // doesn't sit pending forever.
                const { error: skipErr } = await supabase.from('shipping_contract_bids')
                    .update({ status: 'auto_rejected', resolved_at_tick: currentTick, updated_at: nowIso() })
                    .eq('id', b.id).eq('status', 'pending');
                if (skipErr) {
                    console.warn(`[TradeAgreementShipping] freighter-skip flip failed for bid ${b.id}:`, skipErr.message);
                } else {
                    results.bidsAutoRejected++;
                }
            }

            // No bid had enough free capacity → contract polls again next
            // tick (treat same as zero-bid case: extend the window).
            if (!winner) {
                const { error: pollErr } = await supabase.from('shipping_contracts')
                    .update({ expires_at_tick: currentTick + 1, updated_at: nowIso() })
                    .eq('id', contract.id).eq('status', 'open');
                if (pollErr) {
                    console.warn(`[TradeAgreementShipping] poll-extend (no eligible) failed for ${contract.id}:`, pollErr.message);
                } else {
                    results.polling++;
                }
                continue;
            }

            const winnerRevenue   = Number(winner.offered_revenue_per_tick) || 0;
            const winnerRiskDelta = Number(winner.route_risk_delta)         || 0;
            const term            = Math.max(1, Number(contract.term_ticks) || 1);

            // Flip winning bid → accepted.
            const { error: winErr } = await supabase.from('shipping_contract_bids')
                .update({ status: 'accepted', resolved_at_tick: currentTick, updated_at: nowIso() })
                .eq('id', winner.id).eq('status', 'pending');
            if (winErr) {
                console.warn(`[TradeAgreementShipping] winner-flip failed for ${contract.id}:`, winErr.message);
                continue;
            }
            results.bidsAccepted++;

            // Auto-reject siblings.
            const { data: rejected, error: rejErr } = await supabase.from('shipping_contract_bids')
                .update({ status: 'auto_rejected', resolved_at_tick: currentTick, updated_at: nowIso() })
                .eq('contract_id', contract.id).neq('id', winner.id).eq('status', 'pending')
                .select('id');
            if (rejErr) {
                console.warn(`[TradeAgreementShipping] sibling-reject failed for ${contract.id}:`, rejErr.message);
            } else {
                results.bidsAutoRejected += rejected?.length || 0;
            }

            // Apply route_risk_delta to winner corp (clamped 0..10).
            // Reverted in Pass B on contract completion.
            if (winnerRiskDelta !== 0 && winner.bidder_faction_id) {
                const { data: w } = await supabase.from('factions')
                    .select('corp_route_risk').eq('id', winner.bidder_faction_id).single();
                if (w) {
                    const newRisk = Math.max(0, Math.min(10,
                        (Number(w.corp_route_risk) || 0) + winnerRiskDelta));
                    const { error: riskErr } = await supabase.from('factions')
                        .update({ corp_route_risk: newRisk })
                        .eq('id', winner.bidder_faction_id);
                    if (riskErr) console.warn(`[TradeAgreementShipping] risk-apply failed:`, riskErr.message);
                }
            }

            // Flip contract → awarded. Snapshot the winning offer's
            // revenue onto contract.revenue_per_tick so Pass C reads
            // pricing locally without re-querying the bid each tick.
            const { error: awErr } = await supabase.from('shipping_contracts').update({
                status: 'awarded',
                winner_faction_id: winner.bidder_faction_id,
                awarded_at_tick:   currentTick,
                ends_at_tick:      currentTick + term,
                revenue_per_tick:  winnerRevenue,
                updated_at:        nowIso(),
            }).eq('id', contract.id).eq('status', 'open');
            if (awErr) {
                console.warn(`[TradeAgreementShipping] award-flip failed for ${contract.id}:`, awErr.message);
                continue;
            }
            results.awarded++;

            // Phase 7: notification events. Fire-and-forget so a flaky
            // event_log write never blocks the contract award. Three
            // surfaces:
            //   - winning corp ('your offer was awarded')
            //   - buyer nation ('shipping arranged for X')
            //   - losing corps  ('your offer was rejected')
            try {
                const { data: winnerFaction } = await supabase.from('factions')
                    .select('faction_name, nation_id').eq('id', winner.bidder_faction_id).maybeSingle();
                const corpName = winnerFaction?.faction_name || 'Your corporation';
                const events = [];
                events.push({
                    nation_id:          winnerFaction?.nation_id || null,
                    faction_id:         winner.bidder_faction_id,
                    event_name:         'Shipping offer awarded',
                    category:           'corporate',
                    description_chosen: `${corpName} won the shipping contract for ${contract.name || 'an Energy route'} (${Number(winner.energy_per_tick) || 0} Energy/tick).`,
                    fired_at_tick:      currentTick,
                });
                if (contract.nation_id) {
                    events.push({
                        nation_id:          contract.nation_id,
                        event_name:         'Shipping arranged',
                        category:           'trade',
                        description_chosen: `${corpName} will deliver ${Number(winner.energy_per_tick) || 0} Energy/tick to your nation under the active trade agreement.`,
                        fired_at_tick:      currentTick,
                    });
                }
                if (rejected && rejected.length > 0) {
                    const rejectedIds = rejected.map(r => r.id);
                    const { data: lostBids } = await supabase.from('shipping_contract_bids')
                        .select('bidder_faction_id, factions:bidder_faction_id(faction_name, nation_id)')
                        .in('id', rejectedIds);
                    for (const lb of (lostBids || [])) {
                        events.push({
                            nation_id:          lb.factions?.nation_id || null,
                            faction_id:         lb.bidder_faction_id,
                            event_name:         'Shipping offer rejected',
                            category:           'corporate',
                            description_chosen: `Your offer on ${contract.name || 'an Energy route'} was not selected — ${corpName} won the contract.`,
                            fired_at_tick:      currentTick,
                        });
                    }
                }
                if (events.length > 0) {
                    await supabase.from('event_log').insert(events);
                }
            } catch (logErr) {
                console.warn(`[TradeAgreementShipping] award event_log insert failed for ${contract.id}:`, logErr?.message || logErr);
            }
        }
    }

    // ── Pass B: Maturity sweep (revert route_risk + auto-renew) ──
    // Pull every awarded trade-ag contract whose term has run out.
    // Pulling more columns now since Phase 6 also re-spawns a fresh
    // open contract when the parent agreement is still active —
    // reuses the same operational parameters so the buyer doesn't
    // have to re-sign for permanent agreements.
    const { data: maturing, error: matErr } = await supabase
        .from('shipping_contracts')
        .select(`id, winner_faction_id, trade_agreement_id, nation_id, issuer_name,
                 name, description, origin_port, destination_port, destination_nation_id,
                 term_ticks, freighters_required, min_fleet_health, max_route_risk,
                 commodity, volume_required, delivery_priority, award_criterion`)
        .eq('status', 'awarded')
        .not('trade_agreement_id', 'is', null)
        .lte('ends_at_tick', currentTick);
    if (matErr) {
        console.warn('[TradeAgreementShipping] maturity fetch failed:', matErr.message);
    } else if (maturing && maturing.length > 0) {
        for (const contract of maturing) {
            // Revert route_risk_delta on the winning corp before flipping.
            const { data: bid } = await supabase.from('shipping_contract_bids')
                .select('route_risk_delta')
                .eq('contract_id', contract.id).eq('status', 'accepted')
                .limit(1).maybeSingle();
            const delta = Number(bid?.route_risk_delta) || 0;
            if (delta !== 0 && contract.winner_faction_id) {
                const { data: w } = await supabase.from('factions')
                    .select('corp_route_risk').eq('id', contract.winner_faction_id).single();
                if (w) {
                    const newRisk = Math.max(0, Math.min(10,
                        (Number(w.corp_route_risk) || 0) - delta));
                    await supabase.from('factions')
                        .update({ corp_route_risk: newRisk })
                        .eq('id', contract.winner_faction_id);
                }
            }
            const { error: doneErr } = await supabase.from('shipping_contracts')
                .update({ status: 'completed', updated_at: nowIso() })
                .eq('id', contract.id).eq('status', 'awarded');
            if (doneErr) {
                console.warn(`[TradeAgreementShipping] complete-flip failed for ${contract.id}:`, doneErr.message);
                continue;
            }
            results.completed++;

            // Phase 7: completion notification to the corp.
            // Renewal/loss events fire below where the renewal logic
            // decides whether to re-spawn or let the route end.
            try {
                if (contract.winner_faction_id) {
                    const { data: wFaction } = await supabase.from('factions')
                        .select('faction_name, nation_id').eq('id', contract.winner_faction_id).maybeSingle();
                    await supabase.from('event_log').insert({
                        nation_id:          wFaction?.nation_id || null,
                        faction_id:         contract.winner_faction_id,
                        event_name:         'Shipping contract completed',
                        category:           'corporate',
                        description_chosen: `${wFaction?.faction_name || 'Your corporation'} completed the shipping contract for ${contract.name || 'an Energy route'}.`,
                        fired_at_tick:      currentTick,
                    });
                }
            } catch (logErr) {
                console.warn(`[TradeAgreementShipping] completion event_log insert failed for ${contract.id}:`, logErr?.message || logErr);
            }

            // Phase 6 auto-renewal: if the parent agreement is still
            // 'active', spawn a fresh open contract with the same
            // parameters. Buyer keeps getting deliveries; corps re-bid.
            // Skip if the agreement ended for any reason — the cancel
            // cascade trigger from Phase 5 already handled cleanup.
            const { data: parent } = await supabase.from('trade_agreements')
                .select('status, expires_at_tick, duration_type')
                .eq('id', contract.trade_agreement_id).maybeSingle();
            if (parent?.status === 'active') {
                // Don't re-spawn past the agreement's expiration.
                const aExp = Number(parent.expires_at_tick) || null;
                const isPermanent = parent.duration_type === 'permanent' || aExp === null;
                const wouldExpire = !isPermanent && aExp !== null && aExp <= currentTick;
                if (!wouldExpire) {
                    const { error: spawnErr } = await supabase.from('shipping_contracts').insert({
                        nation_id:             contract.nation_id,
                        issuer_faction_id:     null,
                        issuer_name:           contract.issuer_name,
                        contract_type:         'foreign',
                        name:                  contract.name,
                        description:           contract.description,
                        origin_port:           contract.origin_port,
                        destination_port:      contract.destination_port,
                        destination_nation_id: contract.destination_nation_id,
                        revenue_per_tick:      1,
                        term_ticks:            contract.term_ticks,
                        freighters_required:   contract.freighters_required,
                        min_fleet_health:      contract.min_fleet_health,
                        max_route_risk:        contract.max_route_risk,
                        status:                'open',
                        expires_at_tick:       currentTick + 1,
                        created_at_tick:       currentTick,
                        trade_agreement_id:    contract.trade_agreement_id,
                        commodity:             contract.commodity,
                        volume_required:       contract.volume_required,
                        delivery_priority:     contract.delivery_priority,
                        award_criterion:       contract.award_criterion,
                    });
                    if (spawnErr) {
                        console.warn(`[TradeAgreementShipping] auto-renew spawn failed for ${contract.id}:`, spawnErr.message);
                    } else {
                        results.renewed = (results.renewed || 0) + 1;
                        // Phase 7: notify the buyer nation that a fresh
                        // bid window has opened. Corps will see the new
                        // contract on Available Routes; no per-corp event
                        // needed for that surface.
                        try {
                            await supabase.from('event_log').insert({
                                nation_id:          contract.nation_id,
                                event_name:         'Shipping contract renewed',
                                category:           'trade',
                                description_chosen: `Your trade agreement's shipping contract has completed and a fresh bid window is open for shipping corps.`,
                                fired_at_tick:      currentTick,
                            });
                        } catch (logErr) {
                            console.warn(`[TradeAgreementShipping] renewal event_log insert failed:`, logErr?.message || logErr);
                        }
                    }
                }
            }
        }
    }

    // ── Pass C: Per-tick payment ──
    // Buyer nation pays the corp; corp cash credited. Buyer's nation_id
    // was set on the contract by Phase 2.
    const { data: active, error: activeErr } = await supabase
        .from('shipping_contracts')
        .select('id, name, winner_faction_id, revenue_per_tick, total_paid, last_payment_tick, nation_id, consecutive_missed_payments')
        .eq('status', 'awarded')
        .not('trade_agreement_id', 'is', null)
        .or(`last_payment_tick.is.null,last_payment_tick.neq.${currentTick}`);
    if (activeErr) {
        console.warn('[TradeAgreementShipping] active fetch failed:', activeErr.message);
        return results;
    }
    if (!active || active.length === 0) return results;

    for (const contract of active) {
        if (!contract.winner_faction_id || !contract.nation_id) continue;
        const revenue = Number(contract.revenue_per_tick) || 0;
        if (revenue <= 0) continue;

        // Buyer nation pays. Skip if treasury can't cover (Phase 5 will
        // add late-payment / contract-default handling).
        const { data: buyer, error: bErr } = await supabase.from('nations')
            .select('budget_reserves').eq('id', contract.nation_id).single();
        if (bErr || !buyer) {
            console.warn(`[TradeAgreementShipping] buyer fetch failed for ${contract.id}:`, bErr?.message);
            continue;
        }
        const buyerReserves = Number(buyer.budget_reserves) || 0;
        const canPay        = buyerReserves >= revenue;

        // Phase 8: payment-skipped tracking. When the buyer treasury
        // can't cover the contract this tick, increment
        // consecutive_missed_payments so the UI can surface the
        // problem on both buyer and corp sides. Fire event_log
        // entries only on the 0 → 1 transition (first miss in a
        // streak) so chronic problems don't spam the log every tick.
        if (!canPay) {
            const priorMisses = Number(contract.consecutive_missed_payments) || 0;
            const { error: missErr } = await supabase.from('shipping_contracts').update({
                consecutive_missed_payments: priorMisses + 1,
                updated_at: nowIso(),
            }).eq('id', contract.id);
            if (missErr) {
                console.warn(`[TradeAgreementShipping] miss-counter update failed for ${contract.id}:`, missErr.message);
                continue;
            }
            results.missed = (results.missed || 0) + 1;
            if (priorMisses === 0) {
                try {
                    const events = [];
                    if (contract.nation_id) {
                        events.push({
                            nation_id:          contract.nation_id,
                            event_name:         'Shipping payment skipped',
                            category:           'trade',
                            description_chosen: `Treasury insufficient — couldn't pay this tick's shipping fee on '${contract.name || 'an Energy route'}'. The contract remains active; payment will resume once reserves are restored.`,
                            fired_at_tick:      currentTick,
                        });
                    }
                    const { data: wf } = await supabase.from('factions')
                        .select('faction_name, nation_id').eq('id', contract.winner_faction_id).maybeSingle();
                    events.push({
                        nation_id:          wf?.nation_id || null,
                        faction_id:         contract.winner_faction_id,
                        event_name:         'Shipping payment delayed',
                        category:           'corporate',
                        description_chosen: `Buyer's treasury was insufficient — your shipping payment for '${contract.name || 'an Energy route'}' was skipped this tick. Service continues; payment resumes when their reserves recover.`,
                        fired_at_tick:      currentTick,
                    });
                    if (events.length > 0) {
                        await supabase.from('event_log').insert(events);
                    }
                } catch (logErr) {
                    console.warn(`[TradeAgreementShipping] miss event_log insert failed for ${contract.id}:`, logErr?.message || logErr);
                }
            }
            continue;
        }

        const actualPayment = revenue;
        const { error: debitErr } = await supabase.from('nations')
            .update({ budget_reserves: buyerReserves - actualPayment })
            .eq('id', contract.nation_id);
        if (debitErr) {
            console.warn(`[TradeAgreementShipping] buyer debit failed for ${contract.id}:`, debitErr.message);
            continue;
        }

        const { data: winner, error: wFetchErr } = await supabase.from('factions')
            .select('corp_cash_reserves')
            .eq('id', contract.winner_faction_id).single();
        if (wFetchErr || !winner) {
            console.warn(`[TradeAgreementShipping] winner fetch failed for ${contract.id}:`, wFetchErr?.message);
            continue;
        }
        const { error: credErr } = await supabase.from('factions').update({
            corp_cash_reserves: (Number(winner.corp_cash_reserves) || 0) + actualPayment,
        }).eq('id', contract.winner_faction_id);
        if (credErr) {
            console.warn(`[TradeAgreementShipping] corp credit failed for ${contract.id}:`, credErr.message);
            continue;
        }
        logCashEvent(contract.winner_faction_id, 'revenue_trade', 'Trade-agreement payment', actualPayment);

        // Phase 8: reset consecutive_missed_payments on any successful
        // payment so the UI's "delayed" indicator clears once the buyer
        // catches up.
        const { error: contractErr } = await supabase.from('shipping_contracts').update({
            last_payment_tick:           currentTick,
            total_paid:                  (Number(contract.total_paid) || 0) + actualPayment,
            consecutive_missed_payments: 0,
            updated_at:                  nowIso(),
        }).eq('id', contract.id);
        if (contractErr) {
            console.warn(`[TradeAgreementShipping] contract update failed for ${contract.id}:`, contractErr.message);
            continue;
        }
        results.paid++;
    }

    return results;
}

// Each tick: expire unfunded loan requests, process repayments, handle defaults.
async function processFinanceLoans(supabase, nationId, currentTick) {
    const results = { expired: 0, payments: 0, defaults: 0 };

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
            // Term expiry: policy ends at term_months regardless of project status.
            const termMonths = Number(loan.term_months) || 0;
            if (termMonths > 0 && Number(loan.payments_made || 0) >= termMonths) {
                const { error: expErr } = await supabase.from('finance_active_loans').update({
                    status: 'repaid',
                    completed_tick: currentTick,
                }).eq('id', loan.id);
                if (expErr) console.warn('[Insurance] Term expiry update failed:', expErr.message);
                continue;
            }

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
                if (holderErr) {
                    console.warn('[Insurance] Premium deduction failed:', holderErr.message);
                } else {
                    logCashEvent(loan.borrower_faction_id, 'event_cost', 'Insurance premium', -premium);
                }

                // Credit premium to insurer (lender)
                const { data: insurer } = await supabase.from('factions')
                    .select('corp_cash_reserves').eq('id', loan.lender_faction_id).single();
                if (insurer) {
                    var { error: insurerErr } = await supabase.from('factions').update({
                        corp_cash_reserves: Number(insurer.corp_cash_reserves || 0) + premium,
                    }).eq('id', loan.lender_faction_id);
                    if (insurerErr) {
                        console.warn('[Insurance] Premium credit failed:', insurerErr.message);
                    } else {
                        logCashEvent(loan.lender_faction_id, 'revenue_finance', 'Insurance premium received', premium);
                    }
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

        // Equity: pay dividend = equity_pct × target's prior-tick profit
        // (if profit > 0). Losses don't flow to the investor — equity can't
        // go negative, they just earn nothing that tick. Profit is summed
        // from corp_cash_events for currentTick - 1.
        if (requestType === 'equity') {
            const { data: target } = await supabase.from('factions')
                .select('corp_cash_reserves')
                .eq('id', loan.borrower_faction_id).single();
            if (!target) {
                console.warn(`[Equity] Target ${loan.borrower_faction_id} not found; skipping`);
                continue;
            }

            const { data: priorEvents, error: priorErr } = await supabase
                .from('corp_cash_events')
                .select('delta')
                .eq('corp_id', loan.borrower_faction_id)
                .eq('tick', currentTick - 1);
            if (priorErr) {
                console.warn(`[Equity] prior-tick events lookup failed for ${loan.borrower_faction_id}:`, priorErr.message);
            }
            const profit = (priorEvents || []).reduce((s, e) => s + (Number(e.delta) || 0), 0);
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
                if (debitErr) {
                    console.warn('[Equity] Target debit failed:', debitErr.message);
                } else {
                    logCashEvent(loan.borrower_faction_id, 'event_cost', 'Equity dividend paid', -actualPayout);
                }

                const { data: lender } = await supabase.from('factions')
                    .select('corp_cash_reserves').eq('id', loan.lender_faction_id).single();
                if (lender) {
                    var { error: creditErr } = await supabase.from('factions').update({
                        corp_cash_reserves: Number(lender.corp_cash_reserves || 0) + actualPayout,
                    }).eq('id', loan.lender_faction_id);
                    if (creditErr) {
                        console.warn('[Equity] Investor credit failed:', creditErr.message);
                    } else {
                        logCashEvent(loan.lender_faction_id, 'revenue_finance', 'Equity dividend received', actualPayout);
                    }
                }
            }

            // Track dividend history. payments_made counts ACTUAL dividend
            // events (only when actualPayout > 0) — this is what the investor
            // portfolio's "N DIVIDENDS PAID" display reads. $0 loss-ticks don't
            // count, so the number reflects real distributions. last_payment_*
            // fields always capture the most recent cycle (amount can be 0)
            // so the UI can show "LAST: $X" per position.
            const dividendOccurred = actualPayout > 0;
            var { error: equityTrackErr } = await supabase.from('finance_active_loans').update({
                total_paid: (Number(loan.total_paid) || 0) + actualPayout,
                payments_made: (loan.payments_made || 0) + 1,
                payments_missed: 0,
                status: 'current',
                last_payment_tick: currentTick,
                last_payment_amount: actualPayout,
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
                logCashEvent(loan.lender_faction_id, 'revenue_finance', 'Bond coupon received', payment);
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
                payments_missed: 0,
                last_payment_tick: currentTick,
                status: isMatured ? 'repaid' : 'current',
                completed_tick: isMatured ? currentTick : null,
            }).eq('id', loan.id);

            results.payments++;
            continue;
        }

        // Standard loans: borrower pays from corp cash. All cash + loan
        // updates go through process_finance_loan_payment /
        // process_finance_loan_default so the three writes (debit, credit,
        // loan-row update) are atomic under a single Postgres transaction.
        // Without that wrapper, a mid-sequence failure used to leave the
        // borrower debited / lender uncredited / loan untouched, which
        // would re-trigger the debit on the next tick.
        const { data: borrower, error: borrowerFetchErr } = await supabase
            .from('factions')
            .select('corp_cash_reserves')
            .eq('id', loan.borrower_faction_id)
            .single();

        if (borrowerFetchErr) {
            console.error('[FinanceLoan] borrower fetch failed for loan', loan.id, borrowerFetchErr.message);
            continue;
        }

        const borrowerCash = Number(borrower?.corp_cash_reserves) || 0;
        const payment = loan.monthly_payment;
        const originalPrincipal = Math.max(0, Number(loan.original_principal ?? loan.principal ?? 0));
        const remainingPrincipal = Math.max(0, Number(loan.remaining_principal) || 0);
        const interestPortion = monthlyInterest(originalPrincipal, loan.interest_rate);
        const principalPaidThisTick = principalPortion(payment, interestPortion);
        const newRemainingPrincipal = Math.max(0, remainingPrincipal - principalPaidThisTick);

        // Shared missed-payment / default handler. Used both when the JS
        // pre-check sees insufficient cash AND when the payment RPC
        // reports a concurrent-debit race after the pre-check passed.
        const handleMissedPayment = async () => {
            const newMissed = loan.payments_missed + 1;
            let newStatus = loan.status;
            let recoveredAmount = 0;

            if (newMissed >= DEFAULT_MISSED_THRESHOLD) {
                newStatus = 'defaulted';
                results.defaults++;
                const recovery = collateralRecoveryRate(loan.collateral_type);
                if (recovery > 0) recoveredAmount = Math.round(remainingPrincipal * recovery);
            } else if (newMissed >= 3) {
                newStatus = 'delinquent';
            } else if (newMissed >= 1) {
                newStatus = 'late';
            }

            const { error: defaultErr } = await supabase.rpc('process_finance_loan_default', {
                p_loan_id: loan.id,
                p_lender_id: loan.lender_faction_id,
                p_recovered_amount: recoveredAmount,
                p_new_payments_missed: newMissed,
                p_new_status: newStatus,
                p_current_tick: currentTick,
            });
            if (defaultErr) {
                console.error('[FinanceLoan] default RPC failed for loan', loan.id, defaultErr.message);
            } else if (newStatus === 'defaulted') {
                // Lender books the principal write-off as a loss. Any recovered
                // collateral offsets the write-off; the recovery cash itself is
                // non-P&L (substitute for principal asset).
                const writeOff = Math.max(0, remainingPrincipal - recoveredAmount);
                if (writeOff > 0) logCashEvent(loan.lender_faction_id, 'event_cost', 'Loan write-off', -writeOff);
            }
        };

        if (borrowerCash >= payment) {
            const newTotalPaid = loan.total_paid + payment;
            const newInterestPaid = loan.total_interest_paid + interestPortion;
            const newPaymentsMade = loan.payments_made + 1;
            // term_months is CHECK >= 1 on finance_active_loans (see
            // sql/migrations/20260410_finance_loan_system.sql), so the
            // prior term_months <= 0 early-discharge branch was
            // unreachable -- dropped.
            const isRepaid = newRemainingPrincipal <= 0 && newPaymentsMade >= loan.term_months;

            const { data: payResult, error: payErr } = await supabase.rpc('process_finance_loan_payment', {
                p_loan_id: loan.id,
                p_borrower_id: loan.borrower_faction_id,
                p_lender_id: loan.lender_faction_id,
                p_payment: payment,
                p_new_total_paid: newTotalPaid,
                p_new_interest_paid: newInterestPaid,
                p_new_remaining: newRemainingPrincipal,
                p_new_payments_made: newPaymentsMade,
                p_is_repaid: isRepaid,
                p_current_tick: currentTick,
            });

            if (payErr) {
                console.error('[FinanceLoan] payment RPC failed for loan', loan.id, payErr.message);
                continue;
            }

            if (!payResult?.ok) {
                if (payResult?.reason === 'insufficient_cash') {
                    // Race: a concurrent debit drained the borrower between
                    // the JS pre-check and the locked re-check inside the
                    // RPC. Treat it as a missed payment so we don't lose
                    // the delinquency tracking.
                    await handleMissedPayment();
                } else {
                    console.error('[FinanceLoan] payment rejected for loan', loan.id, payResult);
                }
                continue;
            }

            // P&L split: interest is income/expense, principal is non-P&L.
            logCashEvent(loan.borrower_faction_id, 'debt_interest',   'Loan interest paid',     -interestPortion);
            logCashEvent(loan.lender_faction_id,   'revenue_finance', 'Loan interest received', interestPortion);

            results.payments++;
        } else {
            await handleMissedPayment();
        }
    }

    return results;
}

// ════════════════════════════════════════════════════════════════════════════════
//  SHIPPING ROUTE GENERATION
// ════════════════════════════════════════════════════════════════════════════════

const SHIPPING_SECTOR_MAP = {
    fuel_energy:        { subsector: 'specialized_transport', category: 'FUEL',     goods: 'Fuel & Energy Products',   goodsSub: 'Petroleum, LNG, coal, refined fuels',        vessel: 'Tanker',          vesselNote: 'Double-hull required.', unit: 'tons' },
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

// Canonical transit-tick formula — mirror of calculateTransitTicks in
// js/game/shipping.js. Returns >= 1 always so transit_ticks is never
// zero on a freshly-written route.
function _shipTransitTicks(prox) { return (Number(prox) || 0) >= 71 ? 1 : 2; }
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
    // ── Build fingerprint canary ──
    // Tells us whether a deploy actually replaced the running bundle.
    // After `supabase functions deploy advance-corp-tick`, the next
    // cron invocation should log this exact string. If it doesn't,
    // the deploy didn't take effect (Supabase dashboard cache /
    // wrong project / silent failure). Bump the date suffix on each
    // intentional redeploy so we can distinguish stale invocations
    // from new ones in the function logs.
    console.log('[advance-corp-tick] BUILD_MARKER 2026-04-25-c (workforce-audit-followup)');

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

    // Capture the tick number for logCashEvent and reset its buffer.
    // The buffer holds every cash event accrued so far this tick; it
    // flushes to corp_cash_events at tick end.
    _currentTick = currentTick;
    _pendingCashEvents.length = 0;

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
        airline: [],
        // Future sector summaries:
        // energy: [],
        // finance: [],
        // defense: [],
        errors: [],
    };

    // ── Tier-based contract generation (once per tick, all nations together) ──
    // Ranks every nation by gdp_growth, generates a deterministic slate per
    // tier into corp_contracts (the table the Operations page reads). Independent
    // of the per-nation construction loop below.
    try {
        const { data: shardDateRow } = await supabase.from('shard')
            .select('current_date').eq('name', 'Alpha Shard').single();
        const gameYearGen = (shardDateRow?.current_date || '').match(/\d{4}/)?.[0] || '2014';
        const tierResult = await generateCorpContractsByGdpTier(
            supabase, nationList, currentTick, gameYearGen
        );
        if (tierResult.generated > 0) {
            console.log(`[corp_contracts gen] tick ${currentTick}: generated ${tierResult.generated} contract(s)`);
        }
    } catch (tierGenErr) {
        console.error('[advance-corp-tick] corp_contracts tier generator failed (non-fatal):', tierGenErr);
        summary.errors.push({ scope: 'corp_contracts_tier_gen', error: String(tierGenErr) });
    }

    // 4b. Loan-negotiation stale sweep (once per tick, global). Abandons
    // any negotiation idle > 24 hours, refunds held escrow, system-
    // messages the row. Cheap: typically 0 sweeps per tick.
    try {
        const { data: sweepRes, error: sweepErr } = await supabase
            .rpc('auto_abandon_stale_negotiations', { p_tick: currentTick });
        if (sweepErr) {
            console.error('[advance-corp-tick] loan-negotiation sweep failed:', sweepErr.message);
            summary.errors.push({ scope: 'loan_negotiation_sweep', error: sweepErr.message });
        } else if (sweepRes?.swept > 0) {
            console.log(`[advance-corp-tick] Auto-abandoned ${sweepRes.swept} stale loan negotiation(s)`);
        }
    } catch (sweepEx) {
        console.error('[advance-corp-tick] loan-negotiation sweep threw (non-fatal):', sweepEx);
        summary.errors.push({ scope: 'loan_negotiation_sweep', error: String(sweepEx) });
    }

    // 4c. Aviation-incident auto-refuse sweep (Phase 7). Pending
    // incidents past expires_at_tick get the 'auto_refused' penalty
    // (op_safety -0.5, reputation -1.5) — same effects as the
    // 'refused' response a player would have picked.
    try {
        const { data: incRes, error: incErr } = await supabase
            .rpc('auto_resolve_stale_incidents', { p_tick: currentTick });
        if (incErr) {
            console.error('[advance-corp-tick] aviation-incident sweep failed:', incErr.message);
            summary.errors.push({ scope: 'aviation_incident_sweep', error: incErr.message });
        } else if (incRes?.swept > 0) {
            console.log(`[advance-corp-tick] Auto-refused ${incRes.swept} stale aviation incident(s)`);
        }
    } catch (incEx) {
        console.error('[advance-corp-tick] aviation-incident sweep threw (non-fatal):', incEx);
        summary.errors.push({ scope: 'aviation_incident_sweep', error: String(incEx) });
    }

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

            // Tick-entry cash snapshot. Reused at tick-exit (below) to write
            // one honest corp_cash_history row per corp with a real cash_delta
            // and non_pnl_cash_movements = cash_delta − accrued P&L (sourced
            // from _pendingCashEvents). Fixed the previous setup where the
            // snapshot was captured inside the fleet-maintenance loop, which
            // ran AFTER processCorpMonthlyIncome and processFinanceLoans — so
            // every non-shipping corp wrote cash_delta = 0 and
            // non_pnl_cash_movements = null, breaking the
            // Finances card's "Actual Cash Change" reconciliation.
            const cashStartByCorp = new Map(
                corps.map(c => [c.id, Number(c.corp_cash_reserves || 0)])
            );

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

                // Project events: generate random events on in_progress projects.
                // Legacy table (drains with the 41 in-flight contracts; goes
                // away in Phase 1E):
                const eventResults = await generateProjectEvents(supabase, nation.id, currentTick);
                if (eventResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'events', data: eventResults });
                }
                // New pipeline (corp_contracts → corp_contract_events). Runs in
                // parallel with the legacy generator during the drain.
                try {
                    const corpEventResults = await generateCorpContractProjectEvents(supabase, nation.id, currentTick);
                    if (corpEventResults.length > 0) {
                        summary.construction.push({ nation: nation.name, type: 'corp_events', data: corpEventResults });
                    }
                } catch (cceErr) {
                    console.warn(`[advance-corp-tick] corp_contract_events gen failed for ${nation.name}:`, cceErr?.message || cceErr);
                }

                // Property marketplace: ensure 8 available per nation
                try {
                    await replenishPropertyMarketplace(supabase, nation, currentTick);
                } catch (propErr) {
                    console.warn(`[advance-corp-tick] Property marketplace failed for ${nation.name}:`, propErr.message);
                }

                // Expired events: auto-resolve events the player ignored
                // Legacy:
                const expiredResults = await resolveExpiredEvents(supabase, nation.id, currentTick);
                if (expiredResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'expired_events', data: expiredResults });
                }
                // New pipeline:
                try {
                    const expiredCorpResults = await resolveExpiredCorpContractEvents(supabase, nation.id, currentTick);
                    if (expiredCorpResults.length > 0) {
                        summary.construction.push({ nation: nation.name, type: 'expired_corp_events', data: expiredCorpResults });
                    }
                } catch (exCceErr) {
                    console.warn(`[advance-corp-tick] corp_contract_events expiry failed for ${nation.name}:`, exCceErr?.message || exCceErr);
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
                            logCashEvent(fId, 'maintenance', 'Permit-driven maintenance', -totalMaint);
                            await supabase.from('factions').update({
                                corp_cash_reserves: Math.max(0, Number(corp.corp_cash_reserves || 0) - totalMaint)
                            }).eq('id', fId);
                        }
                    }
                }
            } catch (permitErr) {
                console.error(`[advance-corp-tick] Permit lifecycle failed for ${nation.name} (non-fatal):`, permitErr);
            }

            // ── Construction Per-Tick Wages ──
            // wages = corp_work_crews × $300k × (0.5 + sol/100)
            // The RPC updates corp_cash_reserves atomically per corp and
            // returns the wages value; we log each row's negative delta
            // to corp_cash_events.
            try {
                const { data: wageRows, error: wageErr } = await supabase
                    .rpc('apply_construction_wages_for_nation', { p_nation_id: nation.id });
                if (wageErr) {
                    console.warn(`[advance-corp-tick] Construction wages RPC failed for ${nation.name}:`, wageErr.message);
                } else if (Array.isArray(wageRows)) {
                    for (const row of wageRows) {
                        const w = Number(row.wages || 0);
                        if (w > 0) logCashEvent(row.corp_id, 'wages', 'Construction wages', -w);
                    }
                }
            } catch (wageErr) {
                console.error(`[advance-corp-tick] Construction wages failed for ${nation.name} (non-fatal):`, wageErr);
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

            // ── Airline Sector (Phase 6 tick resolution) ─────────────────
            // Per-corp wrapper handles each active route: pax → revenue →
            // ops → maint (anniversary only) → incident roll → aggregate
            // update. Cash flows go through emit_corp_cash_event so the
            // ledger and corp_cash_reserves stay in sync. Airline corps
            // headquartered in this nation only — subsidiary HQs aren't
            // a thing for airlines yet.
            try {
                const airlineCorps = corps.filter(c => c.corp_sector === 'Airline');
                for (const ac of airlineCorps) {
                    const { data: airlineResult, error: airlineErr } = await supabase
                        .rpc('process_airline_corp_tick', { p_corp_id: ac.id, p_tick: currentTick });
                    if (airlineErr) {
                        console.error(`[advance-corp-tick] Airline tick failed for ${ac.faction_name} (non-fatal):`, airlineErr.message);
                        summary.errors.push({ nation: nation.name, sector: 'airline', corp: ac.faction_name, error: airlineErr.message });
                        continue;
                    }
                    if (airlineResult && Number(airlineResult.routes) > 0) {
                        summary.airline.push({
                            nation: nation.name,
                            corp:   ac.faction_name,
                            routes: airlineResult.routes,
                            pax:    airlineResult.pax,
                            revenue: airlineResult.revenue,
                            spend:  airlineResult.spend,
                            incidents: airlineResult.incidents,
                        });
                    }
                }
            } catch (airlineErr) {
                console.error(`[advance-corp-tick] Airline pass failed for ${nation.name} (non-fatal):`, airlineErr);
                summary.errors.push({ nation: nation.name, sector: 'airline', error: String(airlineErr) });
            }

            // ── Subsidiary Revenue (GDP-based growth/loss per subsidiary) ──
            try {
                const subRevenueSummary = await processSubsidiaryRevenue(supabase, nation, currentTick);
                if (corps.length === 0) {
                    console.log(`[advance-corp-tick] ${nation.name}: 0 local corporations, subsidiary path processed ${subRevenueSummary?.hqCount || 0} subsidiary(ies).`);
                }
            } catch (subRevErr) {
                console.error(`[advance-corp-tick] Subsidiary revenue failed for ${nation.name} (non-fatal):`, subRevErr);
                summary.errors.push({ nation: nation.name, sector: 'subsidiary_revenue', error: String(subRevErr) });
            }

            // ── Regional HQ Property Income (flat-ish income from marketplace HQs) ──
            try {
                await processRegionalHqIncome(supabase, nation, currentTick);
            } catch (hqIncErr) {
                console.error(`[advance-corp-tick] Regional HQ income failed for ${nation.name} (non-fatal):`, hqIncErr);
                summary.errors.push({ nation: nation.name, sector: 'regional_hq_income', error: String(hqIncErr) });
            }

            // ── Health Insurance (Phase 2: policyholder growth + premium revenue) ──
            try {
                const healthResult = await processHealthInsurancePools(supabase, nation, currentTick);
                if (healthResult && healthResult.processed > 0) {
                    console.log(`[advance-corp-tick] ${nation.name}: health insurance processed ${healthResult.processed} pool(s), collected $${(healthResult.collected || 0).toLocaleString()}.`);
                }
            } catch (healthErr) {
                console.error(`[advance-corp-tick] Health insurance failed for ${nation.name} (non-fatal):`, healthErr);
                summary.errors.push({ nation: nation.name, sector: 'health_insurance', error: String(healthErr) });
            }

            // ── Health Insurance Lawsuits (Phase 5: resolve ripe lawsuits) ──
            try {
                const lawsuitResult = await processHealthInsuranceLawsuits(supabase, nation, currentTick);
                if (lawsuitResult && lawsuitResult.resolved > 0) {
                    console.log(`[advance-corp-tick] ${nation.name}: health insurance resolved ${lawsuitResult.resolved} lawsuit(s), damages $${(lawsuitResult.damagesPaid || 0).toLocaleString()}.`);
                }
            } catch (lawsuitErr) {
                console.error(`[advance-corp-tick] Health insurance lawsuits failed for ${nation.name} (non-fatal):`, lawsuitErr);
                summary.errors.push({ nation: nation.name, sector: 'health_insurance_lawsuits', error: String(lawsuitErr) });
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
                await processCorpMonthlyIncome(supabase, nation, corps, currentTick);
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

            // ── Equipment Orders — Deliver delayed equipment purchases ────
            try {
                if (!summary._equipmentDeliveriesProcessed) {
                    await processEquipmentDeliveries(supabase, currentTick);
                    summary._equipmentDeliveriesProcessed = true;
                }
            } catch (eqDelErr) {
                console.error(`[advance-corp-tick] Equipment delivery fulfillment failed (non-fatal):`, eqDelErr);
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
                    .select('id, route_id, faction_id, transit_started_tick, transit_arrives_tick, revenue_per_transit, total_revenue, transits_completed, shipping_routes!inner(transit_ticks, status, destination_nation_id)')
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
                                status: 'released', released_at_tick: currentTick
                            }).eq('id', claim.id);
                            await supabase.from('factions').update({
                                shipping_fleet_deployed: Math.max(0, (await supabase.from('factions').select('shipping_fleet_deployed').eq('id', claim.faction_id).single()).data?.shipping_fleet_deployed - 1 || 0)
                            }).eq('id', claim.faction_id);
                            // Free the assigned vessel
                            var { error: freeErr } = await supabase.from('corp_vessels').update({
                                status: 'in_port', active_claim_id: null,
                            }).eq('active_claim_id', claim.id).eq('faction_id', claim.faction_id);
                            if (freeErr) await logShippingWriteFailure(supabase, {
                                nationId: nation.id,
                                factionId: claim.faction_id,
                                operation: 'free_vessel_on_route_expiry',
                                error: freeErr,
                                currentTick,
                            });
                            continue;
                        }

                        const transitTicks = Math.max(1, Number(claim.shipping_routes?.transit_ticks) || 0);

                        // Derive the claim's transit phase from the assigned
                        // vessel's status — corp_vessels.status is now the
                        // sole SSoT for vessel activity. "loading" means the
                        // vessel is at port waiting to depart for this claim
                        // (vessel.status='in_port'). "in_transit" means it's
                        // at sea (vessel.status='in_transit'). No assigned
                        // vessel → claim is orphaned, skip.
                        const assignedVessel = (corpVesselsForTransit || []).find(v => v.active_claim_id === claim.id);
                        if (!assignedVessel) continue;

                        if (assignedVessel.status === 'in_port') {
                            // Check fuel before departure — need at least 15% to start transit
                            if (assignedVessel.fuel < 15) {
                                console.log(`[advance-corp-tick] Vessel ${assignedVessel.vessel_name} too low on fuel (${assignedVessel.fuel}%) to depart. Skipping transit.`);
                                continue; // Ship stays in port, can't depart
                            }

                            // Start transit next tick. Capture error so silent
                            // failures surface — previously an UPDATE rejection
                            // (trigger, constraint, RLS) was swallowed and the
                            // claim stayed stuck with no signal.
                            var { error: claimTransitErr } = await supabase.from('shipping_claims').update({
                                transit_started_tick: currentTick,
                                transit_arrives_tick: currentTick + transitTicks,
                            }).eq('id', claim.id);
                            if (claimTransitErr) {
                                await logShippingWriteFailure(supabase, {
                                    nationId: nation.id,
                                    factionId: claim.faction_id,
                                    operation: `claim_loading_to_in_transit (claim=${claim.id})`,
                                    error: claimTransitErr,
                                    currentTick,
                                });
                                continue; // don't flip the vessel if the claim didn't update
                            }
                            console.log(`[advance-corp-tick] Claim ${claim.id} transitioned loading→in_transit (corp=${claim.faction_id}, transitTicks=${transitTicks}, arrives=${currentTick + transitTicks})`);

                            // Update assigned vessel to in_transit
                            var { error: transitErr } = await supabase.from('corp_vessels').update({
                                status: 'in_transit', current_port_nation_id: null,
                            }).eq('active_claim_id', claim.id).eq('faction_id', claim.faction_id);
                            if (transitErr) await logShippingWriteFailure(supabase, {
                                nationId: nation.id,
                                factionId: claim.faction_id,
                                operation: 'vessel_transit_update',
                                error: transitErr,
                                currentTick,
                            });

                        } else if (assignedVessel.status === 'in_transit' && currentTick >= (claim.transit_arrives_tick || 0)) {
                            // Transit complete — collect revenue and restart cycle
                            const revenue = Number(claim.revenue_per_transit) || 0;

                            // Credit revenue to corp
                            if (revenue > 0) {
                                const { data: corp } = await supabase.from('factions')
                                    .select('corp_cash_reserves').eq('id', claim.faction_id).single();
                                if (corp) {
                                    logCashEvent(claim.faction_id, 'revenue_shipping', 'Shipping claim revenue', revenue);
                                    await supabase.from('factions').update({
                                        corp_cash_reserves: Number(corp.corp_cash_reserves || 0) + revenue
                                    }).eq('id', claim.faction_id);
                                }
                                revenueCollected += revenue;
                            }

                            // Update claim: increment transits, add revenue, clear
                            // transit timestamps (vessel arrival below flips it back
                            // to in_port, which the SSoT model reads as "loading").
                            await supabase.from('shipping_claims').update({
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
                                    logCashEvent(fuelDepot.faction_id, 'revenue_shipping', 'Fuel depot revenue', depotRevenue);
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
                                    logCashEvent(claim.faction_id, 'event_cost', 'Fuel cost', -fuelCost);
                                    await supabase.from('factions').update({
                                        corp_cash_reserves: Math.max(0, Number(shipCorp.corp_cash_reserves || 0) - fuelCost),
                                    }).eq('id', claim.faction_id);
                                }
                            }

                            var { error: arriveErr } = await supabase.from('corp_vessels').update({
                                status: 'in_port', current_port_nation_id: destNationId,
                                fuel: 100, // refueled on arrival
                            }).eq('active_claim_id', claim.id).eq('faction_id', claim.faction_id);
                            if (arriveErr) await logShippingWriteFailure(supabase, {
                                nationId: nation.id,
                                factionId: claim.faction_id,
                                operation: 'vessel_arrival_update',
                                error: arriveErr,
                                currentTick,
                            });

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
                            vessel_status: diagVessel?.status || null,
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
                                .select('id, route_id, revenue_per_transit, shipping_routes!inner(id, transit_ticks, scope, proximity)')
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
                                        logCashEvent(otherDock.faction_id, 'revenue_shipping', 'Dry dock revenue', dockRevenue);
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
                                if (!repairCashErr) logCashEvent(corp.id, 'maintenance', 'Vessel repair', -repairCost);
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
                                            status: 'released',
                                            released_at_tick: currentTick,
                                            revenue_per_transit: 0,
                                        }).eq('id', v.active_claim_id);
                                        if (relErr) await logShippingWriteFailure(supabase, {
                                            nationId: nation.id,
                                            factionId: corp.id,
                                            vesselName: v.vessel_name,
                                            operation: 'claim_release_total_loss',
                                            error: relErr,
                                            currentTick,
                                        });
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
                                        status: 'released',
                                        released_at_tick: currentTick,
                                        revenue_per_transit: 0,
                                    }).eq('id', v.active_claim_id);
                                    if (relErr) await logShippingWriteFailure(supabase, {
                                        nationId: nation.id,
                                        factionId: corp.id,
                                        vesselName: v.vessel_name,
                                        operation: 'claim_release_strand',
                                        error: relErr,
                                        currentTick,
                                    });
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
                            if (vErr) await logShippingWriteFailure(supabase, {
                                nationId: nation.id,
                                factionId: corp.id,
                                vesselName: v.vessel_name,
                                operation: 'vessel_update_maintenance_loop',
                                error: vErr,
                                currentTick,
                            });
                        }
                    }

                    // Deduct total fleet maintenance from corp cash
                    if (totalMaintenance > 0) {
                        const beforeMaintenanceCash = corpCashRunning;
                        const afterMaintenanceCash = Math.max(0, beforeMaintenanceCash - totalMaintenance);
                        const { error: maintErr } = await supabase.from('factions').update({
                            corp_cash_reserves: afterMaintenanceCash,
                        }).eq('id', corp.id);
                        if (!maintErr) logCashEvent(corp.id, 'maintenance', 'Fleet maintenance', -totalMaintenance);
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

            // Tick-exit cash snapshot → one corp_cash_history row per corp.
            // cash_delta is computed against cashStartByCorp captured at the
            // top of this per-nation block (before any processing). Feeds the
            // dashboard's cash sparkline (still keyed off cash_end). The P&L
            // portion of cash_delta is sourced from _pendingCashEvents (the
            // SSoT) — non_pnl_cash_movements = cash_delta − sum of this
            // corp's accrued events this tick.
            if (corps.length > 0) {
                try {
                    const { data: endFactions, error: endFactionsErr } = await supabase
                        .from('factions')
                        .select('id, corp_cash_reserves')
                        .in('id', corps.map(c => c.id));
                    if (endFactionsErr) throw endFactionsErr;
                    // Only write rows for corps we captured a real start-of-tick
                    // snapshot for. Guards against a corp appearing in endFactions
                    // that wasn't in the initial corps fetch (e.g., founded or
                    // un-abandoned mid-tick) — that would otherwise record the
                    // corp's entire cash balance as a phantom delta.
                    const rows = (endFactions || [])
                        .filter(f => cashStartByCorp.has(f.id))
                        .map(f => {
                            const cashStart = cashStartByCorp.get(f.id);
                            const cashEnd = Number(f.corp_cash_reserves || 0);
                            const tickProfit = _accruedProfitForCorp(f.id);
                            const cashDelta = cashEnd - cashStart;
                            return {
                                faction_id: f.id,
                                tick: currentTick,
                                cash_start: cashStart,
                                cash_end: cashEnd,
                                cash_delta: cashDelta,
                                non_pnl_cash_movements: cashDelta - tickProfit,
                            };
                        });
                    if (rows.length > 0) {
                        const { error: cashHistErr } = await supabase
                            .from('corp_cash_history')
                            .upsert(rows, { onConflict: 'faction_id,tick' });
                        if (cashHistErr) {
                            const errorMessage = cashHistErr?.message || String(cashHistErr);
                            console.warn(`[advance-corp-tick] corp_cash_history upsert failed for ${nation.name}:`, errorMessage);
                            const { error: eventLogErr } = await supabase
                                .from('event_log')
                                .insert({
                                    nation_id: nation.id,
                                    event_name: 'Corp cash history upsert failed',
                                    category: 'system',
                                    description_chosen: `corp_cash_history upsert failed for ${nation.name} at tick ${currentTick}: ${errorMessage}`,
                                    fired_at_tick: currentTick,
                                });
                            if (eventLogErr) {
                                console.warn(`[advance-corp-tick] event_log insert failed after corp_cash_history failure for ${nation.name}:`, eventLogErr.message);
                            }
                        }
                    }
                } catch (cashHistOuterErr) {
                    console.warn(`[advance-corp-tick] Cash history write failed for ${nation.name}:`, cashHistOuterErr?.message || cashHistOuterErr);
                }
            }

        } catch (nationProcessErr) {
            console.error(`[advance-corp-tick] FAILED processing corps for ${nation.name}:`, nationProcessErr);
            summary.errors.push({ nation: nation.name, error: String(nationProcessErr) });
        }
    }

    // L5: Bank loan request + offer expiry sweep (shard-wide, idempotent).
    // Runs after the per-nation loop because expiry is independent of any
    // single nation's work and the cascade may touch rows whose lender +
    // borrower live in different nations.
    try {
        const expiryResults = await processBankLoanExpiry(supabase, currentTick);
        if (expiryResults.expiredRequests > 0
            || expiryResults.expiredOffersCascade > 0
            || expiryResults.expiredOffersOrphan > 0) {
            summary.bankLoanExpiry = expiryResults;
            console.log(`[BankLoanExpiry] tick ${currentTick}: ${expiryResults.expiredRequests} request(s) expired, ${expiryResults.expiredOffersCascade} offer(s) cascade-expired, ${expiryResults.expiredOffersOrphan} orphan offer(s) swept`);
        }
    } catch (expiryErr) {
        console.error('[advance-corp-tick] FAILED bank loan expiry sweep:', expiryErr);
        summary.errors.push({ scope: 'bank_loan_expiry', error: String(expiryErr) });
    }

    // LRP2: Bank loan payment processor (shard-wide, idempotent via
    // last_payment_tick guard). Runs after expiry so already-expired
    // requests don't race with payment runs on still-active loans.
    try {
        const paymentResults = await processBankLoanPayments(supabase, currentTick);
        if (paymentResults.processed > 0
            || paymentResults.missed > 0
            || paymentResults.paid > 0
            || paymentResults.defaulted > 0) {
            summary.bankLoanPayments = paymentResults;
            console.log(`[BankLoanPayments] tick ${currentTick}: ${paymentResults.processed} paid, ${paymentResults.missed} missed (${paymentResults.late_escalations} → late, ${paymentResults.delinquent_escalations} → delinquent, ${paymentResults.defaulted} → defaulted), ${paymentResults.paid} loans completed`);
        }
    } catch (payErr) {
        console.error('[advance-corp-tick] FAILED bank loan payments:', payErr);
        summary.errors.push({ scope: 'bank_loan_payments', error: String(payErr) });
    }

    // SOP2: Shipping route processor (shard-wide). Three internal
    // passes (auto-award → maturity → payment) ordered so a route
    // maturing on the same tick as its scheduled payment doesn't
    // double-pay. Routes whose bid window closed get auto-awarded
    // by award_criterion (lowest_price / fastest_delivery /
    // lowest_risk); active routes accrue revenue_per_tick to the
    // winning carrier; matured routes flip to 'completed'.
    try {
        const shippingResults = await processShippingRoutes(supabase, currentTick);
        if (shippingResults.awarded > 0
            || shippingResults.expired > 0
            || shippingResults.completed > 0
            || shippingResults.paid > 0) {
            summary.shippingRoutes = shippingResults;
            console.log(`[ShippingRoutes] tick ${currentTick}: ${shippingResults.awarded} awarded (${shippingResults.bidsAccepted} bids accepted, ${shippingResults.bidsAutoRejected} auto-rejected), ${shippingResults.expired} expired, ${shippingResults.completed} completed, ${shippingResults.paid} paid`);
        }

        // Phase 4 — trade-agreement-spawned shipping. Auto-award by
        // delivery_priority, route_risk delta on award/completion,
        // per-tick payment from buyer nation → corp.
        // Phase 6: Pass B auto-renews completed contracts when the
        // parent agreement is still active.
        const tradeShipResults = await processTradeAgreementShipping(supabase, currentTick);
        if (tradeShipResults.awarded > 0
            || tradeShipResults.completed > 0
            || tradeShipResults.paid > 0
            || tradeShipResults.polling > 0
            || tradeShipResults.renewed > 0
            || tradeShipResults.missed > 0) {
            summary.tradeAgreementShipping = tradeShipResults;
            console.log(`[TradeAgreementShipping] tick ${currentTick}: ${tradeShipResults.awarded} awarded (${tradeShipResults.bidsAccepted} bids accepted, ${tradeShipResults.bidsAutoRejected} auto-rejected), ${tradeShipResults.polling} polling for bids, ${tradeShipResults.completed} completed (${tradeShipResults.renewed} renewed), ${tradeShipResults.paid} paid, ${tradeShipResults.missed} skipped`);
        }
    } catch (shipErr) {
        console.error('[advance-corp-tick] FAILED shipping route processor:', shipErr);
        summary.errors.push({ scope: 'shipping_routes', error: String(shipErr) });
    }

    // Lawsuit deadline sweeper: any commercial_lawsuits row past its
    // 3-tick response_deadline_tick auto-concedes. SQL handles the
    // updates + event_log inserts atomically.
    try {
        const { data: lawsuitSwept, error: lawsuitErr } = await supabase.rpc('process_lawsuit_deadlines');
        if (lawsuitErr) {
            console.warn('[advance-corp-tick] lawsuit deadline sweep failed:', lawsuitErr.message);
        } else if (lawsuitSwept && lawsuitSwept > 0) {
            summary.lawsuitsAutoConceded = lawsuitSwept;
            console.log(`[Lawsuits] tick ${currentTick}: ${lawsuitSwept} auto-conceded past deadline`);
        }
    } catch (lawsuitCatchErr) {
        console.error('[advance-corp-tick] FAILED lawsuit sweeper:', lawsuitCatchErr);
        summary.errors.push({ scope: 'lawsuit_deadlines', error: String(lawsuitCatchErr) });
    }

    // Flush buffered cash events to corp_cash_events. Single writer for
    // every per-corp P&L delta this tick, regardless of which nation
    // triggered it.
    await flushCashEvents(supabase);

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

        // Background tasks pattern: kick off the work but don't block the
        // HTTP response on it. The 150s "request idle timeout" gateway will
        // close the request after that long even if the worker is still
        // chewing — so we respond immediately, then EdgeRuntime.waitUntil
        // keeps the worker alive (up to the 400s wall-clock limit) until
        // advanceCorpTick finishes. The function does its own idempotency
        // check internally (line 4469), so safe to fire on every invocation.
        const work = advanceCorpTick(supabase, { force })
            .catch((err) => {
                console.error("[advance-corp-tick] Background work failed:", err);
            });

        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
            EdgeRuntime.waitUntil(work);
        }

        return new Response(
            JSON.stringify({ status: "started" }),
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
