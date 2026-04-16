-- Retire Rise of Authoritarianism crisis template and all linked trigger/effect rows.

DELETE FROM active_crises
WHERE crisis_id = '00000000-0000-0000-0000-000000000030';

DELETE FROM crisis_end_triggers
WHERE crisis_id = '00000000-0000-0000-0000-000000000030';

DELETE FROM crisis_effects
WHERE crisis_id = '00000000-0000-0000-0000-000000000030';

DELETE FROM crisis_triggers
WHERE crisis_id = '00000000-0000-0000-0000-000000000030';

DELETE FROM crisis_templates
WHERE id = '00000000-0000-0000-0000-000000000030';
