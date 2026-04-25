const SCHEMA_MISSING_CODES = new Set(['PGRST200', 'PGRST201', 'PGRST202', 'PGRST204', '42P01']);

function isSchemaMissingError(error) {
    if (!error) return false;
    const code = String(error.code || '').trim();
    const message = String(error.message || '').toLowerCase();
    return SCHEMA_MISSING_CODES.has(code)
        || message.includes('could not find a relationship')
        || message.includes('schema cache')
        || message.includes('does not exist');
}

function normalizeShippingDataError(error, fallbackMessage) {
    if (!error) return null;
    if (isSchemaMissingError(error)) {
        return {
            code: error.code || 'SCHEMA_MISSING',
            message: fallbackMessage || 'Shipping data schema is not fully available yet.',
            rawMessage: error.message || null,
            isSchemaMissing: true,
        };
    }
    return {
        code: error.code || 'QUERY_FAILED',
        message: error.message || 'Failed to load shipping data.',
        rawMessage: error.message || null,
        isSchemaMissing: false,
    };
}

function buildLoadResult(dataKey, items, error) {
    return {
        ok: !error,
        state: error ? 'error' : (items.length === 0 ? 'empty' : 'ready'),
        [dataKey]: items,
        error,
    };
}

const GOV_DISPLAY_MIN = 1_000_000;
const GOV_DISPLAY_MAX = 18_000_000;
const GOV_DISPLAY_DURATION_FLOOR = 2;

function clampNumber(value, min, max) {
    const n = Number(value) || 0;
    if (n < min) return min;
    if (n > max) return max;
    return n;
}

function deriveGovDisplayContractValue(route) {
    const estimatedPerTransit = Math.max(250000, Number(route?.estimated_revenue) || 0);
    const contractDuration = Math.max(
        GOV_DISPLAY_DURATION_FLOOR,
        Number(route?.gov_contract_duration || route?.transit_ticks || 1) || 1,
    );
    const expectedContractValue = Math.round(estimatedPerTransit * contractDuration * 1.35);
    const normalizedContract = Number(route?.gov_contract_value) || expectedContractValue;
    return Math.round(clampNumber(normalizedContract, GOV_DISPLAY_MIN, GOV_DISPLAY_MAX));
}

function normalizeShippingRoute(route) {
    if (!route || route.scope !== 'GOVERNMENT') return route;
    const displayContractValue = deriveGovDisplayContractValue(route);
    return {
        ...route,
        display_contract_value: displayContractValue,
    };
}

export async function loadShippingRoutesSafe(supabase, factionId, corpSubsector, options = {}) {
    const subsectorMap = {
        'Bulk Cargo': 'bulk_cargo',
        'Container Freight': 'container_freight',
        'Specialized Transport': 'specialized_transport',
    };
    const dbSubsector = subsectorMap[corpSubsector] || '';
    const routeOrigin = (options.routeOrigin || 'all').toLowerCase();
    const routeOffset = Math.max(0, Number(options.offset || 0));
    const routeLimit = Math.max(1, Math.min(Number(options.limit || 200), 500));

    let routeQuery = supabase.from('shipping_routes').select('*')
        .eq('status', 'active')
        .eq('shipping_subsector', dbSubsector);
    if (routeOrigin === 'organic') {
        routeQuery = routeQuery.is('trade_agreement_id', null);
    } else if (routeOrigin === 'agreement') {
        routeQuery = routeQuery.not('trade_agreement_id', 'is', null);
    }
    routeQuery = routeQuery
        .order('estimated_revenue', { ascending: false })
        .range(routeOffset, routeOffset + routeLimit - 1);

    const [routeResult, appResult] = await Promise.all([
        routeQuery,
        supabase.from('shipping_applications').select('*')
            .eq('faction_id', factionId).in('status', ['pending', 'approved']),
    ]);

    const routeError = normalizeShippingDataError(routeResult.error, 'Shipping routes are temporarily unavailable.');
    const appError = normalizeShippingDataError(appResult.error, 'Shipping applications are temporarily unavailable.');
    const mergedError = routeError || appError;

    return {
        ok: !mergedError,
        state: mergedError ? 'error' : ((routeResult.data || []).length === 0 ? 'empty' : 'ready'),
        routes: mergedError ? [] : (routeResult.data || []).map(normalizeShippingRoute),
        applications: mergedError ? [] : (appResult.data || []),
        error: mergedError,
    };
}

