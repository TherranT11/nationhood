-- ════════════════════════════════════════════════════════════════════
-- 20270873 — The Tax Holiday Act ([Propose Tax Holiday])
--
-- A one-time corporate tax break as a REAL law: any MP proposes it
-- from their affiliation card (spending the MP action), choosing
-- YEARS (1-3), SECTORS (all, or targeted construction/automotive),
-- and PERCENTAGE (25/50/75/100 off the filing rate). The proposal
-- routes to the FINANCE AND BUDGET committee as an ordinary
-- committee_proposals row with a synthetic article — the whole
-- agenda → motions → floor pipeline applies unchanged.
--
-- Archetype stances bake into the proposal (design ruling):
--   SUPPORT  Libertarian · Traditional Conservative · Liberal
--            (+ Nationalist when the holiday is SECTOR-TARGETED —
--             protecting national industry is their doctrine)
--   OPPOSE   Communist / Leftist · Social Democratic · Green
--   The rest (Reform, Populist, Centrist — and Nationalist on
--   all-sector bills) stay off both lists: in committee their seats
--   roll the 1D2 the motion engine already gives neutrals, and at
--   the floor they abstain like any other law.
--
-- Enactment (_committee_resolve_floor, re-emitted from 20270795)
-- mints corporate_tax_holidays starting the year of enactment; ONE
-- active holiday per nation. file_corporate_tax (re-emitted from
-- 20270872) discounts covered filings: rate × (100 − pct)%.
-- Gates: one in-flight holiday proposal per nation, and a 3-tick
-- cooldown after a failed one (design ruling).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.corporate_tax_holidays (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id          uuid NOT NULL,
    source_proposal_id uuid,
    pct                int NOT NULL CHECK (pct IN (25, 50, 75, 100)),
    years              int NOT NULL CHECK (years BETWEEN 1 AND 3),
    sectors            text[],      -- NULL = all industries
    start_year         int NOT NULL,
    created_at_tick    int NOT NULL,
    created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS corporate_tax_holidays_nation_idx
    ON public.corporate_tax_holidays (nation_id);

ALTER TABLE public.corporate_tax_holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.corporate_tax_holidays;
CREATE POLICY "Allow select for all" ON public.corporate_tax_holidays FOR SELECT USING (true);

ALTER TABLE public.committee_proposals
    ADD COLUMN IF NOT EXISTS holiday_params jsonb;
COMMENT ON COLUMN public.committee_proposals.holiday_params IS
    'Set on Tax Holiday Act proposals (20270873): {pct, years, sectors}. NULL on ordinary statutes. Enactment mints corporate_tax_holidays.';

-- ── propose_tax_holiday — the MP files the act ────────────────────
CREATE OR REPLACE FUNCTION public.propose_tax_holiday(
    p_faction_id uuid,
    p_years      int,
    p_sectors    text[],
    p_pct        int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_comm    committees%ROWTYPE;
    v_tick    int;
    v_year    int;
    v_sectors text[];
    v_support jsonb;
    v_oppose  jsonb;
    v_title   text;
    v_desc    text;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL
       OR p_years IS NULL OR p_years < 1 OR p_years > 3
       OR p_pct IS NULL OR p_pct NOT IN (25, 50, 75, 100) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- Sectors: NULL/empty = all industries; else live corp industries.
    IF p_sectors IS NOT NULL AND cardinality(p_sectors) > 0 THEN
        v_sectors := ARRAY(SELECT DISTINCT s FROM unnest(p_sectors) s);
        IF NOT (v_sectors <@ ARRAY['construction', 'automotive']) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
        END IF;
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
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_mp_action_tick IS NOT NULL
       AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick);
    END IF;
    v_year := 2000 + v_tick / 12;

    -- One active holiday per nation (design ruling).
    IF EXISTS (SELECT 1 FROM corporate_tax_holidays
                WHERE nation_id = v_pol.nation_id
                  AND v_year < start_year + years) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'holiday_active');
    END IF;
    -- One in-flight holiday proposal per nation.
    IF EXISTS (SELECT 1 FROM committee_proposals
                WHERE nation_id = v_pol.nation_id
                  AND holiday_params IS NOT NULL
                  AND status NOT IN ('enacted', 'failed')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_pending');
    END IF;
    -- 3 ticks of quiet after the chamber kills one (design ruling).
    IF EXISTS (SELECT 1 FROM committee_proposals
                WHERE nation_id = v_pol.nation_id
                  AND holiday_params IS NOT NULL
                  AND status = 'failed'
                  AND COALESCE(floor_resolved_at_tick, 0) > v_tick - 3) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'chamber_cooldown');
    END IF;

    SELECT * INTO v_comm FROM committees
     WHERE nation_id = v_pol.nation_id AND committee_key = 'finance_budget'
     LIMIT 1;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    -- The stances (design ruling). Nationalist backs TARGETED relief.
    v_support := '["Libertarian", "Traditional Conservative", "Liberal"]'::jsonb;
    IF v_sectors IS NOT NULL THEN
        v_support := v_support || '"Nationalist"'::jsonb;
    END IF;
    v_oppose := '["Communist / Leftist", "Social Democratic", "Green"]'::jsonb;

    v_title := format('Tax Holiday Act of %s', v_year);
    v_desc  := format('A one-time corporate tax holiday: %s%% off corporate tax filings for %s, for %s filing year%s beginning on enactment. The treasury forgoes the revenue.',
        p_pct,
        CASE WHEN v_sectors IS NULL THEN 'all industries'
             ELSE array_to_string(v_sectors, ' and ') || ' corporations' END,
        p_years, CASE WHEN p_years = 1 THEN '' ELSE 's' END);

    INSERT INTO committee_proposals (
        committee_id, nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        support_archetypes, oppose_archetypes, holiday_params
    ) VALUES (
        v_comm.id, v_comm.nation_id, v_pol.id,
        'commercial', v_title,
        jsonb_build_array(jsonb_build_object('ordinal', 1, 'tag', 'operative', 'text', v_desc)),
        'queued', v_tick,
        v_support, v_oppose,
        jsonb_build_object('pct', p_pct, 'years', p_years, 'sectors', to_jsonb(v_sectors),
                           'proposer_party_id', v_pol.politician_party_id)
    ) RETURNING id INTO v_id;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol.id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'proposed_law', v_title,
            jsonb_build_object('committee', 'finance_budget', 'proposal_id', v_id));

    RETURN jsonb_build_object('success', true, 'proposal_id', v_id, 'title', v_title);
