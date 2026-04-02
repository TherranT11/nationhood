// @ts-nocheck
/**
 * Supabase Edge Function: advance-corp-tick
 *
 * Server-side corporation tick processor for Nationhood Alpha.
 * Called by pg_cron every minute — reads current_tick from the shard,
 * skips if already processed, then runs all corporation systems.
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
    // Civil ($30M-$300M)
    municipal_hospital:   { name: 'Municipal Hospital', sector: 'civil_engineering', budget: [80e6,220e6], ticks: [6,12], desc: 'Healthcare facility, 200-400 beds' },
    regional_school:      { name: 'Regional School Complex', sector: 'civil_engineering', budget: [30e6,75e6], ticks: [4,8], desc: '8-16 classrooms with gym and labs' },
    highway_extension:    { name: 'Highway Extension', sector: 'civil_engineering', budget: [100e6,300e6], ticks: [8,16], desc: '20-80km arterial road segment' },
    public_housing:       { name: 'Public Housing Development', sector: 'civil_engineering', budget: [50e6,150e6], ticks: [6,12], desc: '200-600 residential units' },
    water_treatment:      { name: 'Water Treatment Facility', sector: 'civil_engineering', budget: [60e6,160e6], ticks: [6,10], desc: 'Municipal water processing plant' },
    government_office:    { name: 'Government Office Building', sector: 'civil_engineering', budget: [60e6,160e6], ticks: [6,10], desc: 'Administrative complex' },
    bridge_construction:  { name: 'Bridge Construction', sector: 'civil_engineering', budget: [80e6,250e6], ticks: [8,14], desc: 'River crossing or interchange' },
    transit_station:      { name: 'Public Transit Station', sector: 'civil_engineering', budget: [30e6,90e6], ticks: [4,8], desc: 'Bus terminal or rail stop' },
    waste_processing:     { name: 'Municipal Waste Processing Plant', sector: 'civil_engineering', budget: [50e6,130e6], ticks: [6,10], desc: 'Solid waste or sewage processing' },
    flood_defense:        { name: 'Coastal Flood Defense System', sector: 'civil_engineering', budget: [70e6,200e6], ticks: [8,14], desc: 'Seawalls, levees, drainage' },
    // Industrial ($200M-$800M)
    power_station:        { name: 'Power Station', sector: 'industrial', budget: [300e6,650e6], ticks: [10,18], desc: 'Coal, gas, or oil-fired generating plant' },
    hydroelectric_dam:    { name: 'Hydroelectric Dam', sector: 'industrial', budget: [450e6,800e6], ticks: [14,24], desc: 'River dam with power generation' },
    manufacturing_complex:{ name: 'Industrial Manufacturing Complex', sector: 'industrial', budget: [250e6,550e6], ticks: [10,16], desc: 'Factory, warehousing, logistics' },
    oil_refinery:         { name: 'Oil Refinery Expansion', sector: 'industrial', budget: [400e6,750e6], ticks: [12,20], desc: 'Processing, storage, pipeline' },
    shipping_port:        { name: 'Commercial Shipping Port', sector: 'industrial', budget: [350e6,700e6], ticks: [12,20], desc: 'Docks, cranes, container yard' },
    military_installation:{ name: 'Military Installation', sector: 'industrial', budget: [200e6,500e6], ticks: [10,16], desc: 'Barracks, armory, training grounds' },
    telecom_network:      { name: 'Telecommunications Tower Network', sector: 'industrial', budget: [200e6,400e6], ticks: [8,14], desc: '8-20 tower regional deployment' },
    railway_corridor:     { name: 'Railway Corridor', sector: 'industrial', budget: [300e6,650e6], ticks: [12,20], desc: '50-200km rail line with stations' },
    desalination_plant:   { name: 'Desalination Plant', sector: 'industrial', budget: [250e6,500e6], ticks: [10,16], desc: 'Coastal water processing' },
    // Mega ($800M-$4B)
    sports_stadium:       { name: 'National Sports Stadium', sector: 'mega_project', budget: [800e6,1.5e9], ticks: [18,30], desc: '50,000+ seating capacity' },
    international_airport:{ name: 'International Airport', sector: 'mega_project', budget: [2e9,4e9], ticks: [24,36], desc: 'Terminals, runways, control tower' },
    high_speed_rail:      { name: 'High-Speed Rail Network', sector: 'mega_project', budget: [2.5e9,4e9], ticks: [24,36], desc: 'Dedicated high-speed rail line' },
    parliament_complex:   { name: 'National Parliament Complex', sector: 'mega_project', budget: [900e6,1.8e9], ticks: [18,28], desc: 'Seat of government' },
    national_freeway:     { name: 'National Freeway System', sector: 'mega_project', budget: [1.5e9,3.5e9], ticks: [24,36], desc: 'Multi-hundred km freeway network' },
    deepwater_port:       { name: 'Deepwater Commercial Port', sector: 'mega_project', budget: [1.2e9,2.8e9], ticks: [20,30], desc: 'Container terminals, breakwaters' },
    intercontinental_crossing: { name: 'Intercontinental Bridge or Tunnel', sector: 'mega_project', budget: [2.5e9,4e9], ticks: [28,36], desc: 'Landmark engineering project' },
    university_campus:    { name: 'National University Campus', sector: 'mega_project', budget: [900e6,1.6e9], ticks: [16,26], desc: 'Full university with all facilities' },
    metro_system:         { name: 'Metropolitan Subway System', sector: 'mega_project', budget: [1.5e9,3.5e9], ticks: [24,36], desc: 'Underground metro network' },
    flood_irrigation_network: { name: 'National Flood Control & Irrigation Network', sector: 'mega_project', budget: [1.2e9,2.5e9], ticks: [20,30], desc: 'Dams, canals, levees, irrigation' },
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
//  CONSTRUCTION SECTOR — Project Events
// ════════════════════════════════════════════════════════════════════════════════

// Event templates grouped by type. Each has severity, title, description, impact,
// and response options with tag (SAFE/RISKY/DANGEROUS), cost, delay, qualityImpact.
const EVENT_TEMPLATES = [
    // ── WEATHER ──
    {
        key: 'heavy_rainfall', type: 'WEATHER', severity: 'MODERATE',
        title: 'Heavy Rainfall — Foundation Work Delayed',
        desc: 'Sustained rainfall over 72 hours has waterlogged the excavation. Concrete pouring cannot proceed until drainage is complete and soil stability is confirmed.',
        impact: 'Construction paused. Quality at risk if resumed too quickly.',
        responses: [
            { key: 'wait', label: 'Wait it out', tag: 'SAFE', detail: 'Wait for conditions to improve. No quality loss, no additional cost.', cost: 0, delay: 2, qualityImpact: 0 },
            { key: 'pump', label: 'Pump and resume', tag: 'RISKY', detail: 'Pump drainage and resume in 1 tick. Equipment rental required. Quality risk from damp soil.', cost: 180000, delay: 1, qualityImpact: -4 },
            { key: 'force', label: 'Force resume immediately', tag: 'DANGEROUS', detail: 'Override safety protocols and continue now. High probability of structural defects.', cost: 0, delay: 0, qualityImpact: -12 },
        ],
    },
    {
        key: 'heat_wave', type: 'WEATHER', severity: 'LOW',
        title: 'Heat Wave — Concrete Curing Issues',
        desc: 'Extreme temperatures are causing rapid concrete curing, potentially reducing structural integrity. Workers also at risk of heat-related illness.',
        impact: 'Slight quality risk. Workforce efficiency reduced.',
        responses: [
            { key: 'shade', label: 'Install shade structures', tag: 'SAFE', detail: 'Temporary shade and hydration stations. Minor cost, no delay.', cost: 45000, delay: 0, qualityImpact: 0 },
            { key: 'night', label: 'Switch to night shifts', tag: 'RISKY', detail: 'Pour concrete at night when temperatures drop. Lighting costs, slight delay.', cost: 90000, delay: 1, qualityImpact: 2 },
            { key: 'ignore', label: 'Continue as normal', tag: 'DANGEROUS', detail: 'Push through the heat. Workers slow down, concrete may cure improperly.', cost: 0, delay: 0, qualityImpact: -6 },
        ],
    },
    {
        key: 'flooding', type: 'WEATHER', severity: 'HIGH',
        title: 'Flash Flooding — Site Damage',
        desc: 'Flash flooding has damaged equipment staging areas and washed out access roads. Some foundation work may need to be redone.',
        impact: 'Significant delay. Possible equipment damage. Foundation integrity at risk.',
        responses: [
            { key: 'full_repair', label: 'Full site assessment and repair', tag: 'SAFE', detail: 'Complete assessment, repair damage, rebuild access. Expensive but thorough.', cost: 350000, delay: 3, qualityImpact: 0 },
            { key: 'partial', label: 'Patch and proceed', tag: 'RISKY', detail: 'Quick repairs to critical areas only. Resume faster but some damage unaddressed.', cost: 150000, delay: 1, qualityImpact: -8 },
            { key: 'ignore', label: 'Resume without assessment', tag: 'DANGEROUS', detail: 'Skip assessment entirely. Unknown foundation damage may cause failures at inspection.', cost: 0, delay: 0, qualityImpact: -18 },
        ],
    },
    // ── LABOR ──
    {
        key: 'worker_injury', type: 'LABOR', severity: 'MODERATE',
        title: 'Worker Injury — Safety Stop-Work Order',
        desc: 'A trench wall collapse injured two workers. Safety inspector issued a stop-work order pending structural shoring installation.',
        impact: 'Excavation paused. Workforce morale reduced. Potential regulatory scrutiny.',
        responses: [
            { key: 'full_compliance', label: 'Full safety compliance', tag: 'SAFE', detail: 'Install all required shoring, retrain crew, resume when cleared. Slow but clean.', cost: 85000, delay: 2, qualityImpact: 0 },
            { key: 'quick_fix', label: 'Quick shoring and resume', tag: 'RISKY', detail: 'Install minimum shoring requirements. Resume quickly with partial compliance.', cost: 45000, delay: 1, qualityImpact: -3 },
            { key: 'ignore_order', label: 'Resume without full compliance', tag: 'DANGEROUS', detail: 'Minimal fixes, resume immediately. Risk of further injuries and regulatory penalties.', cost: 0, delay: 0, qualityImpact: -10 },
        ],
    },
    {
        key: 'labor_shortage', type: 'LABOR', severity: 'LOW',
        title: 'Labor Shortage — Workers Poached by Competitor',
        desc: 'A rival construction firm is offering higher wages for skilled workers. Several crew members are considering leaving.',
        impact: 'Risk of losing skilled workers. Build speed may decrease.',
        responses: [
            { key: 'raise', label: 'Match competitor wages', tag: 'SAFE', detail: 'Increase wages to retain workers. Ongoing cost increase for remaining ticks.', cost: 120000, delay: 0, qualityImpact: 0 },
            { key: 'replace', label: 'Let them go, hire replacements', tag: 'RISKY', detail: 'New workers need training time. Slight delay, slightly lower skill level.', cost: 0, delay: 1, qualityImpact: -3 },
            { key: 'nothing', label: 'Do nothing', tag: 'DANGEROUS', detail: 'Hope they stay. If they leave, significant understaffing and quality impact.', cost: 0, delay: 0, qualityImpact: -7 },
        ],
    },
    {
        key: 'strike_action', type: 'LABOR', severity: 'HIGH',
        title: 'Worker Strike — Demands for Better Conditions',
        desc: 'Workers have organized a strike demanding improved safety equipment, overtime pay, and rest facilities. Work has stopped completely.',
        impact: 'All construction halted until resolved. Public attention on the project.',
        responses: [
            { key: 'negotiate', label: 'Negotiate and meet demands', tag: 'SAFE', detail: 'Meet worker demands. Expensive but resolves immediately. Good reputation.', cost: 250000, delay: 1, qualityImpact: 2 },
            { key: 'partial', label: 'Partial concessions', tag: 'RISKY', detail: 'Offer some improvements. Workers may accept or continue striking.', cost: 120000, delay: 2, qualityImpact: 0 },
            { key: 'replace', label: 'Hire replacement workers', tag: 'DANGEROUS', detail: 'Fire strikers, hire replacements. Fast but unskilled replacements hurt quality.', cost: 60000, delay: 1, qualityImpact: -14 },
        ],
    },
    // ── SUPPLY ──
    {
        key: 'material_delay', type: 'SUPPLY', severity: 'LOW',
        title: 'Material Delivery Delay — Supplier Backlog',
        desc: 'Primary supplier reports a delay on the next scheduled delivery. Materials will arrive late.',
        impact: 'No immediate impact if materials not yet needed. Monitor situation.',
        responses: [
            { key: 'wait', label: 'Wait for delivery', tag: 'SAFE', detail: 'Accept the delay. No cost if materials not urgently needed.', cost: 0, delay: 1, qualityImpact: 0 },
            { key: 'alt_supplier', label: 'Source from alternate supplier', tag: 'RISKY', detail: 'Rush order from another supplier at premium cost. Quality may vary.', cost: 95000, delay: 0, qualityImpact: -2 },
        ],
    },
    {
        key: 'material_defect', type: 'SUPPLY', severity: 'MODERATE',
        title: 'Material Quality Defect — Failed Inspection',
        desc: 'A batch of delivered materials failed quality inspection. The affected materials cannot be used in structural elements.',
        impact: 'Materials wasted. Replacement needed before work can continue.',
        responses: [
            { key: 'replace', label: 'Order replacement materials', tag: 'SAFE', detail: 'Full replacement at cost. Wait for delivery. Quality maintained.', cost: 200000, delay: 2, qualityImpact: 0 },
            { key: 'downgrade', label: 'Use in non-structural areas', tag: 'RISKY', detail: 'Redirect defective materials to non-critical applications. Saves time and money.', cost: 0, delay: 0, qualityImpact: -6 },
            { key: 'use_anyway', label: 'Use as-is in structural elements', tag: 'DANGEROUS', detail: 'Ignore the failed inspection. Serious risk at final delivery inspection.', cost: 0, delay: 0, qualityImpact: -15 },
        ],
    },
    {
        key: 'price_spike', type: 'SUPPLY', severity: 'MODERATE',
        title: 'Market Price Spike — Construction Materials',
        desc: 'Global commodity markets have spiked. Remaining material purchases will cost significantly more than budgeted.',
        impact: 'Budget overrun risk. May need to absorb additional costs.',
        responses: [
            { key: 'absorb', label: 'Absorb the cost increase', tag: 'SAFE', detail: 'Pay the higher prices. Eats into profit margin but no delays.', cost: 280000, delay: 0, qualityImpact: 0 },
            { key: 'substitute', label: 'Substitute cheaper materials', tag: 'RISKY', detail: 'Use lower-grade alternatives where possible. Saves money, reduces quality.', cost: 60000, delay: 0, qualityImpact: -5 },
            { key: 'delay', label: 'Delay purchases, wait for prices to drop', tag: 'RISKY', detail: 'Pause material orders. Prices may drop but project is delayed.', cost: 0, delay: 2, qualityImpact: 0 },
        ],
    },
    // ── REGULATORY ──
    {
        key: 'permit_inspection', type: 'REGULATORY', severity: 'HIGH',
        title: 'Permit Inspection — Unannounced Site Visit',
        desc: 'Government inspector conducted an unannounced site visit. Found compliance deviations that need remediation.',
        impact: 'Written warning issued. Must remediate or face fines and permit suspension.',
        responses: [
            { key: 'immediate', label: 'Immediate full remediation', tag: 'SAFE', detail: 'Address all findings immediately. Inspector satisfied, no further action.', cost: 65000, delay: 1, qualityImpact: 0 },
            { key: 'minimal', label: 'Minimal compliance fixes', tag: 'RISKY', detail: 'Address only the critical findings. May trigger follow-up inspection.', cost: 25000, delay: 0, qualityImpact: -4 },
            { key: 'ignore', label: 'Ignore the warning', tag: 'DANGEROUS', detail: 'Risk the fine and potential permit suspension. Could halt the entire project.', cost: 0, delay: 0, qualityImpact: -12 },
        ],
    },
    {
        key: 'zoning_dispute', type: 'REGULATORY', severity: 'MODERATE',
        title: 'Zoning Dispute — Neighbouring Property Complaint',
        desc: 'Adjacent property owners have filed a complaint about noise levels, dust, and access road damage. Local council is reviewing.',
        impact: 'Possible operating hour restrictions. Community relations at stake.',
        responses: [
            { key: 'community', label: 'Community engagement and mitigation', tag: 'SAFE', detail: 'Dust suppression, noise barriers, road repair. Good community relations.', cost: 110000, delay: 0, qualityImpact: 0 },
            { key: 'legal', label: 'Legal response', tag: 'RISKY', detail: 'Contest the complaint legally. May win but takes time and strains relations.', cost: 75000, delay: 2, qualityImpact: 0 },
            { key: 'ignore', label: 'Continue without changes', tag: 'DANGEROUS', detail: 'Risk council-imposed restrictions or fines. May escalate to work stoppage.', cost: 0, delay: 0, qualityImpact: -5 },
        ],
    },
    // ── EQUIPMENT ──
    {
        key: 'equipment_breakdown', type: 'EQUIPMENT', severity: 'MODERATE',
        title: 'Equipment Breakdown — Crane Malfunction',
        desc: 'A critical crane has suffered a hydraulic failure. Heavy lifting operations are halted until repairs are completed or a replacement is sourced.',
        impact: 'Heavy lifting work suspended. Delays to structural phase.',
        responses: [
            { key: 'repair', label: 'Full repair', tag: 'SAFE', detail: 'Repair the crane properly. Takes time but restores full capability.', cost: 140000, delay: 2, qualityImpact: 0 },
            { key: 'rent', label: 'Rent a replacement', tag: 'RISKY', detail: 'Rent a crane while yours is repaired. Expensive but fast.', cost: 220000, delay: 0, qualityImpact: 0 },
            { key: 'workaround', label: 'Work around it', tag: 'DANGEROUS', detail: 'Use smaller equipment and manual labor. Slow and risky for heavy components.', cost: 0, delay: 1, qualityImpact: -8 },
        ],
    },
    {
        key: 'equipment_theft', type: 'EQUIPMENT', severity: 'HIGH',
        title: 'Equipment Theft — Site Security Breach',
        desc: 'Multiple pieces of equipment and materials were stolen from the site overnight. Security was inadequate.',
        impact: 'Lost equipment and materials. Need replacements. Security upgrade needed.',
        responses: [
            { key: 'replace_secure', label: 'Replace all and upgrade security', tag: 'SAFE', detail: 'Full replacement of stolen items plus security upgrade. Expensive but comprehensive.', cost: 320000, delay: 1, qualityImpact: 0 },
            { key: 'partial', label: 'Replace essentials only', tag: 'RISKY', detail: 'Replace only what is immediately needed. Some capabilities reduced.', cost: 160000, delay: 0, qualityImpact: -4 },
            { key: 'makeshift', label: 'Use makeshift alternatives', tag: 'DANGEROUS', detail: 'Improvise with what remains. Significant capability and quality reduction.', cost: 0, delay: 0, qualityImpact: -12 },
        ],
    },
];

// Chance of an event firing per in_progress project per tick
const EVENT_CHANCE_PER_TICK = 0.25; // 25% per project per tick
// Max active (unresolved) events per project
const MAX_ACTIVE_EVENTS_PER_PROJECT = 2;
// Ticks before an unresolved event auto-expires with worst outcome
const EVENT_EXPIRY_TICKS = 3;

async function generateProjectEvents(supabase, nationId, currentTick) {
    // Get all in_progress contracts for this nation
    const { data: activeContracts } = await supabase
        .from('construction_contracts')
        .select('id, name, awarded_to_faction')
        .eq('nation_id', nationId)
        .eq('status', 'in_progress');

    if (!activeContracts || activeContracts.length === 0) return [];

    const generated = [];

    for (const contract of activeContracts) {
        // Check how many active events this project already has
        const { count: activeCount } = await supabase
            .from('construction_events')
            .select('id', { count: 'exact', head: true })
            .eq('contract_id', contract.id)
            .eq('status', 'ACTIVE');

        if ((activeCount || 0) >= MAX_ACTIVE_EVENTS_PER_PROJECT) continue;

        // Roll for event
        if (Math.random() > EVENT_CHANCE_PER_TICK) continue;

        // Pick a random event template
        const template = ccPick(EVENT_TEMPLATES);

        // Check we haven't fired this exact event on this project recently (within 6 ticks)
        const { data: recentSame } = await supabase
            .from('construction_events')
            .select('id')
            .eq('contract_id', contract.id)
            .eq('event_key', template.key)
            .gte('fired_at_tick', currentTick - 6)
            .limit(1);

        if (recentSame && recentSame.length > 0) continue;

        // Insert the event
        const { data: evt, error: evtErr } = await supabase
            .from('construction_events')
            .insert({
                contract_id: contract.id,
                faction_id: contract.awarded_to_faction,
                nation_id: nationId,
                event_key: template.key,
                type: template.type,
                severity: template.severity,
                title: template.title,
                description: template.desc,
                impact: template.impact,
                responses: template.responses,
                status: 'ACTIVE',
                expires_at_tick: currentTick + EVENT_EXPIRY_TICKS,
                fired_at_tick: currentTick,
            })
            .select('id, event_key, type, severity')
            .single();

        if (evtErr) {
            console.error(`[Events] Failed to create event for ${contract.name}:`, evtErr.message);
        } else {
            generated.push({ contract: contract.name, event: evt.event_key, type: evt.type, severity: evt.severity });
            console.log(`[Events] ${contract.name}: ${template.type}/${template.severity} — ${template.title}`);
        }
    }

    return generated;
}

async function resolveExpiredEvents(supabase, nationId, currentTick) {
    // Find events that have expired without a player response
    const { data: expiredEvents } = await supabase
        .from('construction_events')
        .select('id, contract_id, faction_id, event_key, title, responses')
        .eq('nation_id', nationId)
        .eq('status', 'ACTIVE')
        .lte('expires_at_tick', currentTick);

    if (!expiredEvents || expiredEvents.length === 0) return [];

    const results = [];

    for (const evt of expiredEvents) {
        // Auto-apply the worst response (last one, which is always DANGEROUS)
        const responses = evt.responses || [];
        const worstResponse = responses.length > 0 ? responses[responses.length - 1] : null;

        const costApplied = worstResponse?.cost || 0;
        const delayApplied = worstResponse?.delay || 0;
        const qualityApplied = worstResponse?.qualityImpact || -5;

        // Mark as expired with worst outcome
        const { error: updateErr } = await supabase
            .from('construction_events')
            .update({
                status: 'EXPIRED',
                chosen_response: worstResponse?.key || 'inaction',
                resolution: `No response received. Worst outcome applied automatically: ${worstResponse?.detail || 'Default penalty applied.'}`,
                resolved_at_tick: currentTick,
                cost_applied: costApplied,
                delay_applied: delayApplied,
                quality_applied: qualityApplied,
            })
            .eq('id', evt.id);

        if (updateErr) {
            console.error(`[Events] Failed to expire event ${evt.id}:`, updateErr.message);
            continue;
        }

        // Apply cost to corp cash reserves
        if (costApplied > 0) {
            const { data: corp } = await supabase
                .from('factions')
                .select('corp_cash_reserves')
                .eq('id', evt.faction_id)
                .single();
            if (corp) {
                const newCash = Math.max(0, Number(corp.corp_cash_reserves || 0) - costApplied);
                await supabase.from('factions')
                    .update({ corp_cash_reserves: newCash })
                    .eq('id', evt.faction_id);
            }
        }

        // Apply delay by extending the contract timeline
        if (delayApplied > 0) {
            const { data: contract } = await supabase
                .from('construction_contracts')
                .select('timeline_ticks')
                .eq('id', evt.contract_id)
                .single();
            if (contract) {
                await supabase.from('construction_contracts')
                    .update({ timeline_ticks: (contract.timeline_ticks || 8) + delayApplied })
                    .eq('id', evt.contract_id);
            }
        }

        // Apply quality impact to the bid's estimated_quality
        if (qualityApplied !== 0) {
            const { data: bid } = await supabase
                .from('contract_bids')
                .select('id, estimated_quality')
                .eq('contract_id', evt.contract_id)
                .eq('status', 'won')
                .maybeSingle();
            if (bid) {
                const newQuality = Math.max(0, Math.min(100, (bid.estimated_quality || 65) + qualityApplied));
                await supabase.from('contract_bids')
                    .update({ estimated_quality: newQuality })
                    .eq('id', bid.id);
            }
        }

        results.push({
            event: evt.title,
            outcome: 'expired',
            response: worstResponse?.key || 'inaction',
            cost: costApplied,
            delay: delayApplied,
            quality: qualityApplied,
        });

        console.log(`[Events] EXPIRED: ${evt.title} — auto-applied worst outcome (cost=${costApplied}, delay=${delayApplied}, quality=${qualityApplied})`);
    }

    return results;
}

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

    // Ministry issuers
    const ISSUERS = [
        'Ministry of Infrastructure', 'Ministry of Housing',
        'Ministry of Transport', 'Ministry of Energy',
        'Ministry of Health', 'Ministry of Education',
        'Ministry of Defense', 'Ministry of the Interior'
    ];

    const generated = [];
    for (const sector of slots) {
        const pool = sector === 'mega_project' ? CC_MEGA : sector === 'industrial' ? CC_INDUSTRIAL : CC_CIVIL;
        const key = ccPick(pool);
        const tmpl = CC_TEMPLATES[key];
        if (!tmpl) continue;

        const budget = ccRand(tmpl.budget[0], tmpl.budget[1]);
        const timeline = ccRand(tmpl.ticks[0], tmpl.ticks[1]);

        const { data: contract, error } = await supabase.from('construction_contracts').insert({
            nation_id: nation.id,
            template_key: key,
            sector: tmpl.sector,
            name: tmpl.name,
            description: tmpl.desc,
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
            issuer_name: ccPick(ISSUERS),
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
    // 1. Read shard to get current tick
    const { data: shard, error: shardErr } = await supabase
        .from('shard')
        .select('current_tick, current_date')
        .eq('name', 'Alpha Shard')
        .single();

    if (shardErr || !shard) {
        throw new Error(`Shard not found: ${shardErr?.message}`);
    }

    const currentTick = shard.current_tick || 0;

    // 2. Idempotency check — skip if we already processed this tick
    if (!force && currentTick === lastProcessedTick) {
        return { status: 'already_processed', tick: currentTick };
    }

    console.log(`[advance-corp-tick] Processing tick ${currentTick} (${shard.current_date})`);

    // 3. Load all nations
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

    // 4. Process each nation
    for (const nation of nationList) {
        try {
            // Load corporation factions for this nation
            const { data: corpFactions, error: corpErr } = await supabase
                .from('factions')
                .select('id, faction_name, corp_sector, corp_subsector, corp_cash_reserves')
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

                // Expired events: auto-resolve events the player ignored
                const expiredResults = await resolveExpiredEvents(supabase, nation.id, currentTick);
                if (expiredResults.length > 0) {
                    summary.construction.push({ nation: nation.name, type: 'expired_events', data: expiredResults });
                }
            } catch (constructionErr) {
                console.error(`[advance-corp-tick] Construction failed for ${nation.name} (non-fatal):`, constructionErr);
                summary.errors.push({ nation: nation.name, sector: 'construction', error: String(constructionErr) });
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

    // 5. Mark this tick as processed
    lastProcessedTick = currentTick;

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