// Stitch the assigned vessel onto each claim as `_vessel`. The UI derives
// the claim's display status (LOADING / IN TRANSIT / IDLE) from the vessel's
// status — corp_vessels.status is the SSoT for vessel activity since the
// shipping_claims.vessel_status column was dropped (one source, no drift).
async function attachAssignedVessels(supabase, claims) {
    if (!claims || claims.length === 0) return claims || [];
    const claimIds = claims.map((c) => c.id).filter(Boolean);
    if (claimIds.length === 0) return claims;
    const { data: vessels } = await supabase.from('corp_vessels')
        .select('id, status, fuel, condition, vessel_name, vessel_class, active_claim_id')
        .in('active_claim_id', claimIds);
    const byClaimId = {};
    for (const v of (vessels || [])) byClaimId[v.active_claim_id] = v;
    return claims.map((c) => ({ ...c, _vessel: byClaimId[c.id] || null }));
}

export async function loadActiveVoyagesSafe(supabase, factionId) {
    const joinedResult = await supabase
        .from('shipping_claims')
        .select('*, shipping_routes(*)')
        .eq('faction_id', factionId)
        .eq('status', 'active')
        .order('claimed_at_tick', { ascending: false });

    if (!joinedResult.error) {
        const enriched = await attachAssignedVessels(supabase, joinedResult.data || []);
        return buildLoadResult('claims', enriched, null);
    }

    if (!isSchemaMissingError(joinedResult.error)) {
        return buildLoadResult('claims', [], normalizeShippingDataError(joinedResult.error, 'Active voyage data is temporarily unavailable.'));
    }

    const claimsResult = await supabase
        .from('shipping_claims')
        .select('*')
        .eq('faction_id', factionId)
        .eq('status', 'active')
        .order('claimed_at_tick', { ascending: false });

    if (claimsResult.error) {
        return buildLoadResult('claims', [], normalizeShippingDataError(claimsResult.error, 'Active voyage data is temporarily unavailable.'));
    }

    const claims = claimsResult.data || [];
    const routeIds = [...new Set(claims.map((claim) => claim.route_id).filter(Boolean))];

    let routeMap = {};
    if (routeIds.length > 0) {
        const routesResult = await supabase.from('shipping_routes').select('*').in('id', routeIds);
        if (!routesResult.error) {
            routeMap = Object.fromEntries((routesResult.data || []).map((route) => [route.id, route]));
        }
    }

    const stitchedClaims = await attachAssignedVessels(supabase, claims.map((claim) => ({
        ...claim,
        shipping_routes: routeMap[claim.route_id] || null,
    })));

    return {
        ok: true,
        state: stitchedClaims.length === 0 ? 'empty' : 'ready',
        claims: stitchedClaims,
        error: null,
    };
}

export async function loadSubsidiaryMarketSafe(supabase) {
    const joinedResult = await supabase
        .from('subsidiary_sales')
        .select('*, subsidiary_bids(*)')
        .eq('status', 'listed')
        .order('listed_at_tick', { ascending: false });

    if (!joinedResult.error) {
        return buildLoadResult('listings', joinedResult.data || [], null);
    }

    if (!isSchemaMissingError(joinedResult.error)) {
        return buildLoadResult('listings', [], normalizeShippingDataError(joinedResult.error, 'Subsidiary marketplace is temporarily unavailable.'));
    }

    const salesResult = await supabase
        .from('subsidiary_sales')
        .select('*')
        .eq('status', 'listed')
        .order('listed_at_tick', { ascending: false });

    if (salesResult.error) {
        return buildLoadResult('listings', [], normalizeShippingDataError(salesResult.error, 'Subsidiary marketplace is temporarily unavailable.'));
    }

    const sales = salesResult.data || [];
    const saleIds = sales.map((sale) => sale.id).filter(Boolean);

    let bidsBySaleId = {};
    if (saleIds.length > 0) {
        const bidsResult = await supabase.from('subsidiary_bids').select('*').in('sale_id', saleIds);
        if (!bidsResult.error) {
            bidsBySaleId = (bidsResult.data || []).reduce((acc, bid) => {
                if (!acc[bid.sale_id]) acc[bid.sale_id] = [];
                acc[bid.sale_id].push(bid);
                return acc;
            }, {});
        }
    }

    const stitchedListings = sales.map((sale) => ({
        ...sale,
        subsidiary_bids: bidsBySaleId[sale.id] || [],
    }));

    return {
        ok: true,
        state: stitchedListings.length === 0 ? 'empty' : 'ready',
        listings: stitchedListings,
        error: null,
    };
}
