-- RPC function to clear all game-state tables during shard reset.
-- Runs as SECURITY DEFINER (bypasses RLS), same pattern as admin_delete_party.
-- Run this once in Supabase SQL editor to create the function.

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
        'campaign_actions',
        'bill_support',
        'faction_bloc_approval',
        'faction_ideology',
        'head_of_government',
        'pm_candidates',
        'shakeups',
        'presidents',
        'ministries',
        'administrations',
        'active_coalitions',
        'government_formations',
        'bills',
        'active_laws',
        'elections',
        'ministry_events',
        'active_crises',
        'event_log',
        'nations_history',
        'ideology_history',
        'diplomatic_messages',
        'diplomatic_proposals',
        'diplomatic_action_log',
        'ambassadors'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        BEGIN
            EXECUTE format('DELETE FROM %I', tbl);
            GET DIAGNOSTICS cnt = ROW_COUNT;
            result := result || jsonb_build_object(tbl, cnt);
        EXCEPTION WHEN OTHERS THEN
            result := result || jsonb_build_object(tbl, SQLERRM);
        END;
    END LOOP;
    RETURN result;
END;
$$;
