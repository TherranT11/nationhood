/**
 * shipping.js — Shipping route generation and mechanics
 * Generates shipping routes from bilateral trade_partners data.
 */

// ==================== SHIPPING SECTOR MAPPING ====================

/**
 * Maps trade sectors to shipping subsectors and cargo metadata.
 * Determines which shipping corps can serve which trade routes.
 */
export var SHIPPING_SECTOR_MAP = {
    fuel_energy:        { subsector: 'bulk_cargo',           category: 'FUEL',     goods: 'Fuel & Energy Products',   goodsSub: 'Petroleum, LNG, coal, refined fuels',        vessel: 'Tanker',          vesselNote: 'Double-hull required for petroleum. Hazmat protocols for LNG.', unit: 'tons' },
    minerals:           { subsector: 'bulk_cargo',           category: 'MINERALS', goods: 'Minerals & Raw Materials', goodsSub: 'Iron ore, copper, bauxite, rare earths',      vessel: 'Bulk Carrier',    vesselNote: 'Heavy-load bulk. No special requirements.',                    unit: 'tons' },
    grains_staples:     { subsector: 'bulk_cargo',           category: 'FOOD',     goods: 'Grains & Staples',         goodsSub: 'Wheat, rice, corn, soybeans, cooking oils',   vessel: 'Bulk Carrier',    vesselNote: 'Dry bulk holds. Moisture control required.',                   unit: 'tons' },
    livestock_dairy:    { subsector: 'bulk_cargo',           category: 'FOOD',     goods: 'Livestock & Dairy',        goodsSub: 'Feed crops, processed dairy, frozen meat',    vessel: 'Bulk Carrier',    vesselNote: 'Temperature-controlled holds for dairy products.',             unit: 'tons' },
    cash_crops:         { subsector: 'bulk_cargo',           category: 'FOOD',     goods: 'Cash Crops',               goodsSub: 'Coffee, cocoa, tobacco, cotton, rubber',      vessel: 'Bulk Carrier',    vesselNote: 'Standard dry bulk. Humidity control for coffee/cocoa.',        unit: 'tons' },
    manufactured_goods: { subsector: 'container_freight',    category: 'MFG',      goods: 'Manufactured Goods',       goodsSub: 'Consumer goods, vehicles, industrial parts',  vessel: 'Container Ship',  vesselNote: 'Standard container ops. Crane-equipped ports required.',       unit: 'TEU' },
    technology:         { subsector: 'container_freight',    category: 'TECH',     goods: 'Technology & Electronics',  goodsSub: 'Semiconductors, electronics, precision equipment', vessel: 'Container Ship', vesselNote: 'Climate-controlled containers. High insurance requirement.', unit: 'TEU' },
    fruits_vegetables:  { subsector: 'container_freight',    category: 'FOOD',     goods: 'Perishable Produce',       goodsSub: 'Fresh fruit, vegetables, seafood, aquaculture', vessel: 'Reefer Ship',   vesselNote: 'Refrigerated holds required. Cold chain critical.',            unit: 'tons' },
    arms:               { subsector: 'specialized_transport', category: 'ARMS',    goods: 'Arms & Military Equipment', goodsSub: 'Vehicles, munitions, defense systems',       vessel: 'Military Transport', vesselNote: 'Security clearance required. Armed escort may be assigned.', unit: 'tons' },
};

/**
 * Minimum bilateral trade volume (dollars) to generate a shipping route.
 * Below this threshold, the volume is too small to justify a dedicated route.
 */
export var SHIPPING_ROUTE_THRESHOLD = 50000000; // $50M

/**
 * Revenue percentage — shipping corps earn this fraction of the trade value being moved.
 * Bulk cargo: lower margin. Container freight: medium. Specialized: highest.
 */
export var SHIPPING_REVENUE_RATES = {
    bulk_cargo: 0.06,            // 6% of trade value
    container_freight: 0.08,     // 8% of trade value
    specialized_transport: 0.12, // 12% of trade value
};

