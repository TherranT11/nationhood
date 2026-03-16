-- ============================================================
-- Work Environment: ALL Foreign Key Constraints
-- Generated from all SQL files in sql/ and sql/migrations/
-- Idempotent: uses DO $$ blocks to skip existing constraints
-- ============================================================

-- Helper: adds a FK constraint only if it does not already exist.
-- Each block checks pg_constraint before adding.

-- ============================================================
-- 1. ACTIVE CRISES / CRISIS SYSTEM
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_active_crises_crisis_id') THEN
    ALTER TABLE active_crises ADD CONSTRAINT fk_active_crises_crisis_id
      FOREIGN KEY (crisis_id) REFERENCES crisis_templates(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crisis_effects_crisis_id') THEN
    ALTER TABLE crisis_effects ADD CONSTRAINT fk_crisis_effects_crisis_id
      FOREIGN KEY (crisis_id) REFERENCES crisis_templates(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crisis_end_triggers_crisis_id') THEN
    ALTER TABLE crisis_end_triggers ADD CONSTRAINT fk_crisis_end_triggers_crisis_id
      FOREIGN KEY (crisis_id) REFERENCES crisis_templates(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crisis_triggers_crisis_id') THEN
    ALTER TABLE crisis_triggers ADD CONSTRAINT fk_crisis_triggers_crisis_id
      FOREIGN KEY (crisis_id) REFERENCES crisis_templates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 2. ADMINISTRATIONS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_administrations_nation_id') THEN
    ALTER TABLE administrations ADD CONSTRAINT fk_administrations_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id);
  END IF;
END $$;

-- ============================================================
-- 3. ADMIN CHAT
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_chat_nation_id') THEN
    ALTER TABLE admin_chat ADD CONSTRAINT fk_admin_chat_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_chat_faction_id') THEN
    ALTER TABLE admin_chat ADD CONSTRAINT fk_admin_chat_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 4. AID / ECONOMIC AID
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_aid_agreement_state_agreement_id') THEN
    ALTER TABLE aid_agreement_state ADD CONSTRAINT fk_aid_agreement_state_agreement_id
      FOREIGN KEY (agreement_id) REFERENCES trade_agreements(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_aid_agreement_state_donor_nation_id') THEN
    ALTER TABLE aid_agreement_state ADD CONSTRAINT fk_aid_agreement_state_donor_nation_id
      FOREIGN KEY (donor_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_aid_agreement_state_recipient_nation_id') THEN
    ALTER TABLE aid_agreement_state ADD CONSTRAINT fk_aid_agreement_state_recipient_nation_id
      FOREIGN KEY (recipient_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_aid_condition_reviews_agreement_id') THEN
    ALTER TABLE aid_condition_reviews ADD CONSTRAINT fk_aid_condition_reviews_agreement_id
      FOREIGN KEY (agreement_id) REFERENCES trade_agreements(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 5. AMBASSADORS / DIPLOMACY
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ambassadors_nation_id') THEN
    ALTER TABLE ambassadors ADD CONSTRAINT fk_ambassadors_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ambassadors_target_nation_id') THEN
    ALTER TABLE ambassadors ADD CONSTRAINT fk_ambassadors_target_nation_id
      FOREIGN KEY (target_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ambassadors_faction_id') THEN
    ALTER TABLE ambassadors ADD CONSTRAINT fk_ambassadors_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_messages_from_nation_id') THEN
    ALTER TABLE diplomatic_messages ADD CONSTRAINT fk_diplomatic_messages_from_nation_id
      FOREIGN KEY (from_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_messages_to_nation_id') THEN
    ALTER TABLE diplomatic_messages ADD CONSTRAINT fk_diplomatic_messages_to_nation_id
      FOREIGN KEY (to_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_messages_from_faction_id') THEN
    ALTER TABLE diplomatic_messages ADD CONSTRAINT fk_diplomatic_messages_from_faction_id
      FOREIGN KEY (from_faction_id) REFERENCES factions(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_proposals_proposing_nation_id') THEN
    ALTER TABLE diplomatic_proposals ADD CONSTRAINT fk_diplomatic_proposals_proposing_nation_id
      FOREIGN KEY (proposing_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_proposals_target_nation_id') THEN
    ALTER TABLE diplomatic_proposals ADD CONSTRAINT fk_diplomatic_proposals_target_nation_id
      FOREIGN KEY (target_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_proposals_proposed_by_faction_id') THEN
    ALTER TABLE diplomatic_proposals ADD CONSTRAINT fk_diplomatic_proposals_proposed_by_faction_id
      FOREIGN KEY (proposed_by_faction_id) REFERENCES factions(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_relations_nation_a_id') THEN
    ALTER TABLE diplomatic_relations ADD CONSTRAINT fk_diplomatic_relations_nation_a_id
      FOREIGN KEY (nation_a_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_relations_nation_b_id') THEN
    ALTER TABLE diplomatic_relations ADD CONSTRAINT fk_diplomatic_relations_nation_b_id
      FOREIGN KEY (nation_b_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_action_log_nation_id') THEN
    ALTER TABLE diplomatic_action_log ADD CONSTRAINT fk_diplomatic_action_log_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_action_log_target_nation_id') THEN
    ALTER TABLE diplomatic_action_log ADD CONSTRAINT fk_diplomatic_action_log_target_nation_id
      FOREIGN KEY (target_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_diplomatic_action_log_faction_id') THEN
    ALTER TABLE diplomatic_action_log ADD CONSTRAINT fk_diplomatic_action_log_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id);
  END IF;
END $$;

-- ============================================================
-- 6. BILLS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bills_diplomatic_proposal_id') THEN
    ALTER TABLE bills ADD CONSTRAINT fk_bills_diplomatic_proposal_id
      FOREIGN KEY (diplomatic_proposal_id) REFERENCES diplomatic_proposals(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bills_ambassador_id') THEN
    ALTER TABLE bills ADD CONSTRAINT fk_bills_ambassador_id
      FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bills_trade_negotiation_id') THEN
    ALTER TABLE bills ADD CONSTRAINT fk_bills_trade_negotiation_id
      FOREIGN KEY (trade_negotiation_id) REFERENCES trade_negotiations(id);
  END IF;
END $$;

-- ============================================================
-- 7. BILL AMENDMENT REQUESTS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bill_amendment_requests_target_article_id') THEN
    ALTER TABLE bill_amendment_requests ADD CONSTRAINT fk_bill_amendment_requests_target_article_id
      FOREIGN KEY (target_article_id) REFERENCES bill_articles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 8. BILL COMMENTS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bill_comments_faction_id') THEN
    ALTER TABLE bill_comments ADD CONSTRAINT fk_bill_comments_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 9. BUDGET ALLOCATIONS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_budget_allocations_bill_id') THEN
    ALTER TABLE budget_allocations ADD CONSTRAINT fk_budget_allocations_bill_id
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_budget_allocations_nation_id') THEN
    ALTER TABLE budget_allocations ADD CONSTRAINT fk_budget_allocations_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 10. BUDGET ITEM ALLOCATIONS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_budget_item_allocations_bill_id') THEN
    ALTER TABLE budget_item_allocations ADD CONSTRAINT fk_budget_item_allocations_bill_id
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_budget_item_allocations_nation_id') THEN
    ALTER TABLE budget_item_allocations ADD CONSTRAINT fk_budget_item_allocations_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 11. CAUCUS SYSTEM
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_caucus_factions_party_id') THEN
    ALTER TABLE caucus_factions ADD CONSTRAINT fk_caucus_factions_party_id
      FOREIGN KEY (party_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_caucus_factions_nation_id') THEN
    ALTER TABLE caucus_factions ADD CONSTRAINT fk_caucus_factions_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_caucus_dispositions_caucus_faction_id') THEN
    ALTER TABLE caucus_dispositions ADD CONSTRAINT fk_caucus_dispositions_caucus_faction_id
      FOREIGN KEY (caucus_faction_id) REFERENCES caucus_factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_caucus_dispositions_bill_id') THEN
    ALTER TABLE caucus_dispositions ADD CONSTRAINT fk_caucus_dispositions_bill_id
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 12. FACTION COALITIONS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_faction_coalitions_nation_id') THEN
    ALTER TABLE faction_coalitions ADD CONSTRAINT fk_faction_coalitions_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_faction_coalitions_faction_a_id') THEN
    ALTER TABLE faction_coalitions ADD CONSTRAINT fk_faction_coalitions_faction_a_id
      FOREIGN KEY (faction_a_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_faction_coalitions_faction_b_id') THEN
    ALTER TABLE faction_coalitions ADD CONSTRAINT fk_faction_coalitions_faction_b_id
      FOREIGN KEY (faction_b_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_faction_coalitions_proposed_by_faction_id') THEN
    ALTER TABLE faction_coalitions ADD CONSTRAINT fk_faction_coalitions_proposed_by_faction_id
      FOREIGN KEY (proposed_by_faction_id) REFERENCES factions(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_coalition_messages_coalition_id') THEN
    ALTER TABLE coalition_messages ADD CONSTRAINT fk_coalition_messages_coalition_id
      FOREIGN KEY (coalition_id) REFERENCES faction_coalitions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_coalition_messages_faction_id') THEN
    ALTER TABLE coalition_messages ADD CONSTRAINT fk_coalition_messages_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 13. DEFAULT / SOVEREIGN DEFAULT
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_default_resolutions_nation_id') THEN
    ALTER TABLE default_resolutions ADD CONSTRAINT fk_default_resolutions_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_default_resolutions_proposed_by_faction_id') THEN
    ALTER TABLE default_resolutions ADD CONSTRAINT fk_default_resolutions_proposed_by_faction_id
      FOREIGN KEY (proposed_by_faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_default_resolutions_proposed_by_player_id') THEN
    ALTER TABLE default_resolutions ADD CONSTRAINT fk_default_resolutions_proposed_by_player_id
      FOREIGN KEY (proposed_by_player_id) REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_default_resolutions_bill_id') THEN
    ALTER TABLE default_resolutions ADD CONSTRAINT fk_default_resolutions_bill_id
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_default_history_nation_id') THEN
    ALTER TABLE default_history ADD CONSTRAINT fk_default_history_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_default_history_default_resolution_id') THEN
    ALTER TABLE default_history ADD CONSTRAINT fk_default_history_default_resolution_id
      FOREIGN KEY (default_resolution_id) REFERENCES default_resolutions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 14. EXECUTIVE ORDERS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_executive_orders_nation_id') THEN
    ALTER TABLE executive_orders ADD CONSTRAINT fk_executive_orders_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_executive_orders_faction_id') THEN
    ALTER TABLE executive_orders ADD CONSTRAINT fk_executive_orders_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 15. FACTION BLOC APPROVAL
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_faction_bloc_approval_faction_id') THEN
    ALTER TABLE faction_bloc_approval ADD CONSTRAINT fk_faction_bloc_approval_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_faction_bloc_approval_bloc_id') THEN
    ALTER TABLE faction_bloc_approval ADD CONSTRAINT fk_faction_bloc_approval_bloc_id
      FOREIGN KEY (bloc_id) REFERENCES voter_blocs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 16. FORUM TABLES
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_forum_subcategories_category_id') THEN
    ALTER TABLE forum_subcategories ADD CONSTRAINT fk_forum_subcategories_category_id
      FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_forum_subcategories_nation_id') THEN
    ALTER TABLE forum_subcategories ADD CONSTRAINT fk_forum_subcategories_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_forum_threads_subcategory_id') THEN
    ALTER TABLE forum_threads ADD CONSTRAINT fk_forum_threads_subcategory_id
      FOREIGN KEY (subcategory_id) REFERENCES forum_subcategories(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_forum_threads_faction_id') THEN
    ALTER TABLE forum_threads ADD CONSTRAINT fk_forum_threads_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_forum_replies_thread_id') THEN
    ALTER TABLE forum_replies ADD CONSTRAINT fk_forum_replies_thread_id
      FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_forum_replies_faction_id') THEN
    ALTER TABLE forum_replies ADD CONSTRAINT fk_forum_replies_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 17. IDEOLOGY HISTORY
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ideology_history_faction_id') THEN
    ALTER TABLE ideology_history ADD CONSTRAINT fk_ideology_history_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ideology_history_nation_id') THEN
    ALTER TABLE ideology_history ADD CONSTRAINT fk_ideology_history_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 18. IMPEACHMENT PROCEEDINGS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_impeachment_proceedings_nation_id') THEN
    ALTER TABLE impeachment_proceedings ADD CONSTRAINT fk_impeachment_proceedings_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_impeachment_proceedings_initiated_by_faction_id') THEN
    ALTER TABLE impeachment_proceedings ADD CONSTRAINT fk_impeachment_proceedings_initiated_by_faction_id
      FOREIGN KEY (initiated_by_faction_id) REFERENCES factions(id);
  END IF;
END $$;

-- ============================================================
-- 19. LEADERSHIP CANDIDATES
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_leadership_candidates_faction_id') THEN
    ALTER TABLE leadership_candidates ADD CONSTRAINT fk_leadership_candidates_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 20. LOYALTY DEMANDS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_loyalty_demands_nation_id') THEN
    ALTER TABLE loyalty_demands ADD CONSTRAINT fk_loyalty_demands_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 21. MINISTRIES
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ministries_acting_order_id') THEN
    ALTER TABLE ministries ADD CONSTRAINT fk_ministries_acting_order_id
      FOREIGN KEY (acting_order_id) REFERENCES executive_orders(id);
  END IF;
END $$;

-- ============================================================
-- 22. NATION PROFILES
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nation_profiles_nation_id') THEN
    ALTER TABLE nation_profiles ADD CONSTRAINT fk_nation_profiles_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nation_profiles_updated_by') THEN
    ALTER TABLE nation_profiles ADD CONSTRAINT fk_nation_profiles_updated_by
      FOREIGN KEY (updated_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- ============================================================
-- 23. OP-EDS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_op_eds_nation_id') THEN
    ALTER TABLE op_eds ADD CONSTRAINT fk_op_eds_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_op_eds_faction_id') THEN
    ALTER TABLE op_eds ADD CONSTRAINT fk_op_eds_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_op_eds_author_faction_id') THEN
    ALTER TABLE op_eds ADD CONSTRAINT fk_op_eds_author_faction_id
      FOREIGN KEY (author_faction_id) REFERENCES factions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 24. PARTY ENDORSEMENT PREFERENCES
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_party_endorsement_preferences_nation_id') THEN
    ALTER TABLE party_endorsement_preferences ADD CONSTRAINT fk_party_endorsement_preferences_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_party_endorsement_preferences_endorsing_party_id') THEN
    ALTER TABLE party_endorsement_preferences ADD CONSTRAINT fk_party_endorsement_preferences_endorsing_party_id
      FOREIGN KEY (endorsing_party_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_party_endorsement_preferences_endorsed_party_id') THEN
    ALTER TABLE party_endorsement_preferences ADD CONSTRAINT fk_party_endorsement_preferences_endorsed_party_id
      FOREIGN KEY (endorsed_party_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_party_endorsement_preferences_target_election_id') THEN
    ALTER TABLE party_endorsement_preferences ADD CONSTRAINT fk_party_endorsement_preferences_target_election_id
      FOREIGN KEY (target_election_id) REFERENCES elections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 25. PLAYER ARTICLES
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_player_articles_nation_id') THEN
    ALTER TABLE player_articles ADD CONSTRAINT fk_player_articles_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_player_articles_author_faction_id') THEN
    ALTER TABLE player_articles ADD CONSTRAINT fk_player_articles_author_faction_id
      FOREIGN KEY (author_faction_id) REFERENCES factions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 26. PLAYER INTEGRITY (auth.users references)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_player_bans_user_id') THEN
    ALTER TABLE player_bans ADD CONSTRAINT fk_player_bans_user_id
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_player_fingerprints_user_id') THEN
    ALTER TABLE player_fingerprints ADD CONSTRAINT fk_player_fingerprints_user_id
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 27. PRESIDENTIAL ENDORSEMENTS (snapshots)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_presidential_endorsements_election_id') THEN
    ALTER TABLE presidential_endorsements ADD CONSTRAINT fk_presidential_endorsements_election_id
      FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_presidential_endorsements_nation_id') THEN
    ALTER TABLE presidential_endorsements ADD CONSTRAINT fk_presidential_endorsements_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_presidential_endorsements_faction_id') THEN
    ALTER TABLE presidential_endorsements ADD CONSTRAINT fk_presidential_endorsements_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_presidential_endorsements_bloc_id') THEN
    ALTER TABLE presidential_endorsements ADD CONSTRAINT fk_presidential_endorsements_bloc_id
      FOREIGN KEY (bloc_id) REFERENCES voter_blocs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 28. PRESIDENTS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_presidents_nation_id') THEN
    ALTER TABLE presidents ADD CONSTRAINT fk_presidents_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_presidents_faction_id') THEN
    ALTER TABLE presidents ADD CONSTRAINT fk_presidents_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id);
  END IF;
END $$;

-- ============================================================
-- 29. REGIME PILLARS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_regime_pillars_nation_id') THEN
    ALTER TABLE regime_pillars ADD CONSTRAINT fk_regime_pillars_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_regime_pillars_steward_faction_id') THEN
    ALTER TABLE regime_pillars ADD CONSTRAINT fk_regime_pillars_steward_faction_id
      FOREIGN KEY (steward_faction_id) REFERENCES factions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 30. STEWARDS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stewards_nation_id') THEN
    ALTER TABLE stewards ADD CONSTRAINT fk_stewards_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stewards_faction_id') THEN
    ALTER TABLE stewards ADD CONSTRAINT fk_stewards_faction_id
      FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 31. TRADE SYSTEM
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_flows_nation_id') THEN
    ALTER TABLE trade_flows ADD CONSTRAINT fk_trade_flows_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_partners_exporter_nation_id') THEN
    ALTER TABLE trade_partners ADD CONSTRAINT fk_trade_partners_exporter_nation_id
      FOREIGN KEY (exporter_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_partners_importer_nation_id') THEN
    ALTER TABLE trade_partners ADD CONSTRAINT fk_trade_partners_importer_nation_id
      FOREIGN KEY (importer_nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_summary_nation_id') THEN
    ALTER TABLE trade_summary ADD CONSTRAINT fk_trade_summary_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id);
  END IF;
END $$;

-- ============================================================
-- 32. TRADE AGREEMENTS / NEGOTIATIONS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_negotiations_nation_a_id') THEN
    ALTER TABLE trade_negotiations ADD CONSTRAINT fk_trade_negotiations_nation_a_id
      FOREIGN KEY (nation_a_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_negotiations_nation_b_id') THEN
    ALTER TABLE trade_negotiations ADD CONSTRAINT fk_trade_negotiations_nation_b_id
      FOREIGN KEY (nation_b_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_negotiations_initiating_proposal_id') THEN
    ALTER TABLE trade_negotiations ADD CONSTRAINT fk_trade_negotiations_initiating_proposal_id
      FOREIGN KEY (initiating_proposal_id) REFERENCES diplomatic_proposals(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_agreements_nation_a_id') THEN
    ALTER TABLE trade_agreements ADD CONSTRAINT fk_trade_agreements_nation_a_id
      FOREIGN KEY (nation_a_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_agreements_nation_b_id') THEN
    ALTER TABLE trade_agreements ADD CONSTRAINT fk_trade_agreements_nation_b_id
      FOREIGN KEY (nation_b_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trade_agreements_negotiation_id') THEN
    ALTER TABLE trade_agreements ADD CONSTRAINT fk_trade_agreements_negotiation_id
      FOREIGN KEY (negotiation_id) REFERENCES trade_negotiations(id);
  END IF;
END $$;

-- ============================================================
-- 33. VALDORIAN ARTICLES
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_valdorian_articles_nation_id') THEN
    ALTER TABLE valdorian_articles ADD CONSTRAINT fk_valdorian_articles_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 34. WIKI PAGES
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_wiki_pages_nation_id') THEN
    ALTER TABLE wiki_pages ADD CONSTRAINT fk_wiki_pages_nation_id
      FOREIGN KEY (nation_id) REFERENCES nations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_wiki_pages_created_by') THEN
    ALTER TABLE wiki_pages ADD CONSTRAINT fk_wiki_pages_created_by
      FOREIGN KEY (created_by) REFERENCES factions(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_wiki_pages_updated_by') THEN
    ALTER TABLE wiki_pages ADD CONSTRAINT fk_wiki_pages_updated_by
      FOREIGN KEY (updated_by) REFERENCES factions(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_wiki_pages_locked_by') THEN
    ALTER TABLE wiki_pages ADD CONSTRAINT fk_wiki_pages_locked_by
      FOREIGN KEY (locked_by) REFERENCES factions(id);
  END IF;
END $$;
