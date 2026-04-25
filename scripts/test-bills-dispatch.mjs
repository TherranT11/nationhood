// scripts/test-bills-dispatch.mjs
//
// Phase R9b: tests for the BILL_RESOLVERS dispatch map + selectBillResolver.
//
// After R3-R9a we had 13 resolvers plus a ~80-line if/else-if chain in
// resolveExpiredVotes. R9b collapses that chain into a single frozen map,
// keyed by bill.bill_type, with a selector function that picks the right
// resolver (handling sub-keyed types like ratification variants).
//
// Run with `npm run test:bills-dispatch`.

import assert from 'node:assert/strict';
import {
    selectBillResolver,
    resolveMinisterConfirmationBill,
    resolveAmbassadorConfirmationBill,
    resolveNoConfidenceBill,
    resolveImpeachmentMotionBill,
    resolveImpeachmentConvictionBill,
    resolveDiplomaticRatificationBill,
    resolveTradeRatificationBill,
    resolveRetaliatoryTariffRatificationBill,
    resolveEmbargoRatificationBill,
    resolveVetoOverrideBill,
    resolveDefaultResolutionBill,
    resolveFoundationalBill,
    resolveOrdinaryBill,
} from '../js/game/bills.js';

// ─── Tiny runner ────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
    try { fn(); passed++; }
    catch (e) { failed++; failures.push({ name, error: e }); }
}
function suite(name, fn) {
    console.log(`\n  ${name}`);
    const before = passed + failed;
    fn();
    const ran = passed + failed - before;
    console.log(`    ${ran} test${ran !== 1 ? 's' : ''}`);
}

// ─── Direct dispatch (flat, unambiguous bill_types) ─────────────────────────
suite('direct dispatch — one bill_type → one resolver', () => {
    test('no_confidence → resolveNoConfidenceBill', () => {
        assert.equal(selectBillResolver({ bill_type: 'no_confidence' }), resolveNoConfidenceBill);
    });
    test('foundational → resolveFoundationalBill', () => {
        assert.equal(selectBillResolver({ bill_type: 'foundational' }), resolveFoundationalBill);
    });
    test('default_resolution → resolveDefaultResolutionBill', () => {
        assert.equal(selectBillResolver({ bill_type: 'default_resolution' }), resolveDefaultResolutionBill);
    });
});

// ─── Sub-keyed dispatch (bill_type + secondary field) ───────────────────────
suite('sub-keyed dispatch — bill_type plus secondary field', () => {
    test('confirmation + ambassador_id → resolveAmbassadorConfirmationBill', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'confirmation', ambassador_id: 'amb-1' }),
            resolveAmbassadorConfirmationBill
        );
    });
    test('confirmation without ambassador_id → ordinary fallback', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'confirmation' }),
            resolveOrdinaryBill
        );
    });
    test('minister_confirmation + ministry_key → resolveMinisterConfirmationBill', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'minister_confirmation', ministry_key: 'defense' }),
            resolveMinisterConfirmationBill
        );
    });
    test('minister_confirmation without ministry_key → ordinary fallback', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'minister_confirmation' }),
            resolveOrdinaryBill
        );
    });
    test('veto_override + original_bill_id → resolveVetoOverrideBill', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'veto_override', original_bill_id: 'orig-1' }),
            resolveVetoOverrideBill
        );
    });
    test('veto_override without original_bill_id → ordinary fallback', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'veto_override' }),
            resolveOrdinaryBill
        );
    });
    test('impeachment_motion + impeachment_id → resolveImpeachmentMotionBill', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'impeachment_motion', impeachment_id: 'imp-1' }),
            resolveImpeachmentMotionBill
        );
    });
    test('impeachment_conviction + impeachment_id → resolveImpeachmentConvictionBill', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'impeachment_conviction', impeachment_id: 'imp-1' }),
            resolveImpeachmentConvictionBill
        );
    });
});

