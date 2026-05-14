-- Petition for Reform: redesigned as a monarch-decides Pressing Issue.
--
-- Old behaviour (replaced):
--   petition_for_reform() rolled the dice + auto-applied stat changes
--   based on the bucket. Result was opaque to other players.
--
-- New behaviour:
--   1. Filing the petition rolls 1d100 + strength to determine the
--      public mood bucket but does NOT apply any stat changes. Instead
--      it inserts a row in the new `petitions` table and writes a
--      "PETITION FOR REFORM" event_log row for everyone in the nation
--      to see.
--   2. The monarch's faction sees three response actions in the
--      government.html Administrative subtab Pressing Issues panel:
--      Dismiss / Agree to Some / Accept. Each action's effect on
--      crown_authority, unrest, and public_approval depends on the
--      bucket × action matrix below.
--   3. If the monarch doesn't decide within 3 ticks, Accept fires
--      automatically (process_expired_petitions runs from the
--      tick-handler hook).
--   4. Each resolution writes a second event_log row describing
--      what the monarch decided.
--   5. Petition cost ($0.1) and 6-tick cooldown are still charged at
--      file time. The previous −0.2 sector-popularity penalty is
--      dropped — the monarch's explicit choice replaces it.
--
-- Outcome matrix (CA = crown_authority, U = unrest, PA = public_approval):
--
--                 Dismiss          Agree-Some        Accept
--   apathetic     +2 CA −2 U +2 PA  −3 CA −2 U +2 PA  −2 CA −1 U +2 PA
--   hopeful       +2 CA +2 U −2 PA  −2 CA −3 U +3 PA  −3 CA −3 U +4 PA
--   expectant      0 CA +5 U −6 PA  −2 CA +3 U +2 PA  −6 CA −5 U +7 PA
--
-- All three stats are clamped 0..100.
--
-- Concurrency:
--   - Unique partial index on petitions(nation_id) WHERE status='pending'
--     enforces "one pending petition at a time per nation" at the DB level.
--   - respond_to_petition uses FOR UPDATE on the petition row to serialize
--     monarch responses against the auto-accept sweep.

BEGIN;

-- ════════════════════════ SCHEMA ════════════════════════

CREATE TABLE IF NOT EXISTS public.petitions (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id                UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    faction_id               UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    monarch_faction_id       UUID,           -- snapshot at file time; may be NULL
    filed_at_tick            INT  NOT NULL,
    auto_accept_at_tick      INT  NOT NULL,  -- filed_at_tick + 3
    d100                     INT  NOT NULL CHECK (d100 BETWEEN 1 AND 100),
    strength                 NUMERIC NOT NULL,
    total                    NUMERIC NOT NULL,
    bucket                   TEXT NOT NULL
                                CHECK (bucket IN ('apathetic', 'hopeful', 'expectant')),
    status                   TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'dismissed', 'partial', 'accepted', 'auto_accepted')),
    resolved_at_tick         INT,
    resolved_by_faction_id   UUID,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_petitions_nation_status
    ON public.petitions (nation_id, status);
CREATE INDEX IF NOT EXISTS idx_petitions_pending_due
    ON public.petitions (status, auto_accept_at_tick)
    WHERE status = 'pending';

-- One pending petition at a time per nation.
CREATE UNIQUE INDEX IF NOT EXISTS uq_petitions_one_pending_per_nation
    ON public.petitions (nation_id) WHERE status = 'pending';

ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Anyone can read petitions" ON public.petitions
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Writes intentionally restricted: all inserts/updates go through
-- petition_for_reform / respond_to_petition / process_expired_petitions
-- (SECURITY DEFINER, which bypasses RLS). Clients have no direct write path.

COMMENT ON TABLE public.petitions IS
    'Pending and resolved Petition for Reform requests. Filed by an opposition party in an absolute monarchy; resolved by the monarch faction (or auto-accepted after 3 ticks). One pending row per nation enforced by uq_petitions_one_pending_per_nation.';


