-- Rename protest crisis templates to match new tier labels
UPDATE crisis_templates
SET name = 'Nationwide Protests',
    description = 'Nationwide protests grip the nation. Government approval and stability erode each tick as protesters demand change.'
WHERE id = '00000000-0000-0000-0000-000000000020';

UPDATE crisis_templates
SET name = 'The Big One',
    description = 'The Big One has arrived. The economy suffers as millions take to the streets demanding immediate government action.'
WHERE id = '00000000-0000-0000-0000-000000000021';
