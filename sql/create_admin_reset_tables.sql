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
        'bill_articles',
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
        'ministry_requests',
        'ministries',
        'ministry_action_log',
        'administrations',
        'government_formation_chat',
        'government_formation_support',
        'government_formations',
        'nation_governments',
        'nation_policies',

        -- ══ Coalitions ══
        'coalition_votes',
        'coalition_messages',
        'coalition_proposals',
        'active_coalitions',
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

        -- ══ Bilateral Issues (children before parents) ══
        'issue_card_plays',
        'bilateral_issue_actions_taken',
        'bilateral_issue_history',
        'bilateral_issue_modifiers',
        'bilateral_issues',
        -- issue_card_definitions excluded — config/template data survives reset

        -- ══ Incidents (children before parents) ══
        'incident_cooldowns',
        'incident_escalation_log',
        'incident_chat_messages',
        'incident_mediation',
        'incident_actions_taken',
        'incident_actions_available',
        'incident_events',
        'incidents',
        -- incident_event_pool excluded — config/template data survives reset

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
        -- 'wiki_pages' intentionally excluded — wiki survives reset
        'nation_profiles',

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
        'group_chats',

        -- ══ Radio broadcast system ══
        'broadcast_good_listens',
        'radio_broadcasts',
        'radio_personalities',
        'radio_stations',

        -- ══ Article likes ══
        'article_likes',

        -- ══ Party platforms ══
        'faction_platforms',

        -- ══ Agitator & lawsuits ══
        'lawsuit_events',
        'lawsuits',
        'faction_agitators',
        'agitator_pool',

        -- ══ Subsidiary services ══
        'subsidiary_auto_policies',
        'subsidiary_auto_rates',
        'subsidiary_bids',
        'subsidiary_sales',

        -- ══ Insurance (must come before corp_vessels and finance_active_loans) ══
        'insurance_claims',

        -- ══ Shipping (children before parents — claims/apps before routes) ══
        'shipping_claims',
        'shipping_applications',
        'ship_market_listings',
        'vessel_orders',
        'shipping_routes',

        -- ══ Construction (children before parents — deliveries/events before contracts) ══
        'construction_deliveries',
        'construction_events',
        'project_material_allocations',
        'mega_project_cooldowns',
        'available_properties',
        'corp_permits',

        -- ══ Corp properties & executives ══
        'corp_properties',
        'corp_executives',
        'executive_pool',
        'corp_material_inventory',

        -- ══ Corp vessels (after insurance_claims and shipping_claims) ══
        'corp_vessels',

        -- ══ Finance system (after insurance_claims) ══
        'finance_active_loans',
        'finance_loan_offers',
        'finance_loan_requests',

        -- ══ Construction contracts (after deliveries, events, material_allocations) ══
        'contract_bids',
        'construction_contracts',

        -- ══ Electorate (extended) ══
        'voter_bloc_demands',
        'pander_history',

        -- ══ AP tracking ══
        'ap_ledger',

        -- ══ Food system ══
        'food_stockpiles',
        'food_land_allocation',

        -- ══ Party (extended) ══
        'faction_deputies',
        'faction_pillar_state',

        -- ══ Government (extended) ══
        'executive_orders',
        'admin_timeline_events',

        -- ══ Misc (extended) ══
        'pending_actions'
    ];
BEGIN
    -- First: null out FKs on nations and construction_contracts so dependent tables can be deleted
    UPDATE nations SET ruling_faction_id = NULL WHERE ruling_faction_id IS NOT NULL;
    UPDATE nations SET monarch_faction_id = NULL WHERE monarch_faction_id IS NOT NULL;
    BEGIN
        UPDATE construction_contracts SET bond_id = NULL WHERE bond_id IS NOT NULL;
    EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
    END;
    result := result || '{"nations.ruling_faction_id": "nulled", "nations.monarch_faction_id": "nulled", "construction_contracts.bond_id": "nulled"}'::JSONB;

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
