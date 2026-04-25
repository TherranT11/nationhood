// scripts/test-resolve-ratifications.mjs
//
// Phase R6: resolver-level tests for the four ratification variants
//   - resolveDiplomaticRatificationBill       (proposal-tier, bilateral/unilateral)
//   - resolveTradeRatificationBill            (trade-negotiation, bilateral)
//   - resolveRetaliatoryTariffRatificationBill (unilateral sanctions)
//   - resolveEmbargoRatificationBill          (unilateral sanctions)
//
// Run with `npm run test:resolve-ratifications`.

import assert from 'node:assert/strict';
import {
    resolveDiplomaticRatificationBill,
    resolveTradeRatificationBill,
    resolveRetaliatoryTariffRatificationBill,
    resolveEmbargoRatificationBill,
} from '../js/game/bills.js';
import { createSupabaseMock, callsFor } from './support/test-supabase-mock.mjs';

// ─── Fixtures ───────────────────────────────────────────────────────────────
const BASE_CTX = {
    passed: true,
    currentTick: 42,
    nation: { id: 'nation-1', name: 'Testland' },
    votesFor: 70,
    votesAgainst: 30,
    votesAbstain: 5,
};

function diplomaticBill(overrides = {}) {
    return {
        id: 'bill-dip',
        nation_id: 'nation-1',
        bill_name: 'Ratify Diplomatic Proposal',
        bill_type: 'ratification',
        diplomatic_proposal_id: 'dip-1',
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}
function tradeNegBill(overrides = {}) {
    return {
        id: 'bill-tn',
        nation_id: 'nation-1',
        bill_name: 'Ratify Trade Negotiation',
        bill_type: 'ratification',
        trade_negotiation_id: 'neg-1',
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}
function retaliatoryBill(overrides = {}) {
    return {
        id: 'bill-rt',
        nation_id: 'nation-1',
        bill_name: 'Retaliatory Tariff',
        bill_type: 'ratification',
        trade_agreement_data: {
            type: 'retaliatory_tariff',
            imposer_nation_id: 'nation-1',
            target_nation_id: 'nation-2',
            duration_type: 'fixed',
            duration_ticks: 12,
            agreement_name: 'Test Retaliation',
            articles: [{ type: 'tariff_surcharge', data: { surcharge_pct: 30 } }],
        },
        bill_support: [],
        early_resolution_status: null,
        ...overrides,
    };
}
function embargoBill(overrides = {}) {
    return {
        id: 'bill-em',
        nation_id: 'nation-1',
        bill_name: 'Embargo',
        bill_type: 'ratification',
        trade_agreement_data: {
            type: 'impose_embargo',
            imposer_nation_id: 'nation-1',
            target_nation_id: 'nation-2',
            duration_ticks: 24,
            agreement_name: 'Test Embargo',
            articles: [
                { type: 'embargo_sector', data: { sector: 'arms' } },
                { type: 'embargo_sector', data: { sector: 'luxuries' } },
            ],
        },
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

// ─── resolveDiplomaticRatificationBill ─────────────────────────────────────
await suite('resolveDiplomaticRatificationBill', async () => {
    await test('unilateral passed: activates proposal + applies relation bump', async () => {
        const supabase = createSupabaseMock({
            'diplomatic_proposals.select': {
                data: {
                    id: 'dip-1',
                    proposal_tier: 1, // unilateral (not tier 3)
                    proposal_type: 'non_aggression',
                    proposing_nation_id: 'nation-1',
                    target_nation_id: 'nation-2',
                    proposal_data: { articles: [{ relations: 10 }] },
                },
                error: null,
            },
            'diplomatic_relations.select': { data: { id: 'rel-1', relation_score: 50, active_treaties: [] }, error: null },
        });
        const entry = await resolveDiplomaticRatificationBill(supabase, diplomaticBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'ratification');

        // proposal activated
        const dpUpds = callsFor(supabase, 'diplomatic_proposals', 'update');
        assert.ok(dpUpds.some(c => c.chain[0].args[0].status === 'active'),
            'expected proposal activated');

        // relations updated with +10 bonus (50 → 60)
        const relUpds = callsFor(supabase, 'diplomatic_relations', 'update');
        assert.ok(relUpds.some(c => c.chain[0].args[0].relation_score === 60),
            'expected diplomatic_relations relation_score=60');
    });

    await test('bilateral passed, other side still pending: marks own side passed + waits', async () => {
        const supabase = createSupabaseMock({
            'diplomatic_proposals.select': {
                data: {
                    id: 'dip-1',
                    proposal_tier: 3,
                    proposing_bill_id: 'bill-dip',  // THIS bill is the proposer
                    target_bill_id: 'other-bill',
                    proposal_data: { pipeline: {}, articles: [] },
                },
                error: null,
            },
            'bills.select': { data: { status: 'floor' }, error: null }, // other side not yet passed
        });
        const entry = await resolveDiplomaticRatificationBill(supabase, diplomaticBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');

        // proposal_data.pipeline updated with proposer_result=passed, but status NOT set to 'active'
        const dpUpds = callsFor(supabase, 'diplomatic_proposals', 'update');
        assert.ok(!dpUpds.some(c => c.chain[0].args[0].status === 'active'),
            'proposal should NOT be activated yet — only one side ratified');
        assert.ok(dpUpds.some(c => c.chain[0].args[0].proposal_data?.pipeline?.proposer_result === 'passed'),
            'expected pipeline.proposer_result=passed');
    });

    await test('unilateral failed: marks proposal ratification_failed', async () => {
        const supabase = createSupabaseMock({
            'diplomatic_proposals.select': {
                data: { proposal_tier: 1, proposing_bill_id: null, target_bill_id: null },
                error: null,
            },
        });
        const entry = await resolveDiplomaticRatificationBill(supabase, diplomaticBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');
        const dpUpds = callsFor(supabase, 'diplomatic_proposals', 'update');
        assert.ok(dpUpds.some(c => c.chain[0].args[0].status === 'ratification_failed'),
            'expected proposal marked ratification_failed');
    });

    await test('bilateral failed: cancels the other side\'s open ratification bill', async () => {
        const supabase = createSupabaseMock({
            'diplomatic_proposals.select': {
                data: {
                    proposal_tier: 3,
                    proposing_bill_id: 'bill-dip',
                    target_bill_id: 'other-bill',
                    proposal_data: { pipeline: {}, name: 'Initiative X' },
                    proposing_nation_id: 'nation-1',
                    target_nation_id: 'nation-2',
                },
                error: null,
            },
            'bills.select': { data: { status: 'floor', preamble: 'Ratify the initiative.' }, error: null },
        });
        const entry = await resolveDiplomaticRatificationBill(supabase, diplomaticBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');
        // other bill cancelled
        const billUpds = callsFor(supabase, 'bills', 'update');
        assert.ok(billUpds.some(c => c.chain[0].args[0].status === 'failed' && (c.chain[0].args[0].preamble || '').includes('Automatically cancelled')),
            'expected other bill cancelled with explanatory preamble');
    });
});

// ─── resolveTradeRatificationBill ───────────────────────────────────────────
await suite('resolveTradeRatificationBill', async () => {
    await test('both sides ratified: creates trade_agreement + marks negotiation concluded', async () => {
        const supabase = createSupabaseMock({
            'trade_negotiations.select': {
                data: {
                    id: 'neg-1',
                    nation_a_id: 'nation-1',
                    nation_b_id: 'nation-2',
                    bill_a_id: 'bill-tn',
                    bill_b_id: 'other-bill',
                    agreement_type: 'commodity_pact',
                    agreement_name: 'CTA',
                    draft_articles: [{ type: 'duration', data: { duration_type: 'fixed', duration_ticks: 240 } }],
                },
                error: null,
            },
            'bills.select': { data: { status: 'passed' }, error: null }, // other side already passed
            'trade_agreements.insert': { data: { id: 'ta-1' }, error: null },
        });
        const entry = await resolveTradeRatificationBill(supabase, tradeNegBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'trade_ratification');

        const taIns = callsFor(supabase, 'trade_agreements', 'insert');
        assert.equal(taIns.length, 1);
        const row = taIns[0].chain[0].args[0];
        assert.equal(row.agreement_type, 'commodity_pact');
        assert.equal(row.status, 'active');

        const negUpds = callsFor(supabase, 'trade_negotiations', 'update');
        assert.ok(negUpds.some(c => c.chain[0].args[0].status === 'concluded'),
            'expected negotiation concluded');
    });

    await test('one side ratified: negotiation stays in ratification status', async () => {
        const supabase = createSupabaseMock({
            'trade_negotiations.select': {
                data: { id: 'neg-1', nation_a_id: 'nation-1', nation_b_id: 'nation-2', bill_a_id: 'bill-tn', bill_b_id: 'other-bill', draft_articles: [] },
                error: null,
            },
            'bills.select': { data: { status: 'floor' }, error: null }, // other side not yet
        });
        const entry = await resolveTradeRatificationBill(supabase, tradeNegBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        // No trade_agreements insert — waiting for other side
        assert.equal(callsFor(supabase, 'trade_agreements', 'insert').length, 0);
        // Negotiation NOT concluded
        const negUpds = callsFor(supabase, 'trade_negotiations', 'update');
        assert.ok(!negUpds.some(c => c.chain[0].args[0].status === 'concluded'));
    });

    await test('failed: marks negotiation ratification_failed', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveTradeRatificationBill(supabase, tradeNegBill(), { ...BASE_CTX, passed: false });

        assert.equal(entry.result, 'failed');
        const negUpds = callsFor(supabase, 'trade_negotiations', 'update');
        assert.ok(negUpds.some(c => c.chain[0].args[0].status === 'ratification_failed'));
    });
});

// ─── resolveRetaliatoryTariffRatificationBill ──────────────────────────────
await suite('resolveRetaliatoryTariffRatificationBill', async () => {
    await test('passed: creates trade_agreement + applies relation penalty', async () => {
        const supabase = createSupabaseMock({
            'diplomatic_relations.select': { data: { id: 'rel-1', relation_score: 50 }, error: null },
            'nations.select': { data: { name: 'Nation One' }, error: null },
        });
        const entry = await resolveRetaliatoryTariffRatificationBill(supabase, retaliatoryBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'retaliatory_tariff');

        const taIns = callsFor(supabase, 'trade_agreements', 'insert');
        assert.equal(taIns.length, 1);
        assert.equal(taIns[0].chain[0].args[0].agreement_type, 'retaliatory_tariff');

        // surcharge 30 → penalty 15, 50 - 15 = 35
        const relUpds = callsFor(supabase, 'diplomatic_relations', 'update');
        assert.ok(relUpds.some(c => c.chain[0].args[0].relation_score === 35),
            'expected relation_score=35 (50 - round(30/2))');

        // target nation event
        const evs = callsFor(supabase, 'event_log', 'insert');
        assert.ok(evs.some(c => c.chain[0].args[0].nation_id === 'nation-2'
                              && c.chain[0].args[0].event_name === 'Retaliatory Tariff Enacted'));
    });

    await test('failed: no trade_agreement created', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveRetaliatoryTariffRatificationBill(supabase, retaliatoryBill(), { ...BASE_CTX, passed: false });
        assert.equal(entry.result, 'failed');
        assert.equal(callsFor(supabase, 'trade_agreements', 'insert').length, 0);
    });
});

// ─── resolveEmbargoRatificationBill ─────────────────────────────────────────
await suite('resolveEmbargoRatificationBill', async () => {
    await test('passed: creates embargo trade_agreement + relation penalty scales with sectors', async () => {
        const supabase = createSupabaseMock({
            'diplomatic_relations.select': { data: { id: 'rel-1', relation_score: 50 }, error: null },
            'nations.select': { data: { name: 'Nation One' }, error: null },
        });
        const entry = await resolveEmbargoRatificationBill(supabase, embargoBill(), { ...BASE_CTX });

        assert.equal(entry.result, 'passed');
        assert.equal(entry.type, 'impose_embargo');

        const taIns = callsFor(supabase, 'trade_agreements', 'insert');
        assert.equal(taIns.length, 1);
        assert.equal(taIns[0].chain[0].args[0].agreement_type, 'impose_embargo');

        // 2 sectors → 20 + 2*5 = 30 penalty → 50 - 30 = 20
        const relUpds = callsFor(supabase, 'diplomatic_relations', 'update');
        assert.ok(relUpds.some(c => c.chain[0].args[0].relation_score === 20),
            'expected relation_score=20 (50 - 30)');
    });

    await test('failed: no trade_agreement created', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveEmbargoRatificationBill(supabase, embargoBill(), { ...BASE_CTX, passed: false });
        assert.equal(entry.result, 'failed');
        assert.equal(callsFor(supabase, 'trade_agreements', 'insert').length, 0);
    });

    await test('return shape carries bill_name + votes', async () => {
        const supabase = createSupabaseMock();
        const entry = await resolveEmbargoRatificationBill(supabase, embargoBill(), { ...BASE_CTX, passed: false });
        assert.equal(entry.billId, 'bill-em');
        assert.equal(entry.billName, 'Embargo');
        assert.equal(entry.votesFor, 70);
        assert.equal(entry.votesAgainst, 30);
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
