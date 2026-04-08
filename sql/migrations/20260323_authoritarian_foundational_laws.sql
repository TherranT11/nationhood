-- ============================================================
-- Three new foundational laws that feed authoritarianism:
--   1. Abolish Term Limits
--   2. State Media Control Act
--   3. Emergency Powers Act
-- ============================================================

-- Nation-level flags (persist once the law passes)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS term_limits_abolished BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS state_media_control BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS emergency_powers_act BOOLEAN NOT NULL DEFAULT false;

-- Seize Power trigger: rejected flag so player can decline (persists in DB)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS seize_power_rejected BOOLEAN NOT NULL DEFAULT false;

-- Bill proposal columns (one per foundational subtype)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_abolish_term_limits BOOLEAN DEFAULT NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_state_media_control BOOLEAN DEFAULT NULL;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_emergency_powers_act BOOLEAN DEFAULT NULL;