-- ════════════════════════ petition_for_reform (rewritten) ════════════════════════
-- Filing path: roll the dice, insert a pending petition, write the
-- "PETITION FOR REFORM" event_log row, charge cost, stamp cooldown.
-- No stat changes; those happen on monarch decision (or auto-accept).

CREATE OR REPLACE FUNCTION public.petition_for_reform()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_faction       factions%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_tick          INT;
    v_cost_raw      CONSTANT BIGINT := 100000;
    v_cooldown      CONSTANT INT    := 6;
    v_auto_window   CONSTANT INT    := 3;
    v_strength      NUMERIC;
    v_d100          INT;
    v_total         NUMERIC;
    v_bucket        TEXT;
    v_pop_up        NUMERIC;
    v_pop_cp        NUMERIC;
    v_pop_rc        NUMERIC;
    v_petition_id   UUID;
    v_hos_name      TEXT;
    v_mood_text     TEXT;
    v_description   TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_faction FROM factions
        WHERE id = v_caller OR linked_user_id = v_caller
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_faction.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    IF NOT (COALESCE(v_nation.government_type, '') ILIKE '%absolute%monarchy%') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_monarchy',
            'got_government_type', v_nation.government_type);
    END IF;

    IF v_nation.monarch_faction_id IS NOT NULL
       AND v_nation.monarch_faction_id = v_faction.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_opposition');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM faction_agitators
        WHERE faction_id = v_faction.id AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_agitator');
    END IF;

    -- One pending petition at a time per nation.
    IF EXISTS (
        SELECT 1 FROM petitions
        WHERE nation_id = v_nation.id AND status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'petition_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_faction.last_petition_for_reform_tick IS NOT NULL
       AND v_tick < v_faction.last_petition_for_reform_tick + v_cooldown THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_faction.last_petition_for_reform_tick + v_cooldown);
    END IF;

    IF COALESCE(v_faction.party_funds, 0) < v_cost_raw THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_faction.party_funds, 0), 'need', v_cost_raw);
    END IF;

    -- ── Petition strength + dice ─────────────────────────────────
    SELECT popularity INTO v_pop_up FROM faction_sector_popularity fsp
        JOIN sectors s ON s.id = fsp.sector_id
        WHERE fsp.faction_id = v_faction.id AND s.sector_key = 'URBAN_PROFESSIONALS';
    SELECT popularity INTO v_pop_cp FROM faction_sector_popularity fsp
        JOIN sectors s ON s.id = fsp.sector_id
        WHERE fsp.faction_id = v_faction.id AND s.sector_key = 'CULTURAL_PRODUCERS';
    SELECT popularity INTO v_pop_rc FROM faction_sector_popularity fsp
        JOIN sectors s ON s.id = fsp.sector_id
        WHERE fsp.faction_id = v_faction.id AND s.sector_key = 'RELIGIOUS_CONSERVATIVES';
    v_pop_up := COALESCE(v_pop_up, 50);
    v_pop_cp := COALESCE(v_pop_cp, 50);
    v_pop_rc := COALESCE(v_pop_rc, 50);

    v_strength :=
          (COALESCE(v_nation.education,          50) / 10.0) * 1.5
        + (v_pop_up / 10.0) * 2.0
        + (v_pop_cp / 10.0) * 1.5
        + (10 - COALESCE(v_nation.standard_of_living, 50) / 10.0)
        + (COALESCE(v_nation.inequality, 50)   / 10.0) * 0.5
        +  COALESCE(v_nation.crown_authority, 50) / 20.0
        + (v_pop_rc / 10.0) * 1.0;

    v_d100  := 1 + floor(random() * 100)::INT;
    v_total := v_d100 + v_strength;

    IF v_total <= 40 THEN
        v_bucket := 'apathetic';
    ELSIF v_total <= 69 THEN
        v_bucket := 'hopeful';
    ELSE
        v_bucket := 'expectant';
    END IF;

    -- ── Insert pending petition ──────────────────────────────────
    INSERT INTO petitions (
        nation_id, faction_id, monarch_faction_id,
        filed_at_tick, auto_accept_at_tick,
        d100, strength, total, bucket, status
    ) VALUES (
        v_nation.id, v_faction.id, v_nation.monarch_faction_id,
        v_tick, v_tick + v_auto_window,
        v_d100, round(v_strength::NUMERIC, 2), round(v_total::NUMERIC, 2), v_bucket, 'pending'
    )
    RETURNING id INTO v_petition_id;

    -- ── Charge + cooldown ────────────────────────────────────────
    UPDATE factions
       SET party_funds                    = COALESCE(party_funds, 0) - v_cost_raw,
           last_petition_for_reform_tick = v_tick
     WHERE id = v_faction.id;

    -- ── Filing event_log row ─────────────────────────────────────
    -- Public mood line is bucket-dependent and shown to all players.
    v_hos_name :=
        coalesce(NULLIF(trim(coalesce(v_nation.head_of_state_title, '') || ' ' ||
                             coalesce(v_nation.head_of_state_first_name, '') || ' ' ||
                             coalesce(v_nation.head_of_state_last_name, '')), ''),
                 'the monarch');

    v_mood_text := CASE v_bucket
        WHEN 'apathetic' THEN 'The people are apathetic to this motion.'
        WHEN 'hopeful'   THEN 'The people are hopeful that the monarchy will hear their plea.'
        WHEN 'expectant' THEN 'The people expect this petition to be heard, and may lash out if they are ignored.'
    END;

    v_description := format(
        '%s has petitioned the monarch %s on a list of reforms, hoping to stabilize and potentially liberalize the nation. The nation waits for the throne''s response. %s',
        v_faction.faction_name, v_hos_name, v_mood_text);

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation.id, 'PETITION FOR REFORM', 'petition_for_reform_filed', 'POLITICAL',
        v_description,
        jsonb_build_object(
            'petition_id',   v_petition_id,
            'bucket',        v_bucket,
            'd100',          v_d100,
            'strength',      round(v_strength::NUMERIC, 2),
            'total',         round(v_total::NUMERIC, 2),
            'faction_id',    v_faction.id,
            'faction_name',  v_faction.faction_name
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'petition_id',  v_petition_id,
        'bucket',       v_bucket,
        'd100',         v_d100,
        'strength',     round(v_strength::NUMERIC, 2),
        'total',        round(v_total::NUMERIC, 2),
        'auto_accept_at_tick', v_tick + v_auto_window
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.petition_for_reform() TO authenticated;


-- ════════════════════════ respond_to_petition ════════════════════════
-- Monarch decides. p_action ∈ ('dismiss', 'partial', 'accept').
-- Applies the bucket × action stat deltas, marks status, logs the
-- resolution event.

CREATE OR REPLACE FUNCTION public.respond_to_petition(
    p_petition_id UUID,
    p_action      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_faction       factions%ROWTYPE;
    v_petition      petitions%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_tick          INT;
    v_d_ca          INT;
    v_d_unrest      INT;
    v_d_pa          INT;
    v_new_ca        NUMERIC;
    v_new_unrest    NUMERIC;
    v_new_pa        NUMERIC;
    v_new_status    TEXT;
    v_action_label  TEXT;
    v_hos_name      TEXT;
    v_event_name    TEXT;
    v_description   TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    IF p_action NOT IN ('dismiss', 'partial', 'accept') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_action');
    END IF;

    SELECT * INTO v_faction FROM factions
        WHERE id = v_caller OR linked_user_id = v_caller
        ORDER BY created_at DESC LIMIT 1;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_petition FROM petitions
        WHERE id = p_petition_id
        FOR UPDATE;
    IF v_petition.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_petition');
    END IF;
    IF v_petition.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_petition.status);
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_petition.nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    -- Only the current monarch's faction may respond. We re-read
    -- monarch_faction_id from nations (not the petition snapshot) so
    -- that a throne change between filing and responding correctly
    -- routes the decision to the new monarch.
    IF v_nation.monarch_faction_id IS NULL
       OR v_nation.monarch_faction_id != v_faction.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_monarch');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- ── Outcome matrix lookup ────────────────────────────────────
    -- Encoded inline; mirrored in process_expired_petitions for the
    -- accept path. (Bucket × action → CA, Unrest, PA deltas.)
    IF p_action = 'dismiss' THEN
        v_action_label := 'dismissed';
        v_new_status   := 'dismissed';
        IF v_petition.bucket = 'apathetic' THEN
            v_d_ca := 2;  v_d_unrest := -2; v_d_pa := 2;
        ELSIF v_petition.bucket = 'hopeful' THEN
            v_d_ca := 2;  v_d_unrest := 2;  v_d_pa := -2;
        ELSE -- expectant
            v_d_ca := 0;  v_d_unrest := 5;  v_d_pa := -6;
        END IF;
    ELSIF p_action = 'partial' THEN
        v_action_label := 'agreed to some of';
        v_new_status   := 'partial';
        IF v_petition.bucket = 'apathetic' THEN
            v_d_ca := -3; v_d_unrest := -2; v_d_pa := 2;
        ELSIF v_petition.bucket = 'hopeful' THEN
            v_d_ca := -2; v_d_unrest := -3; v_d_pa := 3;
        ELSE
            v_d_ca := -2; v_d_unrest := 3;  v_d_pa := 2;
        END IF;
    ELSE -- accept
        v_action_label := 'accepted';
        v_new_status   := 'accepted';
        IF v_petition.bucket = 'apathetic' THEN
            v_d_ca := -2; v_d_unrest := -1; v_d_pa := 2;
        ELSIF v_petition.bucket = 'hopeful' THEN
            v_d_ca := -3; v_d_unrest := -3; v_d_pa := 4;
        ELSE
            v_d_ca := -6; v_d_unrest := -5; v_d_pa := 7;
        END IF;
    END IF;

    -- Apply, clamped 0..100 on all three.
    v_new_ca     := LEAST(100, GREATEST(0, COALESCE(v_nation.crown_authority, 50) + v_d_ca));
    v_new_unrest := LEAST(100, GREATEST(0, COALESCE(v_nation.unrest, 50) + v_d_unrest));
    v_new_pa     := LEAST(100, GREATEST(0, COALESCE(v_nation.public_approval, 50) + v_d_pa));

    UPDATE nations SET crown_authority = v_new_ca,
                       unrest          = v_new_unrest,
                       public_approval = v_new_pa
        WHERE id = v_nation.id;

    UPDATE petitions
       SET status                 = v_new_status,
           resolved_at_tick       = v_tick,
           resolved_by_faction_id = v_faction.id
     WHERE id = v_petition.id;

    -- Resolution event_log
    v_hos_name :=
        coalesce(NULLIF(trim(coalesce(v_nation.head_of_state_title, '') || ' ' ||
                             coalesce(v_nation.head_of_state_first_name, '') || ' ' ||
                             coalesce(v_nation.head_of_state_last_name, '')), ''),
                 'the monarch');

    v_event_name := CASE v_new_status
        WHEN 'dismissed' THEN 'Petition Dismissed'
        WHEN 'partial'   THEN 'Petition Partially Accepted'
        WHEN 'accepted'  THEN 'Petition Accepted'
    END;

    v_description := format(
        '%s has %s the petition for reform.',
        v_hos_name, v_action_label);

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation.id, v_event_name, 'petition_for_reform_resolved', 'POLITICAL',
        v_description,
        jsonb_build_object(
            'petition_id',         v_petition.id,
            'action',              p_action,
            'bucket',              v_petition.bucket,
            'd_crown_authority',   v_d_ca,
            'd_unrest',            v_d_unrest,
            'd_public_approval',   v_d_pa,
            'new_crown_authority', v_new_ca,
            'new_unrest',          v_new_unrest,
            'new_public_approval', v_new_pa
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',  true,
        'action',   p_action,
        'status',   v_new_status,
        'new_crown_authority', v_new_ca,
        'new_unrest',          v_new_unrest,
        'new_public_approval', v_new_pa
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_petition(UUID, TEXT) TO authenticated;


-- ════════════════════════ process_expired_petitions ════════════════════════
-- Tick-handler hook. Auto-accepts every pending petition whose
-- auto_accept_at_tick has been reached. Uses the Accept matrix
-- (same numbers as p_action='accept') and marks status='auto_accepted'
-- so resolution events are distinguishable in the timeline.

CREATE OR REPLACE FUNCTION public.process_expired_petitions(p_tick INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_petition      petitions%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_d_ca          INT;
    v_d_unrest      INT;
    v_d_pa          INT;
    v_new_ca        NUMERIC;
    v_new_unrest    NUMERIC;
    v_new_pa        NUMERIC;
    v_hos_name      TEXT;
    v_description   TEXT;
    v_count         INT := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_tick', 'processed', 0);
    END IF;

    FOR v_petition IN
        SELECT * FROM petitions
        WHERE status = 'pending' AND auto_accept_at_tick <= p_tick
        FOR UPDATE SKIP LOCKED
    LOOP
        SELECT * INTO v_nation FROM nations WHERE id = v_petition.nation_id FOR UPDATE;
        IF v_nation.id IS NULL THEN
            -- Nation was deleted; mark the petition resolved so it
            -- stops being processed every tick.
            UPDATE petitions
               SET status = 'auto_accepted', resolved_at_tick = p_tick
             WHERE id = v_petition.id;
            CONTINUE;
        END IF;

        -- Accept matrix (same values as respond_to_petition's accept branch).
        IF v_petition.bucket = 'apathetic' THEN
            v_d_ca := -2; v_d_unrest := -1; v_d_pa := 2;
        ELSIF v_petition.bucket = 'hopeful' THEN
            v_d_ca := -3; v_d_unrest := -3; v_d_pa := 4;
        ELSE
            v_d_ca := -6; v_d_unrest := -5; v_d_pa := 7;
        END IF;

        v_new_ca     := LEAST(100, GREATEST(0, COALESCE(v_nation.crown_authority, 50) + v_d_ca));
        v_new_unrest := LEAST(100, GREATEST(0, COALESCE(v_nation.unrest, 50) + v_d_unrest));
        v_new_pa     := LEAST(100, GREATEST(0, COALESCE(v_nation.public_approval, 50) + v_d_pa));

        UPDATE nations SET crown_authority = v_new_ca,
                           unrest          = v_new_unrest,
                           public_approval = v_new_pa
            WHERE id = v_nation.id;

        UPDATE petitions
           SET status                 = 'auto_accepted',
               resolved_at_tick       = p_tick,
               resolved_by_faction_id = NULL
         WHERE id = v_petition.id;

        v_hos_name :=
            coalesce(NULLIF(trim(coalesce(v_nation.head_of_state_title, '') || ' ' ||
                                 coalesce(v_nation.head_of_state_first_name, '') || ' ' ||
                                 coalesce(v_nation.head_of_state_last_name, '')), ''),
                     'the throne');

        v_description := format(
            'With no response from %s within the deadline, the petition for reform was accepted by default.',
            v_hos_name);

        INSERT INTO event_log (
            nation_id, event_name, trigger_key, category,
            description_chosen, effects_applied, fired_at_tick
        ) VALUES (
            v_nation.id, 'Petition Accepted (Default)', 'petition_for_reform_resolved',
            'POLITICAL', v_description,
            jsonb_build_object(
                'petition_id',         v_petition.id,
                'action',              'auto_accept',
                'bucket',              v_petition.bucket,
                'd_crown_authority',   v_d_ca,
                'd_unrest',            v_d_unrest,
                'd_public_approval',   v_d_pa,
                'new_crown_authority', v_new_ca,
                'new_unrest',          v_new_unrest,
                'new_public_approval', v_new_pa
            ),
            p_tick
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'processed', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_expired_petitions(INT) TO authenticated, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
