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
        -- ══ Corp system ══
        'corp_contract_bids',
        'corp_contracts',
        'corp_warehouse',
        'corp_equipment_deliveries',
        'corp_equipment',

        -- ══ IPO system ══
        'ipo_ballots',
        'ipo_fund_transactions',
        'ipo_action_log',
        'ipo_chat',
        'ipo_votes',
        'ipo_invitations',
        'ipo_members',
        'international_orgs',

        -- ══ Caucus system ══
        'caucus_dispositions',
        'caucus_factions',

        -- ══ Electorate & standings ══
        'faction_electoral_standing',
        'faction_engagement',
        'faction_bloc_approval',
        'faction_issue_stance',
        'issue_state',
        'electorate_profile',
        'campaign_actions',
        'party_bases',
        'leadership_candidates',
        'credibility_log',
        'momentum_log',
        'party_approval_log',

        -- ══ Ideology ══
        'faction_ideology',
        'ideology_history',
        'ideology_shift_actions',

        -- ══ Bills & legislation ══
        'bill_comments',
        'bill_amendment_requests',
        'bill_support',
        'bills',
        'active_laws',

        -- ══ Government ══
        'head_of_government',
        'pm_candidates',
        'shakeups',
        'presidents',
        'impeachment_proceedings',
        'ministries',
        'ministry_action_log',
        'administrations',
        'government_formations',

        -- ══ Coalitions ══
        'coalition_messages',
        'coalition_proposals',
        'faction_coalitions',
        'loyalty_demands',

        -- ══ Elections & endorsements ══
        'presidential_endorsements',
        'party_endorsement_preferences',
        'election_results',
        'elections',

        -- ══ Budget & funding ══
        'budget_allocations',
        'budget_item_allocations',
        'fundraiser_promises',
        'donor_trust',
        'faction_promises',

        -- ══ Trade & economy ══
        'trade_agreements',
        'trade_negotiations',
        'trade_flows',
        'trade_partners',
        'trade_summary',
        'default_resolutions',
        'default_history',
        'aid_agreement_state',
        'aid_condition_reviews',

        -- ══ Diplomacy ══
        'diplomatic_messages',
        'diplomatic_proposals',
        'diplomatic_action_log',
        'ambassadors',

        -- ══ Events & crises ══
        'active_crises',
        'crisis_effects',
        'protest_endorsements',
        'protest_log',
        'event_log',
        'curriculum_drift',

        -- ══ History & logs ══
        'nations_history',
        'stat_history',
        'gov_approval_log',
        'activity_log',

        -- ══ Content ══
        'op_eds',
        'valdorian_articles',
        'player_articles',
        'wiki_pages',

        -- ══ Forum & chat ══
        'forum_replies',
        'forum_threads',
        'admin_chat',

        -- ══ Misc ══
        'military_doctrines',
        'vln_state',

        -- ══ Messaging ══
        'direct_messages',
        'group_chat_messages',
        'group_chat_members',
        'group_chats'
    ];
BEGIN
    -- First: null out FKs on nations so factions can be deleted
    UPDATE nations SET ruling_faction_id = NULL WHERE ruling_faction_id IS NOT NULL;
    result := result || '{"nations.ruling_faction_id": "nulled"}'::JSONB;

    -- Null out diplomatic_relations FKs
    BEGIN
        DELETE FROM diplomatic_relations WHERE true;
        result := result || '{"diplomatic_relations": "cleared"}'::JSONB;
    EXCEPTION WHEN undefined_table THEN
        result := result || '{"diplomatic_relations": "table missing (skipped)"}'::JSONB;
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
