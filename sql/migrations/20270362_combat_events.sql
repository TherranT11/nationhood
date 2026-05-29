-- ─────────────────────────────────────────────────────────────────────────────
-- Combat events — narrative log emitted by the tick combat resolver.
--
-- processCombat() (js/game/military-units.js) already advances line_position,
-- flips sector control, awards Conquest Points, and applies casualties/cohesion
-- when a side breaks on a contested front. This table is the narrative byproduct
-- of that resolution: one row per resolved engagement that moved the line, with
-- enough snapshot fields baked in that the war-room renderer never needs a join
-- to render the prose template — names, sector names, commander name are all
-- captured at write time so historical rows stay correct even if armies rename
-- or sectors get renamed via the admin upsert RPC.
--
-- Read-all RLS matches war_fronts / war_sectors / armies — combat events are
-- public record across the world. Writes go through SECURITY DEFINER tick
-- processing only (no insert/update policies — RPC-only writes).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS combat_events (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    front_id                uuid NOT NULL REFERENCES war_fronts(id) ON DELETE CASCADE,
    tick                    int  NOT NULL,
    -- 'meeting' = both sides assaulted and collided.
    -- 'breakthrough' = attacker overran a dug-in defender.
    -- Defender-holds outcomes don't move the line and don't emit (no event).
    kind                    text NOT NULL CHECK (kind IN ('meeting', 'breakthrough')),
    terrain                 text NOT NULL CHECK (terrain IN ('urban','plains','mountains','desert','jungle','coastal')),
    pressor_nation_id       uuid NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    claimant_nation_id      uuid NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    pressor_nation_name     text NOT NULL,
    claimant_nation_name    text NOT NULL,
    sector_name             text NOT NULL,
    -- NULL when the loser has fallen back past the last front sector (capital
    -- adjacent) — the renderer substitutes 'the rear' in that case.
    retreat_sector_name     text,
    army_name               text NOT NULL,
    unit_name               text NOT NULL,
    commander_name          text,
    created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combat_events_front_tick
    ON combat_events (front_id, tick DESC);

COMMENT ON TABLE combat_events IS
    'Narrative log emitted by processCombat() per resolved engagement that moved the front line. All display fields are snapshots so history reads cleanly even after later renames.';

ALTER TABLE public.combat_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS combat_events_read ON public.combat_events;
CREATE POLICY combat_events_read ON public.combat_events FOR SELECT TO authenticated USING (true);
-- No write policies: RPC / edge-function only (advance-tick uses service_role).

NOTIFY pgrst, 'reload schema';
