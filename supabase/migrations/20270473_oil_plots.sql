-- Oil & Gas plots — the survey mechanic for Phase 4 of the oil system.
--
-- Each nation gets N oil plots where N = its nation_industry_bases.base
-- value for industry_key='oil_gas' (Melizea: 8). The plots are shared
-- across every oil_and_gas corp in that nation — first corp to survey
-- a plot wins the discovery; the result is then visible to everyone.
--
-- Plots start unsurveyed with crude_present=0. Surveying rolls
-- 1d20 - 5 (range -4..15) plus a paid bonus. The modified roll maps to
-- a tier (dry / small / moderate / large / generational) and a 3-digit
-- barrel count that depletes when pumps draw from it. (Pump-to-plot
-- binding + per-tick depletion are a follow-up — this migration ships
-- the data model, the procgen seed, and the survey RPC.)
--
-- Tier table (raw d20 with no bonus → modified roll):
--   1-3    → modified -4..-2  → dry (15% base, 0 bbl)
--   4-7    → modified -1..+2  → small (20% base, 100-299 bbl)
--   8-13   → modified +3..+8  → moderate (30% base, 300-599 bbl)
--   14-18  → modified +9..+13 → large (25% base, 600-849 bbl)
--   19-20  → modified +14..+15 → generational (10% base, 850-999 bbl)
--
-- Cost: $5M base + $10M per +1 to the roll. The corp's treasury_cash
-- pays; corp must be oil_and_gas, must have the funds, plot must not
-- already be surveyed.
--
-- Name generator: simple Spanish-flavored combinatorics — prefix +
-- suffix from curated arrays. Per-nation localization (other
-- languages) can layer in later via a continent-dispatched picker;
-- for now every nation gets Spanish names since Melizea is the only
-- one with an active oil sector. Names are NOT guaranteed globally
-- unique across all nations, but ARE guaranteed unique per-nation
-- via a UNIQUE(nation_id, name) constraint.

BEGIN;

-- ── Schema ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nation_oil_plots (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id            uuid NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    slot_index           int  NOT NULL,
    name                 text NOT NULL,
    surveyed             boolean NOT NULL DEFAULT false,
    surveyed_at_tick     int,
    surveyed_by_faction  uuid REFERENCES factions(id) ON DELETE SET NULL,
    tier                 text CHECK (tier IS NULL OR tier IN ('dry', 'small', 'moderate', 'large', 'generational')),
    crude_present        int  NOT NULL DEFAULT 0,
    created_at           timestamptz NOT NULL DEFAULT now(),

    UNIQUE (nation_id, slot_index),
    UNIQUE (nation_id, name)
);

CREATE INDEX IF NOT EXISTS idx_nation_oil_plots_nation
    ON nation_oil_plots (nation_id);

COMMENT ON TABLE nation_oil_plots IS
    'Per-nation oil plots that oil_and_gas corps can survey. Shared across all corps in the nation (race to survey). Seeded one-shot from nation_industry_bases.base for industry_key=oil_gas; new nations are seeded by the trigger in this migration.';
COMMENT ON COLUMN nation_oil_plots.tier IS
    'Discovered quality bucket. NULL until surveyed. dry=0 bbl, small=100-299, moderate=300-599, large=600-849, generational=850-999.';
COMMENT ON COLUMN nation_oil_plots.crude_present IS
    'Barrels of crude still in the ground. Set on survey; decrements as pumps extract (Phase 4b). 0 = depleted or dry hole.';

-- ── RLS — read for any authenticated user (plots are visible to
-- every corp in the nation); writes only via SECURITY DEFINER RPC.
ALTER TABLE nation_oil_plots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Oil plots authenticated read" ON nation_oil_plots;
CREATE POLICY "Oil plots authenticated read"
    ON nation_oil_plots FOR SELECT TO authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON nation_oil_plots FROM PUBLIC, anon, authenticated;

-- ── Procgen seeder ─────────────────────────────────────────────────
-- Two arrays (prefix + suffix). 10 × 12 = 120 unique combos, so 8
-- picks per nation never collides on retry. Pure plpgsql; no extension
-- dependencies.
CREATE OR REPLACE FUNCTION public._seed_oil_plots_for_nation(p_nation_id uuid)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_count       int;
    v_existing    int;
    v_prefixes    text[] := ARRAY['Cuenca', 'Cabo', 'Cerro', 'Sierra', 'Bahía', 'Llano', 'Pozo', 'Campo', 'Costa', 'Valle'];
    v_suffixes    text[] := ARRAY['Negra', 'Verde', 'Blanca', 'Brava', 'Honda', 'del Sur', 'del Norte', 'del Diablo', 'de la Madre', 'de la Esperanza', 'del Tigre', 'del Encanto'];
    v_chosen_names text[] := ARRAY[]::text[];
    v_name        text;
    v_tries       int;
    v_i           int;
