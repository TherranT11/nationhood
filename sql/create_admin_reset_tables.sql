-- RPC function to clear all game-state tables during shard reset.
-- Runs as SECURITY DEFINER (bypasses RLS), same pattern as admin_delete_party.
-- Run this in Supabase SQL editor (safe to re-run — uses CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION admin_reset_tables()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '{}'::JSONB;
    tbl TEXT;
    cnt BIGINT;
    tables TEXT[] := ARRAY[
        -- Tables that reference factions (must clear before factions)
        'campaign_actions',
        'bill_support',
        'faction_bloc_approval',
        'faction_ideology',
        'ministry_action_log',
        'government_formation_chat',
        -- Government tables (children before parents)
        'head_of_government',
        'pm_candidates',
        'shakeups',
        'presidents',
        'ministries',
        'administrations',
        'active_coalitions',
        'government_formations',
        -- Legislative (coalition_proposals references elections)
        'coalition_proposals',
        'bills',
        'active_laws',
        'elections',
        -- Events & crises
        'active_crises',
        'event_log',
        -- History
        'nations_history',
        'ideology_history',
        -- Diplomacy
        'diplomatic_messages',
        'diplomatic_proposals',
        'diplomatic_action_log',
        'ambassadors'
    ];
BEGIN
    -- First: null out nations.ruling_faction_id so factions can be deleted
    UPDATE nations SET ruling_faction_id = NULL WHERE ruling_faction_id IS NOT NULL;
    result := result || '{"nations.ruling_faction_id": "nulled"}'::JSONB;

    -- Clear each game-state table
    FOREACH tbl IN ARRAY tables
    LOOP
        BEGIN
            EXECUTE format('DELETE FROM %I WHERE true', tbl);
            GET DIAGNOSTICS cnt = ROW_COUNT;
            result := result || jsonb_build_object(tbl, cnt);
        EXCEPTION WHEN undefined_table THEN
            result := result || jsonb_build_object(tbl, 'table does not exist (skipped)');
        WHEN OTHERS THEN
            result := result || jsonb_build_object(tbl, SQLERRM);
        END;
    END LOOP;
    RETURN result;
END;
$$;
