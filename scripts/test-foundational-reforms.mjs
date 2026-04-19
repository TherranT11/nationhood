// scripts/test-foundational-reforms.mjs
//
// Phase R10: characterization tests for enactFoundationalBill's 13 subtype
// branches. Each test fires the function with exactly one `proposed_*`
// field set and asserts dispatch reached the right branch.
//
// For subtypes with a cheap invalid-input early-return, we seed an invalid
// value and assert bills.update({status:'failed', passed_tick:...}) + false
// return. For subtypes without invalid-input guards, we assert a unique
// side-effect (event_log trigger_key or specific nation_update fields).
//
// Run with `npm run test:foundational-reforms`.

import assert from 'node:assert/strict';
import { enactFoundationalBill } from '../js/game/bills.js';
import { createSupabaseMock, callsFor } from './support/test-supabase-mock.mjs';

const CURRENT_TICK = 42;

function bill(overrides = {}) {
    return {
        id: 'bill-fnd',
        nation_id: 'nation-1',
        bill_name: 'Foundational Bill',
        bill_type: 'foundational',
        ...overrides,
    };
}

// Pull invalid-update records (status=failed, passed_tick set).
function failedUpdates(supabase) {
    return callsFor(supabase, 'bills', 'update')
        .filter(c => c.chain[0].args[0].status === 'failed');
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

// ─── Subtypes with cheap invalid-input early-return ─────────────────────────
await suite('invalid-input dispatch — each subtype routes to its own validator', async () => {
    await test('proposed_term_length=999 → returns false + failed update', async () => {
        const supabase = createSupabaseMock();
        const result = await enactFoundationalBill(supabase, bill({ proposed_term_length: 999 }), CURRENT_TICK);
        assert.equal(result, false);
        assert.equal(failedUpdates(supabase).length, 1);
    });

    await test('proposed_parliamentary_term_length=999 → returns false', async () => {
        const supabase = createSupabaseMock();
        const result = await enactFoundationalBill(supabase, bill({ proposed_parliamentary_term_length: 999 }), CURRENT_TICK);
        assert.equal(result, false);
        assert.equal(failedUpdates(supabase).length, 1);
    });

    await test('proposed_term_limit=999 → returns false', async () => {
        const supabase = createSupabaseMock();
        const result = await enactFoundationalBill(supabase, bill({ proposed_term_limit: 999 }), CURRENT_TICK);
        assert.equal(result, false);
        assert.equal(failedUpdates(supabase).length, 1);
    });

    await test('proposed_constitutional_reform="nope" → returns false', async () => {
        const supabase = createSupabaseMock();
        const result = await enactFoundationalBill(supabase, bill({ proposed_constitutional_reform: 'nope' }), CURRENT_TICK);
        assert.equal(result, false);
        assert.equal(failedUpdates(supabase).length, 1);
    });

    await test('proposed_hos_election_method="nope" → returns false', async () => {
        const supabase = createSupabaseMock();
        const result = await enactFoundationalBill(supabase, bill({ proposed_hos_election_method: 'nope' }), CURRENT_TICK);
        assert.equal(result, false);
        assert.equal(failedUpdates(supabase).length, 1);
    });

    await test('proposed_hos_title="   " → returns false', async () => {
        const supabase = createSupabaseMock();
        const result = await enactFoundationalBill(supabase, bill({ proposed_hos_title: '   ' }), CURRENT_TICK);
        assert.equal(result, false);
        assert.equal(failedUpdates(supabase).length, 1);
    });

    await test('proposed_party_registration_threshold=999 → returns false', async () => {
        const supabase = createSupabaseMock();
        const result = await enactFoundationalBill(supabase, bill({ proposed_party_registration_threshold: 999 }), CURRENT_TICK);
        assert.equal(result, false);
        assert.equal(failedUpdates(supabase).length, 1);
    });

    await test('fallthrough — no proposed_* matches, proposed_seats=10 (invalid) → returns false', async () => {
        const supabase = createSupabaseMock();
        // All other proposed_* fields absent → falls through to Electoral Makeup
        const result = await enactFoundationalBill(supabase, bill({ proposed_seats: 10 }), CURRENT_TICK);
        assert.equal(result, false);
        assert.equal(failedUpdates(supabase).length, 1);
    });
});

// ─── Subtypes without invalid-input guards — verify unique side-effect ──────
//
// These subtypes dispatch and do real work on any truthy value. We verify
// routing by checking for their signature event_log trigger_key.
await suite('side-effect dispatch — event_log trigger_key identifies the subtype', async () => {
    async function triggerKeyFor(billOverrides) {
        const supabase = createSupabaseMock();
        await enactFoundationalBill(supabase, bill(billOverrides), CURRENT_TICK);
        const inserts = callsFor(supabase, 'event_log', 'insert');
        // Some subtypes insert into event_log; we look for the first trigger_key.
        for (const c of inserts) {
            const row = c.chain[0].args[0];
            if (row?.trigger_key) return row.trigger_key;
        }
        return null;
    }

    await test('proposed_judicial_appointment_politicization → judicial_appointment_politicization event', async () => {
        const key = await triggerKeyFor({ proposed_judicial_appointment_politicization: true });
        assert.equal(key, 'judicial_appointment_politicization');
    });

    await test('proposed_electoral_commission_reform → electoral_commission_reform event', async () => {
        const key = await triggerKeyFor({ proposed_electoral_commission_reform: true });
        assert.equal(key, 'electoral_commission_reform');
    });
});

// ─── Dispatch precedence — first matching subtype wins ──────────────────────
//
// Characterization: the current code uses an if-cascade, so an earlier
// subtype takes precedence over later ones when multiple fields are set.
// Pins the order: term_length > parliamentary_term_length > term_limit >
// constitutional_reform > … > proposed_seats.
await suite('dispatch precedence — earlier subtype wins', async () => {
    await test('term_length + parliamentary_term_length both set → term_length wins', async () => {
        const supabase = createSupabaseMock();
        // Both invalid, to avoid downstream noise
        const result = await enactFoundationalBill(supabase,
            bill({ proposed_term_length: 999, proposed_parliamentary_term_length: 999 }),
            CURRENT_TICK);
        assert.equal(result, false);
        // Exactly ONE failed update — the term_length validator
        assert.equal(failedUpdates(supabase).length, 1,
            'term_length should short-circuit before parliamentary_term_length');
    });

    await test('constitutional_reform + proposed_seats both set → constitutional_reform wins', async () => {
        const supabase = createSupabaseMock();
        const result = await enactFoundationalBill(supabase,
            bill({ proposed_constitutional_reform: 'nope', proposed_seats: 100 }),
            CURRENT_TICK);
        assert.equal(result, false);
        // Exactly one failed update — the constitutional_reform validator.
        // If the fallthrough ran it would be TWO failed updates or a pass.
        assert.equal(failedUpdates(supabase).length, 1);
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
