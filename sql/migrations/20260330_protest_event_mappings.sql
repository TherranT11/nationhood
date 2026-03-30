-- Add event name mappings for protest action results (Public Address resolved,
-- crisis fizzle) so they display properly in the Events container.
-- Also update the category mapping to include the new trigger keys.

CREATE OR REPLACE FUNCTION fire_system_event(
    p_nation_id UUID,
    p_trigger_key TEXT,
    p_tick INT DEFAULT NULL,
    p_placeholders JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_event_name TEXT;
    v_category TEXT;
    v_desc TEXT;
    v_event_id UUID;
    v_shard RECORD;
BEGIN
    -- Get current tick if not provided
    IF p_tick IS NULL THEN
        SELECT current_tick INTO v_shard FROM shard WHERE name = 'Alpha Shard';
        p_tick := COALESCE(v_shard.current_tick, 0);
    END IF;

    -- Map trigger key to event name and category
    SELECT
        CASE p_trigger_key
            WHEN 'crisis_started'           THEN 'Crisis Started'
            WHEN 'crisis_ended'             THEN 'Crisis Resolved'
            WHEN 'bill_passed'              THEN 'Bill Passed'
            WHEN 'bill_failed'              THEN 'Bill Failed'
            WHEN 'quorum_failed'            THEN 'Quorum Failed'
            WHEN 'election_held'            THEN 'Election Held'
            WHEN 'pm_appointed'             THEN 'PM Appointed'
            WHEN 'government_formed'        THEN 'Government Formed'
            WHEN 'incumbent_lockin'         THEN 'Incumbent Re-elected'
            -- Protest government responses
            WHEN 'protest:public_address'   THEN 'Public Address'
            WHEN 'protest:public_address_resolved' THEN 'Public Address — Crisis Resolved'
            WHEN 'protest:epo_resolved'     THEN 'Enforce Public Order — Crisis Resolved'
            WHEN 'protest:epo_failed'       THEN 'Enforce Public Order — Failed'
            WHEN 'protest:epo_escalated'    THEN 'Crackdown Backfires — Crisis Escalates'
            WHEN 'protest:national_emergency' THEN 'National Emergency Declared'
            WHEN 'protest:called_off'       THEN 'Protest Called Off'
            WHEN 'protest:crisis_fizzled'   THEN 'Protest Crisis Fizzles'
            -- Trade
            WHEN 'trade_agreement_proposed' THEN 'Trade Agreement Proposed'
            WHEN 'trade_agreement_accepted' THEN 'Trade Agreement Accepted'
            WHEN 'trade_agreement_rejected' THEN 'Trade Agreement Rejected'
            WHEN 'trade_agreement_expired'  THEN 'Trade Agreement Expired'
            WHEN 'trade_negotiation_proposed' THEN 'Trade Negotiation Proposed'
            WHEN 'sanctions_imposed'        THEN 'Sanctions Imposed'
            WHEN 'aid_terminated'           THEN 'Aid Agreement Terminated'
            WHEN 'aid_suspended'            THEN 'Aid Agreement Suspended'
            WHEN 'aid_resumed'              THEN 'Aid Agreement Resumed'
            -- Diplomacy
            WHEN 'diplomatic_initiative_proposed' THEN 'Diplomatic Initiative Proposed'
            WHEN 'diplomatic_initiative_accepted' THEN 'Diplomatic Initiative Accepted'
            WHEN 'diplomatic_initiative_rejected' THEN 'Diplomatic Initiative Rejected'
            WHEN 'major_initiative_ratified' THEN 'Major Initiative Ratified'
            WHEN 'major_initiative_ratification_failed' THEN 'Major Initiative Failed'
            WHEN 'state_visit'              THEN 'State Visit'
            -- Ministry actions
            WHEN 'ministry_pharmaceutical_increased' THEN 'Pharmaceutical Regulations Increased'
            WHEN 'ministry_pharmaceutical_decreased' THEN 'Pharmaceutical Regulations Decreased'
            WHEN 'ministry_pharmaceutical_direction_changed' THEN 'Pharmaceutical Policy Reversed'
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
            ELSE REPLACE(p_trigger_key, '_', ' ')
        END,
        CASE
            WHEN p_trigger_key IN ('crisis_started', 'crisis_ended') THEN 'crisis'
            WHEN p_trigger_key IN ('bill_passed', 'bill_failed', 'quorum_failed') THEN 'government'
            WHEN p_trigger_key IN ('election_held', 'pm_appointed', 'government_formed', 'incumbent_lockin') THEN 'government'
            WHEN p_trigger_key IN ('ministry_pharmaceutical_increased', 'ministry_pharmaceutical_decreased',
                'ministry_pharmaceutical_direction_changed') THEN 'HEALTHCARE'
            WHEN p_trigger_key IN ('ministry_labor_strengthen_unions',
                'ministry_labor_deregulate',
                'ministry_labor_direction_changed',
                'ministry_workforce_development') THEN 'LABOR'
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
            WHEN p_trigger_key IN ('protest:public_address', 'protest:public_address_resolved',
                'protest:epo_resolved', 'protest:epo_failed',
                'protest:epo_escalated', 'protest:national_emergency',
                'protest:called_off', 'protest:crisis_fizzled') THEN 'protest'
            ELSE 'system'
        END
    INTO v_event_name, v_category;

    -- Build description from placeholders
    v_desc := COALESCE(
        p_placeholders->>'description',
        v_event_name || ' in ' || COALESCE((SELECT name FROM nations WHERE id = p_nation_id), 'Unknown')
    );

    INSERT INTO event_log (
        nation_id, event_name, trigger_key,
        description_chosen, category, fired_at_tick
    ) VALUES (
        p_nation_id, v_event_name, p_trigger_key,
        v_desc, v_category, p_tick
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
