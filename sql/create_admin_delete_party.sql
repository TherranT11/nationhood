-- RPC function to delete a single faction/party and all its related data.
-- Runs as SECURITY DEFINER (bypasses RLS).
-- Run this in Supabase SQL editor (safe to re-run).
--
-- IMPORTANT: Run  DROP FUNCTION IF EXISTS admin_delete_party(uuid);  first
-- if the old version exists (return type changed from void to jsonb).

DROP FUNCTION IF EXISTS admin_delete_party(uuid);

CREATE FUNCTION admin_delete_party(p_faction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
    result JSONB := '{}'::JSONB;
    cnt BIGINT;
    v_sql TEXT;
    v_label TEXT;
    v_rec RECORD;
    deletes TEXT[][] := ARRAY[
        -- [label, sql]  —  use %s as placeholder for the faction UUID
        ARRAY['nations.ruling_faction_id',    $$UPDATE nations SET ruling_faction_id = NULL WHERE ruling_faction_id = '%s'$$],
        ARRAY['diplomatic_action_log',        $$DELETE FROM diplomatic_action_log WHERE faction_id = '%s'$$],
        ARRAY['diplomatic_messages',          $$DELETE FROM diplomatic_messages WHERE from_faction_id = '%s'$$],
        ARRAY['diplomatic_proposals',         $$DELETE FROM diplomatic_proposals WHERE proposed_by_faction_id = '%s'$$],
        ARRAY['bills.ambassador_id',          $$UPDATE bills SET ambassador_id = NULL WHERE ambassador_id IN (SELECT id FROM ambassadors WHERE faction_id = '%s')$$],
        ARRAY['ambassadors',                  $$DELETE FROM ambassadors WHERE faction_id = '%s'$$],
        ARRAY['presidents',                   $$DELETE FROM presidents WHERE faction_id = '%s'$$],
        ARRAY['head_of_government',           $$DELETE FROM head_of_government WHERE faction_id = '%s'$$],
        ARRAY['pm_candidates',                $$DELETE FROM pm_candidates WHERE faction_id = '%s'$$],
        ARRAY['ministries.party_id',           $$UPDATE ministries SET party_id = NULL WHERE party_id = '%s'$$],
        ARRAY['ministries.pending_party_id',   $$UPDATE ministries SET pending_party_id = NULL WHERE pending_party_id = '%s'$$],
        ARRAY['ministries',                   $$DELETE FROM ministries WHERE faction_id = '%s'$$],
        ARRAY['ministry_action_log',          $$DELETE FROM ministry_action_log WHERE faction_id = '%s'$$],
        ARRAY['ministry_action_log(target)',   $$DELETE FROM ministry_action_log WHERE target_faction_id = '%s'$$],
        ARRAY['government_formations',         $$DELETE FROM government_formations WHERE proposed_by = '%s'$$],
        ARRAY['government_formation_chat',    $$DELETE FROM government_formation_chat WHERE faction_id = '%s'$$],
        ARRAY['shakeups',                     $$DELETE FROM shakeups WHERE faction_id = '%s'$$],
        ARRAY['bill_support',                 $$DELETE FROM bill_support WHERE faction_id = '%s'$$],
        ARRAY['bills',                        $$DELETE FROM bills WHERE proposed_by = '%s'$$],
        ARRAY['campaign_actions',             $$DELETE FROM campaign_actions WHERE party_id = '%s'$$],
        ARRAY['loyalty_demands',              $$DELETE FROM loyalty_demands WHERE strongman_faction_id = '%s' OR target_faction_id = '%s'$$],
        ARRAY['coalition_messages',           $$DELETE FROM coalition_messages WHERE coalition_id IN (SELECT id FROM faction_coalitions WHERE faction_a_id = '%s' OR faction_b_id = '%s')$$],
        ARRAY['faction_coalitions',           $$DELETE FROM faction_coalitions WHERE faction_a_id = '%s' OR faction_b_id = '%s'$$],
        ARRAY['regime_pillars',               $$UPDATE regime_pillars SET steward_faction_id = NULL WHERE steward_faction_id = '%s'$$],
        ARRAY['active_coalitions',            $$DELETE FROM active_coalitions WHERE lead_party_id = '%s'$$],
        ARRAY['coalition_proposals',          $$DELETE FROM coalition_proposals WHERE faction_id = '%s'$$],
        ARRAY['ideology_history',             $$DELETE FROM ideology_history WHERE faction_id = '%s'$$],
        ARRAY['faction_bloc_approval',        $$DELETE FROM faction_bloc_approval WHERE faction_id = '%s'$$],
        ARRAY['faction_ideology',             $$DELETE FROM faction_ideology WHERE faction_id = '%s'$$],
        ARRAY['admin_chat',                   $$DELETE FROM admin_chat WHERE faction_id = '%s'$$],
        ARRAY['stewards',                     $$DELETE FROM stewards WHERE faction_id = '%s'$$],
        ARRAY['forum_replies',                $$DELETE FROM forum_replies WHERE faction_id = '%s'$$],
        ARRAY['forum_threads',                $$DELETE FROM forum_threads WHERE faction_id = '%s'$$]
    ];
    i INT;
BEGIN
    FOR i IN 1..array_length(deletes, 1)
    LOOP
        v_label := deletes[i][1];
        v_sql := replace(deletes[i][2], '%s', p_faction_id::text);
        BEGIN
            EXECUTE v_sql;
            GET DIAGNOSTICS cnt = ROW_COUNT;
            result := result || jsonb_build_object(v_label, cnt);
        EXCEPTION WHEN OTHERS THEN
            result := result || jsonb_build_object(v_label, 'skipped: ' || SQLERRM);
        END;
    END LOOP;

    -- Finally, delete the faction itself
    DELETE FROM factions WHERE id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    result := result || jsonb_build_object('factions', cnt);

    RETURN result;
END;
$fn$;
