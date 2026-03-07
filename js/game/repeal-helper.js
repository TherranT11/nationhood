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

    await reversePolicy(supabase, nation, targetLaw.policies, targetLaw.passed_tick, currentTick);

    // Nullify any FK references to this active_law before deleting it.
    // This avoids bills_repeal_active_law_id_fkey failures when old repeal bills still point at this law.
    const { error: billRefError } = await supabase
        .from('bills')
        .update({ repeal_active_law_id: null })
        .eq('repeal_active_law_id', targetLawId);
    if (billRefError) {
        return {
            success: false,
            reason: 'clear_bill_references_failed',
            targetLawId,
            error: billRefError.message,
        };
    }

    const { error: articleRefError } = await supabase
        .from('bill_articles')
        .update({ repeal_active_law_id: null })
        .eq('repeal_active_law_id', targetLawId);
    if (articleRefError) {
        return {
            success: false,
            reason: 'clear_article_references_failed',
            targetLawId,
            error: articleRefError.message,
        };
    }

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

    return {
        success: true,
        reason: 'repealed',
        targetLawId,
        policyName: targetLaw.policies.policy_name,
    };
}