BEGIN
    -- Plot count: nation's oil_gas industry base. No row → 0 plots
    -- (nation has no oil industry; don't seed).
    SELECT base INTO v_count
      FROM nation_industry_bases
     WHERE nation_id = p_nation_id AND industry_key = 'oil_gas';
    IF v_count IS NULL OR v_count <= 0 THEN
        RETURN 0;
    END IF;

    -- Skip if already seeded — keeps the trigger + backfill idempotent
    -- (a re-run doesn't double up plots).
    SELECT COUNT(*) INTO v_existing FROM nation_oil_plots WHERE nation_id = p_nation_id;
    IF v_existing >= v_count THEN
        RETURN 0;
    END IF;

    FOR v_i IN 1 .. v_count LOOP
        -- Pick a unique combo. Up to 20 tries before giving up and
        -- appending a slot suffix to break a collision in the
        -- extreme case (120 combos × 8 plots → collisions vanishingly
        -- rare, but the guard makes the function total).
        v_tries := 0;
        LOOP
            v_name := v_prefixes[1 + floor(random() * array_length(v_prefixes, 1))::int]
                   || ' '
                   || v_suffixes[1 + floor(random() * array_length(v_suffixes, 1))::int];
            v_tries := v_tries + 1;
            EXIT WHEN NOT (v_name = ANY(v_chosen_names)) OR v_tries >= 20;
        END LOOP;
        IF v_name = ANY(v_chosen_names) THEN
            v_name := v_name || ' ' || v_i::text;
        END IF;
        v_chosen_names := array_append(v_chosen_names, v_name);

        INSERT INTO nation_oil_plots (nation_id, slot_index, name)
        VALUES (p_nation_id, v_i, v_name)
        ON CONFLICT (nation_id, slot_index) DO NOTHING;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ── Backfill all existing nations that have an oil_gas industry base.
DO $$
DECLARE
    v_nation_id uuid;
BEGIN
    FOR v_nation_id IN
        SELECT DISTINCT nation_id
          FROM nation_industry_bases
         WHERE industry_key = 'oil_gas' AND base > 0
    LOOP
        PERFORM _seed_oil_plots_for_nation(v_nation_id);
    END LOOP;
END $$;

-- ── Survey RPC ─────────────────────────────────────────────────────
-- Cost: $5_000_000 + $10_000_000 × p_extra_bonus. The bonus adds 1:1
-- to the modified roll. Negative bonus is clamped to 0.
-- Roll: 1d10 - 3 + p_extra_bonus. Tier thresholds documented in the
-- column COMMENT on tier.
CREATE OR REPLACE FUNCTION public.survey_oil_plot(
    p_plot_id     uuid,
    p_extra_bonus int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_plot      nation_oil_plots%ROWTYPE;
    v_tick      int;
    v_bonus     int;
    v_cost      bigint;
    v_d20       int;
    v_modified  int;
    v_tier      text;
    v_crude     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_bonus := GREATEST(0, COALESCE(p_extra_bonus, 0));
    v_cost  := 5000000 + (v_bonus * 10000000)::bigint;

    -- Resolve + lock the caller's oil_and_gas corp. Acceptable
    -- ambiguity if a user owns multiple oil_and_gas corps — first
    -- one found wins. Tighten with a p_corp_id arg if/when that
    -- becomes common.
    SELECT * INTO v_corp
      FROM entrepreneur_corps
     WHERE owner_faction_id IN (
            SELECT id FROM factions WHERE id = v_uid OR linked_user_id = v_uid
         )
       AND industry = 'oil_and_gas'
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_oil_corp');
    END IF;

    -- Plot exists, in the corp's nation, not already surveyed.
    SELECT * INTO v_plot
      FROM nation_oil_plots
     WHERE id = p_plot_id
     FOR UPDATE;
    IF v_plot.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_not_found');
    END IF;
    IF v_plot.nation_id <> v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_outside_nation');
    END IF;
    IF v_plot.surveyed THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_surveyed');
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0), 'need', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Roll: 1d20 - 5 + bonus → tier + crude_present. Tier brackets
    -- are documented in the header block above.
    v_d20      := 1 + floor(random() * 20)::int;
    v_modified := v_d20 - 5 + v_bonus;

    IF    v_modified <= -2 THEN v_tier := 'dry';          v_crude := 0;
    ELSIF v_modified <=  2 THEN v_tier := 'small';        v_crude := 100 + floor(random() * 200)::int;
    ELSIF v_modified <=  8 THEN v_tier := 'moderate';     v_crude := 300 + floor(random() * 300)::int;
    ELSIF v_modified <= 13 THEN v_tier := 'large';        v_crude := 600 + floor(random() * 250)::int;
    ELSE                        v_tier := 'generational'; v_crude := 850 + floor(random() * 150)::int;
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - v_cost
     WHERE id = v_corp.id;

    UPDATE nation_oil_plots
       SET surveyed            = true,
           surveyed_at_tick    = v_tick,
           surveyed_by_faction = v_corp.owner_faction_id,
           tier                = v_tier,
           crude_present       = v_crude
     WHERE id = v_plot.id;

    RETURN jsonb_build_object(
        'success',       true,
        'plot_id',       v_plot.id,
        'plot_name',     v_plot.name,
        'roll_d20',      v_d20,
        'modified_roll', v_modified,
        'bonus_paid',    v_bonus,
        'cost_paid',     v_cost,
        'tier',          v_tier,
        'crude_present', v_crude
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.survey_oil_plot(uuid, int) TO authenticated;

COMMENT ON FUNCTION public.survey_oil_plot(uuid, int) IS
    'Oil & Gas corp action: survey a plot in the corp''s home nation. Cost = $5M + $10M × p_extra_bonus. Roll = 1d20 - 5 + bonus → tier (dry/small/moderate/large/generational) + crude_present (3-digit bbl count). Gates on plot-not-yet-surveyed + plot in corp''s nation + treasury can afford. SECURITY DEFINER; FOR UPDATE on both corp and plot rows serialises a double-fire.';

NOTIFY pgrst, 'reload schema';

COMMIT;
