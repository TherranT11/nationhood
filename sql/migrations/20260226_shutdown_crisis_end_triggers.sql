-- Add crisis_end_triggers row for Government Shutdown so that nation.html
-- displays "Recovery: Pass A Budget" in the crisis card.
-- The Government Shutdown is resolved programmatically (not via stat triggers),
-- so this row is purely for UI display purposes.

INSERT INTO crisis_end_triggers (crisis_id, stat_key, operator, threshold)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'pass_a_budget',
    'gte',
    0
)
ON CONFLICT DO NOTHING;
