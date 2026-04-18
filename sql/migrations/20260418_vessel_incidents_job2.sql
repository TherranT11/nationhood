-- ══════════════════════════════════════════════════════════════
-- Vessel incidents — Job 2 additions
--
-- Job 2 expands the event pool beyond 'stranded' (mechanical failure,
-- collision, fire, piracy, storm damage). Adds a severity field that the
-- tick processor sets when it writes the incident row; 'partial' knocks
-- the vessel's condition down but leaves it operable, 'total' forces the
-- vessel to 'anchored' + releases the shipping claim the same way a
-- strand does. The corp UI reads severity to flag total-loss incidents.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE vessel_incidents
    ADD COLUMN IF NOT EXISTS severity text
        CHECK (severity IS NULL OR severity IN ('partial','total'));

CREATE INDEX IF NOT EXISTS idx_vessel_incidents_type
    ON vessel_incidents(incident_type);
