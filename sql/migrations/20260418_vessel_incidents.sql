-- ══════════════════════════════════════════════════════════════
-- Vessel incidents — claim-eligible events pending corp action
--
-- Replaces the previous auto-file-on-strand behavior in advance-corp-tick.
-- When a vessel gets into a claimable state (stranded at sea today; piracy,
-- fire, collision etc. in Job 2), the tick processor inserts a row here
-- instead of immediately creating an insurance_claims record. The owning
-- corp then sees the incident in their Shipping Operations view and
-- chooses to FILE CLAIM (which spawns the insurance_claims row in
-- status='filed') or DISMISS (marks the incident resolved without a payout).
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vessel_incidents (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id      uuid NOT NULL REFERENCES factions(id)    ON DELETE CASCADE,
    vessel_id       uuid NOT NULL REFERENCES corp_vessels(id) ON DELETE CASCADE,
    nation_id       uuid          REFERENCES nations(id),      -- where the incident occurred; null for mid-transit
    incident_type   text NOT NULL,                             -- 'stranded' today; others to come
    incident_tick   int  NOT NULL,
    description     text,
    status          text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','filed','dismissed')),
    filed_at_tick   int,
    filed_claim_id  uuid REFERENCES insurance_claims(id)       ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vessel_incidents_faction_status
    ON vessel_incidents(faction_id, status);
CREATE INDEX IF NOT EXISTS idx_vessel_incidents_vessel
    ON vessel_incidents(vessel_id);

ALTER TABLE vessel_incidents ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read vessel_incidents — the owning corp needs
-- them in their UI, and insurers seeing "claim filed" events may want to
-- see the underlying incident context.
CREATE POLICY vessel_incidents_read ON vessel_incidents
    FOR SELECT TO authenticated USING (true);

-- Tick processor (service role) inserts. Allow authenticated inserts too so
-- future player-triggered incidents (manual abandonment, decommission etc.)
-- don't need a separate path; the tick-side RPC still owns the realistic
-- cases.
CREATE POLICY vessel_incidents_insert ON vessel_incidents
    FOR INSERT TO authenticated WITH CHECK (true);

-- Corp transitions their own incidents between pending / filed / dismissed
-- via the UI. Tick processor can update any row (service role bypasses RLS).
CREATE POLICY vessel_incidents_update ON vessel_incidents
    FOR UPDATE TO authenticated USING (true);
