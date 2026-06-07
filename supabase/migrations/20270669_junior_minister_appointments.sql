-- ════════════════════════════════════════════════════════════════════
-- 20270669 — Junior Minister appointments
--
-- Adds a new political-career rung parallel to Agency Head (Tier 2 of
-- the Civil Service ladder, 20270634). Five portfolios — sports,
-- culture, communications, tourism, housing — each held by at most
-- one politician per nation. Skill ≥ 20 to apply, and the applicant
-- must currently be an Agency Head (politician_senior_civil_servant_
-- at_tick set) — the career ladder is strict: Civil Servant → Agency
-- Head → Junior Minister.
--
-- The portfolio set is the player-facing spec, not a free-text
-- field. CHECK constraint on politician_junior_appointments.portfolio
-- is the SoT — the RPCs validate against the same list with a
-- friendlier error before that constraint can fire.
--
-- Two resolution paths share one RPC. The branch is hidden from the
-- caller; the client always invokes politician_seek_junior_
-- appointment(p_portfolio).
--
--   1. Player Prime Minister. The nation's active head_of_government
--      row's candidate_id maps to a faction owned by a real user
--      (linked_user_id IS NOT NULL). The application sits as
--      status='pending' until the PM calls politician_decide_junior_
--      appointment() to APPOINT or REJECT. Pending rows surface in
--      the PM's Pressing Issues feed via a follow-up client-side
--      query — this migration only lands the data shape + RPCs.
--
--   2. NPC Prime Minister. politician_seek_junior_appointment() rolls
--      1d20 + skill_mod + reputation_mod + alignment_mod in the same
--      transaction, applies the outcome, and returns the breakdown
--      so the client can render the dice math in a result modal.
--
--      d20            : random 1–20
--      skill_mod      : floor(politician_skill / 5)   — 20 Skill → +4
--      reputation_mod : floor(reputation / 5), clamped at +10
--      alignment_mod  : +5  if your party leads the government
--                       +2  if your party is in the ruling coalition
--                       -3  if opposition (party exists, not coalition)
--                       -5  if independent (no party)
--
--      Outcome bands (total):
--          ≥ 22  APPOINTED   +2 Reputation (the press writes nicely)
--          16–21 REJECTED    no stat penalty   6-tick cooldown
--          10–15 REJECTED    -1 Influence       6-tick cooldown
--          ≤  9  HUMILIATED  -2 Reputation, -1 Influence  12-tick cooldown
--
-- Schema mirrors Agency Head (20270634):
--   factions.politician_junior_minister_at_tick           int
--   factions.politician_junior_portfolio                  text
--   factions.politician_seek_appointment_cooldown_until_tick int
--   politician_junior_appointments                        new (audit + queue)
--
-- Double-fill protection: a partial unique index on factions
-- (nation_id, politician_junior_portfolio) where NOT NULL — so two
-- near-simultaneous rolls cannot both seat the same portfolio. The
-- RPC also re-checks vacancy under SELECT FOR UPDATE on the
-- head_of_government row for the nation, which serialises the
-- branch on PM identity.
--
-- Ideology bonus deferred. The user's spec listed a +/- alignment_mod
-- for ideology match vs. HoG.ideology; the head_of_government table
-- stores a text ideology slug but the politician side stores four
-- axis values (ideology_value_1..4), and the comparator isn't
-- decided. Slot is reserved in the breakdown JSON
-- (`ideology_mod: 0`) so a follow-up migration can wire it without
-- breaking existing callers.
--
-- Apply after 20270668.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Portfolio whitelist as a SQL helper ────────────────────────
-- Keeping the list in one place so the CHECK constraint, the seek
-- RPC, and any future career-timeline query share the same SoT. If
-- this list ever changes, this function is the only edit.
CREATE OR REPLACE FUNCTION public._junior_portfolio_keys()
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
    SELECT ARRAY['sports', 'culture', 'communications', 'tourism', 'housing']::text[];
$$;

-- ── 2. State columns on factions ──────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_junior_minister_at_tick           int,
    ADD COLUMN IF NOT EXISTS politician_junior_portfolio                  text,
    ADD COLUMN IF NOT EXISTS politician_seek_appointment_cooldown_until_tick int;

COMMENT ON COLUMN public.factions.politician_junior_minister_at_tick IS
    'Tick at which this politician was appointed Junior Minister (Tier 3 career rung). NULL when not serving. Set in lockstep with politician_junior_portfolio by politician_seek_junior_appointment (NPC path) or politician_decide_junior_appointment (player-HoG path). Cleared on resignation / removal / general election. 20270669.';
