// scripts/test-resolve-veto-override-and-default.mjs
//
// Phase R7: resolver-level tests for
//   - resolveVetoOverrideBill
//   - resolveDefaultResolutionBill
//
// Run with `npm run test:resolve-veto-override-and-default`.

import assert from 'node:assert/strict';
import {
    resolveVetoOverrideBill,
    resolveDefaultResolutionBill,
} from '../js/game/bills.js';
import { createSupabaseMock, callsFor } from './support/test-supabase-mock.mjs';

// ─── Fixtures ───────────────────────────────────────────────────────────────
const BASE_CTX = {
    passed: true,
    currentTick: 42,
    nation: { id: 'nation-1', name: 'Testland' },
    votesFor: 84,
    votesAgainst: 20,
    votesAbstain: 2,
};

function vetoOverrideBill(overrides = {}) {
    return {
        id: 'bill-vo',
        nation_id: 'nation-1',
        bill_name: 'Veto Override of Tax Reform',
        bill_type: 'veto_override',
        original_bill_id: 'orig-1',
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}

function defaultResolutionBill(overrides = {}) {
    return {
        id: 'bill-dr',
        nation_id: 'nation-1',
        bill_name: 'Sovereign Default Resolution',
        bill_type: 'default_resolution',
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

// ─── resolveVetoOverrideBill ────────────────────────────────────────────────
await suite('resolveVetoOverrideBill', async () => {
    await test('passed: marks bill + original passed, stamps president_action="overridden", enacts original', async () => {
        // Minimal original bill — enactBill tries to read bill_articles, active_laws, etc.
        // We seed just enough for the happy path; the mock's default { data: null, error: null }
        // handles the rest. The enactment itself may log warnings about missing data, but
        // the resolver's contract (marking passed + stamping override) is what we assert.
        const supabase = createSupabaseMock({
            'bills.select': {
                data: {
                    id: 'orig-1', nation_id: 'nation-1', bill_name: 'Tax Reform',
                    bill_type: 'ordinary', bill_articles: [], bill_support: [],
                    factions: { faction_name: 'Reform Party', ideology_value_1: 0, ideology_value_2: 0 },
                },
                error: null,
            },
        });
        const entry = await resolveVetoOverrideBill(supabase, vetoOverrideBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'veto_override');

        // bills.update: at minimum this bill → status passed, original → president_action overridden
        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'passed'),
            'expected bills.update status=passed (this bill)');
        assert.ok(billUpds.some(c => c.chain[0].args[0].president_action === 'overridden'),
            'expected bills.update president_action=overridden (original)');
    });

    await test('failed: marks this bill failed + original bill failed forever', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveVetoOverrideBill(supabase, vetoOverrideBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');

        const billUpds = callsFor(supabase, 'bills', 'update');
        // Should be two status=failed updates: one on this bill (via failBill), one on the original
        const failedUpds = billUpds.filter(c => c.chain[0].args[0].status === 'failed');
        assert.equal(failedUpds.length, 2, `expected 2 failed-status updates, got ${failedUpds.length}`);
    });

    await test('failed with no original_bill_id: only this bill is failed', async () => {
        const supabase = createSupabaseMock();
        const bill = vetoOverrideBill({ original_bill_id: null });
        const entry = await resolveVetoOverrideBill(supabase, bill, { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');
        const billUpds = callsFor(supabase, 'bills', 'update');
        const failedUpds = billUpds.filter(c => c.chain[0].args[0].status === 'failed');
        assert.equal(failedUpds.length, 1, 'expected only this bill to be failed');
    });

    await test('return shape carries votes + earlyResolution', async () => {
        const supabase = createSupabaseMock();
        const bill = vetoOverrideBill({ early_resolution_status: 'supermajority_reached' });
        const entry = await resolveVetoOverrideBill(supabase, bill, { ...BASE_CTX });
        assert.equal(entry.billId, 'bill-vo');
        assert.equal(entry.billName, 'Veto Override of Tax Reform');
        assert.equal(entry.votesFor, 84);
        assert.equal(entry.votesAgainst, 20);
        assert.equal(entry.earlyResolution, 'supermajority_reached');
    });
});

// ─── resolveDefaultResolutionBill ───────────────────────────────────────────
await suite('resolveDefaultResolutionBill', async () => {
    await test('passed: marks bill passed (typeof guards make enactSovereignDefault a no-op in tests)', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveDefaultResolutionBill(supabase, defaultResolutionBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'default_resolution');

        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'passed'),
            'expected bills.update status=passed');
    });

    await test('failed: calls failBill (bills.update status=failed)', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveDefaultResolutionBill(supabase, defaultResolutionBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');
        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'failed'),
            'expected bills.update status=failed');
    });

    await test('touches event_log on both pass and fail paths (fireBillEvent backfill)', async () => {
        // fireBillEvent primarily calls supabase.rpc('fire_system_event', ...) which our
        // mock treats as a no-op. After the RPC it runs backfill logic that queries
        // event_log.select(...) — THAT is the observable call we can assert on.
        const supabasePass = createSupabaseMock();
        await resolveDefaultResolutionBill(supabasePass, defaultResolutionBill(), { ...BASE_CTX });
        assert.ok(callsFor(supabasePass, 'event_log', 'select').length >= 1,
            'expected event_log.select on passed path (fireBillEvent backfill)');

        const supabaseFail = createSupabaseMock();
        await resolveDefaultResolutionBill(supabaseFail, defaultResolutionBill(), { ...BASE_CTX, passed: false });
        assert.ok(callsFor(supabaseFail, 'event_log', 'select').length >= 1,
            'expected event_log.select on failed path (fireBillEvent backfill)');
    });

    await test('return shape', async () => {
        const supabase = createSupabaseMock();
        const bill = defaultResolutionBill({ early_resolution_status: 'defeat_locked' });
        const entry = await resolveDefaultResolutionBill(supabase, bill, { ...BASE_CTX, passed: false });
        assert.equal(entry.billId, 'bill-dr');
        assert.equal(entry.billName, 'Sovereign Default Resolution');
        assert.equal(entry.type, 'default_resolution');
        assert.equal(entry.earlyResolution, 'defeat_locked');
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
