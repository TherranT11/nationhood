-- RPC: fire_system_event
-- Inserts a system event into event_log with a trigger_key and placeholders.
-- Called from the tick processor, ministry actions, elections, bills, etc.
-- SECURITY DEFINER so client-side callers can write to event_log.

-- Ensure trigger_key column exists (may already be present)
ALTER TABLE event_log
ADD COLUMN IF NOT EXISTS trigger_key TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_event_log_trigger_key
ON event_log (trigger_key)
WHERE trigger_key IS NOT NULL;

-- Drop first in case the return type changed from a previous version
DROP FUNCTION IF EXISTS fire_system_event(uuid, text, integer, jsonb);

CREATE OR REPLACE FUNCTION fire_system_event(
    p_nation_id    UUID,
    p_trigger_key  TEXT,
    p_tick         INT,
    p_placeholders JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_name TEXT;
    v_category TEXT;
BEGIN
    -- Guard: caller must belong to this nation (skip check for service_role / tick processor)
    IF auth.role() = 'authenticated' THEN
        IF NOT EXISTS (
            SELECT 1 FROM factions
            WHERE id = auth.uid() AND nation_id = p_nation_id
        ) THEN
            RAISE EXCEPTION 'Not authorized to fire events for this nation';
        END IF;
    END IF;

    -- Map trigger_key to readable event_name and category
    SELECT
        CASE p_trigger_key
            WHEN 'election_held'            THEN 'Election Held'
            WHEN 'government_formed'        THEN 'Government Formed'
            WHEN 'presidential_election'    THEN 'Presidential Election'
            WHEN 'formation_snap_election'  THEN 'Snap Election Called'
            WHEN 'emergency_minority_government' THEN 'Minority Government Formed'
            WHEN 'minority_government_formed'    THEN 'Minority Government Formed'
            WHEN 'coalition_formation_started'    THEN 'Coalition Formation Underway'
            WHEN 'pm_appointed'             THEN 'Prime Minister Appointed'
            WHEN 'vonc_passed'              THEN 'No Confidence — Government Falls'
            WHEN 'vonc_failed'              THEN 'No Confidence — Motion Fails'
            WHEN 'coup_attempt'             THEN 'Coup Attempt'
            WHEN 'minister_resigned'        THEN 'Minister Resigned'
            WHEN 'minister_purged'          THEN 'Minister Purged'
            WHEN 'party_leader_replaced'    THEN 'Party Leader Replaced'
            WHEN 'crisis_started'           THEN 'Crisis Started'
            WHEN 'crisis_ended'             THEN 'Crisis Resolved'
            WHEN 'ministry_ability_used'    THEN 'Ministry Action'
            WHEN 'ministry_stimulus_package'   THEN 'Stimulus Package Activated'
            WHEN 'ministry_austerity_measures' THEN 'Austerity Measures Declared'
            WHEN 'ministry_debt_restructuring' THEN 'Debt Restructuring Negotiations Opened'
            WHEN 'ministry_debt_restructuring_success' THEN 'Debt Restructuring Successful'
            WHEN 'ministry_debt_restructuring_failure' THEN 'Debt Restructuring Failed'
            WHEN 'ministry_stimulus_cancelled_by_austerity' THEN 'Stimulus Cancelled by Austerity'
            WHEN 'ministry_austerity_cancelled_by_stimulus' THEN 'Austerity Cancelled by Stimulus'
            -- Education Ministry
            WHEN 'ministry_standardised_curriculum'        THEN 'Curriculum Orientation Set'
            WHEN 'ministry_private_education_incentives'   THEN 'Private Education Incentives Activated'
            -- Healthcare Ministry
            WHEN 'ministry_preventative_care'              THEN 'Preventative Care Programme Activated'
            WHEN 'ministry_preventative_care_expired'      THEN 'Preventative Care Programme Concluded'
            WHEN 'ministry_pharmaceutical_increased'       THEN 'Pharmaceutical Regulation Increased'
            WHEN 'ministry_pharmaceutical_decreased'       THEN 'Pharmaceutical Regulation Decreased'
            WHEN 'ministry_pharmaceutical_direction_changed' THEN 'Pharmaceutical Policy Reversed'
            WHEN 'ministry_pharmaceutical_expired'         THEN 'Pharmaceutical Regulation Expired'
            -- Labor Ministry
            WHEN 'ministry_labor_strengthen_unions'    THEN 'Labor Unions Strengthened'
            WHEN 'ministry_labor_deregulate'           THEN 'Labor Market Deregulated'
            WHEN 'ministry_labor_direction_changed'    THEN 'Labor Policy Reversed'
            WHEN 'ministry_workforce_development'      THEN 'Workforce Development Programme Activated'
            -- Transportation Ministry
            WHEN 'ministry_public_transit'                THEN 'Public Transit Investment Activated'
            WHEN 'ministry_public_transit_expired'        THEN 'Public Transit Investment Concluded'
            WHEN 'ministry_road_maintenance'              THEN 'Road & Highway Maintenance Activated'
            WHEN 'ministry_road_maintenance_expired'      THEN 'Road & Highway Maintenance Concluded'
            WHEN 'ministry_expand_infrastructure'         THEN 'Infrastructure Expansion Launched'
            WHEN 'bill_passed'              THEN 'Bill Passed'
            WHEN 'bill_failed'              THEN 'Bill Failed'
            WHEN 'quorum_failed'            THEN 'Quorum Failed'
            WHEN 'trade_agreement_proposed' THEN 'Trade Agreement Proposed'
            WHEN 'trade_agreement_accepted' THEN 'Trade Agreement Accepted'
            WHEN 'trade_agreement_rejected' THEN 'Trade Agreement Rejected'
            WHEN 'trade_agreement_expired'  THEN 'Trade Agreement Expired'
            WHEN 'trade_negotiation_proposed' THEN 'Trade Negotiations Proposed'
            WHEN 'diplomatic_initiative_proposed'  THEN 'Diplomatic Initiative Proposed'
            WHEN 'diplomatic_initiative_accepted'  THEN 'Diplomatic Initiative Accepted'
            WHEN 'diplomatic_initiative_rejected'  THEN 'Diplomatic Initiative Rejected'
            WHEN 'major_initiative_ratified'       THEN 'Major Initiative Ratified'
            WHEN 'major_initiative_ratification_failed' THEN 'Major Initiative Ratification Failed'
            WHEN 'state_visit'              THEN 'State Visit'
            WHEN 'sanctions_imposed'        THEN 'Sanctions Imposed'
            WHEN 'aid_terminated'           THEN 'Economic Aid Terminated'
            WHEN 'aid_suspended'            THEN 'Economic Aid Suspended'
            WHEN 'aid_resumed'              THEN 'Economic Aid Resumed'
            WHEN 'snap_election_called'     THEN 'Snap Election Called'
            WHEN 'incumbent_lockin'         THEN 'Incumbent Re-elected'
            -- Protest government responses
            WHEN 'protest:public_address'   THEN 'Public Address'
            WHEN 'protest:epo_resolved'     THEN 'Enforce Public Order — Crisis Resolved'
            WHEN 'protest:epo_escalated'    THEN 'Crackdown Backfires — Crisis Escalates'
            WHEN 'protest:national_emergency' THEN 'National Emergency Declared'
            WHEN 'protest:called_off'       THEN 'Protest Called Off'
            ELSE REPLACE(p_trigger_key, '_', ' ')
        END,
        CASE
            WHEN p_trigger_key IN ('crisis_started', 'crisis_ended') THEN 'crisis'
            WHEN p_trigger_key IN ('election_held', 'government_formed', 'presidential_election',
                'formation_snap_election', 'emergency_minority_government', 'pm_appointed',
                'vonc_passed', 'vonc_failed', 'snap_election_called', 'coup_attempt',
                'minister_resigned', 'minister_purged', 'party_leader_replaced',
                'minority_government_formed', 'coalition_formation_started',
                'incumbent_lockin', 'bill_passed', 'bill_failed', 'quorum_failed') THEN 'government'
            WHEN p_trigger_key IN ('ministry_ability_used') THEN 'executive_order'
            WHEN p_trigger_key IN ('ministry_stimulus_package', 'ministry_austerity_measures',
                'ministry_debt_restructuring', 'ministry_debt_restructuring_success',
                'ministry_debt_restructuring_failure',
                'ministry_stimulus_cancelled_by_austerity',
                'ministry_austerity_cancelled_by_stimulus') THEN 'ECONOMY'
            -- Education Ministry
            WHEN p_trigger_key IN ('ministry_standardised_curriculum',
                'ministry_private_education_incentives') THEN 'EDUCATION'
            -- Healthcare Ministry
            WHEN p_trigger_key IN ('ministry_preventative_care',
                'ministry_preventative_care_expired',
                'ministry_pharmaceutical_increased',
                'ministry_pharmaceutical_decreased',
                'ministry_pharmaceutical_direction_changed',
                'ministry_pharmaceutical_expired') THEN 'HEALTH'
            -- Labor Ministry
            WHEN p_trigger_key IN ('ministry_labor_strengthen_unions',
                'ministry_labor_deregulate',
                'ministry_labor_direction_changed',
                'ministry_workforce_development') THEN 'LABOR'
            -- Transportation Ministry
            WHEN p_trigger_key IN ('ministry_public_transit',
                'ministry_public_transit_expired',
                'ministry_road_maintenance',
                'ministry_road_maintenance_expired',
                'ministry_expand_infrastructure') THEN 'TRANSPORT'
            WHEN p_trigger_key IN ('trade_agreement_proposed', 'trade_agreement_accepted',
                'trade_agreement_rejected', 'trade_agreement_expired', 'trade_negotiation_proposed',
                'sanctions_imposed', 'aid_terminated', 'aid_suspended', 'aid_resumed') THEN 'Trade'
            WHEN p_trigger_key IN ('diplomatic_initiative_proposed', 'diplomatic_initiative_accepted',
                'diplomatic_initiative_rejected', 'major_initiative_ratified',
                'major_initiative_ratification_failed', 'state_visit') THEN 'Diplomatic'
            WHEN p_trigger_key IN ('protest:public_address', 'protest:epo_resolved',
                'protest:epo_escalated', 'protest:national_emergency',
                'protest:called_off') THEN 'protest'
            ELSE 'system'
        END
    INTO v_event_name, v_category;

    INSERT INTO event_log (
        nation_id,
        event_name,
        trigger_key,
        category,
        effects_applied,
        fired_at_tick
    ) VALUES (
        p_nation_id,
        v_event_name,
        p_trigger_key,
        v_category,
        p_placeholders,
        p_tick
    );
END;
$$;
