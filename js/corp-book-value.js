// js/corp-book-value.js — one source for the book-value AGGREGATE fetch.
//
// The dynamic book value of an entrepreneur corp is treasury + Σ building
// cost_paid − Σ outstanding debt (the formula lives in computeCorpBookValue,
// js/game/corp-valuation.js). Treasury is on the corp row, but the building
// and loan sums are not — they're aggregated here. corp_buildings and
// corp_loans are world-readable (SELECT true: migrations 20270165 / 20270174).
//
// Every entrepreneur surface that shows book value (corp detail, markets
// registry, dashboard holdings, corporations positions/join) reads these
// aggregates from THIS function, so the query lives in exactly one place.
import { _supabase } from './supabase-client.js';

// Returns Map(corpId → { buildingCostPaid, outstandingDebt }). Corp ids with
// no buildings/loans are absent from the map; callers default to 0. Debt
// mirrors SQL entrepreneur_corp_outstanding_debt: ACTIVE corp_loans remaining
// + ACTIVE central_bank_loans outstanding (both tables are world-readable).
// Query errors are logged and treated as empty (the figure degrades to
// treasury alone rather than throwing).
export async function fetchCorpBookAggregates(corpIds) {
    const ids = [...new Set((corpIds || []).filter(Boolean))];
    const out = new Map();
    if (!ids.length) return out;
    const [bldRes, lnRes, cbRes] = await Promise.all([
        _supabase.from('corp_buildings').select('owner_corp_id, cost_paid').in('owner_corp_id', ids),
        _supabase.from('corp_loans').select('borrower_corp_id, principal, total_paid')
            .in('borrower_corp_id', ids).eq('status', 'active'),
        _supabase.from('central_bank_loans').select('borrower_corp_id, outstanding')
            .in('borrower_corp_id', ids).eq('status', 'active'),
    ]);
    if (bldRes.error) console.warn('[corp-book-value] buildings load failed:', bldRes.error.message);
    if (lnRes.error)  console.warn('[corp-book-value] corp loans load failed:', lnRes.error.message);
    if (cbRes.error)  console.warn('[corp-book-value] central bank loans load failed:', cbRes.error.message);
    const ensure = (id) => {
        let e = out.get(id);
        if (!e) { e = { buildingCostPaid: 0, outstandingDebt: 0 }; out.set(id, e); }
        return e;
    };
    for (const b of (bldRes.data || [])) {
        ensure(b.owner_corp_id).buildingCostPaid += Number(b.cost_paid) || 0;
    }
    for (const l of (lnRes.data || [])) {
        ensure(l.borrower_corp_id).outstandingDebt += Math.max(0, (Number(l.principal) || 0) - (Number(l.total_paid) || 0));
    }
    for (const cb of (cbRes.data || [])) {
        ensure(cb.borrower_corp_id).outstandingDebt += Math.max(0, Number(cb.outstanding) || 0);
    }
    return out;
}

// Single-corp convenience: always returns a { buildingCostPaid, outstandingDebt }
// object (zeros when the corp has none), so callers don't repeat the default.
export async function fetchOneCorpBookAggregates(corpId) {
    const map = await fetchCorpBookAggregates([corpId]);
    return map.get(corpId) || { buildingCostPaid: 0, outstandingDebt: 0 };
}