/**
 * Calculate transit time in ticks based on proximity (0-100).
 * Bordering nations (0): 1 tick. Distant (100): 6 ticks.
 * @param {number} proximity - 0 (bordering) to 100 (far)
 * @returns {number} transit ticks (1-6)
 */
export function calculateTransitTicks(proximity) {
    var p = Number(proximity) || 0;
    // 0 = bordering → 1 tick, 100 = far → 6 ticks
    return Math.max(1, Math.min(6, 1 + Math.floor(p / 20)));
}

/**
 * Determine demand level from trade volume relative to threshold.
 * @param {number} volume - bilateral trade volume in dollars
 * @returns {string} CRITICAL, HIGH, MODERATE, or LOW
 */
export function getDemandLevel(volume) {
    if (volume >= 500000000) return 'CRITICAL';
    if (volume >= 200000000) return 'HIGH';
    if (volume >= 100000000) return 'MODERATE';
    return 'LOW';
}

/**
 * Determine route scope based on proximity and whether it's a government contract.
 * @param {number} proximity - 0 (bordering) to 100 (far)
 * @param {boolean} isGovContract - true for government/military routes
 * @returns {string} COASTAL, INTERNATIONAL, or GOVERNMENT
 */
export function getRouteScope(proximity, isGovContract) {
    if (isGovContract) return 'GOVERNMENT';
    return proximity <= 15 ? 'COASTAL' : 'INTERNATIONAL';
}

/**
 * Generate shipping routes from current tick's trade_partners data.
 *
 * For each bilateral trade flow above the volume threshold:
 *   1. Look up the sector's shipping metadata
 *   2. Calculate transit time from proximity
 *   3. Calculate estimated revenue
 *   4. Determine demand level and scope
 *   5. Upsert into shipping_routes
 *
 * Routes that no longer have sufficient trade volume are marked expired.
 *
 * @param {Object} supabase    - Supabase client (service_role)
 * @param {number} currentTick - current game tick
 * @returns {Object} { generated, expired, total }
 */
