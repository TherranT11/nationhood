-- ════════════════════════════════════════════════════════════════════
-- 20270679 — Permanent Secretary (Tier 3 Civil Service)
--
-- Renames the inert Tier 3 "Deputy Minister (Civil Service)" rung
-- as Permanent Secretary and wires the promotion mechanic. PS is
-- the top of the career civil-service track — survives political
-- changes, runs a major ministry day-to-day. Apolitical promotion
-- (no dice roll, no PM approval) — meritocratic and deterministic
-- once the gates are met.
--
-- Gates:
--   • politician_skill ≥ 20 (Experience)
--   • currently Agency Head (politician_senior_civil_servant_at_
--     tick IS NOT NULL) — same ladder-strict rule as JM-requires-AH
--   • politician_ministry maps to one of the 4 majors via
--     _major_ministry_of_politician()
--   • the politician's mapped PS slot is not currently held by a
--     non-abandoned player faction in their nation
--
-- Major-ministry mapping:
--   defense              → defense
--   foreign_affairs      → foreign_affairs_and_trade
--   economic_development → economic_development
--   interior             → interior
--
-- The 4 majors are shared SoT with Deputy Minister (Tier 5,
-- coming next) — same slot vocabulary, same nation-level
-- occupancy rules. _major_ministry_keys() and _major_ministry_
-- of_politician() are reusable across both rungs.
--
-- NPC occupancy is implicit — if no player holds a slot, it's
-- conceptually NPC-held. The PM's modal will surface an
-- auto-generated NPC name (Deputy Minister work, not in this
-- migration); PS surface just needs the vacancy check.
--
-- Idempotency / race-safety:
--   • Partial unique index on factions (nation_id, politician_
--     permanent_secretary_ministry) WHERE NOT NULL ensures one
--     PS per nation-ministry even under concurrent promotion
--     attempts. Two civil servants in defense both promoting in
--     the same tick: the second hits the index violation, the
--     RPC catches it and returns a clean error.
--   • politician_career_events row stamps the event for the
--     career timeline.
--
-- Schema relaxation needed (REVOKEd from client write):
--   factions.politician_permanent_secretary_at_tick   int
--   factions.politician_permanent_secretary_ministry  text
--
-- Apply after 20270678.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. State columns on factions ─────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_permanent_secretary_at_tick  int,
    ADD COLUMN IF NOT EXISTS politician_permanent_secretary_ministry text;

COMMENT ON COLUMN public.factions.politician_permanent_secretary_at_tick IS
    'Tick at which this politician was promoted to Permanent Secretary (Tier 3 Civil Service rung, top of the career civil-service track). NULL when not serving. Set in lockstep with politician_permanent_secretary_ministry by politician_seek_permanent_secretary. 20270679.';
COMMENT ON COLUMN public.factions.politician_permanent_secretary_ministry IS
    'Which of the 4 major ministries this Permanent Secretary heads — one of _major_ministry_keys(). NULL when not serving. Same slot vocabulary as Deputy Minister (Tier 5) so PS and DM compete for the same per-nation seats. 20270679.';

REVOKE UPDATE (politician_permanent_secretary_at_tick, politician_permanent_secretary_ministry)
    ON public.factions
    FROM PUBLIC, anon, authenticated;

-- ── 2. Double-fill guard ─────────────────────────────────────────
-- One PS per (nation, ministry); partial index keeps NULL rows
-- (politicians without a PS title) freely coexisting.
CREATE UNIQUE INDEX IF NOT EXISTS factions_one_permanent_secretary_per_nation_ministry
    ON public.factions (nation_id, politician_permanent_secretary_ministry)
    WHERE politician_permanent_secretary_ministry IS NOT NULL;

-- ── 3. Major-ministry vocabulary (shared with Deputy Minister) ───
CREATE OR REPLACE FUNCTION public._major_ministry_keys()
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
    SELECT ARRAY['interior', 'defense', 'economic_development', 'foreign_affairs_and_trade']::text[];
$$;

