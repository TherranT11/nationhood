-- RPC function to delete a single faction/party and all its related data.
-- Runs as SECURITY DEFINER (bypasses RLS).
-- Run this in Supabase SQL editor (safe to re-run).
--
-- IMPORTANT: Run  DROP FUNCTION IF EXISTS admin_delete_party(uuid);  first
-- if the old version exists (return type changed from void to jsonb).

DROP FUNCTION IF EXISTS admin_delete_party(uuid);

CREATE FUNCTION admin_delete_party(p_faction_id UUID, p_force BOOLEAN DEFAULT false)
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
    v_has_user BOOLEAN;
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
        ARRAY['bill_comments',               $$DELETE FROM bill_comments WHERE faction_id = '%s'$$],
        ARRAY['bill_articles.added_by',      $$UPDATE bill_articles SET added_by = NULL WHERE added_by = '%s'$$],
        ARRAY['bill_amendment_requests',     $$DELETE FROM bill_amendment_requests WHERE faction_id = '%s'$$],
        ARRAY['bill_support',                 $$DELETE FROM bill_support WHERE faction_id = '%s'$$],
        ARRAY['active_laws.proposed_by',      $$UPDATE active_laws SET proposed_by = NULL WHERE proposed_by = '%s'$$],
        ARRAY['bills',                        $$DELETE FROM bills WHERE proposed_by = '%s'$$],
        ARRAY['campaign_actions',             $$DELETE FROM campaign_actions WHERE party_id = '%s'$$],
        ARRAY['impeachment_proceedings',     $$DELETE FROM impeachment_proceedings WHERE initiated_by_faction_id = '%s'$$],
        ARRAY['loyalty_demands',              $$DELETE FROM loyalty_demands WHERE strongman_faction_id = '%s' OR target_faction_id = '%s'$$],
        ARRAY['coalition_messages',           $$DELETE FROM coalition_messages WHERE coalition_id IN (SELECT id FROM faction_coalitions WHERE faction_a_id = '%s' OR faction_b_id = '%s')$$],
        ARRAY['faction_coalitions',           $$DELETE FROM faction_coalitions WHERE faction_a_id = '%s' OR faction_b_id = '%s'$$],
        ARRAY['regime_pillars',               $$UPDATE regime_pillars SET steward_faction_id = NULL WHERE steward_faction_id = '%s'$$],
        ARRAY['active_coalitions',            $$DELETE FROM active_coalitions WHERE lead_party_id = '%s'$$],
        ARRAY['coalition_proposals',          $$DELETE FROM coalition_proposals WHERE faction_id = '%s'$$],
        ARRAY['ideology_history',             $$DELETE FROM ideology_history WHERE faction_id = '%s'$$],
        ARRAY['faction_ideology',             $$DELETE FROM faction_ideology WHERE faction_id = '%s'$$],
        ARRAY['admin_chat',                   $$DELETE FROM admin_chat WHERE faction_id = '%s'$$],
        ARRAY['stewards',                     $$DELETE FROM stewards WHERE faction_id = '%s'$$],
        ARRAY['forum_replies',                $$DELETE FROM forum_replies WHERE faction_id = '%s'$$],
        ARRAY['forum_threads',                $$DELETE FROM forum_threads WHERE faction_id = '%s'$$],
        ARRAY['player_articles',              $$DELETE FROM player_articles WHERE author_faction_id = '%s'$$],
        ARRAY['op_eds(author)',               $$DELETE FROM op_eds WHERE author_faction_id = '%s'$$],
        ARRAY['ministry_requests',            $$DELETE FROM ministry_requests WHERE faction_id = '%s'$$],
        ARRAY['fundraiser_promises',         $$DELETE FROM fundraiser_promises WHERE party_id = '%s'$$],
        ARRAY['donor_trust',                 $$DELETE FROM donor_trust WHERE party_id = '%s'$$],
        ARRAY['wiki_pages.created_by',       $$UPDATE wiki_pages SET created_by = NULL WHERE created_by = '%s'$$],
        ARRAY['wiki_pages.updated_by',       $$UPDATE wiki_pages SET updated_by = NULL WHERE updated_by = '%s'$$],
        ARRAY['wiki_pages.locked_by',        $$UPDATE wiki_pages SET locked_by = NULL WHERE locked_by = '%s'$$],
        ARRAY['faction_coalitions(proposer)', $$UPDATE faction_coalitions SET proposed_by_faction_id = NULL WHERE proposed_by_faction_id = '%s'$$],
        ARRAY['administrations.pm_party_id',  $$UPDATE administrations SET pm_party_id = NULL WHERE pm_party_id = '%s'$$],
        ARRAY['election_candidates',          $$DELETE FROM election_candidates WHERE faction_id = '%s'$$],
        ARRAY['presidential_candidates',      $$DELETE FROM presidential_candidates WHERE faction_id = '%s'$$],
        ARRAY['protests.faction_id',          $$UPDATE protests SET faction_id = NULL WHERE faction_id = '%s'$$],
        -- IPO tables
        ARRAY['ipo_invitations(target)',      $$DELETE FROM ipo_invitations WHERE target_faction_id = '%s'$$],
        ARRAY['ipo_invitations(invited_by)',   $$DELETE FROM ipo_invitations WHERE invited_by_faction_id = '%s'$$],
        ARRAY['ipo_members',                  $$DELETE FROM ipo_members WHERE faction_id = '%s'$$],
        ARRAY['ipo_ballots',                  $$DELETE FROM ipo_ballots WHERE faction_id = '%s'$$],
        ARRAY['ipo_chat',                     $$DELETE FROM ipo_chat WHERE faction_id = '%s'$$],
        ARRAY['ipo_votes(proposed_by)',        $$DELETE FROM ipo_votes WHERE proposed_by = '%s'$$],
        ARRAY['ipo_organisations.president_id', $$UPDATE ipo_organisations SET president_id = NULL WHERE president_id = '%s'$$],
        -- Autocracy tables
        ARRAY['faction_pillar_state',          $$DELETE FROM faction_pillar_state WHERE faction_id = '%s'$$],
        ARRAY['autocracy_action_log',          $$DELETE FROM autocracy_action_log WHERE faction_id = '%s'$$],
        ARRAY['silent_coup_offers',            $$DELETE FROM silent_coup_offers WHERE from_faction_id = '%s' OR to_faction_id = '%s'$$],
        ARRAY['silent_coup_votes',             $$DELETE FROM silent_coup_votes WHERE faction_id = '%s'$$],
        ARRAY['putsch_state',                  $$DELETE FROM putsch_state WHERE military_faction_id = '%s'$$],
        -- Electoral / standing
        ARRAY['faction_electoral_standing',     $$DELETE FROM faction_electoral_standing WHERE faction_id = '%s'$$],
        ARRAY['faction_issue_stance',          $$DELETE FROM faction_issue_stance WHERE faction_id = '%s'$$],
        ARRAY['ideology_shift_actions',        $$DELETE FROM ideology_shift_actions WHERE faction_id = '%s'$$],
        ARRAY['party_approval_log',            $$DELETE FROM party_approval_log WHERE faction_id = '%s'$$],
        ARRAY['credibility_log',               $$DELETE FROM credibility_log WHERE faction_id = '%s'$$],
        ARRAY['protest_log.faction_id',        $$UPDATE protest_log SET faction_id = NULL WHERE faction_id = '%s'$$],
        ARRAY['event_log.faction_id',          $$UPDATE event_log SET faction_id = NULL WHERE faction_id = '%s'$$]
    ];
    i INT;
BEGIN
    -- SAFEGUARD: block deletion of factions owned by real players unless p_force = true.
    -- A faction is "owned" if its id matches an auth.users row or it has a linked_user_id.
    IF NOT p_force THEN
        SELECT EXISTS (
            SELECT 1 FROM auth.users u WHERE u.id = p_faction_id
        ) OR EXISTS (
            SELECT 1 FROM factions f WHERE f.id = p_faction_id AND f.linked_user_id IS NOT NULL
        ) INTO v_has_user;

        IF v_has_user THEN
            RETURN jsonb_build_object(
                'error', 'BLOCKED: This faction belongs to a real player. Use p_force=true to override.',
                'faction_id', p_faction_id
            );
        END IF;
    END IF;

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
