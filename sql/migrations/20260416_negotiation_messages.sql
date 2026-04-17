-- ============================================================================
-- Trade Negotiation Messages
-- ============================================================================
-- Real-time chat between officials (PM, Minister of Trade, Ambassador) from
-- two nations during trade negotiations. Each message is scoped to a single
-- trade_negotiations row via negotiation_id.
--
-- sender_display_name is denormalized (e.g. "Maria Gutierrez (Minister of Trade)")
-- to avoid joins on render and to preserve historical accuracy if ministers change.
-- ============================================================================

CREATE TABLE IF NOT EXISTS negotiation_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id      UUID NOT NULL REFERENCES trade_negotiations(id) ON DELETE CASCADE,

    -- Sender identity
    sender_nation_id    UUID NOT NULL REFERENCES nations(id),
    sender_faction_id   UUID NOT NULL REFERENCES factions(id),
    sender_role         TEXT NOT NULL CHECK (sender_role IN ('prime_minister', 'trade_minister', 'ambassador')),
    sender_display_name TEXT NOT NULL,

    -- Content
    message_text        TEXT NOT NULL CHECK (char_length(message_text) <= 2000),
    is_system           BOOLEAN NOT NULL DEFAULT false,

    -- Timeline
    sent_at_tick        INT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Primary query path: load messages for a negotiation in chronological order
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_neg_id
    ON negotiation_messages (negotiation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_negotiation_messages_sender
    ON negotiation_messages (sender_faction_id);

-- RLS
ALTER TABLE negotiation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY negotiation_messages_select
    ON negotiation_messages FOR SELECT TO authenticated
    USING (true);

CREATE POLICY negotiation_messages_insert
    ON negotiation_messages FOR INSERT TO authenticated
    WITH CHECK (true);

-- Enable Supabase Realtime (postgres_changes subscriptions)
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_messages;