COMMENT ON FUNCTION public._major_ministry_keys() IS
    'Single source for the 4 major ministry slugs that back the political-canopy rungs (Permanent Secretary Tier 3 + Deputy Minister Tier 5). Mirrored client-side in js/utils.js MAJOR_MINISTRY_LABEL.';

-- Map the politician''s civil-service ministry (the slug
-- politician_sit_the_exam assigns) to its major-ministry equivalent.
-- foreign_affairs collapses into the combined foreign_affairs_and_
-- trade slug; the other three are 1:1.
CREATE OR REPLACE FUNCTION public._major_ministry_of_politician(p_politician_ministry text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
    SELECT CASE p_politician_ministry
        WHEN 'defense'              THEN 'defense'
        WHEN 'foreign_affairs'      THEN 'foreign_affairs_and_trade'
        WHEN 'economic_development' THEN 'economic_development'
        WHEN 'interior'             THEN 'interior'
        ELSE NULL
    END;
$$;

COMMENT ON FUNCTION public._major_ministry_of_politician(text) IS
    'Civil-service ministry slug → major-ministry slug for PS / DM slot assignment. Returns NULL for civil servants in ministries not represented at the major-cabinet level (currently impossible since politician_sit_the_exam only assigns the 4 majors, but future-proofed).';

-- ── 4. politician_seek_permanent_secretary() ─────────────────────
CREATE OR REPLACE FUNCTION public.politician_seek_permanent_secretary()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_major         text;
    v_slot_held     boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    IF COALESCE(v_pol.politician_skill, 0) < 20 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_skill',
                                  'have', COALESCE(v_pol.politician_skill, 0), 'need', 20);
    END IF;

    -- Ladder-strict: must currently be Agency Head. Civil servants
    -- who never promoted to AH can't skip the rung.
    IF v_pol.politician_senior_civil_servant_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agency_head');
    END IF;

    IF v_pol.politician_permanent_secretary_ministry IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_permanent_secretary',
                                  'ministry', v_pol.politician_permanent_secretary_ministry);
    END IF;

    IF v_pol.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_civil_service_ministry');
    END IF;

    v_major := _major_ministry_of_politician(v_pol.politician_ministry);
    IF v_major IS NULL THEN
        -- Civil servant in a ministry not represented at major-cabinet
        -- level. Impossible today (sit_the_exam only assigns the 4
        -- majors) but defensive.
        RETURN jsonb_build_object('success', false, 'reason', 'ministry_not_eligible',
                                  'civil_service_ministry', v_pol.politician_ministry);
    END IF;

    -- Vacancy check — slot is held iff some non-abandoned player
    -- faction in this nation has politician_permanent_secretary_
    -- ministry = v_major. Implicit NPC otherwise.
    SELECT EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = v_pol.nation_id
           AND politician_permanent_secretary_ministry = v_major
           AND abandoned_at IS NULL
    ) INTO v_slot_held;
    IF v_slot_held THEN
        RETURN jsonb_build_object('success', false, 'reason', 'slot_held_by_player',
                                  'ministry', v_major);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- The UPDATE + INSERT pair is wrapped so a concurrent promotion
    -- racing onto the same (nation, ministry) slot returns a clean
    -- 'slot_held_by_player' rather than bubbling SQLSTATE 23505.
    -- The vacancy check above passes for both contenders in the
    -- worst-case interleave; the partial unique index on factions
    -- (nation_id, politician_permanent_secretary_ministry) is the
    -- final arbiter — first to UPDATE wins, second trips the index.
    BEGIN
        UPDATE factions
           SET politician_permanent_secretary_at_tick  = v_tick,
               politician_permanent_secretary_ministry = v_major
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events
            (faction_id, event_tick, event_type, target_name)
        VALUES
            (v_pol.id, v_tick, 'promoted_permanent_secretary', v_major);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'slot_held_by_player',
                                  'ministry', v_major);
    END;

    RETURN jsonb_build_object(
        'success',     true,
        'action',      'permanent_secretary',
        'promoted_at', v_tick,
        'ministry',    v_major
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_seek_permanent_secretary() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
