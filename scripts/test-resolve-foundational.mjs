// scripts/test-resolve-foundational.mjs
//
// Phase R9a: resolver-level tests for resolveFoundationalBill.
//
// The heavy lifting for foundational bills lives in enactFoundationalBill
// (a 1,250-line function that performs constitutional transitions). We
// test the dispatcher around it — the three-outcome truth table:
//   passed + enactment success   → result='passed', no failBill
//   passed + enactment failure   → result='failed', NO failBill (warn only)
//   failed                       → result='failed', failBill called
//
// In tests we let enactFoundationalBill run against the recording mock.
// With unseeded responses it returns false (the failed-enactment path) —
// enough to characterize the passed-but-not-enacted branch. The
// passed-AND-enacted path is covered by integration once proper fixtures
// are seeded; here we verify the no-failBill invariant.
//
// Run with `npm run test:resolve-foundational`.

import assert from 'node:assert/strict';
import { resolveFoundationalBill } from '../js/game/bills.js';
import { createSupabaseMock, callsFor } from './support/test-supabase-mock.mjs';

// ─── Fixtures ───────────────────────────────────────────────────────────────
const BASE_CTX = {
    passed: true,
    currentTick: 42,
    nation: { id: 'nation-1', name: 'Testland' },
    votesFor: 84,
    votesAgainst: 20,
    votesAbstain: 0,
};

function foundationalBill(overrides = {}) {
    return {
        id: 'bill-fnd',
        nation_id: 'nation-1',
        bill_name: 'Amendment: Ban the Filibuster',
        bill_type: 'foundational',
        bill_articles: [],
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}

// ─── Tiny runner ────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];
async function test(name, fn) {
    try { await fn(); passed++; }
    catch (e) { failed++; failures.push({ name, error: e }); }
}
function suite(name, fn) {
    console.log(`\n  ${name}`);
    const before = passed + failed;
    return Promise.resolve(fn()).then(() => {
        const ran = passed + failed - before;
        console.log(`    ${ran} test${ran !== 1 ? 's' : ''}`);
    });
}

// ─── Failed-vote path ───────────────────────────────────────────────────────
await suite('failed vote → failBill, no enactment', async () => {
    await test('calls failBill (bills.update status=failed) and returns failed', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveFoundationalBill(supabase, foundationalBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');
        assert.equal(entry.type, 'foundational');

        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'failed'),
            'expected failBill to update status=failed');
    });

    await test('failed-vote path does NOT attempt enactFoundationalBill', async () => {
        const supabase = createSupabaseMock();
        await resolveFoundationalBill(supabase, foundationalBill(), { ...BASE_CTX, passed: false });
        // enactFoundationalBill starts with nations.select — if it had run,
        // that call would be recorded.
        assert.equal(callsFor(supabase, 'nations', 'select').length, 0,
            'enactFoundationalBill should not be called when vote failed');
    });
});

// ─── Passed-vote + enactment-fails path ─────────────────────────────────────
//
// To force a deterministic enactment failure we seed the bill with an
// *invalid* foundational subtype — proposed_term_length: 999 (not in the
// canonical TERM_LENGTH_OPTIONS list). enactFoundationalBill's first branch
// catches this, marks the bill failed itself, and returns false.
//
// Distinguishing owner: failBill issues { status: 'failed' } with ONLY that
// field (one key). enactFoundationalBill's own early-fail update includes
// passed_tick, so it has 2 keys. We can tell them apart by key count.
await suite('passed + enactment fails → result=failed, NO failBill from resolver', async () => {
    await test('resolver returns failed; the ONLY bills.update marking failed is enactFoundationalBill\'s (has passed_tick), not failBill (single-key)', async () => {
        const supabase = createSupabaseMock();
        const bill = foundationalBill({ proposed_term_length: 999 }); // invalid → enactFoundationalBill returns false
        const entry = await resolveFoundationalBill(supabase, bill, { ...BASE_CTX });

        assert.equal(entry.result, 'failed');

        const failedUpds = callsFor(supabase, 'bills', 'update')
            .filter(c => c.chain[0].args[0].status === 'failed');

        // Every failed update from this test must come from enactFoundationalBill
        // (2-key: status + passed_tick). None should be from failBill (single-key).
        const failBillShaped = failedUpds.filter(c => Object.keys(c.chain[0].args[0]).length === 1);
        assert.equal(failBillShaped.length, 0,
            'resolver must NOT call failBill when enactment fails on a passed vote');
    });

    await test('enactFoundationalBill is attempted when vote passed (invalid-subtype path)', async () => {
        const supabase = createSupabaseMock();
        const bill = foundationalBill({ proposed_term_length: 999 });
        await resolveFoundationalBill(supabase, bill, { ...BASE_CTX });
        // The invalid-subtype path doesn't call nations.select — it short-
        // circuits on the invalid-option check. But it DOES issue a
        // bills.update { status: 'failed', passed_tick } — presence confirms
        // enactFoundationalBill ran.
        const twoKeyFailed = callsFor(supabase, 'bills', 'update')
            .filter(c => c.chain[0].args[0].status === 'failed'
                       && typeof c.chain[0].args[0].passed_tick === 'number');
        assert.ok(twoKeyFailed.length >= 1,
            'expected enactFoundationalBill\'s own status+passed_tick update');
    });
});

// ─── Return shape ───────────────────────────────────────────────────────────
await suite('return shape', async () => {
    await test('carries billId / billName / votes / earlyResolution', async () => {
        const supabase = createSupabaseMock();
        const bill = foundationalBill({ early_resolution_status: 'supermajority_reached' });
        const entry = await resolveFoundationalBill(supabase, bill, { ...BASE_CTX, passed: false });
        assert.equal(entry.billId, 'bill-fnd');
        assert.equal(entry.billName, 'Amendment: Ban the Filibuster');
        assert.equal(entry.votesFor, 84);
        assert.equal(entry.votesAgainst, 20);
        assert.equal(entry.earlyResolution, 'supermajority_reached');
        assert.equal(entry.type, 'foundational');
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
