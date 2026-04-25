// js/corp-bankruptcy.js — shared bankruptcy flow for corp-operations{,-shipping}.html
//
// Before this module, the 140-line actDeclareBankruptcy plus the
// checkBankruptcyCooldown helper and BANKRUPTCY_COOLDOWN_TICKS /
// LOAN_PAYBACK_CEILING constants lived byte-identically in both corp
// pages — about 160 lines of duplication that already bit us once
// when a shipping-specific bug needed fixing in both places.
//
// The destructive work (valuation, loan payback, GDP shocks, event
// log, faction delete) now runs inside the declare_corp_bankruptcy
// SQL RPC so the whole thing is one atomic transaction with server-
// authoritative math. The client just gathers consent, invokes the
// RPC, and redirects.

import { _supabase } from './supabase-client.js';

let _declaring = false;

// Invoke from a window-scoped onclick handler on the CEO actions card.
// Returns nothing; side effect is alerts + page navigation.
export async function declareBankruptcy() {
    if (_declaring) return;

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) { alert('Not logged in.'); return; }

    const factionId = sessionStorage.getItem('active_faction_id');
    if (!factionId) { alert('No active faction selected.'); return; }

    // Load corp details for the confirmation prompt. The RPC re-reads
    // these under a row lock; this fetch is display-only.
    const { data: corp, error: corpErr } = await _supabase
        .from('factions')
        .select('id, faction_name, corp_sector, faction_type, abandoned_at')
        .eq('id', factionId)
        .single();
    if (corpErr || !corp || corp.faction_type !== 'corporation' || corp.abandoned_at) {
        alert('No active corporation found. It may have already been dissolved.');
        return;
    }
    const corpName = corp.faction_name || 'this corporation';

    if (!confirm(
        'DECLARE BANKRUPTCY — ' + corpName.toUpperCase() + '?\n\n' +
        'This will permanently:\n' +
        '• Dissolve the corporation\n' +
        '• Delete all properties, equipment, and inventory\n' +
        '• Pay back outstanding loans (up to 50% of market valuation)\n' +
        '• Remove all remaining cash reserves\n\n' +
        'You will need to found a new corporation.\n' +
        'There is a 24 tick cooldown on declaring bankruptcy.\n\n' +
        'This action CANNOT be undone.'
    )) return;

    const typed = prompt('Type "BANKRUPT" to confirm bankruptcy of ' + corpName + ':');
    if (typed !== 'BANKRUPT') { alert('Bankruptcy cancelled.'); return; }

    _declaring = true;
    try {
        // One call. The RPC is atomic — cooldown check, valuation, loan
        // payback, GDP shocks, event log, and faction delete either all
        // commit or all roll back.
        const { data, error } = await _supabase.rpc('declare_corp_bankruptcy', {
            p_faction_id: factionId,
        });
        if (error) throw error;

        const totalPayback = Number(data?.total_payback || 0);
        const payMsg = totalPayback > 0
            ? '\n$' + totalPayback.toLocaleString() + ' repaid to creditors.'
            : '';

        sessionStorage.removeItem('active_faction_id');
        sessionStorage.removeItem('nationhood_state');

        // Pick the next faction to show. RLS still gates this — the
        // caller only sees their own factions.
        const { data: remaining, error: remErr } = await _supabase
            .from('factions')
            .select('id, faction_type')
            .or(`id.eq.${user.id},linked_user_id.eq.${user.id}`);
        if (remErr) console.warn('[Bankruptcy] remaining-factions lookup failed:', remErr.message);

        const party = (remaining || []).find(f => f.faction_type === 'party');
        const otherCorp = (remaining || []).find(f => f.faction_type === 'corporation');

        if (party) {
            sessionStorage.setItem('active_faction_id', party.id);
            alert(corpName + ' has declared bankruptcy.' + payMsg + '\n\nRedirecting to your political party.');
            window.location.href = 'dashboard.html';
        } else if (otherCorp) {
            sessionStorage.setItem('active_faction_id', otherCorp.id);
            alert(corpName + ' has declared bankruptcy.' + payMsg + '\n\nRedirecting to your other corporation.');
            window.location.href = 'corp-dashboard.html';
        } else {
            alert(corpName + ' has declared bankruptcy.' + payMsg + '\n\nYou have no remaining factions.');
            window.location.href = 'faction-select.html';
        }
    } catch (err) {
        alert('Bankruptcy failed: ' + (err?.message || err) + '\n\nPlease try again or contact support.');
    } finally {
        _declaring = false;
    }
}
