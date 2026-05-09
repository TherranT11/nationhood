// js/corp-all-corporations.js
// Shared loader for the "Corporations" database panel used by
// corp-operations.html and corp-operations-shipping.html. Returns
// shard-wide active parent corps shaped for the panel's list +
// detail render.
//
// One function. One query path. One set of shaping rules. If you're about
// to write another loadAllCorporations() somewhere — stop and use this
// instead.

import { _supabase } from './supabase-client.js';
import { computeCorpValuation, computeFinanceReceivableValue } from './game/corp-valuation.js';

/**
 * Load every active corporation on the shard, shaped as uniform rows for
 * the Corporations database panel. Fields:
 *
 *   id, faction_name, abbreviation, abbr, corp_sector, corp_subsector,
 *   corp_ticker, corp_cash_reserves, corp_loans, corp_reputation,
 *   nation_id, nation, linked_user_id,
 *   status          ('PUBLIC' | 'PRIVATE' | 'STATE')
 *   isPlayer        boolean
 *   reputation      rounded int
 *   revenue         per-tick estimator (10% of cash)
 *   valuation       computeCorpValuation({...})
 *
 * Returns the array. Callers typically assign it to their local state
 * (e.g. `_allCorps = await loadAllCorporations();`).
 */
export async function loadAllCorporations() {
    const { data: corpsData } = await _supabase.from('factions')
        .select('id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_loans, corp_reputation, nation_id, nation, linked_user_id')
        .eq('faction_type', 'corporation')
        .is('abandoned_at', null)
        .order('faction_name');

    // Finance receivables per corp — fed to computeCorpValuation.
    const corpIds = (corpsData || []).map(c => c.id).filter(Boolean);
    const receivablesByCorp = {};
    if (corpIds.length) {
        const { data: financePositions } = await _supabase.from('finance_active_loans')
            .select('lender_faction_id, principal, remaining_principal, finance_loan_requests!inner(request_type)')
            .in('lender_faction_id', corpIds)
            .in('status', ['current', 'late', 'delinquent']);
        for (const row of (financePositions || [])) {
            const lenderId = row.lender_faction_id;
            (receivablesByCorp[lenderId] ||= []).push(row);
        }
    }

    return (corpsData || []).map(c => {
        const status = (c.corp_company_type || 'Private').toUpperCase();
        const cash = Number(c.corp_cash_reserves || 0);
        const loans = Number(c.corp_loans || 0);
        const receivables = computeFinanceReceivableValue(receivablesByCorp[c.id] || []).total;
        return {
            ...c,
            abbr: c.corp_ticker || c.abbreviation || c.faction_name?.slice(0, 4).toUpperCase() || '???',
            status,
            isPlayer: !!c.linked_user_id,
            reputation: Math.round(Number(c.corp_reputation ?? 50)),
            revenue: Math.round(cash * 0.1),
            valuation: computeCorpValuation({ cash, loans, financeReceivables: receivables }),
        };
    });
}
