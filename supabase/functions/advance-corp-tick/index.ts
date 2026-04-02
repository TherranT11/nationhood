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

    // Revenue comes ONLY from contracts. No free base rate.
    const monthlyGovContracts = 0;   // TODO: sum from active construction contract payments
    const monthlyPvtContracts = 0;   // TODO: sum from private contracts when implemented
    const monthlyRevenue = monthlyGovContracts + monthlyPvtContracts;

    // Wages: same formula as corp-dashboard.html renderWorkforce
    const TOTAL_WORKFORCE = 3000;
    const CONSTRUCTION_SECTOR_MULT = 0.20;
    const baseAnnualWage = 8000 + (ns('minimum_wage') / 100) * 32000;
    const generalWages = Math.round(TOTAL_WORKFORCE * 0.75) * baseAnnualWage * 1.00 * CONSTRUCTION_SECTOR_MULT;
    const skilledWages = Math.round(TOTAL_WORKFORCE * 0.20) * baseAnnualWage * 1.50 * CONSTRUCTION_SECTOR_MULT;
    const innovativeWages = (TOTAL_WORKFORCE - Math.round(TOTAL_WORKFORCE * 0.75) - Math.round(TOTAL_WORKFORCE * 0.20)) * baseAnnualWage * 2.75 * CONSTRUCTION_SECTOR_MULT;
    const monthlyWages = Math.round((generalWages + skilledWages + innovativeWages) / 12);

    const monthlyIncome = monthlyRevenue - monthlyWages;

    for (const corp of corpFactions) {
        const currentCash = Number(corp.corp_cash_reserves || 0);
        const newCash = Math.max(0, currentCash + monthlyIncome);
        await supabase.from('factions')
            .update({ corp_cash_reserves: newCash })
            .eq('id', corp.id);
    }
    console.log(`[advance-corp-tick] Corp income: ${corpFactions.length} corps in ${nation.name}, rev=${monthlyRevenue}, wages=${monthlyWages}, net=${monthlyIncome}`);
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
