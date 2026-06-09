-- ════════════════════════════════════════════════════════════════════
-- 20270742 — City ordinances: propose / vote / resolve / display
--
-- Second of two commits implementing the ordinance system. The 20270739
-- foundation shipped the global authoring catalog + create RPC; this
-- one wires the end-to-end propose → vote → resolve → apply flow that
-- turns templates into live mechanics:
--
--   1. A Mayor proposes a template against their city (enact or
--      rescind kind). Server snapshots the call into a
--      city_ordinance_proposals row + immediately computes NPC
--      council-seat votes from archetype alignment.
--   2. PC seat holders see a vote prompt; YES/NO via RPC.
--   3. At resolve_tick (proposed_at + 1) the resolve RPC tallies
--      votes (PC abstains excluded; tie broken by the President's
--      vote when present). On pass: apply each stat_effect to the
--      city (clamped 1-10), deduct cost from budget (clamped >= 0;
--      negative cost ADDS to budget), insert a city_ordinances row
--      or flip the existing one to 'rescinded', then award
--      +1 Experience to the Mayor + +0.5 popularity to every party
--      in this nation whose archetype matches a support archetype +
--      +0.3 extra to the Mayor's party.
--   4. city.html's Voting Agenda + Active Ordinances sections
--      render from city_ordinance_proposals + city_ordinances.
--
-- User-confirmed design choices reapplied:
--   • All 4 council seats vote, simple majority, CCP (seat 0)
--     breaks ties.
--   • Mayor does NOT vote on the city council.
--   • Resolution is fire-and-forget on page load (no auto-tick
--     trigger added). resolve_due_city_ordinance_proposals is
--     parameterless and idempotent — repeated calls are no-ops.
--
-- Three tables, four RPCs, RLS for each. Body is long but the
-- pieces are linear: tables → list RPC → propose RPC → vote RPC
-- → resolve RPC. Comments inline at each block.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. SCHEMA
-- ════════════════════════════════════════════════════════════════════