COMMENT ON COLUMN public.factions.politician_junior_portfolio IS
    'Which Junior Minister portfolio this politician currently holds (one of _junior_portfolio_keys()). NULL when not serving. Bound to politician_junior_minister_at_tick — both set / cleared together. 20270669.';
COMMENT ON COLUMN public.factions.politician_seek_appointment_cooldown_until_tick IS
    'Tick at which a rejected Junior Minister applicant can apply again. 6 ticks after a soft / hard rejection; 12 ticks after humiliation. NULL = no cooldown active. 20270669.';

REVOKE UPDATE (politician_junior_minister_at_tick, politician_junior_portfolio, politician_seek_appointment_cooldown_until_tick)
    ON public.factions
    FROM PUBLIC, anon, authenticated;

-- Double-fill guard. One politician per (nation, portfolio); the
-- partial index lets NULL rows coexist freely. Two near-simultaneous
-- appointments can't both land — the second one's INSERT … SET
-- portfolio_columns transaction trips the index.
CREATE UNIQUE INDEX IF NOT EXISTS factions_one_junior_per_nation_portfolio
    ON public.factions (nation_id, politician_junior_portfolio)
    WHERE politician_junior_portfolio IS NOT NULL;

-- ── 3. Audit + queue table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.politician_junior_appointments (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_faction_id  uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    target_nation_id      uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    portfolio             text NOT NULL CHECK (portfolio = ANY(public._junior_portfolio_keys())),
    submitted_tick        int  NOT NULL,
    status                text NOT NULL CHECK (status IN ('pending', 'appointed', 'rejected', 'humiliated')),
    resolved_tick         int,
    decided_by_path       text CHECK (decided_by_path IS NULL OR decided_by_path IN ('player_hog', 'npc_roll')),
    decided_by_faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    roll_total            int,
    roll_breakdown        jsonb,
    created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.politician_junior_appointments IS
    'Audit + queue for Junior Minister applications. Pending rows surface in the player-HoG''s Pressing Issues feed; resolved rows are the career-history record. NPC-resolved rows carry roll_total + roll_breakdown for the dice-math modal. 20270669.';

-- One pending application at a time per applicant. The partial
-- unique index makes the gate enforceable at the DB level — RPC
-- pre-check gives the friendly error, but the index is the actual
-- SoT.
CREATE UNIQUE INDEX IF NOT EXISTS junior_appts_one_pending_per_applicant
    ON public.politician_junior_appointments (applicant_faction_id)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS junior_appts_by_nation_status
    ON public.politician_junior_appointments (target_nation_id, status);
CREATE INDEX IF NOT EXISTS junior_appts_by_applicant_submitted
    ON public.politician_junior_appointments (applicant_faction_id, submitted_tick DESC);

ALTER TABLE public.politician_junior_appointments ENABLE ROW LEVEL SECURITY;

-- Reads: any authenticated user can read any application row (the
-- politician career page surfaces history; the PM's Pressing Issues
-- pulls pending rows for their nation). No sensitive data — just
-- the applicant id, portfolio, and dice math.
CREATE POLICY junior_appts_read_all
    ON public.politician_junior_appointments
    FOR SELECT TO authenticated
    USING (true);

-- Writes only via the SECURITY DEFINER RPCs below. The table-level
-- REVOKE keeps direct INSERT / UPDATE / DELETE off the client.
REVOKE INSERT, UPDATE, DELETE ON public.politician_junior_appointments FROM PUBLIC, anon, authenticated;

-- ── 4. politician_seek_junior_appointment(p_portfolio) ────────────
-- Single entry point. Branches internally on whether the nation's
-- active HoG is a player or NPC; the client never sees the branch.
CREATE OR REPLACE FUNCTION public.politician_seek_junior_appointment(
    p_portfolio text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_portfolio text := NULLIF(btrim(p_portfolio), '');
    v_tick      int;
    v_hog       head_of_government%ROWTYPE;
    v_admin     administrations%ROWTYPE;
    v_is_player_hog boolean;
    v_alignment_mod int;
    v_skill_mod     int;
    v_rep_mod       int;
    v_d20           int;
    v_total         int;
    v_outcome       text;
    v_status        text;
    v_rep_delta     numeric := 0;
    v_inf_delta     int     := 0;
    v_cooldown      int     := 0;
    v_app_id        uuid;
    v_breakdown     jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF v_portfolio IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_portfolio');
    END IF;
    IF NOT (v_portfolio = ANY(_junior_portfolio_keys())) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_portfolio',
                                  'portfolio', v_portfolio);
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

    -- Skill gate — numeric since 20270461 so partial increments work.
    IF COALESCE(v_pol.politician_skill, 0) < 20 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_skill',
                                  'have', COALESCE(v_pol.politician_skill, 0), 'need', 20);
    END IF;

    -- Agency Head ladder gate. Civil Servants cannot skip the Agency
    -- Head rung even if they grind to 20 Skill — the visual surface
    -- (Junior Minister rung on politician-career.html) only renders
    -- the Seek Appointment button when politician_senior_civil_
    -- servant_at_tick is set, and this server check is the defence-
    -- in-depth backstop.
    IF v_pol.politician_senior_civil_servant_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_agency_head');
    END IF;

    -- Already serving — must resign before seeking another portfolio.
    IF v_pol.politician_junior_portfolio IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_junior_minister',
                                  'portfolio', v_pol.politician_junior_portfolio);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Cooldown gate.
    IF v_pol.politician_seek_appointment_cooldown_until_tick IS NOT NULL
       AND v_tick < v_pol.politician_seek_appointment_cooldown_until_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
                                  'cooldown_until', v_pol.politician_seek_appointment_cooldown_until_tick,
                                  'ticks_remaining', v_pol.politician_seek_appointment_cooldown_until_tick - v_tick);
    END IF;

    -- Pending application check. The partial unique index would
    -- catch this on INSERT anyway, but the friendly error is nicer.
    IF EXISTS (SELECT 1 FROM politician_junior_appointments
                WHERE applicant_faction_id = v_pol.id
                  AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pending_application_exists');
    END IF;

    -- Portfolio vacancy check. Cross-referenced after the row lock
    -- on the HoG below so concurrent appointments serialise.
    IF EXISTS (SELECT 1 FROM factions
                WHERE nation_id = v_pol.nation_id
                  AND politician_junior_portfolio = v_portfolio
                  AND abandoned_at IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'portfolio_filled',
                                  'portfolio', v_portfolio);
    END IF;

    -- Lock the active HoG row for this nation. Two concurrent
    -- applicants for the same portfolio in the same nation will
    -- queue here, and the second one's vacancy re-check below
    -- catches the race.
    SELECT * INTO v_hog FROM head_of_government
     WHERE nation_id = v_pol.nation_id
       AND active = true
     ORDER BY appointed_tick DESC LIMIT 1
     FOR UPDATE;

    -- 20270666 guarantees an always-on HoG, but be defensive.
    IF v_hog.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_head_of_government');
    END IF;

    -- Re-check vacancy under the lock.
    IF EXISTS (SELECT 1 FROM factions
                WHERE nation_id = v_pol.nation_id
                  AND politician_junior_portfolio = v_portfolio
                  AND abandoned_at IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'portfolio_filled',
                                  'portfolio', v_portfolio);
    END IF;

    -- Is the HoG a player? candidate_id maps to a faction; if that
    -- faction has linked_user_id set, a human is in the chair.
    v_is_player_hog := v_hog.candidate_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM factions
         WHERE id = v_hog.candidate_id
           AND linked_user_id IS NOT NULL
           AND abandoned_at IS NULL
    );

    -- ── Branch A: player HoG — queue the application ─────────────
    IF v_is_player_hog THEN
        INSERT INTO politician_junior_appointments
            (applicant_faction_id, target_nation_id, portfolio,
             submitted_tick, status)
        VALUES
            (v_pol.id, v_pol.nation_id, v_portfolio,
             v_tick, 'pending')
        RETURNING id INTO v_app_id;

        RETURN jsonb_build_object(
            'success',         true,
            'path',            'player_hog',
            'status',          'pending_review',
            'application_id',  v_app_id,
            'portfolio',       v_portfolio,
            'submitted_tick',  v_tick
        );
    END IF;

    -- ── Branch B: NPC HoG — roll, resolve, persist in one pass ───
    -- Modifiers. Reputation clamped to +10 so a 100-Rep saint
    -- can't auto-win every roll. Alignment from the active
    -- administration's coalition_parties (jsonb array of party ids).
    v_skill_mod := FLOOR(COALESCE(v_pol.politician_skill, 0) / 5);
    v_rep_mod   := LEAST(10, FLOOR(COALESCE(v_pol.politician_reputation, 0) / 5));

    SELECT * INTO v_admin FROM administrations
     WHERE nation_id = v_pol.nation_id
       AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC LIMIT 1;

    IF v_pol.politician_party_id IS NULL THEN
        v_alignment_mod := -5;  -- independent
    ELSIF v_admin.id IS NOT NULL
          AND v_admin.pm_party_id = v_pol.politician_party_id THEN
        v_alignment_mod := 5;   -- your party leads government
    ELSIF v_admin.id IS NOT NULL
          AND v_admin.coalition_parties IS NOT NULL
          AND v_admin.coalition_parties @> to_jsonb(v_pol.politician_party_id) THEN
        v_alignment_mod := 2;   -- in ruling coalition
    ELSE
        v_alignment_mod := -3;  -- opposition (has party, not coalition)
    END IF;

    -- 1d20 server-side. random() is double precision; the cast +
    -- bounds give a flat 1–20 distribution.
    v_d20  := FLOOR(random() * 20)::int + 1;
    v_total := v_d20 + v_skill_mod + v_rep_mod + v_alignment_mod;

    IF v_total >= 22 THEN
        v_outcome   := 'appointed';
        v_status    := 'appointed';
        v_rep_delta := 2;
    ELSIF v_total >= 16 THEN
        v_outcome  := 'rejected';
        v_status   := 'rejected';
        v_cooldown := 6;
    ELSIF v_total >= 10 THEN
        v_outcome  := 'rejected';
        v_status   := 'rejected';
        v_inf_delta := -1;
        v_cooldown := 6;
    ELSE
        v_outcome   := 'humiliated';
        v_status    := 'humiliated';
        v_rep_delta := -2;
        v_inf_delta := -1;
        v_cooldown  := 12;
    END IF;

    v_breakdown := jsonb_build_object(
        'd20',           v_d20,
        'skill_mod',     v_skill_mod,
        'reputation_mod', v_rep_mod,
        'alignment_mod', v_alignment_mod,
        'ideology_mod',  0,
        'total',         v_total,
        'outcome',       v_outcome,
        'rep_delta',     v_rep_delta,
        'inf_delta',     v_inf_delta,
        'cooldown_ticks', v_cooldown
    );

    -- Persist the resolved application row first; the factions
    -- update follows so the partial unique index trips here (not
    -- on the audit row) if a race somehow slipped past the vacancy
    -- re-check.
    INSERT INTO politician_junior_appointments
        (applicant_faction_id, target_nation_id, portfolio,
         submitted_tick, status, resolved_tick, decided_by_path,
         roll_total, roll_breakdown)
    VALUES
        (v_pol.id, v_pol.nation_id, v_portfolio,
         v_tick, v_status, v_tick, 'npc_roll',
         v_total, v_breakdown)
    RETURNING id INTO v_app_id;

    -- Apply stat deltas + cooldown + portfolio columns. Reputation
    -- is numeric per 20270461; influence is int. Floors prevent
    -- negatives if a careless reroll dips the bar.
    UPDATE factions
       SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           politician_influence  = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           politician_seek_appointment_cooldown_until_tick =
               CASE WHEN v_cooldown > 0 THEN v_tick + v_cooldown ELSE NULL END,
           politician_junior_minister_at_tick =
               CASE WHEN v_status = 'appointed' THEN v_tick
                    ELSE politician_junior_minister_at_tick END,
           politician_junior_portfolio =
               CASE WHEN v_status = 'appointed' THEN v_portfolio
                    ELSE politician_junior_portfolio END
     WHERE id = v_pol.id;

    -- Career timeline entry. event_type matches the outcome so the
    -- timeline can render "appointed Junior Minister of Sports" vs.
    -- "humiliated seeking the Sports appointment" with distinct copy.
    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_pol.id, v_tick,
         CASE v_status
            WHEN 'appointed'  THEN 'appointed_junior_minister'
            WHEN 'humiliated' THEN 'humiliated_junior_minister'
            ELSE                   'rejected_junior_minister'
         END,
         v_portfolio);

    RETURN jsonb_build_object(
        'success',        true,
        'path',           'npc_roll',
        'status',         v_status,
        'application_id', v_app_id,
        'portfolio',      v_portfolio,
        'breakdown',      v_breakdown,
        'cooldown_until', CASE WHEN v_cooldown > 0 THEN v_tick + v_cooldown ELSE NULL END
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_seek_junior_appointment(text) TO authenticated;

-- ── 5. politician_decide_junior_appointment(p_app_id, p_action) ───
-- Called only by the active player-HoG of the same nation as the
-- application. APPOINT sets the portfolio columns; REJECT writes
-- the resolution row with no stat penalties (rejection by a real
-- person is non-punitive, in contrast to the NPC dice path).
CREATE OR REPLACE FUNCTION public.politician_decide_junior_appointment(
    p_application_id uuid,
    p_action         text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_decider   factions%ROWTYPE;
    v_app       politician_junior_appointments%ROWTYPE;
    v_applicant factions%ROWTYPE;
    v_hog       head_of_government%ROWTYPE;
    v_tick      int;
    v_action    text := lower(NULLIF(btrim(p_action), ''));
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_application_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_application_id');
    END IF;
    IF v_action NOT IN ('appoint', 'reject') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_action');
    END IF;

    -- Identify the caller's politician faction.
    SELECT * INTO v_decider FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_decider.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- Lock the application row.
    SELECT * INTO v_app FROM politician_junior_appointments
     WHERE id = p_application_id
     FOR UPDATE;
    IF v_app.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'application_not_found');
    END IF;
    IF v_app.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
                                  'status', v_app.status);
    END IF;

    -- Decider must be the active HoG of the application's nation.
    SELECT * INTO v_hog FROM head_of_government
     WHERE nation_id = v_app.target_nation_id
       AND active = true
     ORDER BY appointed_tick DESC LIMIT 1
     FOR UPDATE;
    IF v_hog.id IS NULL OR v_hog.candidate_id IS DISTINCT FROM v_decider.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_head_of_government');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_applicant FROM factions
     WHERE id = v_app.applicant_faction_id
     FOR UPDATE;
    IF v_applicant.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'applicant_missing');
    END IF;

    IF v_action = 'appoint' THEN
        -- Vacancy guard — applicant could have somehow taken
        -- another portfolio between submission and review (e.g.
        -- via a future admin tool). Bail rather than double-seat.
        IF v_applicant.politician_junior_portfolio IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'applicant_already_serving',
                                      'portfolio', v_applicant.politician_junior_portfolio);
        END IF;
        -- Portfolio vacancy guard for the same reason.
        IF EXISTS (SELECT 1 FROM factions
                    WHERE nation_id = v_app.target_nation_id
                      AND politician_junior_portfolio = v_app.portfolio
                      AND abandoned_at IS NULL) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'portfolio_filled',
                                      'portfolio', v_app.portfolio);
        END IF;

        UPDATE factions
           SET politician_junior_minister_at_tick = v_tick,
               politician_junior_portfolio        = v_app.portfolio
         WHERE id = v_app.applicant_faction_id;

        UPDATE politician_junior_appointments
           SET status                = 'appointed',
               resolved_tick         = v_tick,
               decided_by_path       = 'player_hog',
               decided_by_faction_id = v_decider.id
         WHERE id = v_app.id;

        INSERT INTO politician_career_events
            (faction_id, event_tick, event_type, target_name)
        VALUES
            (v_app.applicant_faction_id, v_tick,
             'appointed_junior_minister', v_app.portfolio);

        RETURN jsonb_build_object(
            'success',        true,
            'action',         'appoint',
            'application_id', v_app.id,
            'portfolio',      v_app.portfolio,
            'applicant_id',   v_app.applicant_faction_id
        );
    END IF;

    -- v_action = 'reject'. No stat penalty on a player-PM reject;
    -- this is a non-punitive turn-down. The applicant can re-apply
    -- immediately (no cooldown stamped) — different from the NPC
    -- path on purpose.
    UPDATE politician_junior_appointments
       SET status                = 'rejected',
           resolved_tick         = v_tick,
           decided_by_path       = 'player_hog',
           decided_by_faction_id = v_decider.id
     WHERE id = v_app.id;

    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_app.applicant_faction_id, v_tick,
         'rejected_junior_minister', v_app.portfolio);

    RETURN jsonb_build_object(
        'success',        true,
        'action',         'reject',
        'application_id', v_app.id,
        'portfolio',      v_app.portfolio,
        'applicant_id',   v_app.applicant_faction_id
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_decide_junior_appointment(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
