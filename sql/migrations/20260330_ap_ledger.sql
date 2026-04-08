-- AP Ledger: tracks AP gains and losses per faction per tick with reasons.
-- Shown in the topbar AP dropdown so players can see why their AP changed.

CREATE TABLE IF NOT EXISTS ap_ledger (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    faction_id  UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    tick        INT NOT NULL,
    delta       INT NOT NULL,           -- positive = gain, negative = loss
    reason      TEXT NOT NULL,           -- e.g. 'tick_gain', 'coalition_bonus', 'ipo_contribution', 'action_spent'
    detail      TEXT,                    -- optional human-readable detail
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ap_ledger_faction_tick
    ON ap_ledger (faction_id, tick DESC);

-- RLS: factions can only read their own ledger
ALTER TABLE ap_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ap_ledger_select" ON ap_ledger
    FOR SELECT TO authenticated
    USING (faction_id = auth.uid());

-- Service role (tick processor) can insert
CREATE POLICY "ap_ledger_insert" ON ap_ledger
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Clean up old entries (keep last 24 ticks = 2 years)
-- Run periodically or as part of tick maintenance
CREATE OR REPLACE FUNCTION cleanup_ap_ledger(p_current_tick INT)
RETURNS void LANGUAGE sql AS $$
    DELETE FROM ap_ledger WHERE tick < p_current_tick - 24;
$$;
