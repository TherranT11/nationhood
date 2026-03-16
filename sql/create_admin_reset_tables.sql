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
        -- Caucus system (references factions + bills)
        'caucus_dispositions',
        'caucus_factions',
        -- Tables that reference factions (must clear before factions)
        'bill_comments',
        'bill_amendment_requests',
        'campaign_actions',
        'bill_support',
        'faction_bloc_approval',
        'faction_ideology',
        'ministry_action_log',
        'government_formation_chat',
        -- Faction coalitions (children before parents)
        'coalition_messages',
        'faction_coalitions',
        'loyalty_demands',
        -- Autocracy
        'stewards',
        'executive_orders',
        -- Government tables (children before parents)
        'head_of_government',
        'pm_candidates',
        'shakeups',
        'presidents',
        'impeachment_proceedings',
        'ministries',
        'administrations',
        'active_coalitions',
        'government_formations',
        -- Legislative (coalition_proposals references elections)
        'coalition_proposals',
        'presidential_endorsements',
        'party_endorsement_preferences',
        'bills',
        'active_laws',
        'elections',
        -- Budget & funding
        'budget_allocations',
        'budget_item_allocations',
        'fundraiser_promises',
        'donor_trust',
        -- Trade & economy
        'trade_agreements',
        'trade_negotiations',
        'trade_flows',
        'trade_partners',
        'trade_summary',
        'default_resolutions',
        'default_history',
        'aid_agreement_state',
        'aid_condition_reviews',
        -- Events & crises
        'active_crises',
        'event_log',
        -- History & logs
        'nations_history',
        'ideology_history',
        'momentum_log',
        'gov_approval_log',
        'stat_history',
        -- Content
        'op_eds',
        'valdorian_articles',
        'player_articles',
        'nation_profiles',
        'wiki_pages',
        -- Diplomacy
        'diplomatic_messages',
        'diplomatic_proposals',
        'diplomatic_action_log',
        'ambassadors',
        -- Forum & chat
        'forum_replies',
        'forum_threads',
        'admin_chat'
    ];
BEGIN
    -- First: null out FKs to factions so factions can be deleted
    UPDATE nations SET ruling_faction_id = NULL WHERE ruling_faction_id IS NOT NULL;
    result := result || '{"nations.ruling_faction_id": "nulled"}'::JSONB;

    BEGIN
        UPDATE regime_pillars SET steward_faction_id = NULL WHERE steward_faction_id IS NOT NULL;
        result := result || '{"regime_pillars.steward_faction_id": "nulled"}'::JSONB;
    EXCEPTION WHEN undefined_table THEN
        result := result || '{"regime_pillars.steward_faction_id": "table missing (skipped)"}'::JSONB;
    END;

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