-- ── city_ordinance_proposals: in-flight votes ───────────────────────
CREATE TABLE IF NOT EXISTS public.city_ordinance_proposals (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id             uuid NOT NULL REFERENCES public.cities(id)     ON DELETE CASCADE,
    ordinance_id        uuid NOT NULL REFERENCES public.ordinances(id) ON DELETE CASCADE,
    kind                text NOT NULL CHECK (kind IN ('enact', 'rescind')),
    proposer_faction_id uuid REFERENCES public.factions(id)            ON DELETE SET NULL,
    status              text NOT NULL DEFAULT 'voting'
                              CHECK (status IN ('voting', 'passed', 'rejected')),
    proposed_at_tick    int  NOT NULL,
    resolve_tick        int  NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS city_ordinance_proposals_city_idx
    ON public.city_ordinance_proposals (city_id, status);
CREATE INDEX IF NOT EXISTS city_ordinance_proposals_resolve_idx
    ON public.city_ordinance_proposals (resolve_tick)
    WHERE status = 'voting';

-- At most one open proposal per (city, ordinance) at a time. Stops
-- a Mayor from spamming the same proposal repeatedly while it's
-- already being voted on.
CREATE UNIQUE INDEX IF NOT EXISTS city_ordinance_proposals_one_open
    ON public.city_ordinance_proposals (city_id, ordinance_id)
    WHERE status = 'voting';

COMMENT ON TABLE public.city_ordinance_proposals IS
    'In-flight ordinance votes per city (20270742). Status voting → passed/rejected. resolve_tick = proposed_at_tick + 1; resolve_due_city_ordinance_proposals tallies votes + applies effects.';

ALTER TABLE public.city_ordinance_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS city_ordinance_proposals_select ON public.city_ordinance_proposals;
CREATE POLICY city_ordinance_proposals_select ON public.city_ordinance_proposals
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS city_ordinance_proposals_service_all ON public.city_ordinance_proposals;
CREATE POLICY city_ordinance_proposals_service_all ON public.city_ordinance_proposals
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── city_ordinance_proposal_votes: per-seat record ──────────────────
-- One row per council seat per proposal. NPC seats get rows at
-- propose time (deterministic from archetype alignment); PC seats
-- get rows when the player casts a vote. PK on (proposal_id,
-- seat_idx) so a seat can't double-vote.
CREATE TABLE IF NOT EXISTS public.city_ordinance_proposal_votes (
    proposal_id      uuid NOT NULL REFERENCES public.city_ordinance_proposals(id) ON DELETE CASCADE,
    seat_idx         int  NOT NULL CHECK (seat_idx BETWEEN 0 AND 3),
    voter_faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    vote             text NOT NULL CHECK (vote IN ('yes', 'no')),
    is_npc           boolean NOT NULL,
    voted_at_tick    int  NOT NULL,
    PRIMARY KEY (proposal_id, seat_idx)
);

COMMENT ON TABLE public.city_ordinance_proposal_votes IS
    'Per-seat vote record on a city ordinance proposal (20270742). seat_idx 0 = President, 1-3 = members. NPC votes inserted at propose time by propose_city_ordinance; PC votes via vote_on_city_ordinance. Missing rows on resolve = PC abstain (excluded from tally).';

ALTER TABLE public.city_ordinance_proposal_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS city_ordinance_proposal_votes_select ON public.city_ordinance_proposal_votes;
CREATE POLICY city_ordinance_proposal_votes_select ON public.city_ordinance_proposal_votes
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS city_ordinance_proposal_votes_service_all ON public.city_ordinance_proposal_votes;
CREATE POLICY city_ordinance_proposal_votes_service_all ON public.city_ordinance_proposal_votes
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── city_ordinances: enacted instances per city ─────────────────────
CREATE TABLE IF NOT EXISTS public.city_ordinances (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id                   uuid NOT NULL REFERENCES public.cities(id)     ON DELETE CASCADE,
    ordinance_id              uuid NOT NULL REFERENCES public.ordinances(id) ON DELETE CASCADE,
    status                    text NOT NULL DEFAULT 'active'
                                    CHECK (status IN ('active', 'rescinded')),
    enacted_at_tick           int  NOT NULL,
    enacted_via_proposal_id   uuid REFERENCES public.city_ordinance_proposals(id) ON DELETE SET NULL,
    rescinded_at_tick         int,
    rescinded_via_proposal_id uuid REFERENCES public.city_ordinance_proposals(id) ON DELETE SET NULL,
    created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS city_ordinances_city_idx
    ON public.city_ordinances (city_id, status);

-- At most one ACTIVE instance per (city, ordinance) — rescinded rows
-- accumulate as history.
CREATE UNIQUE INDEX IF NOT EXISTS city_ordinances_one_active
    ON public.city_ordinances (city_id, ordinance_id)
    WHERE status = 'active';

COMMENT ON TABLE public.city_ordinances IS
    'Enacted ordinance instances per city (20270742). status=active rows are the ones currently affecting the city; status=rescinded rows are history.';

ALTER TABLE public.city_ordinances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS city_ordinances_select ON public.city_ordinances;
CREATE POLICY city_ordinances_select ON public.city_ordinances
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS city_ordinances_service_all ON public.city_ordinances;
CREATE POLICY city_ordinances_service_all ON public.city_ordinances
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════════
-- 2. list_ordinances_for_city — catalog enriched with per-city flag
-- ════════════════════════════════════════════════════════════════════
-- Returns the full catalog with two per-city flags so the Propose
-- modal can:
--   • Show active-in-this-city ordinances at the top
--   • Show open-proposal-in-flight ones as disabled (can't double-
--     propose)
-- Both flags are cheap LEFT JOINs against the city's rows.
CREATE OR REPLACE FUNCTION public.list_ordinances_for_city(p_city_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_list    jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',                  o.id,
        'name',                o.name,
        'description',         o.description,
        'cost',                o.cost,
        'support_archetypes',  o.support_archetypes,
        'oppose_archetypes',   o.oppose_archetypes,
        'stat_effects',        o.stat_effects,
        'created_at_tick',     o.created_at_tick,
        'is_active_here',      (act.id IS NOT NULL),
        'has_open_proposal',   (prop.id IS NOT NULL)
    ) ORDER BY (act.id IS NOT NULL) DESC, o.created_at DESC), '[]'::jsonb)
      INTO v_list
      FROM public.ordinances o
      LEFT JOIN public.city_ordinances act
             ON act.city_id      = p_city_id
            AND act.ordinance_id = o.id
            AND act.status       = 'active'
      LEFT JOIN public.city_ordinance_proposals prop
             ON prop.city_id      = p_city_id
            AND prop.ordinance_id = o.id
            AND prop.status       = 'voting';

    RETURN jsonb_build_object('success', true, 'ordinances', v_list);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_ordinances_for_city(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_ordinances_for_city(uuid) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 3. propose_city_ordinance — create proposal + NPC votes
-- ════════════════════════════════════════════════════════════════════
-- Caller must be a sitting Mayor of p_city_id. Creates a city
-- _ordinance_proposals row + computes NPC council-seat votes
-- immediately based on archetype alignment:
--   • Seat archetype in ordinance.support_archetypes → YES
--   • Seat archetype in ordinance.oppose_archetypes  → NO
--   • Otherwise                                       → random 50/50
-- PC seats (holder_faction_id IS NOT NULL) skip — they vote
-- explicitly via vote_on_city_ordinance.
--
-- Kind = 'enact' or 'rescind'. Enact requires ordinance NOT active
-- in the city; rescind requires it IS active. Both reject if a
-- prior proposal for the same (city, ordinance) is still voting
-- (caught by the unique partial index too, but surfaced as a
-- friendly reason code).
CREATE OR REPLACE FUNCTION public.propose_city_ordinance(
    p_faction_id   uuid,
    p_city_id      uuid,
    p_ordinance_id uuid,
    p_kind         text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_city      cities%ROWTYPE;
    v_ord       ordinances%ROWTYPE;
    v_tick      int;
    v_kind      text;
    v_already   boolean;
    v_open      boolean;
    v_id        uuid;
    v_seat      jsonb;
    v_seat_idx  int;
    v_arch      text;
    v_vote      text;
    v_is_pc     boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_city_id IS NULL OR p_ordinance_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    v_kind := COALESCE(p_kind, 'enact');
    IF v_kind NOT IN ('enact', 'rescind') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_kind');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office <> 'mayor' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mayor');
    END IF;

    -- Shared per-tick lock — Propose burns the same next_member
    -- _action_tick as Collect Taxes + Campaign + Door Knocking +
    -- Give a Speech. "Pick one each tick" stays honest.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;
    -- Caller must be THIS city's mayor — matches the resolver stamp
    -- shape (mayor_first/last/party).
    IF v_city.nation_id IS DISTINCT FROM v_pol.nation_id
       OR v_city.mayor_first_name IS DISTINCT FROM v_pol.leader_first_name
       OR v_city.mayor_last_name  IS DISTINCT FROM v_pol.leader_last_name
       OR v_city.mayor_party_id IS DISTINCT FROM v_pol.politician_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_this_citys_mayor');
    END IF;

    SELECT * INTO v_ord FROM ordinances WHERE id = p_ordinance_id;
    IF v_ord.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'ordinance_not_found');
    END IF;

    -- Already-active and open-proposal gates.
    SELECT EXISTS (
        SELECT 1 FROM city_ordinances
         WHERE city_id      = p_city_id
           AND ordinance_id = p_ordinance_id
           AND status       = 'active'
    ) INTO v_already;
    SELECT EXISTS (
        SELECT 1 FROM city_ordinance_proposals
         WHERE city_id      = p_city_id
           AND ordinance_id = p_ordinance_id
           AND status       = 'voting'
    ) INTO v_open;

    IF v_open THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_in_flight');
    END IF;
    IF v_kind = 'enact' AND v_already THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_active');
    END IF;
    IF v_kind = 'rescind' AND NOT v_already THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_active');
    END IF;

    -- Insert the proposal — resolve_tick = next tick.
    INSERT INTO city_ordinance_proposals (
        city_id, ordinance_id, kind, proposer_faction_id,
        status, proposed_at_tick, resolve_tick
    ) VALUES (
        p_city_id, p_ordinance_id, v_kind, v_pol.id,
        'voting', v_tick, v_tick + 1
    )
    RETURNING id INTO v_id;

    -- Walk the council (jsonb array) and compute NPC votes by
    -- archetype alignment. PC seats (holder_faction_id present)
    -- skip — they vote later. Seat index maps from the seat name:
    -- 'president' → 0, 'member_1' → 1, etc.
    IF v_city.council IS NOT NULL THEN
        FOR v_seat IN SELECT * FROM jsonb_array_elements(v_city.council)
        LOOP
            v_seat_idx := CASE v_seat->>'seat'
                              WHEN 'president' THEN 0
                              WHEN 'member_1'  THEN 1
                              WHEN 'member_2'  THEN 2
                              WHEN 'member_3'  THEN 3
                              ELSE NULL
                          END;
            IF v_seat_idx IS NULL THEN
                CONTINUE;
            END IF;

            v_is_pc := (v_seat->>'holder_faction_id') IS NOT NULL;
            IF v_is_pc THEN
                CONTINUE;  -- PC votes via vote_on_city_ordinance
            END IF;

            v_arch := v_seat->>'archetype';
            IF v_arch IS NULL THEN
                v_vote := CASE WHEN random() < 0.5 THEN 'yes' ELSE 'no' END;
            ELSIF v_arch = ANY(v_ord.support_archetypes) THEN
                v_vote := 'yes';
            ELSIF v_arch = ANY(v_ord.oppose_archetypes) THEN
                v_vote := 'no';
            ELSE
                v_vote := CASE WHEN random() < 0.5 THEN 'yes' ELSE 'no' END;
            END IF;

            INSERT INTO city_ordinance_proposal_votes (
                proposal_id, seat_idx, voter_faction_id,
                vote, is_npc, voted_at_tick
            ) VALUES (
                v_id, v_seat_idx, NULL,
                v_vote, true, v_tick
            );
        END LOOP;
    END IF;

    -- Burn the shared per-tick action lock.
    UPDATE factions
       SET next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',         true,
        'proposal_id',     v_id,
        'resolve_tick',    v_tick + 1,
        'next_action_tick',v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.propose_city_ordinance(uuid, uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.propose_city_ordinance(uuid, uuid, uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 4. vote_on_city_ordinance — PC vote
-- ════════════════════════════════════════════════════════════════════
-- PC seat holder casts a yes/no on an open proposal in their city.
-- Validates caller holds a council seat in the proposal's city and
-- hasn't already voted. Uses ON CONFLICT DO NOTHING via the seat-
-- idx PK so a race between two tabs surfaces as success on both
-- (first write wins).
CREATE OR REPLACE FUNCTION public.vote_on_city_ordinance(
    p_faction_id  uuid,
    p_proposal_id uuid,
    p_vote        text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_prop      city_ordinance_proposals%ROWTYPE;
    v_city      cities%ROWTYPE;
    v_tick      int;
    v_vote      text;
    v_seat      jsonb;
    v_seat_idx  int := NULL;
    v_already   boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    v_vote := COALESCE(p_vote, '');
    IF v_vote NOT IN ('yes', 'no') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_vote');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_prop FROM city_ordinance_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.status <> 'voting' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_closed');
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = v_prop.city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- Find which seat the caller holds in this city, if any.
    IF v_city.council IS NOT NULL THEN
        FOR v_seat IN SELECT * FROM jsonb_array_elements(v_city.council)
        LOOP
            IF (v_seat->>'holder_faction_id') = v_pol.id::text THEN
                v_seat_idx := CASE v_seat->>'seat'
                                  WHEN 'president' THEN 0
                                  WHEN 'member_1'  THEN 1
                                  WHEN 'member_2'  THEN 2
                                  WHEN 'member_3'  THEN 3
                              END;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    IF v_seat_idx IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_seat_holder');
    END IF;

    -- Did this seat already vote? Check before insert so we can
    -- return a friendlier reason than the ON CONFLICT no-op.
    SELECT EXISTS (
        SELECT 1 FROM city_ordinance_proposal_votes
         WHERE proposal_id = p_proposal_id
           AND seat_idx    = v_seat_idx
    ) INTO v_already;
    IF v_already THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_voted');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO city_ordinance_proposal_votes (
        proposal_id, seat_idx, voter_faction_id,
        vote, is_npc, voted_at_tick
    ) VALUES (
        p_proposal_id, v_seat_idx, v_pol.id,
        v_vote, false, v_tick
    )
    ON CONFLICT (proposal_id, seat_idx) DO NOTHING;

    RETURN jsonb_build_object(
        'success',  true,
        'seat_idx', v_seat_idx,
        'vote',     v_vote
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.vote_on_city_ordinance(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.vote_on_city_ordinance(uuid, uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 5. resolve_due_city_ordinance_proposals — tally + apply
-- ════════════════════════════════════════════════════════════════════
-- Idempotent sweep: for every voting proposal whose resolve_tick has
-- passed, tally votes and apply pass/fail. Called fire-and-forget
-- from politician-home + city.html on page load.
--
-- Tally rule (per user spec): all 4 seats vote, simple majority,
-- CCP (seat 0) breaks ties. PC abstains (missing rows) are excluded.
-- Ties resolved by President's vote if present; if absent → fails.
--
-- On PASS:
--   • Apply each stat_effect to city.<key>, clamped 1..10.
--   • Deduct cost from city.budget, clamped >= 0 (negative cost
--     adds to budget).
--   • Insert/update city_ordinances:
--       kind='enact'    → new row status='active'
--       kind='rescind'  → flip existing row to status='rescinded'
--   • +1 politician_skill to the Mayor of this city.
--   • +0.5 popularity_pct to every party in the city's nation whose
--     archetype is in support_archetypes (capped by popularity
--     _cap_pct, floored at 0).
--   • +0.3 popularity_pct EXTRA to the Mayor's party (on top of
--     the +0.5 if it qualifies).
-- On FAIL: just flip status='rejected'. No side effects.
CREATE OR REPLACE FUNCTION public.resolve_due_city_ordinance_proposals()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick        int;
    v_prop        RECORD;
    v_yes         int;
    v_no          int;
    v_pres_vote   text;
    v_passed      boolean;
    v_ord         ordinances%ROWTYPE;
    v_city        cities%ROWTYPE;
    v_eff         jsonb;
    v_key         text;
    v_delta       int;
    v_new_val     int;
    v_mayor       factions%ROWTYPE;
    v_resolved    int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_prop IN
        SELECT * FROM city_ordinance_proposals
         WHERE status = 'voting'
           AND resolve_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        SELECT COUNT(*) FILTER (WHERE vote = 'yes'),
               COUNT(*) FILTER (WHERE vote = 'no')
          INTO v_yes, v_no
          FROM city_ordinance_proposal_votes
         WHERE proposal_id = v_prop.id;

        IF v_yes > v_no THEN
            v_passed := true;
        ELSIF v_yes < v_no THEN
            v_passed := false;
        ELSE
            -- Tie. President (seat 0) breaks. Missing CCP vote =
            -- fail (defensive default — no rescue without a present
            -- tiebreaker). COALESCE collapses NULL = 'yes' → NULL
            -- into explicit false; without it the downstream
            -- `IF NOT v_passed` would treat NULL as "not true" but
            -- ALSO not enter the rejected branch (IF NULL is false),
            -- silently falling through to PASS.
            SELECT vote INTO v_pres_vote
              FROM city_ordinance_proposal_votes
             WHERE proposal_id = v_prop.id AND seat_idx = 0;
            v_passed := COALESCE(v_pres_vote = 'yes', false);
        END IF;

        IF NOT v_passed THEN
            UPDATE city_ordinance_proposals
               SET status = 'rejected'
             WHERE id = v_prop.id;
            v_resolved := v_resolved + 1;
            CONTINUE;
        END IF;

        -- ── PASS path ──
        SELECT * INTO v_ord  FROM ordinances WHERE id = v_prop.ordinance_id;
        SELECT * INTO v_city FROM cities     WHERE id = v_prop.city_id;
        IF v_ord.id IS NULL OR v_city.id IS NULL THEN
            -- Template or city was deleted between propose and
            -- resolve. Reject the proposal as a no-op so we don't
            -- try to apply against missing data.
            UPDATE city_ordinance_proposals
               SET status = 'rejected'
             WHERE id = v_prop.id;
            v_resolved := v_resolved + 1;
            CONTINUE;
        END IF;

        IF v_prop.kind = 'enact' THEN
            -- Apply each stat effect, clamped 1..10.
            FOR v_eff IN SELECT * FROM jsonb_array_elements(v_ord.stat_effects)
            LOOP
                v_key   := v_eff->>'key';
                v_delta := (v_eff->>'delta')::int;
                IF v_key IS NULL OR v_delta IS NULL THEN
                    CONTINUE;
                END IF;
                EXECUTE format(
                    'UPDATE cities SET %I = GREATEST(1, LEAST(10, COALESCE(%I, 5) + $1)) WHERE id = $2',
                    v_key, v_key
                ) USING v_delta, v_city.id;
            END LOOP;

            -- Budget: deduct cost (negative cost ADDS to budget).
            -- Clamp >= 0 only — no upper cap per 20270738.
            UPDATE cities
               SET budget = GREATEST(0, COALESCE(budget, 0) - v_ord.cost)
             WHERE id = v_city.id;

            -- Record the enactment.
            INSERT INTO city_ordinances (
                city_id, ordinance_id, status,
                enacted_at_tick, enacted_via_proposal_id
            ) VALUES (
                v_city.id, v_ord.id, 'active',
                v_tick, v_prop.id
            );
        ELSE  -- rescind
            UPDATE city_ordinances
               SET status                    = 'rescinded',
                   rescinded_at_tick         = v_tick,
                   rescinded_via_proposal_id = v_prop.id
             WHERE city_id      = v_city.id
               AND ordinance_id = v_ord.id
               AND status       = 'active';
            -- Note: V1 does NOT reverse the stat changes on rescind —
            -- the city keeps the new baseline. The user can revisit
            -- with explicit re-enactment of the inverse if needed.
            -- Filed.
        END IF;

        -- Mayor rewards: +1 Experience.
        SELECT * INTO v_mayor FROM factions
         WHERE faction_type = 'politician'
           AND abandoned_at IS NULL
           AND nation_id          = v_city.nation_id
           AND leader_first_name  = v_city.mayor_first_name
           AND leader_last_name   = v_city.mayor_last_name
           AND politician_party_id IS NOT DISTINCT FROM v_city.mayor_party_id
         LIMIT 1;
        IF v_mayor.id IS NOT NULL THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 0) + 1
             WHERE id = v_mayor.id;
        END IF;

        -- Party rewards (only on ENACT pass — rescind doesn't
        -- distribute popularity since the ordinance is being
        -- removed, not endorsed).
        IF v_prop.kind = 'enact' THEN
            -- +0.5 popularity_pct to every party in this nation
            -- whose archetype is in support_archetypes. Clamped to
            -- popularity_cap_pct.
            UPDATE factions
               SET popularity_pct = LEAST(
                       COALESCE(popularity_cap_pct, 100),
                       GREATEST(0, COALESCE(popularity_pct, 0) + 0.5)
                   )
             WHERE faction_type = 'movement_party'
               AND abandoned_at IS NULL
               AND nation_id    = v_city.nation_id
               AND archetype    = ANY(v_ord.support_archetypes);

            -- +0.3 extra to the Mayor's party (regardless of
            -- archetype alignment). Same clamp rule.
            IF v_mayor.politician_party_id IS NOT NULL THEN
                UPDATE factions
                   SET popularity_pct = LEAST(
                           COALESCE(popularity_cap_pct, 100),
                           GREATEST(0, COALESCE(popularity_pct, 0) + 0.3)
                       )
                 WHERE id = v_mayor.politician_party_id
                   AND faction_type = 'movement_party'
                   AND abandoned_at IS NULL;
            END IF;
        END IF;

        UPDATE city_ordinance_proposals
           SET status = 'passed'
         WHERE id = v_prop.id;
        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'resolved', v_resolved);
END $$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_city_ordinance_proposals() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_city_ordinance_proposals() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