// ─── Ratification variants (four sub-paths on one bill_type) ────────────────
suite('ratification variants — bill_type=ratification picks from four', () => {
    test('diplomatic_proposal_id → resolveDiplomaticRatificationBill', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'ratification', diplomatic_proposal_id: 'dip-1' }),
            resolveDiplomaticRatificationBill
        );
    });
    test('trade_negotiation_id → resolveTradeRatificationBill', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'ratification', trade_negotiation_id: 'tr-1' }),
            resolveTradeRatificationBill
        );
    });
    test('trade_agreement_data.type=retaliatory_tariff → retaliatory resolver', () => {
        assert.equal(
            selectBillResolver({
                bill_type: 'ratification',
                trade_agreement_data: { type: 'retaliatory_tariff' },
            }),
            resolveRetaliatoryTariffRatificationBill
        );
    });
    test('trade_agreement_data.type=impose_embargo → embargo resolver', () => {
        assert.equal(
            selectBillResolver({
                bill_type: 'ratification',
                trade_agreement_data: { type: 'impose_embargo' },
            }),
            resolveEmbargoRatificationBill
        );
    });
    test('ratification with no sub-key → ordinary fallback', () => {
        assert.equal(
            selectBillResolver({ bill_type: 'ratification' }),
            resolveOrdinaryBill
        );
    });
    test('diplomatic_proposal_id wins over trade_negotiation_id (chain precedence)', () => {
        // Characterization: the if/else-if chain checked diplomatic first.
        assert.equal(
            selectBillResolver({
                bill_type: 'ratification',
                diplomatic_proposal_id: 'dip-1',
                trade_negotiation_id: 'tr-1',
            }),
            resolveDiplomaticRatificationBill
        );
    });
});

// ─── Fallback path ──────────────────────────────────────────────────────────
suite('fallback — unknown or plain bill_type → resolveOrdinaryBill', () => {
    test('ordinary → resolveOrdinaryBill', () => {
        assert.equal(selectBillResolver({ bill_type: 'ordinary' }), resolveOrdinaryBill);
    });
    test('repeal → resolveOrdinaryBill', () => {
        assert.equal(selectBillResolver({ bill_type: 'repeal' }), resolveOrdinaryBill);
    });
    test('unknown bill_type → resolveOrdinaryBill', () => {
        assert.equal(selectBillResolver({ bill_type: 'does_not_exist' }), resolveOrdinaryBill);
    });
    test('missing bill_type → resolveOrdinaryBill', () => {
        assert.equal(selectBillResolver({}), resolveOrdinaryBill);
    });
});

// ─── Partition invariant ────────────────────────────────────────────────────
suite('partition invariant — every resolver is reachable, no duplicates', () => {
    test('every non-ordinary resolver is selected by some concrete bill shape', () => {
        const cases = [
            [{ bill_type: 'no_confidence' },                                      resolveNoConfidenceBill],
            [{ bill_type: 'foundational' },                                       resolveFoundationalBill],
            [{ bill_type: 'default_resolution' },                                 resolveDefaultResolutionBill],
            [{ bill_type: 'confirmation', ambassador_id: 'x' },                   resolveAmbassadorConfirmationBill],
            [{ bill_type: 'minister_confirmation', ministry_key: 'x' },           resolveMinisterConfirmationBill],
            [{ bill_type: 'veto_override', original_bill_id: 'x' },               resolveVetoOverrideBill],
            [{ bill_type: 'impeachment_motion', impeachment_id: 'x' },            resolveImpeachmentMotionBill],
            [{ bill_type: 'impeachment_conviction', impeachment_id: 'x' },        resolveImpeachmentConvictionBill],
            [{ bill_type: 'ratification', diplomatic_proposal_id: 'x' },          resolveDiplomaticRatificationBill],
            [{ bill_type: 'ratification', trade_negotiation_id: 'x' },            resolveTradeRatificationBill],
            [{ bill_type: 'ratification', trade_agreement_data: { type: 'retaliatory_tariff' } }, resolveRetaliatoryTariffRatificationBill],
            [{ bill_type: 'ratification', trade_agreement_data: { type: 'impose_embargo' } },     resolveEmbargoRatificationBill],
        ];
        for (const [bill, expected] of cases) {
            assert.equal(selectBillResolver(bill), expected,
                `bill ${JSON.stringify(bill)} should route to ${expected.name}`);
        }
    });

    test('returned value is ALWAYS a function (no null/undefined escapes)', () => {
        const shapes = [
            {}, { bill_type: null }, { bill_type: 'ratification' },
            { bill_type: 'confirmation' }, { bill_type: 'veto_override' },
            { bill_type: 'made_up' },
        ];
        for (const bill of shapes) {
            const r = selectBillResolver(bill);
            assert.equal(typeof r, 'function',
                `selectBillResolver(${JSON.stringify(bill)}) must return a function, got ${typeof r}`);
        }
    });
});

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
        console.log(`  ✗ ${f.name}`);
        console.log(`    ${f.error.message}`);
    }
    process.exit(1);
}
