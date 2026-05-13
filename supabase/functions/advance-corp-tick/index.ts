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

import { createClient } from "npm:@supabase/supabase-js@2";

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

function amortizedMonthlyPayment(principal, apr, termTicks) {
    const safePrincipal = Math.max(0, Number(principal) || 0);
    const safeApr = Math.max(0, Number(apr) || 0);
    const safeTerm = Math.max(1, Number(termTicks) || 1);
    const r = (safeApr / 100) / 12;
    if (r === 0) return Math.round(safePrincipal / safeTerm);
    const factor = Math.pow(1 + r, safeTerm);
    return Math.round(safePrincipal * (r * factor) / (factor - 1));
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
//    - js/corp-refurbish.js client-side refurbish cost (player-initiated expense)
//    - non-P&L principal transfers (loan principal debit/credit at ~L4355 /
//      ~L4378 / ~L5419, bond principal credit at ~L2713). These belong in
//      capital_in / capital_out / debt_principal categories, which need the
//      helper extended to skip P&L semantics — deferred.
//  Follow-up: route these through logCashEvent in a later phase.
// ════════════════════════════════════════════════════════════════════════════════

let _currentTick = 0;
const _pendingCashEvents = [];

// corp_id → home nation_id, populated once per advanceCorpTick run so
// logCashEvent can default to the corp's home nation when callers
// don't pass an explicit jurisdiction. Revenue sites tied to a
// foreign nation (Regional HQ income, sub revenue, shipping contract
// in another nation) override this default by passing nationId.
let _corpHomeNation = new Map();

async function loadCorpHomeNations(supabase) {
    const { data, error } = await supabase
        .from('factions')
        .select('id, nation_id')
        .eq('faction_type', 'corporation');
    if (error) {
        console.warn('[advance-corp-tick] corp home nation cache load failed:', error.message);
        _corpHomeNation = new Map();
        return;
    }
    _corpHomeNation = new Map((data || []).map(r => [r.id, r.nation_id]));
}

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

function logCashEvent(corpId, category, label, delta, nationId) {
    if (!corpId || !Number.isFinite(delta) || delta === 0) return;
    const tagNationId = nationId ?? _corpHomeNation.get(corpId) ?? null;
    _pendingCashEvents.push({
        corp_id:   corpId,
        tick:      _currentTick,
        category,
        label:     String(label || category),
        delta,
        nation_id: tagNationId,
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
        // No nation filter: a corp's properties can live in a different
        // nation than its HQ. Filtering by nation.id silently skipped
        // foreign-nation properties. Each corp appears in exactly one
        // nation's corps list (its HQ nation), so this runs once per
        // corp per tick.
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

// Regional HQ property income — flat-ish trickle scaled by purchase price.
// 0.2% of purchase price per tick × stability modifier. At a $20M HQ that's
// ~$40k/tick baseline, maintenance is charged separately in PropertyEffects.
const HQ_PROPERTY_INCOME_RATE = 0.002;

// Regional HQ property income — simple flat-ish income based on purchase price.
// Purpose: a marketplace-purchased HQ is a property, not a business branch, so
// it earns property income (like rent) rather than business revenue. The
// amount is small and predictable — 0.2% of purchase price per tick, modified
// by the nation's stability. No GDP or reputation scaling.
async function processRegionalHqIncome(supabase, nation, currentTick) {
    const stabilityMod = Math.min(1.0, Number(nation.stability ?? 50) / 40);

    const { data: hqs, error: hqErr } = await supabase
        .from('corp_properties')
        .select('id, sub_cash, name, purchase_price, faction_id')
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
                // Log to corp_cash_events as territorial revenue so the
                // tax assessor sees this nation's HQ income in the
                // parent corp's revenue base. Cash stays in sub_cash;
                // the event is ledger-only (logCashEvent doesn't touch
                // corp_cash_reserves).
                if (hq.faction_id) {
                    logCashEvent(hq.faction_id, 'revenue_market',
                        `${hq.name} HQ income`, income, nation.id);
                }
                console.log(`[HqIncome] ${hq.name}: +${income.toLocaleString()} (price:${purchasePrice.toLocaleString()}, stabMod:${stabilityMod.toFixed(2)}, cash:${Number(hq.sub_cash ?? 0).toLocaleString()} → ${newSubCash.toLocaleString()})`);
            }
        } catch (hqErr) {
            console.error(`[HqIncome] HQ threw (hq.id=${hq.id}, name=${hq.name}):`, hqErr);
        }
    }

    console.log(`[HqIncome] ${nation.name}: processed ${hqs.length} regional HQ(s), updated ${updatedCount}, at tick ${currentTick}.`);
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


// ════════════════════════════════════════════════════════════════════════════════
//  CORP CONTRACT PROGRESSION
//
//  One per-nation pass per corp tick. Loads every active corp_contract,
//  joins to the winning corp_contract_bids row (status='accepted'), and:
//    1. Idempotency gate: skip if c.progress_pct already matches the
//       current-tick value (cron re-fire / replay → no double-charge).
//    2. Crew-deploy gate (re-introduced 20261101): skip if
//       c.crews_working = 0. The contract stalls — no progress, no
//       cost — until the owning corp deploys crews via
//       set_crews_working.
//    3. Deduct perTickCost = bid.bid_amount / timeline_months from the
//       winning corp's cash, emit 'event_cost' cash event labelled
//       "{contract.name} Construction Costs".
//    4. Compute progress_pct = (currentTick − started_at_tick) / timeline_months
//       × 100 (clamped 0..100), update progress_pct + amount_spent.
//    5. On 100%, set status='completed', stamp completed_at_tick, and
//       pay out bid.bid_amount immediately via 'capital_in'
//       "{name} · final payment". Synchronous payout keeps the
//       contract on the dashboard until the status flips, so there's no
//       "completed-but-invisible" window.
//
//  Replaces the legacy processActiveProjects loop (deleted) which
//  targeted the now-retired construction_contracts table and never
//  fired against the live corp_contracts where progress_pct sits.
async function processCorpContracts(supabase, nationId, currentTick) {
    const results = [];

    const { data: contracts, error: contractsErr } = await supabase
        .from('corp_contracts')
        .select('id, name, started_at_tick, timeline_months, progress_pct, amount_spent, crews_working')
        .eq('issuer_nation_id', nationId)
        .eq('status', 'active');
    if (contractsErr) {
        console.warn(`[CorpContracts] Active fetch failed for nation ${nationId}:`, contractsErr.message);
        return results;
    }
    if (!contracts || contracts.length === 0) return results;

    const contractIds = contracts.map(c => c.id);
    const { data: bids, error: bidsErr } = await supabase
        .from('corp_contract_bids')
        .select('contract_id, faction_id, bid_amount')
        .in('contract_id', contractIds)
        .eq('status', 'accepted');
    if (bidsErr) {
        console.warn(`[CorpContracts] Bid fetch failed for nation ${nationId}:`, bidsErr.message);
        return results;
    }
    const bidByContract = {};
    for (const b of (bids || [])) bidByContract[b.contract_id] = b;

    for (const c of contracts) {
        const bid = bidByContract[c.id];
        if (!bid) {
            console.warn(`[CorpContracts] ${c.name}: no accepted bid, skipping`);
            continue;
        }

        const startedAt = Number(c.started_at_tick);
        if (!Number.isFinite(startedAt)) continue;
        const totalTicks = Math.max(1, Number(c.timeline_months) || 1);
        const ticksElapsed = currentTick - startedAt;
        // Defer the award tick (off-by-one) so cost + progress kick
        // in starting one tick after award.
        if (ticksElapsed <= 0) continue;

        // Idempotency gate: progress_pct is deterministic from elapsed
        // ticks, so if it already matches the new value this tick has
        // already been processed (e.g. cron re-fire). Skipping prevents
        // double-deducting the per-tick cost.
        const newProgressPct = Math.min(100, Math.round((ticksElapsed / totalTicks) * 10000) / 100);
        if (Number(c.progress_pct || 0) >= newProgressPct) continue;

        // Crew-deploy gate. Contracts with no crews physically
        // working stall — no progress, no cost. The owner has to
        // call set_crews_working to deploy.
        if ((Number(c.crews_working) || 0) === 0) {
            console.log(`[CorpContracts] ${c.name}: STALLED (0 crews working — owner must deploy via Manage Crews)`);
            continue;
        }

        const totalBid = Number(bid.bid_amount || 0);
        const perTickCost = Math.round(totalBid / totalTicks);

        // Per-tick cost deduction.
        if (perTickCost > 0) {
            const { data: corp, error: corpErr } = await supabase
                .from('factions')
                .select('corp_cash_reserves')
                .eq('id', bid.faction_id)
                .single();
            if (corpErr) {
                console.warn(`[CorpContracts] ${c.name}: corp cash fetch failed:`, corpErr.message);
            } else if (corp) {
                const newCash = Math.max(0, Number(corp.corp_cash_reserves || 0) - perTickCost);
                const { error: updCashErr } = await supabase.from('factions')
                    .update({ corp_cash_reserves: newCash })
                    .eq('id', bid.faction_id);
                if (updCashErr) {
                    console.warn(`[CorpContracts] ${c.name}: cash deduct failed:`, updCashErr.message);
                } else {
                    logCashEvent(bid.faction_id, 'event_cost',
                        `${c.name || 'Project'} Construction Costs`, -perTickCost);
                }
            }
        }

        // Progress + amount_spent + completion + immediate payout.
        const newAmountSpent = Number(c.amount_spent || 0) + perTickCost;
        const updates = {
            progress_pct: newProgressPct,
            amount_spent: newAmountSpent,
        };

        if (newProgressPct >= 100) {
            updates.status = 'completed';
            updates.completed_at_tick = currentTick;

            // Pay out the bid amount immediately. Doing it synchronously
            // (no payout_tick scheduling) keeps the contract visible in
            // the dashboard's active panel until it leaves with the
            // status flip, so there's no "completed, awaiting payment"
            // gap window where the contract is invisible to the player.
            if (totalBid > 0) {
                const { data: corp, error: corpErr } = await supabase
                    .from('factions')
                    .select('corp_cash_reserves')
                    .eq('id', bid.faction_id)
                    .single();
                if (corpErr) {
                    console.warn(`[CorpContracts] ${c.name}: payout corp fetch failed:`, corpErr.message);
                } else if (corp) {
                    const newCash = Number(corp.corp_cash_reserves || 0) + totalBid;
                    const { error: payErr } = await supabase.from('factions')
                        .update({ corp_cash_reserves: newCash })
                        .eq('id', bid.faction_id);
                    if (payErr) {
                        console.warn(`[CorpContracts] ${c.name}: payout deposit failed:`, payErr.message);
                    } else {
                        logCashEvent(bid.faction_id, 'capital_in',
                            `${c.name || 'Project'} · final payment`, totalBid);
                    }
                }
            }
            results.push({ contract: c.name, completed: true, paid: totalBid });
        }

        const { error: updErr } = await supabase.from('corp_contracts')
            .update(updates)
            .eq('id', c.id);
        if (updErr) {
            console.warn(`[CorpContracts] ${c.name}: progress update failed:`, updErr.message);
        }
    }

    return results;
}


// ════════════════════════════════════════════════════════════════════════════════
//  CORP CONTRACT EVENTS PIPELINE
//
//  Two functions read corp_contracts and write corp_contract_events:
//  generateCorpContractProjectEvents fires random per-tick events on
//  active contracts; resolveExpiredCorpContractEvents auto-resolves
//  events the player ignored past their deadline.
//
//  Notes on shape:
//    - Status filter: corp_contracts uses 'active'.
//    - Faction column: winner_faction_id (the awarded corp).
//    - Sector match: corp_contracts.project_type is "Civil Engineering" /
//      "Industrial" / "Megaproject" (display form). The event catalog's
//      appliesTo uses 'civil_engineering' / 'industrial' / 'mega_project'
//      (snake_case keys). projectTypeToSectorKey() bridges them.
//    - resolveExpiredCorpContractEvents has no insurance integration
//      (dead finance_active_loans pipeline). Insurance will be re-added
//      when the new bank_loans pipeline grows insurance products.
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
    //
    // Internal-debt-service baseline also removed: it was amortizing a
    // legacy `corp_loans` ghost balance that nothing in the current
    // codebase increments. Real loans go through bank_loans /
    // finance_active_loans and are serviced in processBankLoanPayments
    // (debt_interest / "Loan interest paid", decrements corp_debt).

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

        // Corporate tax: applied to positive monthly income (profit only)
        // corporate_tax is 0-100 scale on the nation, treated as percentage
        const corpTaxRate = Math.max(0, Math.min(1, (Number(nation.corporate_tax ?? 0) / 100) || 0));
        const taxableIncome = Math.max(0, monthlyIncome);
        const taxAmount = Math.round(taxableIncome * corpTaxRate);

        const netChange = monthlyIncome - taxAmount;
        const newCash = Math.max(0, currentCash + netChange);

        const { error: updateErr } = await supabase.from('factions')
            .update({ corp_cash_reserves: newCash })
            .eq('id', corp.id);
        if (updateErr) {
            console.error(`[advance-corp-tick] Income update failed for ${corp.faction_name}:`, updateErr.message);
        } else {
            // Log each P&L component to corp_cash_events, only after the
            // cash write succeeded.
            logCashEvent(corp.id, 'exec_salary', 'Executive salaries', -monthlyExecSalaries);
            logCashEvent(corp.id, 'tax',         'Corporate tax',      -taxAmount);
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
//  EXECUTIVE CONTRACT EXPIRY
//  Flip every active exec whose contract_end_tick has passed to
//  status='expired'. The role becomes vacant in the Actions UI;
//  player must use Executive Search to refill. Replaces the old
//  auto-rehire-on-page-load behavior.
// ════════════════════════════════════════════════════════════════════════════════
async function expireExecutiveContracts(supabase, currentTick) {
    const { data: expired, error } = await supabase.from('corp_executives')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('status', 'active')
        .lt('contract_end_tick', currentTick)
        .select('id, role, faction_id');
    if (error) {
        console.error('[advance-corp-tick] Exec expiry failed:', error.message);
        return 0;
    }
    const count = (expired || []).length;
    if (count > 0) {
        console.log(`[advance-corp-tick] Expired ${count} executive contract(s) at tick ${currentTick}`);
    }
    return count;
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

        let payment = amortizedMonthlyPayment(principal, apr, termTicks);
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
        logCashEvent(contract.winner_faction_id, 'revenue_shipping', 'Shipping route revenue', revenue, contract.nation_id);

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
//   - Per-tick payment debits the buyer nation's treasury and
//     credits the corp's cash + emits a revenue_trade event. (SOP
//     path prints revenue ambiently — wrong model for trade agreements.)
//
//   - Route risk delta from the winning offer's modifiers is applied
//     to the corp's corp_route_risk on award (clamped 0..10) and
//     reverted on contract completion / maturity.
// ════════════════════════════════════════════════════════════════
// AVIATION MANUFACTURING — DESIGN RESEARCH SWEEP
// Per-tick advancement of every active engine / aircraft design
// research project. Deducts research_cost_per_tick (default $1M) via
// emit_corp_cash_event for the audit trail, decrements
// research_ticks_remaining, and graduates the row to status='available'
// when the counter hits zero. Insufficient cash pauses the project
// without progress or cost — cash returns, progress resumes next tick.
// ════════════════════════════════════════════════════════════════
async function processAviationDesignResearch(supabase, currentTick) {
    const { data: designs, error } = await supabase
        .from('corp_aircraft_designs')
        .select('id, corp_id, name, design_type, research_ticks_remaining, research_cost_per_tick, factions:corp_id(id, faction_name, corp_cash_reserves)')
        .eq('status', 'researching')
        .gt('research_ticks_remaining', 0);
    if (error) {
        console.warn('[AviationDesignResearch] fetch failed:', error.message);
        return null;
    }
    if (!designs || designs.length === 0) return { advanced: 0, completed: 0, paused: 0 };

    let advanced = 0;
    let completed = 0;
    let paused = 0;

    for (const d of designs) {
        const corp = d.factions || {};
        const cash = Number(corp.corp_cash_reserves) || 0;
        const cost = Number(d.research_cost_per_tick) || 0;

        if (cash < cost) {
            paused++;
            continue;
        }

        // Cash deduction via the same audited path as every other
        // corp P&L flow. category='research' surfaces R&D as its own
        // line in the cash-events ledger.
        try {
            await supabase.rpc('emit_corp_cash_event', {
                p_corp_id:  d.corp_id,
                p_category: 'research',
                p_label:    `R&D · ${d.name} ${d.design_type === 'engine' ? 'engine' : 'airframe'} design`,
                p_delta:    -cost,
                p_tick:     currentTick,
            });
        } catch (cashErr) {
            console.warn(`[AviationDesignResearch] cash deduct failed for ${d.id}:`, cashErr?.message || cashErr);
            paused++;
            continue;
        }

        const newRemaining = (Number(d.research_ticks_remaining) || 0) - 1;
        const willComplete = newRemaining <= 0;

        const updatePayload = willComplete
            ? { research_ticks_remaining: 0, status: 'available', completed_at_tick: currentTick }
            : { research_ticks_remaining: newRemaining };

        const { error: updErr } = await supabase
            .from('corp_aircraft_designs')
            .update(updatePayload)
            .eq('id', d.id);
        if (updErr) {
            console.warn(`[AviationDesignResearch] update failed for ${d.id}:`, updErr.message);
            continue;
        }

        if (willComplete) completed++;
        else              advanced++;
    }

    return { advanced, completed, paused };
}


// ════════════════════════════════════════════════════════════════
// Aviation Manufacturing — production runs.
// Per active corp_production_runs row (status='active'):
//   1. If corp cash < cost_per_tick, pause this tick (no progress,
//      no charge). Cash returns → progress resumes next tick.
//   2. Deduct cost_per_tick via emit_corp_cash_event.
//   3. Decrement ticks_remaining by 1.
//   4. Compute "should be delivered by now" =
//        min(quantity, floor(ticks_elapsed / time_per_unit) × parallel_capacity)
//      and deliver any new units (delta from completed_quantity) by
//      bumping the design's inventory_on_hand.
//   5. On ticks_remaining = 0: status='completed', stamp
//      completed_at_tick. The plant join rows are kept (status filter
//      excludes them from "occupied" lookups going forward).
// ════════════════════════════════════════════════════════════════
// Aircraft RFP expiry sweep.
// Closes RFPs whose expires_at_tick has passed without an
// accepted bid: status open → expired, all pending bids on the
// RFP → rejected. The award path (award_aircraft_rfp RPC) handles
// the happy case; this is the "nobody bought it in time" path.
// ════════════════════════════════════════════════════════════════
async function processAircraftRfpExpiry(supabase, currentTick) {
    const { data: due, error } = await supabase
        .from('aircraft_rfps')
        .select('id')
        .eq('status', 'open')
        .lte('expires_at_tick', currentTick);
    if (error) {
        console.warn('[AircraftRfpExpiry] fetch failed:', error.message);
        return null;
    }
    if (!due || due.length === 0) return { expired: 0 };

    const rfpIds = due.map(r => r.id);

    const { error: rfpErr } = await supabase
        .from('aircraft_rfps')
        .update({ status: 'expired' })
        .in('id', rfpIds);
    if (rfpErr) {
        console.warn('[AircraftRfpExpiry] RFP status update failed:', rfpErr.message);
        return null;
    }

    const { error: bidErr } = await supabase
        .from('aircraft_rfp_bids')
        .update({ status: 'rejected' })
        .in('rfp_id', rfpIds)
        .eq('status', 'pending');
    if (bidErr) {
        console.warn('[AircraftRfpExpiry] bid status update failed:', bidErr.message);
    }

    return { expired: rfpIds.length };
}


// ════════════════════════════════════════════════════════════════
async function processProductionRuns(supabase, currentTick) {
    const { data: runs, error } = await supabase
        .from('corp_production_runs')
        .select('id, corp_id, design_id, design_type, quantity, completed_quantity, cost_per_tick, time_per_unit, parallel_capacity, total_ticks, ticks_remaining, factions:corp_id(faction_name, corp_cash_reserves)')
        .eq('status', 'active')
        .gt('ticks_remaining', 0);
    if (error) {
        console.warn('[ProductionRuns] fetch failed:', error.message);
        return null;
    }
    if (!runs || runs.length === 0) return { advanced: 0, delivered: 0, completed: 0, paused: 0 };

    let advanced = 0;
    let delivered = 0;
    let completed = 0;
    let paused = 0;

    for (const r of runs) {
        const corp = r.factions || {};
        const cash = Number(corp.corp_cash_reserves) || 0;
        const cost = Number(r.cost_per_tick) || 0;

        if (cash < cost) {
            paused++;
            continue;
        }

        try {
            await supabase.rpc('emit_corp_cash_event', {
                p_corp_id:  r.corp_id,
                p_category: 'event_cost',
                p_label:    `Production · ${r.design_type === 'engine' ? 'Engine' : 'Aircraft'} build`,
                p_delta:    -cost,
                p_tick:     currentTick,
            });
        } catch (cashErr) {
            console.warn(`[ProductionRuns] cash deduct failed for ${r.id}:`, cashErr?.message || cashErr);
            paused++;
            continue;
        }

        const totalTicks      = Number(r.total_ticks) || 1;
        const newRemaining    = Math.max(0, (Number(r.ticks_remaining) || 0) - 1);
        const ticksElapsed    = totalTicks - newRemaining;
        const timePerUnit     = Math.max(1, Number(r.time_per_unit) || 1);
        const parallelCap     = Math.max(1, Number(r.parallel_capacity) || 1);
        const cyclesCompleted = Math.floor(ticksElapsed / timePerUnit);
        const shouldBeDelivered = Math.min(Number(r.quantity) || 0, cyclesCompleted * parallelCap);
        const newCompleted    = Math.max(Number(r.completed_quantity) || 0, shouldBeDelivered);
        const newDeliveries   = newCompleted - (Number(r.completed_quantity) || 0);

        // Inventory bump for any units crossing a cycle boundary this
        // tick. If the bump fails we MUST refund the cash we just
        // deducted and skip advancing the run row — otherwise the
        // player paid for units they never received and the cycle
        // math won't re-trigger them next tick (completed_quantity
        // would have been advanced regardless).
        let inventoryWriteFailed = false;
        if (newDeliveries > 0) {
            const { data: design, error: dErr } = await supabase
                .from('corp_aircraft_designs')
                .select('inventory_on_hand')
                .eq('id', r.design_id)
                .single();
            if (dErr) {
                console.warn(`[ProductionRuns] design fetch failed for ${r.id}:`, dErr.message);
                inventoryWriteFailed = true;
            } else {
                const newInv = (Number(design?.inventory_on_hand) || 0) + newDeliveries;
                const { error: invErr } = await supabase
                    .from('corp_aircraft_designs')
                    .update({ inventory_on_hand: newInv })
                    .eq('id', r.design_id);
                if (invErr) {
                    console.warn(`[ProductionRuns] inventory bump failed for ${r.id}:`, invErr.message);
                    inventoryWriteFailed = true;
                } else {
                    delivered += newDeliveries;
                }
            }
        }

        if (inventoryWriteFailed) {
            // Refund the tick's cost so the corp isn't charged for a
            // tick that produced nothing. Don't advance the run; next
            // tick will retry the same delivery batch.
            try {
                await supabase.rpc('emit_corp_cash_event', {
                    p_corp_id:  r.corp_id,
                    p_category: 'event_cost',
                    p_label:    `Production refund · inventory write retry`,
                    p_delta:    cost,
                    p_tick:     currentTick,
                });
            } catch (refundErr) {
                console.warn(`[ProductionRuns] cash refund failed for ${r.id}:`, refundErr?.message || refundErr);
            }
            paused++;
            continue;
        }

        const willComplete = newRemaining <= 0;
        const updatePayload = willComplete
            ? { ticks_remaining: 0, completed_quantity: newCompleted, status: 'completed', completed_at_tick: currentTick }
            : { ticks_remaining: newRemaining, completed_quantity: newCompleted };

        const { error: updErr } = await supabase
            .from('corp_production_runs')
            .update(updatePayload)
            .eq('id', r.id);
        if (updErr) {
            console.warn(`[ProductionRuns] update failed for ${r.id}:`, updErr.message);
            continue;
        }

        if (willComplete) completed++;
        else              advanced++;
    }

    return { advanced, delivered, completed, paused };
}


// ════════════════════════════════════════════════════════════════
async function processTradeAgreementShipping(supabase, currentTick) {
    const results = {
        awarded: 0, completed: 0, paid: 0, polling: 0, renewed: 0,
        missed: 0, bidsAccepted: 0, bidsAutoRejected: 0,
    };
    const nowIso = () => new Date().toISOString();

    // ── Pass A: Auto-award (trade-agreement contracts only) ──
    // Trade-agreement contracts have no bid window — they sit as
    // Available Routes until a corp bids, then award on the next
    // corp-tick. Pick every status='open' trade-agreement contract;
    // the per-contract bid fetch decides whether to award now or
    // skip until later. Migration 20261018 sets a sentinel
    // expires_at_tick (INT_MAX) at spawn so the UI's
    // `.gt(expires_at_tick, current_tick)` filter passes forever
    // and the legacy auto-extend (incrementing expires_at_tick by
    // +1 each tick on zero bids) is no longer needed.
    const { data: closing, error: closingErr } = await supabase
        .from('shipping_contracts')
        .select('id, delivery_priority, term_ticks, volume_required, trade_agreement_id, nation_id')
        .eq('status', 'open')
        .not('trade_agreement_id', 'is', null);

    if (closingErr) {
        console.warn('[TradeAgreementShipping] closing fetch failed:', closingErr.message);
    } else if (closing && closing.length > 0) {
        for (const contract of closing) {
            const { data: bids, error: bidsErr } = await supabase
                .from('shipping_contract_bids')
                .select('id, bidder_faction_id, offered_revenue_per_tick, energy_per_tick, route_risk_delta, bidder_route_risk_snapshot, freighters_allocated, applied_at_tick')
                .eq('contract_id', contract.id)
                .eq('status', 'pending')
                .order('applied_at_tick', { ascending: true });
            if (bidsErr) {
                console.warn(`[TradeAgreementShipping] bids fetch failed for ${contract.id}:`, bidsErr.message);
                continue;
            }

            // Zero offers ⇒ leave the contract sitting open. No
            // window to extend, no expiry to advance — just wait
            // for a corp to bid on a future tick.
            if (!bids || bids.length === 0) {
                results.polling++;
                continue;
            }

            // Score per delivery_priority. Lower score = better in our
            // sort. Fastest negates freighters so the largest fleet wins;
            // safest reads the corp's full route-risk snapshot (fleet
            // baseline + modifier deltas), not just the modifier sum.
            const priority = contract.delivery_priority || 'cheapest';
            const score = (b) => {
                if (priority === 'fastest') return -(Number(b.freighters_allocated) || 0);
                if (priority === 'safest')  return  Number(b.bidder_route_risk_snapshot) || 0;
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
        // Unit boundary: nation.budget is abstract integers (1 = $1M raw
        // post-20261206); revenue is raw dollars from the contract.
        // RAW_PER_ABSTRACT bridges the comparison + the debit back.
        const RAW_PER_ABSTRACT = 1_000_000;
        const { data: buyer, error: bErr } = await supabase.from('nations')
            .select('budget').eq('id', contract.nation_id).single();
        if (bErr || !buyer) {
            console.warn(`[TradeAgreementShipping] buyer fetch failed for ${contract.id}:`, bErr?.message);
            continue;
        }
        const buyerBudgetAbstract = Number(buyer.budget) || 0;
        const buyerBudgetRaw      = buyerBudgetAbstract * RAW_PER_ABSTRACT;
        const canPay              = buyerBudgetRaw >= revenue;

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
            .update({ budget: (buyerBudgetRaw - actualPayment) / RAW_PER_ABSTRACT })
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
        logCashEvent(contract.winner_faction_id, 'revenue_trade', 'Trade-agreement payment', actualPayment, contract.nation_id);

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

        // Equity dividend processing for finance_active_loans rows with
        // request_type='equity' was removed in 20261008. The new equity
        // system uses equity_positions (created by 20260602) and is paid
        // out by process_equity_dividends (called once per tick from the
        // EDP block below). Old finance_active_loans rows from before
        // the v2 equity rebuild (20260430 → 20260602) are inert; nothing
        // creates them anymore. If any do exist they MUST skip the
        // default loan-processing fall-through at the bottom of this
        // loop — that path would log them as "Loan interest paid" /
        // "Loan interest received", which is wrong for equity.
        if (requestType === 'equity') {
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
//  MAIN ORCHESTRATOR
// ════════════════════════════════════════════════════════════════════════════════

async function advanceCorpTick(supabase, { force = false, runNow = false } = {}) {
    // ── Build fingerprint canary ──
    // Tells us whether a deploy actually replaced the running bundle.
    // After `supabase functions deploy advance-corp-tick`, the next
    // cron invocation should log this exact string. If it doesn't,
    // the deploy didn't take effect (Supabase dashboard cache /
    // wrong project / silent failure). Bump the date suffix on each
    // intentional redeploy so we can distinguish stale invocations
    // from new ones in the function logs.
    console.log('[advance-corp-tick] BUILD_MARKER 2026-05-13-b (strip-health-insurance)');

    // 1+2+3. Read + idempotency + time-gating + atomic claim, all in
    //        one RPC. SECURITY DEFINER pl/pgsql bypasses PostgREST's
    //        per-column schema cache — which was the recurring root
    //        cause of the "column shard.corp_last_processed_tick does
    //        not exist" failure even after the column was confirmed
    //        present in PostgreSQL. The RPC also serializes concurrent
    //        cron fires via its conditional UPDATE: only one tick
    //        instance can move the marker forward; every other returns
    //        already_claimed and exits cleanly.
    const { data: claim, error: claimErr } = await supabase.rpc('claim_corp_tick', {
        p_force: force,
        p_run_now: runNow,
    });

    if (claimErr) {
        console.error('[advance-corp-tick] claim_corp_tick RPC failed:', claimErr.message);
        return { status: 'claim_error', error: claimErr.message };
    }
    if (!claim) {
        throw new Error('claim_corp_tick returned no payload');
    }
    if (claim.status === 'shard_not_found') {
        throw new Error('Shard not found');
    }
    if (claim.status === 'already_processed') {
        return { status: 'already_processed', tick: claim.tick };
    }
    if (claim.status === 'not_due') {
        const remainMs = claim.corp_due_in_ms ?? 0;
        console.log(`[advance-corp-tick] Not due — tick ${claim.tick}, corp due in ${Math.round(remainMs / 1000)}s`);
        return { status: 'not_due', tick: claim.tick, corp_due_in_ms: remainMs };
    }
    if (claim.status === 'already_claimed') {
        console.log(`[advance-corp-tick] Tick ${claim.tick} already claimed by a concurrent run — exiting.`);
        return { status: 'already_claimed', tick: claim.tick };
    }
    // claim.status === 'claimed' — proceed with tick processing.

    const currentTick = claim.tick;
    const shard = {
        current_tick: currentTick,
        current_date: claim.current_date,
    };

    console.log(`[advance-corp-tick] Processing tick ${currentTick} (${shard.current_date})`);

    // Capture the tick number for logCashEvent and reset its buffer.
    // The buffer holds every cash event accrued so far this tick; it
    // flushes to corp_cash_events at tick end.
    _currentTick = currentTick;
    _pendingCashEvents.length = 0;

    // Populate the corp → home nation cache so logCashEvent can tag
    // events with the corp's jurisdiction without callers threading it
    // through every site. Revenue events tied to a foreign nation
    // (Regional HQ, sub, foreign contract) pass nationId explicitly to
    // override this default.
    await loadCorpHomeNations(supabase);

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

    // ── Corporate tax assessment (once per game year at the January anchor) ──
    // Sums revenue_* corp_cash_events from ticks [currentTick-12, currentTick-1]
    // per (corp, nation) and inserts corp_tax_bills rows with status='due'.
    // Idempotent on (corp, nation, year) via UNIQUE constraint — cron retry
    // can't double-issue. Skip tick 0 (no prior year to assess).
    if (currentTick > 0 && currentTick % 12 === 0) {
        try {
            const { data: assessResult, error: assessErr } = await supabase.rpc(
                'assess_corporate_taxes', { p_current_tick: currentTick }
            );
            if (assessErr) {
                console.error('[advance-corp-tick] corp tax assessment failed:', assessErr.message);
                summary.errors.push({ scope: 'corp_tax_assess', error: assessErr.message });
            } else {
                console.log(`[CorpTax] Year ${assessResult?.year ?? '?'}: inserted ${assessResult?.inserted ?? 0} bill(s), skipped ${assessResult?.skipped_dup ?? 0} duplicate(s) at tick ${currentTick}.`);
            }
        } catch (taxErr) {
            console.error('[advance-corp-tick] corp tax assessment threw (non-fatal):', taxErr);
            summary.errors.push({ scope: 'corp_tax_assess', error: String(taxErr) });
        }
    }

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
                .select('id, faction_name, corp_sector, corp_subsector, corp_cash_reserves, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce, corp_reputation')
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
            // Generation runs once per shard tick via
            // generateCorpContractsByGdpTier; awards run via the
            // award_construction_contract RPC + auto-award cron. Per-nation
            // work here is just per-tick progression + events on active
            // corp_contracts. Legacy construction_contracts pipeline
            // (resolveExpiredBids, processActiveProjects, generateProjectEvents,
            // resolveExpiredEvents, generateConstructionContracts and
            // generateInfraRenewalContracts no-op stubs) was retired.
            try {
                // Per-tick contract progression: deduct cost, advance
                // progress_pct, mark completed at 100%, schedule payout.
                const projectResults = await processCorpContracts(supabase, nation.id, currentTick);
                if (projectResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'completions', data: projectResults });
                }

                // Per-tick random events on active corp_contracts.
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

                // Auto-resolve corp_contract_events the player ignored.
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
                // Per-project: (budget / $100M) × 0.1 / timeline_months
                // Spreads the 0.1-per-$100M impact evenly across the project lifetime.
                // Multiple projects stack additively.
                const { data: activeForGdp } = await supabase
                    .from('corp_contracts')
                    .select('budget, timeline_months')
                    .eq('issuer_nation_id', nation.id)
                    .eq('status', 'active');
                let gdpBoost = 0;
                for (const c of (activeForGdp || [])) {
                    const budget = Number(c.budget || 0);
                    const ticks = Number(c.timeline_months || 1);
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
            // ledger and corp_cash_reserves stay in sync.
            try {
                const airlineCorps = corps.filter(c => c.corp_sector === 'Airline');
                if (airlineCorps.length > 0) {
                    console.log(`[Airline] ${nation.name}: ${airlineCorps.length} airline corp(s) — ${airlineCorps.map(c => c.faction_name).join(', ')}`);
                }
                for (const ac of airlineCorps) {
                    const { data: airlineResult, error: airlineErr } = await supabase
                        .rpc('process_airline_corp_tick', { p_corp_id: ac.id, p_tick: currentTick });
                    if (airlineErr) {
                        console.error(`[advance-corp-tick] Airline tick failed for ${ac.faction_name} (non-fatal):`, airlineErr.message);
                        summary.errors.push({ nation: nation.name, sector: 'airline', corp: ac.faction_name, error: airlineErr.message });
                        continue;
                    }
                    console.log(`[Airline] ${ac.faction_name} → routes=${airlineResult?.routes ?? 'null'}, pax=${airlineResult?.pax ?? 'null'}, revenue=${airlineResult?.revenue ?? 'null'}`);
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

            // ── Regional HQ Property Income (flat-ish income from marketplace HQs) ──
            try {
                await processRegionalHqIncome(supabase, nation, currentTick);
            } catch (hqIncErr) {
                console.error(`[advance-corp-tick] Regional HQ income failed for ${nation.name} (non-fatal):`, hqIncErr);
                summary.errors.push({ nation: nation.name, sector: 'regional_hq_income', error: String(hqIncErr) });
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

            // ── Shipping Sector — RETIRED ────────────────────────────────
            // Organic + trade-agreement-flow shipping_routes generation is
            // gone. Trade agreements spawn shipping_contracts directly via
            // trg_spawn_shipping_contracts; bids flow through
            // place_shipping_offer; auto-award runs in
            // processTradeAgreementShipping below. Pre-existing awarded
            // shipping_claims still drain through processShippingRoutes
            // until they complete naturally.

            // ── Ship Market — Generate listings every 8 ticks ────────────
            try {
                if (!summary._shipMarketGenerated && currentTick % 8 === 0) {
                    await generateShipMarketListings(supabase, currentTick);
                    summary._shipMarketGenerated = true;
                }
            } catch (mktErr) {
                console.error(`[advance-corp-tick] Ship market generation failed (non-fatal):`, mktErr);
            }

            // ── Executive Contract Expiry — Once per tick (global pass) ──
            // Flips status='active'→'expired' for any exec whose
            // contract_end_tick is now in the past. Vacates the role
            // until the player explicitly re-hires via Executive Search.
            try {
                if (!summary._execExpiryProcessed) {
                    await expireExecutiveContracts(supabase, currentTick);
                    summary._execExpiryProcessed = true;
                }
            } catch (expErr) {
                console.error(`[advance-corp-tick] Executive expiry failed (non-fatal):`, expErr);
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
                        .select('id, faction_name, corp_sector, corp_subsector, corp_cash_reserves, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce, corp_reputation')
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
                            // Hoisted up here from below so the revenue logCashEvent
                            // call can tag with the destination nation (territorial
                            // tax). Originally lived next to the auto-refuel block
                            // since refuel reads it too.
                            const destNationId = claim.shipping_routes?.destination_nation_id || claim.nation_id;

                            // Credit revenue to corp
                            if (revenue > 0) {
                                const { data: corp } = await supabase.from('factions')
                                    .select('corp_cash_reserves').eq('id', claim.faction_id).single();
                                if (corp) {
                                    logCashEvent(claim.faction_id, 'revenue_shipping', 'Shipping claim revenue', revenue, destNationId);
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

                            // Update assigned vessel: arrived at destination port + auto-refuel.
                            // destNationId hoisted above to the top of this branch so the
                            // revenue tag can use it.

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
                                    logCashEvent(fuelDepot.faction_id, 'revenue_shipping', 'Fuel depot revenue', depotRevenue, destNationId);
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
                                        logCashEvent(otherDock.faction_id, 'revenue_shipping', 'Dry dock revenue', dockRevenue, portNationId);
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

    // EDP: Equity dividend processor (shard-wide, anniversary-driven).
    // Iterates active equity_positions whose 12-tick anniversary has come
    // up. Pays 2% × borrower.corp_cash_reserves × equity_pct, floored at $0.
    // Borrower side: dividend_paid (Cost). Holder side: revenue_finance
    // (Revenue). Both go through emit_corp_cash_event — dashboards update
    // automatically. RPC owns iteration + locking; this just invokes once
    // per tick. See sql/migrations/20261008_process_equity_dividends_rpc.sql.
    try {
        const { data: divResult, error: divErr } = await supabase.rpc(
            'process_equity_dividends',
            { p_current_tick: currentTick }
        );
        if (divErr) {
            console.error('[advance-corp-tick] equity dividends RPC error:', divErr);
            summary.errors.push({ scope: 'equity_dividends', error: divErr.message });
        } else if (divResult && (divResult.paid > 0 || divResult.skipped > 0)) {
            summary.equityDividends = divResult;
            console.log(`[EquityDividends] tick ${currentTick}: ${divResult.paid} paid, ${divResult.skipped} skipped`);
        }
    } catch (divErr) {
        console.error('[advance-corp-tick] FAILED equity dividends:', divErr);
        summary.errors.push({ scope: 'equity_dividends', error: String(divErr) });
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

        // Aviation Manufacturing — design research advancement.
        // Each researching design ticks one step closer to availability,
        // costing $1M from the owner corp's cash reserves. Insufficient
        // cash pauses (no progress, no charge); cash returns and progress
        // resumes. On the final tick: status='available' + completed_at_tick.
        try {
            const designResearchResults = await processAviationDesignResearch(supabase, currentTick);
            if (designResearchResults && (designResearchResults.advanced > 0 || designResearchResults.completed > 0 || designResearchResults.paused > 0)) {
                summary.aviationDesignResearch = designResearchResults;
                console.log(`[AviationDesignResearch] tick ${currentTick}: ${designResearchResults.advanced} advanced, ${designResearchResults.completed} completed, ${designResearchResults.paused} paused (insufficient cash)`);
            }
        } catch (designErr) {
            console.error('[advance-corp-tick] Aviation design research failed (non-fatal):', designErr);
        }

        // Aviation Manufacturing — production runs advancement.
        // Each active run charges its cost_per_tick, decrements
        // ticks_remaining, and bumps the design's inventory_on_hand
        // for any units crossing a cycle boundary this tick.
        try {
            const productionResults = await processProductionRuns(supabase, currentTick);
            if (productionResults && (productionResults.advanced > 0 || productionResults.completed > 0 || productionResults.delivered > 0 || productionResults.paused > 0)) {
                summary.aviationProductionRuns = productionResults;
                console.log(`[ProductionRuns] tick ${currentTick}: ${productionResults.advanced} advanced, ${productionResults.delivered} units delivered, ${productionResults.completed} runs completed, ${productionResults.paused} paused (insufficient cash)`);
            }
        } catch (prodErr) {
            console.error('[advance-corp-tick] Aviation production runs failed (non-fatal):', prodErr);
        }

        // Aircraft RFP expiry — close any RFPs whose 6-tick window
        // ran out without an acceptance. Reject all pending bids
        // on those RFPs.
        try {
            const expiryResults = await processAircraftRfpExpiry(supabase, currentTick);
            if (expiryResults && expiryResults.expired > 0) {
                summary.aircraftRfpExpiry = expiryResults;
                console.log(`[AircraftRfpExpiry] tick ${currentTick}: ${expiryResults.expired} RFP(s) expired`);
            }
        } catch (expErr) {
            console.error('[advance-corp-tick] Aircraft RFP expiry failed (non-fatal):', expErr);
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
    // triggered it. The corp_last_processed_tick guard was already
    // written atomically at the start of the tick (see 3a above), so
    // a failure or timeout here loses at most this tick's events
    // ledger — corp_cash_reserves stays consistent and the next cron
    // fire is correctly skipped instead of re-running the whole tick.
    await flushCashEvents(supabase);

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
        // Check for force parameter (admin manual trigger) and run_now
        // (called by advance-tick after committing a new shard tick).
        let force = false;
        let runNow = false;
        try {
            const body = await Promise.race([
                req.json(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("body read timeout")), 3000)),
            ]);
            force = body?.force === true;
            runNow = body?.run_now === true || body?.runNow === true;
        } catch (_) {
            // No body, invalid JSON, or timeout — not forced
        }

        const url = new URL(req.url);
        force = force || url.searchParams.get('force') === 'true' || req.headers.get('x-force') === 'true';
        runNow = runNow
            || url.searchParams.get('run_now') === 'true'
            || url.searchParams.get('runNow') === 'true'
            || req.headers.get('x-run-now') === 'true';

        console.log(`[advance-corp-tick] Invoked (force=${force}, run_now=${runNow})`);

        // For run_now / force calls, this function is being invoked as a
        // synchronous dependency (usually by advance-tick or an admin repair).
        // Await it so the caller sees the real result instead of a false
        // positive "started" response while failures disappear into logs.
        if (runNow || force) {
            const result = await advanceCorpTick(supabase, { force, runNow });
            return new Response(
                JSON.stringify({ status: result?.status || "processed", result }),
                { headers: corsHeaders }
            );
        }

        // Normal cron invocations stay backgrounded: the cron fires every
        // minute and advanceCorpTick has its own persisted idempotency guard.
        // EdgeRuntime.waitUntil keeps the worker alive after the HTTP response
        // returns, but any background failure is logged and can be retried by
        // the next cron fire if corp_last_processed_tick was not claimed.
        const work = advanceCorpTick(supabase, { force, runNow })
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