END $$;

REVOKE EXECUTE ON FUNCTION public.propose_tax_holiday(uuid, int, text[], int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.propose_tax_holiday(uuid, int, text[], int) TO authenticated;



CREATE OR REPLACE FUNCTION public._committee_resolve_floor(
    p_proposal_id uuid,
    p_tick        int
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_prop      committee_proposals%ROWTYPE;
    v_party     RECORD;
    v_yes_seats int := 0;
    v_no_seats  int := 0;
    v_outcome   text;
BEGIN
    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN NULL;
    END IF;

    FOR v_party IN
        SELECT f.id, f.archetype, COALESCE(f.seats, 0) AS seats
          FROM factions f
         WHERE f.faction_type = 'movement_party'
           AND f.nation_id    = v_prop.nation_id
           AND f.abandoned_at IS NULL
    LOOP
        IF v_party.archetype IS NULL OR v_party.seats = 0 THEN
            CONTINUE;
        END IF;
        IF v_party.archetype = ANY (SELECT jsonb_array_elements_text(COALESCE(v_prop.support_archetypes, '[]'::jsonb))) THEN
            v_yes_seats := v_yes_seats + v_party.seats;
        ELSIF v_party.archetype = ANY (SELECT jsonb_array_elements_text(COALESCE(v_prop.oppose_archetypes, '[]'::jsonb))) THEN
            v_no_seats := v_no_seats + v_party.seats;
        ELSIF v_prop.holiday_params IS NOT NULL
              AND (v_prop.holiday_params->>'proposer_party_id') IS NOT NULL
              AND v_party.id = (v_prop.holiday_params->>'proposer_party_id')::uuid THEN
            -- Tax Holiday Act (design ruling): a NEUTRAL party backs
            -- its own member's bill. An OPPOSING-archetype party does
            -- not — filing against your caucus is on you.
            v_yes_seats := v_yes_seats + v_party.seats;
        END IF;
    END LOOP;

    v_outcome := CASE WHEN v_yes_seats > v_no_seats THEN 'enacted' ELSE 'failed' END;

    UPDATE committee_proposals
       SET status                 = v_outcome,
           floor_yes_seats        = v_yes_seats,
           floor_no_seats         = v_no_seats,
           floor_resolved_at_tick = p_tick
     WHERE id = p_proposal_id;

    -- Tax Holiday Act (20270873): an enacted holiday proposal mints
    -- the holiday, starting at the year of enactment. One active
    -- holiday per nation — a collision (rare; the propose gate
    -- blocks it) simply doesn't mint a second.
    IF v_outcome = 'enacted' AND v_prop.holiday_params IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM corporate_tax_holidays h
             WHERE h.nation_id = v_prop.nation_id
               AND (2000 + p_tick / 12) < h.start_year + h.years) THEN
            INSERT INTO corporate_tax_holidays (
                nation_id, source_proposal_id, pct, years, sectors, start_year, created_at_tick
            ) VALUES (
                v_prop.nation_id, v_prop.id,
                (v_prop.holiday_params->>'pct')::int,
                (v_prop.holiday_params->>'years')::int,
                CASE WHEN v_prop.holiday_params->'sectors' = 'null'::jsonb THEN NULL
                     ELSE ARRAY(SELECT jsonb_array_elements_text(v_prop.holiday_params->'sectors')) END,
                2000 + p_tick / 12, p_tick
            );
        END IF;
    END IF;

    RETURN v_outcome;
END $$;

CREATE OR REPLACE FUNCTION public.file_corporate_tax(
    p_corp_id        uuid,
    p_disclosure_pct int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_corp        entrepreneur_corps%ROWTYPE;
    v_owner       factions%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_tick        int;
    v_year_start  int;
    v_year        int;
    v_profit_raw  numeric;
    v_profit      bigint;
    v_rate        int;
    v_holiday_pct int;
    v_tax_owed    bigint;
    v_declared    bigint;
    v_evaded      bigint;
    v_treasury    numeric;
    v_has_agent   boolean;
    v_corruption  int;
    v_roll        int;
    v_caught      boolean := false;
    v_fine        bigint := 0;
    v_clawback    bigint := 0;
    v_status      text;
    v_paid        bigint;
    v_filing_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_disclosure_pct NOT IN (100, 75, 50, 25) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_disclosure');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Owner gate: the corp's owner faction must belong to the caller.
    SELECT * INTO v_owner FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_owner.id IS NULL AND NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_corp.hq_nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick       := COALESCE(v_tick, 0);
    v_year_start := (v_tick / 12) * 12;
    v_year       := 2000 + (v_tick / 12);   -- matches utils.tickToYear

    IF EXISTS (SELECT 1 FROM corp_tax_filings WHERE corp_id = p_corp_id AND year = v_year) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_filed_this_year', 'year', v_year);
    END IF;

    -- Net profit YTD: SUM(corp_cash_events.delta) over [year_start,
    -- current_tick] — the same figure corp_revenue_by_year (20270645)
    -- feeds the page's Revenue cards. Negative net → 0 owed.
    SELECT COALESCE(SUM(delta), 0) INTO v_profit_raw
      FROM corp_cash_events
     WHERE corp_id = p_corp_id
       AND tick >= v_year_start
       AND tick <= v_tick;
    v_profit := GREATEST(0, FLOOR(v_profit_raw))::bigint;

    -- nations.corporate_tax rides the 0-10 policy scale (the Active
    -- Laws Corporate Taxation options pin it via the target drift:
    -- Tax Haven 1 / Pro-Business 3 / Standard 5 / Progressive 7 /
    -- Heavy 9). Corps pay ×5 of that as a real percent of net profit
    -- (design ruling 20270872): 5% / 15% / 25% / 35% / 45%.
    v_rate     := GREATEST(0, LEAST(100, COALESCE(v_nation.corporate_tax, 0) * 5));
    -- An active Tax Holiday Act (20270873) discounts the filing rate
    -- for covered years and sectors — sectors NULL means all.
    SELECT pct INTO v_holiday_pct FROM corporate_tax_holidays
     WHERE nation_id = v_corp.hq_nation_id
       AND v_year >= start_year AND v_year < start_year + years
       AND (sectors IS NULL OR v_corp.industry = ANY (sectors))
     ORDER BY created_at DESC LIMIT 1;
    IF v_holiday_pct IS NOT NULL THEN
        v_rate := FLOOR(v_rate * (100 - v_holiday_pct) / 100.0)::int;
    END IF;
    v_tax_owed := FLOOR(v_profit * v_rate / 100.0)::bigint;
    v_declared := FLOOR(v_tax_owed * p_disclosure_pct / 100.0)::bigint;
    v_evaded   := v_tax_owed - v_declared;
    v_treasury := COALESCE(v_corp.treasury_cash, 0);

    -- Must be able to cover the declared portion. A short corp can pick
    -- a lower disclosure tier to owe less.
    IF v_declared > v_treasury THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'declared', v_declared, 'treasury', FLOOR(v_treasury)::bigint);
    END IF;

    -- Resolve outcome.
    IF p_disclosure_pct = 100 OR v_tax_owed = 0 THEN
        v_status := 'compliant';
        v_evaded := 0;
    ELSE
        v_has_agent := EXISTS (
            SELECT 1 FROM factions
             WHERE faction_type = 'politician'
               AND nation_id = v_corp.hq_nation_id
               AND politician_fis_joined_at_tick IS NOT NULL
               AND abandoned_at IS NULL
        );
        IF v_has_agent THEN
            -- Deferred: an FIS agent exists, so no auto-catch. The
            -- hidden income is logged for a later audit to uncover.
            v_status := 'evaded';
        ELSE
            -- No auditor → the game adjudicates with a Balanced roll.
            v_corruption := GREATEST(0, LEAST(100, COALESCE(v_nation.corruption, 0)::int));
            v_roll       := 1 + FLOOR(random() * 100)::int;
            v_caught     := (v_roll + v_corruption) <= (100 - p_disclosure_pct);
            v_status     := CASE WHEN v_caught THEN 'caught' ELSE 'evaded' END;
        END IF;
    END IF;

    -- Pay the declared portion now.
    v_paid     := v_declared;
    v_treasury := v_treasury - v_declared;

    -- If caught, claw back the evaded amount + 10% fine (clamped to
    -- whatever treasury is left). Nothing is "successfully evaded".
    IF v_status = 'caught' THEN
        v_fine     := FLOOR(v_evaded * 0.10)::bigint;
        v_clawback := LEAST(FLOOR(v_treasury)::bigint, v_evaded + v_fine);
        v_paid     := v_paid + v_clawback;
        v_treasury := v_treasury - v_clawback;
        v_evaded   := 0;
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = v_treasury, updated_at = now()
     WHERE id = p_corp_id;

    -- Credit the nation's budget for everything actually collected
    -- (/1e9 RAW_PER_ABSTRACT convention).
    IF v_paid > 0 THEN
        UPDATE nations
           SET budget = COALESCE(budget, 0) + (v_paid::numeric / 1000000000)
         WHERE id = v_corp.hq_nation_id;
    END IF;

    INSERT INTO corp_tax_filings (
        corp_id, nation_id, year, taxable_profit, rate_pct, tax_owed,
        disclosure_pct, amount_paid, amount_evaded, status,
        has_fis_agent, filed_by_faction_id, filed_at_tick
    ) VALUES (
        p_corp_id, v_corp.hq_nation_id, v_year, v_profit, v_rate, v_tax_owed,
        p_disclosure_pct, v_paid, v_evaded, v_status,
        COALESCE(v_has_agent, false), v_owner.id, v_tick
    ) RETURNING id INTO v_filing_id;

    RETURN jsonb_build_object(
        'success',         true,
        'filing_id',       v_filing_id,
        'year',            v_year,
        'taxable_profit',  v_profit,
        'rate_pct',        v_rate,
        'tax_owed',        v_tax_owed,
        'disclosure_pct',  p_disclosure_pct,
        'amount_paid',     v_paid,
        'amount_evaded',   v_evaded,
        'status',          v_status,
        'has_fis_agent',   COALESCE(v_has_agent, false),
        'caught',          v_caught
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.file_corporate_tax(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.file_corporate_tax(uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
