-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN CAREER EVENTS — politician_career_events
-- ═══════════════════════════════════════════════════════════════════════════════
-- Persistent log of lifecycle beats for a politician's career — the rows
-- that politician-home.html's "II. Career" container reads. The founding
-- event is still derived on the fly from factions.founded_tick (no row
-- needed); everything else lives here.
--
-- Event types this table accepts (others may be added later):
--   joined_party   — politician registered membership in a political party
--   founded_party  — politician established a new political party
--   joined_ngo     — politician registered membership in an NGO / union
--   founded_ngo    — politician established a new NGO / union
--
-- Deliberately omitted: dissident-group joins / founds. Underground
-- affiliations are illegal in-fiction; recording them in the public-facing
-- career log would defeat the secrecy that makes the underground arc
-- meaningful. If a separate "private dossier" log lands later, that's
-- where dissident beats belong — not here.
--
-- target_name carries the party / NGO name as plain text rather than a
-- foreign key, so the log keeps reading correctly after a party renames
-- itself or gets disbanded (the historical record needs the name as it
-- was at the event, not whatever the row currently holds).
--
-- Writes today: service_role / future SECURITY DEFINER RPCs only — there's
-- no client INSERT policy. Reads: open to any authenticated user (politician
-- careers are public).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS politician_career_events (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id  uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    event_tick  int  NOT NULL,
    event_type  text NOT NULL,
    target_name text,
    metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pol_career_events_faction
    ON politician_career_events(faction_id, event_tick DESC);

ALTER TABLE politician_career_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read" ON politician_career_events;
CREATE POLICY "Authenticated read" ON politician_career_events
    FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE politician_career_events IS
    'Persistent log of politician career beats (party joins, party founds,'
    ' NGO joins, NGO founds). Read by politician-home.html''s Career container.'
    ' Dissident affiliations are intentionally NOT logged here.';

COMMIT;
