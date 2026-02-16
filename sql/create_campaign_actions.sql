-- Create campaign_actions table if it doesn't exist.
-- This table logs all faction/party actions (policy platform, polls, rallies, etc.)
-- and is used for cooldown enforcement and the Recent Actions feed.
--
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS campaign_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id        UUID NOT NULL,
    nation_id       UUID,
    action_type     TEXT NOT NULL,
    ap_cost         INT,
    money_cost      INT,
    tick_performed  INT,
    result          JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_actions_party_id
    ON campaign_actions(party_id);

CREATE INDEX IF NOT EXISTS idx_campaign_actions_party_type
    ON campaign_actions(party_id, action_type);

-- Ensure RLS is enabled and permissive policies exist
ALTER TABLE campaign_actions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_actions' AND policyname = 'Allow select for all') THEN
        CREATE POLICY "Allow select for all" ON campaign_actions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_actions' AND policyname = 'Allow insert for all') THEN
        CREATE POLICY "Allow insert for all" ON campaign_actions FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_actions' AND policyname = 'Allow update for all') THEN
        CREATE POLICY "Allow update for all" ON campaign_actions FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_actions' AND policyname = 'Allow delete for all') THEN
        CREATE POLICY "Allow delete for all" ON campaign_actions FOR DELETE USING (true);
    END IF;
END $$;