export async function generateShippingRoutes(supabase, currentTick) {
    // 1. Fetch current tick's bilateral trade flows
    var { data: tradePartners } = await supabase
        .from('trade_partners')
        .select('exporter_nation_id, importer_nation_id, sector, trade_volume')
        .eq('tick', currentTick)
        .gte('trade_volume', SHIPPING_ROUTE_THRESHOLD);

    if (!tradePartners || tradePartners.length === 0) {
        return { generated: 0, expired: 0, total: 0 };
    }

    // 2. Fetch port names for all nations
    var { data: ports } = await supabase.from('nation_ports').select('nation_id, port_name');
    var portMap = {};
    if (ports) {
        for (var pi = 0; pi < ports.length; pi++) {
            portMap[ports[pi].nation_id] = ports[pi].port_name;
        }
    }

    // 3. Fetch proximity for all nation pairs
    var { data: relations } = await supabase
        .from('diplomatic_relations')
        .select('nation_a_id, nation_b_id, proximity');
    var proxMap = {};
    if (relations) {
        for (var ri = 0; ri < relations.length; ri++) {
            var r = relations[ri];
            proxMap[r.nation_a_id + '|' + r.nation_b_id] = r.proximity;
            proxMap[r.nation_b_id + '|' + r.nation_a_id] = r.proximity;
        }
    }

    // 4. Fetch active trade agreements for labeling
    var { data: agreements } = await supabase
        .from('trade_agreements')
        .select('id, nation_a_id, nation_b_id, agreement_name, agreement_type')
        .eq('status', 'active');
    var agreementMap = {};
    if (agreements) {
        for (var ai = 0; ai < agreements.length; ai++) {
            var a = agreements[ai];
            var ak1 = a.nation_a_id + '|' + a.nation_b_id;
            var ak2 = a.nation_b_id + '|' + a.nation_a_id;
            if (!agreementMap[ak1]) agreementMap[ak1] = a;
            if (!agreementMap[ak2]) agreementMap[ak2] = a;
        }
    }

    // 5. Fetch importer tariff rates
    var { data: nations } = await supabase.from('nations').select('id, name, tariffs');
    var tariffMap = {};
    var nameMap = {};
    if (nations) {
        for (var ni = 0; ni < nations.length; ni++) {
            tariffMap[nations[ni].id] = Number(nations[ni].tariffs) || 0;
            nameMap[nations[ni].id] = nations[ni].name;
        }
    }

    // 6. Generate routes
    var generated = 0;
    var routeRows = [];

    for (var ti = 0; ti < tradePartners.length; ti++) {
        var tp = tradePartners[ti];
        var sectorMeta = SHIPPING_SECTOR_MAP[tp.sector];
        if (!sectorMeta) continue; // Skip sectors without shipping mapping (tourism, services)

        var originPort = portMap[tp.exporter_nation_id];
        var destPort = portMap[tp.importer_nation_id];
        // Skip if either nation has no port (landlocked)
        if (!originPort || !destPort) continue;

        var proximity = proxMap[tp.exporter_nation_id + '|' + tp.importer_nation_id];
        if (proximity === undefined || proximity === null) proximity = 50;

        var transitTicks = calculateTransitTicks(proximity);
        var isGov = tp.sector === 'arms';
        var scope = getRouteScope(proximity, isGov);
        var demandLevel = getDemandLevel(tp.trade_volume);
        var revenueRate = SHIPPING_REVENUE_RATES[sectorMeta.subsector] || 0.06;
        var estRevenue = Math.round(tp.trade_volume * revenueRate);

        // Physical volume conversion (using same factor as display units)
        var volumePhysical = Math.round(tp.trade_volume / 100); // rough conversion

        // Trade agreement for this pair
        var agKey = tp.exporter_nation_id + '|' + tp.importer_nation_id;
        var agreement = agreementMap[agKey] || null;

        routeRows.push({
            origin_nation_id: tp.exporter_nation_id,
            destination_nation_id: tp.importer_nation_id,
            origin_port: originPort,
            destination_port: destPort,
            trade_sector: tp.sector,
            cargo_category: sectorMeta.category,
            shipping_subsector: sectorMeta.subsector,
            scope: scope,
            goods_name: sectorMeta.goods,
            goods_description: sectorMeta.goodsSub,
            vessel_class: sectorMeta.vessel,
            vessel_note: sectorMeta.vesselNote,
            trade_volume: Math.round(tp.trade_volume),
            estimated_revenue: estRevenue,
            volume_physical: volumePhysical,
            volume_unit: sectorMeta.unit,
            transit_ticks: transitTicks,
            proximity: proximity,
            tariff_rate: tariffMap[tp.importer_nation_id] || 0,
            demand_level: demandLevel,
            trade_agreement_id: agreement ? agreement.id : null,
            trade_agreement_name: agreement ? agreement.agreement_name : null,
            status: 'active',
            generated_at_tick: currentTick,
            last_refreshed_tick: currentTick,
        });

        generated++;
    }

    // 7. Upsert routes (update existing, insert new)
    if (routeRows.length > 0) {
        var BATCH = 50;
        for (var bi = 0; bi < routeRows.length; bi += BATCH) {
            var chunk = routeRows.slice(bi, bi + BATCH);
            var { error: upsertErr } = await supabase.from('shipping_routes').upsert(chunk, {
                onConflict: 'origin_nation_id,destination_nation_id,trade_sector,status'
            });
            if (upsertErr) {
                console.error('[Shipping] Route upsert error:', upsertErr.message);
            }
        }
    }

    // 8. Expire routes that weren't refreshed this tick (trade dropped below threshold)
    var { data: expiredRoutes, error: expErr } = await supabase
        .from('shipping_routes')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('last_refreshed_tick', currentTick)
        .select('id');

    var expiredCount = (expiredRoutes && !expErr) ? expiredRoutes.length : 0;

    return { generated: generated, expired: expiredCount, total: routeRows.length };
}
