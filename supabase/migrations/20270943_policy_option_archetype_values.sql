-- ════════════════════════════════════════════════════════════════════
-- 20270943 — Policy-option Party Reception: 1–6 valuation, not Support/Oppose
--
-- Replaces the binary Support / Oppose lists (20270899) with a per-archetype
-- VALUATION of each option on a 1–6 scale. A seated party votes for whichever
-- option — the current law or the proposed one — it values higher:
--
--   • value(proposed) > value(current)  → the party votes YES
--   • value(proposed) < value(current)  → the party votes NO
--
-- There are no ties: within one policy each archetype assigns DISTINCT values
-- across that policy's options (a ranking), so the current and proposed
-- options never carry the same value for the same archetype. Distinctness is
-- authored + validated in policyadmin.html (a single-row CHECK can't span the
-- sibling options); the vote logic below still resolves an exact tie
-- defensively to NO (status quo) so a hand-edited collision can't wedge a vote.
--
-- No current law for the policy (current_option_id NULL), or an archetype the
-- author left unset, is treated as the neutral midpoint 3.5 — a non-integer the
-- 1–6 values can never equal, so adopting from scratch splits cleanly: an
-- archetype valuing the new option in the top half (4–6) votes YES, the bottom
-- half (1–3) votes NO.
--
-- Drops policy_options.support_archetypes / oppose_archetypes and the
-- 20270899 validators (used by nothing else). derive_bill_stance loses its
-- policy-option branch and reverts to the stat_effects inference (20270423) —
-- the older "bills" path that shares it is unaffected in shape.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tear down the Support / Oppose model on policy_options ─────
ALTER TABLE public.policy_options
    DROP CONSTRAINT IF EXISTS policy_options_archetype_positions_valid;
ALTER TABLE public.policy_options
    DROP COLUMN IF EXISTS support_archetypes,
    DROP COLUMN IF EXISTS oppose_archetypes;

-- 20270899 created these two validators solely for that CHECK.
DROP FUNCTION IF EXISTS public._validate_policy_archetype_pair(jsonb, jsonb);
DROP FUNCTION IF EXISTS public._validate_policy_archetype_array(jsonb);

-- ── 2. The 1–6 valuation map ─────────────────────────────────────
ALTER TABLE public.policy_options
    ADD COLUMN IF NOT EXISTS archetype_values jsonb;

COMMENT ON COLUMN public.policy_options.archetype_values IS
    'Per-archetype valuation of this option on a 1..6 scale: a jsonb object {archetype_name: int 1..6}, keys drawn from _archetype_catalog_names(). NULL or absent keys mean "unset" → neutral 3.5 in the vote. Across one policy''s options each archetype''s values are distinct (a ranking) so policy votes never tie. Drives _open_policy_floor_vote. 20270943.';

-- Validator: NULL ok; else an object whose keys are catalog archetypes
-- and whose values are integers in [1,6]. Distinctness across sibling
-- options is a cross-row rule enforced in the authoring UI, not here.
CREATE OR REPLACE FUNCTION public._validate_policy_archetype_values(p_obj jsonb)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_key text;
    v_val jsonb;
    v_num numeric;
