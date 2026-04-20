// ═══════════════════════════════════════════════════════════════════════════
// Apply for Equity — raiser-side flow (Phase 7)
//
// Non-finance corps (Construction, Shipping, …) call this to post an equity
// fundraising request to Deal Flow. Investment corps see it there and can
// BUY STAKE (Phase 3 RPC).
//
// Series auto-classifier: counts how many PRIOR funded equity raises this
// corp has closed and labels this request with the next letter (A, B, C, …).
// Cancelled / expired raises don't count — they didn't happen. After Z we
// stop incrementing and reuse 'Z' as a late-stage catch-all; it's free-form
// TEXT in the DB so future phases can replace with 'LATE' / 'PRE-IPO' / etc.
//
// Writes to finance_loan_requests directly — no RPC needed because the
// raiser IS the requesting_faction_id, so the existing RLS policy allows
// this INSERT. The Phase 3 buy-in is the cross-faction op that needed an
// RPC; this one does not.
// ═══════════════════════════════════════════════════════════════════════════

const MIN_AMOUNT_USD = 1_000_000;          // $1M
const MAX_AMOUNT_USD = 10_000_000_000;     // $10B — larger than loans because equity raises can be huge
const MIN_STAKE_PCT  = 1;
const MAX_STAKE_PCT  = 50;                 // mirrors the CHECK constraint on requests
const RAISE_EXPIRY_TICKS = 12;             // request sits in Deal Flow for 12 ticks (~1yr)

function nextSeriesLetter(priorFundedCount) {
    if (priorFundedCount < 0) return 'A';
    const idx = Math.min(priorFundedCount, 25); // clamp at 'Z'
    return String.fromCharCode(65 + idx);
}

export async function applyForEquity(faction, shard, supabase) {
    if (!faction || !shard || !supabase) return;

    // Hard gate: Finance-sector corps don't apply for equity — they fund it.
    // The UI filters this action out, but guard the handler too so a crafty
    // URL / console call can't slip past.
    if ((faction.corp_sector || '').toLowerCase() === 'finance') {
        alert('Finance-sector corps fund equity; they do not raise it.');
        return;
    }

    const amountMStr = prompt(
        'APPLY FOR EQUITY — STEP 1 / 3\n\n' +
        'How much capital do you want to raise? (in millions USD)\n\n' +
        'Example: 50 for a $50M raise.\n' +
        'Range: $1M – $10B.'
    );
    if (amountMStr === null) return;
    const amountM = parseFloat(amountMStr);
    if (isNaN(amountM) || amountM <= 0) { alert('Amount must be a positive number.'); return; }
    const amount = Math.round(amountM * 1_000_000);
    if (amount < MIN_AMOUNT_USD) { alert('Minimum raise is $1M.'); return; }
    if (amount > MAX_AMOUNT_USD) { alert('Maximum raise is $10B.'); return; }

    const stakeStr = prompt(
        'APPLY FOR EQUITY — STEP 2 / 3\n\n' +
        'What stake are you offering in exchange? (percent)\n\n' +
        'Example: 12.5 for a 12.5% share of monthly profits.\n' +
        'Range: 1% – 50%.'
    );
    if (stakeStr === null) return;
    const stake = parseFloat(stakeStr);
    if (isNaN(stake) || stake < MIN_STAKE_PCT || stake > MAX_STAKE_PCT) {
        alert(`Stake must be between ${MIN_STAKE_PCT}% and ${MAX_STAKE_PCT}%.`);
        return;
    }

    const purpose = prompt(
        'APPLY FOR EQUITY — STEP 3 / 3\n\n' +
        'Describe the purpose of this raise.\n\n' +
        'Example: "Series B to fund fleet expansion across Mira ports."\n' +
        'Investment corps see this in Deal Flow when deciding whether to fund you.'
    );
    if (purpose === null) return;
    const purposeTrim = (purpose || '').trim() || 'Equity capital raise';

    // Auto-classifier: count PRIOR funded equity raises for this corp.
    const { data: priorRaises, error: countErr } = await supabase
        .from('finance_loan_requests')
        .select('id')
        .eq('requesting_faction_id', faction.id)
        .eq('request_type', 'equity')
        .eq('status', 'funded');
    if (countErr) {
        alert('Could not look up prior raises: ' + countErr.message);
        return;
    }
    const series = nextSeriesLetter((priorRaises || []).length);

    const summary = `Post Series ${series} equity raise?\n\n`
        + `Amount:   $${amountM}M\n`
        + `Stake:    ${stake}%\n`
        + `Series:   ${series}\n`
        + `Purpose:  ${purposeTrim}\n\n`
        + `This becomes visible to Investment corps in Deal Flow. `
        + `Once an investor buys in, your corp pays them ${stake}% of monthly profit each tick.`;
    if (!confirm(summary)) return;

    const currentTick = Number(shard.current_tick || 0);
    // term_months uses the 120-month sentinel (not 0) to satisfy the base
    // CHECK constraint (term_months >= 1). Phase 3's buy-in RPC already
    // COALESCE-NULLIFs term_months through to 120 for the active position,
    // so 120 here passes cleanly into the active_loan record.
    const { error: insertErr } = await supabase.from('finance_loan_requests').insert({
        requesting_faction_id: faction.id,
        nation_id: faction.nation_id,
        request_type: 'equity',
        amount,
        equity_pct: stake,
        series,
        term_months: 120,
        purpose: purposeTrim,
        status: 'open',
        created_tick: currentTick,
        expires_tick: currentTick + RAISE_EXPIRY_TICKS,
    });
    if (insertErr) {
        alert('Failed to post equity raise: ' + insertErr.message);
        return;
    }

    alert(`Series ${series} raise posted to Deal Flow. Investment corps can now fund you.`);
}
