-- ════════════════════════════════════════════════════════════════════
-- 20270776 — Embassy Events: admin-authored Day-to-Day event pool
--
-- The adminbackend's FOREIGN EVENTS tab (foreignservice.html) goes
-- from placeholder to a real authoring tool. Admins write events with
-- an Event Title + Description and up to three decisions (A / B / C),
-- each carrying a description and up to three stat effects against
-- the four embassy stats:
--
--   Embassy Budget      ($, starts at 100, floor 0, no ceiling)
--   Embassy Reputation  (0–100, starts at 50)
--   Embassy Trust       (0–100, starts at 50)
--   Embassy Leverage    (0–100, starts at 50)
--
-- Text supports four placeholders, substituted server-side at draw
-- time:
--   {Nation} — host country of the posting   (nations.name)
--   {City}   — the embassy's location        (nations.capital)
--   {Name1}  — a person from the host nation (first/last_name_pool)
--   {Corp}   — a corporation operating there (completed corp_buildings
--              in the host nation; falls back to any corp, then to a
--              generic line)
--
-- Player side: the Attaché card's [Day to Day in the Embassy] action
-- (politician-home.html, 20270759) goes live. embassy_day_to_day
-- draws a random event, snapshots the substituted text + effects into
-- embassy_event_draws, and burns the per-tick embassy cooldown. The
-- snapshot makes the draw refresh-proof (re-calling returns the same
-- pending event — no re-rolling for a better hand) and edit-proof
-- (admins can rewrite the pool without corrupting in-flight draws).
-- embassy_event_decide applies the chosen decision's effects with
-- clamping and resolves the draw.
--
-- politician_foreign_service_resign (20270771) is re-shipped with an
-- embassy reset: stats return to baseline and unresolved draws are
-- discarded, so a re-joining attaché starts a fresh posting. The
-- 20270772 posture (foreign_service_last_attempt_tick preserved) is
-- kept.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Embassy stats + cooldown on factions ──────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS embassy_budget           numeric NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS embassy_reputation       int     NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS embassy_trust            int     NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS embassy_leverage         int     NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS next_embassy_action_tick int;

-- ── 2. embassy_events — the admin-authored pool ──────────────────
-- decisions is a jsonb array of up to three entries:
--   [{ "key": "A", "description": "…",
--      "effects": [{ "stat": "budget" | "reputation" | "trust" | "leverage",
--                    "direction": "up" | "down",
--                    "amount": 10 }, …] }, …]
CREATE TABLE IF NOT EXISTS public.embassy_events (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL,
    description text NOT NULL,
    decisions   jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.embassy_events ENABLE ROW LEVEL SECURITY;

-- Reads are open (the pool is global game content); writes go through
-- the admin role — foreignservice.html does direct table CRUD behind
-- adminbackend.html's verify_admin_access() login gate, and is_admin()
-- backs that gate up at the row level.
DROP POLICY IF EXISTS "Allow select for all" ON public.embassy_events;
CREATE POLICY "Allow select for all" ON public.embassy_events
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert" ON public.embassy_events;
CREATE POLICY "Admins can insert" ON public.embassy_events
    FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can update" ON public.embassy_events;
CREATE POLICY "Admins can update" ON public.embassy_events
    FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can delete" ON public.embassy_events;
CREATE POLICY "Admins can delete" ON public.embassy_events
    FOR DELETE TO authenticated USING (is_admin());

-- ── 3. embassy_event_draws — per-player drawn events ─────────────
-- One unresolved row max per faction (enforced in the draw RPC, not
-- by constraint — historical resolved rows accumulate as a record).
-- title/description/decisions are the SUBSTITUTED snapshot.
CREATE TABLE IF NOT EXISTS public.embassy_event_draws (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id       uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    event_id         uuid REFERENCES public.embassy_events(id) ON DELETE SET NULL,
    drawn_at_tick    int  NOT NULL DEFAULT 0,
    title            text NOT NULL,
    description      text NOT NULL,
    decisions        jsonb NOT NULL DEFAULT '[]'::jsonb,
    vars             jsonb NOT NULL DEFAULT '{}'::jsonb,
    decision_key     text,
    resolved_at_tick int,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS embassy_event_draws_faction_pending_idx
    ON public.embassy_event_draws (faction_id)
    WHERE resolved_at_tick IS NULL;

ALTER TABLE public.embassy_event_draws ENABLE ROW LEVEL SECURITY;

-- Owners may read their draws (the home page checks for a pending
-- draw to light the action tile during cooldown); all writes go
-- through the SECURITY DEFINER RPCs below.
DROP POLICY IF EXISTS "Owner can select" ON public.embassy_event_draws;
CREATE POLICY "Owner can select" ON public.embassy_event_draws
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM factions f
         WHERE f.id = embassy_event_draws.faction_id
           AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
    ));

