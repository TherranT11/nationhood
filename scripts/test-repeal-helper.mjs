import assert from 'node:assert/strict';
import { repealActiveLaw, resolveRepealTargetLawId } from '../js/game/repeal-helper.js';

function createSupabase({ deleteError = null, billRefError = null, articleRefError = null } = {}) {
    const deletedIds = [];
    const clearedBillRefs = [];
    const clearedArticleRefs = [];

    return {
        deletedIds,
        clearedBillRefs,
        clearedArticleRefs,
        from(table) {
            if (table === 'bills') {
                return {
                    update(payload) {
                        assert.deepEqual(payload, { repeal_active_law_id: null });
                        return {
                            async eq(column, id) {
                                assert.equal(column, 'repeal_active_law_id');
                                clearedBillRefs.push(id);
                                return { error: billRefError ? { message: billRefError } : null };
                            }
                        };
                    }
                };
            }

            if (table === 'bill_articles') {
                return {
                    update(payload) {
                        assert.deepEqual(payload, { repeal_active_law_id: null });
                        return {
                            async eq(column, id) {
                                assert.equal(column, 'repeal_active_law_id');
                                clearedArticleRefs.push(id);
                                return { error: articleRefError ? { message: articleRefError } : null };
                            }
                        };
                    }
                };
            }

            assert.equal(table, 'active_laws');
            return {
                delete() {
                    return {
                        async eq(column, id) {
                            assert.equal(column, 'id');
                            deletedIds.push(id);
                            return { error: deleteError ? { message: deleteError } : null };
                        }
                    };
                }
            };
        }
    };
}

async function run() {
    const nation = { id: 'nation-1' };
    let reversals = [];
    const reversePolicy = async (_supabase, _nation, policy) => {
        reversals.push(policy.id);
    };

    // 1) repeal with bill-level target ID
    {
        const supabase = createSupabase();
        reversals = [];
        const result = await repealActiveLaw({
            supabase,
            nation,
            currentTick: 10,
            currentActiveLaws: [{ id: 'law-bill-level', policies: { id: 'policy-1', policy_name: 'Policy 1' }, passed_tick: 1 }],
            reversePolicy,
            bill: { repeal_active_law_id: 'law-bill-level', bill_articles: [] },
        });
        assert.deepEqual(result, { success: true, reason: 'repealed', targetLawId: 'law-bill-level', policyName: 'Policy 1' });
        assert.deepEqual(supabase.clearedBillRefs, ['law-bill-level']);
        assert.deepEqual(supabase.clearedArticleRefs, ['law-bill-level']);
        assert.deepEqual(supabase.deletedIds, ['law-bill-level']);
        assert.deepEqual(reversals, ['policy-1']);
    }

    // 2) repeal with article-level fallback ID
    {
        const supabase = createSupabase();
        reversals = [];
        const bill = {
            repeal_active_law_id: null,
            bill_articles: [{ repeal_active_law_id: 'law-article-fallback' }],
        };
        assert.equal(resolveRepealTargetLawId({ bill }), 'law-article-fallback');
        const result = await repealActiveLaw({
            supabase,
            nation,
            currentTick: 10,
            currentActiveLaws: [{ id: 'law-article-fallback', policies: { id: 'policy-2', policy_name: 'Policy 2' }, passed_tick: 2 }],
            reversePolicy,
            bill,
        });
        assert.equal(result.success, true);
        assert.equal(result.targetLawId, 'law-article-fallback');
    }

    // 3) missing target ID
    {
        const supabase = createSupabase();
        const result = await repealActiveLaw({
            supabase,
            nation,
            currentTick: 10,
            currentActiveLaws: [],
            reversePolicy,
            bill: { repeal_active_law_id: null, bill_articles: [] },
        });
        assert.deepEqual(result, { success: false, reason: 'missing_target_id', targetLawId: null });
        assert.deepEqual(supabase.clearedBillRefs, []);
        assert.deepEqual(supabase.clearedArticleRefs, []);
        assert.deepEqual(supabase.deletedIds, []);
    }

    // 4) target law already absent
    {
        const supabase = createSupabase();
        const result = await repealActiveLaw({
            supabase,
            nation,
            currentTick: 10,
            currentActiveLaws: [{ id: 'different-law', policies: { id: 'policy-3', policy_name: 'Policy 3' }, passed_tick: 3 }],
            reversePolicy,
            bill: { repeal_active_law_id: 'law-absent', bill_articles: [] },
        });
        assert.deepEqual(result, { success: false, reason: 'target_law_absent', targetLawId: 'law-absent' });
        assert.deepEqual(supabase.clearedBillRefs, []);
        assert.deepEqual(supabase.clearedArticleRefs, []);
        assert.deepEqual(supabase.deletedIds, []);
    }


    // 5) bill reference clear failure short-circuits delete
    {
        const supabase = createSupabase({ billRefError: 'permission denied' });
        const result = await repealActiveLaw({
            supabase,
            nation,
            currentTick: 10,
            currentActiveLaws: [{ id: 'law-ref-fail', policies: { id: 'policy-5', policy_name: 'Policy 5' }, passed_tick: 1 }],
            reversePolicy,
            bill: { repeal_active_law_id: 'law-ref-fail', bill_articles: [] },
        });
        assert.equal(result.success, false);
        assert.equal(result.reason, 'clear_bill_references_failed');
        assert.deepEqual(supabase.deletedIds, []);
    }

    // 6) article reference clear failure short-circuits delete
    {
        const supabase = createSupabase({ articleRefError: 'permission denied' });
        const result = await repealActiveLaw({
            supabase,
            nation,
            currentTick: 10,
            currentActiveLaws: [{ id: 'law-article-ref-fail', policies: { id: 'policy-6', policy_name: 'Policy 6' }, passed_tick: 1 }],
            reversePolicy,
            bill: { repeal_active_law_id: 'law-article-ref-fail', bill_articles: [] },
        });
        assert.equal(result.success, false);
        assert.equal(result.reason, 'clear_article_references_failed');
        assert.deepEqual(supabase.deletedIds, []);
    }

    console.log('repeal-helper fixtures passed');
}

run();
