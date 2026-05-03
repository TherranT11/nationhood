-- 20260805_fundraise_yield_and_rename.sql
--
-- Adds a cash yield to the themed fundraiser action for every event
-- EXCEPT the Corporate Gala. Reverses the "no cash yield" decision
-- from 20260728 — parties needed an active cash pipeline beyond
-- the lobbyist political-donation flow (which only triggers when a
-- corp player chooses to give). Corporate Gala stays cashless
-- because corp players already donate to parties via that pipeline,
-- and corps are the bloc this event courts (CAPITAL_OWNERS_EXECUTIVES)
-- — yielding cash here would double-pipeline the same money.
--
-- Yield equation:
--   yield = $25,000 × your_popularity_with_host (0–10) × host_weight (1–3)
--
-- Stored popularity is integer tenths (0–100), so the SQL form is:
--   yield = 25000 × (popularity / 10) × weight
--         = 2500  × popularity_tenths × weight
--
-- Examples:
--   pop 4.5, weight 2  →  $225,000
--   pop 10.0, weight 3 →  $750,000
--   pop 0,   any w     →  $0  (you can still host but get nothing)
--
-- Yield is computed from the pre-fatigue popularity (the rapport
-- you brought INTO the event), then the −0.3 host fatigue is applied
-- after. Cost stays whether or not the event yields.
--
-- Yield is added to factions.party_funds (parties only — fundraise
-- is a leader action, not a corp action).
--
-- Idempotent (CREATE OR REPLACE + UPDATE WHERE name <> ...).

BEGIN;


-- ── 1. Catalog rename: Wall Street Gala → Corporate Gala ─────────
-- The migration source has always said 'Corporate Gala', but
-- production was seeded earlier with 'Wall Street Gala'. Aligning
-- the name. Idempotent.
UPDATE public.fundraiser_events
   SET name = 'Corporate Gala'
 WHERE event_key = 'corporate_gala'
   AND name <> 'Corporate Gala';


-- ── 2. fundraise_themed RPC: now yields cash (except corporate_gala) ──
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
    v_yield_base          CONSTANT BIGINT   := 25000;  -- $25k per pop-point per weight
    v_host_pop_tenths     INTEGER := 0;
    v_yield               BIGINT  := 0;
    v_yields_cash         BOOLEAN := false;
    v_description         TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id FOR UPDATE;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Faction not found');
    END IF;
    IF v_faction.id <> v_user
       AND COALESCE(v_faction.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction');
    END IF;

    SELECT * INTO v_event FROM fundraiser_events WHERE event_key = p_event_key;
    IF v_event.event_key IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unknown fundraiser event');
    END IF;

    -- 1-per-tick cap.
    SELECT COUNT(*) INTO v_use_count
      FROM campaign_actions
     WHERE party_id = p_faction_id
       AND action_type IN ('fundraise', 'fundraise_themed')
       AND tick_performed = p_tick;
    IF v_use_count >= 1 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'You have already hosted a fundraiser this tick. Try again next tick.');
    END IF;

    -- Look up host + opposition sectors.
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

    -- Read host popularity BEFORE applying fatigue. Yield is based on
    -- the rapport the party brought into the event; the fatigue is
    -- the cost of having held it.
    SELECT COALESCE(popularity, 0) INTO v_host_pop_tenths
      FROM faction_sector_popularity
     WHERE faction_id = p_faction_id
       AND sector_id  = v_host.id;
    v_host_pop_tenths := COALESCE(v_host_pop_tenths, 0);

    -- Compute yield. Corporate Gala is excluded — corps already
    -- donate to parties via the lobbyist political-donation pipeline.
    v_yields_cash := (v_event.event_key <> 'corporate_gala');
    IF v_yields_cash THEN
        v_yield := (v_yield_base / 10)::BIGINT
                 * v_host_pop_tenths
                 * GREATEST(1, COALESCE(v_host.weight, 1));
    END IF;

    -- Apply host fatigue.
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

    -- Add yield to party_funds (parties only; corp actions don't fundraise).
    IF v_yield > 0 THEN
        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + v_yield
         WHERE id = p_faction_id;
    END IF;

    -- Narrative for event_log + UI confirmation.
    v_description := COALESCE(v_faction.faction_name, 'The party')
                  || ' hosts a ' || v_event.name
                  || ' for ' || COALESCE(v_host.name, v_event.host_sector_key)
                  || CASE WHEN v_yield > 0
                          THEN ', raising $' || to_char(v_yield, 'FM999,999,999,999') || ' for the campaign.'
                          ELSE ' to position ahead of future campaigns.'
                     END;

    -- campaign_actions audit row.
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
             'host_pop_tenths',       v_host_pop_tenths,
             'host_weight',           COALESCE(v_host.weight, 1),
             'yield',                 v_yield,
             'description',           v_description
         ));

    -- event_log narrative entry.
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
             'opposition_sector_key', v_event.opposition_sector_key,
             'yield',                 v_yield
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
        'host_pop_tenths',        v_host_pop_tenths,
        'host_weight',            COALESCE(v_host.weight, 1),
        'yield',                  v_yield,
        'description',            v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION fundraise_themed(UUID, UUID, TEXT, INTEGER) TO authenticated;


COMMIT;

NOTIFY pgrst, 'reload schema';