-- ── 4. Placeholder substitution helper ───────────────────────────
CREATE OR REPLACE FUNCTION public.embassy_substitute_vars(p_text text, p_vars jsonb)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
    SELECT replace(replace(replace(replace(COALESCE(p_text, ''),
        '{Nation}', COALESCE(p_vars->>'nation', 'the host nation')),
        '{City}',   COALESCE(p_vars->>'city',   'the capital')),
        '{Name1}',  COALESCE(p_vars->>'name1',  'a local official')),
        '{Corp}',   COALESCE(p_vars->>'corp',   'a multinational corporation'))
$$;

REVOKE EXECUTE ON FUNCTION public.embassy_substitute_vars(text, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.embassy_substitute_vars(text, jsonb) TO authenticated;

-- ── 5. embassy_day_to_day — draw an event ────────────────────────
CREATE OR REPLACE FUNCTION public.embassy_day_to_day(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_nat     nations%ROWTYPE;
    v_event   embassy_events%ROWTYPE;
    v_draw    embassy_event_draws%ROWTYPE;
    v_tick    int;
    v_first   text;
    v_last    text;
    v_name1   text;
    v_corp    text;
    v_vars    jsonb;
    v_dec     jsonb;
    v_dec_out jsonb := '[]'::jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_foreign_service_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_service');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Pending draw wins over everything (including the cooldown — the
    -- cooldown burned when it was drawn): re-calling returns the same
    -- event so a refresh can't re-roll a bad hand.
    SELECT * INTO v_draw FROM embassy_event_draws
     WHERE faction_id = v_pol.id
       AND resolved_at_tick IS NULL
     ORDER BY created_at DESC
     LIMIT 1;
    IF v_draw.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success',     true,
            'pending',     true,
            'draw_id',     v_draw.id,
            'title',       v_draw.title,
            'description', v_draw.description,
            'decisions',   v_draw.decisions
        );
    END IF;

    IF v_pol.next_embassy_action_tick IS NOT NULL
       AND v_pol.next_embassy_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_embassy_action_tick);
    END IF;

    SELECT * INTO v_event FROM embassy_events
     WHERE jsonb_array_length(decisions) > 0
     ORDER BY random()
     LIMIT 1;
    IF v_event.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_events');
    END IF;

    SELECT * INTO v_nat FROM nations
     WHERE id = v_pol.politician_foreign_service_nation_id;

    -- {Name1}: random draw from the host nation's name pools
    -- (seeded by 20260927). Either pool empty → generic fallback
    -- inside embassy_substitute_vars.
    IF v_nat.first_name_pool IS NOT NULL AND array_length(v_nat.first_name_pool, 1) >= 1 THEN
        v_first := v_nat.first_name_pool[1 + floor(random() * array_length(v_nat.first_name_pool, 1))::int];
    END IF;
    IF v_nat.last_name_pool IS NOT NULL AND array_length(v_nat.last_name_pool, 1) >= 1 THEN
        v_last := v_nat.last_name_pool[1 + floor(random() * array_length(v_nat.last_name_pool, 1))::int];
    END IF;
    IF v_first IS NOT NULL AND v_last IS NOT NULL THEN
        v_name1 := v_first || ' ' || v_last;
    END IF;

    -- {Corp}: a corporation operating in the host nation — same
    -- "completed building" test the FIS target list uses (20270769).
    -- Falls back to any corp, then to the generic line.
    SELECT ec.name INTO v_corp FROM entrepreneur_corps ec
     WHERE EXISTS (
         SELECT 1 FROM corp_buildings cb
          WHERE cb.owner_corp_id = ec.id
            AND cb.nation_id     = v_nat.id
            AND cb.status        = 'completed'
     )
     ORDER BY random() LIMIT 1;
    IF v_corp IS NULL THEN
        SELECT name INTO v_corp FROM entrepreneur_corps ORDER BY random() LIMIT 1;
    END IF;

    v_vars := jsonb_strip_nulls(jsonb_build_object(
        'nation', v_nat.name,
        'city',   v_nat.capital,
        'name1',  v_name1,
        'corp',   v_corp
    ));

    FOR v_dec IN SELECT * FROM jsonb_array_elements(v_event.decisions) LOOP
        v_dec_out := v_dec_out || jsonb_build_array(
            jsonb_set(v_dec, '{description}',
                to_jsonb(embassy_substitute_vars(v_dec->>'description', v_vars)))
        );
    END LOOP;

    INSERT INTO embassy_event_draws (
        faction_id, event_id, drawn_at_tick,
        title, description, decisions, vars
    ) VALUES (
        v_pol.id, v_event.id, v_tick,
        embassy_substitute_vars(v_event.title, v_vars),
        embassy_substitute_vars(v_event.description, v_vars),
        v_dec_out, v_vars
    ) RETURNING * INTO v_draw;

    UPDATE factions
       SET next_embassy_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'pending',          false,
        'draw_id',          v_draw.id,
        'title',            v_draw.title,
        'description',      v_draw.description,
        'decisions',        v_draw.decisions,
        'next_action_tick', v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.embassy_day_to_day(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.embassy_day_to_day(uuid) TO authenticated;

-- ── 6. embassy_event_decide — resolve a pending draw ─────────────
CREATE OR REPLACE FUNCTION public.embassy_event_decide(
    p_faction_id   uuid,
    p_draw_id      uuid,
    p_decision_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_draw      embassy_event_draws%ROWTYPE;
    v_tick      int;
    v_decision  jsonb;
    v_eff       jsonb;
    v_stat      text;
    v_amt       numeric;
    v_delta     numeric;
    v_budget    numeric;
    v_rep       int;
    v_trust     int;
    v_lev       int;
    v_applied   jsonb := '[]'::jsonb;
    v_full_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_draw_id IS NULL OR p_decision_key IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_draw FROM embassy_event_draws
     WHERE id = p_draw_id
     FOR UPDATE;
    IF v_draw.id IS NULL OR v_draw.faction_id <> v_pol.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'draw_not_found');
    END IF;
    IF v_draw.resolved_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'decision_key', v_draw.decision_key);
    END IF;

    SELECT d INTO v_decision
      FROM jsonb_array_elements(v_draw.decisions) d
     WHERE d->>'key' = upper(p_decision_key)
     LIMIT 1;
    IF v_decision IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_decision');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_budget := COALESCE(v_pol.embassy_budget,     100);
    v_rep    := COALESCE(v_pol.embassy_reputation, 50);
    v_trust  := COALESCE(v_pol.embassy_trust,      50);
    v_lev    := COALESCE(v_pol.embassy_leverage,   50);

    FOR v_eff IN SELECT * FROM jsonb_array_elements(COALESCE(v_decision->'effects', '[]'::jsonb)) LOOP
        v_stat := v_eff->>'stat';
        v_amt  := COALESCE((v_eff->>'amount')::numeric, 0);
        IF v_amt <= 0 THEN CONTINUE; END IF;
        v_delta := CASE WHEN v_eff->>'direction' = 'down' THEN -v_amt ELSE v_amt END;
        IF v_stat = 'budget' THEN
            v_budget := GREATEST(0, v_budget + v_delta);
        ELSIF v_stat = 'reputation' THEN
            v_rep := LEAST(100, GREATEST(0, v_rep + round(v_delta)::int));
        ELSIF v_stat = 'trust' THEN
            v_trust := LEAST(100, GREATEST(0, v_trust + round(v_delta)::int));
        ELSIF v_stat = 'leverage' THEN
            v_lev := LEAST(100, GREATEST(0, v_lev + round(v_delta)::int));
        ELSE
            CONTINUE;
        END IF;
        v_applied := v_applied || jsonb_build_array(jsonb_build_object(
            'stat', v_stat, 'delta', v_delta));
    END LOOP;

    UPDATE factions
       SET embassy_budget     = v_budget,
           embassy_reputation = v_rep,
           embassy_trust      = v_trust,
           embassy_leverage   = v_lev
     WHERE id = v_pol.id;

    UPDATE embassy_event_draws
       SET decision_key     = upper(p_decision_key),
           resolved_at_tick = v_tick
     WHERE id = v_draw.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'An attaché');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'embassy_event_resolved', v_draw.title,
        jsonb_build_object('draw_id', v_draw.id, 'decision_key', upper(p_decision_key),
                           'applied', v_applied)
    );

    -- nation_id is the politician's HOME nation — same posture as the
    -- FS exam rows (20270765): the dispatch lands on their domestic
    -- timeline, not the host nation's world feed.
    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        v_draw.title,
        v_full_name || ' handled an incident at the embassy in '
            || COALESCE(v_draw.vars->>'city', 'the capital') || ', '
            || COALESCE(v_draw.vars->>'nation', 'a foreign nation')
            || ' — chose option ' || upper(p_decision_key) || '.',
        'politician', 'politician_embassy_event', v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'decision_key', upper(p_decision_key),
        'applied',      v_applied,
        'embassy',      jsonb_build_object(
            'budget',     v_budget,
            'reputation', v_rep,
            'trust',      v_trust,
            'leverage',   v_lev
        )
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.embassy_event_decide(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.embassy_event_decide(uuid, uuid, text) TO authenticated;

-- ── 7. politician_foreign_service_resign — embassy reset ─────────
-- Body byte-faithful to 20270771 except the UPDATE also resets the
-- four embassy stats + cooldown to baseline and the new DELETE
-- discards any unresolved draw, so a re-joining attaché starts the
-- new posting clean. foreign_service_last_attempt_tick stays
-- preserved (20270772 posture).
CREATE OR REPLACE FUNCTION public.politician_foreign_service_resign(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_tick        int;
    v_nation_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_foreign_service_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_service');
    END IF;

    SELECT name INTO v_nation_name FROM nations
     WHERE id = v_pol.politician_foreign_service_nation_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- No stat claw-back: re-entry requires re-passing the FS exam
    -- (plus its 1-tick retry cooldown), which is its own barrier.
    -- foreign_service_last_attempt_tick is intentionally preserved.
    -- Embassy stats reset to baseline (20270776) — they belong to
    -- the posting, not the politician.
    UPDATE factions
       SET politician_foreign_service_nation_id = NULL,
           politician_foreign_service_at_tick   = NULL,
           embassy_budget           = 100,
           embassy_reputation       = 50,
           embassy_trust            = 50,
           embassy_leverage         = 50,
           next_embassy_action_tick = NULL
     WHERE id = v_pol.id;

    -- Discard any unresolved embassy event — the posting it belonged
    -- to is over. Resolved rows stay as the historical record.
    DELETE FROM embassy_event_draws
     WHERE faction_id = v_pol.id
       AND resolved_at_tick IS NULL;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'foreign_service_resigned', COALESCE(v_nation_name, ''),
        jsonb_build_object('posted_nation_name', v_nation_name)
    );

    RETURN jsonb_build_object('success', true, 'resigned_from', v_nation_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_foreign_service_resign(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_foreign_service_resign(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
