// js/corp-book-value.js — one source for the book-value AGGREGATE fetch.
//
// The dynamic book value of an entrepreneur corp is
//   treasury + Σ corp_building_book_value_of(cost_paid, building_type)
//            − Σ outstanding debt
// where corp_building_book_value_of (SQL, 20270357) uses
//   GREATEST(cost_paid, intrinsic_for_specialty_type)
// so a starter Engine/Light Assembly Plant counts even when seeded with
// cost_paid 0. This function calls the server's
// entrepreneur_corp_book_aggregates RPC — server is the single source for
// the formula; client just renders the result.
import { _supabase } from './supabase-client.js';

// Returns Map(corpId → { buildingCostPaid, outstandingDebt }). The
// 'buildingCostPaid' key is preserved for back-compat with
// computeCorpBookValue (it now carries the building book value, not
// strictly cost_paid). Query errors are logged and treated as empty so
// the figure degrades to treasury alone rather than throwing.
export async function fetchCorpBookAggregates(corpIds) {
    const ids = [...new Set((corpIds || []).filter(Boolean))];
    const out = new Map();
    if (!ids.length) return out;
    const { data, error } = await _supabase.rpc('entrepreneur_corp_book_aggregates', { p_corp_ids: ids });
    if (error) {
        console.warn('[corp-book-value] aggregates RPC failed:', error.message);
        return out;
    }
    for (const r of (data || [])) {
        out.set(r.corp_id, {
            buildingCostPaid: Number(r.building_book_value) || 0,
            outstandingDebt:  Number(r.outstanding_debt)    || 0,
        });
    }
    return out;
}

// Single-corp convenience: always returns a { buildingCostPaid, outstandingDebt }
// object (zeros when the corp has none), so callers don't repeat the default.
export async function fetchOneCorpBookAggregates(corpId) {
    const map = await fetchCorpBookAggregates([corpId]);
    return map.get(corpId) || { buildingCostPaid: 0, outstandingDebt: 0 };
}
