-- ════════════════════════════════════════════════════════════════════
-- 20270907 — One career affiliation at a time (auto-resign the rest)
--
-- A politician may hold exactly ONE career affiliation. Taking a new one
-- auto-resigns whatever was held before — and if the resigned role was a
-- sitting MP (Junior MP / Member of Parliament / Senior MP), the
-- politician's party loses one Seat.
--
-- WHY A TRIGGER (single source of truth): affiliations are granted from
-- ~20 RPCs across five career tracks (elected office, civil service +
-- appointed cabinet, the bench/bar, the foreign service, the FIS). Most
-- carry no cross-track guard, so they stacked freely (the bug that left
-- Mateo Paredes a City Council Member AND a Junior Minister at once). One
-- BEFORE-UPDATE trigger on factions enforces the rule for every grant
-- path — current and future — instead of editing the same call into 20
-- functions. Matches the existing trigger idiom (trg_attach_state_
-- advocate, the trg_block_* family).
--
-- TRACKS (a column going NULL → non-null means "entering" that track):
--   elected        politician_office (+ won_at_tick), the local-exec
--                  stamps (mayor / mayor_of_capital / regional_leader)
--   civil_service  politician_ministry + the senior-CS / agency-head /
--                  permanent-secretary rungs + the APPOINTED cabinet
--                  (junior_portfolio, deputy_minister_ministry) — these
--                  are one ladder (a Junior Minister IS a promoted
--                  Agency Head, 20270669), so within-ladder promotions
--                  keep the track and never self-resign.
--   judicial       bar_admitted_nation_id + the bench rungs
--   foreign_svc    attaché / consul / DCM / ambassador / special envoy
--   fis            politician_fis_joined_at_tick
--
-- Party membership (politician_party_id) is NOT a career track — an MP is
-- normally a member of their party — so it is left untouched.
--
-- ENTRY DETECTION: the trigger acts only when exactly ONE track newly
-- activates on the row. Zero (the common case — popularity / capital tick
-- sweeps, resignations, re-election to the same office where the office
-- column does not transition NULL→set) is a fast no-op. An ambiguous
-- multi-track activation in a single UPDATE (no current RPC does this) is
-- left alone defensively rather than guessing which to keep.
--
-- COST: cost-free. Auto-resign is a consequence of advancing into a new
-- role, not a voluntary quit, so it skips the reputation / capital /
-- popularity penalties the manual resign RPCs charge. The MP Seat
-- decrement (explicit design requirement) still applies, via the
-- canonical _is_mp_office() predicate (20270902) — which also closes the
-- latent gap in politician_resign_office (20270484), written before
-- full_mp existed, that only decremented two of the three MP tiers.
--
-- HELD SEATS: leaving an elected office reopens the seat — the City
-- Council jsonb seat and the Mayor city stamp are restored to an NPC
-- (mirrors politician_resolve_due_elections' own NPC backfill) so no
-- ghost holder lingers.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public._trg_politician_single_affiliation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_entered_elected  boolean;
    v_entered_civil    boolean;
    v_entered_judicial boolean;
    v_entered_fs       boolean;
    v_entered_fis      boolean;
    v_n_entered        int;
    v_keep             text;
    v_tick             int;
    v_had_elected      boolean;
    v_city             cities%ROWTYPE;
    v_seat_idx         int;
    v_seat_kind        text;
    v_first_pool       text[];
    v_last_pool        text[];
    v_npc_first        text;
    v_npc_last         text;
    v_new_seat         jsonb;
    v_cleared          text[] := ARRAY[]::text[];
BEGIN
    -- Politicians only; everything else passes straight through.
    IF NEW.faction_type IS DISTINCT FROM 'politician' THEN
        RETURN NEW;
    END IF;

    -- ── Which track (if any) newly activated on this UPDATE? ──────────
    v_entered_elected :=
           (OLD.politician_office                 IS NULL AND NEW.politician_office                 IS NOT NULL)
        OR (OLD.politician_mayor_at_tick          IS NULL AND NEW.politician_mayor_at_tick          IS NOT NULL)
        OR (OLD.politician_mayor_of_capital_at_tick IS NULL AND NEW.politician_mayor_of_capital_at_tick IS NOT NULL)
        OR (OLD.politician_regional_leader_at_tick IS NULL AND NEW.politician_regional_leader_at_tick IS NOT NULL);

    v_entered_civil :=
           (OLD.politician_ministry                    IS NULL AND NEW.politician_ministry                    IS NOT NULL)
        OR (OLD.politician_senior_civil_servant_at_tick IS NULL AND NEW.politician_senior_civil_servant_at_tick IS NOT NULL)
        OR (OLD.politician_agency_head_of              IS NULL AND NEW.politician_agency_head_of              IS NOT NULL)
        OR (OLD.politician_permanent_secretary_ministry IS NULL AND NEW.politician_permanent_secretary_ministry IS NOT NULL)
        OR (OLD.politician_junior_portfolio            IS NULL AND NEW.politician_junior_portfolio            IS NOT NULL)
        OR (OLD.politician_deputy_minister_ministry    IS NULL AND NEW.politician_deputy_minister_ministry    IS NOT NULL);

    v_entered_judicial :=
           (OLD.bar_admitted_nation_id                  IS NULL AND NEW.bar_admitted_nation_id                  IS NOT NULL)
        OR (OLD.politician_experienced_advocate_at_tick  IS NULL AND NEW.politician_experienced_advocate_at_tick  IS NOT NULL)
        OR (OLD.politician_state_prosecutor_at_tick      IS NULL AND NEW.politician_state_prosecutor_at_tick      IS NOT NULL)
        OR (OLD.politician_magistrate_at_tick            IS NULL AND NEW.politician_magistrate_at_tick            IS NOT NULL)
        OR (OLD.politician_appellate_justice_at_tick     IS NULL AND NEW.politician_appellate_justice_at_tick     IS NOT NULL)
        OR (OLD.politician_supreme_court_justice_at_tick IS NULL AND NEW.politician_supreme_court_justice_at_tick IS NOT NULL);

    v_entered_fs :=
           (OLD.politician_foreign_service_nation_id IS NULL AND NEW.politician_foreign_service_nation_id IS NOT NULL)
        OR (OLD.politician_consul_nation_id           IS NULL AND NEW.politician_consul_nation_id           IS NOT NULL)
        OR (OLD.politician_dcm_region                 IS NULL AND NEW.politician_dcm_region                 IS NOT NULL)
        OR (OLD.politician_ambassador_nation_id       IS NULL AND NEW.politician_ambassador_nation_id       IS NOT NULL)
        OR (OLD.politician_special_envoy_at_tick      IS NULL AND NEW.politician_special_envoy_at_tick      IS NOT NULL);

    v_entered_fis :=
        (OLD.politician_fis_joined_at_tick IS NULL AND NEW.politician_fis_joined_at_tick IS NOT NULL);

    v_n_entered := (v_entered_elected)::int + (v_entered_civil)::int
                 + (v_entered_judicial)::int + (v_entered_fs)::int + (v_entered_fis)::int;

    -- No new affiliation, or an ambiguous multi-track write: leave it be.
    IF v_n_entered <> 1 THEN
        RETURN NEW;
    END IF;

    v_keep := CASE
        WHEN v_entered_elected  THEN 'elected'
        WHEN v_entered_civil    THEN 'civil_service'
        WHEN v_entered_judicial THEN 'judicial'
        WHEN v_entered_fs       THEN 'foreign_service'
        ELSE                         'fis'
    END;

    -- ── Clear every track EXCEPT the one being entered (on NEW) ───────
    IF v_keep <> 'elected' THEN
        v_had_elected := OLD.politician_office IS NOT NULL
                      OR OLD.politician_mayor_at_tick IS NOT NULL
                      OR OLD.politician_mayor_of_capital_at_tick IS NOT NULL
                      OR OLD.politician_regional_leader_at_tick IS NOT NULL;
        IF v_had_elected THEN
            v_cleared := v_cleared || 'elected';
        END IF;
        NEW.politician_office                 := NULL;
        NEW.politician_office_won_at_tick      := NULL;
        NEW.politician_mayor_at_tick           := NULL;
        NEW.politician_mayor_of_capital_at_tick := NULL;
        NEW.politician_regional_leader_at_tick := NULL;
    END IF;

    IF v_keep <> 'civil_service' THEN
        IF OLD.politician_ministry IS NOT NULL
           OR OLD.politician_junior_portfolio IS NOT NULL
           OR OLD.politician_deputy_minister_ministry IS NOT NULL THEN
            v_cleared := v_cleared || 'civil_service';
        END IF;
        NEW.politician_ministry                     := NULL;
        NEW.politician_senior_civil_servant_at_tick := NULL;
        NEW.politician_agency_head_of               := NULL;
        NEW.politician_permanent_secretary_at_tick  := NULL;
        NEW.politician_permanent_secretary_ministry := NULL;
        NEW.politician_junior_portfolio             := NULL;
        NEW.politician_junior_minister_at_tick      := NULL;
        NEW.politician_deputy_minister_ministry     := NULL;
        NEW.politician_deputy_minister_at_tick      := NULL;
    END IF;

    IF v_keep <> 'judicial' THEN
        IF OLD.bar_admitted_nation_id IS NOT NULL THEN
            v_cleared := v_cleared || 'judicial';
        END IF;
        NEW.bar_admitted_nation_id                  := NULL;
        NEW.bar_admitted_at_tick                    := NULL;
        NEW.politician_experienced_advocate_at_tick := NULL;
        NEW.politician_state_prosecutor_at_tick     := NULL;
        NEW.politician_magistrate_at_tick           := NULL;
        NEW.politician_appellate_justice_at_tick    := NULL;
        -- Supreme Court Justice is an executive appointment (admin-
        -- stamped, 20270561) — left intact, mirroring resign_from_bench.
    END IF;

    IF v_keep <> 'foreign_service' THEN
        IF OLD.politician_foreign_service_nation_id IS NOT NULL
           OR OLD.politician_consul_nation_id IS NOT NULL
           OR OLD.politician_dcm_region IS NOT NULL
           OR OLD.politician_ambassador_nation_id IS NOT NULL
           OR OLD.politician_special_envoy_at_tick IS NOT NULL THEN
            v_cleared := v_cleared || 'foreign_service';
            -- Reset the embassy desk to baseline (mirrors 20270879).
            NEW.embassy_budget     := 100;
            NEW.embassy_reputation := 50;
            NEW.embassy_trust      := 50;
            NEW.embassy_leverage   := 50;
        END IF;
        NEW.politician_foreign_service_nation_id := NULL;
        NEW.politician_foreign_service_at_tick   := NULL;
        NEW.politician_consul_nation_id          := NULL;
        NEW.politician_consul_at_tick            := NULL;
        NEW.politician_dcm_region                := NULL;
        NEW.politician_dcm_at_tick               := NULL;
        NEW.politician_ambassador_nation_id      := NULL;
        NEW.politician_ambassador_at_tick        := NULL;
        NEW.politician_ambassador_strikes        := 0;
        NEW.politician_special_envoy_at_tick     := NULL;
    END IF;

    IF v_keep <> 'fis' THEN
        IF OLD.politician_fis_joined_at_tick IS NOT NULL THEN
            v_cleared := v_cleared || 'fis';
        END IF;
        NEW.politician_fis_joined_at_tick := NULL;
        NEW.next_fis_action_tick          := NULL;
    END IF;

    -- Nothing was actually held before — pure entry, no resignation.
    IF array_length(v_cleared, 1) IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- ── Side effects of leaving the ELECTED track ────────────────────
    IF 'elected' = ANY(v_cleared) THEN
        -- MP Seat decrement (canonical predicate covers all three tiers).
        IF public._is_mp_office(OLD.politician_office)
           AND OLD.politician_party_id IS NOT NULL THEN
            UPDATE factions
               SET seats = GREATEST(0, COALESCE(seats, 0) - 1)
             WHERE id = OLD.politician_party_id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL;
        END IF;

        -- Vacate a held City Council seat back to an NPC. Only council
        -- offices stamp a seat, so skip the cities scan otherwise.
        IF OLD.politician_office IN ('city_council_member', 'city_council_president') THEN
        SELECT c.* INTO v_city
          FROM cities c
         WHERE c.council @> jsonb_build_array(
                   jsonb_build_object('holder_faction_id', OLD.id::text))
         LIMIT 1;
        IF v_city.id IS NOT NULL THEN
            SELECT (t.idx - 1)::int, t.elem->>'seat'
              INTO v_seat_idx, v_seat_kind
              FROM jsonb_array_elements(v_city.council)
                   WITH ORDINALITY AS t(elem, idx)
             WHERE t.elem->>'holder_faction_id' = OLD.id::text
             LIMIT 1;
            IF v_seat_idx IS NOT NULL THEN
                SELECT first_name_pool, last_name_pool
                  INTO v_first_pool, v_last_pool
                  FROM nations WHERE id = v_city.nation_id;
                v_npc_first := COALESCE(pick_random_pool_name(v_first_pool), 'Council');
                v_npc_last  := COALESCE(pick_random_pool_name(v_last_pool),  'Member');
                v_new_seat := jsonb_build_object(
                    'seat',              v_seat_kind,
                    'holder_faction_id', NULL,
                    'first_name',        v_npc_first,
                    'last_name',         v_npc_last,
                    'age',               35 + floor(random() * 31)::int,
                    'party_id',          NULL,
                    'party_abbr',        NULL,
                    'party_name',        NULL,
                    'archetype',         NULL,
                    'term_end_tick',     NULL
                );
                UPDATE cities
                   SET council = jsonb_set(council, ARRAY[v_seat_idx::text], v_new_seat)
                 WHERE id = v_city.id;
            END IF;
        END IF;
        END IF;

        -- Vacate a held Mayor stamp back to an NPC (matches the
        -- resolver's mayor-loss eviction in 20270722). Gated on actually
        -- having been a mayor so a non-mayor MP whose name + party
        -- happen to match a city's mayor stamp is never wrongly evicted.
        IF OLD.politician_office IN ('mayor', 'mayor_of_capital')
           OR OLD.politician_mayor_at_tick IS NOT NULL
           OR OLD.politician_mayor_of_capital_at_tick IS NOT NULL THEN
            UPDATE cities c
               SET mayor_first_name    = COALESCE(pick_random_pool_name(n.first_name_pool), 'Mayor'),
                   mayor_last_name     = COALESCE(pick_random_pool_name(n.last_name_pool),  'Smith'),
                   mayor_age           = 35 + floor(random() * 31)::int,
                   mayor_archetype     = NULL,
                   mayor_party_id      = NULL,
                   mayor_term_end_tick = NULL
              FROM nations n
             WHERE n.id = c.nation_id
               AND c.mayor_party_id   = OLD.politician_party_id
               AND c.mayor_first_name = OLD.leader_first_name
               AND c.mayor_last_name  = OLD.leader_last_name;
        END IF;
    END IF;

    -- ── Side effects of leaving the FIS track ────────────────────────
    -- A non-agent can't carry open cases — dismiss them, mirroring
    -- politician_fis_resign (20270777). Cost-free: no reputation hit and
    -- none of that RPC's academy-grant claw-back (this is advancement
    -- into a new role, not a voluntary quit).
    IF 'fis' = ANY(v_cleared) THEN
        UPDATE fis_investigations
           SET status = 'dismissed', closed_at_tick = v_tick
         WHERE agent_faction_id = OLD.id
           AND status = 'active';
    END IF;

    -- One summary career event so the timeline records the handover.
    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (OLD.id, v_tick, 'auto_resigned_affiliation', v_keep,
            jsonb_build_object('kept_track', v_keep, 'resigned_tracks', to_jsonb(v_cleared)));

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._trg_politician_single_affiliation() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_politician_single_affiliation ON public.factions;
CREATE TRIGGER trg_politician_single_affiliation
    BEFORE UPDATE ON public.factions
    FOR EACH ROW EXECUTE FUNCTION public._trg_politician_single_affiliation();

NOTIFY pgrst, 'reload schema';

COMMIT;
