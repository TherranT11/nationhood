-- 20260728_fundraise_themed_events.sql
--
-- Themed fundraisers tied to voter-bloc sectors. Replaces the
-- momentum-cost path (momentum is being phased out) with a
-- popularity-only positional system:
--
--   Host bloc  →  −0.3 popularity (donor fatigue)
--   Opposition →  −0.5 popularity (optics cost)
--
-- No cash yield. The action is purely a positioning statement —
-- "I'm cozying up to bloc X, accepting the alienation cost with
-- bloc Y." The narrative says funds are being raised "for future
-- campaigns" but mechanically only popularity moves.
--
-- One use per tick (any event). Available with 0 seats — even a
-- fledgling party can host a faith rally to position itself.
--
-- Storage convention: faction_sector_popularity.popularity is integer
-- tenths (0–100 = 0.0–10.0). Deltas in this migration are in tenths.

BEGIN;


-- ── 1. fundraiser_events catalog ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fundraiser_events (
    event_key             TEXT     PRIMARY KEY,
    name                  TEXT     NOT NULL,
    icon                  TEXT     NOT NULL DEFAULT '',
    host_sector_key       TEXT     NOT NULL,
    opposition_sector_key TEXT     NOT NULL,
    display_order         SMALLINT NOT NULL DEFAULT 0,
    CHECK (host_sector_key <> opposition_sector_key)
);

ALTER TABLE public.fundraiser_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'fundraiser_events'
           AND policyname = 'Anyone can read fundraiser_events'
    ) THEN
        CREATE POLICY "Anyone can read fundraiser_events"
            ON public.fundraiser_events FOR SELECT USING (true);
    END IF;
END $$;

INSERT INTO public.fundraiser_events
    (event_key, name, icon, host_sector_key, opposition_sector_key, display_order)
VALUES
    ('corporate_gala',       'Corporate Gala',             '💼', 'CAPITAL_OWNERS_EXECUTIVES',     'SERVICE_GIG_WORKERS',            1),
    ('tech_conference',      'Tech Conference',            '💻', 'TECH_ENGINEERING_CLASS',        'RURAL_AGRICULTURAL',             2),
    ('cocktail_reception',   'Cocktail Reception',         '🍸', 'URBAN_PROFESSIONALS',           'RURAL_AGRICULTURAL',             3),
    ('union_hall_drive',     'Union Hall Drive',           '🛠', 'SKILLED_TRADES_MANUFACTURING',  'CAPITAL_OWNERS_EXECUTIVES',      4),
    ('chamber_dinner',       'Chamber of Commerce Dinner', '🏪', 'SMALL_BUSINESS_OWNERS',         'SERVICE_GIG_WORKERS',            5),
    ('faith_rally',          'Faith Rally',                '⛪', 'RELIGIOUS_CONSERVATIVES',       'CULTURAL_PRODUCERS',             6),
    ('county_fair',          'County Fair',                '🌽', 'RURAL_AGRICULTURAL',            'URBAN_PROFESSIONALS',            7),
    ('pension_hall',         'Pension Hall Luncheon',      '🏛', 'RETIREES_PENSIONERS',           'STUDENTS_YOUNG_PRECARIAT',       8),
    ('arts_benefit',         'Arts Benefit',               '🎨', 'CULTURAL_PRODUCERS',            'RELIGIOUS_CONSERVATIVES',        9),
    ('community_banquet',    'Community Banquet',          '🍲', 'IMMIGRANT_MINORITY_COMMUNITIES','RELIGIOUS_CONSERVATIVES',       10),
    ('campus_drive',         'Campus Drive',               '🎓', 'STUDENTS_YOUNG_PRECARIAT',      'CAPITAL_OWNERS_EXECUTIVES',     11),
    ('worker_solidarity',    'Worker Solidarity Drive',    '✊', 'SERVICE_GIG_WORKERS',           'SMALL_BUSINESS_OWNERS',         12)
ON CONFLICT (event_key) DO NOTHING;


