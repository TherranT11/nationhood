-- ============================================================
-- Phase 2a: Expand incident_event_pool categories for escalation events
-- ============================================================
-- The original CHECK constraint only allowed 'start', 'low', 'moderate', 'high'.
-- Escalation events need their own categories so the engine can query them
-- separately from the random tick event pool.
-- ============================================================

ALTER TABLE incident_event_pool
    DROP CONSTRAINT IF EXISTS incident_event_pool_category_check;

ALTER TABLE incident_event_pool
    ADD CONSTRAINT incident_event_pool_category_check
    CHECK (category IN (
        'start', 'low', 'moderate', 'high',
        'escalation_a5', 'escalation_b5',
        'escalation_a8', 'escalation_b8'
    ));