BEGIN
    IF p_obj IS NULL THEN RETURN true; END IF;
    IF jsonb_typeof(p_obj) <> 'object' THEN RETURN false; END IF;

    FOR v_key, v_val IN SELECT key, value FROM jsonb_each(p_obj) LOOP
        IF NOT (ARRAY[v_key] <@ _archetype_catalog_names()) THEN RETURN false; END IF;
        IF jsonb_typeof(v_val) <> 'number' THEN RETURN false; END IF;
        v_num := (v_val #>> '{}')::numeric;                   -- scalar jsonb → text → numeric
        IF v_num <> floor(v_num) THEN RETURN false; END IF;   -- integers only
        IF v_num < 1 OR v_num > 6 THEN RETURN false; END IF;
    END LOOP;

    RETURN true;
END $$;

ALTER TABLE public.policy_options
    ADD CONSTRAINT policy_options_archetype_values_valid
    CHECK (_validate_policy_archetype_values(archetype_values));

-- ── 3. derive_bill_stance reverts to stat_effects-only ───────────
-- The policy-option Support/Oppose branch (20270899) is gone with the
-- columns. The shared "bills" callers (20270423/20270424/20270668) keep
-- the stat_effects → archetype inference they originally had.
CREATE OR REPLACE FUNCTION public.derive_bill_stance(p_option_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_effects jsonb;
    v_acc     jsonb;
BEGIN
    SELECT stat_effects INTO v_effects
      FROM policy_options WHERE id = p_option_id;

    IF v_effects IS NULL OR jsonb_typeof(v_effects) <> 'array' THEN
        RETURN '{}'::jsonb;
    END IF;

    WITH effects AS (
        SELECT e->>'stat_key' AS stat_key,
               CASE e->>'direction' WHEN 'up' THEN 1 WHEN 'down' THEN -1 ELSE 0 END AS sign
          FROM jsonb_array_elements(v_effects) e
    ),
    mapping(stat_key, archetype, multiplier) AS (VALUES
        ('income_tax',     'Social Democratic',           1),
        ('income_tax',     'Libertarian',                -1),
        ('welfare',        'Social Democratic',           1),
        ('welfare',        'Communist / Leftist',         1),
        ('welfare',        'Libertarian',                -1),
        ('health',         'Social Democratic',           1),
        ('health',         'Communist / Leftist',         1),
        ('health',         'Libertarian',                -1),
        ('education',      'Social Democratic',           1),
        ('education',      'Communist / Leftist',         1),
        ('education',      'Libertarian',                -1),
        -- inequality going DOWN is good for the left
        ('inequality',     'Communist / Leftist',        -1),
        ('inequality',     'Social Democratic',          -1),
        ('inequality',     'Libertarian',                 1),
        ('civil_freedoms', 'Liberal',                     1),
        ('civil_freedoms', 'Traditional Conservative',   -1),
        ('civil_freedoms', 'Green',                       1),
        ('immigration',    'Liberal',                     1),
        ('immigration',    'Nationalist',                -1),
        ('immigration',    'Populist',                   -1)
    ),
    contributions AS (
        SELECT m.archetype, SUM(e.sign * m.multiplier) AS raw
          FROM effects e
          JOIN mapping m USING (stat_key)
         WHERE e.sign <> 0
         GROUP BY m.archetype
    )
    SELECT COALESCE(jsonb_object_agg(archetype,
                CASE WHEN raw > 0 THEN 1 WHEN raw < 0 THEN -1 ELSE 0 END),
             '{}'::jsonb)
      INTO v_acc
      FROM contributions
     WHERE raw <> 0;

    RETURN COALESCE(v_acc, '{}'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.derive_bill_stance(uuid) TO authenticated;

-- ── 4. The policy floor vote opener — value comparison ───────────
-- Division: sponsor's party banks YES; every other seated party compares
-- its valuation of the proposed option against the current law and votes
-- for the higher. Neutral 3.5 stands in for an unset archetype or the
-- absence of a current law (see header). 20270943 replaces the
-- derive_bill_stance(proposed) lean that 20270892 used.
CREATE OR REPLACE FUNCTION public._open_policy_floor_vote(
    p_policy_proposal_id uuid,
    p_tick               int
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_prop          committee_policy_proposals%ROWTYPE;
    v_party         RECORD;
    v_sponsor_party uuid;
    v_sponsor_name  text;
    v_policy_name   text;
    v_option_name   text;
    v_prop_vals     jsonb;
    v_cur_vals      jsonb;
    v_prop_v        numeric;
    v_cur_v         numeric;
    v_stance        text;
    v_votes         jsonb := '[]'::jsonb;
    v_yes           int := 0;
    v_no            int := 0;
    v_chamber       int := 0;
BEGIN
    SELECT * INTO v_prop FROM committee_policy_proposals WHERE id = p_policy_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM committee_floor_votes
                WHERE policy_proposal_id = p_policy_proposal_id AND status = 'active') THEN
        RETURN 'on_floor';
    END IF;

    SELECT policy_name INTO v_policy_name FROM policies WHERE id = v_prop.policy_id;
    SELECT option_name, archetype_values INTO v_option_name, v_prop_vals
      FROM policy_options WHERE id = v_prop.proposed_option_id;

    -- Snapshot of the law being replaced; NULL when the policy had none.
    IF v_prop.current_option_id IS NOT NULL THEN
        SELECT archetype_values INTO v_cur_vals
          FROM policy_options WHERE id = v_prop.current_option_id;
    END IF;

    SELECT NULLIF(btrim(COALESCE(f.leader_first_name, '') || ' ' ||
                        COALESCE(f.leader_last_name, '')), ''),
           f.politician_party_id
      INTO v_sponsor_name, v_sponsor_party
      FROM factions f WHERE f.id = v_prop.author_faction_id;

    FOR v_party IN
        SELECT f.id, f.archetype, COALESCE(f.seats, 0) AS seats
          FROM factions f
         WHERE f.faction_type = 'movement_party'
           AND f.nation_id    = v_prop.nation_id
           AND f.abandoned_at IS NULL
           AND COALESCE(f.seats, 0) > 0
    LOOP
        v_prop_v := COALESCE((v_prop_vals->>v_party.archetype)::numeric, 3.5);
        IF v_prop.current_option_id IS NULL THEN
            v_cur_v := 3.5;
        ELSE
            v_cur_v := COALESCE((v_cur_vals->>v_party.archetype)::numeric, 3.5);
        END IF;

        IF v_party.id = v_sponsor_party THEN
            v_stance := 'yes';
        ELSIF v_prop_v > v_cur_v THEN
            v_stance := 'yes';
        ELSIF v_prop_v < v_cur_v THEN
            v_stance := 'no';
        ELSE
            -- Unreachable with distinct authored values; a defensive
            -- status-quo NO keeps a hand-edited collision from wedging.
            v_stance := 'no';
        END IF;

        v_votes   := v_votes || jsonb_build_object(
            'party_id', v_party.id, 'stance', v_stance, 'seats', v_party.seats);
        v_chamber := v_chamber + v_party.seats;
        IF v_stance = 'yes' THEN
            v_yes := v_yes + v_party.seats;
        ELSE
            v_no := v_no + v_party.seats;
        END IF;
    END LOOP;

    INSERT INTO committee_floor_votes (
        nation_id, policy_proposal_id, bill_name, category, sponsor_name,
        party_votes, yes_seats, no_seats, chamber_size,
        started_at_tick, resolve_at_tick
    ) VALUES (
        v_prop.nation_id, v_prop.id,
        COALESCE(v_policy_name, 'Policy Change') || ' — ' || COALESCE(v_option_name, 'new direction'),
        'policy',
        COALESCE(v_sponsor_name, 'a member of the chamber'),
        v_votes, v_yes, v_no, v_chamber,
        p_tick, p_tick + 3
    );

    UPDATE committee_policy_proposals
       SET status = 'on_floor'
     WHERE id = p_policy_proposal_id;

    RETURN 'on_floor';
END $$;

REVOKE EXECUTE ON FUNCTION public._open_policy_floor_vote(uuid, int) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
