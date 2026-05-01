-- ══════════════════════════════════════════════════════════════
-- Path 1 Phase 1B: corp_contract_events (events table for the new pipeline)
--
-- Mirrors the legacy `construction_events` schema field-for-field
-- but FK'd to `corp_contracts` instead of `construction_contracts`.
-- Same shape so the existing event-rendering UI patterns transfer
-- with minimal change; same status/expiry/responses semantics so
-- player-resolvable Pressing Issues work the same way.
--
-- During the drain period (Phase 1B → 1E), both event tables run
-- in parallel:
--   construction_events  ← legacy generateProjectEvents
--                          (the 41 in-flight legacy contracts)
--   corp_contract_events ← new generateCorpContractProjectEvents
--                          (everything in the new pipeline)
-- When the 41 legacy contracts complete, the legacy table drops
-- with them in Phase 1E. corp_contract_events becomes the canonical
-- events store going forward.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS corp_contract_events (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK targets the new pipeline. CASCADE on contract delete because
    -- events have no meaning without the contract they're attached to.
    contract_id       UUID         NOT NULL REFERENCES corp_contracts(id) ON DELETE CASCADE,
    faction_id        UUID         REFERENCES factions(id) ON DELETE SET NULL,
    nation_id         UUID         NOT NULL REFERENCES nations(id),

    -- Catalog / display fields. Mirrors construction_events.
    event_key         TEXT         NOT NULL,
    type              TEXT         NOT NULL,
    severity          TEXT         NOT NULL CHECK (severity IN ('LOW','MODERATE','HIGH','CRITICAL')),
    title             TEXT         NOT NULL,
    description       TEXT,
    impact            TEXT,

    -- Player choices. JSONB array of { key, label, tag, detail, cost,
    -- delay, qualityImpact } — same shape construction_events uses.
    responses         JSONB        NOT NULL DEFAULT '[]'::jsonb,

    -- Lifecycle.
    status            TEXT         NOT NULL DEFAULT 'ACTIVE'
                          CHECK (status IN ('ACTIVE','RESOLVED','EXPIRED')),
    fired_at_tick     INT          NOT NULL,
    expires_at_tick   INT          NOT NULL,
    resolved_at_tick  INT,
    resolution_choice TEXT,

    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cce_contract  ON corp_contract_events (contract_id);
CREATE INDEX IF NOT EXISTS idx_cce_faction   ON corp_contract_events (faction_id);
CREATE INDEX IF NOT EXISTS idx_cce_status    ON corp_contract_events (status);
CREATE INDEX IF NOT EXISTS idx_cce_expires   ON corp_contract_events (expires_at_tick);
-- Composite for the most common runtime query: "active events on this
-- nation's contracts that haven't expired yet."
CREATE INDEX IF NOT EXISTS idx_cce_nation_status
    ON corp_contract_events (nation_id, status);

COMMENT ON TABLE corp_contract_events IS
    'Project events fired against corp_contracts (new pipeline). Mirrors construction_events but FK''d to the new contracts table. Pressing Issues UI reads ACTIVE rows; resolution flips status to RESOLVED or EXPIRED on auto-resolve.';

-- RLS: read-all for any authenticated user (events are public game
-- state, like the contracts themselves). Writes are SECURITY DEFINER
-- only — generateCorpContractProjectEvents runs as service_role.
ALTER TABLE corp_contract_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "corp_contract_events_read_all" ON corp_contract_events;
CREATE POLICY "corp_contract_events_read_all"
    ON corp_contract_events FOR SELECT TO authenticated USING (true);