-- ── 2. fundraise_themed RPC ─────────────────────────────────────
-- Validates ownership, enforces 1-per-tick cap, applies the two
-- popularity changes (host −0.3, opposition −0.5), inserts a
-- campaign_actions row + an event_log narrative entry. No cash yield.
CREATE OR REPLACE FUNCTION fundraise_themed(
    p_faction_id UUID,
    p_nation_id  UUID,
    p_event_key  TEXT,
    p_tick       INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_faction   factions%ROWTYPE;
    v_event     fundraiser_events%ROWTYPE;
    v_host      sectors%ROWTYPE;
    v_opp       sectors%ROWTYPE;
    v_use_count INTEGER;
    v_host_fatigue_tenths CONSTANT SMALLINT := 3;  -- −0.3
    v_opp_optics_tenths   CONSTANT SMALLINT := 5;  -- −0.5
    v_description TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Faction not found');
    END IF;
    IF v_faction.id <> v_user
       AND COALESCE(v_faction.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;
    -- Note: no seat check. Seatless parties can fundraise to position
    -- themselves with voter blocs ahead of their first election.

    SELECT * INTO v_event FROM fundraiser_events WHERE event_key = p_event_key;
    IF v_event.event_key IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unknown fundraiser event');
    END IF;

    -- 1-per-tick cap. Counts ALL fundraise rows (themed + legacy).
    SELECT COUNT(*) INTO v_use_count
      FROM campaign_actions
     WHERE party_id = p_faction_id
       AND action_type IN ('fundraise', 'fundraise_themed')
       AND tick_performed = p_tick;
    IF v_use_count >= 1 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'You have already hosted a fundraiser this tick. Try again next tick.');
    END IF;

    -- Look up host + opposition sector rows for this nation.
    SELECT * INTO v_host FROM sectors
     WHERE nation_id = p_nation_id
       AND sector_key = v_event.host_sector_key
       AND is_active = true
     LIMIT 1;
    IF v_host.id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'This nation does not have the host bloc seeded');
    END IF;

    SELECT * INTO v_opp FROM sectors
     WHERE nation_id = p_nation_id
       AND sector_key = v_event.opposition_sector_key
       AND is_active = true
     LIMIT 1;
    -- Opposition can be missing on custom nation loadouts; we just skip
    -- the optics hit rather than failing.

    -- Apply host fatigue (popularity in tenths, clamped [0, 100]).
    -- Upsert handles the no-row-yet case at popularity 0.
    INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
    VALUES (p_faction_id, v_host.id, GREATEST(0, LEAST(100, -v_host_fatigue_tenths)))
    ON CONFLICT (faction_id, sector_id) DO UPDATE
        SET popularity = GREATEST(0, LEAST(100,
                faction_sector_popularity.popularity - v_host_fatigue_tenths
            )),
            updated_at = NOW();

    -- Apply opposition optics (skipped if nation doesn't have the bloc).
    IF v_opp.id IS NOT NULL THEN
        INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
        VALUES (p_faction_id, v_opp.id, GREATEST(0, LEAST(100, -v_opp_optics_tenths)))
        ON CONFLICT (faction_id, sector_id) DO UPDATE
            SET popularity = GREATEST(0, LEAST(100,
                    faction_sector_popularity.popularity - v_opp_optics_tenths
                )),
                updated_at = NOW();
    END IF;

    -- Narrative for event_log + UI confirmation.
    v_description := COALESCE(v_faction.faction_name, 'The party')
                  || ' hosts a ' || v_event.name
                  || ' for ' || COALESCE(v_host.name, v_event.host_sector_key)
                  || ' to raise funds for future campaigns.';

    -- campaign_actions for the per-tick counter + audit trail.
    INSERT INTO campaign_actions
        (party_id, nation_id, action_type, ap_cost, money_cost, tick_performed, result)
    VALUES
        (p_faction_id, p_nation_id, 'fundraise_themed', 0, 0, p_tick,
         jsonb_build_object(
             'event_key',             v_event.event_key,
             'event_name',            v_event.name,
             'host_sector_key',       v_event.host_sector_key,
             'opposition_sector_key', v_event.opposition_sector_key,
             'host_fatigue_tenths',   v_host_fatigue_tenths,
             'opp_optics_tenths',     CASE WHEN v_opp.id IS NULL THEN 0 ELSE v_opp_optics_tenths END,
             'description',           v_description
         ));

    -- event_log narrative entry — visible in news feeds.
    INSERT INTO event_log
        (nation_id, faction_id, event_name, description_used,
         category, trigger_key, effects_applied, fired_at_tick)
    VALUES
        (p_nation_id, p_faction_id,
         v_event.name,
         v_description,
         'political',
         'fundraise_themed',
         jsonb_build_object(
             'event_key',             v_event.event_key,
             'host_sector_key',       v_event.host_sector_key,
             'opposition_sector_key', v_event.opposition_sector_key
         ),
         p_tick);

    RETURN jsonb_build_object(
        'success',                true,
        'event_key',              v_event.event_key,
        'event_name',             v_event.name,
        'host_sector_key',        v_event.host_sector_key,
        'opposition_sector_key',  v_event.opposition_sector_key,
        'host_fatigue_tenths',    v_host_fatigue_tenths,
        'opp_optics_tenths',      CASE WHEN v_opp.id IS NULL THEN 0 ELSE v_opp_optics_tenths END,
        'description',            v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION fundraise_themed(UUID, UUID, TEXT, INTEGER) TO authenticated;


COMMIT;

NOTIFY pgrst, 'reload schema';
