-- Add card system event types to bilateral_issue_history
ALTER TABLE bilateral_issue_history DROP CONSTRAINT IF EXISTS bilateral_issue_history_event_type_check;
ALTER TABLE bilateral_issue_history ADD CONSTRAINT bilateral_issue_history_event_type_check
    CHECK (event_type IN (
        'created', 'modifier_added', 'modifier_removed', 'modifier_fired',
        'action_proposed', 'action_accepted', 'action_rejected', 'action_executed',
        'tension_changed', 'favor_changed', 'status_changed', 'escalated',
        'card_played', 'diplomatic_accepted', 'diplomatic_rejected', 'diplomatic_expired',
        'escalation_favor',
        'primer', 'user_event'
    ));
