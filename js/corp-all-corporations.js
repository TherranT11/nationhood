// js/corp-all-corporations.js
// Shared loader for the "Corporations" database panel used by
// corp-operations.html and corp-operations-shipping.html (and any future
// page that needs a shard-wide list of parent corps + subsidiaries).
//
// One function. One query path. One set of shaping rules. If you're about
// to write another loadAllCorporations() somewhere — stop and use this
// instead.

import { _supabase } from './supabase-client.js';
import { computeCorpValuation, computeFinanceReceivableValue } from './game/corp-valuation.js';
import { computeSubsidiaryTickDelta, SUB_DEFAULT_REPUTATION } from './game/subsidiary-economics.js';

/**
 * Load every active corporation and subsidiary on the shard, shaped as
 * uniform rows for the Corporations database panel.
 *
 * Returned entries (mix of parent corps and subsidiaries) share these
 * fields — so the panel's list + detail render can treat both uniformly:
 *
 *   id, faction_name, abbreviation, abbr, corp_sector, corp_subsector,
 *   corp_ticker, corp_cash_reserves, corp_loans, corp_reputation,
 *   nation_id, nation, linked_user_id,
 *   status          ('PUBLIC' | 'PRIVATE' | 'STATE' | 'SUBSIDIARY' etc.)
 *   isPlayer        boolean
 *   reputation      rounded int; subsidiaries always SUB_DEFAULT_REPUTATION
 *   revenue         per-tick estimator; parents = 10% of cash; subsidiaries
 *                   = computeSubsidiaryTickDelta().netDelta (real formula)
 *   valuation       parent = computeCorpValuation({...}); subsidiary = sum
 *                   of purchase_price across its in-nation corp_properties
 *   _isSub          boolean discriminator for the renderer
 *   _parentName     only set on subsidiary rows
 *
 * Returns the array. Callers typically assign it to their local state
 * (e.g. `_allCorps = await loadAllCorporations();`).
 */
export async function loadAllCorporations() {
    const [corpsRes, subsRes] = await Promise.all([
        _supabase.from('factions')
            .select('id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_loans, corp_reputation, nation_id, nation, linked_user_id')
            .eq('faction_type', 'corporation')
            .is('abandoned_at', null)
            .order('faction_name'),
        _supabase.from('corp_properties')
            .select('id, faction_id, name, nation_id, subsector, type, sub_cash, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)')
            .eq('type', 'regional_hq')
            .eq('is_active', true),
    ]);

    // Parent lookup by corp id.
    const parentMap = {};
    for (const c of (corpsRes.data || [])) parentMap[c.id] = c;

    // Finance receivables per corp — fed to computeCorpValuation for parents.
    const corpIds = (corpsRes.data || []).map(c => c.id).filter(Boolean);
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

    // Shape parent corporation rows.
    const corps = (corpsRes.data || []).map(c => {
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
            _isSub: false,
        };
    });

    // Nation data (name + gdp_growth). Used both for display and for the
    // subsidiary tick-delta formula.
    const { data: nationData } = await _supabase.from('nations').select('id, name, gdp_growth');
    const nationMap = {};
    const nationGdpMap = {};
    (nationData || []).forEach(n => {
        nationMap[n.id] = n.name;
        nationGdpMap[n.id] = Number(n.gdp_growth ?? 50);
    });

    // All active corp_properties in the subsidiary (faction, nation) pairs,
    // bucketed by composite key. Used to sum purchase_price for valuation.
    const subFactionIds = [...new Set((subsRes.data || []).map(s => s.faction_id).filter(Boolean))];
    const subNationIds = [...new Set((subsRes.data || []).map(s => s.nation_id).filter(Boolean))];
    const subPropsMap = {};
    if (subFactionIds.length && subNationIds.length) {
        const { data: allSubProps, error: subPropsErr } = await _supabase.from('corp_properties')
            .select('faction_id, nation_id, purchase_price, capacity')
            .in('faction_id', subFactionIds)
            .in('nation_id', subNationIds)
            .eq('is_active', true);
        if (subPropsErr) console.warn('[loadAllCorporations] subsidiary props fetch failed:', subPropsErr.message);
        for (const p of (allSubProps || [])) {
            const key = `${p.faction_id}|${p.nation_id}`;
            (subPropsMap[key] ||= []).push(p);
        }
    }

    // Shape subsidiary rows. Uses sub_cash + tick-delta + property-sum
    // valuation + fixed baseline reputation — matches the math in
    // corp-operations-shipping.html's getSubsidiaryData (View A).
    for (const sub of (subsRes.data || [])) {
        const parent = parentMap[sub.faction_id];
        if (!parent) continue;
        const parentStatus = (parent.corp_company_type || 'Private').toUpperCase();
        const subCash = Number(sub.sub_cash ?? 0);
        const gdpGrowth = nationGdpMap[sub.nation_id] ?? 50;
        const propsForSub = subPropsMap[`${sub.faction_id}|${sub.nation_id}`] || [];
        const subValuation = propsForSub.reduce((s, p) => s + Number(p.purchase_price || 0), 0);
        const tickDelta = computeSubsidiaryTickDelta({
            subCash,
            gdpGrowth,
            parentReputation: Number(parent.corp_reputation ?? 50),
        });
        corps.push({
            id: sub.id,
            faction_name: sub.name || 'Subsidiary',
            abbreviation: parent.abbreviation,
            corp_sector: parent.corp_sector,
            corp_subsector: sub.subsector || parent.corp_subsector,
            corp_ticker: parent.corp_ticker,
            corp_cash_reserves: subCash,
            nation_id: sub.nation_id,
            nation: nationMap[sub.nation_id] || '?',
            abbr: (parent.corp_ticker || parent.abbreviation || '??').slice(0, 4),
            status: parentStatus,
            isPlayer: !!parent.linked_user_id,
            reputation: SUB_DEFAULT_REPUTATION,
            revenue: tickDelta.netDelta,
            valuation: subValuation,
            _isSub: true,
            _parentName: parent.faction_name,
        });
    }

    return corps;
}
