-- RPC function to delete a single faction/party and all its related data.
-- Runs as SECURITY DEFINER (bypasses RLS).
-- Run this in Supabase SQL editor (safe to re-run — uses CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION admin_delete_party(p_faction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '{}'::JSONB;
    cnt BIGINT;
BEGIN
    -- Null out nations.ruling_faction_id if this faction is the ruler
    UPDATE nations SET ruling_faction_id = NULL WHERE ruling_faction_id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN
        result := result || '{"nations.ruling_faction_id": "nulled"}'::JSONB;
    END IF;

    -- Tables with explicit REFERENCES factions(id) but NO ON DELETE CASCADE
    -- (must delete manually before deleting the faction row)

    -- Diplomacy tables
    BEGIN
        DELETE FROM diplomatic_action_log WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('diplomatic_action_log', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"diplomatic_action_log": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM diplomatic_messages WHERE from_faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('diplomatic_messages', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"diplomatic_messages": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM diplomatic_proposals WHERE proposed_by_faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('diplomatic_proposals', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"diplomatic_proposals": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM ambassadors WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('ambassadors', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"ambassadors": "skipped"}'::JSONB;
    END;

    -- Presidential
    BEGIN
        DELETE FROM presidents WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('presidents', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"presidents": "skipped"}'::JSONB;
    END;

    -- Government tables
    BEGIN
        DELETE FROM head_of_government WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('head_of_government', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"head_of_government": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM pm_candidates WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('pm_candidates', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"pm_candidates": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM ministries WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('ministries', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"ministries": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM ministry_action_log WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('ministry_action_log', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"ministry_action_log": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM government_formation_chat WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('government_formation_chat', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"government_formation_chat": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM shakeups WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('shakeups', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"shakeups": "skipped"}'::JSONB;
    END;

    -- Legislative
    BEGIN
        DELETE FROM bill_support WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('bill_support', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"bill_support": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM bills WHERE proposed_by = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('bills', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"bills": "skipped"}'::JSONB;
    END;

    -- Campaign
    BEGIN
        DELETE FROM campaign_actions WHERE party_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('campaign_actions', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"campaign_actions": "skipped"}'::JSONB;
    END;

    -- Loyalty demands (autocracy)
    BEGIN
        DELETE FROM loyalty_demands WHERE strongman_faction_id = p_faction_id OR target_faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('loyalty_demands', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"loyalty_demands": "skipped"}'::JSONB;
    END;

    -- Faction coalitions — delete coalition_messages first (FK to faction_coalitions)
    BEGIN
        DELETE FROM coalition_messages WHERE coalition_id IN (
            SELECT id FROM faction_coalitions
            WHERE faction_a_id = p_faction_id OR faction_b_id = p_faction_id
        );
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('coalition_messages', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"coalition_messages": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM faction_coalitions
        WHERE faction_a_id = p_faction_id OR faction_b_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('faction_coalitions', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"faction_coalitions": "skipped"}'::JSONB;
    END;

    -- Regime pillars (SET NULL handled by FK, but clear explicitly to be safe)
    BEGIN
        UPDATE regime_pillars SET steward_faction_id = NULL WHERE steward_faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        IF cnt > 0 THEN
            result := result || jsonb_build_object('regime_pillars', cnt || ' nulled');
        END IF;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"regime_pillars": "skipped"}'::JSONB;
    END;

    -- Legacy tables (may or may not exist in this shard)
    BEGIN
        DELETE FROM active_coalitions WHERE party_ids ? p_faction_id::text;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('active_coalitions', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column OR OTHERS THEN
        result := result || '{"active_coalitions": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM coalition_proposals WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('coalition_proposals', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column OR OTHERS THEN
        result := result || '{"coalition_proposals": "skipped"}'::JSONB;
    END;

    -- Tables with ON DELETE CASCADE will auto-clean, but delete explicitly for safety:
    -- ideology_history, faction_bloc_approval, admin_chat, stewards,
    -- forum_threads, forum_replies

    BEGIN
        DELETE FROM ideology_history WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('ideology_history', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"ideology_history": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM faction_bloc_approval WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('faction_bloc_approval', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"faction_bloc_approval": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM faction_ideology WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('faction_ideology', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"faction_ideology": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM admin_chat WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('admin_chat', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"admin_chat": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM stewards WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('stewards', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"stewards": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM forum_replies WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('forum_replies', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"forum_replies": "skipped"}'::JSONB;
    END;

    BEGIN
        DELETE FROM forum_threads WHERE faction_id = p_faction_id;
        GET DIAGNOSTICS cnt = ROW_COUNT;
        result := result || jsonb_build_object('forum_threads', cnt);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || '{"forum_threads": "skipped"}'::JSONB;
    END;

    -- Finally, delete the faction itself
    DELETE FROM factions WHERE id = p_faction_id;
    GET DIAGNOSTICS cnt = ROW_COUNT;
    result := result || jsonb_build_object('factions', cnt);

    RETURN result;
END;
$$;
