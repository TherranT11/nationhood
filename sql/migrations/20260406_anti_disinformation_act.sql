-- Anti-Disinformation Act: new authoritarian foundational law
-- Adds columns to nations and bills tables

-- Nations: track whether the act is enacted and when
ALTER TABLE nations ADD COLUMN IF NOT EXISTS anti_disinformation_act BOOLEAN DEFAULT false;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS anti_disinformation_act_enacted_tick INT DEFAULT NULL;

-- Bills: proposal flag
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_anti_disinformation_act BOOLEAN DEFAULT NULL;
