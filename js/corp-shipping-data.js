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

export async function loadActiveVoyagesSafe(supabase, factionId) {
    const joinedResult = await supabase
        .from('shipping_claims')
        .select('*, shipping_routes(*)')
        .eq('faction_id', factionId)
        .eq('status', 'active')
        .order('claimed_at_tick', { ascending: false });

    if (!joinedResult.error) {
        return buildLoadResult('claims', joinedResult.data || [], null);
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

    const stitchedClaims = claims.map((claim) => ({
        ...claim,
        shipping_routes: routeMap[claim.route_id] || null,
    }));

    return {
        ok: true,
        state: stitchedClaims.length === 0 ? 'empty' : 'ready',
        claims: stitchedClaims,
        error: null,
    };
}

