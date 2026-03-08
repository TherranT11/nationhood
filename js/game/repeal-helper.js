/**
 * repeal-helper.js — shared repeal target resolution + reverse/delete executor
 */

export function resolveRepealTargetLawId({ bill, article } = {}) {
    if (article?.repeal_active_law_id) {
        return article.repeal_active_law_id;
    }

    if (!bill) return null;
    if (bill.repeal_active_law_id) return bill.repeal_active_law_id;

    const fallbackArticle = (bill.bill_articles || []).find(a => a?.repeal_active_law_id);
    return fallbackArticle?.repeal_active_law_id || null;
}

export async function repealActiveLaw({
    supabase,
    nation,
    currentTick,
    currentActiveLaws,
    reversePolicy,
    bill,
    article,
}) {
    const targetLawId = resolveRepealTargetLawId({ bill, article });

    if (!targetLawId) {
        return { success: false, reason: 'missing_target_id', targetLawId: null };
    }

    const targetLaw = (currentActiveLaws || []).find(l => l.id === targetLawId);
    if (!targetLaw) {
        return { success: false, reason: 'target_law_absent', targetLawId };
    }

    if (!targetLaw.policies) {
        return { success: false, reason: 'missing_target_policy', targetLawId };
    }

    // Save policy data before deleting the target law
    const targetPolicy = targetLaw.policies;
    const targetPassedTick = targetLaw.passed_tick;

    // Nullify ALL FK references to this active_law before deleting it.
    // Query for referencing rows first to confirm they exist, then clear them.
    const { data: referencingBills } = await supabase
        .from('bills')
        .select('id')
        .eq('repeal_active_law_id', targetLawId);

    if (referencingBills && referencingBills.length > 0) {
        const billIds = referencingBills.map(b => b.id);
        console.log(`[repealActiveLaw] Clearing ${billIds.length} bill FK refs to active_law ${targetLawId}: ${billIds.join(', ')}`);
        // Clear each referencing bill individually to ensure it takes effect
        for (const refBill of referencingBills) {
            const { error: clearErr } = await supabase
                .from('bills')
                .update({ repeal_active_law_id: null })
                .eq('id', refBill.id);
            if (clearErr) {
                console.error(`[repealActiveLaw] Failed to clear bill ${refBill.id} FK ref: ${clearErr.message}`);
            }
        }
    }

    const { data: referencingArticles } = await supabase
        .from('bill_articles')
        .select('id')
        .eq('repeal_active_law_id', targetLawId);

    if (referencingArticles && referencingArticles.length > 0) {
        const articleIds = referencingArticles.map(a => a.id);
        console.log(`[repealActiveLaw] Clearing ${articleIds.length} article FK refs to active_law ${targetLawId}: ${articleIds.join(', ')}`);
        for (const refArt of referencingArticles) {
            const { error: clearErr } = await supabase
                .from('bill_articles')
                .update({ repeal_active_law_id: null })
                .eq('id', refArt.id);
            if (clearErr) {
                console.error(`[repealActiveLaw] Failed to clear article ${refArt.id} FK ref: ${clearErr.message}`);
            }
        }
    }

    // Verify cleanup worked by checking if any references remain
    const { data: remainingRefs } = await supabase
        .from('bills')
        .select('id, repeal_active_law_id')
        .eq('repeal_active_law_id', targetLawId);
    if (remainingRefs && remainingRefs.length > 0) {
        console.error(`[repealActiveLaw] FK cleanup failed — ${remainingRefs.length} bills still reference active_law ${targetLawId}: ${JSON.stringify(remainingRefs)}`);
        return {
            success: false,
            reason: 'clear_bill_references_failed',
            targetLawId,
            error: `${remainingRefs.length} bills still reference this active_law after cleanup`,
        };
    }

    // Delete target law, then create reversal
    const { error: deleteError } = await supabase
        .from('active_laws')
        .delete()
        .eq('id', targetLawId);

    if (deleteError) {
        return {
            success: false,
            reason: 'delete_failed',
            targetLawId,
            error: deleteError.message,
        };
    }

    // Now create reversal effects (inserts a fresh row since the conflicting row is gone)
    await reversePolicy(supabase, nation, targetPolicy, targetPassedTick, currentTick);

    return {
        success: true,
        reason: 'repealed',
        targetLawId,
        policyName: targetPolicy.policy_name,
    };
}
